/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserSquare2, Phone, Briefcase, CheckCircle2, LogOut, ArrowRight, Save } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileSettingsProps {
  profile: UserProfile;
  totalMachinesCount: number;
  activeMachinesCount: number;
  totalCustomersCount: number;
  onUpdateProfile: (newProfile: UserProfile) => void;
  onLogout: () => void;
}

export default function ProfileSettings({
  profile,
  totalMachinesCount,
  activeMachinesCount,
  totalCustomersCount,
  onUpdateProfile,
  onLogout
}: ProfileSettingsProps) {
  
  const [name, setName] = useState(profile.name || 'Owner');
  const [phone, setPhone] = useState(profile.phoneNumber || '');
  const [company, setCompany] = useState(profile.companyName || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim(),
      phoneNumber: phone.trim(),
      companyName: company.trim()
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6" id="profile-settings-container">
      
      {/* Title block */}
      <div>
        <h2 className="font-display font-extrabold text-2xl text-zinc-900 tracking-tight leading-none">
          Settings & Profile
        </h2>
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider font-mono mt-1.5">
          Workspace Account & Branding Coordinates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Left column: Quick Actions and Current status cards */}
        <div className="space-y-4 md:col-span-1">
          <div className="bg-zinc-950 text-white rounded-2xl p-5 border border-zinc-800 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-400 text-zinc-950 rounded-xl font-display font-extrabold flex items-center justify-center text-xl shadow-xs">
                {company.charAt(0).toUpperCase() || 'M'}
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-tight leading-tight text-white line-clamp-1">
                  {company || 'Sri Ram Earth Movers'}
                </h4>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase font-mono mt-0.5">
                  Authenticated Tenant
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-zinc-800 space-y-3 font-mono text-[11px] text-zinc-300">
              <div className="flex justify-between">
                <span>Account Manager:</span>
                <span className="font-bold text-white">{name || 'Ramesh C'}</span>
              </div>
              <div className="flex justify-between">
                <span>Direct Line:</span>
                <span className="font-bold text-white">{phone || '+91 99999 99999'}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full mt-6 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout secure session</span>
            </button>
          </div>

          {/* Connected Telemetry Coordinates Summary */}
          <div className="bg-white border-2 border-zinc-200/80 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Fleet Capacity Metrics
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-zinc-50 border p-2.5 rounded-xl">
                <span className="block text-lg font-bold font-mono text-zinc-900 leading-none">
                  {totalMachinesCount}
                </span>
                <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1 block">Machines</span>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl">
                <span className="block text-lg font-bold font-mono text-amber-700 leading-none">
                  {activeMachinesCount}
                </span>
                <span className="text-[9px] text-amber-500 font-bold uppercase mt-1 block">Working</span>
              </div>
              <div className="bg-zinc-50 border p-2.5 rounded-xl">
                <span className="block text-lg font-bold font-mono text-zinc-900 leading-none">
                  {totalCustomersCount}
                </span>
                <span className="text-[9px] text-zinc-400 font-bold uppercase mt-1 block">Contracts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Edit Form (Name, Phone number, and Company Name) */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white border-2 border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            
            <div className="p-4 bg-zinc-50 border-b border-zinc-150 flex items-center justify-between">
              <h3 className="font-display font-medium text-sm text-zinc-800 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-500" />
                <span>Personal Settings Parameters</span>
              </h3>
              
              <AnimatePresence>
                {savedSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold shadow-xs border border-emerald-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Saved Successful</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-5 space-y-4 flex-1">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1.5">
                    <UserSquare2 className="w-3.5 h-3.5 text-zinc-400" />
                    Owner / Manager Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-xl p-3 text-sm focus:border-amber-400 font-semibold focus:bg-amber-50/10 outline-none"
                  />
                  <p className="text-[9px] text-zinc-400 mt-1 font-medium">Your signature appended on digital ledger notes.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    Contact Phone Coordinate
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full border-2 border-zinc-200 rounded-xl p-3 text-sm focus:border-amber-400 font-mono font-bold tracking-wider focus:bg-amber-50/10 outline-none"
                  />
                  <p className="text-[9px] text-zinc-400 mt-1 font-medium">Main authentication contact cellular key.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                  Fleet Business / Company Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Ram Earth Movers"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full border-2 border-zinc-200 rounded-xl p-3 text-sm focus:border-amber-400 font-bold focus:bg-amber-50/10 outline-none"
                />
                <p className="text-[9px] text-zinc-400 mt-1 font-medium">
                  Displayed globally at the top of the interface. This sets the brand tone of your workspace.
                </p>
              </div>

            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-150 flex justify-end">
              <button
                type="submit"
                className="bg-zinc-950 text-white font-extrabold px-6 py-2.5 rounded-xl hover:bg-zinc-800 text-xs tracking-wide flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-transform"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>UPDATE COMPANY COORDINATES</span>
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
