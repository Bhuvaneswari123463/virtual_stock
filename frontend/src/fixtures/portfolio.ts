export interface EquityPoint {
  date: string;
  portfolioValue: number; // in Rupees
  benchmarkValue: number; // NIFTY 50 scaled
}

export const FIXTURE_EQUITY_CURVE: EquityPoint[] = [
  { date: 'Oct 01', portfolioValue: 1000000, benchmarkValue: 1000000 },
  { date: 'Oct 02', portfolioValue: 1008500, benchmarkValue: 1004200 },
  { date: 'Oct 03', portfolioValue: 1012300, benchmarkValue: 1002100 },
  { date: 'Oct 04', portfolioValue: 1009800, benchmarkValue: 998400 },
  { date: 'Oct 05', portfolioValue: 1019500, benchmarkValue: 1006500 },
  { date: 'Oct 06', portfolioValue: 1024800, benchmarkValue: 1011200 },
  { date: 'Oct 07', portfolioValue: 1032100, benchmarkValue: 1014500 },
  { date: 'Oct 08', portfolioValue: 1029400, benchmarkValue: 1012000 },
  { date: 'Oct 09', portfolioValue: 1041200, benchmarkValue: 1018900 },
  { date: 'Oct 10', portfolioValue: 1048900, benchmarkValue: 1024500 },
  { date: 'Oct 11', portfolioValue: 1054320, benchmarkValue: 1028500 },
];

export interface AssetAllocationItem {
  name: string;
  valueRupees: number;
  percentage: number;
  color: string;
}

export const FIXTURE_ASSET_ALLOCATION: AssetAllocationItem[] = [
  { name: 'Unallocated Cash', valueRupees: 760000, percentage: 72.1, color: '#42DDA2' },
  { name: 'Energy (RELIANCE)', valueRupees: 73762.5, percentage: 7.0, color: '#6CA9FF' },
  { name: 'IT (TCS & INFY)', valueRupees: 138750.5, percentage: 13.2, color: '#A78BFA' },
  { name: 'Banking (HDFC & ICICI)', valueRupees: 81807.0, percentage: 7.7, color: '#F59E0B' },
];
