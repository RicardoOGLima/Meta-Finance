import { Transaction, Asset, Dividend } from '../types';

/**
 * Converte uma lista de objetos em uma string CSV.
 * Otimizado para leitura por modelos de IA como o NotebookLM.
 */
function convertToCSV(data: any[], headers: string[]): string {
    if (data.length === 0) return headers.join(',');

    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map(header => {
            const val = (row as any)[header];
            // Escapar vírgulas e aspas para manter o CSV íntegro
            const stringVal = val !== undefined && val !== null ? String(val) : '';
            if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                return `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

export function exportTransactionsToCSV(transactions: Transaction[]): string {
    const headers = [
        'date',
        'type',
        'category',
        'subcategory',
        'description',
        'value',
        'paymentMethod',
        'installments'
    ];
    return convertToCSV(transactions, headers);
}

export function exportAssetsToCSV(assets: Asset[]): string {
    const headers = [
        'ticker',
        'class',
        'quantity',
        'averagePrice',
        'currentPrice',
        'score',
        'note'
    ];
    return convertToCSV(assets, headers);
}

export function exportDividendsToCSV(dividends: Dividend[]): string {
    const headers = [
        'date',
        'ticker',
        'class',
        'type',
        'valuePerShare',
        'totalValue'
    ];
    return convertToCSV(dividends, headers);
}
