import React, { useState, useEffect } from 'react';
import { ModelService, ModelDocument } from '../services/firestore';
import Mini3DViewer from './Mini3DViewer';
import { Timestamp } from 'firebase/firestore';

interface GalleryProps {
  onModelSelect?: (scadCode: string, prompt: string) => void;
}

type TabType = 'discover' | 'following' | 'latest';

export default function Gallery({ onModelSelect }: GalleryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [models, setModels] = useState<ModelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const MIN_CREATED_AT = Timestamp.fromDate(new Date(Date.UTC(2025, 11, 13, 0, 0, 0)));

  // Load initial models
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await ModelService.getModelsPaginated(lastDoc, 12, MIN_CREATED_AT);

      console.log('📊 [GALLERY] Loaded', result.models.length, 'models');

      setModels(prev => lastDoc ? [...prev, ...result.models] : result.models);
      setLastDoc(result.lastDoc);
      setHasMore(result.models.length === 12);
    } catch (err) {
      setError('Failed to load models');
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    loadModels();
  };

  const handleModelClick = (modelDoc: ModelDocument) => {
    if (onModelSelect) {
      onModelSelect(modelDoc.scadCode, modelDoc.prompt);
    }
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && models.length === 0) {
    return (
      <div className="flex justify-center items-center h-full bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black overflow-y-auto">
      {/* Navigation Tabs - Cara Style */}
      <div className="sticky top-0 z-10 bg-black border-b border-gray-800">
        <div className="flex items-center justify-center gap-8 py-4">
          <button
            onClick={() => setActiveTab('discover')}
            className={`text-sm font-medium transition-colors ${
              activeTab === 'discover'
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`text-sm font-medium transition-colors ${
              activeTab === 'following'
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Following
          </button>
          <button
            onClick={() => setActiveTab('latest')}
            className={`text-sm font-medium transition-colors ${
              activeTab === 'latest'
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Latest
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 m-4">
          {error}
        </div>
      )}

      {/* Masonry Grid Layout - Cara Style */}
      <div className="p-2">
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2">
          {models.map((modelDoc, index) => {
            // Vary heights for masonry effect
            const heights = ['200px', '250px', '300px', '350px', '280px', '320px'];
            const height = heights[index % heights.length];

            return (
              <div
                key={modelDoc.id}
                className="break-inside-avoid mb-2 group cursor-pointer relative"
                onClick={() => handleModelClick(modelDoc)}
              >
                {/* Image Container */}
                <div
                  className="relative overflow-hidden bg-gray-900 rounded-sm"
                  style={{ height }}
                >
                  <Mini3DViewer
                    scadCode={modelDoc.scadCode}
                    thumbnail={modelDoc.thumbnailUrl}
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-end p-3 opacity-0 group-hover:opacity-100">
                    <div className="w-full">
                      <p className="text-white text-xs leading-relaxed line-clamp-3 mb-1">
                        "{modelDoc.prompt}"
                      </p>
                      <p className="text-gray-400 text-[10px]">
                        {formatDate(modelDoc.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Load More Button - Cara Style */}
      {hasMore && (
        <div className="text-center py-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="bg-white text-black px-8 py-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium text-sm"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {!hasMore && models.length > 0 && (
        <div className="text-center text-gray-500 text-sm py-8">
          No more models to load
        </div>
      )}
    </div>
  );
}
