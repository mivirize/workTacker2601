import { test, expect } from '@playwright/test';

async function loginAsTestUser(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('メールアドレス').fill('e2e@faqai.test');
  await page.getByLabel('パスワード').fill('E2ETest123');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

test.describe('FAQ管理ページ (/faqs)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/faqs');
    await expect(page.getByRole('heading', { name: 'FAQ管理' })).toBeVisible({ timeout: 10000 });
  });

  test('FAQ管理ページが表示される', async ({ page }) => {
    await expect(page.getByText('サイトを選択してFAQを管理してください')).toBeVisible();
  });

  test('サイト一覧またはサイトなし状態が表示される', async ({ page }) => {
    // ローディング完了を待つ
    await page.waitForLoadState('networkidle');
    const hasEmptyState = await page.getByText('サイトがまだありません').isVisible();
    const hasSiteCards = await page.locator('[class*="Card"], [class*="card"]').count();
    // いずれかの状態が表示される
    expect(hasEmptyState || hasSiteCards > 0).toBe(true);
  });

  test('サイトが存在しない場合はサイト管理へのリンクが表示される', async ({ page }) => {
    const hasEmptyState = await page.getByText('サイトがまだありません').isVisible();
    if (hasEmptyState) {
      await expect(page.getByRole('link', { name: 'サイト管理へ' })).toBeVisible();
    }
  });
});

test.describe('タグ管理ページ', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/tags');
    await expect(page.getByRole('heading', { name: 'タグ管理' })).toBeVisible({ timeout: 10000 });
  });

  test('タグ管理ページが表示される', async ({ page }) => {
    await expect(page.getByText('FAQに付与するタグを管理します')).toBeVisible();
  });

  test('新しいタグを追加ボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: '新しいタグを追加' })).toBeVisible();
  });

  test('タグ作成フォームが開閉する', async ({ page }) => {
    await page.getByRole('button', { name: '新しいタグを追加' }).click();
    await expect(page.getByLabel('タグ名')).toBeVisible();
    await expect(page.getByText('カラー')).toBeVisible();
    await page.getByRole('button', { name: 'キャンセル' }).click();
    await expect(page.getByRole('button', { name: '新しいタグを追加' })).toBeVisible();
  });

  test('サイドバーの「タグ管理」リンクが正しく動作する', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'タグ管理' }).click();
    await expect(page).toHaveURL('/tags');
    await expect(page.getByRole('heading', { name: 'タグ管理' })).toBeVisible();
  });
});
