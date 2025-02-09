import JWT from "jsonwebtoken";
import userModel from "../models/userModel";
import { isAdmin, requireSignIn } from "./authMiddleware";

// to mock -> jwt, usermodel findbyid
jest.mock("jsonwebtoken");
jest.mock("../models/userModel");

describe("requireSignIn authMiddlware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {
        authorization: "Bearer token",
      },
    };
    mockRes = {}; // doesnt use res
    mockNext = jest.fn(); // mock the next fn to verify if it is called
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should set req.user and call next() if token is valid", async () => {
    const mockDecodedId = { _id: "user1" };
    JWT.verify.mockReturnValueOnce(mockDecodedId);

    await requireSignIn(mockReq, mockRes, mockNext);

    expect(JWT.verify).toHaveBeenCalledWith(
      "Bearer token",
      process.env.JWT_SECRET
    );
    expect(mockReq.user).toEqual(mockDecodedId);
    expect(mockNext).toHaveBeenCalled();
  });

  it("should log an error if token is invalid", async () => {
    const mockError = new Error("Invalid token");
    JWT.verify.mockImplementationOnce(() => {
      throw mockError;
    });
    // spy on console.log
    const consoleLogSpy = jest.spyOn(console, "log");

    await requireSignIn(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
    consoleLogSpy.mockRestore();
  });
});

describe("isAdmin authMiddlware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockNext = jest.fn(); // mock the next fn to test if it is called
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // mock userModel.findById
  // user.role == 1 is admin

  it("should call next() if user is admin", async () => {
    const mockAdminId = "admin1";
    mockReq = {
      user: {
        _id: mockAdminId,
      },
    };
    const mockAdmin = {
      role: 1,
      _id: mockAdminId,
    };
    userModel.findById.mockResolvedValueOnce(mockAdmin);

    await isAdmin(mockReq, mockRes, mockNext);

    expect(userModel.findById).toHaveBeenCalledWith(mockAdminId);
    expect(mockNext).toHaveBeenCalled();
  });

  it("should return a 401 error if user is not admin", async () => {
    const mockUserId = "user1";
    mockReq = {
      user: {
        _id: mockUserId,
      },
    };

    const mockUser = {
      role: 0,
      _id: mockUserId,
    };
    const consoleLogSpy = jest.spyOn(console, "log");
    userModel.findById.mockResolvedValueOnce(mockUser);

    await isAdmin(mockReq, mockRes, mockNext);

    expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: false,
      message: "UnAuthorized Access",
    });
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it("should return a 401 error if error in finding user", async () => {
    const mockUserId = "user1";
    mockReq = {
      user: {
        _id: mockUserId,
      },
    };
    userModel.findById.mockRejectedValueOnce("error");
    const consoleLogSpy = jest.spyOn(console, "log");

    await isAdmin(mockReq, mockRes, mockNext);

    expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: false,
      error: "error",
      message: "Error in admin middleware",
    });

    consoleLogSpy.mockRestore();
  });
});
