import express from "express";
import dotenv from "dotenv";
import routes from "./routes/routes.js";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use("/", routes);
app.use(cors());

app.listen(PORT, () => {
  console.log("Listening on " + PORT + "...");
});
