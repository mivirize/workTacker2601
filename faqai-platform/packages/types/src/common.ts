/**
 * 共通型定義
 */

/** UUID文字列型 */
export type UUID = string;

/** ISO 8601形式の日時文字列型 */
export type ISODateString = string;

/** 作成日時・更新日時のタイムスタンプ */
export interface Timestamps {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** ページネーションのクエリパラメータ */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** ページネーション付きレスポンス */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** APIレスポンスの共通ラッパー */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** 組織内のメンバーロール */
export type Role = 'owner' | 'admin' | 'editor' | 'viewer';

/** サービスの利用プラン */
export type Plan = 'free' | 'starter' | 'business' | 'enterprise';
