/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  Settings, 
  LayoutDashboard, 
  HardHat, 
  Wallet, 
  Fuel, 
  Check, 
  Trash2,
  BellRing,
  Award,
  CircleCheck,
  TrendingUp,
  LineChart
} from 'lucide-react';
import { Machine, Job, PaymentHistoryItem, DieselLog, Expense, SalaryLog, MachineStatus, UserProfile, UserSession } from './types';
import { getTodayString } from './utils/helpers';

// Subcomponents
import Dashboard from './components/Dashboard';
import MachineManager from './components/MachineManager';
import JobManager from './components/JobManager';
import DieselAndExpenseManager from './components/DieselAndExpenseManager';
import SalaryManager from './components/SalaryManager';
import ProfitLoss from './components/ProfitLoss';
import Login from './components/Login';
import ProfileSettings from './components/ProfileSettings';

export default function App() {
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'machines' | 'jobs' | 'diesel' | 'salaries' | 'profit-loss' | 'profile'>('dashboard');

  // User Verification Session
  const [session, setSession] = useState<UserSession>({
    isLoggedIn: false,
    profile: {
      name: 'Owner',
      phoneNumber: '',
      companyName: 'Sri Ram Earth Movers'
    }
  });

  // Quick Action state togglers
  const [openMachineModal, setOpenMachineModal] = useState(false);
  const [openJobModal, setOpenJobModal] = useState(false);
  const [openDieselModal, setOpenDieselModal] = useState(false);
  const [openExpenseModal, setOpenExpenseModal] = useState(false);
  const [openSalaryModal, setOpenSalaryModal] = useState(false);
  const [payingJobId, setPayingJobId] = useState<string | null>(null);

  // Core business persistent states
  const [machines, setMachines] = useState<Machine[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [dieselLogs, setDieselLogs] = useState<DieselLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salaries, setSalaries] = useState<SalaryLog[]>([]);

  // 1. Initial State Loading from LocalStorage (strict fallback to empty [] so initial display is completely 0/empty)
  useEffect(() => {
    try {
      const storedMachines = localStorage.getItem('mm_machines');
      const storedJobs = localStorage.getItem('mm_jobs');
      const storedPayments = localStorage.getItem('mm_payments');
      const storedDiesel = localStorage.getItem('mm_diesel');
      const storedExpenses = localStorage.getItem('mm_expenses');
      const storedSalaries = localStorage.getItem('mm_salaries');

      if (storedMachines) setMachines(JSON.parse(storedMachines));
      if (storedJobs) setJobs(JSON.parse(storedJobs));
      if (storedPayments) setPaymentHistory(JSON.parse(storedPayments));
      if (storedDiesel) setDieselLogs(JSON.parse(storedDiesel));
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
      if (storedSalaries) setSalaries(JSON.parse(storedSalaries));

      // Load Login Session Info
      const logged = localStorage.getItem('mm_logged_in') === 'true';
      const storedProfile = localStorage.getItem('mm_user_profile');
      if (logged && storedProfile) {
        setSession({
          isLoggedIn: true,
          profile: JSON.parse(storedProfile)
        });
      }
    } catch (e) {
      console.error('Failed to restore MachineMitra state:', e);
    }
  }, []);

  // 2. State Sync writers
  const saveState = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const generateId = () => {
    return 'id_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
  };

  // ----- CRUD HANDLERS -----

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setSession({ isLoggedIn: true, profile: newProfile });
    localStorage.setItem('mm_user_profile', JSON.stringify(newProfile));
  };

  const handleLogout = () => {
    setSession({
      isLoggedIn: false,
      profile: {
        name: 'Owner',
        phoneNumber: '',
        companyName: 'Sri Ram Earth Movers'
      }
    });
    localStorage.removeItem('mm_logged_in');
    setActiveTab('dashboard');
  };

  // MACHINE HANDLERS
  const handleAddMachine = (newM: Omit<Machine, 'id'>) => {
    const updated = [...machines, { ...newM, id: generateId() }];
    setMachines(updated);
    saveState('mm_machines', updated);
  };

  const handleEditMachine = (id: string, updates: Partial<Machine>) => {
    const updated = machines.map(m => m.id === id ? { ...m, ...updates } : m);
    setMachines(updated);
    saveState('mm_machines', updated);
  };

  const handleDeleteMachine = (id: string) => {
    const updated = machines.filter(m => m.id !== id);
    setMachines(updated);
    saveState('mm_machines', updated);
    // clean orphaned jobs or prompt
  };

  // JOB & CUSTOMER HANDLERS
  const handleAddJob = (newJob: Omit<Job, 'id' | 'totalPaid' | 'pendingAmount' | 'status' | 'createdAt'>) => {
    const freshJob: Job = {
      ...newJob,
      id: generateId(),
      totalPaid: 0,
      pendingAmount: newJob.totalAmount,
      status: 'Pending',
      createdAt: getTodayString()
    };
    const updated = [...jobs, freshJob];
    setJobs(updated);
    saveState('mm_jobs', updated);
  };

  const handleEditJob = (id: string, updates: Partial<Job>) => {
    const updated = jobs.map(j => j.id === id ? { ...j, ...updates } : j);
    setJobs(updated);
    saveState('mm_jobs', updated);
  };

  const handleDeleteJob = (id: string) => {
    const updatedJobs = jobs.filter(j => j.id !== id);
    setJobs(updatedJobs);
    saveState('mm_jobs', updatedJobs);

    const updatedPayments = paymentHistory.filter(p => p.jobId !== id);
    setPaymentHistory(updatedPayments);
    saveState('mm_payments', updatedPayments);
  };

  // PAYMENT BOOK TRANSACTION LEDGER ADDER (Strict calculation, no overwriting previous payments!)
  const handleAddPayment = (jobId: string, amount: number, notes?: string, date?: string) => {
    const pDate = date || getTodayString();
    
    // Create new Payment Ledger history card
    const targetJob = jobs.find(j => j.id === jobId);
    if (!targetJob) return;

    const newPaymentLog: PaymentHistoryItem = {
      id: generateId(),
      jobId,
      date: pDate,
      amountPaid: amount,
      remainingBalance: Math.max(0, targetJob.pendingAmount - amount),
      notes: notes || 'Partial Payment'
    };

    const updatedPayments = [...paymentHistory, newPaymentLog];
    setPaymentHistory(updatedPayments);
    saveState('mm_payments', updatedPayments);

    // Now update parent job sums
    const updatedJobs = jobs.map(j => {
      if (j.id === jobId) {
        const totalPaid = j.totalPaid + amount;
        const pendingAmount = Math.max(0, j.totalAmount - totalPaid);
        let status: 'Pending' | 'Partially Paid' | 'Paid' = 'Pending';
        if (totalPaid === 0) status = 'Pending';
        else if (pendingAmount === 0) status = 'Paid';
        else status = 'Partially Paid';

        return {
          ...j,
          totalPaid,
          pendingAmount,
          status
        };
      }
      return j;
    });

    setJobs(updatedJobs);
    saveState('mm_jobs', updatedJobs);
  };

  // DIESEL HANDLERS
  const handleAddDieselLog = (dieselData: Omit<DieselLog, 'id'>) => {
    const updated = [...dieselLogs, { ...dieselData, id: generateId() }];
    setDieselLogs(updated);
    saveState('mm_diesel', updated);
  };

  const handleDeleteDieselLog = (id: string) => {
    const updated = dieselLogs.filter(d => d.id !== id);
    setDieselLogs(updated);
    saveState('mm_diesel', updated);
  };

  // GENERAL SPEND HANDLERS
  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    const updated = [...expenses, { ...expenseData, id: generateId() }];
    setExpenses(updated);
    saveState('mm_expenses', updated);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveState('mm_expenses', updated);
  };

  // SALARY HANDLERS
  const handleAddSalaryLog = (salaryData: Omit<SalaryLog, 'id' | 'pendingSalary'>) => {
    const gross = salaryData.salaryAmount;
    const adv = salaryData.advanceTaken;
    const paid = salaryData.paidAmount;
    const pend = gross - (adv + paid);

    const updated = [...salaries, {
      ...salaryData,
      id: generateId(),
      pendingSalary: pend
    }];
    setSalaries(updated);
    saveState('mm_salaries', updated);
  };

  const handleEditSalaryLog = (id: string, updates: Partial<SalaryLog>) => {
    const updated = salaries.map(s => {
      if (s.id === id) {
        const merged = { ...s, ...updates };
        // Recalculate pending wage automatically
        const pend = merged.salaryAmount - (merged.advanceTaken + merged.paidAmount);
        return {
          ...merged,
          pendingSalary: pend
        };
      }
      return s;
    });

    setSalaries(updated);
    saveState('mm_salaries', updated);
  };

  const handleDeleteSalaryLog = (id: string) => {
    const updated = salaries.filter(s => s.id !== id);
    setSalaries(updated);
    saveState('mm_salaries', updated);
  };

  // ----- DYNAMIC METRICS CALCULATOR -----
  const calculatedMetrics = useMemo(() => {
    const today = getTodayString();
    
    // Help calculate monthly dates window
    const todayObj = new Date();
    const currMonth = todayObj.getMonth();
    const currYear = todayObj.getFullYear();

    const isCurrentMonth = (dateStr: string): boolean => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getMonth() === currMonth && d.getFullYear() === currYear;
    };

    // 1. Today's Income (Sum of payment receipts on today)
    const todayIncome = paymentHistory
      .filter(p => p.date === today)
      .reduce((sum, p) => sum + p.amountPaid, 0);

    // 2. Today's Expense (Sum of fuel logs + wages + general spends today)
    const dieselToday = dieselLogs
      .filter(d => d.date === today)
      .reduce((sum, d) => sum + d.cost, 0);

    const spendsToday = expenses
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0);

    const wagesToday = salaries
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + (s.paidAmount + s.advanceTaken), 0);

    const todayExpense = dieselToday + spendsToday + wagesToday;

    // 3. Pending Payments (Total unpaid balances client-side)
    const pendingPayments = jobs.reduce((sum, j) => sum + j.pendingAmount, 0);

    // 4. Monthly Diesel Expense
    const dieselExpense = dieselLogs
      .filter(d => isCurrentMonth(d.date))
      .reduce((sum, d) => sum + d.cost, 0);

    // 5. Monthly Profit (Revenue current month minus fuel, crew wages, and repairs current month)
    const monthlyRevenue = paymentHistory
      .filter(p => isCurrentMonth(p.date))
      .reduce((sum, p) => sum + p.amountPaid, 0);

    const monthlyDieselCost = dieselLogs
      .filter(d => isCurrentMonth(d.date))
      .reduce((sum, d) => sum + d.cost, 0);

    const monthlyGeneralSpends = expenses
      .filter(e => isCurrentMonth(e.date))
      .reduce((sum, e) => sum + e.amount, 0);

    const monthlyCrewDisbursements = salaries
      .filter(s => isCurrentMonth(s.date))
      .reduce((sum, s) => sum + (s.paidAmount + s.advanceTaken), 0);

    const monthlyProfit = monthlyRevenue - (monthlyDieselCost + monthlyGeneralSpends + monthlyCrewDisbursements);

    // 6. Active Machines (Working count)
    const activeMachinesCount = machines.filter(m => m.status === 'Working').length;

    return {
      todayIncome,
      todayExpense,
      pendingPayments,
      dieselExpense,
      monthlyProfit,
      activeMachines: activeMachinesCount,
      totalMachines: machines.length
    };
  }, [machines, jobs, paymentHistory, dieselLogs, expenses, salaries]);

  // Handles fast action clicks on the Dashboard
  const handleQuickActionTrigger = (actionType: 'add-machine' | 'add-job' | 'add-payment' | 'add-expense' | 'add-diesel' | 'add-salary') => {
    switch (actionType) {
      case 'add-machine':
        setActiveTab('machines');
        setOpenMachineModal(true);
        break;
      case 'add-job':
        setActiveTab('jobs');
        setOpenJobModal(true);
        break;
      case 'add-payment':
        setActiveTab('jobs');
        if (jobs.length > 0) {
          // Pre-select first customer for payments logic
          setPayingJobId(jobs[0].id);
        } else {
          setOpenJobModal(true);
        }
        break;
      case 'add-diesel':
        setActiveTab('diesel');
        setOpenDieselModal(true);
        break;
      case 'add-expense':
        setActiveTab('diesel');
        setOpenExpenseModal(true);
        break;
      case 'add-salary':
        setActiveTab('salaries');
        setOpenSalaryModal(true);
        break;
    }
  };

  if (!session.isLoggedIn) {
    return (
      <Login 
        onLoginSuccess={(profile) => {
          setSession({ isLoggedIn: true, profile });
          localStorage.setItem('mm_logged_in', 'true');
          localStorage.setItem('mm_user_profile', JSON.stringify(profile));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col font-sans text-brand-dark" id="mm-application-root">
      
      {/* HEADER BAR: Professional Industrial Yellow Header */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-zinc-150 py-3.5 px-4 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="p-1 px-2.5 bg-brand-yellow font-display font-extrabold text-[#121212] tracking-normal rounded-lg text-lg border-2 border-brand-dark leading-none">
              Mitra
            </span>
            <div>
              <h1 className="font-display font-extrabold text-brand-dark text-lg leading-tight tracking-tight">
                MachineMitra
              </h1>
              <p className="text-[9.5px] text-zinc-400 font-bold uppercase leading-none mt-0.5 font-mono tracking-wider">
                Fleet Manager • {session.profile?.companyName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-zinc-50 border px-3 py-1.5 rounded-lg text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="text-zinc-600 font-mono text-[10px] uppercase">{session.profile?.name || 'Owner'}</span>
          </div>
        </div>
      </header>

      {/* VIEW PANEL CONTAINMENT AREA */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 pt-6 pb-24">
        
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <Dashboard 
                metrics={calculatedMetrics}
                jobs={jobs}
                salaries={salaries}
                dieselLogs={dieselLogs}
                onQuickAction={handleQuickActionTrigger}
                onChangeTab={setActiveTab}
              />
            </motion.div>
          )}

          {activeTab === 'machines' && (
            <motion.div
              key="machines"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <MachineManager 
                machines={machines}
                onAddMachine={handleAddMachine}
                onEditMachine={handleEditMachine}
                onDeleteMachine={handleDeleteMachine}
                openAddModalInitially={openMachineModal}
                onCloseModalCallback={() => setOpenMachineModal(false)}
              />
            </motion.div>
          )}

          {activeTab === 'jobs' && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <JobManager 
                jobs={jobs}
                machines={machines}
                paymentHistory={paymentHistory}
                onAddJob={handleAddJob}
                onAddPayment={handleAddPayment}
                onEditJob={handleEditJob}
                onDeleteJob={handleDeleteJob}
                openAddModalInitially={openJobModal}
                openAddPaymentInitiallyForId={payingJobId}
                onCloseModalCallback={() => {
                  setOpenJobModal(false);
                  setPayingJobId(null);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'diesel' && (
            <motion.div
              key="diesel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <DieselAndExpenseManager 
                dieselLogs={dieselLogs}
                expenses={expenses}
                machines={machines}
                onAddDieselLog={handleAddDieselLog}
                onDeleteDieselLog={handleDeleteDieselLog}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
                openAddDieselInitially={openDieselModal}
                openAddExpenseInitially={openExpenseModal}
                onCloseModalCallback={() => {
                  setOpenDieselModal(false);
                  setOpenExpenseModal(false);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'salaries' && (
            <motion.div
              key="salaries"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <SalaryManager 
                salaries={salaries}
                onAddSalaryLog={handleAddSalaryLog}
                onEditSalaryLog={handleEditSalaryLog}
                onDeleteSalaryLog={handleDeleteSalaryLog}
                openAddModalInitially={openSalaryModal}
                onCloseModalCallback={() => setOpenSalaryModal(false)}
              />
            </motion.div>
          )}

          {activeTab === 'profit-loss' && (
            <motion.div
              key="profit-loss"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <ProfitLoss 
                jobs={jobs}
                paymentHistory={paymentHistory}
                dieselLogs={dieselLogs}
                expenses={expenses}
                salaries={salaries}
              />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              <ProfileSettings
                profile={session.profile || { name: 'Owner', phoneNumber: '', companyName: 'Sri Ram Earth Movers' }}
                totalMachinesCount={machines.length}
                activeMachinesCount={machines.filter(m => m.status === 'Working').length}
                totalCustomersCount={jobs.length}
                onUpdateProfile={handleUpdateProfile}
                onLogout={handleLogout}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* NAVIGATION BAR DOCK (Fat-finger UI Friendly for site workers) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 text-white border-t border-zinc-800 shadow-2xl py-1 md:py-2 select-none">
        <div className="max-w-4xl mx-auto flex justify-between px-2 text-center">
          
          <button
            type="button"
            onClick={() => {
              setActiveTab('dashboard');
              setPayingJobId(null);
            }}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center space-y-1 rounded-lg ${
              activeTab === 'dashboard' ? 'text-brand-yellow font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="text-[9.5px] leading-tight font-sans">Home</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('machines');
              setPayingJobId(null);
            }}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center space-y-1 rounded-lg ${
              activeTab === 'machines' ? 'text-brand-yellow font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-lg shrink-0 leading-none">🚜</span>
            <span className="text-[9.5px] leading-tight font-sans">Machines</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('jobs');
              setPayingJobId(null);
            }}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center space-y-1 rounded-lg ${
              activeTab === 'jobs' ? 'text-brand-yellow font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wallet className="w-5 h-5 shrink-0" />
            <span className="text-[9.5px] leading-tight font-sans">Payments</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('diesel');
              setPayingJobId(null);
            }}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center space-y-1 rounded-lg ${
              activeTab === 'diesel' ? 'text-brand-yellow font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Fuel className="w-5 h-5 shrink-0" />
            <span className="text-[9.5px] leading-tight font-sans">Fuel/Spends</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('salaries');
              setPayingJobId(null);
            }}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center space-y-1 rounded-lg ${
              activeTab === 'salaries' ? 'text-brand-yellow font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HardHat className="w-5 h-5 shrink-0" />
            <span className="text-[9.5px] leading-tight font-sans">Crew/Wages</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('profit-loss');
              setPayingJobId(null);
            }}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center space-y-1 rounded-lg ${
              activeTab === 'profit-loss' ? 'text-brand-yellow font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LineChart className="w-5 h-5 shrink-0" />
            <span className="text-[9.5px] leading-tight font-sans">P&L Reports</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setPayingJobId(null);
            }}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center space-y-1 rounded-lg ${
              activeTab === 'profile' ? 'text-brand-yellow font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="text-[9.5px] leading-tight font-sans">Settings</span>
          </button>

        </div>
      </nav>

    </div>
  );
}

