import React, { useState, useMemo } from 'react';
import { Boxes, Package, AlertTriangle, Plus, Search, Filter, ShieldCheck, Triangle } from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryProps {
  items: InventoryItem[];
  onUpdate: (items: InventoryItem[]) => void;
}

const Inventory: React.FC<InventoryProps> = ({ items, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterLowStock ? item.quantity < item.minThreshold : true;
      return matchesSearch && matchesFilter;
    });
  }, [items, searchTerm, filterLowStock]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl border border-orange-100">
              <Boxes size={32} />
           </div>
           <div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tighter">مركز إدارة المخزون</h2>
             <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Real-time Stock Control</p>
           </div>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ابحث عن مادة..."
              className="w-full pr-14 pl-6 py-4 border border-slate-100 rounded-2xl outline-none focus:border-orange-200 bg-slate-50 transition-all font-bold text-slate-900 placeholder-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100">
            <Plus size={20} strokeWidth={3} />
            <span>إضافة صنف</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map((item) => {
          const isLowStock = item.quantity < item.minThreshold;
          const statusPercentage = Math.min((item.quantity / (item.minThreshold * 2)) * 100, 100);
          
          return (
            <div key={item.id} className={`bg-white rounded-[2.5rem] border p-10 shadow-sm transition-all hover:shadow-xl relative overflow-hidden ${isLowStock ? 'border-red-200 bg-red-50/10' : 'border-slate-100'}`}>
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-4 rounded-2xl ${isLowStock ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-orange-50 text-orange-500'}`}>
                  {isLowStock ? <AlertTriangle size={24} /> : <Package size={24} />}
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">{item.name}</h3>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${isLowStock ? 'text-red-500' : 'text-slate-400'}`}>
                     {isLowStock ? 'مخزون حرج' : 'مستوى آمن'}
                   </span>
                </div>
              </div>
              <div className="flex items-baseline gap-3 mb-8">
                <span className={`text-6xl font-black tracking-tighter ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>{item.quantity}</span>
                <span className="text-slate-400 font-black text-xs uppercase tracking-widest">{item.unit}</span>
              </div>
              <div className="space-y-4">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full ${isLowStock ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${statusPercentage}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <span>حد الأمان</span>
                   <span>{item.minThreshold} {item.unit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Inventory;