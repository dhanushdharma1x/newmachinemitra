/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  Fuel, 
  Activity, 
  HelpCircle,
  BarChart3,
  Percent,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { Job, PaymentHistoryItem, DieselLog, Expense, SalaryLog } from '../types';
import { formatRupee, formatDate } from '../utils/helpers';

interface ProfitLossProps {
  jobs: Job[];
  paymentHistory: PaymentHistoryItem[];
  dieselLogs: DieselLog[];
  expenses: Expense[];
  salaries: SalaryLog[];
}

type PeriodType = '7days' | '4weeks' | '6months';

interface ChartPoint {
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export default function ProfitLoss({
  jobs,
  paymentHistory,
  dieselLogs,
  expenses,
  salaries
}: ProfitLossProps) {
  
  const [activePeriod, setActivePeriod] = useState<PeriodType>('7days');
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  // Total absolute cash-flow ledger
  const aggregateCashFlow = useMemo(() => {
    const totalRevenue = paymentHistory.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalDiesel = dieselLogs.reduce((sum, d) => sum + d.cost, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSalaryPaid = salaries.reduce((sum, s) => sum + (s.paidAmount + s.advanceTaken), 0);
    const totalOutflow = totalDiesel + totalExpenses + totalSalaryPaid;
    const netProfit = totalRevenue - totalOutflow;

    return {
      totalRevenue,
      totalDiesel,
      totalExpenses,
      totalSalaryPaid,
      totalOutflow,
      netProfit
    };
  }, [paymentHistory, dieselLogs, expenses, salaries]);

  // Dynamic grouping logic based on period bracket
  const chartData: ChartPoint[] = useMemo(() => {
    const today = new Date();
    const result: ChartPoint[] = [];

    if (activePeriod === '7days') {
      // Calculate past 7 days backward
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Month-Day label (e.g. "20 Jun")
        const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        // Sum revenue on this date
        const rev = paymentHistory
          .filter(p => p.date === dateStr)
          .reduce((sum, p) => sum + p.amountPaid, 0);

        // Sum fuel cost on this date
        const fuel = dieselLogs
          .filter(d => d.date === dateStr)
          .reduce((sum, d) => sum + d.cost, 0);

        // Sum general site spends on this date
        const otherEx = expenses
          .filter(e => e.date === dateStr)
          .reduce((sum, e) => sum + e.amount, 0);

        // Sum salaries disbursed (pay day dates)
        const sal = salaries
          .filter(s => s.date === dateStr)
          .reduce((sum, s) => sum + (s.paidAmount + s.advanceTaken), 0);

        const totalEx = fuel + otherEx + sal;
        
        result.push({
          label,
          revenue: rev,
          expenses: totalEx,
          profit: rev - totalEx
        });
      }
    } else if (activePeriod === '4weeks') {
      // Calculate past 4 weeks
      for (let i = 3; i >= 0; i--) {
        const dStart = new Date();
        dStart.setDate(today.getDate() - (i + 1) * 7);
        const dEnd = new Date();
        dEnd.setDate(today.getDate() - i * 7);

        const label = `Wk -${i}`;

        // Get filter condition for within week
        const isInWeek = (dateStr: string) => {
          const itemDate = new Date(dateStr);
          return itemDate >= dStart && itemDate <= dEnd;
        };

        const rev = paymentHistory
          .filter(p => isInWeek(p.date))
          .reduce((sum, p) => sum + p.amountPaid, 0);

        const fuel = dieselLogs
          .filter(d => isInWeek(d.date))
          .reduce((sum, d) => sum + d.cost, 0);

        const otherEx = expenses
          .filter(e => isInWeek(e.date))
          .reduce((sum, e) => sum + e.amount, 0);

        const sal = salaries
          .filter(s => isInWeek(s.date))
          .reduce((sum, s) => sum + (s.paidAmount + s.advanceTaken), 0);

        const totalEx = fuel + otherEx + sal;

        result.push({
          label: i === 0 ? 'This Wk' : label,
          revenue: rev,
          expenses: totalEx,
          profit: rev - totalEx
        });
      }
    } else if (activePeriod === '6months') {
      // Calculate past 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(today.getMonth() - i);
        const monthNum = d.getMonth();
        const yearNum = d.getFullYear();

        const label = d.toLocaleDateString('en-IN', { month: 'short' });

        const isInMonth = (dateStr: string) => {
          const itemDate = new Date(dateStr);
          return itemDate.getMonth() === monthNum && itemDate.getFullYear() === yearNum;
        };

        const rev = paymentHistory
          .filter(p => isInMonth(p.date))
          .reduce((sum, p) => sum + p.amountPaid, 0);

        const fuel = dieselLogs
          .filter(d => isInMonth(d.date))
          .reduce((sum, d) => sum + d.cost, 0);

        const otherEx = expenses
          .filter(e => isInMonth(e.date))
          .reduce((sum, e) => sum + e.amount, 0);

        const sal = salaries
          .filter(s => isInMonth(s.date))
          .reduce((sum, s) => sum + (s.paidAmount + s.advanceTaken), 0);

        const totalEx = fuel + otherEx + sal;

        result.push({
          label,
          revenue: rev,
          expenses: totalEx,
          profit: rev - totalEx
        });
      }
    }

    return result;
  }, [activePeriod, paymentHistory, dieselLogs, expenses, salaries]);

