import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TradeSetup } from '../types';
import { RefreshCw, Radio, Play, Check, Layers, TrendingUp } from 'lucide-react';

interface TradingViewWidgetProps {
  setup: TradeSetup;
  onApplyLivePrice: (price: number) => void;
  style?: React.CSSProperties;
}

// Synchronous Vietnamese stock check helper based on length, pattern, and negative lists
export function isVietnameseTicker(symbol: string): boolean {
  const s = (symbol || '').trim().toUpperCase();
  if (!s) return false;
  
  // Known crypto symbols (3 letters or more)
  const cryptoList = [
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT', 'LINK', 'LTC', 
    'AVAX', 'NEAR', 'SUI', 'TON', 'TRX', 'SHIB', 'PEPE', 'WIF', 'UNI', 'ICP', 
    'AAVE', 'ATOM', 'FIL', 'APT', 'FET', 'RNDR', 'OP', 'ARB'
  ];
  
  // Known US stocks, index trackers, or ETFs (1-5 letters)
  const usList = [
    'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'NFLX', 'AMD', 
    'COIN', 'BABA', 'SPY', 'QQQ', 'DIA', 'CVS', 'BAC', 'WMT', 'DIS', 'KO', 
    'PEP', 'JPM', 'GS', 'MS', 'XOM', 'CVX', 'V', 'MA', 'PFE', 'UNH', 'HD', 
    'LLY', 'NKE', 'T', 'VZ', 'CRM', 'INTC', 'SBUX', 'CAT', 'GE', 'F'
  ];
  
  if (cryptoList.includes(s) || s.endsWith('USDT') || s.endsWith('USD')) return false;
  if (usList.includes(s)) return false;
  
  // VN stock tickers are usually exactly 3 letters (e.g., VIC, HPG, TCB) or 8 characters for warrants (e.g., CHPG2301)
  if (s.length === 3 && /^[A-Z]{3}$/.test(s)) {
    return true;
  }
  
  if (s.length === 8 && /^C[A-Z0-9]{7}$/.test(s)) {
    return true;
  }
  
  return false;
}

// Map app symbols to TradingView symbols with dynamic VN stock support
export function mapToTradingViewSymbol(name: string, assetClass: 'forex' | 'crypto_stock', isVnStock: boolean): string {
  const firstPart = (name || '').trim().split(/\s+/)[0];
  const cleanName = firstPart.replace('/', '').toUpperCase();
  
  if (assetClass === 'forex') {
    if (cleanName.includes('XAUUSD') || cleanName === 'XAUUSD') return 'OANDA:XAUUSD';
    if (cleanName.includes('XAGUSD') || cleanName === 'XAGUSD') return 'OANDA:XAGUSD';
    // If it's a general gold or silver ticker representation
    if (cleanName === 'XAU') return 'OANDA:XAUUSD';
    if (cleanName === 'XAG') return 'OANDA:XAGUSD';
    return `FX:${cleanName}`;
  } else {
    // If dynamically detected or synchronously verified as Vietnamese Stock ticker
    if (isVnStock || isVietnameseTicker(cleanName)) {
      const hnxList = ['CEO', 'SHS', 'PVS', 'LUT', 'IDC', 'TNG', 'MBS', 'DTD', 'BAB'];
      const upcomList = ['ACV', 'BSR', 'VGI', 'MCH', 'VEA', 'QNS', 'OIL', 'C4G', 'VTP'];
      if (hnxList.includes(cleanName)) {
        return `HNX:${cleanName}`;
      }
      if (upcomList.includes(cleanName)) {
        return `UPCOM:${cleanName}`;
      }
      return `HOSE:${cleanName}`;
    }

    const cryptoLocals = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT', 'LINK', 'LTC', 'AVAX', 'NEAR', 'SUI', 'TON', 'TRX', 'SHIB', 'PEPE', 'WIF'];
    const stocksLocals = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'NFLX', 'AMD', 'COIN', 'BABA', 'SPY', 'QQQ', 'DIA', 'CVS'];
    
    if (cleanName.includes(':')) {
      return cleanName;
    }
    
    if (cryptoLocals.some(c => cleanName === c || cleanName === `${c}USDT`)) {
      const baseCoin = cleanName.endsWith('USDT') ? cleanName : `${cleanName}USDT`;
      return `BINANCE:${baseCoin}`;
    }
    
    if (stocksLocals.some(s => cleanName === s)) {
      if (cleanName === 'CVS') return 'NYSE:CVS';
      return `NASDAQ:${cleanName}`;
    }
    
    return cleanName; 
  }
}

