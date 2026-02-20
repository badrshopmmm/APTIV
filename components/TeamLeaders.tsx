
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
  Calendar,
  MessageCircle,
  AlertTriangle,
  ChevronDown,
  Link as LinkIcon,
  MessageSquare,
  CheckCircle2
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
  const [editingWAGroup, setEditingWAGroup] = useState<TeamLeader | null>(null);
  const [waGroupLink, setWAGroupLink] = useState('');
  const [waLinkError, setWALinkError] = useState(false);

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
  const [performanceSortField, setPerformanceSortField] = useState<'name' | 'shifts' | 'efficiency' | 'rating' | 'tasks'>('efficiency');
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
    notifyWhatsApp: boolean;
  }>({ reason: 'إجازة سنوية (Annual Leave)', returnDate: '', type: 'on_leave', notifyWhatsApp: true });

  const stoppageReasons = [
    "إجازة سنوية (Annual Leave)",
    "إجازة مرضية (Sick Leave)",
    "إجازة طارئة (Emergency Leave)",
    "مهمة عمل خارج الموقع (Off-site Mission)",
    "توقف إداري (Administrative Suspension)",
    "إجراء تأديبي (Disciplinary Action)",
    "دورة تدريبية (Training Course)",
    "عطل فني في الوصول (Technical Delay)",
    "أسباب أخرى (Other Reasons)"
  ];

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
      
      // Calculate Tasks Completed: Reports where actual output met or exceeded target
      const tasksCompleted = leaderReports.filter(p => p.totalOutput >= p.totalTarget && p.totalTarget > 0).length;
      
      const avgEff = totalShifts > 0 
        ? Math.round(leaderReports.reduce((acc, curr) => acc + curr.efficiency, 0) / totalShifts) 
        : 0;
      
      const baseRating = totalShifts > 0 ? (avgEff / 25) + (totalShifts / 50) + (tasksCompleted / 20) : 0;
      const finalRating = Math.min(Math.max(baseRating, 0), 5).toFixed(1);

      return {
        id: l.id,
        shiftsCompleted: totalShifts,
        tasksCompleted,
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
        } else if (performanceSortField === 'tasks') {
          valA = metA.tasksCompleted; valB = metB.tasksCompleted;
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

  const openWAGroupModal = (leader: TeamLeader) => {
    setEditingWAGroup(leader);
    setWAGroupLink(leader.whatsappGroup || '');
    setWALinkError(false);
  };

  const validateURL = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSaveWAGroup = () => {
    if (!validateURL(waGroupLink)) {
      setWALinkError(true);
      return;
    }
    if (editingWAGroup) {
      onUpdate({ ...editingWAGroup, whatsappGroup: waGroupLink });
      setEditingWAGroup(null);
    }
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
      const updatedLeader: TeamLeader = {
        ...leaderToSuspend,
        status: stoppageForm.type,
        stoppageReason: stoppageForm.reason,
        returnDate: stoppageForm.returnDate
      };
      
      onUpdate(updatedLeader);

      if (stoppageForm.notifyWhatsApp) {
        const typeLabel = stoppageForm.type === 'on_leave' ? 'إجازة' : 'إيقاف مؤقت';
        const message = `*🔔 تنبيه عمليات: ${typeLabel} للمشرف*\n\n` +
                        `👤 المشرف: ${leaderToSuspend.name}\n` +
                        `📂 السبب: ${stoppageForm.reason}\n` +
                        `📅 تاريخ العودة المتوقع: ${stoppageForm.returnDate || 'غير محدد'}\n` +
                        `📍 الحالة الحالية: ${stoppageForm.type === 'on_leave' ? 'في إجازة' : 'متوقف عن العمل'}\n\n` +
                        `_تم تحديث البيانات عبر نظام ProTrack AI_`;
        
        const groupLink = leaderToSuspend.whatsappGroup || `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(groupLink, '_blank');
      }

      setIsReportingStoppage(null);
      setStoppageForm({ reason: stoppageReasons[0], returnDate: '', type: 'on_leave', notifyWhatsApp: true });
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

  const handleSort = (field: 'name' | 'shifts' | 'efficiency' | 'rating' | 'tasks') => {
    if (performanceSortField === field) {
      setPerformanceSortOrder(performanceSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setPerformanceSortField(field);
      setPerformanceSortOrder('desc');
    }
  };

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
                          Shifts <ArrowUpDown size={12} className="inline ml-1" />
                       </th>
                       <th className="p-8 text-center cursor-pointer hover:text-orange-500 transition-colors" onClick={() => handleSort('tasks')}>
                          Tasks Completed <ArrowUpDown size={12} className="inline ml-1" />
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
                                <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                   <CheckCircle2 size={14} className="text-emerald-500" />
                                   <span className="font-black text-emerald-600">{metrics.tasksCompleted}</span>
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
                                <div className="flex items-center justify-center gap-3">
                                  <button 
                                    onClick={() => openWAGroupModal(leader)}
                                    className="p-3 bg-white border border-slate-100 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                    title="Edit WA Group Link"
                                  >
                                    <MessageSquare size={18} />
                                  </button>
                                  <button 
                                    onClick={() => openEditModal(leader)}
                                    className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                  >
                                    <Settings2 size={18} />
                                  </button>
                                </div>
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
                  <div className="absolute top-8 right-8 flex gap-2">
                    <button onClick={() => openWAGroupModal(leader)} className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all opacity-0 group-hover/card:opacity-100 shadow-sm" title="Edit WA Group Link">
                      <MessageSquare size={16} />
                    </button>
                    <button onClick={() => openEditModal(leader)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-orange-500 hover:text-white transition-all opacity-0 group-hover/card:opacity-100 shadow-sm">
                      <Edit2 size={16} />
                    </button>
                  </div>
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
                  
                  {/* Task Stat Badge */}
                  <div className="mb-4 inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm">
                     <CheckCircle2 size={14} />
                     <span className="text-[10px] font-black uppercase tracking-widest">{metrics.tasksCompleted} Tasks Completed</span>
                  </div>

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
                   <button onClick={() => openWAGroupModal(leader)} className="w-full bg-emerald-50 text-emerald-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-3">
                     <LinkIcon size={16} /> Edit WA Group Link
                   </button>
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

      {/* WhatsApp Group Link Modal */}
      {editingWAGroup && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setEditingWAGroup(null)}></div>
           <div className="bg-white w-full max-w-lg rounded-[4rem] border border-slate-100 p-12 relative z-10 animate-in zoom-in-95 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                     <MessageSquare size={24} />
                   </div>
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">WhatsApp Group Link</h2>
                 </div>
                 <button onClick={() => setEditingWAGroup(null)} className="p-4 bg-slate-100 text-slate-400 rounded-3xl hover:text-red-500 transition-all"><X size={24} /></button>
              </div>
              <div className="space-y-6 text-right">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Group URL (رابط المجموعة)</label>
                    <input 
                      className={`w-full bg-slate-50 border ${waLinkError ? 'border-red-500' : 'border-slate-200'} px-6 py-5 rounded-[1.5rem] outline-none font-bold focus:border-emerald-500 transition-all shadow-sm`}
                      placeholder="https://chat.whatsapp.com/..."
                      value={waGroupLink}
                      onChange={(e) => { setWAGroupLink(e.target.value); setWALinkError(false); }}
                    />
                    {waLinkError && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2 pl-4">Invalid URL format (يجب أن يكون رابطاً صحيحاً)</p>}
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setEditingWAGroup(null)} className="flex-1 bg-slate-100 text-slate-400 py-6 rounded-[2rem] font-black uppercase tracking-widest transition-all hover:bg-slate-200">Cancel</button>
                    <button onClick={handleSaveWAGroup} className="flex-2 bg-emerald-500 text-white py-6 px-10 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-600 active:scale-95">Save Changes</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Stoppage Modal */}
      {isReportingStoppage && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsReportingStoppage(null)}></div>
           <div className="bg-white w-full max-w-lg rounded-[4rem] border border-slate-100 p-12 relative z-10 animate-in zoom-in-95 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                     <AlertTriangle size={24} />
                   </div>
                   <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Reporting Stoppage</h2>
                 </div>
                 <button onClick={() => setIsReportingStoppage(null)} className="p-4 bg-slate-100 text-slate-400 rounded-3xl hover:text-red-500 transition-all"><X size={24} /></button>
              </div>
              
              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Suspension Category</label>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                      <button 
                        onClick={() => setStoppageForm({...stoppageForm, type: 'on_leave'})}
                        className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${stoppageForm.type === 'on_leave' ? 'bg-white text-orange-600 shadow-md border border-orange-100' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Leave / إجازة
                      </button>
                      <button 
                        onClick={() => setStoppageForm({...stoppageForm, type: 'stopped'})}
                        className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${stoppageForm.type === 'stopped' ? 'bg-white text-rose-600 shadow-md border border-rose-100' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Suspended / إيقاف
                      </button>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Specific Reason (السبب بالتفصيل)</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 px-6 py-5 rounded-[1.5rem] outline-none font-bold appearance-none cursor-pointer focus:border-orange-500 shadow-sm"
                        value={stoppageForm.reason}
                        onChange={(e) => setStoppageForm({...stoppageForm, reason: e.target.value})}
                      >
                        {stoppageReasons.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Expected Return Date (تاريخ العودة)</label>
                    <div className="relative">
                      <Calendar size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                      <input 
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 pl-16 pr-6 py-5 rounded-[1.5rem] outline-none font-black text-slate-900 focus:border-orange-600 shadow-sm"
                        value={stoppageForm.returnDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setStoppageForm({...stoppageForm, returnDate: e.target.value})}
                      />
                    </div>
                    <div className="flex items-start gap-2 pl-4 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0"></div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">System will automatically reactivate this supervisor at 00:00 on the selected date.</p>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group cursor-pointer" onClick={() => setStoppageForm({...stoppageForm, notifyWhatsApp: !stoppageForm.notifyWhatsApp})}>
                   <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-xl transition-all ${stoppageForm.notifyWhatsApp ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-slate-200 text-slate-400'}`}>
                       <MessageCircle size={20} />
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Broadcast via WhatsApp</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">Notify management group</p>
                     </div>
                   </div>
                   <div className={`w-12 h-6 rounded-full transition-all relative ${stoppageForm.notifyWhatsApp ? 'bg-green-500' : 'bg-slate-300'}`}>
                     <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${stoppageForm.notifyWhatsApp ? 'left-7' : 'left-1'}`}></div>
                   </div>
                 </div>

                 <button 
                   onClick={handleStoppageSubmit} 
                   className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl transition-all mt-4 flex items-center justify-center gap-4 ${stoppageForm.type === 'stopped' ? 'bg-rose-600 hover:bg-slate-900 shadow-rose-100' : 'bg-orange-500 hover:bg-slate-900 shadow-orange-100'} text-white`}
                 >
                   <PowerOff size={20} />
                   <span>Confirm & Archive Stoppage</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Editing Modal */}
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
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">WhatsApp Contact</label>
                    <input className="w-full bg-slate-50 border border-slate-200 px-6 py-5 rounded-[1.5rem] outline-none font-black" placeholder="e.g. 201000000000" value={editFormData.whatsapp} onChange={(e) => setEditFormData({...editFormData, whatsapp: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Shift / Responsibility</label>
                    <input className="w-full bg-slate-50 border border-slate-200 px-6 py-5 rounded-[1.5rem] outline-none font-bold" value={editFormData.role} onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} />
                 </div>
                 <button onClick={handleSaveEdit} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all mt-4 hover:bg-orange-500">Update Profile</button>
              </div>
           </div>
        </div>
      )}

      {/* Adding Modal */}
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
                 <button onClick={handleAddNewLeader} className="w-full bg-orange-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all mt-4">Confirm Addition</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeamLeaders;
