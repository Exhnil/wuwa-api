import express from "express";
import dotenv from "dotenv";
import routes from "./routes/routes.js";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import fs from "fs";
import path from "path";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = process.env.CORS ? process.env.CORS.split(",") : ["*"];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        const error = new Error("Not allowed by CORS")
        error.code = "CORS_FORBIDDEN"
        callback(error);
      }
    },
  }),
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 1200,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({
    name: "Wuwa API",
    status: "OK",
    docs: "/api",
    version: "1.0",
  });
});

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

const logFile = path.join(process.cwd(), "errors.log");

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error)
  }
  if (error.code === "PATH_TRAVERSAL") {
    return res.status(400).json({
      error: "Invalid path",
    });
  }
  if (error.code === "CORS_FORBIDDEN") {
    return res.status(403).json({
      error: "Forbidden"
    })
  }

  console.error(error.stack || error);
  const log = `[${new Date().toISOString()}] ${error.stack}\n`;
  fs.appendFile(logFile, log, (e) => {
    if (e) console.error("Failed to write log", e);
  });

  res.status(500).json({
    error:
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
