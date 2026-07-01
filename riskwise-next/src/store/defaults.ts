import type { AppData, Checklist, ChecklistItem, TradeSetup } from "../lib/types";
import { uid } from "../lib/format";

export const DATA_VERSION = 2;

export const defaultSetup = (): TradeSetup => ({
  assetClass: "forex",
  direction: "long",
  accountBalance: 10000,
  accountCurrency: "USD",
  riskType: "percentage",
  riskValue: 1,
  forexPair: "EUR/USD",
  stopLossPips: 20,
  takeProfitPips: 40,
  entryPrice: 0,
  stopLossPrice: 0,
  takeProfitPrice: 0,
  leverage: 100,
});

export const defaultChecklistItems = (): ChecklistItem[] => [
  { id: uid("ck"), text: "Xu hướng lớn đồng thuận (khung H4/D1)", isChecked: false, isRequired: true },
  { id: uid("ck"), text: "Giá tại vùng hỗ trợ/kháng cự hoặc key level", isChecked: false, isRequired: true },
  { id: uid("ck"), text: "Tỉ lệ R:R tối thiểu đạt 1:2", isChecked: false, isRequired: true },
  { id: uid("ck"), text: "Có tín hiệu xác nhận (nến/đảo chiều) rõ ràng", isChecked: false, isRequired: true },
  { id: uid("ck"), text: "Đã kiểm tra lịch tin tức kinh tế quan trọng", isChecked: false, isRequired: false },
  { id: uid("ck"), text: "Rủi ro mỗi lệnh nằm trong giới hạn (< 2%)", isChecked: false, isRequired: true },
];

export const defaultChecklists = (): Checklist[] => [
  { id: uid("clist"), name: "Mặc định", items: defaultChecklistItems() },
];

export const defaultData = (): AppData => {
  const checklists = defaultChecklists();
  return {
    version: DATA_VERSION,
    setup: defaultSetup(),
    savedSetups: [],
    checklists,
    activeChecklistId: checklists[0].id,
    trades: [],
    plans: [],
    license: { premium: false },
    settings: {
      theme: "dark",
      dailyLimitPercent: 5,
    },
  };
};
