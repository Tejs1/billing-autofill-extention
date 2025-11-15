// Common types used across the extension

export interface FormField {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  type: string;
  existingValue?: string;
}

export interface FillValue {
  value: string;
  reason: string;
}

export interface ServerConfig {
  serverUrl: string;
  serverApiKey: string | null;
}

export interface GenerateFillResponse {
  success: boolean;
  data?: Record<string, FillValue>;
  error?: string;
}

export interface MessageRequest {
  type: string;
  fields?: FormField[];
}

export interface MessageResponse {
  success: boolean;
  data?: Record<string, FillValue>;
  error?: string;
}

export enum ErrorType {
  NETWORK = "NETWORK",
  AUTH = "AUTH",
  CONFIG = "CONFIG",
  VALIDATION = "VALIDATION",
  UNKNOWN = "UNKNOWN",
}

export interface ExtensionError {
  type: ErrorType;
  message: string;
  retryable: boolean;
}

export type StatusTone = "success" | "error" | "";
