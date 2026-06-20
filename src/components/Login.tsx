/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Lock, ArrowRight, ShieldCheck, RefreshCw, KeyRound, CheckCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'onboarding'>('phone');
  
  // OTP Simulation State
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showOtpHint, setShowOtpHint] = useState(false);

  // Profile Onboarding State
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // 1. Countdown timer
  useEffect(() => {
    if (step !== 'otp' || timeLeft === 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  // 2. Request OTP Code
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number');
      return;
    }
    setErrorMsg('');
    setIsSending(true);

    // Simulate Network delay
    setTimeout(() => {
      // Generate a nice random 6-digit number
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(mockCode);
      setIsSending(false);
      setStep('otp');
      setTimeLeft(30);
      setShowOtpHint(true);
    }, 1200);
  };

  // 3. Verify OTP Code
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (otpInput === generatedOtp || otpInput === '123456') { // Allow standard 123456 for fast testing too
      // Proceed to check if profile exists, else onboarding
      const savedProfile = localStorage.getItem('mm_user_profile');
      if (savedProfile) {
        try {
          const profile: UserProfile = JSON.parse(savedProfile);
          // Keep synced
          onLoginSuccess(profile);
        } catch (err) {
          setStep('onboarding');
        }
      } else {
        setStep('onboarding');
      }
    } else {
      setErrorMsg('Invalid verification code. Please input the correct OTP.');
    }
  };

  // 4. Submit Onboarding / Profile setup
  const handleSaveOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !companyName.trim()) {
      setErrorMsg('Name and Company parameters are required');
      return;
    }

    const finalProfile: UserProfile = {
      name: fullName.trim(),
      phoneNumber: phoneNumber || '+91 99999 99999',
      companyName: companyName.trim()
    };

    localStorage.setItem('mm_user_profile', JSON.stringify(finalProfile));
    onLoginSuccess(finalProfile);
  };

  const autofillOtp = () => {
    setOtpInput(generatedOtp);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-4 font-sans text-stone-900 select-none">
      
      {/* Decorative Top Accent line representing machine site lines */}
      <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500"></div>

      <div className="w-full max-w-md">
        
        {/* MachineMitra Branding Panel */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="inline-flex items-center space-x-2 bg-zinc-950 text-white p-2.5 px-4 rounded-2xl shadow-lg border-2 border-zinc-950 mb-3"
          >
            <span className="p-1 px-2.5 bg-yellow-400 font-display font-extrabold text-[#121212] tracking-normal rounded-lg text-lg leading-none">
              Mitra
            </span>
            <span className="font-display font-extrabold text-[#ffffff] text-lg tracking-tight">
              MachineMitra
            </span>
          </motion.div>
          
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest font-mono">
            Fleet Site Manager Auth Security
          </h2>
        </div>

        {/* Dynamic Card based on Current Verification step */}
        <div className="bg-white rounded-2xl border-2 border-zinc-200/80 shadow-xl overflow-hidden relative">
          
          <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-100"></div>

          <AnimatePresence mode="wait">
            
            {/* STEP 1: Phone Card input wrapper */}
            {step === 'phone' && (
              <motion.div
                key="phone-step"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="p-6 sm:p-8"
              >
                <div className="mb-6">
                  <h3 className="font-display font-extrabold text-xl text-zinc-900 tracking-tight">
                    Login with Phone
                  </h3>
                  <p className="text-xs text-zinc-650 mt-1 font-medium">
                    No passwords, instant OTP code verification to access fleet databases.
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-bold text-sm">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        pattern="[6-9][0-9]{9}"
                        maxLength={10}
                        placeholder="98765 43210"
                        value={phoneNumber}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setPhoneNumber(val);
                        }}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-zinc-200 text-sm font-mono font-bold tracking-widest focus:border-yellow-400 outline-none transition-all focus:bg-amber-50/10"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1.5 font-semibold">
                      Please omit country code prefix. Enter your 10 digit Indian cellular state number.
                    </p>
                  </div>

                  {errorMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-650"
                    >
                      ⚠️ {errorMsg}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={phoneNumber.length !== 10 || isSending}
                    className="w-full bg-zinc-950 text-white font-extrabold py-3.5 rounded-xl disabled:bg-zinc-200 disabled:text-zinc-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer hover:bg-zinc-900"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />
                        <span>Sending secure token...</span>
                      </>
                    ) : (
                      <>
                        <span>SEND SIX-DIGIT OTP</span>
                        <ArrowRight className="w-4 h-4 text-yellow-400" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-bold font-mono">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    SECURE CLIENT SANDBOX
                  </span>
                  <span>v2.1.0</span>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Verification code input card */}
            {step === 'otp' && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="p-6 sm:p-8"
              >
                <div className="mb-6">
                  <h3 className="font-display font-extrabold text-xl text-zinc-900 tracking-tight">
                    Verification Code
                  </h3>
                  <p className="text-xs text-zinc-650 mt-1 font-medium">
                    Please input the OTP digits sent via cellular gateway to <strong className="font-mono text-zinc-950">+91 {phoneNumber}</strong>.
                  </p>
                </div>

                {/* Simulated Notification Toast Popover representing real carrier API */}
                <AnimatePresence>
                  {showOtpHint && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0, y: -8 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-zinc-900 text-white p-3.5 rounded-xl border-2 border-amber-400 shadow-lg text-xs space-y-1 mb-5"
                    >
                      <div className="flex items-center justify-between font-mono font-black text-amber-400 leading-none pb-1 border-b border-zinc-800 text-[10px]">
                        <span>💬 SMS CARRIER SIMULATOR</span>
                        <span>NOW</span>
                      </div>
                      <p className="font-medium text-white/90 pt-1">
                        MachineMitra secure login code is <strong className="bg-[#fff] text-zinc-950 font-mono px-1.5 py-0.5 rounded text-sm tracking-widest">{generatedOtp}</strong>. Valid for 3 minutes.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={autofillOtp}
                          className="bg-amber-400 text-zinc-950 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition hover:bg-amber-300 w-full text-center"
                        >
                          Auto Fill Code
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                      Enter 6-Digit OTP Token
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="******"
                        value={otpInput}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setOtpInput(val);
                        }}
                        className="w-full text-center py-3.5 rounded-xl border-2 border-zinc-200 text-lg font-mono font-extrabold tracking-[0.4em] focus:border-yellow-400 outline-none transition-all placeholder:tracking-normal focus:bg-amber-50/10 text-stone-900"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-650">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={otpInput.length !== 6}
                    className="w-full bg-zinc-950 text-white font-extrabold py-3.5 rounded-xl disabled:bg-zinc-200 disabled:text-zinc-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer hover:bg-zinc-900"
                  >
                    <ShieldCheck className="w-4 h-4 text-yellow-400" />
                    <span>VERIFY & SECURE SIGN-IN</span>
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-xs text-zinc-500 font-bold font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setOtpInput('');
                      setErrorMsg('');
                    }}
                    className="hover:text-zinc-950 transition-colors"
                  >
                    ← Edit Phone
                  </button>

                  {timeLeft > 0 ? (
                    <span className="text-zinc-400 font-mono">Resend Code in {timeLeft}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const newMock = Math.floor(100000 + Math.random() * 900000).toString();
                        setGeneratedOtp(newMock);
                        setTimeLeft(30);
                        setShowOtpHint(true);
                        setErrorMsg('');
                      }}
                      className="text-amber-600 hover:text-amber-800 transition-colors underline flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Resend Code
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Initial Profiles Onboarding wrapper */}
            {step === 'onboarding' && (
              <motion.div
                key="onboarding-step"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="p-6 sm:p-8"
              >
                <div className="mb-6">
                  <h3 className="font-display font-extrabold text-xl text-zinc-950 tracking-tight flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    Setup Business Profile
                  </h3>
                  <p className="text-xs text-zinc-650 mt-1 font-medium">
                    This profile information initializes files, print receipts, and bills corporate jobs correctly.
                  </p>
                </div>

                <form onSubmit={handleSaveOnboarding} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Company / Owner Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sri Ram Contractors"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full border-2 border-zinc-200 rounded-xl p-2.5 text-sm font-semibold focus:border-yellow-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Business Fleet Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sri Ram Earth Movers"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="w-full border-2 border-zinc-200 rounded-xl p-2.5 text-sm font-semibold focus:border-yellow-400 outline-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-650">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full mt-2 bg-zinc-950 text-white font-extrabold py-3 rounded-xl hover:bg-zinc-900 active:scale-95 transition-all scroll-smooth cursor-pointer text-sm"
                  >
                    CONTINUE TO WORKSPACE
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
