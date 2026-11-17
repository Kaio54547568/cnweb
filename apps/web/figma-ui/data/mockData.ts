export type JLPTLevel = "N5" | "N4" | "N3" | "N2";

export interface RubySegment {
  kanji: string;
  furigana?: string;
  dictId?: string;
}

export interface TranscriptItem {
  id: string;
  startTime: string;
  seconds: number;
  endSeconds: number;
  speaker: string;
  segments: RubySegment[];
  jpPlain: string;
  readingPlain: string;
  vi: string;
  grammarNote?: string;
  level: JLPTLevel;
}

export interface WordEntry {
  id: string;
  word: string;
  furigana: string;
  romaji: string;
  pos: string;
  level: JLPTLevel;
  meaningVi: string;
  exampleJp: RubySegment[];
  exampleVi: string;
  episodeTitle: string;
  timestamp: string;
}

export interface Episode {
  id: string;
  seriesId: string;
  number: number;
  title: string;
  jpTitle: RubySegment[];
  duration: string;
  durationSeconds: number;
  level: JLPTLevel;
  thumbnail: string;
  progressPercent: number;
  lastWatchedSecond: number;
  subtitleCount: number;
  description: string;
}

export interface SeriesItem {
  id: string;
  title: string;
  jpTitle: RubySegment[];
  level: JLPTLevel;
  episodeCount: number;
  category: string;
  channelName: string;
  thumbnail: string;
  description: string;
  progressPercent: number;
  featuredEpisodeId: string;
  tags: string[];
}

export const DICTIONARY_ENTRIES: Record<string, WordEntry> = {
  chuumon: {
    id: "chuumon",
    word: "注文",
    furigana: "ちゅうもん",
    romaji: "chuumon",
    pos: "Danh từ / Động từ Suru",
    level: "N4",
    meaningVi: "Gọi món, đặt hàng",
    exampleJp: [
      { kanji: "ご" },
      { kanji: "注文", furigana: "ちゅうもん" },
      { kanji: "はお" },
      { kanji: "決", furigana: "き" },
      { kanji: "まりですか。" },
    ],
    exampleVi: "Quý khách đã chọn được món chưa ạ?",
    episodeTitle: "Gọi đồ uống",
    timestamp: "00:14",
  },
  osusume: {
    id: "osusume",
    word: "おすすめ",
    furigana: "おすすめ",
    romaji: "osusume",
    pos: "Danh từ",
    level: "N4",
    meaningVi: "Món gợi ý, đề xuất đặc biệt",
    exampleJp: [{ kanji: "今日", furigana: "きょう" }, { kanji: "のおすすめは何ですか。" }],
    exampleVi: "Món gợi ý hôm nay là gì vậy ạ?",
    episodeTitle: "Gọi đồ uống",
    timestamp: "00:48",
  },
  tennai: {
    id: "tennai",
    word: "店内",
    furigana: "てんない",
    romaji: "tennai",
    pos: "Danh từ",
    level: "N4",
    meaningVi: "Trong quán, dùng tại quán",
    exampleJp: [
      { kanji: "店内", furigana: "てんない" },
      { kanji: "でお" },
      { kanji: "召", furigana: "め" },
      { kanji: "し" },
      { kanji: "上", furigana: "あ" },
      { kanji: "がりですか。" },
    ],
    exampleVi: "Quý khách dùng tại quán phải không ạ?",
    episodeTitle: "Gọi đồ uống",
    timestamp: "01:32",
  },
  mojikaeri: {
    id: "mojikaeri",
    word: "持ち帰り",
    furigana: "もちかえり",
    romaji: "mochikaeri",
    pos: "Danh từ",
    level: "N4",
    meaningVi: "Mang đi (take-away)",
    exampleJp: [
      { kanji: "お" },
      { kanji: "持", furigana: "も" },
      { kanji: "ち" },
      { kanji: "帰", furigana: "かえ" },
      { kanji: "りでお" },
      { kanji: "願", furigana: "ねが" },
      { kanji: "いします。" },
    ],
    exampleVi: "Cho tôi mang đi nhé.",
    episodeTitle: "Gọi đồ uống",
    timestamp: "02:05",
  },
  satou: {
    id: "satou",
    word: "砂糖",
    furigana: "さとう",
    romaji: "satou",
    pos: "Danh từ",
    level: "N5",
    meaningVi: "Đường",
    exampleJp: [
      { kanji: "砂糖", furigana: "さとう" },
      { kanji: "は" },
      { kanji: "少", furigana: "すこ" },
      { kanji: "しだけ" },
      { kanji: "入", furigana: "い" },
      { kanji: "れてください。" },
    ],
    exampleVi: "Xin chỉ cho một chút đường thôi.",
    episodeTitle: "Gọi đồ uống",
    timestamp: "03:18",
  },
  kaikei: {
    id: "kaikei",
    word: "会計",
    furigana: "かいけい",
    romaji: "kaikei",
    pos: "Danh từ / Động từ Suru",
    level: "N3",
    meaningVi: "Thanh toán, tính tiền",
    exampleJp: [
      { kanji: "お" },
      { kanji: "会計", furigana: "かいけい" },
      { kanji: "はカードでいいですか。" },
    ],
    exampleVi: "Tôi thanh toán bằng thẻ được không ạ?",
    episodeTitle: "Gọi đồ uống",
    timestamp: "05:42",
  },
};

