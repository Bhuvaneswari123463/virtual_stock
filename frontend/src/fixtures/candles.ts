export interface CandlestickData {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Generate deterministic OHLCV candles for any stock symbol based on baseline price
 */
export function generateCandles(
  basePriceRupees: number,
  daysCount = 60
): CandlestickData[] {
  const candles: CandlestickData[] = [];
  const now = new Date();
  let currentPrice = basePriceRupees * 0.9; // Start slightly lower to show healthy uptrend

  for (let i = daysCount; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Skip weekends (Saturday: 6, Sunday: 0)
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }

    const dateStr = date.toISOString().split('T')[0];

    // Deterministic pseudo-random fluctuation based on day and symbol
    const seed = (date.getDate() * 17 + date.getMonth() * 31 + Math.round(basePriceRupees)) % 100;
    const changeFactor = (seed - 48) / 1200; // ~ -3% to +3%
    const open = Math.round(currentPrice * 100) / 100;
    const close = Math.round(open * (1 + changeFactor) * 100) / 100;
    const high = Math.round(Math.max(open, close) * (1 + Math.abs(seed % 15) / 1000) * 100) / 100;
    const low = Math.round(Math.min(open, close) * (1 - Math.abs((seed + 5) % 15) / 1000) * 100) / 100;
    const volume = Math.round(1000000 + (seed * 45000));

    candles.push({
      time: dateStr,
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  // Adjust final candle to match target baseline price
  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = basePriceRupees;
    last.high = Math.max(last.high, basePriceRupees);
    last.low = Math.min(last.low, basePriceRupees);
  }

  return candles;
}
