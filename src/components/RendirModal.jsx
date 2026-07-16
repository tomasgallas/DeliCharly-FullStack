import React from 'react';
import { AlertTriangle, Check, ArrowRight, X } from 'lucide-react';

export default function RendirModal({ driver, onConfirm, onProceed, onCancel, isOpen }) {
  if (!driver || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#241F1A] border border-stone-800 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 text-stone-200">
        
        {/* Header de Alerta */}
        <div className="flex items-center gap-3 text-amber-500 mb-4">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Alerta de Efectivo</h3>
            <p className="text-xs text-stone-400 font-medium">Repartidor con saldo pendiente</p>
          </div>
        </div>

        {/* Mensaje */}
        <p className="text-stone-300 text-sm leading-relaxed mb-6">
          El repartidor <strong className="text-white">{driver.name}</strong> tiene un saldo acumulado de <strong className="text-orange-500">${Number(driver.efectivo_acumulado).toLocaleString()}</strong>.
          <br /><br />
          ¿Rindió el dinero de los pedidos anteriores en este momento?
        </p>

        {/* Acciones */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold transition duration-150 cursor-pointer flex items-center justify-center gap-2"
          >
            <Check size={16} />
            <span>SÍ, ya rindió el dinero (Volver a $0)</span>
          </button>
          
          <button
            onClick={onProceed}
            className="w-full bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 py-3 rounded-xl text-xs font-bold transition duration-150 cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowRight size={16} />
            <span>NO, esperar (Asignar con deuda acumulada)</span>
          </button>
          
          <button
            onClick={onCancel}
            className="w-full text-stone-500 hover:text-stone-400 py-2 text-xs font-bold transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <X size={14} />
            <span>Cancelar y elegir otro repartidor</span>
          </button>
        </div>

      </div>
    </div>
  );
}
