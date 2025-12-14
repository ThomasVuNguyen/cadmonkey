import React, { useState, useEffect } from 'react';
import { ModelService, ModelDocument } from '../services/firestore';
import Mini3DViewer from './Mini3DViewer';
import { Timestamp } from 'firebase/firestore';
import { spawnOpenSCAD } from '../lib/runner/openscad-runner';

interface GalleryProps {
  onModelSelect?: (scadCode: string, prompt: string) => void;
}

type TabType = 'discover' | 'following' | 'latest';

interface ValidatedModel extends ModelDocument {
  isValid?: boolean;
  validating?: boolean;
}

export default function Gallery({ onModelSelect }: GalleryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [models, setModels] = useState<ValidatedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const MIN_CREATED_AT = Timestamp.fromDate(new Date(Date.UTC(2025, 11, 13, 0, 0, 0)));

  // Validate if a model's code renders without errors
  const validateModel = async (scadCode: string): Promise<boolean> => {
    try {
      const job = spawnOpenSCAD(
        {
          mountArchives: true,
          inputs: [{
            path: '/validate.scad',
            content: scadCode,
          }],
          args: [
            '/validate.scad',
            '-o', 'validate.off',
            '--backend=manifold',
            '--export-format=off',
            '--enable=lazy-union',
          ],
          outputPaths: ['validate.off'],
        },
        () => {} // Stream callback
      );

      const result = await job;

      // Check if render succeeded and produced output
      if (result.error) {
        console.log('❌ Validation failed:', result.error);
        return false;
      }

      const hasOutput = result.outputs && result.outputs.length > 0 && result.outputs[0][1];
      if (!hasOutput) {
        console.log('❌ No output generated');
        return false;
      }

      console.log('✅ Validation passed');
      return true;
    } catch (err) {
      console.log('❌ Validation error:', err);
      return false;
    }
  };

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

      // Mark all as validating initially
      const modelsWithValidation: ValidatedModel[] = result.models.map(m => ({
        ...m,
        validating: true,
        isValid: undefined,
      }));

      setModels(prev => lastDoc ? [...prev, ...modelsWithValidation] : modelsWithValidation);
      setLastDoc(result.lastDoc);
      setHasMore(result.models.length === 12);

      // Validate models in background
      validateModelsInBackground(modelsWithValidation);
    } catch (err) {
      setError('Failed to load models');
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateModelsInBackground = async (modelsToValidate: ValidatedModel[]) => {
    // Validate each model one by one to avoid overwhelming the system
    for (const model of modelsToValidate) {
      try {
        const isValid = await validateModel(model.scadCode);

        // Update the specific model's validation status
        setModels(prev => prev.map(m =>
          m.id === model.id
            ? { ...m, isValid, validating: false }
            : m
        ));
      } catch (err) {
        console.error('Validation failed for model:', model.id, err);
        setModels(prev => prev.map(m =>
          m.id === model.id
            ? { ...m, isValid: false, validating: false }
            : m
        ));
      }
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

  // Calculate valid model count
  const validModelCount = models.filter(m => m.isValid === true).length;
  const totalLoadedCount = models.length;

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
        {/* Valid model count */}
        {validModelCount > 0 && (
          <div className="text-center pb-2 text-gray-500 text-xs">
            {validModelCount} valid {validModelCount === 1 ? 'model' : 'models'}
            {totalLoadedCount > validModelCount && (
              <span className="ml-1">
                ({totalLoadedCount - validModelCount} hidden with errors)
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 m-4">
          {error}
        </div>
      )}

      {/* Masonry Grid Layout - Cara Style */}
      <div className="p-2">
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2">
          {models
            .filter(modelDoc => {
              // Only show models that have been validated and are valid
              // Hide models that are still validating or failed validation
              if (modelDoc.validating) return false;
              if (modelDoc.isValid === false) return false;
              return true;
            })
            .map((modelDoc, index) => {
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

        {/* Validation in progress indicator */}
        {models.some(m => m.validating) && (
          <div className="text-center text-gray-500 text-sm py-4">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
              <span>Validating models...</span>
            </div>
          </div>
        )}
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
