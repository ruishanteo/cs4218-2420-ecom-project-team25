// Admin Users Flow
import { test, expect } from "@playwright/test";
import { USER } from "../config/seed/seedDb";

const UPDATED_USER = {
  name: "John Doe",
  phone: "123456789102",
  address: "123 Main Street",
  password: "12345678",
};

async function fillInUserDetails(page, { name, phone, address, password }) {
  if (name) {
    await page.getByRole("textbox", { name: "Enter Your Name" }).click();
    await page.getByRole("textbox", { name: "Enter Your Name" }).fill(name);
  }

  if (password) {
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(password);
  }

  if (phone) {
    await page.getByRole("textbox", { name: "Enter Your Phone" }).click();
    await page.getByRole("textbox", { name: "Enter Your Phone" }).fill(phone);
  }

  if (address) {
    await page.getByRole("textbox", { name: "Enter Your Address" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill(address);
  }
}

async function resetUserDetails(page) {
  await fillInUserDetails(page, USER);
  await page.getByRole("button", { name: "UPDATE" }).click();
  await expect(page.getByText("Profile Updated Successfully")).toBeVisible();
}

// 1. Login as user and navigate to the profile page
// 2. Wait for the login success message to disappear
test.beforeEach(
  "Login as user and navigate to the profile page",
  async ({ page }) => {
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

    await page.getByRole("button", { name: USER.name }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.getByRole("link", { name: "Profile" }).click();

    // wait for the login success message to disappear
    await page.waitForSelector("text=Logged in successfully", {
      state: "hidden",
    });
  }
);

test("should display user profile details", async ({ page }) => {
  await expect(
    page.getByRole("textbox", { name: "Enter Your Name" })
  ).toHaveValue(USER.name);
  await expect(
    page.getByRole("textbox", { name: "Enter Your Email" })
  ).toHaveValue(USER.email);
  await expect(
    page.getByRole("textbox", { name: "Enter Your Phone" })
  ).toHaveValue(USER.phone);
  await expect(
    page.getByRole("textbox", { name: "Enter Your Address" })
  ).toHaveValue(USER.address);
});

// 1. Fill in the updated user details
// 2. Click the update button
// 3. Wait for the success message to appear
// 4. Logout the user
// 5. Login with the updated details
// 6. Navigate to the profile page
// 7. Check if the details are updated
test("should update profile successfully", async ({ page }) => {
  await fillInUserDetails(page, UPDATED_USER);
  await page.getByRole("button", { name: "UPDATE" }).click();

  await expect(page.getByText("Profile updated successfully")).toBeVisible();

  await expect(
    page.getByRole("textbox", { name: "Enter Your Name" })
  ).toHaveValue(UPDATED_USER.name);
  // orignal email address
  await expect(
    page.getByRole("textbox", { name: "Enter Your Email" })
  ).toHaveValue(USER.email);
  await expect(
    page.getByRole("textbox", { name: "Enter Your Password" })
  ).toHaveValue(UPDATED_USER.password);
  await expect(
    page.getByRole("textbox", { name: "Enter Your Phone" })
  ).toHaveValue(UPDATED_USER.phone);
  await expect(
    page.getByRole("textbox", { name: "Enter Your Address" })
  ).toHaveValue(UPDATED_USER.address);

  // check if navbar user is updated
  await expect(
    page.getByRole("button", { name: UPDATED_USER.name })
  ).toBeVisible();

  // logout user
  await page.getByRole("button", { name: UPDATED_USER.name }).click();
  await page.getByRole("link", { name: "Logout" }).click();

  // login with new details
  await page.getByRole("textbox", { name: "Enter Your Email" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill(USER.email);
  await page.getByRole("textbox", { name: "Enter Your Password" }).click();

  // checks if new password is updated
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(UPDATED_USER.password);
  await page.getByRole("button", { name: "LOGIN" }).click();

  await page.getByRole("button", { name: UPDATED_USER.name }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.getByRole("link", { name: "Profile" }).click();

  // check if the details are updated
  await expect(
    page.getByRole("textbox", { name: "Enter Your Name" })
  ).toHaveValue(UPDATED_USER.name);
  await expect(
    page.getByRole("textbox", { name: "Enter Your Phone" })
  ).toHaveValue(UPDATED_USER.phone);
  // orignal email address
  await expect(
    page.getByRole("textbox", { name: "Enter Your Email" })
  ).toHaveValue(USER.email);
  await expect(
    page.getByRole("textbox", { name: "Enter Your Address" })
  ).toHaveValue(UPDATED_USER.address);

  // reset user details
  resetUserDetails(page);
});

test("should show error message for password less than 6 chars", async ({
  page,
}) => {
  await fillInUserDetails(page, { password: "12345" });
  await page.getByRole("button", { name: "UPDATE" }).click();

  await expect(page.getByText("Password should be minimum 6")).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Password should be minimum 6 characters long"
  );
  // check that profile details are not updated
  await expect(
    page.getByRole("textbox", { name: "Enter Your Name" })
  ).toHaveValue(USER.name);
  await expect(
    page.getByRole("textbox", { name: "Enter Your Email" })
  ).toHaveValue(USER.email);
  await expect(
    page.getByRole("textbox", { name: "Enter Your Phone" })
  ).toHaveValue(USER.phone);
  await expect(
    page.getByRole("textbox", { name: "Enter Your Address" })
  ).toHaveValue(USER.address);
});

test("should redirect to login page if not logged in", async ({ page }) => {
  // logout
  await page.getByRole("button", { name: "User" }).click();
  await page.getByRole("link", { name: "Logout" }).click();
  // navigate to profile page
  await page.goto("/dashboard/user/profile");
  // check if redirected to login page
  await page.waitForURL("/login", {
    timeout: 5000,
  });
});
