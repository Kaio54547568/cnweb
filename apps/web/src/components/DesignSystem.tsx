import React from "react";
import {
  Play,
  Heart,
  Search,
  Volume2,
  X,
  BookOpen,
  Home,
  Library,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Sparkles,
  User,
  Sun,
  Moon,
} from "lucide-react";
import {
  RubySegment,
  JLPTLevel,
  SeriesItem,
  Episode,
  TranscriptItem,
  WordEntry,
} from "../data/mockData";

/* ============================================================================
 * 1. RubyText - Hiển thị tiếng Nhật có Furigana và tra từ khi bấm
 * ========================================================================== */
export const RubyText: React.FC<{
  segments: RubySegment[];
  onSelectWord?: (dictId: string) => void;
  activeDictId?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  showFurigana?: boolean;
}> = ({ segments, onSelectWord, activeDictId, size = "md", showFurigana = true }) => {
  const sizeClasses = {
    sm: "text-sm leading-7",
    md: "text-base leading-8",
    lg: "text-lg md:text-xl leading-9",
    xl: "text-xl md:text-2xl leading-[2.75rem]",
  }[size];

  return (
    <span className={`font-jp text-fg inline-flex flex-wrap items-baseline gap-y-1 ${sizeClasses}`}>
      {segments.map((seg, idx) => {
        const isInteractive = Boolean(seg.dictId && onSelectWord);
        const isSelected = seg.dictId && activeDictId === seg.dictId;

        const content =
          seg.furigana && showFurigana ? (
            <ruby className="mx-[1px]">
              {seg.kanji}
              <rt className="text-xs text-muted font-normal select-none">{seg.furigana}</rt>
            </ruby>
          ) : (
            <span>{seg.kanji}</span>
          );

        if (isInteractive && seg.dictId) {
          return (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectWord?.(seg.dictId!);
              }}
              title="Nhấn để tra nghĩa"
              aria-pressed={Boolean(isSelected)}
              className={`inline-flex items-baseline rounded-[8px] px-1 transition-colors cursor-pointer ${
                isSelected
                  ? "bg-brand-tint text-fg underline decoration-brand decoration-2 underline-offset-4"
                  : "hover:bg-elevated underline decoration-muted/60 decoration-dotted underline-offset-4"
              }`}
            >
              {content}
            </button>
          );
        }

        return <React.Fragment key={idx}>{content}</React.Fragment>;
      })}
    </span>
  );
};

/* ============================================================================
 * 2. Brand - Thương hiệu Kotoba độc lập, không dùng logo Akaiwa
 * ========================================================================== */
export const Brand: React.FC<{
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  onClick?: () => void;
}> = ({ size = "md", showSubtitle = false, onClick }) => {
  const boxSize =
    size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-10 h-10 text-base" : "w-8 h-8 text-sm";
  const titleSize = size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Trang chủ Kotoba — Học tiếng Nhật qua video"
      className="inline-flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-[8px]"
    >
      <div
        className={`${boxSize} rounded-[8px] bg-brand group-hover:bg-brand-hover transition-colors flex items-center justify-center font-jp font-bold text-white border border-fg/15 shadow-sm shrink-0`}
      >
        言
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`${titleSize} font-bold tracking-tight text-fg`}>Kotoba</span>
        </div>
        {showSubtitle && (
          <span className="text-xs text-muted">Học tiếng Nhật qua ngữ cảnh video</span>
        )}
      </div>
    </button>
  );
};

/* ============================================================================
 * 3. Button - Primary / Secondary / Ghost / Destructive + States
 * ========================================================================== */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type InteractiveVisualState =
  | "default"
  | "hover"
  | "focus"
  | "pressed"
  | "selected"
  | "disabled"
  | "loading";

