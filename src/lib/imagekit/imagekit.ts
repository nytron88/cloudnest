import ImageKit from "imagekit";

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

if (!publicKey || !privateKey || !urlEndpoint) {
  throw new Error("Missing ImageKit environment variables");
}

declare global {
  var imagekit: ImageKit | undefined;
}

const imagekit =
  process.env.NODE_ENV === "production"
    ? new ImageKit({ publicKey, privateKey, urlEndpoint })
    : global.imagekit ?? new ImageKit({ publicKey, privateKey, urlEndpoint });

if (process.env.NODE_ENV !== "production") global.imagekit = imagekit;

export default imagekit;
