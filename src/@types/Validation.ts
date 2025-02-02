import { AlertProps } from "antd/lib/alert";

export interface ValidationResult {
  isValid: boolean;
  message: string;
  type: AlertProps["type"];
  stats?: {
    total: number;
    existing: number;
    new: number;
    existingAuthKeys: string[];
  };
}
