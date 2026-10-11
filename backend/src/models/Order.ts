import mongoose, { Schema, Document, Types } from 'mongoose';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT';
export type OrderProductType = 'CNC' | 'MIS';
export type OrderStatus = 'OPEN' | 'PENDING' | 'FILLED' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';

export interface IOrder extends Document {
  userId: Types.ObjectId;
  portfolioId: Types.ObjectId;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  side: OrderSide;
  type: OrderType;
  productType: OrderProductType;
  status: OrderStatus;
  quantity: number;
  filledQuantity: number;
  limitPricePaise?: number;
  avgExecutionPricePaise: number;
  reservedMarginPaise: number;
  estimatedFeesPaise?: number;
  idempotencyKey?: string;
  dataSource?: string;
  quoteTimestamp?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
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
    side: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    type: {
      type: String,
      enum: ['MARKET', 'LIMIT'],
      required: true,
    },
    productType: {
      type: String,
      enum: ['CNC', 'MIS'],
      default: 'CNC',
    },
    status: {
      type: String,
      enum: ['OPEN', 'PENDING', 'FILLED', 'EXECUTED', 'CANCELLED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Order quantity must be at least 1'],
    },
    filledQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Filled quantity cannot be negative'],
    },
    limitPricePaise: {
      type: Number,
      min: [1, 'Limit price must be greater than zero'],
    },
    avgExecutionPricePaise: {
      type: Number,
      default: 0,
      min: [0, 'Average execution price cannot be negative'],
    },
    reservedMarginPaise: {
      type: Number,
      default: 0,
      min: [0, 'Reserved margin cannot be negative'],
    },
    estimatedFeesPaise: {
      type: Number,
      default: 0,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      index: true,
    },
    dataSource: {
      type: String,
    },
    quoteTimestamp: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ portfolioId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, type: 1 });
OrderSchema.index({ symbol: 1, status: 1 });
OrderSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
