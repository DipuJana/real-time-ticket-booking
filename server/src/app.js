import express from "express";

import {venueRoutes} from './routes/venueRoutes.js';
import {eventRoutes} from './routes/eventRoutes.js';

const app = express();

app.use(express.json());
// Use venue routes
app.use('/api', venueRoutes);
//Use event routes
app.use('/api', eventRoutes);

app.use(express.json());
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});
export default app;