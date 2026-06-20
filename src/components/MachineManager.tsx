/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Cpu, 
  Trash2, 
  Edit3, 
  Plus, 
  Check, 
  HelpCircle, 
  Gauge, 
  User, 
  IndianRupee, 
  Clock, 
  AlertTriangle,
  FolderMinus
} from 'lucide-react';
import { Machine, MachineType, ExcavatorModel, MachineStatus } from '../types';
import { formatRupee } from '../utils/helpers';

interface MachineManagerProps {
  machines: Machine[];
  onAddMachine: (machine: Omit<Machine, 'id'>) => void;
  onEditMachine: (id: string, machine: Partial<Machine>) => void;
  onDeleteMachine: (id: string) => void;
  openAddModalInitially?: boolean;
  onCloseModalCallback?: () => void;
}

export default function MachineManager({
  machines,
  onAddMachine,
  onEditMachine,
  onDeleteMachine,
  openAddModalInitially = false,
  onCloseModalCallback
}: MachineManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(openAddModalInitially);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState<MachineType>('JCB 3DX');
  const [excavatorModel, setExcavatorModel] = useState<ExcavatorModel>('EX70');
  const [registrationNo, setRegistrationNo] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [status, setStatus] = useState<MachineStatus>('Working');
  const [hourMeter, setHourMeter] = useState<number>(0);
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Handle Edit triggering
  const handleEditClick = (machine: Machine) => {
    setEditingMachine(machine);
    setName(machine.name);
    setType(machine.type);
    if (machine.excavatorModel) setExcavatorModel(machine.excavatorModel);
    setRegistrationNo(machine.registrationNo);
    setOperatorName(machine.operatorName);
    setStatus(machine.status);
    setHourMeter(machine.hourMeter);
    setPurchaseCost(machine.purchaseCost);
    setNotes(machine.notes || '');
    setIsFormOpen(true);
  };

  // Re-initialization
  const resetForm = () => {
    setName('');
    setType('JCB 3DX');
    setExcavatorModel('EX70');
    setRegistrationNo('');
    setOperatorName('');
    setStatus('Working');
    setHourMeter(0);
    setPurchaseCost(0);
    setNotes('');
    setEditingMachine(null);
    setIsFormOpen(false);
    if (onCloseModalCallback) onCloseModalCallback();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data: Omit<Machine, 'id'> = {
      name,
      type,
      excavatorModel: type === 'Excavator' ? excavatorModel : undefined,
      registrationNo,
      operatorName,
      status,
      hourMeter: Number(hourMeter) || 0,
      purchaseCost: Number(purchaseCost) || 0,
      notes
    };

    if (editingMachine) {
      onEditMachine(editingMachine.id, data);
    } else {
      onAddMachine(data);
    }
    resetForm();
  };

  const getMachineIcon = (mType: MachineType) => {
    switch (mType) {
      case 'JCB 3DX':
        return <span className="text-2xl">🚜</span>;
      case 'Tipper':
        return <span className="text-2xl">🚚</span>;
      case 'Mini Excavator':
        return <span className="text-2xl">🏗️</span>;
      case 'Excavator':
        return <span className="text-2xl">🧱</span>;
      default:
        return <span className="text-2xl font-bold">⚙️</span>;
    }
  };

  return (
    <div className="space-y-6 pb-24" id="machine-manager-section">
      {/* Upper bar */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-zinc-900">
          My Machines ({machines.length})
        </h2>
        
        <button 
          onClick={() => {
            setEditingMachine(null);
            setIsFormOpen(true);
          }}
          className="flex items-center space-x-1.5 text-sm font-semibold bg-brand-yellow text-zinc-950 px-4 py-2.5 rounded-lg active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Machine</span>
        </button>
      </div>

      {/* Modal / Form overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 rounded-t-2xl">
              <h3 className="font-display font-bold text-lg text-zinc-900">
                {editingMachine ? 'Edit Machine Details' : 'Add New Machine'}
              </h3>
              <button 
                type="button" 
                onClick={resetForm}
                className="text-zinc-400 hover:text-zinc-600 font-bold p-1 text-sm uppercase font-mono tracking-wider"
              >
                Close
              </button>
            </div>

            {/* Scrollable Form content */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Machine Name (e.g. My JCB 1)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Enter custom machine nickname"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Machine Type</label>
                  <select 
                    value={type}
                    onChange={e => setType(e.target.value as MachineType)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm bg-white focus:border-brand-yellow outline-none font-semibold"
                  >
                    <option value="JCB 3DX">JCB 3DX</option>
                    <option value="Tipper">Tipper</option>
                    <option value="Mini Excavator">Mini Excavator</option>
                    <option value="Excavator">Excavator</option>
                  </select>
                </div>

                {type === 'Excavator' && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Model Name</label>
                    <select 
                      value={excavatorModel}
                      onChange={e => setExcavatorModel(e.target.value as ExcavatorModel)}
                      className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm bg-white focus:border-brand-yellow outline-none font-semibold"
                    >
                      <option value="EX70">EX70 (7-Ton)</option>
                      <option value="EX140">EX140 (14-Ton)</option>
                      <option value="EX210">EX210 (21-Ton)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Reg Number (Plate No.)</label>
                  <input 
                    type="text" 
                    placeholder="KA-51-AB-1234"
                    value={registrationNo}
                    onChange={e => setRegistrationNo(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Operator Assigned</label>
                  <input 
                    type="text" 
                    placeholder="Operator Name"
                    value={operatorName}
                    onChange={e => setOperatorName(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Hour Meter (Hrs)</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    min="0"
                    value={hourMeter || ''}
                    onChange={e => setHourMeter(Number(e.target.value))}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Purchase Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    min="0"
                    value={purchaseCost || ''}
                    onChange={e => setPurchaseCost(Number(e.target.value))}
                    className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Current Service Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Working', 'Idle', 'Under Service'] as MachineStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold text-center transition-all ${
                        status === st 
                          ? 'bg-zinc-900 border-zinc-900 text-white' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {st === 'Working' && 'Working 🟢'}
                      {st === 'Idle' && 'Idle 🟡'}
                      {st === 'Under Service' && 'Repair 🛠️'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Notes</label>
                <textarea 
                  placeholder="Any additional info (e.g. tyre status, oil change due)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-lg p-2.5 text-sm focus:border-brand-yellow outline-none h-16 resize-none font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-zinc-950 text-white font-bold py-3 rounded-lg active:scale-[0.99] transition-transform shadow-md cursor-pointer"
                >
                  {editingMachine ? 'SAVE CHANGES' : 'CREATE MACHINE'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Grid of machines */}
      {machines.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-4">
          <FolderMinus className="w-12 h-12 text-zinc-300" />
          <div className="max-w-xs">
            <h3 className="font-display font-bold text-zinc-700 text-base">No machines added yet</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Add your JCB, Tippers or Excavators to start recording site work, fuel and salaries.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => {
              setEditingMachine(null);
              setIsFormOpen(true);
            }}
            className="bg-brand-yellow text-zinc-900 font-bold px-4 py-2 rounded-lg text-sm transition-transform active:scale-95"
          >
            Add First Machine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {machines.map((machine) => (
            <div 
              key={machine.id} 
              className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm relative overflow-hidden transition-all hover:border-zinc-300"
            >
              
              {/* Card Title & Type Icon */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-2.5 bg-yellow-100 rounded-lg flex items-center justify-center">
                    {getMachineIcon(machine.type)}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-zinc-900 text-base">
                      {machine.name}
                    </h3>
                    <p className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                      <span>{machine.type}</span>
                      {machine.excavatorModel && (
                        <span className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                          {machine.excavatorModel}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => handleEditClick(machine)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 active:bg-zinc-100 rounded"
                    title="Edit info"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Remove ${machine.name}?`)) {
                        onDeleteMachine(machine.id);
                      }
                    }}
                    className="p-1.5 text-rose-400 hover:text-rose-600 active:bg-rose-50 rounded"
                    title="Delete Machine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Indicator Bar (Fast Toggle-friendly) */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase text-zinc-400">STATUS</span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    machine.status === 'Working' && 'bg-emerald-100 text-emerald-800'
                  } ${
                    machine.status === 'Idle' && 'bg-amber-100 text-amber-800'
                  } ${
                    machine.status === 'Under Service' && 'bg-rose-100 text-rose-800'
                  }`}>
                    {machine.status}
                  </span>
                </div>
                
                {/* 1-tap fast toggle buttons */}
                <div className="grid grid-cols-3 gap-1 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                  {(['Working', 'Idle', 'Under Service'] as MachineStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onEditMachine(machine.id, { status: st })}
                      className={`py-1 px-1 text-[9px] font-bold uppercase rounded text-center transition-all ${
                        machine.status === st 
                          ? 'bg-zinc-900 text-white shadow-sm' 
                          : 'text-zinc-500 hover:text-zinc-800 active:bg-zinc-100'
                      }`}
                    >
                      {st === 'Working' && '🟢 WORK'}
                      {st === 'Idle' && '🟡 IDLE'}
                      {st === 'Under Service' && '🛠️ REPAIR'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats Section with clean grid */}
              <div className="grid grid-cols-2 gap-3 mb-1.5 text-xs text-zinc-600 font-medium">
                <div className="flex items-center space-x-1.5 bg-zinc-50/60 p-2 rounded border border-zinc-100">
                  <Gauge className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-[9px] text-zinc-400 font-bold uppercase leading-none">METER</p>
                    <p className="font-mono text-[10.5px] font-semibold text-zinc-800 mt-0.5">
                      {machine.hourMeter} Hrs
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 bg-zinc-50/60 p-2 rounded border border-zinc-100">
                  <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-[9px] text-zinc-400 font-bold uppercase leading-none">OPERATOR</p>
                    <p className="font-sans text-[10.5px] font-semibold text-zinc-800 mt-0.5 truncate">
                      {machine.operatorName || 'Unassigned'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 bg-zinc-50/60 p-2 rounded border border-zinc-100">
                  <IndianRupee className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-[9px] text-zinc-400 font-bold uppercase leading-none">COST PRICE</p>
                    <p className="font-mono text-[10.5px] font-semibold text-zinc-800 mt-0.5">
                      {machine.purchaseCost ? formatRupee(machine.purchaseCost) : '₹0'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 bg-zinc-50/60 p-2 rounded border border-zinc-100">
                  <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-[9px] text-zinc-400 font-bold uppercase leading-none">PLATE NO.</p>
                    <p className="font-mono text-[10.5px] font-semibold text-zinc-800 mt-0.5 truncate">
                      {machine.registrationNo || 'No Number'}
                    </p>
                  </div>
                </div>
              </div>

              {machine.notes && (
                <div className="mt-2.5 bg-zinc-50 p-2 rounded border border-zinc-150 text-[10.5px] text-zinc-500 italic">
                  Note: {machine.notes}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
