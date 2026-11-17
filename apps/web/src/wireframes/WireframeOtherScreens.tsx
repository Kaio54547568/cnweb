import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  X,
  Play,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { WF_SERIES, WF_EPISODES, WF_DICTIONARY, WF_TRANSCRIPT_LINES, WFSeriesItem } from "./wfData";
import { WFInteractiveContext } from "./WireframeShellAndWatch";

/* ============================================================================
 * THẺ SERIES WIREFRAME DÙNG CHUNG (Placeholder Thumbnail 16:9 + Tên + Trình độ + Số tập)
 * ========================================================================== */
const WFSeriesCard: React.FC<{
  series: WFSeriesItem;
  selected?: boolean;
  onClick: () => void;
}> = ({ series, selected = false, onClick }) => {
  return (
    <article
      onClick={onClick}
      className={`border transition-colors flex flex-col cursor-pointer ${
        selected
          ? "border-2 border-neutral-900 bg-neutral-100"
          : "border-neutral-400 bg-white hover:bg-neutral-50"
      }`}
    >
      {/* Placeholder Thumbnail 16:9 khối xám có nhãn, không dùng ảnh thật */}
      <div className="w-full aspect-video bg-neutral-200 border-b border-neutral-400 p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 text-xs font-mono">
          <span className="px-1.5 py-0.5 border border-neutral-700 bg-white font-bold text-neutral-900">
            {series.level}
          </span>
          <span className="px-1.5 py-0.5 border border-neutral-500 bg-white text-neutral-800">
            {series.episodeCount} tập
          </span>
        </div>
        <div className="my-auto text-center text-xs font-mono text-neutral-700 px-2">
          [{series.thumbLabel}]
        </div>
        <div className="text-[11px] font-mono text-neutral-600 truncate">
          Kênh: {series.channel}
        </div>
      </div>

      <div className="p-3.5 flex flex-col justify-between gap-2 flex-1">
        <div>
          <div className="text-xs text-neutral-600">{series.genre}</div>
          <h3 className="text-sm font-bold text-neutral-900 mt-0.5">{series.title}</h3>
        </div>
        <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs">
          <span className="font-mono text-neutral-700">Trình độ {series.level}</span>
          <span className="font-bold text-neutral-900 underline underline-offset-4">
            Xem danh sách tập →
          </span>
        </div>
      </div>
    </article>
  );
};

/* ============================================================================
 * MÀN HÌNH 1 — TRANG CHỦ (WF/Home/Desktop & WF/Home/Mobile)
 * Thứ tự:
 * 1. Giới thiệu ngắn: "Học tiếng Nhật qua từng câu thoại" + Mô tả 1 câu + Nút "Khám phá nội dung"
 * 2. Khu vực "Xem tiếp" (khi có lịch sử): tên tập, tiến độ và nút tiếp tục
 * 3. Các chip trình độ N5, N4, N3, N2
 * 4. "Nội dung mới nhất" (Desktop 4 cột; Mobile 1 cột)
 * 5. "Phù hợp với trình độ của bạn" (Desktop 4 cột; Mobile 1 cột)
 * ========================================================================== */
