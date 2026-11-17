import React, { useState } from "react";
import {
  Home,
  Library,
  BookOpen,
  Play,
  Heart,
  Search,
  Volume2,
  ArrowRight,
  Layers,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Monitor,
} from "lucide-react";
import {
  Brand,
  SidebarItem,
  Header,
  MobileNavigation,
  Button,
  IconButton,
  TextField,
  SearchField,
  Select,
  FilterChip,
  Badge,
  ContentCard,
  EpisodeRow,
  ProgressBar,
  Tab,
  TranscriptRow,
  RubyText,
  DictionaryPopover,
  SavedWordCard,
  SavedSentenceCard,
  Dialog,
  BottomSheet,
  Toast,
  Skeleton,
  EmptyState,
} from "./DesignSystem";
import {
  SERIES_LIST,
  EPISODES_LIST,
  ORDER_DRINK_TRANSCRIPT,
  DICTIONARY_ENTRIES,
} from "../data/mockData";
import { MVPSharedState, ScreenId } from "./MVPScreens";

/* ============================================================================
 * PAGE 00: 00 Foundations
 * ========================================================================== */
export const Page00Foundations: React.FC = () => {
  const colorTokens = [
    {
      name: "bg/canvas",
      hex: "#18191C",
      usage: "Nền chính ứng dụng (Dark Canvas)",
      text: "#F5F6F8",
    },
    {
      name: "bg/surface",
      hex: "#24262B",
      usage: "Bề mặt thẻ, Sidebar, khung nội dung",
      text: "#F5F6F8",
    },
    {
      name: "bg/elevated",
      hex: "#30333A",
      usage: "Bề mặt nổi, Popover, BottomSheet, Hover",
      text: "#F5F6F8",
    },
    {
      name: "border/subtle",
      hex: "#454954",
      usage: "Đường viền phân tách chuẩn 1px",
      text: "#F5F6F8",
    },
    {
      name: "text/primary",
      hex: "#F5F6F8",
      usage: "Chữ chính độ tương phản cao (AAA)",
      text: "#18191C",
    },
    {
      name: "text/secondary",
      hex: "#B8BFCC",
      usage: "Chữ phụ, Furigana, phụ đề tiếng Việt",
      text: "#18191C",
    },
    {
      name: "brand/primary",
      hex: "#C9363E",
      usage: "Đỏ chính Kotoba (Primary CTA, Active)",
      text: "#F5F6F8",
    },
    {
      name: "brand/hover",
      hex: "#AD2C34",
      usage: "Trạng thái Hover nút đỏ chính",
      text: "#F5F6F8",
    },
    {
      name: "brand/selected-bg",
      hex: "#42272C",
      usage: "Nền mục đang chọn (Sidebar, Tab, Chip, Sub)",
      text: "#F5F6F8",
    },
    {
      name: "state/focus",
      hex: "#93C5FD",
      usage: "Viền Focus Ring trợ năng bàn phím (2px)",
      text: "#18191C",
    },
  ];

  const spacingScale = [4, 8, 12, 16, 24, 32, 48];
  const radii = [
    { token: "radius-8", px: "8px", usage: "Button, IconButton, Input, Badge, Chip, SidebarItem" },
    { token: "radius-12", px: "12px", usage: "ContentCard, EpisodeRow, TranscriptRow, Popover" },
    { token: "radius-16", px: "16px", usage: "Hero Banner, Dialog, BottomSheet, Frame Container" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="brand">FIGMA PAGE • 00 FOUNDATIONS</Badge>
            <Badge tone="neutral">Auto Layout • Color Variables • Text Styles</Badge>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F6F8] mt-2">
            00 Foundations — Hệ thống nền tảng Kotoba
          </h1>
          <p className="text-sm text-[#B8BFCC] mt-1">
            Thiết lập biến màu tối tập trung việc học, kiểu chữ song ngữ Inter &amp; Noto Sans JP
            (kèm Furigana), thang khoảng cách và quy tắc Auto Layout.
          </p>
        </div>
        <Brand size="lg" showSubtitle />
      </div>

      {/* Color Variables */}
      <section className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#F5F6F8]">1. Biến màu chuẩn (Color Variables)</h2>
          <p className="text-xs text-[#B8BFCC]">
            Đảm bảo độ tương phản chuẩn WCAG AA/AAA cho văn bản tiếng Việt và chữ Kanji/Furigana
            trên nền tối.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {colorTokens.map((c) => (
            <div
              key={c.name}
              className="rounded-[12px] bg-[#18191C] border border-[#454954] overflow-hidden flex flex-col"
            >
              <div
                className="h-20 p-3 flex items-end justify-between font-mono text-xs font-bold border-b border-[#454954]"
                style={{ backgroundColor: c.hex, color: c.text }}
              >
                <span>{c.name}</span>
                <span>{c.hex}</span>
              </div>
              <div className="p-3 text-xs text-[#B8BFCC]">{c.usage}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography: Inter + Noto Sans JP with Furigana */}
      <section className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#F5F6F8]">
            2. Hệ thống kiểu chữ (Text Styles: Inter &amp; Noto Sans JP)
          </h2>
          <p className="text-xs text-[#B8BFCC]">
            Giao diện tiếng Việt sử dụng Inter; nội dung câu học tiếng Nhật sử dụng Noto Sans JP kèm
            Furigana (Ruby) và nghĩa tiếng Việt.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col gap-3">
            <Badge tone="neutral">UI Font • Inter (Tiếng Việt)</Badge>
            <div className="flex flex-col gap-2">
              <div className="text-2xl font-bold text-[#F5F6F8]">
                Heading XL • 24px/32px Bold — Tiếng Nhật ở quán cà phê
              </div>
              <div className="text-lg font-bold text-[#F5F6F8]">
                Heading MD • 18px/28px Bold — Tập 1: Gọi đồ uống (08:24)
              </div>
              <div className="text-sm text-[#F5F6F8]">
                Body Default • 14px/20px Regular — Phụ đề song ngữ Nhật – Việt đồng bộ theo từng câu
                thoại.
              </div>
              <div className="text-xs text-[#B8BFCC]">
                Caption / Metadata • 12px/16px Medium — JLPT N4 • 8 tập • Đã học 45%
              </div>
            </div>
          </div>

          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col gap-3">
            <Badge tone="level">Learning Font • Noto Sans JP + Furigana</Badge>
            <div className="flex flex-col gap-2">
              <RubyText size="lg" segments={ORDER_DRINK_TRANSCRIPT[0].segments} />
              <p className="text-sm text-[#B8BFCC]">{ORDER_DRINK_TRANSCRIPT[0].vi}</p>
              <div className="pt-2 border-t border-[#454954]/60">
                <RubyText size="md" segments={ORDER_DRINK_TRANSCRIPT[2].segments} />
                <p className="text-xs text-[#B8BFCC] mt-1">{ORDER_DRINK_TRANSCRIPT[2].vi}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing 4/8/12/16/24/32/48 & Border Radius 8/12/16 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#F5F6F8]">
              3. Hệ khoảng cách chuẩn (Spacing Scale: 4/8/12/16/24/32/48)
            </h2>
            <p className="text-xs text-[#B8BFCC]">Áp dụng cho Gap và Padding trong Auto Layout.</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {spacingScale.map((px) => (
              <div
                key={px}
                className="p-2.5 rounded-[8px] bg-[#18191C] border border-[#454954] flex items-center justify-between gap-4"
              >
                <span className="text-xs font-mono text-[#F5F6F8] w-20">space-{px}</span>
                <div className="flex-1 flex items-center">
                  <div
                    className="h-4 bg-[#C9363E] rounded-[4px]"
                    style={{ width: `${px * 3}px` }}
                  />
                </div>
                <span className="text-xs font-mono text-[#B8BFCC]">{px}px</span>
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#F5F6F8]">
              4. Bo góc &amp; Khung Responsive (Radius 8/12/16 &amp; Constraints)
            </h2>
            <p className="text-xs text-[#B8BFCC]">
              Desktop 1440px (Viewport ref 1024, Sidebar 240px, Header 72px) • Mobile 390px
              (Viewport ref 844).
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {radii.map((r) => (
              <div
                key={r.token}
                style={{ borderRadius: r.px }}
                className="p-4 bg-[#18191C] border border-[#C9363E] flex flex-col gap-1.5"
              >
                <span className="text-sm font-mono font-bold text-[#F5F6F8]">{r.px}</span>
                <span className="text-xs font-mono text-[#C9363E]">{r.token}</span>
                <span className="text-xs text-[#B8BFCC]">{r.usage}</span>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] text-xs text-[#B8BFCC] flex flex-col gap-1.5">
            <div className="font-semibold text-[#F5F6F8]">
              Quy ước đặt tên Frame &amp; Constraint:
            </div>
            <div>
              • Mẫu tên Frame:{" "}
              <code className="text-[#93C5FD]">
                MVP/&#123;Screen&#125;/&#123;Desktop|Mobile&#125;/Default
              </code>
            </div>
            <div>
              • Chiều cao Frame: <code className="text-[#93C5FD]">Hug Contents</code> (theo nội dung
              thực tế)
            </div>
            <div>
              • Desktop: Sidebar cố định <code className="text-[#93C5FD]">240px</code>, Header{" "}
              <code className="text-[#93C5FD]">72px</code>, Lưới nội dung Fill Container
            </div>
            <div>
              • Mobile: Width <code className="text-[#93C5FD]">390px</code>, Header gọn 56px, Bottom
              Navigation 3 mục cố định đáy
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

/* ============================================================================
 * PAGE 01: 01 Components (Toàn bộ 25 Component + Accessibility Annotations)
 * ========================================================================== */
export const Page01Components: React.FC<{ state: MVPSharedState }> = ({ state }) => {
  const [sampleInput, setSampleInput] = useState("hocvien@kotoba.vn");
  const [sampleSearch, setSampleSearch] = useState("Gọi đồ uống");
  const [sampleSelect, setSampleSelect] = useState("N4");
  const [sampleTab, setSampleTab] = useState("sub");

  return (
    <div className="flex flex-col gap-8">
      <div className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="brand">FIGMA PAGE • 01 COMPONENTS</Badge>
            <Badge tone="level">25 Core Components • Auto Layout</Badge>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F6F8] mt-2">
            01 Components — Thư viện thành phần Kotoba
          </h1>
          <p className="text-sm text-[#B8BFCC] mt-1">
            Tất cả nút chỉ có icon đều hiển thị nhãn truy cập (Accessibility Annotation{" "}
            <code className="text-[#93C5FD]">aria-label</code>) ngay bên dưới.
          </p>
        </div>
      </div>

      {/* Group A: Navigation & Brand (Brand, SidebarItem, Header, MobileNavigation) */}
      <section className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col gap-6">
        <h2 className="text-lg font-bold text-[#F5F6F8]">
          A. Thương hiệu &amp; Điều hướng (Brand, SidebarItem, Header, MobileNavigation)
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col gap-4">
            <span className="text-xs font-mono text-[#93C5FD]">
              Component: Brand &amp; SidebarItem
            </span>
            <Brand size="md" showSubtitle />
            <div className="w-[240px] flex flex-col gap-1.5 pt-2 border-t border-[#454954]">
              <SidebarItem icon={<Home className="w-4 h-4" />} label="Trang chủ" selected />
              <SidebarItem icon={<Library className="w-4 h-4" />} label="Kho nội dung" />
              <SidebarItem icon={<BookOpen className="w-4 h-4" />} label="Sổ tay" badgeCount={6} />
            </div>
          </div>

          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col gap-4">
            <span className="text-xs font-mono text-[#93C5FD]">
              Component: Header (Desktop 72px &amp; Mobile) + MobileNavigation (3 mục)
            </span>
            <div className="rounded-[12px] overflow-hidden border border-[#454954]">
              <Header
                searchQuery={sampleSearch}
                onSearchChange={setSampleSearch}
                isLoggedIn={state.isLoggedIn}
                onOpenAuth={() => state.onNavigate("Auth")}
                showAnnotation
              />
            </div>
            <div className="max-w-[390px] rounded-[12px] overflow-hidden border border-[#454954]">
              <MobileNavigation activeTab="home" onSelectTab={() => {}} savedCount={4} />
            </div>
          </div>
        </div>
      </section>

      {/* Group B: Buttons & IconButtons with Accessibility Annotations */}
      <section className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold text-[#F5F6F8]">
            B. Nút bấm &amp; Nút Icon kèm Nhãn truy cập (Button, IconButton)
          </h2>
          <p className="text-xs text-[#B8BFCC]">
            Button có 4 kiểu: Primary, Secondary, Ghost, Destructive. Mọi IconButton đều đính kèm
            annotation nhãn truy cập tiếng Việt.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col gap-3">
            <span className="text-xs font-mono text-[#93C5FD]">
              Component: Button (Primary / Secondary / Ghost / Destructive)
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="primary" iconLeft={<Play className="w-4 h-4 fill-current" />}>
                Primary (Xem tập)
              </Button>
              <Button variant="secondary">Secondary (Lưu Sổ tay)</Button>
              <Button variant="ghost">Ghost (Hủy bỏ)</Button>
              <Button variant="destructive">Destructive (Xóa mục)</Button>
            </div>
          </div>

          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col gap-3">
            <span className="text-xs font-mono text-[#93C5FD]">
              Component: IconButton (Kèm Accessibility Label trong Annotation)
            </span>
            <div className="flex items-start gap-4 flex-wrap pt-1">
              <IconButton
                variant="brand"
                icon={<Play className="w-4 h-4 fill-current ml-0.5" />}
                ariaLabel="Phát tập video Gọi đồ uống"
                showAnnotation
              />
              <IconButton
                active
                icon={<Heart className="w-4 h-4 fill-[#C9363E] text-[#C9363E]" />}
                ariaLabel="Lưu kiến thức vào Sổ tay"
                showAnnotation
              />
              <IconButton
                icon={<Volume2 className="w-4 h-4" />}
                ariaLabel="Nghe phát âm tiếng Nhật"
                showAnnotation
              />
              <IconButton
                icon={<Search className="w-4 h-4" />}
                ariaLabel="Mở tìm kiếm trên di động"
                showAnnotation
              />
            </div>
          </div>
        </div>
      </section>

      {/* Group C: Inputs & Controls (TextField, SearchField, Select, FilterChip, Badge, ProgressBar, Tab) */}
      <section className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col gap-6">
        <h2 className="text-lg font-bold text-[#F5F6F8]">
          C. Biểu mẫu &amp; Bộ lọc (TextField, SearchField, Select, FilterChip, Badge, ProgressBar,
          Tab)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954]">
            <TextField
              label="TextField (Có Label & Helper)"
              value={sampleInput}
              onChange={setSampleInput}
              helperText="Nhập email để đồng bộ tiến độ học tập."
            />
          </div>
          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954]">
            <TextField
              label="TextField (Trạng thái Error)"
              value="email-khong-hop-le"
              onChange={() => {}}
              errorText="Định dạng email chưa đúng."
              forceState="error"
            />
          </div>
          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col gap-3">
            <span className="text-xs font-medium text-[#F5F6F8]">SearchField &amp; Select</span>
            <SearchField value={sampleSearch} onChange={setSampleSearch} />
            <Select
              ariaLabel="Chọn cấp độ JLPT"
              value={sampleSelect}
              onChange={setSampleSelect}
              options={[
                { value: "N5", label: "JLPT N5 (Nhập môn)" },
                { value: "N4", label: "JLPT N4 (Quán cà phê)" },
                { value: "N3", label: "JLPT N3 (Tokyo)" },
                { value: "N2", label: "JLPT N2 (Công sở)" },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col gap-2">
            <span className="text-xs font-mono text-[#93C5FD]">
              Component: FilterChip &amp; Badge
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <FilterChip label="Tất cả" selected />
              <FilterChip label="JLPT N4" />
              <FilterChip label="Quán cà phê" />
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-2">
              <Badge tone="brand">TẬP TRỌNG TÂM</Badge>
              <Badge tone="level">JLPT N4</Badge>
              <Badge tone="sub">NHẬT - VIỆT</Badge>
              <Badge tone="neutral">8 tập</Badge>
            </div>
          </div>

          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col justify-center gap-2">
            <span className="text-xs font-mono text-[#93C5FD]">Component: ProgressBar</span>
            <ProgressBar
              percent={45}
              label="Tiến độ tập Gọi đồ uống (01:32 / 08:24)"
              showValue
              size="md"
            />
          </div>

          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col justify-center gap-2">
            <span className="text-xs font-mono text-[#93C5FD]">Component: Tab</span>
            <Tab
              tabs={[
                { id: "sub", label: "Phụ đề Nhật–Việt", count: 42 },
                { id: "saved", label: "Từ đã lưu", count: 6 },
              ]}
              activeId={sampleTab}
              onChange={setSampleTab}
            />
          </div>
        </div>
      </section>

      {/* Group D: Learning & Content Cards (ContentCard, EpisodeRow, TranscriptRow, RubyText, DictionaryPopover, SavedWordCard, SavedSentenceCard) */}
      <section className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col gap-6">
        <h2 className="text-lg font-bold text-[#F5F6F8]">
          D. Thành phần Học tiếng Nhật (ContentCard, EpisodeRow, TranscriptRow, RubyText,
          DictionaryPopover, SavedWordCard, SavedSentenceCard)
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 flex flex-col gap-2">
            <span className="text-xs font-mono text-[#93C5FD]">Component: ContentCard (16:9)</span>
            <ContentCard
              series={SERIES_LIST[0]}
              saved={state.savedSeriesIds.includes(SERIES_LIST[0].id)}
              onToggleSave={state.onToggleSaveSeries}
              onWatch={() => state.onSelectEpisode(EPISODES_LIST[0], true)}
              showAnnotation
            />
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-mono text-[#93C5FD]">Component: EpisodeRow</span>
              <EpisodeRow
                episode={EPISODES_LIST[0]}
                active
                saved
                onWatch={(ep) => state.onSelectEpisode(ep, true)}
                onToggleSave={() => {}}
                showAnnotation
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-mono text-[#93C5FD]">
                Component: TranscriptRow &amp; RubyText (Furigana + Nghĩa tiếng Việt)
              </span>
              <TranscriptRow
                item={ORDER_DRINK_TRANSCRIPT[0]}
                active
                saved={state.savedSentenceIds.includes(ORDER_DRINK_TRANSCRIPT[0].id)}
                activeDictId="chuumon"
                onSeek={(s) => state.onSeekTime(s)}
                onToggleSaveSentence={state.onToggleSaveSentence}
                onSelectWord={() => {}}
                showAnnotation
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono text-[#93C5FD]">Component: DictionaryPopover</span>
            <DictionaryPopover
              entry={DICTIONARY_ENTRIES["chuumon"]}
              saved={state.savedWordIds.includes("chuumon")}
              onToggleSaveWord={state.onToggleSaveWord}
              onClose={() => {}}
              showAnnotation
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono text-[#93C5FD]">Component: SavedWordCard</span>
            <SavedWordCard
              entry={DICTIONARY_ENTRIES["osusume"]}
              onRemove={() => {}}
              onJumpToEpisode={() => state.onSelectEpisode(EPISODES_LIST[0], true)}
              showAnnotation
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono text-[#93C5FD]">Component: SavedSentenceCard</span>
            <SavedSentenceCard
              sentence={ORDER_DRINK_TRANSCRIPT[2]}
              onRemove={() => {}}
              onWatchSentence={() => state.onSelectEpisode(EPISODES_LIST[0], true)}
              showAnnotation
            />
          </div>
        </div>
      </section>

      {/* Group E: Overlays & Feedback (Dialog, BottomSheet, Toast, Skeleton, EmptyState) */}
      <section className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col gap-6">
        <h2 className="text-lg font-bold text-[#F5F6F8]">
          E. Hộp thoại &amp; Trạng thái phản hồi (Dialog, BottomSheet, Toast, Skeleton, EmptyState)
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-[#93C5FD]">Component: Dialog</span>
            <Dialog
              title="Lưu từ vựng vào Sổ tay cá nhân"
              description="Từ vựng 注文 (ちゅうもん - Gọi món) sẽ được gắn kèm mốc thời gian 00:14 của tập Gọi đồ uống."
              onClose={() => {}}
              footer={
                <>
                  <Button size="sm" variant="ghost">
                    Đóng
                  </Button>
                  <Button size="sm" variant="primary">
                    Xác nhận lưu
                  </Button>
                </>
              }
            >
              <div className="text-xs text-[#B8BFCC]">
                Bạn có thể xem lại bất kỳ lúc nào trong mục{" "}
                <strong className="text-[#F5F6F8]">Sổ tay</strong> trên thanh điều hướng.
              </div>
            </Dialog>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-[#93C5FD]">
              Component: BottomSheet (Mobile 390px)
            </span>
            <div className="max-w-[390px]">
              <BottomSheet title="Tra từ nhanh (Mobile BottomSheet)" onClose={() => {}}>
                <div className="text-xs text-[#B8BFCC] flex flex-col gap-2">
                  <div className="font-jp text-base font-bold text-[#F5F6F8]">
                    持ち帰り (もちかえり) — Mang đi
                  </div>
                  <p>Nhấn biểu tượng trái tim để lưu nhanh vào Sổ tay từ vựng.</p>
                </div>
              </BottomSheet>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono text-[#93C5FD]">Component: Toast</span>
            <Toast message="Đã lưu từ 注文 (Gọi món) vào Sổ tay" tone="success" />
            <Toast message="Vui lòng nhập đúng định dạng Email" tone="error" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-[#93C5FD]">Component: Skeleton</span>
            <Skeleton />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-[#93C5FD]">Component: EmptyState</span>
            <EmptyState
              title="Chưa có mục đã lưu"
              description="Bấm biểu tượng trái tim khi xem phụ đề Nhật – Việt để lưu câu hoặc từ vựng."
              actionLabel="Xem tập Gọi đồ uống"
              onAction={() => state.onSelectEpisode(EPISODES_LIST[0], true)}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

/* ============================================================================
 * PAGE 04: 04 States (Interactive Variant Matrix + Screen States)
 * ========================================================================== */
export const Page04States: React.FC<{ state: MVPSharedState }> = ({ state }) => {
  const buttonStates: Array<"default" | "hover" | "focus" | "pressed" | "disabled" | "loading"> = [
    "default",
    "hover",
    "focus",
    "pressed",
    "disabled",
    "loading",
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954]">
        <div className="flex items-center gap-2">
          <Badge tone="brand">FIGMA PAGE • 04 STATES</Badge>
          <Badge tone="neutral">
            Default • Hover • Focus • Pressed • Selected • Disabled • Loading • Error
          </Badge>
        </div>
        <h1 className="text-2xl font-bold text-[#F5F6F8] mt-2">
          04 States — Ma trận trạng thái tương tác &amp; Trạng thái màn hình
        </h1>
        <p className="text-sm text-[#B8BFCC] mt-1">
          Chỉ áp dụng đúng các trạng thái có ý nghĩa thực tế cho từng loại component (không ép trạng
          thái không liên quan).
        </p>
      </div>

      {/* Button Variant Matrix */}
      <section className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col gap-4 overflow-x-auto">
        <h2 className="text-lg font-bold text-[#F5F6F8]">
          1. Ma trận trạng thái Button (Primary / Secondary / Ghost / Destructive)
        </h2>
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="border-b border-[#454954] text-xs font-mono text-[#B8BFCC]">
              <th className="py-3 px-3">Variant \ State</th>
              {buttonStates.map((st) => (
                <th key={st} className="py-3 px-3 uppercase">
                  {st}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#454954]/50 text-sm">
            {(["primary", "secondary", "ghost", "destructive"] as const).map((variant) => (
              <tr key={variant}>
                <td className="py-4 px-3 font-mono text-xs font-semibold text-[#F5F6F8] uppercase">
                  {variant}
                </td>
                {buttonStates.map((st) => (
                  <td key={st} className="py-4 px-3">
                    <Button variant={variant} size="sm" forceState={st}>
                      Xem tập
                    </Button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Navigation, Chip & Input States */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col gap-4">
          <h2 className="text-lg font-bold text-[#F5F6F8]">
            2. Trạng thái SidebarItem &amp; FilterChip (Default / Hover / Focus / Selected /
            Disabled)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-[12px] bg-[#18191C] border border-[#454954]">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono text-[#B8BFCC]">Default</span>
              <SidebarItem
                icon={<Home className="w-4 h-4" />}
                label="Trang chủ"
                forceState="default"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono text-[#B8BFCC]">Hover (#30333A)</span>
              <SidebarItem
                icon={<Library className="w-4 h-4" />}
                label="Kho nội dung"
                forceState="hover"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono text-[#B8BFCC]">Selected (#42272C)</span>
              <SidebarItem
                icon={<BookOpen className="w-4 h-4" />}
                label="Sổ tay"
                forceState="selected"
                badgeCount={4}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono text-[#B8BFCC]">Focus Ring (#93C5FD)</span>
              <SidebarItem
                icon={<Home className="w-4 h-4" />}
                label="Trang chủ"
                forceState="focus"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterChip label="Default" forceState="default" />
            <FilterChip label="Hover" forceState="hover" />
            <FilterChip label="Selected (#42272C)" forceState="selected" />
            <FilterChip label="Focus (#93C5FD)" forceState="focus" />
          </div>
        </section>

        <section className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col gap-4">
          <h2 className="text-lg font-bold text-[#F5F6F8]">
            3. Trạng thái TextField (Default / Focus / Error / Disabled)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[12px] bg-[#18191C] border border-[#454954]">
            <TextField
              label="Default + Helper"
              value=""
              placeholder="hocvien@kotoba.vn"
              onChange={() => {}}
              helperText="Nhập địa chỉ email của bạn"
            />
            <TextField
              label="Focus (#93C5FD)"
              value="hocvien@kotoba.vn"
              onChange={() => {}}
              forceState="focus"
              helperText="Đang nhập liệu"
            />
            <TextField
              label="Error (#C9363E)"
              value="sai-dinh-dang"
              onChange={() => {}}
              forceState="error"
              errorText="Email thiếu ký tự @ hợp lệ"
            />
            <TextField
              label="Disabled"
              value="tai-khoan-khoa@kotoba.vn"
              onChange={() => {}}
              forceState="disabled"
              helperText="Trường này đang tạm khóa"
            />
          </div>
        </section>
      </div>

      {/* Screen-level states: Loading Skeleton, EmptyState, Saved Active State */}
      <section className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col gap-4">
        <h2 className="text-lg font-bold text-[#F5F6F8]">
          4. Trạng thái màn hình (MVP/*/Loading, MVP/*/Empty, MVP/Watch/DictionaryActive)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col gap-3">
            <span className="text-xs font-mono text-[#93C5FD]">
              Frame: MVP/Library/Desktop/Loading
            </span>
            <Skeleton />
          </div>
          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col gap-3">
            <span className="text-xs font-mono text-[#93C5FD]">
              Frame: MVP/Notebook/Desktop/Empty
            </span>
            <EmptyState
              title="Sổ tay chưa có từ vựng"
              description="Khi xem video có phụ đề Nhật – Việt, nhấn vào từ vựng bất kỳ và bấm nút Tim để lưu."
              actionLabel="Học tập Gọi đồ uống"
              onAction={() => state.onSelectEpisode(EPISODES_LIST[0], true)}
            />
          </div>
          <div className="p-4 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col gap-3">
            <span className="text-xs font-mono text-[#93C5FD]">
              Frame: MVP/Watch/Desktop/WordSelected
            </span>
            <DictionaryPopover
              entry={DICTIONARY_ENTRIES["tennai"]}
              saved={state.savedWordIds.includes("tennai")}
              onToggleSaveWord={state.onToggleSaveWord}
              onClose={() => {}}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

/* ============================================================================
 * PAGE 05: 05 Prototype (Interactive Flow Map + Live Runner)
 * ========================================================================== */
export const Page05Prototype: React.FC<{
  state: MVPSharedState;
  onJumpToMVP: (screen: ScreenId, device: "Desktop" | "Mobile") => void;
}> = ({ state, onJumpToMVP }) => {
  const flows = [
    {
      id: "flow-watch",
      trigger: 'Nút "Xem ngay" / Thẻ ContentCard',
      from: "MVP/Home/Desktop/Default hoặc MVP/Library/Desktop/Default",
      to: "MVP/Watch/Desktop/Default (Tập: Gọi đồ uống • 08:24)",
      description:
        "Mở trình phát video 16:9 kèm danh sách phụ đề Nhật – Việt có Furigana. Chạm vào từ gạch chân mở DictionaryPopover.",
      actionLabel: "Chạy luồng Xem tập Gọi đồ uống",
      onRun: () => {
        state.onSelectEpisode(EPISODES_LIST[0], false);
        onJumpToMVP("Watch", "Desktop");
      },
    },
    {
      id: "flow-resume",
      trigger: 'Nút "Xem tiếp (01:32)"',
      from: "MVP/Home/Desktop/Default (Banner & Sidebar Đang học dở)",
      to: "MVP/Watch/Desktop/Default (Giữ tiến độ tại mốc 01:32 - 45%)",
      description:
        'Khôi phục chính xác vị trí giây 92 (01:32) và kích hoạt câu phụ đề "季節限定のカフェラテがございます。店内でお召し上がりですか。".',
      actionLabel: "Chạy luồng Xem tiếp giữ tiến độ",
      onRun: () => {
        state.onSelectEpisode(EPISODES_LIST[0], true);
        onJumpToMVP("Watch", "Desktop");
      },
    },
    {
      id: "flow-save-heart",
      trigger: "Nút Tim (IconButton Heart)",
      from: "TranscriptRow / DictionaryPopover / ContentCard",
      to: "MVP/Notebook/Desktop/Default + Hiển thị Toast xác nhận",
      description:
        "Lưu tức thì từ vựng (ví dụ: 注文, おすすめ), câu phụ đề Nhật – Việt hoặc series vào Sổ tay cá nhân và cập nhật số đếm trên Sidebar.",
      actionLabel: "Mở Sổ tay kiểm tra mục đã lưu",
      onRun: () => {
        onJumpToMVP("Notebook", "Desktop");
      },
    },
    {
      id: "flow-mobile",
      trigger: "BottomNavigation (3 mục) & Mobile Search IconButton",
      from: "MVP/Home/Mobile/Default (390x844)",
      to: "MVP/Library/Mobile/Default • MVP/Watch/Mobile/Default • MVP/Notebook/Mobile/Default",
      description:
        "Chuyển đổi mượt giữa 3 mục Trang chủ, Kho nội dung, Sổ tay trên di động; mở panel tìm kiếm và BottomSheet tra từ.",
      actionLabel: "Trải nghiệm Prototype Mobile 390px",
      onRun: () => {
        onJumpToMVP("Watch", "Mobile");
      },
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954]">
        <div className="flex items-center gap-2">
          <Badge tone="brand">FIGMA PAGE • 05 PROTOTYPE</Badge>
          <Badge tone="level">Interactive User Flows • Desktop 1440 &amp; Mobile 390</Badge>
        </div>
        <h1 className="text-2xl font-bold text-[#F5F6F8] mt-2">
          05 Prototype — Luồng tương tác cốt lõi Kotoba MVP
        </h1>
        <p className="text-sm text-[#B8BFCC] mt-1">
          Kiểm thử trực tiếp 3 luồng bắt buộc: Nút Xem dẫn tới trang tập • Nút Tim lưu kiến thức vào
          Sổ tay • Nút Xem tiếp giữ tiến độ học.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {flows.map((flow) => (
          <div
            key={flow.id}
            className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954] flex flex-col justify-between gap-4"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="brand">{flow.trigger}</Badge>
                <span className="text-xs font-mono text-[#93C5FD]">
                  On Click → Navigate / Mutate
                </span>
              </div>
              <div className="p-3 rounded-[12px] bg-[#18191C] border border-[#454954] flex flex-col gap-1.5 text-xs font-mono">
                <div className="text-[#B8BFCC]">
                  FROM: <span className="text-[#F5F6F8]">{flow.from}</span>
                </div>
                <div className="text-[#C9363E] flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" /> TO:{" "}
                  <span className="text-[#F5F6F8]">{flow.to}</span>
                </div>
              </div>
              <p className="text-sm text-[#B8BFCC] leading-relaxed">{flow.description}</p>
            </div>

            <Button
              variant="primary"
              iconRight={<ArrowRight className="w-4 h-4" />}
              onClick={flow.onRun}
            >
              {flow.actionLabel}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * PAGE 06: 06 Future (Lưu trữ định hướng sau MVP — tách biệt khỏi Menu MVP)
 * ========================================================================== */
export const Page06Future: React.FC = () => {
  const backlogItems = [
    {
      phase: "Post-MVP Phase 2",
      title: "Phân tích ngữ pháp chuyên sâu theo cấp độ JLPT",
      desc: "Tự động bóc tách cấu trúc ngữ pháp N5–N1 ngay dưới từng dòng phụ đề video.",
    },
    {
      phase: "Post-MVP Phase 2",
      title: "Tự nhập đường dẫn YouTube có phụ đề tiếng Nhật",
      desc: "Cho phép học viên dán link video YouTube bất kỳ để hệ thống sinh Furigana và bản dịch tiếng Việt.",
    },
    {
      phase: "Post-MVP Phase 3",
      title: "Xuất dữ liệu Sổ tay ra thẻ Anki / CSV",
      desc: "Đồng bộ danh sách từ vựng và câu đã lưu trong Sổ tay Kotoba sang bộ thẻ ôn tập cá nhân.",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="p-6 rounded-[16px] bg-[#24262B] border border-[#454954]">
        <div className="flex items-center gap-2">
          <Badge tone="brand">FIGMA PAGE • 06 FUTURE</Badge>
          <Badge tone="neutral">Out of MVP Menu Scope • Parking Lot</Badge>
        </div>
        <h1 className="text-2xl font-bold text-[#F5F6F8] mt-2">
          06 Future — Các ý tưởng dành cho giai đoạn sau MVP
        </h1>
        <p className="text-sm text-[#B8BFCC] mt-1">
          Trang này lưu trữ định hướng tương lai trên tài liệu thiết kế. Theo đúng quy chuẩn MVP,
          các mục Nâng cấp, Giáo trình, Bảng học hoặc Luyện tập hoàn toàn không xuất hiện trong
          thanh điều hướng MVP.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {backlogItems.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-[16px] bg-[#24262B] border border-dashed border-[#454954] flex flex-col gap-3"
          >
            <Badge tone="neutral">{item.phase}</Badge>
            <h3 className="text-base font-bold text-[#F5F6F8]">{item.title}</h3>
            <p className="text-xs text-[#B8BFCC] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
