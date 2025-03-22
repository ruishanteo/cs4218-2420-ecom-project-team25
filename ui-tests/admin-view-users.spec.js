import { test, expect } from "@playwright/test";
import { ADMIN_USER, USER } from "../config/seed/seedDb";

// Test Flow
// 1. Login as admin
// 2. Navigate to the users page
// 3. Check if the table is displayed
// 4. Check if the table has one row
// 5. New user registers
// 6. Admin navigates to the users page
// 7. Check if the table has two rows
// 8. Check if the new user is displayed in the table

test.beforeEach(
  "Login as admin and navigate to the users page",
  async ({ page }) => {
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
  }
);

test("should display all users", async ({ page }) => {
  // Navigate to the users page
  await page.getByRole("button", { name: ADMIN_USER.name }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.getByRole("link", { name: "Users" }).click();

  // ensure table headers exist
  await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Email" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Phone" })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Address" })
  ).toBeVisible();

  await page.waitForSelector("table");
  const users = await page.$$("tbody tr");
  expect(users.length).toBe(1);
  await expect(
    page.getByTestId(`user-display-item-${users.length - 1}`)
  ).toContainText(USER.name);
  await expect(
    page.getByTestId(`user-display-item-${users.length - 1}`)
  ).toContainText(USER.email);
  await expect(
    page.getByTestId(`user-display-item-${users.length - 1}`)
  ).toContainText(USER.phone);
  await expect(
    page.getByTestId(`user-display-item-${users.length - 1}`)
  ).toContainText(USER.address);
});

// new user registers
// close new user session
// admin navigates to the users page
// check if the table has two rows with the new user
test("should add new user and display new user in users page", async ({
  page,
  browser,
}) => {
  const newUser = {
    name: "New User",
    email: "new@email.com",
    password: "password",
    phone: "1234567890",
    address: "New Address",
    answer: "New Answer",
    DOB: "1990-03-16",
  };

  // start a separate broser context for the new user
  const newUserContext = await browser.newContext();
  const newUserPage = await newUserContext.newPage();

  // Register new user
  await newUserPage.goto(".");
  await newUserPage.getByRole("link", { name: "Register" }).click();
  await newUserPage.getByRole("textbox", { name: "Enter Your Name" }).click();
  await newUserPage
    .getByRole("textbox", { name: "Enter Your Name" })
    .fill(newUser.name);
  await newUserPage.getByRole("textbox", { name: "Enter Your Email" }).click();
  await newUserPage
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill(newUser.email);
  await newUserPage
    .getByRole("textbox", { name: "Enter Your Password" })
    .click();
  await newUserPage
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(newUser.password);
  await newUserPage.getByRole("textbox", { name: "Enter Your Phone" }).click();
  await newUserPage
    .getByRole("textbox", { name: "Enter Your Phone" })
    .fill(newUser.phone);
  await newUserPage
    .getByRole("textbox", { name: "Enter Your Address" })
    .click();
  await newUserPage
    .getByRole("textbox", { name: "Enter Your Address" })
    .fill(newUser.address);
  await newUserPage.getByPlaceholder("Enter Your DOB").fill(newUser.DOB);
  await newUserPage
    .getByRole("textbox", { name: "What is Your Favorite Sport" })
    .click();
  await newUserPage
    .getByRole("textbox", { name: "What is Your Favorite Sport" })
    .fill(newUser.answer);
  await newUserPage.getByRole("button", { name: "REGISTER" }).click();

  // close new user session
  await newUserPage.close();
  await newUserContext.close();

  // admin navigates to the users page
  await page.getByRole("button", { name: ADMIN_USER.name }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.getByRole("link", { name: "Users" }).click();

  // check if the table has two rows with the new user
  await page.waitForSelector("table");
  const users = await page.$$("tbody tr");
  expect(users.length).toBe(2);
  await expect(
    page.getByTestId(`user-display-item-${users.length - 1}`)
  ).toContainText(newUser.name);
  await expect(
    page.getByTestId(`user-display-item-${users.length - 1}`)
  ).toContainText(newUser.email);
  await expect(
    page.getByTestId(`user-display-item-${users.length - 1}`)
  ).toContainText(newUser.phone);
  await expect(
    page.getByTestId(`user-display-item-${users.length - 1}`)
  ).toContainText(newUser.address);
});

test("should redirect to login page if not logged in", async ({ page }) => {
  // logout
  await page.getByRole("button", { name: ADMIN_USER.name }).click();
  await page.getByRole("link", { name: "Logout" }).click();

  // navigate to users page
  await page.goto("/dashboard/admin/users");
  // check if redirected to login page
  await page.waitForURL("http://localhost:3000/login", {
    timeout: 5000,
  });
});

test("should redirect to login if not an admin", async ({ page }) => {
  // login as user
  await page.goto(".");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Enter Your Email" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill(USER.email);
  await page.getByRole("textbox", { name: "Enter Your Password" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(USER.password);
  await page.getByRole("button", { name: "LOGIN" }).click();

  // navigate to users page
  await page.goto("/dashboard/admin/users");
  // check if redirected to login page
  await page.waitForURL("http://localhost:3000/login", {
    timeout: 5000,
  });
});
