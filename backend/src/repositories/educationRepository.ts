import { LearningModule } from '../models';
import { dbManager } from '../config/database';
import { EducationFilterQuery } from '../schemas/educationSchemas';
import { PaginatedResult } from '../schemas/commonSchemas';

export interface LearningModuleSummaryDTO {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedMinutes: number;
  order: number;
  iconName: string;
  lessonCount: number;
  questionCount: number;
}

export interface LearningModuleDetailDTO extends LearningModuleSummaryDTO {
  lessons: Array<{
    title: string;
    order: number;
    durationMinutes: number;
    content: string;
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    explanation: string;
  }>;
}

export const INITIAL_MODULES_SEED = [
  {
    slug: 'stock-market-foundations',
    title: 'Indian Stock Market Foundations',
    description: 'Learn how the NSE, BSE, SEBI regulation, and equity trading mechanics work in India.',
    level: 'BEGINNER' as const,
    estimatedMinutes: 20,
    order: 1,
    iconName: 'TrendingUp',
    isPublished: true,
    lessons: [
      {
        title: 'Introduction to NSE and BSE',
        order: 1,
        durationMinutes: 5,
        content: 'The National Stock Exchange (NSE) and Bombay Stock Exchange (BSE) are the premier stock exchanges in India...',
      },
      {
        title: 'Understanding Market Orders vs Limit Orders',
        order: 2,
        durationMinutes: 7,
        content: 'Market orders execute immediately at the best available price. Limit orders specify the maximum or minimum price...',
      },
      {
        title: 'Settlement Cycles & Market Timings',
        order: 3,
        durationMinutes: 8,
        content: 'Normal market trading hours are 9:15 AM to 3:30 PM IST Monday through Friday, operating under T+1 settlement.',
      },
    ],
    quiz: [
      {
        question: 'What are standard normal equity market trading hours in India?',
        options: ['9:00 AM - 4:00 PM IST', '9:15 AM - 3:30 PM IST', '10:00 AM - 3:00 PM IST', '9:30 AM - 4:30 PM IST'],
        correctOptionIndex: 1,
        explanation: 'Regular trading on NSE and BSE takes place between 9:15 AM and 3:30 PM IST.',
      },
      {
        question: 'Which order type guarantees execution price over execution certainty?',
        options: ['Market Order', 'Limit Order', 'Stop Loss Market', 'After Market Order'],
        correctOptionIndex: 1,
        explanation: 'A limit order guarantees that an order executes only at the specified limit price or better.',
      },
    ],
  },
  {
    slug: 'risk-management-position-sizing',
    title: 'Risk Management & Position Sizing',
    description: 'Master capital preservation, calculating risk-reward ratios, and stop-loss placement.',
    level: 'INTERMEDIATE' as const,
    estimatedMinutes: 25,
    order: 2,
    iconName: 'ShieldAlert',
    isPublished: true,
    lessons: [
      {
        title: 'The 1-2% Rule of Portfolio Risk',
        order: 1,
        durationMinutes: 8,
        content: 'Professional traders avoid risking more than 1% to 2% of their total account equity on any single trade idea...',
      },
      {
        title: 'Calculating Position Size based on Invalidation',
        order: 2,
        durationMinutes: 10,
        content: 'Position size = (Total Equity * Risk Percentage) / (Entry Price - Stop Loss Price)...',
      },
    ],
    quiz: [
      {
        question: 'If portfolio value is ₹10,00,000 and max risk is 1%, what is maximum risk per trade?',
        options: ['₹1,000', '₹5,000', '₹10,000', '₹50,000'],
        correctOptionIndex: 2,
        explanation: '1% of ₹10,00,000 is ₹10,000.',
      },
    ],
  },
];

export class EducationRepository {
  private inMemoryModules = [...INITIAL_MODULES_SEED];

  async ensureSeeded(): Promise<void> {
    if (!dbManager.isConnected()) return;
    try {
      const count = await LearningModule.countDocuments();
      if (count === 0) {
        await LearningModule.insertMany(INITIAL_MODULES_SEED);
      }
    } catch {
      // Continue gracefully
    }
  }

  async findMany(query: EducationFilterQuery): Promise<PaginatedResult<LearningModuleSummaryDTO>> {
    const { page, limit, level, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    if (dbManager.isConnected()) {
      await this.ensureSeeded();

      const filter: Record<string, any> = { isPublished: true };
      if (level) filter.level = level;

      const sortDir = sortOrder === 'asc' ? 1 : -1;
      const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortDir };

      const [docs, total] = await Promise.all([
        LearningModule.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
        LearningModule.countDocuments(filter),
      ]);

      const items = docs.map(this.mapDocToSummary);
      const totalPages = Math.ceil(total / limit) || 1;

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    }

    // In-memory fallback
    let filtered = [...this.inMemoryModules];
    if (level) filtered = filtered.filter((m) => m.level === level);

    filtered.sort((a, b) => {
      const valA = (a as any)[sortBy] ?? 0;
      const valB = (b as any)[sortBy] ?? 0;
      if (sortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: paginated.map(this.mapDocToSummary),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findBySlug(slug: string): Promise<LearningModuleDetailDTO | null> {
    if (dbManager.isConnected()) {
      await this.ensureSeeded();
      const doc = await LearningModule.findOne({ slug: slug.toLowerCase(), isPublished: true }).lean();
      return doc ? this.mapDocToDetail(doc) : null;
    }

    const item = this.inMemoryModules.find((m) => m.slug === slug.toLowerCase());
    return item ? this.mapDocToDetail(item) : null;
  }

  private mapDocToSummary(doc: any): LearningModuleSummaryDTO {
    return {
      id: String(doc._id || doc.slug),
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      level: doc.level,
      estimatedMinutes: doc.estimatedMinutes,
      order: doc.order,
      iconName: doc.iconName || 'BookOpen',
      lessonCount: doc.lessons?.length || 0,
      questionCount: doc.quiz?.length || 0,
    };
  }

  private mapDocToDetail(doc: any): LearningModuleDetailDTO {
    const summary = this.mapDocToSummary(doc);
    return {
      ...summary,
      lessons: (doc.lessons || []).map((l: any) => ({
        title: l.title,
        order: l.order,
        durationMinutes: l.durationMinutes,
        content: l.content,
      })),
      quiz: (doc.quiz || []).map((q: any) => ({
        question: q.question,
        options: q.options,
        explanation: q.explanation,
      })),
    };
  }
}

export const educationRepository = new EducationRepository();
