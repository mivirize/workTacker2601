import { test, expect } from '@playwright/test';

async function loginAsTestUser(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('メールアドレス').fill('e2e@faqai.test');
  await page.getByLabel('パスワード').fill('E2ETest123');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

test.describe('チャットボット管理ページ (/chatbots)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/chatbots');
    await expect(page.getByRole('heading', { name: 'チャットボット管理' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('チャットボット管理ページが表示される', async ({ page }) => {
    await expect(page.getByText('チャットボットの作成・設定・ウィジェット管理')).toBeVisible();
  });

  test('サイトを選択して作成リンクが表示される', async ({ page }) => {
    // ページに「サイトを選択して作成」または「サイト一覧へ」のリンクが存在する
    const createLink = page.getByRole('link', { name: /サイト/ });
    await expect(createLink.first()).toBeVisible();
  });

  test('サイドバーの「チャットボット」リンクが正しく動作する', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'チャットボット' }).click();
    await expect(page).toHaveURL('/chatbots');
    await expect(page.getByRole('heading', { name: 'チャットボット管理' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('チャットボットが存在しない場合は空状態メッセージが表示される', async ({ page }) => {
    const hasEmptyState = await page.getByText('チャットボットがまだありません').isVisible();
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').count();
    expect(hasEmptyState || hasCards > 0).toBe(true);
  });
});

test.describe('チャットボット新規作成案内ページ (/chatbots/new)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/chatbots/new');
  });

  test('チャットボット作成案内ページが表示される', async ({ page }) => {
    await expect(page.getByText('チャットボットはサイトごとに管理します')).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByText('チャットボットを作成するには', { exact: false }),
    ).toBeVisible();
  });

  test('サイト一覧へのリンクが表示される', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'サイト一覧へ' })).toBeVisible({ timeout: 10000 });
  });

  test('サイト一覧へリンクをクリックするとサイト管理ページへ遷移する', async ({ page }) => {
    await page.getByRole('link', { name: 'サイト一覧へ' }).click();
    await expect(page).toHaveURL('/sites');
  });
});

test.describe('サイト詳細のチャットボットタブ', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('サイト管理ページが表示される', async ({ page }) => {
    await page.goto('/sites');
    await expect(page.getByRole('heading', { name: 'サイト管理' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('/chatbots/new からサイト一覧を経由してサイト管理ページへ到達できる', async ({
    page,
  }) => {
    await page.goto('/chatbots/new');
    await page.getByRole('link', { name: 'サイト一覧へ' }).click();
    await expect(page).toHaveURL('/sites');
    await expect(page.getByRole('heading', { name: 'サイト管理' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('サイト詳細ページのチャットボットタブへのナビゲーションが機能する', async ({ page }) => {
    await page.goto('/sites');

    // サイトが存在する場合のみ詳細ページをテスト
    const siteLinks = page.getByRole('link').filter({ hasText: /https?:\/\// });
    const siteCount = await siteLinks.count();

    if (siteCount > 0) {
      const firstSiteHref = await siteLinks.first().getAttribute('href');
      if (firstSiteHref) {
        await page.goto(firstSiteHref);
        // チャットボットタブが存在することを確認
        const chatbotTab = page.getByRole('link', { name: 'チャットボット' });
        await expect(chatbotTab).toBeVisible({ timeout: 10000 });
        await chatbotTab.click();
        await expect(page).toHaveURL(new RegExp('/sites/[^/]+/chatbots'));
      }
    } else {
      // サイトがない場合は空状態を確認
      await expect(
        page.getByRole('button', { name: 'サイトを追加', exact: true }),
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
