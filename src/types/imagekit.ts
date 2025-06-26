import { ImageKitPayloadSchema } from "@/schemas/imagekitUploadSchema";
import { z } from "zod";

export type ImageKitAuthParams = {
  expire: number;
  signature: string;
  token: string;
};

export type FileUploadBody = z.infer<typeof ImageKitPayloadSchema>;
