import { expect, test, type Page } from "@playwright/test";

const isLocal = (process.env.BASE_URL ?? "http://localhost:5199").includes("localhost");
const PALETTE_COUNT = 63;

async function open(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.locator(".shell")).toBeVisible();
}

async function devLogin(page: Page, returnTo = "/") {
  await page.goto(`/auth/dev-login?return_to=${encodeURIComponent(returnTo)}`);
  await expect(page.locator(".shell")).toBeVisible();
}

test.describe("ゲスト", () => {
  test("起動時に全画面スケルトンを表示してから一覧を描画する", async ({ page }) => {
    let resolveMe!: () => void;
    const gate = new Promise<void>((r) => (resolveMe = r));
    await page.route("**/api/me", async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto("/");
    await expect(page.getByTestId("page-skeleton")).toBeVisible();
    resolveMe();
    await expect(page.locator(".shell")).toBeVisible();
    await expect(page.getByTestId("page-skeleton")).toHaveCount(0);
    await expect(page.getByTestId("palette-card")).toHaveCount(PALETTE_COUNT);
  });

  test("媒体の切り替えでモックアップが変わる", async ({ page }) => {
    await open(page);
    const first = page.getByTestId("palette-card").first();
    await expect(first.locator(".mock-poster")).toBeVisible();
    for (const [label, cls] of [
      ["バナー", ".mock-banner"],
      ["Webサイト", ".mock-web"],
      ["SNS", ".mock-sns"],
    ]) {
      await page.getByRole("tab", { name: label }).click();
      await expect(page.getByTestId("palette-card").first().locator(cls)).toBeVisible();
    }
    await expect(page).toHaveURL(/media=sns/);
  });

  test("スタイルで絞り込める", async ({ page }) => {
    await open(page);
    await page.getByRole("group", { name: "スタイル" }).getByRole("button", { name: "かわいい" }).click();
    await expect(page).toHaveURL(/taste=cute/);
    const cards = page.getByTestId("palette-card");
    await expect(cards.first().locator(".taste-cute")).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(3);
    expect(count).toBeLessThan(PALETTE_COUNT);
    expect(await page.locator("[data-testid=palette-card] .taste-cute").count()).toBe(count);
  });

  test("キーワードとHEXで検索できる", async ({ page }) => {
    await open(page);
    const search = page.getByRole("textbox", { name: "配色を検索" });
    await search.fill("カフェ");
    await expect(page.getByTestId("palette-card").filter({ hasText: "カフェオープン" })).toBeVisible();
    const kw = await page.getByTestId("palette-card").count();
    expect(kw).toBeLessThan(PALETTE_COUNT);
    await search.fill("#2C64B1");
    await expect(page.getByTestId("palette-card").filter({ hasText: "スクールフェス" })).toBeVisible();
    await search.fill("存在しないキーワードxyz");
    await expect(page.getByText("該当する配色がありません")).toBeVisible();
  });

  test("詳細画面: スウォッチ・役割入れ替え・媒体・スタイル比較", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
    await open(page);
    await page.getByTestId("palette-card").filter({ hasText: "カフェオープン" }).click();
    await expect(page).toHaveURL(/\/p\/cafe-open/);
    await expect(page.getByRole("heading", { name: "カフェオープン" })).toBeVisible();

    const swatches = page.locator(".big-swatch");
    await expect(swatches).toHaveCount(3);
    await expect(swatches.nth(1)).toContainText("#18189A");
    await swatches.nth(1).click();
    await expect(page.getByText("#18189A をコピーしました")).toBeVisible();

    const base = page.locator(".rolebar .role").first();
    const before = await base.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.getByTestId("shift-roles").click();
    await expect.poll(() => base.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(before);

    await page.locator(".stage-wrap").getByRole("tab", { name: "バナー" }).click();
    await expect(page.locator(".stage .mock-banner")).toBeVisible();
    await expect(page).toHaveURL(/media=banner/);

    await page.getByRole("option", { name: /和モダン/ }).click();
    await expect(page.locator(".stage .taste-japanese")).toBeVisible();
    await expect(page).toHaveURL(/taste=japanese/);

    await page.getByTestId("edit-palette").click();
    await expect(page).toHaveURL(/\/colors\?c=F9D6B8-18189A-EE470F/);
  });

  test("色から: HEX入力でプレビューと相性スタイルが更新される", async ({ page }) => {
    await open(page, "/colors");
    await expect(page.locator(".fit")).toHaveCount(4);
    const hex = page.getByTestId("hex-0");
    await hex.fill("#111111");
    await expect(page).toHaveURL(/c=111111-/);
    await expect(page.locator(".slot").first()).toContainText("ブラック");
    await expect(page.locator(".stage .mock").last()).toBeVisible();

    await page.getByTestId("color-picker-2").fill("#ff4f00");
    await expect(page).toHaveURL(/-FF4F00/);

    const url = page.url();
    await page.getByTestId("random").click();
    await expect.poll(() => page.url()).not.toBe(url);

    const firstFit = page.locator(".fit").nth(1);
    await firstFit.click();
    await expect(firstFit).toHaveClass(/on/);
    await expect(page.locator(".similar-item")).toHaveCount(6);
  });

  test("イメージから: ゲストはライブラリ提案とログイン案内が出る", async ({ page }) => {
    await open(page, "/image");
    await page.getByTestId("image-prompt").fill("カフェのオープン告知");
    await page.getByRole("group", { name: "スタイル" }).getByRole("button", { name: "モダン", exact: true }).click();
    await page.getByTestId("suggest").click();
    await expect(page.getByTestId("library-results")).toBeVisible();
    await expect(page.getByTestId("library-results").getByTestId("palette-card").first()).toBeVisible();
    await expect(page.getByTestId("google-login")).toHaveAttribute("href", /\/auth\/google\?return_to=%2Fimage/);
  });

  test("保存・AIはログインを求める", async ({ page }) => {
    await open(page, "/saved");
    await expect(page.getByTestId("google-login")).toBeVisible();
    await open(page, "/p/ice-cream");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "ログイン" })).toBeVisible();
    await page.getByRole("button", { name: "閉じる" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByTestId("ai-image").click();
    await expect(page.getByRole("dialog", { name: "ログイン" })).toBeVisible();
  });

  test("Googleログインの開始はGoogleの認可画面へリダイレクトする", async ({ request }) => {
    const res = await request.get("/auth/google?return_to=/saved", { maxRedirects: 0 });
    expect(res.status()).toBe(302);
    const location = res.headers()["location"];
    const me = await (await request.get("/api/me")).json();
    if (me.googleEnabled) {
      const url = new URL(location);
      expect(url.origin).toBe("https://accounts.google.com");
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("scope")).toBe("openid email profile");
      expect(url.searchParams.get("code_challenge_method")).toBe("S256");
      expect(url.searchParams.get("redirect_uri")).toMatch(/\/auth\/google\/callback$/);
    } else {
      expect(location).toContain("auth_error=not_configured");
    }
  });

  test("APIの保護: 未ログインは401・別オリジンは403・不正なstateは拒否", async ({ request, baseURL }) => {
    expect((await request.get("/api/favorites")).status()).toBe(401);
    expect((await request.post("/api/ai/analyze", { data: { colors: ["#000000", "#ffffff", "#ff0000"] } })).status()).toBe(401);
    expect((await request.post("/api/favorites", { data: {}, headers: { origin: "https://evil.example" } })).status()).toBe(403);
    const cb = await request.get("/auth/google/callback?code=x&state=y", { maxRedirects: 0 });
    expect(cb.headers()["location"]).toContain("auth_error=state");
    expect((await request.get("/auth/dev-login", { maxRedirects: 0 })).status()).toBe(isLocal ? 302 : 404);
    expect(baseURL).toBeTruthy();
  });

  test("横スクロールが発生せずコンソールエラーがない", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    for (const path of ["/", "/p/it-fes", "/colors", "/image", "/saved"]) {
      await open(page, path);
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
    expect(errors).toEqual([]);
  });
});

