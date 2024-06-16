import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

const env = dotenv.config().parsed;

const jwtAuth = () => async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      throw {
        code: StatusCodes.UNAUTHORIZED,
        message: ReasonPhrases.UNAUTHORIZED,
      };
    }

    // bearer token
    const token = req.headers.authorization.split(" ")[1];
    const verify = jsonwebtoken.verify(token, env.JWT_ACCESS_TOKEN_SECRET);

    req.jwt = verify;

    next();
  } catch (error) {
    const errorJwt = [
      "invalid signature",
      "jwt malformed",
      "jwt must be provided",
      "invalid token",
    ];

    if (error.message === "jwt expired") {
      error.code = StatusCodes.UNAUTHORIZED; // code expired or unauthorized
      error.message = "access token expired";
    } else if (errorJwt.includes(error.message)) {
      error.message = "invalid access token";
    }

    return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: error.message,
    });
  }
};

export default jwtAuth;
