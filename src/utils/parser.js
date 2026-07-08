export const parseWhatsAppOrder = (text) => {
  if (!text.trim()) return null;

  // Limpieza robusta: eliminar asteriscos de WhatsApp
  const cleanText = text.replace(/\*/g, '');

  const extract = (regex) => {
    const match = cleanText.match(regex);
    return match ? match[1].trim() : '';
  };

  const pago = extract(/Forma de pago:\s*([^\n]+)/i);
  const totalStr = extract(/TOTAL:\s*\$?([^\n]+)/i) || '0';
  const envioStr = extract(/Costo de envío:\s*\+?\$?([^\n]+)/i) || '0';
  const numero = extract(/Pedido:\s*([^\n]+)/i) || '';
  const direccion = extract(/Dirección:\s*([^\n]+)/i) || '';
  const nombre = extract(/Nombre:\s*([^\n]+)/i) || '';
  const telefono = extract(/Teléfono:\s*([^\n]+)/i) || '';
  const referencia = extract(/Referencia:\s*([^\n]+)/i) || '';

  return {
    numero,
    direccion,
    pago,
    nombre,
    telefono,
    referencia,
    total: parseFloat(totalStr.replace(/\D/g, '')) || 0,
    envio: parseFloat(envioStr.replace(/\D/g, '')) || 0,
    isTransfer: /transferencia|mercado pago|mercadopago|pago online|débito|debito|crédito|credito/i.test(pago)
  };
};

export const generateWhatsAppLink = (phone, orderText, parsedData, isTransfer, pagoVerificado) => {
    // Limpiar advertencias previas
    let wpMessage = orderText.split(/\n*(?:⚠️\s*\*?|\*?)ATENCIÓN REPARTIDOR/i)[0].trim();
    
    // Agregar advertencia si es transferencia/pago online y no está verificado, o si es efectivo
    if (isTransfer && !pagoVerificado) {
      wpMessage += '\n\n⚠️ *ATENCIÓN REPARTIDOR: El pedido todavía NO está pagado. NO entregar sin comprobar pago.*';
    } else if (parsedData && parsedData.pago.toLowerCase().includes('efectivo')) {
      wpMessage += '\n\n⚠️ *ATENCIÓN REPARTIDOR: El pago es en EFECTIVO. NO entregar sin cobrar.*';
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(wpMessage)}`;
};
