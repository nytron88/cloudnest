import ImageKit from "@/lib/imagekit";
import logger from "@/lib/logger";

export async function safeDeleteFile(
  fileId: string,
  context: { method: string; url: string }
) {
  if (!fileId) return;

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
