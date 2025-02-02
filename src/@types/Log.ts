export interface Log {
  _id: string;
  level: "error" | "info" | "warn";
  message: string;
  metadata: {
    accountId?: string;
    prefix?: string;
    [key: string]: unknown;
  };
  timestamp: string;
}
