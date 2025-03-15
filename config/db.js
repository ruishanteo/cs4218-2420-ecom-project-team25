import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import colors from "colors";
import { execSync } from "child_process";

import { seedDb } from "./seed/seedDb.js";

export const DB_STRINGS = {
  CONNECTION_SUCCESS: "Connected successfully to MongoDB".bgMagenta.white,
  CONNECTION_ERROR: "Error encountered while connecting to MongoDB".bgRed.white,
};

const checkAndKillProcess = (port) => {
  try {
    const result = execSync(`lsof -i :${port} -t`).toString().trim();
    if (result) {
      console.log(`🛑 Killing process on port ${port}...`);
      execSync(`kill -9 ${result}`);
    }
  } catch (error) {
    // No process found, meaning the port is free
  }
};

const connectDB = async () => {
  try {
    let dbUri = process.env.MONGO_URL;

    if (process.env.USE_TEST_DB === "true") {
      console.log("🛑 Checking if an old in-memory MongoDB is running...");
      checkAndKillProcess(27017);
      console.log("🧪 Starting a fresh in-memory MongoDB...");
      const mongoServer = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: "ecom-test",
        },
      });

      dbUri = mongoServer.getUri();
    }

    const conn = await mongoose.connect(dbUri);

    if (process.env.USE_TEST_DB === "true") {
      console.log("🧪 Seeding in-memory MongoDB for testing...");
      await seedDb();
    }

    console.log(DB_STRINGS.CONNECTION_SUCCESS, conn.connection.host);
  } catch (error) {
    console.log(DB_STRINGS.CONNECTION_ERROR, error);
  }
};

export default connectDB;
