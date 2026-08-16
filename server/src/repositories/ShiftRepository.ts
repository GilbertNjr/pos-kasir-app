import { IRepository } from './interfaces/IRepository';
import { ShiftEntity } from '../types/domain';
import { pool } from '../database/db';

export class ShiftRepository implements IRepository<ShiftEntity> {
  private inMemoryShifts: ShiftEntity[] = [];

  async findAll(): Promise<ShiftEntity[]> {
    try {
      const res = await pool.query(
        `SELECT shift_id, opened_by_user_id, opened_by_user_id as shift_leader_user_id, closed_by_user_id, 
                start_time::text, end_time::text, total_initial_cash::float, net_cash_sales::float, 
                total_qris_sales::float, total_transfer_sales::float, total_cash_expenses::float, 
                theoretical_cash::float, actual_physical_cash::float, cash_variance::float, 
                reconciliation_status, shift_status 
         FROM shifts 
         ORDER BY start_time DESC`
      );
      if (res.rows.length > 0) {
        this.inMemoryShifts = res.rows;
        return res.rows;
      }
      return [...this.inMemoryShifts];
    } catch (err) {
      console.warn('[ShiftRepository] Database fetch fallback to memory:', (err as Error).message);
      return [...this.inMemoryShifts];
    }
  }

  async findById(shift_id: string): Promise<ShiftEntity | null> {
    try {
      const res = await pool.query(
        `SELECT shift_id, opened_by_user_id, opened_by_user_id as shift_leader_user_id, closed_by_user_id, 
                start_time::text, end_time::text, total_initial_cash::float, net_cash_sales::float, 
                total_qris_sales::float, total_transfer_sales::float, total_cash_expenses::float, 
                theoretical_cash::float, actual_physical_cash::float, cash_variance::float, 
                reconciliation_status, shift_status 
         FROM shifts 
         WHERE shift_id = $1`,
        [shift_id]
      );
      if (res.rows.length > 0) return res.rows[0];
      const mem = this.inMemoryShifts.find((s) => s.shift_id === shift_id);
      return mem ? { ...mem } : null;
    } catch {
      const mem = this.inMemoryShifts.find((s) => s.shift_id === shift_id);
      return mem ? { ...mem } : null;
    }
  }

  async findActiveShift(): Promise<ShiftEntity | null> {
    try {
      const res = await pool.query(
        `SELECT shift_id, opened_by_user_id, opened_by_user_id as shift_leader_user_id, closed_by_user_id, 
                start_time::text, end_time::text, total_initial_cash::float, net_cash_sales::float, 
                total_qris_sales::float, total_transfer_sales::float, total_cash_expenses::float, 
                theoretical_cash::float, actual_physical_cash::float, cash_variance::float, 
                reconciliation_status, shift_status 
         FROM shifts 
         WHERE shift_status = 'ACTIVE' 
         ORDER BY start_time DESC LIMIT 1`
      );
      if (res.rows.length > 0) return res.rows[0];
      const active = this.inMemoryShifts.find((s) => s.shift_status === 'ACTIVE');
      return active ? { ...active } : null;
    } catch {
      const active = this.inMemoryShifts.find((s) => s.shift_status === 'ACTIVE');
      return active ? { ...active } : null;
    }
  }

  async findWhere(predicate: (item: ShiftEntity) => boolean): Promise<ShiftEntity[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }

