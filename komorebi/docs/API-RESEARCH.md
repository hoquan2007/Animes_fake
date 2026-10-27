# Khảo sát API truyện tranh miễn phí

Kiểm tra ngày **27/10/2026**, khoảng **13:38 (Asia/Bangkok, UTC+7)**. Kết quả máy đọc được nằm trong [`api-check-results.json`](./api-check-results.json). Chạy lại từ thư mục dự án bằng `node scripts/check-apis.mjs` (Node.js 22+ và kết nối Internet).

## Phạm vi và kết luận

Đã gửi một yêu cầu đại diện, không đăng nhập, tới mỗi nhà cung cấp dưới đây; riêng Kitsu được kiểm tra lại sau khi sửa `Accept` đúng chuẩn JSON:API. Đây là khảo sát **9 dịch vụ tiêu biểu**, không phải kiểm tra mọi API trên Internet, mọi endpoint, mọi quốc gia hoặc cam kết uptime. Mã HTTP và dữ liệu phản hồi là quan sát tại thời điểm kiểm tra; điều khoản sử dụng là một đánh giá riêng.

**AniList, Kitsu, MangaDex và Open Library trả JSON có kết quả hợp lệ.** Jikan chưa xác nhận được kết nối trực tiếp trong môi trường này; nên có dữ liệu dự phòng và không gắn nhãn “API đang hoạt động” cho Jikan dựa vào khảo sát này. Website chọn **AniList làm nguồn metadata chính cho bài tập**, với danh mục giới hạn 20 bộ quen thuộc đã chọn tay, không phải bản sao cơ sở dữ liệu. Jikan phù hợp về định dạng metadata nhưng cần kiểm tra lại trước khi dùng; Kitsu là lựa chọn thay thế khi tôn trọng điều khoản. MangaDex không phù hợp để dùng làm nguồn cho dịch vụ thu tiền.

| Dịch vụ | Endpoint kiểm tra | Kết quả trực tiếp | Dữ liệu / điều kiện | Quyết định cho bài tập |
| --- | --- | --- | --- | --- |
| Jikan v4 | `GET https://api.jikan.moe/v4/manga?q=one%20piece&limit=1&sfw=true` | Không nhận HTTP; `UND_ERR_CONNECT_TIMEOUT` sau khoảng 10,7 giây | Metadata MAL, bìa, tác giả; GET không cần khóa. Đây là lỗi kết nối quan sát được, không chứng minh Jikan ngừng hoạt động toàn cầu. | Adapter có timeout, cache và dữ liệu mẫu; cần kiểm tra lại trên mạng dùng thuyết trình. |
| AniList | `POST https://graphql.anilist.co` với truy vấn manga “One Piece”, `isAdult:false` | **200**, 1 kết quả “ONE PIECE”; header hạn mức **30/phút**, CORS `*` | GraphQL, tên/bìa/tác giả/thể loại; dữ liệu công khai không cần OAuth. | Nguồn metadata thay thế phù hợp cho bài tập; không thu thập hàng loạt. |
| Kitsu | `GET https://kitsu.io/api/edge/manga?filter[text]=one%20piece&page[limit]=1` | **200**, 1 kết quả “One Piece” | Gửi `Accept: application/vnd.api+json`. Header sai từng trả 406. Không có khóa cho truy vấn công khai này. | Có thể làm nguồn dự phòng; cần lọc nội dung và kiểm tra điều khoản trước kinh doanh. |
| MangaDex | `GET https://api.mangadex.org/manga?title=one%20piece&limit=1&contentRating[]=safe` | **200**, 1 kết quả “One Piece Academy” | Metadata/nhóm dịch/chương; kết quả gần tên không bảo đảm đúng ấn bản. AUP cấm quảng cáo và dịch vụ trả phí. | **Không tích hợp vào luồng bán hàng hoặc bán bản scan.** |
| OTruyen | `GET https://otruyenapi.com/v1/api/tim-kiem?keyword=one%20piece` | **404**, HTML, không có JSON hợp lệ | Tài liệu được lập chỉ mục có endpoint tiếng Việt nhưng kết nối hiện tại không đạt; quyền bán lại nội dung chưa được chứng minh. | Không dùng làm nguồn phụ thuộc của bản nộp. |
| Open Library | `GET https://openlibrary.org/search.json?title=one%20piece&limit=1&fields=key,title,author_name,isbn,cover_i` | **200**, 1 kết quả “ONE PIECE 1” | Tra sách/ấn bản/ISBN/bìa, không cần khóa cho truy vấn này. | Hữu ích cho đối chiếu ấn bản; không biến thành backend thương mại lưu lượng cao. |
| Google Books | `GET https://www.googleapis.com/books/v1/volumes?q=intitle:one%20piece&maxResults=1&printType=books` không khóa | **429**, quota exceeded; không có kết quả sử dụng được | Tài liệu yêu cầu API key hoặc access token để định danh ứng dụng, kể cả truy vấn dữ liệu công khai. | Chỉ bật sau khi cấp khóa dự án và kiểm tra quota; không coi truy cập không khóa là ổn định. |
| MyAnimeList chính thức | `GET https://api.myanimelist.net/v2/manga?q=one%20piece&limit=1` không Client ID | **403** | Cần đăng ký ứng dụng/Client ID; quyền người dùng cần cơ chế xác thực tương ứng. | Chưa thể kiểm thử truy vấn có quyền vì chưa được cấp thông tin ứng dụng. |
| Comic Vine | `GET https://comicvine.gamespot.com/api/volumes/?format=json&limit=1&filter=name:one%20piece` không khóa | **401**, API error “Invalid API Key” | Cần API key; chỉ cho mục đích phi thương mại, cần ghi nguồn. | Không dùng cho cửa hàng có thu tiền; có thể nghiên cứu riêng trong bài tập phi thương mại. |

