import React from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Users, History, Pizza, LogOut } from 'lucide-react';

export default function Sidebar({ view, setView, user, isOpen, onClose }) {
  const menuItems = [
    { id: 'dashboard', name: 'Despacho', icon: LayoutDashboard },
    { id: 'repartidores', name: 'Repartidores', icon: Users },
    { id: 'cierre', name: 'Historial y Caja', icon: History },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className={`fixed inset-y-0 left-0 w-64 bg-[#181512] text-stone-200 border-r border-stone-800 flex flex-col z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform`}>
      <div className="p-6 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-600 rounded-lg text-white">
            <Pizza size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">DeliCharly</h2>
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Panel Interno</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setView(item.id); onClose?.(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                isActive ? 'bg-orange-600 text-white shadow-lg' : 'hover:bg-stone-900 text-stone-400'
              }`}
            >
              <Icon size={18} />
              {item.name}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-stone-800">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-950/30 rounded-xl transition-colors">
          <LogOut size={16} />
          <span className="text-xs font-bold">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
