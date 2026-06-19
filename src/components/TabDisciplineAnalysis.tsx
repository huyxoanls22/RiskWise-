import React, { useMemo, useState } from 'react';
import { useAuth } from './AuthProvider';
import PaywallModal from './PaywallModal';
import { PortfolioTrade, DailyLimitLog } from '../types';
import {
  Crown,
  Lock,
  Scale,
  Flame,
  FolderOpen,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  HeartCrack,
  Sparkles,
  AlertOctagon,
  Brain,
  History,
  FileSpreadsheet,
  Gauge,
  Calendar,
  Frown,
  Activity,
  Smile,
  AlertTriangle,
  FileText,
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  CreditCard
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend
} from 'recharts';

interface TabDisciplineAnalysisProps {
  activeTrades: PortfolioTrade[];
  closedTrades: PortfolioTrade[];
  dailyDisciplineLogs: DailyLimitLog[];
}

export default function TabDisciplineAnalysis({
  activeTrades,
  closedTrades,
  dailyDisciplineLogs
}: TabDisciplineAnalysisProps) {
  const { login, isPremium } = useAuth();
  const [paywallOpen, setPaywallOpen] = useState(false);

  // States for unified inline paywall
  const [selectedPlanInline, setSelectedPlanInline] = useState<'monthly' | 'yearly'>('yearly');
  const [copiedTextInline, setCopiedTextInline] = useState(false);
  const [copiedFieldName, setCopiedFieldName] = useState<string | null>(null);
  const [emailInline, setEmailInline] = useState('');
  const [activationKeyInline, setActivationKeyInline] = useState('');
  const [isSuccessInline, setIsSuccessInline] = useState(false);

  const currentPriceInline = selectedPlanInline === 'monthly' ? '199.000 VNĐ' : '999.000 VNĐ';
  const rawPriceInlineVal = selectedPlanInline === 'monthly' ? '199.000' : '999.000';
  const transferMsgInline = useMemo(() => {
    const planName = selectedPlanInline === 'monthly' ? 'thang' : 'nam';
    const emailStr = emailInline.trim() || 'email-cua-ban';
    const partnerRef = typeof window !== 'undefined' ? localStorage.getItem('rw_ref_partner') : null;
    const refStr = partnerRef ? ` ${partnerRef.toUpperCase()}` : '';
    return `goi ${planName} ${emailStr}${refStr}`;
  }, [selectedPlanInline, emailInline]);

  // Dynamic live VietQR code URL containing amount and transfer message
  const qrCodeUrl = useMemo(() => {
    const bank = 'TCB';
    const accountNo = '19050048400017';
    const amountVal = selectedPlanInline === 'monthly' ? '199000' : '999000';
    const accountName = encodeURIComponent('BE QUANG HUY');
    const addInfo = encodeURIComponent(transferMsgInline);
    return `https://img.vietqr.io/image/${bank}-${accountNo}-qr_only.png?amount=${amountVal}&addInfo=${addInfo}&accountName=${accountName}`;
  }, [selectedPlanInline, transferMsgInline]);

  const handleCopyMemoInline = () => {
    navigator.clipboard.writeText(transferMsgInline);
    setCopiedTextInline(true);
    setTimeout(() => setCopiedTextInline(false), 2000);
  };

  const handleCopyFieldInline = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFieldName(fieldKey);
    setTimeout(() => setCopiedFieldName(null), 2000);
  };

  const handleActivateProInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInline) {
      alert('Vui lòng nhập Email để kích hoạt bản Pro!');
      return;
    }
    
    setIsSuccessInline(true);
    // Complete the login with custom license key or generate one
    const usedKey = activationKeyInline.trim() || ('RWP-PREMIUM-' + Math.random().toString(36).substr(2, 9).toUpperCase());
    
    setTimeout(() => {
      login(emailInline, 'Pro Trader', usedKey);
      setIsSuccessInline(false);
    }, 1500);
  };

  const allTrades = useMemo(() => {
    return [...activeTrades, ...closedTrades].sort(
      (a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime()
    );
  }, [activeTrades, closedTrades]);

  // Total Trades count
  const totalTrades = allTrades.length;

  // 1. FREE PLAN METRICS
  
  // Discipline Score (%) = (Trades with absolutely no warnings / Total Trades) * 100
  const disciplineScore = useMemo(() => {
    if (totalTrades === 0) return 100;
    const correctTradesCount = allTrades.filter(t => !t.uncheckedWarning).length;
    return Math.round((correctTradesCount / totalTrades) * 100);
  }, [allTrades, totalTrades]);

  // Consecutive Discipline Streak: Consecutive days without infractions backwards
  const disciplineStreak = useMemo(() => {
    if (totalTrades === 0) return 0;
    
    // Sort trades chronologically ascending to calculate day-by-day behavior
    const tradesAsc = [...allTrades].sort(
      (a, b) => new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime()
    );

    // Group trades by calendar date
    const tradesByDay: { [dateStr: string]: PortfolioTrade[] } = {};
    tradesAsc.forEach(t => {
      const dayStr = t.enteredAt.split('T')[0];
      if (!tradesByDay[dayStr]) tradesByDay[dayStr] = [];
      tradesByDay[dayStr].push(t);
    });

    // Get sorted array of unique trading days (descending, starting from the most recent)
    const tradingDaysSorted = Object.keys(tradesByDay).sort((a, b) => b.localeCompare(a));
    
    let streak = 0;
    for (const day of tradingDaysSorted) {
      const fileTrades = tradesByDay[day];
      // Check if there was any infraction (unchecked warning or bad emotion on this day)
      const hasInfraction = fileTrades.some(t => t.uncheckedWarning);
      if (!hasInfraction) {
        streak++;
      } else {
        break; // break streak on first infraction day
      }
    }
    return streak;
  }, [allTrades, totalTrades]);

  // Setup Categories: Lệnh Đúng Kế Hoạch vs Ngoài Kế Hoạch
  const setupCategories = useMemo(() => {
    const dungKeHoach = allTrades.filter(t => !t.uncheckedWarning);
    const ngoaiKeHoach = allTrades.filter(t => t.uncheckedWarning);
    return {
      dungKeHoach,
      ngoaiKeHoach
    };
  }, [allTrades]);

  // Rule Completion Rate (%) = Percentage of trades with completed checklists
  const ruleCompletionRate = useMemo(() => {
    if (totalTrades === 0) return 100;
    const completedChecklistCount = allTrades.filter(t => !t.uncheckedWarning).length;
    return Math.round((completedChecklistCount / totalTrades) * 100);
  }, [allTrades, totalTrades]);

  // 2. PREMIUM PLAN METRICS

  // A. Correlation Metrics (Winrate & Profit Factor of Disciplined vs Undisciplined Trades)
  const correlationMetrics = useMemo(() => {
    const calculateStats = (trades: PortfolioTrade[]) => {
      const closed = trades.filter(t => t.status === 'won' || t.status === 'lost');
      if (closed.length === 0) {
        return { winrate: 0, profitFactor: 0, totalPnl: 0, count: trades.length };
      }
      const won = closed.filter(t => t.status === 'won' || t.pnl > 0);
      const winrate = Math.round((won.length / closed.length) * 100);

      const grossProfit = closed.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
      const grossLoss = Math.abs(closed.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
      const profitFactor = grossLoss === 0 
        ? (grossProfit > 0 ? 99.9 : 0) 
        : Math.round((grossProfit / grossLoss) * 100) / 100;
      
      const totalPnl = Math.round(trades.reduce((sum, t) => sum + t.pnl, 0) * 100) / 100;

      return { winrate, profitFactor, totalPnl, count: trades.length };
    };

    return {
      dung: calculateStats(setupCategories.dungKeHoach),
      ngoai: calculateStats(setupCategories.ngoaiKeHoach)
    };
  }, [setupCategories]);

  // B. Emotion performance breakdown
  const emotionStats = useMemo(() => {
    const emotions = ['Bình tĩnh', 'Hưng phấn', 'Sợ hãi', 'FOMO', 'Cay cú/Trả thù'];
    return emotions.map(emotion => {
      const trades = allTrades.filter(t => t.emotion === emotion);
      const closed = trades.filter(t => t.status === 'won' || t.status === 'lost');
      const won = closed.filter(t => t.status === 'won' || t.pnl > 0);
      const winrate = closed.length > 0 ? Math.round((won.length / closed.length) * 100) : 0;
      const totalPnl = Math.round(trades.reduce((sum, t) => sum + t.pnl, 0) * 100) / 100;

      return {
        name: emotion,
        count: trades.length,
        winrate,
        totalPnl
      };
    });
  }, [allTrades]);

  // C. Danger Times (Khung giờ & Thứ vi phạm nhiều nhất)
  const dangerPeriods = useMemo(() => {
    const hourlyInfractions: { [key: number]: { total: number; bad: number } } = {};
    const dailyInfractions: { [key: number]: { total: number; bad: number } } = {};

    allTrades.forEach(t => {
      try {
        const d = new Date(t.enteredAt);
        const hour = d.getHours();
        const day = d.getDay(); // 0 is CN, 1 is T2...

        const isBad = t.uncheckedWarning || t.emotion === 'FOMO' || t.emotion === 'Cay cú/Trả thù';

        if (!hourlyInfractions[hour]) hourlyInfractions[hour] = { total: 0, bad: 0 };
        hourlyInfractions[hour].total++;
        if (isBad) hourlyInfractions[hour].bad++;

        if (!dailyInfractions[day]) dailyInfractions[day] = { total: 0, bad: 0 };
        dailyInfractions[day].total++;
        if (isBad) dailyInfractions[day].bad++;
      } catch {}
    });

    let worstHour = -1;
    let maxHourInfractionRate = 0;
    let worstHourCount = 0;
    
    Object.keys(hourlyInfractions).forEach(hKey => {
      const h = parseInt(hKey);
      const rate = hourlyInfractions[h].bad / (hourlyInfractions[h].total || 1);
      if (rate > maxHourInfractionRate || (rate === maxHourInfractionRate && hourlyInfractions[h].bad > worstHourCount)) {
        maxHourInfractionRate = rate;
        worstHour = h;
        worstHourCount = hourlyInfractions[h].bad;
      }
    });

    const vietDays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    let worstDay = -1;
    let maxDayInfractionRate = 0;
    let worstDayCount = 0;

    Object.keys(dailyInfractions).forEach(dKey => {
      const d = parseInt(dKey);
      const rate = dailyInfractions[d].bad / (dailyInfractions[d].total || 1);
      if (rate > maxDayInfractionRate || (rate === maxDayInfractionRate && dailyInfractions[d].bad > worstDayCount)) {
        maxDayInfractionRate = rate;
        worstDay = d;
        worstDayCount = dailyInfractions[d].bad;
      }
    });

    return {
      worstHourStr: worstHour >= 0 ? `${worstHour}h:00` : 'Chưa có',
      worstHourRate: Math.round(maxHourInfractionRate * 100),
      worstDayStr: worstDay >= 0 ? vietDays[worstDay] : 'Chưa có',
      worstDayRate: Math.round(maxDayInfractionRate * 100)
    };
  }, [allTrades]);

  // D. Bad habits after streak losses (Hành Vi Khi Thua Chuỗi - THUẬT TOÁN ĐỌC VỊ RISK %)
  const streakLossAnalysis = useMemo(() => {
    // Sort closed trades chronologically ascending
    const sortedClosed = [...closedTrades].sort(
      (a, b) => new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime()
    );

    // Get the risk ratio (%) for a trade
    const getTradeRiskPercent = (t: PortfolioTrade) => {
      return t.riskPercent || Math.max(0.1, Math.round((t.riskAmount / 10000) * 100 * 10) / 10);
    };

    // Detect which indexes belong to a loss streak of 3 or more consecutive negative results
    const isStreakIndex = new Array(sortedClosed.length).fill(false);
    let tempLossStreakIndices: number[] = [];

    for (let i = 0; i < sortedClosed.length; i++) {
      const isLoss = sortedClosed[i].status === 'lost' || sortedClosed[i].pnl < 0;
      if (isLoss) {
        tempLossStreakIndices.push(i);
      } else {
        if (tempLossStreakIndices.length >= 3) {
          tempLossStreakIndices.forEach(idx => {
            isStreakIndex[idx] = true;
          });
        }
        tempLossStreakIndices = [];
      }
    }
    if (tempLossStreakIndices.length >= 3) {
      tempLossStreakIndices.forEach(idx => {
        isStreakIndex[idx] = true;
      });
    }

    // Filter "sober" trades (outside any loss streak of 3 or more)
    const soberTrades = sortedClosed.filter((_t, idx) => !isStreakIndex[idx]);
    
    // Average Risk % during sober periods
    const avgSoberRiskPercent = soberTrades.length > 0
      ? (soberTrades.reduce((sum, t) => sum + getTradeRiskPercent(t), 0) / soberTrades.length)
      : (sortedClosed.reduce((sum, t) => sum + getTradeRiskPercent(t), 0) / (sortedClosed.length || 1));

    let loseStreakCount = 0;
    let totalStreakTriggers = 0;
    let countNoiRisk = 0; // "Tự ý nhồi tăng rủi ro tài khoản" (Risk % next > 1.5x avg sober Risk %)
    let countSkipChecklist = 0; // "Bỏ qua checklist" (uncheckedWarning === true)
    let countAngryEmotion = 0; // "Cảm xúc tệ" (emotion === 'Cay cú/Trả thù')

    for (let i = 0; i < sortedClosed.length; i++) {
      const isLoss = sortedClosed[i].status === 'lost' || sortedClosed[i].pnl < 0;
      if (isLoss) {
        loseStreakCount++;
      } else {
        loseStreakCount = 0;
      }

      // If they touched a streak of >= 3 consecutive losses, check the NEXT trade immediately
      if (loseStreakCount >= 3) {
        if (i < sortedClosed.length - 1) {
          totalStreakTriggers++;
          const nextTrade = sortedClosed[i + 1];
          const nextRiskPercent = getTradeRiskPercent(nextTrade);

          // 1. Tự ý nhồi tăng rủi ro tài khoản (greater than 1.5 times the sober average)
          if (nextRiskPercent > avgSoberRiskPercent * 1.5) {
            countNoiRisk++;
          }
          // 2. Bỏ qua checklist (uncheckedWarning is true)
          if (nextTrade.uncheckedWarning === true) {
            countSkipChecklist++;
          }
          // 3. Cảm xúc tệ (emotion is 'Cay cú/Trả thù')
          if (nextTrade.emotion === 'Cay cú/Trả thù') {
            countAngryEmotion++;
          }
        }
      }
    }

    const pctTangSL = totalStreakTriggers > 0 ? Math.round((countNoiRisk / totalStreakTriggers) * 100) : 0;
    const pctBoChecklist = totalStreakTriggers > 0 ? Math.round((countSkipChecklist / totalStreakTriggers) * 100) : 0;
    const pctCayCuVal = totalStreakTriggers > 0 ? Math.round((countAngryEmotion / totalStreakTriggers) * 100) : 0;

    return {
      totalStreakTriggers,
      pctTangSL,
      pctBoChecklist,
      pctCayCuVal,
      avgSoberRiskPercent: Math.round(avgSoberRiskPercent * 100) / 100
    };
  }, [closedTrades]);

  // E. Expert System Reports (Thuật toán if/else dịch thuật hành vi)
  const expertReports = useMemo(() => {
    const reports: string[] = [];
    
    // 1. winRate_FOMO < winRate_BìnhTĩnh * 0.6
    const calmTrades = allTrades.filter(t => t.emotion === 'Bình tĩnh');
    const calmClosed = calmTrades.filter(t => t.status === 'won' || t.status === 'lost');
    const calmWon = calmClosed.filter(t => t.pnl > 0);
    const winRate_Calm = calmClosed.length > 0 ? (calmWon.length / calmClosed.length) : 0;

    const fomoTrades = allTrades.filter(t => t.emotion === 'FOMO');
    const fomoClosed = fomoTrades.filter(t => t.status === 'won' || t.status === 'lost');
    const fomoWon = fomoClosed.filter(t => t.pnl > 0);
    const winRate_FOMO = fomoClosed.length > 0 ? (fomoWon.length / fomoClosed.length) : 0;

    if (fomoClosed.length > 0 && calmClosed.length > 0) {
      if (winRate_FOMO < winRate_Calm * 0.6) {
        reports.push('🚨 BÁO CÁO KỶ LUẬT (Expert System): Lệnh FOMO của bạn đang thua gấp đôi lệnh bình tĩnh. Bạn đang tự cống nạp tiền cho thị trường do vào lệnh vội vã. Cân nhắc thêm bước kiểm tra cảm xúc vào bộ quy tắc.');
      }
    }

    // 2. vi_pham_buoi_sang > tong_vi_pham * 0.5
    let viPhanBuoiSangCount = 0;
    let totalInfractions = 0;

    allTrades.forEach(t => {
      const isBad = t.uncheckedWarning || t.emotion === 'FOMO' || t.emotion === 'Cay cú/Trả thù';
      if (isBad) {
        totalInfractions++;
        try {
          const hour = new Date(t.enteredAt).getHours();
          if (hour >= 5 && hour < 12) {
            viPhanBuoiSangCount++;
          }
        } catch {}
      }
    });

    if (totalInfractions > 0 && viPhanBuoiSangCount > totalInfractions * 0.5) {
      reports.push('🚨 BÁO CÁO KỶ LUẬT (Expert System): Hơn 50% số lệnh vi phạm của bạn xảy ra trong buổi sáng. Buổi chiều bạn giao dịch kỷ luật hơn nhiều. Cân nhắc thêm bước kiểm tra cảm xúc vào checklist.');
    }

    // 3. ty_le_tang_risk_sau_chuoi_thua > 50 (represented by streakLossAnalysis.pctTangSL)
    if (streakLossAnalysis.pctTangSL > 50) {
      reports.push('🚨 BÁO CÁO KỶ LUẬT (Expert System): Bạn dính pattern tự sát Nhồi Rủi Ro Trả Thù. Dữ liệu ghi nhận cứ sau chuỗi thua 3 lệnh, bạn lập tức đẩy mức Risk % tài khoản lên rất cao để gỡ gạc. Phương pháp không sai, bạn cháy tài khoản hoàn toàn vì Cay Cú!');
    }

    // 4. Điểm Số Kỷ Luật > 85% và lệnh >= 15
    if (disciplineScore > 85 && totalTrades >= 15) {
      reports.push('👑 BÁO CÁO KỶ LUẬT (Expert System): Tâm lý và kỷ luật của bạn đạt trạng thái Pro Trader. Lợi nhuận đường dài chỉ là vấn đề thời gian.');
    }

    if (reports.length === 0) {
      if (totalTrades < 5) {
        reports.push('📈 KIỂM ĐỊNH CHUNG: Hãy ghi nhận từ 5 lệnh trở lên để kích hoạt hệ thống chẩn đoán hành vi tự động bằng Expert System.');
      } else {
        reports.push('📈 KIỂM ĐỊNH CHUNG: Các số liệu kỷ luật cơ bản ở mức ổn định. Tiếp tục lưu lại nhật ký hành vi xúc cảm để thuật toán Expert System của RiskWise quét sâu hơn trong vòng 5 ngày tới.');
      }
    }

    return reports;
  }, [allTrades, totalTrades, streakLossAnalysis, disciplineScore]);

  const handlePremiumBlockClick = () => {
    if (!isPremium) {
      setPaywallOpen(true);
    }
  };

  return (
    <div className="space-y-6 w-full text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-amber-500" />
            Phân Tích Kỷ Luật (Pro Trader)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Chẩn đoán tâm lý lý tính, kiểm toán hành vi tự nhồi gỡ và bóc trần nguyên nhân cháy tài khoản từ dữ liệu thực
          </p>
        </div>

        {isPremium ? (
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/35 py-1.5 px-3.5 rounded-xl font-bold text-xs text-amber-400 w-fit">
            <Crown className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
            TÀI KHOẢN PREMIUM HÀNH VI
          </div>
        ) : (
          <button
            onClick={() => setPaywallOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 py-2 px-4 rounded-xl font-black text-xs transition cursor-pointer shadow-lg tracking-wider"
          >
            <Crown className="w-4 h-4 fill-slate-950 text-slate-950 shrink-0" />
            NÂNG CẤP PREMIUM (CHỈ 199.000đ)
          </button>
        )}
      </div>

      {/* --------------------- SECTION 1: MIỄN PHÍ (FLAT DISCIPLINE STATS) --------------------- */}
      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
        <Activity className="w-4 h-4 text-emerald-400" />
        CHỈ SỐ HÀNH VI CƠ BẢN (Bản FREE)
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Discipline Score */}
        <div className="bg-[#0f1322] border border-slate-800 p-4 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 text-slate-100 group-hover:scale-110 transition duration-300">
            <Gauge className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Điểm Số Kỷ Luật</span>
            <div className={`p-1.5 rounded-lg border text-xs font-bold ${
              disciplineScore >= 80 ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
              disciplineScore >= 50 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
              'bg-rose-500/15 border-rose-500/30 text-rose-400'
            }`}>
              {disciplineScore}%
            </div>
          </div>
          <div>
            <span className="text-3xl font-black font-mono text-white leading-none">{disciplineScore}%</span>
            <p className="text-[10px] text-slate-400 mt-1 lines-clamp-1 leading-normal">
              % Lệnh đạt chuẩn 100% checklist tiêu chuẩn trước lệnh.
            </p>
          </div>
        </div>

        {/* Metric 2: Streak counter day-based */}
        <div className="bg-[#0f1322] border border-slate-800 p-4 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 text-slate-100 group-hover:scale-110 transition duration-300">
            <Flame className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Chuỗi Kỷ Luật Liên Tiếp</span>
            <div className="p-1.5 rounded-lg border border-orange-500/20 bg-orange-500/10 text-orange-400">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black font-mono text-orange-400 leading-none">{disciplineStreak} ngày</span>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              Chuỗi ngày giao dịch sạch bóng mọi vi phạm bỏ quy tắc.
            </p>
          </div>
        </div>

        {/* Metric 3: Rule Completion Rate */}
        <div className="bg-[#0f1322] border border-slate-800 p-4 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 text-slate-100 group-hover:scale-110 transition duration-300">
            <ShieldCheck className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Lệnh Đúng Quy Tắc</span>
            <div className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/10 text-slate-300">
              <History className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black font-mono text-white leading-none">{ruleCompletionRate}%</span>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              % Tỷ lệ giao dịch thực tế tuân thủ bộ quy tắc nghiêm ngặt.
            </p>
          </div>
        </div>

        {/* Metric 4: Total Trades volume */}
        <div className="bg-[#0f1322] border border-slate-800 p-4 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 text-slate-100 group-hover:scale-110 transition duration-300">
            <FolderOpen className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Tổng Vị Thế Nhật Ký</span>
            <div className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/10 text-slate-300">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black font-mono text-white leading-none">{totalTrades} lệnh</span>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              Số lượng dữ liệu tập mẫu hành vi thực tế đã ghi nhận.
            </p>
          </div>
        </div>
      </div>

      {/* Visual representation of categorized plan lists */}
      <div className="bg-[#0f1322] border border-slate-800 rounded-2xl p-5 md:p-6 text-left">
        <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-emerald-400" />
          Danh Sách Lệnh Đúng/Ngoài Kế Hoạch (Miễn Phí)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lệnh Đúng Kế Hoạch */}
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Lệnh Đúng Kế Hoạch ({setupCategories.dungKeHoach.length})
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md">
                Kỷ Luật
              </span>
            </div>
            
            {setupCategories.dungKeHoach.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có vị thế kỷ luật nào được ghi sổ.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2 font-mono scrollbar-thin">
                {setupCategories.dungKeHoach.map(t => (
                  <div key={t.id} className="text-xs flex justify-between items-center bg-[#10142b] p-2 rounded border border-slate-800/40">
                    <span className="font-bold text-white uppercase">{t.ticker}</span>
                    <span className="text-slate-400">{t.direction === 'long' ? 'Mua' : 'Bán'}</span>
                    <span className={`font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                      {t.pnl >= 0 ? '+' : ''}{t.pnl.toLocaleString()} USD
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lệnh Ngoài Kế Hoạch */}
          <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-rose-450 tracking-wider flex items-center gap-1.5">
                <Frown className="w-4 h-4 text-rose-400" />
                Lệnh Ngoài Kế Hoạch ({setupCategories.ngoaiKeHoach.length})
              </span>
              <span className="text-[10px] font-mono font-bold bg-rose-500/10 text-rose-450 px-2 py-0.5 rounded-md">
                Vô Kỷ Luật
              </span>
            </div>

            {setupCategories.ngoaiKeHoach.length === 0 ? (
              <p className="text-xs text-[#10b981] italic">Tuyệt vời! Không phát hiện lệnh vi phạm bộ quy tắc.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2 font-mono scrollbar-thin">
                {setupCategories.ngoaiKeHoach.map(t => (
                  <div key={t.id} className="text-xs flex justify-between items-center bg-[#10142b] p-2 rounded border border-slate-800/40">
                    <span className="font-bold text-white uppercase">{t.ticker}</span>
                    <span className="text-slate-400">{t.direction === 'long' ? 'Mua' : 'Bán'}</span>
                    <span className={`font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                      {t.pnl >= 0 ? '+' : ''}{t.pnl.toLocaleString()} USD
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --------------------- SECTION 2: BẢN PREMIUM TRẢ PHÍ (GLASSMORPHIC SECURITY SHEATH) --------------------- */}
      <div className="pt-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          HỆ THỐNG KIỂM TOÁN NÂNG CAO (Premium Pro Trader Zone)
        </h3>
        
        <div className="relative rounded-2xl overflow-hidden min-h-[500px]">
          
          {!isPremium && (
            <div className="absolute inset-0 z-20 bg-[#060a16]/96 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0b0f19] border border-slate-800/80 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative text-left font-sans text-slate-100 space-y-5 max-h-[95vh] overflow-y-auto scrollbar-thin">
                
                {isSuccessInline ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
                    <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-12 h-12 animate-bounce" />
                    </div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">KÍCH HOẠT THÀNH CÔNG!</h3>
                    <p className="text-[11px] text-slate-300 leading-normal max-w-sm">
                      Chào mừng nhà giao dịch chuyên nghiệp! Bản Pro Premium đã được cấp phép hoạt động trực tiếp. Hệ thống phân tích hành vi nâng cao đã sẵn sàng!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Top Row: Plans selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Gói Tháng */}
                      <button
                        type="button"
                        onClick={() => setSelectedPlanInline('monthly')}
                        className={`text-left p-4 rounded-2xl border transition relative focus:outline-none flex flex-col justify-between h-[105px] cursor-pointer select-none ${
                          selectedPlanInline === 'monthly'
                            ? 'bg-[#111625] border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                            : 'bg-[#0e121f]/50 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">GÓI THÁNG</p>
                          <p className={`text-lg font-black ${selectedPlanInline === 'monthly' ? 'text-amber-400' : 'text-white'}`}>199.000 VNĐ</p>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Phù hợp trải nghiệm ngắn hạn, gia hạn hàng tháng.
                        </p>
                      </button>

                      {/* Gói Năm VIP */}
                      <button
                        type="button"
                        onClick={() => setSelectedPlanInline('yearly')}
                        className={`text-left p-4 rounded-2xl border transition relative focus:outline-none flex flex-col justify-between h-[105px] cursor-pointer select-none ${
                          selectedPlanInline === 'yearly'
                            ? 'bg-[#111625] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                            : 'bg-[#0e121f]/50 border-slate-800/80 hover:border-slate-705'
                        }`}
                      >
                        <div className="absolute top-0 left-4 -translate-y-1/2 bg-[#ff7a00] text-white text-[8px] font-black uppercase tracking-widest py-0.5 px-2.5 rounded-sm shadow">
                          TIẾT KIỆM 58%
                        </div>
                        <div>
                          <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#e2b13c] mb-0.5 flex items-center gap-1">
                            ✨ GÓI NĂM VIP
                          </p>
                          <p className="text-lg font-black text-[#e2b13c]">999.000 VNĐ</p>
                        </div>
                        <p className="text-[10px] text-slate-450 leading-snug font-medium">
                          (chỉ 83.250 VNĐ/ tháng) tiết kiệm ngay 58%
                        </p>
                      </button>
                    </div>

                    {/* Section 1: Hướng dẫn thanh toán chuyển khoản */}
                    <div className="border border-slate-800/80 bg-[#080d16] rounded-2xl p-4.5 space-y-3.5">
                      <div className="flex items-center gap-2 text-[#e2b13c] text-[10px] uppercase tracking-wider font-extrabold">
                        <CreditCard className="w-4 h-4" />
                        <span>HƯỚNG DẪN THANH TOÁN CHUYỂN KHOẢN</span>
                      </div>
                      <div className="border-t border-slate-800/60" />

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                        {/* Left Side: QR container */}
                        <div className="md:col-span-5 flex flex-col items-center justify-center space-y-2">
                          <div className="bg-white p-1 rounded-xl shadow-lg w-32 h-32 flex items-center justify-center relative overflow-hidden">
                            {/* Live High-Fidelity VietQR Image */}
                            <img 
                              src={qrCodeUrl} 
                              alt="VietQR Automatic Payment Code" 
                              className="w-full h-full object-contain select-none transition-all duration-300 hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          
                          <div className="flex items-center gap-1 text-[#e2b13c] text-[8.5px] font-black uppercase tracking-wider">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            QUÉT QR TỰ ĐỘNG SIÊU TỐC
                          </div>
                        </div>

                        {/* Right Side: Copy fields */}
                        <div className="md:col-span-7 space-y-2.5 text-[11px]">
                          {/* Ngân hàng */}
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-slate-400 font-semibold w-24 shrink-0">Ngân hàng:</span>
                            <div className="flex-1 bg-[#0c101c] border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between">
                              <span className="text-white font-bold font-mono">Techcombank</span>
                              <button
                                type="button"
                                onClick={() => handleCopyFieldInline('Techcombank', 'bank')}
                                className="text-slate-500 hover:text-[#e2b13c] transition ml-2 focus:outline-none cursor-pointer"
                              >
                                {copiedFieldName === 'bank' ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Số tài khoản */}
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-slate-400 font-semibold w-24 shrink-0">Số tài khoản:</span>
                            <div className="flex-1 bg-[#0c101c] border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between">
                              <span className="text-white font-bold font-mono tracking-wider">19050048400017</span>
                              <button
                                type="button"
                                onClick={() => handleCopyFieldInline('19050048400017', 'account')}
                                className="text-slate-500 hover:text-[#e2b13c] transition ml-2 focus:outline-none cursor-pointer"
                              >
                                {copiedFieldName === 'account' ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Chủ tài khoản */}
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-slate-400 font-semibold w-24 shrink-0">Chủ tài khoản:</span>
                            <div className="flex-1 bg-[#0c101c] border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between">
                              <span className="text-white font-bold font-mono">BE QUANG HUY</span>
                              <button
                                type="button"
                                onClick={() => handleCopyFieldInline('BE QUANG HUY', 'owner')}
                                className="text-slate-500 hover:text-[#e2b13c] transition ml-2 focus:outline-none cursor-pointer"
                              >
                                {copiedFieldName === 'owner' ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Số tiền */}
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-slate-400 font-semibold w-24 shrink-0">Số tiền:</span>
                            <div className="flex-1 bg-[#0c101c] border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between">
                              <span className="text-amber-400 font-bold font-mono tracking-wider">{currentPriceInline}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyFieldInline(selectedPlanInline === 'monthly' ? '199.000' : '999.000', 'amount')}
                                className="text-slate-500 hover:text-[#e2b13c] transition ml-2 focus:outline-none cursor-pointer"
                              >
                                {copiedFieldName === 'amount' ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cú pháp chuyển khoản info box */}
                      <div className="border border-amber-550/10 bg-amber-500/[0.02] p-3.5 rounded-xl space-y-2 text-xs leading-relaxed text-left">
                        <div className="font-bold text-amber-450 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                          <span>📌</span> CÚ PHÁP CHUYỂN KHOẢN:
                        </div>
                        <p className="text-slate-350 text-[11px] leading-relaxed">
                          Khách hàng mua gói vui lòng chuyển khoản với nội dung: <span className="text-amber-400 font-extrabold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Cú pháp chính xác</span> (ví dụ: <span className="text-white italic font-bold select-all">{transferMsgInline}</span>).
                        </p>
                        
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#060912] p-2 rounded-lg border border-slate-850">
                          <div className="space-y-0.5 text-left">
                            <span className="text-[8.5px] uppercase font-bold text-slate-500 block">Nội dung đề xuất chính xác cho bạn:</span>
                            <span className="font-mono font-bold text-amber-300 tracking-wide text-[11px] select-all">{transferMsgInline}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyMemoInline}
                            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-extrabold px-2.5 py-1 rounded-[6px] text-[10px] transition flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            {copiedTextInline ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                Đã copy!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy cú pháp
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Kích hoạt Premium Pro */}
                    <form onSubmit={handleActivateProInline} className="border border-slate-800/80 bg-[#080d16] rounded-2xl p-4.5 space-y-3.5">
                      <div className="flex items-center gap-2 text-amber-400 text-[10px] uppercase tracking-wider font-extrabold">
                        <span>👑</span> KÍCH HOẠT TÀI KHOẢN PREMIUM PRO
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            EMAIL ĐĂNG KÝ CẤP MÃ:
                          </label>
                          <input
                            type="email"
                            required
                            value={emailInline}
                            onChange={(e) => setEmailInline(e.target.value)}
                            placeholder="Nhập địa chỉ Email của bạn..."
                            className="w-full bg-[#0c101c] border border-slate-800/85 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            MÃ KÍCH HOẠT (LICENSE KEY PRO):
                          </label>
                          <input
                            type="text"
                            value={activationKeyInline}
                            onChange={(e) => setActivationKeyInline(e.target.value)}
                            placeholder="Nhập License Key Pro (RWP-...)"
                            className="w-full bg-[#0c101c] border border-slate-800/85 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 px-5 bg-[#f4800b] hover:bg-[#ff8f1c] text-slate-950 font-black rounded-xl text-[11px] tracking-wider transition-all cursor-pointer shadow-lg text-center select-none uppercase flex items-center justify-center gap-1.5 focus:outline-none"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        KÍCH HOẠT PRO
                      </button>
                    </form>
                  </>
                )}

              </div>
            </div>
          )}

          {/* Secure Content Block */}
          <div className={`space-y-6 ${!isPremium ? 'filter blur-[7px] select-none pointer-events-none' : ''}`}>
            
            {/* Grid metrics correlation + Danger time zone */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Card 1: Correlation Metrics (Winrate vs Profit Factor) */}
              <div className="lg:col-span-6 bg-[#0f1322] border border-slate-800 p-5 rounded-2xl text-left space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-500" />
                  Đối Chiếu Chuẩn Tương Quan Kỷ Luật – Kết Quả
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                    <span className="text-[10px] text-emerald-400 uppercase font-black block">Đúng Kế Hoạch</span>
                    <div>
                      <span className="text-2xl font-black font-mono text-white">{correlationMetrics.dung.winrate}%</span>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Tỷ lệ thắng (Winrate)</p>
                    </div>
                    <div>
                      <span className="text-lg font-black font-mono text-amber-400">{correlationMetrics.dung.profitFactor}</span>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Hệ số Lợi nhuận (PF)</p>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-2">
                    <span className="text-[10px] text-rose-455 uppercase font-black block">Ngoài Kế Hoạch</span>
                    <div>
                      <span className="text-2xl font-black font-mono text-white">{correlationMetrics.ngoai.winrate}%</span>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Tỷ lệ thắng (Winrate)</p>
                    </div>
                    <div>
                      <span className="text-lg font-black font-mono text-rose-400">{correlationMetrics.ngoai.profitFactor}</span>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Hệ số Lợi nhuận (PF)</p>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-450 leading-normal italic">
                  * Trực quan hóa giá trị khổng lồ của việc giữ kỷ luật: Nhóm lệnh Đúng Kế Hoạch luôn mang lại Profit Factor cực cao so với các giao dịch đột phát bộc phát.
                </p>
              </div>

              {/* Card 2: Danger Times */}
              <div className="lg:col-span-6 bg-[#0f1322] border border-slate-800 p-5 rounded-2xl text-left space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Khoảnh Khắc Nguy Hiểm Bốc Đồng
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-red-955/20 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Khung Giờ Nhạy Cảm</span>
                    <span className="text-xl font-black text-rose-400 block font-mono">{dangerPeriods.worstHourStr}</span>
                    <span className="text-[10.5px] text-slate-450 block leading-tight">
                      Tỷ lệ phá luật đạt mốc <strong className="text-rose-450">{dangerPeriods.worstHourRate}%</strong> trong khung giờ này.
                    </span>
                  </div>

                  <div className="p-3 bg-red-955/20 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Ngày Vi Phạm Nhiều Nhất</span>
                    <span className="text-xl font-black text-rose-400 block font-mono">{dangerPeriods.worstDayStr}</span>
                    <span className="text-[10.5px] text-slate-450 block leading-tight">
                      Xác suất xé checklist đạt đỉnh <strong className="text-rose-450">{dangerPeriods.worstDayRate}%</strong> vào ngày này.
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-450 leading-normal">
                  Hệ thống tìm ra điểm gãy kỷ luật của bạn trong tuần để cảnh báo tâm trạng cạn kiệt ý chí (Ego Depletion) vào những thời khắc nhạy cảm.
                </p>
              </div>
            </div>

            {/* Section 3: Emotion analysis with chart */}
            <div className="bg-[#0f1322] border border-slate-800 p-5 rounded-2xl block text-left space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                Phân Tích Thống Kê Cảm Xúc (Emotion ROI Engine)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Biểu đồ đo lường hiệu suất thắng/thua thắng (%) trên từng trạng thái cảm xúc tự khai báo trước khi bấm kích hoạt lệnh.
              </p>

              <div className="h-64 w-full pr-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emotionStats}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#11152a', border: '1px solid #1e293b', borderRadius: '12px' }} 
                      labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                    />
                    <Legend />
                    <Bar name="Tỉ Lệ Thắng (%)" dataKey="winrate" fill="#10b981">
                      {emotionStats.map((entry, index) => {
                        let barColor = "#10b981"; // calm
                        if (entry.name === 'FOMO') barColor = "#f59e0b"; // orange
                        if (entry.name === 'Cay cú/Trả thù') barColor = "#ef4444"; // red
                        if (entry.name === 'Hưng phấn') barColor = "#3b82f6"; // blue
                        if (entry.name === 'Sợ hãi') barColor = "#8b5cf6"; // purple
                        return <Cell key={`cell-${index}`} fill={barColor} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Section 4: Loss Streak Syndrome - Thuật toán Đọc Vị Risk % */}
            <div className="bg-[#0f1322] border border-slate-800 p-5 rounded-2xl text-left space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/50 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <HeartCrack className="w-4 h-4 text-rose-500" />
                  Hành Vi Khi Thua Chuỗi (Loss Streak Syndrome Auditor)
                </h4>
                <div className="text-[10px] text-slate-400 font-mono">
                  Mức Risk % trung bình lúc tỉnh táo: <span className="font-bold text-emerald-400">{streakLossAnalysis.avgSoberRiskPercent}%</span> / lệnh
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Metric A */}
                <div className="p-3 bg-red-955/10 border border-slate-850 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Tự ý nhồi tăng rủi ro tài khoản</span>
                    <span className="text-xs font-mono font-bold text-rose-400">{streakLossAnalysis.pctTangSL}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${streakLossAnalysis.pctTangSL}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                    Tần suất đẩy Risk % tài khoản lớn hơn 1.5 lần mức bình thường nhằm lấy lại vốn nhanh sau khi đã thua 3 lệnh liên tiếp.
                  </p>
                </div>

                {/* Metric B */}
                <div className="p-3 bg-red-955/10 border border-slate-850 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Bỏ qua checklist</span>
                    <span className="text-xs font-mono font-bold text-rose-400">{streakLossAnalysis.pctBoChecklist}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${streakLossAnalysis.pctBoChecklist}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                    Tần suất bấm bỏ qua kiểm duyệt checklist hoặc nới rộng khoảng gồng lỗ tự định đoạt khi gánh chịu áp lực thua chuỗi.
                  </p>
                </div>

                {/* Metric C */}
                <div className="p-3 bg-red-955/10 border border-slate-850 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-black">Cảm xúc tệ</span>
                    <span className="text-xs font-mono font-bold text-rose-400">{streakLossAnalysis.pctCayCuVal}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${streakLossAnalysis.pctCayCuVal}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                    Hiện diện của trạng thái xúc cảm tiêu cực nặng ("Cay cú/Trả thù") hoặc gỡ gạc nhanh ngay khi xuống tiền cho vị thế kế tiếp.
                  </p>
                </div>
              </div>
            </div>

            {/* Expert System: AI Behavior Diagnostic Block */}
            <div className="bg-[#0f1322] border border-amber-500/25 p-5 rounded-2xl text-left space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                <h4 className="text-xs font-extrabold uppercase text-amber-400 tracking-wider">
                  BÁO CÁO KỶ LUẬT CHUYÊN GIA (Expert System)
                </h4>
              </div>

              <div className="space-y-3 pt-1">
                {expertReports.map((reportStr, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3.5 rounded-xl border text-xs leading-relaxed font-sans ${
                      reportStr.startsWith('🚨') ? 'bg-rose-500/5 border-rose-500/15 text-rose-200' :
                      reportStr.startsWith('👑') ? 'bg-amber-500/5 border-amber-500/15 text-amber-300 font-bold shadow-sm' :
                      'bg-[#12162d] border-slate-800 text-slate-350 font-medium'
                    }`}
                  >
                    {reportStr}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      <PaywallModal 
        isOpen={paywallOpen} 
        onClose={() => setPaywallOpen(false)} 
      />
    </div>
  );
}
