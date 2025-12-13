import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { InputText } from 'primereact/inputtext';
import { ModelDocument, ModelService, Comment } from '../services/firestore';
import Mini3DViewer from './Mini3DViewer';
import './Socials.css';

interface SocialsProps {
  onModelSelect?: (scadCode: string) => void;
}

interface PostWithComments extends ModelDocument {
  comments: Comment[];
  showComments: boolean;
  commentText: string;
}

const PAGE_SIZE = 10;

// Validate SCAD code by attempting to render it
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
    }, (streams) => {
      // Silently validate
    });

    const result = await job;
    
    if (result.error) {
      return false;
    }
    
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

      const models = await ModelService.searchModels(query, 100); // Search top 100 recent models

      // Filter and validate models (same as loadPosts)
      const basicValidModels = models.filter(model =>
        model.scadCode &&
        model.scadCode.trim().length > 0 &&
        model.scadCode.trim() !== '' &&
        model.scadCode !== 'undefined'
      );

      console.log(`🔍 Validating ${basicValidModels.length} search results for rendering...`);
      const renderableModels = [];
      for (const model of basicValidModels) {
        const isValid = await validateScadCode(model.scadCode);
        if (isValid) {
          renderableModels.push(model);
        }
      }
      console.log(`📊 Search returned ${renderableModels.length} valid models`);

      const postsWithComments = renderableModels.map(model => ({
        ...model,
        comments: [],
        showComments: true,
        commentText: ''
      }));

      // Load comments
      const postsWithCommentsData = await Promise.all(
        postsWithComments.map(async (post) => {
          try {
            const comments = await ModelService.getComments(post.id);
            return { ...post, comments };
          } catch (err) {
            console.error(`Error loading comments for ${post.id}:`, err);
            return { ...post, comments: [] };
          }
        })
      );

      setSearchResults(postsWithCommentsData);
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
      const result = await ModelService.getModelsPaginated(reset ? null : lastDoc, PAGE_SIZE);
      
      // First filter: basic SCAD code validation
      const basicValidModels = result.models.filter(model => 
        model.scadCode && 
        model.scadCode.trim().length > 0 &&
        model.scadCode.trim() !== '' &&
        model.scadCode !== 'undefined'
      );
      
      // Second filter: actual render validation
      console.log(`🔍 Validating ${basicValidModels.length} models for rendering...`);
      const renderableModels = [];
      for (const model of basicValidModels) {
        const isValid = await validateScadCode(model.scadCode);
        if (isValid) {
          renderableModels.push(model);
          console.log(`✅ Model ${model.id} validated successfully`);
        } else {
          console.log(`❌ Model ${model.id} failed validation (render error)`);
        }
      }
      console.log(`📊 Showing ${renderableModels.length} valid models out of ${basicValidModels.length}`);
      
      const postsWithComments = renderableModels.map(model => ({
        ...model,
        comments: [],
        showComments: true, // Always show comments by default
        commentText: ''
      }));
      
      // Load comments before setting posts
      const postsWithCommentsData = await Promise.all(
        postsWithComments.map(async (post) => {
          try {
            const comments = await ModelService.getComments(post.id);
            console.log(`✅ Loaded ${comments.length} comments for post ${post.id}`);
            return { ...post, comments };
          } catch (err) {
            console.error(`Error loading comments for ${post.id}:`, err);
            return { ...post, comments: [] };
          }
        })
      );
      
      setPosts(prev => reset ? postsWithCommentsData : [...prev, ...postsWithCommentsData]);
      setLastDoc(result.lastDoc);
      setHasMore(result.models.length === PAGE_SIZE && renderableModels.length > 0);
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

  const toggleComments = (postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, showComments: !p.showComments } : p
    ));
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
                forceInteractive
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

