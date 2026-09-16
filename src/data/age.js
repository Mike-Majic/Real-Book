// Età calcolata dalla data di nascita registrata (YYYY-MM-DD), non più
// un'auto-dichiarazione con un pulsante: quella si potrebbe cliccare a
// prescindere dall'età vera, questa usa il dato anagrafico dell'account.
export function computeAge(dobStr) {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

export function isAdult(dobStr) {
  const age = computeAge(dobStr);
  return age !== null && age >= 18;
}
