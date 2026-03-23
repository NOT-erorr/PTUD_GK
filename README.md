# App 2 - Gallery App

Web app quan ly thu vien anh ca nhan voi dang ky/dang nhap, upload, xem danh sach, xem chi tiet, sua, xoa va tim kiem anh theo ten.

## Cong nghe
- Backend: FastAPI
- Frontend: ReactJS (Vite)
- Database: SQLite

## Cau truc thu muc
- `backend/`: API FastAPI + SQLite + upload files
- `frontend/`: giao dien React

## Tinh nang da co
- Dang ky, dang nhap (JWT)
- Upload anh
- Xem danh sach anh cua user dang nhap
- Xem chi tiet anh
- Sua ten/mo ta anh
- Xoa anh
- Tim kiem anh theo ten

## Chay bang Docker Compose
```bash
docker compose up --build
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

Dung he thong:
```bash
docker compose down
```

## Chay backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend chay tai: `http://localhost:8000`

## Chay frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend chay tai: `http://localhost:5173`

## API chinh
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/photos/` (multipart: `title`, `description`, `file`)
- `GET /api/photos?search=...`
- `GET /api/photos/{id}`
- `PUT /api/photos/{id}`
- `DELETE /api/photos/{id}`

## Ghi chu
- Anh duoc luu trong `backend/uploads/`.
- Du lieu SQLite duoc tao trong `backend/gallery.db` khi backend khoi dong.
- Trong moi truong production, hay doi `SECRET_KEY` trong `backend/app/auth.py`.
