import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPortfolioSnapshot extends Document {
  userId: Types.ObjectId;
  portfolioId: Types.ObjectId;
  availableCashPaise: number;
  lockedCashPaise: number;
  totalHoldingsValuePaise: number;
  totalNavPaise: number;
  dayPnlPaise: number;
  totalPnlPaise: number;
  capturedAt: Date;
  createdAt: Date;
}

const PortfolioSnapshotSchema = new Schema<IPortfolioSnapshot>(
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
    availableCashPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    lockedCashPaise: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalHoldingsValuePaise: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalNavPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    dayPnlPaise: {
      type: Number,
      default: 0,
    },
    totalPnlPaise: {
      type: Number,
      default: 0,
    },
    capturedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

PortfolioSnapshotSchema.index({ userId: 1, capturedAt: -1 });
PortfolioSnapshotSchema.index({ portfolioId: 1, capturedAt: -1 });

export const PortfolioSnapshot = mongoose.model<IPortfolioSnapshot>(
  'PortfolioSnapshot',
  PortfolioSnapshotSchema
);
