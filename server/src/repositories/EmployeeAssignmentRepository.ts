import { EmployeeAssignmentEntity } from '../types/domain';
import { pool } from '../database/db';

export class EmployeeAssignmentRepository {
  private inMemoryAssignments: EmployeeAssignmentEntity[] = [];

  async assignEmployee(supervisor_user_id: string, employee_user_id: string): Promise<EmployeeAssignmentEntity> {
    const assignment_id = 'asg-' + Date.now().toString(36);
    const now = new Date().toISOString();

    try {
      // Upsert: Nonaktifkan assignment lama untuk karyawan ini jika ada
      await pool.query('UPDATE employee_assignments SET status = $1 WHERE employee_user_id = $2', ['INACTIVE', employee_user_id]);

      const query = `
        INSERT INTO employee_assignments (assignment_id, supervisor_user_id, employee_user_id, status, created_at, updated_at)
        VALUES ($1, $2, $3, 'ACTIVE', $4, $4)
        RETURNING *;
      `;
      const res = await pool.query(query, [assignment_id, supervisor_user_id, employee_user_id, now]);
      if (res.rows && res.rows.length > 0) {
        const created = this.mapRowToEntity(res.rows[0]);
        this.updateInMemory(created);
        return created;
      }
    } catch {
      // Fallback
    }

    const fallback: EmployeeAssignmentEntity = {
      assignment_id,
      supervisor_user_id,
      employee_user_id,
      status: 'ACTIVE',
      created_at: now,
    };
    this.updateInMemory(fallback);
    return fallback;
  }

  async getAssignedEmployeeIds(supervisor_user_id: string): Promise<string[]> {
    try {
      const res = await pool.query(
        'SELECT employee_user_id FROM employee_assignments WHERE supervisor_user_id = $1 AND status = $2',
        [supervisor_user_id, 'ACTIVE']
      );
      if (res.rows) {
        return res.rows.map((r) => r.employee_user_id);
      }
    } catch {
      // Fallback
    }
    return this.inMemoryAssignments
      .filter((a) => a.supervisor_user_id === supervisor_user_id && a.status === 'ACTIVE')
      .map((a) => a.employee_user_id);
  }

  async getSupervisorForEmployee(employee_user_id: string): Promise<string | null> {
    try {
      const res = await pool.query(
        'SELECT supervisor_user_id FROM employee_assignments WHERE employee_user_id = $1 AND status = $2 LIMIT 1',
        [employee_user_id, 'ACTIVE']
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows[0].supervisor_user_id;
      }
    } catch {
      // Fallback
    }
    const mem = this.inMemoryAssignments.find((a) => a.employee_user_id === employee_user_id && a.status === 'ACTIVE');
    return mem ? mem.supervisor_user_id : null;
  }

  private updateInMemory(newAssignment: EmployeeAssignmentEntity) {
    this.inMemoryAssignments = this.inMemoryAssignments.map((a) =>
      a.employee_user_id === newAssignment.employee_user_id ? { ...a, status: 'INACTIVE' } : a
    );
    this.inMemoryAssignments.push(newAssignment);
  }

  private mapRowToEntity(row: any): EmployeeAssignmentEntity {
    return {
      assignment_id: row.assignment_id,
      supervisor_user_id: row.supervisor_user_id,
      employee_user_id: row.employee_user_id,
      status: row.status,
      created_at: new Date(row.created_at).toISOString(),
    };
  }
}
