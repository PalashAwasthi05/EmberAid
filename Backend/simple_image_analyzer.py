import os
import base64
from typing import Dict, Any, Optional
import openai
from dotenv import load_dotenv
import requests

# Load environment variables from .env file
load_dotenv()

# Set OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

class SimpleImageAnalyzer:
    """A simplified image analyzer that uses OpenAI's vision model without the agents library"""
    
    def analyze(self, image_path: str) -> Dict[str, Any]:
        """
        Analyzes an image using OpenAI's vision model.
        
        Args:
            image_path (str): Path to the image file
            
        Returns:
            dict: Object details including color, name, dimensions, and material
        """
        try:
            # Read the image file as binary data and encode properly
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
                
            # Convert binary data to base64 encoding
            base64_encoded = base64.b64encode(image_data).decode('utf-8')
            
            # Call the OpenAI Vision API
            client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text", 
                                "text": "Analyze this image and provide the following details. For dimensions, provide your best estimate as a single number (not a range). Format your response exactly like this example:\n\n"
                                       "Red\n"
                                       "Coffee Table\n"
                                       "45\n"
                                       "90\n"
                                       "60\n"
                                       "Wood\n\n"
                                       "Your response should contain exactly 6 lines in this order:\n"
                                       "1. Main color (one word)\n"
                                       "2. Object name (1-2 words)\n"
                                       "3. Height in centimeters (single number)\n"
                                       "4. Width in centimeters (single number)\n"
                                       "5. Depth in centimeters (single number)\n"
                                       "6. Primary material (1-2 words)"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_encoded}",
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300
            )
            
            # Parse the response into structured format
            try:
                lines = response.choices[0].message.content.strip().split('\n')
                return {
                    "color": lines[0].strip(),
                    "name": lines[1].strip(),
                    "height": float(lines[2].strip()),
                    "width": float(lines[3].strip()),
                    "depth": float(lines[4].strip()),
                    "material": lines[5].strip()
                }
            except Exception as e:
                print(f"Failed to parse response: {str(e)}")
                print(f"Raw response: {response.choices[0].message.content}")
                return {
                    "name": os.path.basename(image_path).split('_')[0],  # Use filename as fallback
                    "color": "Unknown",
                    "height": 0,
                    "width": 0,
                    "depth": 0,
                    "material": "Unknown"
                }
                
        except Exception as e:
            print(f"Error analyzing image {image_path}: {str(e)}")
            return {
                "name": os.path.basename(image_path).split('_')[0],  # Use filename as fallback
                "color": "Unknown", 
                "height": 0,
                "width": 0,
                "depth": 0,
                "material": "Unknown"
            } 