import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import connectDB, { DB_STRINGS } from "./db";
import { seedDb } from "./seed/seedDb";

jest.mock("mongoose");
jest.mock("mongodb-memory-server", () => ({
  MongoMemoryServer: {
    create: jest.fn(),
  },
}));
jest.mock("./seed/seedDb");

describe("connectDB", () => {
  let consoleLogSpy;
  let originalMongoUrl;
  const originalUseTestDb = process.env.USE_TEST_DB;
  const mockMongoUrl = "mongodb://localhost:27017/test";

  beforeEach(() => {
    originalMongoUrl = process.env.MONGO_URL;
    process.env.USE_TEST_DB = originalUseTestDb;
    process.env.MONGO_URL = mockMongoUrl;
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.MONGO_URL = originalMongoUrl;
    consoleLogSpy.mockRestore();
    jest.resetModules();
  });

  it("should connect to MongoDB using MONGO_URL when USE_TEST_DB is false", async () => {
    process.env.USE_TEST_DB = "false";
    const host = "localhost";
    mongoose.connect.mockResolvedValueOnce({ connection: { host } });

    await connectDB();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      DB_STRINGS.CONNECTION_SUCCESS,
      host
    );
    expect(mongoose.connect).toHaveBeenCalledWith(mockMongoUrl);
    expect(seedDb).not.toHaveBeenCalled(); // Ensure seedDb isn't called
  });

  it("should start MongoMemoryServer and use its URI when USE_TEST_DB is true", async () => {
    process.env.USE_TEST_DB = "true";
    const mockMongoMemoryServer = {
      getUri: jest.fn().mockReturnValue("mongodb://localhost:27017/in-memory"),
      stop: jest.fn(),
    };

    MongoMemoryServer.create.mockResolvedValueOnce(mockMongoMemoryServer);
    mongoose.connect.mockResolvedValueOnce({
      connection: { host: "test-host" },
    });

    await connectDB();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "🧪 Using in-memory MongoDB for testing..."
    );
    expect(MongoMemoryServer.create).toHaveBeenCalled();
    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/in-memory"
    );
    expect(seedDb).toHaveBeenCalled(); // Ensure seedDb is called in test mode
  });

  it("should log error message on failed connection", async () => {
    const mockError = new Error("Connection error");
    mongoose.connect.mockRejectedValueOnce(mockError);

    await connectDB();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      DB_STRINGS.CONNECTION_ERROR,
      mockError
    );
  });
});
