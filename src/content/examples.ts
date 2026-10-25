export const quickIndicator = `indicator({
  name: "EMA Trend",
  overlay: true
});

const fast = ta.ema(close, 20);
const slow = ta.ema(close, 50);

plot.line(fast, { title: "EMA 20" });
plot.line(slow, { title: "EMA 50" });`;

export const quickStrategy = `strategy({
  name: "EMA Cross",
  dataset: "YOUR_DATASET_ID",
  initialCapital: 100000,
  defaultQtyType: "percent_equity",
  defaultQtyValue: 20
});

const fast = ta.ema(close, 20);
const slow = ta.ema(close, 50);

if (ta.crossover(fast, slow)) {
  strategy.entry("Long", strategy.long);
}

if (ta.crossunder(fast, slow)) {
  strategy.close("Long");
}`;

export const multiAssetExample = `const universe = data.list({
  kind: "ohlcv",
  timeframe: "1D",
  nameContains: "YOUR_PREFIX",
  field: "id"
});

strategy({
  name: "Shared Capital Portfolio",
  dataset: "YOUR_PRIMARY_DATASET",
  instruments: universe,
  initialCapital: 100000,
  maxPositions: 5,
  defaultQtyType: "percent_equity",
  defaultQtyValue: 20
});

for (const dataset of universe) {
  const market = data.market(dataset);
  const fast = ta.ema(market.close, 20);
  const slow = ta.ema(market.close, 50);

  if (ta.crossover(fast, slow) && strategy.positionSizeOf(dataset) == 0) {
    strategy.entry(dataset, strategy.long, { dataset });
  }
}`;

export const pointInTimeExample = `const events = data.dataset("EVENT_DATASET");
const market = data.market("ASSET_1D");

const instrumentEvents = data.filter(events, {
  column: "symbol",
  equals: market.symbol
});

const available = data.align(instrumentEvents.available_at, {
  mode: "previous"
});

const newEvent = series.changed(available);`;

export const researchExample = `study({
  name: "Momentum Research",
  dataset: "YOUR_DATASET"
});

const lookback = input.int("Lookback", 20, {
  min: 2,
  max: 252,
  group: "Model"
});

const momentum = series.pctChange(close, lookback) * 100;

report.metric("Latest Momentum %", momentum.last, {
  format: "percent"
});
report.line("Momentum", momentum);`;