  // Calculate highest bounds for perfect dynamic SVG heights
  const chartMaxVal = useMemo(() => {
    let max = 1000; // default min height
    chartData.forEach(p => {
      if (p.revenue > max) max = p.revenue;
      if (p.expenses > max) max = p.expenses;
      if (Math.abs(p.profit) > max) max = Math.abs(p.profit);
    });
    return max * 1.15; // 15% padding at top
  }, [chartData]);

  const hasData = aggregateCashFlow.totalRevenue > 0 || aggregateCashFlow.totalOutflow > 0;

  return (
    <div className="space-y-6 pb-24" id="profit-loss-section">
      
      {/* Overview Heading */}
      <div>
        <h2 className="font-display text-xl font-bold text-zinc-900 leading-tight">
          Profit and Loss Statement (💰 Real P&L)
        </h2>
        <p className="text-xs text-zinc-500 font-medium">Automatic calculation: Revenue (Client payments received) minus costs</p>
      </div>

      {/* Aggregate Overview Card Grid */}
      <div className="bg-zinc-900 text-white rounded-2xl p-5 shadow-lg space-y-4 border-b-4 border-brand-yellow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider text-zinc-400 uppercase">DYNAMIC NET PROFIT</span>
          <span className="text-xs bg-brand-yellow font-bold text-zinc-900 px-2 py-0.5 rounded uppercase">ALL TIME</span>
        </div>

        <div className="flex items-baseline space-x-1">
          <span className={`font-mono text-3xl sm:text-4xl font-extrabold tracking-tight ${aggregateCashFlow.netProfit >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatRupee(aggregateCashFlow.netProfit)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4 text-xs font-medium text-zinc-300">
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">REVENUE DIRECT INFLOW</p>
            <p className="font-mono text-base font-bold text-emerald-400 mt-0.5">+{formatRupee(aggregateCashFlow.totalRevenue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">RUNNING OUTFLOW COSTS</p>
            <p className="font-mono text-base font-bold text-zinc-200 mt-0.5">-{formatRupee(aggregateCashFlow.totalOutflow)}</p>
          </div>
        </div>
      </div>

      {/* Outflow Breakdown Pills */}
      {hasData && (
        <div className="bg-white p-4 border border-zinc-200 rounded-xl shadow-sm space-y-3">
          <h4 className="font-display text-xs font-extrabold uppercase tracking-wider text-zinc-400">OUTFLOW (RUNNING COST) SPLIT</h4>
          
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-150 text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase block">FUEL COSt</span>
              <span className="font-mono font-bold text-zinc-800 block mt-0.5 text-xs sm:text-sm">{formatRupee(aggregateCashFlow.totalDiesel)}</span>
            </div>
            
            <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-150 text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase block">Crew wages</span>
              <span className="font-mono font-bold text-zinc-800 block mt-0.5 text-xs sm:text-sm">{formatRupee(aggregateCashFlow.totalSalaryPaid)}</span>
            </div>

            <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-150 text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase block">Site repairs</span>
              <span className="font-mono font-bold text-zinc-800 block mt-0.5 text-xs sm:text-sm">{formatRupee(aggregateCashFlow.totalExpenses)}</span>
            </div>
          </div>
        </div>
      )}

      {/* CHARTS SEGMENT */}
      <div className="bg-white p-4 border border-zinc-200 rounded-xl shadow-sm space-y-4">
        
        {/* Toggle Brackets */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-1 ml-auto bg-zinc-100 p-0.5 rounded-lg border">
            {(['7days', '4weeks', '6months'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => {
                  setActivePeriod(period);
                  setSelectedBarIndex(null);
                }}
                className={`py-1 px-2.5 rounded text-[11px] font-bold uppercase tracking-wide cursor-pointer select-none transition-all ${
                  activePeriod === period 
                    ? 'bg-zinc-950 text-white shadow-xs' 
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {period === '7days' && 'Daily'}
                {period === '4weeks' && 'Weekly'}
                {period === '6months' && 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        {/* CUSTOM RESPONSIVE SVG BAR CHART */}
        {!hasData ? (
          <div className="border border-dashed border-zinc-200 rounded-lg p-10 text-center flex flex-col items-center justify-center space-y-2 mt-2">
            <BarChart3 className="w-10 h-10 text-zinc-300" />
            <h4 className="font-display font-semibold text-zinc-700 text-sm">Waiting for transactions</h4>
            <p className="text-[11px] text-zinc-400 max-w-xs">
              Go to "Payments" or "Diesel" and input some logs. Your visual profit and cost reports will auto generate here!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Legend indicators */}
            <div className="flex justify-end space-x-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <div className="flex items-center space-x-1">
                <span className="w-3 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                <span>Revenue</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-1.5 bg-rose-500 rounded-full inline-block"></span>
                <span>Outflows</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-1.5 bg-brand-yellow rounded-full inline-block"></span>
                <span>Net Profit</span>
              </div>
            </div>

            {/* SVG drawing wrapper */}
            <div className="relative w-full h-56 pt-2">
              <svg viewBox="0 0 500 220" className="w-full h-full text-zinc-400">
                
                {/* Horizontal assist lines */}
                <line x1="30" y1="30" x2="480" y2="30" stroke="#f4f4f5" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="30" y1="90" x2="480" y2="90" stroke="#f4f4f5" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="30" y1="150" x2="480" y2="150" stroke="#f4f4f5" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="30" y1="170" x2="480" y2="170" stroke="#e4e4e7" strokeWidth="1.5" /> {/* Baseline */}

                {/* Draw Columns for each node */}
                {chartData.map((node, i) => {
                  const itemsCount = chartData.length;
                  const blockWidth = 440 / itemsCount;
                  const centerX = 40 + i * blockWidth + blockWidth / 2;
                  
                  // Compute bar heights relative to max val (capped at 130px max vertical drawing area)
                  const revHeight = (node.revenue / chartMaxVal) * 110;
                  const expHeight = (node.expenses / chartMaxVal) * 110;
                  const profHeight = (Math.abs(node.profit) / chartMaxVal) * 110;

                  // Bar positioning coords
                  const revY = 170 - revHeight;
                  const expY = 170 - expHeight;
                  const profY = node.profit >= 0 ? 170 - profHeight : 170; // downward if negative

                  const revX = centerX - 12;
                  const expX = centerX - 1;
                  const profX = centerX + 10;

                  const isSelected = selectedBarIndex === i;

                  return (
                    <g key={i} className="cursor-pointer group" onClick={() => setSelectedBarIndex(i)}>
                      {/* Interaction Hotspot zone */}
                      <rect 
                        x={centerX - blockWidth/2} 
                        y="10" 
                        width={blockWidth - 4} 
                        height="180" 
                        fill={isSelected ? 'rgba(241, 191, 0, 0.05)' : 'transparent'} 
                        rx="4"
                      />

                      {/* Revenue Bar */}
                      {node.revenue > 0 && (
                        <rect 
                          x={revX} 
                          y={revY} 
                          width="9" 
                          height={revHeight} 
                          fill="#10b981" 
                          className="transition-all duration-300" 
                          rx="2"
                        />
                      )}

                      {/* Expense Bar */}
                      {node.expenses > 0 && (
                        <rect 
                          x={expX} 
                          y={expY} 
                          width="9" 
                          height={expHeight} 
                          fill="#f43f5e" 
                          className="transition-all duration-300" 
                          rx="2"
                        />
                      )}

                      {/* Profit Line / Bar */}
                      <rect 
                        x={profX} 
                        y={profY} 
                        width="4" 
                        height={profHeight || 2} 
                        fill={node.profit >= 0 ? '#f1bf00' : '#b91c1c'} 
                        className="transition-all duration-300" 
                        rx="1"
                      />

                      {/* Label Text */}
                      <text 
                        x={centerX} 
                        y="192" 
                        textAnchor="middle" 
                        fontSize="10" 
                        fontWeight="600"
                        fill={isSelected ? '#121212' : '#888888'}
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Click interactive summary segment */}
            <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg text-xs space-y-2">
              <div className="flex justify-between items-center text-zinc-500">
                <span className="font-bold uppercase text-[9.5px]">Selected Bar Info:</span>
                <span className="font-semibold text-zinc-900 bg-white border px-2 py-0.5 rounded font-mono">
                  {selectedBarIndex !== null ? chartData[selectedBarIndex].label : 'Tap any bar above to drill down'}
                </span>
              </div>

              {selectedBarIndex !== null && (
                <div className="grid grid-cols-3 gap-2.5 text-center font-medium pt-1">
                  <div className="bg-white p-2 border rounded">
                    <span className="text-[9px] text-zinc-400 uppercase block font-bold">Revenue</span>
                    <span className="font-mono text-xs font-bold text-emerald-600 block mt-0.5">
                      +{formatRupee(chartData[selectedBarIndex].revenue)}
                    </span>
                  </div>

                  <div className="bg-white p-2 border rounded">
                    <span className="text-[9px] text-zinc-400 uppercase block font-bold">Outflow</span>
                    <span className="font-mono text-xs font-bold text-rose-500 block mt-0.5">
                      -{formatRupee(chartData[selectedBarIndex].expenses)}
                    </span>
                  </div>

                  <div className="bg-white p-2 border rounded">
                    <span className="text-[9px] text-zinc-400 uppercase block font-bold">Net Profit</span>
                    <span className={`font-mono text-xs font-bold block mt-0.5 ${chartData[selectedBarIndex].profit >= 0 ? 'text-brand-accent' : 'text-rose-700'}`}>
                      {formatRupee(chartData[selectedBarIndex].profit)}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
