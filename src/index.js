import express from "express";
import dotenv from "dotenv";
import routes from "./routes/routes.js";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "development") {
  app.use(morgan("combined"));
}

app.use(helmet());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.use(
  cors({
    origin: "*",
  })
);

app.use("/", routes);

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}...`);
});

process.on("unhandledRejection", (reason, promise) => {
  console.err("Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.err("Unhandled Exception:", err);
  process.exit(1);
});
