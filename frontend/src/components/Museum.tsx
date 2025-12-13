import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ModelDocument, ModelService } from '../services/firestore';
import Mini3DViewer from './Mini3DViewer';
import './Museum.css';
import { Timestamp } from 'firebase/firestore';

interface MuseumProps {
  onModelSelect?: (scadCode: string) => void;
}

const PAGE_SIZE = 20;
const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.1;
const MIN_CREATED_AT = Timestamp.fromDate(new Date(Date.UTC(2025, 11, 13, 0, 0, 0)));

interface SwipeCardProps {
  model: ModelDocument;
  onSwipe: (direction: 'left' | 'right') => void;
  onSelect: () => void;
  style?: React.CSSProperties;
}

function SwipeCard({ model, onSwipe, onSelect, style }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setDragOffset({ x: 0, y: 0 });
    setHasMoved(false);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
    
    // Mark as moved if there's significant movement
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setHasMoved(true);
    }
  }, [isDragging, dragStart]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (Math.abs(dragOffset.x) > SWIPE_THRESHOLD) {
      onSwipe(dragOffset.x > 0 ? 'right' : 'left');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isDragging, dragOffset, onSwipe]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const rotation = dragOffset.x * ROTATION_FACTOR;
  const opacity = Math.max(0.3, 1 - Math.abs(dragOffset.x) / 300);

  return (
    <div
      ref={cardRef}
      className="swipe-card"
      style={{
        ...style,
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
        opacity,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        // Only trigger select if it wasn't a drag
        if (!hasMoved) {
          onSelect();
        }
      }}
    >
      <div className="swipe-card-viewer">
        <Mini3DViewer
          scadCode={model.scadCode}
          thumbnail={model.thumbnailUrl}
          forceInteractive
        />
      </div>
      
      <div className="swipe-card-info">
        <div className="swipe-card-title">{model.prompt}</div>
        <div className="swipe-card-stats">
          <span className="likes">❤️ {model.likes || 0}</span>
          <span className="dislikes">👎 {model.dislikes || 0}</span>
        </div>
      </div>

      {/* Swipe indicators */}
      {Math.abs(dragOffset.x) > 50 && (
        <div className={`swipe-indicator ${dragOffset.x > 0 ? 'like' : 'dislike'}`}>
          {dragOffset.x > 0 ? '❤️ LIKE' : '👎 PASS'}
        </div>
      )}
    </div>
  );
}

export default function Museum({ onModelSelect }: MuseumProps) {
  const [models, setModels] = useState<ModelDocument[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [swipeStats, setSwipeStats] = useState({ likes: 0, dislikes: 0 });

  useEffect(() => {
    loadModels(true);
  }, []);

  // Load more models when we're near the end
  useEffect(() => {
    if (currentIndex >= models.length - 3 && hasMore && !loading) {
      loadModels();
    }
  }, [currentIndex, models.length, hasMore, loading]);

  async function loadModels(reset = false) {
    try {
      setLoading(true);
      setError(null);
      const result = await ModelService.getModelsPaginated(reset ? null : lastDoc, PAGE_SIZE, MIN_CREATED_AT);
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

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (currentIndex >= models.length) return;

    const currentModel = models[currentIndex];
    const preference = direction === 'right' ? 'like' : 'dislike';
    
    try {
      await ModelService.recordPreference(currentModel.id, preference);
      setSwipeStats(prev => ({
        ...prev,
        [preference === 'like' ? 'likes' : 'dislikes']: prev[preference === 'like' ? 'likes' : 'dislikes'] + 1
      }));
    } catch (error) {
      console.error('Error recording preference:', error);
    }

    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, models]);


  const handleSelect = useCallback(() => {
    // Open workspace when card is clicked (not swiped)
    if (currentIndex < models.length && onModelSelect) {
      onModelSelect(models[currentIndex].scadCode);
    }
  }, [currentIndex, models, onModelSelect]);

  if (loading && models.length === 0) {
    return (
      <div className="museum-loading">
        <ProgressSpinner />
        <p>Curating museum exhibits…</p>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="museum-empty">
        <p>No museum pieces available right now.</p>
      </div>
    );
  }

  const currentModel = models[currentIndex];
  const nextModel = models[currentIndex + 1];
  const isEnd = currentIndex >= models.length;

  return (
    <div className="museum-wrapper">
      {error && (
        <Message 
          severity="error" 
          text={error}
          style={{ marginBottom: '20px' }}
        />
      )}


      {/* Card stack */}
      <div className="swipe-container">
        {!isEnd && currentModel && (
          <SwipeCard
            key={currentModel.id}
            model={currentModel}
            onSwipe={handleSwipe}
            onSelect={handleSelect}
            style={{ zIndex: 2 }}
          />
        )}
        
        {!isEnd && nextModel && (
          <SwipeCard
            key={nextModel.id}
            model={nextModel}
            onSwipe={handleSwipe}
            onSelect={handleSelect}
            style={{ zIndex: 1, transform: 'scale(0.95)', opacity: 0.7 }}
          />
        )}
      </div>


      {/* Instructions */}
      <div className="swipe-instructions">
        <p>Swipe left to pass, right to like</p>
        <p className="sub-instruction">Tap to view details</p>
      </div>

      {/* End state */}
      {isEnd && (
        <div className="museum-end">
          <h3>🎉 You've seen all the exhibits!</h3>
          <p>You liked {swipeStats.likes} and passed on {swipeStats.dislikes} pieces.</p>
          <Button
            label="Start Over"
            icon="pi pi-refresh"
            onClick={() => setCurrentIndex(0)}
            className="p-button-outlined"
          />
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="swipe-loading">
          <ProgressSpinner />
          <span>Loading more exhibits...</span>
        </div>
      )}
    </div>
  );
}
