import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import connectDB, { DB_STRINGS } from "./db";
import { seedDb } from "./seed/seedDb";
import { execSync } from "child_process";

jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  model: jest.fn(),
  save: jest.fn(),
  connect: jest.fn(),
}));
jest.mock("mongodb-memory-server", () => ({
  MongoMemoryServer: {
    create: jest.fn(),
  },
}));
jest.mock("./seed/seedDb");
jest.mock("child_process", () => ({
  execSync: jest.fn(),
}));

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
    jest.clearAllMocks();
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
    expect(seedDb).not.toHaveBeenCalled();
    expect(execSync).not.toHaveBeenCalled(); // Ensure process killing is not attempted
    expect(MongoMemoryServer.create).not.toHaveBeenCalled(); // Ensure no memory server is started
  });

  it("should kill existing process and start MongoMemoryServer when USE_TEST_DB is true", async () => {
    process.env.USE_TEST_DB = "true";
    const mockMongoMemoryServer = {
      getUri: jest.fn().mockReturnValue("mongodb://localhost:27017/in-memory"),
      stop: jest.fn(),
    };
    execSync.mockReturnValueOnce("1234"); // Mock process lookup
    MongoMemoryServer.create.mockResolvedValueOnce(mockMongoMemoryServer);
    mongoose.connect.mockResolvedValueOnce({
      connection: { host: "test-host" },
    });

    await connectDB();

    expect(execSync).toHaveBeenCalledWith("lsof -i :27017 -t"); // Check if process lookup is performed
    expect(execSync).toHaveBeenCalledWith(expect.stringMatching(/kill -9 \d+/)); // Ensure process kill command runs
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "🛑 Checking if an old in-memory MongoDB is running..."
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "🧪 Starting a fresh in-memory MongoDB..."
    );
    expect(MongoMemoryServer.create).toHaveBeenCalled();
    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/in-memory"
    );
    expect(seedDb).toHaveBeenCalled();
  });

  it("should handle connection errors gracefully", async () => {
    const mockError = new Error("Connection error");
    mongoose.connect.mockRejectedValueOnce(mockError);

    await connectDB();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      DB_STRINGS.CONNECTION_ERROR,
      mockError
    );
  });

  it("should not attempt to kill process if no existing MongoDB is running with no error thrown", async () => {
    process.env.USE_TEST_DB = "true";
    execSync.mockImplementationOnce(() => {
      throw new Error("No process found");
    });

    const mockMongoMemoryServer = {
      getUri: jest.fn().mockReturnValue("mongodb://localhost:27017/in-memory"),
      stop: jest.fn(),
    };

    MongoMemoryServer.create.mockResolvedValueOnce(mockMongoMemoryServer);
    mongoose.connect.mockResolvedValueOnce({
      connection: { host: "test-host" },
    });

    await connectDB();

    expect(execSync).toHaveBeenCalledWith("lsof -i :27017 -t");
    expect(execSync).not.toHaveBeenCalledWith(
      expect.stringMatching(/kill -9 \d+/)
    ); // Ensure kill command wasn't called
    expect(MongoMemoryServer.create).toHaveBeenCalled();
    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/in-memory"
    );
  });

  it("should not attempt to kill process if no existing MongoDB is running with no error thrown", async () => {
    process.env.USE_TEST_DB = "true";
    execSync.mockReturnValueOnce("");

    const mockMongoMemoryServer = {
      getUri: jest.fn().mockReturnValue("mongodb://localhost:27017/in-memory"),
      stop: jest.fn(),
    };
    MongoMemoryServer.create.mockResolvedValueOnce(mockMongoMemoryServer);
    mongoose.connect.mockResolvedValueOnce({
      connection: { host: "test-host" },
    });

    await connectDB();

    expect(execSync).toHaveBeenCalledWith("lsof -i :27017 -t");
    expect(execSync).not.toHaveBeenCalledWith(
      expect.stringMatching(/kill -9 \d+/)
    ); // Ensure kill command wasn't called
    expect(MongoMemoryServer.create).toHaveBeenCalled();
    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/in-memory"
    );
  });
});
