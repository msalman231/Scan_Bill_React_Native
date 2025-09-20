import cv2
import pytesseract
import re
import sys
import json
import os
from typing import Dict, List, Optional, Union

# Configure Tesseract OCR path for Windows
if os.name == 'nt':  # Windows
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image(path):
    # Check if file exists
    if not os.path.exists(path):
        raise FileNotFoundError(f"Image file not found: {path}")
    
    img = cv2.imread(path)
    if img is None:
        raise ValueError(f"Could not read image: {path}")
        
    # Try different preprocessing techniques for better OCR
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    
    # Apply adaptive thresholding for better text separation
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    
    # Try additional preprocessing for better OCR
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    return morph

def detect_currency(text):
    # Use ASCII currency codes instead of symbols to avoid encoding issues
    text = text.upper()
    if "EUR" in text or "€" in text: return "EUR"
    if "USD" in text or "$" in text: return "USD"
    if "GBP" in text or "£" in text: return "GBP"
    if "INR" in text or "RS" in text or "₹" in text: return "INR"
    return None  # Return None instead of defaulting to INR

def extract_text(img):
    # Try multiple OCR configurations for better accuracy
    configs = [
        "--oem 3 --psm 6",  # Default
        "--oem 1 --psm 6",  # LSTM only
        "--oem 3 --psm 4",  # Assume single column
        "--oem 3 --psm 3",  # Fully automatic page segmentation
    ]
    
    best_text = ""
    
    for config in configs:
        try:
            # Get text with confidence
            text = pytesseract.image_to_string(img, config=config)
            if len(text) > len(best_text):  # Simple heuristic for better text
                best_text = text
        except:
            continue
    
    return best_text if best_text else pytesseract.image_to_string(img, config="--oem 3 --psm 6")

def split_sections(lines):
    header, items, totals, footer = [], [], [], []
    section = "header"

    for l in lines:
        l_strip = l.strip()
        if not l_strip:
            continue

        # Detect section switches with improved logic
        l_lower = l_strip.lower()
        if re.search(r"(total|tax|vat|svc|service|amount due|balance due)", l_lower):
            section = "totals"
        elif re.search(r"(thank|have a nice day|visit again|save environment|return policy|come again)", l_lower):
            section = "footer"
        elif section == "header" and re.search(r"(\d+[.,]?\d{1,2}|€|\$|£|rs|inr|eur|usd|gbp)", l_lower):
            section = "items"

        # Append line to section
        if section == "header":
            header.append(l_strip)
        elif section == "items":
            items.append(l_strip)
        elif section == "totals":
            totals.append(l_strip)
        elif section == "footer":
            footer.append(l_strip)

    return header, items, totals, footer

def is_valid_item_description(desc):
    """Check if a description is likely to be a valid item"""
    # Skip if it looks like a date, time, or other non-item text
    if re.match(r"^\d+/\d+/?\d*$", desc):  # Date pattern like 312/12/2023
        return False
    if re.match(r"^\d+:\d+$", desc):  # Time pattern
        return False
    if len(desc) < 2:  # Too short
        return False
    if re.match(r"^[a-z]$", desc):  # Single letter
        return False
    # Skip common non-item words and patterns
    skip_patterns = [
        r"cashier.*\d+",  # Cashier with numbers
        r"order.*\d+",    # Order with numbers
        r"date.*\d+",     # Date with numbers
        r"time.*\d+",     # Time with numbers
        r"\d+-\d+-?\d*",  # Phone numbers
        r"receipt",       # Receipt keyword
        r"tel",           # Tel keyword
        r"phone",         # Phone keyword
        r"invoice",       # Invoice keyword
        r"bill",          # Bill keyword
        r"paid",          # Paid keyword
        r"tendered",      # Tendered keyword
        r"change",        # Change keyword
    ]
    
    desc_lower = desc.lower()
    for pattern in skip_patterns:
        if re.search(pattern, desc_lower):
            return False
            
    return True

