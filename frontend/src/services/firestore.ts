import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, startAfter, Timestamp, updateDoc, doc, increment, where } from 'firebase/firestore';
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
  likes?: number; // Number of likes
  dislikes?: number; // Number of dislikes
}

// User preference interface
export interface UserPreference {
  id: string;
  modelId: string;
  userId: string; // Could be session ID or user ID
  preference: 'like' | 'dislike';
  timestamp: Timestamp;
}

// Comment interface
export interface Comment {
  id: string;
  modelId: string;
  text: string;
  userId: string;
  timestamp: Timestamp;
}

// Model service
export class ModelService {
  private static collection = collection(db, 'models');
  private static preferencesCollection = collection(db, 'preferences');
  private static commentsCollection = collection(db, 'comments');

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
  static async getModelsPaginated(
    lastDoc?: any,
    limitCount: number = 20,
    minCreatedAt?: Timestamp,
  ): Promise<{models: ModelDocument[], lastDoc: any}> {
    try {
      const parts: any[] = [orderBy('createdAt', 'desc')];
      if (minCreatedAt) {
        parts.unshift(where('createdAt', '>=', minCreatedAt));
      }
      if (lastDoc) {
        parts.push(startAfter(lastDoc));
      }
      parts.push(limit(limitCount));

      const q = query(this.collection, ...parts);

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

  // Search models by prompt text (server-side)
  // Note: Firestore doesn't support full-text search natively, so we fetch all and filter
  // For production with large datasets, consider using Algolia or similar
  static async searchModels(searchQuery: string, limitCount: number = 50, minCreatedAt?: Timestamp): Promise<ModelDocument[]> {
    try {
      if (!searchQuery || searchQuery.trim() === '') {
        return [];
      }

      const searchLower = searchQuery.toLowerCase().trim();

      // Fetch a large batch of recent models
      const parts: any[] = [orderBy('createdAt', 'desc')];
      if (minCreatedAt) {
        parts.unshift(where('createdAt', '>=', minCreatedAt));
      }
      parts.push(limit(limitCount));
      const q = query(this.collection, ...parts);

      const querySnapshot = await getDocs(q);
      const allModels = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ModelDocument[];

      // Filter models that contain the search term in their prompt
      const filteredModels = allModels.filter(model =>
        model.prompt &&
        model.prompt.toLowerCase().includes(searchLower)
      );

      console.log(`🔍 [SEARCH] Found ${filteredModels.length} models matching "${searchQuery}"`);
      return filteredModels;
    } catch (error) {
      console.error('Error searching models:', error);
      throw error;
    }
  }

  // Record user preference (like/dislike)
  static async recordPreference(modelId: string, preference: 'like' | 'dislike', userId?: string): Promise<void> {
    try {
      const sessionId = userId || this.getSessionId();
      
      // Record the preference
      await addDoc(this.preferencesCollection, {
        modelId,
        userId: sessionId,
        preference,
        timestamp: Timestamp.now()
      });

      // Update model counters
      const modelRef = doc(db, 'models', modelId);
      const fieldToUpdate = preference === 'like' ? 'likes' : 'dislikes';
      
      await updateDoc(modelRef, {
        [fieldToUpdate]: increment(1)
      });

      console.log(`✅ [PREFERENCE] Recorded ${preference} for model ${modelId}`);
    } catch (error) {
      console.error('Error recording preference:', error);
      throw error;
    }
  }

  // Get user preferences for analytics
  static async getUserPreferences(userId?: string): Promise<UserPreference[]> {
    try {
      const sessionId = userId || this.getSessionId();
      const q = query(
        this.preferencesCollection,
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserPreference[];
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  }

  // Generate or get session ID for anonymous users
  private static getSessionId(): string {
    let sessionId = localStorage.getItem('cadmonkey_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('cadmonkey_session_id', sessionId);
    }
    return sessionId;
  }

  // Add a comment to a model
  static async addComment(modelId: string, text: string, userId?: string): Promise<string> {
    try {
      const sessionId = userId || this.getSessionId();
      const docRef = await addDoc(this.commentsCollection, {
        modelId,
        text: text.trim(),
        userId: sessionId,
        timestamp: Timestamp.now()
      });
      console.log(`✅ [COMMENT] Added comment to model ${modelId}`);
      return docRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Get comments for a model
  static async getComments(modelId: string): Promise<Comment[]> {
    try {
      const q = query(
        this.commentsCollection,
        where('modelId', '==', modelId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  // Get total count of renderable models (models with valid scadCode)
  static async getTotalRenderableCount(): Promise<number> {
    try {
      const q = query(this.collection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const models = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ModelDocument[];
      
      // Filter to only count renderable models
      const renderableModels = models.filter(model => 
        model.scadCode && 
        model.scadCode.trim().length > 0 &&
        model.scadCode.trim() !== '' &&
        model.scadCode !== 'undefined'
      );
      
      return renderableModels.length;
    } catch (error) {
      console.error('Error getting total count:', error);
      throw error;
    }
  }
}
