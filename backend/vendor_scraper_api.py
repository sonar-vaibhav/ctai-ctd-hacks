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
    allow_origins=["http://localhost:8080","http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
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
            
            # Look for vendor cards using updated selectors based on actual IndiaMART structure
            vendor_cards = []
            
            # Try different selectors to find all possible vendor cards
            selectors_to_try = [
                'div[class*="listing"]',  # Main listing containers
                'div[class*="product"]',  # Product containers
                'div[class*="card"]',  # Card containers
                'div[data-itemid]',  # Items with data-itemid
                'div[itemprop="itemListElement"]',  # Structured data items
                'div'  # Generic divs (fallback)
            ]
            
            for selector in selectors_to_try:
                try:
                    cards = soup.select(selector)
                    if cards:
                        logger.info(f"Found {len(cards)} cards with selector: {selector}")
                        # Filter cards to only include those that look like vendor listings
                        for card in cards:
                            # Check if card contains vendor-related elements
                            if (card.find('a', href=re.compile(r'.*indiamart\.com/[^/]+/?')) or 
                                card.find(string=re.compile(r'★★★★★★★★★★')) or
                                card.find(string=re.compile(r'[₹$€£]'))):
                                vendor_cards.append(card)
                except Exception as e:
                    logger.warning(f"Selector {selector} failed: {e}")
            
            # Remove duplicates based on content similarity
            unique_cards = []
            seen_content = set()
            
            for card in vendor_cards:
                # Create a content fingerprint
                content_text = ' '.join(card.get_text().split())[:100]  # First 100 chars
                if content_text not in seen_content:
                    seen_content.add(content_text)
                    unique_cards.append(card)
            
            vendor_cards = unique_cards[:50]  # Limit to first 50 unique results
            
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
            # Extract vendor name - look for company links
            vendor_name = "Unknown Vendor"
            vendor_website = None
            
            # Try multiple approaches to find company name
            company_link = card.find('a', href=re.compile(r'.*indiamart\.com/[^/]+/?'))
            if company_link:
                vendor_name = company_link.get_text(strip=True)
                vendor_website = company_link.get('href')
            
            # If no company link found, look for any link with company-like text
            if vendor_name == "Unknown Vendor":
                links = card.find_all('a')
                for link in links:
                    text = link.get_text(strip=True)
                    if re.search(r'.*(Pvt|Ltd|Limited|Corporation|Corp|Industries|Traders|Enterprises|Sons|Brothers).*', text, re.I):
                        vendor_name = text
                        vendor_website = link.get('href')
                        break
            
            # Extract item name - look for product titles
            item_name = None
            product_title = card.find('a', href=re.compile(r'.*proddetail.*'))
            if product_title:
                item_name = product_title.get_text(strip=True)
            
            # Extract price information
            item_price = None
            price_elements = card.find_all(['p', 'div', 'span'], string=re.compile(r'[₹$€£]\s*[\d,]+'))
            if price_elements:
                price_text = price_elements[0].get_text(strip=True)
                price_match = re.search(r'[₹$€£]\s*([\d,]+)', price_text)
                if price_match:
                    item_price = price_match.group(1)
            
            # Extract rating
            rating = None
            rating_count = None
            rating_element = card.find(string=re.compile(r'★★★★★★★★★★'))
            if rating_element:
                rating_text = rating_element.parent.get_text(strip=True) if rating_element.parent else str(rating_element)
                rating_match = re.search(r'([0-9]+\.?[0-9]*)\s*\(?([0-9]*)\)?', rating_text)
                if rating_match:
                    rating = rating_match.group(1)
                    rating_count = rating_match.group(2) if rating_match.group(2) else None
            
            # Extract location
            location = "Location not specified"
            location_elements = card.find_all(string=re.compile(r'(Pune|Mumbai|Delhi|Bangalore|Chennai|Kolkata|Hyderabad|Ahmedabad|Surat|Jaipur|Lucknow|Kanpur|Nagpur|Indore|Thane|Bhopal|Visakhapatnam|Pimpri|Patna|Vadodara|Ghaziabad|Ludhiana|Agra|Nashik|Faridabad|Meerut|Rajkot|Kalyan|Vasai|Varanasi|Srinagar|Aurangabad|Navi Mumbai|Solapur|Vijayawada|Kolhapur|Amritsar|Noida|Ranchi|Howrah|Coimbatore|Raipur|Jabalpur|Gwalior|Chandigarh|Tiruchirappalli|Mysore|Bhubaneswar|Kochi|Bhavnagar|Salem|Warangal|Guntur|Bhiwandi|Amravati|Nanded|Kolhapur|Sangli|Malegaon|Ulhasnagar|Jalgaon|Akola|Latur|Ahmadnagar|Dhule|Ichalkaranji|Parbhani|Jalna|Bhusawal|Panvel|Satara|Beed|Yavatmal|Kamptee|Gondia|Barshi|Achalpur|Osmanabad|Nandurbar|Wardha|Udgir|Hinganghat)', re.I))
            if location_elements:
                location = location_elements[0].strip()
            
            # Extract contact information
            contact = None
            contact_elements = card.find_all('a', href=re.compile(r'(tel:|call|mobile)', re.I))
            if contact_elements:
                contact = contact_elements[0].get_text(strip=True)
            
            # Check for GST/TrustSEAL verification
            card_text = card.get_text()
            gst_verified = "GST" in card_text
            trustseal_verified = "TrustSEAL" in card_text
            
            # Extract member since information
            member_since = None
            member_elements = card.find_all(string=re.compile(r'Member:.*[0-9]+\s*(yrs?|years?)', re.I))
            if member_elements:
                member_since = member_elements[0].strip().replace('Member:', '').strip()
            
            return {
                'id': None,  # Will be set later
                'vendor': vendor_name,
                'vendor_website': vendor_website,
                'rating': rating,
                'rating_count': rating_count,
                'item_name': item_name,
                'item_price': item_price,
                'item_unit': None,  # Not always available
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
        
        # Try a more comprehensive approach by looking for all potential vendor containers
        # Look for divs that contain links to indiamart.com
        vendor_links = soup.find_all('a', href=re.compile(r'.*indiamart\.com/[^/]+/?'))
        
        seen_vendors = set()
        
        for i, link in enumerate(vendor_links[:50]):  # Limit to first 50
            try:
                vendor_name = link.get_text(strip=True)
                vendor_website = link.get('href')
                
                # Skip if we've already seen this vendor
                if vendor_name in seen_vendors:
                    continue
                seen_vendors.add(vendor_name)
                
                # Try to find the parent container for more information
                parent = link.parent
                for _ in range(3):  # Go up to 3 levels
                    if parent and parent != soup:
                        parent_text = parent.get_text()
                        
                        # Extract price if available
                        price_match = re.search(r'[₹$€£]\s*([\d,]+)', parent_text)
                        item_price = price_match.group(1) if price_match else None
                        
                        # Extract rating if available
                        rating_match = re.search(r'([0-9]+\.?[0-9]*)\s*\(?([0-9]*)\)?\s*★★★★★★★★★★', parent_text)
                        rating = rating_match.group(1) if rating_match else None
                        rating_count = rating_match.group(2) if rating_match and rating_match.group(2) else None
                        
                        # Extract location
                        location_match = re.search(r'(Pune|Mumbai|Delhi|Bangalore|Chennai|Kolkata|Hyderabad|Ahmedabad|Surat|Jaipur|Lucknow|Kanpur|Nagpur|Indore|Thane|Bhopal|Visakhapatnam|Pimpri|Patna|Vadodara|Ghaziabad|Ludhiana|Agra|Nashik|Faridabad|Meerut|Rajkot|Kalyan|Vasai|Varanasi|Srinagar|Aurangabad|Navi Mumbai|Solapur|Vijayawada|Kolhapur|Amritsar|Noida|Ranchi|Howrah|Coimbatore|Raipur|Jabalpur|Gwalior|Chandigarh|Tiruchirappalli|Mysore|Bhubaneswar|Kochi|Bhavnagar|Salem|Warangal|Guntur|Bhiwandi|Amravati|Nanded|Kolhapur|Sangli|Malegaon|Ulhasnagar|Jalgaon|Akola|Latur|Ahmadnagar|Dhule|Ichalkaranji|Parbhani|Jalna|Bhusawal|Panvel|Satara|Beed|Yavatmal|Kamptee|Gondia|Barshi|Achalpur|Osmanabad|Nandurbar|Wardha|Udgir|Hinganghat)', parent_text, re.I)
                        vendor_location = location_match.group(1) if location_match else (location or "India")
                        
                        vendor_data = {
                            'vendor': vendor_name,
                            'vendor_website': vendor_website,
                            'rating': rating,
                            'rating_count': rating_count,
                            'item_name': None,
                            'item_price': item_price,
                            'item_unit': None,
                            'gst_verified': "GST" in parent_text,
                            'trustseal_verified': "TrustSEAL" in parent_text,
                            'member_since': None,
                            'location': vendor_location,
                            'contact': None
                        }
                        
                        # Only add if valid
                        if self._is_valid_vendor_data(vendor_data):
                            vendors.append(vendor_data)
                            break
                        
                    parent = parent.parent if parent else None
                
            except Exception as e:
                logger.warning(f"Error in fallback scraping for link {i}: {e}")
                continue
        
        # If still no vendors found, try a text-based approach
        if not vendors:
            text_content = soup.get_text()
            # Look for company names in the entire page
            company_matches = re.findall(r'([A-Z][a-zA-Z\s&]+(?:Pvt|Ltd|Limited|Corp|Corporation|Company|Industries|Steel|Metals|Trading|Suppliers?))', text_content)
            for i, company in enumerate(set(company_matches[:20])):  # Limit to 20 unique companies
                vendor_data = {
                    'vendor': company,
                    'vendor_website': None,
                    'rating': None,
                    'rating_count': None,
                    'item_name': None,
                    'item_price': None,
                    'item_unit': None,
                    'gst_verified': False,
                    'trustseal_verified': False,
                    'member_since': None,
                    'location': location or "India",
                    'contact': None
                }
                
                if self._is_valid_vendor_data(vendor_data):
                    vendors.append(vendor_data)
        
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
        
        # Add unique ID to each vendor for frontend compatibility
        for i, vendor in enumerate(scraped_vendors):
            # Create a more unique ID using timestamp and index
            vendor['id'] = int(f"{int(time.time() * 1000)}{i}")
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