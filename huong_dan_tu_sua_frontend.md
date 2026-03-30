# 🛠️ Hướng Dẫn Tự Sửa/Thêm Code Frontend

## Bản đồ file — Sửa file nào cho việc gì?

| Muốn làm gì? | Sửa file nào? |
|---|---|
| Thêm/sửa **button, text, layout** trên 1 trang | `src/pages/<TenTrang>.jsx` |
| Thêm **trang hoàn toàn mới** | Tạo `src/pages/NewPage.jsx` + thêm route vào `src/App.jsx` |
| Đổi **màu sắc, kích thước, animation** | `src/styles.css` |
| Thêm **API call mới** (endpoint backend mới) | Gọi `api.get/post/patch/delete(...)` trong file `.jsx` tương ứng |
| Thay đổi **logic đăng nhập/đăng xuất** | `src/components/AuthContext.jsx` |
| Bảo vệ 1 route (yêu cầu login) | Bọc bằng `<ProtectedRoute>` trong `src/App.jsx` |

---

## 1. Thêm một button mới vào trang có sẵn

### Ví dụ: Thêm nút "Download" vào PhotoDetailPage

**Bước 1:** Mở file `src/pages/PhotoDetailPage.jsx`

**Bước 2:** Tìm vị trí muốn thêm (ví dụ dưới nút Back), thêm:

```jsx
<button onClick={() => window.open(`${API_ROOT}${photo.image_url}`, '_blank')}>
  Download
</button>
```

**Bước 3:** (Tuỳ chọn) Thêm CSS class nếu muốn style riêng:

```jsx
<button className="download-btn" onClick={...}>Download</button>
```

Rồi vào `src/styles.css` thêm:

```css
.download-btn {
  background: #2196f3;
  color: white;
}
```

**Bước 4:** Lưu file → Vite tự hot-reload → xem kết quả trên trình duyệt.

---

## 2. Thêm state + xử lý logic mới

### Công thức chung:

```jsx
// 1. Khai báo state (đặt TRONG function component, TRƯỚC return)
const [tenState, setTenState] = useState(giaTriBanDau);

// 2. Tạo hàm xử lý
const handleTenAction = async () => {
  try {
    // Gọi API hoặc xử lý logic
    const { data } = await api.post("/endpoint", { key: value });
    // Cập nhật state
    setTenState(data);
  } catch (err) {
    console.error(err);
  }
};

// 3. Gắn vào UI (trong phần return JSX)
<button onClick={handleTenAction}>Tên Nút</button>
<p>{tenState}</p>
```

### Ví dụ thực tế: Thêm bộ đếm lượt xem

```jsx
// Trong PhotoDetailPage, thêm:
const [views, setViews] = useState(0);

useEffect(() => {
  // Gọi API tăng view khi vào trang
  api.post(`/photos/${id}/view`).then(({ data }) => setViews(data.views));
}, [id]);

// Trong phần return JSX, thêm:
<small>👁️ {views} lượt xem</small>
```

---

## 3. Gọi API backend

### Các method có sẵn:

```jsx
import api from "../api";  // PHẢI import ở đầu file

// GET — Lấy dữ liệu
const { data } = await api.get("/photos");
const { data } = await api.get("/photos", { params: { search: "cat" } });

// POST — Tạo mới
const { data } = await api.post("/photos/", formData);

// PUT — Cập nhật toàn bộ
const { data } = await api.put(`/photos/${id}`, { title: "New", description: "..." });

// PATCH — Cập nhật 1 phần
const { data } = await api.patch(`/photos/${id}/favorite`);

// DELETE — Xóa
await api.delete(`/photos/${id}`);
```

> [!IMPORTANT]
> **Không cần tự thêm token!** File `api.js` đã có interceptor tự gắn `Authorization: Bearer <token>` vào mọi request.

### Gửi file (ảnh):

