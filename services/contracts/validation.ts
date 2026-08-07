import { isAddress, isHexString } from "ethers";
import type { ParsedAbiParameter } from "./parser";

export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  return false;
}

export function validateParameterValue(parameter: ParsedAbiParameter, value: unknown): string | null {
  if (isEmptyValue(value)) {
    return "This field is required.";
  }

  if (parameter.isTuple && parameter.components?.length) {
    if (typeof value !== "object" || Array.isArray(value)) {
      return "This tuple value is invalid.";
    }

    const tupleValue = value as Record<string, unknown>;
    for (const component of parameter.components) {
      const componentKey = component.name || component.type;
      const componentError = validateParameterValue(component, tupleValue[componentKey]);
      if (componentError) {
        return componentError;
      }
    }

    return null;
  }

  if (parameter.isArray) {
    const items = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    if (!Array.isArray(items) || items.length === 0) {
      return "Provide at least one value.";
    }

    for (const item of items) {
      const nestedError = validateParameterValue(parameter.components?.[0] ?? parameter, item);
      if (nestedError) {
        return nestedError;
      }
    }

    return null;
  }

  const type = parameter.type.toLowerCase();

  if (type.startsWith("address")) {
    return isAddress(String(value)) ? null : "Enter a valid address.";
  }

  if (type.startsWith("uint") || type.startsWith("int")) {
    const numericValue = String(value).trim();
    try {
      const parsed = BigInt(numericValue);
      if (type.startsWith("uint") && parsed < 0n) {
        return "Unsigned integers cannot be negative.";
      }
      return null;
    } catch {
      return "Enter a valid integer.";
    }
  }

  if (type.startsWith("bool")) {
    if (typeof value === "boolean") {
      return null;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "false") {
        return null;
      }
    }

    return "Select a boolean value.";
  }

  if (type.startsWith("bytes")) {
    const bytesValue = String(value).trim();
    return isHexString(bytesValue) ? null : "Enter a valid hex string.";
  }

  if (type.startsWith("string")) {
    return typeof value === "string" && value.trim().length > 0 ? null : "Enter a string value.";
  }

  return null;
}

export function coerceParameterValue(parameter: ParsedAbiParameter, value: unknown): unknown {
  if (parameter.isTuple && parameter.components?.length) {
    if (typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    const tupleValue = value as Record<string, unknown>;
    return Object.fromEntries(
      parameter.components.map((component) => [component.name || component.type, coerceParameterValue(component, tupleValue[component.name || component.type])])
    );
  }

  if (parameter.isArray) {
    if (Array.isArray(value)) {
      return value.map((item) => coerceParameterValue(parameter.components?.[0] ?? parameter, item));
    }

    if (typeof value === "string") {
      const values = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      return values.map((item) => coerceParameterValue(parameter.components?.[0] ?? parameter, item));
    }

    return [];
  }

  const type = parameter.type.toLowerCase();

  if (type.startsWith("uint") || type.startsWith("int")) {
    if (value === null || value === undefined || value === "") {
      return 0n;
    }

    if (typeof value === "bigint") {
      return value;
    }

    return BigInt(String(value));
  }

  if (type.startsWith("bool")) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      return value.trim().toLowerCase() === "true";
    }

    return false;
  }

  return value;
}