export const Button: React.FC<{
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  forceState?: InteractiveVisualState;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
  className?: string;
  fullWidth?: boolean;
  ariaLabel?: string;
}> = ({
  variant = "primary",
  size = "md",
  forceState = "default",
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  children,
  onClick,
  type = "button",
  className = "",
  fullWidth = false,
  ariaLabel,
}) => {
  const isDisabled = disabled || forceState === "disabled";
  const isLoading = loading || forceState === "loading";

  const sizeStyles = {
    sm: "h-8 px-3 text-xs gap-1.5 rounded-[8px]",
    md: "h-10 px-4 text-sm gap-2 rounded-[8px]",
    lg: "h-12 px-6 text-base gap-2.5 rounded-[12px]",
  }[size];

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      forceState === "hover"
        ? "bg-brand-hover text-white border border-transparent"
        : forceState === "pressed"
          ? "bg-brand-active text-white scale-[0.99]"
          : "bg-brand hover:bg-brand-hover active:bg-brand-active text-white border border-transparent",
    secondary:
      forceState === "hover"
        ? "bg-elevated text-fg border border-muted/50"
        : forceState === "selected"
          ? "bg-brand-tint text-fg border border-brand"
          : "bg-surface hover:bg-elevated text-fg border border-line",
    ghost:
      forceState === "hover"
        ? "bg-elevated text-fg"
        : forceState === "selected"
          ? "bg-brand-tint text-fg"
          : "bg-transparent hover:bg-elevated text-muted hover:text-fg",
    destructive:
      forceState === "hover"
        ? "bg-brand-hover text-white border border-fg/20"
        : "bg-brand-tint hover:bg-brand text-fg hover:text-white border border-brand",
  };

  const focusRing =
    forceState === "focus"
      ? "ring-2 ring-focus ring-offset-2 ring-offset-canvas"
      : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

  return (
    <button
      type={type}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center font-medium transition-all select-none cursor-pointer ${sizeStyles} ${variantStyles[variant]} ${focusRing} ${
        isDisabled ? "opacity-45 pointer-events-none cursor-not-allowed" : ""
      } ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : iconLeft}
      <span>{children}</span>
      {!isLoading && iconRight}
    </button>
  );
};

/* ============================================================================
 * 4. IconButton - Nút chỉ chứa icon, bắt buộc có ariaLabel và annotation
 * ========================================================================== */
export const IconButton: React.FC<{
  icon: React.ReactNode;
  ariaLabel: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  variant?: "surface" | "elevated" | "ghost" | "brand";
  forceState?: InteractiveVisualState;
  showAnnotation?: boolean;
  size?: "sm" | "md";
}> = ({
  icon,
  ariaLabel,
  onClick,
  active = false,
  variant = "surface",
  forceState = "default",
  showAnnotation = false,
  size = "md",
}) => {
  const isDisabled = forceState === "disabled";
  const isSelected = active || forceState === "selected";
  const dimensions = size === "sm" ? "w-8 h-8" : "w-10 h-10";

  const baseColor = isSelected
    ? "bg-brand-tint text-fg border-brand"
    : variant === "brand"
      ? "bg-brand hover:bg-brand-hover text-white border-transparent"
      : variant === "elevated"
        ? "bg-elevated hover:bg-line text-fg border-line"
        : variant === "ghost"
          ? "bg-transparent hover:bg-elevated text-muted hover:text-fg border-transparent"
          : "bg-surface hover:bg-elevated text-muted hover:text-fg border-line";

  const forcedRing =
    forceState === "focus"
      ? "ring-2 ring-focus"
      : forceState === "hover"
        ? "bg-elevated text-fg"
        : "";

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        type="button"
        disabled={isDisabled}
        onClick={onClick}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={`${dimensions} rounded-[8px] border inline-flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${baseColor} ${forcedRing} ${
          isDisabled ? "opacity-40 pointer-events-none" : ""
        }`}
      >
        {icon}
      </button>
      {showAnnotation && (
        <span className="mt-1 px-1.5 py-0.5 rounded bg-canvas border border-focus/60 text-[10px] font-mono text-focus whitespace-nowrap">
          aria: &quot;{ariaLabel}&quot;
        </span>
      )}
    </div>
  );
};

/* ============================================================================
 * 5. SidebarItem - Mục điều hướng trên Sidebar 240px
 * ========================================================================== */
export const SidebarItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  selected?: boolean;
  badgeCount?: number;
  forceState?: InteractiveVisualState;
  onClick?: () => void;
}> = ({ icon, label, selected = false, badgeCount, forceState = "default", onClick }) => {
  const isSelected = selected || forceState === "selected";
  const isHover = forceState === "hover";
  const isFocus = forceState === "focus";
  const isDisabled = forceState === "disabled";

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={`w-full h-11 px-3 rounded-[8px] flex items-center justify-between text-sm font-medium transition-colors cursor-pointer ${
        isSelected
          ? "bg-brand-tint text-fg border border-brand/60"
          : isHover
            ? "bg-elevated text-fg border border-transparent"
            : "bg-transparent hover:bg-elevated text-muted hover:text-fg border border-transparent"
      } ${
        isFocus
          ? "ring-2 ring-focus"
          : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      } ${isDisabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      <span className="flex items-center gap-3">
        <span className={isSelected ? "text-brand" : "text-muted"}>{icon}</span>
        <span>{label}</span>
      </span>
      {typeof badgeCount === "number" && badgeCount > 0 && (
        <span
          className={`px-2 py-0.5 text-xs rounded-[8px] font-semibold ${
            isSelected
              ? "bg-brand text-white"
              : "bg-elevated text-muted border border-line"
          }`}
        >
          {badgeCount}
        </span>
      )}
    </button>
  );
};

/* ============================================================================
 * 6. TextField - Input có Label / Helper / Error + States
 * ========================================================================== */
export const TextField: React.FC<{
  label: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  type?: "text" | "email" | "password";
  helperText?: string;
  errorText?: string;
  forceState?: "default" | "hover" | "focus" | "disabled" | "error";
  id?: string;
}> = ({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  helperText,
  errorText,
  forceState = "default",
  id,
}) => {
  const hasError = Boolean(errorText) || forceState === "error";
  const isDisabled = forceState === "disabled";
  const isFocus = forceState === "focus";

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="text-xs font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        type={type}
        disabled={isDisabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-10 px-3 rounded-[8px] bg-canvas text-sm text-fg placeholder:text-muted/60 border transition-colors ${
          hasError
            ? "border-brand ring-1 ring-brand"
            : isFocus
              ? "border-focus ring-2 ring-focus"
              : forceState === "hover"
                ? "border-muted"
                : "border-line hover:border-muted/70 focus:outline-none focus:border-focus focus:ring-2 focus:ring-focus"
        } ${isDisabled ? "opacity-45 cursor-not-allowed" : ""}`}
      />
      {hasError && errorText ? (
        <div className="flex items-center gap-1.5 text-xs text-brand">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorText}</span>
        </div>
      ) : helperText ? (
        <span className="text-xs text-muted">{helperText}</span>
      ) : null}
    </div>
  );
};

