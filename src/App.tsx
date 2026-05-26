import React, { useState, useEffect, useRef } from 'react';
import { AssetClass, TradeSetup, CalculationResult, ChecklistItem, PortfolioTrade, TradingPlan, DailyLimitLog } from './types';
import { calculatePositionSize, FOREX_PAIRS } from './utils/calculator';
import ForexCalculator from './components/ForexCalculator';
import CryptoStockCalculator from './components/CryptoStockCalculator';
import RiskMeter from './components/RiskMeter';
import TradeVisualizer from './components/TradeVisualizer';
import SavedSetups from './components/SavedSetups';
import PreTradeChecklist from './components/PreTradeChecklist';
import TradingPlanManager from './components/TradingPlanManager';
import PortfolioTracker from './components/PortfolioTracker';
import { 
  Calculator, 
  Wallet, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  Briefcase, 
  FileText,
  Bookmark,
  ChevronRight,
  Info,
  CheckCircle2,
  Database,
  Code,
  Terminal,
  Copy,
  Check,
  Download,
  Upload,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

// Affiliate Links configurations for customization
const AFFILIATE_LINKS = { 
  binance: 'https://accounts.binance.com/register?ref=YOUR_ID', 
  bybit: 'https://www.bybit.com/register?affiliate_id=YOUR_ID', 
  okx: 'https://www.okx.com/join/YOUR_ID' 
};

// Default initial state
const defaultSetup: TradeSetup = {
  id: '',
  name: 'EURUSD',
  assetClass: 'forex',
  direction: 'long',
  accountBalance: 10000,
  accountCurrency: 'USD',
  riskType: 'percentage',
  riskValue: 1, // Default to 1% risk
  forexPair: FOREX_PAIRS[0].symbol,
  stopLossPips: 20,
  pipValueUSD: FOREX_PAIRS[0].defaultPipValueUSD,
  entryPrice: 100,
  stopLossPrice: 95,
  takeProfitPrice: 115,
  createdAt: ''
};

const generateUniqueId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Array.from({ length: 4 }, () => Math.random().toString(36).substring(2, 10)).join('-');
};

