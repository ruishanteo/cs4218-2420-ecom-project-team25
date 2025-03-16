import { test, expect } from "@playwright/test";

import { ADMIN_USER } from "../config/seed/seedDb";

test.beforeEach(async () => {});

test.afterEach(async () => {});

test("Example of admin user logging in and going to AdminDashboard", async ({
  page,
}) => {
  await page.goto("."); // Go to the home page
  await page.getByRole("link", { name: "Login" }).click(); // Click the login nav bar link

  await page.getByRole("textbox", { name: "Enter Your Email" }).click(); // Click the email field
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill(ADMIN_USER.email); // Fill in the email

  await page.getByRole("textbox", { name: "Enter Your Password" }).click(); // Click the password field
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(ADMIN_USER.password); // Fill in the password

  await page.getByRole("button", { name: "LOGIN" }).click(); // Click the login button

  await page.getByRole("button", { name: ADMIN_USER.name }).click(); // Click the nav bar button
  await page.getByRole("link", { name: "Dashboard" }).click(); // Click the dashboard dropdown link

  await expect(page.getByRole("main")).toContainText(
    `Admin Name : ${ADMIN_USER.name}`
  ); // Check if the admin name is displayed
});
