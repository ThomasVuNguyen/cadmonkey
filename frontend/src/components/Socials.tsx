import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { InputText } from 'primereact/inputtext';
import { ModelDocument, ModelService, Comment } from '../services/firestore';
import Mini3DViewer from './Mini3DViewer';
import './Socials.css';
import { Timestamp } from 'firebase/firestore';

interface SocialsProps {
  onModelSelect?: (scadCode: string) => void;
}

interface PostWithComments extends ModelDocument {
  comments: Comment[];
  commentsLoaded: boolean;
  showComments: boolean;
  commentText: string;
  renderStatus: 'queued' | 'validating' | 'rendering' | 'done' | 'invalid' | 'error';
}

const PAGE_SIZE = 10;
const MIN_CREATED_AT = Timestamp.fromDate(new Date(Date.UTC(2025, 11, 13, 0, 0, 0)));

function isPlaceholderThumbnailUrl(thumbnailUrl?: string): boolean {
  if (!thumbnailUrl) return false;
  // Previous versions saved fallback icons as base64 SVG data URLs.
  return thumbnailUrl.startsWith('data:image/svg+xml');
}

async function validateScadCode(scadCode: string): Promise<boolean> {
  try {
    const { spawnOpenSCAD } = await import('../runner/openscad-runner');
    const job = spawnOpenSCAD({
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
    }, () => {});

    const result = await job;
    if (result.error) return false;
    return !!result.outputs?.[0]?.[1];
  } catch (err) {
    console.error('SCAD validation error:', err);
    return false;
  }
}