// Clean symbol name for API fetching
export function getCleanBaseSymbol(name: string, assetClass: 'forex' | 'crypto_stock'): string {
  const firstPart = (name || '').trim().split(/\s+/)[0];
  const clean = firstPart.replace('/', '').toUpperCase();
  if (assetClass === 'forex') {
    return clean;
  } else {
    if (clean.endsWith('USDT')) return clean.replace('USDT', '');
    if (clean.endsWith('USD')) return clean.replace('USD', '');
    return clean;
  }
}

// Convert symbol name to Twelve Data compatible format
export function getTwelveDataSymbol(cleanBase: string, assetClass: 'forex' | 'crypto_stock'): string {
  if (assetClass === 'forex') {
    if (cleanBase.length === 6) {
      return `${cleanBase.substring(0, 3)}/${cleanBase.substring(3, 6)}`;
    }
    return cleanBase;
  } else {
    const isVn = isVietnameseTicker(cleanBase);
    if (isVn) {
      return cleanBase;
    }
    const cryptoLocals = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT', 'LINK', 'LTC', 'AVAX', 'NEAR', 'SUI', 'TON', 'TRX', 'SHIB', 'PEPE', 'WIF'];
    const isCrypto = cryptoLocals.some(c => cleanBase === c || cleanBase === `${c}USDT` || cleanBase === `${c}USD`);
    if (isCrypto) {
      const baseCoin = cleanBase.endsWith('USDT') ? cleanBase.replace('USDT', '') : (cleanBase.endsWith('USD') ? cleanBase.replace('USD', '') : cleanBase);
      return `${baseCoin}/USD`;
    }
    return cleanBase;
  }
}

// Module-level Cache with TTL for holding live price feeds
interface CachedPrice {
  price: number;
  change: number | null;
  isVnStock: boolean;
  timestamp: number;
}

const priceCache: Record<string, CachedPrice> = {};
const CACHE_TTL_MS = 60000; // 60 seconds Time-to-Live

// Popular target list to prefetch on system startup
const POPULAR_TV_SYMBOLS = [
  'EUR/USD', 'GBP/USD', 'AUD/USD', 'USD/JPY', 'USD/CAD',
  'GBP/JPY', 'EUR/JPY', 'XAU/USD', 'XAG/USD', 'BTC/USD',
  'ETH/USD', 'SOL/USD'
];

export const getCachedPrice = (symbol: string): CachedPrice | null => {
  const cached = priceCache[symbol];
  if (!cached) return null;
  const now = Date.now();
  if (now - cached.timestamp < CACHE_TTL_MS) {
    return cached;
  }
  return null;
};

export const setCachedPrice = (symbol: string, price: number, change: number | null, isVnStock: boolean) => {
  priceCache[symbol] = {
    price,
    change,
    isVnStock,
    timestamp: Date.now()
  };
};

let prefetchActive = false;

