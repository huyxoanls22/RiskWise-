import React, { useState, useEffect } from 'react';
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
import { supabase } from './supabaseClient';
import SupabaseAuth from './components/SupabaseAuth';
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
  LogOut,
  Database,
  Code,
  Terminal,
  Copy,
  Check
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

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

export default function App() {
  const [setup, setSetup] = useState<TradeSetup>(() => {
    try {
      const persisted = localStorage.getItem('current_tradesetup');
      if (persisted) {
        return JSON.parse(persisted);
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
        return JSON.parse(persisted);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'calculator' | 'portfolio' | 'plans'>(() => {
    return (localStorage.getItem('active_tab') as any) || 'calculator';
  });

  // Checklist Item State
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    try {
      const persisted = localStorage.getItem('trading_checklist_items');
      if (persisted) {
        return JSON.parse(persisted);
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

  // Supabase Auth and State Management
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSqlSetup, setShowSqlSetup] = useState(false);

  // Portfolio active positions
  const [activeTrades, setActiveTrades] = useState<PortfolioTrade[]>([]);

  // Closed history trades log
  const [closedTrades, setClosedTrades] = useState<PortfolioTrade[]>([]);

  // Trading plans state
  const [plans, setPlans] = useState<TradingPlan[]>(() => {
    try {
      const persisted = localStorage.getItem('trading_plans');
      if (persisted) return JSON.parse(persisted);
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
      if (persisted) return JSON.parse(persisted);
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

  // Supabase Auth State Engine Sync
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Trades from Supabase when session changes
  const fetchTradesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('entered_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        const mapped: PortfolioTrade[] = data.map((t: any) => ({
          id: t.id,
          ticker: t.ticker,
          assetClass: t.asset_class as AssetClass,
          direction: t.direction as 'long' | 'short',
          entryPrice: Number(t.entry_price),
          currentPrice: Number(t.current_price),
          units: Number(t.units),
          lots: t.lots ? Number(t.lots) : undefined,
          riskAmount: Number(t.risk_amount),
          stopLoss: t.stop_loss,
          takeProfit: t.take_profit,
          pnl: Number(t.pnl),
          trailingStopPrice: t.trailing_stop_price ? Number(t.trailing_stop_price) : undefined,
          status: t.status as 'active' | 'won' | 'lost',
          enteredAt: t.entered_at,
          uncheckedWarning: !!t.unchecked_warning,
          sector: t.sector,
          notes: t.notes || ''
        }));

        const active = mapped.filter((t) => t.status === 'active');
        const closed = mapped.filter((t) => t.status !== 'active');
        
        setActiveTrades(active);
        setClosedTrades(closed);
      }
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu từ Supabase:', e);
    }
  };

  useEffect(() => {
    if (session) {
      fetchTradesFromSupabase();
    } else {
      setActiveTrades([]);
      setClosedTrades([]);
    }
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Synchronizers
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

        const closedRiskForDay = closedTrades
          .filter(t => t.enteredAt.startsWith(logDate) || t.enteredAt.split('T')[0] === logDate)
          .reduce((sum, t) => sum - t.pnl, 0);

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
      id: Math.random().toString(36).substring(2, 9),
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
      id: Math.random().toString(36).substring(2, 9),
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

  const handleAttemptLogTrade = () => {
    const todayDateStr = getLocalTodayDateStr();

    // Sum up risk for all entries logged today in active and closed trades
    const activeTodayRisk = activeTrades
      .filter(t => t.enteredAt.startsWith(todayDateStr) || t.enteredAt.split('T')[0] === todayDateStr)
      .reduce((sum, t) => sum + t.riskAmount, 0);

    // Sum up actual risk used for closed trades as negative PnL (realized loss/gain)
    const closedTodayRisk = closedTrades
      .filter(t => t.enteredAt.startsWith(todayDateStr) || t.enteredAt.split('T')[0] === todayDateStr)
      .reduce((sum, t) => sum - t.pnl, 0);

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
      
      // deduce direction
      direction = entryPr > (setup.stopLossPrice || 0) ? 'long' : 'short';
    }

    const tDate = new Date();
    const isoString = tDate.toISOString();
    const todayDateStr = getLocalTodayDateStr();

    const userSessionId = session?.user?.id;
    const randId = Math.random().toString(36).substring(2, 9);

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

    // Save directly to Supabase Database
    if (session) {
      supabase.from('trades').insert([{
        id: randId,
        user_id: userSessionId,
        ticker,
        asset_class: setup.assetClass,
        direction,
        entry_price: entryPr,
        current_price: entryPr,
        units,
        lots: setup.assetClass === 'forex' ? result.positionSizeLots : null,
        risk_amount: result.riskAmount,
        stop_loss: stopLossStr,
        take_profit: newTrade.takeProfit,
        pnl: 0,
        status: 'active',
        entered_at: isoString,
        unchecked_warning: bypassForce,
        sector: trSector
      }]).then(({ error }) => {
        if (error) {
          console.error('Lỗi khi lưu vị thế lên Supabase:', error);
        }
      });
    }

    // Keep Daily Disciplinary Log in sync
    setDailyDisciplineLogs(prev => {
      const existingIdx = prev.findIndex(l => l.date === todayDateStr);
      
      const activeRiskTodayNow = activeTrades
        .filter(t => t.enteredAt.startsWith(todayDateStr) || t.enteredAt.split('T')[0] === todayDateStr)
        .reduce((sum, t) => sum + t.riskAmount, 0);

      const closedRiskTodayNow = closedTrades
        .filter(t => t.enteredAt.startsWith(todayDateStr) || t.enteredAt.split('T')[0] === todayDateStr)
        .reduce((sum, t) => sum - t.pnl, 0);

      const todayRiskNow = activeRiskTodayNow + closedRiskTodayNow + result.riskAmount;

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

  const handleCloseTrade = async (id: string, outcome: 'won' | 'lost', finalPrice?: number) => {
    const trade = activeTrades.find(t => t.id === id);
    if (!trade) return;

    let correctedPnl = trade.pnl;
    if (outcome === 'won') {
      correctedPnl = Math.abs(trade.pnl || trade.riskAmount);
    } else {
      correctedPnl = -Math.abs(trade.pnl || trade.riskAmount);
    }

    const finalPnl = Math.round(correctedPnl * 100) / 100;

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

    // Update in Supabase
    if (session) {
      const { error } = await supabase
        .from('trades')
        .update({
          status: outcome,
          pnl: finalPnl
        })
        .eq('id', id);
      
      if (error) {
        console.error('Lỗi khi cập nhật vị thế đóng lên Supabase:', error);
      }
    }
  };

  const handleDeleteClosedTrade = async (id: string) => {
    // Optimistic local update
    setClosedTrades(prev => prev.filter(t => t.id !== id));

    if (session) {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Lỗi khi xoá vị thế khỏi Supabase:', error);
      }
    }
  };

  const handleClearClosedHistory = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử vị thế đã đóng?")) {
      setClosedTrades([]);

      if (session) {
        const { error } = await supabase
          .from('trades')
          .delete()
          .not('status', 'eq', 'active');
        
        if (error) {
          console.error('Lỗi khi xoá lịch sử vị thế đã đóng trên Supabase:', error);
        }
      }
    }
  };

  const handleUpdateCurrentPrice = async (id: string, newPrice: number) => {
    let finalPnl = 0;
    
    setActiveTrades(prev => prev.map(trade => {
      if (trade.id !== id) return trade;
      
      let calculatedPnl = 0;
      const isLong = trade.direction === 'long';
      
      if (trade.assetClass === 'forex') {
        const pairConfig = FOREX_PAIRS.find(p => p.symbol === trade.ticker);
        const pipSize = pairConfig?.pipSize || 0.0001;
        const pipValLot = trade.lots !== undefined ? (FOREX_PAIRS.find(p => p.symbol === trade.ticker)?.defaultPipValueUSD || 10) : 10;
        
        const pipsDiff = (newPrice - trade.entryPrice) / pipSize;
        const multiplier = isLong ? 1 : -1;
        
        calculatedPnl = pipsDiff * (trade.lots || 0) * pipValLot * multiplier;
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

    // Save directly inside Supabase
    if (session) {
      const { error } = await supabase
        .from('trades')
        .update({
          current_price: newPrice,
          pnl: finalPnl
        })
        .eq('id', id);

      if (error) {
        console.error('Lỗi khi cập nhật giá hiện tại lên Supabase:', error);
      }
    }
  };

  const handleUpdateTrailingStop = async (id: string, trailingPrice: number | undefined) => {
    setActiveTrades(prev => prev.map(trade => {
      if (trade.id !== id) return trade;
      return {
        ...trade,
        trailingStopPrice: trailingPrice
      };
    }));

    if (session) {
      const { error } = await supabase
        .from('trades')
        .update({
          trailing_stop_price: trailingPrice || null
        })
        .eq('id', id);

      if (error) {
        console.error('Lỗi khi cập nhật Trailing Stop lên Supabase:', error);
      }
    }
  };


  // Plans Actions
  const handleAddPlan = (newPlan: Omit<TradingPlan, 'id' | 'createdAt'>) => {
    const toSave: TradingPlan = {
      ...newPlan,
      id: Math.random().toString(36).substring(2, 9),
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

  const [copiedSql, setCopiedSql] = useState(false);
  const sqlScript = `-- Tạo bảng trades lưu trữ danh mục lệnh
CREATE TABLE trades (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  ticker TEXT NOT NULL,
  asset_class TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  units NUMERIC NOT NULL,
  lots NUMERIC,
  risk_amount NUMERIC NOT NULL,
  stop_loss TEXT NOT NULL,
  take_profit TEXT,
  pnl NUMERIC DEFAULT 0 NOT NULL,
  trailing_stop_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost')),
  entered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  unchecked_warning BOOLEAN DEFAULT false,
  notes TEXT,
  sector TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Kích hoạt mã bảo mật Row Level Security (RLS)
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Tạo Policy cho phép người dùng xem dữ liệu của chính mình
CREATE POLICY "Users can view their own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

-- Tạo Policy cho phép người dùng tự insert dữ liệu của mình
CREATE POLICY "Users can insert their own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tạo Policy cho phép người dùng update dữ liệu của mình
CREATE POLICY "Users can update their own trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

-- Tạo Policy cho phép người dùng xoá dữ liệu của mình
CREATE POLICY "Users can delete their own trades" ON trades
  FOR DELETE USING (auth.uid() = user_id);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Derive core values
  const result = calculatePositionSize(setup);

  const riskPct = setup.riskType === 'percentage' 
    ? setup.riskValue 
    : (setup.accountBalance > 0 ? (setup.riskValue / setup.accountBalance) * 100 : 0);

  const requiredMargin = result.notionalValue / leverage;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center text-slate-400">
        <RotateCcw className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
        <p className="text-xs font-semibold uppercase tracking-widest">Đang tải cấu hình SaaS...</p>
      </div>
    );
  }

  if (!session) {
    return <SupabaseAuth onAuthSuccess={() => {}} />;
  }

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
                Nền tảng quản lý rủi ro &amp; Giao dịch chuẩn mực
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Supabase SQL Setup Instructions */}
            <button
              onClick={() => setShowSqlSetup(true)}
              className="p-1.5 px-3 bg-indigo-950/35 hover:bg-indigo-900/45 border border-indigo-900/40 text-indigo-300 hover:text-indigo-200 rounded-xl transition duration-150 flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
              title="Xem SQL tạo bảng Supabase"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">SQL Database</span>
            </button>

            <button
              id="btn-reset-form"
              onClick={handleReset}
              className="p-1.5 px-3 hover:bg-[#1C212D] border border-slate-800 hover:border-slate-700 rounded-xl text-slate-450 hover:text-slate-200 transition duration-150 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đặt lại mặc định</span>
            </button>

            <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>

            {/* Logged in info & sign out */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono hidden lg:inline-block max-w-[125px] truncate">
                {session?.user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="p-1.5 px-3 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-300 hover:text-rose-200 rounded-xl transition duration-150 flex items-center gap-1.5 text-xs font-black cursor-pointer uppercase tracking-wider"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
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
            Tính Toán & Vào Lệnh
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
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12"
            >
              {/* Column 1: Core Inputs (Span 5) */}
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
                        <span className="text-[10px] text-indigo-450 font-bold flex items-center font-mono">
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
                                : 'text-slate-500 hover:text-slate-300'
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
                        <span className="text-xs font-semibold text-slate-450 uppercase tracking-wide flex items-center gap-1">
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

              {/* Column 2: Dashboard Results & Charts (Span 4) */}
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
                    <p className="text-[10px] text-slate-500 text-center leading-normal">
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
              </div>

              {/* Column 3: Pre-Trade Checklist & Saved List (Span 3) */}
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

      {/* SUPABASE SQL SETUP MODAL */}
      <AnimatePresence>
        {showSqlSetup && (
          <div className="fixed inset-0 bg-[#06080C]/90 backdrop-blur-xs flex items-center justify-center p-4 z-100">
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="bg-[#0E121A]/95 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#14171F]/40 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                      Thiết lập Supabase Database (trades)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Khởi tạo cấu trúc dữ liệu kết nối đồng bộ an toàn
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSqlSetup(false)}
                  className="p-1 px-2.5 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg text-xs font-bold transition duration-150 cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              {/* Instructions and Code Block */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-350 leading-relaxed font-sans">
                {/* Steps banner */}
                <div className="bg-indigo-950/15 border border-indigo-900/30 p-3.5 rounded-xl space-y-1">
                  <span className="font-bold text-indigo-300 block mb-1">💡 Các bước thiết lập trên Supabase:</span>
                  <ol className="list-decimal pl-4.5 space-y-1 text-slate-400">
                    <li>Truy cập trang dự án Supabase của bạn tại <a href="https://supabase.com" target="_blank" className="text-indigo-400 hover:underline">supabase.com</a></li>
                    <li>Tìm đến mục <strong className="text-slate-200">SQL Editor</strong> ở thanh công cụ bên trái</li>
                    <li>Nhấp vào <strong className="text-slate-200">New Query</strong>, dán toàn bộ đoạn mã SQL dưới đây và chọn <strong className="text-slate-200">Run</strong></li>
                  </ol>
                </div>

                {/* SQL Code Preview with Copy Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-[#151924] px-4 py-2 border-t border-x border-slate-800 rounded-t-xl select-none">
                    <span className="font-mono text-[10px] text-slate-450 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      supabase_schema.sql
                    </span>
                    <button
                      onClick={handleCopySql}
                      className="px-2.5 py-1.5 bg-indigo-905 bg-indigo-700/20 text-indigo-300 hover:bg-indigo-700/30 hover:text-indigo-100 rounded-lg text-[10px] font-black transition duration-150 flex items-center gap-1 cursor-pointer select-none border border-indigo-805/40"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Đã sao chép!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Sao chép SQL
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-[#080B11] border border-slate-800 rounded-b-xl max-h-[300px] overflow-auto text-[10px] font-mono text-slate-400 leading-normal scrollbar-thin select-all">
                    {sqlScript}
                  </pre>
                </div>

                {/* Secure warning info */}
                <p className="text-[10px] text-slate-500 leading-relaxed italic block pt-1 bg-[#14171F]/10">
                  *Bảng được cấu hình Row Level Security (RLS) bảo mật tuyệt đối, đảm bảo dữ liệu giao dịch của mỗi Nhà đầu tư luôn được cô lập riêng tư dựa trên thông tin phiên Auth User ID của chính họ.
                </p>
              </div>

              {/* Footer */}
              <div className="p-4.5 bg-[#14171F]/40 border-t border-slate-800 flex justify-end shrink-0 select-none">
                <button
                  onClick={() => setShowSqlSetup(false)}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-650 to-indigo-550 hover:from-indigo-600 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl transition duration-150 shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Tôi đã lưu cấu hình
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern minimalist footer block */}
      <footer className="w-full border-t border-slate-800 bg-[#14171F] py-5 px-6 sm:px-8 mt-auto text-center text-[11px] text-slate-550 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© RiskWise Platform • Phiên bản quản lý rủi ro giao dịch đột phá dành cho nhà giao dịch kỷ luật.</p>
          <p className="font-mono text-[10px] text-slate-500/85 flex items-center gap-1.5 justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            Đọc kĩ Checklist - Bảo toàn nguồn lực vốn.
          </p>
        </div>
      </footer>
    </div>
  );
}
