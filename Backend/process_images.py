import openai
import os
import agentops
from agents import Agent, Runner
from base64 import b64encode
from typing import Optional
import json
from dotenv import load_dotenv
from PriceScraper.__init__ import get_product_price

# Load environment variables from .env file
load_dotenv()

# Check if API key is set
agentops_api_key = os.getenv("AGENTOPS_API_KEY")
if not agentops_api_key:
    raise ValueError("AGENTOPS_API_KEY environment variable is not set")

# Initialize agentops (this will verify the connection)
try:
    agentops.init(api_key=agentops_api_key)
    print("AgentOps initialized successfully!")
except Exception as e:
    print(f"Failed to initialize AgentOps: {str(e)}")

openai_api_key = os.getenv("OPENAI_API_KEY")

def analyze_image(image_path: str) -> dict:
    """
    Analyzes a PNG image using OpenAI's vision model and returns structured object details.
    
    Args:
        image_path (str): Path to the PNG image file
        
    Returns:
        dict: Object details including color, name, dimensions, and material
    """
    # Read and encode the image
    with open(image_path, "rb") as image_file:
        image_data = image_file.read()
    base64_image = b64encode(image_data).decode('utf-8')
    
    # Create the message with the image
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Analyze this image and provide the following details about the object. Be specific and realistic with your estimates. Format your response exactly like this example:\n\n"
                           "Brown\n"
                           "Dining Chair\n"
                           "89\n"
                           "45\n"
                           "50\n"
                           "Wood\n\n"
                           "Your response should contain exactly 6 lines in this order:\n"
                           "1. Main color (one word)\n"
                           "2. Object name (1-3 words, be specific)\n"
                           "3. Height in centimeters (single number)\n"
                           "4. Width in centimeters (single number)\n"
                           "5. Depth in centimeters (single number)\n"
                           "6. Primary material (one word)"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                    }
                }
            ]
        }
    ]
    
    # Make the API call
    response = openai.chat.completions.create(
        model="gpt-4-vision-preview",
        messages=messages,
        max_tokens=300
    )
    
    # Parse the response into structured format
    lines = response.choices[0].message.content.strip().split('\n')
    if len(lines) >= 6:
        return {
            "color": lines[0].strip(),
            "name": lines[1].strip(),
            "height": float(lines[2].strip()),
            "width": float(lines[3].strip()),
            "depth": float(lines[4].strip()),
            "material": lines[5].strip()
        }
    else:
        raise ValueError("Incomplete response from OpenAI")

def analyze_image_folder(folder_path: str) -> list[dict]:
    """
    Analyzes all PNG images in a specified folder using OpenAI's vision model.
    
    Args:
        folder_path (str): Path to the folder containing image files
        
    Returns:
        list[dict]: List of object details for each image, including color, name, dimensions, and material
    """
    results = []
    supported_extensions = ('.png', '.jpg', '.jpeg')
    
    # Iterate through all files in the folder
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(supported_extensions):
            image_path = os.path.join("/Users/anthonycampos/Desktop/EmberAid/Backend/detected_objects", filename)
            try:
                analysis = analyze_image(image_path)
                # Add filename to the analysis result
                analysis['filename'] = filename
                results.append(analysis)
            except Exception as e:
                results.append({
                    "filename": filename,
                    "error": f"Failed to analyze image: {str(e)}"
                })
    
    return results

class ImageAnalysisAgent(Agent):
    def __init__(self, name: Optional[str] = "Image Analyzer"):
        super().__init__(name)
        self.client = openai.OpenAI(api_key=openai_api_key)
    
    def analyze(self, image_path: str) -> dict:
        """
        Analyzes an image using the OpenAI vision model.
        
        Args:
            image_path (str): Path to the image file
            
        Returns:
            dict: Object details including color, name, dimensions, and material
        """
        try:
            # Read and encode the image
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
            base64_image = b64encode(image_data).decode('utf-8')
            
            # Create the message with the image
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze this image and provide the following details about the object. Be specific and realistic with your estimates. Format your response exactly like this example:\n\n"
                                   "Brown\n"
                                   "Dining Chair\n"
                                   "89\n"
                                   "45\n"
                                   "50\n"
                                   "Wood\n\n"
                                   "Your response should contain exactly 6 lines in this order:\n"
                                   "1. Main color (one word)\n"
                                   "2. Object name (1-3 words, be specific)\n"
                                   "3. Height in centimeters (single number)\n"
                                   "4. Width in centimeters (single number)\n"
                                   "5. Depth in centimeters (single number)\n"
                                   "6. Primary material (one word)"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ]
            
            # Make the API call
            response = self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=messages,
                max_tokens=300
            )
            
            # Parse the response into structured format
            lines = response.choices[0].message.content.strip().split('\n')
            if len(lines) >= 6:
                return {
                    "color": lines[0].strip(),
                    "name": lines[1].strip(),
                    "height": float(lines[2].strip()),
                    "width": float(lines[3].strip()),
                    "depth": float(lines[4].strip()),
                    "material": lines[5].strip()
                }
            else:
                raise ValueError("Incomplete response from OpenAI")
                
        except Exception as e:
            print(f"Error analyzing image {image_path}: {str(e)}")
            # Return a basic response with just the filename
            base_name = os.path.basename(image_path)
            object_name = base_name.split('_')[0].replace('.png', '')
            return {
                "name": object_name,
                "color": None,
                "height": None,
                "width": None,
                "depth": None,
                "material": None
            }

    def analyze_folder(self, folder_path: str) -> list[dict]:
        """
        Analyzes all images in a folder using the OpenAI vision model.
        
        Args:
            folder_path (str): Path to the folder containing image files
            
        Returns:
            list[dict]: List of object details for each image
        """
        return analyze_image_folder(folder_path)

def print_analysis_results(results: list[dict]) -> None:
    """
    Prints the analysis results in a human-readable format.
    
    Args:
        results (list[dict]): List of analysis results from analyze_image_folder
    """
    print("\n=== Image Analysis Results ===\n")
    
    for result in results:
        print(f"📸 File: {result['filename']}")
        print("─" * 40)
        
        if 'error' in result:
            print(f"❌ Error: {result['error']}\n")
        else:
            print(f"🎨 Color: {result['color']}")
            print(f"📦 Object: {result['name']}")
            print(f"📏 Dimensions: {result['height']}cm x {result['width']}cm x {result['depth']}cm")
            print(f"🏗️ Material: {result['material']}\n")


def produce_output():
    agent = ImageAnalysisAgent()
    analysis = agent.analyze_folder("detected_objects")
    documentation = []
    for result in analysis:
        documentation.append(get_product_price(result))
    return documentation

# def main():
#     # Create an instance of the ImageAnalysisAgent
#     agent = ImageAnalysisAgent()

#     # Analyze all images in the detected_objects folder
#     results = agent.analyze_folder("detected_objects")

#     # Print both formatted and JSON results
#     print_analysis_results(results)
#     print("\nRaw JSON output:")
#     print(json.dumps(results, indent=2))

# def test_agent():
#     try:
#         agent = ImageAnalysisAgent()
#         print("ImageAnalysisAgent created successfully!")
#         return True
#     except Exception as e:
#         print(f"Failed to create ImageAnalysisAgent: {str(e)}")
#         return False

# if __name__ == "__main__":
#     if test_agent():
#         main()

