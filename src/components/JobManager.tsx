/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  History, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Wallet,
  Building,
  User,
  Edit2,
  FileText,
  CreditCard
} from 'lucide-react';
import { Job, Machine, PaymentHistoryItem, JobStatus } from '../types';
import { formatRupee, formatDate, shareReminder, getTodayString } from '../utils/helpers';

interface JobManagerProps {
  jobs: Job[];
  machines: Machine[];
  paymentHistory: PaymentHistoryItem[];
  onAddJob: (jobData: {
    customerName: string;
    phoneNumber: string;
    siteLocation: string;
    machineId: string;
    workDetails: string;
    totalAmount: number;
    notes?: string;
  }) => void;
  onAddPayment: (jobId: string, amount: number, notes?: string, date?: string) => void;
  onEditJob: (id: string, updates: Partial<Job>) => void;
  onDeleteJob: (id: string) => void;
  openAddModalInitially?: boolean;
  openAddPaymentInitiallyForId?: string | null;
  onCloseModalCallback?: () => void;
}

export default function JobManager({
  jobs,
  machines,
  paymentHistory,
  onAddJob,
  onAddPayment,
  onEditJob,
  onDeleteJob,
  openAddModalInitially = false,
  openAddPaymentInitiallyForId = null,
  onCloseModalCallback
}: JobManagerProps) {
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Partially Paid' | 'Paid'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modals state
  const [isJobModalOpen, setIsJobModalOpen] = useState(openAddModalInitially);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(!!openAddPaymentInitiallyForId);
  const [selectedJobIdForPayment, setSelectedJobIdForPayment] = useState<string | null>(openAddPaymentInitiallyForId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Job Form fields
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [machineId, setMachineId] = useState('');
  const [workDetails, setWorkDetails] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Smart calculation modes: 'flat' (Simple amount) | 'jcb_hours' (JCB Hours) | 'per_load' (Tipper Loads) | 'per_day' (Tipper Daily Rent)
  const [calcMode, setCalcMode] = useState<'flat' | 'jcb_hours' | 'per_load' | 'per_day'>('flat');
  
  // JCB Calculation parameters
  const [startHours, setStartHours] = useState<number>(0);
  const [endHours, setEndHours] = useState<number>(0);
  const [breakHours, setBreakHours] = useState<number>(0);
  const [ratePerHour, setRatePerHour] = useState<number>(0);

  // Tipper Load / Day parameters
  const [ratePerLoad, setRatePerLoad] = useState<number>(0);
  const [numLoads, setNumLoads] = useState<number>(0);
  const [ratePerDay, setRatePerDay] = useState<number>(0);
  const [numDays, setNumDays] = useState<number>(0);

  // Payment Form fields
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState('');
  const [payDate, setPayDate] = useState(getTodayString());

  // Edit fields
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editSiteLocation, setEditSiteLocation] = useState('');
  const [editMachineId, setEditMachineId] = useState('');
  const [editWorkDetails, setEditWorkDetails] = useState('');
  const [editTotalAmount, setEditTotalAmount] = useState<number>(0);
  const [editNotes, setEditNotes] = useState('');

  // Tipper / JCB Calculation parameters for Edit Job
  const [editCalcMode, setEditCalcMode] = useState<'flat' | 'jcb_hours' | 'per_load' | 'per_day'>('flat');
  const [editStartHours, setEditStartHours] = useState<number>(0);
  const [editEndHours, setEditEndHours] = useState<number>(0);
  const [editBreakHours, setEditBreakHours] = useState<number>(0);
  const [editRatePerHour, setEditRatePerHour] = useState<number>(0);

  const [editRatePerLoad, setEditRatePerLoad] = useState<number>(0);
  const [editNumLoads, setEditNumLoads] = useState<number>(0);
  const [editRatePerDay, setEditRatePerDay] = useState<number>(0);
  const [editNumDays, setEditNumDays] = useState<number>(0);

  // Pre-fill fields if requested initially
  useEffect(() => {
    if (openAddPaymentInitiallyForId) {
      setSelectedJobIdForPayment(openAddPaymentInitiallyForId);
      setIsPaymentModalOpen(true);
    }
  }, [openAddPaymentInitiallyForId]);

  // Auto-detect machine selection for Add Form to adjust calc modes
  const selectedMachine = machines.find(m => m.id === machineId);
  const isTipper = selectedMachine?.type === 'Tipper';
  const isJcbHandled = selectedMachine && ['JCB 3DX', 'Excavator', 'Mini Excavator'].includes(selectedMachine.type);

  useEffect(() => {
    if (isTipper) {
      setCalcMode('per_load'); // Default to loads for Tipper
    } else if (isJcbHandled) {
      setCalcMode('jcb_hours'); // Default to hours for JCB/Excavator
    } else {
      setCalcMode('flat');
    }
  }, [machineId]);

  // Recalculate totalAmount whenever any factor changes
  useEffect(() => {
    if (calcMode === 'per_load') {
      setTotalAmount(ratePerLoad * numLoads);
    } else if (calcMode === 'per_day') {
      setTotalAmount(ratePerDay * numDays);
    } else if (calcMode === 'jcb_hours') {
      const netHours = Math.max(0, (endHours - startHours) - breakHours);
      setTotalAmount(Math.round(netHours * ratePerHour));
    }
  }, [calcMode, ratePerLoad, numLoads, ratePerDay, numDays, startHours, endHours, breakHours, ratePerHour]);

  // Auto-detect machine selection for Edit Form
  const selectedEditMachine = machines.find(m => m.id === editMachineId);
  const isEditTipper = selectedEditMachine?.type === 'Tipper';
  const isEditJcbHandled = selectedEditMachine && ['JCB 3DX', 'Excavator', 'Mini Excavator'].includes(selectedEditMachine.type);

  // Recalculate editTotalAmount whenever edit factors change
  useEffect(() => {
    if (editCalcMode === 'per_load') {
      setEditTotalAmount(editRatePerLoad * editNumLoads);
    } else if (editCalcMode === 'per_day') {
      setEditTotalAmount(editRatePerDay * editNumDays);
    } else if (editCalcMode === 'jcb_hours') {
      const netHours = Math.max(0, (editEndHours - editStartHours) - editBreakHours);
      setEditTotalAmount(Math.round(netHours * editRatePerHour));
    }
  }, [editCalcMode, editRatePerLoad, editNumLoads, editRatePerDay, editNumDays, editStartHours, editEndHours, editBreakHours, editRatePerHour]);

  // Handle opening payment modal
  const openPaymentModal = (jobId: string, totalPending: number) => {
    setSelectedJobIdForPayment(jobId);
    setPayAmount(totalPending);
    setPayNotes('Partial payment received');
    setPayDate(getTodayString());
    setIsPaymentModalOpen(true);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !machineId) return;

    let finalWorkDetails = workDetails;
    if (calcMode === 'jcb_hours') {
      const descSuffix = `[JCB Hours: Start ${startHours} - End ${endHours}, Break ${breakHours} hrs @ ₹${ratePerHour}/hr]`;
      if (!finalWorkDetails.includes(descSuffix)) {
        finalWorkDetails = (finalWorkDetails + `\nCalculated agreement: ${descSuffix}`).trim();
      }
    } else if (calcMode === 'per_load') {
      const descSuffix = `[Tipper Loads: ${numLoads} loads @ ₹${ratePerLoad}/load]`;
      if (!finalWorkDetails.includes(descSuffix)) {
        finalWorkDetails = (finalWorkDetails + `\nCalculated agreement: ${descSuffix}`).trim();
      }
    } else if (calcMode === 'per_day') {
      const descSuffix = `[Tipper Days: ${numDays} days @ ₹${ratePerDay}/day]`;
      if (!finalWorkDetails.includes(descSuffix)) {
        finalWorkDetails = (finalWorkDetails + `\nCalculated agreement: ${descSuffix}`).trim();
      }
    }

    onAddJob({
      customerName,
      phoneNumber,
      siteLocation,
      machineId,
      workDetails: finalWorkDetails,
      totalAmount: Number(totalAmount) || 0,
      notes
    });

    // Reset Job modal fields
    setCustomerName('');
    setPhoneNumber('');
    setSiteLocation('');
    setMachineId('');
    setWorkDetails('');
    setTotalAmount(0);
    setNotes('');
    setCalcMode('flat');
    setStartHours(0);
    setEndHours(0);
    setBreakHours(0);
    setRatePerHour(0);
    setRatePerLoad(0);
    setNumLoads(0);
    setRatePerDay(0);
    setNumDays(0);
    setIsJobModalOpen(false);
    if (onCloseModalCallback) onCloseModalCallback();
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobIdForPayment || payAmount <= 0) return;

    onAddPayment(selectedJobIdForPayment, Number(payAmount), payNotes, payDate);

    // Reset payment fields
    setPayAmount(0);
    setPayNotes('');
    setIsPaymentModalOpen(false);
    setSelectedJobIdForPayment(null);
    if (onCloseModalCallback) onCloseModalCallback();
  };

  const handleEditJobClick = (job: Job) => {
    setEditingJob(job);
    setEditCustomerName(job.customerName);
    setEditPhoneNumber(job.phoneNumber);
    setEditSiteLocation(job.siteLocation);
    setEditMachineId(job.machineId);
    setEditWorkDetails(job.workDetails);
    setEditTotalAmount(job.totalAmount);
    setEditNotes(job.notes || '');

    const details = job.workDetails || '';
    
    // Parse out preceding calculations
    const jcbMatch = details.match(/\[JCB Hours:\s*Start\s*([\d.]+)\s*-\s*End\s*([\d.]+),\s*Break\s*([\d.]+)\s*hrs\s*@\s*₹?([\d.]+)\/hr\]/i);
    const loadMatch = details.match(/\[Tipper Loads:\s*(\d+)\s*loads?\s*@\s*₹?(\d+)\/load\]/i);
    const dayMatch = details.match(/\[Tipper Days:\s*(\d+)\s*days?\s*@\s*₹?(\d+)\/day\]/i);

    if (jcbMatch) {
      setEditCalcMode('jcb_hours');
      setEditStartHours(Number(jcbMatch[1]));
      setEditEndHours(Number(jcbMatch[2]));
      setEditBreakHours(Number(jcbMatch[3]));
      setEditRatePerHour(Number(jcbMatch[4]));
      
      setEditRatePerLoad(0);
      setEditNumLoads(0);
      setEditRatePerDay(0);
      setEditNumDays(0);
    } else if (loadMatch) {
      setEditCalcMode('per_load');
      setEditNumLoads(Number(loadMatch[1]));
      setEditRatePerLoad(Number(loadMatch[2]));
      
      setEditStartHours(0);
      setEditEndHours(0);
      setEditBreakHours(0);
      setEditRatePerHour(0);
      setEditRatePerDay(0);
      setEditNumDays(0);
    } else if (dayMatch) {
      setEditCalcMode('per_day');
      setEditNumDays(Number(dayMatch[1]));
      setEditRatePerDay(Number(dayMatch[2]));
      
      setEditStartHours(0);
      setEditEndHours(0);
      setEditBreakHours(0);
      setEditRatePerHour(0);
      setEditRatePerLoad(0);
      setEditNumLoads(0);
    } else {
      setEditCalcMode('flat');
      setEditStartHours(0);
      setEditEndHours(0);
      setEditBreakHours(0);
      setEditRatePerHour(0);
      setEditRatePerLoad(0);
      setEditNumLoads(0);
      setEditRatePerDay(0);
      setEditNumDays(0);
    }

    setIsEditModalOpen(true);
  };

  const handleSaveChangesJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    let finalWorkDetails = editWorkDetails;
    // Remove previous calculated agreements to avoid duplicates
    finalWorkDetails = finalWorkDetails.replace(/\n?Calculated agreement:[\s\S]*$/, '').trim();

    if (editCalcMode === 'jcb_hours') {
      finalWorkDetails = (finalWorkDetails + `\nCalculated agreement: [JCB Hours: Start ${editStartHours} - End ${editEndHours}, Break ${editBreakHours} hrs @ ₹${editRatePerHour}/hr]`).trim();
    } else if (editCalcMode === 'per_load') {
      finalWorkDetails = (finalWorkDetails + `\nCalculated agreement: [Tipper Loads: ${editNumLoads} loads @ ₹${editRatePerLoad}/load]`).trim();
    } else if (editCalcMode === 'per_day') {
      finalWorkDetails = (finalWorkDetails + `\nCalculated agreement: [Tipper Days: ${editNumDays} days @ ₹${editRatePerDay}/day]`).trim();
    }

    const newTotal = Number(editTotalAmount) || 0;
    const currentPaid = editingJob.totalPaid;
    const pending = Math.max(0, newTotal - currentPaid);
    let status: JobStatus = 'Pending';
    if (currentPaid > 0 && pending > 0) status = 'Partially Paid';
    else if (pending === 0) status = 'Paid';

    onEditJob(editingJob.id, {
      customerName: editCustomerName,
      phoneNumber: editPhoneNumber,
      siteLocation: editSiteLocation,
      machineId: editMachineId,
      workDetails: finalWorkDetails,
      totalAmount: newTotal,
      pendingAmount: pending,
      status,
      notes: editNotes
    });

    setIsEditModalOpen(false);
    setEditingJob(null);
  };

  // Filter Jobs list
  const filteredJobs = jobs.filter(job => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      job.customerName.toLowerCase().includes(term) ||
      job.phoneNumber.includes(term) ||
      job.siteLocation.toLowerCase().includes(term) ||
      job.workDetails.toLowerCase().includes(term);

    const matchesStatus = activeFilter === 'All' || job.status === activeFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-24" id="job-manager-section animate-fade">
      
      {/* Top action block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-zinc-900 leading-tight">
            Client Jobs & Payments ({filteredJobs.length})
          </h2>
          <p className="text-xs text-zinc-500 font-medium">Track accounts receivable, work details, and partial history</p>
        </div>
        
        <button 
          onClick={() => setIsJobModalOpen(true)}
          className="flex items-center justify-center space-x-1.5 text-sm font-semibold bg-brand-yellow text-zinc-950 px-4 py-2.5 rounded-lg active:scale-95 transition-all shadow-sm cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Book New Job</span>
        </button>
      </div>

      {/* FILTER BUTTONS & SEARCH BAR */}
      <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search name, phone, or location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 border-2 border-zinc-150 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:border-brand-yellow outline-none font-medium"
          />
        </div>

        {/* Categories toggler */}
        <div className="flex space-x-1 overflow-x-auto pb-1 max-w-full">
          {(['All', 'Pending', 'Partially Paid', 'Paid'] as const).map(f => {
            const count = jobs.filter(j => f === 'All' || j.status === f).length;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeFilter === f 
                    ? 'bg-zinc-900 text-white' 
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* JOBS LIST IN CARDS */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-4">
          <Wallet className="w-12 h-12 text-zinc-300" />
          <div className="max-w-xs">
            <h3 className="font-display font-semibold text-zinc-700 text-base">No matching jobs</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Add customers to track who has paid, who is pending, and keep your history spotless.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setIsJobModalOpen(true)}
            className="bg-zinc-950 text-white font-bold px-4 py-2 rounded-lg text-sm transition-transform active:scale-95"
          >
            Book Your First Job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => {
            const hMachines = machines.find(m => m.id === job.machineId);
            const history = paymentHistory.filter(p => p.jobId === job.id);
            const isExpanded = expandedId === job.id;
            
            return (
              <div 
                key={job.id}
                className={`bg-white rounded-xl border transition-all ${
                  isExpanded ? 'border-zinc-400' : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                
                {/* HEAD DECK CARD */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : job.id)}
                  className="p-4 cursor-pointer flex justify-between items-start gap-3"
                >
                  <div className="space-y-1 bg-white min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        job.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        job.status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {job.status}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {formatDate(job.createdAt)}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-zinc-900 text-base">
                      {job.customerName}
                    </h4>

                    {/* Site and simple specs */}
                    <div className="flex items-center space-x-2 text-zinc-500 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{job.siteLocation}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="bg-zinc-100 text-zinc-700 font-semibold px-1 rounded text-[10px]">
                        {hMachines ? hMachines.name : 'Unknown Equipment'}
                      </span>
                    </div>
                  </div>

                  {/* Financial Quick indicators right aligned */}
                  <div className="text-right space-y-1.5 shrink-0">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase leading-none">PENDING BALANCE</p>
                    <p className={`font-mono font-bold leading-none text-base sm:text-lg ${job.pendingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatRupee(job.pendingAmount)}
                    </p>
                    <p className="text-[9px] text-zinc-400">Total: {formatRupee(job.totalAmount)}</p>
                    
                    <div className="flex justify-end pt-0.5">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </div>
                  </div>
                </div>

                {/* PROGRESS TICKER FOR MOBILE */}
                <div id="progress-indicator-line" className="px-4 pb-3">
                  <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all" 
                      style={{ width: `${(job.totalPaid / job.totalAmount) * 100}%` }}
                    />
                    <div 
                      className="bg-rose-500 h-full transition-all" 
                      style={{ width: `${(job.pendingAmount / job.totalAmount) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-400 font-semibold mt-1">
                    <span className="text-emerald-700">Covered: {formatRupee(job.totalPaid)}</span>
                    <span className="text-rose-700">Due: {formatRupee(job.pendingAmount)}</span>
                  </div>
                </div>

                {/* DETAILED AREA COLLAPSED/EXPANDED */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 p-4 bg-zinc-50 rounded-b-xl space-y-4 animate-slideDown">
                    
                    {/* Customer Info row */}
                    <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-lg border border-zinc-150">
                      <div>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Site Location</p>
                        <p className="text-sm font-semibold text-zinc-800">{job.siteLocation}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Phone Number</p>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <a 
                            href={`tel:${job.phoneNumber}`}
                            className="bg-zinc-100 border border-zinc-200 text-zinc-800 py-1 px-2.5 rounded font-mono text-xs font-bold inline-flex items-center gap-1.5 hover:bg-zinc-200"
                          >
                            <Phone className="w-3 h-3 text-brand-accent shrink-0" />
                            {job.phoneNumber || 'No Phone'}
                          </a>
                        </div>
                      </div>
                      
                      <div className="col-span-2 border-t pt-2 mt-1">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Work Details</p>
                        <p className="text-xs text-zinc-700 whitespace-pre-line mt-0.5">{job.workDetails}</p>
                      </div>

                      {job.notes && (
                        <div className="col-span-2 bg-yellow-50/50 p-2 border border-amber-100 rounded text-xs text-amber-900 mt-1">
                          <span className="font-semibold text-[10px] text-brand-accent block uppercase">Notes:</span>
                          {job.notes}
                        </div>
                      )}
                    </div>

                    {/* ACTIONS BAR FOR SITE OWNERS */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      
                      {job.pendingAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => openPaymentModal(job.id, job.pendingAmount)}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2 px-3 text-xs font-bold rounded-lg shadow-sm font-sans cursor-pointer"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          Mark Payment Received
                        </button>
                      )}

                      {job.pendingAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => shareReminder(job.phoneNumber, job.customerName, job.siteLocation, job.pendingAmount, hMachines ? hMachines.name : 'Equipment')}
                          className="flex items-center gap-1.5 bg-brand-yellow text-zinc-950 hover:bg-brand-accent active:scale-95 py-2 px-3 text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Reminder
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleEditJobClick(job)}
                        className="flex items-center gap-1.5 bg-zinc-250 text-zinc-800 hover:bg-zinc-300 active:scale-95 py-2 px-3 text-xs font-bold rounded-lg cursor-pointer border border-zinc-300"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Details
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete client ${job.customerName}? Payment logs will be removed.`)) {
                            onDeleteJob(job.id);
                          }
                        }}
                        className="flex items-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 active:scale-95 py-2 px-3 text-xs font-bold rounded-lg cursor-pointer ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Job
                      </button>

                    </div>

                    {/* PAYMENT HISTORY LEDGER HISTORY (Strict calculation, no overwrites!) */}
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center space-x-1.5 text-zinc-700 mb-1">
                        <History className="w-4 h-4 text-zinc-400" />
                        <h5 className="text-[11px] font-bold uppercase tracking-wide">Payment History Ledger ({history.length})</h5>
                      </div>

                      {history.length === 0 ? (
                        <p className="bg-white p-3 rounded-lg border border-dashed text-center text-xs text-zinc-400 font-medium">
                          No payments have been logged yet for this site job.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {history.map((log) => (
                            <div 
                              key={log.id} 
                              className="bg-white p-2.5 rounded-lg border border-zinc-150 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-zinc-800 font-sans flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                  Logged payment: {formatRupee(log.amountPaid)}
                                </p>
                                {log.notes && <p className="text-[10.5px] text-zinc-500 italic mt-0.5 truncate">{log.notes}</p>}
                              </div>
                              <div className="text-right shrink-0 pl-2">
                                <p className="font-mono font-medium text-zinc-400 text-[10px]">{formatDate(log.date)}</p>
                                <p className="text-[9.5px] text-zinc-500 mt-0.5">Balance left: {formatRupee(log.remainingBalance)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: BOOK NEW JOB CUSTOMER */}
      <AnimatePresence>
        {isJobModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 25 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
            >
              
              <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚜</span>
                  <h3 className="font-display font-bold text-lg text-zinc-900">Book Customer/Job</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsJobModalOpen(false);
                    if (onCloseModalCallback) onCloseModalCallback();
                  }}
                  className="text-zinc-500 hover:text-zinc-805 bg-zinc-100 hover:bg-zinc-200 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleCreateJob} className="p-5 space-y-4 overflow-y-auto">
                
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Customer Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. 9876543210"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Site Location</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Metro Section B"
                      value={siteLocation}
                      onChange={e => setSiteLocation(e.target.value)}
                      className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Select Leased Machine</label>
                  {machines.length === 0 ? (
                    <p className="text-rose-600 text-xs font-semibold p-2 bg-rose-50 border border-rose-200 rounded-lg">
                      ⚠️ Please add a machine first! You must have at least 1 machine to book a job.
                    </p>
                  ) : (
                    <select
                      value={machineId}
                      required
                      onChange={e => setMachineId(e.target.value)}
                      className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm bg-white focus:border-brand-yellow outline-none font-semibold"
                    >
                      <option value="">-- Choose Machine Hired --</option>
                      {machines.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* SMART CALCULATOR CARD FOR SITE CLIENTS */}
                {selectedMachine && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-amber-50 border-2 border-amber-300 p-4 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase font-sans">
                        🚜 Machine Mitra Smart Calculator
                      </span>
                      <span className="bg-amber-100 text-amber-950 border border-amber-300 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                        Auto Calculator
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-lg border border-amber-200">
                      <button
                        type="button"
                        onClick={() => setCalcMode('jcb_hours')}
                        className={`py-2 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                          calcMode === 'jcb_hours' 
                            ? 'bg-amber-500 text-zinc-950 shadow-xs font-sans' 
                            : 'text-zinc-650 hover:bg-zinc-50'
                        }`}
                      >
                        🚜 JCB Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcMode('per_load')}
                        className={`py-2 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                          calcMode === 'per_load' 
                            ? 'bg-amber-500 text-zinc-950 shadow-xs font-sans' 
                            : 'text-zinc-650 hover:bg-zinc-50'
                        }`}
                      >
                        🚚 Loads
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcMode('per_day')}
                        className={`py-2 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                          calcMode === 'per_day' 
                            ? 'bg-amber-500 text-zinc-950 shadow-xs font-sans' 
                            : 'text-zinc-650 hover:bg-zinc-50'
                        }`}
                      >
                        🗓️ Daily
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcMode('flat')}
                        className={`py-2 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                          calcMode === 'flat' 
                            ? 'bg-amber-500 text-zinc-950 shadow-xs font-sans' 
                            : 'text-zinc-650 hover:bg-zinc-50'
                        }`}
                      >
                        ✏️ Flat / Simple
                      </button>
                    </div>

                    {calcMode === 'jcb_hours' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="space-y-3 bg-white p-3 rounded-lg border border-amber-100"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Start Hour Reading</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="e.g. 1000.5"
                              value={startHours || ''}
                              onChange={e => setStartHours(Number(e.target.value))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">End Hour Reading</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="e.g. 1012.0"
                              value={endHours || ''}
                              onChange={e => setEndHours(Number(e.target.value))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Lunch/Break (Hrs)</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="e.g. 1.0"
                              value={breakHours || ''}
                              onChange={e => setBreakHours(Number(e.target.value))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Rate per Hour (₹)</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="e.g. 900"
                              value={ratePerHour || ''}
                              onChange={e => setRatePerHour(Number(e.target.value))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                            />
                          </div>
                        </div>

                        <div className="text-[11px] text-zinc-500 flex justify-between pt-1 border-t border-zinc-100">
                          <span>Computed Hours worked:</span>
                          <span className="font-mono font-black text-amber-950 bg-amber-100 px-1 rounded">
                            {Math.max(0, (endHours - startHours) - breakHours).toFixed(1)} hrs
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {calcMode === 'per_load' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-amber-100"
                      >
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Rate per Load (₹)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 1500"
                            value={ratePerLoad || ''}
                            onChange={e => setRatePerLoad(Number(e.target.value))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Total Loads</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 12"
                            value={numLoads || ''}
                            onChange={e => setNumLoads(Number(e.target.value))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                          />
                        </div>
                      </motion.div>
                    )}

                    {calcMode === 'per_day' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-amber-100"
                      >
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Rental per Day (₹)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 5000"
                            value={ratePerDay || ''}
                            onChange={e => setRatePerDay(Number(e.target.value))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Total Days hired</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 7"
                            value={numDays || ''}
                            onChange={e => setNumDays(Number(e.target.value))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                          />
                        </div>
                      </motion.div>
                    )}

                    {calcMode !== 'flat' && (
                      <div className="flex items-center justify-between text-xs font-bold text-amber-955 pt-1.5 border-t border-dashed border-amber-200">
                        <span>Dynamic Agreement Cost:</span>
                        <span className="font-mono text-sm bg-amber-100 px-2 py-0.5 rounded text-amber-950 font-extrabold">{formatRupee(totalAmount)}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Work Description & Rate Details</label>
                  <textarea 
                    placeholder="e.g. Site leveling for 15 hours. Transport extra."
                    value={workDetails}
                    onChange={e => setWorkDetails(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none h-16 resize-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Total Agreement Work Amount (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    disabled={calcMode !== 'flat'}
                    placeholder="Total cost amount"
                    value={totalAmount || ''}
                    onChange={e => setTotalAmount(Number(e.target.value))}
                    className="w-full border-2 border-zinc-200 disabled:bg-zinc-100 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono font-bold"
                  />
                  {calcMode !== 'flat' && (
                    <p className="text-[10px] text-amber-700 font-semibold mt-1">
                      💡 Locked and computed by Tipper smart calculator. Toggle flat rate to type manually.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Internal Billing Notes</label>
                  <textarea 
                    placeholder="Any other comments"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none h-12 resize-none font-medium"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={machines.length === 0}
                    className="w-full bg-zinc-950 disabled:bg-zinc-300 text-white font-extrabold py-3 rounded-lg active:scale-[0.99] transition-transform shadow-md cursor-pointer text-sm"
                  >
                    CONFIRM & BOOK CUSTOMER
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD CUSTOM LOGGED PAYMENT */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedJobIdForPayment && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 25 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col"
            >
              
              <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 rounded-t-2xl">
                <h3 className="font-display font-medium text-base text-zinc-900">Add Payment Ledger Entry</h3>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedJobIdForPayment(null);
                    if (onCloseModalCallback) onCloseModalCallback();
                  }}
                  className="text-zinc-500 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="p-4 space-y-4">
                
                <div>
                  <p className="text-xs text-zinc-500 leading-none fontweight-bold uppercase">Customer Account</p>
                  <p className="text-sm font-bold text-zinc-900 mt-1.5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-yellow border-2 border-zinc-950 inline-block"></span>
                    {jobs.find(j => j.id === selectedJobIdForPayment)?.customerName}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Amount Paid (₹)</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    placeholder="How much is paid now?"
                    value={payAmount || ''}
                    onChange={e => setPayAmount(Number(e.target.value))}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Date Received</label>
                  <input 
                    type="date" 
                    required
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Receipt Notes / Method</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Received Cash or UPI Bank transfer"
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg active:scale-95 transition-transform text-xs"
                >
                  CONFIRM & LOG DEPOSIT
                </button>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT JOB DETAILS */}
      <AnimatePresence>
        {isEditModalOpen && editingJob && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 25 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
            >
              
              <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 rounded-t-2xl">
                <h3 className="font-display font-bold text-lg text-zinc-900">Edit Customer/Job</h3>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingJob(null);
                  }}
                  className="text-zinc-500 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSaveChangesJob} className="p-5 space-y-4 overflow-y-auto">
                
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Customer Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={editCustomerName}
                    onChange={e => setEditCustomerName(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. 9876543210"
                      value={editPhoneNumber}
                      onChange={e => setEditPhoneNumber(e.target.value)}
                      className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Site Location</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Metro Section B"
                      value={editSiteLocation}
                      onChange={e => setEditSiteLocation(e.target.value)}
                      className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Choose Machine Hired</label>
                  <select
                    value={editMachineId}
                    required
                    onChange={e => setEditMachineId(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm bg-white focus:border-brand-yellow outline-none font-semibold"
                  >
                    <option value="">-- Choose Machine Hired --</option>
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
                    ))}
                  </select>
                </div>

                {/* SMART CALCULATOR CARD FOR SITE CLIENTS ON EDIT */}
                {selectedEditMachine && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-amber-50 border-2 border-amber-300 p-4 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-955 uppercase font-sans">
                        🚜 Machine Mitra Smart Calculator
                      </span>
                      <span className="bg-amber-200 text-amber-955 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                        Auto Calculation
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-lg border border-amber-200">
                      <button
                        type="button"
                        onClick={() => setEditCalcMode('jcb_hours')}
                        className={`py-2 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                          editCalcMode === 'jcb_hours' 
                            ? 'bg-amber-500 text-zinc-950 shadow-sm font-sans' 
                            : 'text-zinc-650 hover:bg-zinc-50'
                        }`}
                      >
                        🚜 JCB Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditCalcMode('per_load')}
                        className={`py-2 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                          editCalcMode === 'per_load' 
                            ? 'bg-amber-500 text-zinc-950 shadow-sm font-sans' 
                            : 'text-zinc-650 hover:bg-zinc-50'
                        }`}
                      >
                        🚚 Loads
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditCalcMode('per_day')}
                        className={`py-2 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                          editCalcMode === 'per_day' 
                            ? 'bg-amber-500 text-zinc-950 shadow-sm font-sans' 
                            : 'text-zinc-650 hover:bg-zinc-50'
                        }`}
                      >
                        🗓️ Daily
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditCalcMode('flat')}
                        className={`py-2 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                          editCalcMode === 'flat' 
                            ? 'bg-amber-500 text-zinc-950 shadow-sm font-sans' 
                            : 'text-zinc-650 hover:bg-zinc-50'
                        }`}
                      >
                        ✏️ Flat / Simple
                      </button>
                    </div>

                    {editCalcMode === 'jcb_hours' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="space-y-3 bg-white p-3 rounded-lg border border-amber-100"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Start Hour Reading</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="e.g. 1000.5"
                              value={editStartHours || ''}
                              onChange={e => setEditStartHours(Number(e.target.value))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">End Hour Reading</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="e.g. 1012.0"
                              value={editEndHours || ''}
                              onChange={e => setEditEndHours(Number(e.target.value))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Lunch/Break (Hrs)</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="e.g. 1.0"
                              value={editBreakHours || ''}
                              onChange={e => setEditBreakHours(Number(e.target.value))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Rate per Hour (₹)</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="e.g. 900"
                              value={editRatePerHour || ''}
                              onChange={e => setEditRatePerHour(Number(e.target.value))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                            />
                          </div>
                        </div>

                        <div className="text-[11px] text-zinc-500 flex justify-between pt-1 border-t border-zinc-100">
                          <span>Computed Hours worked:</span>
                          <span className="font-mono font-black text-amber-955 bg-amber-100 px-1 rounded">
                            {Math.max(0, (editEndHours - editStartHours) - editBreakHours).toFixed(1)} hrs
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {editCalcMode === 'per_load' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-amber-100"
                      >
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Rate per Load (₹)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 1500"
                            value={editRatePerLoad || ''}
                            onChange={e => setEditRatePerLoad(Number(e.target.value))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Total Loads</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 12"
                            value={editNumLoads || ''}
                            onChange={e => setEditNumLoads(Number(e.target.value))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                          />
                        </div>
                      </motion.div>
                    )}

                    {editCalcMode === 'per_day' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-amber-100"
                      >
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Rental per Day (₹)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 5000"
                            value={editRatePerDay || ''}
                            onChange={e => setEditRatePerDay(Number(e.target.value))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Total Days hired</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 7"
                            value={editNumDays || ''}
                            onChange={e => setEditNumDays(Number(e.target.value))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono font-bold focus:bg-white focus:border-amber-400 outline-none"
                          />
                        </div>
                      </motion.div>
                    )}

                    {editCalcMode !== 'flat' && (
                      <div className="flex items-center justify-between text-xs font-bold text-amber-955 pt-1.5 border-t border-dashed border-amber-200">
                        <span>Dynamic Agreement Cost:</span>
                        <span className="font-mono text-sm bg-amber-100 px-2 py-0.5 rounded text-amber-950 font-extrabold">{formatRupee(editTotalAmount)}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Agreement Description</label>
                  <textarea 
                    placeholder="Rate rules etc."
                    value={editWorkDetails}
                    onChange={e => setEditWorkDetails(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none h-16 resize-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Total Job Cost Amount (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    disabled={editCalcMode !== 'flat'}
                    placeholder="Total agreement cost"
                    value={editTotalAmount || ''}
                    onChange={e => setEditTotalAmount(Number(e.target.value))}
                    className="w-full border-2 border-zinc-200 disabled:bg-zinc-100 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono font-bold"
                  />
                  {editCalcMode !== 'flat' && (
                    <p className="text-[10px] text-amber-700 font-semibold mt-1">
                      💡 Locked and computed by Tipper smart calculator. Toggle flat rate to type manually.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Internal Billing Notes</label>
                  <textarea 
                    placeholder="Internal notes"
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none h-12 resize-none font-medium"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-zinc-950 text-white font-extrabold py-3 rounded-lg active:scale-95 transition-transform text-sm"
                  >
                    SAVE & APPLY CHANGES
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
