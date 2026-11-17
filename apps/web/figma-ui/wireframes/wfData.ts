export type WFScreenKey = "Home" | "Library" | "Watch" | "Auth" | "Notebook";
export type WFDevice = "Desktop" | "Mobile";

export type WFSubState =
  | "default"
  | "guest"
  | "loading"
  | "empty-search"
  | "empty-notebook"
  | "video-unavailable"
  | "dict-open"
  | "sentence-saved"
  | "auth-error"
  | "mobile-filter-open";

export interface WFTokenWord {
  surface: string;
  furigana?: string;
  dictKey?: string;
}

export interface WFSubtitleLine {
  id: string;
  timestamp: string;
  seconds: number;
  speaker: string;
  tokens: WFTokenWord[];
  jpText: string;
  viText: string;
}

export interface WFDictItem {
  key: string;
  word: string;
  reading: string;
  pos: string;
  meaningVi: string;
  sentenceJp: string;
  sentenceVi: string;
  episodeTitle: string;
  seriesTitle: string;
  timestamp: string;
  seconds: number;
  note: string;
}

export interface WFEpisodeItem {
  id: string;
  seriesId: string;
  order: number;
  title: string;
  duration: string;
  progressPercent: number;
  lastTimestamp?: string;
  lastSeconds?: number;
}

export interface WFSeriesItem {
  id: string;
  title: string;
  level: "N5" | "N4" | "N3" | "N2";
  episodeCount: number;
  genre: string;
  channel: string;
  thumbLabel: string;
  isNew?: boolean;
  isRecommended?: boolean;
}

export interface WFAnnotationSpec {
  screen: WFScreenKey;
  title: string;
  goal: string;
  primaryAction: string;
  readingOrder: string[];
  desktopVsMobile: string;
  openQuestions: string[];
}

export const WF_SERIES: WFSeriesItem[] = [
  {
    id: "wf-series-cafe",
    title: "Tiếng Nhật ở quán cà phê",
    level: "N4",
    episodeCount: 8,
    genre: "Hội thoại đời sống",
    channel: "Kotoba Kaiwa",
    thumbLabel: "16:9 Thumbnail • Quán cà phê",
    isNew: true,
    isRecommended: true,
  },
  {
    id: "wf-series-tokyo",
    title: "Cuộc sống tại Tokyo",
    level: "N3",
    episodeCount: 6,
    genre: "Vlog thực tế",
    channel: "Tokyo Nichijou",
    thumbLabel: "16:9 Thumbnail • Đường phố Tokyo",
    isNew: true,
    isRecommended: true,
  },
  {
    id: "wf-series-weekend",
    title: "Nhật ký cuối tuần",
    level: "N5",
    episodeCount: 10,
    genre: "Nghe chậm nhập môn",
    channel: "Yasashii Nihongo",
    thumbLabel: "16:9 Thumbnail • Công viên cuối tuần",
    isNew: true,
    isRecommended: false,
  },
  {
    id: "wf-series-office",
    title: "Chuyện công sở",
    level: "N2",
    episodeCount: 5,
    genre: "Tiếng Nhật công sở",
    channel: "Biz Nihongo",
    thumbLabel: "16:9 Thumbnail • Văn phòng làm việc",
    isNew: true,
    isRecommended: false,
  },
  {
    id: "wf-series-konbini",
    title: "Giao tiếp ở cửa hàng tiện lợi",
    level: "N4",
    episodeCount: 7,
    genre: "Hội thoại đời sống",
    channel: "Kotoba Kaiwa",
    thumbLabel: "16:9 Thumbnail • Cửa hàng tiện lợi",
    isNew: false,
    isRecommended: true,
  },
  {
    id: "wf-series-train",
    title: "Đi tàu điện và hỏi đường",
    level: "N4",
    episodeCount: 6,
    genre: "Du lịch & Đi lại",
    channel: "Tokyo Nichijou",
    thumbLabel: "16:9 Thumbnail • Nhà ga tàu điện",
    isNew: false,
    isRecommended: true,
  },
  {
    id: "wf-series-izakaya",
    title: "Gọi món ở quán ăn tối",
    level: "N3",
    episodeCount: 8,
    genre: "Ẩm thực",
    channel: "Kotoba Kaiwa",
    thumbLabel: "16:9 Thumbnail • Quán ăn Nhật",
    isNew: false,
    isRecommended: true,
  },
  {
    id: "wf-series-morning",
    title: "Thói quen buổi sáng",
    level: "N5",
    episodeCount: 9,
    genre: "Nghe chậm nhập môn",
    channel: "Yasashii Nihongo",
    thumbLabel: "16:9 Thumbnail • Buổi sáng tại nhà",
    isNew: false,
    isRecommended: true,
  },
];

