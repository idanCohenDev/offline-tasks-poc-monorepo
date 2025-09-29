# Offline-First Expo POC with Reactotron

A minimal React Native Expo app demonstrating offline-first architecture with queue persistence and background synchronization.

## Features

- ✅ **Offline Queue Management** - Failed requests automatically queued
- ✅ **Persistent Storage** - Queue survives app restarts via AsyncStorage  
- ✅ **Automatic Sync** - Queue drains when network returns
- ✅ **Background Processing** - Expo Background Fetch for periodic sync
- ✅ **React Query Integration** - With persistence to AsyncStorage
- ✅ **Reactotron Debugging** - Full visibility into queue operations

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start MongoDB Server
```bash
cd ../server
npm run dev
```

### 3. Install and Start Reactotron
Download Reactotron from: https://github.com/infinitered/reactotron/releases

### 4. Run the App
```bash
npm start
# Press 'i' for iOS or 'a' for Android
```

## Reactotron Features

When running in development, Reactotron provides:

- **Network Monitoring** - See all API requests/responses
- **AsyncStorage Inspector** - View persisted queue data
- **React Query DevTools** - Monitor query states
- **Custom Commands**:
  - `Clear Queue` - Remove all queued requests
  - `Show Queue` - Display current queue contents
- **Queue Logs**:
  - 📥 Request queued events
  - ✅ Successful sync events  
  - ❌ Failed retry attempts
  - 📡 Network status changes

## Testing Offline Behavior

1. **Toggle Airplane Mode** on your device/simulator
2. **Press "Send Request"** - Request will be queued
3. **Check Reactotron** - See the queued request
4. **Turn Airplane Mode Off** - Queue automatically drains
5. **Monitor in Reactotron** - Watch the sync process

## Architecture

### Queue Flow
```
User Action → API Call → Network Check
                ↓                ↓
           [Online]          [Offline]
                ↓                ↓
          Send Request      Queue Request
                              ↓
                        [Network Returns]
                              ↓
                        Auto Drain Queue
```

### Background Sync
- Runs every 15 minutes (minimum iOS allows)
- Checks queue and drains if online
- Configured in `app.json` with UIBackgroundModes

## Project Structure
```
src/
├── config/
│   └── reactotron.ts       # Reactotron configuration
├── services/
│   ├── queueManager.ts     # Queue logic with Reactotron logging
│   ├── apiService.ts       # API client with offline handling
│   ├── queryClient.ts      # React Query setup
│   └── backgroundTask.ts   # Background fetch task
├── hooks/
│   ├── useQueue.ts         # Queue state hook
│   └── useNetworkStatus.ts # Network monitoring
├── screens/
│   └── MainScreen.tsx      # Main UI
└── types/
    └── index.ts           # TypeScript definitions
```

## Debugging Tips

1. **Physical Device**: Change `host: 'localhost'` to your computer's IP in `reactotron.ts`
2. **Clear Logs**: Reactotron clears on each app start for clean debugging
3. **Custom Commands**: Use Reactotron's custom commands to manipulate queue
4. **Network Tab**: Monitor all axios requests in Reactotron's Network tab

## Server

The companion Node.js server is located at `../server` and provides:
- POST `/api/records` - Save values to MongoDB
- Health check at `/health`

Make sure MongoDB is running locally on port 27017.