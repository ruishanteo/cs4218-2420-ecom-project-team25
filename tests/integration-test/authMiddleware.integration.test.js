import JWT from "jsonwebtoken";
import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import orderModel from "../../models/orderModel";
import categoryModel from "../../models/categoryModel";
import productModel from "../../models/productModel";
import userModel from "../../models/userModel";

jest.mock("../../config/db.js", () => jest.fn());

describe("authMiddleware Integration Tests", () => {
  let mongoServer;
  let admin;
  let user;
  let adminToken;
  let userToken;
  let userOrder;
  let product;
  let category;
  const { JWT_SECRET: originalJwtSecret } = process.env;

  let mockPhoto;

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

    // Create sample category
    category = await categoryModel.create({
      name: "Sample Category",
      slug: "sample-category",
    });

    // Create sample product
    product = await productModel.create({
      name: "Sample Product",
      slug: "sample-product",
      description: "Sample Description",
      price: 100,
      quantity: 10,
      category: category._id,
      photo: "sample.jpg",
    });

    // Create sample order by user
    userOrder = await orderModel.create({
      buyer: user._id,
      products: [product._id],
      status: "Shipped",
      payment: {
        id: "100",
        status: "paid",
        amount: 100,
      },
    });

    mockPhoto = {
      data: {
        data: [1, 2, 3, 4], // Mock binary data as an array
        type: "Buffer",
      },
      contentType: "image/png", // The mock content type
    };
  });

  afterEach(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    await orderModel.deleteMany();
    await categoryModel.deleteMany();
    await productModel.deleteMany();
    await userModel.deleteMany();
  });

  // AUTH ROUTES
  // testing requireSignIn
  describe("with authRoutes", () => {
    const BASE_URL = "/api/v1/auth";

    // ADMIN-AUTH
    test("admin-auth: should deny access for a valid user token", async () => {
      const response = await request(app)
        .get(`${BASE_URL}/admin-auth`)
        .set("Authorization", userToken);
      expect(response.status).toBe(401);
    });

    test("admin-auth: should allow access for a valid admin token", async () => {
      const response = await request(app)
        .get(`${BASE_URL}/admin-auth`)
        .set("Authorization", adminToken);
      expect(response.status).toBe(200);
    });

    test("admin-auth: should deny access for missing token", async () => {
      const response = await request(app).get(`${BASE_URL}/admin-auth`);
      expect(response.status).toBe(401);
    });

    // PROFILE (similar to USER-AUTH ROUTE)
    test("profile: should allow access for a valid user token", async () => {
      const response = await request(app)
        .put(`${BASE_URL}/profile`)
        .set("Authorization", userToken)
        .send({
          name: "Updated User",
          password: "password",
          phone: "1234567890199",
          address: "1234th St, San Francisco, CALIFORNIA",
        });
      expect(response.status).toBe(200);
    });

    test("profile: should deny access for missing token", async () => {
      const response = await request(app).put(`${BASE_URL}/profile`).send({
        name: "Updated User",
        password: "password",
        phone: "1234567890199",
        address: "1234th St, San Francisco, CALIFORNIA",
      });
      expect(response.status).toBe(401);
    });

    // ALL-USERS
    test("all-users: should deny access for a valid user token", async () => {
      const response = await request(app)
        .get(`${BASE_URL}/all-users`)
        .set("Authorization", userToken);
      expect(response.status).toBe(401);
    });

    test("all-users: should allow access for a valid admin token", async () => {
      const response = await request(app)
        .get(`${BASE_URL}/all-users`)
        .set("Authorization", adminToken);
      expect(response.status).toBe(200);
    });

    test("all-users: should deny access for missing token", async () => {
      const response = await request(app).get(`${BASE_URL}/all-users`);
      expect(response.status).toBe(401);
    });
  });

  // ORDER ROUTES
  describe("with orderRoutes", () => {
    const BASE_URL = "/api/v1/order";

    // test 401 error of requiresignin
    test("get-orders: should deny access for invalid user token", async () => {
      const response = await request(app)
        .get(`${BASE_URL}/orders`)
        .set("Authorization", "invalid");
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Error in requireSignIn middleware");
    });

    // GET-ORDERS
    test("get-orders: should deny access for a missing token", async () => {
      const response = await request(app).get(`${BASE_URL}/orders`);
      expect(response.status).toBe(401);
    });

    test("get-orders: should allow access for a valid user token", async () => {
      const response = await request(app)
        .get(`${BASE_URL}/orders`)
        .set("Authorization", userToken);
      expect(response.status).toBe(200);
    });

    // UPDATE-ORDER (similar to ALL-ORDERS)
    test("order-status: should deny access for a missing token", async () => {
      const response = await request(app).put(
        `${BASE_URL}/order-status/${userOrder._id}`
      );
      expect(response.status).toBe(401);
    });

    test("order-status: should allow access for a valid admin token", async () => {
      const response = await request(app)
        .put(`${BASE_URL}/order-status/${userOrder._id}`)
        .set("Authorization", adminToken);
      expect(response.status).toBe(200);
    });

    test("order-status: should deny access for a valid user token", async () => {
      const response = await request(app)
        .put(`${BASE_URL}/order-status/${userOrder._id}`)
        .set("Authorization", userToken);
      expect(response.status).toBe(401);
    });
  });

  // PRODUCT ROUTES
  describe("with productRoutes", () => {
    const BASE_URL = "/api/v1/product";

    // CREATE-PRODUCT
    test("create-product: should deny access for a missing token", async () => {
      const response = await request(app).post(`${BASE_URL}/create-product`);
      expect(response.status).toBe(401);
    });

    test("create-product: should allow access for a valid admin token", async () => {
      const response = await request(app)
        .post(`${BASE_URL}/create-product`)
        .set("Authorization", adminToken)
        .field("name", "Another Product")
        .field("description", "Another Description")
        .field("price", "110")
        .field("quantity", "15")
        .field("category", category._id.toString())
        .attach("photo", Buffer.from(mockPhoto.data.data), {
          filename: "mock-image.png",
          contentType: mockPhoto.contentType,
        });

      expect(response.status).toBe(201);
    });

    test("create-product: should deny access for a valid user token", async () => {
      const response = await request(app)
        .post(`${BASE_URL}/create-product`)
        .set("Authorization", userToken);
      expect(response.status).toBe(401);
    });

    // UPDATE-PRODUCT (similar to CREATE-PRODUCT)
    test("update-product: should deny access for a missing token", async () => {
      const response = await request(app).put(
        `${BASE_URL}/update-product/${product._id}`
      );
      expect(response.status).toBe(401);
    });

    test("update-product: should allow access for a valid admin token", async () => {
      const response = await request(app)
        .put(`${BASE_URL}/update-product/${product._id}`)
        .set("Authorization", adminToken)
        .set("Authorization", adminToken)
        .field("name", "Updated Product")
        .field("description", "Updated Description")
        .field("price", "111")
        .field("quantity", "20")
        .field("category", category._id.toString())
        .attach("photo", Buffer.from(mockPhoto.data.data), {
          filename: "mock-image.png",
          contentType: mockPhoto.contentType,
        });
      expect(response.status).toBe(201);
    });

    test("update-product: should deny access for a valid user token", async () => {
      const response = await request(app)
        .put(`${BASE_URL}/update-product/${product._id}`)
        .set("Authorization", userToken);
      expect(response.status).toBe(401);
    });

    // DELETE-PRODUCT
    test("delete-product: should deny access for a missing token", async () => {
      const response = await request(app).delete(
        `${BASE_URL}/delete-product/${product._id}`
      );
      expect(response.status).toBe(401);
    });

    test("delete-product: should allow access for a valid admin token", async () => {
      const response = await request(app)
        .delete(`${BASE_URL}/delete-product/${product._id}`)
        .set("Authorization", adminToken);
      expect(response.status).toBe(200);
    });

    test("delete-product: should deny access for a valid user token", async () => {
      const response = await request(app)
        .delete(`${BASE_URL}/delete-product/${product._id}`)
        .set("Authorization", userToken);
      expect(response.status).toBe(401);
    });

    // PAYMENT
    test("payment: should deny access for a missing token", async () => {
      const response = await request(app)
        .post(`${BASE_URL}/braintree/payment`)
        .send({
          nonce: "fake-nonce",
          cart: [{ price: 10 }, { price: 20 }],
        });
      expect(response.status).toBe(401);
    });

    test("payment: should allow access for a valid user token", async () => {
      const response = await request(app)
        .post(`${BASE_URL}/braintree/payment`)
        .set("Authorization", userToken)
        .send({
          nonce: "fake-nonce",
          cart: [product],
        });
      expect(response.status).toBe(200);
    });
  });

  // CATEGORY ROUTES
  describe("with categoryRoutes", () => {
    const BASE_URL = "/api/v1/category";

    // CREATE-CATEGORY
    test("create-category: should deny access for a missing token", async () => {
      const response = await request(app).post(`${BASE_URL}/create-category`);
      expect(response.status).toBe(401);
    });

    test("create-category: should allow access for a valid admin token", async () => {
      const response = await request(app)
        .post(`${BASE_URL}/create-category`)
        .set("Authorization", adminToken)
        .send({
          name: "Another Category",
          slug: "another-category",
        });
      expect(response.status).toBe(201);
    });

    test("create-category: should deny access for a valid user token", async () => {
      const response = await request(app)
        .post(`${BASE_URL}/create-category`)
        .set("Authorization", userToken);
      expect(response.status).toBe(401);
    });

    // UPDATE-CATEGORY (similar to CREATE-CATEGORY)
    test("update-category: should deny access for a missing token", async () => {
      const response = await request(app).put(
        `${BASE_URL}/update-category/${category._id}`
      );
      expect(response.status).toBe(401);
    });

    test("update-category: should allow access for a valid admin token", async () => {
      const response = await request(app)
        .put(`${BASE_URL}/update-category/${category._id}`)
        .set("Authorization", adminToken)
        .send({
          name: "Updated Category",
          slug: "updated-category",
        });
      expect(response.status).toBe(200);
    });

    test("update-category: should deny access for a valid user token", async () => {
      const response = await request(app)
        .put(`${BASE_URL}/update-category/${category._id}`)
        .set("Authorization", userToken);
      expect(response.status).toBe(401);
    });

    // DELETE-CATEGORY
    test("delete-category: should deny access for a missing token", async () => {
      const response = await request(app).delete(
        `${BASE_URL}/delete-category/${category._id}`
      );
      expect(response.status).toBe(401);
    });

    test("delete-category: should allow access for a valid admin token", async () => {
      const response = await request(app)
        .delete(`${BASE_URL}/delete-category/${category._id}`)
        .set("Authorization", adminToken);
      expect(response.status).toBe(200);
    });

    test("delete-category: should deny access for a valid user token", async () => {
      const response = await request(app)
        .delete(`${BASE_URL}/delete-category/${category._id}`)
        .set("Authorization", userToken);
      expect(response.status).toBe(401);
    });
  });
});
