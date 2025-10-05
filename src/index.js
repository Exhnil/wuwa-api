import express from "express";
import dotenv from "dotenv";
import routes from "./routes/routes.js";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "development") {
  app.use(morgan("combined"));
}

app.use(helmet());

app.use(cors());

app.use("/", routes);

const logFile = path.join(process.cwd(), "errors.log");

app.use((error, req, res, next) => {
  console.error(error.stack);
  const log = `[${new Date().toISOString()}] ${error.stack}\n`;
  fs.appendFile(logFile, log, (e) => {
    if (e) console.error("Failed to write log", e);
  });
  res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message,
  });
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}...`);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Unhandled Exception:", err);
  process.exit(1);
});
