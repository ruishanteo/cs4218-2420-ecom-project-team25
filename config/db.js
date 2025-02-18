import mongoose from "mongoose";
import colors from "colors";

export const DB_STRINGS = {
  CONNECTION_SUCCESS: "Connected successfully to MongoDB".bgMagenta.white,
  CONNECTION_ERROR: "Error encountered while connecting to MongoDB".bgRed.white,
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(DB_STRINGS.CONNECTION_SUCCESS, conn.connection.host);
  } catch (error) {
    console.log(DB_STRINGS.CONNECTION_ERROR, error);
  }
};

export default connectDB;
