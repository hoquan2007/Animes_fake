<div align="center">

# Komorebi

### Một tập truyện cho hôm nay. Một thế giới để nhớ mai sau.

Website giới thiệu và đặt truyện manga bằng tiếng Việt, được xây dựng như một đồ án thiết kế web.

[Khám phá giao diện](#giao-diện) · [Tính năng](#tính-năng) · [Cài đặt](#cài-đặt-và-chạy) · [Website](https://komorebi-manga-hnquan.vercel.app)

</div>

---

## Giới thiệu

**Komorebi** (木漏れ日) là ánh nắng len qua kẽ lá. Website lấy cảm hứng từ cảm giác tìm thấy một cuốn truyện muốn mang về: khám phá kệ manga, tìm theo tên hoặc tác giả, lưu truyện yêu thích và trải nghiệm quy trình đặt hàng.

Danh mục mẫu gồm 20 bộ manga. Metadata và ảnh bìa được tham khảo từ AniList; giá bán, phiên bản tập 01 và số lượng tồn kho là dữ liệu minh họa cho đồ án.

## Giao diện

Các ảnh dưới đây được chụp trong quá trình thiết kế và phát triển Komorebi. Toàn bộ 12 ảnh trong thư mục `komorebi/image/` đều được sử dụng ở đây.

| Trang chủ và kệ truyện | Khám phá danh mục |
| --- | --- |
| ![Giao diện Komorebi 1](komorebi/image/%7B2EA74B1E-F407-4B7A-9615-6C8546957C22%7D.png) | ![Giao diện Komorebi 2](komorebi/image/%7B025F2ECC-7C66-4D13-8E31-92B40683F30B%7D.png) |
| ![Giao diện Komorebi 3](komorebi/image/%7B9CBDEB76-1165-455A-B839-38E34E7CED04%7D.png) | ![Giao diện Komorebi 4](komorebi/image/%7B04E6D20C-9BD5-41FF-9DDD-7444351D394F%7D.png) |
| ![Giao diện Komorebi 5](komorebi/image/%7B80E519A3-4B13-47B0-B556-94D29B0C60CA%7D.png) | ![Giao diện Komorebi 6](komorebi/image/%7B4B3DE3BC-4EEA-43B4-B767-2CFB69E97CCC%7D.png) |

| Trải nghiệm mua sắm | Thông tin và chi tiết |
| --- | --- |
| ![Giao diện Komorebi 7](komorebi/image/%7BA64259E8-1381-4F62-9257-01D5499BF819%7D.png) | ![Giao diện Komorebi 8](komorebi/image/%7BF5C9FA2A-3E7A-4449-8D9D-E5EF9048BD09%7D.png) |
| ![Giao diện Komorebi 9](komorebi/image/%7B3A01EB67-F240-4F27-90E7-ED6DF8B50EC9%7D.png) | ![Giao diện Komorebi 10](komorebi/image/%7B6C69745F-9E1F-4E31-B52D-1B1122D66BC7%7D.png) |
| ![Giao diện Komorebi 11](komorebi/image/%7BE30E3131-7CE5-4A3C-9599-213E29EEE6B1%7D.png) | ![Giao diện Komorebi 12](komorebi/image/%7BC4F11F70-23ED-4BB7-BCCA-B908CDB22640%7D.png) |

## Tính năng

- Tìm truyện theo tên hoặc tác giả, hỗ trợ tìm kiếm không dấu.
- Lọc theo thể loại, sắp xếp danh mục và xem thông tin từng truyện.
- Lưu truyện yêu thích và giữ giỏ hàng trên trình duyệt.
- Điều chỉnh số lượng, tính phí giao hàng và xem lịch sử đơn theo phiên khách.
- Tạo, xem và hủy đơn hàng minh họa.
- Tùy chọn tích hợp payOS ở phía máy chủ; trạng thái thanh toán chỉ được cập nhật sau khi xác minh với payOS.
- Giao diện responsive, hỗ trợ bàn phím và tùy chọn giảm chuyển động.

## Công nghệ

- **Ứng dụng:** Next.js 16, React 19, TypeScript
- **Giao diện và chuyển động:** CSS, GSAP, Lucide
- **Dữ liệu truyện:** AniList GraphQL, có dữ liệu dự phòng
- **Cơ sở dữ liệu:** PostgreSQL trên Neon
- **Thanh toán tùy chọn:** payOS

## Cài đặt và chạy

### Yêu cầu

- Node.js 22.13 trở lên
- npm
- PostgreSQL/Neon cho chức năng lưu đơn hàng

### Khởi động môi trường phát triển

```powershell
cd komorebi
npm ci
Copy-Item .env.example .env.local
```

Điền `DATABASE_URL` và `SESSION_SECRET` trong `.env.local`. Tạo `SESSION_SECRET` ngẫu nhiên, đủ dài và chỉ lưu ở máy chủ. Sau khi cấu hình cơ sở dữ liệu, chạy migration và khởi động ứng dụng:

```powershell
npm run db:migrate
npm run dev
```

Mở [http://127.0.0.1:5173](http://127.0.0.1:5173). Các chức năng cần lưu đơn yêu cầu backend và cơ sở dữ liệu đã cấu hình.

## Kiểm thử

```powershell
cd komorebi
npm test
npm run typecheck
npm run build
```

Integration test cần máy chủ đang chạy cùng `DATABASE_URL` hợp lệ:

```powershell
node --env-file=.env.local tests/integration.mjs
```

Integration test tạo đơn thử và hoàn trả tồn kho sau khi kiểm tra. Chỉ chạy với cơ sở dữ liệu phát triển, không dùng kho thương mại.

## Nguồn dữ liệu và phạm vi

Metadata manga (như tên, tác giả, thể loại, điểm cộng đồng và ảnh bìa) được lấy từ AniList hoặc bản lưu dự phòng. Việc dùng metadata không đồng nghĩa với quyền phân phối tác phẩm hay ảnh bìa.

Komorebi là đồ án giao diện đặt **sách in**. Website không cung cấp bản scan hoặc ebook. Giá, phiên bản sách, tồn kho và phí giao hàng là dữ liệu minh họa; hiện chưa có hoạt động bán hoặc giao sách thực tế. Chế độ đơn minh họa không thu tiền. Nếu cấu hình payOS thật, liên kết thanh toán có thể thu tiền thật khi người dùng chủ động thanh toán.

## Tài liệu dự án

- [Kế hoạch và kiến trúc](komorebi/docs/PLAN.md)
- [Khảo sát API](komorebi/docs/API-RESEARCH.md)
- [Thiết kế giao diện](komorebi/docs/DESIGN.md)
- [Triển khai và kiểm chứng payOS](komorebi/docs/DEPLOYMENT.md)
- [Skills sử dụng trong dự án](komorebi/docs/SKILLS.md)

## Triển khai

Website: [komorebi-manga-hnquan.vercel.app](https://komorebi-manga-hnquan.vercel.app). Dự án Vercel sử dụng thư mục gốc (`Root Directory`) là `komorebi`. Cần cấu hình PostgreSQL và các biến môi trường máy chủ trước khi sử dụng chức năng đặt hàng. Chỉ bật thanh toán thật sau khi đã cấu hình, kiểm tra payOS và webhook trên môi trường phù hợp.