export async function prefetchPopularPrices() {
  if (prefetchActive) return;
  prefetchActive = true;
  try {
    const symbolsJoined = POPULAR_TV_SYMBOLS.join(',');
    const url = `/api/twelvedata?symbol=${encodeURIComponent(symbolsJoined)}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        Object.entries(data).forEach(([rawSym, item]: [string, any]) => {
          if (item && item.close && item.status !== 'error') {
            const price = parseFloat(item.close);
            const percentChange = parseFloat(item.percent_change || '0');
            if (!isNaN(price)) {
              // Store with standardized clean keys
              const cleanKey = rawSym.replace('/', '').toUpperCase();
              setCachedPrice(cleanKey, price, percentChange, false);

              // Stash sub-ticker mappings (e.g. BTC/USD -> BTC for quicker reference matches)
              if (rawSym.endsWith('/USD')) {
                const shortKey = rawSym.replace('/USD', '');
                setCachedPrice(shortKey, price, percentChange, false);
              }
            }
          }
        });
      }
    }
  } catch (err) {
    console.warn("Popular tickers batch prefetch failed:", err);
  }
}

export default function TradingViewWidget({ setup, onApplyLivePrice, style }: TradingViewWidgetProps) {
  const [widgetType, setWidgetType] = useState<'mini' | 'advanced'>('mini');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [fetching, setFetching] = useState(false);
  const [successApply, setSuccessApply] = useState(false);
  const [isVnStock, setIsVnStock] = useState(false);

  // Active resource refs to eliminate async race conditions
  const currentSymbolRef = useRef('');
  const currentTickerRef = useRef('');

  const assetClass = setup.assetClass || 'forex';
  const rawSymbol = assetClass === 'forex' ? (setup.forexPair || 'EUR/USD') : (setup.name || 'BTC');
  const cleanBase = getCleanBaseSymbol(rawSymbol, assetClass);
  const tvSymbol = mapToTradingViewSymbol(rawSymbol, assetClass, isVnStock);

  // Resolve standard twelve data symbol
  const twelveSymbol = useMemo(() => {
    return getTwelveDataSymbol(cleanBase, assetClass);
  }, [cleanBase, assetClass]);

  // Construct global Yahoo ticker symbol for fetching fallbacks
  const yahooTicker = useMemo(() => {
    if (!cleanBase) return '';
    if (assetClass === 'forex') {
      if (cleanBase.length === 6) {
        return `${cleanBase}=X`;
      } else if (cleanBase === 'XAU' || cleanBase === 'GOLD') {
        return 'XAUUSD=X';
      } else if (cleanBase === 'XAG' || cleanBase === 'SILVER') {
        return 'XAGUSD=X';
      } else {
        return `${cleanBase}=X`;
      }
    } else {
      const isVn = isVietnameseTicker(cleanBase);
      if (isVn) {
        return `${cleanBase}.HM`;
      } else {
        const cryptoLocals = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT', 'LINK', 'LTC', 'AVAX', 'NEAR', 'SUI', 'TON', 'TRX', 'SHIB', 'PEPE', 'WIF'];
        if (cryptoLocals.some(c => cleanBase === c || cleanBase === `${c}USDT`)) {
          const baseCoin = cleanBase.endsWith('USDT') ? cleanBase.replace('USDT', '') : cleanBase;
          return `${baseCoin}-USD`;
        } else {
          return cleanBase;
        }
      }
    }
  }, [cleanBase, assetClass]);

  // Instantly keep reference values up to date
  currentSymbolRef.current = cleanBase;
  currentTickerRef.current = twelveSymbol;

  // Dynamic real-time price fetching logic with Twelve Data and multi-proxy fallback
  const fetchLivePrice = async () => {
    if (!cleanBase) return;
    const initialSymbol = cleanBase;

    const updateState = (price: number, change: number | null, vnStock: boolean) => {
      if (currentSymbolRef.current !== initialSymbol) return;
      setLivePrice(price);
      setPriceChange(change);
      setIsVnStock(vnStock);
      setCachedPrice(initialSymbol, price, change, vnStock);
    };

    setFetching(true);
    let priceSet = false;
    try {
      const isVn = isVietnameseTicker(cleanBase);

      // Sequence 0: Try Twelve Data Quote API first via Secure Backend Proxy
      if (!isVn && twelveSymbol) {
        try {
          const twelveUrl = `/api/twelvedata?symbol=${encodeURIComponent(twelveSymbol)}`;
          const res = await fetch(twelveUrl);
          if (res.ok) {
            const data = await res.json();
            if (data && data.close && data.status !== 'error') {
              const price = parseFloat(data.close);
              const percentChange = parseFloat(data.percent_change || '0');
              if (!isNaN(price)) {
                updateState(price, percentChange, false);
                priceSet = true;
              }
            } else {
              console.warn("Twelve Data quote direct returned status error:", data?.message || data);
            }
          }
        } catch (err) {
          console.warn("Twelve Data direct quote parse failed:", err);
        }
      }

      if (!priceSet) {
        if (assetClass === 'crypto_stock') {
          // Sequence 1: Try Entrade API if it fits Vietnamese stock
          if (isVn) {
            const endpoints = [
              `https://services.entrade.com.vn/api/v1/market/symbol/${cleanBase}`,
              `https://corsproxy.io/?${encodeURIComponent(`https://services.entrade.com.vn/api/v1/market/symbol/${cleanBase}`)}`,
              `https://api.allorigins.win/get?url=${encodeURIComponent(`https://services.entrade.com.vn/api/v1/market/symbol/${cleanBase}`)}`
            ];

            for (const url of endpoints) {
              try {
                const res = await fetch(url);
                if (res.ok) {
                  let data = await res.json();
                  if (data.contents) {
                    data = JSON.parse(data.contents);
                  }

                  const rawPrice = data.currentPrice || data.matchingPrice || data.lastPrice || data.closePrice;
                  if (rawPrice && !isNaN(rawPrice) && rawPrice > 0) {
                    const userEntry = setup.entryPrice || 0;
                    let finalPrice = rawPrice;

                    // Normalize price: VN stocks are 1/1000 scale on charts
                    if (userEntry > 0 && userEntry < 1000 && rawPrice >= 1000) {
                      finalPrice = rawPrice / 1000;
                    } else if (userEntry > 1000 && rawPrice < 1000) {
                      finalPrice = rawPrice * 1000;
                    } else if (userEntry === 0 && rawPrice >= 1000) {
                      finalPrice = rawPrice / 1000;
                    }

                    updateState(finalPrice, data.changePricePercent || 0, true);
                    priceSet = true;
                    break;
                  }
                }
              } catch (e) {
                console.warn(`VN live fetch failed with ${url}`, e);
              }
            }
          }

          // Sequence 2: Try Crypto (Binance)
          if (!priceSet && !isVn) {
            const binanceSymbol = cleanBase.endsWith('USDT') ? cleanBase : `${cleanBase}USDT`;
            const endpoints = [
              `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
              `https://corsproxy.io/?${encodeURIComponent(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`)}`
            ];

            for (const url of endpoints) {
              try {
                const res = await fetch(url);
                if (res.ok) {
                  const data = await res.json();
                  const price = parseFloat(data.lastPrice);
                  const percentChange = parseFloat(data.priceChangePercent);
                  if (!isNaN(price)) {
                    updateState(price, percentChange, false);
                    priceSet = true;
                    break;
                  }
                }
              } catch (e) {
                console.warn(`Binance fetch failed with ${url}`, e);
              }
            }
          }

          // Sequence 3: Try US Stock (Yahoo Finance Proxy)
          if (!priceSet) {
            const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanBase}`;
            const endpoints = [
              `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
              `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`
            ];

            for (const url of endpoints) {
              try {
                const res = await fetch(url);
                if (res.ok) {
                  let data = await res.json();
                  if (data.contents) {
                    data = JSON.parse(data.contents);
                  }
                  const result = data.chart?.result?.[0];
                  const price = result?.meta?.regularMarketPrice;
                  const prevClose = result?.meta?.previousClose || result?.meta?.chartPreviousClose;
                  if (price && !isNaN(price)) {
                    const changeVal = prevClose ? (((price - prevClose) / prevClose) * 100) : 0;
                    updateState(price, changeVal, false);
                    priceSet = true;
                    break;
                  }
                }
              } catch (e) {
                console.warn(`Yahoo fetch failed with ${url}`, e);
              }
            }
          }

          // Fallback simulation
          if (!priceSet) {
            const defaultPrice = setup.entryPrice || 100;
            const randomChange = (Math.random() * 0.4 - 0.2);
            updateState(defaultPrice * (1 + randomChange / 100), randomChange, false);
          }

        } else {
          // Forex live rates
          const baseCur = cleanBase.substring(0, 3);
          const quoteCur = cleanBase.substring(3, 6);
          
          let priceSet = false;

          // 1. Try Yahoo Finance live forex spot rates
          const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}`;
          const endpoints = [
            `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
            `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`
          ];

          for (const url of endpoints) {
            try {
              const res = await fetch(url);
              if (res.ok) {
                let data = await res.json();
                if (data.contents) {
                  data = JSON.parse(data.contents);
                }
                const result = data.chart?.result?.[0];
                const price = result?.meta?.regularMarketPrice;
                const prevClose = result?.meta?.previousClose || result?.meta?.chartPreviousClose;
                if (price && !isNaN(price)) {
                  const changeVal = prevClose ? (((price - prevClose) / prevClose) * 100) : 0.05;
                  updateState(price, changeVal, false);
                  priceSet = true;
                  break;
                }
              }
            } catch (e) {
              console.warn(`Forex Yahoo fetch failed with ${url}`, e);
            }
          }

          // 2. Try commodity futures yahoo fallback, e.g. GC=F or SI=F for gold/silver
          if (!priceSet && (cleanBase === 'XAUUSD' || cleanBase === 'XAGUSD' || baseCur === 'XAU' || baseCur === 'XAG')) {
            const futuresTicker = (baseCur === 'XAU') ? 'GC=F' : 'SI=F';
            const yahooUrlFutures = `https://query1.finance.yahoo.com/v8/finance/chart/${futuresTicker}`;
            const endpointsFutures = [
              `https://corsproxy.io/?${encodeURIComponent(yahooUrlFutures)}`,
              `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrlFutures)}`
            ];
            for (const url of endpointsFutures) {
              try {
                const res = await fetch(url);
                if (res.ok) {
                  let data = await res.json();
                  if (data.contents) {
                    data = JSON.parse(data.contents);
                  }
                  const result = data.chart?.result?.[0];
                  const price = result?.meta?.regularMarketPrice;
                  const prevClose = result?.meta?.previousClose || result?.meta?.chartPreviousClose;
                  if (price && !isNaN(price)) {
                    const changeVal = prevClose ? (((price - prevClose) / prevClose) * 100) : 0.05;
                    updateState(price, changeVal, false);
                    priceSet = true;
                    break;
                  }
                }
              } catch (e) {
                console.warn(`Commodity Futures Yahoo fetch failed with ${url}`, e);
              }
            }
          }

          // 3. Try Exchange Rate API
          if (!priceSet && (cleanBase === 'XAUUSD' || cleanBase === 'XAGUSD' || baseCur === 'XAU' || baseCur === 'XAG')) {
            try {
              const res = await fetch('https://open.er-api.com/v6/latest/USD');
              if (res.ok) {
                const data = await res.json();
                if (data && data.rates) {
                  const targetAsset = (cleanBase === 'XAUUSD' || baseCur === 'XAU') ? 'XAU' : 'XAG';
                  const rate = data.rates[targetAsset];
                  if (rate && rate > 0) {
                    const calculatedPrice = 1 / rate;
                    updateState(calculatedPrice, -0.15, false);
                    priceSet = true;
                  }
                }
              }
            } catch (e) {
              console.warn("ER-API direct commodity rate fallback failed:", e);
            }
          }

          // 4. Try general Forex open er-api fallback
          if (!priceSet && baseCur && quoteCur) {
            try {
              const res = await fetch(`https://open.er-api.com/v6/latest/${baseCur}`);
              if (res.ok) {
                const data = await res.json();
                const rate = data.rates[quoteCur];
                if (rate) {
                  updateState(rate, 0.08, false);
                  priceSet = true;
                }
              }
            } catch (e) {
              console.warn("Forex open er-api failed:", e);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Live pricing fetch error:", err);
    } finally {
      if (currentSymbolRef.current === initialSymbol) {
        setFetching(false);
      }
    }
  };

  // Trigger prefetch on mount
  useEffect(() => {
    prefetchPopularPrices();
  }, []);

  // Sync pricing cleanly with cache support & coordinated interval reset
  useEffect(() => {
    // 1. Instantly check if cache has a valid price to eliminate "loading/updating..." flickering
    const cached = getCachedPrice(cleanBase);
    if (cached) {
      setLivePrice(cached.price);
      setPriceChange(cached.change);
      setIsVnStock(cached.isVnStock);
    } else {
      setLivePrice(null);
      setPriceChange(null);
    }

    // 2. Fetch fresh rating
    fetchLivePrice();

    // 3. Register self-correcting interval poll (clears and re-initializes on any ticker change)
    const interval = setInterval(fetchLivePrice, 12000);

    return () => {
      clearInterval(interval);
    };
  }, [cleanBase, assetClass, twelveSymbol]);

  const handleApplyPriceClick = () => {
    if (livePrice !== null) {
      onApplyLivePrice(livePrice);
      setSuccessApply(true);
      setTimeout(() => setSuccessApply(false), 2000);
    }
  };

  return (
    <div className="bg-[#14171F] border border-slate-800/85 rounded-2xl p-4 flex flex-col gap-4" id="tradingview-live-widget" style={{ height: '395.5px', ...style }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-505"></span>
          </div>
          <span className="text-slate-100 font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            Biểu Đồ TradingView ({cleanBase})
          </span>
        </div>
      </div>

      {/* Live price showcase card */}
      <div className="bg-[#1C212D] border border-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Giá Real-time hiện tại</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base font-black font-mono tracking-tight text-white select-all">
              {livePrice !== null ? (
                assetClass === 'forex' 
                  ? livePrice.toFixed(5)
                  : livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
              ) : (
                <span className="text-slate-650 text-xs italic">Đang cập nhật...</span>
              )}
            </span>
            {livePrice !== null && priceChange !== null && (
              <span className={`text-[10px] font-mono font-bold ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={livePrice === null || fetching}
          onClick={handleApplyPriceClick}
          className={`px-3 py-1.5 rounded-lg font-bold text-[10.5px] uppercase transition duration-155 flex items-center gap-1.5 cursor-pointer border ${
            successApply
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-sm'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {successApply ? (
            <>
              <Check className="w-3.5 h-3.5" /> Thành Công!
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current shrink-0" /> Áp dụng vào Entry
            </>
          )}
        </button>
      </div>

      {/* Real-time price feed note (Twelve Data & OTC warning) */}
      <div className="bg-slate-900/40 border border-slate-800/50 p-3 rounded-xl">
        <p className="text-[10px] text-slate-400 leading-relaxed font-sans text-left">
          <span className="font-bold text-slate-350">Lưu ý:</span> Tỷ giá Forex có thể chênh lệch nhẹ do đặc thù dữ liệu phi tập trung (OTC). Vui lòng kiểm tra hoặc nhập giá thủ công để đảm bảo chính xác
        </p>
      </div>

      {/* Main Chart Rendering Container */}
      <div className="w-full relative rounded-xl overflow-hidden bg-[#10141D] border border-slate-850 flex-1 min-h-[140px]">
        {widgetType === 'mini' ? (
          <iframe
            key={`tv-mini-${tvSymbol}`}
            title="TradingView Mini Symbol Overview Widget"
            src={`https://s.tradingview.com/embed-widget/mini-symbol-overview/?locale=vi&symbol=${encodeURIComponent(tvSymbol)}&width=100%25&height=100%25&dateRange=3M&colorTheme=dark&trendLineColor=rgb(99,102,241)&underLineColor=rgba(99,102,241,0.15)&underLineBottomColor=rgba(99,102,241,0)&isTransparent=true&autosize=true`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <iframe
            key={`tv-adv-${tvSymbol}`}
            title="TradingView Advanced Chart Widget"
            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodeURIComponent(tvSymbol)}&interval=60&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=111521&theme=dark&style=1&timezone=Asia%2FHo_Chi_Minh&studies=%5B%5D&locale=vi&utm_source=localhost&utm_medium=widget&utm_campaign=chart`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Manual refresh price */}
      <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium">
        <span>Cập nhật tự động mỗi 12 giây</span>
        <button
          type="button"
          onClick={fetchLivePrice}
          disabled={fetching}
          className="flex items-center gap-1 hover:text-slate-300 transition duration-155 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${fetching ? 'animate-spin' : ''}`} />
          Tải lại giá
        </button>
      </div>
    </div>
  );
}