export const SERIES_LIST: SeriesItem[] = [
  {
    id: "series-cafe",
    title: "Tiếng Nhật ở quán cà phê",
    jpTitle: [
      { kanji: "カフェで" },
      { kanji: "使", furigana: "つか" },
      { kanji: "う" },
      { kanji: "日本語", furigana: "にほんご" },
    ],
    level: "N4",
    episodeCount: 8,
    category: "Hội thoại đời sống",
    channelName: "Kotoba Kaiwa Studio",
    thumbnail:
      "https://images.unsplash.com/photo-1768162125841-c17992473464?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxqYXBhbmVzZSUyMGNhZmUlMjBjb2ZmZWUlMjBwb3VyJTIwb3ZlcnxlbnwxfHx8fDE3OTQwNTE5Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    description:
      "Thực hành hội thoại tự nhiên trong quán cà phê Nhật Bản: từ bước gọi đồ uống, chọn kích cỡ, hỏi món gợi ý đến khi thanh toán tại quầy.",
    progressPercent: 45,
    featuredEpisodeId: "ep-order-drink",
    tags: ["#HộiThoại", "#QuánCàPhê", "#JLPT_N4", "#PhụĐềSongNgữ"],
  },
  {
    id: "series-tokyo",
    title: "Cuộc sống tại Tokyo",
    jpTitle: [
      { kanji: "東京", furigana: "とうきょう" },
      { kanji: "での" },
      { kanji: "暮", furigana: "く" },
      { kanji: "らし" },
    ],
    level: "N3",
    episodeCount: 6,
    category: "Vlog thực tế",
    channelName: "Tokyo Life Vlog",
    thumbnail:
      "https://images.unsplash.com/photo-1493515322954-4fa727e97985?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHx0b2t5byUyMHN0cmVldCUyMGV2ZW5pbmclMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzk0MDUxOTc3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    description:
      "Khám phá nhịp sống thường nhật ở Tokyo: đi tàu điện giờ cao điểm, thuê nhà, mua sắm ở cửa hàng tiện lợi và giao tiếp với hàng xóm.",
    progressPercent: 20,
    featuredEpisodeId: "ep-tokyo-1",
    tags: ["#Tokyo", "#ĐờiSống", "#JLPT_N3", "#YouTubeNhật"],
  },
  {
    id: "series-weekend",
    title: "Nhật ký cuối tuần",
    jpTitle: [
      { kanji: "週末", furigana: "しゅうまつ" },
      { kanji: "の" },
      { kanji: "日記", furigana: "にっき" },
    ],
    level: "N5",
    episodeCount: 10,
    category: "Nghe chậm nhập môn",
    channelName: "Yasashii Nihongo",
    thumbnail:
      "https://images.unsplash.com/photo-1762178907271-b03ad46fdc14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxreW90byUyMHBhcmslMjB3ZWVrZW5kJTIwbmF0dXJlJTIwamFwYW58ZW58MXx8fHwxNzk0MDUxOTc4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    description:
      "Những đoạn vlog ngắn tốc độ chậm dành cho người mới bắt đầu, kể chuyện dạo công viên, nấu bữa sáng và đọc sách cuối tuần.",
    progressPercent: 70,
    featuredEpisodeId: "ep-weekend-1",
    tags: ["#NhậpMôn", "#VlogChậm", "#JLPT_N5", "#ĐờiThường"],
  },
  {
    id: "series-office",
    title: "Chuyện công sở",
    jpTitle: [{ kanji: "オフィスでの" }, { kanji: "会話", furigana: "かいわ" }],
    level: "N2",
    episodeCount: 5,
    category: "Tiếng Nhật thương mại",
    channelName: "BizJp Channel",
    thumbnail:
      "https://images.unsplash.com/photo-1560142249-f8718fd9cd88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMG1vZGVybiUyMG9mZmljZSUyMGJ1c2luZXNzJTIwbWVldGluZ3xlbnwxfHx8fDE3OTQwNTE5Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    description:
      "Kính ngữ (Keigo), báo cáo tiến độ Хо-Ren-So, thuyết trình trong cuộc họp và cách trao đổi khéo léo với đồng nghiệp tại công ty Nhật.",
    progressPercent: 10,
    featuredEpisodeId: "ep-office-1",
    tags: ["#CôngSở", "#Keigo", "#JLPT_N2", "#Business"],
  },
];

