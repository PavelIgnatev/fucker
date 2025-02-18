import React, { useEffect, useState } from "react";
import { getAccountsByPrefix } from "@/src/db/accounts";
import { useRouter } from "next/navigation";
import { Tag, Tooltip } from "antd";

interface LogsStatsProps {
  prefixId: string;
  accountId?: string;
}

interface Account {
  accountId: string;
  username?: string;
  dcId?: string;
  prefix: string;
  parentAccountId?: string;
  workedOut?: boolean;
  error?: string;
  reason?: string;
  banned?: boolean;
  stable?: boolean;
  prevApiId?: string;
  nextApiId?: string;
  phone?: string;
  spamBlockDate?: string;
  forceStop?: boolean;
  [key: string]: any;
}

const getAccountStatus = (account: Account) => {
  if (account.parentAccountId) {
    if (account.banned || account.reason) {
      return { color: "#ff4d4f", text: "Забанен" };
    }
    if (account.forceStop) {
      return { color: "#ff4d4f", text: "Остановлен" };
    }
    if (account.stable) {
      return { color: "#52c41a", text: "Стабильный" };
    }
    return { color: "#1677ff", text: "Активен" };
  }

  if (account.workedOut === true) {
    return { color: "#52c41a", text: "Обработан" };
  }

  if (account.banned || account.reason) {
    return { color: "#ff4d4f", text: "Забанен" };
  }

  if (account.error) {
    return { color: "#faad14", text: `В процессе (Ошибка: ${account.error})` };
  }

  return { color: "#1677ff", text: "В процессе" };
};

