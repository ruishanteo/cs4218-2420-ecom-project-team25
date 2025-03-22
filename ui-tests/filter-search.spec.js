import { test, expect } from '@playwright/test';
import { USER } from '../config/seed/seedDb';

test.afterEach(async () => {});

test.beforeEach(async ({ page }) => {
  await page.goto('.');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
  await page
    .getByRole('textbox', { name: 'Enter Your Email' })
    .fill(USER.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page
    .getByRole('textbox', { name: 'Enter Your Password' })
    .fill(USER.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
});

test('category filter should work', async ({ page }) => {
  await page.goto('.');

  // assert that all the products are visible
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Laptop$1,000.00A laptop is a' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Novel$10.00A novel is a' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Phone$500.00A telephone, or' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Tshirt$20.00A T-shirt, or tee' })
      .nth(3)
  ).toBeVisible();

  // check that the search filter works properly
  await page.locator('label').filter({ hasText: 'Books' }).click();

  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Laptop$1,000.00A laptop is a' })
      .nth(3)
  ).not.toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Novel$10.00A novel is a' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Phone$500.00A telephone, or' })
      .nth(3)
  ).not.toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Tshirt$20.00A T-shirt, or tee' })
      .nth(3)
  ).not.toBeVisible();
});

test('price filter should work', async ({ page }) => {
  await page.goto('.');
  // assert that all the products are visible
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Laptop$1,000.00A laptop is a' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Novel$10.00A novel is a' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Phone$500.00A telephone, or' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Tshirt$20.00A T-shirt, or tee' })
      .nth(3)
  ).toBeVisible();

  // check that the monetary filter works properly
  await page.getByRole('radio', { name: '$20 to' }).check();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Laptop$1,000.00A laptop is a' })
      .nth(3)
  ).not.toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Novel$10.00A novel is a' })
      .nth(3)
  ).not.toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Phone$500.00A telephone, or' })
      .nth(3)
  ).not.toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Tshirt$20.00A T-shirt, or tee' })
      .nth(3)
  ).toBeVisible();
});

test('category and price filter should work', async ({ page }) => {
  await page.goto('.');

  // assert that all the products are visible
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Laptop$1,000.00A laptop is a' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Novel$10.00A novel is a' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Phone$500.00A telephone, or' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Tshirt$20.00A T-shirt, or tee' })
      .nth(3)
  ).toBeVisible();

  // check that the filters works properly
  await page.locator('label').filter({ hasText: 'Books' }).click();
  await page.getByRole('radio', { name: '$20 to' }).check();

  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Laptop$1,000.00A laptop is a' })
      .nth(3)
  ).not.toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Novel$10.00A novel is a' })
      .nth(3)
  ).not.toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Phone$500.00A telephone, or' })
      .nth(3)
  ).not.toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Tshirt$20.00A T-shirt, or tee' })
      .nth(3)
  ).not.toBeVisible();
});

test('reset filter should work', async ({ page }) => {
  await page.goto('.');

  // assert that all the products are visible
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Laptop$1,000.00A laptop is a' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Novel$10.00A novel is a' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Phone$500.00A telephone, or' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Tshirt$20.00A T-shirt, or tee' })
      .nth(3)
  ).toBeVisible();

  // check that the monetary filter works properly
  await page.getByRole('radio', { name: '$20 to' }).check();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Laptop$1,000.00A laptop is a' })
      .nth(3)
  ).not.toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Novel$10.00A novel is a' })
      .nth(3)
  ).not.toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Phone$500.00A telephone, or' })
      .nth(3)
  ).not.toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Tshirt$20.00A T-shirt, or tee' })
      .nth(3)
  ).toBeVisible();

  // reset the filters and check that they are reset
  await page.getByRole('button', { name: 'RESET FILTERS' }).click();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Laptop$1,000.00A laptop is a' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Novel$10.00A novel is a' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Phone$500.00A telephone, or' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Tshirt$20.00A T-shirt, or tee' })
      .nth(3)
  ).toBeVisible();
});

test('searching for existing products should return results', async ({
  page,
}) => {
  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('Phone');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(
    page
      .locator('div')
      .filter({
        hasText:
          /^PhoneA telephone, or phone, is a te\.\.\. \$ 500More DetailsADD TO CART$/,
      })
      .nth(1)
  ).toBeVisible();

  await expect(page.getByRole('img', { name: 'Phone' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Phone' })).toBeVisible();
  await expect(page.getByText('A telephone, or phone, is a')).toBeVisible();
  await expect(page.getByText('$')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'More Details' })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'ADD TO CART' })).toBeVisible();
});

test('searching for non-existing products should return no results', async ({
  page,
}) => {
  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page
    .getByRole('searchbox', { name: 'Search' })
    .fill('Something that does not exist at all');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(
    page.getByRole('heading', { name: 'No Products Found' })
  ).toBeVisible();
});

test('searching for blank name should not do anything', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Search' }).click();
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Laptop$1,000.00A laptop is a' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Novel$10.00A novel is a' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Phone$500.00A telephone, or' })
      .nth(3)
  ).toBeVisible();
  await expect(
    page
      .getByRole('main')
      .locator('div')
      .filter({ hasText: 'Tshirt$20.00A T-shirt, or tee' })
      .nth(3)
  ).toBeVisible();
});
