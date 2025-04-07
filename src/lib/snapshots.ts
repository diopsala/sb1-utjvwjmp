import { collection, addDoc, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface Snapshot {
  id: string;
  version: string;
  description: string;
  created_at: string;
  created_by: string;
  metadata: Record<string, any>;
}

export async function createSnapshot(
  version: string,
  description: string,
  metadata: Record<string, any> = {}
): Promise<Snapshot> {
  try {
    const docRef = await addDoc(collection(db, 'snapshots'), {
      version,
      description,
      created_at: new Date().toISOString(),
      created_by: auth.currentUser?.uid,
      metadata
    });

    return {
      id: docRef.id,
      version,
      description,
      created_at: new Date().toISOString(),
      created_by: auth.currentUser?.uid || '',
      metadata
    };
  } catch (error) {
    throw new Error(`Failed to create snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getSnapshots(): Promise<Snapshot[]> {
  try {
    const q = query(collection(db, 'snapshots'), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Snapshot[];
  } catch (error) {
    throw new Error(`Failed to fetch snapshots: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getSnapshot(id: string): Promise<Snapshot> {
  try {
    const docRef = doc(db, 'snapshots', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Snapshot not found');
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Snapshot;
  } catch (error) {
    throw new Error(`Failed to fetch snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}