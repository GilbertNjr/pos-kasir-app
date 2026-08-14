import { IRepository } from './interfaces/IRepository';
import { ShiftCapitalContributionEntity } from '../types/domain';

export class ShiftCapitalContributionRepository implements IRepository<ShiftCapitalContributionEntity> {
  private contributions: ShiftCapitalContributionEntity[] = [];

  async findAll(): Promise<ShiftCapitalContributionEntity[]> {
    return [...this.contributions];
  }

  async findById(contribution_id: string): Promise<ShiftCapitalContributionEntity | null> {
    const c = this.contributions.find((item) => item.contribution_id === contribution_id);
    return c ? { ...c } : null;
  }

  async findByShiftId(shift_id: string): Promise<ShiftCapitalContributionEntity[]> {
    return this.contributions.filter((item) => item.shift_id === shift_id);
  }

  async findWhere(predicate: (item: ShiftCapitalContributionEntity) => boolean): Promise<ShiftCapitalContributionEntity[]> {
    return this.contributions.filter(predicate);
  }

  async create(contribution: ShiftCapitalContributionEntity): Promise<ShiftCapitalContributionEntity> {
    this.contributions.push(contribution);
    return { ...contribution };
  }

  async update(contribution_id: string, item: Partial<ShiftCapitalContributionEntity>): Promise<ShiftCapitalContributionEntity | null> {
    const index = this.contributions.findIndex((c) => c.contribution_id === contribution_id);
    if (index === -1) return null;

    this.contributions[index] = { ...this.contributions[index], ...item };
    return { ...this.contributions[index] };
  }
}
