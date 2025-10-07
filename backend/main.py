import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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
from pydantic import BaseModel
from datetime import datetime

# Import ML components
try:
    from ml.models.material_predictor import MaterialPredictor
    from ml.utils.preprocessing import clean_project_data
    import pandas as pd
    ML_AVAILABLE = True
    logging.info("ML components loaded successfully")
except ImportError as e:
    logging.warning(f"ML components not available: {e}")
    ML_AVAILABLE = False
    pd = None

# Import MongoDB components
try:
    from database.mongodb import db_manager
    from models.database_models import ProjectModel, MaterialModel, VendorModel, PredictionModel, UserModel
    from database.crud import (
        create_project, get_project, get_all_projects, update_project, delete_project,
        create_material, get_materials_by_project,
        create_vendor, get_vendor, search_vendors_by_material, get_vendors_by_project,
        create_prediction, get_predictions_by_project,
        get_user_by_username, get_user_by_email, create_user, update_user_last_login
    )
    from bson import ObjectId
    MONGODB_AVAILABLE = True
    logging.info("MongoDB components loaded successfully")
except ImportError as e:
    logging.warning(f"MongoDB components not available: {e}")
    MONGODB_AVAILABLE = False
    db_manager = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Smart Buy Dashboard API",
    description="API for vendor management, IndiaMART scraping, and AI material prediction",
    version="1.0.0",
    docs_url=None,  # Disable /docs
    redoc_url=None  # Disable /redoc
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ctai-ctd-hacks.onrender.com/","http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8001", "http://localhost:8080", "http://localhost:8081", "https://smartbuy-dashboard-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MongoDB if available
if MONGODB_AVAILABLE:
    if db_manager.connect():
        logger.info("MongoDB connected successfully")
    else:
        logger.warning("MongoDB connection failed. Some features may not work properly.")
else:
    logger.warning("MongoDB components not available. Some features may not work properly.")

# Initialize ML model if available
if ML_AVAILABLE:
    try:
        ml_predictor = MaterialPredictor()
        logger.info("ML predictor initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing ML predictor: {e}")
        ml_predictor = None
        ML_AVAILABLE = False
else:
    ml_predictor = None
    logger.warning("ML predictor not available")

# Pydantic models for request/response
class ProjectRequest(BaseModel):
    projectType: str
    size: str
    state: str
    city: str
    volume: str

class MaterialPrediction(BaseModel):
    id: str
    name: str
    category: str
    quantity: int
    unit: str
    cost: int

class PredictionResponse(BaseModel):
    success: bool
    materials: List[MaterialPrediction]
    total_cost: int
    confidence: float = 94.0

# Authentication models
class UserLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime
    last_login: Optional[datetime] = None


# IndiaMART Scraper Class
class IndiaMARTScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
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
    return {
        "message": "Smart Buy Dashboard API", 
        "version": "1.0.0",
        "features": [
            "AI Material Prediction",
            "Vendor Scraping (IndiaMART)", 
            "Construction Project Analysis"
        ],
        "endpoints": {
            "ml_prediction": "/predict",
            "vendor_search": "/vendors",
            "test_ml": "/test-prediction",
            "demo_data": "/demo"
        }
    }

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


# ML Prediction endpoint
@app.post("/predict")
async def predict_materials(project: ProjectRequest):
    """AI-powered material prediction for construction projects"""
    try:
        logger.info(f"Predicting materials for project: {project.dict()}")
        
        if not ML_AVAILABLE or not ml_predictor:
            return await _mock_prediction(project)
        
        # Clean and prepare project data
        cleaned_data = clean_project_data(project.dict())
        
        # Get ML predictions
        predictions = ml_predictor.predict_materials(cleaned_data)
        
        if not predictions:
            return await _mock_prediction(project)
        
        # Calculate total cost
        total_cost = sum(material['cost'] for material in predictions)
        
        # Format response
        formatted_materials = [
            MaterialPrediction(
                id=material['id'],
                name=material['name'],
                category=material['category'],
                quantity=material['quantity'],
                unit=material['unit'],
                cost=material['cost']
            )
            for material in predictions
        ]
        
        response = PredictionResponse(
            success=True,
            materials=formatted_materials,
            total_cost=total_cost,
            confidence=92.0
        )
        
        logger.info(f"ML prediction successful: {len(predictions)} materials predicted")
        return response
        
    except Exception as e:
        logger.error(f"Error in predict_materials: {e}")
        return await _mock_prediction(project)

