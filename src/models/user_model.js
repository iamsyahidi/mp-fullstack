import mongoose from "mongoose";

const Schema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    position: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    role: {
      type: String,
      enum: ["employee", "admin"],
      default: "employee",
    },
    createdAt: {
      type: Number,
    },
    updatedAt: {
      type: Number,
    },
  },
  {
    timestamps: {
      currentTime: () => Math.floor(Date.now() / 1000),
    },
  }
);

export default mongoose.model("User", Schema);
