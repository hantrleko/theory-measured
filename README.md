# Theory, measured.

Cinematic single-page teaser for [eugenefinance.tech](https://eugenefinance.tech/). **EF LAB V6.5.**

An econ & finance lab you can run. Study only. Not investment advice.

## What it is

A dark, poster-like page: live Monte Carlo path rain, an orbitable implied-vol smile, and a Black–Scholes desk that prices the claim as you move the sliders.

- **Hero** — ~800 geometric Brownian motion paths (cream / gold / teal) behind the display line *Theory, measured.*
- **Smile** — Three.js surface, navy → teal → orange, axes Strike / Maturity / Implied Volatility. Drag to orbit. σ lifts the surface and fans the rain.
- **Desk** — sliders for \(S\), \(K\), \(\sigma\), \(r\), \(T\); live call / put and Δ, Γ, ν, Θ.
- **Today’s three** — Beginner / Core / Frontier titles rotate by calendar day. No backend.
- **CTA** — [eugenefinance.tech](https://eugenefinance.tech/)

## Stack

Vite, vanilla JS, Three.js. Fraunces + IBM Plex Mono.

```bash
npm install
npm run dev
```

Production build writes to `dist/` with `base: './'` so the site works from a project Pages URL:

```bash
npm run build
npm run preview
```

## GitHub Pages

A workflow at `.github/workflows/pages.yml` builds on every push to `main` and publishes `dist/` to the `gh-pages` branch.

In the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `gh-pages` / `/ (root)`**.

The first successful Action run creates `gh-pages`. After that the teaser is at:

`https://<user>.github.io/theory-measured/`
