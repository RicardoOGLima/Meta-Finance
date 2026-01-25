import { writeTextFile, readTextFile, exists, mkdir, rename, remove, readDir, stat, copyFile } from '@tauri-apps/plugin-fs';
import { documentDir, join, dirname } from '@tauri-apps/api/path';

// Check if we are running in a Tauri (Desktop) environment
export const isDesktop = () => !!(window as any).__TAURI_INTERNALS__;

const STORAGE_KEY = 'meta_finance_data';
const CONFIG_PATH_KEY = 'meta_finance_desktop_path';

// Helper to parse date from backup filename: data_YYYY-MM-DDTHH-mm-ss.json
const parseBackupDate = (filename: string): Date | null => {
    try {
        const match = filename.match(/data_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.json/);
        if (!match) return null;
        const [datePart, timePart] = match[1].split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, min, sec] = timePart.split('-').map(Number);
        return new Date(year, month - 1, day, hour, min, sec);
    } catch (e) {
        return null;
    }
};

/**
 * Gets the target file path for desktop storage.
 * If the user hasn't configured a path, it defaults to Documents/MetaFinance/data.json
 */
async function getDesktopFilePath(): Promise<string> {
    try {
        let configuredPath = localStorage.getItem(CONFIG_PATH_KEY);

        if (!configuredPath) {
            const docDir = await documentDir();
            const defaultFolder = await join(docDir, 'MetaFinance');

            // Create folder if it doesn't exist
            if (!(await exists(defaultFolder))) {
                await mkdir(defaultFolder, { recursive: true });
            }

            configuredPath = await join(defaultFolder, 'data.json');
        }

        // Normalize path for Windows (remove potential quotes and fix slashes)
        return configuredPath.replace(/^"|"$/g, '').trim();
    } catch (error) {
        console.error('[Storage] Error resolving desktop path:', error);
        throw error;
    }
}

