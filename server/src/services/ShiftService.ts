import { ShiftRepository } from '../repositories/ShiftRepository';
import { ShiftUserRepository } from '../repositories/ShiftUserRepository';
import { ShiftCapitalContributionRepository } from '../repositories/ShiftCapitalContributionRepository';
import { UserRepository } from '../repositories/UserRepository';
import { ShiftEntity, ShiftCapitalContributionEntity, ReconciliationStatus } from '../types/domain';

import { BackupService } from './BackupService';

export interface ActiveShiftUserDetail {
  shift_user_id: string;
  shift_id: string;
  user_id: string;
  is_shift_leader: boolean;
  joined_at: string;
  full_name?: string;
  username?: string;
  role?: string;
}

export interface ActiveShiftDetails {
  shift: ShiftEntity;
  contributions: ShiftCapitalContributionEntity[];
  shift_users?: ActiveShiftUserDetail[];
  usersCount: number;
}

export class ShiftService {
  private shiftRepository: ShiftRepository;
  private shiftUserRepository: ShiftUserRepository;
  private capitalRepository: ShiftCapitalContributionRepository;
  private userRepository?: UserRepository;
  private backupService?: BackupService;

  constructor(
    shiftRepository: ShiftRepository,
    shiftUserRepository: ShiftUserRepository,
    capitalRepository: ShiftCapitalContributionRepository,
    userRepository?: UserRepository,
    backupService?: BackupService
  ) {
    this.shiftRepository = shiftRepository;
    this.shiftUserRepository = shiftUserRepository;
    this.capitalRepository = capitalRepository;
    this.userRepository = userRepository;
    this.backupService = backupService;
  }

  async getActiveShift(): Promise<ActiveShiftDetails | null> {
    const shift = await this.shiftRepository.findActiveShift();
    if (!shift) return null;

    const contributions = await this.capitalRepository.findByShiftId(shift.shift_id);
    const users = await this.shiftUserRepository.findByShiftId(shift.shift_id);
    const allUsers = this.userRepository ? await this.userRepository.findAll() : [];

    const detailedShiftUsers: ActiveShiftUserDetail[] = users.map((su) => {
      const matchedUser = allUsers.find((u) => u.user_id === su.user_id);
      return {
        ...su,
        full_name: matchedUser ? matchedUser.full_name : su.user_id,
        username: matchedUser ? matchedUser.username : su.user_id,
        role: matchedUser ? matchedUser.role : 'CASHIER',
      };
    });

    return {
      shift,
      contributions,
      shift_users: detailedShiftUsers,
      usersCount: detailedShiftUsers.length,
    };
  }

  async openShift(
    user_id: string,
    initialCashAmount: number,
    dutyStaffNames?: string,
    shiftCategory?: string,
    shiftMetadata?: Record<string, any>
  ): Promise<ActiveShiftDetails> {
    const existingActive = await this.shiftRepository.findActiveShift();
    if (existingActive) {
      throw new Error('Shift lain sedang berjalan (ACTIVE). Harap tutup shift aktif terlebih dahulu.');
    }

    if (initialCashAmount < 0) {
      throw new Error('Nominal modal awal kas tidak boleh negatif.');
    }

    const shift_id = `shift-${Date.now()}`;
    const nowIso = new Date().toISOString();

    // 1. Buat Shift Baru (Penggagas Buka Shift otomatis menjadi PJ Shift)
    const newShift: ShiftEntity = {
      shift_id,
      opened_by_user_id: user_id,
      shift_leader_user_id: user_id,
      start_time: nowIso,
      total_initial_cash: initialCashAmount,
      net_cash_sales: 0,
      total_qris_sales: 0,
      total_transfer_sales: 0,
      total_cash_expenses: 0,
      theoretical_cash: initialCashAmount,
      shift_status: 'ACTIVE',
      duty_staff_names: dutyStaffNames,
      shift_category: shiftCategory,
      shift_metadata: shiftMetadata,
    };

    await this.shiftRepository.create(newShift);

    // 2. Catat User sebagai PJ Shift di shift_users
    await this.shiftUserRepository.create({
      shift_user_id: `su-${Date.now()}-1`,
      shift_id,
      user_id,
      is_shift_leader: true,
      joined_at: nowIso,
    });

    // 3. Catat Kontribusi Modal Pertama jika initialCashAmount > 0
    let firstContribution: ShiftCapitalContributionEntity | null = null;
    if (initialCashAmount > 0) {
      firstContribution = await this.capitalRepository.create({
        contribution_id: `cap-${Date.now()}-1`,
        shift_id,
        user_id,
        amount: initialCashAmount,
        contribution_time: nowIso,
        status: 'HELD',
      });
    }

    return {
      shift: newShift,
      contributions: firstContribution ? [firstContribution] : [],
      usersCount: 1,
    };
  }