  async create(shift: ShiftEntity): Promise<ShiftEntity> {
    try {
      const res = await pool.query(
        `INSERT INTO shifts 
         (shift_id, opened_by_user_id, start_time, total_initial_cash, net_cash_sales, total_qris_sales, total_transfer_sales, total_cash_expenses, theoretical_cash, shift_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING shift_id, opened_by_user_id, opened_by_user_id as shift_leader_user_id, closed_by_user_id, 
                   start_time::text, end_time::text, total_initial_cash::float, net_cash_sales::float, 
                   total_qris_sales::float, total_transfer_sales::float, total_cash_expenses::float, 
                   theoretical_cash::float, actual_physical_cash::float, cash_variance::float, 
                   reconciliation_status, shift_status`,
        [
          shift.shift_id,
          shift.opened_by_user_id,
          shift.start_time || new Date().toISOString(),
          shift.total_initial_cash,
          shift.net_cash_sales || 0,
          shift.total_qris_sales || 0,
          shift.total_transfer_sales || 0,
          shift.total_cash_expenses || 0,
          shift.theoretical_cash || shift.total_initial_cash,
          shift.shift_status || 'ACTIVE',
        ]
      );
      const created = res.rows[0];
      this.inMemoryShifts.push(created);
      return created;
    } catch (err) {
      console.warn('[ShiftRepository] Database insert fallback to memory:', (err as Error).message);
      this.inMemoryShifts.push(shift);
      return { ...shift };
    }
  }

  async update(shift_id: string, item: Partial<ShiftEntity>): Promise<ShiftEntity | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (item.closed_by_user_id !== undefined) { fields.push(`closed_by_user_id = $${idx++}`); values.push(item.closed_by_user_id); }
      if (item.end_time !== undefined) { fields.push(`end_time = $${idx++}`); values.push(item.end_time); }
      if (item.net_cash_sales !== undefined) { fields.push(`net_cash_sales = $${idx++}`); values.push(item.net_cash_sales); }
      if (item.total_qris_sales !== undefined) { fields.push(`total_qris_sales = $${idx++}`); values.push(item.total_qris_sales); }
      if (item.total_transfer_sales !== undefined) { fields.push(`total_transfer_sales = $${idx++}`); values.push(item.total_transfer_sales); }
      if (item.total_cash_expenses !== undefined) { fields.push(`total_cash_expenses = $${idx++}`); values.push(item.total_cash_expenses); }
      if (item.theoretical_cash !== undefined) { fields.push(`theoretical_cash = $${idx++}`); values.push(item.theoretical_cash); }
      if (item.actual_physical_cash !== undefined) { fields.push(`actual_physical_cash = $${idx++}`); values.push(item.actual_physical_cash); }
      if (item.cash_variance !== undefined) { fields.push(`cash_variance = $${idx++}`); values.push(item.cash_variance); }
      if (item.reconciliation_status !== undefined) { fields.push(`reconciliation_status = $${idx++}`); values.push(item.reconciliation_status); }
      if (item.shift_status !== undefined) { fields.push(`shift_status = $${idx++}`); values.push(item.shift_status); }

      if (fields.length > 0) {
        values.push(shift_id);
        const queryStr = `UPDATE shifts SET ${fields.join(', ')} WHERE shift_id = $${idx} 
                          RETURNING shift_id, opened_by_user_id, opened_by_user_id as shift_leader_user_id, closed_by_user_id, 
                                    start_time::text, end_time::text, total_initial_cash::float, net_cash_sales::float, 
                                    total_qris_sales::float, total_transfer_sales::float, total_cash_expenses::float, 
                                    theoretical_cash::float, actual_physical_cash::float, cash_variance::float, 
                                    reconciliation_status, shift_status`;
        const res = await pool.query(queryStr, values);
        if (res.rows.length > 0) {
          const updated = res.rows[0];
          const memIdx = this.inMemoryShifts.findIndex((s) => s.shift_id === shift_id);
          if (memIdx !== -1) this.inMemoryShifts[memIdx] = updated;
          return updated;
        }
      }
    } catch (err) {
      console.warn('[ShiftRepository] Database update fallback to memory:', (err as Error).message);
    }

    const index = this.inMemoryShifts.findIndex((s) => s.shift_id === shift_id);
    if (index === -1) return null;

    this.inMemoryShifts[index] = { ...this.inMemoryShifts[index], ...item };
    return { ...this.inMemoryShifts[index] };
  }
}

