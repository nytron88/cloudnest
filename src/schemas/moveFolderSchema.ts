import { z } from "zod";

export const MoveFolderSchema = z.object({
  folderId: z.string().cuid("Invalid folder ID").nullable().default(null),
});
