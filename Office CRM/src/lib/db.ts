import { openDB, type IDBPDatabase } from 'idb';
import type { Customer, Product, PurchaseHistory, Interaction, CustomerTag } from '../types';

// ─── Extended types for uploaded data ──────────────────────────────────────
export interface FollowUpRecord {
  id: string;
  customerId: string;
  customerName: string;
  dueDate: string;
  type: string;
  notes: string;
  status: 'Pending' | 'Completed' | 'Missed';
  priority: 'High' | 'Medium' | 'Low';
  createdAt: string;
}

export interface NarrationRecord {
  id: string;
  customerId: string;
  date: string;
  narration: string;
  amount: number;
  voucherType: string;
  voucherNo: string;
}

export interface VoiceNoteRecord {
  id: string;
  customerId: string;
  createdAt: string;
  duration: number; // seconds
  blob?: Blob;
  transcription?: string;
  aiSummary?: string;
  actionItems?: string[];
  followUpSuggestions?: string[];
  fileName?: string;
}

export interface UploadStatus {
  sheetType: SheetType;
  uploadedAt: string;
  rowCount: number;
  fileName: string;
  status: 'success' | 'error' | 'processing';
  errors?: string[];
}

export type SheetType =
  | 'customerMaster'
  | 'salesHistory'
  | 'productMaster'
  | 'inventorySheet'
  | 'followUpSheet'
  | 'narrationSheet'
  | 'salesOrders';


// ─── DB Schema ──────────────────────────────────────────────────────────────
const DB_NAME = 'shree-radha-crm';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Customers (from Customer Master Sheet)
        if (!db.objectStoreNames.contains('customers')) {
          const cs = db.createObjectStore('customers', { keyPath: 'id' });
          cs.createIndex('by-name', 'name');
          cs.createIndex('by-state', 'state');
          cs.createIndex('by-segment', 'segment');
        }

        // Products (from Product Master Sheet)
        if (!db.objectStoreNames.contains('products')) {
          const ps = db.createObjectStore('products', { keyPath: 'id' });
          ps.createIndex('by-category', 'category');
          ps.createIndex('by-series', 'series');
        }

        // Purchases / Sales History
        if (!db.objectStoreNames.contains('purchases')) {
          const pur = db.createObjectStore('purchases', { keyPath: 'id' });
          pur.createIndex('by-customer', 'customerId');
          pur.createIndex('by-date', 'date');
        }

        // Interactions
        if (!db.objectStoreNames.contains('interactions')) {
          const ia = db.createObjectStore('interactions', { keyPath: 'id' });
          ia.createIndex('by-customer', 'customerId');
          ia.createIndex('by-date', 'contactDate');
        }

        // Follow-Ups
        if (!db.objectStoreNames.contains('followUps')) {
          const fu = db.createObjectStore('followUps', { keyPath: 'id' });
          fu.createIndex('by-customer', 'customerId');
          fu.createIndex('by-due-date', 'dueDate');
          fu.createIndex('by-status', 'status');
        }

        // Narrations (ledger notes)
        if (!db.objectStoreNames.contains('narrations')) {
          const na = db.createObjectStore('narrations', { keyPath: 'id' });
          na.createIndex('by-customer', 'customerId');
          na.createIndex('by-date', 'date');
        }

        // Voice Notes
        if (!db.objectStoreNames.contains('voiceNotes')) {
          const vn = db.createObjectStore('voiceNotes', { keyPath: 'id' });
          vn.createIndex('by-customer', 'customerId');
        }

        // Upload status log
        if (!db.objectStoreNames.contains('uploadStatus')) {
          db.createObjectStore('uploadStatus', { keyPath: 'sheetType' });
        }

        // Segment settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Tags
        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id' });
        }

        // Recommendations
        if (!db.objectStoreNames.contains('recommendations')) {
          const rec = db.createObjectStore('recommendations', { keyPath: 'id' });
          rec.createIndex('by-customer', 'customerId');
          rec.createIndex('by-product', 'productId');
          rec.createIndex('by-score', 'score');
        }
      },
    });
  }
  return dbPromise;
}

// ─── Generic helpers ────────────────────────────────────────────────────────
export async function dbGetAll<T>(store: string): Promise<T[]> {
  const db = await getDB();
  return db.getAll(store);
}

export async function dbGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get(store, key);
}

export async function dbPut<T>(store: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put(store, value);
}

export async function dbPutMany<T>(store: string, values: T[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(store, 'readwrite');
  await Promise.all([...values.map((v) => tx.store.put(v)), tx.done]);
}

export async function dbClear(store: string): Promise<void> {
  const db = await getDB();
  await db.clear(store);
}

export async function dbDelete(store: string, key: string): Promise<void> {
  const db = await getDB();
  await db.delete(store, key);
}

export async function dbGetByIndex<T>(store: string, index: string, value: string): Promise<T[]> {
  const db = await getDB();
  return db.getAllFromIndex(store, index, value);
}

export async function dbCount(store: string): Promise<number> {
  const db = await getDB();
  return db.count(store);
}

// ─── Upload status helpers ───────────────────────────────────────────────────
export async function saveUploadStatus(status: UploadStatus): Promise<void> {
  await dbPut('uploadStatus', status);
}

export async function getUploadStatus(): Promise<UploadStatus[]> {
  return dbGetAll<UploadStatus>('uploadStatus');
}

export async function getUploadStatusByType(sheetType: SheetType): Promise<UploadStatus | undefined> {
  return dbGet<UploadStatus>('uploadStatus', sheetType);
}

// ─── Settings helpers ────────────────────────────────────────────────────────
export async function saveSetting(key: string, value: unknown): Promise<void> {
  await dbPut('settings', { key, value });
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const row = await dbGet<{ key: string; value: T }>('settings', key);
  return row?.value;
}
