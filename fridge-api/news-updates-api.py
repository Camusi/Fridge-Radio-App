import shutil
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Header
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

app = FastAPI()

UPDATES_DATA_FILE = "updates.json"
INFO_DATA_FILE = "info.json"
NOW_PLAYING_FILE = "now_playing.json"
IMAGE_FOLDER = "api-images"
UPDATES_IMAGE_FOLDER = IMAGE_FOLDER + "/updates"
INFO_IMAGE_FOLDER = IMAGE_FOLDER + "/info"
CONFIG_FILE = "config.json"

app.mount("/api-images", StaticFiles(directory=IMAGE_FOLDER), name="images")


class PasswordRequest(BaseModel):
    passwordHash: str


class FeedOverwriteRequest(BaseModel):
    items: list[dict]


class NowPlaying(BaseModel):
    Song_Artist: Optional[str] = None
    Song_Title: Optional[str] = None


def load_config():
    if not os.path.exists(CONFIG_FILE):
        raise RuntimeError("config.json not found")

    with open(CONFIG_FILE, encoding="utf-8") as f:
        return json.load(f)


def load_data(data_file):
    if not os.path.exists(data_file):
        return {"items": []}
    with open(data_file, encoding="utf-8") as f:
        return json.load(f)


def save_feed(data, data_file):
    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def save_now_playing(artist, title):
    tmp = NOW_PLAYING_FILE + ".tmp"

    with open(tmp, "w", encoding="utf-8") as f:
        json.dump({
            "Song_Artist": artist,
            "Song_Title": title
        }, f)

    os.replace(tmp, NOW_PLAYING_FILE)


def get_used_images(items):
    return {
        item["value"]
        for item in items
        if item["type"] == "image"
    }


def normalize_image_value(value: str):
    if value.startswith("/api-images/"):
        return value.split("/api-images/")[-1].split("?")[0]
    if value.startswith("http://") or value.startswith("https://"):
        if "/api-images/" not in value:
            raise HTTPException(status_code=400, detail="Image URL must be from this server")
        return value.split("/api-images/")[-1].split("?")[0]
    return value


def build_public_feed(items, base_url: str):
    base_url = base_url.rstrip("/")

    result = []

    for item in items:
        if item["type"] == "image":
            result.append({
                "id": item["id"],
                "type": "image",
                "value": f"{base_url}/api-images/{item['value']}",
                "link": item.get("link"),   # <-- FIX
            })
        else:
            result.append({
                "id": item["id"],
                "type": "text",
                "value": item["value"],
                "link": item.get("link"),   # <-- FIX
            })

    return result


