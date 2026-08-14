import { IRepository } from './interfaces/IRepository';
import { ShiftEntity } from '../types/domain';

export class ShiftRepository implements IRepository<ShiftEntity> {
  private shifts: ShiftEntity[] = [];

  async findAll(): Promise<ShiftEntity[]> {
    return [...this.shifts];
  }

  async findById(shift_id: string): Promise<ShiftEntity | null> {
    const shift = this.shifts.find((s) => s.shift_id === shift_id);
    return shift ? { ...shift } : null;
  }

  async findActiveShift(): Promise<ShiftEntity | null> {
    const active = this.shifts.find((s) => s.shift_status === 'ACTIVE');
    return active ? { ...active } : null;
  }

  async findWhere(predicate: (item: ShiftEntity) => boolean): Promise<ShiftEntity[]> {
    return this.shifts.filter(predicate);
  }

  async create(shift: ShiftEntity): Promise<ShiftEntity> {
    this.shifts.push(shift);
    return { ...shift };
  }

  async update(shift_id: string, item: Partial<ShiftEntity>): Promise<ShiftEntity | null> {
    const index = this.shifts.findIndex((s) => s.shift_id === shift_id);
    if (index === -1) return null;

    this.shifts[index] = { ...this.shifts[index], ...item };
    return { ...this.shifts[index] };
  }
}
