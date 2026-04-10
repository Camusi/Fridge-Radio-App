import shutil
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
import json
import os
import uuid

app = FastAPI()

DATA_FILE = "data.json"
IMAGE_FOLDER = "api-images"

app.mount("/api-images", StaticFiles(directory=IMAGE_FOLDER), name="images")


class FeedOverwriteRequest(BaseModel):
    items: list[dict]


def load_data():
    if not os.path.exists(DATA_FILE):
        return {"items": []}
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


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
    save_data({"items": new_items})

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