import JWT from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import userModel from "../../models/userModel";
import {
  loginController,
  updateProfileController,
  forgotPasswordController,
  registerController,
} from "../../controllers/authController";

jest.mock("../../config/db.js", () => jest.fn());

// focus is on the integration of the auth helper functions with the relevant controllers

describe("Auth Helper Integration Tests", () => {
  let mongoServer;
  let testUser;
  const TEST_PASSWORD = "password";
  const NEW_PASSWORD = "newpassword";
  const WRONG_PASSWORD = "wrongpassword";
  const TEST_USER_DATA = {
    name: "User",
    email: "user@email.com",
    password: TEST_PASSWORD,
    phone: "1234567890",
    address: "1234th St, San Francisco, CA",
    answer: "John",
  };

  const { JWT_SECRET: originalJwtSecret } = process.env;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    process.env.JWT_SECRET = "jwt_secret";
  });

  afterEach(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    await userModel.deleteMany();
  });

  // helper functions
  const createMockResponse = () => ({
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  });

  const registerTestUser = async () => {
    const req = { body: TEST_USER_DATA };
    const res = createMockResponse();

    await registerController(req, res);

    const responseData = res.send.mock.calls[0][0];
    testUser = responseData.user;
    expect(testUser).toBeDefined();
    return testUser;
  };

  const attemptLogin = async (email, password) => {
    const res = createMockResponse();
    await loginController({ body: { email, password } }, res);
    return res;
  };

  describe("password hashing and comparison with loginController", () => {
    it("should successfully compare the right password", async () => {
      // register a user (creates hashed password in DB)
      const user = await registerTestUser();

      // attempt login with correct password
      const res = await attemptLogin(user.email, TEST_PASSWORD);

      // verify successful login
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Logged in successfully",
        user: expect.objectContaining({
          email: user.email,
          name: user.name,
        }),
        token: expect.any(String),
      });
    });

    it("should return error when wrong password is provided", async () => {
      // Register a user
      const user = await registerTestUser();

      // Attempt login with wrong password
      const res = await attemptLogin(user.email, WRONG_PASSWORD);

      // Verify login rejection
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Password",
      });
    });
  });

  describe("password hashing and comparison with updateProfileController", () => {
    it("should successfully update and rehash password", async () => {
      // Register a user
      const user = await registerTestUser();

      // Update password
      const updateRes = createMockResponse();
      await updateProfileController(
        {
          user: { _id: user._id },
          body: { password: NEW_PASSWORD },
        },
        updateRes
      );

      // Verify login works with new password
      const loginRes = await attemptLogin(user.email, NEW_PASSWORD);
      expect(loginRes.status).toHaveBeenCalledWith(200);
      expect(loginRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Logged in successfully",
        })
      );
    });

    it("should return error when wrong password is provided", async () => {
      const user = await registerTestUser();

      // update password
      const updateRes = createMockResponse();
      await updateProfileController(
        {
          user: { _id: user._id },
          body: { password: NEW_PASSWORD },
        },
        updateRes
      );

      // attempt login with wrong password
      const loginRes = await attemptLogin(user.email, TEST_PASSWORD);
      expect(loginRes.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Password",
      });
    });
  });

  describe("password hashing and comparison with forgotPasswordController", () => {
    it("should successfully reset password", async () => {
      const user = await registerTestUser();

      const resetRes = createMockResponse();
      await forgotPasswordController(
        {
          body: {
            email: user.email,
            newPassword: NEW_PASSWORD,
            answer: user.answer,
          },
        },
        resetRes
      );

      // verify login works with new password
      const loginRes = await attemptLogin(user.email, NEW_PASSWORD);
      expect(loginRes.status).toHaveBeenCalledWith(200);
      expect(loginRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it("should return error when wrong password is provided", async () => {
      const user = await registerTestUser();

      const resetRes = createMockResponse();
      // change password with forgotPasswordController
      await forgotPasswordController(
        {
          body: {
            email: user.email,
            newPassword: NEW_PASSWORD,
            answer: user.answer,
          },
        },
        resetRes
      );

      // attempt login with wrong password
      const loginRes = await attemptLogin(user.email, WRONG_PASSWORD);
      expect(loginRes.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Password",
      });
    });
  });
});
