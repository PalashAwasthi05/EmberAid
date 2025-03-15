from .simple_scraper import validate_product_price_simple

def get_product_price(product_info):
    """
    Get pricing information for a product
    
    Args:
        product_info (dict): Product information with keys:
            - name: Name of the product
            - color: Color of the product (optional)
            - height: Height in inches (optional)
            - width: Width in inches (optional)
            - depth: Depth in inches (optional)
            - material: Material of the product (optional)
            
    Returns:
        dict: Product pricing information with name, price, link, etc.
    """
    return validate_product_price_simple(product_info)