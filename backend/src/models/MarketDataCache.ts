import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketDataCache extends Document {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  companyName: string;
  sector: string;
  ltpPaise: number;
  openPaise: number;
  highPaise: number;
  lowPaise: number;
  previousClosePaise: number;
  volume: number;
  changePaise: number;
  changePercent: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MarketDataCacheSchema = new Schema<IMarketDataCache>(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    exchange: {
      type: String,
      enum: ['NSE', 'BSE'],
      default: 'NSE',
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    sector: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    ltpPaise: {
      type: Number,
      required: true,
      min: [1, 'LTP must be positive'],
    },
    openPaise: {
      type: Number,
      required: true,
    },
    highPaise: {
      type: Number,
      required: true,
    },
    lowPaise: {
      type: Number,
      required: true,
    },
    previousClosePaise: {
      type: Number,
      required: true,
    },
    volume: {
      type: Number,
      required: true,
      default: 0,
    },
    changePaise: {
      type: Number,
      required: true,
      default: 0,
    },
    changePercent: {
      type: Number,
      required: true,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MarketDataCacheSchema.index({ exchange: 1, sector: 1 });
MarketDataCacheSchema.index({ changePercent: -1 });

export const MarketDataCache = mongoose.model<IMarketDataCache>(
  'MarketDataCache',
  MarketDataCacheSchema
);
