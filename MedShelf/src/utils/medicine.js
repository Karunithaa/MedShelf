export const CATEGORIES = ['Tablets', 'Capsules', 'Syrups', 'Creams', 'Sprays', 'Drops', 'Sachets', 'Other'];
export const FORMS = ['Tablet', 'Capsule', 'Syrup', 'Cream', 'Spray', 'Drops', 'Powder', 'Gel', 'Other'];
export const UNITS = ['tablets', 'capsules', 'bottles', 'tubes', 'sachets', 'packs', 'units'];
export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function addDays(days) {
  const d = new Date();
  d.setHours(12,0,0,0); d.setDate(d.getDate()+days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y,m,d] = value.split('-').map(Number);
  const parsed = new Date(y, m-1, d);
  return parsed.getFullYear() === y && parsed.getMonth() === m-1 && parsed.getDate() === d;
}
export function daysUntil(value) {
  const [y,m,d] = value.split('-').map(Number);
  const expiry = Date.UTC(y,m-1,d);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
  return Math.round((expiry-today)/86400000);
}
export function expiryStatus(date, period = 30) {
  const days = daysUntil(date);
  return days < 0 ? 'Expired' : days === 0 ? 'Expiring Today' : days <= period ? 'Expiring Soon' : 'Not Expired';
}
export function stockIsLow(m) { return m.quantity <= m.low_stock_threshold; }
export function integerOrNull(value) {
  if (!/^\d+$/.test(String(value).trim())) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}
export function validateMedicine(m) {
  if (!m.name?.trim()) return 'Medicine name is required.';
  if (!CATEGORIES.includes(m.category)) return 'Select a valid category.';
  if (!FORMS.includes(m.form)) return 'Select a valid medicine form.';
  if (!UNITS.includes(m.unit)) return 'Select a valid quantity unit.';
  if (integerOrNull(m.quantity) === null) return 'Quantity must be a non-negative whole number.';
  if (!validDate(m.expiry_date)) return 'Choose a valid expiry date.';
  if (!m.storage_location?.trim()) return 'Storage location is required.';
  if (integerOrNull(m.low_stock_threshold) === null) return 'Low-stock threshold must be a non-negative whole number.';
  return null;
}