async def _mock_prediction(project: ProjectRequest):
    """Fallback prediction when ML is not available"""
    mock_materials = [
        {"id": "1", "name": "Structural Steel", "category": "Structure", "quantity": 450, "unit": "tons", "cost": 56000000},
        {"id": "2", "name": "Concrete (M40)", "category": "Foundation", "quantity": 2800, "unit": "m³", "cost": 32000000},
        {"id": "3", "name": "Glass Curtain Wall", "category": "Exterior", "quantity": 1200, "unit": "m²", "cost": 75000000},
        {"id": "4", "name": "HVAC Systems", "category": "MEP", "quantity": 24, "unit": "units", "cost": 28000000},
        {"id": "5", "name": "Electrical Conduits", "category": "Electrical", "quantity": 5500, "unit": "m", "cost": 6200000},
        {"id": "6", "name": "Fire Safety Systems", "category": "Safety", "quantity": 8, "unit": "systems", "cost": 13500000},
        {"id": "7", "name": "Insulation Materials", "category": "Interior", "quantity": 3200, "unit": "m²", "cost": 4800000},
        {"id": "8", "name": "Plumbing Fixtures", "category": "MEP", "quantity": 180, "unit": "units", "cost": 9800000}
    ]
    
    formatted_materials = [MaterialPrediction(**material) for material in mock_materials]
    total_cost = sum(material['cost'] for material in mock_materials)
    
    return PredictionResponse(
        success=True,
        materials=formatted_materials,
        total_cost=total_cost,
        confidence=85.0
    )

# Train models endpoint - REMOVED
# Model info endpoint - REMOVED
# Complete workflow endpoint - REMOVED

# Demo/Test endpoints for Postman testing
@app.get("/demo")
async def get_demo_data():
    """Get sample project data for testing"""
    return {
        "sample_projects": [
            {
                "name": "Mumbai Office Complex",
                "data": {
                    "projectType": "Commercial Construction",
                    "size": "Large (>₹10Cr)",
                    "state": "Maharashtra",
                    "city": "Mumbai",
                    "volume": "125000000"
                }
            },
            {
                "name": "Bangalore Tech Park",
                "data": {
                    "projectType": "Industrial Infrastructure", 
                    "size": "Medium (₹1Cr–₹10Cr)",
                    "state": "Karnataka",
                    "city": "Bengaluru",
                    "volume": "65000000"
                }
            },
            {
                "name": "Pune Residential",
                "data": {
                    "projectType": "Residential Development",
                    "size": "Small (<₹1Cr)",
                    "state": "Maharashtra", 
                    "city": "Pune",
                    "volume": "8500000"
                }
            }
        ],
        "instructions": {
            "step1": "Copy any sample project data",
            "step2": "POST to /predict endpoint",
            "step3": "POST to /vendors?material=<material_name>&location=<city>",
            "step4": "Check /model-info for ML status"
        }
    }

