import {
  educationRepository,
  LearningModuleSummaryDTO,
  LearningModuleDetailDTO,
} from '../repositories/educationRepository';
import { EducationFilterQuery } from '../schemas/educationSchemas';
import { PaginatedResult } from '../schemas/commonSchemas';
import { NotFoundError } from '../utilities/errors';

export class EducationService {
  async getModules(query: EducationFilterQuery): Promise<PaginatedResult<LearningModuleSummaryDTO>> {
    return educationRepository.findMany(query);
  }

  async getModuleBySlug(slug: string): Promise<LearningModuleDetailDTO> {
    const module = await educationRepository.findBySlug(slug);
    if (!module) {
      throw new NotFoundError(`Learning module with slug '${slug}' not found`);
    }
    return module;
  }
}

export const educationService = new EducationService();
