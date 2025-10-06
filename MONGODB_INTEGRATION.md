# MongoDB Integration Guide for Smart Buy Dashboard

This guide explains how to integrate MongoDB with the Smart Buy Dashboard project and deploy it to Render.

## MongoDB Database Structure

### Database Name
`smartbuy_dashboard`

### Collections
1. **projects** - Store project information
2. **materials** - Store material predictions and actual procurement data
3. **vendors** - Store vendor information
4. **procurement_timeline** - Store procurement schedule and tracking
5. **users** - Store user authentication data
6. **predictions** - Store AI prediction results
7. **chat_history** - Store AI chatbot conversations

## Local Development Setup

### 1. Install MongoDB
If you don't have MongoDB installed locally, you can:
- Download and install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
- Or use Docker:
  ```bash
  docker run --name mongodb -p 27017:27017 -d mongo
  ```

### 2. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create a `.env` file in the `backend` directory:
```env
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/
MONGODB_DATABASE_NAME=smartbuy_dashboard
```

### 4. Run the Application
```bash
cd backend
python main.py
```

## Deployment to Render

### 1. Create a Render Account
Sign up at [render.com](https://render.com/)

### 2. Connect Your Repository
- Fork this repository to your GitHub account
- Connect Render to your GitHub account
- Create a new Web Service and select your forked repository

### 3. Configure Render Service
Render will automatically detect the `render.yaml` file. The configuration includes:
- Build command: `pip install -r backend/requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

### 4. Set Environment Variables in Render
In your Render service dashboard, add the following environment variables:
- `MONGODB_CONNECTION_STRING` - Your MongoDB connection string (from MongoDB Atlas or other provider)
- `MONGODB_DATABASE_NAME` - `smartbuy_dashboard`

### 5. Deploy MongoDB (if needed)
For production, you'll need a MongoDB database. Options include:
- MongoDB Atlas (recommended): [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Render's database services
- Self-hosted MongoDB

## API Endpoints

### Project Management
- `POST /projects` - Create a new project
- `GET /projects` - Get all projects
- `GET /projects/{project_id}` - Get a specific project

### Prediction Management
- `POST /projects/{project_id}/predictions` - Save prediction results
- `GET /projects/{project_id}/predictions` - Get prediction results

### Vendor Management
- `POST /vendors/save` - Save vendor data

## Frontend Integration

The frontend has been updated to:
1. Save projects to MongoDB when predictions are generated
2. Save vendor data when vendors are finalized
3. Load saved predictions from MongoDB when available

## Testing

To test the MongoDB integration:
1. Start the backend server
2. Make a POST request to `/projects` with project data
3. Verify the project is saved in MongoDB
4. Make a POST request to `/projects/{project_id}/predictions` with prediction data
5. Verify the prediction is saved in MongoDB

Example test with curl:
```bash
# Create a project
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -d '{"projectType": "Commercial Construction", "size": "Medium", "state": "Maharashtra", "city": "Mumbai", "volume": "50000000"}'

# Save a prediction (use the project_id from the response above)
curl -X POST http://localhost:8000/projects/{project_id}/predictions \
  -H "Content-Type: application/json" \
  -d '{"success": true, "materials": [{"id": "1", "name": "Structural Steel", "category": "Steel", "quantity": 100, "unit": "tons", "cost": 5000000}], "total_cost": 5000000, "confidence": 94.0}'
```

## Troubleshooting

### Common Issues
1. **Connection refused**: Ensure MongoDB is running and the connection string is correct
2. **Authentication failed**: Check MongoDB credentials if using authentication
3. **Collection not found**: Ensure the database and collections are created (they will be created automatically on first use)

### Logs
Check Render logs for deployment issues:
- Application logs in Render dashboard
- MongoDB logs for database connection issues

## Security Considerations

1. **Environment Variables**: Never commit sensitive information like database connection strings to version control
2. **Database Access**: Use MongoDB authentication and restrict access to necessary IP addresses
3. **API Security**: Consider adding authentication to API endpoints in production