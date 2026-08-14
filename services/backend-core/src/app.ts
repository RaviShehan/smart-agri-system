import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cropZoneRoutes from "./routes/cropZone.routes";
import telemetryRoutes from "./routes/telemetry.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/crop-zones", cropZoneRoutes);
app.use("/api/telemetry", telemetryRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`?? Backend Core service running on http://localhost:${PORT}`);
});
