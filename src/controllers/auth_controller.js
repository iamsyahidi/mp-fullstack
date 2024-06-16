import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import isEmailValid from "../utils/validator.js";
import User from "../models/user_model.js";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

const env = dotenv.config().parsed;

const generateAccessToken = async (payload) =>
  jsonwebtoken.sign(payload, env.JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
  });

const generateRefreshToken = async (payload) =>
  jsonwebtoken.sign(payload, env.JWT_REFRESH_TOKEN_SECRET, {
    expiresIn: env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
  });

class AuthController {
  async register(req, res) {
    try {
      if (!req.body.fullname) {
        throw { code: StatusCodes.BAD_REQUEST, message: "missing fullname" };
      }
      if (!req.body.email) {
        throw { code: StatusCodes.BAD_REQUEST, message: "missing email" };
      }
      if (!isEmailValid(req.body.email)) {
        throw { code: StatusCodes.BAD_REQUEST, message: "invalid email" };
      }
      if (!req.body.password) {
        throw { code: StatusCodes.BAD_REQUEST, message: "missing password" };
      }

      const isEmailExist = await User.findOne({ email: req.body.email });
      if (isEmailExist) {
        throw { code: StatusCodes.CONFLICT, message: "email already exists" };
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(req.body.password, salt);

      const user = await User.create({
        fullname: req.body.fullname,
        email: req.body.email,
        role: req.body.role,
        password: hash,
      });

      if (!user) {
        throw {
          code: StatusCodes.INTERNAL_SERVER_ERROR,
          message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        };
      }

      // generate token
      const payload = { id: user._id, role: user.role };
      const accessToken = await generateAccessToken(payload);
      const refreshToken = await generateRefreshToken(payload);

      return res.status(StatusCodes.CREATED).json({
        status: true,
        message: ReasonPhrases.CREATED,
        data: {
          fullname: user.fullname,
          role: user.role,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: error.message,
      });
    }
  }

  async login(req, res) {
    try {
      if (!req.body.email) {
        throw { code: StatusCodes.BAD_REQUEST, message: "missing email" };
      }
      if (!req.body.password) {
        throw { code: StatusCodes.BAD_REQUEST, message: "missing password" };
      }

      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        throw { code: StatusCodes.NOT_FOUND, message: ReasonPhrases.NOT_FOUND };
      }

      const isPasswordValid = await bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!isPasswordValid) {
        throw { code: StatusCodes.BAD_REQUEST, message: "invalid password" };
      }

      // generate token
      const payload = { id: user._id, role: user.role };
      const accessToken = await generateAccessToken(payload);
      const refreshToken = await generateRefreshToken(payload);

      return res.status(StatusCodes.OK).json({
        status: true,
        message: ReasonPhrases.OK,
        data: {
          fullname: user.fullname,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: error.message,
      });
    }
  }

  async refreshToken(req, res) {
    try {
      if (!req.body.refreshToken) {
        throw {
          code: StatusCodes.BAD_REQUEST,
          message: "missing refreshToken",
        };
      }

      // verify refresh token
      const verifyToken = await jsonwebtoken.verify(
        req.body.refreshToken,
        env.JWT_REFRESH_TOKEN_SECRET
      );

      // generate token
      const payload = { id: verifyToken.id, role: verifyToken.role };
      const accessToken = await generateAccessToken(payload);
      const refreshToken = await generateRefreshToken(payload);

      return res.status(StatusCodes.OK).json({
        status: true,
        message: ReasonPhrases.OK,
        data: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      // change error message
      const errorJwt = [
        "invalid signature",
        "jwt malformed",
        "jwt must be provided",
        "invalid token",
      ];
      if (error.message === "jwt expired") {
        error.message = "refresh token expired";
      } else if (errorJwt.includes(error.message)) {
        error.message = "invalid refresh token";
      }

      return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: error.message,
      });
    }
  }

  async updatePassword(req, res) {
    try {
      if (!req.body.oldPassword) {
        throw {
          code: StatusCodes.BAD_REQUEST,
          message: "missing oldPassword",
        };
      }

      if (!req.body.newPassword) {
        throw {
          code: StatusCodes.BAD_REQUEST,
          message: "missing newPassword",
        };
      }

      if (!mongoose.Types.ObjectId.isValid(req.jwt.id)) {
        throw { code: StatusCodes.BAD_REQUEST, message: "invalid user id" };
      }

      const user = await User.findById(mongoose.Types.ObjectId(req.jwt.id));
      if (!user) {
        throw { code: StatusCodes.NOT_FOUND, message: ReasonPhrases.NOT_FOUND };
      }

      const isPasswordValid = await bcrypt.compareSync(
        req.body.oldPassword,
        user.password
      );
      if (!isPasswordValid) {
        throw {
          code: StatusCodes.BAD_REQUEST,
          message: "invalid old password",
        };
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(req.body.newPassword, salt);

      user.password = hash;

      const updatedUser = await user.save();
      if (!updatedUser) {
        throw {
          code: StatusCodes.INTERNAL_SERVER_ERROR,
          message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        };
      }

      // generate token
      const payload = { id: user._id, role: user.role };
      const accessToken = await generateAccessToken(payload);
      const refreshToken = await generateRefreshToken(payload);

      return res.status(StatusCodes.OK).json({
        status: true,
        message: ReasonPhrases.OK,
        data: {
          fullname: user.fullname,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: error.message,
      });
    }
  }
}

export default new AuthController();
