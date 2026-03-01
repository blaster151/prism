export type DropboxListEntry = {
  id: string;
  name: string;
  pathLower: string | null;
  type: "file" | "folder";
  clientModified?: string;
  serverModified?: string;
  size?: number;
  contentHash?: string;
};

