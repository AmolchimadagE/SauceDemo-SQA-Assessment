import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'https://www.saucedemo.com/';
const USERNAME = 'standard_user';
const PASSWORD = 'secret_sauce';

async function login(page: Page): Promise<void> {
  await page.goto(BASE_URL);
  await page.locator('[data-test="username"]').fill(USERNAME);
  await page.locator('[data-test="password"]').fill(PASSWORD);
  await page.locator('[data-test="login-button"]').click();
  await expect(page).toHaveURL(/inventory\.html$/);
}

test('standard user can purchase Sauce Labs Backpack end to end', async ({ page }) => {
  // --- Login ---
  await login(page);
  await expect(page).toHaveURL(/inventory\.html$/);
  await expect(page.locator('.inventory_list')).toBeVisible();
  await expect(page.locator('.inventory_item')).toHaveCount(6);

  // --- Select Sauce Labs Backpack (product detail) ---
  const backpack = page.locator('.inventory_item', {
    has: page.locator('.inventory_item_name', { hasText: 'Sauce Labs Backpack' }),
  });
  await backpack.locator('.inventory_item_name').click();
  await expect(page).toHaveURL(/inventory-item\.html\?id=\d+$/);
  await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText('Sauce Labs Backpack');
  await expect(page.locator('[data-test="inventory-item-price"]')).toHaveText('$29.99');

  // --- Add to cart ---
  await page.locator('[data-test="add-to-cart"]').click();
  await expect(page.locator('[data-test="remove"]')).toBeVisible();
  await expect(page.locator('.shopping_cart_badge')).toHaveText('1');

  // --- Open cart ---
  await page.locator('[data-test="shopping-cart-link"]').click();
  await expect(page).toHaveURL(/cart\.html$/);
  const cartItem = page.locator('.cart_item', {
    has: page.locator('[data-test="inventory-item-name"]', { hasText: 'Sauce Labs Backpack' }),
  });
  await expect(cartItem).toHaveCount(1);
  await expect(cartItem.locator('[data-test="inventory-item-price"]')).toHaveText('$29.99');
  await expect(cartItem.locator('[data-test="item-quantity"]')).toHaveText('1');

  // --- Checkout ---
  await page.locator('[data-test="checkout"]').click();
  await expect(page).toHaveURL(/checkout-step-one\.html$/);
  await expect(page.locator('[data-test="firstName"]')).toBeVisible();

  await page.locator('[data-test="firstName"]').fill('Amol');
  await page.locator('[data-test="lastName"]').fill('Chimadage');
  await page.locator('[data-test="postalCode"]').fill('411001');
  await page.locator('[data-test="continue"]').click();

  // --- Verify order overview ---
  await expect(page).toHaveURL(/checkout-step-two\.html$/);
  await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
  const overviewItem = page.locator('.cart_item', {
    has: page.locator('[data-test="inventory-item-name"]', { hasText: 'Sauce Labs Backpack' }),
  });
  await expect(overviewItem).toHaveCount(1);
  await expect(page.locator('[data-test="subtotal-label"]')).toHaveText('Item total: $29.99');
  await expect(page.locator('[data-test="tax-label"]')).toHaveText('Tax: $2.40');
  await expect(page.locator('[data-test="total-label"]')).toHaveText('Total: $32.39');

  // --- Finish order ---
  await page.locator('[data-test="finish"]').click();

  // --- Verify successful order ---
  await expect(page).toHaveURL(/checkout-complete\.html$/);
  await expect(page.locator('[data-test="complete-header"]')).toHaveText('Thank you for your order!');
  await expect(page.locator('[data-test="complete-text"]')).toContainText('order has been dispatched');

  await page.locator('[data-test="back-to-products"]').click();
  await expect(page).toHaveURL(/inventory\.html$/);
  await expect(page.locator('.shopping_cart_badge')).toHaveCount(0);
});
