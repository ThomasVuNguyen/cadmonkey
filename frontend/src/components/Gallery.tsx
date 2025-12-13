import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { ModelService, ModelDocument } from '../services/firestore';
import { Model } from '../state/model';
import Mini3DViewer from './Mini3DViewer';

interface GalleryProps {
  model: Model;
  onModelSelect?: (scadCode: string) => void;
}


export default function Gallery({ model, onModelSelect }: GalleryProps) {
  const [models, setModels] = useState<ModelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);

  // Load initial models
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await ModelService.getModelsPaginated(lastDoc, 12);

      // Log detailed info about loaded models
      console.log('📊 [GALLERY] Loaded', result.models.length, 'models');
      result.models.forEach((model, idx) => {
        console.log(`🎨 [GALLERY] Model ${idx + 1}:`, {
          id: model.id,
          prompt: model.prompt.substring(0, 50) + '...',
          hasThumbnail: !!model.thumbnailUrl,
          thumbnailUrl: model.thumbnailUrl || 'MISSING',
          thumbnailType: model.thumbnailUrl ? (
            model.thumbnailUrl.startsWith('data:') ? 'Data URL' :
            model.thumbnailUrl.startsWith('http') ? 'HTTP URL' :
            'Unknown'
          ) : 'N/A'
        });
      });

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

  const handleModelClick = (scadCode: string) => {
    if (onModelSelect) {
      onModelSelect(scadCode);
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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <ProgressSpinner />
        <p style={{ color: '#6c757d', margin: 0 }}>Loading gallery...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: 0, color: '#495057' }}>Community Gallery</h2>
        <span style={{ color: '#6c757d', fontSize: '14px' }}>
          {models.length} models
        </span>
      </div>

      {error && (
        <Message 
          severity="error" 
          text={error}
          style={{ marginBottom: '20px' }}
        />
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {models.map((modelDoc) => (
          <Card
            key={modelDoc.id}
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '1px solid #e1e5e9',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            }}
            onClick={() => handleModelClick(modelDoc.scadCode)}
          >
            <div style={{ padding: '16px' }}>
              {/* Prompt */}
              <div style={{
                marginBottom: '12px',
                fontSize: '14px',
                color: '#495057',
                lineHeight: '1.4',
                minHeight: '40px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                "{modelDoc.prompt}"
              </div>

                      {/* 3D Preview */}
                      <div style={{
                        height: '200px',
                        marginBottom: '12px'
                      }}>
                        <Mini3DViewer
                          scadCode={modelDoc.scadCode}
                          thumbnail={modelDoc.thumbnailUrl}
                        />
                      </div>

              {/* Date */}
              <div style={{
                fontSize: '12px',
                color: '#6c757d',
                textAlign: 'right'
              }}>
                {formatDate(modelDoc.createdAt)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div style={{ textAlign: 'center' }}>
          <Button
            label={loading ? "Loading..." : "Load More"}
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-refresh"}
            onClick={handleLoadMore}
            disabled={loading}
            className="p-button-outlined"
            style={{
              borderRadius: '8px',
              padding: '12px 24px'
            }}
          />
        </div>
      )}

      {!hasMore && models.length > 0 && (
        <div style={{
          textAlign: 'center',
          color: '#6c757d',
          fontSize: '14px',
          marginTop: '20px'
        }}>
          No more models to load
        </div>
      )}
    </div>
  );
}
