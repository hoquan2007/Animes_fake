import metadata from "../app/data/metadata.json";

export type Product = {
  id: string; title: string; originalTitle: string; author: string; cover: string;
  price: number; genres: string[]; description: string; score: number | null;
  sourceUrl: string; volume: number; format: string;
};

const editions: Record<string, { title: string; price: number; description: string }> = {
  "one piece": { title: "One Piece", price: 25000, description: "Cùng Luffy và băng Mũ Rơm ra khơi tìm kho báu One Piece. Một chuyến phiêu lưu về tự do, tình bạn và những giấc mơ không chịu nhỏ lại." },
  "naruto": { title: "Naruto", price: 25000, description: "Cậu bé ninja Naruto mang trong mình giấc mơ trở thành Hokage. Từ những buổi luyện tập đầu tiên, một hành trình về lòng kiên trì và tình đồng đội bắt đầu." },
  "dragon ball": { title: "Dragon Ball", price: 25000, description: "Goku và Bulma lên đường tìm bảy viên ngọc rồng. Những trận đấu, người bạn mới và các cuộc gặp gỡ bất ngờ mở ra một thế giới đầy năng lượng." },
  "spy x family": { title: "Spy × Family", price: 30000, description: "Một điệp viên, một sát thủ và cô bé đọc được suy nghĩ cùng tạo nên gia đình Forger. Không ai biết bí mật của nhau — trừ Anya." },
  "sousou no frieren": { title: "Frieren — Pháp sư tiễn táng", price: 35000, description: "Sau chuyến hành trình đánh bại Ma Vương, pháp sư Frieren lên đường một lần nữa để hiểu con người, những kỷ niệm và ý nghĩa của thời gian." },
  "doraemon": { title: "Doraemon", price: 22000, description: "Chú mèo máy từ tương lai đến bên Nobita với chiếc túi thần kỳ. Mỗi bảo bối mở ra một câu chuyện nhỏ, vừa hài hước vừa ấm áp." },
  "meitantei conan": { title: "Thám tử lừng danh Conan", price: 25000, description: "Thám tử trung học Shinichi bị teo nhỏ thành Conan. Cậu tiếp tục phá những vụ án khó, đồng thời tìm dấu vết của tổ chức áo đen." },
  "haikyuu!!": { title: "Haikyu!!", price: 30000, description: "Hinata bước vào sân bóng chuyền với chiều cao khiêm tốn và khát khao mãnh liệt. Cùng Karasuno, cậu học cách bay bằng sức mạnh của cả đội." },
  "blue lock": { title: "Blue Lock", price: 35000, description: "Isagi bước vào chương trình đào tạo tiền đạo Blue Lock. Trên sân cỏ đầy cạnh tranh, mỗi lựa chọn là một bước tìm ra lối chơi của chính mình." },
  "sakamoto days": { title: "Sakamoto Days", price: 30000, description: "Sát thủ huyền thoại Sakamoto đã giải nghệ để mở tiệm tạp hóa. Nhưng cuộc sống bình yên của anh không hề đơn giản khi quá khứ liên tục tìm đến." },
  "hagane no renkinjutsushi": { title: "Fullmetal Alchemist", price: 35000, description: "Hai anh em Edward và Alphonse tìm cách lấy lại những gì đã mất sau một thí nghiệm giả kim. Hành trình đưa họ đến những bí mật lớn hơn bản thân mình." },
  "yotsuba to!": { title: "Yotsuba&!", price: 35000, description: "Qua đôi mắt tò mò của cô bé Yotsuba, những điều rất bình thường lại trở nên thú vị. Một tập truyện để chậm lại và thấy vui từ chuyện nhỏ." },
  "dr. stone": { title: "Dr. Stone", price: 30000, description: "Sau khi nhân loại hóa đá, Senku dùng khoa học để xây dựng lại thế giới. Từ ngọn lửa đầu tiên đến những phát minh mới, tri thức trở thành sức mạnh." },
  "dandadan": { title: "Dandadan", price: 35000, description: "Momo và Okarun cùng khám phá những hiện tượng vượt ngoài hiểu biết. Một cuộc phiêu lưu kỳ lạ pha trộn hài hước, tình bạn và chuyện siêu nhiên." },
  "kimetsu no yaiba": { title: "Thanh gươm diệt quỷ", price: 30000, description: "Tanjiro bước vào hành trình tìm cách cứu em gái Nezuko. Lòng trắc ẩn và sự kiên trì đồng hành cùng cậu qua những cuộc đối đầu với quỷ dữ." },
  "jujutsu kaisen": { title: "Chú thuật hồi chiến", price: 30000, description: "Yuji Itadori bước vào thế giới của các chú thuật sư sau một cuộc gặp định mệnh. Cùng những đồng đội mới, cậu đối mặt với các lời nguyền và lựa chọn của chính mình." },
  "death note": { title: "Death Note", price: 35000, description: "Light Yagami nhặt được một cuốn sổ có khả năng quyết định sinh tử. Cuộc đấu trí với thám tử L đặt ra những câu hỏi về công lý và quyền lực." },
  "gin no saji": { title: "Silver Spoon", price: 35000, description: "Hachiken nhập học tại một trường nông nghiệp và làm quen với cuộc sống hoàn toàn mới. Giữa những công việc hàng ngày, cậu dần tìm được điều mình muốn theo đuổi." },
  "hunter x hunter": { title: "Hunter × Hunter", price: 25000, description: "Gon lên đường trở thành Hunter và tìm người cha của mình. Những thử thách cùng các cuộc gặp gỡ đặc biệt giúp cậu hiểu thêm về tình bạn và thế giới rộng lớn." },
  "bakuman.": { title: "Bakuman", price: 35000, description: "Hai học sinh cùng nuôi ước mơ trở thành mangaka. Theo chân họ qua những bản thảo, cuộc hẹn biên tập và niềm vui của việc kể một câu chuyện bằng tranh." },
};

