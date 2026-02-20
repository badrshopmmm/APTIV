
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Zap,
  Save,
  MonitorPlay,
  AlertCircle,
  ChevronDown,
  Target,
  Send,
  ShieldCheck,
  User,
  Share2,
  TrendingUp,
  BarChart3,
  BrainCircuit,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Target as TargetIcon,
  MessageSquare
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { ShiftType, TeamLeader, ProductionEntry, HourlyEntry, ProductionLine } from '../types';
import { analyzeProductionData } from '../services/geminiService';

interface ShiftBoardsProps {
  leaders: TeamLeader[];
  productionData: ProductionEntry[];
  onSaveReport: (report: ProductionEntry) => void;
  onUpdateLeader: (leader: TeamLeader) => void;
}

const ShiftBoards: React.FC<ShiftBoardsProps> = ({ leaders, productionData, onSaveReport, onUpdateLeader }) => {
  const [activeShift, setActiveShift] = useState<ShiftType>(ShiftType.MORNING);
  const [strategicObjective, setStrategicObjective] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({});
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  
  const [shiftLeaderAssignments, setShiftLeaderAssignments] = useState<Record<ShiftType, string>>({
    [ShiftType.MORNING]: leaders[0]?.id || '',
    [ShiftType.EVENING]: leaders[1]?.id || '',
    [ShiftType.NIGHT]: leaders[2]?.id || ''
  });

  useEffect(() => {
    setShiftLeaderAssignments(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(shift => {
        if (!leaders.find(l => l.id === next[shift as ShiftType])) {
           next[shift as ShiftType] = leaders[0]?.id || '';
        }
      });
      return next;
    });
  }, [leaders]);

  const createInitialData = () => Array.from({ length: 8 }, (_, i) => ({
    hour: i + 1,
    reference: '', 
    target: 70, 
    actual: 0,
    rejects: 0,
    note: ''
  }));

  const [hourlyStates, setHourlyStates] = useState<Record<ShiftType, Record<ProductionLine, HourlyEntry[]>>>({
    [ShiftType.MORNING]: {
      [ProductionLine.LINE_1]: createInitialData(),
      [ProductionLine.LINE_2]: createInitialData(),
      [ProductionLine.LINE_3]: createInitialData()
    },
    [ShiftType.EVENING]: {
      [ProductionLine.LINE_1]: createInitialData(),
      [ProductionLine.LINE_2]: createInitialData(),
      [ProductionLine.LINE_3]: createInitialData()
    },
    [ShiftType.NIGHT]: {
      [ProductionLine.LINE_1]: createInitialData(),
      [ProductionLine.LINE_2]: createInitialData(),
      [ProductionLine.LINE_3]: createInitialData()
    }
  });

  const handleUpdateHour = (shift: ShiftType, line: ProductionLine, hourIdx: number, field: keyof HourlyEntry, value: any) => {
    setHourlyStates(prev => ({
      ...prev,
      [shift]: {
        ...prev[shift],
        [line]: prev[shift][line].map((h, i) => i === hourIdx ? { ...h, [field]: value } : h)
      }
    }));
  };

  const calculateLineTotals = (shift: ShiftType, line: ProductionLine) => {
    const data = hourlyStates[shift][line];
    const actual = data.reduce((acc, cur) => acc + (Number(cur.actual) || 0), 0);
    const target = data.reduce((acc, cur) => acc + (Number(cur.target) || 0), 0);
    const rejects = data.reduce((acc, cur) => acc + (Number(cur.rejects) || 0), 0);
    const efficiency = target > 0 ? Math.round((actual / target) * 100) : 0;
    return { actual, target, rejects, efficiency, data };
  };

  const getLeaderForShift = (shift: ShiftType) => {
    const leaderId = shiftLeaderAssignments[shift];
    return leaders.find(l => l.id === leaderId) || leaders[0];
  };

  const currentLeader = getLeaderForShift(activeShift);

  const shiftTotals = useMemo(() => {
    const lines = [ProductionLine.LINE_1, ProductionLine.LINE_2, ProductionLine.LINE_3];
    let tActual = 0, tTarget = 0, tRejects = 0;
    lines.forEach(line => {
      const stats = calculateLineTotals(activeShift, line);
      tActual += stats.actual;
      tTarget += stats.target;
      tRejects += stats.rejects;
    });
    return {
      actual: tActual,
      target: tTarget,
      rejects: tRejects,
      efficiency: tTarget > 0 ? Math.round((tActual / tTarget) * 100) : 0
    };
  }, [hourlyStates, activeShift]);

  const handleAIAnalysis = async (line: ProductionLine) => {
    const lineData = calculateLineTotals(activeShift, line);
    const lineId = `${activeShift}-${line}`;
    setIsAnalyzing(prev => ({ ...prev, [lineId]: true }));
    
    try {
      const analysis = await analyzeProductionData(lineData.data, productionData);
      setAiInsights(prev => ({ ...prev, [lineId]: analysis || "تعذر التحليل حالياً." }));
    } catch (error) {
      setAiInsights(prev => ({ ...prev, [lineId]: "خطأ في الاتصال بنظام الذكاء الاصطناعي." }));
    } finally {
      setIsAnalyzing(prev => ({ ...prev, [lineId]: false }));
    }
  };

  const broadcastLineWhatsApp = (line: ProductionLine) => {
    const totals = calculateLineTotals(activeShift, line);
    const message = `*📊 تقرير أداء خط الإنتاج: ${line}*\n` +
                    `*👤 المشرف: ${currentLeader.name}*\n` +
                    `*⏰ الوردية: ${activeShift}*\n\n` +
                    `✅ الإنتاج: ${totals.actual} / ${totals.target}\n` +
                    `📈 الكفاءة: ${totals.efficiency}%\n` +
                    `❌ المرفوضات: ${totals.rejects}\n\n` +
                    `_تم الإرسال من منصة APTIV ProTrack AI_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const broadcastWholeShiftWhatsApp = () => {
    let message = `*📢 ملخص كفاءة المنشأة - وردية ${activeShift}*\n`;
    message += `*👤 المشرف العام: ${currentLeader.name}*\n`;
    message += `*📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}*\n`;
    message += `*📊 إجمالي الكفاءة: ${shiftTotals.efficiency}%*\n`;
    message += `----------------------------\n`;
    [ProductionLine.LINE_1, ProductionLine.LINE_2, ProductionLine.LINE_3].forEach(line => {
      const t = calculateLineTotals(activeShift, line);
      message += `*📍 ${line}:* ${t.actual}/${t.target} (${t.efficiency}%)\n`;
    });
    message += `----------------------------\n`;
    if (strategicObjective) message += `*💡 التوجيه:* ${strategicObjective}\n`;
    message += `\n_نظام APTIV ProTrack AI الذكي_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const saveLineReport = (shift: ShiftType, line: ProductionLine) => {
    const totals = calculateLineTotals(shift, line);
    const leader = getLeaderForShift(shift);
    const report: ProductionEntry = {
      id: `${Date.now()}-${shift}-${line}`,
      shift,
      date: new Date().toISOString().split('T')[0],
      lineId: line,
      leaderId: leader.id,
      hourlyData: [...hourlyStates[shift][line]],
      totalOutput: totals.actual,
      totalTarget: totals.target,
      totalRejects: totals.rejects,
      efficiency: totals.efficiency,
      downtimeReason: strategicObjective
    };
    onSaveReport(report);
    alert(`Report for ${line} archived successfully.`);
  };

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-1000">
      {/* Facility Dashboard Header */}
      <div className="bg-slate-900 rounded-3xl md:rounded-[3.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden no-print">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(249,115,22,0.15),transparent)]"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-10">
          <div className="text-center lg:text-right flex-1 w-full">
             <div className="flex flex-col md:flex-row items-center justify-center lg:justify-end gap-4 md:gap-5 mb-4">
                <div className="order-2 md:order-1">
                   <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none">Industrial Control</h2>
                   <p className="text-orange-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mt-2">Facility-Wide Performance Matrix</p>
                </div>
                <div className="order-1 md:order-2 p-4 md:p-5 bg-orange-600 rounded-2xl md:rounded-3xl shadow-xl shadow-orange-900/50">
                   <MonitorPlay size={24} className="md:w-8 md:h-8" />
                </div>
             </div>
             
             <div className="flex flex-wrap justify-center lg:justify-end gap-2 md:gap-3 mt-4 md:mt-8">
               {[ShiftType.MORNING, ShiftType.EVENING, ShiftType.NIGHT].map(s => (
                 <button 
                   key={s}
                   onClick={() => setActiveShift(s)}
                   className={`px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-widest transition-all ${activeShift === s ? 'bg-orange-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                 >
                   {s}
                 </button>
               ))}
             </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-6">
             <div className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-[2rem] text-center">
                <p className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Efficiency</p>
                <p className={`text-xl md:text-4xl font-black ${shiftTotals.efficiency >= 90 ? 'text-emerald-500' : 'text-orange-500'}`}>{shiftTotals.efficiency}%</p>
             </div>
             <div className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-[2rem] text-center">
                <p className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Output</p>
                <p className="text-xl md:text-4xl font-black text-white">{shiftTotals.actual}</p>
             </div>
             <div className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-[2rem] text-center">
                <p className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Force</p>
                <p className="text-xl md:text-4xl font-black text-white">{shiftTotals.target}</p>
             </div>
             <div className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-[2rem] text-center">
                <p className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Defect Rate</p>
                <p className="text-xl md:text-4xl font-black text-rose-500">{shiftTotals.rejects}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10 items-start">
        {/* Supervisor Command Hub */}
        <div className="lg:col-span-1 space-y-6 md:space-y-8 no-print lg:sticky lg:top-28">
          <div className="bg-white rounded-3xl md:rounded-[3.5rem] border border-slate-200 p-6 md:p-10 shadow-sm flex flex-col items-center text-center group">
            <div className="relative mb-6 md:mb-10">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl md:rounded-[3rem] overflow-hidden border-4 border-slate-50 shadow-2xl relative z-10">
                <img src={currentLeader.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Supervisor" />
              </div>
              <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 p-3 md:p-5 bg-slate-900 text-white rounded-xl md:rounded-[1.5rem] shadow-xl z-20 border-4 border-white">
                <ShieldCheck size={20} className="md:w-7 md:h-7" />
              </div>
            </div>
            
            <div className="w-full space-y-4 md:space-y-6">
               <div>
                  <span className="text-orange-600 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] block mb-2">Commanding Officer</span>
                  <div className="relative">
                    <select 
                      value={shiftLeaderAssignments[activeShift]}
                      onChange={(e) => setShiftLeaderAssignments(prev => ({ ...prev, [activeShift]: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest appearance-none outline-none focus:border-orange-600 text-center cursor-pointer shadow-inner pr-10"
                    >
                      {leaders.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
               </div>
               
               <div className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Status</p>
                  <div className="flex items-center justify-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="font-bold text-[10px] md:text-base text-slate-900">SYSTEMS READY</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl md:rounded-[3rem] p-6 md:p-10 text-white shadow-2xl space-y-4 md:space-y-6">
             <div className="flex items-center justify-center lg:justify-end gap-3">
                <span className="text-base md:text-lg font-black uppercase tracking-tighter">Shift Objectives</span>
                <TargetIcon size={20} className="text-orange-500 md:w-6 md:h-6" />
             </div>
             <textarea 
               value={strategicObjective}
               onChange={(e) => setStrategicObjective(e.target.value)}
               placeholder="Enter mission objectives..."
               className="w-full bg-white/5 border border-white/10 p-4 md:p-5 rounded-2xl md:rounded-3xl text-xs md:text-sm font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-600 min-h-[100px] md:min-h-[140px] text-right"
             />
             <button onClick={broadcastWholeShiftWhatsApp} className="w-full bg-orange-600 text-white py-4 md:py-5 rounded-xl md:rounded-[1.5rem] font-black text-[9px] md:text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-700 transition-all shadow-xl shadow-orange-950/20 active:scale-95">
                <Share2 size={16} className="md:w-[18px] md:h-[18px]" />
                <span>Broadcast Shift Matrix</span>
             </button>
          </div>
        </div>

        {/* Lines Matrix Cockpits */}
        <div className="lg:col-span-3 space-y-8 md:space-y-12">
          {[ProductionLine.LINE_1, ProductionLine.LINE_2, ProductionLine.LINE_3].map((line) => {
             const totals = calculateLineTotals(activeShift, line);
             const lineId = `${activeShift}-${line}`;
             
             const chartData = totals.data.map(h => ({
               hour: `H${h.hour}`,
               actual: h.actual,
               target: h.target,
               rejects: h.rejects
             }));

             return (
               <div key={line} className="bg-white rounded-3xl md:rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden group/line transition-all hover:shadow-2xl">
                  {/* Line Master Header */}
                  <div className="p-6 md:p-10 border-b border-slate-100 bg-slate-50/20 flex flex-col md:flex-row justify-between items-start gap-6 md:gap-10">
                    <div className="flex items-center gap-4 md:gap-8">
                       <div className="p-4 md:p-6 bg-slate-900 text-white rounded-2xl md:rounded-[2rem] shadow-xl group-hover/line:rotate-6 transition-transform">
                          <MonitorPlay size={24} className="md:w-8 md:h-8" />
                       </div>
                       <div className="text-right">
                          <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{line}</h3>
                          <p className="text-orange-600 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] mt-2">Active Production Node</p>
                       </div>
                    </div>

                    <div className="flex-1 w-full max-w-md">
                       <div className="flex justify-between items-end mb-4">
                          <div className="text-right">
                             <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Rating</p>
                             <p className={`text-2xl md:text-4xl font-black tracking-tighter ${totals.efficiency >= 90 ? 'text-emerald-500' : 'text-orange-600'}`}>
                                {totals.efficiency}%
                             </p>
                          </div>
                          <div className="flex gap-2 md:gap-4">
                             <button onClick={() => saveLineReport(activeShift, line)} className="p-3 md:p-4 bg-slate-900 text-white rounded-xl md:rounded-2xl shadow-lg hover:bg-orange-600 transition-all" title="Archive Report"><Save size={18} className="md:w-5 md:h-5" /></button>
                             <button onClick={() => broadcastLineWhatsApp(line)} className="p-3 md:p-4 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl shadow-sm border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"><MessageSquare size={18} className="md:w-5 md:h-5" /></button>
                          </div>
                       </div>
                       <div className="w-full h-2 md:h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                             className={`h-full transition-all duration-1000 ${totals.efficiency >= 90 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'}`} 
                             style={{ width: `${Math.min(totals.efficiency, 100)}%` }}
                          ></div>
                       </div>
                    </div>
                  </div>

                  {/* Line Intelligence Area */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 border-b border-slate-100 bg-white">
                     {/* Data Visualization */}
                     <div className="lg:col-span-2 p-6 md:p-10 h-48 md:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={chartData}>
                              <defs>
                                 <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 700}} />
                              <Tooltip 
                                 contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '8px', fontWeight: 900}} 
                              />
                              <Area type="monotone" dataKey="actual" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                              <Area type="monotone" dataKey="target" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="5 5" fill="none" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>

                     {/* AI Insight Engine */}
                     <div className="p-6 md:p-10 bg-slate-50/50 relative group">
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                           <div className="flex items-center gap-3">
                              <BrainCircuit size={18} className="text-indigo-600 md:w-5 md:h-5" />
                              <span className="text-[8px] md:text-[10px] font-black text-slate-900 uppercase tracking-widest">AI Performance Log</span>
                           </div>
                           <button 
                              onClick={() => handleAIAnalysis(line)}
                              disabled={isAnalyzing[lineId]}
                              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-slate-900 transition-all disabled:opacity-50"
                           >
                              {isAnalyzing[lineId] ? <Loader2 size={12} className="animate-spin" /> : <TrendingUp size={12} />}
                           </button>
                        </div>
                        
                        <div className="h-[100px] md:h-[120px] overflow-y-auto custom-scrollbar text-right">
                           {aiInsights[lineId] ? (
                              <p className="text-[10px] md:text-[11px] font-bold text-slate-600 leading-relaxed italic">{aiInsights[lineId]}</p>
                           ) : (
                              <div className="flex flex-col items-center justify-center h-full opacity-30">
                                 <Zap size={20} className="mb-2 md:w-6 md:h-6" />
                                 <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Awaiting Analysis...</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Operational Matrix */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                          <th className="p-4 md:p-6 text-center w-16 md:w-24">HOUR</th>
                          <th className="p-4 md:p-6 text-center">REFERENCE ID</th>
                          <th className="p-4 md:p-6 text-center w-20 md:w-28">TARGET</th>
                          <th className="p-4 md:p-6 text-center w-28 md:w-36">ACTUAL</th>
                          <th className="p-4 md:p-6 text-center w-20 md:w-28">SCRAP</th>
                          <th className="p-4 md:p-6 text-right">OPERATIONAL NOTES</th>
                          <th className="p-4 md:p-6 text-center w-16 md:w-24">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {hourlyStates[activeShift][line].map((entry, idx) => {
                          const isWarning = entry.actual > 0 && entry.actual < entry.target;
                          return (
                            <tr key={idx} className={`group/row transition-all ${isWarning ? 'bg-orange-50/20' : 'hover:bg-slate-50/40'}`}>
                              <td className="p-4 md:p-6 text-center">
                                <span className="font-black text-xs md:text-sm text-slate-200 group-hover/row:text-orange-500">{idx + 1}</span>
                              </td>
                              <td className="p-4 md:p-6 text-center">
                                  <input 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 text-[9px] md:text-[11px] font-black uppercase outline-none focus:bg-white focus:border-orange-500 transition-all text-center"
                                    placeholder="REF-OPER"
                                    value={entry.reference}
                                    onChange={(e) => handleUpdateHour(activeShift, line, idx, 'reference', e.target.value)}
                                  />
                              </td>
                              <td className="p-4 md:p-6 text-center">
                                <input 
                                  type="number"
                                  className="w-16 md:w-20 bg-transparent border-b-2 border-slate-100 p-1 md:p-2 text-center font-black text-[10px] md:text-base text-slate-400 focus:border-orange-500 outline-none"
                                  value={entry.target || ''}
                                  onChange={(e) => handleUpdateHour(activeShift, line, idx, 'target', parseInt(e.target.value) || 0)}
                                />
                              </td>
                              <td className="p-4 md:p-6 text-center">
                                <input 
                                  type="number"
                                  className={`w-20 md:w-28 bg-white border-2 p-2 md:p-4 rounded-xl md:rounded-2xl text-center font-black text-base md:text-xl outline-none shadow-sm transition-all ${isWarning ? 'border-orange-500 text-orange-600' : 'border-slate-100 text-slate-900 focus:border-slate-900'}`}
                                  value={entry.actual || ''}
                                  onChange={(e) => handleUpdateHour(activeShift, line, idx, 'actual', parseInt(e.target.value) || 0)}
                                />
                              </td>
                              <td className="p-4 md:p-6 text-center">
                                <input 
                                  type="number"
                                  className="w-16 md:w-20 bg-transparent border-b-2 border-slate-100 p-1 md:p-2 text-center font-black text-[10px] md:text-base text-rose-300 focus:border-rose-500 outline-none"
                                  value={entry.rejects || ''}
                                  onChange={(e) => handleUpdateHour(activeShift, line, idx, 'rejects', parseInt(e.target.value) || 0)}
                                />
                              </td>
                              <td className="p-4 md:p-6">
                                <input 
                                  className="w-full bg-transparent border border-transparent p-2 md:p-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold outline-none focus:bg-slate-50 focus:border-slate-200 text-right"
                                  placeholder="Observation..."
                                  value={entry.note}
                                  onChange={(e) => handleUpdateHour(activeShift, line, idx, 'note', e.target.value)}
                                />
                              </td>
                              <td className="p-4 md:p-6 text-center">
                                {entry.actual >= entry.target && entry.target > 0 ? (
                                  <div className="p-2 md:p-2.5 bg-emerald-50 text-emerald-500 rounded-full inline-block border border-emerald-100"><CheckCircle2 size={16} className="md:w-5 md:h-5" /></div>
                                ) : isWarning ? (
                                  <div className="p-2 md:p-2.5 bg-orange-50 text-orange-500 rounded-full inline-block border border-orange-100 animate-pulse"><AlertTriangle size={16} className="md:w-5 md:h-5" /></div>
                                ) : entry.actual > 0 ? (
                                  <div className="p-2 md:p-2.5 bg-slate-900 text-white rounded-full inline-block"><Clock size={16} className="md:w-5 md:h-5" /></div>
                                ) : (
                                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-4 border-slate-50 inline-block"></div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShiftBoards;
