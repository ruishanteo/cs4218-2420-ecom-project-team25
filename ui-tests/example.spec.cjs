const { test, expect } = require("@playwright/test");

test.beforeEach(async () => {});

test.afterEach(async () => {});

test("Example of admin user logging in and going to AdminDashboard", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Enter Your Email" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("admin@email.com");
  await page.getByRole("textbox", { name: "Enter Your Email" }).press("Tab");
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill("password");
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.getByRole("button", { name: "Admin User" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByRole("main")).toContainText("Admin Name : Admin User");
});
