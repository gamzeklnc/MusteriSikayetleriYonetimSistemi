/**
 * Barcode Parsing Utility
 * Type 1: e.g. 2490108MC2023041
 * Type 2: e.g. 2490108BW0023041
 * Type 3: e.g. E4FXT325H129990048205538
 */

export interface ParsedBarcode {
    barcode: string;
    year: number | null;
    month: number | null;
    day: number | null;
    factory: 'HSA1' | 'HSA2' | 'UNKNOWN';
    productionDate: Date | null;
    isValid: boolean;
}

export interface BarcodeAggregationResult {
    barcodes: string[];
    hsa1Count: number;
    hsa2Count: number;
    oldestProductionDate: string | null; // ISO Date String
}

export function parseSingleBarcode(barcode: string): ParsedBarcode {
    const result: ParsedBarcode = {
        barcode: barcode.trim(),
        year: null,
        month: null,
        day: null,
        factory: 'UNKNOWN',
        productionDate: null,
        isValid: false,
    };

    if (!result.barcode) return result;

    const b = result.barcode.toUpperCase();

    // Type 3: Length 24, e.g. "E4FXT325H129990048205538"
    if (b.length === 24) {
        // 6th index (1-based "Altıncı"): index 5 in 0-based
        const fChar = b[5];
        if (fChar === '3') result.factory = 'HSA1';
        else if (fChar === '4') result.factory = 'HSA2';

        // 7-8th "basamak": index 6-7
        const yy = parseInt(b.substring(6, 8), 10);
        // 9th "basamak" (A=1, B=2...): index 8
        const mChar = b[8];
        const m = mChar.charCodeAt(0) - 64; // A=65 -> 1
        // 10-11th "basamak": index 9-10
        const dd = parseInt(b.substring(9, 11), 10);

        result.year = 2000 + yy;
        result.month = m >= 1 && m <= 12 ? m : null;
        result.day = dd >= 1 && dd <= 31 ? dd : null;
        result.isValid = result.year !== null && result.month !== null && result.day !== null;
    }
    // Type 1 & 2: Assuming length 16 e.g. 2490108MC2023041 or 2490108BW0023041
    else if (b.length >= 16) {
        const yyStr = b.substring(0, 2);
        const mChar = b[2];
        const ddStr = b.substring(3, 5);

        result.year = 2000 + parseInt(yyStr, 10);
        result.day = parseInt(ddStr, 10);

        // Month
        if (mChar === 'A') result.month = 10;
        else if (mChar === 'B') result.month = 11;
        else if (mChar === 'C') result.month = 12;
        else result.month = parseInt(mChar, 10);

        // Logic to differentiate between Type 1 and Type 2
        // Both are length 16. Type 1 has MC / HSA logic at 10th pos (index 9)
        // Type 2 has BW / HSA logic at 9th pos (index 8)

        // Check index 9 for type 1
        const t1Char = b[9];
        if (t1Char === '1') result.factory = 'HSA1';
        else if (t1Char === '2') result.factory = 'HSA2';

        // Check index 8 for type 2 if factory still undetermined
        if (result.factory === 'UNKNOWN') {
            const t2Char = b[8];
            if (t2Char === 'W') result.factory = 'HSA1';
            else if (t2Char === 'X') result.factory = 'HSA2';
        }

        result.isValid = !isNaN(result.year) && !isNaN(result.month) && !isNaN(result.day) &&
            result.day >= 1 && result.day <= 31 && result.month >= 1 && result.month <= 12;
    }

    if (result.isValid) {
        // Note: Month is 0-indexed in JS Date
        result.productionDate = new Date(Date.UTC(result.year!, result.month! - 1, result.day!));
    }

    return result;
}

export function aggregateBarcodes(barcodesInput: string | string[]): BarcodeAggregationResult {
    const result: BarcodeAggregationResult = {
        barcodes: [],
        hsa1Count: 0,
        hsa2Count: 0,
        oldestProductionDate: null,
    };

    let list: string[] = [];
    if (typeof barcodesInput === 'string') {
        // split by comma, newline, or space
        list = barcodesInput.split(/[, \n\r\t]+/).map((s) => s.trim()).filter(Boolean);
    } else {
        list = barcodesInput.map((s) => s.trim()).filter(Boolean);
    }

    // Deduplicate if needed - optional, but usually a complaint has distinct barcodes
    list = Array.from(new Set(list));
    result.barcodes = list;

    let minDateMs: number | null = null;

    for (const b of list) {
        const p = parseSingleBarcode(b);
        if (p.factory === 'HSA1') result.hsa1Count++;
        if (p.factory === 'HSA2') result.hsa2Count++;

        if (p.productionDate) {
            const ms = p.productionDate.getTime();
            if (minDateMs === null || ms < minDateMs) {
                minDateMs = ms;
            }
        }
    }

    if (minDateMs !== null) {
        result.oldestProductionDate = new Date(minDateMs).toISOString().split('T')[0];
    }

    return result;
}
