import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export default function RepartidoresManager() {
  const [repartidores, setRepartidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    fetchRepartidores();
  }, []);

  const fetchRepartidores = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('repartidores').select('*').order('name');
    if (error) console.error('Error:', error);
    if (data) setRepartidores(data);
    setLoading(false);
  };

  const addRepartidor = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    
    const { error } = await supabase.from('repartidores').insert([{ name, phone }]);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      setName('');
      setPhone('');
      fetchRepartidores();
    }
  };

  const saldarCaja = async (id) => {
    const { error } = await supabase.from('repartidores').update({
        efectivo_acumulado: 0,
        debe_rendir: false
    }).eq('id', id);
    if (error) alert('Error: ' + error.message);
    else fetchRepartidores();
  };

  const deleteRepartidor = async (id) => {
    if(!confirm('¿Seguro quieres eliminar este repartidor?')) return;
    await supabase.from('repartidores').delete().eq('id', id);
    fetchRepartidores();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-stone-900 tracking-tight">Personal de Reparto</h2>
      
      <form onSubmit={addRepartidor} className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-stone-200">
        <input placeholder="Nombre" className="p-3 border rounded-lg flex-1 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm text-stone-800" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Teléfono" className="p-3 border rounded-lg flex-1 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm font-mono text-stone-800" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button type="submit" className="bg-orange-600 text-white px-5 py-3 rounded-lg flex items-center justify-center gap-2 font-bold hover:bg-orange-700 transition duration-150 uppercase text-xs tracking-wider cursor-pointer">
          <UserPlus size={16} /> Agregar Repartidor
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {loading ? <p className="p-4">Cargando...</p> : (
          <>
            {/* Tabla Desktop */}
            <table className="w-full text-left hidden md:table">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500">
                <tr>
                  <th className="p-4 text-xs font-bold uppercase">Nombre</th>
                  <th className="p-4 text-xs font-bold uppercase">Monto Acumulado</th>
                  <th className="p-4 text-xs font-bold uppercase">Estado</th>
                  <th className="p-4 text-xs font-bold uppercase text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {repartidores.map(r => (
                  <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 font-bold text-stone-950">{r.name}</td>
                    <td className="p-4 font-mono text-stone-700">${Number(r.efectivo_acumulado).toLocaleString()}</td>
                    <td className="p-4">
                      {r.debe_rendir ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          <AlertCircle size={14} /> Debe Rendir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle size={14} /> Al Día
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right flex gap-2 justify-end items-center">
                      {r.debe_rendir && (
                        <button onClick={() => saldarCaja(r.id)} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                          Saldar Caja
                        </button>
                      )}
                      <button onClick={() => deleteRepartidor(r.id)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 cursor-pointer transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Cards Mobile */}
            <div className="md:hidden divide-y divide-stone-100">
              {repartidores.map(r => (
                <div key={r.id} className="p-4 flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-stone-950 text-base">{r.name}</span>
                    <div>
                      {r.debe_rendir ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                          <AlertCircle size={12} />
                          <span>Debe Rendir</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle size={12} />
                          <span>Al Día</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <span className="text-stone-500 font-medium">Efectivo en mano:</span>
                    <span className="font-bold font-mono text-stone-900">${Number(r.efectivo_acumulado).toLocaleString()}</span>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    {r.debe_rendir && (
                      <button 
                        onClick={() => saldarCaja(r.id)} 
                        className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-700 transition-colors"
                      >
                        Saldar Caja
                      </button>
                    )}
                    <button 
                      onClick={() => deleteRepartidor(r.id)} 
                      className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer transition-colors border border-stone-200"
                    >
                      <Trash2 size={16} className="mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
