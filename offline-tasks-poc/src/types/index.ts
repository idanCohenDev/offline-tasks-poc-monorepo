export interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  createdAt: string;
  attemptCount: number;
}

export interface RequestLog {
  id: string;
  url: string;
  method: string;
  status: 'pending' | 'sent' | 'failed';
  timestamp: string;
  attemptCount?: number;
  queueId?: string;
}