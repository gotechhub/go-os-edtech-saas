export const STORAGE_PRODUCTS = ["golms", "golxp", "gocatalog", "goauthor-ai", "gopm", "gofactory"] as const;
export type StorageProduct = (typeof STORAGE_PRODUCTS)[number];

export type AssetPurpose = "golms-learning-content";

export interface UploadPolicy {
  product: StorageProduct;
  resource: string;
  permission: string;
  allowedMimeTypes: readonly string[];
  maxBytes: number;
}

export interface UploadRequest {
  tenantId: string;
  uploadId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  purpose: AssetPurpose;
}

export interface StorageConfig {
  region: string;
  roleArn: string;
  systemBucket: string;
  tenantBucketPrefix: string;
  uploadUrlTtlSeconds: number;
  downloadUrlTtlSeconds: number;
}
