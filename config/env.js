import { config } from "dotenv";

// config({ path: `.env.{process.env.NODE_ENV || "development"}.local` });
config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

export const { DB_URI, PORT, NODE_ENV, SERVER_URL } = process.env;
