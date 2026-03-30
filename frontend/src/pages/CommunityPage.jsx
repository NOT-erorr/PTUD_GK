import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api";
import { useAuth } from "../components/AuthContext";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(
  /\/api\/?$/,
  ""
);

const POSTS_PER_PAGE = 5;

function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentTexts, setCommentTexts] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [favorites, setFavorites] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/community");
      setPosts(data);
      // Initialize favorites from linked photos
      const favMap = {};
      for (const p of data) {
        if (p.photo_id) {
          try {
            const { data: photo } = await api.get(`/photos/${p.photo_id}`);
            favMap[p.id] = photo.is_favorite;
          } catch {
            favMap[p.id] = false;
          }
        } else {
          favMap[p.id] = false;
        }
      }
      setFavorites(favMap);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load community");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleComment = async (postId) => {
    const text = (commentTexts[postId] || "").trim();
    if (!text) return;
    setSubmitting(postId);
    try {
      const { data: newComment } = await api.post(`/community/${postId}/comments`, { text });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
        )
      );
      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      setError(err.response?.data?.detail || "Comment failed");
    } finally {
      setSubmitting(null);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/community/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      setError(err.response?.data?.detail || "Delete failed");
    }
  };

  const toggleFavorite = async (post) => {
    if (!post.photo_id) return;
    // Optimistic UI
    setFavorites((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
    try {
      await api.patch(`/photos/${post.photo_id}/favorite`);
    } catch {
      // Rollback
      setFavorites((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
    }
  };

  const timeAgo = (dateStr) => {
    // Backend returns UTC without 'Z' suffix — force UTC parsing
    const utc = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
    const diff = Date.now() - new Date(utc).getTime();
    if (diff < 0) return "just now";
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const pagedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return posts.slice(start, start + POSTS_PER_PAGE);
  }, [posts, currentPage]);

  return (
    <div className="community-page">
      <header className="topbar card">
        <div>
          <h1>🌍 Community</h1>
          <p>Photos shared by all users</p>
        </div>
        <div className="topbar__actions">
          {user.is_admin && (
            <Link to="/admin" className="link-btn">Admin Panel</Link>
          )}
          <Link to="/" className="link-btn">
            My Gallery
          </Link>
        </div>
      </header>

      {error && <div className="error card">{error}</div>}

      {loading ? (
        <div className="card" style={{ padding: "1rem" }}>Loading...</div>
      ) : posts.length === 0 ? (
        <div className="card" style={{ padding: "1rem" }}>
          No posts yet. Share a photo from your gallery!
        </div>
      ) : (
        <>
          <div className="community-feed">
            {pagedPosts.map((post) => (
              <article className="card community-card" key={post.id}>
                {/* Header */}
                <div className="community-card__header">
                  <div className="community-card__avatar">
                    {post.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="community-card__user">
                    <strong>{post.username}</strong>
                    <span className="community-card__time">{timeAgo(post.created_at)}</span>
                  </div>
                  {(post.user_id === user.id || user.is_admin) && (
                    <button className="drop-zone__remove" onClick={() => handleDelete(post.id)} title="Delete post">
                      ✕
                    </button>
                  )}
                </div>

                {/* Image */}
                <img
                  src={`${API_ROOT}${post.image_url}`}
                  alt={post.caption || "Community post"}
                  className="community-card__image"
                />

                {/* Actions */}
                <div className="community-card__actions">
                  <button
                    className={`community-card__like${favorites[post.id] ? " community-card__like--active" : ""}`}
                    onClick={() => toggleFavorite(post)}
                    title={favorites[post.id] ? "Bỏ yêu thích" : "Yêu thích"}
                  >
                    {favorites[post.id] ? "❤️" : "🤍"}
                  </button>
                </div>

                {/* Caption */}
                {post.caption && (
                  <p className="community-card__caption">
                    <strong>{post.username}</strong> {post.caption}
                  </p>
                )}

                {/* Comments */}
                <div className="community-card__comments">
                  {post.comments.map((c) => (
                    <div className="comment" key={c.id}>
                      <strong>{c.username}</strong>
                      <span>{c.text}</span>
                      <span className="comment__time">{timeAgo(c.created_at)}</span>
                    </div>
                  ))}
                </div>

                {/* Add comment */}
                <div className="community-card__add-comment">
                  <input
                    placeholder="Add a comment..."
                    value={commentTexts[post.id] || ""}
                    onChange={(e) =>
                      setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleComment(post.id);
                    }}
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    disabled={submitting === post.id || !(commentTexts[post.id] || "").trim()}
                  >
                    {submitting === post.id ? "..." : "Post"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="pagination card">
              <button
                className="ghost"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <div className="pagination__pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={page === currentPage ? "pagination__page--active" : "ghost"}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                className="ghost"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default CommunityPage;
