
import React, { useState } from 'react';
import { ShieldCheck, KeyRound, AlertCircle, Loader2, HelpCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { TeamLeader } from '../types';

interface LoginProps {
  leaders: TeamLeader[];
  onLogin: (leader: TeamLeader) => void;
}

const Login: React.FC<LoginProps> = ({ leaders, onLogin }) => {
  const [serial, setSerial] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showHints, setShowHints] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    setTimeout(() => {
      const foundLeader = leaders.find(l => l.serialNumber === serial);
      if (foundLeader) {
        onLogin(foundLeader);
      } else {
        setError(true);
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-['Inter']">
      <div className="w-full max-w-md bg-white rounded-[4rem] shadow-2xl shadow-slate-200 border border-slate-100 p-12 relative overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>
        
        <div className="flex flex-col items-center text-center mb-12">
          <div className="p-5 bg-orange-600 rounded-[2rem] shadow-xl shadow-orange-100 mb-8 flex items-center justify-center">
            <Zap size={48} className="text-white fill-white" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-4">APTIV</h1>
          <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.3em]">Access Monitoring Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Supervisor Serial Number</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors">
                <KeyRound size={20} />
              </div>
              <input 
                type="password"
                required
                placeholder="••••"
                className={`w-full bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-100'} pl-14 pr-6 py-5 rounded-[1.5rem] outline-none focus:border-orange-600 font-black text-slate-900 text-center tracking-[0.5em] transition-all`}
                value={serial}
                onChange={(e) => { setSerial(e.target.value); setError(false); }}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest pl-4 mt-2 animate-in slide-in-from-top-1">
                <AlertCircle size={12} />
                <span>Invalid Serial. Authentication Failed.</span>
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-100 hover:bg-orange-600 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
            <span>Login to System</span>
          </button>
        </form>

        <div className="mt-8">
          <button 
            onClick={() => setShowHints(!showHints)}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-orange-600 transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <HelpCircle size={14} />
            <span>Show Default Codes</span>
            {showHints ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          {showHints && (
            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                {leaders.map(l => (
                  <div key={l.id} className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-500">{l.name}:</span>
                    <span className="text-orange-600 font-black tracking-widest">{l.serialNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed">
            Proprietary Information of APTIV PLC<br />Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
