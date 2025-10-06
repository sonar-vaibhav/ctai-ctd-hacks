# Smart Buy Dashboard

[GitHub Repository](https://github.com/sonar-vaibhav/ctai-ctd-hacks)
[Live Project](https://ctai-ctd-hacks.onrender.com/)

Smart Buy Dashboard is a comprehensive procurement management platform that combines AI-powered material prediction with real-time vendor sourcing from IndiaMART.

## Quick Start

### 1. Backend Setup

```bash
cd backend
python start_server.py
```

### 2. MongoDB Setup
1. Create a MongoDB database (name: `ctd`)
2. Update [.env](file:///d:/Projects/smart-buy-dash/backend/.env) with your MongoDB connection string:
```env
MONGODB_CONNECTION_STRING=your_mongodb_connection_string_here
MONGODB_DATABASE_NAME=ctd
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
smart-buy-dash/
├── frontend/          # React + TypeScript frontend with shadcn-ui components
│   ├── src/           # Source code
│   ├── package.json   # Dependencies and scripts
│   └── ...            # Other configuration files
├── backend/           # FastAPI + Python backend
│   ├── main.py        # Main application entry point
│   ├── database/      # Database management
│   ├── ml/            # Machine learning models
│   ├── models/        # Data models
│   ├── requirements.txt # Python dependencies (for development with ML)
│   └── ...            # Other backend files
├── Readme.md          # Main project documentation
├── FRONTEND_BACKEND_CONNECTION.md # Frontend-backend integration guide
├── MONGODB_INTEGRATION.md # MongoDB setup and deployment guide
├── DEPLOYMENT_GUIDE.md # Detailed deployment instructions
└── render.yaml        # Render deployment configuration
```

## Prerequisites

Before you begin, ensure you have the following installed:
- **Python 3.11** (for backend - Python 3.13 has compatibility issues with pandas)
- **Node.js 16+** (for frontend)
- **npm or yarn** (package managers)
- **MongoDB** (for database, can be local or cloud instance)

## Quick Start Guide

### 1. Backend Setup (FastAPI)

You can start the server directly:
```bash
cd backend
python start_server.py
```

The backend API will be available at `http://localhost:8000`

### 2. MongoDB Setup

For local development, you'll need MongoDB running. You can either:

1. Install MongoDB locally: [Download MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Use Docker:
   ```bash
   docker run --name mongodb -p 27017:27017 -d mongo
   ```

Update your [.env](file:///d:/Projects/smart-buy-dash/backend/.env) file in the backend directory with your MongoDB connection string:
```env
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/
MONGODB_DATABASE_NAME=smartbuy_dashboard
```

### 3. Frontend Setup (React + Vite)

Open a new terminal window/tab (keep the backend running):

```bash
cd frontend
npm install
npm run dev
```

## Deployment

### Deploying to Render

This project is configured for deployment on Render with separate services for frontend and backend.

1. Fork this repository to your GitHub account
2. Create a new Web Service on Render
3. Connect it to your forked repository
4. Configure the following environment variables in your Render dashboard:
   - `MONGODB_CONNECTION_STRING` - Your MongoDB connection string
   - `MONGODB_DATABASE_NAME` - Database name (should be `ctd`)
   - `VITE_API_URL` - The URL of your deployed backend service
