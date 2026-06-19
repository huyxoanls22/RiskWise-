import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TradeSetup, 
  ChecklistItem, 
  ChecklistProfile, 
  PortfolioTrade, 
  DailyLimitLog, 
  AssetClass 
} from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Radio, 
  BarChart2, 
  Plus, 
  ThumbsUp, 
  Target,
  Smile,
  ShieldCheck,
  ChevronRight,
  Calculator,
  Flame,
  UserCheck,
  Crown
} from 'lucide-react';
import TradingViewWidget, { isVietnameseTicker } from './TradingViewWidget';
import PreTradeChecklist from './PreTradeChecklist';

interface QuickTradeTerminalProps {
  setup: TradeSetup;
  updateSetup: (fields: Partial<TradeSetup>) => void;
  checklistItems: ChecklistItem[];
  checklistProfiles: ChecklistProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onCreateProfile: (title: string) => void;
  onDeleteProfile: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onAddItem: (text: string, isRequired: boolean) => void;
  onDeleteItem: (id: string) => void;
  isPremium?: boolean;
  onTriggerPaywall?: () => void;
  
  // Custom trade log actions
  onLogActiveTrade: (trade: PortfolioTrade, breachedDaily: boolean) => void;
  onLogClosedTrade: (trade: PortfolioTrade, breachedDaily: boolean) => void;
  
  dailyDisciplineLogs: DailyLimitLog[];
  isOfflineTimeHack?: boolean;
  currentTime?: Date;
}

const detectAssetClass = (symbol: string): AssetClass => {
  const s = symbol.trim().toUpperCase();
  if (s.includes('/') || s.includes('-')) return 'forex';
  if (['XAUUSD', 'GBPUSD', 'EURUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF', 'EURGBP', 'GBPJPY', 'EURJPY', 'GOLD', 'SILVER'].includes(s)) {
    return 'forex';
  }
  // If it's 6 characters and looks like a forex pair (e.g., EURUSD)
  if (s.length === 6 && /^[A-Z]{6}$/.test(s)) {
    const commonCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'HKD', 'SGD', 'CNY', 'VND'];
    const base = s.slice(0, 3);
    const quote = s.slice(3, 6);
    if (commonCurrencies.includes(base) || commonCurrencies.includes(quote)) {
      return 'forex';
    }
  }
  return 'crypto_stock';
};

const PRESET_ASSETS = [
  { symbol: 'BTCUSD', label: 'BTC/USD', type: 'crypto_stock' as AssetClass, desc: 'Crypto' },
  { symbol: 'ETHUSD', label: 'ETH/USD', type: 'crypto_stock' as AssetClass, desc: 'Crypto' },
  { symbol: 'XAUUSD', label: 'VÀNG (Gold)', type: 'forex' as AssetClass, desc: 'Hàng hoá' },
  { symbol: 'EURUSD', label: 'EUR/USD', type: 'forex' as AssetClass, desc: 'Ngoại hối' },
  { symbol: 'GBPUSD', label: 'GBP/USD', type: 'forex' as AssetClass, desc: 'Ngoại hối' },
  { symbol: 'USDJPY', label: 'USD/JPY', type: 'forex' as AssetClass, desc: 'Ngoại hối' },
  { symbol: 'TSLA', label: 'TSLA', type: 'crypto_stock' as AssetClass, desc: 'Cổ phiếu Mỹ' },
  { symbol: 'HPG', label: 'HPG', type: 'crypto_stock' as AssetClass, desc: 'Cổ phiếu VN' }
];

