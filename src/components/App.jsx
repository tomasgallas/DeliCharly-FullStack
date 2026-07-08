import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Menu, X } from 'lucide-react';
import LoginForm from './LoginForm';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import RepartidoresManager from './RepartidoresManager';
import CierreJornada from './CierreJornada';

export default function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <LoginForm onLoginSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-stone-800 flex flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between bg-[#181512] text-white p-4 sticky top-0 z-40 border-b border-stone-800">
        <h2 className="text-xl font-bold tracking-tight text-white">🍕 DeliCharly</h2>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-stone-900 rounded-lg text-stone-300 cursor-pointer"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <Sidebar 
        view={view} 
        setView={setView} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1 p-4 md:p-8 md:ml-64 w-full max-w-full overflow-x-hidden">
        {view === 'dashboard' && <Dashboard />}
        {view === 'repartidores' && <RepartidoresManager />}
        {view === 'cierre' && <CierreJornada />}
      </main>
    </div>
  );
}
