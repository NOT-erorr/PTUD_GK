import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import api from "../api";
import { useAuth } from "../components/AuthContext";

function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user? All their photos and posts will be deleted as well.")) {
      return;
    }
    
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete user");
    }
  };

  return (
    <div className="admin-page">
      <header className="topbar card">
        <div>
          <h1>🛡️ Admin Dashboard</h1>
          <p>Manage users and content</p>
        </div>
        <div className="topbar__actions">
          <Link to="/" className="link-btn">
            Back to Gallery
          </Link>
        </div>
      </header>

      {error && <div className="error card">{error}</div>}

      <section className="card admin-section">
        <h2>Registered Users</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.is_admin ? "role-badge--admin" : ""}`}>
                        {u.is_admin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="danger"
                        disabled={u.id === user.id}
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminPage;
