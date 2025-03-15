from ultralytics import YOLO
import cv2
from PIL import Image
import os
import numpy as np

def detect_and_crop_objects(image_path, output_folder):
    model = YOLO('yolov8n.pt')
    
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    image = cv2.imread(image_path)
    
    results = model(image)
    
    for idx, detection in enumerate(results[0].boxes.data):
        x1, y1, x2, y2, conf, cls = detection.tolist()
        x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
        
        class_name = results[0].names[int(cls)]
        
        cropped_object = image[y1:y2, x1:x2]
        
        output_path = os.path.join(output_folder, f"{class_name}_{idx}_conf{conf:.2f}.jpg")
        cv2.imwrite(output_path, cropped_object)

if __name__ == "__main__":
    image_path = "image.jpg"
    output_folder = "detected_objects"
    detect_and_crop_objects(image_path, output_folder)
