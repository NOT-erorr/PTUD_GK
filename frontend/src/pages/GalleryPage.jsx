import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api";
import { useAuth } from "../components/AuthContext";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(
  /\/api\/?$/,
  ""
);

function GalleryPage() {
  const { user, logout } = useAuth();

  const [photos, setPhotos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchPhotos = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/photos", {
        params: query ? { search: query } : {},
      });
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

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);

    try {
      await api.post("/photos/", formData);
      setFile(null);
      setTitle("");
      setDescription("");
      await fetchPhotos(search);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
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
        <button className="ghost" onClick={logout}>
          Logout
        </button>
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
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0])} required />
          <button type="submit">Upload</button>
        </form>
      </section>

      <section className="search-row card">
        <input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => fetchPhotos(search)}>Search</button>
      </section>

      {error && <div className="error card">{error}</div>}

      <section className="photo-grid">
        {loading ? (
          <div className="card">Loading...</div>
        ) : photos.length === 0 ? (
          <div className="card">No photos found.</div>
        ) : (
          photos.map((photo) => (
            <article className="card photo-card" key={photo.id}>
              <img src={`${API_ROOT}${photo.image_url}`} alt={photo.title} />
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
    </div>
  );
}

export default GalleryPage;
