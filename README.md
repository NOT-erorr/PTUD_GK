# Coded Gallery Project 🌍

Một ứng dụng web Full-Stack cho phép người dùng tải lên, quản lý hình ảnh cá nhân và chia sẻ chúng với một bảng tin cộng đồng (Community Feed). 

## 🚀 Tính năng nổi bật

### Người dùng (User)
- Đăng nhập, đăng ký bằng JWT.
- **Gallery Cá Nhân**: Tải ảnh lên (hỗ trợ kéo thả nhiều file), chỉnh sửa tên/mô tả, và xóa ảnh.
- **Phân trang, Tìm kiếm, & Sắp xếp**: Dễ dàng tìm ảnh theo tên hoặc lọc từ cũ đến mới.
- **Ảnh Yêu Thích**: Thả tim ảnh (tự lưu vào mục "Favorite").
- **Share to Community**: Chia sẻ một ảnh vào bảng tin chung với caption tùy chỉnh.

### Bảng Tin Cộng Đồng (Community Feed)
- Hiển thị bài viết của mọi người dùng với avatar và tên.
- Hiển thị thời gian đăng dạng "time ago" (vd: 5m ago, 2d ago).
- Cùng nhau bình luận trực tiếp bên dưới bài viết.
- **Người dùng** có thể xóa bài đăng của chính mình.
- Tích hợp Optimistic UI cho nút "Thả tim" siêu mượt.

### 🛡️ Quản Trị Viên (Admin)
- Tính năng phân quyền, chặn truy cập vào `Admin Dashboard` với người ngoài.
- **Quản lý Users**: Xem danh sách toàn bộ người dùng, quyền "Delete" sẽ xóa user và tất cả dấu vết (ảnh, bình luận, bài đăng) của họ khỏi hệ thống.
- **Kiểm duyệt Cộng Đồng**: Admin có quyền xóa *bất kỳ bài đăng nào* trên trang Community.

---

## 🔑 Tài khoản Admin Mặc Định

Khi lần đầu khởi động server, hệ thống sẽ tự sinh ra tài khoản mặc định:
- **Email**: `admin@gallery.com`
- **Mật khẩu**: `admin123`

*(Bạn có thể dùng tài khoản này đăng nhập vào xem tính năng quản trị).*

---

## 🛠 Lướt qua Công Nghệ

**Backend**
- Python, FastAPI
- SQLAlchemy (SQLite), Alembic (nếu cần)
- Passlib & python-jose cho bảo mật JWT

**Frontend**
- React + Vite
- React Router DOM
- Axios (tích hợp Interceptor tự chèn Token)
- Vanilla CSS, áp dụng chuẩn className BEM và giao diện Glassmorphism.

---

## ⚙️ Hướng dẫn Khởi Hành

**1. Khởi động Backend (FastAPI)**
```bash
cd backend
python -m venv venv
# ... activate venv ...
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
*Server mặc định chạy ở: http://localhost:8000*

**2. Khởi động Frontend (React)**
```bash
cd frontend
npm install
npm run dev
```
*Giao diện mặc định ở: http://localhost:5173*
