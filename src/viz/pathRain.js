import { simulatePaths } from "../math/gbm.js";

const CREAM = "227, 216, 190";
const GOLD = "196, 163, 90";
const TEAL = "58, 168, 154";

export function createPathRain(canvas, getParams) {
  const ctx = canvas.getContext("2d", { alpha: false });
  let paths = [];
  let colors = [];
  let widths = [];
  let seed = 7;
  let raf = 0;
  let disposed = false;
  let lastKey = "";
  let steps = 140;
  let drops = [];
  let metrics = { w: 1, h: 1, S: 100, span: 40 };
  let frame = 0;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { clientWidth: w, clientHeight: h } = canvas;
    const W = Math.max(1, Math.floor(w * dpr));
    const H = Math.max(1, Math.floor(h * dpr));
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h, dpr };
  }

  function countForWidth(w) {
    if (w < 720) return 280;
    if (w < 1100) return 520;
    return 800;
  }

  function mapX(k, w) {
    return (k / steps) * w;
  }

  function mapY(px, h, S, span) {
    return h * (1 - (px - (S - span)) / (2 * span));
  }

  function strokeRange(from, to) {
    const { w, h, S, span } = metrics;
    for (let i = 0; i < paths.length; i += 1) {
      const y = paths[i];
      ctx.beginPath();
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = widths[i];
      ctx.moveTo(mapX(from, w), mapY(y[from], h, S, span));
      for (let k = from + 1; k <= to; k += 1) {
        ctx.lineTo(mapX(k, w), mapY(y[k], h, S, span));
      }
      ctx.stroke();
    }
  }

  function rebuild(force = false) {
    const { S, sigma, r, T } = getParams();
    const { w, h } = size();
    const key = `${countForWidth(w)}|${w}x${h}|${S}|${sigma.toFixed(3)}|${r.toFixed(3)}|${T.toFixed(3)}`;
    if (!force && key === lastKey) return;
    lastKey = key;
    const count = countForWidth(w);
    steps = w < 720 ? 90 : 140;
    seed = (seed + 13) >>> 0;
    paths = simulatePaths({ count, steps, S, sigma, r, T, seed });
    colors = new Array(count);
    widths = new Array(count);
    for (let i = 0; i < count; i += 1) {
      const lane = i % 13;
      if (lane === 0) {
        colors[i] = `rgba(${GOLD},0.62)`;
        widths[i] = 1.2;
      } else if (lane === 1) {
        colors[i] = `rgba(${TEAL},0.5)`;
        widths[i] = 1.1;
      } else if (lane < 4) {
        colors[i] = `rgba(${CREAM},0.28)`;
        widths[i] = 0.85;
      } else {
        colors[i] = `rgba(${CREAM},0.11)`;
        widths[i] = 0.7;
      }
    }
    const span = S * Math.max(0.32, sigma * 3.15 * Math.sqrt(T) + 0.16);
    metrics = { w, h, S, span };
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#070a08";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    size();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    strokeRange(0, steps);
    drops = [];
    const nDrops = Math.min(48, Math.floor(count / 16));
    for (let i = 0; i < nDrops; i += 1) {
      drops.push({
        i: (i * 17 + seed) % count,
        k: Math.floor((i / nDrops) * steps),
        hue: i % 3,
      });
    }
  }

  function paintDrops() {
    const { w, h, S, span } = metrics;
    const next = [];
    for (const drop of drops) {
      const y = paths[drop.i];
      if (!y) continue;
      const from = drop.k;
      const to = Math.min(steps, from + 3);
      const tone =
        drop.hue === 0
          ? `rgba(${GOLD},0.85)`
          : drop.hue === 1
            ? `rgba(${TEAL},0.75)`
            : `rgba(${CREAM},0.7)`;
      ctx.beginPath();
      ctx.strokeStyle = tone;
      ctx.lineWidth = 1.35;
      ctx.moveTo(mapX(from, w), mapY(y[from], h, S, span));
      for (let k = from + 1; k <= to; k += 1) {
        ctx.lineTo(mapX(k, w), mapY(y[k], h, S, span));
      }
      ctx.stroke();
      if (to < steps) next.push({ ...drop, k: to });
      else {
        next.push({
          i: Math.floor(Math.random() * paths.length),
          k: 0,
          hue: drop.hue,
        });
      }
    }
    drops = next;
  }

  function paint() {
    rebuild();
    if (!paths.length) return;
    frame += 1;
    if (frame % 100 === 0) strokeRange(0, steps);
    paintDrops();
  }

  function tick() {
    if (disposed) return;
    paint();
    raf = requestAnimationFrame(tick);
  }

  function start() {
    rebuild(true);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(raf);
  }

  function dispose() {
    disposed = true;
    stop();
  }

  return { start, stop, rebuild, dispose, resize: size };
}
