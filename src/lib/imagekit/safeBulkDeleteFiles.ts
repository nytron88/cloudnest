import ImageKit from "@/lib/imagekit/imagekit";
import logger from "@/lib/utils/logger";

export async function safeBulkDeleteFiles(
  fileIds: (string | null | undefined)[],
  context: { method: string; url: string }
) {
  const validFileIds = fileIds.filter(
    (id): id is string => typeof id === "string" && id.trim() !== ""
  );

  if (validFileIds.length === 0) {
    logger.warn("No valid file IDs provided, skipping bulk deletion", {
      method: context.method,
      url: context.url,
    });
    return;
  }

  await Promise.all(
    validFileIds.map(async (fileId) => {
      try {
        await ImageKit.deleteFile(fileId);
      } catch (err: unknown) {
        const error =
          err instanceof Error
            ? err
            : new Error("Unknown error during ImageKit deletion");

        logger.error("ImageKit.deleteFile failed in bulk delete", {
          method: context.method,
          url: context.url,
          fileId,
          error: {
            message: error.message,
            stack:
              process.env.NODE_ENV === "development" ? error.stack : undefined,
          },
        });
      }
    })
  );
}
