import React, { useEffect, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<any> | null = null;
function loadYouTubeApi(): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(window.YT);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        apiPromise = null;
        reject(new Error("Không tải được trình phát YouTube"));
      };
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

export interface PlayerControls {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  getTime: () => number;
}

/** Trình phát YouTube IFrame (chỉ nhúng chính thức, ẩn thanh điều khiển gốc để dùng điều khiển của Kotoba). */
export const YouTubePlayer: React.FC<{
  videoId: string;
  startSeconds?: number;
  autoplay?: boolean;
  onReady: (controls: PlayerControls, durationSeconds: number) => void;
  onDuration?: (durationSeconds: number) => void;
  onTime: (seconds: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onError: (message: string) => void;
}> = ({
  videoId,
  startSeconds = 0,
  autoplay = true,
  onReady,
  onDuration,
  onTime,
  onPlayingChange,
  onError,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onReady, onDuration, onTime, onPlayingChange, onError });
  callbacks.current = { onReady, onDuration, onTime, onPlayingChange, onError };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let player: any = null;
    let timer = 0;

    host.innerHTML = "";
    const mount = document.createElement("div");
    host.appendChild(mount);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(mount, {
          videoId,
          playerVars: {
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            fs: 0,
            iv_load_policy: 3,
            cc_load_policy: 0,
            start: Math.floor(startSeconds),
            autoplay: autoplay ? 1 : 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (cancelled) return;
              const controls: PlayerControls = {
                play: () => player.playVideo(),
                pause: () => player.pauseVideo(),
                seek: (seconds) => player.seekTo(Math.max(0, seconds), true),
                getTime: () => player.getCurrentTime?.() ?? 0,
              };
              callbacks.current.onReady(controls, player.getDuration?.() ?? 0);
              timer = window.setInterval(() => {
                const seconds = player?.getCurrentTime?.();
                if (typeof seconds === "number") callbacks.current.onTime(seconds);
              }, 250);
            },
            onStateChange: (event: { data: number }) => {
              if (cancelled) return;
              callbacks.current.onPlayingChange(event.data === 1 || event.data === 3);
              if (event.data === 1) {
                const duration = player.getDuration?.();
                if (duration) callbacks.current.onDuration?.(duration);
              }
            },
            onError: (event: { data: number }) => {
              if (cancelled) return;
              const embedBlocked = event.data === 101 || event.data === 150;
              callbacks.current.onError(
                embedBlocked
                  ? "Video này không cho phép phát nhúng. Phụ đề vẫn xem được bên dưới."
                  : "Không phát được video. Phụ đề vẫn xem được bên dưới.",
              );
            },
          },
        });
      })
      .catch((error: Error) => !cancelled && callbacks.current.onError(error.message));

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      try {
        player?.destroy?.();
      } catch {
        // Bỏ qua lỗi khi hủy trình phát
      }
      host.innerHTML = "";
    };
    // Chỉ tạo lại trình phát khi đổi video.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full"
    />
  );
};
