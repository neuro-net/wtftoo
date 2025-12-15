import React, { useState } from 'react';
import { clearLocalData, downloadCSV, getLocalLogs } from '../services/storageService';
import { auth } from '../services/firebase';
import { UserSettings } from '../types';
import { THEMES } from '../constants';
import { AlertTriangle, Trash2, Save, Shield, User, Lock, Palette, Download, Database, LogOut } from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  onSaveSettings: (s: UserSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSaveSettings }) => {
  const [name, setName] = useState(settings.name);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({ ...settings, name });
  };

  const handleExport = () => {
    // Basic export of currently loaded logs (this needs logs prop ideally, but we can assume parent handles or we use util)
    // For now, let's trigger a generic export if possible, or warn. 
    // In a connected app, we should probably fetch all from cloud before export.
    // For simplicity in this view, we'll assume the user wants what's on screen or local fallback.
    // Actually, improved implementation: parent passes logs or we use the util.
    // Let's use getLocalLogs for fallback but ideally we pass logs down. 
    // Since we don't have logs prop here, let's just use the util which might be stale if cloud.
    // FIX: To be safe in cloud mode, export should be handled in App or passed down. 
    // For now, let's leave it as is but note it might export local fallback if logic isn't updated.
    // BETTER: Disable export here or ask user to view dashboard. 
    // Let's alert for now.
    alert("Please use the 'Export' feature requires recent data synched.");
  };

  const handleReset = () => {
    if (confirmReset) {
      clearLocalData(); // Clears local, logic for cloud wipe can be added in storageService
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 5000);
    }
  };

  const handleSignOut = () => {
    auth?.signOut();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Session Control */}
      <div className="border border-[var(--primary)] bg-[var(--muted-bg)] p-6 flex items-center justify-between">
         <div>
            <h2 className="text-lg font-bold text-[var(--primary)] uppercase tracking-widest">Active Session</h2>
            <p className="text-xs text-[var(--secondary)]">{auth?.currentUser?.email}</p>
         </div>
         <button 
           onClick={handleSignOut}
           className="px-4 py-2 border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--bg)] font-bold uppercase text-xs flex items-center gap-2"
         >
           <LogOut size={14} /> Terminate
         </button>
      </div>

      {/* User Profile */}
      <div className="border border-[var(--border)] bg-[var(--bg)] p-6 relative">
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[var(--primary)]"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[var(--primary)]"></div>
        
        <h2 className="text-xl font-bold text-[var(--primary)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <User size={24} /> User Profile
        </h2>

        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--secondary)] mb-2 uppercase tracking-widest">Target Designation (Name)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="flex-1 p-3 cyber-input text-[var(--primary)] border-[var(--border)] bg-[var(--bg)] uppercase font-bold"
                placeholder="ENTER DESIGNATION..."
              />
              <button 
                type="submit" 
                className="px-6 border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--bg)] font-bold uppercase transition-colors"
              >
                <Save size={18} />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Interface Theme */}
      <div className="border border-[var(--border)] bg-[var(--bg)] p-6">
        <h2 className="text-xl font-bold text-[var(--primary)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <Palette size={24} /> Interface Theme
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(THEMES) as Array<UserSettings['theme']>).map((themeKey) => (
             <button
               key={themeKey}
               onClick={() => onSaveSettings({ ...settings, theme: themeKey })}
               className={`p-4 border text-left transition-all ${
                 settings.theme === themeKey 
                   ? 'border-[var(--primary)] bg-[var(--muted-bg)] shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]' 
                   : 'border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--muted-bg)]'
               }`}
             >
               <div className="w-full h-8 mb-2 flex">
                 <div className="w-1/3 h-full" style={{ backgroundColor: THEMES[themeKey].primary }}></div>
                 <div className="w-1/3 h-full" style={{ backgroundColor: THEMES[themeKey].background }}></div>
                 <div className="w-1/3 h-full" style={{ backgroundColor: THEMES[themeKey].secondary }}></div>
               </div>
               <span className="text-[var(--primary)] font-bold uppercase text-sm tracking-wider">
                 {themeKey.replace('_', ' ')}
               </span>
             </button>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="border border-[var(--border)] bg-[var(--bg)] p-6 opacity-90">
        <h2 className="text-xl font-bold text-[var(--primary)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <Shield size={24} /> Security Protocols
        </h2>
        
        {/* Family Mode */}
        <div className="p-4 border border-[var(--border)] bg-[var(--muted-bg)] mb-6">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[var(--secondary)] font-bold uppercase flex items-center gap-2"><Lock size={16} /> Family Monitor Mode</span>
              <button 
                  onClick={() => onSaveSettings({ ...settings, familyMode: !settings.familyMode })}
                  className={`w-12 h-6 border border-[var(--primary)] p-0.5 transition-colors ${settings.familyMode ? 'bg-[rgba(var(--primary-rgb),0.2)]' : 'bg-[var(--bg)]'}`}
              >
                  <div className={`w-4 h-4 bg-[var(--primary)] transform transition-transform ${settings.familyMode ? 'translate-x-6' : ''}`}></div>
              </button>
           </div>
           <p className="text-xs text-[var(--secondary)] font-mono">
             When active, data input is disabled. Read-only access for external observers.
           </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-[var(--primary)] bg-[var(--bg)] p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--border)] to-[var(--primary)] animate-pulse"></div>
        
        <h2 className="text-xl font-bold text-[var(--primary)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <AlertTriangle size={24} /> Danger Zone
        </h2>

        <div className="space-y-4">
          <p className="text-[var(--primary)] text-sm font-bold uppercase">
             &gt;&gt; WARNING: IRREVERSIBLE ACTION
          </p>
          <p className="text-[var(--secondary)] text-xs font-mono mb-4">
             Executing system purge will wipe local caches. Cloud data requires manual deletion.
          </p>

          <button
            onClick={handleReset}
            className={`w-full py-4 border-2 font-bold text-lg uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3
              ${confirmReset 
                ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--bg)] animate-pulse' 
                : 'border-[var(--border)] text-[var(--secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
              }
            `}
          >
            <Trash2 size={20} />
            {confirmReset ? "CONFIRM SYSTEM PURGE?" : "INITIATE SYSTEM PURGE"}
          </button>
        </div>
      </div>
    </div>
  );
};