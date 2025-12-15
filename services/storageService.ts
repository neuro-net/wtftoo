import { DailyLog, UserSettings } from '../types';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, getDoc } from 'firebase/firestore';

const LOGS_KEY = 'soberstats_logs';
const SETTINGS_KEY = 'soberstats_settings';

// --- Local Storage Implementation (Fallback) ---

export const getLocalLogs = (): DailyLog[] => {
  const stored = localStorage.getItem(LOGS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse logs", e);
    return [];
  }
};

export const saveLocalLog = (log: DailyLog): DailyLog[] => {
  const logs = getLocalLogs();
  const existingIndex = logs.findIndex(l => l.id === log.id);
  
  let newLogs;
  if (existingIndex >= 0) {
    newLogs = [...logs];
    newLogs[existingIndex] = log;
  } else {
    newLogs = [...logs, log];
  }
  
  newLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  localStorage.setItem(LOGS_KEY, JSON.stringify(newLogs));
  return newLogs;
};

export const deleteLocalLog = (id: string): DailyLog[] => {
  const logs = getLocalLogs().filter(l => l.id !== id);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  return logs;
};

export const getLocalSettings = (): UserSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    localStorage.removeItem(SETTINGS_KEY);
  }
  return { name: 'User', familyMode: false, theme: 'red_alert' };
};

export const saveLocalSettings = (settings: UserSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const clearLocalData = () => {
  localStorage.removeItem(LOGS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  window.location.reload();
};

// --- Firestore Implementation (Cloud) ---

export const subscribeToLogs = (userId: string, callback: (logs: DailyLog[]) => void) => {
  if (!db) return () => {};
  
  const q = query(collection(db, 'users', userId, 'logs'));
  
  return onSnapshot(q, (querySnapshot) => {
    const logs: DailyLog[] = [];
    querySnapshot.forEach((doc) => {
      logs.push(doc.data() as DailyLog);
    });
    // Sort descending by date
    logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(logs);
  });
};

export const saveLogToCloud = async (userId: string, log: DailyLog) => {
  if (!db) return;
  // Use log.id as document ID for easy updates
  await setDoc(doc(db, 'users', userId, 'logs', log.id), log, { merge: true });
};

export const deleteLogFromCloud = async (userId: string, logId: string) => {
  if (!db) return;
  await deleteDoc(doc(db, 'users', userId, 'logs', logId));
};

export const saveSettingsToCloud = async (userId: string, settings: UserSettings) => {
  if (!db) return;
  await setDoc(doc(db, 'users', userId, 'settings', 'config'), settings, { merge: true });
};

export const getSettingsFromCloud = async (userId: string): Promise<UserSettings | null> => {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', userId, 'settings', 'config'));
  if (snap.exists()) {
    return snap.data() as UserSettings;
  }
  return null;
};

// --- Utilities ---

export const downloadCSV = (logs: DailyLog[]) => {
  if (logs.length === 0) return;

  const headers = ['Date', 'Timestamp_Epoch', 'Mood_1_10', 'Alcohol_Consumed', 'Alcohol_Units', 'Notes', 'Medications_Summary'];
  
  const rows = logs.map(log => {
    const medsSummary = log.medications.map(m => {
       const time = m.timeTaken ? `[${m.timeTaken}]` : '';
       const name = m.customName ? `${m.customName}(Other)` : m.medicationId;
       const reason = m.reason ? `(Reason: ${m.reason})` : '';
       return `${time} ${name} ${m.amount}mg ${reason}`;
    }).join('; ');

    const safeNotes = `"${(log.notes || '').replace(/"/g, '""')}"`;
    const safeMeds = `"${medsSummary.replace(/"/g, '""')}"`;

    return [
      log.date,
      log.timestamp,
      log.mood || '',
      log.alcoholConsumed ? 'YES' : 'NO',
      log.alcoholUnits,
      safeNotes,
      safeMeds
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `soberstats_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};