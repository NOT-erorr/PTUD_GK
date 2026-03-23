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
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const { data } = await api.get(`/photos/${id}`);
        setPhoto(data);
      } catch (err) {
        setError(err.response?.data?.detail || "Cannot load photo");
      }
    };

    fetchPhoto();
  }, [id]);

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
      <h1>{photo.title}</h1>
      <p>{photo.description || "No description"}</p>
      <small>Uploaded: {new Date(photo.uploaded_at).toLocaleString()}</small>
      <Link to="/" className="link-btn">
        Back to gallery
      </Link>
    </div>
  );
}

export default PhotoDetailPage;
