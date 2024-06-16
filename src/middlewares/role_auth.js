import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

const env = dotenv.config().parsed;

const adminAuth = () => async (req, res, next) => {
  try {
    if (req.jwt.role !== "admin") {
      throw { code: StatusCodes.FORBIDDEN, message: ReasonPhrases.FORBIDDEN };
    }

    next();
  } catch (error) {
    return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: error.message,
    });
  }
};

export default adminAuth;
