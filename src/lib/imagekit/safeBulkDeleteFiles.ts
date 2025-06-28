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

  try {
    const deletionPromises = validFileIds.map(async (fileId) => {
      await ImageKit.deleteFile(fileId);
      logger.info(`ImageKit.deleteFile successful for ID: ${fileId}`, {
        method: context.method,
        url: context.url,
        fileId,
      });
    });

    await Promise.all(deletionPromises);

    logger.info("ImageKit.bulkDeleteFiles successful for all valid IDs", {
      method: context.method,
      url: context.url,
      totalDeleted: validFileIds.length,
    });
  } catch (err: unknown) {
    const error =
      err instanceof Error
        ? err
        : new Error("Unknown error during ImageKit bulk deletion");

    logger.error(
      "ImageKit.bulkDeleteFiles failed and will trigger transaction rollback",
      {
        method: context.method,
        url: context.url,
        fileIds: validFileIds,
        error: {
          message: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
      }
    );
    throw error;
  }
}
