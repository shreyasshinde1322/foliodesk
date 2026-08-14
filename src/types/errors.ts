export type ToolErrorCode =
  | "invalid_input"
  | "unsupported_format"
  | "configuration_error"
  | "processing_failed"
  | "export_failed"
  | "browser_limitation"
  | "server_unavailable";

export interface ToolError {
  code: ToolErrorCode;
  field?: string;
  message: string;
}

export function toUserError(error: ToolError): string {
  return error.message;
}
