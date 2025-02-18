import { SyncOutlined, DownloadOutlined, StopOutlined } from "@ant-design/icons";
import { Breadcrumb, Input, Button, Space, message } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getErrorAccountsByPrefix, getStoppedAccountsByPrefix, stopStableAccounts, hasStableAccountsToStop, hasStoppedAccounts } from "@/src/db/accounts";
import { useState, useEffect } from "react";

interface LogsHeaderProps {
  prefixId: string;
  accountId?: string;
  onAccountIdChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isLoading: boolean;
}

export const LogsHeader = ({
  prefixId,
  accountId,
  onAccountIdChange,
  onRefresh,
  isRefreshing,
  isLoading,
}: LogsHeaderProps) => {
  const router = useRouter();
  const [canStopAccounts, setCanStopAccounts] = useState(false);
  const [hasStoppedAccountsState, setHasStoppedAccountsState] = useState(false);

  useEffect(() => {
    const checkAccounts = async () => {
      try {
        const [hasStableToStop, hasStopped] = await Promise.all([
          hasStableAccountsToStop(prefixId),
          hasStoppedAccounts(prefixId)
        ]);
        setCanStopAccounts(hasStableToStop);
        setHasStoppedAccountsState(hasStopped);
      } catch (error) {
        console.error('Error checking accounts:', error);
      }
    };

    checkAccounts();
  }, [prefixId]);

  const handleAccountIdChange = (value: string) => {
    onAccountIdChange(value);
    if (!value) {
      router.push(`/prefix/${prefixId}`);
    }
  };

  const handleExport = async (type: 'error' | 'stopped') => {
    try {
      const accounts = await (
        type === 'error' ? getErrorAccountsByPrefix(prefixId) :
        getStoppedAccountsByPrefix(prefixId)
      );
      
      const blob = new Blob([JSON.stringify(accounts, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_accounts_${prefixId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(`Error exporting ${type} accounts:`, error);
      message.error(`Ошибка при экспорте ${
        type === 'error' ? 'аккаунтов с ошибками' : 
        'остановленных аккаунтов'
      }`);
    }
  };

  const handleStopAccounts = async () => {
    try {
      const count = await stopStableAccounts(prefixId);
      message.success(`Остановлено ${count} аккаунтов`);
      onRefresh();
      // После остановки аккаунтов проверяем, остались ли еще аккаунты для остановки
      const [hasStableToStop, hasStopped] = await Promise.all([
        hasStableAccountsToStop(prefixId),
        hasStoppedAccounts(prefixId)
      ]);
      setCanStopAccounts(hasStableToStop);
      setHasStoppedAccountsState(hasStopped);
    } catch (error) {
      console.error('Error stopping accounts:', error);
      message.error('Ошибка при остановке аккаунтов');
    }
  };

  return (
    <div
      style={{
        padding: "10px 20px",
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Breadcrumb
        items={[
          {
            title: <Link href="/prefix">Префиксы</Link>,
          },
          {
            title: <Link href={`/prefix/${prefixId}`}>{prefixId}</Link>,
          },
          ...(accountId
            ? [
                {
                  title: (
                    <Link href={`/prefix/${prefixId}/${accountId}`}>
                      {accountId}
                    </Link>
                  ),
                },
              ]
            : []),
        ]}
      />
      <Space size="small">
        <Button
          icon={<DownloadOutlined />}
          onClick={() => handleExport('error')}
          size="small"
        >
          Ошибки
        </Button>
        {canStopAccounts && (
          <Button
            icon={<StopOutlined />}
            onClick={handleStopAccounts}
            size="small"
          >
            Остановить стабильные
          </Button>
        )}
        {hasStoppedAccountsState && (
          <Button
            danger
            icon={<DownloadOutlined />}
            onClick={() => handleExport('stopped')}
            size="small"
          >
            Выгрузить остановленные
          </Button>
        )}
        <Input
          placeholder="Поиск по accountId"
          value={accountId}
          onChange={(e) => handleAccountIdChange(e.target.value)}
          style={{ width: "180px" }}
          size="small"
          allowClear
        />
        <Button
          icon={<SyncOutlined spin={isRefreshing} />}
          onClick={onRefresh}
          loading={isRefreshing}
          disabled={isLoading}
          size="small"
        >
          Обновить
        </Button>
      </Space>
    </div>
  );
};
