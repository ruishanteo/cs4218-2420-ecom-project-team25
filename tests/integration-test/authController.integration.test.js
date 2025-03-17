import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import JWT from "jsonwebtoken";
import app from "../../app";
import userModel from "../../models/userModel";

jest.mock("../../config/db.js", () => jest.fn());

jest.mock("braintree", () => ({
  BraintreeGateway: jest.fn(() => {
    return {
      clientToken: {
        generate: jest.fn(),
      },
      transaction: {
        sale: jest.fn(),
      },
    };
  }),
  Environment: {
    Sandbox: "sandbox",
  },
}));

describe("Auth Controller Integration Tests", () => {
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
    await userModel.deleteMany();
  });

  // UPDATE PROFILE CONTROLLER
  test("PUT /api/v1/auth/profile should update user profile when user is signed in", async () => {
    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", userToken)
      .send({
        name: "Updated User",
        password: "password",
        phone: "1234567890199",
        address: "1234th St, San Francisco, CALIFORNIA",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Profile Updated Successfully");
    expect(res.body.updatedUser.name).toBe("Updated User");
  });

  test("PUT /api/v1/auth/profile should return 401 when user is not signed in", async () => {
    const res = await request(app).put("/api/v1/auth/profile").send({
      name: "Updated User",
      password: "password",
      phone: "1234567890",
      address: "1234th St, San Francisco, CA",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Error in requireSignIn middleware");
  });

  test("PUT /api/v1/auth/profile should return 500 when database error occurs", async () => {
    jest.spyOn(userModel, "findByIdAndUpdate").mockRejectedValue(new Error());

    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", userToken)
      .send({
        name: "Updated User",
        password: "password",
        phone: "1234567890",
        address: "1234th St, San Francisco, CA",
      });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Error While Updating Profile");
  });

  test("PUT /api/v1/auth/profile should return 400 error when password is less than 6 characters long", async () => {
    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", userToken)
      .send({
        password: "pass",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Password should be minimum 6 characters long");
  });

  test("PUT /api/v1/auth/profile should return 500 when user does not exist", async () => {
    // Create token with non-existent user ID
    const nonExistentId = new mongoose.Types.ObjectId();
    const invalidToken = JWT.sign(
      { _id: nonExistentId },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", invalidToken)
      .send({ name: "Updated User" });

    expect(res.status).toBe(500);
  });
});