export const EPISODES_LIST: Episode[] = [
  {
    id: "ep-order-drink",
    seriesId: "series-cafe",
    number: 1,
    title: "Gọi đồ uống",
    jpTitle: [
      { kanji: "飲", furigana: "の" },
      { kanji: "み" },
      { kanji: "物", furigana: "もの" },
      { kanji: "を" },
      { kanji: "注文", furigana: "ちゅうもん" },
      { kanji: "する" },
    ],
    duration: "08:24",
    durationSeconds: 504,
    level: "N4",
    thumbnail:
      "https://images.unsplash.com/photo-1768162125841-c17992473464?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxqYXBhbmVzZSUyMGNhZmUlMjBjb2ZmZWUlMjBwb3VyJTIwb3ZlcnxlbnwxfHx8fDE3OTQwNTE5Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    progressPercent: 45,
    lastWatchedSecond: 92,
    subtitleCount: 42,
    description:
      "Cách gọi cà phê đá, hỏi món đặc biệt trong ngày và trả lời câu hỏi dùng tại quán hay mang đi của nhân viên.",
  },
  {
    id: "ep-cafe-2",
    seriesId: "series-cafe",
    number: 2,
    title: "Chọn kích cỡ và lượng đường đá",
    jpTitle: [
      { kanji: "サイズと" },
      { kanji: "甘", furigana: "あま" },
      { kanji: "さを" },
      { kanji: "選", furigana: "えら" },
      { kanji: "ぶ" },
    ],
    duration: "07:15",
    durationSeconds: 435,
    level: "N4",
    thumbnail:
      "https://images.unsplash.com/photo-1785757783391-fd382741b7b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxqYXBhbmVzZSUyMGNhZmUlMjBjb2ZmZWUlMjBwb3VyJTIwb3ZlcnxlbnwxfHx8fDE3OTQwNTE5Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    progressPercent: 100,
    lastWatchedSecond: 435,
    subtitleCount: 36,
    description: "Phân biệt kích cỡ S/M/L, cách nhờ giảm đá và thêm sữa tươi bằng mẫu câu lịch sự.",
  },
  {
    id: "ep-cafe-3",
    seriesId: "series-cafe",
    number: 3,
    title: "Hỏi mật khẩu Wi-Fi và ổ cắm điện",
    jpTitle: [{ kanji: "Wi-Fiとコンセントを" }, { kanji: "聞", furigana: "き" }, { kanji: "く" }],
    duration: "06:50",
    durationSeconds: 410,
    level: "N4",
    thumbnail:
      "https://images.unsplash.com/photo-1774014045844-22f7dfca101c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxqYXBhbmVzZSUyMGNhZmUlMjBjb2ZmZWUlMjBwb3VyJTIwb3ZlcnxlbnwxfHx8fDE3OTQwNTE5Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    progressPercent: 0,
    lastWatchedSecond: 0,
    subtitleCount: 31,
    description: "Mẫu câu xin phép sử dụng ổ cắm sạc laptop và hỏi mật khẩu Wi-Fi tại quán.",
  },
  {
    id: "ep-tokyo-1",
    seriesId: "series-tokyo",
    number: 1,
    title: "Buổi tối ở ga Shibuya",
    jpTitle: [
      { kanji: "渋谷駅", furigana: "しぶやえき" },
      { kanji: "の" },
      { kanji: "夜", furigana: "よる" },
    ],
    duration: "09:40",
    durationSeconds: 580,
    level: "N3",
    thumbnail:
      "https://images.unsplash.com/photo-1493515322954-4fa727e97985?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHx0b2t5byUyMHN0cmVldCUyMGV2ZW5pbmclMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzk0MDUxOTc3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    progressPercent: 20,
    lastWatchedSecond: 116,
    subtitleCount: 54,
    description: "Cách hỏi đường chuyển tuyến tàu điện ngầm và hẹn gặp bạn bè ở cửa soát vé.",
  },
  {
    id: "ep-weekend-1",
    seriesId: "series-weekend",
    number: 1,
    title: "Đi dạo công viên mùa thu",
    jpTitle: [
      { kanji: "秋", furigana: "あき" },
      { kanji: "の" },
      { kanji: "公園", furigana: "こうえん" },
      { kanji: "を" },
      { kanji: "散歩", furigana: "さんぽ" },
    ],
    duration: "05:30",
    durationSeconds: 330,
    level: "N5",
    thumbnail:
      "https://images.unsplash.com/photo-1762178907271-b03ad46fdc14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxreW90byUyMHBhcmslMjB3ZWVrZW5kJTIwbmF0dXJlJTIwamFwYW58ZW58MXx8fHwxNzk0MDUxOTc4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    progressPercent: 70,
    lastWatchedSecond: 231,
    subtitleCount: 28,
    description: "Từ vựng N5 cơ bản về thời tiết, cây cối và cảm xúc thư giãn ngày cuối tuần.",
  },
  {
    id: "ep-office-1",
    seriesId: "series-office",
    number: 1,
    title: "Báo cáo tiến độ buổi sáng",
    jpTitle: [
      { kanji: "朝礼", furigana: "ちょうれい" },
      { kanji: "での" },
      { kanji: "進捗報告", furigana: "しんちょくほうこく" },
    ],
    duration: "10:12",
    durationSeconds: 612,
    level: "N2",
    thumbnail:
      "https://images.unsplash.com/photo-1560142249-f8718fd9cd88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMG1vZGVybiUyMG9mZmljZSUyMGJ1c2luZXNzJTIwbWVldGluZ3xlbnwxfHx8fDE3OTQwNTE5Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    progressPercent: 10,
    lastWatchedSecond: 61,
    subtitleCount: 62,
    description:
      "Cách trình bày ngắn gọn công việc trong ngày và xin ý kiến cấp trên bằng kính ngữ.",
  },
];