Truy vấn của mỗi dịch vụ, thời gian, trạng thái JSON, số lượng trả về, CORS header và các lỗi nằm trong file JSON. Không có header CORS trong yêu cầu server-side **không đủ để kết luận trình duyệt bị chặn**: muốn xác nhận CORS phải kiểm tra với `Origin`/preflight và trình duyệt. Kiến trúc dùng server làm adapter giúp kiểm soát cache, schema và timeout.

## Giới hạn sử dụng theo tài liệu chính thức

- **Jikan:** tài liệu OpenAPI ghi 3 yêu cầu/giây, 60/phút; dữ liệu được cache khoảng 24 giờ. Đây là API không chính thức, chỉ đọc, phụ thuộc MyAnimeList. [Jikan Docs](https://docs.api.jikan.moe/), [OpenAPI trong kho của Jikan](https://github.com/jikan-me/jikan-rest/blob/master/storage/api-docs/api-docs.json).
- **AniList:** miễn phí phi thương mại; tài liệu cho phép ứng dụng thương mại doanh thu dưới 150 USD/tháng, vượt ngưỡng cần giấy phép. Cấm tích trữ/thu thập dữ liệu hàng loạt và các dịch vụ cạnh tranh theo điều khoản. Tài liệu cảnh báo hạn mức giảm còn 30/phút; phản hồi kiểm thử cũng trả 30. [Điều khoản](https://docs.anilist.co/guide/terms-of-use), [Hạn mức](https://docs.anilist.co/guide/rate-limiting), [Xác thực](https://docs.anilist.co/guide/auth/).
- **Kitsu:** JSON:API, có endpoint manga công khai; không xác minh được một hạn mức số cụ thể trong nguồn chính thức đã đọc, nên không đặt ra con số giả. [Kitsu API Docs](https://kitsu.docs.apiary.io/).
- **MangaDex:** AUP yêu cầu ghi nguồn MangaDex/nhóm dịch khi đọc chương, tôn trọng yêu cầu gỡ nội dung; không cho quảng cáo/dịch vụ trả phí. [MangaDex AUP trong kho tài liệu của nhà cung cấp](https://gitlab.com/mangadex-pub/mangadex-api-docs/-/blob/main/index.md).
- **OTruyen:** tài liệu công bố base URL `otruyenapi.com/v1/api`, có tìm kiếm, danh sách, thể loại và chi tiết truyện. Khảo sát chưa chứng minh dịch vụ đáp ứng endpoint đã thử hoặc cho phép bán nội dung. [Tài liệu OTruyen](https://docs.otruyenapi.com/).
- **Open Library:** mặc định 1 yêu cầu/giây; ứng dụng có User-Agent kèm thông tin liên hệ được 3/giây. Ưu tiên tra cứu do người dùng thực hiện, cache kết quả; không khuyến khích backend thương mại lưu lượng cao hoặc thu thập hàng loạt qua API. [Hướng dẫn và hạn mức](https://openlibrary.org/developers/api).
- **Google Books:** dùng key/token để định danh, quản lý quota theo dự án; không giả định hạn mức cố định cho mọi tài khoản. Dữ liệu xem trước và quyền truy cập phụ thuộc ấn bản/khu vực. [Hướng dẫn chính thức](https://developers.google.com/books/docs/v1/using).
- **MyAnimeList:** điểm tham chiếu chính thức là [API v2](https://myanimelist.net/apiconfig/references/api/v2) và [xác thực](https://myanimelist.net/apiconfig/references/authorization). Trang tài liệu không tải được qua công cụ đọc trong lần khảo sát; phản hồi 403 chỉ xác nhận yêu cầu không thông tin ứng dụng bị từ chối, không phải kiểm thử thành công bằng Client ID.
- **Comic Vine:** phi thương mại, key riêng, giới hạn tài liệu 200 yêu cầu mỗi tài nguyên/giờ và cần ghi nguồn. [API và điều khoản chính thức](https://comicvine.gamespot.com/api/).

## Thiết kế tích hợp nên dùng

1. **Danh mục bán hàng là dữ liệu của cửa hàng:** SKU, tập/ấn bản, ngôn ngữ, giá VND, tồn kho, tình trạng bán và chính sách giao hàng. Không suy ra giá hay hàng có sẵn từ rating/chapter count của API.
2. **Metadata bên ngoài chỉ bổ sung:** tên, tác giả, bìa tham khảo, giới thiệu và đường dẫn nguồn. Lưu mapping rõ ràng `provider + externalId`; không nối hai cuốn chỉ vì tên giống nhau.
3. **Giá minh họa phải được ghi rõ trong bài tập.** Bìa metadata có thể khác bìa ấn bản Việt Nam; không giới thiệu nó như ảnh chụp sản phẩm đã được xác minh.
4. **Adapter phía máy chủ:** timeout ngắn; xử lý 429 bằng `Retry-After`; cache theo điều khoản từng nguồn; trả schema chuẩn; không chuyển HTML từ nguồn lên giao diện như JSON; không scrape các trang chặn truy cập.
5. **Dữ liệu dự phòng minh bạch:** khi API chậm, dùng danh mục mẫu đã kiểm soát nội dung; ghi trạng thái fallback trong phản hồi/debug thay vì giả thành dữ liệu live.
6. **Thanh toán không dựa vào API truyện:** máy chủ tính tiền từ SKU/giá cửa hàng, xác thực payOS riêng. API truyện không cấp quyền xuất bản hoặc bán ebook/chương scan.

Chỉ bán sách in có nguồn cung phù hợp hoặc nội dung số đã có quyền phân phối. Việc một API miễn phí trả về bìa, mô tả hay URL chương không tự cấp quyền thương mại đối với hình ảnh/nội dung đó. Với bài tập, phạm vi mặc định là cửa hàng minh họa, dữ liệu giá/tồn kho mẫu; không dùng API chương để khóa nội dung sau thanh toán.

## Điều chưa xác minh

- Chưa kiểm thử endpoint có khóa của Google Books, MAL hoặc Comic Vine.
- Chưa kiểm thử đọc chương, tải hàng loạt, OAuth, mutation hoặc ảnh toàn bộ thư viện.
- Chưa kiểm thử CORS bằng trình duyệt cho từng nhà cung cấp.
- Không xác nhận giấy phép thương mại đối với từng bìa/ấn bản; cần làm riêng nếu chuyển bài tập thành hoạt động kinh doanh.
- Chưa kiểm thử uptime dài hạn; cần chạy lại script trước buổi nộp bài. Một timeout/404 hôm nay không phải cam kết về trạng thái ngày khác.

## Nguồn danh mục và ảnh mẫu của bản xây dựng

Ngày 27/10/2026, truy vấn AniList không OAuth đã trả **HTTP 200** cho 20 bộ truyện, lọc `type:MANGA` và `isAdult:false`. File [`../app/data/metadata.json`](../app/data/metadata.json) giữ mảng Media gồm ID, tên gốc/tiếng Anh, URL bìa, mô tả, thể loại, điểm của AniList, staff, ngày bắt đầu, trạng thái và `siteUrl` để ghi nguồn. `isAdult:false` không phải chứng nhận độ tuổi cho trẻ em; một số truyện vẫn có chiến đấu/chủ đề dành cho độc giả lớn hơn.

Đã đối chiếu và sửa các kết quả trùng tên sang đúng bộ gốc: Detective Conan `31061` (1994), Haikyu!! `65243` (2012), Fullmetal Alchemist `30025` (2001), Bakuman `39711` (2008). Không dùng tiểu thuyết/one-shot chỉ vì tên giống nhau. Một truy vấn 22 bộ từng bị AniList từ chối `400` do độ phức tạp 550 vượt 500; giảm còn 20 và truy vấn lại thành công. Đây là lý do cần giới hạn batch theo độ phức tạp, bên cạnh hạn mức theo phút.

20 URL ảnh bìa do AniList trả về đều nhận **HTTP 200** và được lưu nguyên byte ở `public/covers/{id}.jpg` cho bản bài tập. URL gốc của từng ảnh vẫn có trong JSON. Các file `65243.jpg`, `30025.jpg`, `87216.jpg`, `55096.jpg` chứa dữ liệu PNG nguyên bản; các file còn lại là JPEG. Ảnh dùng để tham khảo trong bài tập phi thương mại, quyền sở hữu vẫn thuộc bên nắm bản quyền; không diễn giải việc tải thành giấy phép bán hoặc tái phân phối thương mại.

Danh sách ID đã chọn: `30013, 30011, 30042, 108556, 118586, 31032, 31061, 65243, 106130, 125828, 30025, 30104, 98416, 132029, 87216, 101517, 30021, 55096, 39711, 30026`.
