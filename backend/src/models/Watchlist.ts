import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWatchlistItem {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  addedAt: Date;
}

export interface IWatchlist extends Document {
  userId: Types.ObjectId;
  name: string;
  isDefault: boolean;
  items: IWatchlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const WatchlistItemSchema = new Schema<IWatchlistItem>(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    exchange: {
      type: String,
      enum: ['NSE', 'BSE'],
      default: 'NSE',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const WatchlistSchema = new Schema<IWatchlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    items: [WatchlistItemSchema],
  },
  {
    timestamps: true,
  }
);

// One unique watchlist name per user
WatchlistSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Watchlist = mongoose.model<IWatchlist>('Watchlist', WatchlistSchema);
