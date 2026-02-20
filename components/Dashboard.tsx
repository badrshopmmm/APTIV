
import React, { useState, useMemo, useRef } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
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
  ArrowUpDown, 
  Calendar as CalendarIcon, 
  Zap, 
  Users, 
  ShieldAlert, 
  Activity, 
  Layers, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet, 
  Filter,
  Check,
  TrendingUp,
  ListTodo,
  Save,
  PauseCircle,
  AlertOctagon,
  Timer,
  MessageCircle,
  Share2,
  MonitorPlay
} from 'lucide-react';
import { ProductionEntry, TeamLeader, ManagementMember, Employee, AttendanceRecord, AttendanceStatus, ProductionLine } from '../types';

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
  employees,
  attendance,
  onAttendanceChange,
  onAddEmployee,
  onDeleteEmployee,
  onDeleteProductionRecord
}) => {
  const [activeView, setActiveView] = useState<'attendance' | 'stoppages'>('attendance');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [stoppageReasonFilter, setStoppageReasonFilter] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'id' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSavedToast, setShowSavedToast] = useState(false);
  
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmpForm, setNewEmpForm] = useState<Partial<Employee>>({
    id: '',
    name: '',
    department: '',
    role: 'Operator',
    supervisorId: ''
  });

  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeEmpForFile, setActiveEmpForFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formattedSelectedDate = new Date(selectedDate).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
  });

  const statusOptions: { value: AttendanceStatus; label: string; activeClass: string; icon: any; color: string }[] = [
    { value: 'present', label: 'Present', activeClass: 'bg-emerald-600 text-white shadow-emerald-200', icon: CheckCircle2, color: 'text-emerald-500' },
    { value: 'absent', label: 'Absent', activeClass: 'bg-rose-600 text-white shadow-rose-200', icon: X, color: 'text-rose-500' },
    { value: 'ctp', label: 'CTP', activeClass: 'bg-blue-600 text-white shadow-blue-200', icon: Zap, color: 'text-blue-500' },
    { value: 'ctn', label: 'CTN', activeClass: 'bg-slate-600 text-white shadow-slate-200', icon: Moon, color: 'text-slate-500' },
    { value: 'cr', label: 'CR (Rest)', activeClass: 'bg-amber-500 text-white shadow-amber-200', icon: Sun, color: 'text-amber-500' },
    { value: 'tl', label: 'TL (Leader)', activeClass: 'bg-slate-900 text-white shadow-slate-400', icon: ShieldAlert, color: 'text-slate-900' },
    { value: 'et', label: 'ET (Extra)', activeClass: 'bg-violet-600 text-white shadow-violet-200', icon: Clock, color: 'text-violet-500' },
    { value: 'TE', label: 'TE (Mission)', activeClass: 'bg-sky-500 text-white shadow-sky-200', icon: Plane, color: 'text-sky-500' },
    { value: 'AP', label: 'AP (Permit)', activeClass: 'bg-indigo-500 text-white shadow-indigo-200', icon: FileText, color: 'text-indigo-500' },
    { value: 'MT', label: 'MT (Sick)', activeClass: 'bg-teal-500 text-white shadow-teal-200', icon: Stethoscope, color: 'text-teal-500' },
  ];

  const getAttendanceRecord = (empId: string) => {
    return attendance.find(a => a.employeeId === empId && a.date === selectedDate);
  };

  const departments = useMemo(() => Array.from(new Set(employees.map(e => e.department))), [employees]);

  // Aggregate Stoppage Data with filtering
  const stoppageData = useMemo(() => {
    return data.filter(entry => {
      const isDateMatch = entry.date === selectedDate;
      const hasDowntime = entry.downtimeMinutes && entry.downtimeMinutes > 0;
      const matchesReason = stoppageReasonFilter === 'all' || entry.downtimeReason === stoppageReasonFilter;
      const matchesSearch = entry.lineId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (entry.downtimeReason || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return isDateMatch && hasDowntime && matchesReason && matchesSearch;
    });
  }, [data, selectedDate, stoppageReasonFilter, searchTerm]);

  const allStoppageReasons = useMemo(() => {
    const reasons = new Set<string>();
    data.forEach(entry => {
      if (entry.downtimeReason) reasons.add(entry.downtimeReason);
    });
    return Array.from(reasons);
  }, [data]);

  const totalDowntime = useMemo(() => {
    return stoppageData.reduce((acc, curr) => acc + (curr.downtimeMinutes || 0), 0);
  }, [stoppageData]);

  const downtimeTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayTotal = data
        .filter(entry => entry.date === date)
        .reduce((acc, curr) => acc + (curr.downtimeMinutes || 0), 0);
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutes: dayTotal
      };
    });
  }, [data]);

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
    
    const counts = statusOptions.reduce((acc, opt) => {
      acc[opt.value] = records.filter(r => r?.status === opt.value).length;
      return acc;
    }, {} as Record<string, number>);

    const missing = records.filter(r => !r).length;
    counts['absent'] = counts['absent'] + missing;

    const presentCount = counts['present'] + counts['tl'] + counts['et'] + counts['TE'] + counts['ctp'] + counts['ctn'];
    const percent = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    return { total, counts, percent, presentCount };
  }, [employees, attendance, selectedDate]);

  const handleStatusChange = (empId: string, status: AttendanceStatus) => {
    onAttendanceChange(empId, status, selectedDate);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const toggleSort = (field: 'name' | 'id' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const shareStoppageWhatsApp = (entry: ProductionEntry) => {
    const leader = leaders.find(l => l.id === entry.leaderId);
    const message = `*🚨 ALERT: LINE STOPPAGE REPORT*\n\n` +
                    `📍 Line: ${entry.lineId}\n` +
                    `👤 Supervisor: ${leader?.name || 'N/A'}\n` +
                    `🕒 Duration: ${entry.downtimeMinutes} mins\n` +
                    `⚠️ Reason: ${entry.downtimeReason || 'Unknown'}\n` +
                    `📅 Date: ${entry.date}\n\n` +
                    `_Broadcast via APTIV ProTrack AI Dashboard_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDeleteEmployeeSafe = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete personnel: ${name}? This will remove all their associated records permanently.`)) {
      onDeleteEmployee(id);
    }
  };

  const handleDeleteProductionRecordSafe = (id: string, lineId: string) => {
    if (window.confirm(`Are you sure you want to delete the production record for ${lineId}? This action cannot be undone.`)) {
      onDeleteProductionRecord(id);
    }
  };

  const exportDetailedExcel = () => {
    const csvRows = [];
    csvRows.push(`"APTIV - STRATEGIC FIELD OPERATIONS LOG"`);
    csvRows.push(`"Reference Date:","${selectedDate}"`);
    csvRows.push("");
    
    if (activeView === 'attendance') {
      csvRows.push(`"ATTENDANCE REPORT"`);
      csvRows.push(`"Metric","Value"`);
      csvRows.push(`"Total Force","${summaryStats.total}"`);
      csvRows.push(`"Active Field Presence","${summaryStats.presentCount}"`);
      csvRows.push("");
      csvRows.push(`"PERSONNEL DETAILS"`);
      csvRows.push(`"ID","Name","Department","Status"`);
      employees.forEach(emp => {
        const record = getAttendanceRecord(emp.id);
        const statusLabel = statusOptions.find(o => o.value === (record?.status || 'absent'))?.label || "Absent";
        csvRows.push([emp.id, emp.name, emp.department, statusLabel].map(cell => `"${cell}"`).join(","));
      });
    } else {
      csvRows.push(`"PRODUCTION STOPPAGE REPORT"`);
      csvRows.push(`"Line","Supervisor","Duration (mins)","Reason"`);
      stoppageData.forEach(entry => {
        const leader = leaders.find(l => l.id === entry.leaderId)?.name || "N/A";
        csvRows.push([entry.lineId, leader, entry.downtimeMinutes, entry.downtimeReason || "N/A"].map(cell => `"${cell}"`).join(","));
      });
    }

    const csvString = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `APTIV_${activeView}_Log_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && activeEmpForFile) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              onAttendanceChange(activeEmpForFile, getAttendanceRecord(activeEmpForFile)?.status || 'absent', selectedDate, ev.target?.result as string);
              setActiveEmpForFile(null);
            };
            reader.readAsDataURL(file);
          }
        }} 
      />

      {/* Hero Header Section */}
      <div className="bg-white border border-slate-200 rounded-3xl md:rounded-[3.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden no-print">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-40 -mr-20 -mt-20"></div>
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full lg:w-auto">
            <div className={`p-4 md:p-5 rounded-2xl md:rounded-[2rem] shadow-xl transition-all duration-500 ${activeView === 'attendance' ? 'bg-slate-900 shadow-slate-200' : 'bg-orange-600 shadow-orange-100'}`}>
              {activeView === 'attendance' ? <ListTodo size={24} className="text-white md:w-8 md:h-8" /> : <AlertOctagon size={24} className="text-white md:w-8 md:h-8" />}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                {activeView === 'attendance' ? 'Field Attendance Matrix' : 'Production Stoppage Log'}
              </h1>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                 <p className="text-orange-600 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">{formattedSelectedDate}</p>
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-end gap-4 w-full lg:w-auto">
             <div className="flex bg-slate-100 p-1 rounded-xl md:rounded-2xl border border-slate-200 shadow-inner w-full sm:w-auto">
                <button 
                  onClick={() => setActiveView('attendance')}
                  className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-widest transition-all ${activeView === 'attendance' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Attendance
                </button>
                <button 
                  onClick={() => setActiveView('stoppages')}
                  className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-widest transition-all ${activeView === 'stoppages' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Stoppages
                </button>
             </div>
             
             <div className="flex items-center bg-slate-50 p-2 rounded-xl md:rounded-2xl border border-slate-200 shadow-inner w-full sm:w-auto">
                <CalendarIcon className="text-orange-500 mx-2 md:mx-3" size={16} />
                <input 
                  type="date" 
                  className="flex-1 bg-transparent font-black text-slate-900 outline-none cursor-pointer text-[10px] md:text-xs pr-2 md:pr-4" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                />
             </div>
             
             <button 
               onClick={exportDetailedExcel}
               className="w-full sm:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
             >
               <FileSpreadsheet size={16} className="md:w-[18px] md:h-[18px]" />
               <span>Export Report</span>
             </button>
          </div>
        </div>
      </div>

      {activeView === 'attendance' ? (
        <>
          {/* Attendance Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 no-print">
             <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                   <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Force</p>
                   <p className="text-2xl md:text-4xl font-black tracking-tighter">{summaryStats.total}</p>
                   <p className="text-[7px] md:text-[9px] font-bold opacity-80 mt-2 uppercase">Personnel registered</p>
                </div>
                <Users size={32} className="md:w-11 md:h-11 opacity-20 group-hover:rotate-12 transition-transform" />
             </div>
             <div className="bg-emerald-600 text-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                   <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Field Presence</p>
                   <p className="text-2xl md:text-4xl font-black tracking-tighter">{summaryStats.percent}%</p>
                   <p className="text-[7px] md:text-[9px] font-bold opacity-80 mt-2 uppercase">Effective Readiness</p>
                </div>
                <Activity size={32} className="md:w-11 md:h-11 opacity-20 group-hover:rotate-12 transition-transform" />
             </div>
             <div className="bg-rose-600 text-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                   <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Absent</p>
                   <p className="text-2xl md:text-4xl font-black tracking-tighter">{summaryStats.counts['absent']}</p>
                   <p className="text-[7px] md:text-[9px] font-bold opacity-80 mt-2 uppercase">Strategic Gap</p>
                </div>
                <ShieldAlert size={32} className="md:w-11 md:h-11 opacity-20 group-hover:rotate-12 transition-transform" />
             </div>
             <div className="bg-indigo-600 text-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                   <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Off-Site Units</p>
                   <p className="text-2xl md:text-4xl font-black tracking-tighter">{summaryStats.counts['TE'] + summaryStats.counts['AP'] + summaryStats.counts['MT'] + summaryStats.counts['cr']}</p>
                   <p className="text-[7px] md:text-[9px] font-bold opacity-80 mt-2 uppercase">Tasks / Leave</p>
                </div>
                <Zap size={32} className="md:w-11 md:h-11 opacity-20 group-hover:rotate-12 transition-transform" />
             </div>
          </div>

          {/* Attendance Distribution */}
          <div className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 shadow-sm no-print relative">
             <div className="flex items-center gap-4 mb-6 md:mb-8">
                <div className="p-2 md:p-3 bg-orange-50 text-orange-500 rounded-lg md:rounded-xl">
                   <TrendingUp size={16} className="md:w-5 md:h-5" />
                </div>
                <h3 className="font-black text-[10px] md:text-[12px] uppercase tracking-[0.2em] text-slate-800">Personnel Distribution</h3>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10 gap-3 md:gap-4">
                {statusOptions.map(opt => (
                  <div key={opt.value} className="bg-slate-50 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 flex flex-col items-center hover:bg-white hover:shadow-lg hover:scale-[1.05] transition-all group">
                     <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl mb-2 md:mb-3 ${opt.activeClass.split(' ')[0]} bg-opacity-10 ${opt.color} transition-all group-hover:bg-opacity-100 group-hover:text-white`}>
                        <opt.icon size={14} className="md:w-[18px] md:h-[18px]" />
                     </div>
                     <span className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">{opt.label}</span>
                     <span className="text-xl md:text-2xl font-black text-slate-900">{summaryStats.counts[opt.value]}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl md:rounded-[4rem] p-6 md:p-12 shadow-sm relative overflow-hidden">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 md:gap-8 mb-8 md:mb-12 no-print">
               <div className="flex items-center gap-4 md:gap-6">
                  <div className="p-4 md:p-5 bg-orange-600 text-white rounded-2xl md:rounded-[1.5rem] shadow-lg shadow-orange-100">
                    <Layers size={24} className="md:w-8 md:h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Attendance Matrix</h2>
                    <p className="text-slate-400 text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] mt-2">Manual Unit Recording</p>
                  </div>
               </div>
               <div className="flex flex-col sm:flex-row gap-4 items-center w-full xl:w-auto">
                  <div className="relative group w-full sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors" size={16} />
                    <input 
                      type="text" placeholder="Search name or ID..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-orange-600 outline-none transition-all shadow-sm"
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button onClick={() => setIsAddingEmployee(true)} className="w-full sm:w-auto p-4 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest">
                    <UserPlus size={18} />
                    <span>Add Unit</span>
                  </button>
               </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl md:rounded-[3.5rem] bg-white shadow-inner">
               <table className="w-full text-left border-collapse print:table min-w-[800px]">
                  <thead>
                     <tr className="bg-slate-100/50 text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                        <th className="p-4 md:p-8 text-center cursor-pointer hover:text-orange-600 transition-colors" onClick={() => toggleSort('id')}>ID <ArrowUpDown size={12} className="inline ml-1" /></th>
                        <th className="p-4 md:p-8 text-left cursor-pointer hover:text-orange-600 transition-colors" onClick={() => toggleSort('name')}>Personnel <ArrowUpDown size={12} className="inline ml-1" /></th>
                        <th className="p-4 md:p-8 text-center">Status Recording</th>
                        <th className="p-4 md:p-8 text-center no-print">Proof</th>
                        <th className="p-4 md:p-8 text-center no-print w-16">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(Object.entries(groupedAndSortedEmployees) as [string, Employee[]][]).map(([dept, emps]) => (
                      <React.Fragment key={dept}>
                        <tr className="bg-slate-50/80 group/dept cursor-pointer" onClick={() => setCollapsedDepts(p => ({...p, [dept]: !p[dept]}))}>
                          <td colSpan={5} className="p-4 md:p-6">
                             <div className="flex items-center justify-between px-4 md:px-6">
                                <div className="flex items-center gap-3 md:gap-4">
                                   <div className="p-1.5 md:p-2 bg-white rounded-lg border border-slate-200 text-orange-600 shadow-sm transition-transform group-hover/dept:rotate-12">
                                      {collapsedDepts[dept] ? <ChevronUp size={14} className="md:w-4 md:h-4" /> : <ChevronDown size={14} className="md:w-4 md:h-4" />}
                                   </div>
                                   <span className="font-black text-xs md:text-sm uppercase tracking-widest text-slate-900">{dept}</span>
                                   <span className="px-2 md:px-3 py-0.5 md:py-1 bg-slate-200 text-slate-600 rounded-full text-[8px] md:text-[10px] font-black">Force: {emps.length}</span>
                                </div>
                             </div>
                          </td>
                        </tr>
                        {!collapsedDepts[dept] && emps.map(emp => {
                           const record = getAttendanceRecord(emp.id);
                           const currentStatus = record?.status || 'absent';
                           const activeOpt = statusOptions.find(o => o.value === currentStatus);
                           return (
                              <tr key={emp.id} className="hover:bg-slate-50/40 transition-all group/row">
                                 <td className="p-4 md:p-8 text-center font-black text-[10px] md:text-[11px] text-slate-400">#{emp.id}</td>
                                 <td className="p-4 md:p-8">
                                    <div className="flex items-center justify-start gap-3 md:gap-5">
                                       <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-[10px] md:text-xs shadow-inner ${activeOpt?.color.replace('text', 'bg').replace('500', '50')} ${activeOpt?.color}`}>
                                          {emp.name.split(' ').map(n => n[0]).join('')}
                                       </div>
                                       <div className="flex flex-col text-left">
                                          <span className="font-black text-slate-900 text-xs md:text-sm tracking-tight">{emp.name}</span>
                                          <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.role || 'Personnel Unit'}</span>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="p-4 md:p-8">
                                    <div className="relative group/picker flex justify-center no-print">
                                       <button className={`flex items-center gap-2 md:gap-4 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl transition-all border-2 shadow-sm ${activeOpt?.activeClass} hover:scale-[1.05] active:scale-95`}>
                                          {activeOpt && <activeOpt.icon size={16} className="md:w-[18px] md:h-[18px]" />}
                                          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{activeOpt?.label}</span>
                                          <ChevronDown size={12} className="opacity-50 transition-transform group-hover/picker:rotate-180 md:w-[14px] md:h-[14px]" />
                                       </button>
                                       <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 invisible group-hover/picker:opacity-100 group-hover/picker:visible transition-all duration-300 transform group-hover/picker:translate-y-0 translate-y-2 p-4 md:p-6 bg-white border border-slate-200 rounded-2xl md:rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] z-[100] min-w-[280px] md:min-w-[380px] grid grid-cols-2 gap-2 md:gap-3">
                                          {statusOptions.map(opt => (
                                             <button key={opt.value} onClick={() => handleStatusChange(emp.id, opt.value)} className={`flex items-center gap-2 md:gap-3 p-2 md:p-3.5 rounded-xl md:rounded-2xl transition-all border-2 group/opt ${currentStatus === opt.value ? `${opt.activeClass.split(' ')[0]} border-slate-900/10` : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-900'}`}>
                                                <div className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-colors ${currentStatus === opt.value ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                                                   <opt.icon size={12} className={currentStatus === opt.value ? 'text-white' : opt.color} />
                                                </div>
                                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                             </button>
                                          ))}
                                       </div>
                                    </div>
                                 </td>
                                 <td className="p-4 md:p-8 text-center no-print">
                                    {record?.attachmentUrl ? (
                                       <button onClick={() => setPreviewImage(record.attachmentUrl!)} className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"><Eye size={16} className="md:w-[18px] md:h-[18px]" /></button>
                                    ) : (
                                       <button onClick={() => { setActiveEmpForFile(emp.id); fileInputRef.current?.click(); }} className="p-2 md:p-3 bg-slate-50 text-slate-300 rounded-xl md:rounded-2xl hover:bg-orange-600 hover:text-white transition-all border border-slate-200"><Camera size={16} className="md:w-[18px] md:h-[18px]" /></button>
                                    )}
                                 </td>
                                 <td className="p-4 md:p-8 text-center no-print">
                                    <button onClick={() => handleDeleteEmployeeSafe(emp.id, emp.name)} className="p-2 md:p-3 text-slate-300 hover:text-rose-500 transition-all hover:scale-110 active:scale-90"><Trash2 size={16} className="md:w-[18px] md:h-[18px]" /></button>
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
        </>
      ) : (
        <>
          {/* Stoppage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
             <div className="bg-orange-600 text-white p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Active Stoppages</p>
                   <p className="text-4xl font-black tracking-tighter">{stoppageData.length}</p>
                   <p className="text-[9px] font-bold opacity-80 mt-2 uppercase">Lines Interrupted</p>
                </div>
                <PauseCircle size={44} className="opacity-20 group-hover:rotate-12 transition-transform" />
             </div>
             <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Downtime</p>
                   <p className="text-4xl font-black tracking-tighter">{totalDowntime}</p>
                   <p className="text-[9px] font-bold opacity-80 mt-2 uppercase">Minutes Accumulated</p>
                </div>
                <Timer size={44} className="opacity-20 group-hover:rotate-12 transition-transform" />
             </div>
             <div className="bg-amber-500 text-white p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">System Risk</p>
                   <p className="text-4xl font-black tracking-tighter">{totalDowntime > 60 ? 'HIGH' : 'LOW'}</p>
                   <p className="text-[9px] font-bold opacity-80 mt-2 uppercase">Operational Impact</p>
                </div>
                <ShieldAlert size={44} className="opacity-20 group-hover:rotate-12 transition-transform" />
             </div>
          </div>

          {/* Downtime Trend Chart */}
          <div className="bg-white border border-slate-200 rounded-3xl md:rounded-[3.5rem] p-6 md:p-10 shadow-sm no-print my-8">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                   <TrendingUp size={20} />
                </div>
                <div>
                   <h3 className="font-black text-[12px] uppercase tracking-[0.2em] text-slate-800">Downtime Velocity Trend</h3>
                   <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mt-1">7-Day Operational Interruption Analysis</p>
                </div>
             </div>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={downtimeTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                         <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                         dataKey="date" 
                         axisLine={false} 
                         tickLine={false} 
                         tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                         dy={10}
                      />
                      <YAxis 
                         axisLine={false} 
                         tickLine={false} 
                         tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                      />
                      <Tooltip 
                         contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            fontSize: '12px',
                            fontWeight: '900',
                            textTransform: 'uppercase'
                         }}
                      />
                      <Area 
                         type="monotone" 
                         dataKey="minutes" 
                         stroke="#4f46e5" 
                         strokeWidth={4}
                         fillOpacity={1} 
                         fill="url(#colorMinutes)" 
                         animationDuration={2000}
                      />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Stoppage Log Matrix */}
          <div className="bg-white border border-slate-200 rounded-3xl md:rounded-[4rem] p-6 md:p-12 shadow-sm relative overflow-hidden">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 md:gap-8 mb-8 md:mb-12 no-print">
               <div className="flex items-center gap-4 md:gap-6">
                  <div className="p-4 md:p-5 bg-orange-600 text-white rounded-2xl md:rounded-[1.5rem] shadow-lg shadow-orange-100">
                    <AlertOctagon size={24} className="md:w-8 md:h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Downtime Analysis Matrix</h2>
                    <p className="text-slate-400 text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] mt-2">Real-time Line Interruption Log</p>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-4 items-center w-full xl:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 pl-10 pr-6 py-3 rounded-xl text-[10px] font-black uppercase outline-none focus:border-orange-600 cursor-pointer shadow-sm appearance-none sm:min-w-[200px]"
                      value={stoppageReasonFilter}
                      onChange={(e) => setStoppageReasonFilter(e.target.value)}
                    >
                      <option value="all">Filter by Reason</option>
                      {allStoppageReasons.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div className="relative group w-full sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors" size={16} />
                    <input 
                      type="text" placeholder="Search line or reason..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-orange-600 outline-none transition-all shadow-sm"
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
               </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl md:rounded-[3.5rem] bg-white shadow-inner">
               <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                     <tr className="bg-slate-100/50 text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                        <th className="p-4 md:p-8">Production Line</th>
                        <th className="p-4 md:p-8">Shift Leader</th>
                        <th className="p-4 md:p-8 text-center">Duration (Mins)</th>
                        <th className="p-4 md:p-8">Root Cause / Reason</th>
                        <th className="p-4 md:p-8 text-center no-print">Broadcast</th>
                        <th className="p-4 md:p-8 text-center no-print">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {stoppageData.length === 0 ? (
                       <tr>
                         <td colSpan={6} className="p-10 md:p-20 text-center">
                            <div className="inline-block p-6 md:p-10 bg-slate-50 rounded-full text-slate-200 mb-4 md:mb-6">
                               <CheckCircle2 size={48} className="md:w-16 md:h-16" />
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">No Stoppages Found</h3>
                            <p className="text-slate-400 text-xs md:text-sm mt-2">Adjust your filters or all lines are currently operating within nominal parameters.</p>
                         </td>
                       </tr>
                     ) : (
                       stoppageData.map((entry) => {
                         const leader = leaders.find(l => l.id === entry.leaderId);
                         return (
                           <tr key={entry.id} className="hover:bg-orange-50/20 transition-all group">
                              <td className="p-4 md:p-8">
                                 <div className="flex items-center gap-3 md:gap-4">
                                    <div className="p-2 md:p-3 bg-slate-900 text-white rounded-lg md:rounded-xl"><MonitorPlay size={16} className="md:w-[18px] md:h-[18px]" /></div>
                                    <span className="font-black text-slate-900 text-xs md:text-sm uppercase tracking-widest">{entry.lineId}</span>
                                 </div>
                              </td>
                              <td className="p-4 md:p-8">
                                 <div className="flex items-center gap-3 md:gap-4">
                                    <img src={leader?.imageUrl} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl object-cover shadow-sm" />
                                    <span className="font-bold text-slate-600 text-[10px] md:text-xs">{leader?.name || 'Unknown'}</span>
                                 </div>
                              </td>
                              <td className="p-4 md:p-8 text-center">
                                 <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-rose-50 text-rose-600 rounded-lg md:rounded-xl font-black text-xs md:text-sm">
                                    <Timer size={12} className="md:w-[14px] md:h-[14px]" />
                                    {entry.downtimeMinutes}m
                                 </div>
                              </td>
                              <td className="p-4 md:p-8">
                                 <p className="text-slate-500 font-bold text-[10px] md:text-xs max-w-xs md:max-w-md italic">"{entry.downtimeReason || 'No technical notes provided.'}"</p>
                              </td>
                              <td className="p-4 md:p-8 text-center no-print">
                                 <button 
                                   onClick={() => shareStoppageWhatsApp(entry)}
                                   className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-lg md:rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                 >
                                    <MessageCircle size={16} className="md:w-[18px] md:h-[18px]" />
                                 </button>
                              </td>
                              <td className="p-4 md:p-8 text-center no-print">
                                 <button onClick={() => handleDeleteProductionRecordSafe(entry.id, entry.lineId)} className="p-2 md:p-3 text-slate-300 hover:text-rose-500 transition-all">
                                    <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                                 </button>
                              </td>
                           </tr>
                         );
                       })
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        </>
      )}

      {/* Proof Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/95 backdrop-blur-lg no-print" onClick={() => setPreviewImage(null)}>
           <button className="absolute top-10 right-10 p-5 bg-white/10 text-white rounded-full hover:bg-rose-500 transition-all shadow-2xl z-10"><X size={32} /></button>
           <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center">
              <img src={previewImage} className="max-w-full max-h-[85vh] object-contain rounded-[2rem] shadow-2xl border-4 border-white/10" alt="Proof" onClick={(e) => e.stopPropagation()} />
              <div className="mt-8 flex gap-4">
                 <button onClick={() => window.open(previewImage, '_blank')} className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl">Open Full Resolution</button>
                 <button onClick={() => setPreviewImage(null)} className="px-10 py-5 bg-white/10 text-white border border-white/20 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all">Close Viewer</button>
              </div>
           </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddingEmployee && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8 no-print">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in" onClick={() => setIsAddingEmployee(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-3xl md:rounded-[4rem] p-8 md:p-12 relative z-10 animate-in zoom-in-95 shadow-2xl border border-slate-100">
             <div className="flex justify-between items-center mb-8 md:mb-10">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter">Register Personnel</h2>
                <button onClick={() => setIsAddingEmployee(false)} className="p-3 md:p-4 bg-slate-100 text-slate-400 rounded-2xl md:rounded-3xl hover:text-red-500 transition-all"><X size={20} className="md:w-6 md:h-6" /></button>
             </div>
             <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">ID</label>
                      <input className="w-full bg-slate-50 border border-slate-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black outline-none focus:border-orange-500 shadow-sm text-xs md:text-base" placeholder="e.g. 101" value={newEmpForm.id} onChange={(e) => setNewEmpForm({...newEmpForm, id: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Dept</label>
                      <input className="w-full bg-slate-50 border border-slate-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black outline-none focus:border-orange-500 shadow-sm text-xs md:text-base" placeholder="Assembly" value={newEmpForm.department} onChange={(e) => setNewEmpForm({...newEmpForm, department: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Full Name</label>
                   <input className="w-full bg-slate-50 border border-slate-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold outline-none focus:border-orange-500 shadow-sm text-xs md:text-base" placeholder="John Doe" value={newEmpForm.name} onChange={(e) => setNewEmpForm({...newEmpForm, name: e.target.value})} />
                </div>
                <button 
                  onClick={() => { 
                    if (newEmpForm.id && newEmpForm.name) {
                      onAddEmployee(newEmpForm as Employee); 
                      setIsAddingEmployee(false);
                      setNewEmpForm({ id: '', name: '', department: '', role: 'Operator', supervisorId: '' });
                    }
                  }} 
                  className="w-full bg-slate-900 text-white py-4 md:py-6 rounded-xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest shadow-2xl transition-all mt-2 md:mt-4 hover:bg-orange-600 active:scale-95"
                >
                  Confirm Registration
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
