/**
 * Broker affiliate links. Replace the `url` values with your own referral links.
 * `discount` is the short pitch shown next to each broker.
 */
export interface Broker {
  id: string;
  name: string;
  kind: string;
  url: string;
  discount: string;
}

export const BROKERS: Broker[] = [
  {
    id: "binance",
    name: "Binance",
    kind: "Crypto",
    url: "https://www.binance.com/register?ref=873133600",
    discount: "Giảm 20% phí giao dịch",
  },
  {
    id: "exness",
    name: "Exness",
    kind: "Forex / Vàng",
    url: "https://one.exnessonelink.com/a/r9pl2ziwvt",
    discount: "Spread thấp, rút nhanh",
  },
  {
    id: "the5ers",
    name: "The5ers",
    kind: "Prop firm",
    url: "https://www.the5ers.com/?afmc=1bko",
    discount: "Quỹ vốn cấp cho trader",
  },
];
