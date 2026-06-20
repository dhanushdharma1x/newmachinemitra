/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Fuel, 
  Settings, 
  Trash2, 
  Plus, 
  Wrench, 
  Truck, 
  Utensils, 
  Cpu, 
  Calendar, 
  ListFilter,
  IndianRupee,
  Activity,
  AlertCircle,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import { DieselLog, Expense, Machine, ExpenseCategory } from '../types';
import { formatRupee, formatDate, getTodayString } from '../utils/helpers';

interface DieselAndExpenseProps {
  dieselLogs: DieselLog[];
  expenses: Expense[];
  machines: Machine[];
  onAddDieselLog: (log: Omit<DieselLog, 'id'>) => void;
  onDeleteDieselLog: (id: string) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  openAddDieselInitially?: boolean;
  openAddExpenseInitially?: boolean;
  onCloseModalCallback?: () => void;
}

export default function DieselAndExpenseManager({
  dieselLogs,
  expenses,
  machines,
  onAddDieselLog,
  onDeleteDieselLog,
  onAddExpense,
  onDeleteExpense,
  openAddDieselInitially = false,
  openAddExpenseInitially = false,
  onCloseModalCallback
}: DieselAndExpenseProps) {
  
  const [activeSubTab, setActiveSubTab] = useState<'diesel' | 'expenses'>('diesel');
  const [isDieselModalOpen, setIsDieselModalOpen] = useState(openAddDieselInitially);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(openAddExpenseInitially);

  // Diesel Form Fields
  const [dMachineId, setDMachineId] = useState('');
  const [dLiters, setDLiters] = useState<number>(0);
  const [dCost, setDCost] = useState<number>(0);
  const [dVendor, setDVendor] = useState('');
  const [dPaymentType, setDPaymentType] = useState<'Paid' | 'Credit'>('Paid');
  const [dDate, setDDate] = useState(getTodayString());

  // Expense Form Fields
  const [eCategory, setECategory] = useState<ExpenseCategory>('Repair');
  const [eAmount, setEAmount] = useState<number>(0);
  const [eNotes, setENotes] = useState('');
  const [eDate, setEDate] = useState(getTodayString());
  const [eMachineId, setEMachineId] = useState(''); // Optional machine reference

  // Reset helpers
  const resetDieselForm = () => {
    setDMachineId('');
    setDLiters(0);
    setDCost(0);
    setDVendor('');
    setDPaymentType('Paid');
    setDDate(getTodayString());
    setIsDieselModalOpen(false);
    if (onCloseModalCallback) onCloseModalCallback();
  };

  const resetExpenseForm = () => {
    setECategory('Repair');
    setEAmount(0);
    setENotes('');
    setEDate(getTodayString());
    setEMachineId('');
    setIsExpenseModalOpen(false);
    if (onCloseModalCallback) onCloseModalCallback();
  };

  const handleSubmitDiesel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dMachineId || dLiters <= 0 || dCost <= 0) return;

    onAddDieselLog({
      machineId: dMachineId,
      liters: Number(dLiters),
      cost: Number(dCost),
      vendor: dVendor.trim() || 'General Pump',
      paymentType: dPaymentType,
      date: dDate
    });
    resetDieselForm();
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (eAmount <= 0) return;

    onAddExpense({
      category: eCategory,
      amount: Number(eAmount),
      notes: eNotes.trim(),
      date: eDate,
      machineId: eMachineId || undefined
    });
    resetExpenseForm();
  };

  // CALCULATIONS / METRICS
  const dieselStats = useMemo(() => {
    let totalLiters = 0;
    let totalCost = 0;
    let totalCredit = 0;
    const expensePerMachine: { [machineId: string]: { name: string; cost: number; liters: number } } = {};

    dieselLogs.forEach(log => {
      totalLiters += log.liters;
      totalCost += log.cost;
      if (log.paymentType === 'Credit') {
        totalCredit += log.cost;
      }

      if (!expensePerMachine[log.machineId]) {
        const m = machines.find(item => item.id === log.machineId);
        expensePerMachine[log.machineId] = {
          name: m ? m.name : 'Unknown Machine',
          cost: 0,
          liters: 0
        };
      }

      expensePerMachine[log.machineId].cost += log.cost;
      expensePerMachine[log.machineId].liters += log.liters;
    });

    return {
      totalLiters,
      totalCost,
      totalCredit,
      machineBreakdown: Object.values(expensePerMachine)
    };
  }, [dieselLogs, machines]);

  const expenseBreakdown = useMemo(() => {
    let total = 0;
    const cats: { [key in ExpenseCategory]: number } = {
      Repair: 0,
      Transport: 0,
      Food: 0,
      Miscellaneous: 0
    };

    expenses.forEach(e => {
      total += e.amount;
      if (cats[e.category] !== undefined) {
        cats[e.category] += e.amount;
      }
    });

    return {
      total,
      breakdown: cats
    };
  }, [expenses]);

  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case 'Repair':
        return <Wrench className="w-5 h-5 text-rose-500" />;
      case 'Transport':
        return <Truck className="w-5 h-5 text-indigo-500" />;
      case 'Food':
        return <Utensils className="w-5 h-5 text-emerald-500" />;
      case 'Miscellaneous':
        return <Cpu className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-24" id="diesel-expense-section">
      
      {/* Header and Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-zinc-900 leading-tight">
            Refueling and Spends
          </h2>
          <p className="text-xs text-zinc-500 font-medium">Keep running costs tight and identify machines burning the most money</p>
        </div>

        {/* Dynamic Dual Action Buttons */}
        <div className="flex space-x-2">
          <button 
            type="button"
            onClick={() => setIsDieselModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 bg-amber-500 text-zinc-950 font-bold px-3.5 py-2 rounded-lg text-xs hover:bg-amber-600 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Refuel Log</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 bg-zinc-900 text-white font-bold px-3.5 py-2 rounded-lg text-xs hover:bg-zinc-800 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>General Expense</span>
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveSubTab('diesel')}
          className={`flex-1 py-3 text-center border-b-2 font-display font-bold text-sm transition-all cursor-pointer ${
            activeSubTab === 'diesel' 
              ? 'border-brand-yellow text-zinc-900 bg-yellow-50/20' 
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          ⛽ Diesel Records
        </button>
        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`flex-1 py-3 text-center border-b-2 font-display font-bold text-sm transition-all cursor-pointer ${
            activeSubTab === 'expenses' 
              ? 'border-brand-yellow text-zinc-900 bg-yellow-50/20' 
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          🛠️ Site Expenses
        </button>
      </div>

      {/* ----------------- DIESEL TAB ----------------- */}
      {activeSubTab === 'diesel' && (
        <div className="space-y-6">
          
          {/* Summary Dashboard cards and breakdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 border border-zinc-200 rounded-xl">
              <p className="text-[10px] font-bold text-zinc-400 uppercase leading-none">Total Liters</p>
              <p className="font-mono text-xl sm:text-2xl font-bold mt-1 text-zinc-800">{dieselStats.totalLiters.toFixed(1)} L</p>
            </div>
            
            <div className="bg-white p-3.5 border border-zinc-200 rounded-xl">
              <p className="text-[10px] font-bold text-zinc-400 uppercase leading-none">Total Spent</p>
              <p className="font-mono text-xl sm:text-2xl font-bold mt-1 text-zinc-800">{formatRupee(dieselStats.totalCost)}</p>
            </div>

            <div className="bg-white p-3.5 border border-zinc-200 rounded-xl col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase leading-none">Owed on Credits</p>
              <p className="font-mono text-xl sm:text-2xl font-bold mt-1 text-rose-600">{formatRupee(dieselStats.totalCredit)}</p>
            </div>
          </div>

          {/* Machine breakdown progress blocks */}
          {dieselStats.machineBreakdown.length > 0 && (
            <div className="bg-white p-4 border border-zinc-200 rounded-xl shadow-sm space-y-3">
              <h4 className="font-display text-xs font-extrabold uppercase tracking-wider text-zinc-400">FUEL CONSUMED BY EQUIPMENT</h4>
              <div className="space-y-3">
                {dieselStats.machineBreakdown.map((item, index) => {
                  const percentage = (item.cost / (dieselStats.totalCost || 1)) * 100;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-700">{item.name}</span>
                        <span className="text-zinc-900 font-mono">{formatRupee(item.cost)} <span className="text-[10px] text-zinc-400 font-normal">({item.liters.toFixed(1)} L)</span></span>
                      </div>
                      <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List Fuel logs */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm text-zinc-700">Refueling Logs</h3>
            
            {dieselLogs.length === 0 ? (
              <p className="bg-white py-10 border-2 border-dashed rounded-xl text-center text-xs text-zinc-400 font-medium">
                No logs entered. Log pump orders to track diesel fuel expenses.
              </p>
            ) : (
              <div className="space-y-2.5">
                {dieselLogs.map((log) => {
                  const matchingM = machines.find(m => m.id === log.machineId);
                  return (
                    <div key={log.id} className="bg-white border border-zinc-200 hover:border-zinc-300 p-3.5 rounded-xl shadow-sm flex justify-between items-center text-xs">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            log.paymentType === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {log.paymentType}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">{formatDate(log.date)}</span>
                        </div>
                        <p className="font-bold text-zinc-900 text-sm">
                          {matchingM ? matchingM.name : 'Unknown Equipment'}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-medium font-sans">
                          Pump: {log.vendor} • {log.liters} Liters
                        </p>
                      </div>

                      <div className="text-right pl-3 shrink-0 flex items-center space-x-3">
                        <div>
                          <p className="font-mono font-bold text-zinc-900 text-base">{formatRupee(log.cost)}</p>
                          <p className="text-[9.5px] text-zinc-400 font-mono mt-0.5">₹{(log.cost/log.liters).toFixed(1)} / Liter</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this fuel log?')) onDeleteDieselLog(log.id);
                          }}
                          className="p-1 px-1.5 text-rose-400 hover:text-rose-600 active:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ----------------- EXPENSES TAB ----------------- */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-6">
          
          {/* Aggregates Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['Repair', 'Transport', 'Food', 'Miscellaneous'] as ExpenseCategory[]).map(cat => {
              const spent = expenseBreakdown.breakdown[cat] || 0;
              return (
                <div key={cat} className="bg-white p-3.5 border border-zinc-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">{cat}</span>
                    <span className="font-mono text-base font-bold text-zinc-900 block mt-1">{formatRupee(spent)}</span>
                  </div>
                  <div className="p-1.5 bg-zinc-50 border rounded-lg shrink-0">
                    {getCategoryIcon(cat)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* List Expenses */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm text-zinc-700">General Expense History ({expenses.length})</h3>
            
            {expenses.length === 0 ? (
              <p className="bg-white py-10 border-2 border-dashed rounded-xl text-center text-xs text-zinc-400 font-medium">
                No general expenses registered. Track machinery spare parts, operator lunches, and haulage.
              </p>
            ) : (
              <div className="space-y-2.5">
                {expenses.map((exp) => {
                  const m = machines.find(item => item.id === exp.machineId);
                  return (
                    <div key={exp.id} className="bg-white border border-zinc-200 hover:border-zinc-300 p-3.5 rounded-xl shadow-sm flex justify-between items-center text-xs">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="bg-zinc-100 text-zinc-700 font-bold px-1.5 py-0.5 rounded-[5px] text-[10px] uppercase">
                            {exp.category}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">{formatDate(exp.date)}</span>
                        </div>
                        
                        <p className="font-bold text-zinc-900 text-sm">
                          {exp.notes || 'General Spend'}
                        </p>
                        
                        {m && (
                          <p className="text-[10px] text-zinc-500 font-semibold font-sans">
                            Machine linked: {m.name}
                          </p>
                        )}
                      </div>

                      <div className="text-right pl-3 shrink-0 flex items-center space-x-3">
                        <span className="font-mono font-bold text-zinc-900 text-base">{formatRupee(exp.amount)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this expense?')) onDeleteExpense(exp.id);
                          }}
                          className="p-1 px-1.5 text-rose-400 hover:text-rose-600 active:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL: ADD DIESEL LOG */}
      {isDieselModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col">
            
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 rounded-t-2xl">
              <h3 className="font-display font-bold text-base text-zinc-900">Add Fuel Refueling Log</h3>
              <button 
                type="button" 
                onClick={resetDieselForm}
                className="text-zinc-400 font-mono font-bold p-1 text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmitDiesel} className="p-4 space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Select Machine Refueled</label>
                {machines.length === 0 ? (
                  <p className="text-rose-600 text-[11px] font-semibold p-2 bg-rose-50 border border-rose-200 rounded-lg">
                    ⚠️ Add a Machine in index first before posting diesel logs!
                  </p>
                ) : (
                  <select
                    value={dMachineId}
                    required
                    onChange={e => setDMachineId(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm bg-white focus:border-brand-yellow outline-none font-semibold text-zinc-800"
                  >
                    <option value="">-- Choose Machine --</option>
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Fuel Liters</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.1"
                    required
                    placeholder="e.g. 55"
                    value={dLiters || ''}
                    onChange={e => setDLiters(Number(e.target.value))}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Total Fuel Cost (₹)</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    placeholder="e.g. 5200"
                    value={dCost || ''}
                    onChange={e => setDCost(Number(e.target.value))}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Vendor / Pump Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Shell Ring Road, Essar"
                  value={dVendor}
                  onChange={e => setDVendor(e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-semibold text-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Refueling Date</label>
                  <input 
                    type="date" 
                    required
                    value={dDate}
                    onChange={e => setDDate(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Payment Status</label>
                  <select
                    value={dPaymentType}
                    onChange={e => setDPaymentType(e.target.value as 'Paid' | 'Credit')}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm bg-white focus:border-brand-yellow outline-none font-bold"
                  >
                    <option value="Paid">Paid (Cash/UPI) 🟢</option>
                    <option value="Credit">Credit (Owed) 🔴</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={machines.length === 0}
                className="w-full bg-amber-500 disabled:bg-zinc-300 text-zinc-950 font-bold py-3 rounded-lg active:scale-95 transition-transform text-xs"
              >
                SAVE FUEL LOG
              </button>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD GENERAL EXPENSE */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col">
            
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 rounded-t-2xl">
              <h3 className="font-display font-bold text-base text-zinc-900">Add Site Spend Expense</h3>
              <button 
                type="button" 
                onClick={resetExpenseForm}
                className="text-zinc-400 font-mono font-bold p-1 text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="p-4 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Spend Category</label>
                  <select
                    value={eCategory}
                    onChange={e => setECategory(e.target.value as ExpenseCategory)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm bg-white focus:border-brand-yellow outline-none font-bold"
                  >
                    <option value="Repair">Repair 🛠️</option>
                    <option value="Transport">Transport 🚚</option>
                    <option value="Food">Food 🍛</option>
                    <option value="Miscellaneous">Other ⚙️</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Expense Amount (₹)</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    placeholder="e.g. 1200"
                    value={eAmount || ''}
                    onChange={e => setEAmount(Number(e.target.value))}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Machine (Optional Link)</label>
                <select
                  value={eMachineId}
                  onChange={e => setEMachineId(e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm bg-white focus:border-brand-yellow outline-none font-semibold text-zinc-750"
                >
                  <option value="">-- No specific machine link --</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Spend Description</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Bucket tooth replacement, Operator lunch"
                  value={eNotes}
                  onChange={e => setENotes(e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-semibold text-zinc-750"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Spend Date</label>
                <input 
                  type="date" 
                  value={eDate}
                  onChange={e => setEDate(e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-950 text-white font-bold py-3 rounded-lg active:scale-95 transition-transform text-xs"
              >
                SAVE SPEND
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
