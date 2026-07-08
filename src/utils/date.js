export const getJornadaDate = () => {
  const now = new Date();
  // Ajuste: si son antes de las 6 AM, consideramos que es la jornada anterior
  // para agrupar pedidos de 8 PM a 2 AM correctamente.
  if (now.getHours() < 6) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().split('T')[0];
};
