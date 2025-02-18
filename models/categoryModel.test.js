import Category from "./categoryModel";

const mockingoose = require("mockingoose");

describe("Category Model", () => {
  // Test: Save category with name (optional)
  it("should save a category with a name", async () => {
    const categoryData = { name: "Electronics", slug: "electronics" };

    mockingoose(Category).toReturn(categoryData, "save");

    const category = new Category({ name: "Electronics" });
    const savedCategory = await category.save();

    expect(savedCategory.name).toBe("Electronics");
    expect(savedCategory.slug).toBe("electronics");
  });

  // Test: Save category without a name (optional)
  it("should save a category without a name", async () => {
    const categoryData = { name: undefined, slug: undefined };

    mockingoose(Category).toReturn(categoryData, "save");

    const category = new Category();
    const savedCategory = await category.save();

    expect(savedCategory.name).toBeUndefined();
    expect(savedCategory.slug).toBeUndefined();
  });

  // Test: Slug should be lowercase by default
  it("should create a slug automatically in lowercase", async () => {
    const categoryData = { name: "Electronics", slug: "electronics" };

    mockingoose(Category).toReturn(categoryData, "save");

    const category = new Category({ name: "Electronics" });
    const savedCategory = await category.save();

    expect(savedCategory.slug).toBe("electronics");
  });

  // Test: Slug should be lowercase even if provided manually
  it("should save a provided slug in lowercase", async () => {
    const categoryData = { name: "Electronics", slug: "electronics" };

    mockingoose(Category).toReturn(categoryData, "save");

    const category = new Category({ name: "Electronics", slug: "ELECTRONICS" });
    const savedCategory = await category.save();

    expect(savedCategory.slug).toBe("electronics");
  });

  // Test: Invalid name type (should be a string)
  it("should not save a category with an invalid name type", async () => {
    mockingoose(Category).toReturn(new Error("Validation failed"), "save");

    const category = new Category({ name: 12345 });
    try {
      await category.save();
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.message).toBe("Validation failed");
    }
  });

  // Test: Invalid slug type (should be a string)
  it("should not save a category with an invalid slug type", async () => {
    mockingoose(Category).toReturn(new Error("Validation failed"), "save");

    const category = new Category({ name: "Books", slug: 12345 });
    try {
      await category.save();
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.message).toBe("Validation failed");
    }
  });
});
