# RiskWise Next

Bản dựng lại hoàn toàn mới của RiskWise — công cụ quản trị rủi ro giao dịch, với kiến trúc sạch, bảo mật-sẵn và UX hiện đại (dark/light).

## Tính năng

- **Tính khối lượng vị thế** cho Forex/Vàng và Crypto/Chứng khoán (lots, units, ký quỹ, R:R, lợi nhuận kỳ vọng).
- **Risk meter** trực quan đánh giá mức rủi ro theo % tài khoản.
- **Checklist trước vào lệnh** với tiêu chí bắt buộc, cảnh báo khi chưa đủ điều kiện.
- **Thiết lập đã lưu** để tái sử dụng cấu hình nhanh.
- **Danh mục**: theo dõi vị thế mở, PnL tạm tính/đã chốt, đóng lệnh.
- **Kế hoạch giao dịch**: lập kế hoạch có luận điểm, mức tự tin, trạng thái.
- **Phân tích kỷ luật**: win rate, profit factor, expectancy, equity curve, PnL theo tâm lý, và nhận định hành vi tự động.
- **Sao lưu/khôi phục JSON** với kiểm tra và làm sạch dữ liệu nhập.

## Kiến trúc

```
src/
  lib/        Core thuần, không phụ thuộc UI — types, calculator, analytics (có test)
  store/      State tập trung (localStorage), tách sẵn để gắn cloud-sync sau
  components/ Design system (ui.tsx), RiskMeter, Toast
  features/   Calculator, Portfolio, Plans, Journal
```

Logic tính toán (`src/lib/`) là pure functions, được kiểm thử bằng Vitest và độc lập
hoàn toàn với React — dễ test, dễ tái dùng cho backend nếu cần.

## Chạy

```bash
npm install
npm run dev      # phát triển
npm run test     # chạy test core
npm run build    # build production
```

Dữ liệu được lưu cục bộ trên trình duyệt. Không có secret nào nằm ở client.
