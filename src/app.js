import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import connection from "./config/database.js";
import apiRoute from "./routes/api.js";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { initRabbitMQ } from "./config/mq.js";
import cors from "cors";

const env = dotenv.config().parsed;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));
app.use(cors());

app.use("/", apiRoute);

app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ message: ReasonPhrases.NOT_FOUND });
});

connection()
  .then(() => {
    initRabbitMQ();
    app.listen(env.APP_PORT, env.APP_HOST, () => {
      console.log(`Server running on http://${env.APP_HOST}:${env.APP_PORT}`);
    });
  })
  .catch((error) => {
    process.exit(1);
  });
