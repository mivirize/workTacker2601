import { test, expect } from '@playwright/test';

// テスト用の認証ヘルパー
async function loginAsTestUser(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('メールアドレス').fill('e2e@faqai.test');
  await page.getByLabel('パスワード').fill('E2ETest123');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  // ダッシュボードへのリダイレクトを待つ
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

test.describe('サイト管理ページ', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/sites');
    // Zustandハイドレーション＋AuthGuard表示を待つ
    await expect(page.getByRole('heading', { name: 'サイト管理' })).toBeVisible({ timeout: 10000 });
  });

  test('サイト管理ページが表示される', async ({ page }) => {
    await expect(page.getByText('クロール対象サイトの管理とFAQ自動生成')).toBeVisible();
    await expect(page.getByRole('button', { name: 'サイトを追加', exact: true })).toBeVisible();
  });

  test('サイトを追加ボタンでダイアログが開く', async ({ page }) => {
    await page.getByRole('button', { name: 'サイトを追加', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('サイトを追加')).toBeVisible();
    await expect(page.getByLabel('サイト名')).toBeVisible();
    await expect(page.getByLabel('URL')).toBeVisible();
    await expect(page.getByLabel('最大ページ数')).toBeVisible();
    await expect(page.getByLabel('最大深度')).toBeVisible();
  });

  test('サイト追加ダイアログをキャンセルできる', async ({ page }) => {
    await page.getByRole('button', { name: 'サイトを追加', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'キャンセル' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('サイト追加フォームのバリデーション', async ({ page }) => {
    await page.getByRole('button', { name: 'サイトを追加', exact: true }).click();
    await page.getByRole('button', { name: '追加する' }).click();
    await expect(page.getByText('サイト名は必須です')).toBeVisible();
    await expect(page.getByText('有効なURLを入力してください')).toBeVisible();
  });

  test('サイドバーの「サイト管理」リンクが正しく動作する', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'サイト管理' }).click();
    await expect(page).toHaveURL('/sites');
    await expect(page.getByRole('heading', { name: 'サイト管理' })).toBeVisible();
  });
});
