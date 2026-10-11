import {
  competitionRepository,
  CompetitionSummaryDTO,
  LeaderboardEntryDTO,
} from '../repositories/competitionRepository';
import { CompetitionFilterQuery } from '../schemas/competitionSchemas';
import { PaginatedResult } from '../schemas/commonSchemas';
import { Money } from '../utilities/money';

export interface FormattedLeaderboardEntry extends LeaderboardEntryDTO {
  currentNavFormatted: string;
}

export interface FormattedCompetitionSummary extends CompetitionSummaryDTO {
  startingCapitalFormatted: string;
}

export class CompetitionService {
  async getCompetitions(
    query: CompetitionFilterQuery
  ): Promise<PaginatedResult<FormattedCompetitionSummary>> {
    const result = await competitionRepository.findMany(query);
    return {
      items: result.items.map((c) => ({
        ...c,
        startingCapitalFormatted: Money.fromPaise(c.startingCapitalPaise).toINR(),
      })),
      pagination: result.pagination,
    };
  }

  async getLeaderboard(competitionId: string): Promise<FormattedLeaderboardEntry[]> {
    const entries = await competitionRepository.findLeaderboard(competitionId);
    return entries.map((e) => ({
      ...e,
      currentNavFormatted: Money.fromPaise(e.currentNavPaise).toINR(),
    }));
  }
}

export const competitionService = new CompetitionService();
