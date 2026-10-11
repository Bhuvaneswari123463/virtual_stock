import mongoose, { Schema, Document, Types } from 'mongoose';

export type CompetitionStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

export interface ICompetition extends Document {
  title: string;
  description: string;
  startingCapitalPaise: number;
  status: CompetitionStatus;
  startDate: Date;
  endDate: Date;
  participantCount: number;
  maxParticipants?: number;
  prizePoolDescription: string;
  rules: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CompetitionSchema = new Schema<ICompetition>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    startingCapitalPaise: {
      type: Number,
      required: true,
      default: 100000000, // ₹10,00,000 in paise
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'],
      default: 'UPCOMING',
      index: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    participantCount: { type: Number, default: 0, min: 0 },
    maxParticipants: { type: Number },
    prizePoolDescription: { type: String, default: 'Certificates & Leaderboard Badges' },
    rules: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

CompetitionSchema.index({ status: 1, startDate: 1 });

export const Competition = mongoose.model<ICompetition>('Competition', CompetitionSchema);

export interface ICompetitionParticipant extends Document {
  competitionId: Types.ObjectId;
  userId: Types.ObjectId;
  portfolioId: Types.ObjectId;
  currentNavPaise: number;
  startingNavPaise: number;
  returnPercent: number;
  rank: number;
  tradesCount: number;
  registeredAt: Date;
  updatedAt: Date;
}

const CompetitionParticipantSchema = new Schema<ICompetitionParticipant>(
  {
    competitionId: {
      type: Schema.Types.ObjectId,
      ref: 'Competition',
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
    },
    currentNavPaise: {
      type: Number,
      required: true,
      default: 100000000,
    },
    startingNavPaise: {
      type: Number,
      required: true,
      default: 100000000,
    },
    returnPercent: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 1,
    },
    tradesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One participation per user per competition
CompetitionParticipantSchema.index(
  { competitionId: 1, userId: 1 },
  { unique: true }
);
CompetitionParticipantSchema.index({ competitionId: 1, currentNavPaise: -1 });

export const CompetitionParticipant = mongoose.model<ICompetitionParticipant>(
  'CompetitionParticipant',
  CompetitionParticipantSchema
);