def parse_items(items, receipt_currency):
    parsed = []
    skip_keywords = ["receipt", "date", "cashier", "subtotal", "tax", "vat",
                     "total", "cash", "change", "service", "thank", "shop", "supermarket",
                     "tel", "phone", "invoice", "bill", "paid", "taxable", "vatise", "cash", "cane", "paid with",
                     "tendered", "order", "time", "come again", "dining"]

    # Filter out skip keywords and clean items
    filtered_items = []
    for l in items:
        l_clean = l.replace('|', '').strip()
        l_lower = l_clean.lower()
        if not any(kw in l_lower for kw in skip_keywords) and l_clean:
            filtered_items.append(l_clean)
    
    # Process items with more flexible pattern matching
    for l in filtered_items:
        # Clean up OCR artifacts in the line
        l = l.replace(':', '').strip()
        
        # Skip lines that look like phone numbers or other non-item patterns
        if re.match(r".*\d+-\d+-?\d*.*", l):
            continue
            
        # Look for item patterns with more flexibility for OCR errors
        # More specific patterns first to avoid incorrect matches
        patterns = [
            r"(\d+)\s*x\s*(.+?)\s+([€$£]?\s*[\d,.]+)$",  # Qty x Item price with currency symbol (explicit x)
            r"(.+?)\s+(\d+)\s*x\s*([€$£]?\s*[\d,.]+)$",  # Item Qty x price with currency symbol (explicit x)
            r"(\d+)\s+(.+?)\s+([€$£]?\s*[\d,.]+)$",      # Qty item price with currency symbol
            r"(.+?)\s+([€$£]?\s*[\d,.]+)$",              # Item price with currency symbol
            r"(.+?)\s+(\d+[.,]\d{2})$",                  # Item price without currency symbol
        ]
        
        matched = False
        for pattern in patterns:
            m = re.search(pattern, l, re.IGNORECASE)
            if m:
                if pattern == patterns[0]:  # Qty x Item price with currency symbol (explicit x)
                    qty_str = m.group(1)
                    desc = m.group(2).strip()
                    price_str = m.group(3)
                elif pattern == patterns[1]:  # Item Qty x price with currency symbol (explicit x)
                    desc = m.group(1).strip()
                    qty_str = m.group(2)
                    price_str = m.group(3)
                elif pattern == patterns[2]:  # Qty item price with currency symbol
                    qty_str = m.group(1)
                    desc = m.group(2).strip()
                    price_str = m.group(3)
                elif pattern == patterns[3]:  # Item price with currency symbol
                    desc = m.group(1).strip()
                    qty_str = "1"
                    price_str = m.group(2)
                elif pattern == patterns[4]:  # Item price without currency symbol
                    desc = m.group(1).strip()
                    qty_str = "1"
                    price_str = m.group(2)
                else:
                    continue
                
                # Fix common OCR errors in quantity (conservative approach)
                # Common OCR errors: O→0, S→5, I→1, Z→2, B→8, G→6
                qty_str = qty_str.replace('O', '0').replace('S', '5').replace('I', '1').replace('Z', '2')
                qty_str = qty_str.replace('B', '8').replace('G', '6').replace('Q', '0')
                try:
                    qty = int(qty_str)
                except:
                    qty = 1  # Default to 1 if we can't parse the quantity
                
                # Clean up OCR errors in price and description
                price_str = price_str.replace('O', '0').replace('S', '5').replace('I', '1').replace('Z', '2')
                price_str = price_str.replace('B', '8').replace('G', '6').replace('Q', '0')
                price_str = re.sub(r'[€$£]', '', price_str).strip()
                desc = re.sub(r'^\d+\s*x?\s*', '', desc).strip()  # Remove leading numbers that might be quantities
                
                # Validate item description
                if not is_valid_item_description(desc):
                    continue
                
                # Extract numeric value
                try:
                    # Handle both comma and period as decimal separator
                    if ',' in price_str and '.' in price_str:
                        # Both present, use the last one as decimal separator
                        if price_str.rfind(',') > price_str.rfind('.'):
                            price_str = price_str.replace('.', '').replace(',', '.')
                        else:
                            price_str = price_str.replace(',', '')
                    elif ',' in price_str:
                        price_str = price_str.replace(',', '.')
                    
                    price = float(price_str)
                    
                    # Skip very small prices that might be quantities or invalid
                    if price < 0.01 or price > 10000:  # Reasonable price range
                        continue
                        
                    # Use receipt currency or default to a common currency
                    final_currency = receipt_currency if receipt_currency else "USD"  # Default to USD for restaurant receipts
                    
                    # Only add if we have a meaningful description
                    if len(desc) > 1:
                        parsed.append({
                            "item": desc,
                            "quantity": qty,
                            "cost": price,
                            "currency": final_currency
                        })
                        matched = True
                        break
                except ValueError:
                    # Skip lines that can't be parsed as prices
                    continue
        
        # If no pattern matched, try a more general approach
        if not matched:
            # Look for any number that might be a price at the end of the line
            price_match = re.search(r"([€$£]?\s*[\d,.]+)$", l)
            if price_match:
                price_str = price_match.group(1)
                # Clean up OCR errors in price
                price_str = price_str.replace('O', '0').replace('S', '5').replace('I', '1').replace('Z', '2')
                price_str = price_str.replace('B', '8').replace('G', '6').replace('Q', '0')
                price_str = re.sub(r'[€$£]', '', price_str).strip()
                
                try:
                    # Handle both comma and period as decimal separator
                    if ',' in price_str and '.' in price_str:
                        # Both present, use the last one as decimal separator
                        if price_str.rfind(',') > price_str.rfind('.'):
                            price_str = price_str.replace('.', '').replace(',', '.')
                        else:
                            price_str = price_str.replace(',', '')
                    elif ',' in price_str:
                        price_str = price_str.replace(',', '.')
                    
                    price = float(price_str)
                    
                    # Skip very small prices or unreasonable prices
                    if price < 0.01 or price > 10000:
                        continue
                    
                    # Extract item description (everything before the price)
                    desc = l[:price_match.start()].strip()
                    # Remove any remaining numbers that might be quantities
                    desc = re.sub(r"^\d+\s*x?\s*", "", desc).strip()
                    
                    # Validate item description
                    if not is_valid_item_description(desc):
                        continue
                    
                    if desc and len(desc) > 1:  # Only add if we have a meaningful description
                        # Use receipt currency or default to USD for restaurant receipts
                        final_currency = receipt_currency if receipt_currency else "USD"
                        
                        parsed.append({
                            "item": desc,
                            "quantity": 1,
                            "cost": price,
                            "currency": final_currency
                        })
                except ValueError:
                    # Skip lines that can't be parsed as prices
                    continue

    # Post-process to remove invalid items
    valid_items = []
    for item in parsed:
        # Additional validation to remove problematic items
        if is_valid_item_description(item["item"]) and "/" not in item["item"] and "-" not in item["item"]:
            valid_items.append(item)
    
    return valid_items

