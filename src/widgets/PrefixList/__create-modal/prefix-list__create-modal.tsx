"use client";

import { Modal, Input, Button, Space, Alert } from "antd";
import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { ValidationResult } from "@/src/@types/Validation";

interface FormData {
  prefix: string;
  description: string;
  accounts: string;
}

interface Props {
  isOpen: boolean;
  initialPrefix: string;
  onClose: () => void;
  onSubmit: (values: FormData) => Promise<void>;
  validateAccounts: (accounts: string) => Promise<ValidationResult>;
}

export const PrefixListCreateModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialPrefix,
  validateAccounts,
}: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    defaultValues: {
      prefix: initialPrefix,
      description: "",
      accounts: "",
    },
    mode: "onChange",
  });

  const handleClose = () => {
    reset();
    setValidationResult(null);
    onClose();
  };

  const handleFormSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountsChange = async (value: string) => {
    if (!value.trim()) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateAccounts(value);

      setValidationResult(result);
    } finally {
      setIsValidating(false);
    }
  };

  const renderField = (label: string, description?: string) => (
    <div className="field">
      <div className="field__label">{label}</div>
      {description && (
        <div className="field__description" style={{ color: "gray" }}>
          {description}
        </div>
      )}
    </div>
  );

  return (
    <Modal
      title="Создать новый префикс"
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={800}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="form">
        <div className="form__field">
          <Controller
            name="prefix"
            control={control}
            rules={{ required: "Обязательное поле" }}
            render={({ field }) => (
              <>
                {renderField("Префикс")}
                <Input {...field} disabled />
              </>
            )}
          />
        </div>

        <div className="form__field">
          <Controller
            name="description"
            control={control}
            rules={{ required: "Обязательное поле" }}
            render={({ field }) => (
              <>
                {renderField("Описание")}
                <Input.TextArea
                  {...field}
                  placeholder="Введите описание"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
                {errors.description?.message && (
                  <div className="field__error">
                    {errors.description.message}
                  </div>
                )}
              </>
            )}
          />
        </div>

        <div className="form__field">
          <Controller
            name="accounts"
            control={control}
            rules={{
              required: "Обязательное поле",
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleAccountsChange(e.target.value),
            }}
            render={({ field }) => (
              <>
                {renderField(
                  "Список аккаунтов",
                  "Вставьте сюда аккаунты вида authKey:dcId, каждый аккаунт должен начинаться с новой строки. Лимит – 5000 аккаунтов."
                )}
                <Input.TextArea
                  {...field}
                  placeholder="authKey:dcId"
                  autoSize={{ minRows: 4, maxRows: 8 }}
                />
                {errors.accounts?.message && (
                  <div className="field__error">{errors.accounts.message}</div>
                )}
              </>
            )}
          />
        </div>

        {validationResult && (
          <Alert
            message={validationResult.message}
            type={validationResult.type}
            showIcon
            className="form__alert"
          />
        )}

        <Space size="middle">
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting || isValidating}
            disabled={
              !isValid ||
              isSubmitting ||
              isValidating ||
              validationResult?.type === "error"
            }
            size="large"
          >
            Создать
          </Button>
          <Button
            onClick={handleClose}
            disabled={isSubmitting || isValidating}
            size="large"
          >
            Отмена
          </Button>
        </Space>
      </form>

      <style jsx>{`
        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form__field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form__alert {
          margin-bottom: 8px;
        }
        .field__label {
          font-weight: 500;
        }
        .field__description {
          color: #8c8c8c;
          font-size: 14px;
          margin-top: 4px;
        }
        .field__error {
          color: #ff4d4f;
          font-size: 14px;
        }
      `}</style>
    </Modal>
  );
};
