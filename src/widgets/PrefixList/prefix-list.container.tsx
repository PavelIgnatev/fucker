"use client";

import { useQuery, useQueryClient } from "react-query";
import { getAllPrefixes, createPrefix } from "@/src/db/prefix";
import { checkExistingAccounts } from "@/src/db/accounts";
import { PrefixList } from "./prefix-list";
import type { Prefix } from "@/src/@types/Prefix";
import { useState } from "react";
import { message } from "antd";
import { PrefixListCreateModal } from "./__create-modal/prefix-list__create-modal";

interface CreatePrefixFormData {
  prefix: string;
  description: string;
  accounts: string;
}

interface ValidatedAccount {
  authKey: string;
  dcId: string;
}

interface ValidationResult {
  isValid: boolean;
  message: string;
  type: "error" | "warning";
  accounts?: ValidatedAccount[];
}

const ACCOUNTS_LIMIT = 20000;
const ACCOUNT_FORMAT = /^[a-zA-Z0-9]+:[0-9]+$/;

export const PrefixListContainer = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: prefixes = [], isLoading } = useQuery<Prefix[]>(
    ["prefixes"],
    () => getAllPrefixes(),
    {
      staleTime: Infinity,
    }
  );

  const generatePrefix = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `pf_${timestamp}_${random}`;
  };

  const validateAccounts = async (
    accounts: string
  ): Promise<ValidationResult> => {
    const accountsList = accounts.trim().split("\n").filter(Boolean);

    if (accountsList.length > ACCOUNTS_LIMIT) {
      return {
        isValid: false,
        message: "Превышен лимит в 20000 аккаунтов",
        type: "error",
      };
    }

    const invalidAccounts = accountsList.filter(
      (account) => !ACCOUNT_FORMAT.test(account.trim())
    );

    if (invalidAccounts.length > 0) {
      return {
        isValid: false,
        message:
          "Некорректный формат аккаунтов. Каждый аккаунт должен быть в формате authKey:dcId.",
        type: "error",
      };
    }

    const parsedAccounts = accountsList.map((account) => {
      const [authKey, dcId] = account.split(":");
      return { authKey, dcId, slicedAuthKey: authKey.slice(0, 32) };
    });

    const existingAuthKeys = await checkExistingAccounts(
      parsedAccounts.map((acc) => acc.slicedAuthKey)
    );

    const validAccounts = parsedAccounts
      .filter((acc) => !existingAuthKeys.includes(acc.slicedAuthKey))
      .map(({ authKey, dcId }) => ({ authKey, dcId }));

    if (validAccounts.length === 0) {
      return {
        isValid: false,
        message: `Все аккаунты уже существуют в системе (${accountsList.length})`,
        type: "error",
      };
    }

    return {
      isValid: true,
      message: `Всего аккаунтов: ${accountsList.length}\n• ${accountsList.length - validAccounts.length} уже в системе\n• ${validAccounts.length} добавится в систему`,
      type: "warning",
      accounts: validAccounts,
    };
  };

  const handleCreate = async (data: CreatePrefixFormData) => {
    try {
      const validation = await validateAccounts(data.accounts);

      if (!validation.isValid) {
        message.error(validation.message);
        return;
      }

      const accountsList = validation.accounts!.map(
        (acc) => `${acc.authKey}:${acc.dcId}`
      );
      await createPrefix(data.prefix, data.description, accountsList);

      message.success(
        `Добавлено ${validation.accounts!.length} новых, пропущено ${
          data.accounts.trim().split("\n").filter(Boolean).length -
          validation.accounts!.length
        } существующих`
      );

      queryClient.invalidateQueries(["prefixes"]);
      setIsModalOpen(false);
    } catch (error: any) {
      message.error(`Ошибка при создании префикса: ${error.message}`);
    }
  };

  return (
    <>
      <PrefixList
        prefixes={prefixes}
        isLoading={isLoading}
        onAddClick={() => setIsModalOpen(true)}
      />
      <PrefixListCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        initialPrefix={generatePrefix()}
        validateAccounts={validateAccounts}
      />
    </>
  );
};