export const WF_EPISODES: WFEpisodeItem[] = [
  {
    id: "wf-ep-1",
    seriesId: "wf-series-cafe",
    order: 1,
    title: "Gọi đồ uống",
    duration: "08:24",
    progressPercent: 45,
    lastTimestamp: "00:16",
    lastSeconds: 16,
  },
  {
    id: "wf-ep-2",
    seriesId: "wf-series-cafe",
    order: 2,
    title: "Chọn cỡ ly và lượng đá",
    duration: "07:10",
    progressPercent: 100,
    lastTimestamp: "07:10",
    lastSeconds: 430,
  },
  {
    id: "wf-ep-3",
    seriesId: "wf-series-cafe",
    order: 3,
    title: "Dùng tại quán hay mang đi",
    duration: "06:45",
    progressPercent: 20,
    lastTimestamp: "01:15",
    lastSeconds: 75,
  },
  {
    id: "wf-ep-4",
    seriesId: "wf-series-cafe",
    order: 4,
    title: "Thanh toán bằng thẻ hoặc tiền mặt",
    duration: "07:50",
    progressPercent: 0,
  },
  {
    id: "wf-ep-5",
    seriesId: "wf-series-tokyo",
    order: 1,
    title: "Chuyển tuyến ở ga Shinjuku",
    duration: "09:15",
    progressPercent: 30,
    lastTimestamp: "02:40",
    lastSeconds: 160,
  },
  {
    id: "wf-ep-6",
    seriesId: "wf-series-weekend",
    order: 1,
    title: "Đi dạo công viên sáng chủ nhật",
    duration: "05:40",
    progressPercent: 60,
    lastTimestamp: "03:20",
    lastSeconds: 200,
  },
];

export const WF_DICTIONARY: Record<string, WFDictItem> = {
  irasshaimase: {
    key: "irasshaimase",
    word: "いらっしゃいませ",
    reading: "irasshaimase",
    pos: "Biểu thức chào hỏi",
    meaningVi: "Xin chào quý khách (dùng khi đón khách vào quán/cửa hàng)",
    sentenceJp: "いらっしゃいませ。",
    sentenceVi: "Xin chào quý khách.",
    episodeTitle: "Gọi đồ uống",
    seriesTitle: "Tiếng Nhật ở quán cà phê",
    timestamp: "00:12",
    seconds: 12,
    note: "Câu chào tiêu chuẩn của nhân viên dịch vụ tại Nhật.",
  },
  aisukoohii: {
    key: "aisukoohii",
    word: "アイスコーヒー",
    reading: "aisu kōhī",
    pos: "Danh từ",
    meaningVi: "Cà phê đá",
    sentenceJp: "アイスコーヒーを一つお願いします。",
    sentenceVi: "Cho tôi một cà phê đá.",
    episodeTitle: "Gọi đồ uống",
    seriesTitle: "Tiếng Nhật ở quán cà phê",
    timestamp: "00:16",
    seconds: 16,
    note: "Ghép từ Ice (アイス) và Coffee (コーヒー).",
  },
  hitotsu: {
    key: "hitotsu",
    word: "一つ",
    reading: "ひとつ (hitotsu)",
    pos: "Số đếm",
    meaningVi: "Một cái, một phần, một suất",
    sentenceJp: "アイスコーヒーを一つお願いします。",
    sentenceVi: "Cho tôi một cà phê đá.",
    episodeTitle: "Gọi đồ uống",
    seriesTitle: "Tiếng Nhật ở quán cà phê",
    timestamp: "00:16",
    seconds: 16,
    note: "Cách đếm đồ vật chung từ 1 đến 10 khi gọi món.",
  },
  onegaishimasu: {
    key: "onegaishimasu",
    word: "お願いします",
    reading: "おねがいします (onegaishimasu)",
    pos: "Cụm từ lịch sự",
    meaningVi: "Làm ơn, vui lòng cho tôi...",
    sentenceJp: "アイスコーヒーを一つお願いします。",
    sentenceVi: "Cho tôi một cà phê đá.",
    episodeTitle: "Gọi đồ uống",
    seriesTitle: "Tiếng Nhật ở quán cà phê",
    timestamp: "00:16",
    seconds: 16,
    note: "Đặt sau tên món + số lượng để gọi đồ lịch sự.",
  },
  saizu: {
    key: "saizu",
    word: "サイズ",
    reading: "saizu",
    pos: "Danh từ",
    meaningVi: "Kích cỡ (cỡ ly S / M / L)",
    sentenceJp: "サイズはいかがなさいますか。",
    sentenceVi: "Quý khách muốn cỡ nào?",
    episodeTitle: "Gọi đồ uống",
    seriesTitle: "Tiếng Nhật ở quán cà phê",
    timestamp: "00:21",
    seconds: 21,
    note: "Nhân viên thường hỏi kèm S・M・L.",
  },
  tennai: {
    key: "tennai",
    word: "店内",
    reading: "てんない (tennai)",
    pos: "Danh từ",
    meaningVi: "Trong quán, dùng tại chỗ",
    sentenceJp: "店内でお召し上がりですか。",
    sentenceVi: "Quý khách dùng tại quán phải không ạ?",
    episodeTitle: "Gọi đồ uống",
    seriesTitle: "Tiếng Nhật ở quán cà phê",
    timestamp: "00:27",
    seconds: 27,
    note: "Trái nghĩa với お持ち帰り (mang đi).",
  },
};

