import mongoose, { Document, Schema } from 'mongoose';
import { IRecord } from '../types';

export interface IRecordDocument extends IRecord, Document {
  createdAt: Date;
  updatedAt: Date;
}

const RecordSchema = new Schema<IRecordDocument>(
  {
    value: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Record = mongoose.model<IRecordDocument>('Record', RecordSchema);