@app.post("/test-prediction")
async def test_prediction_endpoint(project: ProjectRequest):
    """Enhanced prediction endpoint with detailed output for testing"""
    try:
        logger.info(f"[TEST] Testing prediction for: {project.dict()}")
        
        # Get basic prediction
        prediction_result = await predict_materials(project)
        
        # Add debug information
        debug_info = {
            "input_processed": clean_project_data(project.dict()) if ML_AVAILABLE else "ML not available",
            "ml_available": ML_AVAILABLE,
            "model_status": ml_predictor.get_model_info() if ML_AVAILABLE and ml_predictor else "No ML model",
            "prediction_source": "ML Model" if ML_AVAILABLE and ml_predictor else "Fallback Rules"
        }
        
        # Enhanced response
        return {
            "prediction_result": prediction_result,
            "debug_info": debug_info,
            "timestamp": pd.Timestamp.now().isoformat() if 'pd' in globals() else "N/A",
            "summary": {
                "total_materials": len(prediction_result.materials),
                "total_cost": prediction_result.total_cost,
                "confidence": prediction_result.confidence,
                "cost_breakdown": [
                    {"material": mat.name, "cost": mat.cost, "percentage": round((mat.cost/prediction_result.total_cost)*100, 2)}
                    for mat in prediction_result.materials[:5]
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"Error in test prediction: {e}")
        return {
            "error": str(e),
            "ml_available": ML_AVAILABLE,
            "suggestion": "Try running /train-models first, or use demo data from /demo"
        }

# Enhanced vendor search with better output
@app.get("/vendors-detailed")
async def get_vendors_detailed(
    material: str = Query(..., description="Material to search for"),
    location: str = Query("", description="Location to filter by"),
    max_results: int = Query(10, description="Maximum number of results")
):
    """Enhanced vendor search with detailed output for testing"""
    try:
        logger.info(f"[TEST] Searching vendors for material: {material}, location: {location}")
        
        # Get vendor data using existing scraper
        scraped_vendors = scraper.search_vendors(material, location)
        
        # Limit results
        limited_vendors = scraped_vendors[:max_results]
        
        # Add enhanced information
        for i, vendor in enumerate(limited_vendors):
            vendor['search_rank'] = i + 1
            vendor['search_material'] = material
            vendor['search_location'] = location
        
        return {
            "search_query": {
                "material": material,
                "location": location,
                "max_results": max_results
            },
            "results_found": len(scraped_vendors),
            "results_returned": len(limited_vendors),
            "vendors": limited_vendors,
            "summary": {
                "total_vendors": len(scraped_vendors),
                "with_contact": len([v for v in limited_vendors if v.get('contact')]),
                "with_email": len([v for v in limited_vendors if v.get('email')]),
                "with_rating": len([v for v in limited_vendors if v.get('rating')]),
                "verified_vendors": len([v for v in limited_vendors if v.get('trustseal_verified') or v.get('gst_verified')])
            },
            "timestamp": pd.Timestamp.now().isoformat() if 'pd' in globals() else "N/A"
        }
        
    except Exception as e:
        logger.error(f"Error in detailed vendor search: {e}")
        return {
            "error": str(e),
            "search_query": {"material": material, "location": location},
            "suggestion": "Try with common materials like 'steel', 'cement', 'concrete'"
        }

# Complete workflow test endpoint - REMOVED

# API Documentation endpoint
@app.get("/api-docs")
async def get_api_documentation():
    """Complete API documentation for Postman testing"""
    return {
        "title": "Smart Buy Dashboard API - Testing Guide",
        "version": "1.0.0",
        "base_url": "http://localhost:8000",
        "endpoints": {
            "1_basic_info": {
                "GET /": "API overview and available endpoints",
                "GET /api-docs": "This documentation",
                "GET /demo": "Sample data for testing"
            },
            "2_ml_prediction": {
                "POST /predict": {
                    "description": "Basic material prediction",
                    "sample_body": {
                        "projectType": "Commercial Construction",
                        "size": "Medium (₹1Cr–₹10Cr)",
                        "state": "Maharashtra", 
                        "city": "Mumbai",
                        "volume": "50000000"
                    }
                },
                "POST /test-prediction": {
                    "description": "Detailed prediction with debug info",
                    "sample_body": "Same as /predict"
                }
            },
            "3_vendor_search": {
                "GET /vendors": {
                    "description": "Basic vendor search (original functionality)",
                    "parameters": "?material=steel&location=mumbai"
                },
                "GET /vendors-detailed": {
                    "description": "Enhanced vendor search with analytics",
                    "parameters": "?material=concrete&location=pune&max_results=10"
                }
            },
            "4_demo_and_testing": {
                "GET /demo": "Sample data for testing",
                "GET /api-docs": "This documentation"
            }
        },
        "testing_steps": {
            "step_1": "GET /demo to get sample data",
            "step_2": "POST /test-prediction with sample data",
            "step_3": "GET /vendors-detailed?material=steel&location=mumbai",
            "step_4": "POST /predict for production predictions"
        },
        "sample_materials": [
            "steel", "concrete", "cement", "glass", "drywall", 
            "HVAC", "electrical", "plumbing", "insulation"
        ],
        "sample_locations": [
            "mumbai", "delhi", "bangalore", "pune", "chennai", 
            "hyderabad", "kolkata", "ahmedabad"
        ]
    }


# MongoDB Project Management Endpoints
@app.post("/projects")
async def create_project_endpoint(project_data: ProjectRequest):
    """Create a new project in MongoDB"""
    try:
        # Convert ProjectRequest to ProjectModel
        project_model = ProjectModel(
            name=f"{project_data.projectType} Project",
            project_type=project_data.projectType,
            size=project_data.size,
            state=project_data.state,
            city=project_data.city,
            volume=int(project_data.volume),
            status="active",
            is_predicted=False
        )
        
        # Save to MongoDB
        created_project = create_project(project_model)
        
        return {
            "success": True,
            "project_id": str(created_project.id),
            "message": "Project created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects")
async def get_all_projects_endpoint():
    """Get all projects from MongoDB"""
    try:
        projects = get_all_projects()
        return [
            {
                "id": str(project.id),
                "name": project.name,
                "project_type": project.project_type,
                "size": project.size,
                "state": project.state,
                "city": project.city,
                "volume": project.volume,
                "status": project.status,
                "is_predicted": project.is_predicted,
                "created_at": project.created_at
            }
            for project in projects
        ]
    except Exception as e:
        logger.error(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}")
async def get_project_endpoint(project_id: str):
    """Get a specific project from MongoDB"""
    try:
        project = get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {
            "id": str(project.id),
            "name": project.name,
            "project_type": project.project_type,
            "size": project.size,
            "state": project.state,
            "city": project.city,
            "volume": project.volume,
            "status": project.status,
            "is_predicted": project.is_predicted,
            "created_at": project.created_at
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Save Prediction Results to MongoDB
@app.post("/projects/{project_id}/predictions")
async def save_prediction_endpoint(project_id: str, prediction: PredictionResponse):
    """Save prediction results to MongoDB"""
    try:
        # Verify project exists
        project = get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Convert materials to MaterialModel objects (embedded within prediction)
        material_models = []
        for material in prediction.materials:
            material_model = MaterialModel(
                project_id=ObjectId(project_id),
                name=material.name,
                category=material.category,
                quantity=material.quantity,
                unit=material.unit,
                cost=material.cost,
                confidence=prediction.confidence
            )
            material_models.append(material_model)
        
        # Create PredictionModel
        prediction_model = PredictionModel(
            project_id=ObjectId(project_id),
            materials=material_models,
            total_cost=prediction.total_cost,
            confidence=prediction.confidence
        )
        
        # Save prediction to MongoDB
        created_prediction = create_prediction(prediction_model)
        
        # Update project's is_predicted flag
        update_project(project_id, {"is_predicted": True})
        
        return {
            "success": True,
            "prediction_id": str(created_prediction.id),
            "message": "Prediction saved successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get Prediction Results from MongoDB
@app.get("/projects/{project_id}/predictions")
async def get_predictions_endpoint(project_id: str):
    """Get prediction results from MongoDB"""
    try:
        # Verify project exists
        project = get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get predictions from MongoDB
        predictions = get_predictions_by_project(project_id)
        
        if not predictions:
            return []
        
        # Return the most recent prediction
        latest_prediction = predictions[-1]  # Assuming sorted by creation date
        
        # Get vendors for this project to check assignments
        project_vendors = get_vendors_by_project(project_id)
        
        # Create a map of material name to vendor details
        material_vendor_map = {}
        for vendor in project_vendors:
            if vendor.material_name:
                # Convert vendor to JSON-serializable format
                vendor_dict = vendor.dict(by_alias=True)
                if '_id' in vendor_dict:
                    vendor_dict['_id'] = str(vendor_dict['_id'])
                if 'project_id' in vendor_dict and vendor_dict['project_id']:
                    vendor_dict['project_id'] = str(vendor_dict['project_id'])
                if 'material_id' in vendor_dict and vendor_dict['material_id']:
                    vendor_dict['material_id'] = str(vendor_dict['material_id'])
                material_vendor_map[vendor.material_name] = vendor_dict
        
        return {
            "success": True,
            "materials": [
                {
                    "id": str(material.id),
                    "name": material.name,
                    "category": material.category,
                    "quantity": material.quantity,
                    "unit": material.unit,
                    "cost": material.cost,
                    "vendorAssigned": material_vendor_map.get(material.name)  # Add complete vendor assignment info
                }
                for material in latest_prediction.materials
            ],
            "total_cost": latest_prediction.total_cost,
            "confidence": latest_prediction.confidence
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get vendors associated with a specific project
@app.get("/projects/{project_id}/vendors")
async def get_project_vendors(project_id: str, material_name: str = None):
    """Get vendors associated with a specific project, optionally filtered by material"""
    try:
        # Verify project exists
        project = get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get vendors from MongoDB
        vendors = get_vendors_by_project(project_id, material_name)
        
        # Convert to JSON-serializable format
        vendors_json = []
        for vendor in vendors:
            vendor_dict = vendor.dict(by_alias=True)
            # Convert ObjectId to string for JSON serialization
            if '_id' in vendor_dict:
                vendor_dict['_id'] = str(vendor_dict['_id'])
            if 'project_id' in vendor_dict and vendor_dict['project_id']:
                vendor_dict['project_id'] = str(vendor_dict['project_id'])
            if 'material_id' in vendor_dict and vendor_dict['material_id']:
                vendor_dict['material_id'] = str(vendor_dict['material_id'])
            vendors_json.append(vendor_dict)
        
        return vendors_json
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project vendors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
async def login_user(credentials: UserLogin):
    """Login user"""
    try:
        # Get user by username
        user = get_user_by_username(credentials.username)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password (plain text comparison for simplicity)
        if credentials.password != user.password:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return {
            "success": True,
            "user": {
                "id": str(user.id),
                "username": user.username
            },
            "message": "Login successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging in user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Save Vendor Data to MongoDB
@app.post("/vendors/save")
async def save_vendor_endpoint(vendor_data: dict):
    """Save vendor data to MongoDB with project and material associations"""
    try:
        # Extract project and material information if provided
        project_id = vendor_data.get('project_id')
        material_id = vendor_data.get('material_id')
        material_name = vendor_data.get('material_name')
        
        # Convert dict to VendorModel
        vendor_model = VendorModel(
            project_id=ObjectId(project_id) if project_id else None,
            material_id=ObjectId(material_id) if material_id else None,
            material_name=material_name,
            name=vendor_data.get('name'),
            website=vendor_data.get('website'),
            rating=vendor_data.get('rating'),
            rating_count=vendor_data.get('rating_count'),
            item_name=vendor_data.get('item_name'),
            item_price=vendor_data.get('item_price'),
            item_unit=vendor_data.get('item_unit'),
            gst_verified=vendor_data.get('gst_verified', False),
            trustseal_verified=vendor_data.get('trustseal_verified', False),
            member_since=vendor_data.get('member_since'),
            location=vendor_data.get('location'),
            contact=vendor_data.get('contact'),
            email=vendor_data.get('email')
        )
        
        # Save to MongoDB
        created_vendor = create_vendor(vendor_model)
        
        return {
            "success": True,
            "vendor_id": str(created_vendor.id),
            "message": "Vendor saved successfully"
        }
    except Exception as e:
        logger.error(f"Error saving vendor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Update vendor information
@app.patch("/vendors/{vendor_id}")
async def update_vendor_endpoint(vendor_id: str, vendor_data: dict):
    """Update vendor information"""
    try:
        # Update vendor in MongoDB
        success = update_vendor(vendor_id, vendor_data)
        
        if success:
            return {"message": "Vendor updated successfully"}
        else:
            raise HTTPException(status_code=404, detail="Vendor not found")
    except Exception as e:
        logger.error(f"Error updating vendor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Finalize a vendor
@app.post("/vendors/finalize/{vendor_id}")
async def finalize_vendor_endpoint(vendor_id: str):
    """Finalize a vendor"""
    try:
        # Update vendor's finalized status in MongoDB
        success = update_vendor(vendor_id, {"finalized": True})
        
        if success:
            return {"message": "Vendor finalized successfully"}
        else:
            raise HTTPException(status_code=404, detail="Vendor not found")
    except Exception as e:
        logger.error(f"Error finalizing vendor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Update material with vendor assignment
@app.patch("/projects/{project_id}/materials/{material_id}/assign-vendor")
async def assign_vendor_to_material(project_id: str, material_id: str, vendor_id: str):
    """Assign a vendor to a material"""
    try:
        # Verify project exists
        project = get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify material exists and belongs to project
        material = get_material_by_id(material_id)
        if not material or str(material.project_id) != project_id:
            raise HTTPException(status_code=404, detail="Material not found")
        
        # Update material with vendor assignment
        success = update_material_with_vendor(material_id, vendor_id)
        
        if success:
            return {"message": "Vendor assigned to material successfully"}
        else:
            raise HTTPException(status_code=404, detail="Material not found or not updated")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning vendor to material: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
