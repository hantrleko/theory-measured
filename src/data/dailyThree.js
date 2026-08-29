const BEGINNER = [
  {
    title: "Compound interest",
    dek: "Why a rate, a tenor, and a compounding convention are already a model.",
  },
  {
    title: "Expected value",
    dek: "The mean is a forecast. It is not a promise, and it is not a path.",
  },
  {
    title: "Variance and tails",
    dek: "Dispersion is not the same as ruin. Look past the second moment.",
  },
  {
    title: "Discounting cash flows",
    dek: "A dollar later is a different object. Choose a numeraire on purpose.",
  },
  {
    title: "A random walk",
    dek: "Independent increments are a hypothesis. Test it before you price it.",
  },
  {
    title: "Law of large numbers",
    dek: "Averages settle. Single outcomes do not. Sample size is a parameter.",
  },
  {
    title: "Present value",
    dek: "Price is a discounted claim. Change the discount, change the world.",
  },
  {
    title: "Risk versus uncertainty",
    dek: "Knight's split still matters: known odds are not unknown mechanisms.",
  },
  {
    title: "Opportunity cost",
    dek: "Every position is a refusal of another. Write the alternative down.",
  },
  {
    title: "Sample means",
    dek: "An estimator has a sampling distribution. Report the width, not the point.",
  },
  {
    title: "Returns are not prices",
    dek: "Log, simple, excess: the algebra you pick is the story you tell.",
  },
  {
    title: "Time value of money",
    dek: "Interest is the price of waiting. Inflation is the leak in the unit.",
  },
];

const CORE = [
  {
    title: "Black–Scholes",
    dek: "A PDE, a hedge, and a closed form. The assumptions are the syllabus.",
  },
  {
    title: "Implied volatility",
    dek: "The smile is a language. Read it as a map, not as a forecast.",
  },
  {
    title: "The Greeks",
    dek: "Delta, gamma, vega, theta: local derivatives of a pricing engine.",
  },
  {
    title: "Put–call parity",
    dek: "A model-free hinge. If it breaks, you found a constraint, not a trade.",
  },
  {
    title: "Risk-neutral measure",
    dek: "Change measure to price. Change measure again to understand risk.",
  },
  {
    title: "No-arbitrage",
    dek: "If two portfolios match in every state, they match in price. Or else.",
  },
  {
    title: "CAPM",
    dek: "Beta is a slope in a one-factor world. Ask what the residual is.",
  },
  {
    title: "Duration and convexity",
    dek: "Bonds have Greeks too. Parallel shifts are a first-order fiction.",
  },
  {
    title: "Mean–variance",
    dek: "Markowitz is geometry: an efficient frontier is a constraint set.",
  },
  {
    title: "Term structure",
    dek: "One rate is not a curve. Discount factors must stay consistent.",
  },
  {
    title: "Lognormal stock",
    dek: "GBM is the laboratory mouse. Useful, documented, and incomplete.",
  },
  {
    title: "Replication",
    dek: "If you can manufacture the payoff, you do not need to forecast it.",
  },
];

const FRONTIER = [
  {
    title: "Rough volatility",
    dek: "Hurst below one-half. The smile lives in the roughness of the path.",
  },
  {
    title: "Stochastic local vol",
    dek: "Calibrate the slice, then let the dynamics breathe. Two layers, one market.",
  },
  {
    title: "Signature methods",
    dek: "A path as a tensor. Linear models on a nonlinear feature lift.",
  },
  {
    title: "Neural SDEs",
    dek: "Drift and diffusion as networks. Constraints keep the SDE an SDE.",
  },
  {
    title: "Kernel pricing",
    dek: "Reproducing kernels as a pricing span. Regularize the functional, not the story.",
  },
  {
    title: "Path-dependent vol",
    dek: "The state is the trajectory. Local time, clocks, and variance swaps meet.",
  },
  {
    title: "Optimal transport",
    dek: "Couplings between measures as a cost. Martingale OT is the finance cut.",
  },
  {
    title: "Market microstructure",
    dek: "Price is an outcome of queues. Latency, toxicity, and the spread.",
  },
  {
    title: "High-dimensional factors",
    dek: "When p grows with n, shrinkage is not optional. It is identification.",
  },
  {
    title: "Causal discovery",
    dek: "Graphs in markets are hypotheses. Interventions are rare; be honest.",
  },
  {
    title: "Measure-valued processes",
    dek: "The object is a distribution that moves. Particles are a numerical choice.",
  },
  {
    title: "Rough Bergomi",
    dek: "A forward variance curve with a fractional kernel. One smile, many tenors.",
  },
];

function dayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86_400_000);
}

export function todaysThree(date = new Date()) {
  const d = dayOfYear(date);
  return {
    date,
    beginner: BEGINNER[d % BEGINNER.length],
    core: CORE[d % CORE.length],
    frontier: FRONTIER[d % FRONTIER.length],
  };
}

export function formatLabDate(date) {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${dd} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
