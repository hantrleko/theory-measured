const TWO_PI = Math.PI * 2;

function gauss(u1, u2) {
  const r = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-12)));
  return r * Math.cos(TWO_PI * u2);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulatePaths({
  count,
  steps,
  S,
  sigma,
  r,
  T,
  seed = 1,
}) {
  const rand = mulberry32(seed);
  const dt = T / steps;
  const drift = (r - 0.5 * sigma * sigma) * dt;
  const vol = sigma * Math.sqrt(dt);
  const paths = new Array(count);

  for (let i = 0; i < count; i += 1) {
    const y = new Float32Array(steps + 1);
    y[0] = S;
    let s = S;
    for (let k = 1; k <= steps; k += 1) {
      s *= Math.exp(drift + vol * gauss(rand(), rand()));
      y[k] = s;
    }
    paths[i] = y;
  }

  return paths;
}
