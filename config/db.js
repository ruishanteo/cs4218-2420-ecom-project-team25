import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import colors from "colors";

import { seedDb } from "./seed/seedDb.js";

export const DB_STRINGS = {
  CONNECTION_SUCCESS: "Connected successfully to MongoDB".bgMagenta.white,
  CONNECTION_ERROR: "Error encountered while connecting to MongoDB".bgRed.white,
};

let mongoServer;

const connectDB = async () => {
  try {
    let dbUri = process.env.MONGO_URL;

    if (process.env.USE_TEST_DB === "true") {
      console.log("🧪 Using in-memory MongoDB for testing...");
      mongoServer = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: "ecom-test",
        },
      });
      dbUri = mongoServer.getUri();
    }

    console.log(dbUri);

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
