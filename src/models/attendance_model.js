import mongoose from "mongoose";

const Schema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    checkInTime: {
      type: Date,
    },
    checkInDate: {
      type: Number,
    },
    checkOutTime: {
      type: Date,
    },
    checkOutDate: {
      type: Number,
    },
    workDuration: {
      type: String,
    },
    workMinutes: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["masuk", "pulang"],
      default: "masuk",
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

export default mongoose.model("Attendance", Schema);
