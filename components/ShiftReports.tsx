
import React, { useState } from 'react';
import { 
  Plus, 
  Printer, 
  X, 
  Save, 
  Clock, 
  History, 
  PenTool as Tool, 
  LayoutGrid, 
  Mail, 
  AlertCircle,
  FileSpreadsheet,
  Share2,
  Trash2,
  MonitorPlay,
  ArrowUpRight
} from 'lucide-react';
import { ProductionEntry, ShiftType, TeamLeader, ProductionLine } from '../types';

interface ShiftReportsProps {
  data: ProductionEntry[];
  leaders: TeamLeader[];
  onAdd: (entry: ProductionEntry) => void;
  onClearAll: () => void;
  onDeleteReport: (id: string) => void;
}

const ShiftReports: React.FC<ShiftReportsProps> = ({ data, leaders, onAdd, onClearAll, onDeleteReport }) => {
  const handleClear = () => {
    if (confirm("Permanently delete all archived reports?")) {
      onClearAll();
    }
  };

  const shareViaEmail = (report: ProductionEntry) => {
    const leader = leaders.find(l => l.id === report.leaderId);
    const subject = `Archived Production Report: ${report.lineId} - ${report.shift} - ${report.date}`;
    const text = `Archived Production Report\n` +
                 `Date: ${report.date}\n` +
                 `Line: ${report.lineId}\n` +
                 `Shift: ${report.shift}\n` +
                 `Actual Output: ${report.totalOutput}\n` +
                 `Target: ${report.totalTarget}\n` +
                 `Efficiency: ${report.efficiency}%`;
    window.location.href = `mailto:${leader?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  };

  const exportToExcel = () => {
    const headers = ["Date", "Line", "Shift", "Output", "Target", "Rejects", "Efficiency", "Downtime Reason"];
    const rows = data.map(r => [
      r.date, 
      r.lineId, 
      r.shift, 
      r.totalOutput, 
      r.totalTarget, 
      r.totalRejects, 
      `${r.efficiency}%`,
      r.downtimeReason || 'None'
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ProTrack_Archive_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-['Inter']">
      <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-orange-50 text-orange-500 rounded-[1.5rem] border border-orange-100">
            <History size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Reports Archive</h2>
            <p className="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Historical Production Record Center</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
          <button onClick={handleClear} className="flex-1 sm:flex-none bg-red-50 text-red-600 px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest border border-red-100 transition-all hover:bg-red-500 hover:text-white">
            <Trash2 size={18} />
            <span>Clear Archive</span>
          </button>
          <button onClick={exportToExcel} className="flex-1 sm:flex-none bg-green-50 text-green-600 px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest border border-green-200 transition-all hover:bg-green-500 hover:text-white">
            <FileSpreadsheet size={18} />
            <span>Export CSV</span>
          </button>
          <button onClick={() => window.print()} className="flex-1 sm:flex-none bg-slate-50 text-slate-600 px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-white transition-all">
            <Printer size={18} />
            <span>Print All</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {data.length === 0 ? (
          <div className="p-32 text-center space-y-6">
             <div className="inline-block p-10 bg-slate-50 rounded-full text-slate-200 border border-slate-50">
                <MonitorPlay size={80} />
             </div>
             <div className="space-y-2">
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Archive is Empty</h3>
               <p className="text-slate-400 text-sm max-w-sm mx-auto">Save reports from the "Shift Boards" to see them here permanently.</p>
             </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="p-8">Date</th>
                  <th className="p-8">Line</th>
                  <th className="p-8">Shift</th>
                  <th className="p-8 text-center">Output / Target</th>
                  <th className="p-8 text-center">Efficiency</th>
                  <th className="p-8 text-center">Notes</th>
                  <th className="p-8 text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((report) => (
                  <tr key={report.id} className="hover:bg-orange-50/30 transition-all group">
                    <td className="p-8 font-black text-slate-900 text-sm">{report.date}</td>
                    <td className="p-8 font-bold text-slate-600 text-xs">{report.lineId}</td>
                    <td className="p-8">
                      <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-widest border border-slate-200">
                        {report.shift}
                      </span>
                    </td>
                    <td className="p-8 text-center">
                       <div className="text-sm font-black text-slate-900">{report.totalOutput} <span className="text-slate-300 mx-1">/</span> {report.totalTarget}</div>
                    </td>
                    <td className="p-8 text-center">
                       <div className={`text-lg font-black ${report.efficiency >= 90 ? 'text-green-500' : 'text-orange-500'}`}>
                          {report.efficiency}%
                       </div>
                    </td>
                    <td className="p-8 text-center">
                       <span className="text-slate-500 font-bold text-xs">{report.downtimeReason || 'None'}</span>
                    </td>
                    <td className="p-8 no-print">
                      <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => shareViaEmail(report)} className="p-3 bg-white border border-slate-100 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-sm">
                          <Mail size={16} />
                        </button>
                        <button onClick={() => onDeleteReport(report.id)} className="p-3 bg-white border border-slate-100 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftReports;
