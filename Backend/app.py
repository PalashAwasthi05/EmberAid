from fastapi import FastAPI, UploadFile, File
import shutil
import os
from Backend.BoundingBoxes.Bounding_Boxes import detect_and_crop_objects
from typing import List
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure upload and output directories
UPLOAD_DIR = "uploaded_images"
OUTPUT_DIR = "detected_objects"

# Create directories if they don't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/detect-objects/")
async def upload_and_detect_objects(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            return JSONResponse(
                status_code=400,
                content={"error": "Only image files are allowed"}
            )
        
        # Create file path for uploaded image
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process the image using your existing function
        output_folder = os.path.join(OUTPUT_DIR, f"{os.path.splitext(file.filename)[0]}")
        detect_and_crop_objects(file_path, output_folder)

        
        
        return {
            "message": "Image processed successfully",
            "original_image": file.filename,
            "output_directory": output_folder
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"An error occurred: {str(e)}"}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
