// // src/config/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "devdb";
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const CONNECTION_LIMIT = process.env.DB_CONN_LIMIT ? Number(process.env.DB_CONN_LIMIT) : 10;

// create a pool
export const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
  waitForConnections: true,
  connectionLimit: CONNECTION_LIMIT,
  queueLimit: 0,
});

// optional: simple test/connect function (keeps same exported name `connectDB`)
export const connectDB = async () => {
  try {
    // test a simple query
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    console.log("✅ MySQL connected (mysql2) — test query result:", rows);
  } catch (error) {
    console.error("❌ DB connection failed (mysql2):", error);
    // rethrow if you want your server to crash on DB failure:
    // throw error;
  }
};
