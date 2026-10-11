import mongoose, { Schema, Document, Types } from 'mongoose';
import { STARTING_VIRTUAL_CAPITAL_PAISE } from '../utilities/money';

export interface IPortfolio extends Document {
  userId: Types.ObjectId;
  cashBalancePaise: number;
  reservedCashPaise: number;
  initialCapitalPaise: number;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    cashBalancePaise: {
      type: Number,
      required: true,
      default: STARTING_VIRTUAL_CAPITAL_PAISE,
      min: [0, 'Cash balance cannot be negative'],
    },
    reservedCashPaise: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Reserved cash cannot be negative'],
    },
    initialCapitalPaise: {
      type: Number,
      required: true,
      default: STARTING_VIRTUAL_CAPITAL_PAISE,
      immutable: true, // Permanent record of initial allocation
    },
  },
  {
    timestamps: true,
  }
);

PortfolioSchema.index({ userId: 1 });

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
