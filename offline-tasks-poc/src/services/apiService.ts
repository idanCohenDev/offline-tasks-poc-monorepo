import NetInfo from "@react-native-community/netinfo";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { QueuedRequest } from "../types";
import queueManager from "./queueManager";

const API_BASE_URL = "http://192.168.1.139:3000/api";

interface ApiRequestParams {
  url: string;
  method: QueuedRequest["method"];
  body?: any;
  headers?: Record<string, string>;
}

export const sendApiRequest = async ({ url, method, body, headers }: ApiRequestParams) => {
  const netState = await NetInfo.fetch();

  if (!netState.isConnected || !netState.isInternetReachable) {
    const queuedRequest = await queueManager.addToQueue({
      url: url.startsWith("http") ? url : `${API_BASE_URL}${url}`,
      method,
      body,
      headers,
    });

    throw new Error(`Request queued (offline). ID: ${queuedRequest.id}`);
  }

  try {
    const response = await axios({
      method,
      url: url.startsWith("http") ? url : `${API_BASE_URL}${url}`,
      data: body,
      headers,
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    const queuedRequest = await queueManager.addToQueue({
      url: url.startsWith("http") ? url : `${API_BASE_URL}${url}`,
      method,
      body,
      headers,
    });

    throw new Error(`Request failed and queued. ID: ${queuedRequest.id}`);
  }
};

export const useOfflineMutation = () => {
  return useMutation({
    mutationFn: sendApiRequest,
    onSuccess: (data) => {
      console.log("Request successful:", data);
    },
    onError: (error: Error) => {
      console.log("Request queued or failed:", error.message);
    },
  });
};
