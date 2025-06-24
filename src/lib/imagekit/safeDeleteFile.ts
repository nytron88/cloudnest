import ImageKit from "@/lib/imagekit/imagekit";
import logger from "@/lib/utils/logger";

export async function safeDeleteFile(
  fileId: string | null,
  context: { method: string; url: string }
) {
  if (!fileId) {
    logger.warn("File ID is null, skipping deletion", {
      method: context.method,
      url: context.url,
    });
    return;
  }

  try {
    await ImageKit.deleteFile(fileId);
  } catch (err: unknown) {
    const error =
      err instanceof Error
        ? err
        : new Error("Unknown error during ImageKit deletion");

    logger.error("ImageKit.deleteFile failed", {
      method: context.method,
      url: context.url,
      fileId,
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    });
  }
}
