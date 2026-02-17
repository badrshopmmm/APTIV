
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, 
  X, 
  Power, 
  PowerOff,
  Settings2,
  Loader2,
  PlaneTakeoff,
  Octagon,
  Edit2,
  UserCircle,
  Globe,
  Phone,
  UserPlus,
  Mail,
  ShieldCheck,
  KeyRound,
  TrendingUp,
  Award,
  Filter,
  ArrowUpDown,
  BarChart3,
  Star,
  Activity,
  History,
  Target,
  Sparkles,
  Upload,
  Calendar
} from 'lucide-react';
import { TeamLeader, ProductionEntry } from '../types';
import { editLeaderImage } from '../services/geminiService';

interface TeamLeadersProps {
  leaders: TeamLeader[];
  productionData: ProductionEntry[];
  onUpdate: (leader: TeamLeader) => void;
  onAddLeader: (leader: TeamLeader) => void;
}

const TeamLeaders: React.FC<TeamLeadersProps> = ({ leaders, productionData, onUpdate, onAddLeader }) => {
  const [editingLeader, setEditingLeader] = useState<TeamLeader | null>(null);
  const [isAddingLeader, setIsAddingLeader] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<TeamLeader>>({});
  const [newLeaderForm, setNewLeaderForm] = useState<Partial<TeamLeader>>({
    name: '',
    role: '',
    email: '',
    whatsapp: '',
    serialNumber: '',
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop'
  });
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'cards' | 'performance'>('cards');
  const [performanceSortField, setPerformanceSortField] = useState<'name' | 'shifts' | 'efficiency' | 'rating'>('efficiency');
  const [performanceSortOrder, setPerformanceSortOrder] = useState<'asc' | 'desc'>('desc');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editModalFileInputRef = useRef<HTMLInputElement>(null);
  const addModalFileInputRef = useRef<HTMLInputElement>(null);
  const [activeLeaderForImage, setActiveLeaderForImage] = useState<TeamLeader | null>(null);
  
  const [isReportingStoppage, setIsReportingStoppage] = useState<string | null>(null);
  const [stoppageForm, setStoppageForm] = useState<{
    reason: string;
    returnDate: string;
    type: 'on_leave' | 'stopped';
  }>({ reason: 'Annual Leave', returnDate: '', type: 'on_leave' });

  // Auto-reactivation logic
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    leaders.forEach(leader => {
      if (leader.status !== 'active' && leader.returnDate && leader.returnDate <= today) {
        onUpdate({ 
          ...leader, 
          status: 'active', 
          stoppageReason: '', 
          returnDate: '' 
        });
      }
    });
  }, [leaders, onUpdate]);

  const leaderMetrics = useMemo(() => {
    return leaders.map(l => {
      const leaderReports = productionData.filter(p => p.leaderId === l.id);
      const totalShifts = leaderReports.length;
      const avgEff = totalShifts > 0 
        ? Math.round(leaderReports.reduce((acc, curr) => acc + curr.efficiency, 0) / totalShifts) 
        : 0;
      
      const baseRating = totalShifts > 0 ? (avgEff / 25) + (totalShifts / 50) : 0;
      const finalRating = Math.min(Math.max(baseRating, 0), 5).toFixed(1);

      return {
        id: l.id,
        shiftsCompleted: totalShifts,
        avgEfficiency: avgEff,
        rating: parseFloat(finalRating)
      };
    });
  }, [leaders, productionData]);

  const sortedLeaders = useMemo(() => {
    let result = leaders.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeView === 'performance') {
      result.sort((a, b) => {
        const metA = leaderMetrics.find(m => m.id === a.id)!;
        const metB = leaderMetrics.find(m => m.id === b.id)!;
        
        let valA, valB;
        if (performanceSortField === 'name') {
          valA = a.name; valB = b.name;
          return performanceSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else if (performanceSortField === 'shifts') {
          valA = metA.shiftsCompleted; valB = metB.shiftsCompleted;
        } else if (performanceSortField === 'efficiency') {
          valA = metA.avgEfficiency; valB = metB.avgEfficiency;
        } else {
          valA = metA.rating; valB = metB.rating;
        }
        
        return performanceSortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [leaders, searchTerm, activeView, performanceSortField, performanceSortOrder, leaderMetrics]);

  const triggerFileInput = (leader: TeamLeader) => {
    setActiveLeaderForImage(leader);
    fileInputRef.current?.click();
  };

  const openEditModal = (leader: TeamLeader) => {
    setEditingLeader(leader);
    setEditFormData({ ...leader });
  };

  const handleSaveEdit = () => {
    if (editingLeader && editFormData.name && editFormData.serialNumber) {
      onUpdate({ ...editingLeader, ...editFormData as TeamLeader });
      setEditingLeader(null);
    }
  };

  const handleAddNewLeader = () => {
    if (newLeaderForm.name && newLeaderForm.role && newLeaderForm.serialNumber) {
      const newLeader: TeamLeader = {
        ...newLeaderForm as TeamLeader,
        id: `l-${Date.now()}`
      };
      onAddLeader(newLeader);
      setIsAddingLeader(false);
      setNewLeaderForm({
        name: '',
        role: '',
        email: '',
        whatsapp: '',
        serialNumber: '',
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop'
      });
    }
  };

  const handleStoppageSubmit = () => {
    const leaderToSuspend = leaders.find(l => l.id === isReportingStoppage);
    if (leaderToSuspend) {
      onUpdate({
        ...leaderToSuspend,
        status: stoppageForm.type,
        stoppageReason: stoppageForm.reason,
        returnDate: stoppageForm.returnDate
      });
      setIsReportingStoppage(null);
      setStoppageForm({ reason: 'Annual Leave', returnDate: '', type: 'on_leave' });
    }
  };

  const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'edit' | 'add') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        if (target === 'edit') setEditFormData({ ...editFormData, imageUrl: base64 });
        else setNewLeaderForm({ ...newLeaderForm, imageUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'active': return { label: 'Active', textColor: 'text-green-600', borderColor: 'border-green-100', bgColor: 'bg-green-50' };
      case 'on_leave': return { label: 'On Leave', textColor: 'text-amber-600', borderColor: 'border-amber-100', bgColor: 'bg-amber-50' };
      case 'stopped': return { label: 'Suspended', textColor: 'text-red-500', borderColor: 'border-red-100', bgColor: 'bg-red-50' };
      default: return { label: 'Undefined', textColor: 'text-slate-400', borderColor: 'border-slate-100', bgColor: 'bg-slate-50' };
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeLeaderForImage) {
      if (!window.confirm("Replace profile photo? AI will automatically enhance the new portrait.")) {
        e.target.value = '';
        return;
      }
      setProcessingId(activeLeaderForImage.id);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const enhancedImage = await editLeaderImage(base64, "Professional portrait for a corporate team leader");
          onUpdate({ ...activeLeaderForImage, imageUrl: enhancedImage || base64 });
        } catch (error) {
          onUpdate({ ...activeLeaderForImage, imageUrl: base64 });
        } finally {
          setProcessingId(null);
          setActiveLeaderForImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSort = (field: 'name' | 'shifts' | 'efficiency' | 'rating') => {
    if (performanceSortField === field) {
      setPerformanceSortOrder(performanceSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setPerformanceSortField(field);
      setPerformanceSortOrder('desc');
    }
  };

  const stoppageReasons = [
    "Annual Leave",
    "Sick Leave",
    "Parental Leave",
    "Unpaid Leave",
    "Administrative Suspension",
    "Disciplinary Action",
    "Training/Conference",
    "Medical Emergency",
    "Other"
  ];

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700 font-['Inter']">
      <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
      <input type="file" ref={editModalFileInputRef} onChange={(e) => handleManualImageUpload(e, 'edit')} className="hidden" accept="image/*" />
      <input type="file" ref={addModalFileInputRef} onChange={(e) => handleManualImageUpload(e, 'add')} className="hidden" accept="image/*" />
      
      <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
           <div className="p-5 bg-orange-500 text-white rounded-3xl shadow-xl shadow-orange-100">
              <ShieldCheck size={32} />
           </div>
           <div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Supervisor Management</h2>
             <p className="text-orange-600 text-[9px] font-black uppercase tracking-[0.4em] mt-2">Team Leadership Performance Console</p>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setActiveView('cards')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'cards' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}
            >
              Cards
            </button>
            <button 
              onClick={() => setActiveView('performance')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'performance' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}
            >
              Performance
            </button>
          </div>
          <div className="relative group hidden sm:block">
            <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="text" 
              placeholder="Search supervisor..." 
              className="bg-slate-50 border border-slate-100 pl-10 pr-4 py-3 rounded-xl text-xs font-bold focus:border-orange-500 outline-none w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAddingLeader(true)}
            className="bg-slate-900 hover:bg-orange-500 text-white px-10 py-5 rounded-[1.5rem] flex items-center gap-4 font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-slate-100"
          >
            <UserPlus size={18} />
            <span>New Supervisor</span>
          </button>
        </div>
      </div>

      {activeView === 'performance' ? (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">
           <div className="p-10 border-b border-slate-50 flex justify-between items-center">
              <div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-1">Performance Dashboard</h3>
                 <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Leaderboard & Efficiency Analytics</p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                    <History size={16} className="text-orange-500" />
                    <span className="text-xs font-black text-slate-600 uppercase">Total Shifts: {productionData.length}</span>
                 </div>
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                       <th className="p-8 cursor-pointer hover:text-orange-500 transition-colors" onClick={() => handleSort('name')}>
                          Supervisor <ArrowUpDown size={12} className="inline ml-1" />
                       </th>
                       <th className="p-8 text-center cursor-pointer hover:text-orange-500 transition-colors" onClick={() => handleSort('shifts')}>
                          Completed Shifts <ArrowUpDown size={12} className="inline ml-1" />
                       </th>
                       <th className="p-8 text-center cursor-pointer hover:text-orange-500 transition-colors" onClick={() => handleSort('efficiency')}>
                          Avg. Efficiency <ArrowUpDown size={12} className="inline ml-1" />
                       </th>
                       <th className="p-8 text-center cursor-pointer hover:text-orange-500 transition-colors" onClick={() => handleSort('rating')}>
                          Rating <ArrowUpDown size={12} className="inline ml-1" />
                       </th>
                       <th className="p-8 text-center">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {sortedLeaders.map((leader) => {
                       const metrics = leaderMetrics.find(m => m.id === leader.id)!;
                       return (
                          <tr key={leader.id} className="hover:bg-slate-50/50 transition-all group">
                             <td className="p-8">
                                <div className="flex items-center gap-5">
                                   <div className="relative">
                                      <img src={leader.imageUrl} className={`w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm ${processingId === leader.id ? 'opacity-30 blur-[2px]' : ''}`} />
                                      {processingId === leader.id && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <Loader2 size={16} className="text-orange-500 animate-spin" />
                                        </div>
                                      )}
                                   </div>
                                   <div>
                                      <p className="font-black text-slate-900 text-sm tracking-tight">{leader.name}</p>
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{leader.role}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="p-8 text-center">
                                <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl">
                                   <Activity size={14} className="text-slate-400" />
                                   <span className="font-black text-slate-900">{metrics.shiftsCompleted}</span>
                                </div>
                             </td>
                             <td className="p-8 text-center">
                                <div className="w-full max-w-[120px] mx-auto space-y-2">
                                   <div className="flex justify-between items-center text-[9px] font-black uppercase">
                                      <span className={metrics.avgEfficiency >= 90 ? 'text-green-500' : 'text-orange-500'}>{metrics.avgEfficiency}%</span>
                                      <span className="text-slate-300">Goal</span>
                                   </div>
                                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full transition-all duration-1000 ${metrics.avgEfficiency >= 90 ? 'bg-green-500' : 'bg-orange-500'}`} 
                                        style={{ width: `${metrics.avgEfficiency}%` }}
                                      ></div>
                                   </div>
                                </div>
                             </td>
                             <td className="p-8 text-center">
                                <div className="flex items-center justify-center gap-1 text-amber-500">
                                   <Star size={16} fill="currentColor" />
                                   <span className="font-black text-slate-900 text-lg">{metrics.rating}</span>
                                </div>
                             </td>
                             <td className="p-8 text-center">
                                <button 
                                  onClick={() => openEditModal(leader)}
                                  className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                >
                                   <Settings2 size={18} />
                                </button>
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
          {sortedLeaders.map((leader) => {
            const statusConfig = getStatusConfig(leader.status);
            const metrics = leaderMetrics.find(m => m.id === leader.id)!;
            return (
              <div key={leader.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-2xl group/card relative">
                <div className="p-10 pb-6 flex flex-col items-center text-center relative">
                  <button onClick={() => openEditModal(leader)} className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-orange-500 hover:text-white transition-all opacity-0 group-hover/card:opacity-100 shadow-sm">
                    <Edit2 size={16} />
                  </button>
                  <div className="relative mb-6">
                    <div className={`w-32 h-32 rounded-full p-1 border-2 ${statusConfig.borderColor} relative shadow-xl overflow-hidden`}>
                      <img src={leader.imageUrl} alt={leader.name} className="w-full h-full object-cover rounded-full group-hover/card:scale-110 transition-all duration-500" />
                    </div>
                    <button onClick={() => triggerFileInput(leader)} className="absolute bottom-1 right-1 p-2.5 bg-white border border-slate-100 text-slate-400 rounded-xl shadow-xl hover:bg-orange-500 hover:text-white transition-all">
                      <Camera size={14} />
                    </button>
                  </div>
                  <div className={`inline-flex px-4 py-1.5 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} text-[9px] font-black uppercase tracking-widest mb-3 border ${statusConfig.borderColor}`}>
                    {statusConfig.label}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">{leader.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{leader.role}</p>
                  <div className="w-full grid grid-cols-3 gap-2 mt-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                     <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Shifts</span>
                        <span className="text-sm font-black text-slate-900">{metrics.shiftsCompleted}</span>
                     </div>
                     <div className="flex flex-col items-center border-x border-slate-200">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Eff %</span>
                        <span className={`text-sm font-black ${metrics.avgEfficiency >= 90 ? 'text-green-500' : 'text-orange-500'}`}>{metrics.avgEfficiency}%</span>
                     </div>
                     <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Rank</span>
                        <div className="flex items-center gap-1">
                          <Star size={10} className="text-amber-500" fill="currentColor" />
                          <span className="text-sm font-black text-slate-900">{metrics.rating}</span>
                        </div>
                     </div>
                  </div>
                </div>
                <div className="px-10 py-6 border-t border-slate-50 mt-auto flex flex-col gap-3">
                   <button onClick={() => openEditModal(leader)} className="w-full bg-slate-50 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-3">
                     <Settings2 size={16} /> Edit Supervisor
                   </button>
                   {leader.status === 'active' ? (
                     <button onClick={() => setIsReportingStoppage(leader.id)} className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3">
                       <PowerOff size={16} /> Suspend Leader
                     </button>
                   ) : (
                     <button onClick={() => onUpdate({ ...leader, status: 'active', stoppageReason: '', returnDate: '' })} className="w-full bg-green-50 text-green-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-3">
                       <Power size={16} /> Activate Leader
                     </button>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stoppage Modal */}
      {isReportingStoppage && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsReportingStoppage(null)}></div>
           <div className="bg-white w-full max-w-lg rounded-[4rem] border border-slate-100 p-12 relative z-10 animate-in zoom-in-95 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Suspend Operations</h2>
                 <button onClick={() => setIsReportingStoppage(null)} className="p-4 bg-slate-100 text-slate-400 rounded-3xl hover:text-red-500 transition-all"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Suspension Type</label>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                      <button 
                        onClick={() => setStoppageForm({...stoppageForm, type: 'on_leave'})}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${stoppageForm.type === 'on_leave' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}
                      >
                        Leave
                      </button>
                      <button 
                        onClick={() => setStoppageForm({...stoppageForm, type: 'stopped'})}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${stoppageForm.type === 'stopped' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400'}`}
                      >
                        Suspended
                      </button>
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Reason for Stoppage</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 px-6 py-5 rounded-[1.5rem] outline-none font-bold appearance-none cursor-pointer focus:border-orange-500"
                      value={stoppageForm.reason}
                      onChange={(e) => setStoppageForm({...stoppageForm, reason: e.target.value})}
                    >
                      {stoppageReasons.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Expected Return Date</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                      <input 
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 pl-16 pr-6 py-5 rounded-[1.5rem] outline-none font-black text-slate-900 focus:border-orange-600"
                        value={stoppageForm.returnDate}
                        onChange={(e) => setStoppageForm({...stoppageForm, returnDate: e.target.value})}
                      />
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-4 mt-2">Leader will automatically reactivate after this date.</p>
                 </div>

                 <button 
                   onClick={handleStoppageSubmit} 
                   className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all mt-4 ${stoppageForm.type === 'stopped' ? 'bg-rose-600 hover:bg-slate-900' : 'bg-orange-500 hover:bg-slate-900'} text-white`}
                 >
                   Confirm Stoppage
                 </button>
              </div>
           </div>
        </div>
      )}

      {editingLeader && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setEditingLeader(null)}></div>
           <div className="bg-white w-full max-w-lg rounded-[4rem] border border-slate-100 p-12 relative z-10 animate-in zoom-in-95 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Edit Supervisor</h2>
                 <button onClick={() => setEditingLeader(null)} className="p-4 bg-slate-100 text-slate-400 rounded-3xl hover:text-red-500 transition-all"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                 <div className="flex items-center gap-6 mb-4">
                   <img src={editFormData.imageUrl} className="w-20 h-20 rounded-2xl object-cover border border-slate-100 shadow-sm" alt="Preview" />
                   <button 
                     onClick={() => editModalFileInputRef.current?.click()}
                     className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase hover:bg-orange-500 hover:text-white transition-all"
                   >
                     <Upload size={14} />
                     <span>Change Photo</span>
                   </button>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Full Name</label>
                    <input className="w-full bg-slate-50 border border-slate-200 px-6 py-5 rounded-[1.5rem] outline-none font-bold" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Serial Code (Access)</label>
                    <input className="w-full bg-slate-50 border border-slate-200 px-6 py-5 rounded-[1.5rem] outline-none font-black tracking-widest" value={editFormData.serialNumber} onChange={(e) => setEditFormData({...editFormData, serialNumber: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Shift / Responsibility</label>
                    <input className="w-full bg-slate-50 border border-slate-200 px-6 py-5 rounded-[1.5rem] outline-none font-bold" value={editFormData.role} onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Photo URL (Manual Override)</label>
                    <input className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-xl font-bold" value={editFormData.imageUrl} onChange={(e) => setEditFormData({...editFormData, imageUrl: e.target.value})} />
                 </div>
                 <button onClick={handleSaveEdit} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all mt-4 hover:bg-orange-500">Update Profile</button>
              </div>
           </div>
        </div>
      )}

      {isAddingLeader && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsAddingLeader(false)}></div>
           <div className="bg-white w-full max-w-lg rounded-[4rem] border border-slate-100 p-12 relative z-10 animate-in zoom-in-95 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black text-slate-900 uppercase">New Supervisor</h2>
                 <button onClick={() => setIsAddingLeader(false)} className="p-4 bg-slate-100 text-slate-400 rounded-3xl hover:text-red-500 transition-all"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                 <div className="flex flex-col items-center gap-4 mb-4">
                   <img src={newLeaderForm.imageUrl} className="w-24 h-24 rounded-3xl object-cover border border-slate-100 shadow-md" alt="Preview" />
                   <button 
                     onClick={() => addModalFileInputRef.current?.click()}
                     className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-orange-500 transition-all shadow-lg"
                   >
                     <Camera size={16} />
                     <span>Upload Photo</span>
                   </button>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Full Name</label>
                    <input className="w-full bg-slate-50 border border-slate-200 px-6 py-5 rounded-[1.5rem] outline-none font-bold" placeholder="e.g. John Doe" value={newLeaderForm.name} onChange={(e) => setNewLeaderForm({...newLeaderForm, name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Serial Number (Access Code)</label>
                    <input className="w-full bg-slate-50 border border-slate-200 px-6 py-5 rounded-[1.5rem] outline-none font-black tracking-widest" placeholder="4 characters" value={newLeaderForm.serialNumber} onChange={(e) => setNewLeaderForm({...newLeaderForm, serialNumber: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Shift / Responsibility</label>
                    <input className="w-full bg-slate-50 border border-slate-200 px-6 py-5 rounded-[1.5rem] outline-none font-bold" placeholder="e.g. Morning Shift" value={newLeaderForm.role} onChange={(e) => setNewLeaderForm({...newLeaderForm, role: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Photo URL (Manual)</label>
                    <input className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-xl font-bold" value={newLeaderForm.imageUrl} onChange={(e) => setNewLeaderForm({...newLeaderForm, imageUrl: e.target.value})} />
                 </div>
                 <button onClick={handleAddNewLeader} className="w-full bg-orange-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all mt-4">Confirm Addition</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeamLeaders;
