import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, PlusCircle, BarChart2, BookOpen, Settings, Menu, X, Cpu, Radio, Loader2, AlertTriangle } from 'lucide-react';
import { ViewState, DailyLog, UserSettings } from './types';
import { getLocalLogs, saveLocalLog, deleteLocalLog, getLocalSettings, saveLocalSettings, subscribeToLogs, saveLogToCloud, deleteLogFromCloud, saveSettingsToCloud, getSettingsFromCloud } from './services/storageService';
import { Dashboard } from './components/Dashboard';
import { Tracker } from './components/Tracker';
import { Statistics } from './components/Statistics';
import { Reference } from './components/Reference';
import { SettingsView } from './components/SettingsView';
import { AuthScreen } from './components/AuthScreen';
import { THEMES } from './constants';
import { auth, isFirebaseConfigured } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Helper to convert hex to rgb for Tailwind opacity utilities
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '239, 68, 68';
};

function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [settings, setSettingsState] = useState<UserSettings>({ name: 'User', familyMode: false, theme: 'red_alert' });
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Keep track of logs subscription to unsubscribe when needed
  const logsUnsubRef = useRef<(() => void) | null>(null);

  // Monitor Auth State
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    // Safety timeout: If Firebase takes too long (e.g. network hang), force UI to load (likely to Auth Screen)
    const safetyTimer = setTimeout(() => {
       if (authLoading) {
         console.warn("Auth initialization timed out. Forcing UI render.");
         setAuthLoading(false);
       }
    }, 6000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Clear safety timer as we got a response
      clearTimeout(safetyTimer);
      
      // Cleanup previous logs subscription if user changes
      if (logsUnsubRef.current) {
        logsUnsubRef.current();
        logsUnsubRef.current = null;
      }

      setUser(currentUser);
      
      try {
        if (currentUser) {
          // User is logged in: Load cloud settings and subscribe to logs
          setDataLoading(true);
          
          try {
            const cloudSettings = await getSettingsFromCloud(currentUser.uid);
            if (cloudSettings) setSettingsState(cloudSettings);
          } catch (err: any) {
            console.error("Failed to load settings (likely permissions):", err);
            // Don't block app load, just use defaults
            if (err.code === 'permission-denied') {
               setInitError("Database permissions denied. Please check Cloud Firestore rules.");
            }
          }
          
          // Subscribe to logs (real-time)
          try {
            logsUnsubRef.current = subscribeToLogs(currentUser.uid, (cloudLogs) => {
              setLogs(cloudLogs);
              setDataLoading(false);
            });
          } catch (err) {
             console.error("Failed to subscribe to logs:", err);
             setDataLoading(false);
          }
        } else {
          // User is logged out: Fallback to local or clear
          setLogs([]);
          setSettingsState(getLocalSettings()); 
          setInitError(null);
        }
      } catch (err) {
        console.error("Unexpected auth flow error:", err);
      } finally {
        // CRITICAL: Always turn off loading, even if errors occurred above
        setAuthLoading(false);
      }
    }, (error) => {
       console.error("Auth Observer Error:", error);
       setAuthLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
      if (logsUnsubRef.current) logsUnsubRef.current();
    };
  }, []);

  // Sync settings to local state for theme application immediately
  useEffect(() => {
     // Apply Theme CSS Variables
    const theme = THEMES[settings.theme] || THEMES['red_alert'];
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-rgb', hexToRgb(theme.primary));
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--border', theme.border);
    root.style.setProperty('--bg', theme.background);
    root.style.setProperty('--muted-bg', theme.mutedBg);
    root.style.setProperty('--success', theme.success);
    root.style.setProperty('--chart-grid', theme.chartGrid);
  }, [settings.theme]);

  const handleSaveLog = async (log: DailyLog) => {
    if (user) {
      await saveLogToCloud(user.uid, log);
    } else {
      // Fallback for offline/demo if auth fails
      const updatedLogs = saveLocalLog(log);
      setLogs(updatedLogs);
    }
    setView(ViewState.DASHBOARD);
  };

  const handleDeleteLog = async (logId: string) => {
    if (user) {
      await deleteLogFromCloud(user.uid, logId);
    } else {
      const updatedLogs = deleteLocalLog(logId);
      setLogs(updatedLogs);
    }
    setView(ViewState.DASHBOARD);
  };

  const handleSaveSettings = async (newSettings: UserSettings) => {
    setSettingsState(newSettings);
    if (user) {
      await saveSettingsToCloud(user.uid, newSettings);
    } else {
      saveLocalSettings(newSettings);
    }
  };

  // 1. Loading Screen
  if (authLoading) {
     return (
        <div className="h-screen w-full bg-black flex flex-col items-center justify-center font-mono text-red-500">
           <Loader2 size={48} className="animate-spin mb-4" />
           <p className="animate-pulse tracking-widest">ESTABLISHING UPLINK...</p>
        </div>
     );
  }

  // 2. Auth Screen (If not logged in and Firebase is configured)
  if (!user) {
    return <AuthScreen />;
  }

  const NavItem = ({ target, icon: Icon, label }: { target: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        setView(target);
        setIsMobileMenuOpen(false);
      }}
      className={`group flex items-center gap-3 w-full px-4 py-3 text-lg font-medium transition-all border-l-2 ${
        view === target 
          ? 'border-[var(--primary)] bg-[var(--muted-bg)] text-[var(--primary)] shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]' 
          : 'border-transparent text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--muted-bg)]'
      }`}
    >
      <Icon size={20} className={view === target ? 'animate-pulse' : ''} />
      <span className="tracking-widest uppercase">{label}</span>
      {view === target && <span className="ml-auto text-xs animate-pulse">●</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--primary)] font-mono flex selection:bg-[var(--primary)] selection:text-[var(--bg)]">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed w-full top-0 z-50 bg-[var(--bg)] border-b border-[var(--border)] px-4 py-3 flex justify-between items-center shadow-[0_4px_20px_rgba(var(--primary-rgb),0.1)]">
        <h1 className="text-xl font-bold text-[var(--primary)] tracking-[0.2em] flex items-center gap-2">
          <Cpu size={20} /> WTF_SYS
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-[var(--primary)] hover:bg-[var(--muted-bg)]">
           {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:sticky top-0 h-screen w-72 bg-[var(--bg)] border-r border-[var(--border)] p-0 flex flex-col z-40 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-[var(--border)] mb-4 bg-[var(--muted-bg)]">
          <h1 className="text-4xl font-black italic text-[var(--primary)] tracking-tighter flex items-center gap-2 animate-pulse" style={{ textShadow: '0 0 10px rgba(var(--primary-rgb), 0.8)' }}>
            WTF
          </h1>
          <p className="text-xs text-[var(--secondary)] mt-2 tracking-widest">NEURAL NET LINKED</p>
          <p className="text-xs text-[var(--secondary)] tracking-widest">SYS.VER.1.1.0_CLOUD</p>
        </div>

        <nav className="flex-1 space-y-1 mt-4">
          <NavItem target={ViewState.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem target={ViewState.TRACKER} icon={PlusCircle} label="Input_Log" />
          <NavItem target={ViewState.STATISTICS} icon={BarChart2} label="Analytics" />
          <NavItem target={ViewState.REFERENCE} icon={BookOpen} label="Database" />
          <NavItem target={ViewState.SETTINGS} icon={Settings} label="System_Cfg" />
        </nav>

        <div className="p-6 border-t border-[var(--border)] space-y-6">
           <div className="flex items-center gap-3 text-[var(--secondary)] text-xs uppercase tracking-widest">
             <Radio size={14} className={dataLoading ? "animate-spin text-[var(--primary)]" : "animate-pulse text-[var(--success)]"} />
             <span>{dataLoading ? "SYNCING..." : "LIVE UPLINK"}</span>
           </div>
           
           {initError && (
              <div className="border border-red-500 bg-red-900/20 p-2 text-[10px] text-red-500 font-bold uppercase">
                 <div className="flex items-center gap-1 mb-1"><AlertTriangle size={10} /> SYSTEM ALERT</div>
                 {initError}
              </div>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto max-w-7xl mx-auto w-full relative">
        {/* Decorative Corner bits */}
        <div className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 border-[var(--border)] pointer-events-none md:block hidden"></div>
        <div className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 border-[var(--border)] pointer-events-none md:block hidden"></div>
        <div className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 border-[var(--border)] pointer-events-none md:block hidden"></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-[var(--border)] pointer-events-none md:block hidden"></div>

        {settings.familyMode && view !== ViewState.SETTINGS && (
           <div className="border border-yellow-600 text-yellow-500 bg-yellow-900/10 px-4 py-2 mb-8 text-sm flex items-center gap-2 tracking-widest uppercase">
             <Settings size={14} /> RESTRICTED VIEWING MODE ACTIVE
           </div>
        )}

        {view === ViewState.DASHBOARD && <Dashboard logs={logs} settings={settings} />}
        {view === ViewState.TRACKER && <Tracker onSave={handleSaveLog} onDelete={handleDeleteLog} readOnly={settings.familyMode} logs={logs} />}
        {view === ViewState.STATISTICS && <Statistics logs={logs} />}
        {view === ViewState.REFERENCE && <Reference />}
        {view === ViewState.SETTINGS && <SettingsView settings={settings} onSaveSettings={handleSaveSettings} />}
      </main>
    </div>
  );
}

export default App;