export const WFHomeScreen: React.FC<{ ctx: WFInteractiveContext }> = ({ ctx }) => {
  const isMobile = ctx.device === "Mobile";
  const [selectedLevelChip, setSelectedLevelChip] = useState<"ALL" | "N5" | "N4" | "N3" | "N2">(
    "N4",
  );

  const isLoading = ctx.subState === "loading";
  const hasHistory = ctx.subState !== "guest";

  const newestSeries = WF_SERIES.slice(0, 4);
  const recommendedSeries = WF_SERIES.filter((s) =>
    selectedLevelChip === "ALL" ? true : s.level === selectedLevelChip,
  ).slice(0, 4);

  if (isLoading) {
    return (
      <div className={`${isMobile ? "p-4" : "p-6"} flex flex-col gap-5`}>
        <div className="text-xs font-mono uppercase text-neutral-600">
          [Trạng thái phụ: Đang tải Trang chủ...]
        </div>
        <div className="h-24 border border-neutral-300 bg-neutral-100 p-4" />
        <div className="h-20 border border-neutral-300 bg-neutral-100 p-4" />
        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-4"}`}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 border border-neutral-300 bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? "p-4 gap-5" : "p-6 gap-6"} flex flex-col`}>
      {/* 1. Khối Giới thiệu ngắn (Gọn gàng, không làm banner quá lớn đẩy nội dung học xuống) */}
      <section className="p-4 md:p-5 border-2 border-neutral-900 bg-neutral-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono uppercase text-neutral-600">
            Kotoba • Học qua ngữ cảnh video
          </span>
          <h1 className={`${isMobile ? "text-lg" : "text-xl"} font-bold text-neutral-900`}>
            Học tiếng Nhật qua từng câu thoại
          </h1>
          <p className="text-sm text-neutral-700">
            Xem video thực tế kèm phụ đề Nhật – Việt đồng bộ, chạm vào từ bất kỳ để tra nghĩa và lưu
            vào Sổ tay.
          </p>
        </div>
        <button
          type="button"
          onClick={() => ctx.onNavigate("Library")}
          className="h-10 px-4 border-2 border-neutral-900 bg-neutral-900 text-white text-sm font-bold shrink-0 inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Khám phá nội dung</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* 2. Khu vực "Xem tiếp" khi có lịch sử học */}
      {hasHistory ? (
        <section className="p-4 border border-neutral-400 bg-white flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900">Xem tiếp</h2>
            <span className="text-xs text-neutral-600">Lịch sử học gần nhất của bạn</span>
          </div>

          <div className="p-3 border border-neutral-300 bg-neutral-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-28 aspect-video border border-neutral-400 bg-neutral-200 flex items-center justify-center text-[11px] font-mono text-neutral-700 shrink-0">
                [16:9 Tập 1]
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-neutral-600">
                  Series: Tiếng Nhật ở quán cà phê • Trình độ N4
                </div>
                <div className="text-sm font-bold text-neutral-900">
                  Tập 1: Gọi đồ uống (00:16 / 08:24)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-36 h-2 border border-neutral-400 bg-white">
                    <div className="h-full bg-neutral-800" style={{ width: "45%" }} />
                  </div>
                  <span className="text-xs font-mono text-neutral-700">Đã học 45%</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => ctx.onSelectEpisode("wf-ep-1", "wf-line-2")}
              className="h-9 px-4 border border-neutral-900 bg-neutral-900 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Tiếp tục (00:16)</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="p-3 border border-dashed border-neutral-400 bg-neutral-50 flex items-center justify-between gap-3 text-xs text-neutral-700">
          <span>
            [Trạng thái Khách chưa đăng nhập]: Đăng nhập để lưu lịch sử &ldquo;Xem tiếp&rdquo; và
            đồng bộ Sổ tay.
          </span>
          <button
            type="button"
            onClick={() => ctx.onNavigate("Auth")}
            className="px-3 py-1.5 border border-neutral-900 bg-white font-bold text-neutral-900 cursor-pointer shrink-0"
          >
            Đăng nhập
          </button>
        </section>
      )}

      {/* 3. Các chip trình độ N5, N4, N3, N2 */}
      <section className="flex items-center justify-between gap-3 flex-wrap border-y border-neutral-300 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-neutral-800 mr-1">Chọn trình độ:</span>
          {(["N5", "N4", "N3", "N2"] as const).map((lvl) => {
            const active = selectedLevelChip === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevelChip(lvl)}
                className={`h-8 px-3.5 border text-xs font-bold cursor-pointer ${
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-400 bg-white text-neutral-800 hover:bg-neutral-100"
                }`}
              >
                JLPT {lvl}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSelectedLevelChip("ALL")}
            className={`h-8 px-3 border text-xs cursor-pointer ${
              selectedLevelChip === "ALL"
                ? "border-neutral-900 bg-neutral-200 font-bold text-neutral-900"
                : "border-neutral-300 bg-white text-neutral-600"
            }`}
          >
            Tất cả
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (selectedLevelChip !== "ALL") {
              ctx.onSetLevelFilter(selectedLevelChip);
            }
            ctx.onNavigate("Library");
          }}
          className="text-xs font-bold text-neutral-900 underline underline-offset-4 cursor-pointer"
        >
          Mở Kho nội dung →
        </button>
      </section>

      {/* 4. "Nội dung mới nhất" (Desktop 4 cột; Mobile 1 cột) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900">Nội dung mới nhất</h2>
          <button
            type="button"
            onClick={() => ctx.onNavigate("Library")}
            className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 underline cursor-pointer"
          >
            Xem tất cả (8 series)
          </button>
        </div>
        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-4"}`}>
          {newestSeries.map((series) => (
            <WFSeriesCard
              key={series.id}
              series={series}
              onClick={() => {
                ctx.onSelectSeries(series.id);
                ctx.onNavigate("Library");
              }}
            />
          ))}
        </div>
      </section>

      {/* 5. "Phù hợp với trình độ của bạn" (Desktop 4 cột; Mobile 1 cột) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Phù hợp với trình độ của bạn (
              {selectedLevelChip === "ALL" ? "N5–N2" : selectedLevelChip})
            </h2>
            <p className="text-xs text-neutral-600">
              Gợi ý theo cấp độ bạn đang chọn ở thanh chip phía trên
            </p>
          </div>
        </div>
        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-4"}`}>
          {(recommendedSeries.length > 0 ? recommendedSeries : WF_SERIES.slice(4, 8)).map(
            (series) => (
              <WFSeriesCard
                key={series.id}
                series={series}
                onClick={() => {
                  ctx.onSelectSeries(series.id);
                  ctx.onNavigate("Library");
                }}
              />
            ),
          )}
        </div>
      </section>
    </div>
  );
};

/* ============================================================================
 * MÀN HÌNH 2 — KHO NỘI DUNG (WF/Library/Desktop & WF/Library/Mobile)
 * Desktop: Bộ lọc trên danh sách; bấm series mở panel danh sách tập bên phải.
 * Mobile: Nút "Bộ lọc" mở bottom sheet (Đặt lại & Áp dụng); bấm series mở subview có nút quay lại.
 * ========================================================================== */
export const WFLibraryScreen: React.FC<{ ctx: WFInteractiveContext }> = ({ ctx }) => {
  const isMobile = ctx.device === "Mobile";
  const [mobileFilterOpen, setMobileFilterOpen] = useState(ctx.subState === "mobile-filter-open");
  const [mobileSeriesSubview, setMobileSeriesSubview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const selectedSeries = WF_SERIES.find((s) => s.id === ctx.activeSeriesId) || WF_SERIES[0];
  const seriesEpisodes = WF_EPISODES.filter((e) => e.seriesId === selectedSeries.id);

  // Áp dụng bộ lọc thực tế
  const filteredSeries =
    ctx.subState === "empty-search"
      ? []
      : WF_SERIES.filter((s) => {
          const matchQ =
            !ctx.searchQuery.trim() ||
            s.title.toLowerCase().includes(ctx.searchQuery.toLowerCase()) ||
            s.genre.toLowerCase().includes(ctx.searchQuery.toLowerCase());
          const matchLvl = ctx.levelFilter === "ALL" || s.level === ctx.levelFilter;
          const matchGenre = ctx.genreFilter === "ALL" || s.genre === ctx.genreFilter;
          const matchChannel = ctx.channelFilter === "ALL" || s.channel === ctx.channelFilter;
          return matchQ && matchLvl && matchGenre && matchChannel;
        });

  const activeFilterChips: { label: string; onClear: () => void }[] = [];
  if (ctx.searchQuery.trim()) {
    activeFilterChips.push({
      label: `Từ khóa: "${ctx.searchQuery}"`,
      onClear: () => ctx.onSetSearchQuery(""),
    });
  }
  if (ctx.levelFilter !== "ALL") {
    activeFilterChips.push({
      label: `Trình độ: ${ctx.levelFilter}`,
      onClear: () => ctx.onSetLevelFilter("ALL"),
    });
  }
  if (ctx.genreFilter !== "ALL") {
    activeFilterChips.push({
      label: `Thể loại: ${ctx.genreFilter}`,
      onClear: () => ctx.onSetGenreFilter("ALL"),
    });
  }
  if (ctx.channelFilter !== "ALL") {
    activeFilterChips.push({
      label: `Kênh: ${ctx.channelFilter}`,
      onClear: () => ctx.onSetChannelFilter("ALL"),
    });
  }

  // MOBILE SUBVIEW: Khi người học bấm vào một series trên Mobile -> mở Subview danh sách tập có nút Quay lại
  if (isMobile && mobileSeriesSubview) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setMobileSeriesSubview(false)}
          className="h-9 px-3 border border-neutral-500 bg-neutral-100 text-xs font-bold text-neutral-900 inline-flex items-center gap-1.5 self-start cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách Series</span>
        </button>

        <div className="p-3.5 border-2 border-neutral-900 bg-neutral-50 flex flex-col gap-1">
          <div className="text-xs font-mono text-neutral-600">
            Trình độ {selectedSeries.level} • {selectedSeries.episodeCount} tập •{" "}
            {selectedSeries.channel}
          </div>
          <h1 className="text-base font-bold text-neutral-900">{selectedSeries.title}</h1>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-bold uppercase text-neutral-700">
            Chọn tập để bắt đầu học:
          </div>
          {(seriesEpisodes.length > 0 ? seriesEpisodes : WF_EPISODES.slice(0, 4)).map((ep) => (
            <div key={ep.id} className="p-3 border border-neutral-400 bg-white flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-600">
                <span>Tập {ep.order}</span>
                <span>Thời lượng: {ep.duration}</span>
              </div>
              <div className="text-sm font-bold text-neutral-900">{ep.title}</div>
              {ep.progressPercent > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 border border-neutral-400 bg-neutral-100">
                    <div
                      className="h-full bg-neutral-800"
                      style={{ width: `${ep.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-neutral-700">
                    {ep.progressPercent}%
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => ctx.onSelectEpisode(ep.id)}
                className="h-9 w-full border border-neutral-900 bg-neutral-900 text-white text-xs font-bold cursor-pointer mt-1"
              >
                Học tập này
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? "p-4 gap-4" : "p-6 gap-5"} flex flex-col`}>
      {/* Tiêu đề và ô tìm kiếm */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-300 pb-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Kho nội dung</h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            Tìm kiếm và lọc các bộ series tiếng Nhật theo trình độ JLPT, thể loại và kênh
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-1 md:w-72 h-10 border border-neutral-400 bg-white px-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-neutral-500 shrink-0" />
            <input
              type="text"
              value={ctx.searchQuery}
              onChange={(e) => ctx.onSetSearchQuery(e.target.value)}
              placeholder="Tìm tên series..."
              className="w-full text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none bg-transparent"
            />
          </div>
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileFilterOpen((v) => !v)}
              className="h-10 px-3 border-2 border-neutral-900 bg-neutral-100 text-xs font-bold text-neutral-900 inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Bộ lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP: Thanh lọc theo Trình độ, Thể loại, Kênh và Sắp xếp đặt trực tiếp trên danh sách */}
      {!isMobile && (
        <div className="p-3.5 border border-neutral-300 bg-neutral-50 grid grid-cols-4 gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-neutral-700">Trình độ JLPT</span>
            <select
              value={ctx.levelFilter}
              onChange={(e) => ctx.onSetLevelFilter(e.target.value)}
              className="h-9 px-2.5 border border-neutral-400 bg-white text-neutral-900 font-medium"
            >
              <option value="ALL">Tất cả trình độ</option>
              <option value="N5">N5 — Sơ cấp</option>
              <option value="N4">N4 — Tiền trung cấp</option>
              <option value="N3">N3 — Trung cấp</option>
              <option value="N2">N2 — Thượng cấp</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-neutral-700">Thể loại</span>
            <select
              value={ctx.genreFilter}
              onChange={(e) => ctx.onSetGenreFilter(e.target.value)}
              className="h-9 px-2.5 border border-neutral-400 bg-white text-neutral-900 font-medium"
            >
              <option value="ALL">Tất cả thể loại</option>
              <option value="Hội thoại đời sống">Hội thoại đời sống</option>
              <option value="Vlog thực tế">Vlog thực tế</option>
              <option value="Nghe chậm nhập môn">Nghe chậm nhập môn</option>
              <option value="Tiếng Nhật công sở">Tiếng Nhật công sở</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-neutral-700">Kênh YouTube</span>
            <select
              value={ctx.channelFilter}
              onChange={(e) => ctx.onSetChannelFilter(e.target.value)}
              className="h-9 px-2.5 border border-neutral-400 bg-white text-neutral-900 font-medium"
            >
              <option value="ALL">Tất cả kênh</option>
              <option value="Kotoba Kaiwa">Kotoba Kaiwa</option>
              <option value="Tokyo Nichijou">Tokyo Nichijou</option>
              <option value="Yasashii Nihongo">Yasashii Nihongo</option>
              <option value="Biz Nihongo">Biz Nihongo</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-neutral-700">Sắp xếp theo</span>
            <select
              value={ctx.sortBy}
              onChange={(e) => ctx.onSetSortBy(e.target.value)}
              className="h-9 px-2.5 border border-neutral-400 bg-white text-neutral-900 font-medium"
            >
              <option value="newest">Mới cập nhật</option>
              <option value="popular">Được học nhiều nhất</option>
              <option value="level-asc">Trình độ N5 → N2</option>
            </select>
          </label>
        </div>
      )}

      {/* Dòng Số kết quả và các Filter đang áp dụng */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-neutral-900">
            Tìm thấy {filteredSeries.length} series
          </span>
          {activeFilterChips.map((chip, idx) => (
            <span
              key={idx}
              className="px-2 py-1 border border-neutral-500 bg-neutral-100 text-neutral-900 inline-flex items-center gap-1.5"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.onClear}
                aria-label={`Gỡ lọc ${chip.label}`}
                className="font-bold hover:text-black cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
          {activeFilterChips.length > 0 && (
            <button
              type="button"
              onClick={ctx.onResetFilters}
              className="font-bold text-neutral-900 underline cursor-pointer"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>

        {/* Nút thử nhanh tương tác số 5: Lọc không có kết quả -> Xóa bộ lọc */}
        <button
          type="button"
          onClick={() => ctx.onSetSearchQuery("Từ khóa không tồn tại XYZ")}
          className="text-neutral-600 underline cursor-pointer"
        >
          Thử lọc không có kết quả
        </button>
      </div>

      {/* NỘI DUNG CHÍNH: Lưới Series + Panel Danh sách tập bên phải (Desktop) */}
      {filteredSeries.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-neutral-400 bg-neutral-50 text-center flex flex-col items-center gap-3">
          <div className="text-base font-bold text-neutral-900">
            Không tìm thấy series nào khớp với bộ lọc hiện tại
          </div>
          <p className="text-xs text-neutral-600 max-w-md">
            Hãy thử xóa bớt điều kiện lọc trình độ, thể loại hoặc từ khóa tìm kiếm để xem lại toàn
            bộ danh sách.
          </p>
          <button
            type="button"
            onClick={ctx.onResetFilters}
            className="h-9 px-4 border border-neutral-900 bg-neutral-900 text-white text-xs font-bold cursor-pointer"
          >
            Xóa bộ lọc &amp; hiển thị lại danh sách
          </button>
        </div>
      ) : (
        <div className={isMobile ? "flex flex-col gap-3" : "grid grid-cols-12 gap-6 items-start"}>
          {/* Lưới Series (Desktop 8/12 cột khi mở kèm Panel tập bên phải; Mobile 1 cột) */}
          <div className={isMobile ? "flex flex-col gap-3" : "col-span-7 grid grid-cols-2 gap-4"}>
            {filteredSeries.map((series) => (
              <WFSeriesCard
                key={series.id}
                series={series}
                selected={series.id === selectedSeries.id}
                onClick={() => {
                  ctx.onSelectSeries(series.id);
                  if (isMobile) {
                    setMobileSeriesSubview(true);
                  }
                }}
              />
            ))}
          </div>

          {/* DESKTOP RIGHT PANEL: Danh sách tập của Series đang chọn */}
          {!isMobile && (
            <aside
              aria-label="Danh sách tập của series đang chọn"
              className="col-span-5 border-2 border-neutral-900 bg-neutral-50 p-4 flex flex-col gap-3 sticky top-4"
            >
              <div className="border-b border-neutral-300 pb-3">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-600">
                  <span>PANEL DANH SÁCH TẬP (DESKTOP)</span>
                  <span className="px-1.5 py-0.5 border border-neutral-700 bg-white font-bold text-neutral-900">
                    {selectedSeries.level}
                  </span>
                </div>
                <h2 className="text-base font-bold text-neutral-900 mt-1">
                  {selectedSeries.title}
                </h2>
                <p className="text-xs text-neutral-600">
                  Kênh: {selectedSeries.channel} • {selectedSeries.episodeCount} tập video
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {(seriesEpisodes.length > 0 ? seriesEpisodes : WF_EPISODES.slice(0, 4)).map(
                  (ep) => (
                    <div
                      key={ep.id}
                      className="p-3 border border-neutral-400 bg-white flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-neutral-800">
                          Tập {ep.order} • {ep.duration}
                        </span>
                        {ep.progressPercent > 0 && (
                          <span className="text-[11px] font-mono text-neutral-600">
                            Tiến độ: {ep.progressPercent}%
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-neutral-900">{ep.title}</div>
                      {ep.progressPercent > 0 && (
                        <div className="w-full h-1.5 border border-neutral-400 bg-neutral-100">
                          <div
                            className="h-full bg-neutral-800"
                            style={{ width: `${ep.progressPercent}%` }}
                          />
                        </div>
                      )}
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => ctx.onSelectEpisode(ep.id)}
                          className="h-8 px-3 border border-neutral-900 bg-neutral-900 text-white text-xs font-bold cursor-pointer"
                        >
                          Học tập này →
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </aside>
          )}
        </div>
      )}

      {/* Phân trang */}
      <div className="pt-4 border-t border-neutral-300 flex items-center justify-between text-xs">
        <span className="text-neutral-600">Trang {currentPage} / 2</span>
        <div className="flex items-center gap-1.5">
          {[1, 2].map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`h-8 w-8 border font-mono cursor-pointer ${
                currentPage === page
                  ? "border-neutral-900 bg-neutral-900 text-white font-bold"
                  : "border-neutral-400 bg-white text-neutral-800"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET BỘ LỌC (Có Đặt lại và Áp dụng) */}
      {isMobile && (mobileFilterOpen || ctx.subState === "mobile-filter-open") && (
        <div
          role="dialog"
          aria-label="Bộ lọc Kho nội dung trên Mobile"
          className="border-2 border-neutral-900 bg-neutral-50 p-4 flex flex-col gap-3 shadow-lg"
        >
          <div className="w-10 h-1 bg-neutral-400 mx-auto" />
          <div className="flex items-center justify-between border-b border-neutral-300 pb-2">
            <span className="text-sm font-bold text-neutral-900">
              Bộ lọc &amp; Sắp xếp (Bottom Sheet)
            </span>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="h-7 w-7 border border-neutral-400 bg-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-neutral-700">Trình độ JLPT</span>
            <select
              value={ctx.levelFilter}
              onChange={(e) => ctx.onSetLevelFilter(e.target.value)}
              className="h-9 px-2 border border-neutral-400 bg-white text-neutral-900"
            >
              <option value="ALL">Tất cả trình độ</option>
              <option value="N5">N5</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-neutral-700">Thể loại</span>
            <select
              value={ctx.genreFilter}
              onChange={(e) => ctx.onSetGenreFilter(e.target.value)}
              className="h-9 px-2 border border-neutral-400 bg-white text-neutral-900"
            >
              <option value="ALL">Tất cả thể loại</option>
              <option value="Hội thoại đời sống">Hội thoại đời sống</option>
              <option value="Vlog thực tế">Vlog thực tế</option>
              <option value="Nghe chậm nhập môn">Nghe chậm nhập môn</option>
              <option value="Tiếng Nhật công sở">Tiếng Nhật công sở</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={ctx.onResetFilters}
              className="h-10 border border-neutral-500 bg-white text-xs font-bold text-neutral-900 cursor-pointer"
            >
              Đặt lại
            </button>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="h-10 border border-neutral-900 bg-neutral-900 text-white text-xs font-bold cursor-pointer"
            >
              Áp dụng ({filteredSeries.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * MÀN HÌNH 4 — ĐĂNG NHẬP (WF/Auth/Desktop & WF/Auth/Mobile)
 * Có trạng thái phụ: Đăng nhập, Đăng ký, Quên mật khẩu và Lỗi nhập liệu
 * ========================================================================== */
export const WFAuthScreen: React.FC<{ ctx: WFInteractiveContext }> = ({ ctx }) => {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("hocvien@kotoba.vn");
  const [password, setPassword] = useState("matkhau123");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const hasError = Boolean(localError) || ctx.subState === "auth-error";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      setLocalError("Email không hợp lệ hoặc mật khẩu ngắn hơn 6 ký tự.");
      return;
    }
    setLocalError("");
    ctx.onLoginComplete(email);
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-[400px] border-2 border-neutral-900 bg-white p-5 md:p-6 flex flex-col gap-4">
        {/* Chuyển nhanh trạng thái phụ ngay trên form để nhóm duyệt */}
        <div className="flex items-center justify-between gap-1 text-[11px] font-mono border-b border-neutral-200 pb-2">
          <span className="text-neutral-500">Chế độ:</span>
          <div className="flex items-center gap-1">
            {(
              [
                { id: "login", label: "Đăng nhập" },
                { id: "register", label: "Đăng ký" },
                { id: "forgot", label: "Quên MK" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id);
                  setLocalError("");
                }}
                className={`px-2 py-0.5 border cursor-pointer ${
                  mode === m.id
                    ? "border-neutral-900 bg-neutral-900 text-white font-bold"
                    : "border-neutral-300 bg-neutral-100 text-neutral-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            {mode === "login"
              ? "Chào mừng bạn trở lại"
              : mode === "register"
                ? "Tạo tài khoản Kotoba"
                : "Khôi phục mật khẩu"}
          </h1>
          <p className="text-xs text-neutral-600 mt-1">
            {ctx.returnToWatchAfterAuth
              ? 'Đăng nhập để hoàn tất lưu từ/câu và quay lại tập "Gọi đồ uống" đang xem.'
              : "Lưu từ vựng, câu thoại Nhật – Việt và đồng bộ tiến độ xem video."}
          </p>
        </div>

        {hasError && (
          <div className="p-3 border-2 border-neutral-900 bg-neutral-100 text-xs text-neutral-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {localError ||
                "Email hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra lại thông tin đăng nhập."}
            </span>
          </div>
        )}

        {mode !== "forgot" && (
          <>
            {/* Nút Tiếp tục với Google */}
            <button
              type="button"
              onClick={() => ctx.onLoginComplete("google.user@kotoba.vn")}
              className="h-10 w-full border-2 border-neutral-900 bg-white hover:bg-neutral-100 text-sm font-bold text-neutral-900 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="font-mono text-xs px-1.5 py-0.2 border border-neutral-700">G</span>
              <span>Tiếp tục với Google</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <div className="flex-1 h-px bg-neutral-300" />
              <span>hoặc dùng Email</span>
              <div className="flex-1 h-px bg-neutral-300" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-bold text-neutral-900">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@email.com"
              className="h-10 px-3 border border-neutral-500 bg-white text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
          </label>

          {mode !== "forgot" && (
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <label htmlFor="wf-pass" className="font-bold text-neutral-900">
                  Mật khẩu
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-neutral-700 underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="h-10 border border-neutral-500 bg-white flex items-center px-3">
                <input
                  id="wf-pass"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm text-neutral-900 focus:outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="text-xs font-semibold text-neutral-700 inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span>{showPassword ? "Ẩn" : "Hiện"}</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="h-11 w-full border-2 border-neutral-900 bg-neutral-900 text-white text-sm font-bold cursor-pointer mt-1"
          >
            {mode === "login"
              ? "Đăng nhập"
              : mode === "register"
                ? "Đăng ký tài khoản"
                : "Gửi liên kết đặt lại mật khẩu"}
          </button>
        </form>

        {/* Link chuyển đổi Đăng ký / Đăng nhập */}
        <div className="pt-2 border-t border-neutral-200 text-center text-xs text-neutral-700">
          {mode === "login" ? (
            <span>
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="font-bold text-neutral-900 underline cursor-pointer"
              >
                Đăng ký
              </button>
            </span>
          ) : (
            <span>
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-bold text-neutral-900 underline cursor-pointer"
              >
                Đăng nhập
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * MÀN HÌNH 5 — SỔ TAY CỦA BẠN (WF/Notebook/Desktop & WF/Notebook/Mobile)
 * Hai tab: Từ vựng & Câu đã lưu | Tìm kiếm | Lọc nguồn series & Sắp xếp | Bỏ lưu + Toast Hoàn tác
 * ========================================================================== */
export const WFNotebookScreen: React.FC<{ ctx: WFInteractiveContext }> = ({ ctx }) => {
  const isMobile = ctx.device === "Mobile";
  const [tab, setTab] = useState<"words" | "sentences">("words");
  const [nbQuery, setNbQuery] = useState("");
  const [sourceSeries, setSourceSeries] = useState("ALL");
  const [nbSort, setNbSort] = useState("recent");

  const isEmptyState = ctx.subState === "empty-notebook";

  const savedWords = isEmptyState
    ? []
    : ctx.savedWordKeys
        .map((k) => WF_DICTIONARY[k])
        .filter(Boolean)
        .filter((item) => {
          const matchQ =
            !nbQuery.trim() ||
            item.word.toLowerCase().includes(nbQuery.toLowerCase()) ||
            item.meaningVi.toLowerCase().includes(nbQuery.toLowerCase());
          const matchSeries = sourceSeries === "ALL" || item.seriesTitle === sourceSeries;
          return matchQ && matchSeries;
        });

  const savedSentences = isEmptyState
    ? []
    : WF_TRANSCRIPT_LINES.filter((line) => ctx.savedSentenceIds.includes(line.id)).filter(
        (line) => {
          const matchQ =
            !nbQuery.trim() ||
            line.jpText.toLowerCase().includes(nbQuery.toLowerCase()) ||
            line.viText.toLowerCase().includes(nbQuery.toLowerCase());
          return matchQ;
        },
      );

  return (
    <div className={`${isMobile ? "p-4 gap-4" : "p-6 gap-5"} flex flex-col`}>
      {/* Tiêu đề "Sổ tay của bạn" + 2 Tab Từ vựng / Câu đã lưu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-300 pb-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Sổ tay của bạn</h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            Ôn lại từ vựng và các câu thoại đã lưu trong quá trình xem tập video
          </p>
        </div>

        <div className="inline-flex border-2 border-neutral-900 bg-neutral-100">
          <button
            type="button"
            onClick={() => setTab("words")}
            className={`h-9 px-4 text-xs font-bold cursor-pointer ${
              tab === "words"
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-800 hover:bg-neutral-100"
            }`}
          >
            Từ vựng ({savedWords.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("sentences")}
            className={`h-9 px-4 text-xs font-bold border-l border-neutral-900 cursor-pointer ${
              tab === "sentences"
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-800 hover:bg-neutral-100"
            }`}
          >
            Câu đã lưu ({savedSentences.length})
          </button>
        </div>
      </div>

      {/* Thanh công cụ: Tìm kiếm trong sổ tay + Bộ lọc nguồn series + Sắp xếp */}
      <div
        className={`p-3 border border-neutral-300 bg-neutral-50 grid gap-3 ${
          isMobile ? "grid-cols-1" : "grid-cols-12"
        }`}
      >
        <div
          className={`${
            isMobile ? "" : "col-span-6"
          } h-9 border border-neutral-400 bg-white px-3 flex items-center gap-2`}
        >
          <Search className="w-4 h-4 text-neutral-500 shrink-0" />
          <input
            type="text"
            value={nbQuery}
            onChange={(e) => setNbQuery(e.target.value)}
            placeholder="Tìm từ vựng, nghĩa tiếng Việt hoặc câu đã lưu..."
            className="w-full text-xs text-neutral-900 placeholder-neutral-500 focus:outline-none bg-transparent"
          />
        </div>

        <div className={isMobile ? "" : "col-span-3"}>
          <select
            aria-label="Lọc theo nguồn series"
            value={sourceSeries}
            onChange={(e) => setSourceSeries(e.target.value)}
            className="w-full h-9 px-2.5 border border-neutral-400 bg-white text-xs text-neutral-900 font-medium"
          >
            <option value="ALL">Nguồn: Tất cả series</option>
            <option value="Tiếng Nhật ở quán cà phê">Tiếng Nhật ở quán cà phê</option>
            <option value="Cuộc sống tại Tokyo">Cuộc sống tại Tokyo</option>
          </select>
        </div>

        <div className={isMobile ? "" : "col-span-3"}>
          <select
            aria-label="Sắp xếp sổ tay"
            value={nbSort}
            onChange={(e) => setNbSort(e.target.value)}
            className="w-full h-9 px-2.5 border border-neutral-400 bg-white text-xs text-neutral-900 font-medium"
          >
            <option value="recent">Sắp xếp: Mới lưu gần đây</option>
            <option value="alpha">Sắp xếp: Bảng chữ cái</option>
          </select>
        </div>
      </div>

      {/* Nội dung Tab Từ vựng */}
      {tab === "words" && (
        <>
          {savedWords.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-neutral-400 bg-neutral-50 text-center flex flex-col items-center gap-3">
              <div className="text-base font-bold text-neutral-900">
                Sổ tay từ vựng của bạn đang trống
              </div>
              <p className="text-xs text-neutral-600 max-w-md">
                Khi xem tập video, hãy chạm vào từ bất kỳ trong phụ đề để tra nghĩa và bấm
                &ldquo;Lưu từ&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => ctx.onSelectEpisode("wf-ep-1", "wf-line-2")}
                className="h-9 px-4 border border-neutral-900 bg-neutral-900 text-white text-xs font-bold cursor-pointer"
              >
                Mở tập &ldquo;Gọi đồ uống&rdquo; để lưu từ
              </button>
            </div>
          ) : (
            /* Desktop dùng danh sách thoáng; Mobile dùng card 1 cột */
            <div className="flex flex-col gap-3">
              {savedWords.map((w) => (
                <div
                  key={w.key}
                  className={`p-4 border border-neutral-400 bg-white ${
                    isMobile ? "flex flex-col gap-2.5" : "grid grid-cols-12 gap-4 items-center"
                  }`}
                >
                  <div className={isMobile ? "" : "col-span-3"}>
                    <div className="text-base font-bold text-neutral-900">{w.word}</div>
                    <div className="text-xs font-mono text-neutral-600">{w.reading}</div>
                  </div>

                  <div className={isMobile ? "" : "col-span-4"}>
                    <div className="text-sm font-bold text-neutral-900">{w.meaningVi}</div>
                    <div className="text-xs text-neutral-600 mt-0.5">Ghi chú: {w.note}</div>
                  </div>

                  <div className={isMobile ? "" : "col-span-3 text-xs text-neutral-700"}>
                    <div className="font-semibold text-neutral-900">
                      Nguồn: {w.episodeTitle} ({w.timestamp})
                    </div>
                    <div className="text-neutral-600">{w.seriesTitle}</div>
                  </div>

                  <div
                    className={
                      isMobile
                        ? "pt-2 border-t border-neutral-200 flex items-center justify-between gap-2"
                        : "col-span-2 flex items-center justify-end gap-2"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => ctx.onSelectEpisode("wf-ep-1", "wf-line-2")}
                      className="h-8 px-2.5 border border-neutral-500 bg-neutral-100 text-xs font-semibold text-neutral-900 cursor-pointer"
                    >
                      Mở tập
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        ctx.onToggleSaveWord(w.key);
                        ctx.onTriggerUndoToast(`Đã bỏ lưu từ "${w.word}"`, () =>
                          ctx.onToggleSaveWord(w.key),
                        );
                      }}
                      aria-label={`Bỏ lưu từ ${w.word}`}
                      className="h-8 px-2.5 border border-neutral-400 bg-white hover:bg-neutral-200 text-xs text-neutral-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Bỏ lưu</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Nội dung Tab Câu đã lưu */}
      {tab === "sentences" && (
        <>
          {savedSentences.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-neutral-400 bg-neutral-50 text-center flex flex-col items-center gap-3">
              <div className="text-base font-bold text-neutral-900">
                Chưa có câu thoại nào được lưu
              </div>
              <p className="text-xs text-neutral-600 max-w-md">
                Bấm nút &ldquo;Lưu câu&rdquo; trên bất kỳ dòng hội thoại nào ở trang Xem tập để lưu
                câu vào đây.
              </p>
              <button
                type="button"
                onClick={() => ctx.onSelectEpisode("wf-ep-1", "wf-line-2")}
                className="h-9 px-4 border border-neutral-900 bg-neutral-900 text-white text-xs font-bold cursor-pointer"
              >
                Đến tập &ldquo;Gọi đồ uống&rdquo;
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {savedSentences.map((line) => (
                <div
                  key={line.id}
                  className={`p-4 border border-neutral-400 bg-white ${
                    isMobile ? "flex flex-col gap-3" : "flex items-center justify-between gap-4"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-600">
                      <span className="px-2 py-0.5 border border-neutral-700 bg-neutral-100 font-bold text-neutral-900">
                        {line.timestamp}
                      </span>
                      <span>Tập: Gọi đồ uống • Tiếng Nhật ở quán cà phê</span>
                    </div>
                    <div className="text-base font-bold text-neutral-900 mt-0.5">{line.jpText}</div>
                    <div className="text-sm text-neutral-700">{line.viText}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => ctx.onSelectEpisode("wf-ep-1", line.id)}
                      className="h-9 px-3 border border-neutral-900 bg-neutral-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Xem lại câu ({line.timestamp})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        ctx.onToggleSaveSentence(line.id);
                        ctx.onTriggerUndoToast(`Đã bỏ lưu câu tại ${line.timestamp}`, () =>
                          ctx.onToggleSaveSentence(line.id),
                        );
                      }}
                      className="h-9 px-3 border border-neutral-400 bg-white hover:bg-neutral-200 text-xs font-semibold text-neutral-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Bỏ lưu</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
