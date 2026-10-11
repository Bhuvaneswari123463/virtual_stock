import mongoose, { Schema, Document, Types } from 'mongoose';

export type LedgerEntryType = 'CREDIT' | 'DEBIT';
export type LedgerReason =
  | 'INITIAL_ALLOCATION'
  | 'ORDER_EXECUTION'
  | 'ORDER_RESERVATION'
  | 'ORDER_CANCELLATION_REFUND'
  | 'REVERSAL'
  | 'RESET_WALLET';

export interface ICashLedger extends Document {
  userId: Types.ObjectId;
  portfolioId: Types.ObjectId;
  entryType: LedgerEntryType;
  reason: LedgerReason;
  amountPaise: number;
  balanceBeforePaise: number;
  balanceAfterPaise: number;
  referenceId?: string;
  idempotencyKey?: string;
  description: string;
  createdAt: Date;
}

const CashLedgerSchema = new Schema<ICashLedger>(
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
    entryType: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'INITIAL_ALLOCATION',
        'ORDER_EXECUTION',
        'ORDER_RESERVATION',
        'ORDER_CANCELLATION_REFUND',
        'REVERSAL',
        'RESET_WALLET',
      ],
      required: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: [1, 'Ledger entry amount must be at least 1 paise'],
    },
    balanceBeforePaise: {
      type: Number,
      required: true,
      min: [0, 'Balance before cannot be negative'],
    },
    balanceAfterPaise: {
      type: Number,
      required: true,
      min: [0, 'Balance after cannot be negative'],
    },
    referenceId: {
      type: String,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

CashLedgerSchema.index({ userId: 1, createdAt: -1 });
CashLedgerSchema.index({ portfolioId: 1, createdAt: -1 });
CashLedgerSchema.index({ referenceId: 1 });

export const CashLedger = mongoose.model<ICashLedger>('CashLedger', CashLedgerSchema);
