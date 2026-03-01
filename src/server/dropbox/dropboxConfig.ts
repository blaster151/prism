import { AppError } from "@/lib/errors";

export function getDropboxAccessToken() {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new AppError({
      code: "MISCONFIGURED",
      message: "Dropbox is not configured.",
      httpStatus: 500,
      details: { missing: "DROPBOX_ACCESS_TOKEN" },
    });
  }
  return token;
}

export function getDropboxRootPath() {
  return process.env.DROPBOX_ROOT_PATH || "";
}

