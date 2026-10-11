import { Competition, CompetitionParticipant } from '../models';
import { dbManager } from '../config/database';
import { CompetitionFilterQuery } from '../schemas/competitionSchemas';
import { PaginatedResult } from '../schemas/commonSchemas';

export interface CompetitionSummaryDTO {
  id: string;
  title: string;
  description: string;
  startingCapitalPaise: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  startDate: string;
  endDate: string;
  participantCount: number;
  maxParticipants?: number;
  prizePoolDescription: string;
  rules: string[];
}

export interface LeaderboardEntryDTO {
  rank: number;
  participantId: string;
  userId: string;
  userName: string;
  currentNavPaise: number;
  returnPercent: number;
  tradesCount: number;
}

export const INITIAL_COMPETITIONS_SEED = [
  {
    title: 'NSE Alpha Traders Championship 2026',
    description: 'Compete against virtual portfolio managers across India. Standard starting capital ₹10,00,000.',
    startingCapitalPaise: 100000000,
    status: 'ACTIVE' as const,
    startDate: new Date('2026-10-01T09:15:00Z'),
    endDate: new Date('2026-10-31T15:30:00Z'),
    participantCount: 1420,
    maxParticipants: 5000,
    prizePoolDescription: 'Gold Trophy Badge, Wall of Fame listing, Pro Trader Certification',
    rules: [
      'Virtual capital of ₹10,00,000 provided at start.',
      'Only NSE cash equities eligible.',
      'Maximum position size per stock is 25% of total portfolio value.',
      'Minimum 5 trades required to qualify for leaderboard rankings.',
    ],
  },
  {
    title: 'Dalal Street Weekly Sprint',
    description: 'Weekly 5-day trading sprint for short-term momentum and swing traders.',
    startingCapitalPaise: 100000000,
    status: 'UPCOMING' as const,
    startDate: new Date('2026-10-19T09:15:00Z'),
    endDate: new Date('2026-10-23T15:30:00Z'),
    participantCount: 384,
    maxParticipants: 1000,
    prizePoolDescription: 'Sprint Leader Badge & Pro Trader perks',
    rules: ['Virtual capital of ₹10,00,000.', 'Intraday and swing positions permitted.'],
  },
];

export class CompetitionRepository {
  private inMemoryCompetitions = [...INITIAL_COMPETITIONS_SEED];

  async ensureSeeded(): Promise<void> {
    if (!dbManager.isConnected()) return;
    try {
      const count = await Competition.countDocuments();
      if (count === 0) {
        await Competition.insertMany(INITIAL_COMPETITIONS_SEED);
      }
    } catch {
      // Continue gracefully
    }
  }

  async findMany(query: CompetitionFilterQuery): Promise<PaginatedResult<CompetitionSummaryDTO>> {
    const { page, limit, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    if (dbManager.isConnected()) {
      await this.ensureSeeded();

      const filter: Record<string, any> = {};
      if (status) filter.status = status;

      const sortDir = sortOrder === 'asc' ? 1 : -1;
      const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortDir };

      const [docs, total] = await Promise.all([
        Competition.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
        Competition.countDocuments(filter),
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
    let filtered = [...this.inMemoryCompetitions];
    if (status) filtered = filtered.filter((c) => c.status === status);

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

  async findLeaderboard(competitionId: string): Promise<LeaderboardEntryDTO[]> {
    if (dbManager.isConnected()) {
      const docs = await CompetitionParticipant.find({ competitionId })
        .sort({ currentNavPaise: -1 })
        .limit(20)
        .populate('userId', 'fullName username')
        .lean();

      if (docs.length > 0) {
        return docs.map((doc: any, index: number) => ({
          rank: index + 1,
          participantId: String(doc._id),
          userId: String(doc.userId?._id || doc.userId),
          userName: doc.userId?.fullName || `Trader_${String(doc._id).slice(-4)}`,
          currentNavPaise: doc.currentNavPaise,
          returnPercent: doc.returnPercent,
          tradesCount: doc.tradesCount || 0,
        }));
      }
    }

    // Deterministic mock leaderboard for the competition view
    return [
      {
        rank: 1,
        participantId: 'part_1',
        userId: 'usr_1',
        userName: 'Aarav Sharma',
        currentNavPaise: 118450000, // ₹11,84,500 (+18.45%)
        returnPercent: 18.45,
        tradesCount: 24,
      },
      {
        rank: 2,
        participantId: 'part_2',
        userId: 'usr_2',
        userName: 'Priya Iyer',
        currentNavPaise: 114200000, // ₹11,42,000 (+14.20%)
        returnPercent: 14.2,
        tradesCount: 19,
      },
      {
        rank: 3,
        participantId: 'part_3',
        userId: 'usr_3',
        userName: 'Vikram Joshi',
        currentNavPaise: 110950000, // ₹11,09,500 (+10.95%)
        returnPercent: 10.95,
        tradesCount: 31,
      },
      {
        rank: 4,
        participantId: 'part_4',
        userId: 'usr_4',
        userName: 'Neha Patel',
        currentNavPaise: 107600000,
        returnPercent: 7.6,
        tradesCount: 15,
      },
      {
        rank: 5,
        participantId: 'part_5',
        userId: 'usr_5',
        userName: 'Rohan Mehra',
        currentNavPaise: 105200000,
        returnPercent: 5.2,
        tradesCount: 12,
      },
    ];
  }

  private mapDocToSummary(doc: any): CompetitionSummaryDTO {
    return {
      id: String(doc._id || 'comp_alpha_2026'),
      title: doc.title,
      description: doc.description,
      startingCapitalPaise: doc.startingCapitalPaise,
      status: doc.status,
      startDate: new Date(doc.startDate).toISOString(),
      endDate: new Date(doc.endDate).toISOString(),
      participantCount: doc.participantCount,
      maxParticipants: doc.maxParticipants,
      prizePoolDescription: doc.prizePoolDescription,
      rules: doc.rules || [],
    };
  }
}

export const competitionRepository = new CompetitionRepository();
