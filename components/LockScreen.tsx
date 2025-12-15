import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, ChevronRight, Terminal } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
  correctPassword?: string;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, correctPassword }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [bootSequence, setBootSequence] = useState(true);

  // Fake boot sequence effect
  useEffect(() => {
    const timer = setTimeout(() => setBootSequence(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === correctPassword) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
      setInput('');
      // Shake effect timeout
      setTimeout(() => setError(false), 500);
    }
  };

  if (bootSequence) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center font-mono text-red-500 p-4">
        <div className="w-full max-w-md space-y-2">
           <p className="animate-pulse">INITIALIZING SECURITY PROTOCOLS...</p>
           <p className="text-red-800 delay-100">CHECKING BIOMETRICS... [BYPASSED]</p>
           <p className="text-red-800 delay-200">ESTABLISHING SECURE LINK... [OK]</p>
           <div className="h-1 w-full bg-red-900 mt-4 overflow-hidden">
             <div className="h-full bg-red-500 animate-[width_1s_ease-in-out]"></div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center font-mono relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(255,0,0,0.02),rgba(255,0,0,0.06))] bg-[length:100%_4px,6px_100%] pointer-events-none"></div>
      
      <div className="z-10 w-full max-w-md p-8 border border-red-900 bg-black shadow-[0_0_50px_rgba(220,38,38,0.1)] relative">
        {/* Corner markers */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-600"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-600"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-600"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-600"></div>

        <div className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full border-2 ${error ? 'border-red-500 animate-pulse bg-red-900/20' : 'border-red-900 bg-black'}`}>
              {error ? <ShieldAlert size={48} className="text-red-500" /> : <Lock size={48} className="text-red-700" />}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-red-500 tracking-[0.2em] mb-2">SYSTEM LOCKED</h1>
            <p className="text-xs text-red-800 font-bold uppercase tracking-widest">Authentication Required</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Terminal size={16} className="text-red-600" />
              </div>
              <input
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={`block w-full pl-10 pr-3 py-3 border-b-2 bg-transparent text-red-500 placeholder-red-900 focus:outline-none focus:border-red-500 transition-colors font-bold text-center tracking-[0.5em] ${error ? 'border-red-500 animate-shake' : 'border-red-900'}`}
                placeholder="PASSCODE"
                autoFocus
              />
            </div>
            
            {error && <p className="text-xs text-red-500 font-bold uppercase tracking-widest animate-pulse">&gt;&gt; ACCESS DENIED &lt;&lt;</p>}

            <button
              type="submit"
              className="w-full py-3 mt-4 border border-red-800 text-red-800 hover:bg-red-500 hover:text-black hover:border-red-500 transition-all font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 group"
            >
              Authenticate <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-center space-y-1">
        <p className="text-[10px] text-red-900 uppercase tracking-[0.3em]">Secure Connection v1.0.3</p>
        <p className="text-[10px] text-red-950 uppercase">Unauthorized access is prohibited</p>
      </div>
    </div>
  );
};