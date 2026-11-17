import React from "react";
import { EmptyState, Skeleton } from "../components/DesignSystem";
import { ApiError, errorMessage } from "../lib/api";

export const ErrorState: React.FC<{ error: unknown; onRetry?: () => void }> = ({ error, onRetry }) => (
  <EmptyState
    title="Chưa tải được dữ liệu"
    description={errorMessage(error)}
    actionLabel={onRetry ? "Thử lại" : undefined}
    onAction={onRetry}
  />
);

export const GridSkeleton: React.FC<{ count?: number; className?: string; itemClassName?: string }> = ({
  count = 4,
  className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4",
  itemClassName = "h-64 w-full",
}) => (
  <div className={className} aria-busy="true" aria-label="Đang tải">
    {Array.from({ length: count }, (_, i) => (
      <Skeleton key={i} className={itemClassName} />
    ))}
  </div>
);

export const LoginPrompt: React.FC<{ description: string; onLogin: () => void }> = ({
  description,
  onLogin,
}) => (
  <EmptyState
    title="Đăng nhập để tiếp tục"
    description={description}
    actionLabel="Đăng nhập bằng Google"
    onAction={onLogin}
  />
);

export const isUnauthorized = (error: unknown) => error instanceof ApiError && error.status === 401;
export const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404;
