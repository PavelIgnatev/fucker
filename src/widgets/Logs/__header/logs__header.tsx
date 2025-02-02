import { SyncOutlined } from "@ant-design/icons";
import { Breadcrumb, Input, Button, Space } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  const handleAccountIdChange = (value: string) => {
    onAccountIdChange(value);
    if (!value) {
      router.push(`/prefix/${prefixId}`);
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
