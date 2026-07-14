import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getJornadaDate } from '../utils/date';
import { RefreshCw, DollarSign, ClipboardCheck, MapPin, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CierreJornada() {
  const [repartidores, setRepartidores] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baseDelDia, setBaseDelDia] = useState(10000);

  useEffect(() => {
    fetchJornadaData();
  }, []);

  const fetchJornadaData = async () => {
    setLoading(true);
    try {
      const jornadaDate = getJornadaDate();
      
      const { data: resRepartidores, error: repError } = await supabase.from('repartidores').select('*').order('name');
      if (repError) throw repError;
      
      const { data: resPedidos, error: pedError } = await supabase.from('pedidos').select('*').eq('fecha', jornadaDate);
      if (pedError) throw pedError;

      setRepartidores(resRepartidores || []);
      setPedidos(resPedidos || []);
    } catch (err) {
      console.error('Error fetching jornada data:', err);
      alert('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // El summary se recalcula de manera reactiva instantáneamente cuando cambia baseDelDia, repartidores o pedidos.
  const summary = useMemo(() => {
    const baseValue = Number(baseDelDia) || 0;
    return repartidores.map(r => {
      const pedidosDriver = pedidos.filter(p => p.repartidor_id === r.id);
      const cantidadEnvios = pedidosDriver.length;
      const recaudadoEnvios = pedidosDriver.reduce((acc, p) => acc + Number(p.costo_envio || 0), 0);
      
      return {
        ...r,
        cantidadEnvios,
        recaudadoEnvios,
        efectivoRendir: Number(r.efectivo_acumulado || 0),
        totalPagar: recaudadoEnvios + (cantidadEnvios > 0 ? baseValue : 0),
        pedidosDetalle: pedidosDriver
      };
    });
  }, [repartidores, pedidos, baseDelDia]);

  const exportarExcel = () => {
    const jornadaDate = getJornadaDate();
    
    // Totales reales del día calculados de manera segura
    const totalPedidos = pedidos.length;
    const totalCajaEnvios = pedidos.reduce((acc, p) => acc + Number(p.costo_envio || 0), 0);
    
    const totalRecaudadoEfectivo = pedidos
      .filter(p => (p.metodo_pago || '').toLowerCase().includes('efectivo'))
      .reduce((acc, p) => acc + Number(p.total || 0), 0);

    const totalRecaudadoTransferencia = pedidos
      .filter(p => !(p.metodo_pago || '').toLowerCase().includes('efectivo'))
      .reduce((acc, p) => acc + Number(p.total || 0), 0);
    
    const wsResumen = XLSX.utils.aoa_to_sheet([
      ["Resumen General"],
      ["Envíos Totales", totalPedidos],
      ["Caja Envíos", totalCajaEnvios],
      ["Recaudación Efectivo", totalRecaudadoEfectivo],
      ["Recaudación Transferencia/Tarjeta", totalRecaudadoTransferencia]
    ]);

    // Sheet 2: Repartidores
    const wsRepartidores = XLSX.utils.aoa_to_sheet([
      ["Nombre", "Cantidad de Envíos", "Total a Pagar"],
      ...summary.map(r => [r.name, r.cantidadEnvios, r.totalPagar])
    ]);

    // Sheet 3: Detalle de Pedidos
    const detalleRows = [];
    summary.forEach(r => {
      r.pedidosDetalle.forEach(p => {
        detalleRows.push([r.name, p.numero_pedido, p.metodo_pago, Number(p.costo_envio || 0), Number(p.total || 0)]);
      });
    });
    const wsDetalle = XLSX.utils.aoa_to_sheet([
      ["Repartidor", "ID Pedido", "Forma de pago", "Costo Envío", "Total"],
      ...detalleRows
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen General");
    XLSX.utils.book_append_sheet(wb, wsRepartidores, "Repartidores");
    XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle Pedidos");

    XLSX.writeFile(wb, `Cierre_${jornadaDate}.xlsx`);
  };

  const cerrarJornada = async () => {
    if (!confirm('¿Seguro quieres cerrar la jornada? Se generará el Excel, se eliminarán los pedidos y se reseteará el efectivo.')) return;

    try {
      setLoading(true);
      console.log('Iniciando cierre de jornada nocturna...');
      
      // 1. Exportar primero para tener el archivo seguro
      exportarExcel();
      console.log('Excel exportado correctamente.');

      const jornadaDate = getJornadaDate();
      
      // 2. Borrar pedidos de este día
      const { error: deleteError } = await supabase.from('pedidos').delete().eq('fecha', jornadaDate);
      if (deleteError) throw deleteError;
      console.log('Pedidos de la jornada borrados de Supabase.');

      // 3. Resetear el efectivo acumulado de los repartidores
      const { error: updateError } = await supabase.from('repartidores').update({
        efectivo_acumulado: 0,
        debe_rendir: false
      }).gt('id', 0);
      if (updateError) throw updateError;
      console.log('Efectivo acumulado y alertas de repartidores reseteados.');

      alert('Jornada nocturna cerrada exitosamente. Los pedidos de hoy han sido borrados de la base de datos y la caja de los repartidores ha vuelto a $0.');
      
      // 4. Volver a cargar para limpiar interfaz
      await fetchJornadaData();
    } catch (error) {
      console.error('Error detallado al cerrar jornada:', error);
      alert('Error crítico al cerrar jornada: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPedidos = useMemo(() => summary.reduce((acc, s) => acc + s.cantidadEnvios, 0), [summary]);
  const totalCajaEnvios = useMemo(() => summary.reduce((acc, s) => acc + s.recaudadoEnvios, 0), [summary]);
  const totalRecaudado = useMemo(() => summary.reduce((acc, s) => acc + s.efectivoRendir, 0), [summary]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-200 pb-5">
        <div>
          <h2 className="text-3xl font-black text-stone-900 tracking-tight">Historial y Caja</h2>
          <p className="text-stone-500 text-sm mt-1">Cierre de jornada y liquidación de repartidores - {getJornadaDate()}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={exportarExcel} 
            className="flex-1 md:flex-none bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition duration-150 text-xs uppercase tracking-wider cursor-pointer border border-stone-200"
          >
            <Download size={16} /> Exportar Excel
          </button>
          <button 
            onClick={cerrarJornada} 
            className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition duration-150 text-xs uppercase tracking-wider cursor-pointer shadow-md hover:shadow-lg"
          >
            <RefreshCw size={16} /> Cerrar Jornada y Limpiar
          </button>
        </div>
      </div>
      
      {/* Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-orange-50 rounded-xl text-orange-600 border border-orange-100">
            <ClipboardCheck size={28} />
          </div>
          <div>
            <p className="text-stone-400 text-[10px] font-extrabold uppercase tracking-widest">Envíos Totales</p>
            <p className="text-3xl font-black text-stone-900 mt-0.5">{totalPedidos}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-red-50 rounded-xl text-red-600 border border-red-100">
            <MapPin size={28} />
          </div>
          <div>
            <p className="text-stone-400 text-[10px] font-extrabold uppercase tracking-widest">Caja Envíos</p>
            <p className="text-3xl font-black text-stone-900 mt-0.5">${totalCajaEnvios.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-stone-400 text-[10px] font-extrabold uppercase tracking-widest">Recaudación Efectivo</p>
            <p className="text-3xl font-black text-stone-900 mt-0.5">${totalRecaudado.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-full sm:w-auto">
          <label className="block text-stone-500 text-xs font-bold uppercase tracking-wider mb-1.5">Base Fija del Día</label>
          <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-orange-500 transition duration-150">
            <DollarSign size={16} className="text-stone-400 mr-1" />
            <input 
              type="number" 
              value={baseDelDia} 
              onChange={e => setBaseDelDia(e.target.value)} 
              className="p-2.5 bg-transparent outline-none w-28 font-bold text-stone-800 text-sm"
            />
          </div>
        </div>
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-150 flex-1">
          <p className="text-xs text-stone-600 leading-relaxed font-medium">
            💡 <b>Cálculo en Tiempo Real:</b> El sistema recalcula inmediatamente las rendiciones y los montos a pagar cada vez que modificas la Base del Día, sin necesidad de guardar o recargar la página.
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-stone-500 flex items-center justify-center gap-2">
            <RefreshCw className="animate-spin" size={16} /> Cargando datos de la jornada...
          </div>
        ) : (
          <>
            {/* Tabla Desktop */}
            <table className="w-full text-left hidden md:table">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500">
                <tr>
                  <th className="p-4.5 text-xs font-bold uppercase tracking-wider">Repartidor</th>
                  <th className="p-4.5 text-xs font-bold uppercase tracking-wider text-center">Envíos</th>
                  <th className="p-4.5 text-xs font-bold uppercase tracking-wider">Efectivo Rendir</th>
                  <th className="p-4.5 text-xs font-bold uppercase tracking-wider text-right">Total a Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {summary.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-stone-400 italic">No hay repartidores registrados.</td>
                  </tr>
                ) : (
                  summary.map(s => (
                    <tr key={s.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="p-4.5 font-bold text-stone-900">{s.name}</td>
                      <td className="p-4.5 text-center font-bold text-stone-700">{s.cantidadEnvios}</td>
                      <td className="p-4.5 text-red-650 font-semibold font-mono">${s.efectivoRendir.toLocaleString()}</td>
                      <td className="p-4.5 font-black text-stone-950 font-mono text-right text-base">${s.totalPagar.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Cards Mobile */}
            <div className="md:hidden divide-y divide-stone-100">
              {summary.length === 0 ? (
                <div className="p-8 text-center text-stone-400 italic">No hay repartidores registrados.</div>
              ) : (
                summary.map(s => (
                  <div key={s.id} className="p-5 flex flex-col space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-900 text-base">{s.name}</span>
                      <span className="text-xs bg-stone-100 px-3 py-1 rounded-full text-stone-700 font-bold">
                        {s.cantidadEnvios} {s.cantidadEnvios === 1 ? 'envío' : 'envíos'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                      <div className="bg-stone-50 p-3 rounded-xl border border-stone-150">
                        <p className="text-stone-400 font-bold uppercase text-[9px] tracking-wider">Efectivo Rendir</p>
                        <p className="font-bold font-mono text-red-600 mt-0.5 text-sm">${s.efectivoRendir.toLocaleString()}</p>
                      </div>
                      <div className="bg-stone-50 p-3 rounded-xl border border-stone-150">
                        <p className="text-stone-400 font-bold uppercase text-[9px] tracking-wider">Total a Pagar</p>
                        <p className="font-black font-mono text-stone-900 mt-0.5 text-sm">${s.totalPagar.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
