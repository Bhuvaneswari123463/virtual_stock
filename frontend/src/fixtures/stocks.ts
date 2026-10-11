export interface StockQuote {
  symbol: string;
  name: string;
  sector: string;
  ltpPaise: number;
  changePercent: number;
  openPaise: number;
  highPaise: number;
  lowPaise: number;
  prevClosePaise: number;
  volume: number;
  marketCapCr: number;
  peRatio: number;
  week52HighPaise: number;
  week52LowPaise: number;
  depth: {
    bids: Array<{ pricePaise: number; quantity: number; orders: number }>;
    asks: Array<{ pricePaise: number; quantity: number; orders: number }>;
  };
}

export const FIXTURE_STOCKS: StockQuote[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Limited',
    sector: 'Oil & Gas / Conglomerate',
    ltpPaise: 295050,
    changePercent: 1.45,
    openPaise: 291000,
    highPaise: 296500,
    lowPaise: 290500,
    prevClosePaise: 290835,
    volume: 3840210,
    marketCapCr: 1995400,
    peRatio: 28.4,
    week52HighPaise: 321700,
    week52LowPaise: 222000,
    depth: {
      bids: [
        { pricePaise: 295000, quantity: 450, orders: 12 },
        { pricePaise: 294950, quantity: 820, orders: 18 },
        { pricePaise: 294900, quantity: 1200, orders: 25 },
        { pricePaise: 294850, quantity: 950, orders: 14 },
        { pricePaise: 294800, quantity: 1500, orders: 30 },
      ],
      asks: [
        { pricePaise: 295050, quantity: 380, orders: 9 },
        { pricePaise: 295100, quantity: 740, orders: 15 },
        { pricePaise: 295150, quantity: 1100, orders: 22 },
        { pricePaise: 295200, quantity: 880, orders: 19 },
        { pricePaise: 295250, quantity: 1640, orders: 35 },
      ],
    },
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Ltd.',
    sector: 'Information Technology',
    ltpPaise: 389020,
    changePercent: -0.62,
    openPaise: 391500,
    highPaise: 392500,
    lowPaise: 387800,
    prevClosePaise: 391450,
    volume: 1420100,
    marketCapCr: 1407800,
    peRatio: 30.1,
    week52HighPaise: 458500,
    week52LowPaise: 331000,
    depth: {
      bids: [
        { pricePaise: 389000, quantity: 240, orders: 8 },
        { pricePaise: 388950, quantity: 420, orders: 14 },
        { pricePaise: 388900, quantity: 890, orders: 21 },
        { pricePaise: 388850, quantity: 650, orders: 11 },
        { pricePaise: 388800, quantity: 1100, orders: 28 },
      ],
      asks: [
        { pricePaise: 389050, quantity: 310, orders: 10 },
        { pricePaise: 389100, quantity: 560, orders: 16 },
        { pricePaise: 389150, quantity: 940, orders: 24 },
        { pricePaise: 389200, quantity: 780, orders: 15 },
        { pricePaise: 389250, quantity: 1350, orders: 32 },
      ],
    },
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    sector: 'Banking & Financial Services',
    ltpPaise: 168000,
    changePercent: 0.85,
    openPaise: 166500,
    highPaise: 169200,
    lowPaise: 166000,
    prevClosePaise: 166580,
    volume: 6840300,
    marketCapCr: 1278900,
    peRatio: 19.5,
    week52HighPaise: 179400,
    week52LowPaise: 136300,
    depth: {
      bids: [
        { pricePaise: 167950, quantity: 1200, orders: 22 },
        { pricePaise: 167900, quantity: 2400, orders: 35 },
        { pricePaise: 167850, quantity: 3100, orders: 48 },
        { pricePaise: 167800, quantity: 1900, orders: 29 },
        { pricePaise: 167750, quantity: 4500, orders: 60 },
      ],
      asks: [
        { pricePaise: 168000, quantity: 1400, orders: 25 },
        { pricePaise: 168050, quantity: 2800, orders: 40 },
        { pricePaise: 168100, quantity: 3500, orders: 52 },
        { pricePaise: 168150, quantity: 2100, orders: 31 },
        { pricePaise: 168200, quantity: 5200, orders: 74 },
      ],
    },
  },
  {
    symbol: 'INFY',
    name: 'Infosys Limited',
    sector: 'Information Technology',
    ltpPaise: 178550,
    changePercent: 2.15,
    openPaise: 174800,
    highPaise: 179800,
    lowPaise: 174500,
    prevClosePaise: 174790,
    volume: 5120400,
    marketCapCr: 741200,
    peRatio: 27.8,
    week52HighPaise: 199000,
    week52LowPaise: 135800,
    depth: {
      bids: [
        { pricePaise: 178500, quantity: 850, orders: 17 },
        { pricePaise: 178450, quantity: 1650, orders: 29 },
        { pricePaise: 178400, quantity: 2200, orders: 38 },
        { pricePaise: 178350, quantity: 1400, orders: 20 },
        { pricePaise: 178300, quantity: 3100, orders: 50 },
      ],
      asks: [
        { pricePaise: 178550, quantity: 920, orders: 19 },
        { pricePaise: 178600, quantity: 1800, orders: 32 },
        { pricePaise: 178650, quantity: 2500, orders: 45 },
        { pricePaise: 178700, quantity: 1750, orders: 26 },
        { pricePaise: 178750, quantity: 3900, orders: 62 },
      ],
    },
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Limited',
    sector: 'Banking & Financial Services',
    ltpPaise: 124500,
    changePercent: -0.35,
    openPaise: 125000,
    highPaise: 125800,
    lowPaise: 124100,
    prevClosePaise: 124940,
    volume: 4890200,
    marketCapCr: 876300,
    peRatio: 18.2,
    week52HighPaise: 133500,
    week52LowPaise: 91500,
    depth: {
      bids: [
        { pricePaise: 124450, quantity: 1100, orders: 20 },
        { pricePaise: 124400, quantity: 1900, orders: 31 },
        { pricePaise: 124350, quantity: 2800, orders: 44 },
        { pricePaise: 124300, quantity: 1600, orders: 25 },
        { pricePaise: 124250, quantity: 3400, orders: 53 },
      ],
      asks: [
        { pricePaise: 124500, quantity: 1300, orders: 24 },
        { pricePaise: 124550, quantity: 2100, orders: 36 },
        { pricePaise: 124600, quantity: 3100, orders: 49 },
        { pricePaise: 124650, quantity: 1950, orders: 28 },
        { pricePaise: 124700, quantity: 4100, orders: 65 },
      ],
    },
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Limited',
    sector: 'Automobile',
    ltpPaise: 96000,
    changePercent: 1.90,
    openPaise: 94800,
    highPaise: 97500,
    lowPaise: 94400,
    prevClosePaise: 94210,
    volume: 7210500,
    marketCapCr: 353100,
    peRatio: 11.2,
    week52HighPaise: 117900,
    week52LowPaise: 62100,
    depth: {
      bids: [
        { pricePaise: 95950, quantity: 1800, orders: 28 },
        { pricePaise: 95900, quantity: 3200, orders: 45 },
        { pricePaise: 95850, quantity: 4100, orders: 58 },
        { pricePaise: 95800, quantity: 2600, orders: 36 },
        { pricePaise: 95750, quantity: 5500, orders: 78 },
      ],
      asks: [
        { pricePaise: 96000, quantity: 2100, orders: 32 },
        { pricePaise: 96050, quantity: 3800, orders: 52 },
        { pricePaise: 96100, quantity: 4900, orders: 67 },
        { pricePaise: 96150, quantity: 3100, orders: 43 },
        { pricePaise: 96200, quantity: 6400, orders: 89 },
      ],
    },
  },
  {
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Limited',
    sector: 'Telecommunications',
    ltpPaise: 142000,
    changePercent: 0.45,
    openPaise: 141200,
    highPaise: 143500,
    lowPaise: 140800,
    prevClosePaise: 141360,
    volume: 2980400,
    marketCapCr: 812400,
    peRatio: 64.8,
    week52HighPaise: 177900,
    week52LowPaise: 90200,
    depth: {
      bids: [
        { pricePaise: 141950, quantity: 640, orders: 12 },
        { pricePaise: 141900, quantity: 1200, orders: 22 },
        { pricePaise: 141850, quantity: 1800, orders: 31 },
        { pricePaise: 141800, quantity: 1100, orders: 18 },
        { pricePaise: 141750, quantity: 2400, orders: 41 },
      ],
      asks: [
        { pricePaise: 142000, quantity: 750, orders: 15 },
        { pricePaise: 142050, quantity: 1450, orders: 26 },
        { pricePaise: 142100, quantity: 2100, orders: 38 },
        { pricePaise: 142150, quantity: 1350, orders: 21 },
        { pricePaise: 142200, quantity: 2900, orders: 50 },
      ],
    },
  },
  {
    symbol: 'SBIN',
    name: 'State Bank of India',
    sector: 'Banking & Financial Services',
    ltpPaise: 81050,
    changePercent: -1.10,
    openPaise: 82000,
    highPaise: 82500,
    lowPaise: 80600,
    prevClosePaise: 81950,
    volume: 8450100,
    marketCapCr: 723300,
    peRatio: 10.8,
    week52HighPaise: 91200,
    week52LowPaise: 55500,
    depth: {
      bids: [
        { pricePaise: 81000, quantity: 2500, orders: 36 },
        { pricePaise: 80950, quantity: 4200, orders: 59 },
        { pricePaise: 80900, quantity: 5800, orders: 81 },
        { pricePaise: 80850, quantity: 3900, orders: 51 },
        { pricePaise: 80800, quantity: 7200, orders: 105 },
      ],
      asks: [
        { pricePaise: 81050, quantity: 2800, orders: 42 },
        { pricePaise: 81100, quantity: 4900, orders: 68 },
        { pricePaise: 81150, quantity: 6400, orders: 92 },
        { pricePaise: 81200, quantity: 4400, orders: 61 },
        { pricePaise: 81250, quantity: 8100, orders: 120 },
      ],
    },
  },
];
