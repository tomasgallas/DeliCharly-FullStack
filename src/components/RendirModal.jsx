import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function RendirModal({ driver, onConfirm, onCancel, isOpen }) {
  if (!driver || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full space-y-4">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle size={24} />
          <h3 className="text-lg font-bold">Aviso: Debe rendir dinero</h3>
        </div>
        <p className="text-sm text-stone-600">
          El repartidor <strong>{driver.name}</strong> tiene un efectivo acumulado de <strong>${driver.efectivo_acumulado.toLocaleString()}</strong>. ¿Deseas saldar su caja ahora?
        </p>
        <div className="flex gap-3 pt-2">
          <button 
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-stone-600 font-bold hover:bg-stone-100"
          >
            No, esperar
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
          >
            Sí, Rendir
          </button>
        </div>
      </div>
    </div>
  );
}
