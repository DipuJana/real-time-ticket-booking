import express from "express";
import {venueRoutes} from './routes/venueRoutes.js';

import inventoryRoutes from "./modules/inventory/inventory.routes.js";
const app = express();

// Use venue routes
app.use('/api', venueRoutes);

app.use(express.json());

app.use("/api", inventoryRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});
export default app;