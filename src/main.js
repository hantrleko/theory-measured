import { params, setParam, subscribe } from "./state.js";
import { priceAndGreeks } from "./math/blackScholes.js";
import { todaysThree, formatLabDate } from "./data/dailyThree.js";
import { createPathRain } from "./viz/pathRain.js";
import { createVolSurface } from "./viz/volSurface.js";
import "./styles.css";

const fmt = {
  px: (n) => n.toFixed(4),
  g: (n) => (Math.abs(n) < 0.0005 ? n.toExponential(2) : n.toFixed(4)),
  pct: (n) => `${(n * 100).toFixed(1)}%`,
};

const sliderMeta = {
  S: { label: "Spot S", min: 50, max: 200, step: 0.5, show: (v) => v.toFixed(1) },
  K: { label: "Strike K", min: 50, max: 200, step: 0.5, show: (v) => v.toFixed(1) },
  sigma: { label: "Vol σ", min: 0.05, max: 0.8, step: 0.005, show: (v) => fmt.pct(v) },
  r: { label: "Rate r", min: 0, max: 0.15, step: 0.001, show: (v) => fmt.pct(v) },
  T: { label: "Tenor T", min: 0.05, max: 5, step: 0.01, show: (v) => v.toFixed(2) },
};

function mountSliders(root) {
  root.innerHTML = Object.entries(sliderMeta)
    .map(([key, meta]) => {
      const value = params[key];
      return `
        <label class="slider">
          <span class="slider-meta">
            <span class="slider-name">${meta.label}</span>
            <span class="slider-val" data-for="${key}">${meta.show(value)}</span>
          </span>
          <input
            type="range"
            name="${key}"
            min="${meta.min}"
            max="${meta.max}"
            step="${meta.step}"
            value="${value}"
            aria-label="${meta.label}"
          />
        </label>
      `;
    })
    .join("");

  root.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "range") return;
    setParam(input.name, input.value);
  });
}

function bindQuotes() {
  const nodes = {
    call: document.querySelector("[data-quote=call]"),
    put: document.querySelector("[data-quote=put]"),
    deltaCall: document.querySelector("[data-g=deltaCall]"),
    deltaPut: document.querySelector("[data-g=deltaPut]"),
    gamma: document.querySelector("[data-g=gamma]"),
    vega: document.querySelector("[data-g=vega]"),
    thetaCall: document.querySelector("[data-g=thetaCall]"),
    thetaPut: document.querySelector("[data-g=thetaPut]"),
  };

  function render() {
    const q = priceAndGreeks(params);
    nodes.call.textContent = fmt.px(q.call);
    nodes.put.textContent = fmt.px(q.put);
    nodes.deltaCall.textContent = fmt.g(q.deltaCall);
    nodes.deltaPut.textContent = fmt.g(q.deltaPut);
    nodes.gamma.textContent = fmt.g(q.gamma);
    nodes.vega.textContent = fmt.g(q.vega);
    nodes.thetaCall.textContent = fmt.g(q.thetaCall);
    nodes.thetaPut.textContent = fmt.g(q.thetaPut);
    for (const [key, meta] of Object.entries(sliderMeta)) {
      const el = document.querySelector(`[data-for="${key}"]`);
      if (el) el.textContent = meta.show(params[key]);
    }
  }

  subscribe(render);
  render();
}

function mountDailyThree() {
  const { date, beginner, core, frontier } = todaysThree();
  document.querySelector("[data-lab-date]").textContent = formatLabDate(date);
  const slots = [
    ["beginner", beginner],
    ["core", core],
    ["frontier", frontier],
  ];
  for (const [key, item] of slots) {
    const card = document.querySelector(`[data-track="${key}"]`);
    card.querySelector(".track-title").textContent = item.title;
    card.querySelector(".track-dek").textContent = item.dek;
  }
}

function boot() {
  mountSliders(document.querySelector("#sliders"));
  bindQuotes();
  mountDailyThree();

  const rain = createPathRain(document.querySelector("#paths"), () => params);
  const surface = createVolSurface(document.querySelector("#surface"), () => params);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  rain.start();
  surface.start();
  if (reduced) {
    rain.stop();
  }

  let resizeTick = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeTick);
    resizeTick = requestAnimationFrame(() => {
      rain.resize();
      surface.resize();
    });
  });

  requestAnimationFrame(() => {
    document.documentElement.classList.add("is-ready");
  });
}

boot();
