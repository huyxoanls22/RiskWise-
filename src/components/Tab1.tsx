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
  Plus, 
  ThumbsUp, 
  Target,
  Smile,
  ShieldCheck,
  Flame,
  Crown,
  ChevronDown,
  Lock,
  Trash2,
  ListFilter,
  Percent,
  Scale,
  Calculator
} from 'lucide-react';
import TradingViewWidget, { isVietnameseTicker } from './TradingViewWidget';
import { FOREX_PAIRS, DEFAULT_FOREX_PRICES, calculatePositionSize } from '../utils/calculator';

interface Tab1Props {
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

const DISCIPLINE_QUOTES = [
  { text: "Giao dịch không phải để đúng hay sai, mà quan trọng là kiếm được bao nhiêu khi đúng và mất bao nhiêu khi sai.", author: "George Soros" },
  { text: "Thử thách lớn nhất của nhà giao dịch không phải là dự đoán thị trường, mà là tự kiểm soát hành vi chính mình.", author: "Mark Douglas" },
  { text: "Cắt lỗ nhanh chóng và chốt lời thong thả. Việc gồng lỗ chỉ chứng tỏ bạn đang gieo hy vọng chứ không hành động bằng kỷ luật.", author: "Jesse Livermore" },
  { text: "Kỷ luật chuẩn xác không phải là một sự bó buộc, mà là chiếc áo giáp tối tân bảo vệ nguồn vốn của bạn khỏi những thảm họa.", author: "RiskWise Guide" },
  { text: "Đứng ngoài thị trường khi không xuất hiện điểm vào chuẩn hệ phương pháp cũng là một vị thế thông tuệ bậc nhất.", author: "Pro Trader Mantra" },
  { text: "Một hệ thống giao dịch bình thường được tuân thủ 105% vẫn đem lại tài sản vượt trội hơn cả siêu thuật toán bị vận hành bởi cảm xúc hưng phấn.", author: "Ed Seykota" },
  { text: "Đừng bao giờ bước vào một lệnh trả thù để gỡ gạc sau khi dính SL. Thị trường vốn không có bộ não hay sự thù hằn cá nhân với bạn.", author: "Psychology Shield" },
  { text: "Thành công trong Trading không đến từ một cú thắng đậm bộc phát, mà đến từ các lệnh lặp lại chuẩn chỉ có tính nhất quán cao độ.", author: "Paul Tudor Jones" },
  { text: "Thua lỗ nhỏ là một phần tất yếu của trò chơi xác xuất. Đừng để một tổn thất nhỏ tích tụ thành một cơn bão quét sạch tài khoản.", author: "Mark Minervini" }
];

export default function Tab1({
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
}: Tab1Props) {
  
  // Local state for the trade styles: active or direct manual closed journal
  const [tradeStyle, setTradeStyle] = useState<'active' | 'closed'>('active');
  const [assetClass, setAssetClass] = useState<AssetClass>(setup.assetClass || 'crypto_stock');
  const [ticker, setTicker] = useState<string>(setup.name || 'BTC');
  const [tickerInput, setTickerInput] = useState<string>(setup.name || 'BTC');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  
  // Decoupled user inputs
  const [entryPrice, setEntryPrice] = useState<string>('60050');
  const [exitPrice, setExitPrice] = useState<string>('60500'); 
  const [pnlInput, setPnlInput] = useState<string>('150'); // manually declared profit/loss for closed trades
  const [riskPercent, setRiskPercent] = useState<string>('2'); // default 2%
  const [tpPercent, setTpPercent] = useState<string>('4'); // default 4%
  const [isFetchingPrice, setIsFetchingPrice] = useState<boolean>(false);
  const [isWarningBypassed, setIsWarningBypassed] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showIncompleteWarningModal, setShowIncompleteWarningModal] = useState<boolean>(false);

  // Restored rich Volume/Position Size Calculator states
  const [riskType, setRiskType] = useState<'percentage' | 'amount'>('percentage');
  const [riskValue, setRiskValue] = useState<string>('2'); // default is 2 (% or USD)
  const [forexPair, setForexPair] = useState<string>('EUR/USD');
  const [stopLossPips, setStopLossPips] = useState<string>('25');
  const [takeProfitPips, setTakeProfitPips] = useState<string>('50');
  const [pipValueUSD, setPipValueUSD] = useState<string>('10');
  const [stopLossPrice, setStopLossPrice] = useState<string>('58800');
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('62400');

  // Synchronize input fields automatically when ticker assetClass transitions
  useEffect(() => {
    if (assetClass === 'forex') {
      const cleanedTicker = ticker.toUpperCase().replace('/', '').trim();
      const matched = FOREX_PAIRS.find(p => p.symbol.toUpperCase().replace('/', '') === cleanedTicker);
      if (matched) {
        setForexPair(matched.symbol);
        setPipValueUSD(matched.defaultPipValueUSD.toString());
        const entryNum = parseFloat(entryPrice) || 0;
        if (entryNum > 1000) {
          const defaultPrice = DEFAULT_FOREX_PRICES[matched.symbol] || 1.0;
          setEntryPrice(defaultPrice.toString());
        }
      }
    } else {
      const entryNum = parseFloat(entryPrice) || 0;
      if (entryNum > 0 && entryNum < 50) {
        if (ticker.toUpperCase().includes('BTC')) setEntryPrice('60050');
        else if (ticker.toUpperCase().includes('ETH')) setEntryPrice('3050');
        else setEntryPrice('100');
      }
    }
  }, [ticker, assetClass]);

