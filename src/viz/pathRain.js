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
  let drawTo = 0;
  let drawn = 0;
  let hold = 0;
  let raf = 0;
  let disposed = false;
  let lastSigma = NaN;
  let lastKey = "";
  let steps = 140;

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

  function rebuild(force = false) {
    const { S, sigma, r, T } = getParams();
    const { w, h } = size();
    const key = `${countForWidth(w)}|${w}x${h}|${S}|${sigma.toFixed(3)}|${r.toFixed(3)}|${T.toFixed(3)}`;
    if (!force && key === lastKey) return;
    lastKey = key;
    lastSigma = sigma;
    const count = countForWidth(w);
    steps = w < 720 ? 90 : 140;
    seed = (seed + 13) >>> 0;
    paths = simulatePaths({ count, steps, S, sigma, r, T, seed });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#070a08";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    size();
    colors = new Array(count);
    widths = new Array(count);
    for (let i = 0; i < count; i += 1) {
      const lane = i % 17;
      if (lane === 0) {
        colors[i] = `rgba(${GOLD},0.55)`;
        widths[i] = 1.15;
      } else if (lane === 1) {
        colors[i] = `rgba(${TEAL},0.42)`;
        widths[i] = 1.05;
      } else if (lane < 4) {
        colors[i] = `rgba(${CREAM},0.22)`;
        widths[i] = 0.8;
      } else {
        colors[i] = `rgba(${CREAM},0.055)`;
        widths[i] = 0.65;
      }
    }
    drawTo = 2;
    drawn = 0;
    hold = 0;
  }

  function paint() {
    const { w, h } = size();
    const { S, sigma, T } = getParams();
    rebuild();

    if (!paths.length) return;
    const span = S * Math.max(0.35, sigma * 3.4 * Math.sqrt(T) + 0.18);
    const yMin = S - span;
    const yMax = S + span;
    const mapX = (k) => (k / steps) * w;
    const mapY = (px) => h * (1 - (px - yMin) / (yMax - yMin));

    const end = Math.min(steps, Math.floor(drawTo));
    if (end > drawn) {
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (let i = 0; i < paths.length; i += 1) {
        const y = paths[i];
        ctx.beginPath();
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = widths[i];
        ctx.moveTo(mapX(drawn), mapY(y[drawn]));
        for (let k = drawn + 1; k <= end; k += 1) {
          ctx.lineTo(mapX(k), mapY(y[k]));
        }
        ctx.stroke();
      }
      drawn = end;
    }

    if (end < steps) {
      drawTo += 1.25 + sigma * 1.8;
    } else {
      hold += 1;
      if (hold > 110) {
        ctx.fillStyle = "rgba(7, 10, 8, 0.06)";
        ctx.fillRect(0, 0, w, h);
        if (hold > 175) rebuild(true);
      }
    }
  }

  function tick() {
    if (disposed) return;
    paint();
    raf = requestAnimationFrame(tick);
  }

  function start() {
    size();
    ctx.fillStyle = "#070a08";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
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
