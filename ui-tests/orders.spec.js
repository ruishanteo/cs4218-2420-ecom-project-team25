import { test, expect } from '@playwright/test';
import { USER, ADMIN_USER } from '../config/seed/seedDb';

test.beforeEach(async () => {});

test.afterEach(async () => {});

test('should be able to create and then modify the order status', async ({
  page,
}) => {
  // login as normal user
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

  // check the order page
  await page.getByRole('button', { name: 'User' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Orders' }).click();
  expect(page.getByRole('cell', { name: 'Not Processed' })).toBeVisible();
  await page.getByRole('button', { name: 'User' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();

  // login as admin user
  await page.goto('.');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
  await page
    .getByRole('textbox', { name: 'Enter Your Email' })
    .fill(ADMIN_USER.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page
    .getByRole('textbox', { name: 'Enter Your Password' })
    .fill(ADMIN_USER.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // check the order page
  await page.getByRole('button', { name: 'User' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Orders' }).click();
  await page.getByText('Not Processed').click();
  await page.getByTitle('Delivered').locator('div').click();
  expect(page.getByRole('cell', { name: 'Delivered' })).toBeVisible();
  await page.getByRole('button', { name: 'Admin User' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();

  // log back in as a user
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

  // check the order page
  await page.getByRole('button', { name: 'User' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Orders' }).click();
  expect(page.getByRole('cell', { name: 'Delivered' })).toBeVisible();
  expect(page.getByRole('cell', { name: 'Not Processed' })).not.toBeVisible();
});