  async updateShiftMetadata(
    shift_id: string,
    dutyStaffNames?: string,
    shiftCategory?: string,
    shiftMetadata?: Record<string, any>
  ): Promise<ShiftEntity | null> {
    const shift = await this.shiftRepository.findById(shift_id);
    if (!shift) {
      throw new Error('Shift tidak ditemukan');
    }
    return this.shiftRepository.update(shift_id, {
      duty_staff_names: dutyStaffNames,
      shift_category: shiftCategory,
      shift_metadata: shiftMetadata,
    });
  }

  async addCapitalContribution(shift_id: string, user_id: string, amount: number): Promise<ShiftCapitalContributionEntity> {
    if (amount <= 0) {
      throw new Error('Nominal setoran modal tambahan harus lebih besar dari Rp 0.');
    }

    const shift = await this.shiftRepository.findById(shift_id);
    if (!shift || shift.shift_status !== 'ACTIVE') {
      throw new Error('Shift tidak ditemukan atau telah ditutup.');
    }

    const nowIso = new Date().toISOString();

    // 1. Buat entri kontribusi modal baru
    const newContribution = await this.capitalRepository.create({
      contribution_id: `cap-${Date.now()}`,
      shift_id,
      user_id,
      amount,
      contribution_time: nowIso,
      status: 'HELD',
    });

    // 2. Tambahkan user ke shift_users jika belum terdaftar
    const existingUsers = await this.shiftUserRepository.findByShiftId(shift_id);
    if (!existingUsers.some((u) => u.user_id === user_id)) {
      await this.shiftUserRepository.create({
        shift_user_id: `su-${Date.now()}`,
        shift_id,
        user_id,
        is_shift_leader: false,
        joined_at: nowIso,
      });
    }

    // 3. Recalculate total_initial_cash & theoretical_cash pada shift
    const allContributions = await this.capitalRepository.findByShiftId(shift_id);
    const newTotalInitial = allContributions.reduce((sum, c) => sum + c.amount, 0);
    const newTheoretical = newTotalInitial + shift.net_cash_sales - shift.total_cash_expenses;

    await this.shiftRepository.update(shift_id, {
      total_initial_cash: newTotalInitial,
      theoretical_cash: newTheoretical,
    });

    return newContribution;
  }

  async closeShift(
    shift_id: string,
    executor_user_id: string,
    executor_role: string,
    actualPhysicalCash: number
  ): Promise<ShiftEntity> {
    const shift = await this.shiftRepository.findById(shift_id);
    if (!shift || shift.shift_status !== 'ACTIVE') {
      throw new Error('Shift tidak ditemukan atau telah ditutup.');
    }

    if (actualPhysicalCash < 0) {
      throw new Error('Nominal uang fisik kas aktual tidak boleh negatif.');
    }

    const nowIso = new Date().toISOString();
    const theoretical = shift.total_initial_cash + shift.net_cash_sales - shift.total_cash_expenses;
    const variance = actualPhysicalCash - theoretical;

    let reconStatus: ReconciliationStatus = 'PAS';
    if (variance > 0) reconStatus = 'LEBIH';
    if (variance < 0) reconStatus = 'KURANG';

    const updatedShift = await this.shiftRepository.update(shift_id, {
      closed_by_user_id: executor_user_id,
      end_time: nowIso,
      theoretical_cash: theoretical,
      actual_physical_cash: actualPhysicalCash,
      cash_variance: variance,
      reconciliation_status: reconStatus,
      shift_status: 'CLOSED',
    });

    // Otomatis buat snapshot backup & sync Google Drive/Sheets saat shift ditutup
    if (this.backupService) {
      try {
        await this.backupService.createAutoShiftBackup(executor_user_id, shift_id);
      } catch (err: any) {
        console.warn('[ShiftService] Auto backup on shift close notice:', err.message);
      }
    }

    return updatedShift!;
  }

  async returnCapitalContribution(contribution_id: string): Promise<ShiftCapitalContributionEntity> {
    const contribution = await this.capitalRepository.findById(contribution_id);
    if (!contribution) {
      throw new Error('Catatan kontribusi modal tidak ditemukan.');
    }

    if (contribution.status === 'RETURNED') {
      throw new Error('Modal awal ini sudah ditandai dikembalikan sebelumnya.');
    }

    const updated = await this.capitalRepository.update(contribution_id, {
      returned_amount: contribution.amount,
      returned_at: new Date().toISOString(),
      status: 'RETURNED',
    });

    return updated!;
  }
}
