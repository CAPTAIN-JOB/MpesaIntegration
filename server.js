import express from "express";
import mongoose, { connect } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { PORT } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";
import paymentRoute from "./routes/stk-push.route.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello Welcome Home");
});

app.use("/api/v1/payment", paymentRoute);

app.listen(PORT, async () => {
  console.log(`Mpesa integration is running on http://localhost:${PORT}`);
  await connectToDatabase();
});
