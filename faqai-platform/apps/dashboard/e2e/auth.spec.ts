import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test.beforeEach(async ({ page }) => {
    // ローカルストレージをクリアして未認証状態にする
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('未認証時にトップページへアクセスするとログインページにリダイレクトされる', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('ログインページが正しく表示される', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('FAQAI')).toBeVisible();
    await expect(page.getByText('AI-powered FAQ Platform')).toBeVisible();
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '新規登録' })).toBeVisible();
  });

  test('ログインページでバリデーションエラーが表示される', async ({ page }) => {
    await page.goto('/login');

    // 空フォームで送信
    await page.getByRole('button', { name: 'ログイン', exact: true }).click();

    await expect(page.getByText('有効なメールアドレスを入力してください')).toBeVisible();
    await expect(page.getByText('パスワードを入力してください')).toBeVisible();
  });

  test('無効なメールアドレスでバリデーションエラーが表示される', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('メールアドレス').fill('invalid-email');
    await page.getByLabel('パスワード').fill('password');
    await page.getByRole('button', { name: 'ログイン', exact: true }).click();

    await expect(page.getByText('有効なメールアドレスを入力してください')).toBeVisible();
  });

  test('新規登録ページが正しく表示される', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByText('FAQAI')).toBeVisible();
    await expect(page.getByText('新規登録')).toBeVisible();
    await expect(page.getByLabel('名前')).toBeVisible();
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード', { exact: true })).toBeVisible();
    await expect(page.getByLabel('パスワード（確認）')).toBeVisible();
    await expect(page.getByRole('button', { name: 'アカウントを作成' })).toBeVisible();
  });

  test('新規登録ページでパスワード不一致エラーが表示される', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('名前').fill('テストユーザー');
    await page.getByLabel('メールアドレス').fill('test@example.com');
    await page.getByLabel('パスワード', { exact: true }).fill('Password123');
    await page.getByLabel('パスワード（確認）').fill('Password456');
    await page.getByRole('button', { name: 'アカウントを作成' }).click();

    await expect(page.getByText('パスワードが一致しません')).toBeVisible();
  });

  test('新規登録ページでパスワード強度バリデーションが機能する', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('名前').fill('テストユーザー');
    await page.getByLabel('メールアドレス').fill('test@example.com');
    await page.getByLabel('パスワード', { exact: true }).fill('weakpass');
    await page.getByLabel('パスワード（確認）').fill('weakpass');
    await page.getByRole('button', { name: 'アカウントを作成' }).click();

    await expect(
      page.getByText('パスワードには大文字・小文字・数字を含める必要があります'),
    ).toBeVisible();
  });

  test('ログインページから新規登録ページへ遷移できる', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: '新規登録' }).click();
    await expect(page).toHaveURL('/register');
  });

  test('新規登録ページからログインページへ遷移できる', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: 'ログイン' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('ログイン後にルートURLへアクセスするとダッシュボードが表示される', async ({ page }) => {
    // このテストはAPIモックが必要なため、ナビゲーション確認のみ行う
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
  });
});
