const SQRT_2PI = Math.sqrt(2 * Math.PI);

function pdf(x) {
  return Math.exp(-0.5 * x * x) / SQRT_2PI;
}

/** Abramowitz & Stegun 7.1.26 via erf */
function cdf(x) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y =
    1 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

function d1d2(S, K, sigma, r, T) {
  const vol = sigma * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / vol;
  return { d1, d2: d1 - vol, vol };
}

export function priceAndGreeks({ S, K, sigma, r, T }) {
  const intrinsicCall = Math.max(S - K, 0);
  const intrinsicPut = Math.max(K - S, 0);
  const df = Math.exp(-r * T);

  if (T <= 1e-8 || sigma <= 1e-8) {
    const digital = S > K ? 1 : S < K ? 0 : 0.5;
    return {
      call: intrinsicCall,
      put: intrinsicPut,
      deltaCall: digital,
      deltaPut: digital - 1,
      gamma: 0,
      vega: 0,
      thetaCall: 0,
      thetaPut: 0,
    };
  }

  const { d1, d2 } = d1d2(S, K, sigma, r, T);
  const nd1 = cdf(d1);
  const nd2 = cdf(d2);
  const nmd1 = cdf(-d1);
  const nmd2 = cdf(-d2);
  const npd1 = pdf(d1);

  const call = S * nd1 - K * df * nd2;
  const put = K * df * nmd2 - S * nmd1;
  const gamma = npd1 / (S * sigma * Math.sqrt(T));
  const vega = (S * npd1 * Math.sqrt(T)) / 100;
  const thetaCall =
    (-S * npd1 * sigma) / (2 * Math.sqrt(T)) - r * K * df * nd2;
  const thetaPut =
    (-S * npd1 * sigma) / (2 * Math.sqrt(T)) + r * K * df * nmd2;

  return {
    call,
    put,
    deltaCall: nd1,
    deltaPut: nd1 - 1,
    gamma,
    vega,
    thetaCall: thetaCall / 365,
    thetaPut: thetaPut / 365,
  };
}

/**
 * Pedagogical implied-vol smile: ATM level tracks `sigma`,
 * wings lift with moneyness, short-dated smiles are sharper.
 */
export function impliedVol(strike, maturity, { S, sigma }) {
  const m = Math.log(strike / S);
  const t = Math.max(maturity, 0.05);
  const smile = 0.55 * sigma * m * m;
  const skew = -0.18 * sigma * m * Math.exp(-0.65 * t);
  const term = 0.035 * (1 - Math.exp(-0.55 * t));
  const wing = 0.04 * Math.abs(m) * Math.sqrt(t);
  return Math.min(0.85, Math.max(0.04, sigma + smile + skew + term + wing));
}
