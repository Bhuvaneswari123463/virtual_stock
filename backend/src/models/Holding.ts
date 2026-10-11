import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IHolding extends Document {
  userId: Types.ObjectId;
  portfolioId: Types.ObjectId;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  quantity: number;
  lockedQuantity: number;
  avgBuyPricePaise: number;
  totalInvestedPaise: number;
  createdAt: Date;
  updatedAt: Date;
}

const HoldingSchema = new Schema<IHolding>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    portfolioId: {
      type: Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: true,
      index: true,
    },
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
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Holding quantity cannot be negative'],
    },
    lockedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Locked quantity cannot be negative'],
    },
    avgBuyPricePaise: {
      type: Number,
      required: true,
      min: [0, 'Average buy price cannot be negative'],
    },
    totalInvestedPaise: {
      type: Number,
      required: true,
      min: [0, 'Total invested cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: one holding record per user per symbol
HoldingSchema.index({ userId: 1, symbol: 1 }, { unique: true });
HoldingSchema.index({ portfolioId: 1 });

export const Holding = mongoose.model<IHolding>('Holding', HoldingSchema);
