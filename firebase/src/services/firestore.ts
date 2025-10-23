import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, startAfter, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQ",
  authDomain: "starmind-72daa.firebaseapp.com",
  projectId: "starmind-72daa",
  storageBucket: "starmind-72daa.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Model interface
export interface ModelDocument {
  id: string;
  createdAt: Timestamp;
  prompt: string;
  scadCode: string;
  thumbnailUrl?: string; // Firebase Storage URL for thumbnail image
}

// Model service
export class ModelService {
  private static collection = collection(db, 'models');

  // Upload thumbnail to Firebase Storage and return the download URL
  static async uploadThumbnail(thumbnailDataUrl: string, modelId: string): Promise<string> {
    try {
      console.log('☁️ [STORAGE] Creating storage reference for:', `thumbnails/${modelId}.png`);
      // Create a reference to the storage location
      const storageRef = ref(storage, `thumbnails/${modelId}.png`);

      console.log('⬆️ [STORAGE] Uploading data URL to Firebase Storage...');
      console.log('📊 [STORAGE] Data URL length:', thumbnailDataUrl.length);
      // Upload the data URL (base64 image)
      await uploadString(storageRef, thumbnailDataUrl, 'data_url');

      console.log('🔗 [STORAGE] Getting download URL...');
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      console.log('✅ [STORAGE] Thumbnail uploaded successfully!');
      console.log('🔗 [STORAGE] Download URL:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('❌ [STORAGE] Error uploading thumbnail to Storage:', error);
      throw error;
    }
  }

  // Save a new model with thumbnail
  static async saveModel(prompt: string, scadCode: string, thumbnailDataUrl?: string): Promise<string> {
    try {
      // First create the document to get an ID
      const docRef = await addDoc(this.collection, {
        createdAt: Timestamp.now(),
        prompt: prompt.trim(),
        scadCode: scadCode.trim(),
        thumbnailUrl: null // Will be updated after upload
      });

      // If we have a thumbnail, upload it to Storage and update the document
      if (thumbnailDataUrl) {
        try {
          console.log('💾 [FIRESTORE] Document created with ID:', docRef.id);
          console.log('☁️ [STORAGE] Starting thumbnail upload process...');
          const thumbnailUrl = await this.uploadThumbnail(thumbnailDataUrl, docRef.id);

          console.log('📝 [FIRESTORE] Updating document with thumbnail URL...');
          // Update the document with the storage URL
          const docToUpdate = doc(db, 'models', docRef.id);
          await updateDoc(docToUpdate, {
            thumbnailUrl: thumbnailUrl
          });

          console.log('✅ [FIRESTORE] Model saved with thumbnail URL:', thumbnailUrl);
        } catch (uploadError) {
          console.error('❌ [STORAGE/FIRESTORE] Failed to upload thumbnail, model saved without it:', uploadError);
        }
      } else {
        console.warn('⚠️ [FIRESTORE] No thumbnail data URL provided - saving model without thumbnail');
      }

      return docRef.id;
    } catch (error) {
      console.error('Error saving model:', error);
      throw error;
    }
  }

  // Get all models (paginated)
  static async getModels(limitCount: number = 20): Promise<ModelDocument[]> {
    try {
      const q = query(
        this.collection,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ModelDocument[];
    } catch (error) {
      console.error('Error getting models:', error);
      throw error;
    }
  }

  // Get models with pagination
  static async getModelsPaginated(lastDoc?: any, limitCount: number = 20): Promise<{models: ModelDocument[], lastDoc: any}> {
    try {
      let q = query(
        this.collection,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(
          this.collection,
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      const models = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ModelDocument[];

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      return {
        models,
        lastDoc: lastVisible
      };
    } catch (error) {
      console.error('Error getting paginated models:', error);
      throw error;
    }
  }
}
