import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface RecordingData {
  id: string;
  events: any[];
  responseDataMap: any
}

export interface RecordingListItem {
  id: string;
  timestamp: number;
  url?: string;
  title?: string;
  domain?: string;
  eventCount?: number;
}

interface BlackboxDB extends DBSchema {
  recordings: {
    key: string;
    value: RecordingData;
  };
  recordingsList: {
    key: string;
    value: RecordingListItem;
  };
}

let dbInstance: IDBPDatabase<BlackboxDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<BlackboxDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<BlackboxDB>('blackbox-recordings', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('recordings')) {
        db.createObjectStore('recordings', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('recordingsList')) {
        db.createObjectStore('recordingsList', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

export async function saveRecording(recordingData: RecordingData): Promise<void> {
  const db = await getDB();
  await db.put('recordings', recordingData);
}

export async function getRecording(id: string): Promise<RecordingData | undefined> {
  const db = await getDB();
  return await db.get('recordings', id);
}

export async function deleteRecording(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('recordings', id);
  await db.delete('recordingsList', id);
}

export async function saveRecordingListItem(item: RecordingListItem): Promise<void> {
  const db = await getDB();
  await db.put('recordingsList', item);
}

export async function getRecordingsList(): Promise<RecordingListItem[]> {
  const db = await getDB();
  const items = await db.getAll('recordingsList');
  return items.sort((a, b) => b.timestamp - a.timestamp);
}

export async function getRecordingsListEntry(id: string): Promise<RecordingListItem | undefined> {
  const db = await getDB();
  const item = await db.get('recordingsList', id);
  return item;
}

export async function cleanupOldRecordings(): Promise<void> {
  const db = await getDB();
  const items = await getRecordingsList();
  
  if (items.length > 50) {
    const itemsToDelete = items.slice(50);
    for (const item of itemsToDelete) {
      await deleteRecording(item.id);
    }
  }
}
