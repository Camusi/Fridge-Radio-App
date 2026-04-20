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

DATA_FILE = "data.json"
NOW_PLAYING_FILE = "now_playing.json"
IMAGE_FOLDER = "api-images"
CONFIG_FILE = "config.json"

app.mount("/api-images", StaticFiles(directory=IMAGE_FOLDER), name="images")


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


def load_data():
    if not os.path.exists(DATA_FILE):
        return {"items": []}
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_news(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def save_now_playing(artist, title):
    tmp = NOW_PLAYING_FILE + ".tmp"

    with open(tmp, "w", encoding="utf-8") as f:
        json.dump({
            "artist": artist,
            "title": title
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


API_KEY = load_config().get("API_KEY")
if not API_KEY:
    raise RuntimeError("API_KEY missing from config.json")


@app.get("/load-feed")
def get_feed(request: Request):
    data = load_data()
    base_url = str(request.base_url).rstrip("/")
    result = []

    for item in data["items"]:
        if item["type"] == "image":
            result.append({
                "id": item["id"],
                "type": "image",
                "value": f"{base_url}/api-images/{item['value']}",
            })
        else:
            result.append(item)

    return {"items": result}


@app.post("/update-feed")
async def overwrite_feed(
    request: Request,
    items: str = Form(...),
    files: List[UploadFile] = File([])
):
    payload = json.loads(items)

    # ---- load existing feed ----
    old_data = load_data()
    old_images = get_used_images(old_data["items"])

    uploaded_files = {}

    # ---- save uploaded images ----
    for file in files:
        filename = f"{uuid.uuid4()}_{file.filename}"
        filepath = os.path.join(IMAGE_FOLDER, filename)

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        uploaded_files[file.filename] = filename

    new_items = []

    # ---- rebuild feed ----
    for item in payload["items"]:
        if item["type"] == "text":
            new_items.append({
                "id": item.get("id", str(uuid.uuid4())),
                "type": "text",
                "value": item["value"],
            })

        elif item["type"] == "image":
            value = item["value"]

            # existing image
            if value.startswith("http") or value.startswith("/api-images/"):
                normalized = normalize_image_value(value)

            # new upload
            else:
                if value not in uploaded_files:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Missing upload for {value}"
                    )
                normalized = uploaded_files[value]

            new_items.append({
                "id": item.get("id", str(uuid.uuid4())),
                "type": "image",
                "value": normalized,
            })

        else:
            raise HTTPException(status_code=400, detail="Invalid type")

    # ---- save new feed ----
    save_news({"items": new_items})

    # ---- DELETE UNUSED IMAGES ----
    new_images = get_used_images(new_items)

    unused_images = old_images - new_images

    for filename in unused_images:
        path = os.path.join(IMAGE_FOLDER, filename)
        if os.path.exists(path):
            os.remove(path)

    # ---- return public feed ----
    base_url = str(request.base_url).rstrip("/")

    result = []
    for item in new_items:
        if item["type"] == "image":
            result.append({
                "id": item["id"],
                "type": "image",
                "value": f"{base_url}/api-images/{item['value']}",
            })
        else:
            result.append(item)

    return {
        "message": "Feed updated",
        "items": result
    }


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
        return {"artist": None, "title": None}

    try:
        with open(NOW_PLAYING_FILE, encoding="utf-8") as f:
            content = f.read().strip()

            if not content:
                return {"artist": None, "title": None}

            return json.loads(content)

    except (json.JSONDecodeError, FileNotFoundError):
        return {"artist": None, "title": None}