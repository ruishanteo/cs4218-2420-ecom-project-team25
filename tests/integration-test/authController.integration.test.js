import request from "supertest";
import mongoose from "mongoose";
import { hashPassword } from "../../helpers/authHelper.js";
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

    // Create sample user (admin)
    admin = await userModel.create({
      name: "Admin User",
      email: "admin@example.com",
      password: await hashPassword("password"),
      phone: "1234567890",
      address: "1234th St, San Francisco, CA",
      answer: "John",
      role: 1, // Admin user
    });

    // Create sample user
    user = await userModel.create({
      name: "Sample User",
      email: "user@example.com",
      password: await hashPassword("password"),
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
    jest.clearAllMocks();
    await userModel.deleteMany();
  });

  // UPDATE PROFILE CONTROLLER
  describe("updateProfileController", () => {
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

    test("PUT /api/v1/auth/profile should update user's name only successfully", async () => {
      const res = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", userToken)
        .send({
          name: "Updated User",
        });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Profile Updated Successfully");
      expect(res.body.updatedUser.name).toBe("Updated User"); // only name is updated
      expect(res.body.updatedUser.email).toBe(user.email);
      expect(res.body.updatedUser.phone).toBe(user.phone);
      expect(res.body.updatedUser.address).toBe(user.address);
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
      const findMock = jest.spyOn(userModel, "findByIdAndUpdate").mockRejectedValue(new Error());

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

      findMock.mockRestore();
    });

    test("PUT /api/v1/auth/profile should return 400 error when password is less than 6 characters long", async () => {
      const res = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", userToken)
        .send({
          password: "pass",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Password should be minimum 6 characters long");
    });

    test("PUT /api/v1/auth/profile should return 404 when user does not exist", async () => {
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

      expect(res.status).toBe(404);
    });
  });

  // REGISTER CONTROLLER
  describe("registerController", () => {
    test("POST /api/v1/auth/register should register a new user successfully", async () => {
      const newUser = {
        name: "New User",
        email: "newuser@example.com",
        password: "password123",
        phone: "9876543210",
        address: "456 New Street, New York, NY",
        answer: "Smith"
      };

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("User Registered Successfully");
      expect(res.body.user.name).toBe(newUser.name);
      expect(res.body.user.email).toBe(newUser.email);
      // Password should be hashed
      expect(res.body.user.password).not.toBe(newUser.password);
    });

    test("POST /api/v1/auth/register should return 200 when email is already registered", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Duplicate User",
          email: "user@example.com", // Already exists from beforeEach
          password: "password123",
          phone: "9876543210",
          address: "456 New Street, New York, NY",
          answer: "Smith"
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Email is already registered, please log in");
    });

    test("POST /api/v1/auth/register should return error if name is missing", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "john@example.com",
          password: "password123",
          phone: "1234567890",
          address: "123 Street",
          answer: "Blue",
        });

      expect(res.body.error).toBe("Name is Required");
    });

    test("POST /api/v1/auth/register should return error if email is missing", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "John Doe",
          password: "password123",
          phone: "1234567890",
          address: "123 Street",
          answer: "Blue",
        });

      expect(res.body.message).toBe("Email is Required");
    });

    test("POST /api/v1/auth/register should return error if password is missing", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          address: "123 Street",
          answer: "Blue",
        });

      expect(res.body.message).toBe("Password is Required");
    });

    test("POST /api/v1/auth/register should return error if phone number is missing", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          address: "123 Street",
          answer: "Blue",
        });

      expect(res.body.message).toBe("Phone Number is Required");
    });

    test("POST /api/v1/auth/register should return error if address is missing", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          phone: "1234567890",
          answer: "Blue",
        });

      expect(res.body.message).toBe("Address is Required");
    });

    test("POST /api/v1/auth/register should return error if answer is missing", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          phone: "1234567890",
          address: "123 Street",
        });

      expect(res.body.message).toBe("Answer is Required");
    });

    test("POST /api/v1/auth/register should return 500 when database error occurs", async () => {
      const saveMock = jest.spyOn(userModel.prototype, "save").mockRejectedValue(new Error("Database error"));

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Error User",
          email: "error@example.com",
          password: "password123",
          phone: "9876543210",
          address: "456 New Street, New York, NY",
          answer: "Smith"
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Error in Registration");
      saveMock.mockRestore();
    });
  });

  // LOGIN CONTROLLER
  describe("loginController", () => {
    test("POST /api/v1/auth/login should login user successfully with correct credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "user@example.com",
          password: "password"
        });
    
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Logged in successfully");
      expect(res.body.user.email).toBe("user@example.com");
      expect(res.body.token).toBeDefined();
    });

    test("POST /api/v1/auth/login should return 404 when email is not registered", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password"
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Email is not registered");
    });

    test("POST /api/v1/auth/login should return error with invalid password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "user@example.com",
          password: "wrongpassword"
        });

      // Actual implementation returns 200 with success:false
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid Password");
    });

    test("POST /api/v1/auth/login should return 404 when email or password is missing", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "user@example.com"
          // Missing password
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid email or password");
    });

    test("POST /api/v1/auth/login should return 500 when database error occurs", async () => {
      const mockFindOne = jest.spyOn(userModel, "findOne").mockRejectedValue(new Error("Database error"));

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "user@example.com",
          password: "password"
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Error when logging in");
      mockFindOne.mockRestore();

    });
  });

  // FORGOT PASSWORD CONTROLLER
  describe("forgotPasswordController", () => {
    test("POST /api/v1/auth/forgot-password should reset password successfully", async () => {
      const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "user@example.com",
          answer: "John", // Set in beforeEach
          newPassword: "newpassword123"
        });

        console.log(res.body)

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Password Reset Successfully");
    });

    test("POST /api/v1/auth/forgot-password should return 404 with wrong email or answer", async () => {
      const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "user@example.com",
          answer: "WrongAnswer",
          newPassword: "newpassword123"
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Wrong Email Or Answer");
    });

    // Added test for non-existent user with given email
    test("POST /api/v1/auth/forgot-password should return 404 if user does not exist with the given email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "nonexistent@example.com",
          answer: "SomeAnswer",
          newPassword: "newPassword123"
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Wrong Email Or Answer");
    });

    test("POST /api/v1/auth/forgot-password should return 400 when required fields are missing", async () => {
      // Test missing email
      let res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          answer: "John",
          newPassword: "newpassword123"
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email is required");

      // Test missing answer
      res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "user@example.com",
          newPassword: "newpassword123"
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Answer is required");

      // Test missing new password
      res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "user@example.com",
          answer: "John"
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("New Password is required");
    });

    test("POST /api/v1/auth/forgot-password should return 500 when database error occurs", async () => {
      const findMock = jest.spyOn(userModel, "findByIdAndUpdate").mockRejectedValue(new Error("Database error"));

      const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "user@example.com",
          answer: "John",
          newPassword: "newpassword123"
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Something went wrong");

      findMock.mockRestore();
    });
  });

  // GET USERS CONTROLLER
  describe("getUsersController", () => {
    test("GET /api/v1/auth/users should return all regular users when admin is logged in", async () => {
      const res = await request(app)
        .get("/api/v1/auth/all-users")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("All Users");
      expect(Array.isArray(res.body.users)).toBe(true);
      // Should include one user (the non-admin user)
      expect(res.body.users.length).toBe(1);
      expect(res.body.users[0].email).toBe("user@example.com");
    });

    test("GET /api/v1/auth/users should return 401 when user is not logged in", async () => {
      const res = await request(app)
        .get("/api/v1/auth/all-users");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Error in requireSignIn middleware");
    });

    test("GET /api/v1/auth/users should return 401 when non-admin user tries to access", async () => {
      const res = await request(app)
        .get("/api/v1/auth/all-users")
        .set("Authorization", userToken);


      expect(res.status).toBe(401);
      expect(res.body.message).toBe("UnAuthorized Access");
    });

    test("GET /api/v1/auth/users should return 500 when database error occurs", async () => {
      const findMock = jest.spyOn(userModel, "find").mockRejectedValue(new Error("Database error"));

      const res = await request(app)
        .get("/api/v1/auth/all-users")
        .set("Authorization", adminToken);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Error while getting users");

      findMock.mockRestore();
    });
  });
});