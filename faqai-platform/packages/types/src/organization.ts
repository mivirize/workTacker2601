/**
 * 組織・メンバーシップ関連の型定義
 */

import type { UUID, ISODateString, Plan, Role } from './common.js';
import type { User } from './auth.js';

/** 組織の設定 */
export interface OrganizationSettings {
  /** 作成可能なサイトの最大数 */
  maxSites: number;
  /** 作成可能なFAQアイテムの最大数 */
  maxFaqItems: number;
  /** 最大チャットセッション数（月次） */
  maxChatSessions: number;
  /** 利用可能な機能のリスト */
  allowedFeatures: string[];
}

/** 組織情報 */
export interface Organization {
  id: UUID;
  name: string;
  /** URLスラッグ（一意） */
  slug: string;
  plan: Plan;
  settings: OrganizationSettings;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** 組織メンバーシップ */
export interface Membership {
  id: UUID;
  userId: UUID;
  organizationId: UUID;
  role: Role;
  /** 展開されたユーザー情報（オプション） */
  user?: User;
  createdAt: ISODateString;
}

/** 組織作成リクエスト */
export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  plan?: Plan;
}

/** 組織更新リクエスト */
export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  settings?: Partial<OrganizationSettings>;
}

/** メンバー招待リクエスト */
export interface InviteMemberRequest {
  email: string;
  role: Role;
}
