import { test, expect } from "@playwright/test";

import { ADMIN_USER } from "../config/seed/seedDb";

/**
 * Test Plan:
 * - Login as admin and navigate to admin dashboard
 * - Create a category
 * - Verify the category has been created
 * - Update the category
 * - Verify the category has been updated
 * - Delete the category
 * - Verify the category has been deleted
 *
 * - Test for error messages when category is empty
 */

const NEW_CATEGORY = "New Category";
const EDIT_CATEGORY = "Edit Category";

async function verifyCategoryDetails(page, category) {
  await expect(
    page.getByRole("cell", { name: category.name, exact: true })
  ).toBeVisible();
}

test.beforeEach(
  "Login as admin and navigate to admin dashboard and Manage Category page",
  async ({ page }) => {
    console.log(`Running ${test.info().title}`);
    await page.goto(".");
    await page.getByRole("link", { name: "Login" }).click();
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(ADMIN_USER.email);
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(ADMIN_USER.password);
    await page.getByRole("button", { name: "LOGIN" }).click();

    await page.getByRole("button", { name: ADMIN_USER.name }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();

    // Manage category page
    await page.getByRole("link", { name: "Create Category" }).click();
    await expect(
      page.getByRole("heading", { name: "Manage Category" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Name" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Actions" })
    ).toBeVisible();
  }
);

test("should create, update and delete category successfully", async ({
  page,
}) => {
  // Create category
  await page.getByRole("textbox", { name: "Enter new category" }).click();
  await page
    .getByRole("textbox", { name: "Enter new category" })
    .fill(NEW_CATEGORY);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(
    page
      .locator("div")
      .filter({ hasText: /^Category created successfully$/ })
      .nth(2)
  ).toBeVisible();
  await verifyCategoryDetails(page, { name: NEW_CATEGORY });

  // Update category
  await page
    .getByRole("button", { name: "update New Category category" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Enter new category" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Enter new category" })
    .fill(EDIT_CATEGORY);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Submit" })
    .click();
  await expect(
    page
      .locator("div")
      .filter({ hasText: /^Category updated successfully$/ })
      .nth(2)
  ).toBeVisible();
  await verifyCategoryDetails(page, { name: EDIT_CATEGORY });

  // Delete category
  await page
    .getByRole("button", { name: "delete Edit Category category" })
    .click();
  await expect(
    page
      .locator("div")
      .filter({ hasText: /^Category deleted successfully$/ })
      .nth(2)
  ).toBeVisible();

  // Verify the category has been deleted
  await expect(
    page.getByRole("cell", { name: EDIT_CATEGORY })
  ).not.toBeVisible();
});

test("should not create category if name is empty", async ({ page }) => {
  await page.getByRole("textbox", { name: "Enter new category" }).click();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(
    page
      .locator("div")
      .filter({ hasText: /^Something went wrong in creating category$/ })
      .nth(2)
  ).toBeVisible();
});
