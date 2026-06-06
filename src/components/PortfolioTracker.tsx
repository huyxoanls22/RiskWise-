import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PortfolioTrade, ChecklistItem, DailyLimitLog } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  DollarSign, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Smile, 
  Frown,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  BookOpen,
  Scale,
  Calendar,
  Layers,
  Percent,
  CheckCircle,
  AlertCircle,
  Lock,
  BarChart3,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { FOREX_PAIRS } from '../utils/calculator';

interface PortfolioTrackerProps {
  activeTrades: PortfolioTrade[];
  closedTrades: PortfolioTrade[];
  onCloseTrade: (id: string, outcome: 'won' | 'lost', finalPrice?: number) => void;
  onDeleteClosedTrade: (id: string) => void;
  onClearHistory: () => void;
  onUpdateCurrentPrice: (id: string, price: number) => void;
  onUpdateTrailingStop: (id: string, price: number | undefined) => void;
  onLogTrade: (trade: Omit<PortfolioTrade, 'id' | 'pnl' | 'status' | 'enteredAt'>) => void;
  accountBalance: number;
  dailyLimitPercent?: number;
  dailyDisciplineLogs: DailyLimitLog[];
  onClearDisciplineLogs?: () => void;
  isPremium?: boolean;
  totalTradesActivated?: number;
  isOfflineTimeHack?: boolean;
  currentTime?: Date;
  onTriggerPaywall?: () => void;
}

