'use client';

import { useState, type FormEvent } from 'react';

const levels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

export type LearnerProfile = {
  displayName: string | null;
  jlptLevel: (typeof levels)[number] | null;
  learningLanguage: string;
};

export function ProfileForm({ profile, googleName }: { profile: LearnerProfile; googleName?: string | null }) {
  const [saved, setSaved] = useState(profile);
  const [name, setName] = useState(profile.displayName ?? '');
  const [level, setLevel] = useState(profile.jlptLevel ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const displayName = name.trim() || null;
    const jlptLevel = level || null;
    if (displayName === saved.displayName && jlptLevel === saved.jlptLevel) {
      setMessage('Hồ sơ chưa có thay đổi.');
      return;
    }
    if (displayName && [...displayName].length > 80) {
      setMessage('Tên hiển thị tối đa 80 ký tự.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/v1/identity/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(displayName !== saved.displayName && { displayName }),
          ...(jlptLevel !== saved.jlptLevel && { jlptLevel }),
        }),
      });
      if (response.status === 401) {
        setMessage('Vui lòng đăng nhập lại để cập nhật hồ sơ.');
        return;
      }
      if (!response.ok) throw new Error('Profile update failed');
      const updated: LearnerProfile = await response.json();
      setSaved(updated);
      setName(updated.displayName ?? '');
      setLevel(updated.jlptLevel ?? '');
      setMessage('Đã lưu hồ sơ.');
    } catch {
      setMessage('Chưa lưu được hồ sơ. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend>Hồ sơ người học</legend>
        <p>Tên đang hiển thị: {saved.displayName ?? (googleName || 'Chưa đặt tên')}</p>
        <p>
          <label>Tên hiển thị{' '}
            <input value={name} onChange={(event) => setName(event.target.value)}
              placeholder={googleName || 'Nhập tên hiển thị'} aria-describedby="display-name-help" />
          </label>
        </p>
        <p id="display-name-help">Tối đa 80 ký tự. Để trống để dùng tên Google nếu có.</p>
        <p>Ngôn ngữ đang học: Tiếng Nhật</p>
        <p>
          <label>Trình độ{' '}
            <select value={level} onChange={(event) => setLevel(event.target.value as typeof level)}>
              <option value="">Chưa xác định</option>
              {levels.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </p>
        <button>{busy ? 'Đang lưu…' : 'Lưu hồ sơ'}</button>
      </fieldset>
      <p role="status">{message}</p>
    </form>
  );
}
