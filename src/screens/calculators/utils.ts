export const toRad = (deg: number): number => (deg * Math.PI) / 180;

export const toDeg = (rad: number): number => (rad * 180) / Math.PI;

export const fmt = (val: number, decimals = 1): string =>
  Number.isNaN(val) || !Number.isFinite(val) ? '—' : val.toFixed(decimals);

export const parseNum = (val: string): number => {
  const n = parseFloat(val);
  return Number.isNaN(n) ? 0 : n;
};
