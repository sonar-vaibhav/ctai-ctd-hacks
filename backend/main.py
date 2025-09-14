from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
import time
import random
from fake_useragent import UserAgent
import logging
import re
from typing import List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Smart Buy Dashboard API",
    description="API for vendor management and IndiaMART scraping",
    version="1.0.0",
    docs_url=None,  # Disable /docs
    redoc_url=None  # Disable /redoc
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# IndiaMART Scraper Class
class IndiaMARTScraper:
    def __init__(self):
        self.ua = UserAgent()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def search_vendors(self, material: str, location: str = "") -> List[dict]:
        """Search for vendors on IndiaMART based on material and location"""
        try:
            # Construct search URL using the format from your provided URL
            search_query = f"{material}"
            if location:
                search_query += f" {location}"
            
            # Use the exact URL format from your example with more results
            search_url = f"https://dir.indiamart.com/search.mp?ss={search_query.replace(' ', '+')}&v=4&mcatid=7772&catid=189&cq={location}&prdsrc=1&tags=res:RC4|ktp:N0|stype:attr=1|mtp:S|wc:1|lcf:3|cq:{location}|qr_nm:gl-gd|cs:16679|com-cf:nl|ptrs:na|mc:7772|cat:189|qry_typ:P|lang:en|tyr:1|qrd:250914|mrd:250829|prdt:250914|msf:hs|pfen:1|gli:G0I0|gc:{location}|ic:{location}|scw:1&start=0&rows=100"
            
            logger.info(f"Searching IndiaMART for: {search_query}")
            logger.info(f"URL: {search_url}")
            
            # Add random delay to avoid being blocked
            time.sleep(random.uniform(1, 3))
            
            # Make request
            response = self.session.get(search_url, timeout=30)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Debug: Log page content info
            page_text = soup.get_text()
            logger.info(f"Page contains {len(page_text)} characters")
            logger.info(f"Page contains 'card' {page_text.count('card')} times")
            logger.info(f"Page contains 'LST' {page_text.count('LST')} times")
            
            vendors = []
            
            # Look for vendor cards using multiple selectors
            vendor_cards = []
            
            # Try different selectors to find all possible vendor cards
            selectors_to_try = [
                'div.card.brs5',  # Exact class match
                'div[class*="card"][class*="brs5"]',  # Contains both classes
                'div[id^="LST"]',  # ID starts with LST
                'div[data-itemid]',  # Has data-itemid attribute
                'div[data-dispid]',  # Has data-dispid attribute
                'div.card',  # Just card class
                'div[class*="card"]',  # Contains card in class
                'div[class*="lstng"]',  # Alternative class name
                'div[class*="listing"]',  # Another alternative
                'div[class*="vendor"]',  # Vendor class
                'div[class*="supplier"]',  # Supplier class
                'div[class*="product"]'  # Product class
            ]
            
            for selector in selectors_to_try:
                try:
                    cards = soup.select(selector)
                    if cards:
                        logger.info(f"Found {len(cards)} cards with selector: {selector}")
                        vendor_cards.extend(cards)
                except Exception as e:
                    logger.warning(f"Selector {selector} failed: {e}")
            
            # Remove duplicates based on ID or data attributes
            unique_cards = []
            seen_ids = set()
            
            for card in vendor_cards:
                card_id = card.get('id') or card.get('data-itemid') or card.get('data-dispid')
                if card_id and card_id not in seen_ids:
                    seen_ids.add(card_id)
                    unique_cards.append(card)
                elif not card_id:  # Include cards without ID
                    unique_cards.append(card)
            
            vendor_cards = unique_cards
            
            logger.info(f"Found {len(vendor_cards)} vendor cards")
            
            for card in vendor_cards[:50]:  # Limit to first 50 results
                try:
                    vendor_data = self._extract_vendor_data(card)
                    if vendor_data and self._is_valid_vendor_data(vendor_data):
                        vendors.append(vendor_data)
                except Exception as e:
                    logger.warning(f"Error extracting vendor data: {e}")
                    continue
            
            # If no vendors found with current selectors, try a different approach
            if not vendors:
                vendors = self._fallback_scraping(soup, material, location)
            
            logger.info(f"Successfully scraped {len(vendors)} vendors")
            return vendors
            
        except requests.RequestException as e:
            logger.error(f"Request error: {e}")
            return []
        except Exception as e:
            logger.error(f"Scraping error: {e}")
            return []
    
    def _extract_vendor_data(self, card) -> Optional[dict]:
        """Extract vendor data from a single vendor card"""
        try:
            # Extract vendor name from company name
            company_elem = card.find('div', class_='companyname').find('a') if card.find('div', class_='companyname') else None
            vendor_name = company_elem.get_text(strip=True) if company_elem else "Unknown Vendor"
            
            # Extract vendor website
            vendor_website = company_elem.get('href') if company_elem else None
            
            # Extract rating
            rating_elem = card.find('span', class_='bo color')
            rating = rating_elem.get_text(strip=True) if rating_elem else None
            
            # Extract rating count - look for the span with rating count
            rating_count = None
            rating_spans = card.find_all('span', class_='color')
            for span in rating_spans:
                span_text = span.get_text(strip=True)
                if '(' in span_text and ')' in span_text:
                    rating_match = re.search(r'\((\d+)\)', span_text)
                    if rating_match:
                        rating_count = rating_match.group(1)
                        break
            
            # Extract item name
            item_elem = card.find('div', class_='producttitle').find('a') if card.find('div', class_='producttitle') else None
            item_name = item_elem.get_text(strip=True) if item_elem else None
            
            # Extract item price
            price_elem = card.find('p', class_='price')
            item_price = None
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                price_match = re.search(r'₹\s*([\d,]+)', price_text)
                item_price = price_match.group(1) if price_match else None
            
            # Extract item unit
            unit_elem = card.find('span', class_='unit')
            item_unit = unit_elem.get_text(strip=True) if unit_elem else None
            
            # Check for GST verification
            gst_verified = "GST" in card.get_text()
            
            # Check for TrustSEAL verification
            trustseal_verified = "TrustSEAL Verified" in card.get_text()
            
            # Extract member since and clean it
            member_elem = card.find('div', class_='memberSinceDisplay').find('span') if card.find('div', class_='memberSinceDisplay') else None
            member_since = None
            if member_elem:
                member_text = member_elem.get_text(strip=True)
                # Clean "Member: 11 yrs" to "11 yrs"
                member_since = member_text.replace('Member:', '').strip()
            
            # Extract location
            location_elem = card.find('div', class_='newLocationUi')
            if location_elem:
                location_text = location_elem.get_text(strip=True)
                location = location_text.replace('Pune', '').replace('Maharashtra', '').strip()
                if location.startswith('-'):
                    location = location[1:].strip()
            else:
                location = card.get('data-city', '') + ', ' + card.get('data-state', '')
                if location == ', ':
                    location = "Location not specified"
            
            # Extract contact number
            contact_elem = card.find('span', class_='pns_h duet fwb')
            contact = contact_elem.get_text(strip=True) if contact_elem else None
            
            return {
                'id': None,  # Will be set later
                'vendor': vendor_name,
                'vendor_website': vendor_website,
                'rating': rating,
                'rating_count': rating_count,
                'item_name': item_name,
                'item_price': item_price,
                'item_unit': item_unit,
                'gst_verified': gst_verified,
                'trustseal_verified': trustseal_verified,
                'member_since': member_since,
                'location': location,
                'contact': contact
            }
            
        except Exception as e:
            logger.warning(f"Error extracting vendor data from card: {e}")
            return None
    
    def _is_valid_vendor_data(self, vendor_data: dict) -> bool:
        """Check if vendor data is valid and not mostly null/empty"""
        # Reject if vendor name is "Unknown Vendor"
        if vendor_data.get('vendor') == "Unknown Vendor":
            return False
        
        # Count non-null, non-empty, non-default values
        valid_fields = 0
        total_fields = 0
        
        # Check important fields
        important_fields = ['vendor', 'vendor_website', 'rating', 'item_name', 'item_price', 'contact']
        
        for field in important_fields:
            value = vendor_data.get(field)
            total_fields += 1
            
            # Consider field valid if it has meaningful data
            if value and value != "Location not specified" and value != "Unknown Vendor":
                valid_fields += 1
        
        # Check location separately (it's required)
        location = vendor_data.get('location')
        if location and location != "Location not specified":
            valid_fields += 1
        total_fields += 1
        
        # At least 3 fields should have valid data (vendor name + 2 other fields)
        is_valid = valid_fields >= 3
        
        if not is_valid:
            logger.info(f"Discarding invalid vendor data: {vendor_data.get('vendor', 'Unknown')} (valid fields: {valid_fields}/{total_fields})")
        
        return is_valid
    
    def _fallback_scraping(self, soup, material: str, location: str) -> List[dict]:
        """Fallback scraping method if primary selectors fail"""
        vendors = []
        
        # Try to find any div with card-like structure
        all_cards = soup.find_all('div', class_=re.compile(r'.*card.*'))
        
        for i, card in enumerate(all_cards[:50]):
            try:
                # Try to extract any available information
                text_content = card.get_text(strip=True)
                
                # Look for phone numbers in the card
                phone_match = re.search(r'(\d{10,})', text_content)
                contact = phone_match.group(1) if phone_match else None
                
                # Look for company names (any text that looks like a company)
                company_match = re.search(r'([A-Z][a-zA-Z\s&]+(?:Pvt|Ltd|Limited|Corp|Corporation|Company|Industries|Steel|Metals|Trading|Suppliers?))', text_content)
                vendor_name = company_match.group(1).strip() if company_match else f"{material} Supplier {i+1}"
                
                # Look for location information
                location_match = re.search(r'([A-Z][a-zA-Z\s]+(?:Pune|Mumbai|Delhi|Bangalore|Chennai|Kolkata|Hyderabad|Ahmedabad|Surat|Jaipur|Lucknow|Kanpur|Nagpur|Indore|Thane|Bhopal|Visakhapatnam|Pimpri|Patna|Vadodara|Ghaziabad|Ludhiana|Agra|Nashik|Faridabad|Meerut|Rajkot|Kalyan|Vasai|Varanasi|Srinagar|Aurangabad|Navi Mumbai|Solapur|Vijayawada|Kolhapur|Amritsar|Noida|Ranchi|Howrah|Coimbatore|Raipur|Jabalpur|Gwalior|Chandigarh|Tiruchirappalli|Mysore|Bhubaneswar|Kochi|Bhavnagar|Salem|Warangal|Guntur|Bhiwandi|Amravati|Nanded|Kolhapur|Sangli|Malegaon|Ulhasnagar|Jalgaon|Akola|Latur|Ahmadnagar|Dhule|Ichalkaranji|Parbhani|Jalna|Bhusawal|Panvel|Satara|Beed|Yavatmal|Kamptee|Gondia|Barshi|Achalpur|Osmanabad|Nandurbar|Wardha|Udgir|Hinganghat))', text_content)
                vendor_location = location_match.group(1).strip() if location_match else (location or "India")
                
                vendor_data = {
                    'vendor': vendor_name,
                    'location': vendor_location,
                    'contact': contact,
                    'email': None,
                    'url': None,
                    'price': None
                }
                
                # Only add if valid
                if self._is_valid_vendor_data(vendor_data):
                    vendors.append(vendor_data)
                
            except Exception as e:
                logger.warning(f"Error in fallback scraping for card {i}: {e}")
                continue
        
        return vendors

# Initialize scraper
scraper = IndiaMARTScraper()

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Smart Buy Dashboard API", "version": "1.0.0"}

@app.get("/vendors")
async def get_vendors(
    material: str = Query(..., description="Material to search for"),
    location: str = Query("", description="Location to filter by")
):
    """Search for vendors on IndiaMART based on material and location"""
    try:
        # Scrape from IndiaMART and return directly as JSON
        logger.info(f"Scraping IndiaMART for material: {material}, location: {location}")
        scraped_vendors = scraper.search_vendors(material, location)
        
        # Add ID to each vendor for frontend compatibility
        for i, vendor in enumerate(scraped_vendors):
            vendor['id'] = i + 1
            # Remove unnecessary fields
            vendor.pop('email', None)
            vendor.pop('url', None)
            vendor.pop('finalized', None)
            vendor.pop('payment_status', None)
            vendor.pop('delivery_status', None)
            vendor.pop('notes', None)
        
        logger.info(f"Returning {len(scraped_vendors)} vendors")
        return scraped_vendors
        
    except Exception as e:
        logger.error(f"Error in get_vendors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
