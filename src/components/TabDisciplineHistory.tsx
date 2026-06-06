import React, { useMemo } from 'react';
import { PortfolioTrade, DailyLimitLog } from '../types';
import { 
  Lock, 
  Scale, 
  Flame, 
  FolderOpen, 
  ShieldCheck, 
  TrendingUp, 
  BarChart3, 
  Clock, 
  HeartCrack, 
  TrendingDown, 
  Download, 
  Sparkles,
  AlertOctagon,
  Brain,
  History
} from 'lucide-react';

interface TabDisciplineHistoryProps {
  activeTrades: PortfolioTrade[];
  closedTrades: PortfolioTrade[];
  dailyDisciplineLogs: DailyLimitLog[];
  isPremium: boolean;
  onTriggerPaywall: () => void;
}

export default function TabDisciplineHistory({
  activeTrades,
  closedTrades,
  dailyDisciplineLogs,
  isPremium,
  onTriggerPaywall
}: TabDisciplineHistoryProps) {

  const allTrades = useMemo(() => {
    return [...activeTrades, ...closedTrades].sort(
      (a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime()
    );
  }, [activeTrades, closedTrades]);

  // 1. FREE PLAN METRICS
  
  // Discipline Score (%) = (Trades with 100% checklist AND no Daily Stop violation / Total Trades) * 100
  const disciplineScore = useMemo(() => {
    if (allTrades.length === 0) return 100;
    
    // Count trades that didn't skip checklist and were not on breached days
    const breachedDates = new Set(
      dailyDisciplineLogs.filter(l => l.isExceeded || l.breachedByForce).map(l => l.date)
    );

    const disciplinedCount = allTrades.filter(t => {
      const isChecklistOk = !t.uncheckedWarning;
      const tradeDate = t.enteredAt.split('T')[0];
      const isDailyLimitOk = !breachedDates.has(tradeDate);
      return isChecklistOk && isDailyLimitOk;
    }).length;

    return Math.round((disciplinedCount / allTrades.length) * 100);
  }, [allTrades, dailyDisciplineLogs]);

  // Consecutive Discipline Streak (Consecutive days without infractions)
  const disciplineStreak = useMemo(() => {
    const sortedLogs = [...dailyDisciplineLogs].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    for (const log of sortedLogs) {
      if (!log.isExceeded && !log.breachedByForce) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [dailyDisciplineLogs]);

  // Folder Setup Categories: Lệnh Đúng Kế Hoạch vs Ngoài Kế Hoạch
  const setupCategories = useMemo(() => {
    const duongKeHoach = allTrades.filter(t => !t.uncheckedWarning);
    const ngoaiKeHoach = allTrades.filter(t => t.uncheckedWarning);
    return {
      duongKeHoach,
      ngoaiKeHoach
    };
  }, [allTrades]);

  // Rule Completion Rate (%)
  const ruleCompletionRate = useMemo(() => {
    if (allTrades.length === 0) return 100;
    const completedChecklistCount = allTrades.filter(t => !t.uncheckedWarning).length;
    return Math.round((completedChecklistCount / allTrades.length) * 100);
  }, [allTrades]);


  // 2. PREMIUM PLAN METRICS (Calculated dynamically, will be blurred for FREE)

  // Correlation: Discipline vs Results (Winrate & Profit Factor)
  const correlationMetrics = useMemo(() => {
    const calculateStats = (trades: PortfolioTrade[]) => {
      const closed = trades.filter(t => t.status === 'won' || t.status === 'lost');
      if (closed.length === 0) {
        return { 
          winrate: 0, 
          profitFactor: 0, 
          totalPnl: 0, 
          count: trades.length,
          maxWin: 0,
          maxLoss: 0,
          avgRisk: 0
        };
      }
      
      const won = closed.filter(t => t.status === 'won');
      const winrate = Math.round((won.length / closed.length) * 100);
      
      const grossProfit = closed.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
      const grossLoss = Math.abs(closed.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
      const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 99.9 : 0) : Math.round((grossProfit / grossLoss) * 100) / 100;
      const totalPnl = Math.round(trades.reduce((sum, t) => sum + t.pnl, 0) * 100) / 100;

      const pnlValues = closed.map(t => t.pnl);
      const maxWin = pnlValues.length > 0 ? Math.max(...pnlValues, 0) : 0;
      const maxLoss = pnlValues.length > 0 ? Math.min(...pnlValues, 0) : 0;
      const totalRisk = closed.reduce((sum, t) => sum + (t.riskAmount || 0), 0);
      const avgRisk = Math.round(totalRisk / closed.length);

      return { 
        winrate, 
        profitFactor, 
        totalPnl, 
        count: trades.length,
        maxWin,
        maxLoss,
        avgRisk
      };
    };

    return {
      disciplined: calculateStats(setupCategories.duongKeHoach),
      undisciplined: calculateStats(setupCategories.ngoaiKeHoach)
    };
  }, [setupCategories]);

  // Emotion Statistics Breakdown
  const emotionStats = useMemo(() => {
    const emotions = ['Bình tĩnh', 'Hưng phấn', 'Sợ hãi', 'FOMO', 'Cay cú/Trả thù'];
    return emotions.map(emotion => {
      const trades = allTrades.filter(t => t.emotion === emotion);
      const closed = trades.filter(t => t.status === 'won' || t.status === 'lost');
      const won = closed.filter(t => t.status === 'won');
      const winrate = closed.length > 0 ? Math.round((won.length / closed.length) * 100) : 0;
      const totalPnl = Math.round(trades.reduce((sum, t) => sum + t.pnl, 0) * 100) / 100;
      
      const wonTrades = closed.filter(t => t.pnl > 0);
      const lostTrades = closed.filter(t => t.pnl < 0);
      const avgWin = wonTrades.length > 0 ? Math.round(wonTrades.reduce((sum, t) => sum + t.pnl, 0) / wonTrades.length) : 0;
      const avgLoss = lostTrades.length > 0 ? Math.round(lostTrades.reduce((sum, t) => sum + t.pnl, 0) / lostTrades.length) : 0;

      const grossProfit = closed.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
      const grossLoss = Math.abs(closed.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
      const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 99.9 : 0) : Math.round((grossProfit / grossLoss) * 100) / 100;
      const payoffRatio = avgLoss === 0 ? 0 : Math.round((avgWin / Math.abs(avgLoss)) * 100) / 100;
      
      let ratioMultiplier = 0;
      if (avgWin > 0 && avgLoss < 0) {
        ratioMultiplier = Math.round((Math.abs(avgLoss) / avgWin) * 10) / 10;
      }

      return {
        name: emotion,
        count: trades.length,
        winrate,
        totalPnl,
        avgWin,
        avgLoss,
        profitFactor,
        payoffRatio,
        ratioMultiplier
      };
    });
  }, [allTrades]);

  // Ghost Hours & Dangerous Times (Khung giờ nhạy cảm)
  const ghostHoursInfo = useMemo(() => {
    const hourlyViolations: { [key: number]: { total: number; bad: number } } = {};
    const dailyViolations: { [key: number]: { total: number; bad: number } } = {};

    const breachedDates = new Set(
      dailyDisciplineLogs.filter(l => l.isExceeded || l.breachedByForce).map(l => l.date)
    );

    allTrades.forEach(t => {
      try {
        const d = new Date(t.enteredAt);
        const hour = d.getHours();
        const day = d.getDay(); // 0: CN, 1: Thứ 2...
        
        const isChecklistOk = !t.uncheckedWarning;
        const tradeDate = t.enteredAt.split('T')[0];
        const isDailyLimitOk = !breachedDates.has(tradeDate);
        
        // Discipline Infractions include checklist skips, daily size violations, or enter with emotional non-calm state
        const isBad = !isChecklistOk || !isDailyLimitOk || (t.emotion && t.emotion !== 'Bình tĩnh');

        if (!hourlyViolations[hour]) hourlyViolations[hour] = { total: 0, bad: 0 };
        hourlyViolations[hour].total++;
        if (isBad) hourlyViolations[hour].bad++;

        if (!dailyViolations[day]) dailyViolations[day] = { total: 0, bad: 0 };
        dailyViolations[day].total++;
        if (isBad) dailyViolations[day].bad++;
      } catch (err) {}
    });

    // Find worst hour/day based on COUNT of infractions (bad trades) to make it highly robust and logical,
    // falling back to rate as tie-breaker.
    let worstHour = -1;
    let maxHourBadCount = 0;
    let maxHourRate = 0;
    Object.keys(hourlyViolations).forEach(hKey => {
      const h = parseInt(hKey);
      const badCount = hourlyViolations[h].bad;
      const rate = badCount / hourlyViolations[h].total;
      if (badCount > maxHourBadCount || (badCount === maxHourBadCount && rate > maxHourRate)) {
        maxHourBadCount = badCount;
        maxHourRate = rate;
        worstHour = h;
      }
    });

    let worstDay = -1;
    let maxDayBadCount = 0;
    let maxDayRate = 0;
    Object.keys(dailyViolations).forEach(dKey => {
      const d = parseInt(dKey);
      const badCount = dailyViolations[d].bad;
      const rate = badCount / dailyViolations[d].total;
      if (badCount > maxDayBadCount || (badCount === maxDayBadCount && rate > maxDayRate)) {
        maxDayBadCount = badCount;
        maxDayRate = rate;
        worstDay = d;
      }
    });

    const daysOfWeekVi = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

    return {
      worstHour: worstHour >= 0 ? `${worstHour}:00 - ${worstHour + 1}:00` : 'Không có dữ liệu vi phạm',
      worstHourRate: worstHour >= 0 ? Math.round(maxHourRate * 100) : 0,
      worstHourBad: worstHour >= 0 ? hourlyViolations[worstHour].bad : 0,
      worstHourTotal: worstHour >= 0 ? hourlyViolations[worstHour].total : 0,
      worstDay: worstDay >= 0 ? daysOfWeekVi[worstDay] : 'Không có dữ liệu vi phạm',
      worstDayRate: worstDay >= 0 ? Math.round(maxDayRate * 100) : 0,
      worstDayBad: worstDay >= 0 ? dailyViolations[worstDay].bad : 0,
      worstDayTotal: worstDay >= 0 ? dailyViolations[worstDay].total : 0,
    };
  }, [allTrades, dailyDisciplineLogs]);

  // Bad Habits After Streak Losses (Hành Vi Khi Thua Chuỗi)
  const streakLossesAnalysis = useMemo(() => {
    // Bước 1: Sắp xếp danh sách lệnh tăng dần theo thời gian (timestamp)
    const sortedClosed = [...closedTrades].sort((a,b) => new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime());
    
    // Bước 2: Tính số tiền rủi ro (risk_amount) trung bình của các lệnh khi trader đang tỉnh táo (những lệnh nằm ngoài chuỗi thua >= 3)
    const isStreakIndex = new Array(sortedClosed.length).fill(false);
    let tempLoseStreakIndices: number[] = [];

    for (let i = 0; i < sortedClosed.length; i++) {
      const isLoss = sortedClosed[i].status === 'lost' || sortedClosed[i].pnl < 0;
      const isWin = sortedClosed[i].status === 'won' || sortedClosed[i].pnl > 0;

      if (isLoss) {
        tempLoseStreakIndices.push(i);
      } else if (isWin) {
        if (tempLoseStreakIndices.length >= 3) {
          tempLoseStreakIndices.forEach(idx => {
            isStreakIndex[idx] = true;
          });
        }
        tempLoseStreakIndices = [];
      }
    }
    if (tempLoseStreakIndices.length >= 3) {
      tempLoseStreakIndices.forEach(idx => {
        isStreakIndex[idx] = true;
      });
    }

    const soberTrades = sortedClosed.filter((_t, idx) => !isStreakIndex[idx]);
    const avgSoberRisk = soberTrades.length > 0 
      ? (soberTrades.reduce((sum, t) => sum + t.riskAmount, 0) / soberTrades.length)
      : (sortedClosed.reduce((sum, t) => sum + t.riskAmount, 0) / (sortedClosed.length || 1));

    // Bước 3: Duyệt mảng, nếu lệnh thua (pnl < 0) thì tăng biến đếm chuỗi thua. Nếu lệnh thắng (pnl > 0) reset chuỗi thua về 0.
    // Khi chuỗi thua chạm mốc >= 3 lệnh liên tiếp, lập tức bắt lấy dữ liệu của LỆNH KẾ TIẾP LIỀN KỀ (lệnh thứ i + 1) để kiểm tra hành vi
    let loseStreakCount = 0;
    let totalStreakTriggers = 0;
    let soLenhTangKhoiLuong = 0;
    let soLenhBoChecklist = 0;
    let soLenhCamXucTe = 0;
    let totalStreakRisk = 0;
    let countStreakRisk = 0;

    for (let i = 0; i < sortedClosed.length; i++) {
      const isLoss = sortedClosed[i].status === 'lost' || sortedClosed[i].pnl < 0;
      const isWin = sortedClosed[i].status === 'won' || sortedClosed[i].pnl > 0;

      if (isLoss) {
        loseStreakCount++;
      } else if (isWin) {
        loseStreakCount = 0;
      }

      if (loseStreakCount >= 3) {
        if (i < sortedClosed.length - 1) {
          totalStreakTriggers++;
          const nextTrade = sortedClosed[i + 1];
          totalStreakRisk += nextTrade.riskAmount;
          countStreakRisk++;

          if (nextTrade.riskAmount > avgSoberRisk * 1.5) {
            soLenhTangKhoiLuong++;
          }
          if (nextTrade.uncheckedWarning === true) {
            soLenhBoChecklist++;
          }
          if (nextTrade.emotion === 'Cay cú/Trả thù' || nextTrade.emotion === 'FOMO') {
            soLenhCamXucTe++;
          }
        }
      }
    }

    // Bước 4: Tính tỷ lệ % của các hành vi xấu này dựa trên tổng số lần dính chuỗi thua và xuất ra chuỗi văn bản đúc kết Insight trần trụi
    const pctTangKhoiLuong = totalStreakTriggers > 0 ? Math.round((soLenhTangKhoiLuong / totalStreakTriggers) * 100) : 0;
    const pctBoChecklist = totalStreakTriggers > 0 ? Math.round((soLenhBoChecklist / totalStreakTriggers) * 100) : 0;
    const pctCamXucTe = totalStreakTriggers > 0 ? Math.round((soLenhCamXucTe / totalStreakTriggers) * 100) : 0;
    const avgStreakRisk = countStreakRisk > 0 ? Math.round(totalStreakRisk / countStreakRisk) : 0;

    let insightText = '';
    if (totalStreakTriggers === 0) {
      insightText = "Hệ thống chưa ghi nhận chuỗi thua 3 lệnh liên tiếp nào. Kỷ luật bảo toàn vốn của bạn rất tốt!";
    } else {
      insightText = `Hệ thống phát hiện: Bạn có ${pctTangKhoiLuong}% tỷ lệ tự động TĂNG KHỐI LƯỢNG LỆNH và ${pctBoChecklist}% tỷ lệ BỎ QUA BỘ QUY TẮC CHECKLIST ngay sau chuỗi thua. `;
      if (pctTangKhoiLuong > 50 || pctBoChecklist > 50 || pctCamXucTe > 50) {
        insightText += `Bạn đang dính pattern trade trả thù để tự sát tài khoản! Thay đổi ngay trước khi quá muộn.`;
      } else {
        insightText += `Bạn kiểm soát cảm xúc và kỷ luật tương đối tốt sau chuỗi thua, cố gắng duy trì!`;
      }
    }

    return {
      totalStreakTriggers,
      pctTangKhoiLuong,
      pctBoChecklist,
      pctCamXucTe,
      insightText,
      avgSoberRisk,
      avgStreakRisk,
      soLenhTangKhoiLuong,
      soLenhBoChecklist,
      soLenhCamXucTe
    };
  }, [closedTrades]);

  // Inner Recovery Speed (Tốc Độ Phục Hồi Bản Ngã)
  const egoRecoveryScore = useMemo(() => {
    const sortedClosed = [...closedTrades].sort((a,b) => new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime());
    if (sortedClosed.length === 0) {
      return { score: 1.0, activeStreak: 0, isCurrentStreakActive: false, totalViolations: 0 };
    }

    const breachedDates = new Set(
      dailyDisciplineLogs.filter(l => l.isExceeded || l.breachedByForce).map(l => l.date)
    );

    let totalViolations = 0;
    let totalRecoverySteps = 0;
    let counting = false;
    let currentSteps = 0;

    for (let i = 0; i < sortedClosed.length; i++) {
      const trade = sortedClosed[i];
      const tradeDate = trade.enteredAt.split('T')[0];
      const isBad = trade.uncheckedWarning || breachedDates.has(tradeDate);

      if (isBad) {
        if (!counting) {
          counting = true;
          totalViolations++;
          currentSteps = 0;
        } else {
          currentSteps++;
        }
      } else {
        if (counting) {
          counting = false;
          totalRecoverySteps += currentSteps + 1; // +1 to count this first disciplined trade
        }
      }
    }

    const isCurrentStreakActive = counting;
    const activeStreak = counting ? (currentSteps + 1) : 0;

    let finalRecoverySteps = totalRecoverySteps;
    if (counting) {
      finalRecoverySteps += activeStreak;
    }

    if (totalViolations === 0) {
      return { score: 1.0, activeStreak: 0, isCurrentStreakActive: false, totalViolations: 0 };
    }

    const avg = finalRecoverySteps / totalViolations;
    const score = avg > 0 ? (Math.round(avg * 10) / 10) : 1;

    return {
      score,
      activeStreak,
      isCurrentStreakActive,
      totalViolations
    };
  }, [closedTrades, dailyDisciplineLogs]);

  // 3. RULE-BASED EXPERT DISCIPLINE INSIGHTS (Báo cáo Kỷ Luật)
  const thongDiepInsights = useMemo(() => {
    let insights: string[] = [];

    const fomoStat = emotionStats.find(s => s.name === 'FOMO');
    const binhTinhStat = emotionStats.find(s => s.name === 'Bình tĩnh');
    const cayCuStat = emotionStats.find(s => s.name === 'Cay cú/Trả thù');

    const winRate_FOMO = fomoStat ? fomoStat.winrate : 0;
    const winRate_BìnhTĩnh = binhTinhStat ? binhTinhStat.winrate : 0;
    const winRate_CayCú = cayCuStat ? cayCuStat.winrate : 0;

    const HungPhanTrades = allTrades.filter(t => t.emotion === 'Hưng phấn');
    const BinhTinhTrades = allTrades.filter(t => t.emotion === 'Bình tĩnh');
    const riskAmount_HưngPhấn = HungPhanTrades.length > 0 
      ? HungPhanTrades.reduce((sum, t) => sum + (t.riskAmount || 0), 0) / HungPhanTrades.length 
      : 0;
    const riskAmount_BìnhTĩnh = BinhTinhTrades.length > 0 
      ? BinhTinhTrades.reduce((sum, t) => sum + (t.riskAmount || 0), 0) / BinhTinhTrades.length 
      : 0;

    let tong_vi_pham = 0;
    let vi_pham_buoi_sang = 0;
    let vi_pham_ban_dem = 0;

    const breachedDates = new Set(
      dailyDisciplineLogs.filter(l => l.isExceeded || l.breachedByForce).map(l => l.date)
    );

    allTrades.forEach(t => {
      const isChecklistOk = !t.uncheckedWarning;
      const tradeDate = t.enteredAt.split('T')[0];
      const isDailyLimitOk = !breachedDates.has(tradeDate);
      const isBad = !isChecklistOk || !isDailyLimitOk || (t.emotion && t.emotion !== 'Bình tĩnh');

      if (isBad) {
        tong_vi_pham++;
        try {
          const d = new Date(t.enteredAt);
          const hour = d.getHours();
          if (hour >= 5 && hour < 12) {
            vi_pham_buoi_sang++;
          }
          if (hour >= 22 || hour < 5) {
            vi_pham_ban_dem++;
          }
        } catch (e) {}
      }
    });

    const hasFomoClosed = allTrades.filter(t => t.emotion === 'FOMO' && (t.status === 'won' || t.status === 'lost')).length > 0;
    const hasBinhTinhClosed = allTrades.filter(t => t.emotion === 'Bình tĩnh' && (t.status === 'won' || t.status === 'lost')).length > 0;
    const hasCayCuClosed = allTrades.filter(t => t.emotion === 'Cay cú/Trả thù' && (t.status === 'won' || t.status === 'lost')).length > 0;

    // Conditions:
    // a)
    if (hasFomoClosed && hasBinhTinhClosed && winRate_FOMO < winRate_BìnhTĩnh * 0.6) {
      insights.push('🚨 Lệnh FOMO của bạn thua gấp đôi lệnh bình tĩnh. Bạn đang tự cống nạp tiền cho thị trường do vào lệnh vội vã. Cân nhắc thêm bước kiểm tra cảm xúc vào bộ quy tắc.');
    }
    // b)
    if (hasCayCuClosed && winRate_CayCú < 25) {
      insights.push('😡 Giao dịch khi Cay cú/Trả thù đang tiêu diệt tài khoản của bạn với tỷ lệ thua cực kỳ cao. Khi dính chuỗi thua, hãy rời màn hình ngay.');
    }
    // c)
    if (HungPhanTrades.length > 0 && BinhTinhTrades.length > 0 && riskAmount_HưngPhấn > riskAmount_BìnhTĩnh * 1.5) {
      insights.push('🚀 Bạn bị say mồi! Khi tâm trạng Hưng phấn sau chuỗi thắng, khối lượng rủi ro của bạn tự động tăng bừa bãi. Lòng tham đang bẫy bạn trả lại tiền cho sàn.');
    }
    // d)
    if (tong_vi_pham > 0 && vi_pham_buoi_sang > tong_vi_pham * 0.5) {
      insights.push('☀️ Hơn 50% số lệnh vi phạm bộ quy tắc của bạn xảy ra vào BUỔI SÁNG. Buổi chiều và tối bạn giao dịch kỷ luật hơn nhiều. Cân nhắc tắt máy đầu phiên.');
    }
    // e)
    if (tong_vi_pham > 0 && vi_pham_ban_dem > tong_vi_pham * 0.4) {
      insights.push('🌙 Bạn đang trade đêm trong trạng thái kiệt sức. Gần một nửa số lệnh vi phạm tập trung sau 22h đêm. Hãy tắt app đi ngủ.');
    }
    // f)
    const ty_le_tang_size_sau_chuoi_thua = streakLossesAnalysis.pctTangKhoiLuong;
    if (streakLossesAnalysis.totalStreakTriggers > 0 && ty_le_tang_size_sau_chuoi_thua > 50) {
      insights.push('💥 Bạn dính Pattern tự sát Nhồi lệnh trả thù. Cứ sau chuỗi thua 3 lệnh, bạn lập tức tăng khối lượng bừa bãi. Phương pháp không sai, bạn thua hoàn toàn vì Cay Cú!');
    }
    // g)
    const DiemSoKyLuat = disciplineScore;
    if (allTrades.length >= 10 && DiemSoKyLuat >= 85) {
      insights.push('👑 Thần thái Pro Trader! Điểm số kỷ luật của bạn đạt trạng thái xuất sắc. Lợi nhuận đường dài chỉ là vấn đề thời gian.');
    }
    // h)
    if (allTrades.length < 10) {
      insights.push('📊 Trợ lý đang thu thập thêm nhật ký giao dịch (cần tối thiểu 10 lệnh) để rà quét vòng lặp hành vi và đúc kết insight cá nhân hóa.');
    }

    if (allTrades.length >= 10 && insights.length === 0) {
      insights.push('🎉 Vạn sự hanh thông! Hệ chuyên gia chưa phát hiện bất kỳ thói quen bộc đồng hay lỗi kỷ luật nghiêm trọng nào trong dữ liệu của bạn. Hãy tiếp tục duy trì tinh thần thép!');
    }

    return insights;
  }, [allTrades, dailyDisciplineLogs, emotionStats, streakLossesAnalysis, disciplineScore]);

  // Export CSV Function
  const handleExportData = (format: 'csv' | 'json') => {
    if (!isPremium) {
      onTriggerPaywall();
      return;
    }

    if (allTrades.length === 0) {
      alert("Không có lịch sử giao dịch để xuất báo cáo!");
      return;
    }

    let dataStr = '';
    let mimeType = '';
    let fileName = '';

    if (format === 'json') {
      dataStr = JSON.stringify(allTrades, null, 2);
      mimeType = 'application/json';
      fileName = 'Bao_Cao_Ky_Luat_RiskWise.json';
    } else {
      // CSV Format
      const headers = ['Ma_Giao_Dich', 'San_Pham', 'Huong_Vi_The', 'Gia_Vao', 'Phan_Tram_Ky_Luat', 'Cam_Xuc_Vao_Lenh', 'Thoi_Gian', 'Trang_Thai', 'P_L_Thuc_Te'];
      const rows = allTrades.map(t => [
        t.id,
        t.ticker,
        t.direction === 'long' ? 'LONG' : 'SHORT',
        t.entryPrice,
        t.uncheckedWarning ? '0' : '100',
        t.emotion || 'Chưa lưu',
        t.enteredAt,
        t.status.toUpperCase(),
        t.pnl
      ]);
      dataStr = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
      mimeType = 'text/csv;charset=utf-8;';
      fileName = 'Bao_Cao_Ky_Luat_RiskWise.csv';
    }

    const blob = format === 'csv'
      ? new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), dataStr], { type: 'text/csv;charset=utf-8' })
      : new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#14171F] rounded-2xl p-6 border border-slate-800/80 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
          <div>
            <span className="text-indigo-400 text-[10px] sm:text-xs font-bold font-mono tracking-widest uppercase block mb-1">
              Phân tích chỉ số hành vi &amp; tâm lý
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400 shrink-0" />
              Phân Tích Kỷ Luật (Pro Trader)
            </h2>
          </div>
          <div className="flex items-center gap-2 select-none shrink-0 w-full sm:w-auto">
            <button
              onClick={() => handleExportData('csv')}
              className="flex-1 sm:flex-initial py-2 px-3.5 bg-[#1C212D]/80 hover:bg-[#1C212D] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Xuất CSV</span>
            </button>
            <button
              onClick={() => handleExportData('json')}
              className="flex-1 sm:flex-initial py-2 px-3.5 bg-[#1C212D]/80 hover:bg-[#1C212D] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Xuất JSON</span>
            </button>
          </div>
        </div>

        {/* ----------------- FREE SECTION: METRICS ----------------- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
           {/* Discipline Score Card */}
           <div className="bg-[#1C212D] border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
             <div className="flex items-center justify-between">
               <span className="text-xs font-bold text-slate-450 uppercase tracking-wider font-mono">Điểm Số Kỷ Luật</span>
               <Scale className="w-4 h-4 text-violet-400 shrink-0" />
             </div>
             <div className="my-3 flex items-baseline gap-1">
               <span className="text-3xl font-black font-mono text-violet-400">{disciplineScore}%</span>
             </div>
             <div className="w-full bg-[#14171F] h-1.5 rounded-full overflow-hidden">
               <div 
                 className="bg-violet-500 h-1.5 rounded-full transition-all duration-500" 
                 style={{ width: `${disciplineScore}%` }}
               ></div>
             </div>
             <span className="text-xs text-slate-500 block mt-2 leading-relaxed">
               (Số lệnh đạt 100% checklist và không phạm Daily Stop / Tổng số lệnh)
             </span>
           </div>

           {/* Consecutive Streak Card */}
           <div className="bg-[#1C212D] border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
             <div className="flex items-center justify-between">
               <span className="text-xs font-bold text-slate-455 uppercase tracking-wider font-mono">Chuỗi Kỷ Luật Liên Tiếp</span>
               <Flame className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />
             </div>
             <div className="my-3 flex items-baseline gap-1">
               <span className="text-3xl font-black font-mono text-amber-500">{disciplineStreak}</span>
               <span className="text-xs text-slate-550 font-bold uppercase">Ngày liên tiếp</span>
             </div>
             <div className="text-xs text-slate-400 leading-relaxed">
               {disciplineStreak > 0 
                 ? `🔥 Bạn đang duy trì chuỗi kiểm soát tâm lý cực tốt trong ${disciplineStreak} ngày qua!`
                 : 'Bắt đầu một ngày sạch kỷ luật ngay hôm nay để tích luỹ chuỗi thép!'}
             </div>
           </div>

           {/* Rule Completion Card */}
           <div className="bg-[#1C212D] border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
             <div className="flex items-center justify-between">
               <span className="text-xs font-bold text-slate-455 uppercase tracking-wider font-mono">Xác Nhận Quy Tắc</span>
               <ShieldCheck className="w-4 h-4 text-emerald-450 shrink-0" />
             </div>
             <div className="my-3 flex items-baseline gap-1">
               <span className="text-3xl font-black font-mono text-emerald-450">{ruleCompletionRate}%</span>
               <span className="text-xs text-slate-550 font-mono">({allTrades.filter(t => !t.uncheckedWarning).length}/{allTrades.length} lệnh)</span>
             </div>
             <div className="w-full bg-[#14171F] h-1.5 rounded-full overflow-hidden">
               <div 
                 className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                 style={{ width: `${ruleCompletionRate}%` }}
               ></div>
             </div>
             <span className="text-xs text-slate-500 block mt-2 leading-relaxed">
               Phần trăm số lượng vị thế mà bạn tuyệt đối tuân thủ Checklist trước vào lệnh.
             </span>
           </div>

           {/* Quick Setup Tree Folder */}
           <div className="bg-[#1C212D] border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
             <div className="flex items-center justify-between">
               <span className="text-xs font-bold text-slate-455 uppercase tracking-wider font-mono">Lưu Lượng Thể Loại Lệnh</span>
               <FolderOpen className="w-4 h-4 text-sky-400 shrink-0" />
             </div>
             <div className="space-y-1.5 my-3 text-xs font-sans">
               <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-900/30 p-2 rounded-lg text-emerald-400">
                 <span className="font-semibold">📁 Lệnh Đúng Kế Hoạch:</span>
                 <span className="font-black font-mono">{setupCategories.duongKeHoach.length}</span>
               </div>
               <div className="flex items-center justify-between bg-rose-950/20 border border-rose-900/30 p-2 rounded-lg text-rose-400">
                  <span className="font-semibold">📁 Lệnh Ngoài Kế Hoạch:</span>
                  <span className="font-black font-mono">{setupCategories.ngoaiKeHoach.length}</span>


               </div>
             </div>
             <span className="text-xs text-slate-500 block leading-relaxed">
               Dựa trên kiểm tra màng lọc checklist kỷ luật của mỗi lệnh đã ghi.
             </span>
           </div>
         </div>

        {/* ----------------- PREMIUM SECTION: LOCKED BEHIND PAYWALL WITH BLUR ----------------- */}
        <div className="mt-8 border-t border-slate-800/80 pt-6 relative">
          
          {/* Blur Cover Layer for Free Plan */}
          {!isPremium && (
            <div className="absolute inset-x-0 bottom-0 top-0 bg-[#14171F]/40 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center text-center p-6 rounded-b-2xl">
              <div className="bg-[#1C212D] border border-slate-700/80 p-6 rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn flex flex-col items-center">
                <div className="bg-indigo-950/80 border border-indigo-900 text-indigo-400 p-3 rounded-2xl mb-4 shrink-0 flex items-center justify-center">
                  <Lock className="w-6 h-6 shrink-0" />
                </div>
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">Mở khóa Phân Tích Hành Vi</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Bản Premium mở khóa toàn bộ Phân tích Thống Kê Cảm Xúc, Khung giờ nhạy cảm phá kỷ luật, Thước đo Phục hồi Bản ngã và Quét Lỗi Bốc Đồng.
                </p>
                <button
                  type="button"
                  onClick={onTriggerPaywall}
                  className="mt-4 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs rounded-xl transition duration-150 shadow-md hover:shadow-indigo-950/25 uppercase tracking-wider cursor-pointer font-mono"
                >
                  🚀 MỞ KHÓA BẢN ĐỒ HOÀN CHỈNH
                </button>
              </div>
            </div>
          )}

          {/* Premium stats display area */}
          <div className={`space-y-6 select-none premium-stats-section ${!isPremium ? 'opacity-30 blur-[4px] pointer-events-none' : ''}`}>
            
            <div className="flex items-center gap-2 pb-2 border-b border-indigo-950">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider font-mono">
                Chỉ Số Nâng Cao (Dành riêng cho Premium)
              </h3>
            </div>

            {/* Row 1: Correlation & Emotions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Correlation: Discipline vs Results */}
              <div className="bg-[#1C212D]/60 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-4 h-full justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Scale className="w-4 h-4 text-indigo-400" />
                    Tương Quan Kỷ Luật &amp; Lợi Nhuận
                  </h4>
                  <p className="text-[10px] text-slate-455 leading-relaxed">
                    So sánh trực quan kết quả thực chiến giữa nhóm lệnh tuân thủ 100% quy tắc vs nhóm lệnh phá kỷ luật (tự phát / bốc đồng).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Disciplined Results */}
                  <div className="bg-[#14171F]/80 p-3.5 rounded-xl border border-emerald-950/40 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-emerald-440 uppercase tracking-wide block mb-1">Đúng kế hoạch</span>
                      <div className="space-y-1.5 font-mono text-[11px] mt-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tỉ lệ Thắng:</span>
                          <strong className="text-emerald-400">{correlationMetrics.disciplined.winrate}%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Profit Factor:</span>
                          <strong className="text-emerald-455">
                            {correlationMetrics.disciplined.count > 0 ? correlationMetrics.disciplined.profitFactor.toFixed(2) : '-'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Thua cực đại:</span>
                          <strong className="text-[#f87171]">
                            -${Math.abs(correlationMetrics.disciplined.maxLoss).toLocaleString()}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rủi ro TB:</span>
                          <strong className="text-slate-300">
                            ${correlationMetrics.disciplined.avgRisk.toLocaleString()}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/40 pt-2 mt-2 font-mono text-[11px]">
                      <span className="text-slate-500">Tổng PnL:</span>
                      <strong className={correlationMetrics.disciplined.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-455'}>
                        ${correlationMetrics.disciplined.totalPnl.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Undisciplined Results */}
                  <div className="bg-[#14171F]/80 p-3.5 rounded-xl border border-rose-950/40 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-rose-440 uppercase tracking-wide block mb-1">Ngoài kế hoạch</span>
                      <div className="space-y-1.5 font-mono text-[11px] mt-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tỉ lệ Thắng:</span>
                          <strong className="text-rose-400">{correlationMetrics.undisciplined.winrate}%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Profit Factor:</span>
                          <strong className="text-emerald-455">
                            {correlationMetrics.undisciplined.count > 0 ? correlationMetrics.undisciplined.profitFactor.toFixed(2) : '-'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Thua cực đại:</span>
                          <strong className="text-[#ef4444] font-bold">
                            -${Math.abs(correlationMetrics.undisciplined.maxLoss).toLocaleString()}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rủi ro TB:</span>
                          <strong className="text-slate-300">
                            ${correlationMetrics.undisciplined.avgRisk.toLocaleString()}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/40 pt-2 mt-2 font-mono text-[11px]">
                      <span className="text-slate-500">Tổng PnL:</span>
                      <strong className={correlationMetrics.undisciplined.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-455'}>
                        ${correlationMetrics.undisciplined.totalPnl.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Simulated pure discipline projection widget - INCREDIBLY HIGH INSIGHT VALUE */}
                <div className="bg-[#11131C] border border-indigo-950/50 p-3 rounded-xl space-y-2 mt-1">
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block font-sans">
                    ✨ Giả lập Tài khoản Kỷ luật 100% (Simulated Pure Discipline)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-[#0D0F16] p-2 rounded border border-slate-850/50">
                      <span className="text-[9px] text-slate-500 block font-sans uppercase">PnL Thực tế:</span>
                      <strong className={`block text-xs mt-0.5 ${(correlationMetrics.disciplined.totalPnl + correlationMetrics.undisciplined.totalPnl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${(correlationMetrics.disciplined.totalPnl + correlationMetrics.undisciplined.totalPnl).toLocaleString()}
                      </strong>
                    </div>
                    <div className="bg-[#0F1C18]/60 p-2 rounded border border-emerald-950/40">
                      <span className="text-[9px] text-emerald-500 block font-sans uppercase">Nếu Kỷ luật 100%:</span>
                      <strong className="block text-xs text-emerald-400 mt-0.5">
                        ${correlationMetrics.disciplined.totalPnl.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal font-sans">
                    {correlationMetrics.undisciplined.totalPnl < 0 ? (
                      <span>
                        🔥 Bạn đã lãng phí <strong className="text-rose-400 font-mono">${Math.abs(correlationMetrics.undisciplined.totalPnl).toLocaleString()}</strong> cho các lệnh tự phát bốc đồng. Từ bỏ thói quen này sẽ tăng hiệu suất danh mục lên ngay lập tức!
                      </span>
                    ) : correlationMetrics.undisciplined.totalPnl > 0 ? (
                      <span>
                        ⚠️ Các lệnh ngoài kế hoạch đang có lãi tạm thời (<strong className="text-emerald-400 font-mono">+${correlationMetrics.undisciplined.totalPnl.toLocaleString()}</strong>). Hãy cẩn trọng, đây là "Lợi nhuận độc hại" dễ tạo thói quen xấu dẫn tới thảm họa đuôi dài.
                      </span>
                    ) : (
                      <span>Bạn chưa có hoặc đã kiểm soát tuyệt đối không để phát sinh các vị thế ngoài kế hoạch. Thật tuyệt vời!</span>
                    )}
                  </p>
                </div>

                {/* Sizing & Sizing Tail Risk warning if out-of-plan risk is much higher */}
                {correlationMetrics.undisciplined.count > 0 && correlationMetrics.undisciplined.avgRisk > correlationMetrics.disciplined.avgRisk * 1.2 && (
                  <div className="bg-rose-955/10 border border-rose-900/40 p-2.5 rounded-xl text-[10px] text-rose-300 leading-normal flex items-start gap-1.5">
                    <AlertOctagon className="w-3.5 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold font-sans uppercase text-[9px] tracking-wider block text-rose-400">⚠️ Hành vi tăng quy mô tự phát</span>
                      Khi giao dịch ngoài kế hoạch, bạn có xu hướng chịu rủi ro trung bình cao hơn gấp <strong className="text-white">{(correlationMetrics.undisciplined.avgRisk / (correlationMetrics.disciplined.avgRisk || 1)).toFixed(1)} lần</strong> so với lúc bình tĩnh. Đây là dấu hiệu của việc giao dịch gỡ gạc rủi ro cao.
                    </div>
                  </div>
                )}

                {/* Automation comparison badge at the bottom of the card to fill up grid height beautifully */}
                <div className="bg-[#14171F]/50 border border-slate-800/60 p-3 rounded-xl text-[11px] space-y-1.5 mt-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">📌 Đúc kết tương quan</span>
                  <p className="text-slate-300 leading-normal font-sans">
                    {correlationMetrics.disciplined.totalPnl > correlationMetrics.undisciplined.totalPnl ? (
                      <span>
                        Giao dịch <strong className="text-emerald-400">Đúng kế hoạch</strong> mang lại hiệu quả vượt trội với chênh lệch <strong className="text-emerald-400 font-mono">+${Math.round((correlationMetrics.disciplined.totalPnl - correlationMetrics.undisciplined.totalPnl) * 100) / 100}</strong> so với tự phát bộc đồng. Hãy kiên trì tuân thủ kỷ luật!
                      </span>
                    ) : correlationMetrics.disciplined.totalPnl < correlationMetrics.undisciplined.totalPnl ? (
                      <span>
                        Mặc dù hiệu quả hành vi bộc đồng cao hơn tạm thời trong ngắn hạn, việc phá kỷ luật luôn đi kèm rủi ro đuôi (tail risk) cực kì thảm khốc. Hãy cẩn trọng tối đa!
                      </span>
                    ) : (
                      <span>Chưa ghi nhận sự khác biệt PNL lớn giữa 2 nhóm. Hãy tích lũy thêm mẫu dữ liệu giao dịch sạch của bạn để thuật toán phân tích rõ rệt hơn.</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Emotional Breakdown Analysis */}
              <div className="bg-[#1C212D]/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    Phân Tích Thống Kê Cảm Xúc
                  </h4>
                  <p className="text-[10px] text-slate-455 leading-relaxed mb-4">
                    Đo lường chi tiết Profit Factor &amp; Tỷ lệ R/R Thực tế theo từng tình trạng tâm lý của bạn khi vào lệnh. Chỉ số vạch trần các trạng thái cay cú mang lại thiệt thòi lớn thế nào dẫu tỷ lệ thắng có vẻ cao.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {emotionStats.map(stat => (
                    <div key={stat.name} className="flex flex-col gap-2 text-[11px] bg-[#14171F]/50 p-2.5 rounded-xl border border-slate-850/40">
                      
                      {/* Top Row: Emotion Title & Total PNL */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200 font-sans text-xs">
                          <span>
                            {stat.name === 'Bình tĩnh' && '🧘'}
                            {stat.name === 'Hưng phấn' && '🔥'}
                            {stat.name === 'Sợ hãi' && '😨'}
                            {stat.name === 'FOMO' && '🚀'}
                            {stat.name === 'Cay cú/Trả thù' && '😡'}
                          </span>
                          <span>{stat.name}</span>
                          <span className="text-[10px] font-mono font-bold text-slate-450">({stat.count} lệnh)</span>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <span className="text-slate-500 mr-1 text-[10px] font-sans">Tổng PnL:</span>
                          <strong className={stat.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-450'}>
                            {stat.totalPnl >= 0 ? '+' : ''}${stat.totalPnl.toLocaleString()}
                          </strong>
                        </div>
                      </div>
                      
                      {/* Mid Row Metrics Breakdown */}
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 font-sans border-t border-slate-800/10 pt-1.5 mt-0.5">
                        <div className="flex flex-col">
                          <span className="text-slate-500 text-[9px] uppercase tracking-wider">Winrate</span>
                          <strong className={`font-mono text-xs mt-0.5 ${stat.winrate >= 50 ? 'text-emerald-400' : 'text-slate-350'}`}>{stat.winrate}%</strong>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-500 text-[9px] uppercase tracking-wider">Profit Factor</span>
                          <strong className={`font-mono text-xs mt-0.5 ${stat.profitFactor >= 1.5 ? 'text-emerald-400' : stat.profitFactor >= 1.0 ? 'text-amber-400' : stat.count > 0 ? 'text-rose-455' : 'text-slate-450'}`}>
                            {stat.count > 0 ? stat.profitFactor.toFixed(2) : '-'}
                          </strong>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-slate-500 text-[9px] uppercase tracking-wider pr-0.5">Tỷ lệ R/R Thực tế</span>
                          <strong className={`font-mono text-xs mt-0.5 ${stat.payoffRatio >= 1.5 ? 'text-emerald-400' : stat.payoffRatio >= 1.0 ? 'text-amber-400' : stat.count > 0 ? 'text-slate-350' : 'text-slate-450'}`}>
                            {stat.count > 0 && stat.avgWin > 0 && stat.avgLoss < 0 ? `1 : ${stat.ratioMultiplier}` : '-'}
                          </strong>
                        </div>
                      </div>

                      {/* Detail row with Average Win / Loss values */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-sans bg-[#0F111A]/40 px-2 py-0.5 rounded border border-slate-850/20">
                        <span>Thắng TB: <strong className="text-emerald-400 font-mono">+${stat.avgWin.toLocaleString()}</strong></span>
                        <span>Thua TB: <strong className="text-rose-455 font-mono">-${Math.abs(stat.avgLoss).toLocaleString()}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Row 2: Ghost Hours & Recovery & Habits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Ghost Hours & Dangerous Times */}
              <div className="bg-[#1C212D]/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5 mb-2 flex-wrap">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Khoảnh khắc nguy hiểm
                  </h4>
                  <p className="text-xs text-slate-455 leading-relaxed mb-4">
                    Thống kê khung giờ và thứ trong tuần có số lượng vi phạm quy định nhiều nhất, giúp nhận diện thời điểm cơ thể mất tập trung nhất.
                  </p>
                </div>

                <div className="space-y-3 mt-2 font-mono text-xs">
                  <div className="bg-[#14171F]/80 p-3 rounded-xl border border-slate-855 flex items-center justify-between">
                    <div>
                      <span className="text-slate-455 block text-xs uppercase font-sans">Giờ dễ phá luật nhất</span>
                      <strong className="text-rose-400 text-xs mt-1 block">{ghostHoursInfo.worstHour}</strong>
                      {ghostHoursInfo.worstHourTotal > 0 && (
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          (Phát hiện {ghostHoursInfo.worstHourBad}/{ghostHoursInfo.worstHourTotal} vị thế đã vào)
                        </span>
                      )}
                    </div>
                    <span className="bg-rose-955/20 border border-rose-900/30 text-rose-300 font-extrabold px-2.5 py-1 rounded-lg text-xs">
                      {ghostHoursInfo.worstHourRate}% Vi phạm
                    </span>
                  </div>

                  <div className="bg-[#14171F]/80 p-3 rounded-xl border border-slate-855 flex items-center justify-between">
                    <div>
                      <span className="text-slate-455 block text-xs uppercase font-sans">Ngày dễ oải nhất</span>
                      <strong className="text-rose-400 text-xs mt-1 block">{ghostHoursInfo.worstDay}</strong>
                      {ghostHoursInfo.worstDayTotal > 0 && (
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          (Phát hiện {ghostHoursInfo.worstDayBad}/{ghostHoursInfo.worstDayTotal} vị thế đã vào)
                        </span>
                      )}
                    </div>
                    <span className="bg-rose-955/20 border border-rose-900/30 text-rose-300 font-extrabold px-2.5 py-1 rounded-lg text-xs">
                      {ghostHoursInfo.worstDayRate}% Vi phạm
                    </span>
                  </div>
                </div>
              </div>

              {/* Báo Cáo Kỷ Luật (Rule-based expert system) */}
              <div className="bg-[#1C212D]/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5 mb-2 flex-wrap">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    Báo Cáo Kỷ Luật (Expert System)
                  </h4>
                  <p className="text-xs text-slate-455 leading-relaxed mb-4">
                    Hệ thống chuyên gia phân tích hành vi tự động quét nhật ký giao dịch, cảnh báo và nhận diện thói quen bộc đồng theo thời gian thực.
                  </p>
                </div>

                <div className="space-y-2.5 mt-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-none flex-1 flex flex-col gap-2.5">
                  {thongDiepInsights.map((insight, idx) => {
                    let bgColor = "bg-[#14171F] border-slate-850 text-slate-300";
                    if (insight.startsWith("🚨") || insight.startsWith("😡") || insight.startsWith("💥") || insight.startsWith("🌙") || insight.startsWith("☀️") || insight.startsWith("🚀")) {
                      bgColor = "bg-rose-950/20 border-rose-900/30 text-rose-300";
                    } else if (insight.startsWith("👑") || insight.startsWith("🎉")) {
                      bgColor = "bg-emerald-950/20 border-emerald-900/30 text-emerald-300";
                    } else if (insight.startsWith("📊")) {
                      bgColor = "bg-indigo-950/20 border-indigo-900/30 text-indigo-300";
                    }
                    
                    const emoji = insight.slice(0, 2);
                    const textOnly = insight.slice(2);

                    return (
                      <div key={idx} className={`flex gap-2 p-3 rounded-xl border ${bgColor} text-xs leading-relaxed items-start shadow-sm`}>
                        <span className="text-base select-none shrink-0 mt-0.5">{emoji}</span>
                        <span className="font-medium font-sans">{textOnly}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bad Habits warning after streak losses */}
              <div className="bg-[#1C212D]/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <AlertOctagon className="w-4 h-4 text-rose-450 mt-0.5" />
                    Quét Hành Vi Khi Thua Chuỗi
                  </h4>
                  <p className="text-[10px] text-slate-455 leading-relaxed mb-3">
                    Thuật toán tự động phân tích hành vi của bạn ngay sau chuỗi thua 3 lệnh liên tiếp để vạch trần thói bốc đồng gỡ gạc gục ngã.
                  </p>
                </div>

                {streakLossesAnalysis.totalStreakTriggers === 0 ? (
                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl text-center space-y-2 mt-2 flex-1 flex flex-col justify-center items-center h-full min-h-[140px]">
                    <span className="text-xl">😇</span>
                    <p className="text-xs font-bold text-emerald-400">RẤT KỶ LUẬT</p>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Chưa ghi nhận chuỗi thua 3 lệnh liên tiếp nào. Kỷ luật kiểm soát rủi ro bảo toàn vốn rất tuyệt vời!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 mt-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      
                      {/* Grid for Risk Comparison */}
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-[#14171F]/80 p-2 rounded-xl border border-slate-850">
                          <span className="text-[9px] text-[#8695b0] uppercase tracking-wider block font-sans">Rủi ro bình thường</span>
                          <strong className="text-emerald-400 text-xs font-mono block mt-1">
                            ${Math.round(streakLossesAnalysis.avgSoberRisk).toLocaleString()}
                          </strong>
                        </div>
                        <div className="bg-[#14171F]/80 p-2 rounded-xl border border-slate-850">
                          <span className="text-[9px] text-[#8695b0] uppercase tracking-wider block font-sans">Rủi ro sau chuỗi thua</span>
                          <strong className={`text-xs font-mono block mt-1 ${streakLossesAnalysis.avgStreakRisk > streakLossesAnalysis.avgSoberRisk ? 'text-rose-450 font-extrabold' : 'text-slate-300'}`}>
                            ${Math.round(streakLossesAnalysis.avgStreakRisk).toLocaleString()}
                          </strong>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between border-b border-slate-800/40 pb-1.5 pt-1">
                        <span>Số lần dính chuỗi thua:</span>
                        <span className="text-rose-400 font-mono text-xs">{streakLossesAnalysis.totalStreakTriggers} lần</span>
                      </div>
                      
                      {/* Metric 1 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-sans">
                          <span className="text-slate-300 font-medium font-sans">🚀 Tăng khối lượng lệnh gỡ</span>
                          <span className={`font-mono font-bold ${streakLossesAnalysis.pctTangKhoiLuong > 30 ? 'text-rose-450' : 'text-slate-350'}`}>
                            {streakLossesAnalysis.pctTangKhoiLuong}% ({streakLossesAnalysis.soLenhTangKhoiLuong}/{streakLossesAnalysis.totalStreakTriggers} lần)
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${streakLossesAnalysis.pctTangKhoiLuong > 50 ? 'bg-gradient-to-r from-red-600 to-rose-500' : streakLossesAnalysis.pctTangKhoiLuong > 0 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-slate-800'}`}
                            style={{ width: `${streakLossesAnalysis.pctTangKhoiLuong}%` }}
                          />
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-sans">
                          <span className="text-slate-300 font-medium font-sans font-sans">📋 Bỏ qua Checklist kỷ luật</span>
                          <span className={`font-mono font-bold ${streakLossesAnalysis.pctBoChecklist > 30 ? 'text-rose-400' : 'text-slate-350'}`}>
                            {streakLossesAnalysis.pctBoChecklist}% ({streakLossesAnalysis.soLenhBoChecklist}/{streakLossesAnalysis.totalStreakTriggers} lần)
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${streakLossesAnalysis.pctBoChecklist > 50 ? 'bg-gradient-to-r from-red-600 to-rose-500' : streakLossesAnalysis.pctBoChecklist > 0 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-slate-800'}`}
                            style={{ width: `${streakLossesAnalysis.pctBoChecklist}%` }}
                          />
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-sans">
                          <span className="text-slate-300 font-medium font-sans font-sans font-sans font-sans">🤬 Trạng thái Cay cú/FOMO</span>
                          <span className={`font-mono font-bold ${streakLossesAnalysis.pctCamXucTe > 30 ? 'text-rose-450' : 'text-slate-350'}`}>
                            {streakLossesAnalysis.pctCamXucTe}% ({streakLossesAnalysis.soLenhCamXucTe}/{streakLossesAnalysis.totalStreakTriggers} lần)
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${streakLossesAnalysis.pctCamXucTe > 50 ? 'bg-gradient-to-r from-red-600 to-rose-500' : streakLossesAnalysis.pctCamXucTe > 0 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-slate-800'}`}
                            style={{ width: `${streakLossesAnalysis.pctCamXucTe}%` }}
                          />
                        </div>
                      </div>

                    </div>

                    {/* Insight Card */}
                    <div className="bg-[#181115] border border-rose-950 px-2.5 py-2 rounded-lg text-rose-350 text-xs">
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="text-rose-400 text-[10px] uppercase font-sans tracking-wide">💡 Đánh giá thói quen sau thua:</span>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-slate-350 leading-relaxed font-sans">
                        {streakLossesAnalysis.pctTangKhoiLuong > 40 || streakLossesAnalysis.pctBoChecklist > 40 || streakLossesAnalysis.pctCamXucTe > 40 ? (
                          <span className="text-rose-400">Revenge trading detected. Bạn có xu hướng bốc đồng nguy hiểm khi thua chuỗi!</span>
                        ) : (
                          <span className="text-emerald-400">Kiểm soát hành vi tốt. Bạn giữ vững khối lượng và kỷ luật sau chuỗi thua.</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}