/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MachineType = 'JCB 3DX' | 'Tipper' | 'Mini Excavator' | 'Excavator';
export type ExcavatorModel = 'EX70' | 'EX140' | 'EX210';
export type MachineStatus = 'Working' | 'Idle' | 'Under Service';

export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  excavatorModel?: ExcavatorModel;
  registrationNo: string;
  operatorName: string;
  status: MachineStatus;
  hourMeter: number;
  purchaseCost: number;
  notes?: string;
}

export type JobStatus = 'Pending' | 'Partially Paid' | 'Paid';

export interface Job {
  id: string;
  customerName: string;
  phoneNumber: string;
  siteLocation: string;
  machineId: string; // References Machine
  workDetails: string;
  totalAmount: number;
  totalPaid: number;
  pendingAmount: number;
  status: JobStatus;
  notes?: string;
  createdAt: string;
}

export interface PaymentHistoryItem {
  id: string;
  jobId: string;
  date: string;
  amountPaid: number;
  remainingBalance: number;
  notes?: string;
}

export interface DieselLog {
  id: string;
  machineId: string;
  liters: number;
  cost: number;
  vendor: string;
  paymentType: 'Paid' | 'Credit';
  date: string;
}

export type ExpenseCategory = 'Repair' | 'Transport' | 'Food' | 'Miscellaneous';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  notes?: string;
  date: string;
  machineId?: string; // Optional reference to machine
}

export interface SalaryLog {
  id: string;
  workerName: string;
  salaryAmount: number;
  advanceTaken: number;
  paidAmount: number;
  pendingSalary: number;
  date: string;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  type: 'payment' | 'salary' | 'diesel';
  title: string;
  description: string;
  amount?: number;
  date?: string;
  relativeId?: string; // ID of the referenced entry (Job, Salary, Diesel)
}
