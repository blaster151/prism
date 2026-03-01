import { Dropbox } from "dropbox";

import { getDropboxAccessToken } from "./dropboxConfig";

export function createDropboxClient() {
  const accessToken = getDropboxAccessToken();

  // Never log the token; keep it scoped to this factory.
  return new Dropbox({
    accessToken,
    fetch: globalThis.fetch,
  });
}

