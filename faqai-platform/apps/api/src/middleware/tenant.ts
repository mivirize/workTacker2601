import { createMiddleware } from 'hono/factory';
import { getDb, sql } from '@faqai/db';

/**
 * マルチテナントミドルウェア
 * PostgreSQL RLS のセッション変数を設定し、テナント分離を実現する
 */
export const tenantMiddleware = createMiddleware(async (c, next) => {
  const organizationId = c.get('organizationId');

  if (!organizationId) {
    // 認証されていない場合はスキップ（authMiddlewareが先に実行される想定）
    await next();
    return;
  }

  const db = getDb();

  // トランザクション内でRLSセッション変数を設定
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`SET LOCAL app.current_organization_id = ${organizationId}`,
    );
    await next();
  });
});
