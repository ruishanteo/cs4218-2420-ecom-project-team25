// Admin Users Flow
import { test, expect } from "@playwright/test";
import { USER } from "../config/seed/seedDb";

async function fillInUserDetails(page, { email, password}) {
  if (email) {
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(email);
  }

  if (password) {
    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(password);
  }
}

test.describe('Login Page', () => {

test.beforeEach(
    "Navigate to the login page",
    async ({ page }) => {
      await page.goto(".");
      await page.getByRole("link", { name: "Login" }).click();
      // await page.getByRole("textbox", { name: "Enter Your Email" }).click();
      // await page
      //   .getByRole("textbox", { name: "Enter Your Email" })
      //   .fill(USER.email);
      // await page.getByRole("textbox", { name: "Enter Your Password" }).click();
      // await page
      //   .getByRole("textbox", { name: "Enter Your Password" })
      //   .fill(USER.password);
      // await page.getByRole("button", { name: "LOGIN" }).click();
  
      // await page.getByRole("button", { name: USER.name }).click();
      // await page.getByRole("link", { name: "Dashboard" }).click();
      // await page.getByRole("link", { name: "Profile" }).click();
  
      // // wait for the login success message to disappear
      // await page.waitForSelector("text=Logged in successfully", {
      //   state: "hidden",
      // });
    }
  );

    test('should show validation error for missing email', async ({ page }) => {
        await page.fill('input[placeholder="Enter Your Password"]', USER.password);

        await page.getByRole("button", { name: "LOGIN" }).click();
        
        await expect(page.getByText('Email is required!')).toBeVisible();
    });

    test('should show validation error for missing password', async ({ page }) => {

        await page.fill('input[placeholder="Enter Your Email"]', USER.email);

        await page.getByRole("button", { name: "LOGIN" }).click();

        await expect(page.getByRole("status")).toContainText(
            "Password is required!"
          );
    });

    test('should show validation error for invalid email', async ({ page }) => {
            await page.fill('input[placeholder="Enter Your Email"]', 'invalid-email');
            await page.fill('input[placeholder="Enter Your Password"]', 'password123');

            await page.getByRole("button", { name: "LOGIN" }).click();
    
            await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    });

    test('should show validation error for wrong email', async ({ page }) => {
        await fillInUserDetails(page, { email: 'wrongemail@wrong.com', password: USER.password });

        await page.getByRole("button", { name: "LOGIN" }).click();
        
        await expect(page.getByText('Something went wrong')).toBeVisible();
    });

    test('should show validation error for wrong password', async ({ page }) => {
        await fillInUserDetails(page, { email: USER.email, password: 'wrongpassword' });

        await page.getByRole("button", { name: "LOGIN" }).click();
        
        await expect(page.getByText('Invalid Password')).toBeVisible();
    });

    test('should redirect to forgot password when button is clicked', async ({ page }) => {
        await page.getByRole("button", { name: "Forgot Password" }).click();

        await page.waitForURL("/forgot-password", {
            timeout: 5000,
          });
    });

    test('should login successfully with valid inputs', async ({ page }) => {
        await fillInUserDetails(page, { email: USER.email, password: USER.password });

        await page.getByRole("button", { name: "LOGIN" }).click();


        await page.waitForURL("/", {
            timeout: 5000,
          });
    });
});

