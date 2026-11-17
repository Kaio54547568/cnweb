import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Brand, Button, TextField, Toggle, getInitials } from "../components/DesignSystem";
import type { AppState } from "../components/appState";

const LEVELS = ["", "N5", "N4", "N3", "N2", "N1"];

/** Đăng nhập (chỉ Google) khi là khách; hồ sơ khi đã đăng nhập. */
export const AuthScreen: React.FC<{ state: AppState }> = ({ state }) => {
  const { profile } = state;
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(profile?.displayName ?? "");
    setLevel(profile?.jlptLevel ?? "");
  }, [profile?.displayName, profile?.jlptLevel]);

  const dirty = (profile?.displayName ?? "") !== name.trim() || (profile?.jlptLevel ?? "") !== level;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    const ok = await state.updateProfile({
      displayName: name.trim() === "" ? null : name.trim().slice(0, 80),
      jlptLevel: level === "" ? null : level,
    });
    setSaving(false);
    if (ok) state.notify("Đã lưu hồ sơ");
  };

  const remove = async () => {
    setDeleting(true);
    await state.deleteAccount();
    setDeleting(false);
  };

  return (
    <div className="p-6 flex-1 flex items-center justify-center">
      <div className="w-full max-w-md rounded-[16px] bg-surface border border-line p-6 flex flex-col gap-5 shadow-lg">
        <button
          type="button"
          onClick={() => state.navigate("Home")}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg self-start cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Trang chủ</span>
        </button>

        {state.isLoggedIn ? (
          <>
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 rounded-full bg-brand-tint border border-brand text-lg font-bold text-fg flex items-center justify-center shrink-0">
                {getInitials(state.userName)}
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-fg truncate">{state.userName}</h1>
                <p className="text-sm text-muted">
                  {profile?.role === "EDITOR" ? "Biên tập viên" : "Học viên"} · Tiến độ và Sổ tay được đồng bộ
                </p>
              </div>
            </div>

            <form onSubmit={save} className="flex flex-col gap-4">
              <TextField
                id="profile-name"
                label="Tên hiển thị"
                value={name}
                onChange={setName}
                placeholder="Tên của bạn (tối đa 80 ký tự)"
              />
              <label className="flex flex-col gap-1.5 text-sm text-fg">
                Trình độ tiếng Nhật
                <select
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                  className="h-10 rounded-[8px] border border-line bg-canvas px-3 text-sm text-fg"
                >
                  {LEVELS.map((value) => (
                    <option key={value} value={value}>
                      {value === "" ? "Chưa chọn" : value}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" variant="secondary" size="md" fullWidth disabled={!dirty || saving}>
                {saving ? "Đang lưu…" : "Lưu hồ sơ"}
              </Button>
            </form>

            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-fg">Giao diện</span>
              <Toggle label="Chế độ sáng" checked={state.theme === "light"} onChange={state.toggleTheme} />
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="primary" size="lg" fullWidth onClick={() => state.navigate("Notebook")}>
                Mở Sổ tay
              </Button>
              {profile?.role === "EDITOR" && (
                <a
                  href="/editorial"
                  className="inline-flex items-center justify-center h-10 rounded-[8px] border border-line text-sm text-fg hover:bg-elevated transition-colors"
                >
                  Mở trang biên tập
                </a>
              )}
              <Button variant="ghost" size="md" fullWidth onClick={state.logout}>
                Đăng xuất
              </Button>
            </div>

            <div className="pt-4 border-t border-line flex flex-col gap-2">
              {confirmDelete ? (
                <>
                  <p className="text-sm text-muted">
                    Xóa tài khoản sẽ xóa liên kết Google, hồ sơ, Sổ tay và tiến độ xem. Không thể hoàn tác.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="primary" size="md" onClick={remove} disabled={deleting}>
                      {deleting ? "Đang xóa…" : "Xóa vĩnh viễn"}
                    </Button>
                    <Button variant="ghost" size="md" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                      Hủy
                    </Button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-sm text-muted hover:text-brand self-start cursor-pointer"
                >
                  Xóa tài khoản…
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <Brand size="md" />
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-bold text-fg">Đăng nhập</h1>
              <p className="text-sm text-muted">
                Lưu từ vựng, câu phụ đề và tiến độ xem để học tiếp trên mọi thiết bị.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={state.login}
              disabled={state.authStatus === "loading"}
            >
              Đăng nhập bằng Google
            </Button>
            <p className="text-xs text-muted">
              Lần đầu đăng nhập, Kotoba tự tạo tài khoản học viên. Chúng tôi chỉ lưu mã định danh Google, không lưu
              mật khẩu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
