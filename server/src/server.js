import app from "./app.js";
import "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { redis } from "./config/redis.js";
import { User } from "./modules/auth/models/user.model.js";
import { ensureHardCodedAdmin } from "./modules/auth/Admin.enroll.js";
import stripe from "./config/stripe.js";
import dotenv from "dotenv";
dotenv.config();

console.log(process.env.PORT);
const PORT = process.env.PORT || 5000;



async function startServer() {


  await connectDatabase();

  await redis.ping();
  console.log("Redis ready");

  await ensureHardCodedAdmin();

  try {
      await stripe.balance.retrieve();
      console.log("Stripe ready");
  } catch (error) {
      console.error("Stripe connection failed:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});