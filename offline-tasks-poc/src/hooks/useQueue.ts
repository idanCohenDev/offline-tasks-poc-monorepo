import { useEffect, useState } from "react";
import queueManager from "../services/queueManager";
import { QueuedRequest } from "../types";

export const useQueue = () => {
  const [queue, setQueue] = useState<QueuedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQueue = async () => {
      const currentQueue = await queueManager.getQueue();
      setQueue(currentQueue);
      setIsLoading(false);
    };

    loadQueue();

    const unsubscribe = queueManager.subscribe(() => {
      loadQueue();
    });

    return unsubscribe;
  }, []);

  return { queue, isLoading };
};
