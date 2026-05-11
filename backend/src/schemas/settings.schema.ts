import { z } from "zod";

export const updateSettingsSchema = z.object({
  emailNotifications: z.boolean(),
});
