import React, { useMemo, useState, useEffect } from 'react';
import { DailyLog } from '../types';
import { BENZO_DATA } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { CalendarDays, CalendarRange, Calendar, BarChart3, TrendingUp, BrainCircuit, CalendarClock, Droplets } from 'lucide-react';

interface StatisticsProps {
  logs: DailyLog[];
}

type TimeRange = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type ChartType = 'LINE' | 'BAR';

export const Statistics: React.FC<StatisticsProps> = ({ logs }) => {
  const [range, setRange] = useState<TimeRange>('DAILY');
  const [chartType, setChartType] = useState<ChartType>('LINE');

  // Helper to get current CSS variable values for the chart
  const getVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  
  // Force re-render on theme change by tracking primary color
  const [themeColor, setThemeColor] = useState('#ef4444');

  useEffect(() => {
    // Small timeout to allow CSS to update
    const timer = setTimeout(() => {
        setThemeColor(getVar('--primary'));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getWeekKey = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${weekNo}`;
  };

  const getMonthKey = (dateStr: string) => dateStr.slice(0, 7);
  const getYearKey = (dateStr: string) => dateStr.slice(0, 4);

  const chartData = useMemo(() => {
    // Basic Sort
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // We use a grouping object to handle both regular grouping and accidental duplicate daily logs
    const groups: Record<string, { count: number; alcoholSum: number; moodSum: number; meds: Record<string, number>; reasons: Record<string, string[]> }> = {};
    const order: string[] = [];

    sortedLogs.forEach(log => {
      let key;
      if (range === 'DAILY') {
        key = log.date; 
      } else if (range === 'WEEKLY') {
        key = getWeekKey(log.date);
      } else if (range === 'MONTHLY') {
        key = getMonthKey(log.date);
      } else {
        key = getYearKey(log.date);
      }

      if (!groups[key]) {
        groups[key] = { count: 0, alcoholSum: 0, moodSum: 0, meds: {}, reasons: {} };
        BENZO_DATA.forEach(med => {
           groups[key].meds[med.id] = 0;
           groups[key].reasons[med.id] = [];
        });
        order.push(key);
      }
      
      groups[key].count += 1;
      groups[key].alcoholSum += (log.alcoholConsumed ? log.alcoholUnits : 0);
      groups[key].moodSum += (log.mood || 5); // Default to middle if missing
      
      log.medications.forEach(med => {
        groups[key].meds[med.medicationId] = (groups[key].meds[med.medicationId] || 0) + med.amount;
        if (med.reason) {
          groups[key].reasons[med.medicationId].push(med.reason);
        }
      });
    });

    return order.map(key => {
      const g = groups[key];
      const entry: Record<string, any> = {
        date: range === 'DAILY' ? key.slice(5) : key,
        fullDate: key,
        alcoholUnits: Number((g.alcoholSum / (range === 'DAILY' ? 1 : g.count)).toFixed(1)),
        mood: Number((g.moodSum / g.count).toFixed(1)),
      };
      
      BENZO_DATA.forEach(med => {
        entry[med.id] = Number((g.meds[med.id] / (range === 'DAILY' ? 1 : g.count)).toFixed(2));
        // Only attach reason strings for DAILY view, as aggregating reasons over a month is messy
        if (range === 'DAILY' && g.reasons[med.id].length > 0) {
          entry[`${med.id}_reason`] = g.reasons[med.id].join('; ');
        }
      });
      return entry;
    });

  }, [logs, range]);

  const peakStats = useMemo(() => {
    const peaks: Record<string, { amount: number; date: string }> = {};
    BENZO_DATA.forEach(med => peaks[med.id] = { amount: 0, date: '' });

    const dailySums: Record<string, Record<string, number>> = {};
    
    logs.forEach(log => {
       if (!dailySums[log.date]) dailySums[log.date] = {};
       log.medications.forEach(m => {
          dailySums[log.date][m.medicationId] = (dailySums[log.date][m.medicationId] || 0) + m.amount;
       });
    });

    Object.entries(dailySums).forEach(([date, meds]) => {
      Object.entries(meds).forEach(([medId, amount]) => {
         if (peaks[medId] && amount > peaks[medId].amount) {
            peaks[medId] = { amount, date };
         }
      });
    });
    
    return BENZO_DATA.filter(med => peaks[med.id].amount > 0).map(med => ({
      ...med,
      peak: peaks[med.id].amount,
      peakDate: peaks[med.id].date
    }));
  }, [logs]);

  const activeDrugIds = new Set<string>();
  chartData.forEach(d => {
    BENZO_DATA.forEach(med => {
      if (d[med.id] > 0) activeDrugIds.add(med.id);
    });
  });

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg)] border border-[var(--primary)] p-3 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] font-mono z-50">
          <p className="text-[var(--primary)] font-bold border-b border-[var(--border)] mb-2 pb-1 text-sm uppercase">{label}</p>
          {payload.map((p: any, index: number) => {
            if (p.dataKey === 'alcoholUnits' || p.dataKey === 'mood') return null; // Skip non-meds here
            // Access the reason from the payload object
            const reasonKey = `${p.dataKey}_reason`;
            const reason = p.payload[reasonKey];
            
            return (
              <div key={index} className="flex flex-col mb-1 last:mb-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2" style={{ backgroundColor: p.color }}></div>
                  <span className="text-[var(--secondary)] text-xs uppercase" style={{ color: p.color }}>{p.name}:</span>
                  <span className="text-[var(--primary)] text-xs font-bold">{p.value}mg</span>
                </div>
                {reason && (
                  <div className="text-[10px] text-[var(--secondary)] pl-4 italic">
                    {`// ${reason}`}
                  </div>
                )}
              </div>
            );
          })}
          {/* Mood */}
           {payload.find((p: any) => p.dataKey === 'mood') && (
             <div className="mt-2 pt-2 border-t border-[var(--border)]">
               <span className="text-[var(--secondary)] text-xs font-bold uppercase">STATUS: {payload.find((p: any) => p.dataKey === 'mood')?.value}/10</span>
             </div>
          )}
          {/* Alcohol */}
          {payload.find((p: any) => p.dataKey === 'alcoholUnits') && (
             <div className="mt-1">
               <span className="text-[var(--primary)] text-xs font-bold uppercase">ALCOHOL: {payload.find((p: any) => p.dataKey === 'alcoholUnits')?.value} Units</span>
             </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (logs.length === 0) {
    return (
      <div className="text-center p-12 text-[var(--secondary)] border border-[var(--border)]">
        [ SYSTEM EMPTY ] - INITIATE LOGGING SEQUENCE
      </div>
    );
  }

  // Use CSS variables for chart grid
  const chartGridColor = 'var(--chart-grid)';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-[var(--bg)] p-4 border border-[var(--border)]">
        <h2 className="text-lg font-bold text-[var(--primary)] uppercase tracking-widest hidden xl:block">Analytics_Module</h2>
        
        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
          {/* Chart Type Toggle */}
          <div className="flex border border-[var(--border)]">
             <button
               onClick={() => setChartType('LINE')}
               className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-all ${chartType === 'LINE' ? 'bg-[var(--primary)] text-[var(--bg)]' : 'text-[var(--secondary)] hover:text-[var(--primary)]'}`}
             >
               <TrendingUp size={16} /> Line
             </button>
             <button
               onClick={() => setChartType('BAR')}
               className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-all ${chartType === 'BAR' ? 'bg-[var(--primary)] text-[var(--bg)]' : 'text-[var(--secondary)] hover:text-[var(--primary)]'}`}
             >
               <BarChart3 size={16} /> Bar
             </button>
          </div>

          {/* Time Range Toggle */}
          <div className="flex border border-[var(--border)] flex-1 xl:flex-none overflow-x-auto">
            <button 
              onClick={() => setRange('DAILY')}
              className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold uppercase transition-all whitespace-nowrap ${range === 'DAILY' ? 'bg-[var(--primary)] text-[var(--bg)]' : 'text-[var(--secondary)] hover:text-[var(--primary)]'}`}
            >
              <CalendarDays size={16} /> Day
            </button>
            <button 
              onClick={() => setRange('WEEKLY')}
              className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold uppercase transition-all whitespace-nowrap ${range === 'WEEKLY' ? 'bg-[var(--primary)] text-[var(--bg)]' : 'text-[var(--secondary)] hover:text-[var(--primary)]'}`}
            >
              <CalendarRange size={16} /> Week
            </button>
            <button 
              onClick={() => setRange('MONTHLY')}
              className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold uppercase transition-all whitespace-nowrap ${range === 'MONTHLY' ? 'bg-[var(--primary)] text-[var(--bg)]' : 'text-[var(--secondary)] hover:text-[var(--primary)]'}`}
            >
              <Calendar size={16} /> Month
            </button>
             <button 
              onClick={() => setRange('YEARLY')}
              className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold uppercase transition-all whitespace-nowrap ${range === 'YEARLY' ? 'bg-[var(--primary)] text-[var(--bg)]' : 'text-[var(--secondary)] hover:text-[var(--primary)]'}`}
            >
              <CalendarClock size={16} /> Year
            </button>
          </div>
        </div>
      </div>

      {/* Mood Chart */}
      <div className="bg-[var(--bg)] p-6 border border-[var(--border)] relative">
        <div className="absolute top-0 right-0 p-2 text-xs text-[var(--secondary)] font-bold uppercase flex items-center gap-2">
            <BrainCircuit size={14} /> Wellness_Metric_Graph
        </div>
        <div className="h-[120px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
               <XAxis dataKey="date" hide />
               <YAxis domain={[1, 10]} hide />
               <Tooltip 
                   contentStyle={{ backgroundColor: 'var(--bg)', border: '1px solid var(--primary)', color: 'var(--primary)', fontFamily: 'Share Tech Mono' }}
                   cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
                />
               <Line 
                  type="monotone" 
                  dataKey="mood" 
                  name="Wellness Level" 
                  stroke="var(--primary)" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: 'var(--primary)' }}
                />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-right text-[10px] text-[var(--secondary)] uppercase mt-1">Scale: 1 (CRIT) - 10 (OPT)</div>
      </div>

      {/* Primary Chart */}
      <div className="bg-[var(--bg)] p-6 border border-[var(--border)] relative">
        <div className="absolute top-0 right-0 p-2 text-xs text-[var(--secondary)] font-bold uppercase">Medication_Usage_Graph</div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'LINE' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="date" stroke="var(--secondary)" fontSize={12} tickLine={false} axisLine={false} fontFamily="Share Tech Mono" />
                <YAxis stroke="var(--secondary)" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'mg', angle: -90, position: 'insideLeft', fill: 'var(--secondary)' }} fontFamily="Share Tech Mono" />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }} />
                <Legend wrapperStyle={{ fontFamily: 'Share Tech Mono' }} />
                {BENZO_DATA.map(med => (
                  activeDrugIds.has(med.id) && (
                    <Line 
                      key={med.id} 
                      type="step" 
                      dataKey={med.id} 
                      name={med.name.split('(')[0].trim()} 
                      stroke={med.color} 
                      strokeWidth={2}
                      dot={range === 'DAILY' ? false : { r: 4, strokeWidth: 0, fill: med.color }}
                      activeDot={{ r: 6, stroke: '#fff' }}
                      connectNulls
                    />
                  )
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="date" stroke="var(--secondary)" fontSize={12} tickLine={false} axisLine={false} fontFamily="Share Tech Mono" />
                <YAxis stroke="var(--secondary)" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'mg', angle: -90, position: 'insideLeft', fill: 'var(--secondary)' }} fontFamily="Share Tech Mono" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted-bg)' }} />
                <Legend wrapperStyle={{ fontFamily: 'Share Tech Mono' }} />
                {BENZO_DATA.map(med => (
                  activeDrugIds.has(med.id) && (
                    <Bar 
                      key={med.id} 
                      dataKey={med.id} 
                      name={med.name.split('(')[0].trim()} 
                      stackId="a"
                      fill={med.color} 
                    />
                  )
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Max Consumption Cards */}
      <div>
        <h3 className="text-md font-bold text-[var(--primary)] mb-4 uppercase tracking-widest">Peak Dosage Records</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {peakStats.map(stat => (
            <div key={stat.id} className="bg-[var(--bg)] p-4 border border-[var(--border)] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--primary)] uppercase">{stat.name.split('(')[0]}</p>
                <p className="text-[10px] text-[var(--secondary)]">{stat.peakDate}</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold" style={{ color: stat.color, textShadow: `0 0 5px ${stat.color}` }}>{stat.peak}</span>
                <span className="text-xs font-bold text-[var(--secondary)] ml-1">mg</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Chart: Alcohol Relapses */}
      <div className="bg-[var(--bg)] p-6 border border-[var(--border)] relative">
        <div className="absolute top-0 right-0 p-2 text-xs text-[var(--secondary)] font-bold uppercase flex items-center gap-2">
            <Droplets size={14} /> Alcohol_Intake_Tracker
        </div>
        <div className="h-[200px] w-full mt-4">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="date" stroke="var(--secondary)" fontSize={12} tickLine={false} axisLine={false} fontFamily="Share Tech Mono" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted-bg)' }} />
                <Bar dataKey="alcoholUnits" name="Alcohol Units" fill="var(--primary)" barSize={20} />
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};