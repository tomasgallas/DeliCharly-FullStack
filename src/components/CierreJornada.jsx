import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getJornadaDate } from '../utils/date';
import { RefreshCw, DollarSign, ClipboardCheck, MapPin, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CierreJornada() {
  const [summary, setSummary] = useState([]);
  const [pedidosFull, setPedidosFull] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baseDelDia, setBaseDelDia] = useState(10000);

  useEffect(() => {
    fetchJornadaData();
  }, []);

  const fetchJornadaData = async () => {
    setLoading(true);
    const jornadaDate = getJornadaDate();
    
    const { data: repartidores } = await supabase.from('repartidores').select('*');
    const { data: pedidos } = await supabase.from('pedidos').select('*, repartidores!inner(name)').eq('fecha', jornadaDate);

    const repartidoresList = repartidores || [];
    const pedidosList = pedidos || [];

    const data = repartidoresList.map(r => {
      const pedidosDriver = pedidosList.filter(p => p.repartidor_id === r.id);
      const cantidadEnvios = pedidosDriver.length;
      const recaudadoEnvios = pedidosDriver.reduce((acc, p) => acc + Number(p.costo_envio), 0);
      
      return {
        ...r,
        cantidadEnvios,
        recaudadoEnvios,
        efectivoRendir: Number(r.efectivo_acumulado),
        totalPagar: recaudadoEnvios + (cantidadEnvios > 0 ? Number(baseDelDia) : 0),
        pedidosDetalle: pedidosDriver
      };
    });
    
    setSummary(data);
    setLoading(false);
  };

  const exportarExcel = () => {
    const jornadaDate = getJornadaDate();
    
    // Calcular totales reales desde pedidosFull
    const totalPedidos = pedidosFull.length;
    const totalCajaEnvios = pedidosFull.reduce((acc, p) => acc + Number(p.costo_envio), 0);
    
    const totalRecaudadoEfectivo = pedidosFull
        .filter(p => p.metodo_pago.toLowerCase().includes('efectivo'))
        .reduce((acc, p) => acc + Number(p.total), 0);

    const totalRecaudadoTransferencia = pedidosFull
        .filter(p => !p.metodo_pago.toLowerCase().includes('efectivo'))
        .reduce((acc, p) => acc + Number(p.total), 0);
    
    const wsResumen = XLSX.utils.aoa_to_sheet([
        ["Resumen General"],
        ["Envíos Totales", totalPedidos],
        ["Caja Envíos", totalCajaEnvios],
        ["Recaudación Efectivo", totalRecaudadoEfectivo],
        ["Recaudación Transferencia/Tarjeta", totalRecaudadoTransferencia]
    ]);

    // 2. Repartidores
    const wsRepartidores = XLSX.utils.aoa_to_sheet([
        ["Nombre", "Cantidad de Envíos", "Total a Pagar"],
        ...summary.map(r => [r.name, r.cantidadEnvios, r.totalPagar])
    ]);

    // 3. Detalle
    const detalleRows = [];
    summary.forEach(r => {
        r.pedidosDetalle.forEach(p => {
            detalleRows.push([r.name, p.numero_pedido, p.metodo_pago, p.costo_envio, p.total]);
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
        console.log('Iniciando cierre...');
        
        // 1. Exportar
        exportarExcel();
        console.log('Excel generado.');

        // 2. Limpiar UI
        setSummary([]);
        setLoading(true);

        const jornadaDate = getJornadaDate();
        console.log('Fecha jornada:', jornadaDate);
        
        // 3. Borrar pedidos
        const { error: deleteError } = await supabase.from('pedidos').delete().eq('fecha', jornadaDate);
        if (deleteError) throw deleteError;
        console.log('Pedidos borrados.');

        // 4. Resetear repartidores
        const { error: updateError } = await supabase.from('repartidores').update({
            efectivo_acumulado: 0,
            debe_rendir: false
        }).neq('id', 0);
        if (updateError) throw updateError;
        console.log('Repartidores reseteados.');

        // 5. Finalizar
        alert('Jornada cerrada exitosamente.');
        setTimeout(fetchJornadaData, 1500);
    } catch (error) {
        console.error('Error detallado:', error);
        alert('Error al cerrar jornada: ' + error.message);
    }
  };

  const totalPedidos = summary.reduce((acc, s) => acc + s.cantidadEnvios, 0);
  const totalCajaEnvios = summary.reduce((acc, s) => acc + s.recaudadoEnvios, 0);
  const totalRecaudado = summary.reduce((acc, s) => acc + s.efectivoRendir, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-black text-stone-900">Historial y Caja - {getJornadaDate()}</h2>
        <div className="flex gap-2">
            <button onClick={exportarExcel} className="bg-stone-100 text-stone-700 px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-stone-200">
                <Download size={16} /> Exportar Excel
            </button>
            <button onClick={cerrarJornada} className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-red-700">
                <RefreshCw size={16} /> Cerrar Jornada y Limpiar
            </button>
        </div>
      </div>
      
      {/* Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border flex items-center gap-4">
            <ClipboardCheck className="text-orange-600" size={32} />
            <div><p className="text-stone-500 text-xs font-bold uppercase">Envíos Totales</p><p className="text-2xl font-black">{totalPedidos}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border flex items-center gap-4">
            <MapPin className="text-red-600" size={32} />
            <div><p className="text-stone-500 text-xs font-bold uppercase">Caja Envíos</p><p className="text-2xl font-black">${totalCajaEnvios.toLocaleString()}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border flex items-center gap-4">
            <DollarSign className="text-emerald-600" size={32} />
            <div><p className="text-stone-500 text-xs font-bold uppercase">Recaudación Efectivo</p><p className="text-2xl font-black">${totalRecaudado.toLocaleString()}</p></div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border flex items-center gap-5">
        <label className="font-bold">Base Fija del Día</label>
        <div className="flex items-center bg-stone-50 border rounded-lg px-3">
          <DollarSign size={16} />
          <input type="number" value={baseDelDia} onChange={e => setBaseDelDia(e.target.value)} className="p-2 bg-transparent outline-none w-24 font-bold"/>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border overflow-hidden">
        {loading ? <p className="p-4">Cargando...</p> : (
          <>
            {/* Tabla Desktop */}
            <table className="w-full text-left hidden md:table">
                <thead className="bg-stone-50 border-b">
                    <tr><th className="p-4">Repartidor</th><th className="p-4">Envíos</th><th className="p-4">Efectivo Rendir</th><th className="p-4">Total a Pagar</th></tr>
                </thead>
                <tbody>
                    {summary.map(s => (
                        <tr key={s.id} className="border-b">
                            <td className="p-4 font-bold">{s.name}</td>
                            <td className="p-4">{s.cantidadEnvios}</td>
                            <td className="p-4 text-red-600 font-mono">${s.efectivoRendir.toLocaleString()}</td>
                            <td className="p-4 font-black">${s.totalPagar.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Cards Mobile */}
            <div className="md:hidden divide-y divide-stone-100">
              {summary.map(s => (
                <div key={s.id} className="p-4 flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-stone-900">{s.name}</span>
                    <span className="text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-700 font-medium">
                      {s.cantidadEnvios} {s.cantidadEnvios === 1 ? 'envío' : 'envíos'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                      <p className="text-stone-400 font-bold uppercase text-[9px]">Efectivo Rendir</p>
                      <p className="font-bold font-mono text-red-600 mt-0.5">${s.efectivoRendir.toLocaleString()}</p>
                    </div>
                    <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
                      <p className="text-stone-400 font-bold uppercase text-[9px]">Total a Pagar</p>
                      <p className="font-black font-mono text-stone-900 mt-0.5">${s.totalPagar.toLocaleString()}</p>
                    </div>
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
