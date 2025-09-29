import Reactotron from "reactotron-react-native";
import { QueryClientManager, reactotronReactQuery } from "reactotron-react-query";
import { queryClient } from "../services/queryClient";

const queryClientManager = new QueryClientManager({
  queryClient,
});

let reactotron: any = null;

if (__DEV__) {
  reactotron = Reactotron.configure({
    name: "Offline Tasks POC",
    host: "192.168.1.139",
  })
    .useReactNative({
      networking: {
        ignoreUrls: /symbolicate/,
      },
      errors: true,
      editor: false,
      overlay: false,
    })
    .use(reactotronReactQuery(queryClientManager))
    .connect();

  // Clear on every app start for clean debugging
  reactotron.clear();

  // Attach to console
  console.tron = reactotron;

  // Custom commands for queue debugging
  reactotron.onCustomCommand({
    command: "clearQueue",
    handler: async () => {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.removeItem("@offline_queue");
      console.tron.log("Queue cleared!");
    },
    title: "Clear Offline Queue",
    description: "Removes all queued requests from AsyncStorage",
  });

  reactotron.onCustomCommand({
    command: "showQueue",
    handler: async () => {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      const queue = await AsyncStorage.getItem("@offline_queue");
      console.tron.display({
        name: "Current Queue",
        value: queue ? JSON.parse(queue) : [],
        preview: `${queue ? JSON.parse(queue).length : 0} items in queue`,
      });
    },
    title: "Show Queue",
    description: "Display current offline queue contents",
  });
}

// Add TypeScript support for console.tron
declare global {
  interface Console {
    tron: any;
  }
}

export default reactotron;
