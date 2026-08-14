import { IRepository } from './interfaces/IRepository';
import { ShiftUserEntity } from '../types/domain';

export class ShiftUserRepository implements IRepository<ShiftUserEntity> {
  private shiftUsers: ShiftUserEntity[] = [];

  async findAll(): Promise<ShiftUserEntity[]> {
    return [...this.shiftUsers];
  }

  async findById(shift_user_id: string): Promise<ShiftUserEntity | null> {
    const su = this.shiftUsers.find((s) => s.shift_user_id === shift_user_id);
    return su ? { ...su } : null;
  }

  async findByShiftId(shift_id: string): Promise<ShiftUserEntity[]> {
    return this.shiftUsers.filter((s) => s.shift_id === shift_id);
  }

  async findWhere(predicate: (item: ShiftUserEntity) => boolean): Promise<ShiftUserEntity[]> {
    return this.shiftUsers.filter(predicate);
  }

  async create(shiftUser: ShiftUserEntity): Promise<ShiftUserEntity> {
    this.shiftUsers.push(shiftUser);
    return { ...shiftUser };
  }

  async update(shift_user_id: string, item: Partial<ShiftUserEntity>): Promise<ShiftUserEntity | null> {
    const index = this.shiftUsers.findIndex((s) => s.shift_user_id === shift_user_id);
    if (index === -1) return null;

    this.shiftUsers[index] = { ...this.shiftUsers[index], ...item };
    return { ...this.shiftUsers[index] };
  }
}
