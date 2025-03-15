import { test, expect } from "@playwright/test";

import { ADMIN_USER, CATEGORIES, PRODUCTS } from "../config/seed/seedDb";

const PRODUCT = {
  name: "Dream Long Book",
  description: "Book about dreaming too long",
  price: "12",
  quantity: "10",
  shipping: "Yes",
  category: CATEGORIES[0],
};

const UPDATED_PRODUCT = {
  name: "Dream Long Book Dream Long",
  description: "Book about dreaming really really long",
  price: "20",
  quantity: "50",
  shipping: "No",
  category: CATEGORIES[1],
};

async function verifyProductDetails(page, product) {
  await expect(page.getByRole("textbox", { name: "Product name" })).toHaveValue(
    product.name
  );
  await expect(
    page.getByRole("textbox", { name: "Product description" })
  ).toHaveValue(product.description);
  await expect(
    page.getByRole("spinbutton", { name: "Product price" })
  ).toHaveValue(product.price.toString());
  await expect(
    page.getByRole("spinbutton", { name: "Product quantity" })
  ).toHaveValue(product.quantity.toString());
  await expect(page.getByText(product.shipping)).toBeVisible();
  await expect(page.getByTitle(product.category)).toBeVisible();
}

async function fillInProductDetails(
  page,
  category = "",
  photo = "",
  name = "",
  description = "",
  price = "",
  quantity = "",
  shipping = ""
) {
  if (category) {
    await page.getByRole("combobox", { name: "Select a category" }).click();
    await page.getByTitle(category).locator("div").click();
  }

  if (photo) {
    await page.getByText("Upload Photo").click();
    await page.getByText("Upload Photo").setInputFiles(photo);
  }

  if (name) {
    await page.getByRole("textbox", { name: "Enter name" }).click();
    await page.getByRole("textbox", { name: "Enter name" }).fill(name);
  }

  if (description) {
    await page.getByRole("textbox", { name: "Enter description" }).click();
    await page
      .getByRole("textbox", { name: "Enter description" })
      .fill(description);
  }

  if (price) {
    await page.getByRole("spinbutton", { name: "Enter price" }).click();
    await page.getByRole("spinbutton", { name: "Enter price" }).fill(price);
  }

  if (quantity) {
    await page.getByRole("spinbutton", { name: "Enter quantity" }).click();
    await page
      .getByRole("spinbutton", { name: "Enter quantity" })
      .fill(quantity);
  }

  if (shipping) {
    await page.getByRole("combobox", { name: "Select Shipping" }).click();
    await page.getByTitle(shipping).click();
  }
}

test.beforeEach(
  "Login as admin and navigate to admin dashboard",
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
  }
);

test("should create, update and delete product successfully", async ({
  page,
}) => {
  // Go to create product page
  await page.getByRole("link", { name: "Create Product" }).click();

  // Fill in the product details
  await fillInProductDetails(
    page,
    PRODUCT.category,
    "ui-tests/book.jpg",
    PRODUCT.name,
    PRODUCT.description,
    PRODUCT.price,
    PRODUCT.quantity,
    PRODUCT.shipping
  );

  // Click the create product button
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

  // Check for redirect to products page
  await expect(
    page.getByRole("heading", { name: "All Products List" })
  ).toBeVisible();

  // Go to the product page and verify the product has been created
  await expect(
    page.getByRole("heading", { name: "All Products List" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: PRODUCT.name })).toBeVisible();
  await page.getByRole("link", { name: "Dream Long Book Dream Long" }).click();
  await verifyProductDetails(page, PRODUCT);

  // Update the product
  await page.getByRole("textbox", { name: "Product name" }).click();
  await page
    .getByRole("textbox", { name: "Product name" })
    .fill(UPDATED_PRODUCT.name);
  await page.getByRole("textbox", { name: "Product description" }).click();
  await page
    .getByRole("textbox", { name: "Product description" })
    .fill(UPDATED_PRODUCT.description);
  await page.getByRole("spinbutton", { name: "Product price" }).click();
  await page
    .getByRole("spinbutton", { name: "Product price" })
    .fill(UPDATED_PRODUCT.price);
  await page.getByRole("spinbutton", { name: "Product quantity" }).click();
  await page
    .getByRole("spinbutton", { name: "Product quantity" })
    .fill(UPDATED_PRODUCT.quantity);
  await page.getByText(PRODUCT.shipping).click();
  await page.getByText(UPDATED_PRODUCT.shipping).click();
  await page.getByTitle(PRODUCT.category).click();
  await page.getByTitle(UPDATED_PRODUCT.category).locator("div").click();
  await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();

  // Verify the product has been updated
  await page.getByRole("link", { name: UPDATED_PRODUCT.name }).click();
  await verifyProductDetails(page, UPDATED_PRODUCT);

  // Delete the product
  page.once("dialog", async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept("Accept");
  });
  await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

  // Verify the product has been deleted
  await expect(
    page.getByRole("heading", { name: "All Products List" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: UPDATED_PRODUCT.name })
  ).not.toBeVisible();
});

