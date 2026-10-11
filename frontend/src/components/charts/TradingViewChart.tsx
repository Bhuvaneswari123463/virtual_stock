import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  Time,
} from 'lightweight-charts';
import { useTheme } from '@/context/ThemeContext';
import { CandlestickData } from '@/fixtures/candles';

export interface TradingViewChartProps {
  data: CandlestickData[];
  height?: number;
  showVolume?: boolean;
}

interface HoverLegend {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  isPositive: boolean;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  data,
  height = 380,
  showVolume = true,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  // State for hover crosshair legend overlay
  const [legend, setLegend] = useState<HoverLegend | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth || 600,
      height: height,
      layout: {
        background: {
          type: ColorType.Solid,
          color: isDark ? '#111A24' : '#FFFFFF',
        },
        textColor: isDark ? '#8E9CAE' : '#64748B',
        fontSize: 11,
        fontFamily: 'JetBrains Mono, Inter, monospace',
      },
      grid: {
        vertLines: {
          color: isDark ? '#1E2C3D' : '#E2E8F0',
        },
        horzLines: {
          color: isDark ? '#1E2C3D' : '#E2E8F0',
        },
      },
      crosshair: {
        vertLine: {
          color: '#6CA9FF',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: '#6CA9FF',
          width: 1,
          style: 3,
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#1E2C3D' : '#E2E8F0',
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.25 : 0.1,
        },
      },
      timeScale: {
        borderColor: isDark ? '#1E2C3D' : '#E2E8F0',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#34D399',
      downColor: '#F87171',
      borderVisible: false,
      wickUpColor: '#34D399',
      wickDownColor: '#F87171',
    });

    candleSeries.setData(
      data.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    let volumeSeries: ISeriesApi<'Histogram'> | null = null;
    if (showVolume) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#6CA9FF',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '', // overlay
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      volumeSeries.setData(
        data.map((c) => ({
          time: c.time as Time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(52, 211, 153, 0.35)' : 'rgba(248, 113, 113, 0.35)',
        }))
      );

      volumeSeriesRef.current = volumeSeries;
    }

    // Default legend to last candle if available
    if (data.length > 0) {
      const last = data[data.length - 1];
      setLegend({
        open: last.open,
        high: last.high,
        low: last.low,
        close: last.close,
        volume: last.volume,
        isPositive: last.close >= last.open,
      });
    }

    // Crosshair movement handler for live OHLC legend
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        // Fall back to last candle
        if (data.length > 0) {
          const last = data[data.length - 1];
          setLegend({
            open: last.open,
            high: last.high,
            low: last.low,
            close: last.close,
            volume: last.volume,
            isPositive: last.close >= last.open,
          });
        }
        return;
      }

      const candleData = param.seriesData.get(candleSeries) as any;
      if (candleData) {
        const volData = volumeSeries ? (param.seriesData.get(volumeSeries) as any) : undefined;
        setLegend({
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volData?.value,
          isPositive: candleData.close >= candleData.open,
        });
      }
    });

    chart.timeScale().fitContent();

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Responsive resize handler
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !chartRef.current) return;
      const { width } = entries[0].contentRect;
      chartRef.current.applyOptions({ width });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, isDark, height, showVolume]);

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: `${height}px` }}>
      {/* Live Crosshair OHLC Legend Overlay */}
      {legend && (
        <div className="absolute top-2 left-2 z-10 flex flex-wrap items-center gap-2 sm:gap-3 px-2.5 py-1 rounded bg-bg-surface/85 border border-border-subtle/80 backdrop-blur-sm text-[11px] font-mono select-none pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="text-text-muted">O:</span>
            <span className="text-text-primary">₹{legend.open.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-text-muted">H:</span>
            <span className="text-performance-positive">₹{legend.high.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-text-muted">L:</span>
            <span className="text-performance-negative">₹{legend.low.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-text-muted">C:</span>
            <span className={legend.isPositive ? 'text-performance-positive font-bold' : 'text-performance-negative font-bold'}>
              ₹{legend.close.toFixed(2)}
            </span>
          </div>
          {legend.volume !== undefined && (
            <div className="flex items-center gap-1 hidden sm:flex">
              <span className="text-text-muted">Vol:</span>
              <span className="text-accent-secondary">{legend.volume.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      )}

      {/* Chart Canvas */}
      <div ref={chartContainerRef} className="w-full h-full" style={{ minHeight: `${height}px` }} />
    </div>
  );
};
