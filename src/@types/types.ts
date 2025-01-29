export interface Log {
  _id: string;
  level: "error" | "info";
  message: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}