def parse_totals(totals):
    result: Dict[str, Optional[Union[float, str]]] = {
        "subtotal": None, 
        "tax": None, 
        "service_charge": None, 
        "total": None, 
        "currency": None
    }
    
    # First pass: detect the primary currency of the receipt
    currency_counts: Dict[str, int] = {}
    for l in totals:
        currency = detect_currency(l)
        if currency:
            currency_counts[currency] = currency_counts.get(currency, 0) + 1
    
    # Determine the most common currency
    receipt_currency = None
    if currency_counts:
        receipt_currency = max(currency_counts.keys(), key=lambda x: currency_counts[x])
    
    result["currency"] = receipt_currency
    
    # Second pass: extract values with OCR error correction
    for l in totals:
        # Extract numeric value with OCR error correction
        # Replace common OCR errors
        clean_line = l.replace('O', '0').replace('S', '5').replace('I', '1').replace('Z', '2')
        clean_line = clean_line.replace('B', '8').replace('G', '6').replace('Q', '0')
        clean_line = re.sub(r'[€$£]', '', clean_line)  # Remove currency symbols
        value_match = re.search(r'(\d+[.,]?\d{1,2})', clean_line)
        if not value_match:
            continue
            
        try:
            val_str = value_match.group(1)
            # Handle both comma and period as decimal separator
            if ',' in val_str and '.' in val_str:
                # Both present, use the last one as decimal separator
                if val_str.rfind(',') > val_str.rfind('.'):
                    val_str = val_str.replace('.', '').replace(',', '.')
                else:
                    val_str = val_str.replace(',', '')
            elif ',' in val_str:
                val_str = val_str.replace(',', '.')
            
            val = float(val_str)
        except:
            continue
            
        l_lower = l.lower()
        if "subtotal" in l_lower or "taxable" in l_lower:
            result["subtotal"] = val
            if not result["currency"] and receipt_currency:
                result["currency"] = receipt_currency
        elif "tax" in l_lower or "vat" in l_lower or "vatise" in l_lower:
            result["tax"] = val
            if not result["currency"] and receipt_currency:
                result["currency"] = receipt_currency
        elif "svc" in l_lower or "service" in l_lower:
            result["service_charge"] = val
            if not result["currency"] and receipt_currency:
                result["currency"] = receipt_currency
        elif "total" in l_lower:
            result["total"] = val
            if not result["currency"] and receipt_currency:
                result["currency"] = receipt_currency
    
    return result

def clean_header(header):
    # Remove junk lines (like "yo?", "a")
    cleaned = [h for h in header if len(h) > 2 and not re.match(r"^[a-z]$", h.lower())]
    return cleaned

def main():
    if len(sys.argv) < 2:
        print("Usage: python receipt_scanner.py <image>")
        sys.exit(1)

    try:
        img = preprocess_image(sys.argv[1])
        text = extract_text(img)

        lines = [l.strip() for l in text.splitlines() if l.strip()]
        header, items, totals, footer = split_sections(lines)

        header = clean_header(header)

        shop_name = header[0] if header else ""
        shop_address = header[1:] if len(header) > 1 else []

        # Parse totals first to determine receipt currency
        totals_parsed = parse_totals(totals)
        receipt_currency = totals_parsed.get("currency")
        
        # Parse items with the determined receipt currency
        items_parsed = parse_items(items, receipt_currency)
        
        # If we still don't have a currency, try to detect from items or use default
        if not receipt_currency and items_parsed:
            # Use the currency from the first item
            receipt_currency = items_parsed[0]["currency"]
            totals_parsed["currency"] = receipt_currency
        elif not receipt_currency:
            # Default to USD for restaurant receipts
            receipt_currency = "USD"
            totals_parsed["currency"] = receipt_currency
            # Update items to use the consistent currency
            for item in items_parsed:
                item["currency"] = receipt_currency

        result = {
            "shop_name": shop_name,
            "shop_address": shop_address,
            "items": items_parsed,
            "total": totals_parsed,
            "footer": footer
        }

        # Output JSON result with proper encoding
        json_output = json.dumps(result, indent=2, ensure_ascii=False)
        print(json_output)
        
        # Also save to file for debugging
        with open("receipt_output.json", "w", encoding="utf-8") as f:
            f.write(json_output)

    except Exception as e:
        error_result = {
            "error": str(e),
            "type": type(e).__name__
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()