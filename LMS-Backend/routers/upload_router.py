"""Image upload router — /upload/* (mobile app DCL Upload feature).

The app posts a multipart image with location/device metadata; the row goes to
IMG_UPLOAD_TRACKING and the file to IMG_UPLOADS_ROOT. History and image
serving back the app's History tab (thumbnails via /upload/image/{filename}).
"""

import os

from fastapi import APIRouter, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse

from repositories.img_upload_repository import (
    UPLOADS_ROOT, build_filename, get_upload_history,
    insert_upload_record, safe_image_path,
)

router = APIRouter(prefix="/upload", tags=["Image Upload"])

IMAGE_EXT = {"png", "jpg", "jpeg", "webp", "gif", "bmp", "heic"}
MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # phone camera JPEGs are well under this


@router.post("/")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    empcode: str = Form(...),
    mobile_no: str = Form(...),
    attendance_type: str = Form(None),
    latitude: str = Form(None),
    longitude: str = Form(None),
    accuracy: str = Form(None),
    location_name: str = Form(None),
    device_type: str = Form(None),
    device_model: str = Form(None),
    device_id: str = Form(None),
    app_version: str = Form(None),
    timestamp_str: str = Form(None),
    address: str = Form(None),
    formatted_address: str = Form(None),
):
    ext = (os.path.splitext(file.filename or "")[1] or "").lstrip(".").lower()
    if ext not in IMAGE_EXT:
        raise HTTPException(status_code=400, detail=f"File type .{ext or '?'} not allowed")
    if not empcode.strip():
        raise HTTPException(status_code=400, detail="empcode is required")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 15 MB)")

    filename = build_filename(empcode, ext)
    os.makedirs(UPLOADS_ROOT, exist_ok=True)
    dest = os.path.join(UPLOADS_ROOT, filename)
    try:
        with open(dest, "wb") as f:
            f.write(content)
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    try:
        tid = insert_upload_record(
            empcode.strip(), mobile_no, filename,
            attendance_type=attendance_type,
            latitude=latitude, longitude=longitude, accuracy=accuracy,
            location_name=location_name, address=address,
            formatted_address=formatted_address, timestamp_str=timestamp_str,
            device_type=device_type, device_model=device_model,
            device_id=device_id, app_version=app_version,
            client_ip=(request.client.host if request.client else None),
        )
    except Exception as e:
        # DB insert failed — remove the orphaned file so disk and table agree.
        try:
            os.remove(dest)
        except OSError:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to record upload: {e}")

    return {
        "status": "success",
        "tid": tid,
        "filename": filename,
        "message": "Image uploaded successfully",
    }


@router.get("/history/{empcode}")
def upload_history(empcode: str, limit: int = Query(50, ge=1, le=200)):
    try:
        return {"items": get_upload_history(empcode, limit)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load history: {e}")


@router.get("/image/{filename}")
def get_uploaded_image(filename: str):
    path = safe_image_path(filename)
    if not path:
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path, headers={"Cache-Control": "public, max-age=86400"})
