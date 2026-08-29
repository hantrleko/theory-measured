const listeners = new Set();

export const params = {
  S: 100,
  K: 100,
  sigma: 0.2,
  r: 0.03,
  T: 1,
};

export function setParam(key, value) {
  const next = Number(value);
  if (!Number.isFinite(next) || params[key] === next) return;
  params[key] = next;
  for (const fn of listeners) fn(params, key);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
