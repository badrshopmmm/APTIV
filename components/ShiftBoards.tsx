
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Zap,
  Save,
  MonitorPlay,
  AlertCircle,
  Mail,
  Power,
  PowerOff,
  X,
  Check,
  PlaneTakeoff,
  Octagon,
  FileText,
  CheckCheck,
  UserCircle,
  ChevronDown,
  Target,
  MessageSquare,
  Send
} from 'lucide-react';
import { ShiftType, TeamLeader, ProductionEntry, HourlyEntry, ProductionLine } from '../types';

interface ShiftBoardsProps {
  leaders: TeamLeader[];
  onSaveReport: (report: ProductionEntry) => void;
  onUpdateLeader: (leader: TeamLeader) => void;
}

const ShiftBoards: React.FC<ShiftBoardsProps> = ({ leaders, onSaveReport, onUpdateLeader }) => {
  const [activeShift, setActiveShift] = useState<ShiftType>(ShiftType.MORNING);
  const [strategicObjective, setStrategicObjective] = useState('');
  
  const [shiftLeaderAssignments, setShiftLeaderAssignments] = useState<Record<ShiftType, string>>({
    [ShiftType.MORNING]: leaders[0]?.id || '',
    [ShiftType.EVENING]: leaders[1]?.id || '',
    [ShiftType.NIGHT]: leaders[2]?.id || ''
  });

  const [isReportingStoppage, setIsReportingStoppage] = useState(false);

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

  const getLeaderForShift = (shift: ShiftType) => {
    const leaderId = shiftLeaderAssignments[shift];
    return leaders.find(l => l.id === leaderId) || leaders[0];
  };

  const calculateLineTotals = (shift: ShiftType, line: ProductionLine) => {
    const data = hourlyStates[shift][line];
    const actual = data.reduce((acc, cur) => acc + (Number(cur.actual) || 0), 0);
    const target = data.reduce((acc, cur) => acc + (Number(cur.target) || 0), 0);
    const rejects = data.reduce((acc, cur) => acc + (Number(cur.rejects) || 0), 0);
    const efficiency = target > 0 ? Math.round((actual / target) * 100) : 0;
    return { actual, target, rejects, efficiency };
  };

  const shareShiftAlertWhatsApp = (shift: ShiftType, line: ProductionLine) => {
    const leader = getLeaderForShift(shift);
    const totals = calculateLineTotals(shift, line);
    let message = `*🏭 SHIFT ALERT: ${line} - ${shift}*\n\n`;
    message += `👤 Supervisor: ${leader.name}\n`;
    message += `📊 Efficiency: ${totals.efficiency}%\n`;
    message += `📦 Output: ${totals.actual} units\n`;
    message += `🎯 Strategic Goal: ${strategicObjective || 'Steady Production'}\n\n`;
    message += `_Real-time update from APTIV ProTrack AI_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const saveLineReport = (shift: ShiftType, line: ProductionLine) => {
    const totals = calculateLineTotals(shift, line);
    const leader = getLeaderForShift(shift);
    const report: ProductionEntry = {
      id: `${Date.now()}-${shift}-${line}-${Math.random().toString(36).substr(2, 5)}`,
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
    if (confirm("Report Saved. Would you like to broadcast this line status to the management WhatsApp group?")) {
      shareShiftAlertWhatsApp(shift, line);
    }
  };

  const saveAllReports = () => {
    let savedCount = 0;
    Object.values(ShiftType).forEach(shift => {
      Object.values(ProductionLine).forEach(line => {
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
          efficiency: totals.efficiency
        };
        onSaveReport(report);
        savedCount++;
      });
    });
    alert(`${savedCount} full reports archived.`);
  };

  const currentLeader = getLeaderForShift(activeShift);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-2 h-8 bg-orange-600 rounded-full"></div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Field Command</h2>
          </div>
          <p className="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] pl-6">Line Operations Integrity Check</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <button 
            onClick={saveAllReports}
            className="flex items-center gap-3 bg-slate-900 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all"
          >
            <CheckCheck size={18} />
            <span>Force Archive All</span>
          </button>

          <div className="flex bg-slate-100 p-2 rounded-2xl border border-slate-200">
            {[ShiftType.MORNING, ShiftType.EVENING, ShiftType.NIGHT].map(s => (
              <button 
                key={s}
                onClick={() => setActiveShift(s)}
                className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeShift === s ? 'bg-white text-orange-600 shadow-md border border-orange-50' : 'text-slate-400'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 items-start">
        <div className="xl:col-span-1 sticky top-28 space-y-8">
          <div className="bg-white rounded-[3.5rem] border border-slate-100 p-8 shadow-sm flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-orange-50 shadow-xl mb-6 group relative">
              <img src={currentLeader.imageUrl} className={`w-full h-full object-cover transition-transform group-hover:scale-110 ${currentLeader.status === 'active' ? '' : 'grayscale'}`} alt="Leader" />
            </div>
            
            <div className="w-full space-y-4 mb-6 text-center">
               <span className="text-orange-600 text-[8px] font-black uppercase tracking-[0.3em] block mb-2">Active Shift Lead</span>
               <div className="relative">
                  <select 
                    value={shiftLeaderAssignments[activeShift]}
                    onChange={(e) => setShiftLeaderAssignments(prev => ({ ...prev, [activeShift]: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 pl-4 pr-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest appearance-none outline-none focus:border-orange-600 text-center cursor-pointer"
                  >
                    {leaders.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
            </div>

            <div className="flex gap-2">
               {currentLeader.status === 'active' ? (
                 <button className="flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-red-100">
                    <PowerOff size={14} /> Stop
                 </button>
               ) : (
                 <button className="flex items-center gap-2 bg-green-50 text-green-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-green-100">
                    <Power size={14} /> Resume
                 </button>
               )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl space-y-6">
             <div className="flex items-center gap-3">
                <Target size={20} className="text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Strategic Shift Objective</span>
             </div>
             <textarea 
               value={strategicObjective}
               onChange={(e) => setStrategicObjective(e.target.value)}
               placeholder="Enter focus area or shift goal..."
               className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-500 min-h-[100px]"
             />
             <button className="w-full bg-orange-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-700 transition-all">
                <Send size={16} /> Broadcast Goal
             </button>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-12">
          {[ProductionLine.LINE_1, ProductionLine.LINE_2, ProductionLine.LINE_3].map((line) => {
             const totals = calculateLineTotals(activeShift, line);
             return (
               <div key={line} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-50 text-orange-600 rounded-xl"><MonitorPlay size={20} /></div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{line}</h3>
                        <p className="text-orange-600 text-[8px] font-black uppercase mt-1">Live Telemetry Data</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8 flex-wrap justify-center">
                       <div className="text-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase block">Yield</span>
                          <span className="text-xl font-black text-slate-900">{totals.actual}</span>
                       </div>
                       <div className="text-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase block">Quota</span>
                          <span className="text-xl font-bold text-slate-400">{totals.target}</span>
                       </div>
                       <div className="text-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase block">Efficiency</span>
                          <span className={`text-xl font-black ${totals.efficiency >= 90 ? 'text-emerald-500' : 'text-orange-600'}`}>{totals.efficiency}%</span>
                       </div>
                       <button 
                         onClick={() => saveLineReport(activeShift, line)}
                         className="p-4 bg-orange-600 text-white rounded-xl transition-all shadow-lg hover:bg-slate-900"
                         title="Save & Alert Management"
                       >
                         <Save size={20} />
                       </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                          <th className="p-6 text-center w-20">H</th>
                          <th className="p-6 text-center w-32">Reference</th>
                          <th className="p-6 text-center w-24">Target</th>
                          <th className="p-6 text-center w-32">Actual</th>
                          <th className="p-6 text-center w-24">Rej</th>
                          <th className="p-6">Field Notes</th>
                          <th className="p-6 text-center w-20">OK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {hourlyStates[activeShift][line].map((entry, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-all">
                            <td className="p-6 text-center">
                              <span className="font-black text-[10px] text-slate-400">{idx + 1}</span>
                            </td>
                            <td className="p-6 text-center">
                                <input 
                                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-orange-500"
                                  placeholder="REF-XXXX"
                                  value={entry.reference}
                                  onChange={(e) => handleUpdateHour(activeShift, line, idx, 'reference', e.target.value)}
                                />
                            </td>
                            <td className="p-6 text-center">
                              <input 
                                type="number"
                                className="w-16 bg-white border border-slate-100 p-2 rounded-lg text-center font-black text-slate-400 focus:border-orange-500 outline-none"
                                value={entry.target || ''}
                                onChange={(e) => handleUpdateHour(activeShift, line, idx, 'target', parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-6 text-center">
                              <input 
                                type="number"
                                className="w-20 bg-white border border-slate-200 p-3 rounded-xl text-center font-black text-orange-600 focus:border-orange-600 outline-none"
                                value={entry.actual || ''}
                                onChange={(e) => handleUpdateHour(activeShift, line, idx, 'actual', parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-6 text-center">
                              <input 
                                type="number"
                                className="w-16 bg-white border border-slate-100 p-3 rounded-xl text-center font-black text-red-300 focus:border-red-500 outline-none"
                                value={entry.rejects || ''}
                                onChange={(e) => handleUpdateHour(activeShift, line, idx, 'rejects', parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-6">
                              <input 
                                className="w-full bg-slate-50 border border-slate-50 p-3 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-orange-100"
                                placeholder="..."
                                value={entry.note}
                                onChange={(e) => handleUpdateHour(activeShift, line, idx, 'note', e.target.value)}
                              />
                            </td>
                            <td className="p-6 text-center">
                              {entry.actual >= entry.target && entry.target > 0 ? (
                                <CheckCircle2 size={16} className="text-emerald-500 inline" />
                              ) : entry.actual > 0 ? (
                                <Zap size={16} className="text-orange-500 inline animate-pulse" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-slate-100 inline-block"></div>
                              )}
                            </td>
                          </tr>
                        ))}
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
