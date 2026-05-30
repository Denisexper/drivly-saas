import { PORT } from "./services/enviroments.service";
import express, { Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { AppRoutes } from "./routes/app.routes";
import { ErrorMiddleware } from "./middlewares/error.middleware";
import { syncPermissions } from "./permissions/sync";

const app = express();

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas peticiones, intenta en un momento." },
});

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ message: "rentCart API funcionando!" });
});

app.use("/api/v1", AppRoutes.routes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ ok: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use(ErrorMiddleware);

app.listen(PORT, async () => {
  console.log(`server up in http://localhost:${PORT}`);
  await syncPermissions();
});