def validate_admin(password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")


def save_uploaded_files(files: List[UploadFile], image_folder) -> dict:
    uploaded = {}

    for file in files:
        filename = f"{uuid.uuid4()}_{file.filename}"
        filepath = os.path.join(image_folder, filename)

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        uploaded[file.filename] = f"{os.path.basename(image_folder)}/{filename}"

    return uploaded


def rebuild_items(payload_items, uploaded_files):
    new_items = []

    for item in payload_items:
        link = item.get("link")  # <-- keep the link

        if item["type"] == "text":
            new_items.append({
                "id": item.get("id", str(uuid.uuid4())),
                "type": "text",
                "value": item["value"],
                "link": link,   # <-- save it
            })

        elif item["type"] == "image":
            value = item["value"]

            if value.startswith("http") or value.startswith("/api-images/"):
                normalized = normalize_image_value(value)
            else:
                if value not in uploaded_files:
                    raise HTTPException(status_code=400, detail=f"Missing upload for {value}")
                normalized = uploaded_files[value]

            new_items.append({
                "id": item.get("id", str(uuid.uuid4())),
                "type": "image",
                "value": normalized,
                "link": link,   # <-- save it
            })

        else:
            raise HTTPException(status_code=400, detail="Invalid type")

    return new_items


def cleanup_images(old_items, new_items, image_folder):
    old_images = get_used_images(old_items)
    new_images = get_used_images(new_items)

    unused = old_images - new_images

    for filename in unused:
        # Strip feed prefix if present (e.g. "updates/123.jpg" → "123.jpg")
        clean_name = filename.split("/", 1)[-1]
        full_path = os.path.join(image_folder, clean_name)

        try:
            os.remove(full_path)
        except Exception as e:
            logger.error(f"Failed to delete {full_path}: {e}")


API_KEY = load_config().get("API_KEY")
ADMIN_PASSWORD = load_config().get("ADMIN_PASSWORD")
if not API_KEY or not ADMIN_PASSWORD:
    raise RuntimeError("API_KEY or ADMIN_PASSWORD missing from config.json")


@app.get("/load-feed/updates")
def get_feed(request: Request):
    data = load_data(UPDATES_DATA_FILE)
    return {"items": build_public_feed(data["items"], str(request.base_url))}


@app.post("/update-feed/updates")
async def overwrite_feed(
    request: Request,
    password: str = Form(...),
    items: str = Form(...),
    files: List[UploadFile] = File([])
):
    validate_admin(password)
    payload = json.loads(items)
    old_data = load_data(UPDATES_DATA_FILE)
    uploaded_files = save_uploaded_files(files, UPDATES_IMAGE_FOLDER)
    new_items = rebuild_items(payload["items"], uploaded_files)
    save_feed({"items": new_items}, UPDATES_DATA_FILE)
    cleanup_images(old_data["items"], new_items, UPDATES_IMAGE_FOLDER)

    return {
        "message": "Feed updated",
        "items": build_public_feed(new_items, str(request.base_url))
    }


@app.get("/load-feed/info")
def get_feed(request: Request):
    data = load_data(INFO_DATA_FILE)
    return {"items": build_public_feed(data["items"], str(request.base_url))}


@app.post("/update-feed/info")
async def overwrite_feed(
    request: Request,
    password: str = Form(...),
    items: str = Form(...),
    files: List[UploadFile] = File([])
):
    validate_admin(password)
    payload = json.loads(items)
    old_data = load_data(INFO_DATA_FILE)
    uploaded_files = save_uploaded_files(files, INFO_IMAGE_FOLDER)
    new_items = rebuild_items(payload["items"], uploaded_files)
    save_feed({"items": new_items}, INFO_DATA_FILE)
    cleanup_images(old_data["items"], new_items, INFO_IMAGE_FOLDER)

    return {
        "message": "Feed updated",
        "items": build_public_feed(new_items, str(request.base_url))
    }


@app.post("/check-password")
def check_password(data: PasswordRequest):
    return data.passwordHash == ADMIN_PASSWORD


@app.post("/api/now-playing")
async def now_playing(
        data: NowPlaying,
        x_api_key: str = Header(None, alias="X-API-Key")
):
    # Authenticate
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")

    # Handle different field naming
    artist = data.Song_Artist
    title = data.Song_Title

    if not artist or not title:
        raise HTTPException(status_code=400, detail="Missing metadata")

    current = get_now_playing()

    if current and current["Song_Artist"] == artist and current["Song_Title"] == title:
        return {"status": "unchanged"}

    logger.info(f"NOW PLAYING: {artist} - {title}")

    save_now_playing(artist, title)

    return {"status": "received"}


@app.get("/api/now-playing")
def get_now_playing():
    if not os.path.exists(NOW_PLAYING_FILE):
        return {"Song_Artist": None, "Song_Title": None}

    try:
        with open(NOW_PLAYING_FILE, encoding="utf-8") as f:
            content = f.read().strip()

            if not content:
                return {"Song_Artist": None, "Song_Title": None}

            return json.loads(content)

    except (json.JSONDecodeError, FileNotFoundError):
        return {"Song_Artist": None, "Song_Title": None}