import json
import sys
import os
from PIL import Image, ImageDraw, ImageFont
import textwrap

def generate_receipt_image(receipt_data, output_path):
    """
    Generate a receipt image from receipt data
    """
    # Set up image dimensions and colors
    width = 400
    margin = 20
    line_height = 25
    current_y = margin
    
    # Create a new image with white background
    image = Image.new('RGB', (width, 600), 'white')
    draw = ImageDraw.Draw(image)
    
    try:
        # Try to use a better font if available, otherwise use default
        font = ImageFont.truetype("arial.ttf", 16)
        bold_font = ImageFont.truetype("arialbd.ttf", 18)
        title_font = ImageFont.truetype("arialbd.ttf", 20)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
        bold_font = ImageFont.load_default()
        title_font = ImageFont.load_default()
    
    # Draw title
    draw.text((width//2 - 50, current_y), "RECEIPT", fill='black', font=title_font)
    current_y += line_height + 10
    
    # Draw shop name
    if 'shop_name' in receipt_data:
        draw.text((margin, current_y), receipt_data['shop_name'], fill='black', font=bold_font)
        current_y += line_height
    
    # Draw shop address
    if 'shop_address' in receipt_data and isinstance(receipt_data['shop_address'], list):
        for line in receipt_data['shop_address']:
            draw.text((margin, current_y), line, fill='black', font=font)
            current_y += line_height
    
    # Add some spacing
    current_y += 10
    
    # Draw items header
    draw.text((margin, current_y), "Items:", fill='black', font=bold_font)
    current_y += line_height
    
    # Draw items
    if 'items' in receipt_data and isinstance(receipt_data['items'], list):
        total = 0
        for item in receipt_data['items']:
            item_total = item['cost'] * item['quantity']
            total += item_total
            
            # Item name
            draw.text((margin, current_y), item['item'], fill='black', font=font)
            current_y += line_height
            
            # Item details
            details = f"  Qty: {item['quantity']} x {item['cost']:.2f} = {item_total:.2f}"
            draw.text((margin, current_y), details, fill='black', font=font)
            current_y += line_height + 5
        
        # Add spacing before total
        current_y += 10
        
        # Draw total
        if 'total' in receipt_data and isinstance(receipt_data['total'], dict):
            draw.text((margin, current_y), f"Total: {receipt_data['total']['total']:.2f}", 
                     fill='black', font=bold_font)
            current_y += line_height + 10
    
    # Draw footer
    if 'footer' in receipt_data and isinstance(receipt_data['footer'], list):
        for line in receipt_data['footer']:
            draw.text((margin, current_y), line, fill='black', font=font)
            current_y += line_height
    
    # Crop the image to fit the content
    cropped = image.crop((0, 0, width, min(current_y + margin, 600)))
    
    # Save the image
    cropped.save(output_path)
    return output_path

def main():
    if len(sys.argv) < 3:
        print("Usage: python generate_receipt.py <receipt_json> <output_path>")
        sys.exit(1)
    
    try:
        # Parse receipt data from command line argument
        receipt_data = json.loads(sys.argv[1])
        output_path = sys.argv[2]
        
        # Generate receipt image
        result_path = generate_receipt_image(receipt_data, output_path)
        print(json.dumps({
            "status": "success",
            "message": "Receipt generated successfully",
            "path": result_path
        }))
        
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()