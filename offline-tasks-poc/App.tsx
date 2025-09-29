import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from './src/services/queryClient';
import { registerBackgroundFetch } from './src/services/backgroundTask';
import queueManager from './src/services/queueManager';
import { MainScreen } from './src/screens/MainScreen';

// Initialize Reactotron in development
if (__DEV__) {
  import('./src/config/reactotron').then(() => console.log('Reactotron Configured'));
}

export default function App() {
  useEffect(() => {
    registerBackgroundFetch();
    
    // Listen for app state changes and drain queue when coming to foreground
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('App came to foreground, checking queue...');
        queueManager.drainQueue().catch(console.error);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    if (__DEV__ && console.tron) {
      console.tron.log('App initialized');
    }

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <MainScreen />
      <StatusBar style="auto" />
    </PersistQueryClientProvider>
  );
}