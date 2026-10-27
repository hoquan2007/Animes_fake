# Komorebi — Tiệm truyện của bạn

Website bán truyện tranh tiếng Việt phục vụ bài tập thiết kế web. Danh mục 20 bộ manga có metadata và bìa từ AniList; giá, phiên bản tập 01, tồn kho và giao hàng đều là minh họa. Có chế độ demo không thu tiền và tích hợp payOS thật.

## Chạy dự án

Yêu cầu Node.js 24, npm và PostgreSQL trên Neon.

```powershell
npm ci
Copy-Item .env.example .env.local
# Điền DATABASE_URL và SESSION_SECRET ngẫu nhiên vào .env.local
npm run db:migrate
npm run dev
```

Mở http://127.0.0.1:5173. Không dùng thông tin cá nhân thật khi trình bày bài tập.

## Chức năng

- Tìm tên/tác giả không dấu, lọc thể loại, sắp xếp giá/tên, chi tiết truyện.
- Yêu thích, giỏ hàng giữ trên trình duyệt, số lượng và phí giao hàng.
- Phiên khách bảo mật 30 ngày, lịch sử chỉ thuộc trình duyệt đó.
- Tạo đơn minh họa, hoàn tất, hủy; trạng thái demo luôn khác thanh toán thật.
- payOS: tạo link có HMAC, return/cancel, đối soát API, webhook có xác minh, chống xử lý lặp.
- Server tính lại toàn bộ giá; transaction PostgreSQL ngăn bán vượt kho.
- Responsive, điều khiển bằng bàn phím, reduced motion, GSAP nhẹ.

## Kiểm thử

```powershell
npm test
npm run typecheck
npm run build
# Khi dev server và DATABASE_URL đang sẵn sàng:
node --env-file=.env.local tests/integration.mjs
```

Integration test tạo các đơn demo thử trong DB và hoàn trả tồn kho sau khi hoàn tất/hủy. Chạy trên DB phát triển, không trên kho thương mại. Báo cáo tại `docs/integration-results.json`.

## Deploy Vercel

Repo GitHub: https://github.com/hoquan2007/Animes_fake

Root Directory: `komorebi`. Framework: Next.js. Build: `npm run build`. Neon Free qua Vercel Marketplace, khu vực Singapore. Cấp DATABASE_URL và chạy migration trước khi nhận đơn.

Production cần SESSION_SECRET, APP_URL và ba khóa payOS phía server; PAYMENT_MODE=live. APP_URL phải là tên miền production chính xác. Đăng ký `${APP_URL}/api/webhooks/payos` trên kênh payOS sau khi website chạy. Preview/dev giữ demo và dùng secret riêng. Khóa không có prefix NEXT_PUBLIC.

## Tài liệu nộp bài

- [Kế hoạch chi tiết](docs/PLAN.md)
- [Khảo sát và kiểm tra 9 API](docs/API-RESEARCH.md)
- [Thiết kế giao diện](docs/DESIGN.md)
- [Triển khai và kiểm chứng payOS](docs/DEPLOYMENT.md)
- [Skills đã cài](docs/SKILLS.md)

API metadata không cấp quyền phân phối tác phẩm. Website chưa có giao sách, hoàn tiền tự động, admin hay tài khoản dùng nhiều thiết bị. payOS có thể thu tiền thật nếu người dùng chủ động chuyển khoản; không cần chuyển tiền để trình bày bài tập.
