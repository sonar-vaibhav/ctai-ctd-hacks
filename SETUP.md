# Smart Buy Dashboard - Complete Setup Guide

This project implements a vendor scraping and management system with IndiaMART integration.

## Project Structure

```
smart-buy-dash/
├── frontend/          # React + TypeScript frontend
├── backend/           # FastAPI + Python backend
└── SETUP.md          # This file
```

## Quick Start

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp env.example .env

# Start the backend server
python run.py
```

The backend will be available at `http://localhost:8000`

### 2. Frontend Setup (React)

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Features Implemented

### Backend (FastAPI)
- ✅ **IndiaMART Web Scraping**: Automated scraping of vendor data
- ✅ **RESTful API**: Clean endpoints for vendor management
- ✅ **SQLite Database**: Persistent storage for vendor data
- ✅ **CORS Support**: Configured for frontend integration
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Rate Limiting**: Built-in delays to avoid being blocked

### Frontend (React)
- ✅ **Vendor Search**: Search for vendors by material and location
- ✅ **Real-time Scraping**: Live scraping from IndiaMART
- ✅ **Vendor Management**: Finalize and manage vendor selections
- ✅ **Modern UI**: Beautiful interface with Tailwind CSS and shadcn/ui
- ✅ **Loading States**: Proper loading indicators during scraping
- ✅ **Error Handling**: User-friendly error messages

## API Endpoints

### Vendor Management
- `GET /vendors?material={material}&location={location}` - Search vendors
- `POST /vendors/finalize/{vendor_id}` - Finalize a vendor
- `PATCH /vendors/{vendor_id}` - Update vendor information
- `GET /vendors/finalized` - Get all finalized vendors

### Example Usage

```bash
# Search for steel vendors in Pune
curl "http://localhost:8000/vendors?material=steel&location=Pune"

# Finalize a vendor
curl -X POST "http://localhost:8000/vendors/finalize/1"

# Update vendor status
curl -X PATCH "http://localhost:8000/vendors/1" \
  -H "Content-Type: application/json" \
  -d '{"payment_status": "Completed", "delivery_status": "Delivered"}'
```

## How It Works

### 1. Material Search
- User selects a material from the project materials list
- Clicks "Find Vendors" button
- Frontend calls backend API with material and optional location

### 2. IndiaMART Scraping
- Backend constructs search URL for IndiaMART
- Uses BeautifulSoup to scrape vendor listings
- Extracts vendor name, location, contact info, and profile URL
- Stores results in SQLite database

### 3. Vendor Selection
- Frontend displays scraped vendors in a modal
- User can view vendor details and contact information
- User can finalize a vendor for the material

### 4. Vendor Management
- Finalized vendors are tracked in the database
- Payment and delivery status can be updated
- Integration with procurement timeline

## Configuration

### Backend Environment Variables
```env
HOST=0.0.0.0
PORT=8000
RELOAD=true
DATABASE_URL=sqlite:///./vendors.db
SCRAPING_DELAY_MIN=1
SCRAPING_DELAY_MAX=3
MAX_VENDORS_PER_SEARCH=10
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Smart Buy Dashboard
VITE_APP_VERSION=1.0.0
```

## Database Schema

The SQLite database includes a `vendors` table:

```sql
CREATE TABLE vendors (
    id INTEGER PRIMARY KEY,
    material VARCHAR,
    vendor_name VARCHAR,
    location VARCHAR,
    contact VARCHAR,
    email VARCHAR,
    url VARCHAR,
    finalized BOOLEAN DEFAULT FALSE,
    payment_status VARCHAR DEFAULT 'Pending',
    delivery_status VARCHAR DEFAULT 'Not Started',
    notes TEXT,
    created_at DATETIME,
    updated_at DATETIME
);
```

## Troubleshooting

### Common Issues

1. **Backend won't start**
   - Check if Python 3.8+ is installed
   - Ensure virtual environment is activated
   - Install all dependencies: `pip install -r requirements.txt`

2. **Frontend can't connect to backend**
   - Ensure backend is running on port 8000
   - Check CORS configuration in backend
   - Verify `VITE_API_URL` in frontend .env file

3. **Scraping fails**
   - IndiaMART may have changed their HTML structure
   - Check network connectivity
   - Review error logs in backend console

4. **Database issues**
   - Delete `vendors.db` file to reset database
   - Check file permissions
   - Ensure SQLite is properly installed

### Logs

- Backend logs are displayed in the console
- Frontend errors are shown in browser console
- Database queries are logged in backend

## Development

### Adding New Features

1. **Backend**: Add new endpoints in `main.py`
2. **Frontend**: Update components in `src/components/`
3. **API Integration**: Update `src/services/api.ts`

### Testing

- Backend: Use the Swagger UI at `http://localhost:8000/docs`
- Frontend: Test in browser with developer tools open
- Integration: Test the complete flow from material selection to vendor finalization

## Production Deployment

### Backend
1. Use a production WSGI server (Gunicorn)
2. Set up proper database (PostgreSQL)
3. Configure environment variables
4. Set up logging and monitoring

### Frontend
1. Build for production: `npm run build`
2. Serve with a web server (Nginx)
3. Configure API URL for production

## Security Considerations

- Rate limiting for scraping requests
- Input validation and sanitization
- CORS configuration
- Error message sanitization
- Database query parameterization

## Performance Optimization

- Database indexing on frequently queried fields
- Caching of scraped results
- Pagination for large result sets
- Async processing for long-running operations

## License

MIT License - see LICENSE file for details
