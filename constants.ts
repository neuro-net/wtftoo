import { MedicationReference, ThemeColors } from './types';

export const BENZO_DATA: MedicationReference[] = [
  {
    id: 'alprazolam',
    name: 'Alprazolam (Xanax)',
    halfLifeHours: '11-12',
    diazepamEquivalence: 20,
    unit: 'mg',
    color: '#ff00ff' // Neon Magenta
  },
  {
    id: 'clonazepam',
    name: 'Clonazepam (Klonopin)',
    halfLifeHours: '18-50',
    diazepamEquivalence: 20, 
    unit: 'mg',
    color: '#00ffff' // Neon Cyan
  },
  {
    id: 'diazepam',
    name: 'Diazepam (Valium)',
    halfLifeHours: '20-100',
    diazepamEquivalence: 1, 
    unit: 'mg',
    color: '#ffff00' // Neon Yellow
  },
  {
    id: 'lorazepam',
    name: 'Lorazepam (Ativan)',
    halfLifeHours: '10-20',
    diazepamEquivalence: 10, 
    unit: 'mg',
    color: '#00ff00' // Neon Green
  },
  {
    id: 'oxazepam',
    name: 'Oxazepam (Serax)',
    halfLifeHours: '4-15',
    diazepamEquivalence: 0.5, 
    unit: 'mg',
    color: '#3b82f6' // Bright Blue
  },
  {
    id: 'chlordiazepoxide',
    name: 'Chlordiazepoxide (Librium)',
    halfLifeHours: '5-30',
    diazepamEquivalence: 0.4, 
    unit: 'mg',
    color: '#f97316' // Bright Orange
  },
  {
    id: 'temazepam',
    name: 'Temazepam (Restoril)',
    halfLifeHours: '8-22',
    diazepamEquivalence: 0.5, 
    unit: 'mg',
    color: '#ec4899' // Pink
  },
  {
    id: 'other',
    name: 'Other',
    halfLifeHours: 'N/A',
    diazepamEquivalence: 0,
    unit: 'mg',
    color: '#94a3b8' // Slate-400
  }
];

export const THEMES: Record<string, ThemeColors> = {
  red_alert: {
    primary: '#ef4444', // Red-500
    secondary: '#991b1b', // Red-800
    border: '#7f1d1d', // Red-900
    background: '#000000',
    mutedBg: 'rgba(69, 10, 10, 0.2)', // Red-950 alpha
    success: '#22c55e',
    chartGrid: '#333'
  },
  noir: {
    primary: '#e5e5e5', // Neutral-200
    secondary: '#737373', // Neutral-500
    border: '#404040', // Neutral-700
    background: '#0a0a0a', // Neutral-950
    mutedBg: 'rgba(64, 64, 64, 0.2)',
    success: '#ffffff', // Stark white for success in Noir
    chartGrid: '#404040'
  },
  synthwave: {
    primary: '#06b6d4', // Cyan-500
    secondary: '#7c3aed', // Violet-600
    border: '#1e3a8a', // Blue-900
    background: '#020617', // Slate-950
    mutedBg: 'rgba(30, 58, 138, 0.2)', // Blue-900 alpha
    success: '#d946ef', // Fuchsia-500
    chartGrid: '#1e293b'
  }
};