import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITradeExecution extends Document {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  portfolioId: Types.ObjectId;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  side: 'BUY' | 'SELL';
  quantity: number;
  executionPricePaise: number;
  totalValuePaise: number;
  feesPaise: number;
  dataSource?: string;
  quoteTimestamp?: Date;
  executedAt: Date;
  createdAt: Date;
}

const TradeExecutionSchema = new Schema<ITradeExecution>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
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
    side: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Executed quantity must be at least 1'],
    },
    executionPricePaise: {
      type: Number,
      required: true,
      min: [1, 'Execution price must be greater than zero'],
    },
    totalValuePaise: {
      type: Number,
      required: true,
      min: [1, 'Total value must be greater than zero'],
    },
    feesPaise: {
      type: Number,
      default: 0,
      min: [0, 'Fees cannot be negative'],
    },
    dataSource: {
      type: String,
      default: 'MOCK_SIMULATED',
    },
    quoteTimestamp: {
      type: Date,
      default: Date.now,
    },
    executedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

TradeExecutionSchema.index({ userId: 1, executedAt: -1 });
TradeExecutionSchema.index({ symbol: 1, executedAt: -1 });
TradeExecutionSchema.index({ portfolioId: 1, executedAt: -1 });

export const TradeExecution = mongoose.model<ITradeExecution>(
  'TradeExecution',
  TradeExecutionSchema
);
