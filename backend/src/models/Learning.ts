import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILesson {
  title: string;
  order: number;
  durationMinutes: number;
  content: string;
}

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface ILearningModule extends Document {
  slug: string;
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedMinutes: number;
  order: number;
  iconName: string;
  lessons: ILesson[];
  quiz: IQuizQuestion[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    durationMinutes: { type: Number, default: 5 },
    content: { type: String, required: true },
  },
  { _id: false }
);

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const LearningModuleSchema = new Schema<ILearningModule>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    level: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      required: true,
      index: true,
    },
    estimatedMinutes: { type: Number, required: true, default: 15 },
    order: { type: Number, required: true, default: 1 },
    iconName: { type: String, default: 'GraduationCap' },
    lessons: [LessonSchema],
    quiz: [QuizQuestionSchema],
    isPublished: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

LearningModuleSchema.index({ order: 1, isPublished: 1 });

export const LearningModule = mongoose.model<ILearningModule>(
  'LearningModule',
  LearningModuleSchema
);

export interface IQuizAttempt extends Document {
  userId: Types.ObjectId;
  moduleId: Types.ObjectId;
  score: number;
  totalQuestions: number;
  passed: boolean;
  answers: number[];
  completedAt: Date;
  createdAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'LearningModule',
      required: true,
      index: true,
    },
    score: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 1 },
    passed: { type: Boolean, required: true },
    answers: [{ type: Number }],
    completedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

QuizAttemptSchema.index({ userId: 1, moduleId: 1 });

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
