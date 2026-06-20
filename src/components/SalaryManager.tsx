/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Coins, 
  Calendar, 
  TrendingUp, 
  FileText,
  UserCheck,
  Check, 
  IndianRupee,
  Briefcase,
  AlertTriangle,
  Award
} from 'lucide-react';
import { SalaryLog } from '../types';
import { formatRupee, formatDate, getTodayString } from '../utils/helpers';

interface SalaryManagerProps {
  salaries: SalaryLog[];
  onAddSalaryLog: (log: Omit<SalaryLog, 'id' | 'pendingSalary'>) => void;
  onEditSalaryLog: (id: string, updates: Partial<SalaryLog>) => void;
  onDeleteSalaryLog: (id: string) => void;
  openAddModalInitially?: boolean;
  onCloseModalCallback?: () => void;
}

export default function SalaryManager({
  salaries,
  onAddSalaryLog,
  onEditSalaryLog,
  onDeleteSalaryLog,
  openAddModalInitially = false,
  onCloseModalCallback
}: SalaryManagerProps) {
  
  const [isModalOpen, setIsModalOpen] = useState(openAddModalInitially);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Form Fields
  const [workerName, setWorkerName] = useState('');
  const [salaryAmount, setSalaryAmount] = useState<number>(0);
  const [advanceTaken, setAdvanceTaken] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [date, setDate] = useState(getTodayString());
  const [notes, setNotes] = useState('');

  // Pay Salary / Give Advance Modal overlay helpers
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutLog, setPayoutLog] = useState<SalaryLog | null>(null);
  const [payoutType, setPayoutType] = useState<'advance' | 'salary'>('salary');
  const [payoutAmountVal, setPayoutAmountVal] = useState<number>(0);

  const resetForm = () => {
    setWorkerName('');
    setSalaryAmount(0);
    setAdvanceTaken(0);
    setPaidAmount(0);
    setDate(getTodayString());
    setNotes('');
    setEditingLogId(null);
    setIsModalOpen(false);
    if (onCloseModalCallback) onCloseModalCallback();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim()) return;

    if (editingLogId) {
      const existing = salaries.find(s => s.id === editingLogId);
      if (existing) {
        const sAmt = Number(salaryAmount) || 0;
        const adv = Number(advanceTaken) || 0;
        const paid = Number(paidAmount) || 0;
        const pend = sAmt - (adv + paid);
        onEditSalaryLog(editingLogId, {
          workerName,
          salaryAmount: sAmt,
          advanceTaken: adv,
          paidAmount: paid,
          pendingSalary: pend,
          date,
          notes
        });
      }
    } else {
      onAddSalaryLog({
        workerName,
        salaryAmount: Number(salaryAmount) || 0,
        advanceTaken: Number(advanceTaken) || 0,
        paidAmount: Number(paidAmount) || 0,
        date,
        notes
      });
    }
    resetForm();
  };

  // Trigger quick edit
  const handleEditClick = (log: SalaryLog) => {
    setEditingLogId(log.id);
    setWorkerName(log.workerName);
    setSalaryAmount(log.salaryAmount);
    setAdvanceTaken(log.advanceTaken);
    setPaidAmount(log.paidAmount);
    setDate(log.date);
    setNotes(log.notes || '');
    setIsModalOpen(true);
  };

  // Post Advance or Salary directly
  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutLog || payoutAmountVal <= 0) return;

    if (payoutType === 'advance') {
      const newAdvance = payoutLog.advanceTaken + payoutAmountVal;
      const newPending = payoutLog.salaryAmount - (newAdvance + payoutLog.paidAmount);
      onEditSalaryLog(payoutLog.id, {
        advanceTaken: newAdvance,
        pendingSalary: newPending
      });
    } else {
      const newPaid = payoutLog.paidAmount + payoutAmountVal;
      const newPending = payoutLog.salaryAmount - (payoutLog.advanceTaken + newPaid);
      onEditSalaryLog(payoutLog.id, {
        paidAmount: newPaid,
        pendingSalary: newPending
      });
    }

    setIsPayoutModalOpen(false);
    setPayoutLog(null);
    setPayoutAmountVal(0);
  };

  const openPayoutDialog = (log: SalaryLog, type: 'advance' | 'salary') => {
    setPayoutLog(log);
    setPayoutType(type);
    setPayoutAmountVal(type === 'advance' ? 1000 : log.pendingSalary);
    setIsPayoutModalOpen(true);
  };

  // High level overview values
  const salarySum = React.useMemo(() => {
    let totalWages = 0;
    let totalAdvances = 0;
    let totalPaid = 0;
    let totalPending = 0;

    salaries.forEach(s => {
      totalWages += s.salaryAmount;
      totalAdvances += s.advanceTaken;
      totalPaid += s.paidAmount;
      totalPending += s.pendingSalary;
    });

    return { totalWages, totalAdvances, totalPaid, totalPending };
  }, [salaries]);

  return (
    <div className="space-y-6 pb-24" id="salary-manager-section animate-fade">
      
      {/* Upper Action details */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-zinc-900">
            Crew Wages & Salary ({salaries.length})
          </h2>
          <p className="text-xs text-zinc-500 font-medium font-sans">Operator payroll, advances tracker, and balances due</p>
        </div>
        
        <button 
          onClick={() => {
            setEditingLogId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-1.5 text-sm font-semibold bg-brand-yellow text-zinc-950 px-4 py-2.5 rounded-lg active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Crew Member</span>
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 border border-zinc-200 rounded-xl">
          <span className="text-[10px] font-bold text-zinc-400 uppercase leading-none">Gross Monthly Wages</span>
          <span className="font-mono text-base sm:text-lg font-bold text-zinc-800 block mt-1">{formatRupee(salarySum.totalWages)}</span>
        </div>
        <div className="bg-white p-3.5 border border-zinc-200 rounded-xl">
          <span className="text-[10px] font-bold text-zinc-400 uppercase leading-none">Advances Disbursed</span>
          <span className="font-mono text-base sm:text-lg font-bold text-zinc-800 block mt-1">{formatRupee(salarySum.totalAdvances)}</span>
        </div>
        <div className="bg-white p-3.5 border border-zinc-200 rounded-xl">
          <span className="text-[10px] font-bold text-zinc-400 uppercase leading-none">Wages Paid</span>
          <span className="font-mono text-base sm:text-lg font-bold text-emerald-600 block mt-1">{formatRupee(salarySum.totalPaid)}</span>
        </div>
        <div className="bg-white p-3.5 border border-zinc-200 rounded-xl col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase leading-none">Outstanding wages due</span>
          <span className="font-mono text-base sm:text-lg font-bold text-rose-600 block mt-1">{formatRupee(salarySum.totalPending)}</span>
        </div>
      </div>

      {/* List of Workers */}
      {salaries.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-4">
          <Users className="w-12 h-12 text-zinc-300" />
          <div className="max-w-xs">
            <h3 className="font-display font-bold text-zinc-700 text-base">No crew members listed</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Store operators, drivers, and site boys to record cash advances given on sites.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-950 text-white font-bold px-4 py-2 rounded-lg text-xs transition-transform active:scale-95"
          >
            Add Your First Driver
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {salaries.map((log) => (
            <div key={log.id} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-4">
              
              {/* Header and Details log */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-zinc-400">{formatDate(log.date)}</span>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => handleEditClick(log)}
                      className="text-[10px] bg-zinc-100 text-zinc-700 font-bold px-2 py-0.5 rounded border hover:bg-zinc-200"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Remove ${log.workerName} payroll record?`)) onDeleteSalaryLog(log.id);
                      }}
                      className="p-1 text-rose-400 hover:text-rose-600 active:bg-rose-50 rounded"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-zinc-100 rounded-lg shrink-0">
                    <Briefcase className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-zinc-900 text-base leading-none">
                      {log.workerName}
                    </h3>
                    <p className="text-[10.5px] font-semibold text-zinc-400 tracking-wide mt-1 uppercase font-mono">
                      WAGES: {formatRupee(log.salaryAmount)}/Mo
                    </p>
                  </div>
                </div>
              </div>

              {/* Aggregation split */}
              <div className="grid grid-cols-3 gap-2 bg-zinc-50 border border-zinc-150 rounded-lg p-2.5 text-xs text-center font-medium">
                <div>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">ADVANCE</p>
                  <p className="font-semibold text-zinc-800 font-mono mt-0.5">{formatRupee(log.advanceTaken)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">PAID</p>
                  <p className="font-semibold text-emerald-700 font-mono mt-0.5">{formatRupee(log.paidAmount)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">PENDING</p>
                  <p className={`font-bold font-mono mt-0.5 ${log.pendingSalary > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {formatRupee(log.pendingSalary)}
                  </p>
                </div>
              </div>

              {log.notes && (
                <p className="text-[10px] text-zinc-500 italic bg-zinc-50/55 p-2 rounded border border-zinc-100">
                  Notes: {log.notes}
                </p>
              )}

              {/* ACTION TOGGLERS FOR SITE ADVANCES (Kharchi) & Payouts */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openPayoutDialog(log, 'advance')}
                  className="flex items-center justify-center space-x-1 border border-amber-300 text-amber-800 bg-amber-50 active:bg-amber-100 font-bold py-2 rounded-lg text-xs cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Give Advance</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => openPayoutDialog(log, 'salary')}
                  className="flex items-center justify-center space-x-1 border border-emerald-300 text-emerald-800 bg-emerald-50 active:bg-emerald-100 font-bold py-2 rounded-lg text-xs cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Pay Salary</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD / EDIT CREW MEMBER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col">
            
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 rounded-t-2xl">
              <h3 className="font-display font-bold text-base text-zinc-900">
                {editingLogId ? 'Edit Operator Wages' : 'Register Operator / Driver'}
              </h3>
              <button 
                type="button" 
                onClick={resetForm}
                className="text-zinc-400 font-mono font-bold p-1 text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Operator/Driver Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Gurdeep Singh"
                  value={workerName}
                  onChange={e => setWorkerName(e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-semibold text-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Monthly Salary (₹)</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    placeholder="e.g. 22000"
                    value={salaryAmount || ''}
                    onChange={e => setSalaryAmount(Number(e.target.value))}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Date Joined / Cycle</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {!editingLogId && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-150">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-0.5">Advance given (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      value={advanceTaken || ''}
                      onChange={e => setAdvanceTaken(Number(e.target.value))}
                      className="w-full border border-zinc-300 rounded p-1.5 text-xs focus:border-brand-yellow outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-0.5">Already Paid (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      value={paidAmount || ''}
                      onChange={e => setPaidAmount(Number(e.target.value))}
                      className="w-full border border-zinc-300 rounded p-1.5 text-xs focus:border-brand-yellow outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Notes</label>
                <input 
                  type="text" 
                  placeholder="e.g. Night duty shift bonus, JCB helper"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none text-zinc-600 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-950 text-white font-bold py-3 rounded-lg active:scale-95 transition-transform text-xs"
              >
                {editingLogId ? 'SAVE CHANGES' : 'BOOK CREW ACCOUNT'}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* QUICK PAYOUT / GIVE ADVANCE OVERLAY */}
      {isPayoutModalOpen && payoutLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col">
            
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 rounded-t-2xl">
              <h3 className="font-display font-bold text-base text-zinc-900">
                Log {payoutType === 'advance' ? 'Advance Payment ("Kharchi")' : 'Regular Wage Payment'}
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  setIsPayoutModalOpen(false);
                  setPayoutLog(null);
                }}
                className="text-zinc-400 font-mono font-bold p-1 text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="p-4 space-y-4">
              <div>
                <p className="text-xs text-zinc-400 leading-none">Employee Profile</p>
                <p className="text-sm font-bold text-zinc-700 mt-1">{payoutLog.workerName}</p>
                <p className="text-[10.5px] text-zinc-500 mt-0.5">Pending due wage: <span className="font-mono font-bold text-zinc-900">{formatRupee(payoutLog.pendingSalary)}</span></p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                  {payoutType === 'advance' ? 'Advance Cash (₹)' : 'Salary Paid Amount (₹)'}
                </label>
                <input 
                  type="number" 
                  min="1"
                  required
                  placeholder="How much cash are you handing over?"
                  value={payoutAmountVal || ''}
                  onChange={e => setPayoutAmountVal(Number(e.target.value))}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono font-bold text-brand-accent text-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-950 text-white font-bold py-3 rounded-lg active:scale-95 transition-transform text-xs"
              >
                CONFIRM HANDOVER TRANSACTION
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