test("should not delete product if cancel is clicked", async ({ page }) => {
  // Go to the product page and verify the product has been created
  await page.getByRole("link", { name: "Products" }).click();
  await expect(
    page.getByRole("heading", { name: "All Products List" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: PRODUCTS[0].name })
  ).toBeVisible();
  await page.getByRole("link", { name: PRODUCTS[0].name }).click();

  await verifyProductDetails(page, PRODUCTS[0]);

  // Delete the product but cancel the dialog
  page.once("dialog", async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

  // Verify the product has not been deleted
  await page.getByRole("link", { name: "Products" }).click();
  await expect(
    page.getByRole("link", { name: PRODUCTS[0].name })
  ).toBeVisible();
});

test("should not create product if required fields are empty", async ({
  page,
}) => {
  // Go to create product page
  await page.getByRole("link", { name: "Create Product" }).click();

  // Click the create product button
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

  // Verify the error message
  await expect(page.getByText("Something went wrong in")).toBeVisible();
});

test("should not create product if category is empty", async ({ page }) => {
  // Go to create product page
  await page.getByRole("link", { name: "Create Product" }).click();

  // Fill in the product details
  await fillInProductDetails(
    page,
    "",
    "ui-tests/book.jpg",
    PRODUCT.name,
    PRODUCT.description,
    PRODUCT.price,
    PRODUCT.quantity,
    PRODUCT.shipping
  );
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

  // Verify the error message
  await expect(page.getByText("Something went wrong in")).toBeVisible();
});

test("should not create product if name is empty", async ({ page }) => {
  // Go to create product page
  await page.getByRole("link", { name: "Create Product" }).click();

  // Fill in the product details
  await fillInProductDetails(
    page,
    PRODUCT.category,
    "ui-tests/book.jpg",
    "",
    PRODUCT.description,
    PRODUCT.price,
    PRODUCT.quantity,
    PRODUCT.shipping
  );
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

  // Verify the error message
  await expect(page.getByText("Something went wrong in")).toBeVisible();
});

test("should not create product if description is empty", async ({ page }) => {
  // Go to create product page
  await page.getByRole("link", { name: "Create Product" }).click();

  // Fill in the product details
  await fillInProductDetails(
    page,
    PRODUCT.category,
    "ui-tests/book.jpg",
    PRODUCT.name,
    "",
    PRODUCT.price,
    PRODUCT.quantity,
    PRODUCT.shipping
  );
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

  // Verify the error message
  await expect(page.getByText("Something went wrong in")).toBeVisible();
});

test("should not create product if price is empty", async ({ page }) => {
  // Go to create product page
  await page.getByRole("link", { name: "Create Product" }).click();

  // Fill in the product details
  await fillInProductDetails(
    page,
    PRODUCT.category,
    "ui-tests/book.jpg",
    PRODUCT.name,
    PRODUCT.description,
    "",
    PRODUCT.quantity,
    PRODUCT.shipping
  );
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

  // Verify the error message
  await expect(page.getByText("Something went wrong in")).toBeVisible();
});

test("should not create product if quantity is empty", async ({ page }) => {
  // Go to create product page
  await page.getByRole("link", { name: "Create Product" }).click();

  // Fill in the product details
  await fillInProductDetails(
    page,
    PRODUCT.category,
    "ui-tests/book.jpg",
    PRODUCT.name,
    PRODUCT.description,
    PRODUCT.price,
    "",
    PRODUCT.shipping
  );
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

  // Verify the error message
  await expect(page.getByText("Something went wrong in")).toBeVisible();
});

test("should not create product if shipping is empty", async ({ page }) => {
  // Go to create product page
  await page.getByRole("link", { name: "Create Product" }).click();

  // Fill in the product details
  await fillInProductDetails(
    page,
    PRODUCT.category,
    "ui-tests/book.jpg",
    PRODUCT.name,
    PRODUCT.description,
    PRODUCT.price,
    PRODUCT.quantity,
    ""
  );
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

  // Verify the error message
  await expect(page.getByText("Something went wrong in")).toBeVisible();
});

test("should still create product with no photo", async ({ page }) => {
  // Go to create product page
  await page.getByRole("link", { name: "Create Product" }).click();

  // Fill in the product details
  await fillInProductDetails(
    page,
    PRODUCT.category,
    "",
    PRODUCT.name,
    PRODUCT.description,
    PRODUCT.price,
    PRODUCT.quantity,
    PRODUCT.shipping
  );
  await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

  // Verify the product has been created
  await expect(
    page.getByRole("heading", { name: "All Products List" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: PRODUCT.name })).toBeVisible();
});
