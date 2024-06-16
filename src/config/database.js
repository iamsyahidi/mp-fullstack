import dotenv from "dotenv";
import mongoose from "mongoose";

const env = dotenv.config().parsed;

mongoose.set("strictQuery", false);

const connection = async () => {
  return new Promise((resolve, reject) => {
    mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_NAME,
    });

    const conn = mongoose.connection;
    conn.on("error", (error) => {
      console.error("Connection error: ", error);
      reject(error);
    });
    conn.once("open", () => {
      console.log(`Connected to MongoDB, dbname: ${env.MONGODB_NAME}`);
      resolve();
    });
  });
};

export default connection;
