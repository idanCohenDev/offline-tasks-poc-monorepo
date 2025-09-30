import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import queueManager from "./queueManager";

const BACKGROUND_QUEUE_TASK = "background-queue-drain";

// Define the background task (must be in global scope)
TaskManager.defineTask(BACKGROUND_QUEUE_TASK, async () => {
  try {
    console.log("Background task: Starting queue drain...");
    
    // Check if we have any items in the queue
    const queue = await queueManager.getQueue();
    if (queue.length === 0) {
      console.log("Background task: Queue is empty, skipping");
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    
    // Drain the queue
    await queueManager.drainQueue();
    
    // Check if we successfully processed items
    const remainingQueue = await queueManager.getQueue();
    if (remainingQueue.length < queue.length) {
      console.log("Background task: Successfully processed items");
    } else {
      console.log("Background task: No items processed");
    }
    return BackgroundTask.BackgroundTaskResult.Success;
    
  } catch (error) {
    console.error("Background task error:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundTask() {
  try {
    // Check if background tasks are available
    const isAvailable = await TaskManager.isAvailableAsync();
    if (!isAvailable) {
      console.log("Background tasks not available on this device");
      return false;
    }
    
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_QUEUE_TASK);
    if (isRegistered) {
      console.log("Background task already registered");
      return true;
    }
    
    // Register the background task
    await BackgroundTask.registerTaskAsync(BACKGROUND_QUEUE_TASK, {
      minimumInterval: 15 // minimum 15 minutes
    });
    
    console.log("Background task registered successfully");
    console.log("Note: System will execute task when optimal (battery, network conditions)");
    
    return true;
    
  } catch (err) {
    console.error("Background task registration failed:", err);
    return false;
  }
}

export async function unregisterBackgroundTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_QUEUE_TASK);
    if (isRegistered) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_QUEUE_TASK);
      console.log("Background task unregistered");
      return true;
    }
    return false;
  } catch (err) {
    console.error("Background task unregistration failed:", err);
    return false;
  }
}

export async function getBackgroundTaskStatus() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_QUEUE_TASK);
    const isAvailable = await TaskManager.isAvailableAsync();
    const status = await BackgroundTask.getStatusAsync();
    
    return {
      isRegistered,
      isAvailable,
      status: status === BackgroundTask.BackgroundTaskStatus.Available ? 'available' :
              status === BackgroundTask.BackgroundTaskStatus.Restricted ? 'restricted' :
              'denied',
      statusRaw: status
    };
  } catch (error) {
    console.error("Error getting background task status:", error);
    return { 
      isRegistered: false, 
      isAvailable: false, 
      status: 'unknown',
      statusRaw: null 
    };
  }
}

// For testing in development mode only
export async function triggerBackgroundTaskForTesting() {
  if (!__DEV__) {
    console.warn("Background task testing only available in development mode");
    return;
  }
  
  try {
    console.log("Triggering background task for testing...");
    await BackgroundTask.triggerTaskWorkerForTestingAsync();
    console.log("Background task triggered for testing");
  } catch (error) {
    console.error("Error triggering background task for testing:", error);
  }
}
