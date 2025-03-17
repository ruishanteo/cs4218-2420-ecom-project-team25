import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import JWT from "jsonwebtoken";
import app from "../../app";
import categoryModel from "../../models/categoryModel";
import slugify from "slugify";
import userModel from "../../models/userModel";

jest.mock("../../config/db.js", () => jest.fn());

describe("Category Controller Integration Tests", () => {
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

  it("POST /api/v1/category/create-category should create a new category successfully", async () => {
    const categoryData = { name: "Technology" };

    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send(categoryData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("new category created");
    expect(res.body.category).toHaveProperty("_id");
    expect(res.body.category.name).toBe(categoryData.name);
  });

  it("POST /api/v1/category/create-category should return an error if name is missing during category creation", async () => {
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Name is required");
  });

  it("POST /api/v1/category/create-category should return error if category already exists", async () => {
    const categoryData = { name: "Technology" };

    await categoryModel.create(categoryData);

    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", adminToken)
      .send(categoryData);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Category Already Exists");
  });

  it("POST /api/v1/category/create-category should return error if user is not an admin", async () => {
    const categoryData = { name: "Technology" };

    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", userToken)
      .send(categoryData);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("UnAuthorized Access");
  });

  it("PUT /api/v1/category/update-category should update an existing category", async () => {
    const categoryData = { name: "Technology" };
    const category = await categoryModel.create(categoryData);

    const updatedCategoryData = { name: "Tech" };

    const res = await request(app)
      .put(`/api/v1/category/update-category/${category._id}`)
      .set("Authorization", adminToken)
      .send(updatedCategoryData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Category Updated Successfully");
    expect(res.body.category.name).toBe(updatedCategoryData.name);
  });

  it("PUT /api/v1/category/update-category should return error when trying to update a category that already exists", async () => {
    const categoryData1 = { name: "Technology" };
    const categoryData2 = { name: "Tech" };

    await categoryModel.create(categoryData1);
    await categoryModel.create(categoryData2);

    const categoryToUpdate = await categoryModel.findOne({
      name: "Technology",
    });

    const res = await request(app)
      .put(`/api/v1/category/update-category/${categoryToUpdate._id}`)
      .set("Authorization", adminToken)
      .send({ name: "Tech" });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Category Already Exists");
  });

  it("PUT /api/v1/category/update-category should return error if user is not an admin", async () => {
    const categoryData = { name: "Technology" };
    const category = await categoryModel.create(categoryData);

    const updatedCategoryData = { name: "Tech" };

    const res = await request(app)
      .put(`/api/v1/category/update-category/${category._id}`)
      .set("Authorization", userToken)
      .send(updatedCategoryData);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("UnAuthorized Access");
  });

  it("GET /api/v1/category/get-category should get all categories", async () => {
    const categoryData1 = { name: "Technology" };
    const categoryData2 = { name: "Science" };

    await categoryModel.create(categoryData1);
    await categoryModel.create(categoryData2);

    const res = await request(app)
      .get("/api/v1/category/get-category")
      .set("Authorization", adminToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.length).toBe(2);
  });

  it("GET /api/v1/category/get-category should get all categories if user is not an admin", async () => {
    const categoryData1 = { name: "Technology" };
    const categoryData2 = { name: "Science" };

    await categoryModel.create(categoryData1);
    await categoryModel.create(categoryData2);

    const res = await request(app)
      .get("/api/v1/category/get-category")
      .set("Authorization", userToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.length).toBe(2);
  });

  it("GET /api/v1/category/single-category/:slug should get a single category by slug", async () => {
    const categoryData = { name: "Technology", slug: slugify("Technology") };
    const category = await categoryModel.create(categoryData);

    const res = await request(app)
      .get(`/api/v1/category/single-category/${category.slug}`)
      .set("Authorization", adminToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category.name).toBe(category.name);
  });

  it("GET /api/v1/category/single-category/:slug should return error if category not found by slug", async () => {
    const res = await request(app)
      .get("/api/v1/category/single-category/non-existing-slug")
      .set("Authorization", adminToken);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Category not found");
  });

  it("DELETE /api/v1/category/delete-category should delete a category", async () => {
    const categoryData = { name: "Technology" };
    const category = await categoryModel.create(categoryData);

    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${category._id}`)
      .set("Authorization", adminToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Category Deleted Successfully");

    const deletedCategory = await categoryModel.findById(category._id);
    expect(deletedCategory).toBeNull();
  });

  it("DELETE /api/v1/category/delete-category should return error if deleting a category that does not exist", async () => {
    const res = await request(app)
      .delete("/api/v1/category/delete-category/non-existing-id")
      .set("Authorization", adminToken);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("error while deleting category");
  });

  it("DELETE /api/v1/category/delete-category should return error if user is not an admin", async () => {
    const categoryData = { name: "Technology" };
    const category = await categoryModel.create(categoryData);

    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${category._id}`)
      .set("Authorization", userToken); // Non-admin token

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("UnAuthorized Access");
  });
});
