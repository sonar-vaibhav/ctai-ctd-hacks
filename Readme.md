## Project Structure

```
smart-buy-dash/
├── frontend/          # React + TypeScript frontend
├── backend/           # FastAPI + Python backend
└── Readme.md          # This file
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
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The backend will be available at `http://localhost:8000`

### 2. Frontend Setup (React)

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:8080`

## API Endpoints

### Vendor Management
- `GET /vendors?material={material}&location={location}` - Search vendors
- `POST /vendors/finalize/{vendor_id}` - Finalize a vendor
- `PATCH /vendors/{vendor_id}` - Update vendor information
- `GET /vendors/finalized` - Get all finalized vendors

### Example Usage

```bash
# Search for steel vendors in Pune
http://localhost:8000/vendors?material=steel&location=Pune

```
