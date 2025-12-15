import React, { useState, useEffect } from 'react';
import { ModelService, ModelDocument } from '../services/firestore';
import Mini3DViewer from './Mini3DViewer';
import { Timestamp } from 'firebase/firestore';
import { spawnOpenSCAD } from '../lib/runner/openscad-runner';

interface GalleryProps {
  onModelSelect?: (scadCode: string, prompt: string) => void;
}

interface ValidatedModel extends ModelDocument {
  isValid?: boolean;
  validating?: boolean;
}

export default function Gallery({ onModelSelect }: GalleryProps) {
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

  const visibleModels = models.filter(modelDoc => {
    if (modelDoc.validating) return false;
    if (modelDoc.isValid === false) return false;
    return true;
  });

  return (
    <div className="gallery-shell">
      <div className="gallery-nav">
        {validModelCount > 0 && (
          <div className="gallery-count">
            {validModelCount} valid {validModelCount === 1 ? 'model' : 'models'}
            {totalLoadedCount > validModelCount && (
              <span className="gallery-count__muted">
                {' '}
                ({totalLoadedCount - validModelCount} hidden with errors)
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="gallery-alert">{error}</div>
      )}

      <div className="gallery-grid">
        {visibleModels.map((modelDoc, index) => {
          const heights = ['220px', '260px', '300px', '340px', '280px', '310px'];
          const height = heights[index % heights.length];

          return (
            <div
              key={modelDoc.id}
              className="gallery-card"
            >
              <div className="gallery-thumb" style={{ height }}>
                <Mini3DViewer
                  scadCode={modelDoc.scadCode}
                  style={{
                    minHeight: '0',
                    height: '100%',
                    backgroundColor: '#0d0d0f',
                  }}
                />
                <button
                  className="gallery-open-btn"
                  type="button"
                  onClick={() => handleModelClick(modelDoc)}
                  aria-label="Open in workspace"
                >
                  Open
                </button>
                <div className="gallery-overlay">
                  <p className="gallery-prompt">"{modelDoc.prompt}"</p>
                  <p className="gallery-meta">{formatDate(modelDoc.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {models.some(m => m.validating) && (
        <div className="gallery-info">
          <span className="gallery-spinner" aria-hidden="true"></span>
          <span>Validating models...</span>
        </div>
      )}

      <div className="gallery-footer">
        {hasMore ? (
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="gallery-button"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        ) : (
          models.length > 0 && (
            <div className="gallery-info muted">No more models to load</div>
          )
        )}
      </div>
    </div>
  );
}
