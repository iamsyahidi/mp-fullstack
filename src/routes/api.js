import express from "express";
import jwtAuth from "../middlewares/jwt_auth.js";
import adminAuth from "../middlewares/role_auth.js";
import AuthController from "../controllers/auth_controller.js";
import UserController from "../controllers/user_controller.js";
import AttendanceController from "../controllers/attendance_controller.js";
import UploadController from "../controllers/upload_controller.js";
import upload from "../config/uploader.js";

const route = express();

// auth
route.post("/auth/register", AuthController.register);
route.post("/auth/login", AuthController.login);
route.post("/auth/refresh-token", AuthController.refreshToken);
route.put("/auth/update-password", jwtAuth(), AuthController.updatePassword);

// user
route.get("/users", jwtAuth(), adminAuth(), UserController.getList);
route.get("/users/me", jwtAuth(), UserController.getMyDetail);
route.put("/users/me", jwtAuth(), UserController.update);
route.get("/users/:id", jwtAuth(), adminAuth(), UserController.getById);

// attendance
route.get("/attendances", jwtAuth(), AttendanceController.getMyList);
route.get("/attendances/reports", jwtAuth(), AttendanceController.getMyReport);
route.get(
  "/attendances/:userId",
  jwtAuth(),
  adminAuth(),
  AttendanceController.getListByUserId
);
route.post("/attendances", jwtAuth(), AttendanceController.create);
route.put("/attendances/:id", jwtAuth(), AttendanceController.update);

// upload
route.post(
  "/uploads",
  jwtAuth(),
  upload.single("file"),
  UploadController.upload
);
route.get("/uploads/:filename", jwtAuth(), UploadController.getFile);

export default route;
