import logger from "./utils/logger";
import { PORT } from "./services/enviroments.service";
import app from "./app";
import { syncPermissions } from "./permissions/sync";

app.listen(PORT, async () => {
  logger.info(`server up in http://localhost:${PORT}`);
  await syncPermissions();
});
