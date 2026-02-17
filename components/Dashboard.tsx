
import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  UserPlus, 
  Trash2, 
  X, 
  Clock, 
  Camera, 
  CheckCircle2, 
  FileText, 
  Stethoscope, 
  Plane, 
  Moon, 
  Sun, 
  Printer, 
  Share2, 
  ArrowUpDown, 
  Calendar as CalendarIcon, 
  Zap, 
  Users, 
  Edit3, 
  Upload, 
  ShieldAlert, 
  Activity, 
  Layers, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  BrainCircuit, 
  FileSpreadsheet, 
  ArrowRight,
  MoreVertical,
  Target
} from 'lucide-react';
import { ProductionEntry, TeamLeader, ManagementMember, Employee, AttendanceRecord, AttendanceStatus, ProductionLine } from '../types';
import { analyzeProductionData } from '../services/geminiService';

interface DashboardProps {
  data: ProductionEntry[];
  leaders: TeamLeader[];
  managementTeam: ManagementMember[];
  onUpdateManagementTeam: (team: ManagementMember[]) => void;
  employees: Employee[];
  attendance: AttendanceRecord[];
  onAttendanceChange: (employeeId: string, status: AttendanceStatus, date: string, attachmentUrl?: string) => void;
  onAddEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onDeleteProductionRecord: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  data,
  leaders,
  managementTeam, 
  onUpdateManagementTeam,
  employees,
  attendance,
  onAttendanceChange,
  onAddEmployee,
  onDeleteEmployee,
  onDeleteProductionRecord
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'id' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<ManagementMember | null>(null);
  const [newEmpForm, setNewEmpForm] = useState({ id: '', name: '', department: 'Cables', role: 'Operator', supervisorId: '' });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const memberFileInputRef = useRef<HTMLInputElement>(null);
  const [activeEmpForFile, setActiveEmpForFile] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const formattedSelectedDate = new Date(selectedDate).toLocaleDateString('ar-EG', { 
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
  });

