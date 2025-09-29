import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import queueManager from "./queueManager";

const BACKGROUND_FETCH_TASK = "background-queue-drain";

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log("Background task: Draining queue...");
    await queueManager.drainQueue();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background task error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetch() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log("Background fetch registered");
  } catch (err) {
    console.log("Background fetch registration failed:", err);
  }
}

export async function unregisterBackgroundFetch() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log("Background fetch unregistered");
  } catch (err) {
    console.log("Background fetch unregistration failed:", err);
  }
}
