import { ReasonPhrases, StatusCodes } from "http-status-codes";
import fs from "fs";
import path from "path";

class UploadController {
  async upload(req, res) {
    try {
      if (!req.file) {
        throw { code: StatusCodes.BAD_REQUEST, message: "missing file" };
      }

      // File info
      const fileInfo = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        uploadPath: req.file.path,
        size: req.file.size,
      };

      return res.status(StatusCodes.CREATED).json({
        status: true,
        message: ReasonPhrases.CREATED,
        data: fileInfo,
      });
    } catch (error) {
      return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: error.message,
      });
    }
  }

  async getFile(req, res) {
    try {
      if (!req.params.filename) {
        throw { code: StatusCodes.BAD_REQUEST, message: "missing filename" };
      }

      const { filename } = req.params;
      // Resolve the current directory path
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const filePath = path.join(__dirname, "../public", filename);

      // Check if the file exists
      if (fs.existsSync(filePath)) {
        // Stream the file to the client
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        return;
      } else {
        throw { code: StatusCodes.NOT_FOUND, message: ReasonPhrases.NOT_FOUND };
      }
    } catch (error) {
      return res.status(error.code || StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: error.message,
      });
    }
  }
}

export default new UploadController();
