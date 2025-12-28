import { writeTextFile, readTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { documentDir, join } from '@tauri-apps/api/path';

// Check if we are running in a Tauri (Desktop) environment
const isDesktop = () => !!(window as any).__TAURI_INTERNALS__;

const STORAGE_KEY = 'meta_finance_data';
const CONFIG_PATH_KEY = 'meta_finance_desktop_path';

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

        return configuredPath;
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
                await writeTextFile(path, jsonString);
                console.log(`[Storage] Saved to desktop path: ${path}`);
            } catch (error) {
                console.error('[Storage] Desktop save error:', error);
                // Fallback to localStorage on error
                localStorage.setItem(STORAGE_KEY, jsonString);
            }
        } else {
            localStorage.setItem(STORAGE_KEY, jsonString);
            console.log('[Storage] Saved to localStorage');
        }
    },

    /**
     * Loads data from the appropriate storage
     */
    async load(): Promise<any | null> {
        if (isDesktop()) {
            try {
                const path = await getDesktopFilePath();
                if (await exists(path)) {
                    const content = await readTextFile(path);
                    console.log(`[Storage] Loaded from desktop path: ${path}`);
                    return JSON.parse(content);
                } else {
                    console.warn(`[Storage] Desktop file not found at: ${path}. Checking localStorage fallback...`);
                }
            } catch (error) {
                console.error('[Storage] Desktop load error:', error);
            }
        }

        // Fallback to localStorage (used for web or if desktop file is missing/error)
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
            console.log('[Storage] Loaded from localStorage fallback');
            try {
                return JSON.parse(localData);
            } catch (e) {
                console.error('[Storage] Error parsing localData:', e);
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

export { isDesktop };
