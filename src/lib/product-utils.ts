import { JsonValue } from "@prisma/client/runtime/library";

export type ProductMap = Record<string, number>;

export function isProductMap(value: JsonValue): value is ProductMap {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseProducts(value: JsonValue | undefined): ProductMap {
  return value && isProductMap(value) ? (value as ProductMap) : {};
}
