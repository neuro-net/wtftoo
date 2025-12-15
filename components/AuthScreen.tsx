import React, { useState } from 'react';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Shield, ChevronRight, Terminal, AlertTriangle, Cpu, Globe } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!auth) throw new Error("Authentication module offline.");
      
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  if (!isFirebaseConfigured) {
     return (
        <div className="h-screen w-full bg-black flex flex-col items-center justify-center font-mono text-red-500 p-8 text-center space-y-4">
           <AlertTriangle size={64} className="animate-pulse" />
           <h1 className="text-3xl font-bold uppercase tracking-widest">System Configuration Error</h1>
           <p className="max-w-md">The cloud synchronization module (Firebase) has not been initialized. Please configure the environment variables in your deployment settings.</p>
           <div className="text-xs text-left bg-red-950/20 p-4 border border-red-900 mt-4 font-mono">
              <p>REQUIRED VARS:</p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                 <li>VITE_FIREBASE_API_KEY</li>
                 <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                 <li>VITE_FIREBASE_PROJECT_ID</li>
              </ul>
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
            <div className="p-4 rounded-full border-2 border-red-900 bg-black relative">
              <Globe size={48} className="text-red-700 animate-pulse" />
              <Shield size={24} className="text-red-500 absolute bottom-0 right-0 bg-black" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-red-500 tracking-[0.2em] mb-2">WTF_NETWORK</h1>
            <p className="text-xs text-red-800 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
               <Cpu size={12} /> Remote Neural Link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             {error && (
                <div className="border border-red-500 bg-red-900/20 p-2 text-xs text-red-500 font-bold uppercase tracking-wide flex items-center gap-2">
                   <AlertTriangle size={14} /> {error}
                </div>
             )}

            <div className="relative group text-left">
              <label className="text-[10px] text-red-800 uppercase font-bold pl-1">Identifier (Email)</label>
              <div className="absolute top-7 left-0 pl-3 flex items-center pointer-events-none">
                <Terminal size={16} className="text-red-600" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border-b-2 bg-transparent text-red-500 placeholder-red-900 focus:outline-none focus:border-red-500 transition-colors font-bold tracking-widest border-red-900"
                placeholder="USER@NET.SYS"
                required
              />
            </div>

            <div className="relative group text-left">
              <label className="text-[10px] text-red-800 uppercase font-bold pl-1">Secure Key (Password)</label>
              <div className="absolute top-7 left-0 pl-3 flex items-center pointer-events-none">
                <Shield size={16} className="text-red-600" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border-b-2 bg-transparent text-red-500 placeholder-red-900 focus:outline-none focus:border-red-500 transition-colors font-bold tracking-widest border-red-900"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-6 border border-red-800 text-red-800 hover:bg-red-500 hover:text-black hover:border-red-500 transition-all font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "ESTABLISHING LINK..." : (isLogin ? "INITIATE SESSION" : "REGISTER NEW UNIT")} 
              {!loading && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <button 
             onClick={() => { setIsLogin(!isLogin); setError(''); }}
             className="text-xs text-red-900 hover:text-red-500 uppercase tracking-widest underline decoration-red-900 hover:decoration-red-500 underline-offset-4 transition-colors"
          >
             {isLogin ? "Request New Designation Protocol (Register)" : "Return to Authentication (Login)"}
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-center space-y-1">
        <p className="text-[10px] text-red-900 uppercase tracking-[0.3em]">Encrypted Transmission v2.0</p>
      </div>
    </div>
  );
};