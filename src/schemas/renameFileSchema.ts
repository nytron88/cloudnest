import { z } from "zod";

export const RenameFileSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty"),
});