export const products: Product[] = (metadata as any[]).map((m, i) => {
  const originalTitle: string = m.title.romaji || m.title.english;
  const aliases: Record<number,string>={108556:'spy x family',30026:'hunter x hunter',39711:'bakuman.'};
  const edition = editions[originalTitle.toLowerCase()] || editions[aliases[m.id]];
  const authorEdge = m.staff?.edges?.find((e: any) => /story.*art|story|original/i.test(e.role));
  return {
    id: `al-${m.id}`, title: edition?.title || m.title.english || originalTitle, originalTitle,
    author: authorEdge?.node?.name?.full || m.staff?.edges?.[0]?.node?.name?.full || "Xem thông tin tác giả tại AniList",
    cover: `/covers/${m.id}.jpg`, price: edition?.price || [25000,30000,35000,40000][i % 4],
    genres: m.genres || [], description: edition?.description || "Mở tập truyện đầu tiên và khám phá thế giới, những nhân vật cùng câu chuyện của bộ manga này. Thông tin xuất bản và nội dung gốc có tại nguồn AniList bên dưới.",
    score: m.averageScore ? m.averageScore / 10 : null, sourceUrl: m.siteUrl || `https://anilist.co/manga/${m.id}`,
    volume: 1, format: "Bìa mềm",
  };
});

export const money = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
export const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g,"d").toLowerCase();
export const genreOptions = [
  { id: "all", label: "Tất cả truyện" }, { id: "Action", label: "Hành động" },
  { id: "Adventure", label: "Phiêu lưu" }, { id: "Comedy", label: "Hài hước" },
  { id: "Fantasy", label: "Giả tưởng" }, { id: "Slice of Life", label: "Đời thường" },
  { id: "Sports", label: "Thể thao" }, { id: "Romance", label: "Tình cảm" },
];
