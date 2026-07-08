import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Pizza, Loader2 } from 'lucide-react';

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else if (data.session) {
      onLoginSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#181512] flex items-center justify-center p-4">
      <div className="bg-[#241F1A] border border-stone-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-orange-600 rounded-2xl text-white mb-4">
            <Pizza size={32} />
          </div>
          <h1 className="text-2xl font-black text-white">DeliCharly</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full p-3 bg-[#1e1916] border border-stone-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Contraseña" 
              autoComplete="current-password"
              className="w-full p-3 bg-[#1e1916] border border-stone-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