test.describe("ログイン済み（ローカルのテスト用ログイン）", () => {
  test.skip(!isLocal, "テスト用ログインはローカル環境のみ");

  test("配色を保存して保存一覧から削除できる", async ({ page }) => {
    await devLogin(page, "/saved");
    // start clean
    while ((await page.getByTestId("saved-card").count()) > 0) {
      await page.getByTestId("saved-card").first().getByRole("button", { name: /を削除/ }).click();
      await page.waitForTimeout(350);
    }
    await open(page, "/p/pinky-store");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect(page.getByText("保存しました")).toBeVisible();
    await expect(page.getByRole("button", { name: "保存を解除" })).toBeVisible();

    await page.getByRole("link", { name: "保存" }).click();
    await expect(page.getByTestId("saved-card")).toHaveCount(1);
    await expect(page.getByTestId("saved-card")).toContainText("ピンキーストア");

    await page.reload();
    await expect(page.getByTestId("saved-card")).toHaveCount(1);
    await page.getByTestId("saved-card").getByRole("button", { name: /を削除/ }).click();
    await expect(page.getByTestId("saved-card")).toHaveCount(0);
    await expect(page.getByText("まだ保存した配色はありません")).toBeVisible();
  });

  test("AI分析: スケルトン表示後に結果が出る", async ({ page }) => {
    await devLogin(page, "/colors?c=EFF55F-2C64B1-CE2B7E");
    await page.getByTestId("ai-analyze").click();
    await expect(page.getByTestId("ai-skeleton")).toBeVisible();
    await expect(page.getByTestId("ai-analysis")).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(".ai-summary")).not.toBeEmpty();
    expect(await page.getByTestId("ai-analysis").locator("li").count()).toBeGreaterThan(2);
  });

  test("AI提案: イメージから3案の配色とモックアップが出る", async ({ page }) => {
    await devLogin(page, "/image");
    await page.getByTestId("image-prompt").fill("夏祭りのポスター、元気で爽やかに");
    await page.getByTestId("suggest").click();
    await expect(page.getByTestId("suggest-skeleton")).toBeVisible();
    const results = page.getByTestId("suggest-results");
    await expect(results).toBeVisible({ timeout: 60_000 });
    const cards = results.locator(".suggest");
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.first().locator(".mock")).toBeVisible();
    await expect(cards.first().locator("code").first()).toHaveText(/^#[0-9A-F]{6}$/);
    await cards.first().locator(".suggest-mock").click();
    await expect(page).toHaveURL(/\/colors\?c=/);
  });

  test("AIイメージ生成: 画像が表示される", async ({ page }) => {
    await devLogin(page, "/p/it-fes");
    await page.getByTestId("ai-image").click();
    const img = page.getByTestId("ai-image-result");
    await expect(img).toBeVisible({ timeout: 60_000 });
    expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(200);
  });

  test("ログアウトできる", async ({ page }) => {
    await devLogin(page, "/");
    await page.getByRole("button", { name: "アカウント" }).click();
    await expect(page.getByRole("dialog", { name: "アカウント" })).toContainText("テストユーザー");
    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(page.getByText("ログアウトしました")).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
  });
});
