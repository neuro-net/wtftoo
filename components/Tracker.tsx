import React, { useState, useEffect } from 'react';
import { BENZO_DATA } from '../constants';
import { DailyLog, TakenMedication } from '../types';
import { Plus, Trash2, Save, AlertTriangle, Terminal, BrainCircuit, Clock } from 'lucide-react';

interface TrackerProps {
  onSave: (log: DailyLog) => void;
  onDelete: (id: string) => void;
  logs: DailyLog[];
  readOnly?: boolean;
}

export const Tracker: React.FC<TrackerProps> = ({ onSave, onDelete, logs, readOnly }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const nowStr = new Date().toTimeString().substring(0, 5); // HH:MM
  
  const [date, setDate] = useState(todayStr);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  
  const [alcoholConsumed, setAlcoholConsumed] = useState(false);
  const [alcoholUnits, setAlcoholUnits] = useState(0);
  const [medications, setMedications] = useState<TakenMedication[]>([]);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<number>(5);
  
  const [selectedMedId, setSelectedMedId] = useState(BENZO_DATA[0].id);
  const [customMedName, setCustomMedName] = useState('');
  const [medAmount, setMedAmount] = useState<string>('');
  const [medTime, setMedTime] = useState<string>(nowStr);
  const [medReason, setMedReason] = useState('');
  
  // Safety state for deletion
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Auto-load data if a log exists for the selected date
  useEffect(() => {
    const foundLog = logs.find(l => l.date === date);
    if (foundLog) {
      setCurrentLogId(foundLog.id);
      setAlcoholConsumed(foundLog.alcoholConsumed);
      setAlcoholUnits(foundLog.alcoholUnits);
      setMedications(foundLog.medications);
      setNotes(foundLog.notes || '');
      setMood(foundLog.mood || 5);
      setConfirmDelete(false); // Reset delete confirmation on load
    } else {
      setCurrentLogId(null);
      setAlcoholConsumed(false);
      setAlcoholUnits(0);
      setMedications([]);
      setNotes('');
      setMood(5);
      setConfirmDelete(false);
    }
  }, [date, logs]);

  const handleAddMedication = () => {
    if (!medAmount || isNaN(Number(medAmount))) return;
    
    const finalCustomName = selectedMedId === 'other' 
      ? (customMedName.trim() || 'Other') 
      : undefined;

    setMedications([
      ...medications, 
      { 
        medicationId: selectedMedId, 
        amount: Number(medAmount),
        timeTaken: medTime,
        customName: finalCustomName,
        reason: medReason.trim() || undefined
      }
    ]);
    
    setMedAmount('');
    setCustomMedName('');
    setMedReason('');
    setMedTime(nowStr);
    if (selectedMedId === 'other') setSelectedMedId(BENZO_DATA[0].id);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: DailyLog = {
      id: currentLogId || Math.random().toString(36).substr(2, 9),
      date,
      alcoholConsumed,
      alcoholUnits: alcoholConsumed ? alcoholUnits : 0,
      medications,
      notes,
      mood,
      timestamp: new Date(date).getTime()
    };
    onSave(newLog);
  };

  const handleDeleteLog = () => {
    if (currentLogId) {
      if (confirmDelete) {
        onDelete(currentLogId);
      } else {
        setConfirmDelete(true);
        // Auto reset confirmation after 3s
        setTimeout(() => setConfirmDelete(false), 3000);
      }
    }
  };

  if (readOnly) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--secondary)] p-8 text-center border border-[var(--border)] bg-[var(--bg)]">
        <h2 className="text-2xl font-bold mb-2 uppercase tracking-widest">Access Denied</h2>
        <p className="font-mono">Read-only protocol engaged.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto border border-[var(--border)] bg-[var(--bg)] relative shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]">
      {/* Decorative HUD corners */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-[var(--primary)]"></div>
      <div className="absolute top-0 right-0 w-2 h-2 bg-[var(--primary)]"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-[var(--primary)]"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-[var(--primary)]"></div>

      <div className="p-4 border-b border-[var(--border)] bg-[var(--muted-bg)] flex items-center gap-2">
        <Terminal size={18} className="text-[var(--primary)]" />
        <h2 className="text-lg font-bold text-[var(--primary)] uppercase tracking-widest">
          Daily_Check_In_Protocol
        </h2>
        {currentLogId && <span className="ml-auto text-xs text-[var(--secondary)] bg-[var(--muted-bg)] px-2 py-1 border border-[var(--primary)] animate-pulse">EDITING EXISTING ENTRY</span>}
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Date Selection */}
        <div>
          <label className="block text-xs font-bold text-[var(--secondary)] uppercase mb-2 tracking-widest">Timestamp</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 cyber-input text-lg text-[var(--primary)] border-[var(--border)] bg-[var(--bg)]"
            required
          />
        </div>

        {/* Mood Section */}
        <div className="p-4 border border-[var(--border)] bg-[var(--bg)]">
           <label className="flex items-center gap-2 text-xs font-bold text-[var(--secondary)] uppercase mb-4 tracking-widest">
             <BrainCircuit size={16} /> Psycho-Emotional Status Level
           </label>
           
           <div className="flex justify-between gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMood(val)}
                  className={`flex-1 h-12 border transition-all relative group
                    ${val <= mood 
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--bg)]' 
                      : 'bg-[var(--bg)] border-[var(--border)] text-[var(--secondary)] hover:bg-[var(--muted-bg)]'
                    }
                  `}
                >
                  <span className="absolute inset-0 flex items-center justify-center font-bold text-sm">
                    {val}
                  </span>
                </button>
              ))}
           </div>
           <div className="flex justify-between mt-2 text-[10px] text-[var(--secondary)] uppercase font-bold tracking-widest">
             <span>Critical Failure</span>
             <span>Nominal</span>
             <span>Optimal</span>
           </div>
        </div>

        {/* Medication Section */}
        <div className="p-4 border border-[var(--border)] bg-[var(--muted-bg)] relative">
          <div className="absolute -top-3 left-4 bg-[var(--bg)] px-2 text-xs text-[var(--primary)] font-bold uppercase tracking-widest border border-[var(--border)]">Medication Log</div>
          
          <div className="space-y-2 mb-6 mt-2">
            {medications.map((med, idx) => {
               const medInfo = BENZO_DATA.find(b => b.id === med.medicationId);
               const displayName = med.medicationId === 'other' && med.customName 
                 ? `${med.customName} (Other)`
                 : medInfo?.name;

               return (
                 <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-[var(--border)] hover:border-[var(--primary)] transition-colors bg-[var(--bg)] gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <span className="text-[var(--primary)] font-bold">{'>'}</span>
                        {med.timeTaken && <span className="text-[var(--secondary)] font-mono text-sm">[{med.timeTaken}]</span>}
                        <span className="font-medium text-[var(--primary)] uppercase">{displayName}</span>
                        <span className="text-[var(--secondary)] font-mono font-bold">[{med.amount}{medInfo?.unit}]</span>
                      </div>
                      {med.reason && (
                        <span className="text-[10px] text-[var(--secondary)] pl-6 uppercase tracking-wider">
                          // REASON: {med.reason}
                        </span>
                      )}
                    </div>
                    <button type="button" onClick={() => removeMedication(idx)} className="text-[var(--secondary)] hover:text-[var(--primary)] self-end sm:self-center">
                      <Trash2 size={16} />
                    </button>
                 </div>
               );
            })}
            {medications.length === 0 && <p className="text-sm text-[var(--secondary)] font-mono text-center py-2">{'>'} NULL LIST</p>}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-full sm:w-1/4">
                <label className="block text-xs font-bold text-[var(--secondary)] mb-1 uppercase">Substance</label>
                <select 
                  value={selectedMedId} 
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full p-2.5 cyber-input text-[var(--primary)] bg-[var(--bg)] border-[var(--border)] rounded-none uppercase"
                >
                  {BENZO_DATA.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="w-full sm:w-1/5">
                <label className="block text-xs font-bold text-[var(--secondary)] mb-1 uppercase">Dosage</label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="0.0" 
                  value={medAmount}
                  onChange={(e) => setMedAmount(e.target.value)}
                  className="w-full p-2.5 cyber-input text-[var(--primary)] bg-[var(--bg)] border-[var(--border)] rounded-none"
                />
              </div>

              <div className="w-full sm:w-1/5">
                <label className="block text-xs font-bold text-[var(--secondary)] mb-1 uppercase">Time</label>
                <div className="relative">
                  <input 
                    type="time" 
                    value={medTime}
                    onChange={(e) => setMedTime(e.target.value)}
                    className="w-full p-2.5 cyber-input text-[var(--primary)] bg-[var(--bg)] border-[var(--border)] rounded-none"
                  />
                  <Clock size={14} className="absolute right-2 top-3 text-[var(--secondary)] pointer-events-none" />
                </div>
              </div>

              <div className="w-full sm:flex-1">
                 <label className="block text-xs font-bold text-[var(--secondary)] mb-1 uppercase">Reason</label>
                 <input 
                  type="text" 
                  placeholder="OPTIONAL..." 
                  value={medReason}
                  onChange={(e) => setMedReason(e.target.value)}
                  className="w-full p-2.5 cyber-input text-[var(--primary)] bg-[var(--bg)] border-[var(--border)] rounded-none uppercase"
                />
              </div>
            </div>
            
            {/* Conditional "Other" Name Input */}
            {selectedMedId === 'other' && (
              <div className="animate-in fade-in">
                <label className="block text-xs font-bold text-[var(--secondary)] mb-1 uppercase">Specific Name</label>
                <input 
                  type="text" 
                  placeholder="IDENTIFY SUBSTANCE..." 
                  value={customMedName}
                  onChange={(e) => setCustomMedName(e.target.value)}
                  className="w-full p-2.5 cyber-input bg-[var(--bg)] border-[var(--border)] rounded-none"
                />
              </div>
            )}

            <button 
              type="button" 
              onClick={handleAddMedication}
              className="w-full p-2.5 border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--bg)] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add Entry
            </button>
          </div>
        </div>

        {/* Alcohol Section */}
        <div className={`p-4 border transition-colors relative ${alcoholConsumed ? 'border-[var(--primary)] bg-[var(--muted-bg)]' : 'border-[var(--border)] bg-[var(--bg)]'}`}>
           <div className="absolute -top-3 left-4 bg-[var(--bg)] px-2 text-xs text-[var(--primary)] font-bold uppercase tracking-widest border border-[var(--border)]">Alcohol Check</div>
          
          <div className="flex items-center gap-3 mb-4 mt-2">
             <AlertTriangle className={alcoholConsumed ? "text-[var(--primary)] animate-pulse" : "text-[var(--secondary)]"} />
             <p className="text-sm text-[var(--secondary)] font-mono uppercase">Ethanol ingestion detected?</p>
          </div>
          
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setAlcoholConsumed(false)}
              className={`flex-1 py-3 px-4 font-bold border uppercase tracking-wider transition-all ${!alcoholConsumed ? 'border-[var(--success)] text-[var(--success)] bg-[rgba(34,197,94,0.1)]' : 'border-[var(--border)] text-[var(--secondary)] hover:border-[var(--secondary)]'}`}
            >
              Negative
            </button>
            <button
              type="button"
              onClick={() => setAlcoholConsumed(true)}
              className={`flex-1 py-3 px-4 font-bold border uppercase tracking-wider transition-all ${alcoholConsumed ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--muted-bg)]' : 'border-[var(--border)] text-[var(--secondary)] hover:border-[var(--secondary)]'}`}
            >
              Affirmative
            </button>
          </div>

          {alcoholConsumed && (
            <div className="animate-in slide-in-from-top-2 pt-4 border-t border-[var(--border)]">
              <label className="block text-xs font-bold text-[var(--primary)] mb-2 uppercase tracking-widest">
                Unit Count
              </label>
              <input 
                type="number" 
                min="0" 
                step="0.5"
                value={alcoholUnits} 
                onChange={(e) => setAlcoholUnits(Number(e.target.value))}
                className="w-full p-3 cyber-input text-[var(--primary)] border-[var(--border)] bg-[var(--bg)] font-bold"
              />
              <p className="text-[10px] text-[var(--primary)] mt-2 uppercase blink">{'>'}{'>'} WARNING: RECOVERY COMPROMISED</p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-[var(--secondary)] mb-2 uppercase tracking-widest">Subjective Notes</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full p-3 cyber-input text-[var(--primary)] border-[var(--border)] bg-[var(--bg)] resize-none"
            placeholder="ENTER ADDITIONAL DATA..."
          ></textarea>
        </div>

        <div className="flex gap-4">
           {currentLogId && (
             <button
               type="button"
               onClick={handleDeleteLog}
               className={`flex-1 py-4 border font-bold text-lg uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3
                 ${confirmDelete 
                   ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--bg)] animate-pulse' 
                   : 'border-[var(--border)] text-[var(--secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                 }
               `}
             >
               <Trash2 size={20} />
               {confirmDelete ? "CONFIRM?" : "DELETE"}
             </button>
           )}
           <button 
            type="submit" 
            className="flex-[2] py-4 bg-[var(--muted-bg)] border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--bg)] font-bold text-lg uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
          >
            <Save size={20} /> {currentLogId ? "UPDATE_LOG" : "COMMIT_LOG"}
          </button>
        </div>
      </form>
    </div>
  );
};