export const WF_TRANSCRIPT_LINES: WFSubtitleLine[] = [
  {
    id: "wf-line-1",
    timestamp: "00:12",
    seconds: 12,
    speaker: "Nhân viên",
    tokens: [{ surface: "いらっしゃいませ。", dictKey: "irasshaimase" }],
    jpText: "いらっしゃいませ。",
    viText: "Xin chào quý khách.",
  },
  {
    id: "wf-line-2",
    timestamp: "00:16",
    seconds: 16,
    speaker: "Khách hàng",
    tokens: [
      { surface: "アイスコーヒー", dictKey: "aisukoohii" },
      { surface: "を" },
      { surface: "一つ", furigana: "ひとつ", dictKey: "hitotsu" },
      { surface: "お願", furigana: "おねが", dictKey: "onegaishimasu" },
      { surface: "いします。", dictKey: "onegaishimasu" },
    ],
    jpText: "アイスコーヒーを一つお願いします。",
    viText: "Cho tôi một cà phê đá.",
  },
  {
    id: "wf-line-3",
    timestamp: "00:21",
    seconds: 21,
    speaker: "Nhân viên",
    tokens: [{ surface: "サイズ", dictKey: "saizu" }, { surface: "はいかがなさいますか。" }],
    jpText: "サイズはいかがなさいますか。",
    viText: "Quý khách muốn cỡ nào?",
  },
  {
    id: "wf-line-4",
    timestamp: "00:27",
    seconds: 27,
    speaker: "Nhân viên",
    tokens: [
      { surface: "店内", furigana: "てんない", dictKey: "tennai" },
      { surface: "でお" },
      { surface: "召", furigana: "め" },
      { surface: "し" },
      { surface: "上", furigana: "あ" },
      { surface: "がりですか。" },
    ],
    jpText: "店内でお召し上がりですか。",
    viText: "Quý khách dùng tại quán phải không ạ?",
  },
  {
    id: "wf-line-5",
    timestamp: "00:34",
    seconds: 34,
    speaker: "Khách hàng",
    tokens: [
      { surface: "M" },
      { surface: "サイズ", dictKey: "saizu" },
      { surface: "で、" },
      { surface: "店内", furigana: "てんない", dictKey: "tennai" },
      { surface: "でお願", furigana: "おねが", dictKey: "onegaishimasu" },
      { surface: "いします。" },
    ],
    jpText: "Mサイズで、店内でお願いします。",
    viText: "Cho tôi cỡ M, dùng tại quán nhé.",
  },
];

