import {
  FileUploadSchema,
  ImageKitPayloadSchema,
} from "@/schemas/imagekitUploadSchema";
import { z } from "zod";

export type ImageKitAuthParams = {
  expire: number;
  signature: string;
  token: string;
};

export type ImageKitPayload = z.infer<typeof ImageKitPayloadSchema>;
export type FileUploadBody = z.infer<typeof FileUploadSchema>;