export const ORDER_DRINK_TRANSCRIPT: TranscriptItem[] = [
  {
    id: "sub-1",
    startTime: "00:14",
    seconds: 14,
    endSeconds: 47,
    speaker: "Nhân viên (店員)",
    segments: [
      { kanji: "いらっしゃいませ。ご" },
      { kanji: "注文", furigana: "ちゅうもん", dictId: "chuumon" },
      { kanji: "はお" },
      { kanji: "決", furigana: "き" },
      { kanji: "まりですか。" },
    ],
    jpPlain: "いらっしゃいませ。ご注文はお決まりですか。",
    readingPlain: "いらっしゃいませ。ごちゅうもんはおきまりですか。",
    vi: "Xin kính chào quý khách. Quý khách đã chọn được món chưa ạ?",
    grammarNote: "お決まりですか: Cách hỏi lịch sự xem khách đã quyết định món chưa.",
    level: "N4",
  },
  {
    id: "sub-2",
    startTime: "00:48",
    seconds: 48,
    endSeconds: 91,
    speaker: "Khách hàng (客)",
    segments: [
      { kanji: "すみません、" },
      { kanji: "今日", furigana: "きょう" },
      { kanji: "の" },
      { kanji: "おすすめ", dictId: "osusume" },
      { kanji: "のコーヒーは" },
      { kanji: "何", furigana: "なに" },
      { kanji: "ですか。" },
    ],
    jpPlain: "すみません、今日のおすすめのコーヒーは何ですか。",
    readingPlain: "すみません、きょうのおすすめのコーヒーはなんですか。",
    vi: "Xin lỗi, cà phê gợi ý của hôm nay là món gì vậy ạ?",
    grammarNote: "～のおすすめは何ですか: Mẫu câu hỏi món đặc biệt / gợi ý của quán.",
    level: "N4",
  },
  {
    id: "sub-3",
    startTime: "01:32",
    seconds: 92,
    endSeconds: 124,
    speaker: "Nhân viên (店員)",
    segments: [
      { kanji: "季節限定", furigana: "きせつげんてい" },
      { kanji: "のカフェラテがございます。" },
      { kanji: "店内", furigana: "てんない", dictId: "tennai" },
      { kanji: "でお" },
      { kanji: "召", furigana: "め" },
      { kanji: "し" },
      { kanji: "上", furigana: "あ" },
      { kanji: "がりですか。" },
    ],
    jpPlain: "季節限定のカフェラテがございます。店内でお召し上がりですか。",
    readingPlain: "きせつげんていのカフェラテがございます。てんないでおめしあがりですか。",
    vi: "Bên em có Cafe Latte giới hạn theo mùa ạ. Quý khách dùng tại quán phải không ạ?",
    grammarNote: "お召し上がり: Tôn kính ngữ của 食べる / 飲む (ăn / uống).",
    level: "N4",
  },
  {
    id: "sub-4",
    startTime: "02:05",
    seconds: 125,
    endSeconds: 197,
    speaker: "Khách hàng (客)",
    segments: [
      { kanji: "じゃあ、それをホットでください。お" },
      { kanji: "持", furigana: "も", dictId: "mojikaeri" },
      { kanji: "ち" },
      { kanji: "帰", furigana: "かえ", dictId: "mojikaeri" },
      { kanji: "りでお" },
      { kanji: "願", furigana: "ねが" },
      { kanji: "いします。" },
    ],
    jpPlain: "じゃあ、それをホットでください。お持ち帰りでお願いします。",
    readingPlain: "じゃあ、それをホットでください。おもちかえりでおねがいします。",
    vi: "Vậy cho tôi món đó uống nóng nhé. Cho tôi mang đi ạ.",
    grammarNote: "～でお願いします: Dùng để chọn hình thức (dùng tại chỗ / mang đi / cỡ ly).",
    level: "N4",
  },
  {
    id: "sub-5",
    startTime: "03:18",
    seconds: 198,
    endSeconds: 341,
    speaker: "Khách hàng (客)",
    segments: [
      { kanji: "あと、" },
      { kanji: "砂糖", furigana: "さとう", dictId: "satou" },
      { kanji: "は" },
      { kanji: "少", furigana: "すこ" },
      { kanji: "しだけ" },
      { kanji: "入", furigana: "い" },
      { kanji: "れてもらえますか。" },
    ],
    jpPlain: "あと、砂糖は少しだけ入れてもらえますか。",
    readingPlain: "あと、さとうはすこしだけいれてもらえますか。",
    vi: "À, bạn có thể cho thêm một chút đường giúp tôi được không?",
    grammarNote: "～てもらえますか: Nhờ vả lịch sự người khác làm gì đó cho mình.",
    level: "N4",
  },
  {
    id: "sub-6",
    startTime: "05:42",
    seconds: 342,
    endSeconds: 504,
    speaker: "Khách hàng (客)",
    segments: [
      { kanji: "ありがとうございます。お" },
      { kanji: "会計", furigana: "かいけい", dictId: "kaikei" },
      { kanji: "はクレジットカードで" },
      { kanji: "払", furigana: "はら" },
      { kanji: "えますか。" },
    ],
    jpPlain: "ありがとうございます。お会計はクレジットカードで払えますか。",
    readingPlain: "ありがとうございます。おかいけいはクレジットカードではらえますか。",
    vi: "Cảm ơn bạn. Tôi thanh toán bằng thẻ tín dụng được không ạ?",
    grammarNote: "払えますか: Thể khả năng của 払う (có thể thanh toán bằng...).",
    level: "N4",
  },
];
