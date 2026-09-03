import app from "./app.js";
import "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { redis } from "./config/redis.js";

import {venueRoutes} from './routes/venueRoutes.js';

// import { venueRoutes } from './modules/event/routes/venueRoutes.js';

// Use venue routes
app.use('/api', venueRoutes);
console.log(process.env.PORT);
const PORT = process.env.PORT || 5000;
async function startServer() {


await connectDatabase();

await redis.ping();
console.log("Redis ready");

  app.listen(PORT, "::", () => {
  console.log(`Server running on port ${PORT}`);
});
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});