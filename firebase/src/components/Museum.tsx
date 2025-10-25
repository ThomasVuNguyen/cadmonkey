import React, { useEffect, useState } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ModelDocument, ModelService } from '../services/firestore';
import Mini3DViewer from './Mini3DViewer';
import './Museum.css';

interface MuseumProps {
  onModelSelect?: (scadCode: string) => void;
}

const PAGE_SIZE = 8;
const CODE_PREVIEW_LINES = 32;
const CODE_PREVIEW_WIDTH = 70;

function buildCodePreview(scadCode: string): string {
  const lines = scadCode.split('\n');
  const trimmedLines = lines.slice(0, CODE_PREVIEW_LINES).map(line => {
    if (line.length <= CODE_PREVIEW_WIDTH) return line;
    return line.slice(0, CODE_PREVIEW_WIDTH - 1) + '…';
  });
  if (lines.length > CODE_PREVIEW_LINES) {
    trimmedLines.push('// …');
  }
  return trimmedLines.join('\n');
}

function formatRelativeDate(timestamp: any) {
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function Museum({ onModelSelect }: MuseumProps) {
  const [models, setModels] = useState<ModelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadModels(true);
  }, []);

  async function loadModels(reset = false) {
    try {
      setLoading(true);
      setError(null);
      const result = await ModelService.getModelsPaginated(reset ? null : lastDoc, PAGE_SIZE);
      setModels(prev => reset ? result.models : [...prev, ...result.models]);
      setLastDoc(result.lastDoc);
      setHasMore(result.models.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading museum models:', err);
      setError('Unable to load museum pieces right now.');
    } finally {
      setLoading(false);
    }
  }

  if (loading && models.length === 0) {
    return (
      <div className="museum-loading">
        <ProgressSpinner />
        <p>Curating museum exhibits…</p>
      </div>
    );
  }

  return (
    <div className="museum-wrapper">

      {error && (
        <Message 
          severity="error" 
          text={error}
          style={{ marginBottom: '20px' }}
        />
      )}

      <div className="museum-grid">
        {models.map(doc => (
          <div
            key={doc.id}
            className="museum-card"
            onClick={() => onModelSelect && onModelSelect(doc.scadCode)}
          >
            <div className="museum-card-viewer">
              <Mini3DViewer
                scadCode={doc.scadCode}
                thumbnail={doc.thumbnailUrl}
                forceInteractive
              />
            </div>
            
            <div className="museum-card-info">
              <div className="museum-card-title">{doc.prompt}</div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="museum-load">
          <Button
            label={loading ? 'Loading…' : 'Load More Exhibits'}
            icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-arrow-down'}
            onClick={() => loadModels()}
            disabled={loading}
          />
        </div>
      )}

      {!hasMore && models.length > 0 && (
        <div className="museum-end">You have reached the end of the gallery.</div>
      )}
    </div>
  );
}
