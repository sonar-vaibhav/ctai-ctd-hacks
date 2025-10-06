# Frontend-Backend Connection Guide

## Overview
The Smart Buy Dashboard frontend is now successfully connected to the FastAPI backend, enabling real-time AI material predictions and vendor management.

## How it Works

### 1. Material Prediction Flow
1. **User Input**: User fills out the project configuration form with:
   - Project Type (e.g., Commercial Construction)
   - Project Size (Small/Medium/Large)
   - Location (State & City)
   - Project Volume (₹)

2. **API Call**: Frontend sends POST request to `/predict` endpoint
3. **AI Processing**: Backend ML model processes the data and predicts materials
4. **Real-time Results**: User sees actual predictions with:
   - Material list with quantities and costs
   - Total cost estimation
   - Confidence percentage
   - Interactive charts and graphs

### 2. Key Features
- **Real-time Predictions**: Uses actual ML model instead of mock data
- **Error Handling**: Graceful fallback if backend is unavailable
- **Loading States**: Shows spinner while processing
- **Success Notifications**: Toast messages for user feedback
- **Data Persistence**: Prediction results flow through to other tabs

### 3. API Endpoints Used
- `GET /`: Health check and API info
- `POST /predict`: Material prediction
- `GET /vendors`: Vendor search (for future integration)

### 4. Environment Configuration
Frontend configured to connect to:
- Backend URL: `http://localhost:8000`
- Frontend URL: `http://localhost:8080`

## Usage Instructions

1. **Start Backend**: 
   ```bash
   cd backend
   python main.py
   ```

2. **Start Frontend**:
   ```bash
   cd frontend  
   npm run dev
   ```

3. **Use the Application**:
   - Open browser to `http://localhost:8080`
   - Fill out project details in Input Form
   - Click "Run AI Prediction"
   - View results in Material Prediction tab
   - Explore vendors, timeline, and other features

## Technical Details

### Data Flow
```
User Input → InputForm → API Service → FastAPI Backend → ML Model → Prediction Response → MaterialPrediction Component → Charts & Tables
```

### State Management
- `ProjectTabs` manages prediction state
- `predictionData` contains real API response
- Components receive actual ML results instead of mock data

### Error Handling
- Network errors show user-friendly messages
- Automatic fallback to mock data if needed
- Loading states prevent multiple submissions

## Next Steps
- Integrate vendor search with predicted materials
- Add procurement timeline with real dates
- Connect with external vendor APIs
- Add project data persistence