/* ============================================================================
 * 7. SearchField - Thanh tìm kiếm (lấy cảm hứng từ bố cục Akaiwa)
 * ========================================================================== */
export const SearchField: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onClear?: () => void;
  forceState?: "default" | "focus" | "disabled";
  className?: string;
  autoFocus?: boolean;
}> = ({
  value,
  onChange,
  placeholder = "Tìm series hoặc chủ đề…",
  onClear,
  forceState = "default",
  className = "",
  autoFocus = false,
}) => {
  const isFocus = forceState === "focus";
  const isDisabled = forceState === "disabled";

  return (
    <div
      className={`relative flex items-center h-10 w-full rounded-[8px] bg-surface border transition-colors ${
        isFocus
          ? "border-focus ring-2 ring-focus"
          : "border-line hover:border-muted/60 focus-within:border-focus focus-within:ring-2 focus-within:ring-focus"
      } ${isDisabled ? "opacity-45 pointer-events-none" : ""} ${className}`}
    >
      <Search className="w-4 h-4 text-muted ml-3 shrink-0" aria-hidden="true" />
      <input
        type="text"
        value={value}
        disabled={isDisabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Tìm series hoặc chủ đề"
        className="w-full h-full bg-transparent px-3 text-sm text-fg placeholder:text-muted focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
          aria-label="Xóa từ khóa tìm kiếm"
          className="mr-2 p-1 rounded-[8px] text-muted hover:text-fg hover:bg-elevated"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

/* ============================================================================
 * 8. Select - Dropdown chọn trình độ JLPT hoặc sắp xếp
 * ========================================================================== */
export const Select: React.FC<{
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  ariaLabel: string;
}> = ({ label, value, options, onChange, ariaLabel }) => {
  return (
    <div className="inline-flex flex-col gap-1">
      {label && <span className="text-xs font-medium text-muted">{label}</span>}
      <div className="relative inline-flex items-center">
        <select
          aria-label={ariaLabel}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 pl-3 pr-9 rounded-[8px] bg-surface border border-line hover:border-muted/60 text-sm text-fg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-focus"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface text-fg">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-muted absolute right-3 pointer-events-none" />
      </div>
    </div>
  );
};

/* ============================================================================
 * 9. FilterChip - Thẻ lọc trình độ N5-N2 hoặc chủ đề
 * ========================================================================== */
export const FilterChip: React.FC<{
  label: string;
  selected?: boolean;
  onClick?: () => void;
  forceState?: InteractiveVisualState;
}> = ({ label, selected = false, onClick, forceState = "default" }) => {
  const isSelected = selected || forceState === "selected";
  const isFocus = forceState === "focus";
  const isHover = forceState === "hover";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-[8px] text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 border ${
        isSelected
          ? "bg-brand-tint text-fg border-brand"
          : isHover
            ? "bg-elevated text-fg border-line"
            : "bg-surface hover:bg-elevated text-muted hover:text-fg border-line"
      } ${
        isFocus
          ? "ring-2 ring-focus"
          : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      }`}
    >
      <span>{label}</span>
    </button>
  );
};

/* ============================================================================
 * 10. Badge - Nhãn cấp độ JLPT (N5, N4, N3, N2), phụ đề NHẬT-VIỆT, số tập
 * ========================================================================== */
export const Badge: React.FC<{
  children: React.ReactNode;
  tone?: "brand" | "level" | "neutral" | "sub";
}> = ({ children, tone = "neutral" }) => {
  const styles = {
    brand: "bg-brand text-white border-transparent",
    level: "bg-transparent text-muted border-line",
    sub: "bg-canvas/80 text-fg border-line",
    neutral: "bg-elevated text-muted border-line",
  }[tone];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[8px] text-xs font-medium border ${styles}`}
    >
      {children}
    </span>
  );
};

/* ============================================================================
 * 11. ProgressBar - Thanh tiến độ học tập
 * ========================================================================== */
export const ProgressBar: React.FC<{
  percent: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md";
}> = ({ percent, label, showValue = false, size = "sm" }) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const heightClass = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className="w-full flex flex-col gap-1">
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs text-muted">
          {label && <span>{label}</span>}
          {showValue && <span className="font-medium text-fg">{clamped}%</span>}
        </div>
      )}
      <div
        className={`w-full ${heightClass} rounded-[8px] bg-canvas border border-line/50 overflow-hidden`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-brand rounded-[8px] transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

/* ============================================================================
 * 12. Tab - Chuyển đổi tab (Từ vựng / Mẫu câu / Các tập)
 * ========================================================================== */
export const Tab: React.FC<{
  tabs: { id: string; label: string; count?: number }[];
  activeId: string;
  onChange: (id: string) => void;
}> = ({ tabs, activeId, onChange }) => {
  return (
    <div
      role="tablist"
      className="inline-flex items-center p-1 rounded-[12px] bg-surface border border-line gap-1 max-w-full overflow-x-auto"
    >
      {tabs.map((t) => {
        const isSelected = t.id === activeId;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isSelected}
            type="button"
            onClick={() => onChange(t.id)}
            className={`h-9 px-3.5 rounded-[8px] text-sm font-medium transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              isSelected
                ? "bg-brand-tint text-fg border border-brand/60"
                : "text-muted hover:text-fg hover:bg-elevated"
            }`}
          >
            <span>{t.label}</span>
            {typeof t.count === "number" && (
              <span
                className={`px-1.5 py-0.2 rounded-[8px] text-[11px] ${
                  isSelected ? "bg-brand text-white" : "bg-elevated text-muted"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/* ============================================================================
 * 13. Header - Desktop 72px (Tìm kiếm + Đăng nhập hoặc Avatar), Mobile gọn
 * ========================================================================== */
export const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const ThemeToggle: React.FC<{
  theme: "dark" | "light";
  onToggle: () => void;
  size?: "sm" | "md";
}> = ({ theme, onToggle, size = "md" }) => (
  <IconButton
    size={size}
    ariaLabel={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
    icon={theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    onClick={onToggle}
  />
);

export const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="inline-flex items-center gap-2 h-8 rounded-[8px] text-sm text-fg cursor-pointer select-none"
  >
    <span
      className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-brand" : "bg-line"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </span>
    <span>{label}</span>
  </button>
);

export const Header: React.FC<{
  isMobile?: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMobileSearch?: () => void;
  isLoggedIn: boolean;
  userName?: string;
  onOpenAuth: () => void;
  onNavigateHome?: () => void;
  showAnnotation?: boolean;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}> = ({
  isMobile = false,
  searchQuery,
  onSearchChange,
  onOpenMobileSearch,
  isLoggedIn,
  userName = "Minh Anh",
  onOpenAuth,
  onNavigateHome,
  showAnnotation = false,
  theme,
  onToggleTheme,
}) => {
  const initials = getInitials(userName);

  if (isMobile) {
    return (
      <header className="h-14 px-4 bg-canvas/95 backdrop-blur border-b border-line flex items-center justify-between gap-2 shrink-0 sticky top-0 z-30">
        <Brand size="sm" onClick={onNavigateHome} />
        <div className="flex items-center gap-2">
          <IconButton
            size="sm"
            icon={<Search className="w-4 h-4" />}
            ariaLabel="Tìm kiếm"
            onClick={onOpenMobileSearch}
            showAnnotation={showAnnotation}
          />
          {theme && onToggleTheme && <ThemeToggle size="sm" theme={theme} onToggle={onToggleTheme} />}
          {isLoggedIn ? (
            <button
              type="button"
              onClick={onOpenAuth}
              aria-label={`Tài khoản ${userName}`}
              className="h-8 w-8 rounded-full bg-brand-tint border border-brand text-xs font-bold flex items-center justify-center text-fg cursor-pointer"
            >
              {initials}
            </button>
          ) : (
            <Button size="sm" variant="primary" onClick={onOpenAuth}>
              Đăng nhập
            </Button>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="h-[72px] px-6 bg-canvas/95 backdrop-blur border-b border-line flex items-center justify-between gap-6 shrink-0 sticky top-0 z-30">
      <div className="w-full max-w-[460px]">
        <SearchField value={searchQuery} onChange={onSearchChange} />
      </div>
      <div className="flex items-center gap-3">
        {theme && onToggleTheme && <ThemeToggle theme={theme} onToggle={onToggleTheme} />}
        {isLoggedIn ? (
          <button
            type="button"
            onClick={onOpenAuth}
            aria-label={`Tài khoản ${userName}`}
            className="h-10 pl-1.5 pr-3 rounded-full bg-surface hover:bg-elevated border border-line flex items-center gap-2.5 text-sm font-medium text-fg transition-colors cursor-pointer"
          >
            <span className="w-7 h-7 rounded-full bg-brand-tint border border-brand text-xs font-bold flex items-center justify-center text-fg">
              {initials}
            </span>
            <span>{userName}</span>
          </button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={onOpenAuth}
            iconLeft={<User className="w-4 h-4" />}
          >
            Đăng nhập
          </Button>
        )}
      </div>
    </header>
  );
};

/* ============================================================================
 * 14. MobileNavigation - Bottom Navigation 3 mục: Trang chủ, Kho nội dung, Sổ tay
 * ========================================================================== */
export const MobileNavigation: React.FC<{
  activeTab: "home" | "library" | "notebook";
  onSelectTab: (tab: "home" | "library" | "notebook") => void;
  savedCount?: number;
}> = ({ activeTab, onSelectTab, savedCount = 0 }) => {
  const items: { id: "home" | "library" | "notebook"; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Trang chủ", icon: <Home className="w-4 h-4" /> },
    { id: "library", label: "Kho nội dung", icon: <Library className="w-4 h-4" /> },
    { id: "notebook", label: "Sổ tay", icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <nav
      aria-label="Điều hướng chính trên di động"
      className="h-16 px-3 bg-canvas/95 backdrop-blur border-t border-line grid grid-cols-3 gap-2 items-center shrink-0 sticky bottom-0 z-30"
    >
      {items.map((item) => {
        const isSelected = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`h-12 rounded-[8px] flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors cursor-pointer relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              isSelected
                ? "bg-brand-tint text-fg border border-brand/60"
                : "text-muted hover:text-fg hover:bg-surface"
            }`}
          >
            <span className={isSelected ? "text-brand" : "text-muted"}>{item.icon}</span>
            <span>{item.label}</span>
            {item.id === "notebook" && savedCount > 0 && (
              <span className="absolute top-1 right-4 px-1.5 py-0.2 rounded-full bg-brand text-[10px] font-bold text-white">
                {savedCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

/* ============================================================================
 * 15. ContentCard - Thẻ Series tỷ lệ 16:9 chuẩn (cảm hứng lưới Akaiwa)
 * ========================================================================== */
export const ContentCard: React.FC<{
  series: SeriesItem;
  saved: boolean;
  onToggleSave: (seriesId: string) => void;
  onWatch: (series: SeriesItem) => void;
  showAnnotation?: boolean;
}> = ({ series, saved, onToggleSave, onWatch, showAnnotation = false }) => {
  const started = series.progressPercent > 0;
  return (
    <article className="group rounded-[12px] bg-surface border border-line hover:border-muted/60 overflow-hidden flex flex-col transition-colors">
      <button
        type="button"
        onClick={() => onWatch(series)}
        aria-label={`${started ? "Xem tiếp" : "Bắt đầu"} series ${series.title}`}
        className="relative block aspect-video w-full bg-canvas overflow-hidden text-left cursor-pointer"
      >
        <img
          src={series.thumbnail}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[8px] bg-black/65 text-white text-xs font-semibold">
          {series.level}
        </span>
        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-[8px] bg-black/65 text-white text-xs">
          {series.episodeCount} tập
        </span>
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <span className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </span>
        </span>
        {started && (
          <span className="absolute bottom-0 inset-x-0 h-1 bg-black/50">
            <span className="block h-full bg-brand" style={{ width: `${series.progressPercent}%` }} />
          </span>
        )}
      </button>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">
            {series.category} · {series.channelName}
          </span>
          <h3 className="text-base font-semibold text-fg line-clamp-1">{series.title}</h3>
          <RubyText segments={series.jpTitle} size="sm" />
          <p className="text-sm text-muted line-clamp-2">{series.description}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-xs text-muted">
            {started ? `Đã học ${series.progressPercent}%` : "Chưa bắt đầu"}
          </span>
          <IconButton
            size="sm"
            active={saved}
            ariaLabel={
              saved ? `Bỏ lưu series ${series.title}` : `Lưu series ${series.title} vào Sổ tay`
            }
            icon={<Heart className={`w-4 h-4 ${saved ? "fill-brand text-brand" : ""}`} />}
            onClick={() => onToggleSave(series.id)}
            showAnnotation={showAnnotation}
          />
        </div>
      </div>
    </article>
  );
};

/* ============================================================================
 * 16. EpisodeRow - Hàng tập phim có thời lượng, tiến độ và nút xem tiếp
 * ========================================================================== */
export const EpisodeRow: React.FC<{
  episode: Episode;
  active?: boolean;
  saved?: boolean;
  onWatch: (ep: Episode) => void;
  onToggleSave?: (epId: string) => void;
  showAnnotation?: boolean;
}> = ({
  episode,
  active = false,
  saved = false,
  onWatch,
  onToggleSave,
  showAnnotation = false,
}) => {
  const inProgress = episode.progressPercent > 0 && episode.progressPercent < 100;
  const done = episode.progressPercent >= 100;
  return (
    <div
      className={`p-3 rounded-[12px] border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        active ? "bg-brand-tint border-brand" : "bg-surface hover:bg-elevated border-line"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => onWatch(episode)}
          aria-label={`Xem tập ${episode.number}: ${episode.title}`}
          className="relative w-28 aspect-video rounded-[8px] overflow-hidden bg-canvas shrink-0 cursor-pointer border border-line"
        >
          <img src={episode.thumbnail} alt="" className="w-full h-full object-cover" />
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-xs font-mono text-white">
            {episode.duration}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">
            Tập {episode.number} · {episode.level}
            {inProgress && ` · Đã xem ${episode.progressPercent}%`}
            {done && " · Đã xem xong"}
          </p>
          <h4 className="text-sm font-semibold text-fg mt-0.5 truncate">{episode.title}</h4>
          <div className="truncate">
            <RubyText segments={episode.jpTitle} size="sm" />
          </div>
          {inProgress && (
            <div className="mt-1.5 max-w-[200px]">
              <ProgressBar percent={episode.progressPercent} />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <Button
          size="sm"
          variant={active || inProgress ? "primary" : "secondary"}
          iconLeft={<Play className="w-3.5 h-3.5 fill-current" />}
          onClick={() => onWatch(episode)}
        >
          {inProgress ? "Xem tiếp" : done ? "Xem lại" : "Xem tập"}
        </Button>
        {onToggleSave && (
          <IconButton
            size="sm"
            active={saved}
            ariaLabel={saved ? `Đã lưu tập ${episode.title}` : `Lưu tập ${episode.title}`}
            icon={<Heart className={`w-4 h-4 ${saved ? "fill-brand text-brand" : ""}`} />}
            onClick={() => onToggleSave(episode.id)}
            showAnnotation={showAnnotation}
          />
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 17. TranscriptRow - Dòng phụ đề song ngữ Nhật (Furigana) – Việt + nút Tim lưu
 * ========================================================================== */
export const TranscriptRow: React.FC<{
  item: TranscriptItem;
  active?: boolean;
  saved?: boolean;
  activeDictId?: string | null;
  onSeek: (seconds: number) => void;
  onToggleSaveSentence: (item: TranscriptItem) => void;
  onSelectWord: (dictId: string) => void;
  showAnnotation?: boolean;
  showFurigana?: boolean;
  showTranslation?: boolean;
}> = ({
  item,
  active = false,
  saved = false,
  activeDictId,
  onSeek,
  onToggleSaveSentence,
  onSelectWord,
  showAnnotation = false,
  showFurigana = true,
  showTranslation = true,
}) => {
  return (
    <div
      id={`sub-${item.id}`}
      role="button"
      tabIndex={0}
      aria-current={active ? "true" : undefined}
      aria-label={`Tua tới ${item.startTime}`}
      onClick={() => onSeek(item.seconds)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSeek(item.seconds);
        }
      }}
      className={`p-3.5 rounded-[12px] border transition-colors cursor-pointer ${
        active ? "bg-brand-tint border-brand" : "bg-surface hover:bg-elevated border-line"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span
            className={`px-2 py-0.5 rounded-[8px] font-mono font-medium ${
              active ? "bg-brand text-white" : "bg-canvas text-muted"
            }`}
          >
            {item.startTime}
          </span>
          <span>{item.speaker}</span>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <IconButton
            size="sm"
            variant="ghost"
            active={saved}
            ariaLabel={saved ? "Bỏ lưu câu khỏi Sổ tay" : "Lưu câu này vào Sổ tay"}
            icon={<Heart className={`w-4 h-4 ${saved ? "fill-brand text-brand" : ""}`} />}
            onClick={() => onToggleSaveSentence(item)}
            showAnnotation={showAnnotation}
          />
        </div>
      </div>

      <div className="mt-2">
        <RubyText
          segments={item.segments}
          onSelectWord={onSelectWord}
          activeDictId={activeDictId}
          size="md"
          showFurigana={showFurigana}
        />
      </div>

      {showTranslation && <p className="mt-1 text-sm text-muted leading-relaxed">{item.vi}</p>}

      {item.grammarNote && (
        <p className="mt-2 pt-2 border-t border-line/60 text-xs text-muted">
          <span className="font-semibold text-fg">Ngữ pháp · </span>
          {item.grammarNote}
        </p>
      )}
    </div>
  );
};

/* ============================================================================
 * 18. DictionaryPopover - Hộp tra từ nhanh Nhật – Việt có nút Tim lưu từ
 * ========================================================================== */
export const DictionaryPopover: React.FC<{
  entry: WordEntry;
  saved: boolean;
  onToggleSaveWord: (entry: WordEntry) => void;
  onClose: () => void;
  showAnnotation?: boolean;
}> = ({ entry, saved, onToggleSaveWord, onClose, showAnnotation = false }) => {
  return (
    <div
      role="dialog"
      aria-label={`Tra từ điển: ${entry.word}`}
      className="p-4 rounded-[12px] bg-elevated border border-line shadow-lg flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-sm font-jp text-muted">{entry.furigana}</span>
          <h4 className="text-2xl font-bold font-jp text-fg leading-tight">{entry.word}</h4>
        </div>
        <div className="flex items-center gap-1.5">
          <IconButton
            size="sm"
            active={saved}
            ariaLabel={saved ? `Bỏ lưu từ ${entry.word}` : `Lưu từ ${entry.word} vào Sổ tay`}
            icon={<Heart className={`w-4 h-4 ${saved ? "fill-brand text-brand" : ""}`} />}
            onClick={() => onToggleSaveWord(entry)}
            showAnnotation={showAnnotation}
          />
          <IconButton
            size="sm"
            ariaLabel="Đóng hộp tra từ"
            icon={<X className="w-4 h-4" />}
            onClick={onClose}
            showAnnotation={showAnnotation}
          />
        </div>
      </div>

      <div>
        <p className="text-base font-semibold text-fg">{entry.meaningVi}</p>
        <p className="text-xs text-muted mt-0.5">
          {entry.pos} · {entry.level}
        </p>
      </div>

      <div className="p-3 rounded-[8px] bg-surface border border-line flex flex-col gap-1">
        <RubyText segments={entry.exampleJp} size="sm" />
        <span className="text-sm text-muted">{entry.exampleVi}</span>
      </div>
    </div>
  );
};

/* ============================================================================
 * 19. SavedWordCard - Thẻ từ vựng đã lưu trong Sổ tay
 * ========================================================================== */
export const SavedWordCard: React.FC<{
  entry: WordEntry;
  onRemove: (id: string) => void;
  onJumpToEpisode?: () => void;
  showAnnotation?: boolean;
}> = ({ entry, onRemove, onJumpToEpisode, showAnnotation = false }) => {
  return (
    <div className="p-4 rounded-[12px] bg-surface border border-line flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="level">{entry.level}</Badge>
            <span className="text-xs text-muted">{entry.pos}</span>
          </div>
          <div className="mt-2 font-jp">
            <ruby className="text-xl font-bold text-fg">
              {entry.word}
              <rt className="text-xs text-muted font-normal">{entry.furigana}</rt>
            </ruby>
          </div>
          <p className="text-sm font-medium text-fg mt-1">{entry.meaningVi}</p>
        </div>
        <IconButton
          size="sm"
          ariaLabel={`Xóa từ ${entry.word} khỏi Sổ tay`}
          icon={<Trash2 className="w-4 h-4 text-muted hover:text-brand" />}
          onClick={() => onRemove(entry.id)}
          showAnnotation={showAnnotation}
        />
      </div>

      <div className="p-3 rounded-[8px] bg-canvas border border-line/60 flex flex-col gap-1">
        <RubyText segments={entry.exampleJp} size="sm" />
        <span className="text-xs text-muted">{entry.exampleVi}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Nguồn: <strong className="text-fg">{entry.episodeTitle}</strong> ({entry.timestamp}
          )
        </span>
        {onJumpToEpisode && (
          <button
            type="button"
            onClick={onJumpToEpisode}
            className="text-brand hover:underline font-medium cursor-pointer"
          >
            Mở video →
          </button>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 20. SavedSentenceCard - Thẻ câu phụ đề đã lưu trong Sổ tay
 * ========================================================================== */
export const SavedSentenceCard: React.FC<{
  sentence: TranscriptItem;
  episodeTitle?: string;
  onRemove: (id: string) => void;
  onWatchSentence?: (seconds: number) => void;
  showAnnotation?: boolean;
}> = ({
  sentence,
  episodeTitle = "Gọi đồ uống",
  onRemove,
  onWatchSentence,
  showAnnotation = false,
}) => {
  return (
    <div className="p-4 rounded-[12px] bg-surface border border-line flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone="level">{sentence.level}</Badge>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-canvas text-muted">
            {sentence.startTime}
          </span>
          <span className="text-xs text-muted">{episodeTitle}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onWatchSentence && (
            <Button
              size="sm"
              variant="secondary"
              iconLeft={<Play className="w-3 h-3 fill-current" />}
              onClick={() => onWatchSentence(sentence.seconds)}
            >
              Nghe lại
            </Button>
          )}
          <IconButton
            size="sm"
            ariaLabel="Bỏ lưu câu khỏi Sổ tay"
            icon={<Heart className="w-4 h-4 fill-brand text-brand" />}
            onClick={() => onRemove(sentence.id)}
            showAnnotation={showAnnotation}
          />
        </div>
      </div>

      <div>
        <RubyText segments={sentence.segments} size="md" />
        <p className="text-sm text-muted mt-1">{sentence.vi}</p>
      </div>

      {sentence.grammarNote && (
        <div className="text-xs text-muted bg-canvas p-2.5 rounded-[8px] border border-line/60">
          {sentence.grammarNote}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 21. Dialog - Hộp thoại xác nhận / Đăng nhập trên Desktop
 * ========================================================================== */
export const Dialog: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}> = ({ title, description, children, onClose, footer }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="w-full max-w-md rounded-[16px] bg-surface border border-line shadow-2xl overflow-hidden"
    >
      <div className="p-5 border-b border-line flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-fg">{title}</h3>
          {description && <p className="text-xs text-muted mt-1">{description}</p>}
        </div>
        <IconButton
          size="sm"
          ariaLabel="Đóng hộp thoại"
          icon={<X className="w-4 h-4" />}
          onClick={onClose}
        />
      </div>
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3.5 bg-canvas border-t border-line flex items-center justify-end gap-2">
          {footer}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 22. BottomSheet - Khay trượt từ dưới lên trên Mobile (Tra từ / Tìm kiếm)
 * ========================================================================== */
export const BottomSheet: React.FC<{
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ title, children, onClose }) => {
  return (
    <div className="w-full rounded-t-[16px] bg-elevated border-t border-x border-line shadow-2xl overflow-hidden">
      <div className="pt-2.5 pb-1 flex justify-center">
        <span className="w-10 h-1 rounded-full bg-line" />
      </div>
      <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
        <h4 className="text-sm font-bold text-fg">{title}</h4>
        <IconButton
          size="sm"
          ariaLabel="Đóng khay thông tin"
          icon={<X className="w-4 h-4" />}
          onClick={onClose}
        />
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};

/* ============================================================================
 * 23. Toast - Thông báo phản hồi khi lưu kiến thức hoặc cập nhật tiến độ
 * ========================================================================== */
export const Toast: React.FC<{
  message: string;
  tone?: "success" | "error";
  onClose?: () => void;
}> = ({ message, tone = "success", onClose }) => {
  return (
    <div
      role="status"
      className={`px-4 py-3 rounded-[12px] border shadow-xl inline-flex items-center gap-3 text-sm font-medium ${
        tone === "error"
          ? "bg-brand-tint border-brand text-fg"
          : "bg-elevated border-line text-fg"
      }`}
    >
      {tone === "error" ? (
        <AlertCircle className="w-4 h-4 text-brand shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
      )}
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo"
          className="text-muted hover:text-fg ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

/* ============================================================================
 * 24. Skeleton - Trạng thái đang tải nội dung
 * ========================================================================== */
export const Skeleton: React.FC<{ className?: string }> = ({ className = "h-32 w-full" }) => {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-[12px] bg-surface border border-line/50 p-4 flex flex-col gap-3 ${className}`}
    >
      <div className="w-full aspect-video rounded-[8px] bg-elevated" />
      <div className="h-4 w-2/3 rounded bg-elevated" />
      <div className="h-3 w-1/2 rounded bg-elevated" />
    </div>
  );
};

/* ============================================================================
 * 25. EmptyState - Trạng thái rỗng khi không tìm thấy kết quả hoặc Sổ tay trống
 * ========================================================================== */
export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="p-8 rounded-[16px] bg-surface border border-dashed border-line flex flex-col items-center justify-center text-center gap-3">
      <div className="w-12 h-12 rounded-[12px] bg-elevated border border-line flex items-center justify-center text-muted">
        <BookOpen className="w-6 h-6 text-brand" />
      </div>
      <h4 className="text-base font-bold text-fg">{title}</h4>
      <p className="text-xs text-muted max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-1">
          <Button size="sm" variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
