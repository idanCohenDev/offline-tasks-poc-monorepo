import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 0,
    },
  },
});

const asyncStoragePersister = {
  persistClient: async (client: any) => {
    await AsyncStorage.setItem("REACT_QUERY_OFFLINE_CACHE", JSON.stringify(client));
  },
  restoreClient: async () => {
    const cacheString = await AsyncStorage.getItem("REACT_QUERY_OFFLINE_CACHE");
    if (!cacheString) {
      return;
    }
    return JSON.parse(cacheString);
  },
  removeClient: async () => {
    await AsyncStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
  },
};

export { asyncStoragePersister };