  // Clock ticking and quotes rotations state
  const [internalTime, setInternalTime] = useState(new Date());
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setInternalTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRotateQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % DISCIPLINE_QUOTES.length);
  };

  const currentQuote = DISCIPLINE_QUOTES[quoteIndex];

  const sessions = useMemo(() => {
    const utcHour = internalTime.getUTCHours();
    return [
      { 
        name: 'Sydney', 
        isActive: utcHour >= 22 || utcHour < 7, 
        hours: '22:00 - 07:00 UTC',
        localHours: '05:00 - 14:00 GMT+7'
      },
      { 
        name: 'Tokyo', 
        isActive: utcHour >= 0 && utcHour < 9, 
        hours: '00:00 - 09:00 UTC',
        localHours: '07:00 - 16:00 GMT+7'
      },
      { 
        name: 'London', 
        isActive: utcHour >= 8 && utcHour < 17, 
        hours: '08:00 - 17:00 UTC',
        localHours: '15:00 - 00:00 GMT+7'
      },
      { 
        name: 'New York', 
        isActive: utcHour >= 13 && utcHour < 22, 
        hours: '13:00 - 22:00 UTC',
        localHours: '20:00 - 05:00 GMT+7'
      },
    ];
  }, [internalTime]);

  const currentTimeStr = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(internalTime.getHours())}:${pad(internalTime.getMinutes())}:${pad(internalTime.getSeconds())}`;
  }, [internalTime]);

  // For checklist rules creation state inside Tab1
  const [newItemText, setNewItemText] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileTitle, setNewProfileTitle] = useState('');

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

  // 1. Computed Risk Percentage on Account Balance
  const computedRiskPercent = useMemo(() => {
    const val = parseFloat(riskValue) || 0;
    if (riskType === 'percentage') {
      return val;
    } else {
      return setup.accountBalance > 0 ? (val / setup.accountBalance) * 100 : 0;
    }
  }, [riskType, riskValue, setup.accountBalance]);

  // 2. Interactive Calculator Output Results
  const calculationResult = useMemo(() => {
    const entryPriceVal = parseFloat(entryPrice) || 0;
    const currentRiskValue = parseFloat(riskValue) || 0;
    const stopLossPipsVal = parseFloat(stopLossPips) || 0;
    const pipValueUSDVal = parseFloat(pipValueUSD) || 0;
    const takeProfitPipsVal = parseFloat(takeProfitPips) || 0;

    const stopLossPriceVal = parseFloat(stopLossPrice) || 0;
    const takeProfitPriceVal = parseFloat(takeProfitPrice) || 0;

    const tempSetup: TradeSetup = {
      ...setup,
      name: ticker,
      assetClass: assetClass,
      riskType: riskType,
      riskValue: currentRiskValue,
      forexPair: forexPair,
      stopLossPips: stopLossPipsVal,
      pipValueUSD: pipValueUSDVal,
      takeProfitPips: takeProfitPipsVal,
      entryPrice: entryPriceVal,
      stopLossPrice: stopLossPriceVal,
      takeProfitPrice: takeProfitPriceVal,
    };

    return calculatePositionSize(tempSetup);
  }, [setup, ticker, assetClass, riskType, riskValue, forexPair, stopLossPips, pipValueUSD, takeProfitPips, entryPrice, stopLossPrice, takeProfitPrice]);

  // 3. Computed Take Profit Percentage
  const computedTpPercent = useMemo(() => {
    const entryNum = parseFloat(entryPrice) || 0;
    if (entryNum <= 0) return 0;
    if (assetClass === 'forex') {
      const slPipsVal = parseFloat(stopLossPips) || 0;
      const tpPipsVal = parseFloat(takeProfitPips) || 0;
      if (slPipsVal <= 0) return 0;
      const ratio = tpPipsVal / slPipsVal;
      return computedRiskPercent * ratio;
    } else {
      const slPriceVal = parseFloat(stopLossPrice) || 0;
      const tpPriceVal = parseFloat(takeProfitPrice) || 0;
      const slDiff = Math.abs(entryNum - slPriceVal);
      const tpDiff = Math.abs(entryNum - tpPriceVal);
      if (slDiff <= 0) return 0;
      const ratio = tpDiff / slDiff;
      return computedRiskPercent * ratio;
    }
  }, [assetClass, entryPrice, stopLossPips, takeProfitPips, stopLossPrice, takeProfitPrice, computedRiskPercent]);

  // Setup configuration for TradingView interactive chart
  const widgetSetup = useMemo(() => {
    const entryNum = parseFloat(entryPrice) || 0;
    let slPrice = 0;
    if (assetClass === 'forex') {
      const pairConfig = FOREX_PAIRS.find(p => p.symbol === forexPair) || FOREX_PAIRS[0];
      const pipSize = pairConfig.pipSize;
      const sPips = parseFloat(stopLossPips) || 0;
      slPrice = direction === 'long'
        ? entryNum - (sPips * pipSize)
        : entryNum + (sPips * pipSize);
    } else {
      slPrice = parseFloat(stopLossPrice) || 0;
    }

    return {
      ...setup,
      name: ticker,
      assetClass: assetClass,
      entryPrice: entryNum || undefined,
      stopLossPrice: slPrice || undefined,
    };
  }, [setup, ticker, assetClass, entryPrice, forexPair, stopLossPips, stopLossPrice, direction]);

  // Checklist verification math - only check items from the active selection
  const totalRequired = checklistItems.filter(i => i.isRequired).length;
  const checkedRequired = checklistItems.filter(i => i.isRequired && i.isChecked).length;
  const isChecklistDone = totalRequired > 0 ? checkedRequired === totalRequired : true;
  const hasEmotion = !!setup.emotion;
  
  // STRICT COMPLIANCE BARRIER
  const isSafeToTrade = isChecklistDone && hasEmotion;

  // Maximum Daily Risk Limit Calculations
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
    return calculationResult.riskAmount || 0;
  }, [calculationResult.riskAmount]);

  const isDailyLimitBreached = useMemo(() => {
    if (dailyLimitUSD <= 0) return false;
    const additionalRisk = tradeStyle === 'active' ? finalRiskValue : 0;
    return (todayRiskUSD + additionalRisk) > dailyLimitUSD;
  }, [dailyLimitUSD, todayRiskUSD, finalRiskValue, tradeStyle]);

  // Handler for Saving Daily logs and recording trades
  const handleExecuteTradeLog = () => {
    setErrorText(null);
    const entryNum = parseFloat(entryPrice) || 0;

    if (!ticker.trim()) {
      setErrorText("Vui lòng nhập Mã giao dịch (Symbol)!");
      return;
    }
    if (entryNum <= 0) {
      setErrorText("Vui lòng nhập Giá vào lệnh (Entry Price) hợp lệ!");
      return;
    }
    const currentRiskValue = parseFloat(riskValue) || 0;
    if (currentRiskValue <= 0) {
      setErrorText("Vui lòng nhập giá trị Mức rủi ro hợp lệ lớn hơn 0!");
      return;
    }

    if (assetClass === 'forex') {
      const slPipsVal = parseFloat(stopLossPips) || 0;
      const tpPipsVal = parseFloat(takeProfitPips) || 0;
      if (slPipsVal <= 0) {
        setErrorText("Vui lòng nhập Số pip Cắt lỗ lớn hơn 0!");
        return;
      }
      if (tpPipsVal <= 0) {
        setErrorText("Vui lòng nhập Số pip Chốt lời lớn hơn 0!");
        return;
      }
    } else {
      const slPriceVal = parseFloat(stopLossPrice) || 0;
      const tpPriceVal = parseFloat(takeProfitPrice) || 0;
      if (slPriceVal <= 0) {
        setErrorText("Vui lòng nhập Giá cắt lỗ (Stop Loss Price) lớn hơn 0!");
        return;
      }
      if (tpPriceVal <= 0) {
        setErrorText("Vui lòng nhập Giá chốt lời (Take Profit Price) lớn hơn 0!");
        return;
      }
      const isLong = direction === 'long';
      if (isLong && slPriceVal >= entryNum) {
        setErrorText("⚠️ Với lệnh MUA (LONG), Giá Cắt lỗ phải nhỏ hơn Giá vào lệnh!");
        return;
      }
      if (isLong && tpPriceVal <= entryNum) {
        setErrorText("⚠️ Với lệnh MUA (LONG), Giá Chốt lời phải lớn hơn Giá vào lệnh!");
        return;
      }
      if (!isLong && slPriceVal <= entryNum) {
        setErrorText("⚠️ Với lệnh BÁN (SHORT), Giá Cắt lỗ phải lớn hơn Giá vào lệnh!");
        return;
      }
      if (!isLong && tpPriceVal >= entryNum) {
        setErrorText("⚠️ Với lệnh BÁN (SHORT), Giá Chốt lời phải nhỏ hơn Giá vào lệnh!");
        return;
      }
    }

    if (isDailyLimitBreached && !isWarningBypassed) {
      setErrorText("CẢNH BÁO RỦI RO NGÀY: Khối rủi ro này vượt quá giới hạn rủi ro ngày! Vui lòng tích 'Tôi đồng ý gánh rủi ro vượt ngưỡng kỷ luật' để bỏ qua.");
      return;
    }

    if (!isSafeToTrade) {
      // Show dynamic interactive checklist bypass dialog
      setShowIncompleteWarningModal(true);
      return;
    }

    executeSaveTradeLog();
  };

  const executeSaveTradeLog = () => {
    const entryNum = parseFloat(entryPrice) || 0;
    const riskPctNum = computedRiskPercent;
    const tpPctNum = computedTpPercent;
    const randId = 'tr-' + Math.random().toString(36).substr(2, 9);
    const dateIso = (currentTime || new Date()).toISOString();
    const bypassDaily = isWarningBypassed && isDailyLimitBreached;

    const riskAmountUSD = calculationResult.riskAmount;
    const calculatedRrRatio = calculationResult.riskRewardRatio || 1;

    // Calculate simulated active stop loss & take profit prices
    let slPriceVal = 0;
    let tpPriceVal = 0;
    if (assetClass === 'forex') {
      const pairConfig = FOREX_PAIRS.find(p => p.symbol === forexPair) || FOREX_PAIRS[0];
      const pipSize = pairConfig.pipSize;
      const sPips = parseFloat(stopLossPips) || 0;
      const tPips = parseFloat(takeProfitPips) || 0;
      slPriceVal = direction === 'long' 
        ? entryNum - (sPips * pipSize)
        : entryNum + (sPips * pipSize);
      tpPriceVal = direction === 'long'
        ? entryNum + (tPips * pipSize)
        : entryNum - (tPips * pipSize);
    } else {
      slPriceVal = parseFloat(stopLossPrice) || 0;
      tpPriceVal = parseFloat(takeProfitPrice) || 0;
    }

    const computedUnits = calculationResult.positionSizeUnits || 1;
    const isActuallySafe = isChecklistDone && hasEmotion;
    const notesStr = isActuallySafe 
      ? `✅ Giao dịch kỷ luật tuyệt đối. R:R: ${calculatedRrRatio.toFixed(2)}`
      : `⚠️ Giao dịch GHI ĐÈ KỶ LUẬT (Thiếu quy tắc/tâm lý). R:R: ${calculatedRrRatio.toFixed(2)}`;

    if (tradeStyle === 'active') {
      const liveActiveTrade: PortfolioTrade = {
        id: randId,
        ticker: ticker.toUpperCase(),
        assetClass,
        direction,
        entryPrice: entryNum,
        currentPrice: entryNum,
        units: computedUnits, 
        lots: assetClass === 'forex' ? (calculationResult.positionSizeLots || parseFloat((computedUnits / 100000).toFixed(2)) || 0.01) : undefined,
        riskAmount: riskAmountUSD, 
        stopLoss: slPriceVal,
        takeProfit: tpPriceVal,
        pnl: 0,
        status: 'active',
        enteredAt: dateIso,
        uncheckedWarning: !isActuallySafe,
        notes: notesStr,
        sector: assetClass === 'forex' ? 'Forex / Ngoại hối' : (isVietnameseTicker(ticker) ? 'Cổ phiếu VN' : 'Crypto & Stock'),
        emotion: setup.emotion || 'Bình tĩnh',
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
        lots: assetClass === 'forex' ? (calculationResult.positionSizeLots || parseFloat((computedUnits / 100000).toFixed(2)) || 0.01) : undefined,
        riskAmount: riskAmountUSD, 
        stopLoss: slPriceVal,
        takeProfit: tpPriceVal,
        pnl: manualPnl,
        status: isWin ? 'won' : 'lost',
        enteredAt: dateIso,
        uncheckedWarning: !isActuallySafe,
        notes: notesStr,
        sector: assetClass === 'forex' ? 'Forex / Ngoại hối' : (isVietnameseTicker(ticker) ? 'Cổ phiếu VN' : 'Crypto & Stock'),
        emotion: setup.emotion || 'Bình tĩnh',
        riskPercent: riskPctNum,
        tpPercent: tpPctNum,
        rrRatio: calculatedRrRatio
      };
      
      onLogClosedTrade(liveClosedTrade, bypassDaily);
    }

    setIsWarningBypassed(false);
    setShowIncompleteWarningModal(false);
  };

  const handleAddCustomChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    onAddItem(newItemText.trim(), true);
    setNewItemText('');
  };

  const handleAddNewProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileTitle.trim()) return;
    if (!isPremium && checklistProfiles.length >= 1) {
      if (onTriggerPaywall) onTriggerPaywall();
      return;
    }
    onCreateProfile(newProfileTitle.trim());
    setNewProfileTitle('');
    setIsCreatingProfile(false);
  };

  // Emotions badges list for horizontal layout selection
  const emotionsList = [
    { value: 'Bình tĩnh', emoji: '🧘', label: 'Bình tĩnh', borderClass: 'border-emerald-500 bg-emerald-950/20 text-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]' },
    { value: 'Hưng phấn', emoji: '🔥', label: 'Hưng phấn', borderClass: 'border-orange-500 bg-orange-950/25 text-orange-400 font-bold shadow-[0_0_12px_rgba(249,115,22,0.3)]' },
    { value: 'Sợ hãi', emoji: '😨', label: 'Sợ hãi', borderClass: 'border-blue-550 bg-blue-950/20 text-blue-400 font-bold shadow-[0_0_12px_rgba(59,130,246,0.3)]' },
    { value: 'FOMO', emoji: '🚀', label: 'FOMO', borderClass: 'border-violet-500 bg-violet-950/20 text-violet-400 font-bold shadow-[0_0_12px_rgba(139,92,246,0.3)]' },
    { value: 'Cay cú/Trả thù', emoji: '😡', label: 'Cay cú', borderClass: 'border-rose-500 bg-rose-950/25 text-rose-400 font-bold shadow-[0_0_12px_rgba(244,63,94,0.3)]' },
  ] as const;

  const currentRrRatio = useMemo(() => {
    const riskVal = parseFloat(riskPercent) || 0;
    const tpVal = parseFloat(tpPercent) || 0;
    if (riskVal <= 0) return 0;
    return tpVal / riskVal;
  }, [riskPercent, tpPercent]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto text-left font-sans animate-fadeIn">
      
      {/* ==================== 1. HỒ SƠ & BỘ QUY TẮC KIỂM ĐỊNH (GRID 2 CỘT CÂN ĐỐI) ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start lg:items-stretch">
        
        {/* ==================== CỘT TRÁI (lg:col-span-7): THÔNG SỐ VỊ THẾ ==================== */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
        
        {/* Position & Sentiment Control Hub Card */}
        <div className="bg-[#0b0f19]/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          
          {/* Subtle neon abstract light behind the card */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="space-y-6">
            
            {/* HUB HEADER: THÔNG SỐ VỊ THẾ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase text-slate-100 tracking-wider">THÔNG SỐ VỊ THẾ</h2>
                  <p className="text-[11px] text-slate-455 font-medium font-sans">Bóc tách rủi ro thực tế trước khi bấm lệnh</p>
                </div>
              </div>
            </div>

            {/* HỒ SƠ VỊ THẾ FORM FIELDS CONTAINER */}
            <div className="space-y-4">
              
              {/* HÀNG 1: Account Balance, Ticker/Symbol & Entry Price (Grid 3 cột căn chỉnh ngang bằng nhau) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                
                {/* Account Balance Section */}
                <div className="space-y-1.5 w-full">
                  <label htmlFor="input-balance-terminal" className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono select-none leading-none mb-1">
                    Số dư gốc (Account Balance)
                  </label>
                  
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs select-none">$</span>
                    <input
                      id="input-balance-terminal"
                      type="number"
                      step="any"
                      value={setup.accountBalance || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateSetup({ accountBalance: isNaN(val) ? 0 : val });
                      }}
                      className="w-full h-11 bg-[#121622] border border-slate-800 focus:border-indigo-500/80 font-mono text-xs font-bold text-white px-3.5 py-0 pl-7 rounded-xl transition focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                      placeholder="10000"
                    />
                  </div>
                </div>

                {/* Ticker Symbol Section */}
                <div className="space-y-1.5 w-full">
                  <label htmlFor="input-ticker-terminal" className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono select-none leading-none mb-1">
                    Mã giao dịch / Cặp tiền (Symbol)
                  </label>
                  
                  <div className="relative">
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
                      className="w-full h-11 bg-[#121622] border border-slate-800 focus:border-indigo-500/80 font-mono text-xs font-bold text-white px-3.5 py-0 rounded-xl uppercase transition focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                      placeholder="BTCUSDT, EURUSD..."
                    />
                  </div>
                </div>

                {/* Entry Price Section */}
                <div className="space-y-1.5 w-full">
                  <label htmlFor="input-entry-terminal" className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono select-none leading-none mb-1">
                    Giá vào lệnh (Entry Price)
                  </label>

                  <div className="relative">
                    <input
                      id="input-entry-terminal"
                      type="number"
                      step="any"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      className="w-full h-11 bg-[#121622] border border-slate-800 focus:border-indigo-500/80 font-mono text-xs font-bold text-white px-3.5 py-0 rounded-xl transition focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                      placeholder="0.00"
                    />
                  </div>
                </div>

              </div>

              {/* HÀNG DIRECTION & CLOSED TYPE INPUTS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                
                {/* Long vs Short switch */}
                <div className={`${tradeStyle === 'closed' ? 'md:col-span-4' : 'md:col-span-12'} space-y-1.5`}>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono select-none">
                    Chiêu thức / Trạng thái thế lệnh
                  </label>
                  <div className="grid grid-cols-2 p-1 bg-[#121622] border border-slate-800 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setDirection('long')}
                      className={`py-2 px-3 text-[10px] font-extrabold uppercase rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition duration-150 select-none ${
                        direction === 'long'
                          ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-950/20'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-[#1C212D]/15'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                      MUA (LONG)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection('short')}
                      className={`py-2 px-3 text-[10px] font-extrabold uppercase rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition duration-150 select-none ${
                        direction === 'short'
                          ? 'bg-rose-600/90 text-white shadow-md shadow-rose-955/20'
                          : 'text-slate-500 hover:text-rose-400 hover:bg-[#1C212D]/15'
                      }`}
                    >
                      <TrendingDown className="w-3.5 h-3.5 text-rose-350" />
                      BÁN (SHORT)
                    </button>
                  </div>
                </div>

                {/* If closed history trade style selected: append Exit Price and Profit fields */}
                {tradeStyle === 'closed' && (
                  <>
                    <div className="md:col-span-4 space-y-1.5 animate-fadeIn">
                      <label htmlFor="input-exit-terminal" className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono">Giá chốt (Exit Price)</label>
                      <input
                        id="input-exit-terminal"
                        type="number"
                        step="any"
                        value={exitPrice}
                        onChange={(e) => setExitPrice(e.target.value)}
                        className="w-full h-11 bg-[#121622] border border-slate-800 hover:border-slate-700 focus:border-indigo-500 font-mono text-xs font-bold text-white px-3.5 py-0 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="md:col-span-4 space-y-1.5 animate-fadeIn">
                      <label htmlFor="input-pnl-terminal" className="block text-[10px] font-bold text-emerald-450 uppercase tracking-widest font-mono">
                        Lợi Nhuận (USD) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs select-none">$</span>
                        <input
                          id="input-pnl-terminal"
                          type="number"
                          step="any"
                          value={pnlInput}
                          onChange={(e) => setPnlInput(e.target.value)}
                          className={`w-full h-11 bg-[#121622] border font-mono text-xs font-black px-3.5 py-0 pl-7 rounded-xl focus:outline-none focus:ring-1 ${
                            parseFloat(pnlInput) >= 0 
                              ? 'border-emerald-900/60 focus:border-emerald-500 text-emerald-400 focus:ring-emerald-500/20' 
                              : 'border-rose-900/60 focus:border-rose-500 text-rose-400 focus:ring-rose-500/20'
                          }`}
                          placeholder="150"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ==================== MÁY TÍNH KHỔI LƯỢNG & VOLUME BIẾN SYMBOL ==================== */}
              <div className="space-y-4 pt-4 border-t border-slate-800/60 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span className="text-[11px] font-black uppercase text-slate-200 tracking-wider font-mono">CÔNG CỤ TÍNH VOLUME CHUYÊN NGHIỆP</span>
                </div>

                <div className="bg-[#121622]/40 border border-slate-850 p-4 rounded-2xl space-y-4">
                  {/* Row 1: Thể loại rủi ro (Risk Type) & Trị số rủi ro (Risk Value) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono select-none">
                        Cách tính rủi ro (Risk Type)
                      </label>
                      <div className="grid grid-cols-2 p-0.5 bg-[#0b0e17] border border-slate-800 rounded-xl gap-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setRiskType('percentage');
                            setRiskValue('2');
                          }}
                          className={`py-1.5 text-[9px] font-bold uppercase rounded-lg cursor-pointer transition select-none flex items-center justify-center gap-1 ${
                            riskType === 'percentage'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-350'
                          }`}
                        >
                          <Percent className="w-2.5 h-2.5" />
                          % Tài Khoản
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRiskType('amount');
                            setRiskValue('200');
                          }}
                          className={`py-1.5 text-[9px] font-bold uppercase rounded-lg cursor-pointer transition select-none flex items-center justify-center gap-1 ${
                            riskType === 'amount'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-350'
                          }`}
                        >
                          <span className="font-extrabold text-[11px] leading-none">$</span>
                          Số Tiền Mặt
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="input-risk-value" className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono flex items-center gap-1 leading-none">
                        <Flame className="w-3 h-3 text-rose-500 animate-pulse shrink-0" />
                        Chấp nhận rủi ro mỗi lệnh:
                      </label>
                      <div className="relative">
                        <input
                          id="input-risk-value"
                          type="number"
                          step="any"
                          value={riskValue}
                          onChange={(e) => setRiskValue(e.target.value)}
                          className="w-full h-9 bg-[#121622] border border-slate-800 focus:border-indigo-500/80 font-mono text-xs font-bold text-white px-3 py-0 pr-8 rounded-xl transition focus:outline-none"
                          placeholder={riskType === 'percentage' ? "2" : "200"}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-[10px] font-mono select-none">
                          {riskType === 'percentage' ? '%' : 'USD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Asset specific configuration fields */}
                  {assetClass === 'forex' ? (
                    <div className="space-y-3 pt-2.5 border-t border-slate-850 animate-fadeIn">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Forex Pair select */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono">
                            Cặp tỉ giá (Forex Pair)
                          </label>
                          <div className="relative">
                            <select
                              value={forexPair}
                              onChange={(e) => {
                                const pair = e.target.value;
                                setForexPair(pair);
                                const conf = FOREX_PAIRS.find(p => p.symbol === pair);
                                if (conf) {
                                  setPipValueUSD(conf.defaultPipValueUSD.toString());
                                }
                                // Update symbol too
                                const cleanSym = pair.replace('/', '');
                                setTicker(cleanSym);
                                setTickerInput(pair);
                                updateSetup({ name: cleanSym, forexPair: pair });
                              }}
                              className="w-full h-9 bg-[#121622] border border-slate-800 focus:border-indigo-500 text-xs font-bold text-white px-2.5 py-0 rounded-xl cursor-pointer"
                            >
                              {FOREX_PAIRS.map(p => (
                                <option key={p.symbol} value={p.symbol}>{p.symbol}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Stop Loss (Pips) */}
                        <div className="space-y-1.5">
                          <label htmlFor="input-sl-pips" className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono">
                            Khoảng Cắt Lỗ: SL (Pips)
                          </label>
                          <input
                            id="input-sl-pips"
                            type="number"
                            step="any"
                            value={stopLossPips}
                            onChange={(e) => setStopLossPips(e.target.value)}
                            className="w-full h-9 bg-[#121622] border border-slate-800 focus:border-indigo-500 text-xs font-mono font-black text-white px-3 py-0 rounded-xl"
                            placeholder="25"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Take Profit (Pips) */}
                        <div className="space-y-1.5">
                          <label htmlFor="input-tp-pips" className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                            Khoảng Chốt Lời: TP (Pips)
                          </label>
                          <input
                            id="input-tp-pips"
                            type="number"
                            step="any"
                            value={takeProfitPips}
                            onChange={(e) => setTakeProfitPips(e.target.value)}
                            className="w-full h-9 bg-[#121622] border border-slate-800 focus:border-indigo-500 text-xs font-mono font-black text-white px-3 py-0 rounded-xl"
                            placeholder="50"
                          />
                        </div>

                        {/* Pip Value USD per standard lot */}
                        <div className="space-y-1.5">
                          <label htmlFor="input-pip-value" className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono">
                            Pip Value per Standard Lot
                          </label>
                          <div className="relative">
                            <input
                              id="input-pip-value"
                              type="number"
                              step="any"
                              value={pipValueUSD}
                              onChange={(e) => setPipValueUSD(e.target.value)}
                              className="w-full h-9 bg-[#121622] border border-slate-800 focus:border-indigo-500 text-xs font-mono text-white px-3 py-0 pr-8 rounded-xl"
                              placeholder="10"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-550 font-bold text-[9px] font-mono select-none">USD</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2.5 border-t border-slate-850 animate-fadeIn">
                      {/* Stop Loss (Price) */}
                      <div className="space-y-1.5">
                        <label htmlFor="input-sl-price" className="block text-[10px] font-bold text-rose-450 uppercase tracking-widest font-mono flex items-center gap-1 select-none">
                          <Scale className="w-3 h-3 text-rose-500 shrink-0" />
                          Giá Cắt Lỗ (Stop Loss Price)
                        </label>
                        <input
                          id="input-sl-price"
                          type="number"
                          step="any"
                          value={stopLossPrice}
                          onChange={(e) => setStopLossPrice(e.target.value)}
                          className="w-full h-9 bg-[#121622] border border-slate-800 focus:border-rose-500/80 text-xs font-mono font-bold text-white px-3 py-0 rounded-xl focus:outline-hidden transition animate-fadeIn"
                          placeholder="58800"
                        />
                      </div>

                      {/* Take Profit (Price) */}
                      <div className="space-y-1.5">
                        <label htmlFor="input-tp-price" className="block text-[10px] font-bold text-emerald-450 uppercase tracking-widest font-mono flex items-center gap-1 select-none">
                          <Crown className="w-3 h-3 text-emerald-400 shrink-0" />
                          Giá Chốt Lời (Take Profit Price)
                        </label>
                        <input
                          id="input-tp-price"
                          type="number"
                          step="any"
                          value={takeProfitPrice}
                          onChange={(e) => setTakeProfitPrice(e.target.value)}
                          className="w-full h-9 bg-[#121622] border border-slate-800 focus:border-emerald-500/80 text-xs font-mono font-bold text-emerald-400 px-3 py-0 rounded-xl focus:outline-hidden transition animate-fadeIn"
                          placeholder="62400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* VISUAL COMPUTATION OUTPUT BENCHMARK */}
                <div className="bg-[#0b0e17] border border-slate-850 rounded-2xl p-4 space-y-3.5 shadow-inner">
                  <div className="grid grid-cols-2 xs:grid-cols-4 gap-3">
                    {/* Position Size units / lots */}
                    <div className="bg-[#121622]/60 border border-slate-850/60 p-3 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono select-none block mb-1">Khối Lượng Đặt</span>
                      <p className="text-[14px] font-black text-indigo-400 font-mono tracking-tight leading-none">
                        {assetClass === 'forex' ? (
                          <>
                            {calculationResult.positionSizeLots?.toFixed(2) || '0.00'}{' '}
                            <span className="text-[9px] font-black text-indigo-500/90 font-mono">LOTS</span>
                          </>
                        ) : (
                          <>
                            {calculationResult.positionSizeUnits >= 100 
                              ? Math.round(calculationResult.positionSizeUnits).toLocaleString() 
                              : calculationResult.positionSizeUnits?.toFixed(3) || '0.00'}{' '}
                            <span className="text-[9px] font-black text-indigo-500/90 font-mono">UNITS</span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Notional value */}
                    <div className="bg-[#121622]/60 border border-slate-850/60 p-3 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono select-none block mb-1">Độ Lớn Vị Thế</span>
                      <p className="text-[14px] font-black text-indigo-400 font-mono tracking-tight leading-none">
                        ${Math.round(calculationResult.notionalValue || 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Risk Amount */}
                    <div className="bg-[#121622]/60 border border-slate-850/60 p-3 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono select-none block mb-1">Rủi Ro Thực Tế</span>
                      <p className="text-[14px] font-black text-rose-400 font-mono tracking-tight leading-none">
                        ${Math.round(calculationResult.riskAmount || 0).toLocaleString()}{' '}
                        <span className="text-[9px] text-slate-500 font-mono font-medium">({computedRiskPercent.toFixed(1)}%)</span>
                      </p>
                    </div>

                    {/* Target Profit */}
                    <div className="bg-[#121622]/60 border border-slate-850/60 p-3 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono select-none block mb-1">Thắng Dự Kiến</span>
                      <p className="text-[14px] font-black text-emerald-400 font-mono tracking-tight leading-none">
                        ${Math.round(calculationResult.potentialProfit || 0).toLocaleString()}{' '}
                        <span className="text-[9px] text-slate-500 font-mono font-medium">({computedTpPercent.toFixed(1)}%)</span>
                      </p>
                    </div>
                  </div>

                  {/* R:R Ratio dynamically assessed with visual guide */}
                  <div className="pt-3 border-t border-slate-850/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans animate-fadeIn">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-[#121622] border border-slate-800 px-3.5 py-1.5 rounded-xl shrink-0 text-center select-none">
                        <span className="text-[13px] font-black text-[#10B981] drop-shadow-[0_0_10px_rgba(16,185,129,0.35)] font-mono">
                          {calculationResult.riskRewardRatio ? `${calculationResult.riskRewardRatio.toFixed(2)}x` : '0.00x'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wide block mb-0.5 select-none leading-none">Tỷ Lệ Risk : Reward (R:R Ratio)</span>
                        <span className="text-[9.5px] text-slate-500 leading-none block font-medium">Được nội suy từ khoảng cách SL : TP thiết lập bên trên</span>
                      </div>
                    </div>

                    {/* Dynamic advisory feedback box */}
                    <div className="sm:text-right flex flex-col justify-center select-none bg-[#121622]/30 px-3 py-1.5 rounded-xl border border-slate-850">
                      <span className={`font-black text-[10.5px] leading-tight block ${
                        !calculationResult.riskRewardRatio ? 'text-slate-500' :
                        calculationResult.riskRewardRatio < 1 ? 'text-rose-450' :
                        calculationResult.riskRewardRatio < 2 ? 'text-orange-400' :
                        calculationResult.riskRewardRatio < 3 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {(() => {
                          const rr = calculationResult.riskRewardRatio || 0;
                          if (rr <= 0) return 'Thiếu thông số rủi ro';
                          if (rr < 1) return '⚠️ R:R quá thấp (< 1x) | Không đạt chuẩn!';
                          if (rr < 2) return '⚡ R:R mỏng | Cần Win Rate tối thiểu > 60%';
                          if (rr < 3) return '🛡️ R:R tiêu chuẩn (>= 2x) | Đạt chuẩn Pro Trader';
                          return '💎 R:R tuyển chọn (>= 3x) | Hiệu suất tối sướng tuyệt hảo';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ==================== 2. KHU VỰC ĐỒ THỊ TRADINGVIEW (PLACED IN LEFT COLUMN BELOW POSITION PARAMETERS) ==================== */}
        <div id="chart-terminal-container" className="w-full bg-[#0b0f19]/90 border border-slate-800/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3.5 border-b border-slate-800/85 pb-3 shrink-0">
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-slate-100 tracking-wider font-mono">Đồ Thị Kỹ Thuật Realtime</h3>
              <p className="text-[10px] text-slate-500 font-semibold font-sans">Sử dụng thanh công cụ để phân tích kỹ thuật và định vị điểm vào</p>
            </div>
          </div>
          <TradingViewWidget 
            setup={widgetSetup} 
            onApplyLivePrice={handleApplyLivePrice}
            style={{ height: '100%', minHeight: '400px', width: '100%', flex: 1 }}
          />
        </div>

      </div>

      {/* ==================== CỘT PHẢI (lg:col-span-5): LÁ CHẮN BỘ QUY TẮC CHECKLIST ==================== */}
      <div className="lg:col-span-5 flex flex-col w-full gap-6">
        
        {/* Rules Barrier Outer Box */}
        <div className="bg-[#0b0f19]/90 border border-slate-850 rounded-3xl p-6 shadow-2xl relative flex flex-col justify-between flex-1 min-h-[500px] backdrop-blur-md">
          
          <div className="space-y-5">
            
            {/* CHECKLIST BARRIER MODULE HEADER */}
            <div className="flex flex-col gap-2 pb-4 border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-100 uppercase tracking-widest font-mono">CHECKLIST TRƯỚC KHI VÀO LỆNH</h3>
                </div>
                
                {/* Active Rules Fraction Status */}
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border shrink-0 ${
                  isChecklistDone 
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' 
                    : 'bg-amber-950/40 text-amber-550 border-amber-900/35'
                }`}>
                  {checkedRequired}/{totalRequired} Quy Tắc
                </span>
              </div>
              <p className="text-[10.5px] text-slate-450 leading-relaxed font-semibold">Hoàn thành đầy đủ checklist là yếu tố sống còn của Pro Trader</p>
            </div>

            {/* Profile Multi-Selector Tabs Panel if VIP/Premium is unlocked */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold font-mono block select-none">DANH SÁCH SETUP</span>
                
                {/* Create profile button trigger */}
                <button
                  type="button"
                  onClick={() => setIsCreatingProfile(!isCreatingProfile)}
                  className="text-[10px] font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer select-none font-sans border border-indigo-500/30"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0 text-white" />
                  Thêm Setup Mới
                </button>
              </div>

              {/* Inline layout form to record next checklist Setup title */}
              {isCreatingProfile && (
                <form onSubmit={handleAddNewProfile} className="flex gap-1.5 bg-[#121622] border border-slate-800 p-2 rounded-xl animate-fadeIn font-sans">
                  <input
                    type="text"
                    placeholder="Tên setup (Ví dụ: SMC, Quỹ...)"
                    value={newProfileTitle}
                    onChange={(e) => setNewProfileTitle(e.target.value)}
                    className="bg-[#0a0d14] border border-slate-800 text-[10px] px-2.5 py-1.5 rounded-lg text-white font-semibold flex-1 focus:outline-none focus:border-indigo-500/80 font-sans"
                    maxLength={35}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-bold transition shrink-0 cursor-pointer"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingProfile(false);
                      setNewProfileTitle('');
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[9px] font-bold transition shrink-0 cursor-pointer"
                  >
                    Hủy
                  </button>
                </form>
              )}

              {/* Showcase actual checklist profiles tabs based on premium features */}
              <div className="flex flex-wrap gap-1.5 font-sans">
                {checklistProfiles && checklistProfiles.map(profile => {
                  const isActive = profile.id === activeProfileId;
                  return (
                    <div key={profile.id} className="relative group/tab flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectProfile(profile.id)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition flex items-center gap-1 cursor-pointer select-none focus:outline-none ${
                          isActive
                            ? 'bg-indigo-505/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                            : 'bg-[#121622]/40 text-slate-500 border-slate-850 hover:bg-[#121622]/70 hover:text-slate-350'
                        }`}
                      >
                        <ListFilter className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[100px]">{profile.title}</span>
                      </button>
                      
                      {/* Delete profile option if more than 1 profile exists */}
                      {checklistProfiles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteProfile(profile.id)}
                          className="p-0.5 text-slate-500 hover:text-rose-400 opacity-0 group-hover/tab:opacity-100 transition shrink-0 cursor-pointer absolute -top-1 -right-1 z-10 bg-[#0B0F19] rounded-full border border-slate-800"
                        >
                          <Trash2 className="w-2 h-2" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Simulated lock prompt on standard free tier limit */}
                {!isPremium && (
                  <button
                    type="button"
                    onClick={onTriggerPaywall}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-dashed border-slate-800 bg-[#121622]/40 hover:bg-[#121622]/85 text-amber-500/80 transition flex items-center gap-1 cursor-pointer font-bold font-sans select-none focus:outline-none"
                  >
                    <Lock className="w-2.5 h-2.5 shrink-0" />
                    Thêm Setup Quỹ / SMC (PRO)
                  </button>
                )}
              </div>

            </div>

            {/* THE INLINE RULES LIST */}
            <div className="bg-[#0a0d14]/80 rounded-2xl border border-slate-850 p-4 space-y-3.5 shadow-inner">
              
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                {checklistItems && checklistItems.length > 0 ? (
                  checklistItems.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => onToggleCheck(item.id)}
                      className={`flex items-start gap-2.5 p-2 rounded-xl transition-all cursor-pointer border select-none ${
                        item.isChecked 
                          ? 'bg-emerald-950/10 border-emerald-900/35 text-slate-200' 
                          : 'bg-[#121622]/45 border-slate-850 text-slate-400 hover:bg-[#1C212D]/30'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 animate-fadeIn">
                        {item.isChecked ? (
                          <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.35)]">
                            <CheckSquare className="w-3 h-3 text-slate-950 font-black shrink-0" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded border border-slate-705 bg-transparent flex items-center justify-center hover:border-indigo-400 transition" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11.5px] leading-relaxed font-sans ${item.isChecked ? 'line-through text-slate-500 font-normal' : 'font-medium text-slate-200'}`}>
                          {item.text}
                        </p>
                      </div>

                      {/* Delete specific items - now available to both free & premium */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        className="text-slate-600 hover:text-rose-450 shrink-0 p-1 rounded hover:bg-slate-800/80 transition"
                        title="Xóa quy tắc này"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-4 font-sans">Chưa có quy tắc kiểm định an toàn nào.</p>
                )}
              </div>

              {/* Free & Premium custom rule adding panel - universal for both tiers */}
              <form onSubmit={handleAddCustomChecklistItem} className="flex gap-1.5 pt-2 border-t border-slate-850">
                <input
                  type="text"
                  placeholder="Thêm tiêu chí tùy biến..."
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  className="bg-[#0b0f19] border border-slate-800 text-[10.5px] px-3 py-2 rounded-xl text-white font-medium flex-1 focus:outline-none focus:border-indigo-500/80 font-sans focus:ring-1 focus:ring-indigo-500/15"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/20 text-white rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Plus className="w-4 h-4 text-slate-200 shrink-0" />
                </button>
              </form>

            </div>

            {/* WIDGET CẢM XÚC: 5 Horizontal badges state selector - DI CHUYỂN TỪ CỘT TRÁI SANG KHU VỰC CHECKLIST */}
            <div className="space-y-1.5 pt-3.5 border-t border-slate-800/80 pb-1.5 mt-2">
              <label htmlFor="right-emotion-picker" className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono flex items-center gap-1.5 mb-1.5 select-none">
                <Smile className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                Bạn đang có tâm thái / cảm xúc nào? *
              </label>
              
              <div id="right-emotion-picker" className="grid grid-cols-2 xs:grid-cols-5 gap-1.5 w-full">
                {emotionsList.map((emo) => {
                  const isSelected = setup.emotion === emo.value;
                  return (
                    <button
                      key={emo.value}
                      type="button"
                      onClick={() => updateSetup({ emotion: emo.value })}
                      className={`py-2.5 px-1 rounded-xl text-[10.5px] border text-center transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                        isSelected
                          ? emo.borderClass
                          : 'bg-[#121622]/45 hover:bg-[#1C212D]/40 text-slate-400 border-slate-850 hover:text-slate-200 hover:border-slate-755'
                      }`}
                    >
                      <span className="text-base leading-none filter drop-shadow-sm">{emo.emoji}</span>
                      <span className="font-semibold tracking-wide whitespace-nowrap leading-none text-[9.5px]">{emo.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily limit warnings if applicable inside this checklist box */}
            {isDailyLimitBreached && (
              <div className="p-3.5 bg-rose-550/5 border border-rose-950/20 rounded-2xl text-left text-xs text-rose-200 mt-2 space-y-2 font-sans animate-fadeIn">
                <div className="font-extrabold flex items-center gap-1 uppercase text-[10px] tracking-wider text-rose-450 select-none">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 animate-pulse" />
                  Chỉ số rủi ro tích lũy quá giới hạn!
                </div>
                <p className="text-[10.5px] leading-relaxed text-slate-400 font-sans">
                  Rủi ro hôm nay (${todayRiskUSD}) cộng thêm rủi ro lệnh này (+${finalRiskValue}) sẽ vượt quá hạn rủi ro tự định đoạt ngày (${dailyLimitUSD.toFixed(1)} USD).
                </p>
                <div className="flex items-center gap-2 select-none pt-1">
                  <input
                    type="checkbox"
                    id="checkbox-bypass-risk-limit-tab1"
                    checked={isWarningBypassed}
                    onChange={(e) => setIsWarningBypassed(e.target.checked)}
                    className="w-3.5 h-3.5 accent-rose-500 cursor-pointer rounded"
                  />
                  <label htmlFor="checkbox-bypass-risk-limit-tab1" className="text-[9.5px] font-black uppercase text-rose-350 cursor-pointer select-none leading-none">
                    Tôi gánh rủi ro vượt ngưỡng kỷ luật
                  </label>
                </div>
              </div>
            )}

          </div>

          {/* LOWER ACTION WORKSPACE: SUBMIT COMPLIANCE BUTTON & ERROR DISPATCH */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 shrink-0">
            
            {errorText && (
              <div className="p-3 bg-rose-950/25 border border-rose-900/30 rounded-xl text-left text-[10.5px] text-rose-400 font-semibold leading-relaxed font-sans">
                ⚠️ {errorText}
              </div>
            )}

            {/* LARGE COMPLIANCE BUTTON - ALWAYS ACTIVE */}
            <motion.button
              type="button"
              onClick={handleExecuteTradeLog}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className={`w-full py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 font-sans select-none border border-transparent cursor-pointer ${
                isSafeToTrade
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 hover:shadow-emerald-500/10'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400 hover:shadow-amber-500/10'
              }`}
            >
              {tradeStyle === 'active' ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse shrink-0" />
                  LƯU NHẬT KÝ GIAO DỊCH (Active)
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4 shrink-0" />
                  LƯU NHẬT KÝ GIAO DỊCH (Diary)
                </>
              )}
            </motion.button>

            {/* Advice subtext warning */}
            <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans text-center px-2 select-none italic">
              {isSafeToTrade 
                ? "🎯 Bạn đã vượt qua lá chắn kiểm định, tự tin lưu lệnh và rèn dũa kỷ luật giao dịch tuyệt đối!" 
                : "⚠️ Chưa đạt 100% kỷ luật an toàn hoặc thiếu tâm trạng. Ấn Lưu sẽ hiển thị bảng cảnh báo chi tiết các quy tắc thiếu hụt."}
            </p>

          </div>

        </div>

        {/* ===================== WIDGET 2: CẨM NANG KỶ LUẬT (FILLING EMPTY GAP) ===================== */}
        <div id="discipline-wisdom-widget" className="bg-[#0b0f19]/90 border border-slate-800/80 rounded-3xl p-5 shadow-2xl relative flex flex-col justify-center backdrop-blur-md text-left overflow-hidden shrink-0">
          {/* Subtle glowing absolute light */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full pointer-events-none" />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/70">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-mono block select-none">
                🧠 Góc Tự Duy Tâm Lý Giao Dịch
              </span>
              <button
                type="button"
                onClick={handleRotateQuote}
                className="text-[9px] font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer select-none bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 py-0.5 px-2.5 rounded-lg font-sans"
              >
                💡 Đổi châm ngôn
              </button>
            </div>

            <div className="p-4 bg-[#121622]/40 border border-slate-850 rounded-2xl relative min-h-[96px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-2 text-left"
                >
                  <p className="text-[11.5px] font-medium text-slate-300 leading-relaxed italic font-sans text-left">
                    "{currentQuote.text}"
                  </p>
                  {currentQuote.author && (
                    <p className="text-[10px] text-indigo-400 font-black tracking-wide font-mono text-right pr-1">
                      — {currentQuote.author}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

    </div>
    {showIncompleteWarningModal && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scaleIn">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-850 bg-[#121622]/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-450 uppercase tracking-wider">Cảnh báo thiếu hụt kỷ luật!</h3>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Một số chỉ số kiểm định an toàn của bạn chưa được thiết lập hoàn chỉnh:</p>
            </div>
          </div>

          {/* Body List of Missing Items */}
          <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            
            {/* Missing criteria list */}
            {!isChecklistDone && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                  1. Các quy tắc Checklist chưa đạt yêu cầu:
                </span>
                <div className="space-y-1.5 pl-1">
                  {checklistItems
                    .filter(item => !item.isChecked)
                    .map(item => (
                      <div key={item.id} className="flex items-start gap-2 text-rose-400 text-[11px] font-sans leading-relaxed">
                        <span className="text-rose-500 shrink-0 mt-0.5">✖</span>
                        <span className="text-slate-300">{item.text}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Missing Emotion selection status */}
            {!hasEmotion && (
              <div className="space-y-2 pt-2 border-t border-slate-850/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                  2. Trạng thái tâm thái cảm xúc:
                </span>
                <div className="flex items-start gap-2 text-rose-450 text-[11px] font-sans leading-relaxed">
                  <span className="text-rose-500 shrink-0">✖</span>
                  <span className="text-slate-350">Bạn chưa xác nhận trạng thái tâm thái cảm xúc hiện tại lúc vào lệnh.</span>
                </div>
              </div>
            )}

            {/* Disciplined Warning message */}
            <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-2xl space-y-1.5 text-left">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono block leading-none">Lời khuyên của chuyên gia:</span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Ghi đè kỷ luật bằng cảm xúc hoặc bỏ qua các quy tắc kiểm định an toàn thường tăng xác suất rủi ro thua lỗ và hình thành thói quen giao dịch lệch hướng. Hãy cân nhắc điều chỉnh lại vị thế của mình.
              </p>
            </div>

          </div>

          {/* Footer Interactive Actions */}
          <div className="p-4 bg-[#121622]/40 border-t border-slate-850 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setShowIncompleteWarningModal(false)}
              className="flex-1 py-3 px-4 rounded-xl text-center text-xs font-bold bg-[#1C212D]/60 hover:bg-[#1C212D] text-slate-300 hover:text-slate-100 transition cursor-pointer select-none"
            >
              Quay lại hoàn thành quy tắc
            </button>
            <button
              type="button"
              onClick={() => {
                executeSaveTradeLog();
              }}
              className="flex-1 py-3 px-4 rounded-xl text-center text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer select-none"
            >
              Chấp nhận rủi ro, cho phép lưu
            </button>
          </div>

        </div>
      </div>
    )}

    </div>
  );
}

// Inline fallback check box icon for compile robustness
function CheckSquare(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-3 h-3 text-[#0a1122]"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
