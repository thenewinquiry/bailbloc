/*
 * This is a simplified version of Python Bail Bloc model.
 * The simplification is necessary so that browsers can
 * run the simulation based on user parameters.
 */

importScripts('discrete.js', '//cdnjs.cloudflare.com/ajax/libs/chance/1.0.12/chance.min.js');

const N_RUNS = 100;

// see `../params.py` for
// annotations about these data
const XMR_CHANGE = [0.95, 1.05];
const POP_SIZE = 52465;
const MONTHLY_POP = Math.round(POP_SIZE/12);
const ADJUSTED_FTA = 0.07;
const MONTHLY_USD_PER_MINER = [3, 5];
const BAIL_RANGES = [
  [1, 25],
  [25, 499],
  [500, 500],
  [501, 999],
  [1000, 1000],
  [1001, 2499],
  [2500, 2500],
  [2501, 4999],
  [5000, 10000]
];
const BAIL_PROBS = [
  0.09,
  0.02,
  0.27,
  0.09,
  0.29,
  0.14,
  0.06,
  0.02,
  0.02
];
const BAIL_MADE = [
  1.0,
  0.26,
  0.21,
  0.16,
  0.16,
  0.14,
  0.11,
  0.09,
  0.07,
  0.04,
];

const N = 5138;
const DETENTION_RANGES = [
  [0, 1],
  [1, 7],
  [8, 60],
  [60, 200] // NOTE: 200 chosen as an arbitrary upper bound
]
const DETENTION_PROBS = [
    1479/N,
    1853/N,
    1491/N,
    315/N
];

function uniform(rng) {
  var [l, u] = rng;
  return Math.round(l + Math.random() * (u-l));
}

// generate population for one month
function genPop() {
  var idxs = Array.from(Array(BAIL_RANGES.length),(_,i) => i);
  var pop = Array.from(Array(MONTHLY_POP), (_, i) => chance.weighted(idxs, BAIL_PROBS));
  var counts = {};
  pop.forEach(function(x) { counts[x] = (counts[x] || 0)+1; });

  var durationIdxs = Array.from(Array(DETENTION_RANGES.length), (_, i) => i);

  // compute how many don't make bail
  var notMade = {};
  Object.keys(counts).map(idx => {
    var p = BAIL_MADE[idx],
        n = counts[idx],
        dist = SJS.Binomial(n, p),
        nMade = dist.draw(),
        nNotMade = n - nMade;
    notMade[idx] = nNotMade;
  });


  // sample specific bail amounts
  var sample = [];
  Object.keys(notMade).map(idx => {
    var s = Array.from(Array(notMade[idx]), () => ({
      amount: uniform(BAIL_RANGES[idx]),
      duration: uniform(DETENTION_RANGES[chance.weighted(durationIdxs, DETENTION_PROBS)])
    }));
    Array.prototype.push.apply(sample, s);
  });
  return sample;
}

function run(miners, months) {
  var bailFund = 0,
      raised = 0,
      released = 0,
      priceChange = 1,
      awaitingTrial = [],
      usd_per_miner = [
        MONTHLY_USD_PER_MINER[0]*miners,
        MONTHLY_USD_PER_MINER[1]*miners];

  for (var i=0; i<months; i++) {
    priceChange *= uniform(XMR_CHANGE);
    var pop = genPop();
    var mined = uniform(usd_per_miner) * priceChange;
    bailFund += mined;
    raised += mined;

    // get reclaimed bail
    awaitingTrial = awaitingTrial.filter(c => {
      c.duration -= 30;
      if (c.duration <= 0 && Math.random() > ADJUSTED_FTA) {
        bailFund += c.amount;
        return false;
      }
      return true;
    });

    // spend as much as possible
    while (bailFund > 0 && pop.length > 0) {
      var c = pop.shift();
      if (c.amount <= bailFund) {
        released += 1;
        bailFund -= c.amount;
        awaitingTrial.push(c);
      } else {
        break;
      }
    }
  }
  return {
    raised: raised,
    released: released
  }
}

onmessage = function(m) {
  var results = {released: 0, raised: 0};
  for (var i=0; i<N_RUNS; i++) {
    var result = run(m.data.nMiners, m.data.nMonths);
    results.released += result.released;
    results.raised += result.raised;
  }
  results.released = Math.round(results.released/N_RUNS);
  results.raised = Math.round(results.raised/N_RUNS);
  postMessage(results);
}


