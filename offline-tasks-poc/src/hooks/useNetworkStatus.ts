import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import queueManager from "../services/queueManager";

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    let previousOnlineStatus = true;

    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState(state);
      const currentOnlineStatus = !!state.isConnected && state.isInternetReachable === true;
      setIsOnline(currentOnlineStatus);

      // If we just came back online, drain the queue
      if (!previousOnlineStatus && currentOnlineStatus) {
        console.log('Network restored, draining queue...');
        queueManager.drainQueue().catch(console.error);
      }
      
      previousOnlineStatus = currentOnlineStatus;
    });

    NetInfo.fetch().then((state) => {
      setNetworkState(state);
      const currentOnlineStatus = !!state.isConnected && state.isInternetReachable === true;
      setIsOnline(currentOnlineStatus);
      previousOnlineStatus = currentOnlineStatus;
    });

    return unsubscribe;
  }, []);

  return { isOnline, networkState };
};
