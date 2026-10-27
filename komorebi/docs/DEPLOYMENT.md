# Triển khai và xác minh — 27/10/2026

Website: https://komorebi-manga-hnquan.vercel.app
GitHub: https://github.com/hoquan2007/Animes_fake

## Hạ tầng

- Vercel project: `komorebi-manga`, team `hnquan`, Root Directory `komorebi`, Next.js 16, Node.js 24, Functions Singapore.
- Neon resource `komorebi-db`, gói Free, Singapore; schema PostgreSQL đã migrate.
- GitHub nhánh `main` đã kết nối Vercel, tự build/deploy khi push.
- Khóa payOS và SESSION_SECRET nằm ở Vercel Production dưới dạng Sensitive. APP_URL trỏ domain ở trên. Không commit secret.
- Development giữ chế độ demo. Đơn hàng dùng phiên khách ký HMAC, cookie HttpOnly/Secure/SameSite=Lax, hiệu lực 30 ngày.

## Kết quả

- Production deployment trạng thái READY; trang chủ công khai HTTP 200.
- TypeScript và Next.js production build thành công.
- 7 unit tests về giá, số lượng, chữ ký và dữ liệu khách: đạt.
- 12 integration checks Next.js + Neon: đạt; xác thực phiên, chặn chéo Origin/chủ đơn, idempotency, transaction tồn kho, hoàn tất/hủy demo và lưu bền vững.
- 8 live smoke checks: đạt. Đã tạo một link payOS 50.000 VND, tra trạng thái PENDING, kiểm tra idempotency, chứng minh tham số status=PAID không giả được thành công, từ chối webhook sai chữ ký, hủy link thành công.
- Webhook đã đăng ký: `https://komorebi-manga-hnquan.vercel.app/api/webhooks/payos`. payOS gọi kiểm tra và trả HTTP 200, code 00, success. Xem webhook-registration.json.
- Lần thử đầu gặp phản hồi tạo link chưa được xác nhận nhưng payOS đã tạo PENDING. Đã kiểm tra trực tiếp và hủy; các link chẩn đoán đều đã hủy, tồn kho thử đã hoàn trả. Lần thử đầy đủ tiếp theo đạt.

Báo cáo: integration-results.json, live-payment-results.json, webhook-registration.json. Ảnh giao diện tại screenshots/.

## Giới hạn đã biết

Không thực hiện chuyển tiền thật, vì vậy chưa thử sự kiện PAID từ giao dịch ngân hàng thật hoặc hoàn tiền. Webhook mới được kiểm chứng bằng request mẫu do payOS gửi. Không giả lập giao dịch thật thành PAID.

Đây là đồ án: giá và giao sách là minh họa. Lịch sử gắn với trình duyệt, không có tài khoản đa thiết bị; xóa cookie mất quyền truy cập đơn. Chưa có admin, job đối soát định kỳ hay vận chuyển. Đơn live bị bỏ dở được đối soát khi mở lại; cần job nền và quy trình xử lý thanh toán trễ/hết kho trước khi dùng cho kinh doanh thật.

## Trình bày

Chọn truyện → giỏ → điền thông tin thử → chọn Đơn minh họa → hoàn tất → mở lại lịch sử. Để trình bày tích hợp, chọn payOS và xác nhận checkbox, tạo link rồi mở trang payOS; không cần chuyển tiền. Hủy đơn trong website khi kết thúc thử nghiệm.
