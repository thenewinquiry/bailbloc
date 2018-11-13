/*
 * This is a simplified version of Python Bail Bloc model.
 * The simplification is necessary so that browsers can
 * run the simulation based on user parameters.
 */

importScripts('discrete.js', '//cdnjs.cloudflare.com/ajax/libs/chance/1.0.12/chance.min.js');

const N_RUNS = 50;

const XMR_CHANGE = [0.95, 1.05];
const MONTHLY_USD_PER_MINER = [1, 4];

// Using data from Table 2 of:
// <http://trac.syr.edu/immigration/reports/519/>
// Number of granted bond decisions, across all
// immigration courts, for first 8 months of FY 2018
const POP_SIZE = 23577;
const MONTHLY_POP = Math.round(POP_SIZE/8);

// Using data from:
// <http://trac.syr.edu/immigration/reports/438/>
// which states that for FY 2015, 14% failed to appear
const FTA = 0.14;

// Using data from Table 1 of:
// <http://trac.syr.edu/immigration/reports/519/>
// Distribution of bond amounts across all
// immigration courts, for first 8 months of FY 2018.
// No immigration bond bail set to less than $1,500,
// according to Nat'l Bail Fund Network.
// We include bond of 0 for release rate
const BAIL_RANGES = [
  [0, 0],
  [1500, 2499],
  [2500, 4999],
  [5000, 7499],
  [7500, 9999],
  [10000, 12499],
  [12500, 17499],
  [17500, 24999],
  [25000, 35000] // last range is unbounded, but bounded here out of necessity
];
const BAIL_PROBS = [
  0.01,
  0.053,
  0.14,
  0.233,
  0.178,
  0.17,
  0.108,
  0.062,
  0.046
];

// Had difficulty finding specific numbers
// on how often bond was successfully posted.
// Based on this report:
// <http://trac.syr.edu/immigration/reports/438/>
// about 1/5 do not post bond.
const BAIL_MADE = 4/5;

// TODO
// DETENTION RANGES

// Using data from Table 1 of:
// <http://trac.syr.edu/immigration/reports/405/>
// which is from August 2015.
// The backlog reported there has only gotten worse:
// <http://trac.syr.edu/immigration/reports/536/>
// (more than doubled)
// This report also has detention data, but from 2012:
// <http://trac.syr.edu/immigration/reports/321/>
const DETENTION_RANGES = [24, 2401];

function sum(arr) {
  return arr.reduce((acc, v) => acc + v);
}

function mean(arr, prop) {
  return Math.round(sum(arr.map(r => r[prop]))/N_RUNS);
}

function uniform(rng) {
  var [l, u] = rng;
  return Math.round(l + Math.random() * (u-l));
}

// generate population for one day
function genPop() {
  var idxs = Array.from(Array(BAIL_RANGES.length),(_,i) => i);
  var pop = Array.from(Array(MONTHLY_POP), (_, i) => chance.weighted(idxs, BAIL_PROBS));
  var counts = {};
  pop.forEach(function(x) { counts[x] = (counts[x] || 0)+1; });

  var durationIdxs = Array.from(Array(DETENTION_RANGES.length), (_, i) => i);

  // compute how many don't make bail
  var notMade = {};
  Object.keys(counts).map(idx => {
    var p = BAIL_MADE,
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
      duration: uniform(DETENTION_RANGES)
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
      popSizes = [],
      usd_per_miner = [
              MONTHLY_USD_PER_MINER[0]*miners,
              MONTHLY_USD_PER_MINER[1]*miners];

  for (var i=0; i<months; i++) {
    priceChange *= uniform(XMR_CHANGE);
    var pop = genPop();
    var mined = uniform(usd_per_miner) * priceChange;
    bailFund += mined;
    raised += mined;
    popSizes.push(pop.length);

    // get reclaimed bail
    awaitingTrial = awaitingTrial.filter(c => {
      c.duration -= 30;
      if (c.duration <= 0 && Math.random() > FTA) {
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
    released: released,
    pop: sum(popSizes),
  }
}

onmessage = function(m) {
  var runs = [];
  for (var i=0; i<N_RUNS; i++) {
    var result = run(m.data.nMiners, m.data.nMonths);
    runs.push(result);
  }

  var results = {
    released: mean(runs, 'released'),
    raised: mean(runs, 'raised'),
  }
  postMessage(results);
}
