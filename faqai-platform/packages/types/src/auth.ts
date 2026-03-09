/**
 * 認証・ユーザー関連の型定義
 */

import type { UUID, ISODateString } from './common.js';
import type { Role } from './common.js';

/** ユーザー情報 */
export interface User {
  id: UUID;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** 認証トークン */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** アクセストークンの有効期限（秒） */
  expiresIn: number;
}

/** ログインリクエスト */
export interface LoginRequest {
  email: string;
  password: string;
}

/** ユーザー登録リクエスト */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/** OAuthプロバイダー */
export type OAuthProvider = 'google' | 'github';

/** JWTペイロード */
export interface JwtPayload {
  userId: UUID;
  organizationId: UUID;
  role: Role;
  sessionId: UUID;
}

/** APIキー */
export interface ApiKey {
  id: UUID;
  name: string;
  /** APIキーの先頭プレフィックス（表示用、フルキーは保存しない） */
  keyPrefix: string;
  lastUsedAt?: ISODateString;
  expiresAt?: ISODateString;
  /** 許可されたスコープのリスト */
  scopes: string[];
  createdAt: ISODateString;
}
