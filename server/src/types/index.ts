export interface IRecord {
  value: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface CreateRecordDTO {
  value: string;
  metadata?: Record<string, any>;
}