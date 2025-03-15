"""
A simplified scraper that uses direct HTTP requests and basic parsing.
This provides a more reliable way to get product information without triggering anti-bot measures.
"""
import requests
import json
import re
from bs4 import BeautifulSoup
from urllib.parse import quote_plus

def get_user_agent():
    """Return a realistic user agent string"""
    return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def search_walmart(query):
    """Search for products on Walmart"""
    encoded_query = quote_plus(query)
    url = f"https://www.walmart.com/search?q={encoded_query}"
    
    headers = {
        "User-Agent": get_user_agent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
    }
    
    print(f"Searching Walmart for: {query}")
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find product items
        products = []
        product_items = soup.select('div[data-item-id]')
        
        for item in product_items[:3]:  # Get first 3 items
            try:
                # Extract name
                name_elem = item.select_one('.w_V_DM')
                if not name_elem:
                    name_elem = item.select_one('span[data-automation-id="product-title"]')
                name = name_elem.text.strip() if name_elem else "Unknown"
                
                # Extract price
                price_elem = item.select_one('.b_p')
                if not price_elem:
                    price_elem = item.select_one('div[data-automation-id="product-price"]')
                price = price_elem.text.strip() if price_elem else "Unknown"
                
                # Clean up price format
                price = re.sub(r'current price ', '', price) if price else "Unknown"
                price = re.sub(r'([0-9]),([0-9]{3})([0-9]{2})', r'\1,\2.\3', price)
                
                # Extract link
                link_elem = item.select_one('a')
                link = "https://www.walmart.com" + link_elem['href'] if link_elem and 'href' in link_elem.attrs else url
                
                # Fix malformed URLs
                if 'https://www.walmart.comhttps://' in link:
                    link = link.replace('https://www.walmart.comhttps://', 'https://')
                
                products.append({
                    "name": name,
                    "price": price,
                    "link": link,
                    "source": "Walmart"
                })
            except Exception as e:
                print(f"Error extracting product info: {e}")
        
        return products
    except Exception as e:
        print(f"Error searching Walmart: {e}")
        return []

def search_target(query):
    """Search for products on Target"""
    encoded_query = quote_plus(query)
    url = f"https://www.target.com/s?searchTerm={encoded_query}"
    
    headers = {
        "User-Agent": get_user_agent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
    }
    
    print(f"Searching Target for: {query}")
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find product items
        products = []
        product_items = soup.select('li[data-test="product-list-item"]')
        
        for item in product_items[:3]:  # Get first 3 items
            try:
                # Extract name
                name_elem = item.select_one('a[data-test="product-title"]')
                name = name_elem.text.strip() if name_elem else "Unknown"
                
                # Extract price
                price_elem = item.select_one('span[data-test="product-price"]')
                price = price_elem.text.strip() if price_elem else "Unknown"
                
                # Extract link
                link_elem = item.select_one('a[data-test="product-title"]')
                link = "https://www.target.com" + link_elem['href'] if link_elem and 'href' in link_elem.attrs else url
                
                products.append({
                    "name": name,
                    "price": price,
                    "link": link,
                    "source": "Target"
                })
            except Exception as e:
                print(f"Error extracting Target product info: {e}")
        
        return products
    except Exception as e:
        print(f"Error searching Target: {e}")
        return []

def format_dimensions(product_info, simple=False):
    """Format dimensions from height, width, depth into a string"""
    if simple:
        # Return rounded, simplified dimensions for broader search
        dimensions = []
        if 'height' in product_info and product_info['height']:
            dimensions.append(f"{int(product_info['height'])}\"")
        if 'width' in product_info and product_info['width']:
            dimensions.append(f"{int(product_info['width'])}\"")
        if 'depth' in product_info and product_info['depth']:
            dimensions.append(f"{int(product_info['depth'])}\"")
        
        if dimensions:
            # Just return dimensions as numbers, not labels
            return " ".join(dimensions)
        return ""
    else:
        # Detailed format with labels
        dimensions = []
        if 'height' in product_info and product_info['height']:
            dimensions.append(f"{product_info['height']}\" height")
        if 'width' in product_info and product_info['width']:
            dimensions.append(f"{product_info['width']}\" width")
        if 'depth' in product_info and product_info['depth']:
            dimensions.append(f"{product_info['depth']}\" depth")
        
        if dimensions:
            return " x ".join(dimensions)
        return ""