export default function QuickTradeTerminal({
  setup,
  updateSetup,
  checklistItems,
  checklistProfiles,
  activeProfileId,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  onToggleCheck,
  onAddItem,
  onDeleteItem,
  isPremium = false,
  onTriggerPaywall,
  onLogActiveTrade,
  onLogClosedTrade,
  dailyDisciplineLogs,
  isOfflineTimeHack = false,
  currentTime = new Date()
}: QuickTradeTerminalProps) {
  
  // Local state for the pure manual declaration terminal
  const [tradeStyle, setTradeStyle] = useState<'active' | 'closed'>('active');
  const [assetClass, setAssetClass] = useState<AssetClass>(setup.assetClass || 'crypto_stock');
  const [ticker, setTicker] = useState<string>(setup.name || 'BTC');
  const [tickerInput, setTickerInput] = useState<string>(setup.name || 'BTC');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  
  // Decoupled user declarations
  const [entryPrice, setEntryPrice] = useState<string>('60050');
  const [exitPrice, setExitPrice] = useState<string>('60500'); 
  const [pnlInput, setPnlInput] = useState<string>('150'); // manually declared profit/loss for closed trades
  const [riskPercent, setRiskPercent] = useState<string>('2'); // default 2%
  const [tpPercent, setTpPercent] = useState<string>('4'); // default 4%
  const [isFetchingPrice, setIsFetchingPrice] = useState<boolean>(false);
  
  const [isWarningBypassed, setIsWarningBypassed] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showDisciplineWarningModal, setShowDisciplineWarningModal] = useState<boolean>(false);

  // Synchronise state changes when setup updates in App
  useEffect(() => {
    if (setup.assetClass !== assetClass) {
      setAssetClass(setup.assetClass);
    }
    if (setup.name && setup.name !== ticker) {
      setTicker(setup.name);
      setTickerInput(setup.name);
    }
  }, [setup.name, setup.assetClass]);

  // Handle asset presets
  const handlePresetClick = (symbol: string, type: AssetClass) => {
    setTicker(symbol);
    setTickerInput(symbol);
    setAssetClass(type);
    
    updateSetup({
      name: symbol,
      assetClass: type
    });

    if (symbol === 'BTCUSD' || symbol === 'BTC') setEntryPrice('68500');
    else if (symbol === 'ETHUSD' || symbol === 'ETH') setEntryPrice('3550');
    else if (symbol === 'XAUUSD') setEntryPrice('2320');
    else if (symbol === 'EURUSD') setEntryPrice('1.0855');
    else if (symbol === 'GBPUSD') setEntryPrice('1.2725');
    else if (symbol === 'USDJPY') setEntryPrice('157.10');
    else if (symbol === 'TSLA') setEntryPrice('180');
    else if (symbol === 'HPG') setEntryPrice('28.5');
  };

  const handleApplyLivePrice = (price: number) => {
    setEntryPrice(price.toString());
  };

  const fetchLivePrice = async () => {
    setIsFetchingPrice(true);
    let matchedPrice: number | null = null;
    
    const sym = ticker.toUpperCase().trim().replace('/', '').replace('-', '');
    let searchSym = sym;
    if (searchSym === 'BTC') searchSym = 'BTCUSDT';
    else if (searchSym === 'ETH') searchSym = 'ETHUSDT';
    else if (searchSym === 'XAUUSD' || searchSym === 'GOLD') searchSym = 'PAXGUSDT';
    
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${searchSym}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.price) {
          matchedPrice = parseFloat(data.price);
        }
      }
    } catch (e) {
      console.warn("Could not fetch price from Binance:", e);
    }

    if (matchedPrice === null) {
      if (ticker === 'BTCUSD' || ticker === 'BTC') matchedPrice = 67240 + Math.random() * 450;
      else if (ticker === 'ETHUSD' || ticker === 'ETH') matchedPrice = 3520 + Math.random() * 30;
      else if (ticker === 'XAUUSD') matchedPrice = 2335 + Math.random() * 15;
      else if (ticker === 'EURUSD') matchedPrice = 1.0855 + (Math.random() - 0.5) * 0.002;
      else if (ticker === 'GBPUSD') matchedPrice = 1.2720 + (Math.random() - 0.5) * 0.002;
      else if (ticker === 'USDJPY') matchedPrice = 157.10 + (Math.random() - 0.5) * 0.3;
      else if (ticker === 'TSLA') matchedPrice = 178.5 + (Math.random() - 0.5) * 2;
      else if (ticker === 'HPG') matchedPrice = 28.5 + (Math.random() - 0.5) * 0.5;
      else matchedPrice = 100 + Math.random() * 25;
    }

    if (matchedPrice !== null) {
      setEntryPrice(parseFloat(matchedPrice.toFixed(ticker.includes('USDT') || ticker.includes('JPY') ? 2 : 5)).toString());
    }
    setIsFetchingPrice(false);
  };

  const widgetSetup = useMemo(() => {
    const entryNum = parseFloat(entryPrice) || 0;
    const rPct = parseFloat(riskPercent) || 0;
    const slPrice = direction === 'long' 
      ? entryNum * (1 - (rPct / 100)) 
      : entryNum * (1 + (rPct / 100));
    return {
      ...setup,
      name: ticker,
      assetClass: assetClass,
      entryPrice: entryNum || undefined,
      stopLossPrice: slPrice || undefined,
    };
  }, [setup, ticker, assetClass, entryPrice, riskPercent, direction]);

  // Validation checklists
  const totalRequired = checklistItems.filter(i => i.isRequired).length;
  const checkedRequired = checklistItems.filter(i => i.isRequired && i.isChecked).length;
  const isChecklistDone = checkedRequired === totalRequired;
  const hasEmotion = !!setup.emotion;
  const isSafeToTrade = isChecklistDone && hasEmotion;

  // Maximum Daily Risk limit configurations
  const dailyLimitUSD = useMemo(() => {
    const dailyLimitPercent = setup.dailyLimitPercent || 0;
    if (dailyLimitPercent <= 0) return 0;
    return setup.accountBalance * (dailyLimitPercent / 100);
  }, [setup.accountBalance, setup.dailyLimitPercent]);

  const todayDateStr = useMemo(() => {
    const d = currentTime || new Date();
    const YYYY = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const DD = String(d.getDate()).padStart(2, '0');
    return `${YYYY}-${MM}-${DD}`;
  }, [currentTime]);

  const todayRiskUSD = useMemo(() => {
    const log = dailyDisciplineLogs.find(l => l.date === todayDateStr);
    return log ? log.totalRisk : 0;
  }, [dailyDisciplineLogs, todayDateStr]);

  const finalRiskValue = useMemo(() => {
    const rPct = parseFloat(riskPercent) || 0;
    return Math.max(0, setup.accountBalance * (rPct / 100));
  }, [riskPercent, setup.accountBalance]);

  const isDailyLimitBreached = useMemo(() => {
    if (dailyLimitUSD <= 0) return false;
    const additionalRisk = tradeStyle === 'active' ? finalRiskValue : 0;
    return (todayRiskUSD + additionalRisk) > dailyLimitUSD;
  }, [dailyLimitUSD, todayRiskUSD, finalRiskValue, tradeStyle]);

  // Handle the manual logging trigger
  const handleExecuteTradeLog = (bypassChecklistConfirmedParam: any = false) => {
    const bypassChecklistConfirmed = bypassChecklistConfirmedParam === true;
    setErrorText(null);
    const entryNum = parseFloat(entryPrice) || 0;
    const riskPctNum = parseFloat(riskPercent) || 0;
    const tpPctNum = parseFloat(tpPercent) || 0;

    if (!ticker.trim()) {
      setErrorText("Vui lòng nhập Mã giao dịch (Symbol)!");
      return;
    }
    if (entryNum <= 0) {
      setErrorText("Vui lòng nhập Giá vào lệnh (Entry Price) hợp lệ!");
      return;
    }
    if (riskPctNum <= 0) {
      setErrorText("Vui lòng nhập Mức rủi ro Risk (% tài khoản) lớn hơn 0!");
      return;
    }
    if (tpPctNum <= 0) {
      setErrorText("Vui lòng nhập Mức mục tiêu lợi nhuận TP (% tài khoản) lớn hơn 0!");
      return;
    }

    if (isDailyLimitBreached && !isWarningBypassed) {
      setErrorText("CẢNH BÁO RỦI RO NGÀY: Khối rủi ro tự định đoạt này vượt quá giới hạn rủi ro ngày! Vui lòng tích 'Tôi đồng ý gánh rủi ro vượt ngưỡng kỷ luật' để ghi đè.");
      return;
    }

    // Intercept with Warning Modal if they try to enter/track a trade without fulfilling the discipline criteria
    if (!isSafeToTrade && !bypassChecklistConfirmed) {
      setShowDisciplineWarningModal(true);
      return;
    }

    // Close warning modal if it's currently open
    setShowDisciplineWarningModal(false);

    const randId = 'tr-' + Math.random().toString(36).substr(2, 9);
    const dateIso = (currentTime || new Date()).toISOString();
    const bypassDaily = isWarningBypassed && isDailyLimitBreached;

    // Is trade discipline criteria fully met?
    const isChecklistBypassed = !isSafeToTrade;

    const riskAmountUSD = setup.accountBalance * (riskPctNum / 100);
    const calculatedRrRatio = riskPctNum > 0 ? tpPctNum / riskPctNum : 1;

    // Calculate simulated active stop loss & take profit prices
    const slPriceVal = direction === 'long' 
      ? entryNum * (1 - (riskPctNum / 100))
      : entryNum * (1 + (riskPctNum / 100));

    const tpPriceVal = direction === 'long'
      ? entryNum * (1 + (tpPctNum / 100))
      : entryNum * (1 - (tpPctNum / 100));

    // Calculate simulated units based on the risk amount vs stop loss distance
    const distanceVal = Math.abs(entryNum - slPriceVal);
    const computedUnits = distanceVal > 0 ? parseFloat((riskAmountUSD / distanceVal).toFixed(5)) : 1;

    const notesStr = isChecklistBypassed 
      ? `⚠️ Vào lệnh tắt: Chưa kiểm định đủ quy trình hoặc không khai báo cảm xúc. R:R: ${calculatedRrRatio.toFixed(2)}` 
      : `✅ Vào lệnh kỷ luật hoàn hảo. R:R: ${calculatedRrRatio.toFixed(2)}`;

    if (tradeStyle === 'active') {
      const liveActiveTrade: PortfolioTrade = {
        id: randId,
        ticker: ticker.toUpperCase(),
        assetClass,
        direction,
        entryPrice: entryNum,
        currentPrice: entryNum,
        units: computedUnits, 
        lots: assetClass === 'forex' ? parseFloat((computedUnits / 100000).toFixed(2)) || 0.01 : undefined,
        riskAmount: riskAmountUSD, 
        stopLoss: slPriceVal,
        takeProfit: tpPriceVal,
        pnl: 0,
        status: 'active',
        enteredAt: dateIso,
        uncheckedWarning: isChecklistBypassed,
        notes: notesStr,
        sector: assetClass === 'forex' ? 'Forex / Ngoại hối' : (isVietnameseTicker(ticker) ? 'Cổ phiếu VN' : 'Crypto & Stocks'),
        emotion: setup.emotion,
        riskPercent: riskPctNum,
        tpPercent: tpPctNum,
        rrRatio: calculatedRrRatio
      };
      
      onLogActiveTrade(liveActiveTrade, bypassDaily);
    } else {
      const manualPnl = parseFloat(pnlInput) || 0;
      const isWin = manualPnl >= 0;
      
      const liveClosedTrade: PortfolioTrade = {
        id: randId,
        ticker: ticker.toUpperCase(),
        assetClass,
        direction,
        entryPrice: entryNum,
        currentPrice: parseFloat(exitPrice) || entryNum,
        units: computedUnits,
        lots: assetClass === 'forex' ? parseFloat((computedUnits / 100000).toFixed(2)) || 0.01 : undefined,
        riskAmount: riskAmountUSD, 
        stopLoss: slPriceVal,
        takeProfit: tpPriceVal,
        pnl: manualPnl, // User declared actual ledger PnL
        status: isWin ? 'won' : 'lost',
        enteredAt: dateIso,
        uncheckedWarning: isChecklistBypassed,
        notes: notesStr,
        sector: assetClass === 'forex' ? 'Forex / Ngoại hối' : (isVietnameseTicker(ticker) ? 'Cổ phiếu VN' : 'Crypto & Stocks'),
        emotion: setup.emotion,
        riskPercent: riskPctNum,
        tpPercent: tpPctNum,
        rrRatio: calculatedRrRatio
      };
      
      onLogClosedTrade(liveClosedTrade, bypassDaily);
    }

    setIsWarningBypassed(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl mx-auto pb-8 text-left">
      
      {/* LEFT COLUMN: LIVE CHART & PRE-TRADE CHECKLIST */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 w-full">
        
        {/* Dynamic TradingView Chart Panel */}
        <TradingViewWidget 
          setup={widgetSetup} 
          onApplyLivePrice={handleApplyLivePrice}
          style={{ height: '580px', width: '100%' }}
        />

        {/* Emotional checklist and pre-trade rules (Moved here to make layout more readable & balanced) */}
        <PreTradeChecklist
          title={checklistProfiles.find(p => p.id === activeProfileId)?.title || "Checklist Kỷ Luật Trước Lệnh"}
          onUpdateTitle={() => {}} 
          items={checklistItems}
          onToggleCheck={onToggleCheck}
          onAddItem={onAddItem}
          onDeleteItem={onDeleteItem}
          isPremium={isPremium}
          onTriggerPaywall={onTriggerPaywall}
          profiles={checklistProfiles}
          activeProfileId={activeProfileId}
          onSelectProfile={onSelectProfile}
          onCreateProfile={onCreateProfile}
          onDeleteProfile={onDeleteProfile}
          emotion={setup.emotion}
          onUpdateEmotion={(emo) => updateSetup({ emotion: emo })}
          style={{ width: '100%' }}
        />

      </div>

      {/* RIGHT COLUMN: FAST LOGGING PANEL & INTEGRATED CHECKLISTS */}
      <div className="lg:col-span-5 flex flex-col gap-6 w-full">
        
        {/* Rapid Entry Form Shell */}
        <div className="bg-[#14171F] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-md flex flex-col justify-between">
          <div>
            
            {/* Header Switcher: Active Trade vs direct manual closed journal */}
            <div className="flex bg-[#121620] p-1 rounded-xl border border-slate-800/80 text-xs font-semibold overflow-hidden shadow-inner gap-1 mb-5">
              <button
                type="button"
                onClick={() => setTradeStyle('active')}
                className={`flex-1 py-2 text-center text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tradeStyle === 'active'
                    ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                    : 'text-slate-450 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0" />
                Mở Vị Thế Theo Dõi
              </button>
              <button
                type="button"
                onClick={() => setTradeStyle('closed')}
                className={`flex-1 py-2 text-center text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tradeStyle === 'closed'
                    ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                    : 'text-slate-450 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                Ghi Nhật Ký Đã Chốt
              </button>
            </div>

            {/* Quick entry assets fields */}
            <div className="space-y-4 mb-5">

              {/* Ticker & Side */}
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-6">
                  <label htmlFor="input-ticker-terminal" className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono mb-1.5">Mã tài sản (Ticker)</label>
                  <input
                    id="input-ticker-terminal"
                    type="text"
                    value={tickerInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTickerInput(val);
                      const cleaned = val.toUpperCase().trim().replace(/\s+/g, '');
                      if (cleaned !== ticker) {
                        setTicker(cleaned);
                        const autoClass = detectAssetClass(cleaned);
                        setAssetClass(autoClass);
                        updateSetup({ 
                          name: cleaned,
                          assetClass: autoClass
                        });
                      }
                    }}
                    onBlur={() => {
                      const cleaned = tickerInput.toUpperCase().trim().replace(/\s+/g, '');
                      setTickerInput(cleaned);
                      setTicker(cleaned);
                      const autoClass = detectAssetClass(cleaned);
                      setAssetClass(autoClass);
                      updateSetup({ 
                        name: cleaned,
                        assetClass: autoClass 
                      });
                    }}
                    className="w-full bg-[#1C212D] border border-slate-750 font-mono text-xs font-bold text-white px-3 py-2.5 rounded-xl uppercase focus:outline-none focus:border-indigo-500"
                    placeholder="BTCUSDT"
                  />
                </div>

                <div className="col-span-6">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono mb-1.5">Trạng thái lệnh</label>
                  <div className="grid grid-cols-2 p-0.5 bg-[#1C212D] border border-slate-750/80 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setDirection('long')}
                      className={`py-2 text-[10px] font-bold uppercase rounded-lg cursor-pointer flex items-center justify-center gap-1 transition ${
                        direction === 'long'
                          ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3 text-emerald-200" />
                      MUA (LONG)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection('short')}
                      className={`py-2 text-[10px] font-bold uppercase rounded-lg cursor-pointer flex items-center justify-center gap-1 transition ${
                        direction === 'short'
                          ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                          : 'text-slate-500 hover:text-rose-450'
                      }`}
                    >
                      <TrendingDown className="w-3 h-3 text-rose-200" />
                      BÁN (SHORT)
                    </button>
                  </div>
                </div>
              </div>

              {/* Declared Entry Price without Public Fetch button */}
              <div className="space-y-1.5 col-span-12">
                <label htmlFor="input-entry-terminal" className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono mb-1.5">
                  Giá vào lệnh (Entry Price)
                </label>
                <input
                  id="input-entry-terminal"
                  type="number"
                  step="any"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="w-full bg-[#1C212D] border border-slate-755 font-mono text-xs font-bold text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>

              {/* Real-time Risk % vs TP % Inputs */}
              <div className="grid grid-cols-12 gap-3 col-span-12">
                <div className="col-span-6">
                  <label htmlFor="input-risk-percent" className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono mb-1.5 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-500 animate-pulse animate-duration-1000" />
                    Rủi ro: Risk (% tài khoản)
                  </label>
                  <div className="relative">
                    <input
                      id="input-risk-percent"
                      type="number"
                      step="any"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(e.target.value)}
                      className="w-full bg-[#1C212D] border border-slate-755 font-mono text-xs font-bold text-white px-3 py-2.5 pr-8 rounded-xl focus:outline-none focus:border-indigo-500"
                      placeholder="2"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-xs">%</span>
                  </div>
                </div>

                <div className="col-span-6">
                  <label htmlFor="input-tp-percent" className="block text-[10px] font-bold text-[#10b981] uppercase tracking-widest font-mono mb-1.5 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-emerald-400" />
                    Mục tiêu: TP (% tài khoản)
                  </label>
                  <div className="relative">
                    <input
                      id="input-tp-percent"
                      type="number"
                      step="any"
                      value={tpPercent}
                      onChange={(e) => setTpPercent(e.target.value)}
                      className="w-full bg-[#1C212D] border border-slate-755 font-mono text-xs font-bold text-[#10b981] px-3 py-2.5 pr-8 rounded-xl focus:outline-none focus:border-emerald-500"
                      placeholder="4"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-xs">%</span>
                  </div>
                </div>
              </div>

              {/* Real-time R:R Ratio & Intel Advice dynamically derived display */}
              <div className="bg-[#121620]/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs font-mono col-span-12">
                <div>
                  <span className="text-slate-550 block text-[9px] uppercase tracking-wider font-extrabold leading-none mb-1">Tỷ Lệ R:R Realtime</span>
                  <span className="font-black text-amber-400 text-sm">
                    {riskPercent && parseFloat(riskPercent) > 0 ? (parseFloat(tpPercent) / parseFloat(riskPercent)).toFixed(2) : '0.00'}x
                  </span>
                </div>
                <div className="text-right max-w-[60%]">
                  <span className="text-slate-550 block text-[9px] uppercase tracking-wider font-extrabold leading-none mb-1">Cố Vấn Kỷ Luật</span>
                  <span className={`font-black text-[10px] leading-tight block ${
                    (() => {
                      const r = parseFloat(riskPercent) || 0;
                      const t = parseFloat(tpPercent) || 0;
                      const rr = r > 0 ? t / r : 0;
                      if (rr <= 0) return 'text-slate-500';
                      if (rr < 1) return 'text-rose-400';
                      if (rr < 2) return 'text-orange-400';
                      if (rr < 3) return 'text-emerald-400';
                      return 'text-amber-400';
                    })()
                  }`}>
                    {(() => {
                      const r = parseFloat(riskPercent) || 0;
                      const t = parseFloat(tpPercent) || 0;
                      const rr = r > 0 ? t / r : 0;
                      if (rr <= 0) return 'Thiếu thông số rủi ro';
                      if (rr < 1) return '⚠️ R:R tiêu cực (<1x) | Rủi ro nới rộng gánh lỗ nặng!';
                      if (rr < 2) return '⚡ R:R tạm ổn | Lợi nhuận mỏng, cần tỉ lệ thắng cao';
                      if (rr < 3) return '🛡️ R:R tiêu chuẩn (>=2x) | Đạt chuẩn an toàn Pro Trader';
                      return '💎 R:R tuyệt vời (>=3x) | Đòn bẩy dòng tiền dương bền vững';
                    })()}
                  </span>
                </div>
              </div>

              {/* If diary completed history mode: manual exit & direct PNL results */}
              <AnimatePresence mode="wait">
                {tradeStyle === 'closed' && (
                  <motion.div
                    key="diary-closed-inputs"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-12 gap-3 pt-2 overflow-hidden border-t border-slate-850"
                  >
                    <div className="col-span-6">
                      <label htmlFor="input-exit-terminal" className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono mb-1.5">Giá thoát lệnh (Exit)</label>
                      <input
                        id="input-exit-terminal"
                        type="number"
                        step="any"
                        value={exitPrice}
                        onChange={(e) => setExitPrice(e.target.value)}
                        className="w-full bg-[#1C212D] border border-slate-755 font-mono text-xs font-bold text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                        placeholder="2315"
                      />
                    </div>
                    
                    <div className="col-span-6">
                      <label htmlFor="input-pnl-terminal" className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono mb-1.5">
                        Lợi Nhuận Thu Về (USD) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-550 font-bold text-xs">$</span>
                        <input
                          id="input-pnl-terminal"
                          type="number"
                          step="any"
                          value={pnlInput}
                          onChange={(e) => setPnlInput(e.target.value)}
                          className={`w-full bg-[#1C212D] border font-mono text-xs font-black px-3 py-2.5 pl-6 rounded-xl focus:outline-none ${
                            parseFloat(pnlInput) >= 0 
                              ? 'border-emerald-900 focus:border-emerald-500 text-emerald-400' 
                              : 'border-rose-900 focus:border-rose-500 text-rose-500'
                          }`}
                          placeholder="+150"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          {/* ACTION SUBMIT BUTTONS */}
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
            
            {errorText && (
              <div className="p-3 bg-rose-955/35 border border-rose-900/40 rounded-xl text-left text-[11px] text-rose-400 font-semibold leading-normal font-sans animate-fadeIn">
                ⚠️ {errorText}
              </div>
            )}

            {/* Discipline Checklist Unmet Warning Alert */}
            {!isSafeToTrade && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/35 rounded-xl text-left text-xs text-amber-200 space-y-2 font-sans animate-fadeIn">
                <div className="font-extrabold flex items-center gap-1.5 uppercase text-[10.5px] tracking-wider text-amber-300">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                  CẢNH BÁO KỶ LUẬT CHƯA ĐẠT CHỈ TIÊU
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Bạn chưa tích hết checklist bắt buộc và chưa chọn trạng thái cảm xúc. 
                </p>
                <ul className="text-[10.5px] space-y-1 text-slate-400 list-disc list-inside">
                  {!isChecklistDone && (
                    <li>
                      Chưa check đủ các tiêu chí kỷ luật bắt buộc ({checkedRequired}/{totalRequired}).
                    </li>
                  )}
                  {!hasEmotion && (
                    <li>
                      Chưa khai báo tâm thái cảm xúc hiện tại.
                    </li>
                  )}
                </ul>
                <p className="text-[10.5px] text-amber-500/90 italic font-medium leading-normal pt-0.5">
                  Vẫn có thể bấm mở/ghi vị thế bên dưới, nhưng vị thế sẽ bị gắn nhãn <strong className="text-amber-400">"Thiếu Kỷ Luật"</strong> trong nhật ký.
                </p>
              </div>
            )}

            {/* Warn if risk exceed daily discipline cap */}
            {isDailyLimitBreached && (
              <div className="p-3 bg-red-955/35 border border-red-900/40 rounded-xl text-left text-xs text-red-100 space-y-2 font-sans animate-pulse">
                <span className="font-extrabold block text-[11px] tracking-wider uppercase">⚔️ PHÁ VỠ CHỈ SỐ RỦI RO NGÀY</span>
                <p className="text-[10.5px] leading-relaxed text-red-300">
                  Rủi ro tích lũy hôm nay (${todayRiskUSD}) cùng với mức rủi ro tự bộc lộ (+${finalRiskValue}) sẽ vượt quá giới hạn rủi ro ngày (${dailyLimitUSD.toFixed(1)} USD - {setup.dailyLimitPercent}% tài khoản).
                </p>
                <div className="flex items-center gap-2 pl-0.5 select-none pt-1">
                  <input
                    type="checkbox"
                    id="checkbox-bypass-risk-limit"
                    checked={isWarningBypassed}
                    onChange={(e) => setIsWarningBypassed(e.target.checked)}
                    className="w-3.5 h-3.5 accent-rose-500 cursor-pointer rounded"
                  />
                  <label htmlFor="checkbox-bypass-risk-limit" className="text-[10px] font-black uppercase text-red-200 cursor-pointer select-none">
                    Tôi đồng ý gánh rủi ro vượt ngưỡng kỷ luật
                  </label>
                </div>
              </div>
            )}

            {/* Action triggering */}
            <button
              onClick={() => handleExecuteTradeLog(false)}
              className={`w-full py-3.5 px-6 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                isSafeToTrade
                  ? (direction === 'long' 
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold' 
                      : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold')
                  : 'bg-indigo-650 hover:bg-indigo-600 text-white font-bold'
              }`}
            >
              {tradeStyle === 'active' ? (
                <>
                  <Activity className="w-4 h-4 text-white shrink-0" />
                  Mở Vị Thế Đang Theo Dõi (ACTIVE)
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4 text-emerald-200 shrink-0" />
                  Ghi Lịch Sử Nhật Ký (DIARY)
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-500/90 font-sans leading-normal select-none italic text-center">
              {isSafeToTrade 
                ? "🎯 Bạn đã tuân thủ tuyệt đối quy trình kiểm định trước lệnh. Chúc bạn một giao dịch kỷ luật xuất sắc!" 
                : "⚠️ Việc không hoàn thành checklist hoặc không điền tâm lý sẽ đánh dấu vị thế là 'Thiếu Kỷ Luật' để kiểm toán hành vi sau này."}
            </p>

          </div>

        </div>

      </div>

      {/* Centered Glassmorphic Modal for Discipline Warning */}
      <AnimatePresence>
        {showDisciplineWarningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDisciplineWarningModal(false)}
              className="absolute inset-0 bg-[#070b13]/85 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#0f1322] border border-amber-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl relative z-10 text-left overflow-hidden font-sans"
            >
              {/* Alert Indicator Header with warning status */}
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
                <div className="p-2.5 bg-amber-500/15 rounded-xl border border-amber-500/30">
                  <ShieldAlert className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-amber-300 tracking-wider">
                    Cảnh Báo Vi Phạm Kỷ Luật
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Chưa đạt chỉ tiêu kỷ luật an toàn trước khi vào vị thế
                  </p>
                </div>
              </div>

              {/* Warning Body details */}
              <div className="space-y-4">
                <p className="text-xs leading-relaxed text-slate-300">
                  Bạn đang cố gắng ghi lại hoặc theo dõi vị thế <span className="font-extrabold text-white">#{ticker.toUpperCase()}</span> nhưng **chưa hoàn thành** các tiêu chí kỷ luật quan trọng sau đây:
                </p>

                <div className="p-3.5 bg-[#12162a] rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block select-none">
                    Các tiêu chí chưa đạt:
                  </span>
                  <ul className="text-xs space-y-2 text-slate-300">
                    {!isChecklistDone && (
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-extrabold select-none">•</span>
                        <span>
                          Chưa check đủ các tiêu chí kỷ luật bắt buộc ({checkedRequired}/{totalRequired} tiêu chí).
                        </span>
                      </li>
                    )}
                    {!hasEmotion && (
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-extrabold select-none">•</span>
                        <span>
                          Chưa tự nhận thức và khai báo tâm thái cảm xúc hiện tại.
                        </span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="p-3 bg-amber-500/5 text-[11px] leading-relaxed text-amber-200/95 rounded-lg border border-amber-500/10 italic">
                  * Hệ thống khuyên bạn nên hoãn lệnh, quay lại hoàn thành checklist để bảo toàn kỷ luật giao dịch tuyệt đối. Nếu cố tình bỏ qua, vị thế này sẽ bị gắn nhãn <strong className="text-amber-400 font-bold">"Thiếu Kỷ Luật" (Unchecked Warning)</strong> trong nhật ký.
                </div>
              </div>

              {/* Footer action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDisciplineWarningModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#161a2e] hover:bg-[#1d223e] text-xs font-bold text-slate-300 border border-slate-700 transition cursor-pointer text-center"
                >
                  Quay lại Checklist
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteTradeLog(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-xs font-black text-white transition cursor-pointer text-center shadow-lg"
                >
                  Tiếp Tục (Chọn Lệnh Tắt)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
