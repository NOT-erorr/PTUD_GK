import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api";
import { useAuth } from "../components/AuthContext";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(
  /\/api\/?$/,
  ""
);

const ITEMS_PER_PAGE = 8;

function GalleryPage() {
  const { user, logout } = useAuth();

  const [photos, setPhotos] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  // generate / revoke preview URLs when files change
  useEffect(() => {
    if (files.length === 0) { setPreviews([]); return; }
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = useCallback((newFiles) => {
    const imageFiles = Array.from(newFiles).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    setFiles((prev) => [...prev, ...imageFiles]);
  }, []);

  const removeFile = (e, index) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchPhotos = async (query = "", sort = sortOrder) => {
    setLoading(true);
    setError("");
    setCurrentPage(1);
    try {
      const params = { sort };
      if (query) params.search = query;
      const { data } = await api.get("/photos", { params });
      setPhotos(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load photos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  /* ── drag-and-drop handlers ── */
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (files.length === 0) return;
    setUploading(true);
    setError("");

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("title", files.length === 1 ? title : (title ? `${title} (${i + 1})` : files[i].name));
        formData.append("description", description);
        await api.post("/photos/", formData);
      }
      clearFiles();
      setTitle("");
      setDescription("");
      await fetchPhotos(search);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    try {
      await api.delete(`/photos/${photoId}`);
      await fetchPhotos(search);
    } catch (err) {
      setError(err.response?.data?.detail || "Delete failed");
    }
  };

  const startEdit = (photo) => {
    setEditingId(photo.id);
    setEditTitle(photo.title);
    setEditDescription(photo.description || "");
  };

  const handleUpdate = async (photoId) => {
    try {
      await api.put(`/photos/${photoId}`, {
        title: editTitle,
        description: editDescription,
      });
      setEditingId(null);
      await fetchPhotos(search);
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed");
    }
  };

  const handleSortChange = (newSort) => {
    setSortOrder(newSort);
    fetchPhotos(search, newSort);
  };

  const toggleFavorite = async (photoId) => {
    // Optimistic update
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId ? { ...p, is_favorite: !p.is_favorite } : p
      )
    );
    try {
      await api.patch(`/photos/${photoId}/favorite`);
    } catch (err) {
      // Rollback
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId ? { ...p, is_favorite: !p.is_favorite } : p
        )
      );
      setError(err.response?.data?.detail || "Failed to update favorite");
    }
  };

  const handleShare = async (photoId) => {
    const caption = prompt("Add a caption for the community post (optional):");
    if (caption === null) return; // cancelled
    try {
      const formData = new FormData();
      formData.append("photo_id", photoId);
      formData.append("caption", caption);
      await api.post("/community/", formData);
      alert("Shared to community!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to share");
    }
  };

  const totalPages = Math.max(1, Math.ceil(photos.length / ITEMS_PER_PAGE));
  const pagedPhotos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return photos.slice(start, start + ITEMS_PER_PAGE);
  }, [photos, currentPage]);

  const subtitle = useMemo(() => {
    return `${photos.length} photo${photos.length === 1 ? "" : "s"}`;
  }, [photos.length]);

  return (
    <div className="gallery-page">
      <header className="topbar card">
        <div>
          <h1>{user.username}'s Gallery</h1>
          <p>{subtitle}</p>
        </div>
        <div className="topbar__actions">
          {user.is_admin && (
            <Link to="/admin" className="link-btn">Admin Panel</Link>
          )}
          <Link to="/community" className="link-btn">Community</Link>
          <button className="ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <section className="card uploader">
        <h2>Upload Image</h2>
        <form onSubmit={handleUpload}>
          <input
            type="text"
            placeholder="Image title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* ── drag-and-drop zone ── */}
          <div
            className={`drop-zone${isDragging ? " drop-zone--active" : ""}${files.length > 0 ? " drop-zone--has-file" : ""}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="drop-zone__input"
              onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); }}
            />
            {files.length > 0 ? (
              <div className="drop-zone__list">
                {files.map((f, i) => (
                  <div className="drop-zone__preview" key={`${f.name}-${i}`}>
                    <img src={previews[i]} alt="Preview" className="drop-zone__thumb" />
                    <div className="drop-zone__meta">
                      <span className="drop-zone__name">{f.name}</span>
                      <span className="drop-zone__size">{formatSize(f.size)}</span>
                    </div>
                    <button type="button" className="drop-zone__remove" onClick={(e) => removeFile(e, i)} title="Remove">
                      ✕
                    </button>
                  </div>
                ))}
                <p className="drop-zone__hint">Click or drop to add more images</p>
              </div>
            ) : (
              <>
                <span className="drop-zone__icon">📁</span>
                <p>Drag & drop images here</p>
                <span className="drop-zone__or">or</span>
                <button type="button" className="choose-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  Choose Files
                </button>
              </>
            )}
          </div>

          <button type="submit" disabled={files.length === 0 || uploading}>
            {uploading ? "Uploading..." : `Upload${files.length > 1 ? ` (${files.length})` : ""}`}
          </button>
        </form>
      </section>

      <section className="search-sort-row card">
        <div className="search-row">
          <input
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={() => fetchPhotos(search)}>Search</button>
        </div>
        <div className="sort-row">
          <span className="sort-label">Sort:</span>
          <button
            className={sortOrder === "newest" ? "newest" : "ghost"}
            onClick={() => handleSortChange("newest")}
          >
            Newest
          </button>
          <button
            className={sortOrder === "oldest" ? "oldest" : "ghost"}
            onClick={() => handleSortChange("oldest")}
          >
            Oldest
          </button>
        </div>
      </section>

      {error && <div className="error card">{error}</div>}

      <section className="photo-grid">
        {loading ? (
          <div className="card">Loading...</div>
        ) : photos.length === 0 ? (
          <div className="card">No photos found.</div>
        ) : (
          pagedPhotos.map((photo) => (
            <article className="card photo-card" key={photo.id}>
              <div className="photo-card__img-wrap">
                <img src={`${API_ROOT}${photo.image_url}`} alt={photo.title} />
                <button
                  className={`photo-card__heart${photo.is_favorite ? " photo-card__heart--active" : ""}`}
                  onClick={() => toggleFavorite(photo.id)}
                  title={photo.is_favorite ? "Bỏ yêu thích" : "Yêu thích"}
                >
                  {photo.is_favorite ? "❤️" : "🤍"}
                </button>
              </div>
              {editingId === photo.id ? (
                <div className="edit-form">
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                  <div className="row">
                    <button onClick={() => handleUpdate(photo.id)}>Save</button>
                    <button className="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3>{photo.title}</h3>
                  <p>{photo.description || "No description"}</p>
                  <div className="row">
                    <Link to={`/photos/${photo.id}`} className="link-btn">
                      View Detail
                    </Link>
                    <button className="ghost" onClick={() => startEdit(photo)}>
                      Edit
                    </button>
                    <button className="ghost" onClick={() => handleShare(photo.id)}>
                      Share
                    </button>
                    <button className="danger" onClick={() => handleDelete(photo.id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </article>
          ))
        )}
      </section>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
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
    </div>
  );
}

export default GalleryPage;
