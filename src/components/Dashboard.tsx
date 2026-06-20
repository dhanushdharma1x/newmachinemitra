/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Fuel, 
  Calendar, 
  Activity, 
  PlusCircle, 
  UserPlus, 
  IndianRupee, 
  Plus, 
  Cpu, 
  BellRing,
  CheckCircle2
} from 'lucide-react';
import { formatRupee } from '../utils/helpers';
import { Job, SalaryLog, DieselLog } from '../types';

interface DashboardProps {
  metrics: {
    todayIncome: number;
    todayExpense: number;
    pendingPayments: number;
    dieselExpense: number;
    monthlyProfit: number;
    activeMachines: number;
    totalMachines: number;
  };
  jobs: Job[];
  salaries: SalaryLog[];
  dieselLogs: DieselLog[];
  onQuickAction: (actionType: 'add-machine' | 'add-job' | 'add-payment' | 'add-expense' | 'add-diesel' | 'add-salary') => void;
  onChangeTab: (tabName: 'dashboard' | 'machines' | 'jobs' | 'diesel' | 'salaries' | 'profit-loss') => void;
}

export default function Dashboard({ 
  metrics, 
  jobs, 
  salaries, 
  dieselLogs, 
  onQuickAction,
  onChangeTab
}: DashboardProps) {

  // Dynamically generate Alerts based ONLY on real user data
  const generatedAlerts = React.useMemo(() => {
    const alerts: { id: string; type: 'payment' | 'salary' | 'diesel'; text: string; details: string }[] = [];

    // 1. Pending Customer Payments alert
    const pendingJobs = jobs.filter(j => j.status === 'Pending' || j.status === 'Partially Paid');
    if (pendingJobs.length > 0) {
      const totalPendingAmount = pendingJobs.reduce((sum, j) => sum + (j.totalAmount - j.totalPaid), 0);
      alerts.push({
        id: 'p-pending',
        type: 'payment',
        text: `₹${totalPendingAmount.toLocaleString('en-IN')} Pending from ${pendingJobs.length} customers`,
        details: 'Go to Payments tab to see outstanding bills or send reminders.'
      });
    }

    // 2. Salary outstanding alert
    const unpaidWages = salaries.filter(s => s.pendingSalary > 0);
    if (unpaidWages.length > 0) {
      const totalOutstandingSalary = unpaidWages.reduce((sum, s) => sum + s.pendingSalary, 0);
      alerts.push({
        id: 's-outstanding',
        type: 'salary',
        text: `₹${totalOutstandingSalary.toLocaleString('en-IN')} worker wages overdue`,
        details: `Outstanding salaries for ${unpaidWages.length} operators and site staff.`
      });
    }

    // 3. Diesel credits due alert
    const dieselCredits = dieselLogs.filter(d => d.paymentType === 'Credit');
    if (dieselCredits.length > 0) {
      const totalDieselCredits = dieselCredits.reduce((sum, d) => sum + d.cost, 0);
      alerts.push({
        id: 'd-credit',
        type: 'diesel',
        text: `₹${totalDieselCredits.toLocaleString('en-IN')} Fuel Credits owed to vendors`,
        details: `Active diesel credits for ${dieselCredits.length} refueling logs.`
      });
    }

    return alerts;
  }, [jobs, salaries, dieselLogs]);

  return (
    <div className="space-y-6 pb-24" id="mm-dashboard-container">
      
      {/* Dynamic Notifications Banner */}
      {generatedAlerts.length > 0 ? (
        <div id="alerts-section" className="bg-amber-50 border-l-4 border-brand-yellow p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <BellRing className="w-5 h-5 text-brand-accent animate-pulse" />
            <h3 className="font-display font-semibold text-brand-dark text-base">
              Due Reminders ({generatedAlerts.length})
            </h3>
          </div>
          <div className="space-y-3 mt-2">
            {generatedAlerts.map((alert) => (
              <div 
                key={alert.id} 
                onClick={() => {
                  if (alert.type === 'payment') onChangeTab('jobs');
                  else if (alert.type === 'salary') onChangeTab('salaries');
                  else if (alert.type === 'diesel') onChangeTab('diesel');
                }}
                className="p-3 bg-white border border-amber-100 rounded-md cursor-pointer hover:bg-amber-50 transition-colors flex items-start justify-between"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-amber-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-yellow inline-block"></span>
                    {alert.text}
                  </p>
                  <p className="text-xs text-amber-800">{alert.details}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-mono font-medium">
                  FIX NOW
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg flex items-center space-x-3 text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Everything looks neat!</p>
            <p className="text-xs text-emerald-700">No overdue diesel credits, pending wages, or stuck payments are logged.</p>
          </div>
        </div>
      )}

      {/* Main Stats Segment */}
      <div id="quick-metrics-grid" className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Today's Income</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-mono text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              {formatRupee(metrics.todayIncome)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">Payment logs created today</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Today's Expense</span>
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="font-mono text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              {formatRupee(metrics.todayExpense)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">Spends, fuel, wages paid today</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Pending Payments</span>
            <AlertCircle className="w-5 h-5 text-brand-accent" />
          </div>
          <div>
            <p className="font-mono text-xl sm:text-2xl font-bold text-rose-600 tracking-tight">
              {formatRupee(metrics.pendingPayments)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">Total outstanding credit with clients</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Diesel Expense</span>
            <Fuel className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-mono text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              {formatRupee(metrics.dieselExpense)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">Fuel cost registered till date</p>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Monthly Profit</span>
            <IndianRupee className="w-5 h-5 text-brand-accent" />
          </div>
          <div>
            <p className={`font-mono text-xl sm:text-2xl font-bold tracking-tight ${metrics.monthlyProfit >= 0 ? 'text-zinc-900' : 'text-rose-600'}`}>
              {formatRupee(metrics.monthlyProfit)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">Income minus fuel, crew & maintenance</p>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Active Fleet</span>
            <Activity className="w-5 h-5 text-brand-yellow" />
          </div>
          <div>
            <p className="font-mono text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              {metrics.activeMachines} <span className="text-xs text-zinc-500 font-normal">/ {metrics.totalMachines} Working</span>
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">Equipment deployed on-site today</p>
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS SECTION: Giant Touch Buttons (Construction site friendly) */}
      <div id="quick-actions-section" className="space-y-4">
        <h2 className="font-display text-lg font-bold text-zinc-800 tracking-tight">
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          
          <button 
            type="button" 
            id="btn-action-add-machine"
            onClick={() => onQuickAction('add-machine')}
            className="flex flex-col items-center justify-center p-5 bg-zinc-900 text-white rounded-xl active:bg-zinc-800 hover:bg-zinc-800 transition-all font-medium text-center space-y-2 border-2 border-transparent focus:outline-none shadow-md cursor-pointer"
          >
            <Plus className="w-6 h-6 text-brand-yellow stroke-[2.5]" />
            <span className="text-sm font-semibold tracking-wide">Add Machine</span>
            <span className="text-[10px] text-zinc-400 font-normal">Add JCB, Tipper, etc.</span>
          </button>

          <button 
            type="button"
            id="btn-action-add-job"
            onClick={() => onQuickAction('add-job')}
            className="flex flex-col items-center justify-center p-5 bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl active:bg-zinc-50 hover:bg-zinc-50 transition-all font-medium text-center space-y-2 focus:outline-none shadow-sm cursor-pointer"
          >
            <UserPlus className="w-6 h-6 text-brand-accent stroke-[2.5]" />
            <span className="text-sm font-semibold tracking-wide">Add Customer</span>
            <span className="text-[10px] text-zinc-500 font-normal font-sans">Book a site job</span>
          </button>

          <button 
            type="button"
            id="btn-action-add-payment"
            onClick={() => onQuickAction('add-payment')}
            className="flex flex-col items-center justify-center p-5 bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl active:bg-zinc-50 hover:bg-zinc-50 transition-all font-medium text-center space-y-2 focus:outline-none shadow-sm cursor-pointer"
          >
            <IndianRupee className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
            <span className="text-sm font-semibold tracking-wide">Add Payment</span>
            <span className="text-[10px] text-zinc-500 font-normal">Receive partial/full</span>
          </button>

          <button 
            type="button"
            id="btn-action-add-diesel"
            onClick={() => onQuickAction('add-diesel')}
            className="flex flex-col items-center justify-center p-5 bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl active:bg-zinc-50 hover:bg-zinc-50 transition-all font-medium text-center space-y-2 focus:outline-none shadow-sm cursor-pointer"
          >
            <Fuel className="w-6 h-6 text-amber-600 stroke-[2.5]" />
            <span className="text-sm font-semibold tracking-wide">Add Diesel</span>
            <span className="text-[10px] text-zinc-500 font-normal">Log fuel lit & credit</span>
          </button>

          <button 
            type="button"
            id="btn-action-add-salary"
            onClick={() => onQuickAction('add-salary')}
            className="flex flex-col items-center justify-center p-5 bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl active:bg-zinc-50 hover:bg-zinc-50 transition-all font-medium text-center space-y-2 focus:outline-none shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-6 h-6 text-indigo-600 stroke-[2.5]" />
            <span className="text-sm font-semibold tracking-wide">Add Salary</span>
            <span className="text-[10px] text-zinc-500 font-normal">Operator advance/wage</span>
          </button>

          <button 
            type="button"
            id="btn-action-add-expense"
            onClick={() => onQuickAction('add-expense')}
            className="flex flex-col items-center justify-center p-5 bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl active:bg-zinc-50 hover:bg-zinc-50 transition-all font-medium text-center space-y-2 focus:outline-none shadow-sm cursor-pointer"
          >
            <Cpu className="w-6 h-6 text-rose-500 stroke-[2.5]" />
            <span className="text-sm font-semibold tracking-wide">Add Expense</span>
            <span className="text-[10px] text-zinc-500 font-normal">Repairs, food, transport</span>
          </button>

        </div>
      </div>

    </div>
  );
}
