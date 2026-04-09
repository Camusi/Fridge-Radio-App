from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import json
import os
import uuid
import shutil

app = FastAPI()

DATA_FILE = "data.json"
IMAGE_FOLDER = "api-images"

# Ensure image folder exists
os.makedirs(IMAGE_FOLDER, exist_ok=True)

# Serve images
app.mount("/api-images", StaticFiles(directory=IMAGE_FOLDER), name="images")


# ---------- Models ----------
class DeleteRequest(BaseModel):
    id: str


class FeedOverwriteRequest(BaseModel):
    items: list[dict]


# ---------- Helpers ----------
def load_data():
    if not os.path.exists(DATA_FILE):
        return {"items": []}
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


# ---------- GET /feed ----------
@app.get("/feed")
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


def make_public_item(item, base_url):
    if item["type"] == "image":
        value = item["value"]
        if value.startswith("http://") or value.startswith("https://"):
            public_value = value
        elif value.startswith("/api-images/"):
            public_value = f"{base_url}{value}"
        else:
            public_value = f"{base_url}/api-images/{value}"

        return {
            "id": item["id"],
            "type": "image",
            "value": public_value,
        }

    return item


def normalize_image_value(value: str):
    if value.startswith("/api-images/"):
        return value.split("/api-images/")[-1].split("?")[0]
    if value.startswith("http://") or value.startswith("https://"):
        if "/api-images/" not in value:
            raise HTTPException(status_code=400, detail="Image URL must be from this server")
        return value.split("/api-images/")[-1].split("?")[0]
    return value


# ---------- POST /feed ----------
@app.post("/feed")
async def add_item(
    request: Request,
    type: str = Form(...),  # use str instead of Literal for Form compatibility
    value: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    data = load_data()

    if type == "text":
        if not value:
            raise HTTPException(status_code=400, detail="Text value required")
        new_item = {
            "id": str(uuid.uuid4()),
            "type": "text",
            "value": value
        }

    elif type == "image":
        if not file:
            raise HTTPException(status_code=400, detail="Image file required")

        # Save file
        filename = f"{uuid.uuid4()}_{file.filename}"
        filepath = os.path.join(IMAGE_FOLDER, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        new_item = {
            "id": str(uuid.uuid4()),
            "type": "image",
            "value": filename
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid type")

    data["items"].append(new_item)
    save_data(data)
    return {"message": "Item added", "item": make_public_item(new_item, str(request.base_url).rstrip("/"))}


# ---------- PUT /feed ----------
@app.put("/feed")
def overwrite_feed(request: Request, payload: FeedOverwriteRequest):
    items = []
    for item in payload.items:
        if item.get("type") == "text":
            if not item.get("value"):
                raise HTTPException(status_code=400, detail="Text value required")
            items.append({
                "id": item.get("id", str(uuid.uuid4())),
                "type": "text",
                "value": item["value"],
            })
        elif item.get("type") == "image":
            value = item.get("value")
            if not value:
                raise HTTPException(status_code=400, detail="Image value required")
            normalized = normalize_image_value(value)
            items.append({
                "id": item.get("id", str(uuid.uuid4())),
                "type": "image",
                "value": normalized,
            })
        else:
            raise HTTPException(status_code=400, detail="Invalid type")

    save_data({"items": items})
    base_url = str(request.base_url).rstrip("/")
    return {
        "message": "Feed overwritten",
        "items": [make_public_item(item, base_url) for item in items],
    }


# ---------- POST /delete ----------
@app.post("/delete")
def delete_item(req: DeleteRequest):
    data = load_data()
    items = data["items"]

    for i, item in enumerate(items):
        if item["id"] == req.id:
            deleted = items.pop(i)
            save_data(data)

            if deleted["type"] == "image":
                image_path = os.path.join(IMAGE_FOLDER, deleted["value"])
                if os.path.exists(image_path):
                    os.remove(image_path)

            return {"message": "Item deleted", "deleted": deleted}

    raise HTTPException(status_code=404, detail="Item not found")