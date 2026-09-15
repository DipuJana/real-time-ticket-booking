import express from "express";
import { venueRoutes } from "./routes/venueRoutes.js";
import { eventRoutes } from "./routes/eventRoutes.js";
import { showRoutes } from "./routes/showRoutes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import hallRoutes from "./modules/hall/hall.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import cors from 'cors';
import helmet from 'helmet';
import { authenticate } from "./modules/auth/middleware/auth.middleware.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use("/api", authenticate, venueRoutes);
app.use("/api", authenticate,eventRoutes);
app.use("/api", showRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", hallRoutes);


app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});
export default app;
