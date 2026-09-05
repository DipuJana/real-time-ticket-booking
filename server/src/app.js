import express from "express";
import {venueRoutes} from './routes/venueRoutes.js';

const app = express();

// Use venue routes
app.use('/api', venueRoutes);

app.use(express.json());
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});
export default app;