from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import uuid
import os
import numpy as np
import cv2
from ultralytics import YOLO
import base64
from PIL import Image
import io
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

# Import price scraper
from PriceScraper import get_product_price

app = FastAPI()

# Configure CORS to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO model - do this once at startup for efficiency
model = YOLO('yolov8n.pt')

# Temporary folder for uploads
UPLOAD_FOLDER = "temp_uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class DetectedItem(BaseModel):
    id: str
    label: str
    boundingBox: Dict[str, float]
    estimatedValue: Optional[float] = None
    valueSource: Optional[str] = None
    sourceUrl: Optional[str] = None
    isPriceModified: bool = False

@app.post("/api/detect-objects", response_model=List[DetectedItem])
async def detect_objects(file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save uploaded file
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}_{file.filename}")
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    try:
        # Run object detection
        image = cv2.imread(file_path)
        results = model(image)
        
        detected_items = []
        
        for idx, detection in enumerate(results[0].boxes.data):
            x1, y1, x2, y2, conf, cls = detection.tolist()
            x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
            
            # Get class name from the model's class names dictionary
            class_name = results[0].names[int(cls)]
            
            # Calculate normalized bounding box coordinates (0-1 range)
            img_height, img_width = image.shape[:2]
            
            # Calculate normalized values
            norm_x = x1 / img_width
            norm_y = y1 / img_height
            norm_width = (x2 - x1) / img_width
            norm_height = (y2 - y1) / img_height
            
            # Extract cropped object for additional processing if needed
            cropped_object = image[y1:y2, x1:x2]
            
            # Create item dictionary for detected object
            item_id = f"{file_id}_{idx}"
            
            # Create product info for price search
            product_info = {
                "name": class_name,
                # You would ideally have more details like color, material, etc.
                # These could come from additional ML models or image analysis
            }
            
            # Get pricing information
            pricing_result = get_product_price(product_info)
            
            # Extract price if found, otherwise None
            price = None
            value_source = None
            source_url = None
            
            if pricing_result and "price" in pricing_result:
                # Try to extract numeric price from string like "$123.45"
                price_str = pricing_result.get("price", "").replace("$", "").replace(",", "")
                try:
                    price = float(price_str)
                except (ValueError, TypeError):
                    price = None
                
                value_source = pricing_result.get("source", None)
                source_url = pricing_result.get("link", None)
            
            detected_item = DetectedItem(
                id=item_id,
                label=class_name,
                boundingBox={
                    "x": norm_x,
                    "y": norm_y,
                    "width": norm_width,
                    "height": norm_height
                },
                estimatedValue=price,
                valueSource=value_source,
                sourceUrl=source_url,
                isPriceModified=False
            )
            
            detected_items.append(detected_item)
        
        return detected_items
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    finally:
        # Clean up the file after processing
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True) 