export const LogsStats: React.FC<LogsStatsProps> = ({ prefixId, accountId }) => {
  const router = useRouter();
  const [originalAccounts, setOriginalAccounts] = useState<Account[]>([]);
  const [derivedAccounts, setDerivedAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const handleAccountClick = (accountId: string) => {
    router.push(`/prefix/${prefixId}/${accountId}`);
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const accounts = await getAccountsByPrefix(prefixId);

        setOriginalAccounts(accounts.filter((acc) => !acc.parentAccountId));
        setDerivedAccounts(accounts.filter((acc) => acc.parentAccountId));
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [prefixId]);

  if (loading) {
    return (
      <div
        style={{
          width: "40%",
          borderRight: "1px solid #e8e8e8",
          padding: "16px",
          backgroundColor: "#fafafa",
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        <p>Загрузка статистики...</p>
      </div>
    );
  }

  // Статистика оригинальных аккаунтов
  const inProgressCount = originalAccounts.filter(
    (acc) => acc.workedOut !== true && !acc.banned && !acc.reason && !acc.error
  ).length;
  const bannedCount = originalAccounts.filter(
    (acc) => acc.banned || acc.reason
  ).length;
  const errorCount = originalAccounts.filter(
    (acc) => !acc.banned && !acc.reason && acc.error
  ).length;
  const processedCount = originalAccounts.filter(
    (acc) => acc.workedOut === true
  ).length;

  // Статистика производных аккаунтов
  const checkingAccounts = derivedAccounts.filter(acc => !acc.stable);
  const derivedActiveCount = checkingAccounts.filter(
    (acc) => !acc.banned && !acc.reason
  ).length;
  const derivedBannedCount = checkingAccounts.filter(
    (acc) => acc.banned || acc.reason
  ).length;
  const stableCount = derivedAccounts.filter((acc) => acc.stable).length;
  const stableBannedCount = derivedAccounts.filter(
    (acc) => acc.stable && (acc.banned || acc.reason)
  ).length;

  // Добавляем подсчет спамблоков
  const stableAccounts = derivedAccounts.filter((acc) => acc.stable);
  const spamBlockCount = stableAccounts.filter(acc => acc.spamBlockDate).length;

  const AccountItem = ({ account }: { account: Account }) => {
    const status = getAccountStatus(account);
    return (
      <div
        key={account.accountId}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          marginBottom: "4px",
        }}
      >
        <Tooltip title="Перейти к логам аккаунта">
          <Tag
            style={{
              cursor: "pointer",
              backgroundColor: "#f5f5f5",
              color: "#262626",
              borderColor: "#8c8c8c",
              fontWeight: 500,
            }}
            onClick={() => handleAccountClick(account.accountId)}
          >
            {account.accountId}
          </Tag>
        </Tooltip>
        {account.phone && (
          <Tag
            style={{
              backgroundColor: "#f5f5f5",
              color: "#595959",
              borderColor: "#d9d9d9",
              fontSize: "10px",
            }}
          >
            {account.phone}
          </Tag>
        )}
        <span
          style={{
            fontSize: "10px",
            color: status.color,
            backgroundColor: `${status.color}10`,
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          {status.text}
        </span>
        {(account.banned || account.reason) && (
          <span
            style={{
              fontSize: "10px",
              color: "#ff4d4f",
              backgroundColor: "#ff4d4f10",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {account.reason || "Причина не указана"}
          </span>
        )}
        {account.prevApiId && (
          <span
            style={{
              fontSize: "10px",
              color: "#ff4d4f",
              backgroundColor: "#ff4d4f10",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {account.prevApiId}
          </span>
        )}
        {account.nextApiId && (
          <span
            style={{
              fontSize: "10px",
              color: "#52c41a",
              backgroundColor: "#52c41a10",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {account.nextApiId}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        width: "40%",
        borderRight: "1px solid #e8e8e8",
        padding: "16px",
        paddingRight: 0,
        backgroundColor: "#fafafa",
        height: "calc(100vh - 40px)",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ 
        overflowY: "auto",
        flex: 1,
        paddingRight: "8px",
      }}>
        {/* Оригинальные аккаунты */}
        <div style={{ marginBottom: "24px" }}>
          <h4>АККАУНТЫ НА РЕЛОГИНЕ: {originalAccounts.length}</h4>
          <div style={{ fontSize: "12px", marginBottom: "8px" }}>
            <div style={{ color: "#52c41a" }}>Обработано: {processedCount}</div>
            <div style={{ color: "#ff4d4f" }}>Забанено: {bannedCount}</div>
            <div style={{ color: "#1677ff" }}>В процессе: {inProgressCount}</div>
            <div style={{ color: "#faad14" }}>В процессе с ошибками: {errorCount}</div>
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {originalAccounts.map((acc) => (
              <AccountItem key={acc.accountId} account={acc} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h4>АККАУНТЫ НА ПРОВЕРКЕ: {checkingAccounts.length}</h4>
          <div style={{ fontSize: "12px", marginBottom: "8px" }}>
            <div style={{ color: "#1677ff" }}>Активные: {derivedActiveCount}</div>
            <div style={{ color: "#ff4d4f" }}>Забанено: {derivedBannedCount}</div>
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {checkingAccounts.map((acc) => (
              <AccountItem key={acc.accountId} account={acc} />
            ))}
          </div>
        </div>

        {/* Стабильные аккаунты */}
        <div>
          <h4>СТАБИЛЬНЫЕ АККАУНТЫ: {stableCount} (спамблоков: {spamBlockCount || 0})</h4>
          <div style={{ fontSize: "12px", marginBottom: "8px" }}>
            <div style={{ color: "#52c41a" }}>Активные: {stableCount - stableBannedCount}</div>
            <div style={{ color: "#ff4d4f" }}>Забанено: {stableBannedCount}</div>
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {derivedAccounts
              .filter((acc) => acc.stable)
              .map((acc) => (
                <div
                  key={acc.accountId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginBottom: "4px",
                  }}
                >
                  <Tooltip title="Перейти к логам аккаунта">
                    <Tag
                      style={{
                        cursor: "pointer",
                        backgroundColor: "#f5f5f5",
                        color: "#262626",
                        borderColor: "#8c8c8c",
                        fontWeight: 500,
                      }}
                      onClick={() => handleAccountClick(acc.accountId)}
                    >
                      {acc.accountId}
                    </Tag>
                  </Tooltip>
                  {acc.phone && (
                    <Tag
                      style={{
                        backgroundColor: "#f5f5f5",
                        color: "#595959",
                        borderColor: "#d9d9d9",
                        fontSize: "10px",
                      }}
                    >
                      {acc.phone}
                    </Tag>
                  )}
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#52c41a",
                      backgroundColor: "#52c41a10",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    Стабильный
                  </span>
                  {acc.spamBlockDate && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#ff4d4f",
                        backgroundColor: "#ff4d4f10",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {acc.spamBlockDate === "INFINITY" ? "INFINITY" : new Date(acc.spamBlockDate).toLocaleString()}
                    </span>
                  )}
                  {(acc.banned || acc.reason) && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#ff4d4f",
                        backgroundColor: "#ff4d4f10",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {acc.reason || "Причина не указана"}
                    </span>
                  )}
                  {acc.prevApiId && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#ff4d4f",
                        backgroundColor: "#ff4d4f10",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {acc.prevApiId}
                    </span>
                  )}
                  {acc.nextApiId && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#52c41a",
                        backgroundColor: "#52c41a10",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {acc.nextApiId}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
