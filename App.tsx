
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Megaphone,
  MonitorPlay,
  Cpu,
  Radio,
  FileText,
  Users as UsersIcon,
  LogOut,
  Shield,
  Zap
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ShiftBoards from './components/ShiftBoards';
import ShiftReports from './components/ShiftReports';
import TeamLeaders from './components/TeamLeaders';
import Login from './components/Login';
import { ShiftType, ProductionEntry, TeamLeader, ManagementMember, Employee, AttendanceRecord, AttendanceStatus } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'shifts' | 'reports' | 'leaders'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<TeamLeader | null>(null);
  const [announcement] = useState('APTIV Global Operations: Monitoring system connected. Real-time field data matrix active.');
  
  const [managementTeam, setManagementTeam] = useState<ManagementMember[]>(() => {
    const saved = localStorage.getItem('managementTeam');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'm1',
        name: "Eng. Karim Al-Mansour",
        role: "Operations Director",
        type: 'director',
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        motto: "Leading the future of mobility with precision."
      },
      {
        id: 'm2',
        name: "Sarah Jenkins",
        role: "Production Coordinator",
        type: 'coordinator',
        imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
        motto: "Alignment is the key to efficiency."
      },
      {
        id: 'm3',
        name: "Marco Rossi",
        role: "Shift Chief",
        type: 'shift_chief',
        imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
        motto: "Consistency on the floor drives results."
      }
    ];
  });

  const [leaders, setLeaders] = useState<TeamLeader[]>(() => {
    const saved = localStorage.getItem('leaders');
    return saved ? JSON.parse(saved) : [
      { id: 'l1', name: 'Ahmed Ali', role: 'Morning Supervisor', serialNumber: '1111', email: 'ahmed.ali@aptiv.com', imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', status: 'active', whatsapp: '201000000001' },
      { id: 'l2', name: 'Sara Mohamed', role: 'Evening Supervisor', serialNumber: '2222', email: 'sara.m@aptiv.com', imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', status: 'active', whatsapp: '201000000002' },
      { id: 'l3', name: 'Yassin Mahmoud', role: 'Night Supervisor', serialNumber: '3333', email: 'yassin.m@aptiv.com', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', status: 'active', whatsapp: '201000000003' }
    ];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees');
    return saved ? JSON.parse(saved) : [
      { id: '101', name: 'Mohamed Hassan', department: 'Cable Assembly', role: 'Operator', supervisorId: 'l1' },
      { id: '102', name: 'Youssef Khaled', department: 'Cable Assembly', role: 'Operator', supervisorId: 'l1' },
      { id: '103', name: 'Fatima Zahra', department: 'Quality', role: 'Technician', supervisorId: 'l2' },
      { id: '104', name: 'Omar Yassin', department: 'Packaging', role: 'Operator', supervisorId: 'l3' },
    ];
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('attendance');
    return saved ? JSON.parse(saved) : [];
  });

  const [productionData, setProductionData] = useState<ProductionEntry[]>(() => {
    const saved = localStorage.getItem('productionData');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => localStorage.setItem('managementTeam', JSON.stringify(managementTeam)), [managementTeam]);
  useEffect(() => localStorage.setItem('leaders', JSON.stringify(leaders)), [leaders]);
  useEffect(() => localStorage.setItem('employees', JSON.stringify(employees)), [employees]);
  useEffect(() => localStorage.setItem('attendance', JSON.stringify(attendance)), [attendance]);
  useEffect(() => localStorage.setItem('productionData', JSON.stringify(productionData)), [productionData]);

  const handleUpdateManagementTeam = (team: ManagementMember[]) => setManagementTeam(team);
  const handleUpdateLeader = (updatedLeader: TeamLeader) => {
    setLeaders(prev => prev.map(l => l.id === updatedLeader.id ? updatedLeader : l));
  };
  const handleAddLeader = (newLeader: TeamLeader) => {
    setLeaders(prev => [...prev, newLeader]);
  };

  const handleAttendanceChange = (employeeId: string, status: AttendanceStatus, date: string, attachmentUrl?: string) => {
    setAttendance(prev => {
      const filtered = prev.filter(a => !(a.employeeId === employeeId && a.date === date));
      const existing = prev.find(a => a.employeeId === employeeId && a.date === date);
      return [...filtered, { employeeId, date, status, attachmentUrl: attachmentUrl || existing?.attachmentUrl }];
    });
  };

  const handleAddEmployee = (emp: Employee) => setEmployees(prev => [...prev, emp]);
  const handleDeleteEmployee = (id: string) => setEmployees(prev => prev.filter(e => e.id !== id));

  const navItems = [
    { id: 'dashboard', label: 'Attendance Matrix', icon: LayoutDashboard },
    { id: 'shifts', label: 'Production Boards', icon: MonitorPlay },
    { id: 'leaders', label: 'Supervisor Management', icon: UsersIcon },
    { id: 'reports', label: 'Reports Archive', icon: FileText },
  ];

  if (!currentUser) {
    return <Login leaders={leaders} onLogin={setCurrentUser} />;
  }

  const director = managementTeam.find(m => m.type === 'director')!;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex overflow-hidden font-['Inter'] relative">
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 bg-white border-r border-slate-100 flex flex-col transition-all duration-500 no-print ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-24 -translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 md:p-10 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-100 rotate-3">
              <Cpu className="text-white md:w-7 md:h-7" size={24} />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-none">APTIV</span>
                <span className="text-[8px] md:text-[10px] font-black text-orange-600 uppercase tracking-[0.3em]">Field Matrix</span>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 mt-10 px-6 space-y-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-5 p-5 rounded-[2rem] transition-all duration-500 ${
                activeTab === item.id 
                ? 'bg-orange-50 text-orange-600 border border-orange-100' 
                : 'text-slate-400 hover:text-orange-600 hover:bg-slate-50'
              }`}
            >
              <item.icon size={24} />
              {isSidebarOpen && <span className="font-black text-[11px] uppercase tracking-[0.2em]">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={() => setCurrentUser(null)}
            className="w-full flex items-center gap-5 p-5 rounded-[2rem] text-red-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300"
          >
            <LogOut size={24} />
            {isSidebarOpen && <span className="font-black text-[11px] uppercase tracking-widest">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 w-full">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 md:px-10 py-4 md:py-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-8">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl text-slate-400 hover:text-orange-600 border border-slate-200">
              <Radio size={18} className="md:w-[22px] md:h-[22px]" />
            </button>
            <div className="hidden sm:flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2 md:py-3 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl">
              <Shield size={14} className="text-orange-600 md:w-4 md:h-4" />
              <div className="flex flex-col">
                <span className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Supervisor</span>
                <span className="text-[10px] md:text-xs font-black text-slate-900 tracking-tight truncate max-w-[100px] md:max-w-none">{currentUser.name}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-2 md:mx-10">
            <div className="bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] p-2 md:p-4 flex items-center gap-3 md:gap-5 relative overflow-hidden">
               <Megaphone size={14} className="text-orange-600 md:w-[18px] md:h-[18px]" />
               <div className="flex-1 overflow-hidden">
                 <p className="whitespace-nowrap inline-block animate-marquee text-slate-600 font-bold text-[10px] md:text-xs tracking-wide uppercase">
                   {announcement}
                 </p>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
             <div className="text-right hidden xl:block">
                <p className="text-slate-900 font-black text-sm tracking-tight">{director.name}</p>
                <p className="text-orange-600 text-[9px] font-black uppercase tracking-[0.2em]">{director.role}</p>
             </div>
             <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border-2 border-slate-200 overflow-hidden shadow-md">
               <img src={director.imageUrl} className="w-full h-full object-cover" alt="Director" />
             </div>
          </div>
        </header>

        <div className="p-4 md:p-12 max-w-[1600px] mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard 
              data={productionData} 
              leaders={leaders} 
              managementTeam={managementTeam} 
              employees={employees}
              attendance={attendance}
              onAttendanceChange={handleAttendanceChange}
              onAddEmployee={handleAddEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onUpdateManagementTeam={handleUpdateManagementTeam}
              onDeleteProductionRecord={(id) => setProductionData(p => p.filter(x => x.id !== id))}
            />
          )}
          {activeTab === 'shifts' && (
            <ShiftBoards 
              leaders={leaders}
              productionData={productionData}
              onSaveReport={(report) => {
                setProductionData(prev => [report, ...prev]);
              }}
              onUpdateLeader={handleUpdateLeader}
            />
          )}
          {activeTab === 'leaders' && (
            <TeamLeaders 
              leaders={leaders}
              productionData={productionData}
              onUpdate={handleUpdateLeader}
              onAddLeader={handleAddLeader}
            />
          )}
          {activeTab === 'reports' && (
            <ShiftReports 
              data={productionData}
              leaders={leaders}
              onAdd={(report) => setProductionData(prev => [report, ...prev])}
              onClearAll={() => setProductionData([])}
              onDeleteReport={(id) => setProductionData(prev => prev.filter(r => r.id !== id))}
            />
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
      ` }} />
    </div>
  );
};

export default App;
