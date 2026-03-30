import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../api";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(
  /\/api\/?$/,
  ""
);

function PhotoDetailPage() {
  const { id } = useParams();
  const [photo, setPhoto] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const { data } = await api.get(`/photos/${id}`);
        setPhoto(data);
        setIsFavorite(data.is_favorite);
      } catch (err) {
        setError(err.response?.data?.detail || "Cannot load photo");
      }
    };

    fetchPhoto();
  }, [id]);

  const toggleFavorite = async () => {
    try {
      // Cập nhật UI ngay lập tức
      setIsFavorite((prev) => !prev);
      const { data } = await api.patch(`/photos/${id}/favorite`);
      // Đồng bộ lại với server response
      setIsFavorite(data.is_favorite);
    } catch (err) {
      // Rollback nếu API lỗi
      setIsFavorite((prev) => !prev);
      setError(err.response?.data?.detail || "Failed to update favorite");
    }
  };

  if (error) {
    return (
      <div className="detail-page">
        <div className="card error">{error}</div>
        <Link to="/" className="link-btn">
          Back
        </Link>
      </div>
    );
  }

  if (!photo) {
    return <div className="detail-page card">Loading...</div>;
  }

  return (
    <div className="detail-page card">
      <img src={`${API_ROOT}${photo.image_url}`} alt={photo.title} className="detail-image" />
      <div className="detail-header">
        <h1>{photo.title}</h1>
        <button
          className={`favorite-btn${isFavorite ? " favorite-btn--active" : ""}`}
          onClick={toggleFavorite}
          title={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
        >
          {isFavorite ? "❤️" : "🤍"}
        </button>
      </div>
      <p>{photo.description || "No description"}</p>
      <small>Uploaded: {new Date(photo.uploaded_at).toLocaleString()}</small>
      <Link to="/" className="link-btn">
        Back to gallery
      </Link>
    </div>
  );
}

export default PhotoDetailPage;
