import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

import api from "../api";
import { useAuth } from "../components/AuthContext";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(
    /\/api\/?$/, ""
);

function FavoritePage(){
    const { user } = useAuth();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFavoritePhotos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get("/photos/favorites");
            setPhotos(response.data);
        } catch (err) {
            setError("Failed to load favorite photos");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavoritePhotos();
    }, [fetchFavoritePhotos]);

    const toggleFavorite = async (photoId) => {
        try {
            await api.patch(`/photos/${photoId}/favorite`);
            fetchFavoritePhotos();
        } catch (err) {
            console.error("Failed to toggle favorite", err);
        }
    };

    if (loading) {
        return (
            <div className="screen">
                <div className="loading">Loading favorite photos...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="screen">
                <div className="error">{error}</div>
                <button onClick={fetchFavoritePhotos}>Retry</button>
            </div>
        );
    }

    return (
        <div className="screen">
            <div className="header">
                <h1>Favorite Photos</h1>
                <p>Your collection of favorite moments</p>
            </div>

            {photos.length === 0 ? (
                <div className="empty-state">
                    <p>You haven't favorited any photos yet.</p>
                    <Link to="/" className="button">Browse Photos</Link>
                </div>
            ) : (
                <div className="photo-grid">
                    {photos.map((photo) => (
                        <div key={photo.id} className="photo-card">
                            <Link to={`/photos/${photo.id}`}>
                                <img
                                    src={`${API_ROOT}${photo.image_url}`}
                                    alt={photo.title}
                                    className="photo-image"
                                />
                            </Link>
                            <div className="photo-actions">
                                <button
                                    onClick={() => toggleFavorite(photo.id)}
                                    className="favorite-button"
                                >
                                    {photo.is_favorite ? "❤️ Unlike" : "🤍 Like"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FavoritePage;