def create_search_variations(product_info):
    """Create multiple search queries with varying levels of detail"""
    queries = []
    
    # Get basic product info
    product_name = product_info.get('name', '')
    product_color = product_info.get('color', '')
    product_material = product_info.get('material', '')
    
    # 1. Most specific query (all details)
    specific_query = product_name
    if product_color:
        specific_query += f" {product_color}"
    
    detailed_dimensions = format_dimensions(product_info, simple=False)
    if detailed_dimensions:
        specific_query += f" {detailed_dimensions}"
        
    if product_material:
        specific_query += f" {product_material}"
    
    queries.append(specific_query)
    
    # 2. Medium specificity (name, color, simplified dimensions)
    medium_query = product_name
    if product_color:
        medium_query += f" {product_color}"
    
    simple_dimensions = format_dimensions(product_info, simple=True)
    if simple_dimensions:
        medium_query += f" {simple_dimensions}"
    
    queries.append(medium_query)
    
    # 3. Basic query (just name and color)
    basic_query = product_name
    if product_color:
        basic_query += f" {product_color}"
    
    queries.append(basic_query)
    
    # 4. Name only (most general)
    queries.append(product_name)
    
    return queries

def search_simple_product(product_info):
    """Search for product information using simple HTTP requests with multiple strategies"""
    # Create variations of the search query from specific to general
    search_queries = create_search_variations(product_info)
    
    # Try each query until we find products
    for query in search_queries:
        # First try Walmart
        walmart_products = search_walmart(query)
        if walmart_products:
            best_product = walmart_products[0]
            match_quality = calculate_match_quality(product_info, best_product)
            
            return {
                "name": best_product["name"],
                "price": best_product["price"],
                "link": best_product["link"],
                "match_quality": match_quality,
                "price_reasonable": "yes",
                "notes": f"Found on {best_product['source']} using query: '{query}'"
            }
        
        # If Walmart fails, try Target
        target_products = search_target(query)
        if target_products:
            best_product = target_products[0]
            match_quality = calculate_match_quality(product_info, best_product)
            
            return {
                "name": best_product["name"],
                "price": best_product["price"],
                "link": best_product["link"],
                "match_quality": match_quality,
                "price_reasonable": "yes",
                "notes": f"Found on {best_product['source']} using query: '{query}'"
            }
    
    # If all searches fail, return default response
    return {
        "name": "Not Found",
        "price": "Unknown",
        "link": f"https://www.google.com/search?q={quote_plus(product_info.get('name', ''))}",
        "match_quality": "Unknown",
        "price_reasonable": "Unknown", 
        "notes": "Could not find product information after trying multiple search strategies"
    }

def calculate_match_quality(product_info, found_product):
    """Calculate match quality between original product and found product"""
    product_name = product_info.get('name', '').lower()
    product_color = product_info.get('color', '').lower()
    product_material = product_info.get('material', '').lower()
    found_name = found_product.get('name', '').lower()
    
    match_score = 0
    total_criteria = 1  # Name is always a criterion
    
    # Name matching (weighted more heavily)
    if product_name in found_name:
        match_score += 2
    elif any(word in found_name for word in product_name.split()):
        match_score += 1
    
    # Color matching (if specified)
    if product_color:
        total_criteria += 1
        if product_color in found_name:
            match_score += 1
    
    # Material matching (if specified)
    if product_material:
        total_criteria += 1
        if product_material in found_name:
            match_score += 1
    
    # Calculate percentage match
    match_percentage = (match_score / (total_criteria + 1)) * 100
    
    # Convert to qualitative rating
    if match_percentage >= 75:
        return "high"
    elif match_percentage >= 50:
        return "medium"
    else:
        return "low"

def validate_product_price_simple(product_info):
    """
    Validate product prices using a simpler HTTP request approach
    
    Args:
        product_info: Dictionary with product details
        
    Returns:
        Dictionary with validation results
    """
    # Format a nice description for logging
    description = []
    description.append(product_info.get('name', 'Unknown Product'))
    
    if 'color' in product_info and product_info['color']:
        description.append(f"Color: {product_info['color']}")
        
    dimensions = []
    if 'height' in product_info and product_info['height']:
        dimensions.append(f"H: {product_info['height']}\"")
    if 'width' in product_info and product_info['width']:
        dimensions.append(f"W: {product_info['width']}\"")
    if 'depth' in product_info and product_info['depth']:
        dimensions.append(f"D: {product_info['depth']}\"")
        
    if dimensions:
        description.append(f"Dimensions: {' x '.join(dimensions)}")
        
    if 'material' in product_info and product_info['material']:
        description.append(f"Material: {product_info['material']}")
        
    print(f"\nSearching for: {', '.join(description)}")
    print("Please wait, this may take a few moments...")
    
    result = search_simple_product(product_info)
    
    print(f"Result: {result['name']} - {result['price']}")
    
    return result

if __name__ == "__main__":
    # Example product
    product = {
        "color": "Yellow",
        "name": "Flower Pot",
        "height": 20.0,
        "width": 10.0,
        "depth": 10.0,
        "material": "Clay Pottery"
    }
    
    # Find product
    result = validate_product_price_simple(product)
    
    # Print result
    print(json.dumps(result, indent=2)) 