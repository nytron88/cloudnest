import { z } from "zod";

export const MoveFileSchema = z.object({
  folderId: z.string().cuid("Invalid folder ID").nullable().default(null),
});
