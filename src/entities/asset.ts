/**
 * Mirrors `entities/assets/types` in the app, down to the field names, so the
 * port is a delete of `transformAssetRow` rather than a rewrite of every caller.
 */
import type { AssetRow } from "@/entities/rows";

/** Crop rectangle as percentages (0-100) relative to the original image. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Asset {
  id: string;
  clientId: string;
  bucket: string;
  path: string;
  mimeType: string;
  status: "available" | "used" | "archived";
  processingStatus: "pending" | "processing" | "ready" | "failed" | null;
  processingError: string | null;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  caption: string | null;
  originalPath: string | null;
  crop: CropRect | null;
}

export type AssetType = "image" | "video";

export function getAssetType(asset: Asset): AssetType {
  if (asset.mimeType.startsWith("image/")) return "image";
  return "video";
}

const STATUSES: readonly Asset["status"][] = ["available", "used", "archived"];

const PROCESSING: readonly NonNullable<Asset["processingStatus"]>[] = [
  "pending",
  "processing",
  "ready",
  "failed",
];

export function transformAssetRow(row: AssetRow): Asset {
  return {
    id: row.id,
    clientId: row.client_id,
    bucket: row.bucket,
    path: row.path,
    mimeType: row.mime_type,
    status: STATUSES.find((status) => status === row.status) ?? "available",
    processingStatus:
      PROCESSING.find((status) => status === row.processing_status) ?? null,
    processingError: row.processing_error,
    usedCount: row.used_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    caption: row.caption,
    originalPath: row.original_path,
    crop: row.crop,
  };
}