  const statusOptions: { value: AttendanceStatus; label: string; activeClass: string; icon: any; color: string; hex: string }[] = [
    { value: 'present', label: 'حاضر', activeClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-100', icon: CheckCircle2, color: 'text-emerald-500', hex: '#10b981' },
    { value: 'absent', label: 'غائب', activeClass: 'bg-rose-600 text-white shadow-lg shadow-rose-100', icon: X, color: 'text-rose-500', hex: '#f43f5e' },
    { value: 'tl', label: 'قائد فريق', activeClass: 'bg-slate-900 text-white shadow-lg shadow-slate-200', icon: ShieldAlert, color: 'text-slate-800', hex: '#0f172a' },
    { value: 'et', label: 'وقت إضافي', activeClass: 'bg-violet-600 text-white shadow-lg shadow-violet-100', icon: Clock, color: 'text-violet-500', hex: '#8b5cf6' },
    { value: 'cr', label: 'راحة يومية', activeClass: 'bg-amber-500 text-white shadow-lg shadow-amber-100', icon: Sun, color: 'text-amber-500', hex: '#f59e0b' },
    { value: 'TE', label: 'مهمة عمل', activeClass: 'bg-sky-500 text-white shadow-lg shadow-sky-100', icon: Plane, color: 'text-sky-500', hex: '#0ea5e9' },
    { value: 'AP', label: 'تصريح', activeClass: 'bg-indigo-500 text-white shadow-lg shadow-indigo-100', icon: FileText, color: 'text-indigo-500', hex: '#6366f1' },
    { value: 'MT', label: 'مرضي', activeClass: 'bg-teal-500 text-white shadow-lg shadow-teal-100', icon: Stethoscope, color: 'text-teal-500', hex: '#14b8a6' },
    { value: 'ctp', label: 'CTP', activeClass: 'bg-blue-600 text-white shadow-lg shadow-blue-100', icon: Zap, color: 'text-blue-500', hex: '#2563eb' },
    { value: 'ctn', label: 'CTN', activeClass: 'bg-slate-500 text-white shadow-lg shadow-slate-100', icon: Moon, color: 'text-slate-500', hex: '#64748b' },
  ];

  const getAttendanceRecord = (empId: string) => {
    return attendance.find(a => a.employeeId === empId && a.date === selectedDate);
  };

  const departments = useMemo(() => Array.from(new Set(employees.map(e => e.department))), [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.includes(searchTerm);
      const matchesDept = deptFilter === 'all' || e.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, deptFilter]);

  const groupedAndSortedEmployees = useMemo<Record<string, Employee[]>>(() => {
    const sorted = [...filteredEmployees].sort((a, b) => {
      let valA = '';
      let valB = '';
      if (sortField === 'name') { valA = a.name; valB = b.name; }
      else if (sortField === 'id') { valA = a.id; valB = b.id; }
      else if (sortField === 'status') {
        valA = getAttendanceRecord(a.id)?.status || 'absent';
        valB = getAttendanceRecord(b.id)?.status || 'absent';
      }
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const groups: Record<string, Employee[]> = {};
    sorted.forEach(emp => {
      if (!groups[emp.department]) groups[emp.department] = [];
      groups[emp.department].push(emp);
    });
    return groups;
  }, [filteredEmployees, sortField, sortOrder, attendance, selectedDate]);

  const summaryStats = useMemo(() => {
    const total = employees.length;
    const records = employees.map(e => getAttendanceRecord(e.id));
    const presentCount = records.filter(r => r?.status === 'present').length;
    const absentCount = records.filter(r => !r || r.status === 'absent').length;
    const others = total - presentCount - absentCount;
    return { total, present: presentCount, absent: absentCount, others, percent: total > 0 ? Math.round((presentCount / total) * 100) : 0 };
  }, [employees, attendance, selectedDate]);

  // FIX: Implement the missing toggleSort function to handle table sorting
  const toggleSort = (field: 'name' | 'id' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const exportDetailedExcel = () => {
    const csvRows = [];
    
    // Header
    csvRows.push(`"APTIV STRATEGIC OPERATIONS REPORT"`);
    csvRows.push(`"DATE:","${selectedDate}"`);
    csvRows.push(`"GENERATED BY:","ProTrack AI System"`);
    csvRows.push("");
    
    // Summary Section
    csvRows.push(`"OPERATIONAL SUMMARY"`);
    csvRows.push(`"Total Personnel:","${summaryStats.total}"`);
    csvRows.push(`"Deployment Rate:","${summaryStats.percent}%"`);
    csvRows.push(`"Present:","${summaryStats.present}"`);
    csvRows.push(`"Absent:","${summaryStats.absent}"`);
    csvRows.push(`"Other Statuses:","${summaryStats.others}"`);
    csvRows.push("");
    
    // Department Breakdown
    csvRows.push(`"DEPARTMENTAL BREAKDOWN"`);
    departments.forEach(dept => {
        const deptEmps = employees.filter(e => e.department === dept);
        const pres = deptEmps.filter(e => getAttendanceRecord(e.id)?.status === 'present').length;
        csvRows.push(`"${dept}","${pres}/${deptEmps.length} Ready"`);
    });
    csvRows.push("");
    
    // Main Table
    csvRows.push(`"DETAILED ATTENDANCE MATRIX"`);
    const tableHeaders = ["Force ID", "Personnel Name", "Department", "Role", "Supervisor", "Status", "Proof"];
    csvRows.push(tableHeaders.map(h => `"${h}"`).join(","));
    
    employees.forEach(emp => {
      const record = getAttendanceRecord(emp.id);
      const supervisor = leaders.find(l => l.id === emp.supervisorId)?.name || "N/A";
      const statusLabel = statusOptions.find(o => o.value === (record?.status || 'absent'))?.label || "غائب";
      
      csvRows.push([
        emp.id,
        emp.name,
        emp.department,
        emp.role || "Operator",
        supervisor,
        statusLabel,
        record?.attachmentUrl ? "ATTACHED" : "NONE"
      ].map(cell => `"${cell}"`).join(","));
    });
    
    const csvString = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Detailed_Attendance_${selectedDate}.csv`;
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeEmpForFile) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onAttendanceChange(activeEmpForFile, getAttendanceRecord(activeEmpForFile)?.status || 'absent', selectedDate, ev.target?.result as string);
        setActiveEmpForFile(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

      {/* Strategic Command Bar */}
      <div className="flex flex-col gap-6 no-print">
         <div className="flex flex-col lg:flex-row items-center justify-between bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-600 text-white rounded-3xl shadow-xl shadow-orange-100 ring-4 ring-orange-50">
                <ShieldAlert size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Strategic Command Center</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">AI-Powered Field Analytics</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <button 
                 onClick={exportDetailedExcel}
                 className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl"
               >
                 <FileSpreadsheet size={18} />
                 <span>تصدير تقرير مفصل (Excel)</span>
               </button>
               <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <CalendarIcon className="text-orange-500" size={20} />
                  <input 
                    type="date" 
                    className="bg-transparent font-black text-slate-900 outline-none cursor-pointer" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                  />
               </div>
            </div>
         </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
         {[
           { label: 'إجمالي القوة', val: summaryStats.total, sub: 'Personnel Deployment', color: 'bg-slate-900', icon: Users },
           { label: 'نسبة الجاهزية', val: `${summaryStats.percent}%`, sub: 'Operational Readiness', color: 'bg-emerald-600', icon: Activity },
           { label: 'حالات الغياب', val: summaryStats.absent, sub: 'Strategic Gap', color: 'bg-rose-600', icon: ShieldAlert },
           { label: 'حالات خاصة', val: summaryStats.others, sub: 'Special Missions', color: 'bg-indigo-600', icon: Zap },
         ].map((stat, i) => (
           <div key={i} className={`${stat.color} text-white p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between group hover:translate-y-[-4px] transition-all`}>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{stat.label}</p>
                 <p className="text-4xl font-black tracking-tighter">{stat.val}</p>
                 <p className="text-[9px] font-bold opacity-80 mt-2">{stat.sub}</p>
              </div>
              <stat.icon size={40} className="opacity-20 group-hover:rotate-12 transition-transform" />
           </div>
         ))}
      </div>

      {/* Attendance Matrix Section */}
      <div id="attendance-section" className="bg-white border border-slate-100 rounded-[4rem] p-12 shadow-sm relative overflow-hidden">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-orange-600 text-white rounded-[1.5rem] shadow-lg shadow-orange-100">
              <Layers size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">مصفوفة الحضور والغياب</h2>
              <div className="flex items-center gap-3 mt-2">
                 <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full">
                    Real-time Matrix
                 </div>
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{formattedSelectedDate}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center no-print">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
               <button onClick={() => window.print()} className="p-3 text-slate-600 hover:bg-white rounded-xl transition-all"><Printer size={18} /></button>
            </div>
            <select 
              className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-xl text-[10px] font-black uppercase outline-none focus:border-orange-600 cursor-pointer"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="all">كل الأقسام</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600" size={16} />
              <input 
                type="text" placeholder="بحث عن موظف..."
                className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:border-orange-600 outline-none w-64 transition-all"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setIsAddingEmployee(true)} className="p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-orange-600 transition-all">
              <UserPlus size={20} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-8 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-50 no-print">
          {statusOptions.map(opt => (
            <div key={opt.value} className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${opt.activeClass.split(' ')[0]} text-white`}>
                <opt.icon size={12} />
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{opt.label}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-50 rounded-[3rem] bg-white shadow-inner">
           <table className="w-full text-right border-collapse print:table">
              <thead>
                 <tr className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="p-8 text-center cursor-pointer hover:text-orange-600 transition-colors" onClick={() => toggleSort('id')}>معرف القوة <ArrowUpDown size={12} className="inline ml-1" /></th>
                    <th className="p-8 cursor-pointer hover:text-orange-600 transition-colors" onClick={() => toggleSort('name')}>بيانات الموظف <ArrowUpDown size={12} className="inline ml-1" /></th>
                    <th className="p-8 text-center">المشرف المباشر</th>
                    <th className="p-8 text-center no-print">المرفقات</th>
                    <th className="p-8 text-center">حالة الحضور</th>
                    <th className="p-8 text-center no-print w-16"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {Object.entries(groupedAndSortedEmployees).map(([dept, emps]: [string, Employee[]]) => (
                   <React.Fragment key={dept}>
                     <tr className="bg-slate-100/50 group/dept cursor-pointer" onClick={() => setCollapsedDepts(p => ({...p, [dept]: !p[dept]}))}>
                       <td colSpan={6} className="p-5">
                          <div className="flex items-center justify-between px-6">
                             <div className="flex items-center gap-4">
                                <div className="p-2 bg-white rounded-lg border border-slate-200 text-orange-600">
                                   {collapsedDepts[dept] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                                <span className="font-black text-sm uppercase tracking-widest text-slate-900">{dept}</span>
                                <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-[10px] font-black">إجمالي: {emps.length}</span>
                             </div>
                             <div className="flex items-center gap-8">
                                <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                   <span className="text-[10px] font-black text-emerald-600 uppercase">حاضر: {emps.filter(e => getAttendanceRecord(e.id)?.status === 'present').length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                   <span className="text-[10px] font-black text-rose-500 uppercase">غائب: {emps.filter(e => !getAttendanceRecord(e.id) || getAttendanceRecord(e.id)?.status === 'absent').length}</span>
                                </div>
                             </div>
                          </div>
                       </td>
                     </tr>
                     {!collapsedDepts[dept] && emps.map(emp => {
                        const record = getAttendanceRecord(emp.id);
                        const currentStatus = record?.status || 'absent';
                        const supervisor = leaders.find(l => l.id === emp.supervisorId);
                        const activeOpt = statusOptions.find(o => o.value === currentStatus);
                        
                        return (
                           <tr key={emp.id} className="hover:bg-orange-50/20 transition-all group">
                              <td className="p-8 text-center font-black text-[11px] text-slate-400">#{emp.id}</td>
                              <td className="p-8">
                                 <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner ${activeOpt?.color.replace('text', 'bg').replace('500', '50')} ${activeOpt?.color}`}>
                                       {emp.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex flex-col text-right">
                                       <span className="font-black text-slate-900 text-sm tracking-tight">{emp.name}</span>
                                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.role || 'Operator'}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-8">
                                 <div className="flex items-center justify-center gap-3">
                                    <div className="flex flex-col text-left">
                                       <span className="text-[10px] font-black text-slate-700 uppercase">{supervisor?.name.split(' ')[0]}</span>
                                       <span className="text-[8px] font-bold text-slate-400 uppercase">Supervisor</span>
                                    </div>
                                    <img src={supervisor?.imageUrl} className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm" />
                                 </div>
                              </td>
                              <td className="p-8 text-center no-print">
                                 {record?.attachmentUrl ? (
                                    <button 
                                      onClick={() => setPreviewImage(record.attachmentUrl!)} 
                                      className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                    >
                                       <Eye size={18} />
                                    </button>
                                 ) : (
                                    <button 
                                      onClick={() => { setActiveEmpForFile(emp.id); fileInputRef.current?.click(); }} 
                                      className="p-3 bg-slate-50 text-slate-300 rounded-2xl hover:bg-orange-600 hover:text-white transition-all border border-slate-100"
                                    >
                                       <Camera size={18} />
                                    </button>
                                 )}
                              </td>
                              <td className="p-8">
                                 <div className="flex flex-wrap items-center justify-center gap-2 no-print">
                                    {statusOptions.map(opt => (
                                       <button
                                          key={opt.value}
                                          onClick={() => onAttendanceChange(emp.id, opt.value, selectedDate)}
                                          className={`p-3 rounded-xl transition-all ${
                                             currentStatus === opt.value ? opt.activeClass : 'bg-slate-50 text-slate-300 border border-slate-100 hover:border-orange-200 hover:text-orange-500'
                                          }`}
                                          title={opt.label}
                                       >
                                          <opt.icon size={18} />
                                       </button>
                                    ))}
                                 </div>
                                 <div className="hidden print:block text-center font-black text-sm uppercase">
                                    {statusOptions.find(o => o.value === currentStatus)?.label}
                                 </div>
                              </td>
                              <td className="p-8 text-center no-print">
                                 <button onClick={() => onDeleteEmployee(emp.id)} className="p-3 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={18} /></button>
                              </td>
                           </tr>
                        );
                     })}
                   </React.Fragment>
                 ))}
              </tbody>
           </table>
        </div>
      </div>

      {/* Proof Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/95 backdrop-blur-lg no-print" onClick={() => setPreviewImage(null)}>
           <button className="absolute top-10 right-10 p-5 bg-white/10 text-white rounded-full hover:bg-rose-500 transition-all shadow-2xl z-10"><X size={32} /></button>
           <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center">
              <img src={previewImage} className="max-w-full max-h-[85vh] object-contain rounded-[2rem] shadow-2xl border-4 border-white/10" alt="Proof" onClick={(e) => e.stopPropagation()} />
              <div className="mt-8 flex gap-4">
                 <button onClick={() => window.open(previewImage, '_blank')} className="px-8 py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">فتح في علامة تبويب جديدة</button>
              </div>
           </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddingEmployee && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-8 no-print">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in" onClick={() => setIsAddingEmployee(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 relative z-10 animate-in zoom-in-95 shadow-2xl">
             <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-900 uppercase">إضافة موظف جديد</h2>
                <button onClick={() => setIsAddingEmployee(false)} className="p-4 bg-slate-100 text-slate-400 rounded-3xl hover:text-red-500 transition-all"><X size={24} /></button>
             </div>
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">المعرف الوظيفي</label>
                      <input className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-black outline-none focus:border-orange-500" value={newEmpForm.id} onChange={(e) => setNewEmpForm({...newEmpForm, id: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">القسم</label>
                      <input className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-black outline-none focus:border-orange-500" value={newEmpForm.department} onChange={(e) => setNewEmpForm({...newEmpForm, department: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">الاسم الكامل</label>
                   <input className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold outline-none focus:border-orange-500" value={newEmpForm.name} onChange={(e) => setNewEmpForm({...newEmpForm, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">المشرف المسؤول</label>
                   <select 
                    className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold outline-none cursor-pointer"
                    value={newEmpForm.supervisorId}
                    onChange={(e) => setNewEmpForm({...newEmpForm, supervisorId: e.target.value})}
                   >
                     <option value="">اختر المشرف...</option>
                     {leaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                   </select>
                </div>
                <button onClick={() => { onAddEmployee(newEmpForm as Employee); setIsAddingEmployee(false); }} className="w-full bg-orange-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all mt-4 hover:bg-slate-900">تأكيد الإضافة</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
