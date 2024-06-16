import mongoose from "mongoose";
import User from "../models/user_model.js";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { channel } from "../config/mq.js";
import dotenv from "dotenv";

const env = dotenv.config().parsed;

class UserController {
  //* user list
  async getList(req, res) {
    try {
      const users = await User.find().select(" _id fullname email ");

      const usersList = users.map((user) => ({
        id: user._id,
        fullname: user.fullname,
        email: user.email,
      }));

      return res.status(StatusCodes.OK).json({
        status: true,
        message: ReasonPhrases.OK,
        data: usersList,
      });
    } catch (error) {
      return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: error.message,
      });
    }
  }

  //* user by id
  async getById(req, res) {
    try {
      if (!req.params.id) {
        throw { code: StatusCodes.BAD_REQUEST, message: "missing userId" };
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw { code: StatusCodes.BAD_REQUEST, message: "invalid userId" };
      }

      const user = await User.findById(mongoose.Types.ObjectId(req.params.id));
      if (!user) {
        throw { code: StatusCodes.NOT_FOUND, message: ReasonPhrases.NOT_FOUND };
      }

      return res.status(StatusCodes.OK).json({
        status: true,
        message: ReasonPhrases.OK,
        data: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
          position: user.position,
          phoneNumber: user.phoneNumber,
          imageUrl: user.imageUrl,
        },
      });
    } catch (error) {
      return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: error.message,
      });
    }
  }

  async getMyDetail(req, res) {
    try {
      if (!req.jwt.id) {
        throw { code: StatusCodes.BAD_REQUEST, message: "missing userId" };
      }

      if (!mongoose.Types.ObjectId.isValid(req.jwt.id)) {
        throw { code: StatusCodes.BAD_REQUEST, message: "invalid userId" };
      }

      const user = await User.findById(mongoose.Types.ObjectId(req.jwt.id));
      if (!user) {
        throw { code: StatusCodes.NOT_FOUND, message: ReasonPhrases.NOT_FOUND };
      }

      return res.status(StatusCodes.OK).json({
        status: true,
        message: ReasonPhrases.OK,
        data: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
          position: user.position,
          phoneNumber: user.phoneNumber,
          imageUrl: user.imageUrl,
        },
      });
    } catch (error) {
      return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: error.message,
      });
    }
  }

  //* update user by id
  async update(req, res) {
    try {
      if (!req.jwt.id) {
        throw { code: StatusCodes.BAD_REQUEST, message: "missing userId" };
      }

      if (!mongoose.Types.ObjectId.isValid(req.jwt.id)) {
        throw { code: StatusCodes.BAD_REQUEST, message: "invalid userId" };
      }

      const user = await User.findById(mongoose.Types.ObjectId(req.jwt.id));
      if (!user) {
        throw { code: StatusCodes.NOT_FOUND, message: ReasonPhrases.NOT_FOUND };
      }

      user.position = req.body.position;
      user.phoneNumber = req.body.phoneNumber;
      user.imageUrl = req.body.imageUrl;

      const updatedUser = await user.save();
      if (!updatedUser) {
        throw {
          code: StatusCodes.INTERNAL_SERVER_ERROR,
          message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        };
      }

      channel.sendToQueue(
        env.RABBITMQ_UPDATE_USER_TOPIC,
        Buffer.from(
          JSON.stringify({
            id: user._id,
            fullname: user.fullname,
            email: user.email,
            position: user.position,
            phoneNumber: user.phoneNumber,
            imageUrl: user.imageUrl,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: updatedUser.updatedAt,
            mqIssuedAt: new Date(),
          })
        )
      );
      return res.status(StatusCodes.OK).json({
        status: true,
        message: ReasonPhrases.OK,
        data: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
          position: user.position,
          phoneNumber: user.phoneNumber,
          imageUrl: user.imageUrl,
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

export default new UserController();