export default function Socials({ onModelSelect }: SocialsProps) {
  const [posts, setPosts] = useState<PostWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [submittingComments, setSubmittingComments] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PostWithComments[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const queueRunningRef = useRef(false);
  const renderWaitersRef = useRef(new Map<string, { resolve: () => void; reject: (err: unknown) => void }>());
  const [activeRenderId, setActiveRenderId] = useState<string | null>(null);
  const postsRef = useRef<PostWithComments[]>([]);
  const loadingRef = useRef<boolean>(loading);
  const hasMoreRef = useRef<boolean>(hasMore);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadPosts(true);
    loadTotalCount();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      await performSearch(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  async function loadTotalCount() {
    try {
      const count = await ModelService.getTotalRenderableCount();
      setTotalCount(count);
    } catch (err) {
      console.error('Error loading total count:', err);
    }
  }

  async function performSearch(query: string) {
    try {
      setIsSearching(true);
      setError(null);
      console.log(`🔍 Performing server-side search for: "${query}"`);

      const models = await ModelService.searchModels(query, 100, MIN_CREATED_AT); // Search top 100 recent models

      // Filter and validate models (same as loadPosts)
      const basicValidModels = models.filter(model =>
        model.scadCode &&
        model.scadCode.trim().length > 0 &&
        model.scadCode.trim() !== '' &&
        model.scadCode !== 'undefined'
      );

      const postsWithComments = basicValidModels.map(model => ({
        ...model,
        comments: [],
        commentsLoaded: false,
        showComments: false,
        commentText: ''
        ,renderStatus: 'queued' as const
      }));

      setSearchResults(postsWithComments);
    } catch (err) {
      console.error('Error performing search:', err);
      setError('Unable to search models right now.');
    } finally {
      setIsSearching(false);
    }
  }

  async function loadPosts(reset = false) {
    try {
      setLoading(true);
      setError(null);
      const result = await ModelService.getModelsPaginated(reset ? null : lastDoc, PAGE_SIZE, MIN_CREATED_AT);
      
      // First filter: basic SCAD code validation
      const basicValidModels = result.models.filter(model => 
        model.scadCode && 
        model.scadCode.trim().length > 0 &&
        model.scadCode.trim() !== '' &&
        model.scadCode !== 'undefined'
      );
      
      const postsWithComments = basicValidModels.map(model => ({
        ...model,
        comments: [],
        commentsLoaded: false,
        showComments: false,
        commentText: ''
        ,renderStatus: 'queued' as const
      }));

      setPosts(prev => reset ? postsWithComments : [...prev, ...postsWithComments]);
      setLastDoc(result.lastDoc);
      setHasMore(result.models.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Unable to load posts right now.');
    } finally {
      setLoading(false);
    }
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPosts();
    }
  };

  // Sequentially validate + render (newest to oldest) without blocking initial load.
  // Important: keep the worker loop alive; do NOT restart it on list length changes (that can orphan in-flight work).
  useEffect(() => {
    if (queueRunningRef.current) return;

    let cancelled = false;
    queueRunningRef.current = true;

    const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    (async () => {
      try {
        while (!cancelled) {
          if (loadingRef.current) {
            await sleep(200);
            continue;
          }

          const next = postsRef.current.find(p => p.renderStatus === 'queued');
          if (!next) {
            // If we have no more pages and nothing queued, we're done.
            if (!hasMoreRef.current) break;
            await sleep(300);
            continue;
          }

          setPosts(prev => prev.map(p => p.id === next.id ? { ...p, renderStatus: 'validating' } : p));

          // Retry once for transient FS errors from the worker.
          let isValid = await validateScadCode(next.scadCode);
          if (!isValid) {
            await sleep(150);
            isValid = await validateScadCode(next.scadCode);
          }

          if (cancelled) break;

          // Post might have been removed/updated while we were validating.
          if (!postsRef.current.some(p => p.id === next.id)) {
            continue;
          }

          if (!isValid) {
            // Filter out non-renderable models from the feed.
            setPosts(prev => prev.filter(p => p.id !== next.id));
            continue;
          }

          // If we already have a REAL thumbnail (not a placeholder), we consider it done.
          if (next.thumbnailUrl && !isPlaceholderThumbnailUrl(next.thumbnailUrl)) {
            setPosts(prev => prev.map(p => p.id === next.id ? { ...p, renderStatus: 'done' } : p));
            continue;
          }

          // Render heavy preview for this item only.
          setActiveRenderId(next.id);
          setPosts(prev => prev.map(p => p.id === next.id ? { ...p, renderStatus: 'rendering' } : p));

          const renderPromise = new Promise<void>((resolve, reject) => {
            renderWaitersRef.current.set(next.id, { resolve, reject });
          });

          try {
            await renderPromise;
            if (cancelled) break;
            setPosts(prev => prev.map(p => p.id === next.id ? { ...p, renderStatus: 'done' } : p));
          } catch (err) {
            if (cancelled) break;
            // Filter out models that fail to render a preview.
            setPosts(prev => prev.filter(p => p.id !== next.id));
          } finally {
            renderWaitersRef.current.delete(next.id);
            setActiveRenderId(null);
          }
        }
      } finally {
        queueRunningRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
      setActiveRenderId(null);
      renderWaitersRef.current.clear();
      queueRunningRef.current = false;
    };
  }, []);

  const handleLike = async (postId: string) => {
    try {
      await ModelService.recordPreference(postId, 'like');
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
      ));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleDislike = async (postId: string) => {
    try {
      await ModelService.recordPreference(postId, 'dislike');
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, dislikes: (p.dislikes || 0) + 1 } : p
      ));
    } catch (err) {
      console.error('Error disliking post:', err);
    }
  };

  const toggleComments = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const willOpen = !post.showComments;
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, showComments: willOpen } : p
    ));

    // Lazy-load comments only when opening for the first time
    if (willOpen && !post.commentsLoaded) {
      try {
        const comments = await ModelService.getComments(postId);
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, comments, commentsLoaded: true } : p
        ));
      } catch (err) {
        console.error(`Error loading comments for ${postId}:`, err);
      }
    }
  };

  const handleCommentChange = (postId: string, text: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, commentText: text } : p
    ));
  };

  const handleSubmitComment = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post || !post.commentText.trim()) return;

    setSubmittingComments(prev => new Set(prev).add(postId));
    
    try {
      await ModelService.addComment(postId, post.commentText);
      const comments = await ModelService.getComments(postId);
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, comments, commentText: '' } : p
      ));
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmittingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleModelClick = (scadCode: string) => {
    if (onModelSelect) {
      onModelSelect(scadCode);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  // Determine which posts to display
  const displayPosts = searchQuery.trim() !== '' ? searchResults : posts;

  if (loading && posts.length === 0) {
    return (
      <div className="socials-loading">
        <ProgressSpinner />
        <p>Loading feed…</p>
      </div>
    );
  }

  return (
    <div className="socials-container">
      {error && (
        <Message 
          severity="error" 
          text={error}
          style={{ marginBottom: '20px' }}
        />
      )}

      {/* Total Object Count */}
      {totalCount !== null && (
        <div className="socials-count">
          <p>Total Objects: {totalCount}</p>
        </div>
      )}

      {/* Search Input */}
      <div className="search-filter-container">
        <InputText
          placeholder="Search prompts across database..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          disabled={isSearching}
        />
        {isSearching && (
          <ProgressSpinner style={{ width: '20px', height: '20px' }} />
        )}
        {searchQuery && !isSearching && (
          <span className="search-results-count">
            {displayPosts.length} result{displayPosts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="socials-feed">
        {displayPosts.map((post) => (
          <div key={post.id} className="social-post">
            {/* Post Header */}
            <div className="post-header">
              <div className="post-avatar">
                <img src="/icon.png" alt="CADMonkey" />
              </div>
              <div className="post-info">
                <div className="post-username">CADMonkey</div>
                <div className="post-time">{formatDate(post.createdAt)}</div>
              </div>
            </div>

            {/* Post Content - 3D Model */}
            <div 
              className="post-content"
              // onClick={() => handleModelClick(post.scadCode)} // Disabled - clicking gallery items no longer opens in workspace
            >
              <Mini3DViewer
                scadCode={post.scadCode}
                thumbnail={post.thumbnailUrl}
                enabled={post.id === activeRenderId && post.renderStatus === 'rendering'}
                forceInteractive={post.id === activeRenderId && post.renderStatus === 'rendering'}
                onRenderComplete={() => {
                  const waiter = renderWaitersRef.current.get(post.id);
                  waiter?.resolve();
                }}
                onRenderError={(err) => {
                  const waiter = renderWaitersRef.current.get(post.id);
                  waiter?.reject(err);
                }}
              />
            </div>

            {/* Post Caption */}
            <div className="post-caption">
              <span className="caption-username">CADMonkey</span>
              <span className="caption-text">{post.prompt}</span>
            </div>

            {/* Post Actions */}
            <div className="post-actions">
              <button 
                className="action-button like"
                onClick={() => handleLike(post.id)}
                aria-label="Like"
              >
                <span className="action-icon">❤️</span>
                <span className="action-count">{post.likes || 0}</span>
              </button>
              <button 
                className="action-button dislike"
                onClick={() => handleDislike(post.id)}
                aria-label="Dislike"
              >
                <span className="action-icon">👎</span>
                <span className="action-count">{post.dislikes || 0}</span>
              </button>
              <button 
                className="action-button comment"
                onClick={() => toggleComments(post.id)}
                aria-label="Comment"
              >
                <span className="action-icon">💬</span>
                <span className="action-count">{post.comments.length}</span>
              </button>
            </div>

            {/* Comments Section */}
            {post.showComments && (
              <div className="comments-section">
                {post.comments.length > 0 && (
                  <div className="comments-list">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="comment">
                        <span className="comment-username">CADMonkey</span>
                        <span className="comment-text">{comment.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Comment Form */}
                <div className="comment-form">
                  <InputText
                    placeholder="Add a comment..."
                    value={post.commentText}
                    onChange={(e) => handleCommentChange(post.id, e.target.value)}
                    disabled={submittingComments.has(post.id)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmitComment(post.id);
                      }
                    }}
                    className="comment-input"
                  />
                  <Button
                    label="Post"
                    disabled={!post.commentText.trim() || submittingComments.has(post.id)}
                    onClick={() => handleSubmitComment(post.id)}
                    className="comment-submit-button"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More Button - Only show when not searching */}
      {hasMore && !searchQuery && (
        <div className="load-more-container">
          <Button
            label="Load More"
            onClick={handleLoadMore}
            disabled={loading}
            loading={loading}
            className="load-more-button"
          />
        </div>
      )}

      {/* No results message for search */}
      {searchQuery && !isSearching && displayPosts.length === 0 && (
        <div className="no-results-message">
          <p>No models found matching "{searchQuery}"</p>
          <p className="no-results-hint">Try a different search term</p>
        </div>
      )}
    </div>
  );
}

