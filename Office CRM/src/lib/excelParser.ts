import * as XLSX from 'xlsx';
import type { Customer, Product, PurchaseHistory, Interaction, SalesOrder } from '../types';
import type { FollowUpRecord, NarrationRecord, SheetType } from './db';


// ─── Column Mapping Definitions ─────────────────────────────────────────────
const COLUMN_MAPS: Record<SheetType, Record<string, string[]>> = {
  customerMaster: {
    name:         ['party name', 'name', 'customer name', 'party', 'ledger name', 'account name'],
    mobileNumber: ['mobile', 'mobile no', 'phone', 'contact', 'mobile number', 'phone no'],
    address:      ['address', 'addr', 'billing address', 'full address'],
    state:        ['state', 'st', 'province'],
    city:         ['city', 'town', 'location'],
    businessType: ['business type', 'type', 'category', 'party type'],
    gstNumber:    ['gst', 'gstin', 'gst number', 'gst no', 'gst_no'],
    email:        ['email', 'email id', 'e-mail'],
  },
  salesHistory: {
    customerId:   ['party id', 'customer id', 'ledger id'],
    customerName: ['party name', 'customer name', 'party', 'ledger'],
    date:         ['date', 'invoice date', 'bill date', 'order date'],
    productName:  ['product', 'item name', 'item', 'product name', 'description'],
    category:     ['category', 'series', 'type', 'product category'],
    quantity:     ['qty', 'quantity', 'pcs', 'pieces'],
    amount:       ['amount', 'total', 'value', 'net amount', 'bill amount'],
    invoiceNo:    ['invoice no', 'bill no', 'voucher no'],
  },
  productMaster: {
    id:           ['item code', 'code', 'sku', 'product id', 'item id'],
    name:         ['product name', 'name', 'item name', 'description'],
    series:       ['series', 'category', 'product type', 'line'],
    color:        ['color', 'colour', 'shade'],
    rate:         ['rate', 'price', 'mrp', 'cost'],
    stockQuantity:['stock', 'qty', 'quantity', 'stock qty', 'pieces', 'balance'],
    designCode:   ['design code', 'design', 'style code'],
  },
  inventorySheet: {
    itemCode:     ['item code', 'code', 'sku', 'item id'],
    series:       ['series', 'category', 'product type'],
    rate:         ['rate', 'price', 'mrp'],
    totalPcs:     ['total pcs', 'total pieces', 'opening stock', 'total qty'],
    totalAmount:  ['total amount', 'total value', 'stock value'],
    balancePcs:   ['balance pcs', 'balance', 'closing stock', 'balance qty'],
  },
  followUpSheet: {
    customerName: ['party name', 'customer name', 'name', 'party'],
    dueDate:      ['follow up date', 'due date', 'follow-up date', 'next contact'],
    notes:        ['notes', 'remarks', 'comment', 'narration'],
    status:       ['status', 'done', 'completed'],
    priority:     ['priority', 'urgency', 'importance'],
    type:         ['type', 'contact type', 'follow up type'],
  },
  narrationSheet: {
    date:         ['date', 'voucher date', 'entry date'],
    customerName: ['party name', 'ledger', 'customer'],
    narration:    ['narration', 'description', 'remarks', 'note'],
    amount:       ['amount', 'debit', 'credit', 'value'],
    voucherType:  ['voucher type', 'type', 'transaction type'],
    voucherNo:    ['voucher no', 'bill no', 'invoice no'],
  },
  salesOrders: {
    date:         ['date', 'order date'],
    customerName: ['customer', 'party name', 'customer name'],
    gstNumber:    ['gst no', 'gstin', 'gst number'],
    broker:       ['broker'],
    orderNo:      ['order no', 'order number'],
    cityName:     ['city name', 'city'],
    catalog:      ['catalog'],
    vol:          ['vol'],
    productCode:  ['product', 'item code', 'sku'],
    packing:      ['packing'],
    color:        ['color', 'colour'],
    orderPcs:     ['order pcs', 'pcs', 'quantity'],
    dispPcs:      ['disp pcs', 'dispatched pcs'],
    balPcs:       ['bal pcs', 'balance pcs'],
    rate:         ['rate', 'price'],
    amount:       ['amount', 'value'],
    overDueDays:  ['over due days', 'overdue days'],
    dueDays:      ['due days'],
    salesMan:     ['sale man', 'salesman'],
  },
};


// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalizeHeader(h: string): string {
  return String(h).toLowerCase().trim().replace(/\s+/g, ' ');
}

