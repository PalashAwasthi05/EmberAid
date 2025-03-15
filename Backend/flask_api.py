from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import cv2
import numpy as np
from PIL import Image
import io
import base64
from ultralytics import YOLO
import traceback
from dotenv import load_dotenv
import re
import sys

# Import price scraper and simplified image analyzer
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from PriceScraper import get_product_price
from simple_image_analyzer import SimpleImageAnalyzer

# Load environment variables
load_dotenv()

flask_api = Flask(__name__)
CORS(flask_api)  # Enable CORS for all routes

# Load YOLO model
model = YOLO('yolov8n.pt')

# Initialize image analysis
image_analyzer = SimpleImageAnalyzer()

# Temporary folders
UPLOAD_FOLDER = "temp_uploads"
DETECTED_OBJECTS_FOLDER = "detected_objects"

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DETECTED_OBJECTS_FOLDER, exist_ok=True)

@flask_api.route('/api/detect-objects', methods=['POST'])
def detect_objects():
    if 'file' not in request.files:
        return jsonify({"detail": "No file provided"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"detail": "No file selected"}), 400

    # Check file type
    if not file.content_type.startswith('image/'):
        return jsonify({"detail": "File must be an image"}), 400
    
    # Generate unique filename and save
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}_{file.filename}")
    file.save(file_path)
    
    # Clean detected objects folder before processing new image
    for filename in os.listdir(DETECTED_OBJECTS_FOLDER):
        os.remove(os.path.join(DETECTED_OBJECTS_FOLDER, filename))
    
    try:
        # Run object detection
        image = cv2.imread(file_path)
        results = model(image)
        
        detected_items = []
        
        for idx, detection in enumerate(results[0].boxes.data):
            x1, y1, x2, y2, conf, cls = detection.tolist()
            x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
            
            class_name = results[0].names[int(cls)]
            
            # Calculate normalized coordinates
            img_height, img_width = image.shape[:2]
            norm_x = x1 / img_width
            norm_y = y1 / img_height
            norm_width = (x2 - x1) / img_width
            norm_height = (y2 - y1) / img_height
            
            # Extract and save cropped object
            cropped_object = image[y1:y2, x1:x2]
            
            # Convert BGR to RGB (OpenCV uses BGR by default)
            cropped_object_rgb = cv2.cvtColor(cropped_object, cv2.COLOR_BGR2RGB)
            
            # Save as JPEG using PIL (which handles image formats better)
            cropped_path = os.path.join(DETECTED_OBJECTS_FOLDER, f"{class_name}_{idx}.jpg")
            Image.fromarray(cropped_object_rgb).save(cropped_path, format='JPEG', quality=95)
            
            try:
                # Analyze the cropped image
                analysis = image_analyzer.analyze(cropped_path)
                
                product_info = {
                    "name": analysis.get("name", class_name),
                    "color": analysis.get("color"),
                    "height": analysis.get("height"),
                    "width": analysis.get("width"),
                    "depth": analysis.get("depth"),
                    "material": analysis.get("material")
                }
            except Exception as analysis_error:
                print(f"Error analyzing image {cropped_path}: {str(analysis_error)}")
                product_info = {
                    "name": class_name
                }
            
            # Get pricing information
            pricing_result = get_product_price(product_info)
            
            # Extract price if found, otherwise None
            price = None
            value_source = None
            source_url = None
            
            if pricing_result and "price" in pricing_result:
                # Try to extract numeric price from string like "$123.45" or "Now$21999Now $219.99"
                price_str = pricing_result.get("price", "")
                
                # Clean up the price string
                # First, try to find a pattern like "$XXX.XX" in the string
                price_matches = re.findall(r'\$(\d+\.\d+)', price_str)
                
                if price_matches:
                    # Take the first match that looks like a proper price
                    try:
                        price = float(price_matches[0])
                    except (ValueError, TypeError):
                        price = None
                else:
                    # If no matches found, try the original approach with some more cleanup
                    price_str = price_str.replace("$", "").replace(",", "")
                    # Remove any text around the price
                    price_str = re.sub(r'[^\d.]', '', price_str)
                    try:
                        price = float(price_str)
                        # If price seems unreasonably high for a single item, divide by 10
                        if price > 10000:
                            price = price / 10
                    except (ValueError, TypeError):
                        price = None
                
                # Get source information
                value_source = pricing_result.get("source", None)
                source_url = pricing_result.get("link", None)
                
                # If we found multiple items (e.g., "Set of 5 chairs"), try to divide the price
                item_description = pricing_result.get("title", "").lower()
                set_match = re.search(r'set of (\d+)', item_description)
                if set_match and price is not None:
                    try:
                        num_items = int(set_match.group(1))
                        if num_items > 1:
                            price = price / num_items
                            print(f"Adjusted price for set: {price_str} → ${price:.2f} each (set of {num_items})")
                    except (ValueError, TypeError):
                        pass
            
            # Create the final object with all attributes
            detected_item = {
                "id": f"{file_id}_{idx}",
                "label": product_info.get("name", class_name),
                "boundingBox": {
                    "x": norm_x,
                    "y": norm_y,
                    "width": norm_width,
                    "height": norm_height
                },
                "estimatedValue": price,
                "valueSource": value_source,
                "sourceUrl": source_url,
                "isPriceModified": False,
                # Add additional details that might be useful on the frontend
                "details": {
                    "color": product_info.get("color"),
                    "material": product_info.get("material"),
                    "dimensions": f"{product_info.get('height', 0)}cm x {product_info.get('width', 0)}cm x {product_info.get('depth', 0)}cm"
                }
            }
            
            detected_items.append(detected_item)
        
        return jsonify(detected_items)
    
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"detail": f"Error processing image: {str(e)}"}), 500
    
    finally:
        # Clean up the uploaded file after processing
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == '__main__':
    flask_api.run(host='0.0.0.0', port=8000, debug=True) 