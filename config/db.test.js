import mongoose from "mongoose";

import connectDB, { DB_STRINGS } from "./db";

jest.mock("mongoose");

describe("connectDB", () => {
  let consoleLogSpy;
  let originalMongoUrl;
  const mockMongoUrl = "mongodb://localhost:27017/test";

  beforeEach(() => {
    originalMongoUrl = process.env.MONGO_URL;
    process.env.MONGO_URL = mockMongoUrl;
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.MONGO_URL = originalMongoUrl;
    consoleLogSpy.mockRestore();
    jest.resetModules();
  });

  it("should log success message on successful connection", async () => {
    const host = "localhost";
    mongoose.connect.mockResolvedValueOnce({
      connection: { host },
    });

    await connectDB();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      DB_STRINGS.CONNECTION_SUCCESS,
      host
    );
    expect(mongoose.connect).toHaveBeenCalledWith(mockMongoUrl);
  });

  it("should log error message on failed connection", async () => {
    const mockError = new Error("Connection error");
    mongoose.connect.mockRejectedValueOnce(mockError);

    await connectDB();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      DB_STRINGS.CONNECTION_ERROR,
      mockError
    );
    expect(mongoose.connect).toHaveBeenCalledWith(mockMongoUrl);
  });
});