export const WF_ANNOTATIONS: Record<WFScreenKey, WFAnnotationSpec> = {
  Home: {
    screen: "Home",
    title: "Màn hình 1 — Trang chủ (WF/Home)",
    goal: "Giúp người học quay lại tập đang xem dở chỉ bằng 1 thao tác hoặc chọn nhanh series đúng trình độ JLPT ngay trên màn hình đầu tiên.",
    primaryAction:
      'Bấm "Tiếp tục học" ở khối Xem tiếp hoặc bấm "Khám phá nội dung" để vào Kho nội dung.',
    readingOrder: [
      '1. Khối giới thiệu ngắn gọn ("Học tiếng Nhật qua từng câu thoại" + nút Khám phá nội dung).',
      "2. Khối Xem tiếp (khi có lịch sử học: tên tập, thanh tiến độ và nút Tiếp tục).",
      "3. Dãy chip lọc nhanh trình độ N5, N4, N3, N2.",
      '4. Lưới "Nội dung mới nhất" (4 cột Desktop / 1 cột Mobile).',
      '5. Lưới "Phù hợp với trình độ của bạn".',
    ],
    desktopVsMobile:
      "Desktop dùng Sidebar 240px + lưới 4 cột thoáng, khối giới thiệu và Xem tiếp đặt cạnh nhau để tiết kiệm chiều dọc. Mobile xếp 1 cột dọc, dùng Bottom Navigation 3 mục cố định đáy.",
    openQuestions: [
      'Với người dùng mới chưa có lịch sử "Xem tiếp", khối này nên ẩn hoàn toàn hay hiển thị gợi ý tập mẫu N5/N4?',
      'Trình độ mặc định ở mục "Phù hợp với trình độ của bạn" lấy từ khảo sát đầu vào hay theo chip người học vừa chọn?',
    ],
  },
  Library: {
    screen: "Library",
    title: "Màn hình 2 — Kho nội dung (WF/Library)",
    goal: "Cho phép người học tìm kiếm, kết hợp bộ lọc (Trình độ, Thể loại, Kênh), xem danh sách tập của từng series và bắt đầu học ngay.",
    primaryAction: 'Chọn một Series để mở danh sách tập và bấm "Học tập này".',
    readingOrder: [
      "1. Tiêu đề trang và ô tìm kiếm từ khóa.",
      "2. Thanh lọc theo Trình độ, Thể loại, Kênh và Sắp xếp (Desktop đặt trên danh sách; Mobile gom vào nút Bộ lọc mở Bottom Sheet).",
      "3. Dòng tổng số kết quả và các chip bộ lọc đang áp dụng.",
      "4. Lưới thẻ Series + Panel danh sách tập (Desktop mở bên phải; Mobile chuyển sang subview có nút Quay lại).",
      "5. Điều hướng phân trang ở cuối danh sách.",
    ],
    desktopVsMobile:
      'Desktop hiển thị trực tiếp các dropdown lọc và mở ngăn kéo danh sách tập ngay bên phải lưới. Mobile dùng nút "Bộ lọc" mở Bottom Sheet (có Đặt lại & Áp dụng) và mở danh sách tập thành subview riêng.',
    openQuestions: [
      "Khi mở panel danh sách tập trên Desktop, lưới series nên thu thành 2-3 cột cạnh panel hay dùng ngăn trượt đè lên?",
      "Có cần hiển thị phần trăm hoàn thành tổng của cả Series ngoài tiến độ từng tập không?",
    ],
  },
  Watch: {
    screen: "Watch",
    title: "Màn hình 3 — Trang xem tập và transcript (WF/Watch - Trọng tâm)",
    goal: "Đồng bộ video 16:9 với từng câu thoại tiếng Nhật, hỗ trợ lặp câu, bật/tắt Furigana & Bản dịch, tra từ tức thì và lưu câu/từ vào Sổ tay mà không làm gián đoạn việc nghe.",
    primaryAction:
      "Nghe từng câu thoại, bấm vào từ để tra nghĩa/lưu từ, hoặc bấm nút Lưu câu vào Sổ tay.",
    readingOrder: [
      "1. Khung phát video 16:9 kèm phụ đề câu đang phát.",
      "2. Thanh công cụ học (Câu trước, Lặp câu, Câu tiếp, Tốc độ phát).",
      '3. Thông tin tập (Tiêu đề tập "Gọi đồ uống", tên series "Tiếng Nhật ở quán cà phê", nhãn N4).',
      "4. Khung Transcript với 2 tab (Hội thoại / Danh sách tập) và 3 nút bật/tắt (Bản dịch, Furigana, Tự cuộn).",
      "5. Danh sách từng câu thoại (Timestamp, Câu Nhật, Nghĩa Việt, Nút Lưu câu) và Popover/Bottom Sheet tra từ.",
    ],
    desktopVsMobile:
      "Desktop chia 2 cột: Trái 62% (Video + Toolbar học + Thông tin tập), Phải 38% (Transcript + Popover tra từ). Mobile dùng chế độ học riêng (ẩn Bottom Navigation, có thanh Quay lại gọn trên đầu), xếp dọc Video → Toolbar học → Transcript trong 1 luồng cuộn thống nhất, tra từ bằng Bottom Sheet.",
    openQuestions: [
      "Khi mở Popover tra từ, video có nên tự động tạm dừng (Auto-pause) để người học đọc nghĩa không?",
      'Chế độ "Lặp câu" nên lặp vô hạn cho tới khi bấm tắt hay lặp mặc định 3 lần rồi chuyển câu tiếp?',
    ],
  },
  Auth: {
    screen: "Auth",
    title: "Màn hình 4 — Đăng nhập / Đăng ký (WF/Auth)",
    goal: "Xác thực nhanh bằng Google hoặc Email để người học không mất mạch học khi bấm Lưu từ/câu, đồng thời quay lại đúng tập đang xem.",
    primaryAction: "Hoàn tất Đăng nhập (hoặc Tiếp tục với Google) để trở về màn hình trước đó.",
    readingOrder: [
      '1. Header tối giản gồm Logo chữ Kotoba và liên kết "Về trang chủ".',
      '2. Tiêu đề "Chào mừng bạn trở lại" (hoặc Tạo tài khoản / Khôi phục mật khẩu).',
      '3. Nút "Tiếp tục với Google".',
      "4. Biểu mẫu Email và Mật khẩu (có nút Hiện/Ẩn) + liên kết Quên mật khẩu.",
      '5. Nút hành động chính "Đăng nhập" và liên kết chuyển sang "Đăng ký".',
    ],
    desktopVsMobile:
      "Cả Desktop và Mobile đều ẩn Sidebar và Bottom Navigation để tập trung hoàn tất biểu mẫu. Desktop căn giữa khung thẻ 420px; Mobile trải gọn theo chiều dọc màn hình 390px.",
    openQuestions: [
      "Nếu khách chưa đăng nhập bấm Lưu từ ở trang Xem tập, nên chuyển sang trang Đăng nhập hay mở Modal đăng nhập ngay trên trang Xem tập?",
    ],
  },
  Notebook: {
    screen: "Notebook",
    title: "Màn hình 5 — Sổ tay của bạn (WF/Notebook)",
    goal: "Quản lý và ôn lại các Từ vựng và Câu thoại đã lưu theo từng series, cho phép nhảy ngược về đúng mốc timestamp của tập video.",
    primaryAction:
      'Tra cứu lại từ/câu đã lưu hoặc bấm "Xem lại câu" để mở video tại đúng timestamp.',
    readingOrder: [
      '1. Tiêu đề "Sổ tay của bạn" và bộ chuyển 2 tab: "Từ vựng" & "Câu đã lưu".',
      "2. Thanh công cụ tìm kiếm trong sổ tay, bộ lọc nguồn Series và Sắp xếp.",
      "3. Danh sách mục đã lưu (Từ vựng: mặt chữ, cách đọc, nghĩa, nguồn tập, ghi chú | Câu đã lưu: câu Nhật, nghĩa Việt, tên tập, timestamp, nút Xem lại câu, nút Bỏ lưu).",
      '4. Thanh thông báo (Toast) có nút "Hoàn tác" khi vừa bỏ lưu một mục.',
    ],
    desktopVsMobile:
      "Desktop trình bày danh sách hàng ngang thoáng với cột thông tin rõ ràng. Mobile chuyển thành danh sách thẻ 1 cột có các nút thao tác đủ rộng để chạm.",
    openQuestions: [
      "Ghi chú cá nhân ở mỗi từ vựng nên cho sửa trực tiếp (inline) hay mở hộp thoại chỉnh sửa?",
    ],
  },
};
