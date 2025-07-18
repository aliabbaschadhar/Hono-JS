import mongoose from "mongoose";

export default async function dbConnect() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Connection string doesn't exists! ")
  }
  await mongoose.connect(String(process.env.MONGODB_URI))
  console.log("MongoDB connected Successfully...")
}