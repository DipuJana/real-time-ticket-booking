import express from "express";
import {venueRoutes} from './routes/venueRoutes.js';
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import hallRoutes from "./modules/hall/hall.routes.js";

const app = express();

app.use(express.json());

// Use venue routes
app.use('/api', venueRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", hallRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});
export default app;
