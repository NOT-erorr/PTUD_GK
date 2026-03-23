import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/photos", tags=["photos"])
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


@router.post("/", response_model=schemas.PhotoOut, status_code=status.HTTP_201_CREATED)
def upload_photo(
    title: str = Form(...),
    description: str | None = Form(None),
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "").suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    file_name = f"{uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / file_name

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    photo = models.Photo(
        title=title,
        description=description,
        image_url=f"/uploads/{file_name}",
        user_id=current_user.id,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.get("/", response_model=list[schemas.PhotoOut])
def list_photos(
    search: str | None = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Photo).filter(models.Photo.user_id == current_user.id)
    if search:
        query = query.filter(models.Photo.title.ilike(f"%{search}%"))
    return query.order_by(models.Photo.uploaded_at.desc()).all()


@router.get("/{photo_id}", response_model=schemas.PhotoOut)
def get_photo(
    photo_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo = (
        db.query(models.Photo)
        .filter(models.Photo.id == photo_id, models.Photo.user_id == current_user.id)
        .first()
    )
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    return photo


@router.put("/{photo_id}", response_model=schemas.PhotoOut)
def update_photo(
    photo_id: int,
    payload: schemas.PhotoUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo = (
        db.query(models.Photo)
        .filter(models.Photo.id == photo_id, models.Photo.user_id == current_user.id)
        .first()
    )
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    photo.title = payload.title
    photo.description = payload.description
    db.commit()
    db.refresh(photo)
    return photo


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(
    photo_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo = (
        db.query(models.Photo)
        .filter(models.Photo.id == photo_id, models.Photo.user_id == current_user.id)
        .first()
    )
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    image_file = Path(__file__).resolve().parents[2] / photo.image_url.lstrip("/")
    if image_file.exists() and image_file.is_file():
        os.remove(image_file)

    db.delete(photo)
    db.commit()
