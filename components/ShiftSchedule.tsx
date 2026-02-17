
import React, { useMemo, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Target, 
  Users,
  MessageSquare,
  Send,
  BellRing,
  GripVertical
} from 'lucide-react';
import { ScheduleEntry, TeamLeader, ShiftType } from '../types';

interface ShiftScheduleProps {
  schedule: ScheduleEntry[];
  leaders: TeamLeader[];
  onUpdate: (schedule: ScheduleEntry[]) => void;
}

const ShiftSchedule: React.FC<ShiftScheduleProps> = ({ schedule, leaders, onUpdate }) => {
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    // عرض 7 أيام (2 سابقين و 5 قادمين)
    for (let i = -2; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d.toISOString().split('T')[0]);
    }
    return arr;
  }, []);

  const getShiftLeader = (date: string, shift: ShiftType) => {
    const entry = schedule.find(s => s.date === date && s.shift === shift);
    return leaders.find(l => l.id === entry?.leaderId);
  };

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split('T')[0];
  };

  const shiftTimes = {
    [ShiftType.MORNING]: "06:00 - 14:00",
    [ShiftType.EVENING]: "14:00 - 22:00",
    [ShiftType.NIGHT]: "22:00 - 06:00",
  };

  // وظيفة إرسال تنبيه فردي للقائد
  const notifyLeader = (leader: TeamLeader, date: string, shift: ShiftType) => {
    const message = `*تذكير بموعد الوردية*\n\nتحية طيبة يا ${leader.name}، نذكرك بموعد ورديتك القادمة:\n📅 التاريخ: ${date}\n🕒 الوردية: ${shift}\n⏰ التوقيت: ${shiftTimes[shift]}\n\nيرجى التواجد قبل الموعد بـ 15 دقيقة للتسليم والاستلام.`;
    // Fix: Use optional property safely by providing a fallback to prevent bad URLs
    const waNumber = leader.whatsapp || '';
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // وظائف السحب والإفلات
  const handleDragStart = (e: React.DragEvent, leaderId: string, sourceDate: string, sourceShift: ShiftType) => {
    e.dataTransfer.setData('leaderId', leaderId);
    e.dataTransfer.setData('sourceDate', sourceDate);
    e.dataTransfer.setData('sourceShift', sourceShift);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, date: string, shift: ShiftType) => {
    e.preventDefault();
    setDragOverCell(`${date}-${shift}`);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetDate: string, targetShift: ShiftType) => {
    e.preventDefault();
    setDragOverCell(null);
    
    const leaderId = e.dataTransfer.getData('leaderId');
    const sourceDate = e.dataTransfer.getData('sourceDate');
    const sourceShift = e.dataTransfer.getData('sourceShift');

    if (!leaderId) return;

    // تحديث الجدول: مسح المصدر وتحديث الهدف
    let newSchedule = schedule.filter(s => !(s.date === sourceDate && s.shift === sourceShift));
    
    // مسح الهدف إذا كان به قائد آخر (استبدال)
    newSchedule = newSchedule.filter(s => !(s.date === targetDate && s.shift === targetShift));

    // إضافة القائد للهدف
    newSchedule.push({
      id: `s-${targetDate}-${targetShift}-${Date.now()}`,
      leaderId,
      date: targetDate,
      shift: targetShift
    });

    onUpdate(newSchedule);
  };

  // وظيفة بث جدول اليوم بالكامل للمجموعة
  const shareDailySchedule = () => {
    const today = new Date().toISOString().split('T')[0];
    const morning = getShiftLeader(today, ShiftType.MORNING);
    const evening = getShiftLeader(today, ShiftType.EVENING);
    const night = getShiftLeader(today, ShiftType.NIGHT);

    const message = `*📊 جدول ورديات اليوم: ${today}*\n\n` +
      `🌅 *الوردية الصباحية:* ${morning?.name || 'قيد التعيين'}\n` +
      `🌇 *الوردية المسائية:* ${evening?.name || 'قيد التعيين'}\n` +
      `🌃 *الوردية الليلية:* ${night?.name || 'قيد التعيين'}\n\n` +
      `💡 _نظام ProTrack AI يتمنى لكم يوماً منتجاً وآمناً._`;

    // Fix: Fallback to general sharing link if group link is not defined
    const groupLink = leaders[0]?.whatsappGroup || `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    // Fix: Explicitly check for property existence before use
    if (leaders[0]?.whatsappGroup) {
        navigator.clipboard.writeText(message);
        alert("تم نسخ الجدول اليومي! سيتم فتح رابط المجموعة الآن، قم بلصق الرسالة هناك.");
        window.open(groupLink, '_blank');
    } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header Section */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">مخطط الانتشار العملياتي</h2>
          </div>
          <p className="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em] pr-6">Strategic Deployment Timeline</p>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={shareDailySchedule}
            className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-green-100 transition-all"
          >
            <Send size={18} />
            <span>بث الجدول لليوم (WhatsApp)</span>
          </button>
          <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <button className="p-3 text-slate-400 hover:text-orange-500 transition-all"><ChevronRight size={20} /></button>
            <div className="px-6 py-2 flex items-center gap-3">
               <Calendar size={18} className="text-orange-500" />
               <span className="text-slate-900 font-black text-xs uppercase tracking-widest">الجدول الزمني الذكي</span>
            </div>
            <button className="p-3 text-slate-400 hover:text-orange-500 transition-all"><ChevronLeft size={20} /></button>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden p-2">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[1100px] flex flex-col">
            {/* Table Header: Dates */}
            <div className="grid grid-cols-8 gap-4 mb-4 p-4">
              <div className="col-span-1 flex items-center justify-center font-black text-slate-300 text-[10px] uppercase tracking-widest">توقيت الوردية</div> 
              {dates.map((date) => {
                const dayName = new Date(date).toLocaleDateString('ar-EG', { weekday: 'short' });
                const dayNum = new Date(date).getDate();
                const active = isToday(date);
                
                return (
                  <div 
                    key={date} 
                    className={`col-span-1 p-6 rounded-[2.5rem] flex flex-col items-center gap-1 transition-all duration-500 ${
                      active 
                      ? 'bg-orange-500 text-white shadow-xl shadow-orange-100 scale-105 z-10' 
                      : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">{active ? 'اليوم' : dayName}</span>
                    <span className="text-2xl font-black tracking-tighter">{dayNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Table Body: Shifts */}
            {[ShiftType.MORNING, ShiftType.EVENING, ShiftType.NIGHT].map((shift) => (
              <div key={shift} className="grid grid-cols-8 gap-4 items-center p-4 border-t border-slate-50">
                 <div className="col-span-1 pr-4 flex flex-col items-start gap-1">
                    <span className="text-orange-600 font-black text-[11px] uppercase tracking-[0.2em]">{shift}</span>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={12} />
                      <span className="font-bold text-[9px] tracking-widest whitespace-nowrap">{shiftTimes[shift]}</span>
                    </div>
                 </div>

                 {dates.map((date) => {
                   const leader = getShiftLeader(date, shift);
                   const active = isToday(date);
                   const isDragOver = dragOverCell === `${date}-${shift}`;
                   
                   return (
                     <div 
                       key={`${date}-${shift}`} 
                       onDragOver={(e) => handleDragOver(e, date, shift)}
                       onDragLeave={handleDragLeave}
                       onDrop={(e) => handleDrop(e, date, shift)}
                       className={`col-span-1 h-44 rounded-[2.5rem] border p-2 transition-all duration-300 relative group overflow-hidden ${
                         isDragOver ? 'bg-orange-100 border-orange-400 scale-[1.02] z-20' :
                         leader 
                         ? 'bg-white border-slate-100 hover:border-orange-200 hover:shadow-lg' 
                         : 'bg-slate-50/50 border-dashed border-slate-200 opacity-40'
                       } ${active && !leader ? 'bg-orange-50/20' : ''}`}
                     >
                       {leader ? (
                         <div 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, leader.id, date, shift)}
                            className="w-full h-full flex flex-col p-4 relative z-10 cursor-grab active:cursor-grabbing"
                         >
                            <div className="flex flex-col items-center text-center gap-3">
                               <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md relative group-hover:scale-110 transition-transform">
                                  <img src={leader.imageUrl} className="w-full h-full object-cover" alt={leader.name} />
                                  <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <GripVertical size={16} className="text-orange-500" />
                                  </div>
                               </div>
                               <div className="overflow-hidden w-full">
                                  <p className="text-slate-900 font-black text-[10px] truncate uppercase tracking-tight">{leader.name}</p>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); notifyLeader(leader, date, shift); }}
                                    className="mt-2 flex items-center justify-center gap-1.5 bg-green-50 text-green-600 py-1.5 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all border border-green-100 hover:bg-green-500 hover:text-white"
                                  >
                                    <BellRing size={10} /> تنبيه WhatsApp
                                  </button>
                               </div>
                            </div>
                            
                            <div className="absolute top-2 left-2">
                               <ShieldCheck size={12} className="text-orange-200" />
                            </div>
                         </div>
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                            <Zap size={20} strokeWidth={1.5} />
                            <span className="text-[8px] font-black uppercase tracking-widest mt-2">قيد التعيين</span>
                         </div>
                       )}
                     </div>
                   );
                 })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 p-8 text-orange-500/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
               <ShieldCheck size={140} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-4 relative z-10">
               <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl"><Activity size={20} /></div>
               بروتوكول الانتشار الميداني
            </h3>
            <ul className="space-y-5 relative z-10 pr-2">
               {[
                 "التزام المشرفين بمواعيد التسليم الرقمي قبل بدء الوردية بـ 15 دقيقة.",
                 "المناوبات الليلية تتطلب تفعيل وضع التنبيه الأقصى لخطوط الكابلات.",
                 "تحديث تقرير الحالة عبر الواتساب فور انتهاء الوردية مباشرة."
               ].map((note, i) => (
                 <li key={i} className="flex gap-4 items-start text-slate-500 text-sm leading-relaxed group/item">
                   <div className="w-2 h-2 rounded-full bg-orange-200 mt-2 shrink-0 group-hover/item:bg-orange-500 transition-colors"></div>
                   {note}
                 </li>
               ))}
            </ul>
         </div>

         <div className="bg-orange-500 rounded-[3.5rem] p-12 flex flex-col justify-between shadow-xl shadow-orange-100 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mb-32"></div>
            
            <div className="relative z-10">
               <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
                 <Users className="text-orange-200" /> كفاءة التغطية الإدارية
               </h3>
               <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20">
                     <p className="text-[10px] font-black text-orange-100 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Target size={12} /> التغطية الحالية
                     </p>
                     <p className="text-4xl font-black text-white tracking-tighter">100%</p>
                  </div>
                  <div className="p-6 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20">
                     <p className="text-[10px] font-black text-orange-100 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Users size={12} /> القوى العاملة
                     </p>
                     <p className="text-4xl font-black text-white tracking-tighter">03 <span className="text-sm font-bold opacity-60">مشرفين</span></p>
                  </div>
               </div>
            </div>
            
            <button className="mt-10 bg-white text-orange-600 py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] transition-all active:scale-95 relative z-10">
               تعديل خطة الانتشار الاستراتيجية
            </button>
         </div>
      </div>
    </div>
  );
};

export default ShiftSchedule;
