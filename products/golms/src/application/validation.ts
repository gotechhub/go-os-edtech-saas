import { ApplicationError } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;

export const text = (value: string, name: string, max = 180) => {
  const normalized = value.trim();
  if (!normalized || normalized.length > max) throw new ApplicationError("VALIDATION_FAILED", `${name} geçersiz.`, 400);
  return normalized;
};

export const uuid = (value: string, name: string) => {
  if (!UUID.test(value)) throw new ApplicationError("VALIDATION_FAILED", `${name} geçersiz.`, 400);
  return value;
};

export const hash = (value: string) => {
  if (!SHA256.test(value)) throw new ApplicationError("VALIDATION_FAILED", "İçerik özeti geçersiz.", 400);
  return value.toLowerCase();
};

export const instant = (value: string, name: string) => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new ApplicationError("VALIDATION_FAILED", `${name} geçersiz.`, 400);
  return new Date(parsed).toISOString();
};