```jsx
const formData = new FormData();
formData.append("file", fileObject);        // File từ input
formData.append("title", "Tên ảnh");       // Các field khác
await api.post("/photos/", formData);       // Axios tự set Content-Type
```

---

## 4. Thêm một trang mới

### Bước 1: Tạo file `src/pages/NewPage.jsx`

```jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../components/AuthContext";

function NewPage() {
  const { user } = useAuth();  // Lấy thông tin user (nếu cần)

  return (
    <div className="gallery-page">  {/* Dùng class có sẵn hoặc tạo mới */}
      <header className="topbar card">
        <h1>Trang Mới</h1>
        <Link to="/" className="link-btn">Về Gallery</Link>
      </header>

      {/* Nội dung trang */}
      <div className="card" style={{ padding: "1rem" }}>
        <p>Xin chào {user.username}!</p>
      </div>
    </div>
  );
}

export default NewPage;
```

### Bước 2: Thêm route vào `src/App.jsx`

```jsx
// 1. Import ở đầu file
import NewPage from "./pages/NewPage";

// 2. Thêm Route trong <Routes> (TRƯỚC dòng path="*")
<Route
  path="/new-page"
  element={
    <ProtectedRoute>
      <NewPage />
    </ProtectedRoute>
  }
/>
```

### Bước 3: Thêm link navigate (tuỳ chọn)

Ở bất kỳ trang nào cần link đến:

```jsx
<Link to="/new-page" className="link-btn">Đi tới trang mới</Link>
```

---

## 5. Thêm/sửa CSS

### Nơi viết: `src/styles.css`

### Quy tắc đặt tên class (theo BEM):

```
.ten-component                  → Block chính
.ten-component__phan-con        → Element con
.ten-component__phan-con--trang-thai → Modifier (trạng thái)
```

Ví dụ:
```css
.photo-card { }                    /* Card ảnh */
.photo-card__heart { }             /* Nút tim trong card */
.photo-card__heart--active { }     /* Tim đang active (đỏ) */
```

### Các class có sẵn dùng lại được:

| Class | Hiệu ứng |
|-------|----------|
| `card` | Nền trắng mờ, bo góc, shadow |
| `ghost` | Button nền xám nhạt |
| `danger` | Button nền đỏ |
| `link-btn` | Link giống button cam |
| `row` | Flex row với gap |
| `error` | Nền đỏ nhạt cho lỗi |

### Ví dụ thêm class mới:

```css
/* Thêm vào cuối styles.css (TRƯỚC @media) */
.my-new-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.my-new-btn:hover {
  transform: translateY(-2px);
}
```

Sử dụng:
```jsx
<button className="my-new-btn">Nút Mới</button>
```

---

## Checklist trước khi lưu

- [ ] **Import đủ chưa?** — `useState`, `useEffect`, `api`, `Link`, `useAuth`...
- [ ] **State khai báo đúng chỗ?** — TRONG function component, TRƯỚC return
- [ ] **Hàm async có try/catch?** — Luôn bắt lỗi khi gọi API
- [ ] **JSX đóng tag đúng?** — `<img />`, `<input />` phải tự đóng
- [ ] **Key cho list?** — `{array.map(item => <div key={item.id}>...</div>)}`
- [ ] **CSS class đúng tên?** — JSX dùng `className` (KHÔNG phải `class`)

---

## Mẹo Debug nhanh

| Vấn đề | Cách kiểm tra |
|--------|---------------|
| UI không cập nhật | Mở Console (F12) → xem lỗi đỏ |
| API 401 Unauthorized | Token hết hạn → Logout rồi Login lại |
| API 404 Not Found | Kiểm tra URL endpoint trong backend |
| API 500 Server Error | Xem terminal backend → đọc traceback |
| CSS không áp dụng | Kiểm tra tên class đúng chưa, F12 → Elements → xem class |
| Component không hiện | Kiểm tra route trong App.jsx + import đúng chưa |
