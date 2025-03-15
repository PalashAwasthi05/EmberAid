from ultralytics import YOLO
import cv2
from PIL import Image
import os
import numpy as np

def detect_and_crop_objects(image_path, output_folder):
    # Load YOLOv8 model
    model = YOLO('yolov8n.pt')  # n for nano, can use 's' for small, 'm' for medium, 'l' for large, 'x' for xlarge
    
    # Create output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Read image
    image = cv2.imread(image_path)
    
    # Perform detection
    results = model(image)
    
    # Process detections
    for idx, detection in enumerate(results[0].boxes.data):
        # Get coordinates, confidence and class
        x1, y1, x2, y2, conf, cls = detection.tolist()
        x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
        
        # Get class name
        class_name = results[0].names[int(cls)]
        
        # Crop the object
        cropped_object = image[y1:y2, x1:x2]
        
        # Save the cropped image
        output_path = os.path.join(output_folder, f"{class_name}_{idx}_conf{conf:.2f}.jpg")
        cv2.imwrite(output_path, cropped_object)

if __name__ == "__main__":
    image_path = "image.jpg"
    output_folder = "detected_objects"
    detect_and_crop_objects(image_path, output_folder)
