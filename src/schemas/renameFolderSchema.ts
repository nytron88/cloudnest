import { z } from "zod";

export const RenameFolderSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty"),
});
