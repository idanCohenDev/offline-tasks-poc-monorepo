import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import uuid from 'react-native-uuid';
import axios from 'axios';
import { QueuedRequest } from '../types';

const QUEUE_STORAGE_KEY = '@offline_queue';
const MAX_RETRY_ATTEMPTS = 3;

class QueueManager {
  private isDraining = false;
  private listeners: Array<() => void> = [];
  private statusListeners: Array<(update: { queueId: string; status: 'sent' | 'failed'; attemptCount?: number }) => void> = [];

  constructor() {
    this.setupNetworkListener();
    this.setupAppStateListener();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      if (__DEV__ && console.tron) {
        console.tron.display({
          name: '📡 Network Status',
          value: { connected: state.isConnected, reachable: state.isInternetReachable },
          preview: state.isConnected ? 'Online' : 'Offline',
        });
      }
      
      if (state.isConnected && state.isInternetReachable) {
        this.drainQueue();
      }
    });
  }

  private setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        this.drainQueue();
      }
    });
  }

  async addToQueue(request: Omit<QueuedRequest, 'id' | 'createdAt' | 'attemptCount'>) {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: uuid.v4() as string,
      createdAt: new Date().toISOString(),
      attemptCount: 0,
    };

    const queue = await this.getQueue();
    queue.push(queuedRequest);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    
    if (__DEV__ && console.tron) {
      console.tron.display({
        name: '📥 Request Queued',
        value: queuedRequest,
        preview: `${request.method} ${request.url}`,
      });
    }
    
    this.notifyListeners();
    return queuedRequest;
  }

  async getQueue(): Promise<QueuedRequest[]> {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Error reading queue:', error);
      return [];
    }
  }

  async removeFromQueue(id: string) {
    const queue = await this.getQueue();
    const updatedQueue = queue.filter(item => item.id !== id);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
    this.notifyListeners();
  }

  async updateQueueItem(id: string, updates: Partial<QueuedRequest>) {
    const queue = await this.getQueue();
    const index = queue.findIndex(item => item.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      this.notifyListeners();
    }
  }

  async drainQueue() {
    if (this.isDraining) return;

    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      if (__DEV__ && console.tron) {
        console.tron.log('⚠️ Cannot drain queue - offline');
      }
      return;
    }

    this.isDraining = true;
    const queue = await this.getQueue();
    
    if (__DEV__ && console.tron && queue.length > 0) {
      console.tron.log(`🚀 Draining queue with ${queue.length} items`);
    }

    for (const request of queue) {
      if (request.attemptCount >= MAX_RETRY_ATTEMPTS) {
        await this.removeFromQueue(request.id);
        continue;
      }

      try {
        await axios({
          method: request.method,
          url: request.url,
          data: request.body,
          headers: request.headers,
        });
        
        await this.removeFromQueue(request.id);
        
        // Notify UI that request was sent successfully
        this.notifyStatusListeners({ queueId: request.id, status: 'sent' });
        
        if (__DEV__ && console.tron) {
          console.tron.display({
            name: '✅ Request Sent',
            value: request,
            preview: `${request.method} ${request.url}`,
            important: true,
          });
        }
        
        console.log(`Successfully sent queued request: ${request.id}`);
      } catch (error) {
        const updatedAttempts = request.attemptCount + 1;
        await this.updateQueueItem(request.id, { attemptCount: updatedAttempts });
        
        if (__DEV__ && console.tron) {
          console.tron.warn(`❌ Request failed (attempt ${updatedAttempts}/${MAX_RETRY_ATTEMPTS}): ${request.id}`);
        }
        
        if (updatedAttempts >= MAX_RETRY_ATTEMPTS) {
          // Notify UI that request failed after max retries
          this.notifyStatusListeners({ queueId: request.id, status: 'failed', attemptCount: updatedAttempts });
          console.log(`Max retries reached for request ${request.id}, removing from queue`);
          await this.removeFromQueue(request.id);
        }
      }
    }

    this.isDraining = false;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  subscribeToStatus(listener: (update: { queueId: string; status: 'sent' | 'failed'; attemptCount?: number }) => void) {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  private notifyStatusListeners(update: { queueId: string; status: 'sent' | 'failed'; attemptCount?: number }) {
    this.statusListeners.forEach(listener => listener(update));
  }
}

export default new QueueManager();