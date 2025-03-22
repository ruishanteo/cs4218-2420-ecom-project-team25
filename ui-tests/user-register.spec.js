
import { test, expect } from "@playwright/test";
import { USER } from "../config/seed/seedDb";

const NEW_USER = {
  name: "John Doe",
  email: "johndoe@email.com",
  password: "password",
  phone: "123456789102",
  address: "123 Main Street",
  dob: "2021-01-01",
  answer: "football"
};

async function fillInUserDetails(page, { name, email, password, phone, address, dob, answer}) {
  if (name) {
    await page.getByRole("textbox", { name: "Enter Your Name" }).click();
    await page.getByRole("textbox", { name: "Enter Your Name" }).fill(name);
  }


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
  if (dob) {
    await page.getByPlaceholder("Enter Your DOB").click();
    await page
      .getByPlaceholder("Enter Your DOB")
      .fill(dob);
  }
  if (answer) {
    await page.getByRole("textbox", { name: "What is Your Favorite Sport" }).click();
    await page
      .getByRole("textbox", { name: "What is Your Favorite Sport" })
      .fill(answer);
  }
}

test.describe('Register Page', () => {

test.beforeEach(
    "Navigate to the register page",
    async ({ page }) => {
      await page.goto(".");
      await page.getByRole("link", { name: "Register" }).click();
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

    test('should show validation error for missing name', async ({ page }) => {
        await page.fill('input[placeholder="Enter Your Email "]', 'johndoe@email.com');
        await page.fill('input[placeholder="Enter Your Password"]', 'password123');
        await page.fill('input[placeholder="Enter Your Phone"]', '1234567890');
        await page.fill('input[placeholder="Enter Your Address"]', '123 Street');
        await page.fill('input[placeholder="Enter Your DOB"]', '2000-01-01');
        await page.fill('input[placeholder="What is Your Favorite Sport"]', 'football');

        await page.getByRole("button", { name: "REGISTER" }).click();

        await expect(page.getByRole("status")).toContainText(
            "Name is required!"
          );
    });

    test('should show validation error for missing email', async ({ page }) => {
        await page.fill('input[placeholder="Enter Your Name"]', 'John Doe');
        await page.fill('input[placeholder="Enter Your Password"]', 'password123');
        await page.fill('input[placeholder="Enter Your Phone"]', '1234567890');
        await page.fill('input[placeholder="Enter Your Address"]', '123 Street');
        await page.fill('input[placeholder="Enter Your DOB"]', '2000-01-01');
        await page.fill('input[placeholder="What is Your Favorite Sport"]', 'football');

        await page.getByRole("button", { name: "REGISTER" }).click();

        await expect(page.getByText('Email is required!')).toBeVisible();
    });

    test('should show validation error for missing password', async ({ page }) => {
        await page.fill('input[placeholder="Enter Your Name"]', 'John Doe');
    await page.fill('input[placeholder="Enter Your Email "]', 'johndoe@email.com');
        await page.fill('input[placeholder="Enter Your Phone"]', '1234567890');
        await page.fill('input[placeholder="Enter Your Address"]', '123 Street');
        await page.fill('input[placeholder="Enter Your DOB"]', '2000-01-01');
        await page.fill('input[placeholder="What is Your Favorite Sport"]', 'football');

        await page.getByRole("button", { name: "REGISTER" }).click();
        
        await expect(page.getByText('Password is required!')).toBeVisible();
    });
    test('should show validation error for missing phone', async ({ page }) => {
        await page.fill('input[placeholder="Enter Your Name"]', 'John Doe');
    await page.fill('input[placeholder="Enter Your Email "]', 'johndoe@email.com');
        await page.fill('input[placeholder="Enter Your Password"]', 'password123');
        await page.fill('input[placeholder="Enter Your Address"]', '123 Street');
        await page.fill('input[placeholder="Enter Your DOB"]', '2000-01-01');
        await page.fill('input[placeholder="What is Your Favorite Sport"]', 'football');
        
        await page.getByRole("button", { name: "REGISTER" }).click();

        await expect(page.getByText('Phone is required!')).toBeVisible();
    });

    test('should show validation error for missing address', async ({ page }) => {
        await page.fill('input[placeholder="Enter Your Name"]', 'John Doe');
    await page.fill('input[placeholder="Enter Your Email "]', 'johndoe@email.com');
        await page.fill('input[placeholder="Enter Your Password"]', 'password123');
        await page.fill('input[placeholder="Enter Your Phone"]', '1234567890');
        await page.fill('input[placeholder="Enter Your DOB"]', '2000-01-01');
        await page.fill('input[placeholder="What is Your Favorite Sport"]', 'football');

        await page.getByRole("button", { name: "REGISTER" }).click();

        await expect(page.getByText('Address is required!')).toBeVisible();
    });

    test('should show validation error for missing date of birth', async ({ page }) => {
        await page.fill('input[placeholder="Enter Your Name"]', 'John Doe');
    await page.fill('input[placeholder="Enter Your Email "]', 'johndoe@email.com');
        await page.fill('input[placeholder="Enter Your Password"]', 'password123');
        await page.fill('input[placeholder="Enter Your Phone"]', '1234567890');
        await page.fill('input[placeholder="Enter Your Address"]', '123 Street');
        await page.fill('input[placeholder="What is Your Favorite Sport"]', 'football');

        await page.getByRole("button", { name: "REGISTER" }).click();

        await expect(page.getByText('Date of Birth is required!')).toBeVisible();
    });

    test('should show validation error for missing answer', async ({ page }) => {
        await page.fill('input[placeholder="Enter Your Name"]', 'John Doe');
    await page.fill('input[placeholder="Enter Your Email "]', 'johndoe@email.com');
        await page.fill('input[placeholder="Enter Your Password"]', 'password123');
        await page.fill('input[placeholder="Enter Your Phone"]', '1234567890');
        await page.fill('input[placeholder="Enter Your Address"]', '123 Street');
        await page.fill('input[placeholder="Enter Your DOB"]', '2000-01-01');

        await page.getByRole("button", { name: "REGISTER" }).click();
        
        await expect(page.getByText('Answer is required!')).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
        await fillInUserDetails(page, NEW_USER);
        await page.fill('input[placeholder="Enter Your Email "]', 'invalid-email');

        await page.getByRole("button", { name: "REGISTER" }).click();

        await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    });

    test('should register successfully with valid inputs', async ({ page }) => {
        await fillInUserDetails(page, NEW_USER);

        await page.getByRole("button", { name: "REGISTER" }).click();
        // await expect(page).toHaveURL(/\/login$/);

        await page.waitForURL("/login", {
            timeout: 5000,
          });
    });
});