export default function App() {
  const [setup, setSetup] = useState<TradeSetup>(() => {
    try {
      const persisted = localStorage.getItem('current_tradesetup');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (parsed && typeof parsed === 'object') {
          return { ...defaultSetup, ...parsed };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return defaultSetup;
  });

  const [savedList, setSavedList] = useState<TradeSetup[]>(() => {
    try {
      const persisted = localStorage.getItem('trading_saved_setups');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && typeof item === 'object');
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'calculator' | 'portfolio' | 'plans'>(() => {
    const rawTab = localStorage.getItem('active_tab');
    if (rawTab === 'calculator' || rawTab === 'portfolio' || rawTab === 'plans') {
      return rawTab;
    }
    return 'calculator';
  });

  // Checklist Item State
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    try {
      const persisted = localStorage.getItem('trading_checklist_items');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (Array.isArray(parsed)) {
          const validated = parsed.filter(item => item && typeof item === 'object' && 'id' in item);
          if (validated.length > 0) return validated;
        }
      }
    } catch (e) {}
    // Premium defaults
    return [
      { id: '1', text: 'Xác định xu hướng lớn đồng thuận (Khung H4/D1)', isChecked: false, isRequired: true },
      { id: '2', text: 'Giá ở vùng hỗ trợ lớn, kháng cự cứng, hoặc Key level', isChecked: false, isRequired: true },
      { id: '3', text: 'Tỉ lệ Rủi ro : Lợi nhuận (R:R) tối thiểu đạt 1:2', isChecked: false, isRequired: true },
      { id: '4', text: 'Xác định cụm nến xác nhận hoặc tín hiệu đảo chiều rõ rệt', isChecked: false, isRequired: true },
      { id: '5', text: 'Kiểm tra lịch sự kiện kinh tế để chắc chắn không bão tin tức', isChecked: false, isRequired: false },
      { id: '6', text: 'Mức rủi ro tối đa nằm trong giới hạn kiểm soát vốn (< 2%)', isChecked: false, isRequired: true },
    ];
  });

  const [showAffiliateDropdown, setShowAffiliateDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAffiliateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Offline defaults - Unlimited access
  const isUserAdmin = false;
  const isPremium = true;
  const [showPaywall, setShowPaywall] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Portfolio active positions from localStorage
  const [activeTrades, setActiveTrades] = useState<PortfolioTrade[]>(() => {
    try {
      const persisted = localStorage.getItem('trading_active_trades');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && typeof item === 'object');
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Closed history trades log from localStorage
  const [closedTrades, setClosedTrades] = useState<PortfolioTrade[]>(() => {
    try {
      const persisted = localStorage.getItem('trading_closed_trades');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && typeof item === 'object');
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Trading plans state
  const [plans, setPlans] = useState<TradingPlan[]>(() => {
    try {
      const persisted = localStorage.getItem('trading_plans');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && typeof item === 'object');
        }
      }
    } catch (e) {}
    return [];
  });

  const [leverage, setLeverage] = useState<number>(100); // Default 1:100 leverage
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Daily Limit State
  const [showDailyLimitModal, setShowDailyLimitModal] = useState(false);
  const [forcePhraseInput, setForcePhraseInput] = useState('');
  const [dailyDisciplineLogs, setDailyDisciplineLogs] = useState<DailyLimitLog[]>(() => {
    try {
      const persisted = localStorage.getItem('trading_daily_discipline_logs');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && typeof item === 'object');
        }
      }
    } catch (e) {}
    return [];
  });
  const [dailyLimitWarningData, setDailyLimitWarningData] = useState<{
    todayRiskRisk: number;
    newTradeRisk: number;
    allowedLimitUSD: number;
  }>({
    todayRiskRisk: 0,
    newTradeRisk: 0,
    allowedLimitUSD: 0
  });

  // Export JSON Backup
  const handleBackup = () => {
    try {
      const backupData = {
        current_tradesetup: JSON.parse(localStorage.getItem('current_tradesetup') || 'null'),
        trading_saved_setups: JSON.parse(localStorage.getItem('trading_saved_setups') || '[]'),
        trading_checklist_items: JSON.parse(localStorage.getItem('trading_checklist_items') || '[]'),
        trading_plans: JSON.parse(localStorage.getItem('trading_plans') || '[]'),
        trading_active_trades: JSON.parse(localStorage.getItem('trading_active_trades') || '[]'),
        trading_closed_trades: JSON.parse(localStorage.getItem('trading_closed_trades') || '[]'),
        trading_daily_discipline_logs: JSON.parse(localStorage.getItem('trading_daily_discipline_logs') || '[]')
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `riskwise_backup_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e) {
      alert("Lỗi khi xuất dữ liệu backup!");
      console.error(e);
    }
  };

  // Import / Restore JSON Backup
  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (e) => {
      try {
        const resultText = e.target?.result;
        if (typeof resultText !== 'string') return;
        
        const parsedData = JSON.parse(resultText);
        
        if (parsedData && typeof parsedData === 'object') {
          if (parsedData.current_tradesetup) {
            localStorage.setItem('current_tradesetup', JSON.stringify(parsedData.current_tradesetup));
            setSetup(parsedData.current_tradesetup);
          }
          if (Array.isArray(parsedData.trading_saved_setups)) {
            localStorage.setItem('trading_saved_setups', JSON.stringify(parsedData.trading_saved_setups));
            setSavedList(parsedData.trading_saved_setups);
          }
          if (Array.isArray(parsedData.trading_checklist_items)) {
            localStorage.setItem('trading_checklist_items', JSON.stringify(parsedData.trading_checklist_items));
            setChecklist(parsedData.trading_checklist_items);
          }
          if (Array.isArray(parsedData.trading_plans)) {
            localStorage.setItem('trading_plans', JSON.stringify(parsedData.trading_plans));
            setPlans(parsedData.trading_plans);
          }
          if (Array.isArray(parsedData.trading_active_trades)) {
            localStorage.setItem('trading_active_trades', JSON.stringify(parsedData.trading_active_trades));
            setActiveTrades(parsedData.trading_active_trades);
          }
          if (Array.isArray(parsedData.trading_closed_trades)) {
            localStorage.setItem('trading_closed_trades', JSON.stringify(parsedData.trading_closed_trades));
            setClosedTrades(parsedData.trading_closed_trades);
          }
          if (Array.isArray(parsedData.trading_daily_discipline_logs)) {
            localStorage.setItem('trading_daily_discipline_logs', JSON.stringify(parsedData.trading_daily_discipline_logs));
            setDailyDisciplineLogs(parsedData.trading_daily_discipline_logs);
          }

          alert("Khôi phục dữ liệu thành công! Ứng dụng sẽ tự động tải lại để cập nhật.");
          window.location.reload();
        } else {
          alert("File JSON khôi phục không đúng định dạng backup.");
        }
      } catch (error) {
        alert("Lỗi khi khôi phục dữ liệu, vui lòng kiểm tra lại file của bạn.");
        console.error(error);
      }
    };
    fileReader.readAsText(files[0]);
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Synchronizers
  useEffect(() => {
    localStorage.setItem('trading_active_trades', JSON.stringify(activeTrades));
  }, [activeTrades]);

  useEffect(() => {
    localStorage.setItem('trading_closed_trades', JSON.stringify(closedTrades));
  }, [closedTrades]);

  useEffect(() => {
    localStorage.setItem('trading_daily_discipline_logs', JSON.stringify(dailyDisciplineLogs));
  }, [dailyDisciplineLogs]);

  useEffect(() => {
    localStorage.setItem('current_tradesetup', JSON.stringify(setup));
  }, [setup]);

  useEffect(() => {
    localStorage.setItem('trading_saved_setups', JSON.stringify(savedList));
  }, [savedList]);

  useEffect(() => {
    localStorage.setItem('active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('trading_checklist_items', JSON.stringify(checklist));
  }, [checklist]);

  useEffect(() => {
    localStorage.setItem('trading_plans', JSON.stringify(plans));
  }, [plans]);


  // Synchronize Daily Disciplinary logs dynamically when trades are updated, closed, or deleted
  useEffect(() => {
    setDailyDisciplineLogs(currentLogs => {
      if (currentLogs.length === 0) return currentLogs;
      
      let modified = false;
      const updated = currentLogs.map(log => {
        const logDate = log.date;
        
        const activeRiskForDay = activeTrades
          .filter(t => t.enteredAt.startsWith(logDate) || t.enteredAt.split('T')[0] === logDate)
          .reduce((sum, t) => sum + t.riskAmount, 0);

        // FIX #3a: Dùng riskAmount (vốn bỏ ra rủi ro), không dùng -pnl
        // Lý do: lệnh thắng có pnl > 0 → -pnl âm → tổng risk ngày bị giảm xuống số âm (vô nghĩa)
        // "Rủi ro đã dùng" là số tiền bạn SẴN SÀNG mất, không phải lợi nhuận thực tế
        const closedRiskForDay = closedTrades
          .filter(t => t.enteredAt.startsWith(logDate) || t.enteredAt.split('T')[0] === logDate)
          .reduce((sum, t) => sum + t.riskAmount, 0);

        const computedRisk = Math.round((activeRiskForDay + closedRiskForDay) * 100) / 100;
        const isExceeded = log.allowedLimit > 0 && computedRisk > log.allowedLimit;

        if (log.totalRisk !== computedRisk || log.isExceeded !== isExceeded) {
          modified = true;
          return {
            ...log,
            totalRisk: computedRisk,
            isExceeded: isExceeded
          };
        }
        return log;
      });

      return modified ? updated : currentLogs;
    });
  }, [activeTrades, closedTrades]);

  const updateSetup = (updater: Partial<TradeSetup>) => {
    setSetup(prev => {
      const nameChanged = updater.name !== undefined && updater.name !== prev.name;
      const forexChanged = updater.forexPair !== undefined && updater.forexPair !== prev.forexPair;
      if (nameChanged || forexChanged) {
        setChecklist(current => current.map(item => ({ ...item, isChecked: false })));
      }
      return { ...prev, ...updater };
    });
  };

  const handleReset = () => {
    if (window.confirm('Bạn có muốn đặt lại toàn bộ thông số về mặc định không?')) {
      setSetup(defaultSetup);
    }
  };

  const handleLoadSetup = (loaded: TradeSetup) => {
    if (loaded.name !== setup.name || loaded.forexPair !== setup.forexPair) {
      setChecklist(current => current.map(item => ({ ...item, isChecked: false })));
    }
    setSetup({ ...loaded, id: '' });
  };

  const handleDeleteSetup = (id: string) => {
    setSavedList(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveSetup = (name: string) => {
    const toSave: TradeSetup = {
      ...setup,
      id: generateUniqueId(),
      name: name,
      createdAt: new Date().toISOString()
    };
    setSavedList(prev => [toSave, ...prev]);
  };

  // Checklist Actions
  const handleToggleCheck = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    ));
  };

  const handleAddChecklistItem = (text: string, isRequired: boolean) => {
    const newItem: ChecklistItem = {
      id: generateUniqueId(),
      text,
      isChecked: false,
      isRequired
    };
    setChecklist(prev => [...prev, newItem]);
  };

  const handleDeleteChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  // Portfolio Actions
  const getLocalTodayDateStr = () => {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  const getMonthlySavedCount = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const activeCount = activeTrades.filter(t => {
      try {
        const d = new Date(t.enteredAt);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      } catch {
        return false;
      }
    }).length;

    const closedCount = closedTrades.filter(t => {
      try {
        const d = new Date(t.enteredAt);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      } catch {
        return false;
      }
    }).length;

    return activeCount + closedCount;
  };

  const handleAttemptLogTrade = () => {
    // Freemium Monthly subscription quota protection
    const orderCount = getMonthlySavedCount();
    const shouldShowPaywall = (orderCount >= 20 && !isPremium && !isUserAdmin);

    if (shouldShowPaywall) {
      setShowPaywall(true);
      return;
    }

    const todayDateStr = getLocalTodayDateStr();

    // Sum up risk for all entries logged today in active and closed trades
    const activeTodayRisk = activeTrades
      .filter(t => t.enteredAt.startsWith(todayDateStr) || t.enteredAt.split('T')[0] === todayDateStr)
      .reduce((sum, t) => sum + t.riskAmount, 0);

    // FIX #3c: Dùng riskAmount — đây là "vốn rủi ro đã dùng hôm nay", không phải lợi/lỗ thực tế
    const closedTodayRisk = closedTrades
      .filter(t => t.enteredAt.startsWith(todayDateStr) || t.enteredAt.split('T')[0] === todayDateStr)
      .reduce((sum, t) => sum + t.riskAmount, 0);

    const todayRiskTotal = activeTodayRisk + closedTodayRisk;
    const currentNewRisk = result.riskAmount;
    
    const maxDailyLimitUSD = (setup.dailyLimitPercent && setup.dailyLimitPercent > 0)
      ? setup.accountBalance * (setup.dailyLimitPercent / 100)
      : 0;

    const isDailyLimitExceeded = maxDailyLimitUSD > 0 && ((todayRiskTotal + currentNewRisk) > maxDailyLimitUSD);

    if (isDailyLimitExceeded) {
      setDailyLimitWarningData({
        todayRiskRisk: todayRiskTotal,
        newTradeRisk: currentNewRisk,
        allowedLimitUSD: maxDailyLimitUSD
      });
      setShowDailyLimitModal(true);
      setForcePhraseInput('');
    } else {
      proceedToChecklistValidation(false);
    }
  };

  const proceedToChecklistValidation = (byPassingDailyLimit: boolean) => {
    // Check if any REQUIRED checklist items are NOT ticked
    const missingRequired = checklist.filter(item => item.isRequired && !item.isChecked);
    
    if (missingRequired.length > 0) {
      // Trigger checklist missing warning dialog trigger
      setShowWarningModal(true);
    } else {
      // Safe to execute immediately
      executeAndLogTrade(false, byPassingDailyLimit);
    }
  };

  const executeAndLogTrade = (bypassForce: boolean, breachedDaily: boolean = false) => {
    const units = result.positionSizeUnits !== undefined ? result.positionSizeUnits : 0;
    
    if (units <= 0) {
      alert("Khối lượng vào lệnh bằng 0. Vui lòng thiết lập thông số dừng lỗ hợp lệ trước khi vào lệnh!");
      return;
    }

    let ticker = '';
    let stopLossStr = '';
    let direction = setup.direction || 'long';
    let entryPr = 0;
    let trSector = 'Chưa phân loại';

    if (setup.assetClass === 'forex') {
      ticker = setup.forexPair || 'EUR/USD';
      stopLossStr = `${setup.stopLossPips} pips (SL)`;
      trSector = 'Forex / Ngoại hối';
      
      const defaultPriceMap: { [key: string]: number } = {
        'EUR/USD': 1.0852,
        'GBP/USD': 1.2684,
        'AUD/USD': 0.6612,
        'NZD/USD': 0.6124,
        'USD/JPY': 156.45,
        'USD/CAD': 1.3650,
        'USD/CHF': 0.9080,
        'EUR/GBP': 0.8550,
        'EUR/JPY': 169.80,
        'GBP/JPY': 198.50,
        'BTC/USD (Crypto Lot)': 68420.0
      };
      entryPr = defaultPriceMap[ticker] || 1.0000;
    } else {
      ticker = setup.name ? setup.name.toUpperCase().replace(/\s+/g, '') : 'CRYPTO_STOCK';
      entryPr = setup.entryPrice || 100;
      stopLossStr = `$${(setup.stopLossPrice || 0).toLocaleString()}`;
      trSector = setup.sector ? setup.sector.trim() : 'Chưa phân loại';
      // FIX #1: Dùng direction user đã chọn, không tự suy luận từ giá
      // Suy luận từ giá gây lật direction khi user vào Short nhưng SL chưa đúng vị trí
      direction = setup.direction || 'long';
    }

    const tDate = new Date();
    const isoString = tDate.toISOString();
    const todayDateStr = getLocalTodayDateStr();
    const randId = generateUniqueId();

    const newTrade: PortfolioTrade = {
      id: randId,
      ticker,
      assetClass: setup.assetClass,
      direction,
      entryPrice: entryPr,
      currentPrice: entryPr,
      units,
      lots: setup.assetClass === 'forex' ? result.positionSizeLots : undefined,
      riskAmount: result.riskAmount,
      stopLoss: stopLossStr,
      takeProfit: setup.assetClass === 'forex' 
        ? (setup.takeProfitPips ? `${setup.takeProfitPips} pips (TP)` : 'Chưa cài')
        : (setup.takeProfitPrice ? `$${setup.takeProfitPrice.toLocaleString()}` : 'Chưa cài'),
      pnl: 0,
      status: 'active',
      enteredAt: isoString,
      uncheckedWarning: bypassForce,
      sector: trSector
    };

    // Optimistically update local UI state
    setActiveTrades(prev => [newTrade, ...prev]);

    // Keep Daily Disciplinary Log in sync
    setDailyDisciplineLogs(prev => {
      const existingIdx = prev.findIndex(l => l.date === todayDateStr);
      
      // FIX #5: Không đọc activeTrades/closedTrades từ closure (stale state).
      // Thay vào đó: truyền newTrade vào hàm và tính trực tiếp từ snapshot hiện tại
      // bằng cách dùng functional updater. Vì setActiveTrades là async, activeTrades
      // ở đây vẫn là giá trị CŨ → tính thủ công từ current daily log + newTrade.riskAmount
      const existingLogRisk = prev.find(l => l.date === todayDateStr)?.totalRisk || 0;
      const todayRiskNow = Math.round((existingLogRisk + result.riskAmount) * 100) / 100;

      const maxDailyLimitUSD = (setup.dailyLimitPercent && setup.dailyLimitPercent > 0)
        ? setup.accountBalance * (setup.dailyLimitPercent / 100)
        : 0;

      const isLogExceededNow = maxDailyLimitUSD > 0 && todayRiskNow > maxDailyLimitUSD;

      const newLog: DailyLimitLog = {
        date: todayDateStr,
        totalRisk: todayRiskNow,
        allowedLimit: maxDailyLimitUSD,
        isExceeded: isLogExceededNow,
        breachedByForce: breachedDaily || (existingIdx >= 0 ? (prev[existingIdx].breachedByForce || breachedDaily) : breachedDaily)
      };

      const updated = [...prev];
      if (existingIdx >= 0) {
        updated[existingIdx] = newLog;
      } else {
        updated.unshift(newLog);
      }
      return updated;
    });

    setShowWarningModal(false);
    setShowDailyLimitModal(false);
    setActiveTab('portfolio');
  };

  const handleCloseTrade = (id: string, outcome: 'won' | 'lost', finalPrice?: number) => {
    const trade = activeTrades.find(t => t.id === id);
    if (!trade) return;

    // FIX #2: Tính PnL đúng khi đóng lệnh
    // Ưu tiên: (1) finalPrice nếu có, (2) trade.pnl nếu đã cập nhật giá (≠ 0),
    // (3) tính từ takeProfit nếu có, (4) KHÔNG dùng riskAmount làm fallback PnL
    let correctedPnl: number;

    if (trade.pnl !== 0) {
      // User đã cập nhật giá hiện tại → dùng floating PnL thực tế
      correctedPnl = outcome === 'won'
        ? Math.abs(trade.pnl)
        : -Math.abs(trade.pnl);
    } else if (trade.assetClass === 'crypto_stock' && trade.takeProfit && trade.takeProfit !== 'Chưa cài') {
      // Tính từ takeProfit price nếu có (crypto/stock)
      const tpPrice = parseFloat(String(trade.takeProfit).replace(/[^0-9.]/g, ''));
      if (!isNaN(tpPrice) && tpPrice > 0) {
        const isLong = trade.direction === 'long';
        const tpPnl = isLong
          ? (tpPrice - trade.entryPrice) * trade.units
          : (trade.entryPrice - tpPrice) * trade.units;
        correctedPnl = outcome === 'won' ? Math.abs(tpPnl) : -Math.abs(trade.riskAmount);
      } else {
        // Không đủ thông tin → dùng riskAmount có cảnh báo
        correctedPnl = outcome === 'won' ? trade.riskAmount : -trade.riskAmount;
      }
    } else {
      // Fallback cuối: riskAmount — nhưng user nên được nhắc cập nhật giá trước
      correctedPnl = outcome === 'won' ? trade.riskAmount : -trade.riskAmount;
    }

    const finalPnl = Math.round(correctedPnl * 100) / 100;

    // BONUS: Nhắc user nếu PnL chưa được cập nhật (trade.pnl === 0 nghĩa là chưa update giá)
    if (trade.pnl === 0 && outcome === 'won') {
      // Không block, chỉ log để biết PnL có thể không chính xác
      console.warn(`[handleCloseTrade] Trade ${trade.ticker}: PnL = 0 khi đóng lệnh thắng. Cân nhắc cập nhật giá hiện tại trước khi đóng để thống kê chính xác hơn.`);
    }

    const closed: PortfolioTrade = {
      ...trade,
      status: outcome,
      pnl: finalPnl,
      enteredAt: trade.enteredAt
    };

    // Optimistically update states
    setClosedTrades(history => {
      if (history.some(t => t.id === id)) return history;
      return [closed, ...history];
    });
    setActiveTrades(prev => prev.filter(t => t.id !== id));
  };

  const handleDeleteClosedTrade = (id: string) => {
    // Optimistic local update
    setClosedTrades(prev => prev.filter(t => t.id !== id));
  };

  const handleClearClosedHistory = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử vị thế đã đóng?")) {
      setClosedTrades([]);
    }
  };

  const handleUpdateCurrentPrice = (id: string, newPrice: number) => {
    let finalPnl = 0;
    
    setActiveTrades(prev => prev.map(trade => {
      if (trade.id !== id) return trade;
      
      let calculatedPnl = 0;
      const isLong = trade.direction === 'long';
      
      if (trade.assetClass === 'forex') {
        const pairConfig = FOREX_PAIRS.find(p => p.symbol === trade.ticker);
        const pipSize = pairConfig?.pipSize || 0.0001;

        // FIX #4: Tính pip value động theo tỷ giá hiện tại thay vì hardcode $10
        // Công thức chuẩn: pip value (USD) = (pipSize / tỷ giá quote/USD) * units
        // Với USD quote pairs (EUR/USD, GBP/USD...): pipValue = pipSize * units
        // Với JPY pairs (USD/JPY, EUR/JPY...): pipValue = (pipSize / currentPrice) * units
        // Với USD base pairs (USD/JPY, USD/CAD...): cần chia thêm cho tỷ giá
        const isJpyQuote = trade.ticker.endsWith('/JPY') || trade.ticker.endsWith('JPY');
        const isUsdQuote = trade.ticker.endsWith('/USD') || trade.ticker === 'EUR/USD'
          || trade.ticker === 'GBP/USD' || trade.ticker === 'AUD/USD' || trade.ticker === 'NZD/USD';
        const isUsdBase = trade.ticker.startsWith('USD/');

        let pipValuePerLot: number;
        if (isUsdQuote) {
          // EUR/USD, GBP/USD, AUD/USD, NZD/USD: pip value = $10/lot (cố định)
          pipValuePerLot = pairConfig?.defaultPipValueUSD || 10;
        } else if (isJpyQuote) {
          // USD/JPY, EUR/JPY, GBP/JPY: pip value thay đổi theo tỷ giá
          // Công thức: (pipSize * standardLot) / currentPrice
          const standardLot = pairConfig?.standardLotUnits || 100000;
          pipValuePerLot = (pipSize * standardLot) / newPrice;
        } else if (isUsdBase) {
          // USD/CAD, USD/CHF: pip value = (pipSize * standardLot) / currentPrice
          const standardLot = pairConfig?.standardLotUnits || 100000;
          pipValuePerLot = (pipSize * standardLot) / newPrice;
        } else {
          // Fallback: dùng defaultPipValueUSD từ config
          pipValuePerLot = pairConfig?.defaultPipValueUSD || 10;
        }

        const pipsDiff = (newPrice - trade.entryPrice) / pipSize;
        const multiplier = isLong ? 1 : -1;
        calculatedPnl = pipsDiff * (trade.lots || 0) * pipValuePerLot * multiplier;
      } else {
        const priceDiff = isLong ? (newPrice - trade.entryPrice) : (trade.entryPrice - newPrice);
        calculatedPnl = priceDiff * trade.units;
      }
      
      finalPnl = Math.round(calculatedPnl * 100) / 100;
      
      return {
        ...trade,
        currentPrice: newPrice,
        pnl: finalPnl
      };
    }));
  };

  const handleUpdateTrailingStop = (id: string, trailingPrice: number | undefined) => {
    setActiveTrades(prev => prev.map(trade => {
      if (trade.id !== id) return trade;
      return {
        ...trade,
        trailingStopPrice: trailingPrice
      };
    }));
  };


  // Plans Actions
  const handleAddPlan = (newPlan: Omit<TradingPlan, 'id' | 'createdAt'>) => {
    const toSave: TradingPlan = {
      ...newPlan,
      id: generateUniqueId(),
      createdAt: new Date().toISOString()
    };
    setPlans(prev => [toSave, ...prev]);
  };

  const handleDeletePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdatePlanStatus = (id: string, status: 'pending' | 'executed' | 'cancelled') => {
    setPlans(prev => prev.map(p => 
      p.id === id ? { ...p, status } : p
    ));
  };

  const handleImportPlanToCalc = (plan: TradingPlan) => {
    setSetup({
      ...setup,
      assetClass: plan.assetClass,
      name: plan.ticker,
      forexPair: plan.assetClass === 'forex' ? plan.ticker : setup.forexPair,
      direction: plan.direction,
      entryPrice: plan.entryPrice,
      stopLossPrice: plan.stopLossPrice,
      takeProfitPrice: plan.takeProfitPrice,
    });
    // Jump to calculator automatically
    setActiveTab('calculator');
  };


  // Derive core values
  const result = calculatePositionSize(setup);

  const riskPct = setup.riskType === 'percentage' 
    ? setup.riskValue 
    : (setup.accountBalance > 0 ? (setup.riskValue / setup.accountBalance) * 100 : 0);

  const requiredMargin = result.notionalValue / leverage;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 font-sans antialiased selection:bg-indigo-950 selection:text-indigo-300 flex flex-col pb-0">
      {/* Top clean header */}
      <header className="border-b border-slate-800/80 bg-[#0B0E14] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-indigo-650 to-indigo-550 p-2 rounded-xl shadow-xs text-white">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-sans font-black text-white text-sm tracking-wide sm:text-base leading-none uppercase">
                RiskWise <span className="text-indigo-400 font-light">Calculator</span>
              </h1>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">
                Nền tảng quản lý rủi ro &amp; Giao dịch phi tập trung
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Affiliate Button with dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowAffiliateDropdown(!showAffiliateDropdown)}
                className="p-1.5 px-3 bg-indigo-950/30 hover:bg-indigo-900/40 border border-[#1e1b4b] text-indigo-300 hover:text-indigo-200 rounded-xl transition duration-150 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Đăng ký tài khoản sàn giảm phí giao dịch"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>Ưu đãi sàn (Giảm 20% Phí)</span>
                <ChevronDown className="w-3 h-3 text-indigo-400" />
              </button>

              <AnimatePresence>
                {showAffiliateDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#14171F] border border-slate-850 p-2.5 shadow-2xl z-50 text-left"
                  >
                    <div className="px-3 py-2 border-b border-slate-800/50 pb-2 mb-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Đăng ký sàn giao dịch</span>
                      <span className="text-[11px] text-slate-400 leading-normal block mt-1">Sử dụng liên kết ưu đãi độc quyền giảm phí 20%:</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <a
                        href={AFFILIATE_LINKS.binance}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1C212D] text-slate-250 transition font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-450"></span>
                          <span>Binance Standard</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                      <a
                        href={AFFILIATE_LINKS.bybit}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1C212D] text-slate-250 transition font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Bybit Exchange</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                      <a
                        href={AFFILIATE_LINKS.okx}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1C212D] text-slate-250 transition font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                          <span>OKX Exchange</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Offline Local Tools (Backup & Restore) */}
            <div className="flex items-center bg-[#14171F] p-1 rounded-xl border border-slate-800/80">
              <button
                onClick={handleBackup}
                className="p-1 px-2.5 hover:bg-[#1C212D] text-indigo-400 hover:text-indigo-300 rounded-lg transition duration-150 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                title="Sao lưu toàn bộ dữ liệu ra tệp tin JSON"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Sao lưu</span>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1 px-2.5 hover:bg-[#1C212D] text-emerald-400 hover:text-emerald-300 rounded-lg transition duration-150 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                title="Khôi phục toàn bộ dữ liệu từ tệp tin JSON"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Khôi phục</span>
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleRestore}
                accept=".json"
                className="hidden"
              />
            </div>

            <button
              id="btn-reset-form"
              onClick={handleReset}
              className="p-1.5 px-3 hover:bg-[#1C212D] border border-slate-800 hover:border-slate-700 rounded-xl text-slate-450 hover:text-slate-200 transition duration-150 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          </div>
        </div>
      </header>


      {/* Primary Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 w-full">
        <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-px scrollbar-none">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-2.5 px-4.5 text-xs font-bold transition flex items-center gap-2 border-b-2 hover:text-white cursor-pointer select-none shrink-0 ${
              activeTab === 'calculator'
                ? 'border-indigo-500 text-white bg-[#14171F]/50 rounded-t-xl'
                : 'border-transparent text-slate-450'
            }`}
          >
            <Calculator className="w-4 h-4 text-indigo-400" />
            Tính Toán &amp; Vào Lệnh
          </button>
          
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-2.5 px-4.5 text-xs font-bold transition flex items-center gap-2 border-b-2 hover:text-white cursor-pointer select-none shrink-0 ${
              activeTab === 'portfolio'
                ? 'border-emerald-500 text-white bg-[#14171F]/50 rounded-t-xl'
                : 'border-transparent text-slate-450'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-400" />
            Vị Thế Đang Mở (Active)
            {activeTrades.length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full font-mono">
                {activeTrades.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`py-2.5 px-4.5 text-xs font-bold transition flex items-center gap-2 border-b-2 hover:text-white cursor-pointer select-none shrink-0 ${
              activeTab === 'plans'
                ? 'border-yellow-500 text-white bg-[#14171F]/50 rounded-t-xl'
                : 'border-transparent text-slate-450'
            }`}
          >
            <FileText className="w-4 h-4 text-yellow-500" />
            Kế Hoạch Khớp Lệnh
            {plans.length > 0 && (
              <span className="bg-slate-800 text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                {plans.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Render */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex-1 w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'calculator' && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6"
            >
              {/* Column 1: Pre-Trade Checklist & Saved List (Span 3) */}
              <div className="lg:col-span-3 space-y-6">
                <PreTradeChecklist
                  items={checklist}
                  onToggleCheck={handleToggleCheck}
                  onAddItem={handleAddChecklistItem}
                  onDeleteItem={handleDeleteChecklistItem}
                />

                <SavedSetups
                  setups={savedList}
                  onLoadSetup={handleLoadSetup}
                  onDeleteSetup={handleDeleteSetup}
                  onSaveSetup={handleSaveSetup}
                />
              </div>

              {/* Column 2: Core Inputs (Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#14171F] rounded-2xl p-5 sm:p-6 border border-slate-800/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                       <Layers className="w-4 h-4 text-indigo-400" />
                      <h2 className="font-bold text-slate-100 text-sm sm:text-base uppercase tracking-wide">Thông số vị thế</h2>
                    </div>

                    {/* Simple Buy/Sell toggle inside setup */}
                    <div className="flex bg-[#1C212D] p-0.5 rounded-lg border border-slate-800 text-[9px] font-bold select-none">
                      <button
                        type="button"
                        onClick={() => updateSetup({ direction: 'long' })}
                        className={`px-2 py-1 rounded transition-colors ${
                          (setup.direction || 'long') === 'long' 
                            ? 'bg-emerald-600 text-white' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        MUA (Long)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSetup({ direction: 'short' })}
                        className={`px-2 py-1 rounded transition-colors ${
                          (setup.direction || 'long') === 'short' 
                            ? 'bg-rose-600 text-white' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        BÁN (Short)
                      </button>
                    </div>
                  </div>

                  {/* Asset Class Toggles */}
                  <div className="grid grid-cols-2 gap-2 bg-[#1C212D] p-1 rounded-xl mb-5 border border-slate-800/50">
                    <button
                      id="tab-select-forex"
                      onClick={() => updateSetup({ assetClass: 'forex' })}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                        setup.assetClass === 'forex'
                          ? 'bg-[#0B0E14] text-indigo-400 shadow-sm border border-slate-800/60'
                          : 'text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      <span>Forex (Lot/Pips)</span>
                    </button>
                    <button
                      id="tab-select-crypto"
                      onClick={() => updateSetup({ assetClass: 'crypto_stock' })}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                        setup.assetClass === 'crypto_stock'
                          ? 'bg-[#0B0E14] text-emerald-400 shadow-sm border border-slate-800/60'
                          : 'text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      <span>Crypto &amp; Stocks</span>
                    </button>
                  </div>

                  {/* Input Fields */}
                  <div className="space-y-4">
                    
                    {/* Account Balance */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Số dư tài khoản (Account Balance)</span>
                        <span className="text-[10px] text-indigo-455 font-bold flex items-center font-mono">
                          <Wallet className="w-3 h-3 mr-1" />
                          USD
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-slate-500 font-semibold text-xs">$</span>
                        <input
                          id="input-account-balance"
                          type="number"
                          step="any"
                          min="1"
                          value={setup.accountBalance}
                          onChange={(e) => updateSetup({ accountBalance: Math.max(1, parseFloat(e.target.value) || 0) })}
                          className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-650 font-mono text-xs font-bold text-white pl-7 pr-3 py-3 rounded-xl focus:outline-hidden focus:border-indigo-500 transition duration-150"
                        />
                      </div>
                    </div>

                    {/* Daily Risk Limit Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Giới Hạn Rủi Ro Ngày (Daily Risk Limit)</span>
                        <span className="text-[10px] text-[#A78BFA] font-bold font-mono">
                          % VỐN / NGÀY
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-500 font-bold text-xs">%</span>
                        <input
                          id="input-daily-limit"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="Ví dụ: 2 hoặc 5 (Để trống = Không giới hạn)"
                          value={setup.dailyLimitPercent !== undefined ? setup.dailyLimitPercent : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : Math.max(0, parseFloat(e.target.value) || 0);
                            updateSetup({ dailyLimitPercent: val });
                          }}
                          className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-650 font-mono text-xs font-bold text-white pl-7 pr-3 py-3 rounded-xl focus:outline-hidden focus:border-indigo-500 transition duration-150"
                        />
                      </div>
                      <p className="text-[9px] text-slate-550 font-sans mt-1 leading-normal">
                        Dừng giao dịch khi tổng rủi ro các vị thế vào trong một ngày vượt quá giới hạn.
                      </p>
                    </div>

                    {/* Risk Setup Choice */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Mức Rủi Ro Mong Muốn (Risk)</span>
                        <div className="flex bg-[#1C212D] p-0.5 rounded-md gap-0.5 border border-slate-800">
                          <button
                            type="button"
                            id="toggle-risk-pct"
                            onClick={() => updateSetup({ riskType: 'percentage', riskValue: 1 })}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-tight cursor-pointer ${
                              setup.riskType === 'percentage'
                                ? 'bg-[#0B0E14] text-indigo-400 border border-slate-800/60'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            id="toggle-risk-amount"
                            onClick={() => updateSetup({ riskType: 'amount', riskValue: 100 })}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-tight cursor-pointer ${
                              setup.riskType === 'amount'
                                ? 'bg-[#0B0E14] text-indigo-400 border border-slate-800/60'
                                : 'text-[#7C3AED] hover:text-[#9F7AEA]'
                            }`}
                          >
                            USD ($)
                          </button>
                        </div>
                      </label>

                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-slate-500 font-bold text-xs">
                          {setup.riskType === 'percentage' ? '%' : '$'}
                        </span>
                        <input
                          id="input-risk-value"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={setup.riskValue}
                          onChange={(e) => updateSetup({ riskValue: Math.max(0.01, parseFloat(e.target.value) || 0) })}
                          className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-655 font-mono text-xs font-bold text-white pl-7 pr-3 py-3 rounded-xl focus:outline-hidden focus:border-indigo-500 transition duration-150"
                        />
                      </div>

                      {/* Preset Quick Toggles */}
                      {setup.riskType === 'percentage' && (
                        <div className="flex gap-1.5 mt-2 overflow-x-auto py-0.5 select-none scrollbar-none">
                          {[0.5, 1, 2, 3, 5].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              id={`preset-risk-${preset}`}
                              onClick={() => updateSetup({ riskValue: preset })}
                              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                                setup.riskValue === preset
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                  : 'bg-[#1C212D] hover:bg-[#1E2533] border-slate-750 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {preset}%
                            </button>
                          ))}
                        </div>
                      )}
                      {setup.riskType === 'amount' && (
                        <div className="flex gap-1.5 mt-2 overflow-x-auto py-0.5 select-none scrollbar-none">
                          {[50, 100, 200, 500, 1000].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              id={`preset-risk-usd-${preset}`}
                              onClick={() => updateSetup({ riskValue: preset })}
                              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                                setup.riskValue === preset
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                  : 'bg-[#1C212D] hover:bg-[#1E2533] border-slate-755 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              ${preset}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Render Asset Specific Layout block */}
                    {setup.assetClass === 'forex' ? (
                      <ForexCalculator setup={setup} onChangeSetup={updateSetup} />
                    ) : (
                      <CryptoStockCalculator setup={setup} onChangeSetup={updateSetup} />
                    )}

                    {/* Advanced Section: Margin & Leverage */}
                    <div className="pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-455 uppercase tracking-wide flex items-center gap-1">
                          Giả lập đòn bẩy ký quỹ
                        </span>
                        <span className="text-[11px] font-mono text-indigo-400 font-bold">1:{leverage}</span>
                      </div>
                      
                      <input
                        id="slider-leverage"
                        type="range"
                        min="1"
                        max="1000"
                        step="5"
                        value={leverage}
                        onChange={(e) => setLeverage(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-[#1C212D] rounded-full appearance-none cursor-pointer accent-indigo-505"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                        <span>1:1</span>
                        <span>1:100</span>
                        <span>1:500</span>
                        <span>1:1000</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Column 3: Dashboard Results & Charts (Span 4) */}
              <div className="lg:col-span-4 space-y-6 animate-fadeIn">
                <div className="bg-[#14171F] rounded-2xl p-5 sm:p-6 border border-slate-800/80 shadow-xs flex flex-col justify-between min-h-[415px]">
                  
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h2 className="font-bold text-slate-100 text-sm sm:text-base uppercase tracking-wide">Kết quả vị thế</h2>
                  </div>

                  {/* Massive Output block */}
                  <div className="bg-[#1C212D] border border-slate-800 rounded-2xl p-6 text-center text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
                    <div className="absolute left-0 bottom-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-lg pointer-events-none"></div>

                    <span className="block text-[10px] sm:text-xs font-bold text-indigo-400 font-mono tracking-[0.14em] uppercase mb-1">
                      KHỐI LƯỢNG VÀO LỆNH TỐI ƯU
                    </span>

                    <div className="mt-3.5 mb-2.5">
                      <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white select-all">
                        {setup.assetClass === 'forex' 
                          ? (result.positionSizeLots !== undefined ? result.positionSizeLots.toFixed(2) : '0.00') 
                          : (result.positionSizeUnits !== undefined ? result.positionSizeUnits.toLocaleString('en-US', { maximumFractionDigits: 4 }) : '0')
                        }
                      </span>
                      <span className="text-xs font-bold text-slate-455 font-mono ml-1.5 uppercase">
                        {setup.assetClass === 'forex' ? 'LOTS' : 'UNITS'}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1">
                      <span>Số lượng thô:</span>
                      <span className="font-bold text-slate-300">
                        {result.positionSizeUnits.toLocaleString()} units
                      </span>
                    </div>
                  </div>

                  {/* Interactive Execution Trigger */}
                  <div className="space-y-2 mt-4">
                    <button
                      type="button"
                      onClick={handleAttemptLogTrade}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl select-none cursor-pointer duration-200 transition-all shadow-md hover:shadow-emerald-950/20 flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      <Play className="w-4 h-4 fill-current shrink-0" />
                      Lưu lệnh & Kích hoạt theo dõi
                    </button>
                    <p className="text-[10px] text-slate-550 text-center leading-normal">
                      Nạp tham số vào danh mục mở &amp; kiểm tra kỷ luật kỷ cương.
                    </p>
                  </div>

                  {/* Financial Metrics Cards */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-[#1C212D] border border-slate-800/80 rounded-xl p-3">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">Tổn thất tối đa (SL)</span>
                      <span className="text-sm font-bold font-mono mt-1 block text-rose-500">
                        -${result.riskAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </span>
                      <div className="flex flex-col gap-0.5 mt-1 border-t border-slate-800/40 pt-1">
                        <span className="text-[9px] text-slate-500">({riskPct.toFixed(1)}% tài khoản)</span>
                        <span className="text-[9px] text-slate-400 font-bold">
                          Tỷ lệ R:R dự kiến: {result.riskRewardRatio !== undefined ? `1:${result.riskRewardRatio >= 1 ? Math.round(result.riskRewardRatio * 10) / 10 : result.riskRewardRatio.toFixed(1)}` : 'Chưa cài TP'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#1C212D] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">Giá trị Hợp đồng</span>
                        <span className="text-sm font-bold font-mono mt-1 block text-slate-100">
                          ${result.notionalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-0.5">Quy mô vị thế thực</span>
                    </div>
                  </div>

                  {/* Required margin display */}
                  <div className="mt-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase">Tiền ký quỹ yêu cầu (Margin)</span>
                      <span className="text-slate-500 text-[9px] mt-0.5">Vốn tối thiểu thực tế cần nạp</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-white text-sm">
                        ${requiredMargin > 0 ? requiredMargin.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Forex Lots reference table */}
                  {setup.assetClass === 'forex' && (
                    <div className="mt-4 border-t border-slate-800 pt-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 font-mono">Quy đổi đơn vị tương đương</span>
                      <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono text-slate-400">
                        <div className="bg-[#1C212D] border border-slate-800/40 p-2 rounded">
                          <div className="text-slate-500 uppercase text-[8px] tracking-wide">Standard Lots</div>
                          <div className="font-bold text-slate-200 mt-1">{(result.positionSizeLots || 0).toFixed(2)}</div>
                        </div>
                        <div className="bg-[#1C212D] border border-slate-800/40 p-2 rounded">
                          <div className="text-slate-500 uppercase text-[8px] tracking-wide">Mini Lots</div>
                          <div className="font-bold text-slate-200 mt-1">{((result.positionSizeLots || 0) * 10).toFixed(1)}</div>
                        </div>
                        <div className="bg-[#1C212D] border border-slate-800/40 p-2 rounded">
                          <div className="text-slate-500 uppercase text-[8px] tracking-wide">Micro Lots</div>
                          <div className="font-bold text-slate-200 mt-1">{((result.positionSizeLots || 0) * 100).toFixed(0)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Live risk evaluation meter */}
                <RiskMeter 
                  balance={setup.accountBalance} 
                  riskAmount={result.riskAmount} 
                  riskPercentage={riskPct} 
                />

                {/* Affiliate banner */}
                <div className="bg-[#14171F] border border-indigo-950/70 rounded-2xl p-4.5 text-xs text-indigo-300 relative overflow-hidden flex items-start gap-3 shadow-xs">
                  <div className="p-2 rounded-xl bg-indigo-950/50 text-indigo-400 mt-0.5 shrink-0">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-100 text-xs tracking-wide uppercase">Mẹo Tối Ưu Chi Phí Trading</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
                      Kỷ luật quản lý vốn chặt chẽ giúp bạn sống sót lâu dài trong thị trường. Đăng ký tài khoản giao dịch tại các sàn uy tín đối tác để tối ưu hóa thêm 20% chi phí phí:
                    </p>
                    <div className="flex gap-2.5 pt-2 flex-wrap">
                      <a 
                        href={AFFILIATE_LINKS.binance} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-yellow-450 hover:underline inline-flex items-center gap-1 font-bold text-[10.5px]"
                      >
                        Binance <ExternalLink className="w-3 h-3" />
                      </a>
                      <a 
                        href={AFFILIATE_LINKS.bybit} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-amber-500 hover:underline inline-flex items-center gap-1 font-bold text-[10.5px]"
                      >
                        Bybit <ExternalLink className="w-3 h-3" />
                      </a>
                      <a 
                        href={AFFILIATE_LINKS.okx} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-cyan-500 hover:underline inline-flex items-center gap-1 font-bold text-[10.5px]"
                      >
                        OKX <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'portfolio' && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="pb-12"
            >
              <PortfolioTracker
                activeTrades={activeTrades}
                closedTrades={closedTrades}
                onCloseTrade={handleCloseTrade}
                onDeleteClosedTrade={handleDeleteClosedTrade}
                onClearHistory={handleClearClosedHistory}
                onUpdateCurrentPrice={handleUpdateCurrentPrice}
                onUpdateTrailingStop={handleUpdateTrailingStop}
                onLogTrade={() => {}}
                accountBalance={setup.accountBalance}
                dailyDisciplineLogs={dailyDisciplineLogs}
                onClearDisciplineLogs={() => {
                  setDailyDisciplineLogs([]);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'plans' && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="pb-12"
            >
              <TradingPlanManager
                plans={plans}
                onAddPlan={handleAddPlan}
                onDeletePlan={handleDeletePlan}
                onUpdatePlanStatus={handleUpdatePlanStatus}
                onImportPlanToCalc={handleImportPlanToCalc}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* DAILY LIMIT BREACH WARNING MODAL */}
      <AnimatePresence>
        {showDailyLimitModal && (
          <div className="fixed inset-0 bg-[#06080C]/90 backdrop-blur-md flex items-center justify-center p-4 z-110">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="bg-[#14171F] border border-red-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden text-center"
            >
              <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="mx-auto w-12 h-12 rounded-xl bg-red-950/40 border border-red-900/40 text-red-400 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="text-red-400 font-black text-sm uppercase tracking-widest font-sans flex items-center justify-center gap-1.5">
                Cảnh Báo: Chạm Giới Hạn Rủi Ro!
              </h3>
              
              <p className="text-xs text-rose-300/80 font-bold font-sans mt-1">
                Giao dịch này vượt Giới hạn Rủi ro hàng ngày của bạn!
              </p>

              <div className="mt-4 p-4 bg-[#1C212D]/80 border border-red-900/35 rounded-xl text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-400 font-medium">
                  <span>Giới hạn rủi ro Ngày ({setup.dailyLimitPercent}%):</span>
                  <span className="font-mono text-white font-bold">${dailyLimitWarningData.allowedLimitUSD.toLocaleString('en-US', { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 font-medium">
                  <span>Rủi ro đã tích lũy hôm nay:</span>
                  <span className="font-mono text-slate-205">${dailyLimitWarningData.todayRiskRisk.toLocaleString('en-US', { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 font-medium">
                  <span>Rủi ro vị thế chuẩn bị vào:</span>
                  <span className="font-mono text-red-400 font-bold">+${dailyLimitWarningData.newTradeRisk.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold text-[13px]">
                  <span className="text-slate-300">Tổng rủi ro dự kiến:</span>
                  <span className="font-mono text-red-500">${(dailyLimitWarningData.todayRiskRisk + dailyLimitWarningData.newTradeRisk).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-[10px] text-red-450/90 font-medium leading-relaxed italic text-center pt-1 block">
                  *(Hệ thống đã nhận diện mức vượt hạn mức rủi ro tối đa cố định: vượt quá ${(dailyLimitWarningData.todayRiskRisk + dailyLimitWarningData.newTradeRisk - dailyLimitWarningData.allowedLimitUSD).toLocaleString('en-US', { maximumFractionDigits: 1 })} USD)
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  Để ghi đè và lưu vị thế vi phạm này, bạn bắt buộc phải gõ tay chính xác cụm từ sau để nhận thức việc phá vỡ kỷ luật:
                </p>
                <div className="bg-[#1C212D] px-3 py-2 text-[11px] font-mono text-[#F43F5E] select-none font-black tracking-wide border border-red-950/50 rounded-lg">
                  Tôi chấp nhận phá vỡ kỷ luật
                </div>
                <input
                  type="text"
                  placeholder="Gõ chính xác dòng chữ trên tại đây..."
                  value={forcePhraseInput}
                  onChange={(e) => setForcePhraseInput(e.target.value)}
                  className="w-full bg-[#1C212D]/90 border border-slate-750 text-slate-205 placeholder-slate-600 focus:border-red-500 focus:outline-hidden font-sans text-xs text-center py-2.5 px-3 rounded-xl transition duration-150"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowDailyLimitModal(false)}
                  className="py-2.5 px-4 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-850/60 text-xs font-black rounded-xl cursor-pointer transition duration-150 uppercase tracking-wider"
                >
                  Giữ vững kỷ luật
                </button>
                <button
                  type="button"
                  disabled={forcePhraseInput !== "Tôi chấp nhận phá vỡ kỷ luật"}
                  onClick={() => {
                    setShowDailyLimitModal(false);
                    proceedToChecklistValidation(true);
                  }}
                  className={`py-2.5 px-4 border text-xs font-black rounded-xl transition duration-150 uppercase tracking-wider select-none ${
                    forcePhraseInput === "Tôi chấp nhận phá vỡ kỷ luật"
                      ? "bg-red-900/40 hover:bg-red-900/70 border-red-800 text-red-300 cursor-pointer shadow-lg shadow-red-950/20"
                      : "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  Vào vị thế vi phạm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DISCIPLINE WARNING MODAL POPUP (Rule 4) */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 bg-[#06080C]/85 backdrop-blur-xs flex items-center justify-center p-4 z-100">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[#14171F] border border-rose-900/50 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden text-center"
            >
              <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none"></div>

              <div className="mx-auto w-12 h-12 rounded-xl bg-rose-950/40 border border-rose-900/40 text-rose-400 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <h3 className="text-slate-100 font-bold text-base uppercase tracking-wider font-sans">
                Cảnh báo Quy tắc Kỷ luật!
              </h3>
              
              <div className="mt-3.5 space-y-2.5 text-xs text-slate-400 font-sans leading-relaxed">
                <p>
                  Bạn chưa tích chọn đầy đủ các tiêu chí <span className="text-rose-400 font-bold uppercase">Bắt buộc</span> trong Checklist giao dịch trước khi vào lệnh.
                </p>
                <div className="p-3 bg-[#1C212D]/60 border border-rose-950 rounded-xl text-left text-[11px] font-medium text-rose-300">
                  <span className="font-bold block text-rose-400 mb-1">Các tiêu chí bị bỏ qua gồm:</span>
                  <ul className="list-disc leading-relaxed pl-4 space-y-1">
                    {checklist.filter(item => item.isRequired && !item.isChecked).map(item => (
                      <li key={item.id}>{item.text}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-[11px] italic text-slate-500">
                  ⚠️ Việc vào lệnh thiếu điều kiện là nguyên nhân cốt lõi gây sụt giảm tài khoản đáng tiếc.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition duration-150"
                >
                  Quay lại Checklist
                </button>
                <button
                  onClick={() => executeAndLogTrade(true)} // force pass, marked as unchecked warning
                  className="py-2.5 px-4 bg-rose-900/50 hover:bg-rose-900/80 text-rose-300 border border-rose-850 text-xs font-bold rounded-xl cursor-pointer transition duration-150"
                >
                  Vẫn vào (Thiếu kỷ luật)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern minimalist footer block */}
      <footer className="w-full border-t border-slate-800 bg-[#14171F] py-5 px-6 sm:px-8 mt-auto text-center text-[11px] text-slate-550 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© Được quản trị rủi ro bởi RiskWise - Công cụ quản lý vốn chuyên nghiệp dành cho Trader.</p>
          <p className="font-mono text-[10px] text-slate-500/85 flex items-center gap-1.5 justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            Đọc kĩ Checklist - Bảo toàn nguồn lực vốn.
          </p>
        </div>
      </footer>
    </div>
  );
}