export const storage = {
    /**
     * Saves data to the appropriate storage (localStorage or File System)
     */
    async save(data: any): Promise<void> {
        const jsonString = JSON.stringify(data, null, 2);

        if (isDesktop()) {
            try {
                const path = await getDesktopFilePath();
                const tempPath = `${path}.tmp`;
                const backupPath = `${path}.bak`;

                // 1. Write to temporary file
                await writeTextFile(tempPath, jsonString);

                // 2. If main file exists, rotate it to backup
                if (await exists(path)) {
                    // Remove old backup if exists to allow rename
                    if (await exists(backupPath)) {
                        await remove(backupPath);
                    }
                    await rename(path, backupPath);
                    console.log(`[Storage] Old data moved to backup: ${backupPath}`);
                }

                // 3. Rename temporary file to main path
                await rename(tempPath, path);
                console.log(`[Storage] Atomic save complete: ${path}`);
            } catch (error) {
                console.error('[Storage] Desktop save error:', error);
                // Fallback to localStorage on error
                localStorage.setItem(STORAGE_KEY, jsonString);
            }
        } else {
            localStorage.setItem(STORAGE_KEY, jsonString);
            console.log('[Storage] Saved to localStorage');
        }

        // Trigger Async Backup Management (Fire and forget to not block UI)
        if (isDesktop()) {
            this.manageBackups(data).catch(err => console.error('[Storage] Backup error:', err));
        }
    },

    /**
     * Manages versioned backups with "Smart Minimal" retention:
     * - Latest
     * - Yesterday (~24h)
     * - Last Week (~7d)
     * Throttled to 1h to avoid spam.
     */
    async manageBackups(data: any): Promise<void> {
        try {
            const path = await getDesktopFilePath();
            // Safer parent dir extraction using dirname
            const parentDir = await dirname(path);
            const backupsDir = await join(parentDir, 'backups');
            console.log(`[Storage] manageBackups started. Path: ${path}, BackupsDir: ${backupsDir}`);

            if (!(await exists(backupsDir))) {
                console.log(`[Storage] Creating backups directory at: ${backupsDir}`);
                await mkdir(backupsDir, { recursive: true });
            } else {
                console.log(`[Storage] Backups directory exists at: ${backupsDir}`);
            }

            // 0. Check existing backups to throttle
            const entries = await readDir(backupsDir);
            const backupFiles = entries
                .filter(e => e.isFile && e.name.startsWith('data_') && e.name.endsWith('.json'))
                .map(e => ({
                    name: e.name,
                    date: parseBackupDate(e.name)
                }))
                .filter(f => f.date !== null)
                .sort((a, b) => b.date!.getTime() - a.date!.getTime()); // Newest first

            const now = new Date();

            // THROTTLE: If we have a backup from less than 1 hour ago, skip
            // THROTTLE: If we have a backup from less than 1 hour ago, skip
            if (backupFiles.length > 0) {
                const latest = backupFiles[0];
                const diffMs = now.getTime() - latest.date!.getTime();
                console.log(`[Storage] Latest backup: ${latest.name} (${diffMs}ms ago)`);
                if (diffMs < 60 * 60 * 1000) { // 1 hour
                    console.log('[Storage] Backup skipped (throttle < 1h)');
                    return; // Skip backup to save IO/Avoid spam
                }
            } else {
                console.log('[Storage] No previous backups found.');
            }

            // 1. Create new backup
            const timestamp = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0') + 'T' +
                String(now.getHours()).padStart(2, '0') + '-' +
                String(now.getMinutes()).padStart(2, '0') + '-' +
                String(now.getSeconds()).padStart(2, '0');

            const newBackupName = `data_${timestamp}.json`;
            const newBackupPath = await join(backupsDir, newBackupName);

            await writeTextFile(newBackupPath, JSON.stringify(data, null, 2));
            console.log(`[Storage] Created backup: ${newBackupName}`);

            // 2. Prune old backups
            // Add new file to our list (conceptually)
            const newFileObj = { name: newBackupName, date: now };
            const allBackups = [newFileObj, ...backupFiles];

            if (allBackups.length <= 3) return;

            const keepers = new Set<string>();
            const nowTime = now.getTime();

            // Always keep the very latest
            keepers.add(allBackups[0].name);

            // Find closest to Yesterday (~24h ago)
            const yesterdayBackup = allBackups.find(f => (nowTime - f.date!.getTime()) > (20 * 60 * 60 * 1000));
            if (yesterdayBackup) keepers.add(yesterdayBackup.name);

            // Find closest to Last Week (~7 days ago)
            const lastWeekBackup = allBackups.find(f => (nowTime - f.date!.getTime()) > (6.5 * 24 * 60 * 60 * 1000));
            if (lastWeekBackup) keepers.add(lastWeekBackup.name);

            // Delete others
            for (const file of allBackups) {
                if (!keepers.has(file.name)) {
                    await remove(await join(backupsDir, file.name));
                    console.log(`[Storage] Pruned old backup: ${file.name}`);
                }
            }
        } catch (error) {
            console.error('[Storage] implementation error in manageBackups:', error);
        }
    },

    /**
     * Lists available backups
     */
    async listBackups(): Promise<{ name: string, date: Date, size: number }[]> {
        if (!isDesktop()) return [];
        try {
            const path = await getDesktopFilePath();
            const parentDir = await dirname(path);
            const backupsDir = await join(parentDir, 'backups');

            if (!(await exists(backupsDir))) return [];

            const entries = await readDir(backupsDir);
            const backups = [];

            for (const entry of entries) {
                if (entry.isFile && entry.name.startsWith('data_') && entry.name.endsWith('.json')) {
                    const date = parseBackupDate(entry.name);
                    if (date) {
                        try {
                            const fullPath = await join(backupsDir, entry.name);
                            const metadata = await stat(fullPath);
                            backups.push({
                                name: entry.name,
                                date: date,
                                size: metadata.size
                            });
                        } catch (e) {
                            console.warn('Failed to stat file', entry.name);
                        }
                    }
                }
            }

            return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
        } catch (error) {
            console.error('[Storage] Error listing backups:', error);
            return [];
        }
    },

    /**
     * Restores a backup.
     * Returns true if successful.
     */
    async restoreBackup(filename: string): Promise<boolean> {
        if (!isDesktop()) return false;
        try {
            const path = await getDesktopFilePath();
            const parentDir = await dirname(path);
            const backupsDir = await join(parentDir, 'backups');
            const targetPath = await join(backupsDir, filename);

            if (!(await exists(targetPath))) {
                throw new Error('Backup file not found');
            }

            // 1. Integrity Check
            const content = await readTextFile(targetPath);
            try {
                const parsed = JSON.parse(content);
                if (!parsed.transactions && !parsed.assets) {
                    throw new Error('Invalid backup structure');
                }
            } catch (e) {
                console.error('[Storage] Integrity check failed:', e);
                throw new Error('Backup file is corrupted (invalid JSON)');
            }

            // 2. Safety Backup of current state
            if (await exists(path)) {
                const safetyName = `safety_restore_${Date.now()}.json`;
                const safetyPath = await join(backupsDir, safetyName);
                await copyFile(path, safetyPath);
                console.log(`[Storage] Created safety backup before restore: ${safetyName}`);
            }

            // 3. Restore
            await writeTextFile(path, content);
            console.log(`[Storage] Restored backup: ${filename}`);

            return true;
        } catch (error) {
            console.error('[Storage] Error restoring backup:', error);
            throw error;
        }
    },

    /**
     * Loads data from the appropriate storage
     */
    async load(): Promise<any | null> {
        if (isDesktop()) {
            try {
                const path = await getDesktopFilePath();
                console.log(`[Storage] Checking desktop file at: "${path}"`);

                if (await exists(path)) {
                    const content = await readTextFile(path);
                    console.log(`[Storage] Loaded from desktop path: ${path} (${content.length} chars)`);
                    return JSON.parse(content);
                } else {
                    console.log(`[Storage] Desktop file not found at: ${path}. Checking localStorage fallback...`);
                }
            } catch (error) {
                console.error('[Storage] Desktop load error:', error);
            }
        }

        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
            try {
                console.log('[Storage] Loaded from localStorage fallback');
                return JSON.parse(localData);
            } catch (error) {
                console.error('[Storage] Error parsing localData:', error);
            }
        }

        return null;
    },

    /**
     * Returns true if running in desktop mode
     */
    isDesktop(): boolean {
        return isDesktop();
    },

    /**
     * Gets the currently configured desktop path
     */
    async getConfiguredPath(): Promise<string> {
        return await getDesktopFilePath();
    },

    /**
     * Sets a new desktop path
     */
    setConfiguredPath(path: string): void {
        localStorage.setItem(CONFIG_PATH_KEY, path);
        console.log(`[Storage] New desktop path set: ${path}`);
    }
};
