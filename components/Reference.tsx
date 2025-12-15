import React from 'react';
import { BENZO_DATA } from '../constants';

export const Reference: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-black border border-red-900 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 to-transparent"></div>
        <div className="p-6 border-b border-red-900 bg-red-950/20">
          <h2 className="text-xl font-bold text-red-500 uppercase tracking-widest">Benzodiazepine_Equivalence_Matrix</h2>
          <p className="text-red-800 text-xs mt-1 font-mono">
            // REF: ASHTON MANUAL // CONSULT MEDICAL OFFICER BEFORE ADJUSTMENT
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-black text-red-700 uppercase tracking-wider border-b border-red-900">
              <tr>
                <th className="px-6 py-4">Compound</th>
                <th className="px-6 py-4">Half-Life (T½)</th>
                <th className="px-6 py-4">Equivalence Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-900/30">
              {BENZO_DATA.map((med) => (
                <tr key={med.id} className="hover:bg-red-900/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-red-100 uppercase">{med.name}</td>
                  <td className="px-6 py-4 text-red-400">{med.halfLifeHours} HRS</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 border border-red-800 text-red-500 text-xs font-bold uppercase bg-black">
                      1mg = {med.diazepamEquivalence}mg DIAZEPAM
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};