import express from "express";
import mongoose, { connect } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { PORT } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";
// import connectToDatabase from "./database/mongodb.js";

const app = express();

app.listen(PORT, async () => {
  console.log(`Mpesa integration is running on http://locahost:${PORT}`);
  await connectToDatabase();
});
