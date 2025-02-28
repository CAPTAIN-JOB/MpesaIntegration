import { config } from "dotenv";

// config({ path: `.env.{process.env.NODE_ENV || "development"}.local` });
config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

export const {
  DB_URI,
  PORT,
  NODE_ENV,
  SERVER_URL,
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_BASE_URL,
} = process.env;
