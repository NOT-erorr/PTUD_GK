import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api";
import { useAuth } from "../components/AuthContext";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(
  /\/api\/?$/,
  ""
);

function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentTexts, setCommentTexts] = useState({});
  const [submitting, setSubmitting] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/community");
      setPosts(data);
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

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="community-page">
      <header className="topbar card">
        <div>
          <h1>🌍 Community</h1>
          <p>Photos shared by all users</p>
        </div>
        <Link to="/" className="link-btn">
          My Gallery
        </Link>
      </header>

      {error && <div className="error card">{error}</div>}

      {loading ? (
        <div className="card" style={{ padding: "1rem" }}>Loading...</div>
      ) : posts.length === 0 ? (
        <div className="card" style={{ padding: "1rem" }}>
          No posts yet. Share a photo from your gallery!
        </div>
      ) : (
        <div className="community-feed">
          {posts.map((post) => (
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
                {post.user_id === user.id && (
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
      )}
    </div>
  );
}

export default CommunityPage;
