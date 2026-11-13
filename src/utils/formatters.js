export function formatCurrency(value) {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(value)
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('es-SV', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}
