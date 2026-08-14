/**
 * Data Access Layer (DAL) Generic Repository Contract Interface
 * Mendukung abstraksi pemetaan Google Sheets -> PostgreSQL/Supabase
 */
export interface IRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findWhere(predicate: (item: T) => boolean): Promise<T[]>;
  create(item: T): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T | null>;
  delete?(id: string): Promise<boolean>;
}
