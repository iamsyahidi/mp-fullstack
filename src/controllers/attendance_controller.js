import dayjs from "dayjs";
import mongoose from "mongoose";
import Attendance from "../models/attendance_model.js";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

class AttendanceController {
  async getMyList(req, res) {
    try {
      const attendances = await Attendance.find({ userId: req.jwt.id })
        .sort({ checkInTime: -1 })
        .select("_id checkInTime checkOutTime status workDuration workMinutes");

      const attendanceList = attendances.map((attendance) => ({
        id: attendance._id,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        status: attendance.status,
        workDuration: attendance.workDuration,
        workMinutes: attendance.workMinutes,
      }));

      return res.status(StatusCodes.OK).json({
        status: true,
        message: ReasonPhrases.OK,
        data: attendanceList,
      });
    } catch (error) {
      return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: error.message,
      });
    }
  }

  async create(req, res) {
    try {
      if (!req.body.checkInTime) {
        throw { code: StatusCodes.BAD_REQUEST, message: "missing checkInTime" };
      }
      if (!dayjs(req.body.checkInTime).isValid()) {
        throw { code: StatusCodes.BAD_REQUEST, message: "invalid checkInTime" };
      }

      const checkInDate = new Date(req.body.checkInTime);
      checkInDate.setHours(0, 0, 0, 0);
      const isCheckInExist = await Attendance.findOne({
        userId: req.jwt.id,
        checkInDate,
      });
      if (isCheckInExist) {
        throw {
          code: StatusCodes.BAD_REQUEST,
          message: "already check in for the day",
        };
      }

      const checkInTime = new Date(req.body.checkInTime);
      const attendance = await Attendance.create({
        userId: req.jwt.id,
        checkInTime,
        checkInDate,
        status: "masuk",
      });
      if (!attendance) {
        throw {
          code: StatusCodes.INTERNAL_SERVER_ERROR,
          message: "CHECK_IN_TIME_FAILED_TO_RECORD",
        };
      }

      return res.status(StatusCodes.OK).json({
        status: true,
        message: ReasonPhrases.OK,
        data: {
          id: attendance._id,
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          status: attendance.status,
        },
      });
    } catch (error) {
      return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      if (!req.params.id) {
        throw {
          code: StatusCodes.BAD_REQUEST,
          message: "missing id",
        };
      }
      if (!req.body.checkOutTime) {
        throw {
          code: StatusCodes.BAD_REQUEST,
          message: "missing checkOutTime",
        };
      }
      if (!dayjs(req.body.checkOutTime).isValid()) {
        throw {
          code: StatusCodes.BAD_REQUEST,
          message: "invalid checkOutTime",
        };
      }

      const attendance = await Attendance.findById({
        _id: req.params.id,
      });
      if (attendance.checkOutTime) {
        throw {
          code: StatusCodes.BAD_REQUEST,
          message: "already check out for the day",
        };
      }

      const checkInTime = new Date(attendance.checkInTime);
      const checkOutTime = new Date(req.body.checkOutTime);
      if (checkOutTime < checkInTime) {
        throw {
          code: StatusCodes.BAD_REQUEST,
          message: "invalid checkOutTime",
        };
      }

      // Calculate the time difference in milliseconds
      const timeDifference = checkOutTime.getTime() - checkInTime.getTime();

      // Convert time difference from milliseconds to minutes
      const totalMinutes = Math.floor(timeDifference / (1000 * 60));

      // Calculate hours and minutes
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const durationString = `${hours}h${minutes}m`;

      attendance.checkOutTime = checkOutTime;
      attendance.status = "pulang";
      attendance.workDuration = durationString;
      attendance.workMinutes = totalMinutes;
      attendance.checkOutDate = new Date(req.body.checkOutTime).setHours(
        0,
        0,
        0,
        0
      );

      const updateAttendance = await attendance.save();
      if (!updateAttendance) {
        throw {
          code: StatusCodes.INTERNAL_SERVER_ERROR,
          message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        };
      }

      return res.status(StatusCodes.OK).json({
        status: true,
        message: ReasonPhrases.OK,
        data: {
          id: attendance._id,
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          status: attendance.status,
          workDuration: attendance.workDuration,
          workMinutes: attendance.workMinutes,
        },
      });
    } catch (error) {
      return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: error.message,
      });
    }
  }

  async getListByUserId(req, res) {
    try {
      if (!req.params.userId) {
        throw { code: StatusCodes.BAD_REQUEST, message: "missing userId" };
      }
      if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
        throw { code: StatusCodes.BAD_REQUEST, message: "invalid userId" };
      }

      const attendances = await Attendance.find({ userId: req.params.userId });
      if (!attendances) {
        throw { code: StatusCodes.NOT_FOUND, message: ReasonPhrases.NOT_FOUND };
      }

      const attendanceList = attendances.map((attendance) => ({
        id: attendance._id,
        userId: attendance.userId,
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        checkInDate: attendance.checkInDate,
        checkOutTime: attendance.checkOutTime,
        checkOutDate: attendance.checkOutDate,
        checkOutDate: attendance.checkOutDate,
        workDuration: attendance.workDuration,
        workMinutes: attendance.workMinutes,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      }));

      return res.status(StatusCodes.OK).json({
        status: true,
        message: ReasonPhrases.OK,
        data: attendanceList,
      });
    } catch (error) {
      return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: error.message,
      });
    }
  }

  async getMyReport(req, res) {
    try {
      const currentDate = new Date();
      const firstDateOfCurrentMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );

      if (!dayjs(req.body.from).isValid()) {
        throw { code: StatusCodes.BAD_REQUEST, message: "invalid from" };
      }
      if (!dayjs(req.body.to).isValid()) {
        throw { code: StatusCodes.BAD_REQUEST, message: "invalid to" };
      }
      if (req.body.from > req.body.to) {
        throw { code: StatusCodes.BAD_REQUEST, message: "invalid param" };
      }

      console.log(
        firstDateOfCurrentMonth.setHours(0, 0, 0, 0),
        currentDate.setHours(0, 0, 0, 0)
      );
      console.log(dayjs(req.body.from).isValid(), dayjs(req.body.to).isValid());
      const attendances = await Attendance.find({
        userId: req.jwt.id,
        checkInDate: {
          $gte: req.body.from
            ? new Date(req.body.from).setHours(0, 0, 0, 0)
            : firstDateOfCurrentMonth.setHours(0, 0, 0, 0),
          $lte: req.body.to
            ? new Date(req.body.to).setHours(0, 0, 0, 0)
            : currentDate.setHours(0, 0, 0, 0),
        },
      })
        .sort({ checkInTime: -1 })
        .select("_id checkInTime checkOutTime status workDuration workMinutes");

      let totalWorkMinutes = 0;
      const attendanceList = attendances.map((attendance) => {
        const { workMinutes } = attendance;
        totalWorkMinutes += workMinutes;
        return {
          id: attendance._id,
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          status: attendance.status,
          workDuration: attendance.workDuration,
          workMinutes,
        };
      });

      // Calculate hours and minutes
      const hours = Math.floor(totalWorkMinutes / 60);
      const minutes = totalWorkMinutes % 60;
      const totalWorkDuration = `${hours}h${minutes}m`;

      return res.status(StatusCodes.OK).json({
        status: true,
        message: ReasonPhrases.OK,
        data: {
          list: attendanceList,
          totalWorkMinutes,
          totalWorkDuration,
          from: req.body.from ? req.body.from : firstDateOfCurrentMonth,
          to: req.body.to ? req.body.to : currentDate,
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

export default new AttendanceController();
