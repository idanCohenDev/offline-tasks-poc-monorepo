# Server for Offline-First POC

Simple Node.js/TypeScript server with MongoDB for testing offline-first React Native app.

## Requirements
<!--  -->
- Node.js 16+
- MongoDB running locally on port 27017

## Setup

1. **Install MongoDB** (if not already installed):
   ```bash
   # macOS
   brew install mongodb-community
   brew services start mongodb-community

   # Ubuntu/Debian
   sudo apt-get install mongodb
   sudo systemctl start mongodb
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm run dev
   ```

## API Endpoint

**POST** `/api/records`

Creates a new record in MongoDB.

Request body:
```json
{
  "value": "Your text value here",
  "metadata": {
    "any": "optional metadata"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "value": "Your text value here",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "metadata": { ... },
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Record saved successfully"
}
```

## Scripts

- `npm run dev` - Start server in development mode with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server

## Testing

Test with curl:
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -d '{"value": "Test from curl"}'
```