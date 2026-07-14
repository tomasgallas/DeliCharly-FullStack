import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ClipboardPaste, Send, Users, History, LayoutDashboard, LogOut,
  FileText, CheckCircle, AlertCircle, Phone, Calculator, DollarSign,
  AlertTriangle, Menu, X, Pizza, Trash2, MapPin, Download, Check, ClipboardCheck
} from 'lucide-react';
import { parseWhatsAppOrder, generateWhatsAppLink } from '../utils/parser';
import { getJornadaDate } from '../utils/date';
import RendirModal from './RendirModal';

export default function Dashboard() {
  const [orderText, setOrderText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [pagoVerificado, setPagoVerificado] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isTransfer, setIsTransfer] = useState(false);
  const [showRendirModal, setShowRendirModal] = useState(false);
  const [pendingDriver, setPendingDriver] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    const { data } = await supabase.from('repartidores').select('*').order('name');
    if (data) setDrivers(data);
  };

  const handleDriverChange = (driverId) => {
    if (!driverId) {
      setSelectedDriverId('');
      return;
    }
    const driver = drivers.find(d => d.id === parseInt(driverId));
    if (driver && driver.debe_rendir) {
      setPendingDriver(driver);
      setShowRendirModal(true);
    } else {
      setSelectedDriverId(driverId);
    }
  };

  const handleRendirConfirm = async () => {
    console.log('Iniciando rendición para:', pendingDriver);
    const { error } = await supabase.from('repartidores').update({
      efectivo_acumulado: 0,
      debe_rendir: false
    }).eq('id', pendingDriver.id);

    if (error) {
      console.error('Error al rendir:', error);
      alert('Error al rendir: ' + error.message);
    } else {
      console.log('Rendición exitosa, cerrando modal y seleccionando driver');
      setShowRendirModal(false);
      setSelectedDriverId(pendingDriver.id.toString());
      await fetchDrivers();
    }
  };

  const handleParse = (text) => {
    setOrderText(text);
    if (!text.trim()) {
      setParsedData(null);
      return;
    }
    const data = parseWhatsAppOrder(text);
    setParsedData(data);
    setIsTransfer(data.isTransfer);
    setPagoVerificado(false);
    setGeneratedLink('');
  };

  const handleClear = () => {
    setOrderText('');
    setParsedData(null);
    setSelectedDriverId('');
    setPagoVerificado(false);
    setGeneratedLink('');
  };

  const handleDespachar = async () => {
    if (!parsedData || !selectedDriverId) return;

    const driver = drivers.find(d => d.id === parseInt(selectedDriverId));
    const jornadaDate = getJornadaDate();

    // 1. Generar Link
    const link = generateWhatsAppLink(driver.phone, orderText, parsedData, isTransfer, pagoVerificado);
    setGeneratedLink(link);

    // 2. Insertar pedido
    const { error: orderError } = await supabase.from('pedidos').insert([{
      numero_pedido: parsedData.numero || `#${Math.floor(Math.random() * 10000)}`,
      direccion: parsedData.direccion,
      metodo_pago: parsedData.pago,
      total: parsedData.total,
      costo_envio: parsedData.envio,
      repartidor_id: driver.id,
      fecha: jornadaDate,
      despachado_por: 'Admin'
    }]);

    if (orderError) {
      alert('Error al guardar pedido: ' + orderError.message);
      return;
    }

    // 3. Si es efectivo, actualizar repartidor
    if (parsedData.pago.toLowerCase().includes('efectivo')) {
      await supabase.from('repartidores').update({
        efectivo_acumulado: Number(driver.efectivo_acumulado) + Number(parsedData.total),
        debe_rendir: true
      }).eq('id', driver.id);
    }
    fetchDrivers();
    alert('Pedido despachado exitosamente, NO TE OLVIDES DE ENVIAR EL WHATSAPP AL REPARTIDOR!!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h2 className="text-3xl font-black text-stone-900 tracking-tight">Despachar Pedidos</h2>
          <p className="text-stone-500 text-sm mt-1">Copia desde WhatsApp y gestiona el envío de inmediato.</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 flex flex-col justify-between space-y-4">
          <textarea
            className="w-full h-80 p-4 bg-stone-50 border border-stone-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
            value={orderText}
            onChange={(e) => handleParse(e.target.value)}
            placeholder="Pega el mensaje de WhatsApp aquí..."
          />
          {orderText && (
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 rounded-xl transition duration-150 self-end uppercase tracking-wider"
            >
              <Trash2 size={14} />
              Limpiar Mensaje
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
          {parsedData ? (
            <>
              {/* Falso Ticket de Pizzería */}
              <div className="bg-stone-50 border border-stone-200 p-5 rounded-xl text-stone-700 text-sm font-mono relative overflow-hidden">
                {/* Líneas dentadas superiores/inferiores simuladas en el fondo */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-300 to-transparent"></div>

                <div className="text-center pb-3 border-b border-stone-300 border-dashed">
                  <p className="font-bold text-base text-stone-900">DELICHARLY TICKET</p>
                  <p className="text-xs text-stone-400">Despacho de Pedidos</p>
                  {parsedData.numero && <p className="text-xs mt-1 bg-stone-200/80 px-2 py-0.5 rounded inline-block text-stone-800 font-bold">{parsedData.numero}</p>}
                </div>

                <div className="py-4 space-y-2 border-b border-stone-300 border-dashed text-xs">
                  {parsedData.nombre && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">CLIENTE:</span>
                      <span className="font-bold text-stone-900">{parsedData.nombre}</span>
                    </div>
                  )}
                  {parsedData.telefono && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">TELÉFONO:</span>
                      <span className="text-stone-900">{parsedData.telefono}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-400">DIRECCIÓN:</span>
                    <span className="font-bold text-stone-950 text-right max-w-[180px] truncate block" title={parsedData.direccion}>
                      {parsedData.direccion || 'No especificada'}
                    </span>
                  </div>
                  {parsedData.referencia && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">REF:</span>
                      <span className="text-stone-700 italic max-w-[180px] truncate block">{parsedData.referencia}</span>
                    </div>
                  )}
                </div>

                <div className="py-3 border-b border-stone-300 border-dashed space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">FORMA PAGO:</span>
                    <span className={`px-1.5 py-0.5 font-bold rounded text-[10px] ${isTransfer ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                      {parsedData.pago.toUpperCase() || 'NO DETECTADO'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">COSTO ENVÍO:</span>
                    <span className="font-bold text-stone-900">${parsedData.envio.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-3 flex justify-between items-center text-stone-900">
                  <span className="font-bold text-sm">TOTAL:</span>
                  <span className="font-black text-xl">${parsedData.total.toLocaleString()}</span>
                </div>
              </div>

              {isTransfer && (
                <label className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <input type="checkbox" checked={pagoVerificado} onChange={e => setPagoVerificado(e.target.checked)} />
                  <span className="text-sm text-amber-900 font-semibold">Confirmar acreditación en cuenta</span>
                </label>
              )}

              <select
                className="w-full p-3 border rounded-xl"
                value={selectedDriverId}
                onChange={(e) => handleDriverChange(e.target.value)}
              >
                <option value="">Seleccionar Repartidor</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} {d.debe_rendir ? `(Debe: $${d.efectivo_acumulado})` : ''}</option>
                ))}
              </select>

              <RendirModal
                driver={pendingDriver}
                onConfirm={handleRendirConfirm}
                onCancel={() => setShowRendirModal(false)}
                isOpen={showRendirModal}
              />

              {!generatedLink ? (
                <button onClick={handleDespachar} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Send size={16} /> Guardar y Generar WhatsApp
                </button>
              ) : (
                <a href={generatedLink} target="_blank" className="block w-full bg-[#25D366] text-white py-3 rounded-xl font-bold text-center">
                  Enviar Mensaje a Repartidor
                </a>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 font-medium">Esperando datos...</div>
          )}
        </div>
      </div>
    </div>
  );
}