function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx !== -1) return idx;
  }
  // Partial match fallback
  for (const candidate of candidates) {
    const idx = normalized.findIndex((h) => h.includes(candidate));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseDate(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    return new Date(d.y, d.m - 1, d.d).toISOString();
  }
  try {
    const d = new Date(String(val));
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return new Date().toISOString();
}

function safeNum(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function safeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function generateId(prefix: string, idx: number): string {
  return `${prefix}_${Date.now()}_${idx}`;
}

// ─── Validation ──────────────────────────────────────────────────────────────
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  mappedColumns: Record<string, string>; // fieldName -> actual header
  duplicateCount: number;
}

export function validateColumns(
  headers: string[],
  sheetType: SheetType
): ValidationResult {
  const map = COLUMN_MAPS[sheetType];
  const errors: string[] = [];
  const warnings: string[] = [];
  const mappedColumns: Record<string, string> = {};

  const requiredFields: Record<SheetType, string[]> = {
    customerMaster:  ['name'],
    salesHistory:    ['customerName', 'date', 'amount'],
    productMaster:   ['name', 'rate'],
    inventorySheet:  ['itemCode', 'totalPcs'],
    followUpSheet:   ['customerName', 'dueDate'],
    narrationSheet:  ['date', 'narration'],
    salesOrders:     ['customerName', 'productCode', 'amount'],
  };

  for (const [field, candidates] of Object.entries(map)) {
    const idx = findColumn(headers, candidates);
    if (idx !== -1) {
      mappedColumns[field] = headers[idx];
    } else {
      const required = requiredFields[sheetType] || [];
      if (required.includes(field)) {
        errors.push(`Required column not found: "${field}" (tried: ${candidates.slice(0,3).join(', ')})`);
      } else {
        warnings.push(`Optional column not found: "${field}"`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    mappedColumns,
    duplicateCount: 0,
  };
}

// ─── Parse Excel File ────────────────────────────────────────────────────────
export interface ParsedSheet {
  rows: Record<string, unknown>[];
  headers: string[];
  sheetName: string;
}

export async function parseExcelFile(file: File): Promise<ParsedSheet> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          raw: false,
          defval: '',
        });
        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        resolve({ rows, headers, sheetName });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Detect Duplicates ───────────────────────────────────────────────────────
export function detectDuplicates(
  rows: Record<string, unknown>[],
  keyField: string
): { uniqueRows: Record<string, unknown>[]; duplicateCount: number } {
  const seen = new Set<string>();
  const uniqueRows: Record<string, unknown>[] = [];
  let duplicateCount = 0;

  for (const row of rows) {
    const key = safeStr(row[keyField]).toLowerCase();
    if (!key) {
      uniqueRows.push(row);
      continue;
    }
    if (seen.has(key)) {
      duplicateCount++;
    } else {
      seen.add(key);
      uniqueRows.push(row);
    }
  }
  return { uniqueRows, duplicateCount };
}

// ─── Sheet-specific parsers ──────────────────────────────────────────────────
const indianStates = [
  'Maharashtra', 'Gujarat', 'Delhi', 'Uttar Pradesh', 'Karnataka',
  'Tamil Nadu', 'Rajasthan', 'Madhya Pradesh', 'Punjab', 'Haryana',
  'West Bengal', 'Bihar', 'Andhra Pradesh', 'Telangana', 'Odisha',
];

function inferState(address: string): string {
  if (!address) return 'Unknown';
  const upper = address.toUpperCase();
  for (const state of indianStates) {
    if (upper.includes(state.toUpperCase())) return state;
  }
  return 'Unknown';
}

export function parseCustomerMasterSheet(
  rows: Record<string, unknown>[],
  headers: string[]
): Omit<Customer, 'partyScore' | 'segment' | 'tags'>[] {
  const map = COLUMN_MAPS.customerMaster;
  const colIdx = Object.fromEntries(
    Object.entries(map).map(([field, candidates]) => [
      field,
      findColumn(headers, candidates),
    ])
  );

  return rows
    .map((row, i) => {
      const rowVals = Object.values(row);
      const get = (field: string) =>
        colIdx[field] !== -1 ? safeStr(rowVals[colIdx[field]]) : '';

      const name = get('name');
      if (!name) return null;

      const address = get('address');
      const state = get('state') || inferState(address);

      return {
        id: generateId('CUS', i),
        name,
        mobileNumber: get('mobileNumber') || 'Not Available',
        address: address || 'Not Available',
        state,
        businessType: get('businessType') || 'Retailer',
        gstNumber: get('gstNumber') || 'Not Registered',
        lastContactedDate: new Date().toISOString(),
        purchaseFrequency: 0,
        revenueGenerated: 0,
        averageOrderValue: 0,
      };
    })
    .filter(Boolean) as Omit<Customer, 'partyScore' | 'segment' | 'tags'>[];
}

export function parseSalesHistorySheet(
  rows: Record<string, unknown>[],
  headers: string[]
): Omit<PurchaseHistory, 'id'>[] {
  const map = COLUMN_MAPS.salesHistory;
  const colIdx = Object.fromEntries(
    Object.entries(map).map(([field, candidates]) => [
      field,
      findColumn(headers, candidates),
    ])
  );

  return rows
    .map((row) => {
      const rowVals = Object.values(row);
      const get = (field: string) =>
        colIdx[field] !== -1 ? rowVals[colIdx[field]] : '';

      const customerName = safeStr(get('customerName'));
      if (!customerName) return null;

      return {
        customerId: safeStr(get('customerId')) || `cust_${customerName.toLowerCase().replace(/\s+/g, '_')}`,
        date: parseDate(get('date')),
        productName: safeStr(get('productName')) || 'Unknown Product',
        category: safeStr(get('category')) || 'General',
        quantity: safeNum(get('quantity')) || 1,
        amount: safeNum(get('amount')),
      };
    })
    .filter(Boolean) as Omit<PurchaseHistory, 'id'>[];
}

export function parseFollowUpSheet(
  rows: Record<string, unknown>[],
  headers: string[]
): Omit<FollowUpRecord, 'id' | 'customerId' | 'createdAt'>[] {
  const map = COLUMN_MAPS.followUpSheet;
  const colIdx = Object.fromEntries(
    Object.entries(map).map(([field, candidates]) => [
      field,
      findColumn(headers, candidates),
    ])
  );

  return rows
    .map((row) => {
      const rowVals = Object.values(row);
      const get = (field: string) =>
        colIdx[field] !== -1 ? rowVals[colIdx[field]] : '';

      const customerName = safeStr(get('customerName'));
      if (!customerName) return null;

      const statusRaw = safeStr(get('status')).toLowerCase();
      let status: FollowUpRecord['status'] = 'Pending';
      if (statusRaw.includes('complet') || statusRaw === 'done' || statusRaw === 'yes') status = 'Completed';
      else if (statusRaw.includes('miss') || statusRaw === 'no') status = 'Missed';

      const priorityRaw = safeStr(get('priority')).toLowerCase();
      let priority: FollowUpRecord['priority'] = 'Medium';
      if (priorityRaw.includes('high') || priorityRaw === 'urgent') priority = 'High';
      else if (priorityRaw.includes('low')) priority = 'Low';

      return {
        customerName,
        dueDate: parseDate(get('dueDate')),
        notes: safeStr(get('notes')) || 'Follow-up required',
        status,
        priority,
        type: safeStr(get('type')) || 'Call',
      };
    })
    .filter(Boolean) as Omit<FollowUpRecord, 'id' | 'customerId' | 'createdAt'>[];
}

export function parseNarrationSheet(
  rows: Record<string, unknown>[],
  headers: string[]
): Omit<NarrationRecord, 'id' | 'customerId'>[] {
  const map = COLUMN_MAPS.narrationSheet;
  const colIdx = Object.fromEntries(
    Object.entries(map).map(([field, candidates]) => [
      field,
      findColumn(headers, candidates),
    ])
  );

  return rows
    .map((row) => {
      const rowVals = Object.values(row);
      const get = (field: string) =>
        colIdx[field] !== -1 ? rowVals[colIdx[field]] : '';

      const narration = safeStr(get('narration'));
      if (!narration) return null;

      return {
        date: parseDate(get('date')),
        narration,
        amount: safeNum(get('amount')),
        voucherType: safeStr(get('voucherType')) || 'Journal',
        voucherNo: safeStr(get('voucherNo')) || '',
      };
    })
    .filter(Boolean) as Omit<NarrationRecord, 'id' | 'customerId'>[];
}

export function parseSalesOrdersSheet(
  rows: Record<string, unknown>[],
  headers: string[]
): Omit<SalesOrder, 'createdAt'>[] {
  const map = COLUMN_MAPS.salesOrders;
  const colIdx = Object.fromEntries(
    Object.entries(map).map(([field, candidates]) => [
      field,
      findColumn(headers, candidates),
    ])
  );

  return rows
    .map((row, i) => {
      const rowVals = Object.values(row);
      const get = (field: string) =>
        colIdx[field] !== -1 ? rowVals[colIdx[field]] : '';

      const customerName = safeStr(get('customerName'));
      if (!customerName) return null;

      return {
        id: generateId('SO', i),
        date: parseDate(get('date')),
        customerName,
        gstNumber: safeStr(get('gstNumber')),
        broker: safeStr(get('broker')) || 'DIRECT',
        orderNo: safeNum(get('orderNo')),
        cityName: safeStr(get('cityName')),
        catalog: safeStr(get('catalog')),
        vol: safeStr(get('vol')),
        productCode: safeStr(get('productCode')),
        packing: safeStr(get('packing')),
        color: safeStr(get('color')),
        orderPcs: safeNum(get('orderPcs')),
        dispPcs: safeNum(get('dispPcs')),
        balPcs: safeNum(get('balPcs')),
        rate: safeNum(get('rate')),
        amount: safeNum(get('amount')),
        overDueDays: safeNum(get('overDueDays')),
        dueDays: safeNum(get('dueDays')),
        salesMan: safeStr(get('salesMan')),
      };
    })
    .filter(Boolean) as Omit<SalesOrder, 'createdAt'>[];
}

