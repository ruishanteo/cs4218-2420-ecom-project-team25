import CategoryModel from "./categoryModel";

describe("Category Model", () => {
  it("should require the name field", async () => {
    const category = new CategoryModel({ slug: "example-slug" });

    try {
      await category.validate();
    } catch (error) {
      expect(error.errors.name).toBeDefined();
      expect(error.errors.name.message).toBe("Path `name` is required.");
    }
  });

  it("should lowercase the slug field automatically", async () => {
    const uppercaseSlug = "ELECTRONICS";
    const category = new CategoryModel({
      name: "Electronics",
      slug: uppercaseSlug,
    });

    await category.validate();
    expect(category.slug).toBe(uppercaseSlug.toLowerCase());
  });

  it("should pass validation if name and slug are correct", async () => {
    const category = new CategoryModel({
      name: "Valid Category",
      slug: "valid-slug",
    });

    await expect(category.validate()).resolves.not.toThrow();
  });
});
