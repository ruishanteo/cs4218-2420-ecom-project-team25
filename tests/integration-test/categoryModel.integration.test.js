import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

import JWT from "jsonwebtoken";
import categoryModel from "../../models/categoryModel.js";
import userModel from "../../models/userModel";

jest.mock("../../config/db.js", () => jest.fn());

describe("Category Model Integration Tests", () => {
  let mongoServer;
  let admin;
  let user;
  let adminToken;
  let userToken;
  const { JWT_SECRET: originalJwtSecret } = process.env;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    process.env.JWT_SECRET = "jwt_secret";

    // Create sample user (admin)
    admin = await userModel.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "password",
      phone: "1234567890",
      address: "1234th St, San Francisco, CA",
      answer: "John",
      role: 1, // Admin user
    });

    // Create sample user
    user = await userModel.create({
      name: "Sample User",
      email: "user@example.com",
      password: "password",
      phone: "1234567890",
      address: "1234th St, San Francisco, CA",
      answer: "John",
    });

    // Generate JWT token
    adminToken = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    userToken = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
  });

  afterEach(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    await categoryModel.deleteMany();
    await userModel.deleteMany();
  });

  it("should create a category successfully", async () => {
    const categoryData = { name: "Technology", slug: "technology" };
    const category = await categoryModel.create(categoryData);

    expect(category).toBeDefined();
    expect(category.name).toBe(categoryData.name);
    expect(category.slug).toBe(categoryData.slug);
  });

  it("should not create a category without a name", async () => {
    const categoryData = { slug: "technology" };

    await categoryModel.create(categoryData).catch((error) => {
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.name).toBeDefined();
      expect(error.errors.name.message).toBe("Path `name` is required.");
    });
  });

  it("should not create a category with a duplicate name", async () => {
    const categoryData = { name: "Technology", slug: "technology" };
    await categoryModel.create(categoryData);

    const duplicateCategoryData = { name: "Technology", slug: "tech" };

    await categoryModel.create(duplicateCategoryData).catch((error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain("duplicate key error");
    });
  });

  it("should create a category with a lowercase slug", async () => {
    const categoryData = { name: "Science", slug: "SCIENCE" };
    const category = await categoryModel.create(categoryData);

    expect(category.slug).toBe("science");
  });

  it("should update a category successfully", async () => {
    const categoryData = { name: "Technology", slug: "technology" };
    const category = await categoryModel.create(categoryData);

    const updatedCategory = await categoryModel.findByIdAndUpdate(
      category._id,
      { name: "Tech", slug: "tech" },
      { new: true }
    );

    expect(updatedCategory).toBeDefined();
    expect(updatedCategory.name).toBe("Tech");
    expect(updatedCategory.slug).toBe("tech");
  });

  it("should delete a category successfully", async () => {
    const categoryData = { name: "Technology", slug: "technology" };
    const category = await categoryModel.create(categoryData);

    await categoryModel.findByIdAndDelete(category._id);

    const deletedCategory = await categoryModel.findById(category._id);
    expect(deletedCategory).toBeNull();
  });
});
