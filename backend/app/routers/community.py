from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/community", tags=["community"])


def _post_to_dict(post: models.CommunityPost) -> dict:
    """Convert a CommunityPost ORM object to a dict matching CommunityPostOut."""
    return {
        "id": post.id,
        "caption": post.caption,
        "image_url": post.image_url,
        "created_at": post.created_at,
        "user_id": post.user_id,
        "username": post.author.username,
        "photo_id": post.photo_id,
        "comments": [
            {
                "id": c.id,
                "text": c.text,
                "created_at": c.created_at,
                "user_id": c.user_id,
                "username": c.author.username,
                "post_id": c.post_id,
            }
            for c in post.comments
        ],
    }


@router.post("/", response_model=schemas.CommunityPostOut, status_code=status.HTTP_201_CREATED)
def share_to_community(
    photo_id: int = Form(...),
    caption: str | None = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo = (
        db.query(models.Photo)
        .filter(models.Photo.id == photo_id, models.Photo.user_id == current_user.id)
        .first()
    )
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found or not yours")

    post = models.CommunityPost(
        caption=caption,
        image_url=photo.image_url,
        user_id=current_user.id,
        photo_id=photo.id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # reload with relationships
    post = (
        db.query(models.CommunityPost)
        .options(joinedload(models.CommunityPost.author), joinedload(models.CommunityPost.comments))
        .filter(models.CommunityPost.id == post.id)
        .first()
    )
    return _post_to_dict(post)


@router.get("/", response_model=list[schemas.CommunityPostOut])
def list_community_posts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    posts = (
        db.query(models.CommunityPost)
        .options(
            joinedload(models.CommunityPost.author),
            joinedload(models.CommunityPost.comments).joinedload(models.Comment.author),
        )
        .order_by(models.CommunityPost.created_at.desc())
        .all()
    )
    return [_post_to_dict(p) for p in posts]


@router.post("/{post_id}/comments", response_model=schemas.CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    post_id: int,
    payload: schemas.CommentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = models.Comment(
        text=payload.text,
        user_id=current_user.id,
        post_id=post_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return {
        "id": comment.id,
        "text": comment.text,
        "created_at": comment.created_at,
        "user_id": comment.user_id,
        "username": current_user.username,
        "post_id": comment.post_id,
    }


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_community_post(
    post_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if post.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
        
    db.delete(post)
    db.commit()
