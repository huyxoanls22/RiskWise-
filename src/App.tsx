import React, { useState, useEffect, useRef } from 'react';
import { AssetClass, TradeSetup, CalculationResult, ChecklistItem, PortfolioTrade, TradingPlan, DailyLimitLog } from './types';
import { calculatePositionSize, FOREX_PAIRS } from './utils/calculator';
import ForexCalculator from './components/ForexCalculator';
import CryptoStockCalculator from './components/CryptoStockCalculator';
import RiskMeter from './components/RiskMeter';
import TradeVisualizer from './components/TradeVisualizer';
import PreTradeChecklist from './components/PreTradeChecklist';
import TradingPlanManager from './components/TradingPlanManager';
import PortfolioTracker from './components/PortfolioTracker';
import TradingViewWidget, { isVietnameseTicker } from './components/TradingViewWidget';
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
  Terminal,
  Copy,
  Check,
  Download,
  Upload,
  ExternalLink,
  ChevronDown,
  Crown,
  CreditCard,
  Calendar,
  X
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

// Affiliate Links configurations for customization
const AFFILIATE_LINKS = { 
  binance: 'https://www.binance.com/register?ref=873133600', 
  exness: 'https://one.exnessonelink.com/a/r9pl2ziwvt', 
  the5ers: 'https://www.the5ers.com/?afmc=1bko' 
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

  // White-label state for KOL using URL parameter reference or local storage
  const [partnerRef, setPartnerRef] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('ref')) {
        const refParam = params.get('ref');
        if (refParam === null || refParam.trim() === '' || refParam.trim().toLowerCase() === 'clear' || refParam.trim().toLowerCase() === 'default') {
          localStorage.removeItem('rw_ref_partner');
          return null;
        }
        const cleanRef = refParam.trim().toLowerCase();
        localStorage.setItem('rw_ref_partner', cleanRef);
        return cleanRef;
      }
      return localStorage.getItem('rw_ref_partner');
    } catch {
      return null;
    }
  });

  // Dynamically update state if a different URL parameters reference is passed
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('ref')) {
        const refParam = params.get('ref');
        if (refParam === null || refParam.trim() === '' || refParam.trim().toLowerCase() === 'clear' || refParam.trim().toLowerCase() === 'default') {
          if (partnerRef !== null) {
            localStorage.removeItem('rw_ref_partner');
            setPartnerRef(null);
          }
        } else {
          const cleanRef = refParam.trim().toLowerCase();
          if (cleanRef !== partnerRef) {
            localStorage.setItem('rw_ref_partner', cleanRef);
            setPartnerRef(cleanRef);
          }
        }
      }
    } catch {}
  }, [partnerRef]);

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
  
  // Real Local Premium State (Initially false for normal users to trigger Paywall upon 21st order)
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    try {
      const persisted = localStorage.getItem('trading_is_premium');
      return persisted === 'true';
    } catch {
      return false;
    }
  });

  // Sync isPremium to localStorage
  useEffect(() => {
    localStorage.setItem('trading_is_premium', String(isPremium));
  }, [isPremium]);

  // Track the premium license expiry date format
  const [premiumExpiry, setPremiumExpiry] = useState<string>(() => {
    try {
      const savedKey = localStorage.getItem("trading_license_key");
      const savedEmail = localStorage.getItem("trading_license_email");
      const isPremium = localStorage.getItem("trading_is_premium") === "true";
      const cachedExpiry = localStorage.getItem("trading_license_expiry_str");
      if (savedKey && savedEmail && isPremium && cachedExpiry) {
        return new Date(cachedExpiry).toLocaleDateString('vi-VN');
      }
    } catch {}
    return "Trọn đời (Unlimited)";
  });

  // Cumulative total trades activated counter inside localStorage
  const [totalTradesActivated, setTotalTradesActivated] = useState<number>(() => {
    try {
      const val = localStorage.getItem('total_trades_activated');
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  // Time bypass protection states
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isOfflineTimeHack, setIsOfflineTimeHack] = useState<boolean>(false);
  const [timeStatusMessage, setTimeStatusMessage] = useState<string>("");

  // System startup hook: fetches secure public internet time, prevent offline lùi giờ hacking, validates license expiry
  useEffect(() => {
    const validateTimeAndLicense = async () => {
      let now = new Date();
      let isOffline = false;

      try {
        setTimeStatusMessage("Đang đối soát thời gian thực tế...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5 seconds local timeout

        const res = await fetch("https://worldtimeapi.org/api/timezone/Etc/UTC", { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.utc_datetime) {
            now = new Date(data.utc_datetime);
          }
        } else {
          isOffline = true;
        }
      } catch {
        isOffline = true;
      }

      // Check max_time_recorded from localStorage
      let maxTimeRecordedMs = 0;
      try {
        const storedMax = localStorage.getItem("max_time_recorded");
        if (storedMax) {
          maxTimeRecordedMs = parseInt(storedMax, 10) || 0;
        }
      } catch {}

      const currentSystemMs = Date.now();

      if (isOffline) {
        if (currentSystemMs < maxTimeRecordedMs) {
          // Time-bypass hacking detected (User changed system clock backward)
          setIsOfflineTimeHack(true);
          setTimeStatusMessage("Cảnh báo: Phát hiện lùi thời gian thiết bị! Hãy kết nối mạng Internet để mở khóa.");
        } else {
          localStorage.setItem("max_time_recorded", String(currentSystemMs));
        }
      } else {
        // Online: record highest possible time marker
        const finalMaxTime = Math.max(currentSystemMs, now.getTime(), maxTimeRecordedMs);
        localStorage.setItem("max_time_recorded", String(finalMaxTime));
      }

      setCurrentTime(now);

      // Perform automatic license checks based on the reliable clock
      try {
        const savedKey = localStorage.getItem("trading_license_key");
        const savedEmail = localStorage.getItem("trading_license_email");
        if (savedKey && savedEmail) {
          let verification: { isValid: boolean; error?: string; expiryDateString?: string } = { isValid: false };
          try {
            const res = await fetch("/api/license/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: savedEmail, licenseKey: savedKey })
            });
            if (res.ok) {
              verification = await res.json();
            }
          } catch (e) {
            console.warn("Lỗi kiểm tra bản quyền trực tuyến, sử dụng bộ nhớ tạm:", e);
            const isLocalPremium = localStorage.getItem("trading_is_premium") === "true";
            const cachedExpiry = localStorage.getItem("trading_license_expiry_str");
            if (isLocalPremium && cachedExpiry) {
              verification = {
                isValid: true,
                expiryDateString: cachedExpiry
              };
            }
          }

          if (verification.isValid && verification.expiryDateString) {
            const expiryDateObj = new Date(verification.expiryDateString);
            if (now >= expiryDateObj) {
              // Grace period / license expired
              setIsPremium(false);
              localStorage.setItem("trading_is_premium", "false");
              setTimeStatusMessage(`Gói bản quyền Premium (${savedEmail}) đã hết hạn sử dụng!`);
              setShowPaywall(true);
            } else {
              setIsPremium(true);
              localStorage.setItem("trading_is_premium", "true");
              localStorage.setItem("trading_license_expiry_str", verification.expiryDateString);
              setPremiumExpiry(expiryDateObj.toLocaleDateString("vi-VN"));
            }
          } else {
            setIsPremium(false);
            localStorage.setItem("trading_is_premium", "false");
          }
        }
      } catch (e) {
        console.error("Error confirming local license state:", e);
      }
    };

    validateTimeAndLicense();
  }, []);

  const [showPaywall, setShowPaywall] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [paywallPlan, setPaywallPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // States for activation inputs
  const [activationEmail, setActivationEmail] = useState('');
  const [activationKey, setActivationKey] = useState('');
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isVerifyingActivation, setIsVerifyingActivation] = useState(false);

  // Dynamically decode billing details based on activation key entered or default selected plan
  const getBilledDetails = () => {
    const key = activationKey.trim();
    if (key.startsWith("RW-MTH-")) {
      return {
        plan: 'monthly' as const,
        originalPrice: 89000,
        finalPrice: 89000,
        discountText: "",
        hasDiscount: false,
        label: "Gói Tháng Tiêu Chuẩn"
      };
    } else if (key.startsWith("RW-YEAR-")) {
      return {
        plan: 'yearly' as const,
        originalPrice: 828000,
        finalPrice: 828000,
        discountText: "",
        hasDiscount: false,
        label: "Gói Năm Tiêu Chuẩn"
      };
    } else if (key.startsWith("RW5-MTH-")) {
      return {
        plan: 'monthly' as const,
        originalPrice: 89000,
        finalPrice: 84550,
        discountText: "✓ Đã áp dụng ưu đãi giảm bớt 5%",
        hasDiscount: true,
        label: "Gói Tháng Ưu Đãi 5%"
      };
    } else if (key.startsWith("RW10-YEAR-")) {
      return {
        plan: 'yearly' as const,
        originalPrice: 828000,
        finalPrice: 745200,
        discountText: "✓ Đã áp dụng ưu đãi giảm giá 10%",
        hasDiscount: true,
        label: "Gói Năm Ưu Đãi 10%"
      };
    }
    
    // Default fallback to user-selected paywallPlan
    return {
      plan: paywallPlan,
      originalPrice: paywallPlan === 'monthly' ? 89000 : 828000,
      finalPrice: paywallPlan === 'monthly' ? 89000 : 828000,
      discountText: "",
      hasDiscount: false,
      label: paywallPlan === 'monthly' ? "Gói Tháng Tiêu Chuẩn" : "Gói Năm VIP"
    };
  };

  const billedDetails = getBilledDetails();

  const getTransferContent = () => {
    const planName = billedDetails.plan === 'monthly' ? 'thang' : 'nam';
    const emailStr = activationEmail.trim() || 'email-cua-ban';
    const refStr = partnerRef ? ` ${partnerRef.toUpperCase()}` : '';
    return `goi ${planName} ${emailStr}${refStr}`;
  };



  const handleActivatePro = () => {
    setActivationError(null);
    const email = activationEmail.trim();
    const key = activationKey.trim();

    if (!email || !email.includes('@')) {
      setActivationError("Vui lòng nhập địa chỉ Email hợp lệ!");
      return;
    }
    if (!key) {
      setActivationError("Vui lòng nhập License Key Pro kích hoạt!");
      return;
    }

    setIsVerifyingActivation(true);
    // Secure online activation verification in standard fetch payload
    setTimeout(async () => {
      try {
        const res = await fetch("/api/license/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, licenseKey: key })
        });
        const verification = await res.json();
        setIsVerifyingActivation(false);

        if (res.ok && verification.isValid && verification.expiryDateString) {
          const expiryDateObj = new Date(verification.expiryDateString);
          const now = currentTime || new Date();
          if (now >= expiryDateObj) {
            setActivationError(`Mã kích hoạt này đã hết hạn vào ngày ${expiryDateObj.toLocaleDateString('vi-VN')}! Vui lòng gia hạn.`);
            return;
          }

          // Success!
          setIsPremium(true);
          localStorage.setItem('trading_is_premium', 'true');
          localStorage.setItem('trading_license_key', key);
          localStorage.setItem('trading_license_email', email);
          localStorage.setItem('trading_license_expiry_str', verification.expiryDateString);
          setPremiumExpiry(expiryDateObj.toLocaleDateString('vi-VN'));
          setPaymentSuccess(true);
          setActivationEmail('');
          setActivationKey('');
        } else {
          setActivationError(verification.error || "Mã kích hoạt không đúng hoặc Email không đúng!");
        }
      } catch (err) {
        setIsVerifyingActivation(false);
        setActivationError("Không liên kết được tới máy chủ xác minh bản quyền!");
        console.error(err);
      }
    }, 1200);
  };

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

  const handleCopyPaymentInfo = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => {
      setCopiedField(null);
    }, 1800);
  };

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


  // Real-time synchronization engine for active positions (Option A / Phương án A)
  useEffect(() => {
    if (activeTrades.length === 0) return;

    const syncActivePrices = async () => {
      const updates: Record<string, number> = {};
      let forexRates: Record<string, number> | null = null;

      // 1. Fetch Forex latest rates relative to USD if any forex active positions exist
      const hasForex = activeTrades.some(t => t.assetClass === 'forex');
      const hasCryptoStock = activeTrades.some(t => t.assetClass === 'crypto_stock');

      if (hasForex) {
        try {
          const res = await fetch('https://open.er-api.com/v6/latest/USD');
          if (res.ok) {
            const data = await res.json();
            forexRates = data.rates || null;
          }
        } catch (err) {
          console.warn("Forex exchange rates background fetch failed in sync engine:", err);
        }
      }

      // 2. Iterate and fetch each ticker price in parallel
      const fetchPromises = activeTrades.map(async (trade) => {
        try {
          if (trade.assetClass === 'forex') {
            const clean = trade.ticker.replace('/', '').toUpperCase();
            const baseCur = clean.substring(0, 3);
            const quoteCur = clean.substring(3, 6);
            
            let priceSet = false;

            // 1. Try Yahoo Finance live forex spot rates (perfect match with live broker feeds)
            let yahooTicker = '';
            if (clean.length === 6) {
              yahooTicker = `${clean}=X`;
            } else if (clean === 'XAU' || clean === 'GOLD') {
              yahooTicker = 'XAUUSD=X';
            } else if (clean === 'XAG' || clean === 'SILVER') {
              yahooTicker = 'XAGUSD=X';
            } else {
              yahooTicker = `${clean}=X`;
            }

            const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}`;
            const endpoints = [
              `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
              `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`
            ];

            for (const url of endpoints) {
              try {
                const res = await fetch(url);
                if (res.ok) {
                  let wrapper = await res.json();
                  if (wrapper.contents) {
                    wrapper = JSON.parse(wrapper.contents);
                  }
                  const price = wrapper.chart?.result?.[0]?.meta?.regularMarketPrice;
                  if (price && !isNaN(price)) {
                    updates[trade.id] = price;
                    priceSet = true;
                    break;
                  }
                }
              } catch (e) {
                console.warn("Sync: Forex spot rate fetch failed for url " + url, e);
              }
            }

            // 2. Try commodity futures yahoo fallback, e.g. GC=F or SI=F for gold/silver
            if (!priceSet && (clean === 'XAUUSD' || clean === 'XAGUSD' || baseCur === 'XAU' || baseCur === 'XAG')) {
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
                    let wrapper = await res.json();
                    if (wrapper.contents) {
                      wrapper = JSON.parse(wrapper.contents);
                    }
                    const price = wrapper.chart?.result?.[0]?.meta?.regularMarketPrice;
                    if (price && !isNaN(price)) {
                      updates[trade.id] = price;
                      priceSet = true;
                      break;
                    }
                  }
                } catch (e) {
                  console.warn("Sync: Commodity futures fetch failed for url " + url, e);
                }
              }

              // Try ER-API stable rates for commodities as secondary fallback
              if (!priceSet && forexRates) {
                const targetAsset = (clean === 'XAUUSD' || baseCur === 'XAU') ? 'XAU' : 'XAG';
                const assetRate = forexRates[targetAsset];
                if (assetRate && assetRate > 0) {
                  updates[trade.id] = 1 / assetRate;
                  priceSet = true;
                }
              }
            }

            // 3. Try general Forex open er-api fallback (stable interbank rates)
            if (!priceSet && forexRates) {
              const baseRate = forexRates[baseCur];
              const quoteRate = forexRates[quoteCur];
              
              if (baseRate && quoteRate) {
                const rate = quoteRate / baseRate;
                updates[trade.id] = rate;
                priceSet = true;
              }
            }
          } else {
            // Crypto / Stock
            const clean = trade.ticker.replace('/', '').toUpperCase();
            let priceFound = false;

            // Step 1: Detect and fetch as Vietnamese Stock via Entrade API
            const isVn = isVietnameseTicker(clean);
            if (isVn) {
              const endpoints = [
                `https://services.entrade.com.vn/api/v1/market/symbol/${clean}`,
                `https://corsproxy.io/?${encodeURIComponent(`https://services.entrade.com.vn/api/v1/market/symbol/${clean}`)}`,
                `https://api.allorigins.win/get?url=${encodeURIComponent(`https://services.entrade.com.vn/api/v1/market/symbol/${clean}`)}`
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
                      let finalPrice = rawPrice;
                      
                      // Normalize price units to match user's custom scale (normal vs thousands division scale)
                      if (trade.entryPrice < 1000 && rawPrice >= 1000) {
                        finalPrice = rawPrice / 1000;
                      } else if (trade.entryPrice > 1000 && rawPrice < 100) {
                        finalPrice = rawPrice * 1000;
                      }
                      
                      updates[trade.id] = finalPrice;
                      priceFound = true;
                      break;
                    }
                  }
                } catch (e) {
                  console.warn("Sync: Vietnam stock fetch failed with broker API url " + url, e);
                }
              }
            }

            // Step 2: Try as Crypto via Binance
            if (!priceFound && !isVn) {
              const binanceSymbol = clean.endsWith('USDT') ? clean : `${clean}USDT`;
              const endpoints = [
                `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
                `https://corsproxy.io/?${encodeURIComponent(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`)}`
              ];

              for (const url of endpoints) {
                try {
                  const res = await fetch(url);
                  if (res.ok) {
                    const data = await res.json();
                    const price = parseFloat(data.price);
                    if (!isNaN(price)) {
                      updates[trade.id] = price;
                      priceFound = true;
                      break;
                    }
                  }
                } catch (e) {
                  console.warn("Sync: Crypto binance fetch failed for url " + url, e);
                }
              }
            }

            // Step 3: Try as US Stock via Yahoo Finance Proxy
            if (!priceFound) {
              const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${clean}`;
              const endpoints = [
                `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
                `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`
              ];

              for (const url of endpoints) {
                try {
                  const res = await fetch(url);
                  if (res.ok) {
                    let wrapper = await res.json();
                    if (wrapper.contents) {
                      wrapper = JSON.parse(wrapper.contents);
                    }
                    const price = wrapper.chart?.result?.[0]?.meta?.regularMarketPrice;
                    if (price && !isNaN(price)) {
                      updates[trade.id] = price;
                      priceFound = true;
                      break;
                    }
                  }
                } catch (e) {
                  console.warn("Sync: US stock yahoo fetch failed with url " + url, e);
                }
              }
            }

            // Step 4: Fallback drifting simulation
            if (!priceFound) {
              const currentPrice = trade.currentPrice || 100;
              const randomShift = (Math.random() * 0.1 - 0.05) / 105;
              const nextPrice = currentPrice * (1 + randomShift);
              const precision = currentPrice > 100 ? 2 : (currentPrice > 1 ? 4 : 6);
              updates[trade.id] = parseFloat(nextPrice.toFixed(precision));
            }
          }
        } catch (err) {
          // Microscopic price adjustment drift fallback
          const currentPrice = trade.currentPrice;
          const randomShift = (Math.random() * 0.1 - 0.05) / 100;
          const nextPrice = currentPrice * (1 + randomShift);
          const precision = currentPrice > 100 ? 2 : (currentPrice > 1 ? 4 : 6);
          updates[trade.id] = parseFloat(nextPrice.toFixed(precision));
        }
      });

      await Promise.all(fetchPromises);

      // Batch apply updates
      if (Object.keys(updates).length > 0) {
        handleBatchUpdatePrices(updates);
      }
    };

    // Initial load after 1s, then poll every 15s
    const timeoutId = setTimeout(syncActivePrices, 1000);
    const intervalId = setInterval(syncActivePrices, 15000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [activeTrades.length]);


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

    // Increment and persist total lifetime trade activation count
    setTotalTradesActivated(prev => {
      const nextVal = prev + 1;
      localStorage.setItem('total_trades_activated', String(nextVal));
      return nextVal;
    });

    setShowWarningModal(false);
    setShowDailyLimitModal(false);
    setActiveTab('portfolio');
  };

  const handleCloseTrade = (id: string, outcome: 'won' | 'lost', finalPrice?: number) => {
    const trade = activeTrades.find(t => t.id === id);
    if (!trade) return;

    // Tính toán "lợi nhuận thực tế" (Locked PnL via Trailing Stop) tương ứng với cột Lợi Nhuận Thực Tế
    let roundedLocked = 0;
    const hasActualProfit = trade.trailingStopPrice !== undefined && trade.trailingStopPrice !== null;
    if (hasActualProfit) {
      let lockedPnl = 0;
      const isLong = trade.direction === 'long';
      if (trade.assetClass === 'forex') {
        const pairConfig = FOREX_PAIRS.find(p => p.symbol === trade.ticker);
        const pipSize = pairConfig?.pipSize || 0.0001;
        const pipValLot = trade.lots !== undefined 
          ? (FOREX_PAIRS.find(p => p.symbol === trade.ticker)?.defaultPipValueUSD || 10) 
          : 10;
        
        const pipsDiff = (trade.trailingStopPrice - trade.entryPrice) / pipSize;
        const multiplier = isLong ? 1 : -1;
        
        lockedPnl = pipsDiff * (trade.lots || 0) * pipValLot * multiplier;
      } else {
        const priceDiff = isLong ? (trade.trailingStopPrice - trade.entryPrice) : (trade.entryPrice - trade.trailingStopPrice);
        lockedPnl = priceDiff * trade.units;
      }
      roundedLocked = Math.round(lockedPnl * 100) / 100;
    }

    let correctedPnl: number;
    let finalOutcome: 'won' | 'lost' = outcome;

    if (hasActualProfit) {
      // Nếu cột "lợi nhuận thực tế" có giá trị, lấy theo cột đó
      correctedPnl = roundedLocked;
      finalOutcome = correctedPnl >= 0 ? 'won' : 'lost';
    } else {
      // Nếu không, lấy theo cột "lợi nhuận (PNL)" bên cạnh (trade.pnl)
      correctedPnl = trade.pnl;
      finalOutcome = trade.pnl >= 0 ? 'won' : 'lost';
    }

    const finalPnl = Math.round(correctedPnl * 100) / 100;

    const closed: PortfolioTrade = {
      ...trade,
      status: finalOutcome,
      pnl: finalPnl,
      enteredAt: trade.enteredAt
    };

    // Optimistically update states
    setClosedTrades(history => {
      if (history.some(t => t.id === id)) return history;
      return [closed, ...history];
    });
    setActiveTrades(prev => prev.filter(t => t.id !== id));
    
    // Cập nhật số dư tài khoản bằng cách cộng PnL của vị thế vừa đóng
    setSetup(prev => ({
      ...prev,
      accountBalance: Math.round((prev.accountBalance + finalPnl) * 100) / 100
    }));
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
        pnl: finalPnl,
        isPriceUpdated: true
      };
    }));
  };

  const handleBatchUpdatePrices = (updates: Record<string, number>) => {
    setActiveTrades(prev => prev.map(trade => {
      const newPrice = updates[trade.id];
      if (newPrice === undefined) return trade;
      
      let calculatedPnl = 0;
      const isLong = trade.direction === 'long';
      
      if (trade.assetClass === 'forex') {
        const pairConfig = FOREX_PAIRS.find(p => p.symbol === trade.ticker);
        const pipSize = pairConfig?.pipSize || 0.0001;

        const isJpyQuote = trade.ticker.endsWith('/JPY') || trade.ticker.endsWith('JPY');
        const isUsdQuote = trade.ticker.endsWith('/USD') || trade.ticker === 'EUR/USD'
          || trade.ticker === 'GBP/USD' || trade.ticker === 'AUD/USD' || trade.ticker === 'NZD/USD';
        const isUsdBase = trade.ticker.startsWith('USD/');

        let pipValuePerLot: number;
        if (isUsdQuote) {
          pipValuePerLot = pairConfig?.defaultPipValueUSD || 10;
        } else if (isJpyQuote) {
          const standardLot = pairConfig?.standardLotUnits || 100000;
          pipValuePerLot = (pipSize * standardLot) / newPrice;
        } else if (isUsdBase) {
          const standardLot = pairConfig?.standardLotUnits || 100000;
          pipValuePerLot = (pipSize * standardLot) / newPrice;
        } else {
          pipValuePerLot = pairConfig?.defaultPipValueUSD || 10;
        }

        const pipsDiff = (newPrice - trade.entryPrice) / pipSize;
        const multiplier = isLong ? 1 : -1;
        calculatedPnl = pipsDiff * (trade.lots || 0) * pipValuePerLot * multiplier;
      } else {
        const priceDiff = isLong ? (newPrice - trade.entryPrice) : (trade.entryPrice - newPrice);
        calculatedPnl = priceDiff * trade.units;
      }
      
      const finalPnl = Math.round(calculatedPnl * 100) / 100;
      
      return {
        ...trade,
        currentPrice: newPrice,
        pnl: finalPnl,
        isPriceUpdated: true
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
              <ShieldCheck className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <h1 className="font-sans font-black text-white text-sm tracking-wide sm:text-base leading-none uppercase">
                RiskWise <span className="text-indigo-400 font-light">Management</span>
              </h1>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">
                Nền tảng quản lý rủi ro chuyên nghiệp dành cho Trader
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">

            {/* Premium Indicator Badge/Toggle Button */}
            {isPremium ? (
              <div 
                onClick={() => setShowPaywall(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/35 rounded-xl text-[11px] font-black cursor-pointer transition uppercase tracking-wider select-none shadow-sm shadow-amber-950/40"
                title="Xem thông tin Premium VIP của bạn"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>PREMIUM VIP</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowPaywall(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border border-amber-500/20 text-slate-900 rounded-xl text-[11px] font-black cursor-pointer transition uppercase tracking-wider select-none shadow-md shadow-amber-950/30 font-sans"
                title="Nâng cấp Premium gỡ bỏ giới hạn rủi ro"
              >
                <Crown className="w-3.5 h-3.5 text-slate-900" />
                <span>Nâng cấp VIP</span>
              </button>
            )}

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
                        href={AFFILIATE_LINKS.exness}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1C212D] text-slate-250 transition font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Exness Global</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                      <a
                        href={AFFILIATE_LINKS.the5ers}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1C212D] text-slate-250 transition font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                          <span>The5ers Prop Firm</span>
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
            Tính Toán Vị Thế
          </button>
          
          <button
            onClick={() => {
              setActiveTab('portfolio');
            }}
            className={`py-2.5 px-4.5 text-xs font-bold transition flex items-center gap-2 border-b-2 hover:text-white cursor-pointer select-none shrink-0 ${
              activeTab === 'portfolio'
                ? 'border-emerald-500 text-white bg-[#14171F]/50 rounded-t-xl'
                : 'border-transparent text-slate-450'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-400" />
            Quản Lý Rủi Ro
            {activeTrades.length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full font-mono">
                {activeTrades.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('plans');
            }}
            className={`py-2.5 px-4.5 text-xs font-bold transition flex items-center gap-2 border-b-2 hover:text-white cursor-pointer select-none shrink-0 ${
              activeTab === 'plans'
                ? 'border-yellow-500 text-white bg-[#14171F]/50 rounded-t-xl'
                : 'border-transparent text-slate-450'
            }`}
          >
            <FileText className="w-4 h-4 text-yellow-500" />
            Kế Hoạch Giao Dịch
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
              {/* Column 1: Core Inputs & Checklist (Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Pre-Trade Checklist (Placed on top for maximum priority) */}
                <PreTradeChecklist
                  items={checklist}
                  onToggleCheck={handleToggleCheck}
                  onAddItem={handleAddChecklistItem}
                  onDeleteItem={handleDeleteChecklistItem}
                />

                {/* Core Inputs Card */}
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
                          : 'text-slate-455 hover:text-slate-200'
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
                          : 'text-slate-455 hover:text-slate-200'
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
                        <span className="absolute left-3.5 top-3.5 text-slate-550 font-bold text-xs">%</span>
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
                        className="w-full h-1.5 bg-[#1C212D] rounded-full appearance-none cursor-pointer accent-indigo-550"
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

              {/* Column 2: Chart & Results Dashboard (Span 7) */}
              <div className="lg:col-span-7 space-y-6">
                {/* TradingView Live Chart widget */}
                <TradingViewWidget
                  setup={setup}
                  onApplyLivePrice={(price) => setSetup(prev => ({ ...prev, entryPrice: price }))}
                />

                {/* Grid container for Results side-by-side with RiskMeter and Affiliate */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fadeIn">
                  
                  {/* Results column */}
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

                  {/* Meter & Affiliate column */}
                  <div className="space-y-6 flex flex-col justify-between">
                    {/* Live risk evaluation meter */}
                    <div className="flex-1">
                      <RiskMeter 
                        balance={setup.accountBalance} 
                        riskAmount={result.riskAmount} 
                        riskPercentage={riskPct} 
                      />
                    </div>

                    {/* Affiliate banner */}
                    <div className="bg-[#14171F] border border-indigo-950/70 rounded-2xl p-4.5 text-xs text-indigo-300 relative overflow-hidden flex items-start gap-3 shadow-xs">
                      <div className="p-2 rounded-xl bg-indigo-950/50 text-indigo-400 mt-0.5 shrink-0">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-100 text-xs tracking-wide uppercase">Mẹo Tối Ưu Chi Phí Trading</h4>
                        <p className="text-[11px] text-slate-401 leading-relaxed font-sans mt-0.5">
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
                            href={AFFILIATE_LINKS.exness} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-amber-500 hover:underline inline-flex items-center gap-1 font-bold text-[10.5px]"
                          >
                            Exness <ExternalLink className="w-3 h-3" />
                          </a>
                          <a 
                            href={AFFILIATE_LINKS.the5ers} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sky-400 hover:underline inline-flex items-center gap-1 font-bold text-[10.5px]"
                          >
                            The5ers <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Subtle Watermark Credit in bottom-right corner */}
                <div className="flex justify-end items-center gap-2 mt-4 select-none pb-2">
                  <span className="font-mono text-[9px] text-slate-500/45 uppercase tracking-widest leading-none">
                    {partnerRef 
                      ? `Được giới thiệu bởi ${partnerRef.toUpperCase()}` 
                      : "Được quản lý rủi ro bởi RiskWise"}
                  </span>
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
              className="pb-12 relative min-h-[400px]"
            >
              <div>
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
                  dailyLimitPercent={setup.dailyLimitPercent}
                  dailyDisciplineLogs={dailyDisciplineLogs}
                  onClearDisciplineLogs={() => {
                    setDailyDisciplineLogs([]);
                  }}
                  isPremium={isPremium}
                  totalTradesActivated={totalTradesActivated}
                  isOfflineTimeHack={isOfflineTimeHack}
                  currentTime={currentTime}
                  onTriggerPaywall={() => setShowPaywall(true)}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'plans' && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="pb-12 relative min-h-[400px]"
            >
              <div>
                <TradingPlanManager
                  plans={plans}
                  onAddPlan={handleAddPlan}
                  onDeletePlan={handleDeletePlan}
                  onUpdatePlanStatus={handleUpdatePlanStatus}
                  onImportPlanToCalc={handleImportPlanToCalc}
                />
              </div>
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
              className="bg-[#14171F] border border-red-500/40 rounded-2xl p-6 sm:p-7 max-w-md sm:max-w-[490px] w-full shadow-2xl relative overflow-hidden text-center"
            >
              <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="mx-auto w-12 h-12 rounded-xl bg-red-955/45 border border-red-900/40 text-red-400 flex items-center justify-center mb-4 shadow-md">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="text-red-400 font-black text-base sm:text-lg uppercase tracking-widest font-sans flex items-center justify-center gap-1.5">
                Cảnh Báo: Chạm Giới Hạn Rủi Ro!
              </h3>
              
              <p className="text-xs sm:text-sm text-rose-300 font-bold font-sans mt-1">
                Giao dịch này vượt Giới hạn Rủi ro hàng ngày của bạn!
              </p>

              <div className="mt-4 p-4 bg-[#1C212D]/85 border border-red-900/35 rounded-xl text-left space-y-2.5 text-xs sm:text-[13px]">
                <div className="flex justify-between items-center text-slate-300 font-semibold gap-2">
                  <span>Giới hạn rủi ro Ngày ({setup.dailyLimitPercent}%):</span>
                  <span className="font-mono text-white text-xs sm:text-sm font-extrabold">${dailyLimitWarningData.allowedLimitUSD.toLocaleString('en-US', { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 font-semibold gap-2">
                  <span>Rủi ro đã tích lũy hôm nay:</span>
                  <span className="font-mono text-slate-205 text-xs sm:text-sm font-extrabold">${dailyLimitWarningData.todayRiskRisk.toLocaleString('en-US', { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 font-semibold gap-2">
                  <span>Rủi ro vị thế chuẩn bị vào:</span>
                  <span className="font-mono text-red-400 text-xs sm:text-sm font-extrabold">+${dailyLimitWarningData.newTradeRisk.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2.5 border-t border-slate-750 flex justify-between items-center font-black text-sm sm:text-base">
                  <span className="text-slate-200">Tổng rủi ro dự kiến:</span>
                  <span className="font-mono text-red-500">${(dailyLimitWarningData.todayRiskRisk + dailyLimitWarningData.newTradeRisk).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-[11px] sm:text-[11.5px] text-red-400/95 font-semibold leading-relaxed italic text-center pt-1 block">
                  *(Hệ thống đã nhận diện mức vượt hạn mức rủi ro tối đa cố định: vượt quá ${(dailyLimitWarningData.todayRiskRisk + dailyLimitWarningData.newTradeRisk - dailyLimitWarningData.allowedLimitUSD).toLocaleString('en-US', { maximumFractionDigits: 1 })} USD)
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <p className="text-xs text-slate-300 font-sans font-medium leading-relaxed">
                  Để ghi đè và lưu vị thế vi phạm này, bạn bắt buộc phải gõ tay chính xác cụm từ sau để nhận thức việc phá vỡ kỷ luật:
                </p>
                <div className="bg-[#1C212D] px-3.5 py-2.5 text-xs font-mono text-[#F43F5E] select-none font-black tracking-widest border border-red-900/60 rounded-xl text-center">
                  Tôi chấp nhận phá vỡ kỷ luật
                </div>
                <input
                  type="text"
                  placeholder="Gõ chính xác dòng chữ trên tại đây..."
                  value={forcePhraseInput}
                  onChange={(e) => setForcePhraseInput(e.target.value)}
                  className="w-full bg-[#1C212D]/95 border border-slate-705 text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-[#EF4444]/20 font-sans text-xs sm:text-sm font-semibold text-center py-2.5 px-3.5 rounded-xl transition duration-150"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3.5">
                <button
                  type="button"
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
              className="bg-[#14171F] border border-rose-900/50 rounded-2xl p-6 sm:p-7 max-w-md sm:max-w-[490px] w-full shadow-2xl relative overflow-hidden text-center"
            >
              <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none"></div>

              <div className="mx-auto w-12 h-12 rounded-xl bg-rose-955/45 border border-rose-900/40 text-rose-400 flex items-center justify-center mb-4 shadow-md">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="text-slate-100 font-extrabold text-base sm:text-lg uppercase tracking-widest font-sans">
                Cảnh báo Quy tắc Kỷ luật!
              </h3>
              
              <div className="mt-4 space-y-3.5 text-xs text-slate-300 font-sans leading-relaxed">
                <p className="font-semibold text-slate-200">
                  Bạn chưa tích chọn đầy đủ các tiêu chí <span className="text-rose-400 font-black uppercase">Bắt buộc</span> trong Checklist giao dịch trước khi vào lệnh.
                </p>
                
                <div className="p-3.5 sm:p-4 bg-[#1C212D]/80 border border-rose-900/40 rounded-xl text-left text-xs font-semibold text-rose-350 font-sans">
                  <span className="font-extrabold block text-rose-400 text-xs sm:text-[13px] mb-2 border-b border-rose-950/40 pb-1.5">Các tiêu chí bị bỏ qua gồm:</span>
                  <div className="max-h-24 overflow-y-auto pr-1 select-text scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(244,63,94,0.3) transparent' }}>
                    <ul className="list-disc leading-relaxed pl-4.5 space-y-1.5 text-rose-300">
                      {checklist.filter(item => item.isRequired && !item.isChecked).map(item => (
                        <li key={item.id} className="text-rose-250/90 font-medium">{item.text}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="text-[11px] sm:text-xs italic text-slate-400 font-medium leading-relaxed">
                  ⚠️ Việc vào lệnh thiếu điều kiện là nguyên nhân cốt lõi gây sụt giảm tài khoản đáng tiếc.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowWarningModal(false)}
                  className="py-2.5 px-4 bg-[#1e2330] hover:bg-slate-700 text-slate-200 text-xs font-black rounded-xl cursor-pointer transition duration-150 uppercase tracking-wider font-sans"
                >
                  Quay lại Checklist
                </button>
                <button
                  type="button"
                  onClick={() => executeAndLogTrade(true)} // force pass, marked as unchecked warning
                  className="py-2.5 px-4 bg-rose-950/50 hover:bg-rose-900/40 text-rose-300 border border-rose-900/30 text-xs font-black rounded-xl cursor-pointer transition duration-150 uppercase tracking-wider font-sans"
                >
                  Vẫn giao dịch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREMIUM PAYWALL MODAL (Rule 5 & 10) */}
      <AnimatePresence>
        {showPaywall && (
          <div className="fixed inset-0 bg-[#06080C]/90 backdrop-blur-xs flex items-center justify-center p-3 z-100 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#141720] border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-2xl w-full my-auto shadow-2xl relative overflow-hidden max-h-[95vh] flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowPaywall(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto pr-1 custom-scrollbar space-y-4 flex-1 select-none">
                {isPremium ? (
                  <div id="premium-active-panel" className="text-center py-5 space-y-4">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-950/20">
                      <Crown className="w-7 h-7 text-amber-400 animate-pulse" />
                    </div>

                    <h3 className="text-lg font-black text-amber-400 uppercase tracking-widest font-sans">
                      BẠN LÀ THÀNH VIÊN PREMIUM!
                    </h3>
                    <p className="text-[11px] text-indigo-400 uppercase tracking-widest font-semibold font-sans">
                      CƠ CHẾ BẢO MẬT VIÊN MÀN - KỶ LUẬT CHIẾN THẮNG
                    </p>

                    <div className="p-4 bg-[#10131A] border border-slate-850 rounded-2xl max-w-md mx-auto text-left space-y-2.5 text-xs sm:text-sm leading-relaxed font-sans">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-850/60">
                        <span className="text-slate-400 font-medium">Email bản quyền:</span>
                        <span className="font-bold text-slate-100">{localStorage.getItem('trading_license_email') || 'premium@riskwise.pro'}</span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-850/60 font-sans">
                        <span className="text-slate-400 font-medium font-sans">Trạng thái:</span>
                        <span className="flex items-center gap-1.5 text-emerald-400 font-extrabold uppercase text-[10px] tracking-wider font-sans">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          Đã kích hoạt bản quyền
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-850/60 font-sans">
                        <span className="text-slate-400 font-medium font-sans">Tính năng PRO:</span>
                        <span className="font-bold text-slate-100 flex items-center gap-1 font-sans">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Mở khoá toàn phần 100%
                        </span>
                      </div>

                      <div className="flex justify-between items-center font-sans">
                        <span className="text-slate-400 font-medium font-sans">Hạn dùng (Bản quyền):</span>
                        <span className="font-extrabold text-amber-400 flex items-center gap-1 font-mono text-xs">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          {premiumExpiry}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto font-sans">
                      Tài khoản của bạn đã được chứng thực bằng thuật toán giải mã cục bộ. Toàn bộ vị thế mở rộng đã sẵn sàng phục vụ bạn trọn đời.
                    </p>

                    <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center font-sans">
                      <button
                        onClick={() => setShowPaywall(false)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition uppercase tracking-wider font-sans"
                      >
                        Quay lại màn hình chính
                      </button>
                      <button
                        onClick={() => {
                          setIsPremium(false);
                          localStorage.setItem('trading_is_premium', 'false');
                          localStorage.removeItem('trading_license_key');
                          localStorage.removeItem('trading_license_email');
                          setPaymentSuccess(false);
                        }}
                        className="text-rose-400 hover:text-rose-300 text-xs font-bold uppercase tracking-wider bg-transparent border-none cursor-pointer hover:underline transition font-sans"
                      >
                        Huỷ trạng thái Premium (Về Free Demo)
                      </button>
                    </div>
                  </div>
                ) : (
                  /* CHECKOUT / UPGRADE FLOW */
                  <div id="premium-checkout-panel">
                    {paymentSuccess ? (
                      /* SUCCESS SCREEN */
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-7 space-y-4 font-sans"
                      >
                        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-950/20 border border-emerald-500 text-emerald-400 flex items-center justify-center shadow-xl">
                          <Check className="w-7 h-7 text-emerald-400 font-bold" />
                        </div>
                        <h3 className="text-base font-black text-white uppercase tracking-widest font-sans">
                          KÍCH HOẠT THÀNH CÔNG!
                        </h3>
                        <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mt-1 font-sans">
                          Chào mừng bạn đến với RiskWise Premium Pro
                        </p>
                        <p className="text-slate-350 text-sm leading-relaxed max-w-md mx-auto mt-2 px-4 font-normal font-sans">
                          Bản quyền của bạn đã kích hoạt thành công trên thiết bị này! Các Tab nâng cao đã được mở rộng.
                        </p>
                        
                        <button
                          onClick={() => {
                            setShowPaywall(false);
                            setPaymentSuccess(false);
                          }}
                          className="mt-4 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl cursor-pointer shadow-md uppercase tracking-wider transition font-sans"
                        >
                          BẮT ĐẦU TRADING VỚI PRO
                        </button>
                      </motion.div>
                    ) : (
                      <div className="space-y-4 font-sans">
                        {/* Header Title */}
                        <div className="text-center">
                          <div className="mx-auto w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-1.5 font-sans">
                            <Crown className="w-5 h-5 text-amber-400" />
                          </div>
                          <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-widest font-sans">
                            MỞ KHÓA PREMIUM PRO 👑
                          </h3>
                          <p className="text-slate-400 text-xs mt-1 font-sans leading-relaxed">
                            {totalTradesActivated > 50 ? (
                              <span className="text-amber-400 font-bold">
                                Bạn đã tích lũy {totalTradesActivated} lượt lưu lệnh (Hạn mức Free: 50).
                              </span>
                            ) : (
                              <span>Hạn mức lưu lệnh tích lũy: {totalTradesActivated}/50.</span>
                            )}{' '}
                            Hãy nâng cấp để mở khóa toàn bộ tính năng giám sát vị thế trọn đời.
                          </p>
                        </div>

                        {/* AREA 1: BẢNG GIÁ 2 CỘT CHIM MỒI */}
                        <div className="grid grid-cols-2 gap-3.5 items-stretch">
                          {/* GÓI THÁNG - VIỀN XÁM MỜ - TỐI GIẢN */}
                          <div 
                            onClick={() => {
                              const key = activationKey.trim();
                              if (!key.startsWith("RW-MTH-") && !key.startsWith("RW-YEAR-") && !key.startsWith("RW5-MTH-") && !key.startsWith("RW10-YEAR-")) {
                                setPaywallPlan('monthly');
                              }
                            }}
                            className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer flex flex-col justify-between relative ${
                              billedDetails.plan === 'monthly'
                                ? 'bg-slate-900 border-slate-700 text-white shadow-lg'
                                : 'bg-slate-950/40 border-slate-850/80 text-slate-400 hover:border-slate-800 hover:bg-slate-900/10'
                            }`}
                          >
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Gói Tháng</div>
                              <div className="font-mono text-base sm:text-lg font-black text-slate-200 mt-1 font-sans">89.000 VNĐ</div>
                              <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium font-sans">Phù hợp trải nghiệm ngắn hạn, gia hạn hàng tháng.</p>
                            </div>
                          </div>

                          {/* GÓI NĂM - NỔI BẬT KHUYÊN DÙNG */}
                          <div 
                            onClick={() => {
                              const key = activationKey.trim();
                              if (!key.startsWith("RW-MTH-") && !key.startsWith("RW-YEAR-") && !key.startsWith("RW5-MTH-") && !key.startsWith("RW10-YEAR-")) {
                                setPaywallPlan('yearly');
                              }
                            }}
                            className={`p-3.5 rounded-2xl border-2 transition duration-200 cursor-pointer flex flex-col justify-between relative ${
                              billedDetails.plan === 'yearly'
                                ? 'bg-[#10131e] border-amber-500 text-white shadow-xl'
                                : 'bg-slate-950/40 border-slate-850/85 text-slate-400 hover:border-slate-755 hover:bg-slate-900/15'
                            }`}
                          >
                            <span className="absolute -top-2 left-3 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[8px] font-black uppercase rounded tracking-wider shadow-sm font-sans">
                              TIẾT KIỆM 22%
                            </span>

                            <div>
                              <div className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1 font-sans">
                                <Sparkles className="w-3 h-3 text-amber-400 shrink-0 font-sans" />
                                Gói Năm VIP
                              </div>
                              <div className="font-mono text-base sm:text-lg font-black text-amber-400 mt-1 font-sans">828.000 VNĐ</div>
                              <p className="text-[10px] text-slate-350 leading-none mt-1 font-semibold font-sans">
                                (chỉ 69.000 VNĐ/ tháng) tiết kiệm ngay 22%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* AREA 1.5: THÔNG TIN THANH TOÁN CHUYỂN KHOẢN VÀ QR CODE */}
                        <div className="bg-[#10131A] border border-slate-800/80 p-3.5 sm:p-4 rounded-2xl space-y-3 font-sans shadow-lg">
                          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-850/65">
                            <CreditCard className="w-4 h-4 text-amber-500" />
                            <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-wider font-sans">
                              HƯỚNG DẪN THANH TOÁN CHUYỂN KHOẢN
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center font-sans">
                            {/* QR CODE GENERATOR COLUMN - ENLARGED */}
                            <div className="sm:col-span-5 flex flex-col items-center text-center justify-center font-sans">
                              <div className="bg-white p-2.5 rounded-2xl shadow-xl w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center select-none border border-slate-800/15 font-sans transform hover:scale-[1.03] transition-transform duration-300">
                                <img
                                  referrerPolicy="no-referrer"
                                  src={`https://img.vietqr.io/image/TCB-19050048400017-qr_only.png?amount=${
                                    billedDetails.finalPrice
                                  }&addInfo=${encodeURIComponent(
                                    getTransferContent()
                                  )}&accountName=BE%2520QUANG%2520HUY`}
                                  alt="VietQR Techcombank Scanner"
                                  className="w-full h-full object-contain rounded-xl"
                                />
                              </div>
                              <span className="text-[10px] text-amber-500 uppercase tracking-wider font-black mt-3 flex items-center gap-1.5 font-sans">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse font-sans"></span>
                                QUÉT QR TỰ ĐỘNG SIÊU TỐC
                              </span>
                            </div>

                            {/* TEXT INFO & COPYABLE FIELDS COLUMN */}
                            <div className="sm:col-span-7 space-y-2 text-xs font-sans">
                              <div className="grid grid-cols-10 gap-1.5 items-center font-sans">
                                <span className="col-span-3 text-slate-400 font-semibold text-[11px] font-sans">Ngân hàng:</span>
                                <div className="col-span-7 flex items-center justify-between bg-[#0e111a] px-3 py-1.5 rounded-xl border border-slate-800/80 font-sans">
                                  <span className="font-bold text-slate-200 text-xs font-sans">Techcombank</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPaymentInfo('Techcombank', 'bank_name')}
                                    className="text-slate-400 hover:text-amber-400 p-0.5 transition cursor-pointer font-sans"
                                  >
                                    {copiedField === 'bank_name' ? <Check className="w-3.5 h-3.5 text-emerald-400 font-sans" /> : <Copy className="w-3.5 h-3.5 font-sans" />}
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-10 gap-1.5 items-center font-sans">
                                <span className="col-span-3 text-slate-400 font-semibold text-[11px] font-sans">Số tài khoản:</span>
                                <div className="col-span-7 flex items-center justify-between bg-[#0e111a] px-3 py-1.5 rounded-xl border border-slate-800/80 font-mono font-sans">
                                  <span className="font-black text-white text-xs select-all font-sans">19050048400017</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPaymentInfo('19050048400017', 'bank_no')}
                                    className="text-slate-400 hover:text-amber-400 p-0.5 transition cursor-pointer font-sans"
                                  >
                                    {copiedField === 'bank_no' ? <Check className="w-3.5 h-3.5 text-emerald-400 font-sans" /> : <Copy className="w-3.5 h-3.5 font-sans" />}
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-10 gap-1.5 items-center font-sans">
                                <span className="col-span-3 text-slate-400 font-semibold text-[11px] font-sans">Chủ tài khoản:</span>
                                <div className="col-span-7 flex items-center justify-between bg-[#0e111a] px-3 py-1.5 rounded-xl border border-slate-800/80 font-sans">
                                  <span className="font-bold text-slate-100 text-xs font-sans">BE QUANG HUY</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPaymentInfo('BE QUANG HUY', 'bank_acc')}
                                    className="text-slate-400 hover:text-amber-400 p-0.5 transition cursor-pointer font-sans"
                                  >
                                    {copiedField === 'bank_acc' ? <Check className="w-3.5 h-3.5 text-emerald-400 font-sans" /> : <Copy className="w-3.5 h-3.5 font-sans" />}
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-10 gap-1.5 items-center font-sans">
                                <span className="col-span-3 text-slate-400 font-semibold text-[11px] font-sans">Số tiền:</span>
                                <div className="col-span-7 flex flex-col gap-1">
                                  <div className="flex items-center justify-between bg-[#0e111a] px-3 py-1.5 rounded-xl border border-slate-800/80 font-mono font-extrabold text-[#F59E0B] font-sans">
                                    <span className="text-amber-400 font-black text-xs select-all font-sans">
                                      {billedDetails.finalPrice.toLocaleString('vi-VN')} VNĐ
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPaymentInfo(String(billedDetails.finalPrice), 'bank_amt')}
                                      className="text-slate-400 hover:text-amber-400 p-0.5 transition cursor-pointer font-sans"
                                    >
                                      {copiedField === 'bank_amt' ? <Check className="w-3.5 h-3.5 text-emerald-400 font-sans" /> : <Copy className="w-3.5 h-3.5 font-sans" />}
                                    </button>
                                  </div>
                                  {billedDetails.hasDiscount && (
                                    <span className="text-[10px] text-emerald-400 font-bold leading-none font-sans px-1 text-left">
                                      {billedDetails.discountText}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-350 leading-relaxed bg-amber-500/[0.02] border border-amber-550/10 p-3 rounded-xl font-sans font-medium text-left">
                            <span className="text-amber-450 font-bold block mb-1 text-xs uppercase tracking-wider">📌 CÚ PHÁP CHUYỂN KHOẢN:</span>
                            Khách hàng mua gói vui lòng chuyển khoản với nội dung: <span className="text-amber-400 font-extrabold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Cú pháp chính xác</span> (ví dụ: <span className="text-white italic font-bold select-all">{getTransferContent()}</span>).
                          </div>
                        </div>

                        {/* AREA 2: FORM NHẬP MÃ BẮT BUỘC DỄ DÀNG */}
                        <div className="bg-[#141722]/90 border border-slate-800 p-4 rounded-2xl space-y-4 shadow-inner font-sans">
                          <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                            <Crown className="w-4 h-4 text-amber-400 shrink-0 font-sans" />
                            Kích Hoạt Tài Khoản Premium Pro
                          </h4>

                          {activationError && (
                            <div className="p-2.5 bg-red-955/20 border border-red-900/40 text-red-405 text-xs rounded-xl flex items-start gap-1.5 select-text font-sans">
                              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 mt-0.5 font-sans" />
                              <span className="font-semibold leading-normal font-sans">{activationError}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-sans">
                            {/* Ô 1: Email người dùng */}
                            <div className="space-y-1 font-sans">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Email đăng ký cấp mã:</label>
                              <input
                                type="email"
                                required
                                placeholder="Nhập địa chỉ Email của bạn..."
                                value={activationEmail}
                                onChange={(e) => setActivationEmail(e.target.value)}
                                className="w-full bg-[#0b0d13] border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none text-xs py-2 px-3 rounded-lg transition duration-150 font-sans"
                              />
                            </div>

                            {/* Ô 2: License Key */}
                            <div className="space-y-1 font-sans">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Mã kích hoạt (License Key Pro):</label>
                              <input
                                type="text"
                                required
                                placeholder="Nhập License Key Pro (RWP-...)"
                                value={activationKey}
                                onChange={(e) => setActivationKey(e.target.value)}
                                className="w-full bg-[#0b0d13] border border-slate-850 text-slate-100 placeholder-slate-600 font-mono text-xs py-2 px-3 rounded-lg transition duration-150 font-sans"
                              />
                            </div>
                          </div>

                          {/* Nút bấm Kích hoạt */}
                          <button
                            type="button"
                            onClick={handleActivatePro}
                            disabled={isVerifyingActivation}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl transition duration-150 uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20 shrink-0 cursor-pointer font-sans"
                          >
                            {isVerifyingActivation ? (
                              <>
                                <span className="w-4 h-4 border-2 border-slate-950 border-t-amber-400 rounded-full animate-spin font-sans"></span>
                                ĐANG CHỨNG THỰC LICENSE KEY...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-slate-950 font-extrabold font-sans" />
                                KÍCH HOẠT PRO
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