export default function PortfolioTracker({
  activeTrades,
  closedTrades,
  onCloseTrade,
  onDeleteClosedTrade,
  onClearHistory,
  onUpdateCurrentPrice,
  onUpdateTrailingStop,
  onLogTrade,
  accountBalance,
  dailyLimitPercent,
  dailyDisciplineLogs,
  onClearDisciplineLogs,
  isPremium = false,
  totalTradesActivated = 0,
  isOfflineTimeHack = false,
  currentTime,
  onTriggerPaywall
}: PortfolioTrackerProps) {
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  const [editingTrailingId, setEditingTrailingId] = useState<string | null>(null);
  const [tempTrailing, setTempTrailing] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showResetLogsModal, setShowResetLogsModal] = useState(false);
  const [resetPhraseInput, setResetPhraseInput] = useState('');
  const [equityRange, setEquityRange] = useState<'30days' | 'all'>('30days');

  const isLocked = isOfflineTimeHack;
  const isProLocked = isOfflineTimeHack;

  // Dynamically recalculate dailyLimitLogs based on current accountBalance and dailyLimitPercent
  const mappedDisciplineLogs = useMemo(() => {
    const dLimitPercent = dailyLimitPercent || 0;
    const dynamicAllowedLimit = dLimitPercent > 0 ? (accountBalance * (dLimitPercent / 100)) : 0;
    
    return dailyDisciplineLogs.map(log => {
      const allowed = dynamicAllowedLimit > 0 ? dynamicAllowedLimit : log.allowedLimit;
      const isExceeded = allowed > 0 ? (log.totalRisk > allowed) : log.isExceeded;
      return {
        ...log,
        allowedLimit: allowed,
        isExceeded
      };
    });
  }, [dailyDisciplineLogs, accountBalance, dailyLimitPercent]);

  // Sector Risk calculation
  const totalActiveRisk = activeTrades.reduce((sum, t) => sum + t.riskAmount, 0);

  // Group active trades by sector
  const sectorGroups: { [sector: string]: { trades: PortfolioTrade[], totalRisk: number } } = {};
  
  activeTrades.forEach(t => {
    const sectorName = t.sector || 'Chưa phân loại';
    if (!sectorGroups[sectorName]) {
      sectorGroups[sectorName] = { trades: [], totalRisk: 0 };
    }
    sectorGroups[sectorName].trades.push(t);
    sectorGroups[sectorName].totalRisk += t.riskAmount;
  });

  // Equity Curve data preparation
  const getEquityData = (range: '30days' | 'all') => {
    const isLockedAndLimitActive = !isPremium || isOfflineTimeHack;
    const refDate = currentTime || new Date();
    const limitMs = refDate.getTime() - 30 * 24 * 60 * 60 * 1000;
    
    const filterTo30Days = range === '30days';
    
    const targetClosedTrades = filterTo30Days
      ? closedTrades.filter(t => {
          try {
            return new Date(t.enteredAt).getTime() >= limitMs;
          } catch {
            return false;
          }
        })
      : closedTrades;

    const formatTime = (isoString: string) => {
      try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return 'Ban đầu';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month} ${hours}:${minutes}`;
      } catch {
        return 'Ban đầu';
      }
    };

    if (targetClosedTrades.length === 0) {
      return [
        { name: 'Khởi đầu', time: 'Ban đầu', Balance: accountBalance, PnL: 0 },
        { name: 'Hiện tại', time: 'Hiện tại', Balance: accountBalance, PnL: 0 }
      ];
    }

    // Sort closed trades older first (chronologically by enteredAt date)
    const sortedClosed = [...targetClosedTrades].sort((a, b) => {
      return new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime();
    });

    // Starting balance = accountBalance configured by the user
    let currentBalAccumulator = accountBalance || 10000;

    const dataPoints = [
      {
        name: 'Vốn Ban Đầu',
        time: 'Gốc',
        Balance: parseFloat(currentBalAccumulator.toFixed(2)),
        PnL: 0
      }
    ];

    sortedClosed.forEach((trade, index) => {
      const pnlValue = trade.status === 'won' ? Math.abs(trade.pnl) : -Math.abs(trade.pnl);
      currentBalAccumulator += pnlValue;

      const formattedLabel = formatTime(trade.enteredAt);

      dataPoints.push({
        name: `${trade.ticker} (#${index + 1})`,
        time: formattedLabel,
        Balance: parseFloat(currentBalAccumulator.toFixed(2)),
        PnL: parseFloat(pnlValue.toFixed(2))
      });
    });

    return dataPoints;
  };

  const equityData = getEquityData(equityRange);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const isPnLNotZero = point.PnL !== undefined && point.PnL !== 0;
      return (
        <div className="bg-[#1C212D] border border-slate-700/80 p-3.5 rounded-xl shadow-2xl font-sans text-xs">
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-1.5">{point.name}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Số dư:</span>
              <span className="font-mono font-bold text-white">${point.Balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {isPnLNotZero && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Kết quả:</span>
                <span className={`font-mono font-bold ${point.PnL >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {point.PnL >= 0 ? '+' : ''}${point.PnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Auto price simulation effect
  useEffect(() => {
    if (!isSimulating || activeTrades.length === 0) return;

    const interval = setInterval(() => {
      activeTrades.forEach(trade => {
        // Shift price slightly (between -0.15% to +0.15%)
        const percentageShift = (Math.random() * 0.3 - 0.15) / 100;
        const currentPrice = trade.currentPrice;
        const newPrice = currentPrice * (1 + percentageShift);
        
        // Match base decimals to avoid floating point noise
        const precision = currentPrice > 100 ? 2 : (currentPrice > 1 ? 4 : 6);
        onUpdateCurrentPrice(trade.id, parseFloat(newPrice.toFixed(precision)));
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating, activeTrades, onUpdateCurrentPrice]);

  // Calculate stats
  const totalActivePnl = activeTrades.reduce((sum, t) => sum + t.pnl, 0);
  const winCount = closedTrades.filter(t => t.status === 'won').length;
  const lossCount = closedTrades.filter(t => t.status === 'lost').length;
  const totalClosedCount = closedTrades.length;
  const winRate = totalClosedCount > 0 ? (winCount / totalClosedCount) * 100 : 0;
  
  // Tổng Lời/Lỗ Thực Tế dựa trên cột 'Lợi Nhuận Thực Tế' (đã khoá lời bằng Trailing Stop) của các vị thế đang mở
  const totalRealizedPnl = activeTrades.reduce((sum, t) => {
    if (t.trailingStopPrice === undefined || t.trailingStopPrice === null) {
      return sum;
    }
    
    let lockedPnl = 0;
    const isLong = t.direction === 'long';
    
    if (t.assetClass === 'forex') {
      const pairConfig = FOREX_PAIRS.find(p => p.symbol === t.ticker);
      const pipSize = pairConfig?.pipSize || 0.0001;
      const pipValLot = t.lots !== undefined ? (FOREX_PAIRS.find(p => p.symbol === t.ticker)?.defaultPipValueUSD || 10) : 10;
      
      const pipsDiff = (t.trailingStopPrice - t.entryPrice) / pipSize;
      const multiplier = isLong ? 1 : -1;
      
      lockedPnl = pipsDiff * (t.lots || 0) * pipValLot * multiplier;
    } else {
      const priceDiff = isLong ? (t.trailingStopPrice - t.entryPrice) : (t.entryPrice - t.trailingStopPrice);
      lockedPnl = priceDiff * t.units;
    }
    
    const roundedLocked = Math.round(lockedPnl * 100) / 100;
    return sum + roundedLocked;
  }, 0);

  // Expected Value (EV) calculation: (WinRate * AvgWin) - (LossRate * AvgLoss)
  const getEV = () => {
    if (totalClosedCount === 0) return { val: 0, formatted: 'N/A' };
    
    const wins = closedTrades.filter(t => t.status === 'won');
    const losses = closedTrades.filter(t => t.status === 'lost');
    
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / losses.length : 0;
    
    const pWin = winCount / totalClosedCount;
    const pLoss = 1 - pWin;
    
    const evValue = (pWin * avgWin) - (pLoss * avgLoss);
    return { 
      val: evValue, 
      formatted: `${evValue >= 0 ? '+' : ''}$${evValue.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}` 
    };
  };
  const ev = getEV();

  const avgRR = useMemo(() => {
    if (totalClosedCount === 0) return '0.0';
    const wins = closedTrades.filter(t => t.status === 'won');
    const losses = closedTrades.filter(t => t.status === 'lost');
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / losses.length : 0;
    return avgLoss > 0 ? (avgWin / avgLoss).toFixed(1) : avgWin > 0 ? '∞' : '1.0';
  }, [closedTrades, totalClosedCount]);

  // Premium Features: Expected Value by Setup Type
  const setupsEv = useMemo(() => {
    const groups: { [setupName: string]: { wins: number; losses: number; winAmt: number; lossAmt: number } } = {};
    
    closedTrades.forEach(t => {
      const setupName = t.setup || 'Mặc định';
      if (!groups[setupName]) {
        groups[setupName] = { wins: 0, losses: 0, winAmt: 0, lossAmt: 0 };
      }
      
      const pnlValue = t.status === 'won' ? Math.abs(t.pnl) : -Math.abs(t.pnl);
      if (pnlValue >= 0) {
        groups[setupName].wins += 1;
        groups[setupName].winAmt += pnlValue;
      } else {
        groups[setupName].losses += 1;
        groups[setupName].lossAmt += Math.abs(pnlValue);
      }
    });

    return Object.keys(groups).map(name => {
      const g = groups[name];
      const total = g.wins + g.losses;
      const winRate = total > 0 ? (g.wins / total) : 0;
      const lossRate = total > 0 ? (g.losses / total) : 0;
      const avgWin = g.wins > 0 ? (g.winAmt / g.wins) : 0;
      const avgLoss = g.losses > 0 ? (g.lossAmt / g.losses) : 0;
      const evVal = (winRate * avgWin) - (lossRate * avgLoss);
      return {
        name,
        total,
        winRate: winRate * 100,
        ev: evVal
      };
    }).sort((a, b) => b.ev - a.ev);
  }, [closedTrades]);

  // Premium Features: Max drawdowns analysis
  const drawdownStats = useMemo(() => {
    let balance = accountBalance || 10000;
    const sortedClosed = [...closedTrades].sort((a, b) => {
      return new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime();
    });

    const balances = [balance];
    sortedClosed.forEach(t => {
      const pnlValue = t.status === 'won' ? Math.abs(t.pnl) : -Math.abs(t.pnl);
      balance += pnlValue;
      balances.push(balance);
    });

    let peak = balances[0];
    let maxDdVal = 0;
    let maxDdPct = 0;
    
    balances.forEach(bal => {
      if (bal > peak) {
        peak = bal;
      }
      const ddVal = peak - bal;
      const ddPct = peak > 0 ? (ddVal / peak) * 100 : 0;
      if (ddVal > maxDdVal) maxDdVal = ddVal;
      if (ddPct > maxDdPct) maxDdPct = ddPct;
    });

    const currentBal = balances[balances.length - 1];
    const currentDdVal = peak - currentBal;
    const currentDdPct = peak > 0 ? (currentDdVal / peak) * 100 : 0;

    return {
      maxDdVal: Math.round(maxDdVal * 100) / 100,
      maxDdPct: Math.round(maxDdPct * 100) / 100,
      currentDdVal: Math.round(currentDdVal * 100) / 100,
      currentDdPct: Math.round(currentDdPct * 100) / 100,
      peak: Math.round(peak * 100) / 100
    };
  }, [closedTrades, accountBalance]);

  // Premium Features: Winning/Losing Streak patterns
  const streakStats = useMemo(() => {
    const sortedClosed = [...closedTrades].sort((a, b) => {
      return new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime();
    });

    let maxWins = 0;
    let maxLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;
    let currentStreakType: 'won' | 'lost' | 'none' = 'none';
    let currentStreakLength = 0;

    sortedClosed.forEach(t => {
      const isWin = t.status === 'won';
      if (isWin) {
        currentWins += 1;
        maxWins = Math.max(maxWins, currentWins);
        currentLosses = 0;
        
        if (currentStreakType === 'won') {
          currentStreakLength += 1;
        } else {
          currentStreakType = 'won';
          currentStreakLength = 1;
        }
      } else {
        currentLosses += 1;
        maxLosses = Math.max(maxLosses, currentLosses);
        currentWins = 0;

        if (currentStreakType === 'lost') {
          currentStreakLength += 1;
        } else {
          currentStreakType = 'lost';
          currentStreakLength = 1;
        }
      }
    });

    return {
      maxWins,
      maxLosses,
      currentStreakType,
      currentStreakLength
    };
  }, [closedTrades]);

  // Premium Features: Drawdown distribution segmentation
  const drawdownDistribution = useMemo(() => {
    let slight = 0, moderate = 0, heavy = 0;
    let balance = accountBalance || 10000;
    let peak = balance;
    
    const sortedClosed = [...closedTrades].sort((a, b) => {
      return new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime();
    });

    sortedClosed.forEach(t => {
      const pnlValue = t.status === 'won' ? Math.abs(t.pnl) : -Math.abs(t.pnl);
      balance += pnlValue;
      if (balance > peak) {
        peak = balance;
      }
      const ddPct = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
      if (ddPct > 5) heavy++;
      else if (ddPct > 2) moderate++;
      else if (ddPct > 0) slight++;
    });
    
    const total = slight + moderate + heavy || 1;
    return {
      slight: Math.round((slight / total) * 100),
      moderate: Math.round((moderate / total) * 100),
      heavy: Math.round((heavy / total) * 100),
      counts: { slight, moderate, heavy }
    };
  }, [closedTrades, accountBalance]);

  // Premium Features: Psychological counselor based on streaks
  const psychAdvisor = useMemo(() => {
    if (closedTrades.length === 0) {
      return "Hãy bắt đầu chốt vị thế để kích hoạt cố vấn tâm lý phân tích và tư vấn thói quen kỷ luật.";
    }
    
    const currentStreakLength = streakStats.currentStreakLength;
    const currentStreakType = streakStats.currentStreakType;
    
    if (currentStreakType === 'won' && currentStreakLength >= 3) {
      return `Bẫy hưng phấn quá độ (Overconfidence Trap). Bạn đang thăng hoa với chuỗi ${currentStreakLength} vị thế WIN liên tiếp. Hãy tuyệt đối kìm nén lòng tham, bám sát bộ quản trị rủi ro, không gia tăng volume tuỳ hứng!`;
    }
    
    if (currentStreakType === 'lost' && currentStreakLength >= 3) {
      return `Giao dịch trả thù (Revenge Trading). Việc lỗ liên tiếp ${currentStreakLength} lệnh dễ sinh tâm lý cá cú. Hãy đóng màn hình nghỉ ngơi tối thiểu 24 giờ, hoặc hạ 50% khối lượng rủi ro lệnh tiếp theo để thiết lập lại trật tự kỷ luật.`;
    }
    
    if (streakStats.maxLosses >= 5) {
      return "Cảnh báo chu kỳ rủi ro cao! Lịch sử sụt giảm chuỗi dài tới 5 lệnh hoặc hơn cho thấy chiến lược có thể đang đi ngược pha thị trường hoặc nôn nóng vào vị thế. Hãy chậm lại.";
    }
    
    return "Tâm lý giao dịch ổn định. Quy tắc rủi ro của bạn đang khớp tốt vào thị trường. Tiếp tục bám sát kế hoạch giao dịch và tuân thủ chặt chẽ tỉ lệ R:R ban đầu.";
  }, [closedTrades, streakStats]);

  // Premium Features: Sharpe Ratio formula
  const sharpeRatio = useMemo(() => {
    if (closedTrades.length < 3) return { val: 'N/A', rating: 'Cần ≥ 3 vị thế đóng', color: 'text-slate-500', raw: 0 };
    const pnls = closedTrades.map(t => t.pnl);
    const avg = pnls.reduce((sum, val) => sum + val, 0) / pnls.length;
    const variance = pnls.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / pnls.length;
    const stdDev = Math.sqrt(variance);
    const ratio = stdDev > 0 ? avg / stdDev : 0;
    
    let rating = 'Yếu';
    let color = 'text-rose-500';
    if (ratio >= 2.0) {
      rating = 'Xuất Sắc 👑';
      color = 'text-emerald-400';
    } else if (ratio >= 1.5) {
      rating = 'Rất Tốt';
      color = 'text-teal-400';
    } else if (ratio >= 1.0) {
      rating = 'Khá Tốt';
      color = 'text-yellow-400';
    } else if (ratio > 0) {
      rating = 'Trung bình';
      color = 'text-slate-300';
    }
    return { 
      val: ratio.toFixed(2), 
      rating, 
      color,
      raw: ratio
    };
  }, [closedTrades]);

  // Premium Features: Profit Factor formula & rating
  const profitFactor = useMemo(() => {
    if (closedTrades.length === 0) {
      return {
        val: 'N/A',
        rating: 'Chưa có vị thế đóng 📊',
        color: 'text-slate-500',
        totalGrossProfit: 0,
        totalGrossLoss: 0,
        advice: "Chưa có đủ số liệu giao dịch đã đóng để tính toán Profit Factor. Hãy bắt đầu chốt vị thế để nhận dữ liệu thống kê chuyên sâu và tư vấn quản trị vị thế."
      };
    }

    let grossProfit = 0;
    let grossLoss = 0;

    closedTrades.forEach(t => {
      const pnlVal = Math.abs(t.pnl);
      if (t.status === 'won') {
        grossProfit += pnlVal;
      } else {
        grossLoss += pnlVal;
      }
    });

    let valStr = '0.00';
    let rating = 'Yếu';
    let color = 'text-rose-500';
    let advice = '';

    if (grossLoss === 0) {
      if (grossProfit > 0) {
        valStr = '∞';
        rating = 'Xuất Sắc 👑';
        color = 'text-emerald-400';
        advice = "Chỉ số Profit Factor đạt mức vô hạn tuyệt đối (không có lệnh lỗ)! Đây là khởi đầu vô cùng tuyệt vời. Hãy giữ vững kỷ luật quản trị vốn chặt chẽ để duy trì phong độ đỉnh cao này dài lâu.";
      } else {
        valStr = '0.00';
        rating = 'Yêu cầu dữ liệu';
        color = 'text-slate-500';
        advice = "Hệ thống chưa ghi nhận lợi nhuận thực tế từ các lệnh thắng. Hãy tiếp tục bám sát kế hoạch R:R để thu về dòng lợi nhuận dương.";
      }
    } else {
      const factor = grossProfit / grossLoss;
      valStr = factor.toFixed(2);

      if (factor >= 2.0) {
        rating = 'Xuất Sắc 👑';
        color = 'text-emerald-400';
        advice = "Profit Factor đạt mức xuất sắc (>= 2.0), cho thấy hệ thống đang tạo lợi nhuận vượt bậc so với sụt giảm. Hãy tuyệt đối kìm nén sự tự tin hưng phấn thái quá, luôn duy trì kế hoạch rủi ro định sẵn.";
      } else if (factor >= 1.5) {
        rating = 'Rất Tốt 👍';
        color = 'text-teal-400';
        advice = "Profit Factor trong mức lý tưởng (1.5 - 2.0), khẳng định hệ thống đang vận hành sinh lời bền vững. Hãy tiếp tục bám sát quy chuẩn hiện tại.";
      } else if (factor >= 1.0) {
        rating = 'Tạm ổn 📈';
        color = 'text-yellow-500';
        advice = "Profit Factor > 1.0 là có lãi nhưng biên an toàn thấp. Bạn nên gồng lãi (TP) chuẩn và dài hơn hoặc kiểm soát chặt chẽ các lệnh thua nhỏ hơn để tăng hiệu suất.";
      } else {
        rating = 'Thua lỗ ⚠️';
        color = 'text-rose-500';
        advice = "Profit Factor dưới 1.0 cảnh báo tài khoản đang thua lỗ ròng. Hãy ngưng ngay các lệnh nhồi không có kế hoạch, nghiêm túc rà soát lại khoảng dừng lỗ SL và khối lượng rủi ro của từng lệnh!";
      }
    }

    return {
      val: valStr,
      rating,
      color,
      totalGrossProfit: grossProfit,
      totalGrossLoss: grossLoss,
      advice
    };
  }, [closedTrades]);

  // Premium Features: Download reporters
  const downloadCSV = () => {
    if (closedTrades.length === 0) return;
    const headers = ['ID', 'Ticker', 'Asset Class', 'Direction', 'Lots', 'Units', 'Entry Price', 'Exit Price', 'P&L', 'Time', 'Discipline'];
    const rows = closedTrades.map(t => [
      t.id,
      t.ticker,
      t.assetClass,
      t.direction,
      t.lots || '',
      t.units,
      t.entryPrice,
      t.currentPrice,
      t.pnl,
      t.enteredAt,
      t.uncheckedWarning ? 'Thieu Ky Luat' : 'Dung Ky Luat'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RiskWise_Trading_Journal_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = () => {
    if (closedTrades.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(closedTrades, null, 2));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `RiskWise_Trading_Journal_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEditing = (trade: PortfolioTrade) => {
    setEditingPriceId(trade.id);
    setTempPrice(trade.currentPrice.toString());
  };

  const savePriceEdit = (id: string) => {
    const parsed = parseFloat(tempPrice);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateCurrentPrice(id, parsed);
    }
    setEditingPriceId(null);
  };

  const startEditingTrailing = (trade: PortfolioTrade) => {
    setEditingTrailingId(trade.id);
    setTempTrailing(trade.trailingStopPrice !== undefined ? trade.trailingStopPrice.toString() : '');
  };

  const saveTrailingEdit = (id: string) => {
    if (tempTrailing === '') {
      onUpdateTrailingStop(id, undefined);
    } else {
      const parsed = parseFloat(tempTrailing);
      if (!isNaN(parsed) && parsed > 0) {
        onUpdateTrailingStop(id, parsed);
      }
    }
    setEditingTrailingId(null);
  };

  return (
    <div id="portfolio-tracker-container" className="space-y-6">
      
      {/* Portfolio overview blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Floating Active PnL */}
        <div className="bg-[#14171F] border border-slate-800 rounded-2xl p-4.5 shadow-sm overflow-hidden relative">
          <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Tổng Lợi nhuận Thả nổi</span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className={`text-2xl font-black font-mono tracking-tight ${
              totalActivePnl >= 0 ? 'text-emerald-400' : 'text-rose-500'
            }`}>
              {totalActivePnl >= 0 ? '+' : ''}${totalActivePnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-slate-450 mt-1">Dựa trên vị thế mở hoạt động.</p>
        </div>

             {/* Win Rate */}
        <div className="bg-[#14171F] border border-slate-800 rounded-2xl p-4.5 shadow-sm overflow-hidden relative">
          <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Tỉ Lệ Thắng / Avg R:R</span>
          <div className="mt-2.5 flex items-baseline gap-1.5 justify-between">
            <div>
              <span className="text-2xl font-black font-mono text-yellow-500 tracking-tight">
                {winRate.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-mono block">({winCount}/{totalClosedCount} lệnh)</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black font-mono text-indigo-400 block">{avgRR}</span>
              <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block">Avg Win/Loss R:R</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-450 mt-1 flex items-center justify-between">
            <span>Kỷ luật càng cao, tỉ lệ càng cải thiện.</span>
          </p>
        </div>

        {/* Discipline index */}
        <div className="bg-[#14171F] border border-slate-800 rounded-2xl p-4.5 shadow-sm overflow-hidden relative animate-fadeIn">
          <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider font-sans">Kỷ Luật Indicator</span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            {activeTrades.length === 0 ? (
              <span className="text-lg font-bold text-slate-550 font-sans">Không vị thế mở</span>
            ) : (
              (() => {
                const undisciplined = activeTrades.filter(t => t.uncheckedWarning).length;
                const pct = ((activeTrades.length - undisciplined) / activeTrades.length) * 100;
                return (
                  <>
                    <span className={`text-2xl font-black font-mono tracking-tight ${
                      pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-rose-500'
                    }`}>
                      {pct.toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-slate-550 font-sans">Giao dịch chuẩn</span>
                  </>
                );
              })()
            )}
          </div>
          <p className="text-[10px] text-slate-450 mt-1">Tỉ lệ phần trăm lệnh vào đủ điều kiện.</p>
        </div>

      </div>

      {/* Visual Analytics Grid: Equity Curve & Sector Risk Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6 animate-fadeIn">
        {/* Equity Curve Chart - Spans 8 cols */}
        <div className="lg:col-span-8 bg-[#14171F] border border-slate-800 rounded-2xl p-5 shadow-xs relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-2 border-b border-slate-800/80 gap-3">
            <div>
              <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2 flex-wrap">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Đường Cong Vốn (Equity Curve) &amp; Biến Động Số Dư
                {isOfflineTimeHack && (
                  <span className="text-[9px] bg-amber-500/15 border border-amber-500/30 text-amber-500 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider scale-95 origin-left">
                    Chỉ số 30 ngày (Bị giới hạn)
                  </span>
                )}
              </h4>
              <p className="text-[10px] text-slate-500 mt-1 font-sans font-medium">Lịch sử số dư biến động thực tế dựa trên thứ tự chốt lệnh đã thực hiện</p>
            </div>
            
            <div className="flex items-center gap-3.5 self-start sm:self-auto">
              {/* Range Toggle */}
              <div className="flex bg-[#1C212D]/80 rounded-xl p-0.5 border border-slate-800 tracking-wide">
                <button
                  type="button"
                  onClick={() => setEquityRange('30days')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all tracking-wider cursor-pointer ${
                    equityRange === '30days'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  30 Ngày
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isProLocked) {
                      onTriggerPaywall?.();
                    } else {
                      setEquityRange('all');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all tracking-wider flex items-center gap-1 cursor-pointer ${
                    equityRange === 'all' && !isProLocked
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isProLocked && <Lock className="w-2.5 h-2.5 text-amber-500" />}
                  Trọn Đời
                </button>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-[9px] block text-slate-500 uppercase tracking-wider font-extrabold font-mono">Tài khoản Quy chiếu</span>
                <span className="font-mono text-xs font-black text-indigo-455">${accountBalance.toLocaleString('en-US', { minimumFractionDigits: 1 })}</span>
              </div>
            </div>
          </div>

          <div className="h-[210px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#475569" 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="Balance" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#equityGradient)" 
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#818cf8' }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Risk Breakdown - Spans 4 cols */}
        <div className="lg:col-span-4 bg-[#14171F] border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
              <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Rủi Ro Các Nhóm Ngành
              </h4>
            </div>

            {activeTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-[140px]">
                <span className="text-base mb-1.5 opacity-60">📊</span>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Không có rủi ro mở</p>
                <p className="text-[9px] text-slate-550 mt-1 max-w-[200px] leading-normal font-sans">Khi bạn vào lệnh Stock/Crypto, tỷ trọng rủi ro sẽ tự động được kiểm soát tại đây.</p>
              </div>
            ) : (
              <div className="space-y-3 mt-1 max-h-[175px] overflow-y-auto pr-1 scrollbar-none">
                {Object.entries(sectorGroups).map(([sector, group]) => {
                  const sectorPctOfTotal = totalActiveRisk > 0 ? (group.totalRisk / totalActiveRisk) * 100 : 100;
                  return (
                    <div key={sector} className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-350 font-sans truncate pr-2 max-w-[140px]" title={sector}>{sector}</span>
                        <div className="flex gap-1 font-mono shrink-0">
                          <span className="text-slate-500">(${Math.round(group.totalRisk)})</span>
                          <span className="text-indigo-400">{sectorPctOfTotal.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-[#1C212D] h-1.5 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300" 
                          style={{ width: `${sectorPctOfTotal}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-slate-500 font-sans flex justify-between pr-0.5">
                        <span>Risk: {accountBalance > 0 ? ((group.totalRisk / accountBalance) * 100).toFixed(2) : '0.00'}% vốn</span>
                        <span>Đóng góp: {sectorPctOfTotal.toFixed(0)}% tổng risk</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="pt-2.5 border-t border-slate-800/80 mt-4 space-y-1 bg-[#1C212D]/15 p-2 rounded-xl">
            <div className="flex justify-between text-[10px] text-slate-405 font-bold uppercase">
              <span>Tổng % Risk đang mở:</span>
              <span className={`font-mono font-black ${accountBalance > 0 && (totalActiveRisk / accountBalance) * 100 > 10 ? 'text-[#F43F5E]' : 'text-indigo-400'}`}>
                {(accountBalance > 0 ? (totalActiveRisk / accountBalance) * 100 : 0).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-[8.5px] text-slate-550 font-sans font-semibold">
              <span>Hạn mức rủi ro tối đa khuyên dùng:</span>
              <span>10.00% tài khoản</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phân Tích Hiệu Suất Chuyên Sâu (PRO Performance Grid) */}
      <div className="space-y-3.5 relative mt-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            PHÂN TÍCH HIỆU SUẤT CHUYÊN SÂU (PRO METRICS)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-fadeIn">
          {/* CARD 1: Expected Value (EV) by Setup Type */}
          <div className="relative overflow-hidden bg-[#14171F] border border-slate-800 p-4.5 rounded-2xl flex flex-col justify-between min-h-[220px] transition group hover:border-slate-700">
            <div className={isProLocked ? 'blur-[8px] pointer-events-none select-none opacity-30 h-full flex flex-col justify-between' : 'h-full flex flex-col justify-between'}>
              <div>
                <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 text-slate-400">Kỳ Vọng Toán Học EV Setup</span>
                <div className="flex items-baseline gap-1.5 mb-3 border-b border-slate-800/80 pb-2">
                  <span className={`text-base font-black font-mono ${ev.val >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {ev.formatted}
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans">(EV TB Toàn bộ)</span>
                </div>
                {setupsEv.length === 0 ? (
                  <p className="text-[10px] text-slate-500 font-sans italic mt-2">Chưa có dữ liệu setup.</p>
                ) : (
                  <div className="space-y-1.5 mt-1 max-h-24 overflow-y-auto scrollbar-none">
                    {setupsEv.slice(0, 4).map((item) => (
                      <div key={item.name} className="flex justify-between items-center text-xs font-sans">
                        <span className="text-slate-300 font-semibold truncate max-w-[125px]">
                          {item.name} <span className="text-[9px] text-slate-500 font-normal">({item.total} lệnh)</span>
                        </span>
                        <span className={`font-mono font-bold ${item.ev >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {item.ev >= 0 ? '+' : ''}${item.ev.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-[9px] text-slate-500 leading-normal border-t border-slate-850 pt-2 font-sans font-medium">
                Kỳ vọng toán học trung bình của mỗi loại Setup điểm vào. Công thức: (Win% × AvgWin) - (Loss% × AvgLoss).
              </div>
            </div>

            {/* Locked Paywall Overlay */}
            {isProLocked && (
              <div 
                onClick={() => onTriggerPaywall?.()}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-slate-950/85 backdrop-blur-[7px] cursor-pointer text-center group transition duration-300 border border-slate-800/80 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-2.5 transition shadow-lg shadow-amber-950/20 group-hover:scale-110">
                  <Lock className="w-5.5 h-5.5 text-amber-450 shrink-0" />
                </div>
                <h4 className="text-[10px] font-black text-amber-450 uppercase tracking-widest mb-1 font-sans">
                  KỲ VỌNG CHI TIẾT
                </h4>
                <p className="text-[9.5px] text-slate-300 max-w-sm leading-snug mb-3.5 font-medium">
                  Xem chi tiết chỉ số EV của từng thiết lập giao dịch.
                </p>
                <span className="text-[8.5px] bg-amber-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm group-hover:bg-amber-400 transition font-mono">
                  PRO ACCESS 👑
                </span>
              </div>
            )}
          </div>

          {/* CARD 2: Sharpe Ratio */}
          <div className="relative overflow-hidden bg-[#14171F] border border-slate-800 p-4.5 rounded-2xl flex flex-col justify-between min-h-[220px] transition group hover:border-slate-700">
            <div className={isProLocked ? 'blur-[8px] pointer-events-none select-none opacity-30 h-full flex flex-col justify-between' : 'h-full flex flex-col justify-between'}>
              <div>
                <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 text-slate-400">Chỉ Số Sharpe Ratio</span>
                <div className="flex items-baseline gap-1.5 mb-2 border-b border-slate-800/80 pb-2">
                  <span className={`text-xl font-black font-mono tracking-tight ${sharpeRatio.color}`}>
                    {sharpeRatio.val}
                  </span>
                  <span className={`text-[8px] font-bold ${sharpeRatio.color} uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800`}>
                    {sharpeRatio.rating}
                  </span>
                </div>
                
                <div className="space-y-1.5 mt-2 text-xs text-slate-300">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-450">Tổng số vị thế đóng:</span>
                    <span className="font-mono font-semibold text-white">{closedTrades.length} Lệnh</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-450">Hệ số biến động:</span>
                    <span className="font-mono font-semibold text-indigo-400">Risk-Adjusted</span>
                  </div>
                </div>
              </div>
              
              <div className="text-[9px] text-slate-500 leading-normal border-t border-slate-850 pt-2 font-sans font-medium">
                Đo lường tỷ suất lợi nhuận thu hồi trên mỗi phần độ lệch rủi ro chịu đựng. Trị số &gt; 1.0 báo hiệu kỹ năng Pro tối ưu lợi nhuận tốt.
              </div>
            </div>

            {/* Locked Paywall Overlay */}
            {isProLocked && (
              <div 
                onClick={() => onTriggerPaywall?.()}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-slate-950/85 backdrop-blur-[7px] cursor-pointer text-center group transition duration-300 border border-slate-800/80 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-2.5 transition shadow-lg shadow-amber-950/20 group-hover:scale-110">
                  <Lock className="w-5.5 h-5.5 text-amber-455 shrink-0" />
                </div>
                <h4 className="text-[10px] font-black text-amber-450 uppercase tracking-widest mb-1 font-sans">
                  CHỈ SỐ SHARPE RATIO
                </h4>
                <p className="text-[9.5px] text-slate-300 max-w-sm leading-snug mb-3.5 font-medium">
                  Đánh giá phần lợi nhuận so với mức tàn phá của rủi ro.
                </p>
                <span className="text-[8.5px] bg-amber-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm group-hover:bg-amber-400 transition font-mono">
                  PRO ACCESS 👑
                </span>
              </div>
            )}
          </div>

          {/* CARD 3: Profit Factor */}
          <div className="relative overflow-hidden bg-[#14171F] border border-slate-800 p-4.5 rounded-2xl flex flex-col justify-between min-h-[220px] transition group hover:border-slate-700">
            <div className={isProLocked ? 'blur-[8px] pointer-events-none select-none opacity-30 h-full flex flex-col justify-between' : 'h-full flex flex-col justify-between'}>
              <div>
                <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 text-slate-400">Hệ Số Profit Factor</span>
                <div className="flex items-baseline gap-1.5 mb-2 border-b border-slate-800/80 pb-2">
                  <span className={`text-xl font-black font-mono tracking-tight ${profitFactor.color}`}>
                    {profitFactor.val}
                  </span>
                  <span className={`text-[8px] font-bold ${profitFactor.color} uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800`}>
                    {profitFactor.rating}
                  </span>
                </div>

                <div className="space-y-1 mt-2 text-xs text-slate-350">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-450 font-medium">Tổng lãi gộp (Gross Profit):</span>
                    <span className="font-mono font-bold text-emerald-450">+${profitFactor.totalGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-450 font-medium font-sans">Tổng lỗ gộp (Gross Loss):</span>
                    <span className="font-mono font-bold text-rose-450">-${profitFactor.totalGrossLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-sans leading-relaxed p-2 border-l-2 border-amber-500 bg-amber-500/[0.03] mt-2 rounded max-h-18 overflow-y-auto">
                    <span className="text-amber-400 font-bold block mb-0.5">Note Tư Vấn:</span>
                    "{profitFactor.advice}"
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 leading-normal border-t border-slate-850 pt-2 font-sans font-medium mt-2">
                Tỉ lệ gộp của các lệnh Thắng so với Thua. Nên duy trì trên mức 1.5 để đảm bảo an toàn dòng vốn dài hạn.
              </div>
            </div>

            {/* Locked Paywall Overlay */}
            {isProLocked && (
              <div 
                onClick={() => onTriggerPaywall?.()}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-slate-950/85 backdrop-blur-[7px] cursor-pointer text-center group transition duration-300 border border-slate-800/80 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-2.5 transition shadow-lg shadow-amber-950/20 group-hover:scale-110">
                  <Lock className="w-5.5 h-5.5 text-amber-455 shrink-0" />
                </div>
                <h4 className="text-[10px] font-black text-amber-455 uppercase tracking-widest mb-1 font-sans">
                  PRO PROFIT FACTOR
                </h4>
                <p className="text-[9.5px] text-slate-300 max-w-sm leading-snug mb-3.5 font-medium">
                  Xem chi tiết chỉ số tỉ số Lãi/Lỗ ròng kèm theo lời tư vấn tối ưu hiệu năng.
                </p>
                <span className="text-[8.5px] bg-amber-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm group-hover:bg-amber-400 transition font-mono">
                  PRO ACCESS 👑
                </span>
              </div>
            )}
          </div>

          {/* CARD 4: Drawdown Distribution */}
          <div className="relative overflow-hidden bg-[#14171F] border border-slate-800 p-4.5 rounded-2xl flex flex-col justify-between min-h-[220px] transition group hover:border-slate-700">
            <div className={isProLocked ? 'blur-[8px] pointer-events-none select-none opacity-30 h-full flex flex-col justify-between' : 'h-full flex flex-col justify-between'}>
              <div>
                <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 text-slate-400">Phân Phối Sụt Giảm (Drawdown)</span>
                
                <div className="space-y-1.5 font-sans mb-3 border-b border-slate-800/80 pb-2">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-400 font-semibold">Max Drawdown (PRO):</span>
                    <span className="font-mono font-extrabold text-[#F43F5E] text-xs">
                      -${drawdownStats.maxDdVal.toLocaleString('en-US', { minimumFractionDigits: 1 })} ({drawdownStats.maxDdPct}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-400 font-semibold">Drawdown hiện tại:</span>
                    <span className="font-mono font-extrabold text-[#F59E0B] text-xs">
                      -${drawdownStats.currentDdVal.toLocaleString('en-US', { minimumFractionDigits: 1 })} ({drawdownStats.currentDdPct}%)
                    </span>
                  </div>
                </div>

                {/* Distribution Bars */}
                <div className="space-y-1.5 text-[9px] font-mono">
                  <div>
                    <div className="flex justify-between text-slate-400 font-bold mb-0.5">
                      <span>Nhẹ (0-2%):</span>
                      <span className="text-emerald-405">{drawdownDistribution.slight}% ({drawdownDistribution.counts.slight} lần)</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${drawdownDistribution.slight}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-slate-400 font-bold mb-0.5">
                      <span>Vừa (2-5%):</span>
                      <span className="text-amber-405">{drawdownDistribution.moderate}% ({drawdownDistribution.counts.moderate} lần)</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${drawdownDistribution.moderate}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 font-bold mb-0.5">
                      <span>Lớn (&gt;5%):</span>
                      <span className="text-rose-405">{drawdownDistribution.heavy}% ({drawdownDistribution.counts.heavy} lần)</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-[#E11D48] h-full" style={{ width: `${drawdownDistribution.heavy}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-[9px] text-slate-500 leading-normal border-t border-slate-850 pt-2 font-sans font-medium">
                Thống kê số lần tài khoản rơi vào các mức sập gãy sụt giảm sương sương (nhẹ) so với sập nặng (&gt;5%).
              </div>
            </div>

            {/* Locked Paywall Overlay */}
            {isProLocked && (
              <div 
                onClick={() => onTriggerPaywall?.()}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-slate-950/85 backdrop-blur-[7px] cursor-pointer text-center group transition duration-300 border border-slate-800/80 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-2.5 transition shadow-lg shadow-amber-950/20 group-hover:scale-110">
                  <Lock className="w-5.5 h-5.5 text-amber-455 shrink-0" />
                </div>
                <h4 className="text-[10px] font-black text-amber-450 uppercase tracking-widest mb-1 font-sans">
                  PHÂN PHỐI SỤT GIẢM
                </h4>
                <p className="text-[9.5px] text-slate-300 max-w-sm leading-snug mb-3.5 font-medium">
                  Phân tích cấu trúc sụt giảm tài khoản chi tiết để kiểm soát drawdown.
                </p>
                <span className="text-[8.5px] bg-amber-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm group-hover:bg-amber-400 transition font-mono">
                  PRO ACCESS 👑
                </span>
              </div>
            )}
          </div>

          {/* CARD 5: Streak Patterns & Counselor */}
          <div className="relative overflow-hidden bg-[#14171F] border border-slate-800 p-4.5 rounded-2xl flex flex-col justify-between min-h-[220px] transition group hover:border-slate-700">
            <div className={isProLocked ? 'blur-[8px] pointer-events-none select-none opacity-30 h-full flex flex-col justify-between' : 'h-full flex flex-col justify-between'}>
              <div>
                <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 text-slate-400">Chuỗi Lệnh &amp; Trợ Lý Tâm Lý</span>
                
                <div className="space-y-1 text-xs mb-2 bg-[#1C212D]/40 p-2 rounded-xl">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-400">Chuỗi Thắng Max:</span>
                    <span className="font-mono font-extrabold text-emerald-400 flex items-center gap-1 shrink-0">
                      {streakStats.maxWins} Lệnh 🔥
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-400">Chuỗi Thua Max:</span>
                    <span className="font-mono font-extrabold text-rose-500 shrink-0">
                      {streakStats.maxLosses} Lệnh ⚠️
                    </span>
                  </div>
                </div>

                {/* Psychology Advice Text */}
                <div className="text-[9.5px] text-slate-300 font-sans leading-relaxed p-1.5 border-l-2 border-indigo-505 bg-[#1C212D]/25 mt-2 rounded">
                  <span className="text-indigo-400 font-bold block mb-0.5">Trợ lý Cố Vấn:</span>
                  "{psychAdvisor}"
                </div>
              </div>
              
              <div className="text-[9px] text-slate-500 leading-normal border-t border-slate-850 pt-2 font-sans font-medium">
                Kiểm soát bẫy tâm lý "Overconfidence Trap" khi thắng nhiều, ngăn chặn tuyệt đối trò gồng lỗ phục thù "Revenge trading".
              </div>
            </div>

            {/* Locked Paywall Overlay */}
            {isProLocked && (
              <div 
                onClick={() => onTriggerPaywall?.()}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-slate-950/85 backdrop-blur-[7px] cursor-pointer text-center group transition duration-300 border border-slate-800/80 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-2.5 transition shadow-lg shadow-amber-950/20 group-hover:scale-110">
                  <Lock className="w-5.5 h-5.5 text-amber-455 shrink-0" />
                </div>
                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">
                  TƯ VẤN ĐỘC QUYỀN
                </h4>
                <p className="text-[9.5px] text-slate-300 max-w-sm leading-snug mb-3.5 font-medium">
                  Cố vấn tâm lý giao dịch tự động phản hổi theo thời gian thực phong độ.
                </p>
                <span className="text-[8.5px] bg-amber-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm group-hover:bg-amber-400 transition font-mono">
                  PRO ACCESS 👑
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Tools for Open Positions */}
      <div className="flex items-center justify-between mt-6 pb-2 border-b border-slate-805">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Các Vị Thế Giao Dịch Đang Mở ({activeTrades.length})
          </h3>
        </div>
        
        {activeTrades.length > 0 && (
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition flex items-center gap-1.5 cursor-pointer ${
              isSimulating 
                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-950/60' 
                : 'bg-indigo-950/30 text-indigo-400 border border-indigo-900/50 hover:bg-indigo-950/50'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Đang mô phỏng giá chạy...' : 'Mô phỏng thị trường thực'}
          </button>
        )}
      </div>

      {/* Active Trades Table/List */}
      <div className="space-y-4">
        {activeTrades.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl bg-[#14171F]/25">
            <RotateCcw className="w-8 h-8 text-slate-650 mx-auto mb-2" />
            <p className="text-xs text-slate-450">Không có vị thế giao dịch mở nào.</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto">
              Hãy dùng bộ tính toán vị thế ở tab trước, hoàn tất checklist và bấm "Lưu lệnh & Kích hoạt theo dõi" để lưu lại lệnh tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#14171F]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-805/85 bg-[#1C212D]/40 text-slate-400 uppercase font-mono tracking-wider font-semibold">
                  <th className="p-3">Mã / Ticker</th>
                  <th className="p-3">Loại / Chiều</th>
                  <th className="p-3">Khối lượng</th>
                  <th className="p-3">Mức Giá Vào</th>
                  <th className="p-3">Stop Loss</th>
                  <th className="p-3">Trailing Stop</th>
                  <th className="p-3">Giá Chốt Lời</th>
                  <th className="p-3">Rủi ro (% Ngành)</th>
                  <th className="p-3">Giá Hiện Tại</th>
                  <th className="p-3">Lợi Nhuận (PnL)</th>
                  <th className="p-3">Lợi Nhuận Thực Tế</th>
                  <th className="p-3">Tính Kỷ Luật</th>
                  <th className="p-3 text-right">Hành động chốt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-805/60 text-slate-350 font-sans">
                {activeTrades.map((t) => {
                  const isLong = t.direction === 'long';
                  return (
                    <tr key={t.id} className="hover:bg-slate-850/20 transition-all font-medium">
                      {/* Ticker & Sector */}
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-slate-100">{t.ticker}</span>
                          <span className="text-[10px] text-indigo-455 font-bold uppercase tracking-tight">{t.sector || 'Chưa phân loại'}</span>
                        </div>
                      </td>
                      
                      {/* Direction / Asset Class */}
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[10px] font-bold uppercase ${isLong ? 'text-emerald-400' : 'text-rose-500'}`}>
                            {isLong ? 'Long (Mua)' : 'Short (Bán)'}
                          </span>
                          <span className="text-[9px] text-slate-500 uppercase">{t.assetClass}</span>
                        </div>
                      </td>

                      {/* Size (Lots or Units) */}
                      <td className="p-3 font-mono">
                        {t.assetClass === 'forex' ? (
                          <div className="flex flex-col">
                            <span className="text-white font-bold">{t.lots} Lots</span>
                            <span className="text-[9px] text-slate-500">{(t.units).toLocaleString()} units</span>
                          </div>
                        ) : (
                          <span className="text-white font-bold">{(t.units).toLocaleString()} Units</span>
                        )}
                      </td>

                      {/* Entry Price */}
                      <td className="p-3 font-mono text-slate-300">{t.entryPrice.toLocaleString()}</td>

                      {/* SL */}
                      <td className="p-3 font-mono text-slate-400">{t.stopLoss}</td>

                      {/* Trailing Stop Column */}
                      <td className="p-3">
                        {editingTrailingId === t.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={tempTrailing}
                              onChange={(e) => setTempTrailing(e.target.value)}
                              placeholder="Trống"
                              className="w-20 bg-[#1C212D] border border-slate-705 text-xs text-center rounded-lg text-white font-mono p-1"
                            />
                            <button
                              onClick={() => saveTrailingEdit(t.id)}
                              className="bg-indigo-600 p-1 rounded-md text-white hover:bg-indigo-500 cursor-pointer font-bold"
                              title="Lưu"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingTrailingId(null)}
                              className="bg-slate-800 p-1 rounded-md text-slate-400 hover:bg-slate-700 cursor-pointer"
                              title="Huỷ"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {t.trailingStopPrice !== undefined && t.trailingStopPrice !== null ? (
                              <span className="font-mono text-indigo-300 font-bold">{t.trailingStopPrice.toLocaleString()}</span>
                            ) : (
                              <span className="font-mono text-slate-600 italic">Chưa đặt</span>
                            )}
                            <button
                              onClick={() => startEditingTrailing(t)}
                              title="Sửa Trailing Stop"
                              className="text-[10px] underline text-indigo-455 hover:text-indigo-400 hover:bg-slate-800/60 px-1 py-0.5 rounded cursor-pointer font-sans"
                            >
                              Sửa
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Giá chốt lời */}
                      <td className="p-3 font-mono text-emerald-400 font-bold">{t.takeProfit || 'Chưa cài'}</td>

                      {/* Risk % Sector */}
                      <td className="p-3 font-mono">
                        {(() => {
                          const sectorName = t.sector || 'Chưa phân loại';
                          const totalSectorRisk = sectorGroups[sectorName]?.totalRisk || t.riskAmount;
                          const sectorRiskPercent = totalSectorRisk > 0 ? (t.riskAmount / totalSectorRisk) * 100 : 100;
                          return (
                            <div className="flex flex-col">
                              <span className="text-white font-bold">${t.riskAmount.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
                              <span className="text-[9px] text-slate-500 font-sans font-medium">
                                Chiếm <span className="text-indigo-400 font-bold">{sectorRiskPercent.toFixed(0)}%</span> ngành
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Editable Current Price */}
                      <td className="p-3">
                        {editingPriceId === t.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-20 bg-[#1C212D] border border-slate-705 text-xs text-center rounded-lg text-white font-mono p-1"
                            />
                            <button
                              onClick={() => savePriceEdit(t.id)}
                              className="bg-emerald-600 p-1 rounded-md text-white hover:bg-emerald-505 cursor-pointer"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="bg-slate-800 p-1 rounded-md text-slate-400 hover:bg-slate-700 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-indigo-300 font-bold">{t.currentPrice.toLocaleString()}</span>
                            <button
                              onClick={() => startEditing(t)}
                              title="Sửa giá thị trường để test PnL"
                              className="text-[10px] underline text-indigo-455 hover:text-indigo-400 hover:bg-slate-800/60 px-1 py-0.5 rounded cursor-pointer font-sans"
                            >
                              Sửa
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Floating PnL */}
                      <td className="p-3 font-mono">
                        <span className={`font-bold text-sm ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {t.pnl >= 0 ? '+' : ''}${t.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Secured/Locked Realized Profit via Trailing Stop Column */}
                      <td className="p-3">
                        {(() => {
                          if (t.trailingStopPrice === undefined || t.trailingStopPrice === null) {
                            return <span className="font-mono text-slate-600 italic">Chưa đặt TS</span>;
                          }
                          
                          let lockedPnl = 0;
                          const isLong = t.direction === 'long';
                          
                          if (t.assetClass === 'forex') {
                            const pairConfig = FOREX_PAIRS.find(p => p.symbol === t.ticker);
                            const pipSize = pairConfig?.pipSize || 0.0001;
                            const pipValLot = t.lots !== undefined ? (FOREX_PAIRS.find(p => p.symbol === t.ticker)?.defaultPipValueUSD || 10) : 10;
                            
                            const pipsDiff = (t.trailingStopPrice - t.entryPrice) / pipSize;
                            const multiplier = isLong ? 1 : -1;
                            
                            lockedPnl = pipsDiff * (t.lots || 0) * pipValLot * multiplier;
                          } else {
                            const priceDiff = isLong ? (t.trailingStopPrice - t.entryPrice) : (t.entryPrice - t.trailingStopPrice);
                            lockedPnl = priceDiff * t.units;
                          }
                          
                          const roundedLocked = Math.round(lockedPnl * 100) / 100;
                          
                          if (roundedLocked <= 0) {
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-slate-500 font-semibold">$0.00</span>
                                <span className="text-[9px] text-slate-600 font-sans italic">Chưa khóa lời</span>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-emerald-400 font-bold">
                                +${roundedLocked.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[9px] text-emerald-500/80 font-bold font-sans">Đã khóa lời</span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Warning Warning status */}
                      <td className="p-3">
                        {t.uncheckedWarning ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-rose-950/40 border border-rose-900/40 text-rose-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                            Thiếu Kỷ Luật
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                            Đúng Kỷ Luật
                          </span>
                        )}
                      </td>

                      {/* Actions: close choices */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => onCloseTrade(t.id, t.pnl >= 0 ? 'won' : 'lost')}
                            className="bg-[#1C212D] border border-slate-700 hover:border-slate-500 text-slate-205 hover:text-white px-3 py-1.5 text-[10px] rounded-lg cursor-pointer font-extrabold transition-all uppercase tracking-wider"
                          >
                            Đóng vị thế
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HISTORIC CLOSED TRADES SECTION */}
      <div id="closed-trades-history-section" className="space-y-4 pt-4 mt-8">
        <div className="flex items-center justify-between pb-2 border-b border-slate-805">
          <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" />
            Lịch sử Giao dịch đã Chốt ({closedTrades.length})
          </h3>
          {closedTrades.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[10px] text-slate-500 hover:text-rose-450 transition font-semibold cursor-pointer underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Xóa lịch sử đã chốt
            </button>
          )}
        </div>

        {closedTrades.length > 0 && (
          <div className="relative overflow-hidden bg-[#14171F] border border-slate-800 p-4 rounded-xl">
            <div className={isProLocked ? "blur-[8px] pointer-events-none select-none opacity-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4" : "flex flex-col sm:flex-row sm:items-center justify-between gap-4"}>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  XUẤT BÁO CÁO NHẬT KÝ CHI TIẾT
                </h4>
                <p className="text-[10.5px] text-slate-500 font-sans font-semibold">Xuất dữ liệu lịch sử lệnh giao dịch đã chốt của bạn ra các định dạng chuẩn để lưu trữ hoặc phân tích sâu hoặc gộp lên trang web phân tích khác.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={downloadCSV}
                  className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Xuất Excel / CSV
                </button>
                <button
                  type="button"
                  onClick={downloadJSON}
                  className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Xuất file JSON
                </button>
              </div>
            </div>

            {isProLocked && (
              <div 
                onClick={() => onTriggerPaywall?.()}
                className="absolute inset-0 z-10 flex flex-col sm:flex-row items-center justify-center p-4 bg-slate-950/85 backdrop-blur-[7px] cursor-pointer text-center sm:text-left gap-4 group transition duration-300 border border-slate-800/80 rounded-xl"
              >
                <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 transition shadow-lg group-hover:scale-110">
                  <Lock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest mb-0.5">
                    XUẤT BÁO CÁO GIAO DỊCH (PRO)
                  </h4>
                  <p className="text-[10px] text-slate-350 max-w-sm leading-relaxed font-sans font-semibold">
                    Tính năng xuất dữ liệu ra file Excel/CSV, JSON chỉ dành riêng cho thành viên đăng ký gói PREMIUM VIP.
                  </p>
                </div>
                <span className="sm:ml-auto text-[9px] bg-amber-500 text-slate-950 font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm group-hover:bg-amber-400 transition">
                  NÂNG CẤP PRO 👑
                </span>
              </div>
            )}
          </div>
        )}

        {closedTrades.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl bg-[#14171F]/15">
            <BookOpen className="w-6 h-6 text-slate-700 mx-auto mb-1.5" />
            <p className="text-[11px] text-slate-500">Chưa có kết quả lịch sử lệnh đóng nào.</p>
          </div>
        ) : (
          <div className="bg-[#14171F] border border-slate-800/65 rounded-2xl overflow-hidden pr-2">
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-805">
              {closedTrades.map((t) => {
                const isWon = t.status === 'won';
                const formattedDate = new Date(t.enteredAt).toLocaleDateString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'short'
                });

                return (
                  <div key={t.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-[#1C212D]/20 transition-all">
                    
                    {/* Basic specs */}
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border flex items-center justify-center shrink-0 ${
                        isWon 
                          ? 'bg-emerald-950/35 border-emerald-900/30 text-emerald-400' 
                          : 'bg-rose-950/35 border-rose-900/30 text-rose-400'
                      }`}>
                        {isWon ? <Smile className="w-4.5 h-4.5" /> : <Frown className="w-4.5 h-4.5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-sm font-mono">{t.ticker}</span>
                          <span className="text-[10px] text-indigo-450 font-bold uppercase">({t.sector || 'Chưa phân loại'})</span>
                          <span className={`text-[9px] font-bold uppercase rounded px-1.5 border ${
                            t.direction === 'long' 
                              ? 'bg-emerald-955/20 text-emerald-400 border-emerald-900/40' 
                              : 'bg-rose-955/20 text-rose-400 border-rose-900/40'
                          }`}>
                            {t.direction === 'long' ? 'Mua' : 'Bán'}
                          </span>
                          <span className="text-[9px] text-slate-500 block font-mono">{formattedDate}</span>
                        </div>
                        <p className="text-[10px] text-slate-450 mt-1">
                          Vào: <span className="text-slate-350 font-mono font-bold">${t.entryPrice.toLocaleString()}</span> • 
                          Giá đóng: <span className="text-slate-350 font-mono font-bold">${t.currentPrice.toLocaleString()}</span> • 
                          Quy mô: <span className="text-slate-350 font-mono">{t.assetClass === 'forex' ? `${t.lots} Lots` : `${t.units.toLocaleString()} Units`}</span>
                        </p>
                      </div>
                    </div>

                    {/* Outcome P&L and warning */}
                    <div className="flex items-center sm:text-right flex-row sm:flex-col gap-2 sm:gap-1.5 justify-start w-full sm:w-auto self-stretch sm:self-center">
                      <div className="flex items-baseline gap-1 sm:justify-end">
                        <span className={`font-mono font-extrabold text-sm ${isWon ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {isWon ? '+' : '-'}${Math.abs(t.pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Warning badges */}
                      <div className="flex gap-1">
                        {t.uncheckedWarning && (
                          <span className="text-[8px] bg-amber-950/30 border border-amber-900/45 text-amber-500 font-bold px-1.5 rounded-sm">
                            VÀO LỆNH THIẾU KỶ LUẬT
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteClosedTrade(t.id)}
                          className="text-slate-600 hover:text-rose-450 p-0.5 ml-2 transition"
                          title="Xóa dòng lịch sử"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* DISCIPLINE HISTORY & INTUITIVE STATS SECTION */}
      <div id="discipline-history-daily-limit-section" className="space-y-4 pt-4 mt-8">
        <div className="flex items-center justify-between pb-2 border-b border-slate-805">
          <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4 text-violet-400" />
            Phân Tích Kỷ Luật (Pro Trader) & Chỉ Số Tuân Thủ Daily Limit ({mappedDisciplineLogs.length})
          </h3>
          {onClearDisciplineLogs && mappedDisciplineLogs.length > 0 && (
            <button
              onClick={() => {
                setShowResetLogsModal(true);
                setResetPhraseInput('');
              }}
              className="px-3 py-1.5 bg-rose-950/45 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 rounded-xl text-[11px] font-black cursor-pointer transition duration-150 flex items-center gap-1.5 shadow-md shadow-rose-950/20 uppercase tracking-wider"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Phân Tích Kỷ Luật
            </button>
          )}
        </div>

        {mappedDisciplineLogs.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl bg-[#14171F]/10">
            <Calendar className="w-6 h-6 text-slate-700 mx-auto mb-2" />
            <p className="text-[11px] text-slate-400">Chưa ghi nhận ngày giao dịch nào có thiết lập Daily Limit.</p>
            <p className="text-[10px] text-slate-600 mt-1">Cài đặt Daily Limit (%) ở Tab tính toán & vào vị thế để bắt đầu lưu trữ kỷ luật.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Discipline KPI Cards */}
            {(() => {
              const totalDays = mappedDisciplineLogs.length;
              const breachedDays = mappedDisciplineLogs.filter(l => l.isExceeded).length;
              const disciplinedDays = totalDays - breachedDays;
              const score = totalDays > 0 ? Math.round((disciplinedDays / totalDays) * 100) : 100;

              let feedbackText = "Thật tuyệt vời! Bạn đang kiểm soát rủi ro cực tốt.";
              let feedbackColor = "text-emerald-400";
              let ratingText = "KỶ LUẬT THÉP";
              let progressColor = "bg-emerald-500";
              
              if (score < 50) {
                feedbackText = "Báo động nghiêm trọng! Bạn cần phải dừng việc liên tục overtrade và phá luật ngày.";
                feedbackColor = "text-rose-400";
                ratingText = "VÔ KỶ LUẬT";
                progressColor = "bg-rose-500";
              } else if (score < 80) {
                feedbackText = "Tương đối ổn, tuy nhiên vẫn còn một số ngày buông lỏng kỷ luật rủi ro.";
                feedbackColor = "text-yellow-400";
                ratingText = "TRUNG BÌNH";
                progressColor = "bg-yellow-500";
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Total Traded Days */}
                  <div className="bg-[#14171F] border border-slate-800/60 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Giao dịch</span>
                      <span className="text-base font-mono font-black text-slate-100">{totalDays} Ngày</span>
                    </div>
                  </div>

                  {/* Safe Disciplined Days */}
                  <div className="bg-[#14171F] border border-slate-800/60 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-wider block">An Toàn</span>
                      <span className="text-base font-mono font-black text-emerald-450">{disciplinedDays} Ngày</span>
                    </div>
                  </div>

                  {/* Breached Danger Days */}
                  <div className="bg-[#14171F] border border-slate-800/60 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-955 border border-rose-900 text-rose-400">
                      <AlertCircle className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-500/80 font-bold uppercase tracking-wider block">Vượt Giới Hạn</span>
                      <span className="text-base font-mono font-black text-rose-550">{breachedDays} Ngày</span>
                    </div>
                  </div>

                  {/* Discipline Score Indicator */}
                  <div className="bg-[#14171F] border border-slate-800/50 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Chỉ Số Tuân Thủ</span>
                      <span className={`text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded border ${feedbackColor} border-current bg-[#1C212D]/55`}>
                        {ratingText}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xl font-mono font-black text-white">{score}%</span>
                      <span className="text-[10px] text-slate-500">tổng điểm</span>
                    </div>
                    {/* Tiny visual progress bar */}
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2 border border-slate-805">
                      <div className={`h-full ${progressColor}`} style={{ width: `${score}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Daily limit historical table */}
            <div className="bg-[#14171F] border border-slate-800/65 rounded-2xl overflow-hidden">
              <div className="divide-y divide-slate-805">
                {mappedDisciplineLogs.map((log) => {
                  const dObj = new Date(log.date);
                  const formattedDate = isNaN(dObj.getTime())
                    ? log.date
                    : dObj.toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });

                  return (
                    <div
                      key={log.date}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#1C212D]/10 transition-all ${
                        log.isExceeded 
                          ? 'border-l-4 border-l-red-500/70 bg-red-950/5' 
                          : 'border-l-4 border-l-emerald-500/50 bg-emerald-955/[0.01]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border shrink-0 ${
                          log.isExceeded 
                            ? 'bg-red-955/20 border-red-950/30 text-red-400' 
                            : 'bg-emerald-955/20 border-emerald-900/30 text-emerald-450'
                        }`}>
                          {log.isExceeded ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-200">{formattedDate}</span>
                            <span className="text-[9px] text-slate-400 font-mono">({log.date})</span>
                            {log.breachedByForce && (
                              <span className="text-[8px] bg-red-900/35 border border-red-800/40 text-red-300 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide">
                                Đã Ép Vào Lệnh
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <span>Giới hạn cho phép: <strong className="text-slate-400 font-mono">${log.allowedLimit.toLocaleString('en-US', { maximumFractionDigits: 1 })}</strong></span>
                            <span className="text-slate-700 font-bold">•</span>
                            <span>Sức chịu rủi ro đã dùng: <strong className={log.isExceeded ? 'text-red-400 font-mono font-bold' : 'text-emerald-400 font-mono font-bold'}>${log.totalRisk.toLocaleString('en-US', { maximumFractionDigits: 1 })}</strong></span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center sm:text-right flex-row sm:flex-col gap-2 justify-between sm:justify-start">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                          log.isExceeded 
                            ? 'bg-red-950/20 border-red-905/40 text-red-400' 
                            : 'bg-emerald-950/20 border-emerald-905/40 text-emerald-450'
                        }`}>
                          {log.isExceeded ? 'VƯỢT GIỚI HẠN (VI PHẠM)' : 'KỶ LUẬT AN TOÀN'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RESET CONFIRMATION MODAL */}
      <AnimatePresence>
        {showResetLogsModal && (
          <div className="fixed inset-0 bg-[#06080C]/90 backdrop-blur-md flex items-center justify-center p-4 z-110">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="bg-[#14171F] border border-red-500/40 rounded-2xl p-6 sm:p-7 max-w-md sm:max-w-[490px] w-full shadow-2xl relative overflow-hidden text-center"
            >
              <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="mx-auto w-12 h-12 rounded-xl bg-red-955/45 border border-red-900/30 text-rose-400 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="text-red-450 font-black text-base sm:text-lg uppercase tracking-widest font-sans flex items-center justify-center gap-1.5 animate-pulse">
                Xác nhận khôi phục
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-100 font-extrabold font-sans mt-2">
                Bạn có thật sự muốn bỏ Daily Limit không?
              </p>

              <div className="mt-4 p-4 bg-[#1C212D]/85 border border-red-900/30 rounded-xl text-left text-xs sm:text-[13px] leading-relaxed text-slate-300 font-semibold">
                Toàn bộ dữ liệu lịch sử tuân thủ, điểm số kỷ luật, và hành trình rèn luyện rủi ro ngày của bạn sẽ bị xoá sạch vĩnh viễn và không thể khôi phục lại.
              </div>

              <div className="mt-4 space-y-2.5">
                <p className="text-xs text-slate-350 font-sans font-semibold leading-relaxed">
                  Để xác minh việc này, bạn bắt buộc phải gõ chính xác dòng chữ dưới đây:
                </p>
                <div className="bg-[#1C212D] px-3.5 py-2.5 text-xs font-mono text-[#F43F5E] select-none font-black tracking-widest border border-red-950/50 rounded-xl text-center">
                  Tôi chấp nhận làm lại từ đầu
                </div>
                <input
                  type="text"
                  placeholder="Gõ chính xác dòng chữ trên tại đây..."
                  value={resetPhraseInput}
                  onChange={(e) => setResetPhraseInput(e.target.value)}
                  className="w-full bg-[#1C212D]/95 border border-slate-705 text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-[#EF4444]/20 font-sans text-xs sm:text-sm font-semibold text-center py-2.5 px-3.5 rounded-xl transition duration-150"
                  autoFocus
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowResetLogsModal(false)}
                  className="py-2.5 px-4 bg-[#1e2330] hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-xs font-black rounded-xl cursor-pointer transition duration-150 uppercase tracking-wider"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={resetPhraseInput !== "Tôi chấp nhận làm lại từ đầu"}
                  onClick={() => {
                    if (onClearDisciplineLogs) {
                      onClearDisciplineLogs();
                    }
                    setShowResetLogsModal(false);
                    setResetPhraseInput('');
                  }}
                  className={`py-2.5 px-4 border text-xs font-black rounded-xl transition duration-150 uppercase tracking-wider select-none ${
                    resetPhraseInput === "Tôi chấp nhận làm lại từ đầu"
                      ? "bg-red-950/30 hover:bg-red-900/60 border-red-800 text-red-300 cursor-pointer shadow-lg shadow-red-950/20"
                      : "bg-[#14171F] border-slate-800 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  Xoá lịch sử
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
