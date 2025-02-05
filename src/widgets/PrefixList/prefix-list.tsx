import {
  Card,
  List,
  Typography,
  Button,
  Space,
  Row,
  Col,
  Progress,
  Pagination,
  Statistic,
  Input,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { Prefix } from "@/src/@types/Prefix";
import { getAllAccountsByPrefixes } from "@/src/db/accounts";
import { useEffect, useState, useMemo } from "react";
import { message } from "antd";

const { Text, Title } = Typography;

interface PrefixStats {
  total: number;
  inProgress: number;
  banned: number;
  processed: number;
  withErrors: number;
  derived: {
    total: number;
    active: number;
    banned: number;
    stable: {
      total: number;
      active: number;
      banned: number;
    };
  };
}

interface PrefixListProps {
  prefixes: Prefix[];
  isLoading: boolean;
  onAddClick: () => void;
}

interface Account {
  accountId: string;
  prefix: string;
  parentAccountId?: string;
  banned?: boolean;
  reason?: string;
  stable?: boolean;
  workedOut?: boolean;
  error?: string;
}

const PAGE_SIZE = 10;

const formatDate = (date: Date) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

export const PrefixList = ({
  prefixes,
  isLoading,
  onAddClick,
}: PrefixListProps) => {
  const router = useRouter();
  const [prefixStats, setPrefixStats] = useState<Record<string, PrefixStats>>(
    {}
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingStats, setLoadingStats] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Получаем текущую страницу префиксов
  const currentPrefixes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return prefixes.slice(start, start + PAGE_SIZE);
  }, [prefixes, currentPage]);

  // Загружаем статистику только для текущей страницы
  useEffect(() => {
    const fetchStats = async () => {
      if (currentPrefixes.length === 0) return;
      setLoadingStats(true);

      try {
        const prefixIds = currentPrefixes.map((p) => p.prefix);
        const allAccounts = await getAllAccountsByPrefixes(prefixIds);

        // Вычисляем статистику для префиксов текущей страницы
        const stats: Record<string, PrefixStats> = {};
        const accountsByPrefix = allAccounts.reduce(
          (acc, account) => {
            if (!acc[account.prefix]) {
              acc[account.prefix] = [];
            }
            acc[account.prefix].push(account);
            return acc;
          },
          {} as Record<string, typeof allAccounts>
        );

        for (const prefix of currentPrefixes) {
          const accounts = accountsByPrefix[prefix.prefix] || [];
          const originalAccounts = accounts.filter(
            (acc) => !acc.parentAccountId
          );
          const derivedAccounts = accounts.filter((acc) => acc.parentAccountId);
          const stableAccounts = derivedAccounts.filter((acc) => acc.stable);
          const checkingAccounts = derivedAccounts.filter((acc) => !acc.stable);

          stats[prefix.prefix] = {
            total: originalAccounts.length,
            inProgress: originalAccounts.filter(
              (acc) =>
                acc.workedOut !== true &&
                !acc.banned &&
                !acc.reason &&
                !acc.error
            ).length,
            banned: originalAccounts.filter((acc) => acc.banned || acc.reason)
              .length,
            processed: originalAccounts.filter((acc) => acc.workedOut === true)
              .length,
            withErrors: originalAccounts.filter(
              (acc) => !acc.banned && !acc.reason && acc.error
            ).length,
            derived: {
              total: derivedAccounts.length,
              active: checkingAccounts.filter(
                (acc) => !acc.banned && !acc.reason
              ).length,
              banned: checkingAccounts.filter((acc) => acc.banned || acc.reason)
                .length,
              stable: {
                total: stableAccounts.length,
                active: stableAccounts.filter(
                  (acc) => !acc.banned && !acc.reason
                ).length,
                banned: stableAccounts.filter((acc) => acc.banned || acc.reason)
                  .length,
              },
            },
          };
        }

        setPrefixStats((prev) => ({
          ...prev,
          ...stats,
        }));
      } catch (error) {
        console.error("Error fetching accounts stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [currentPrefixes, currentPage]);

  // Добавляем вычисление глобальной статистики
  const globalStats = useMemo(() => {
    const stats = Object.values(prefixStats);
    if (stats.length === 0) return null;

    const totalInitialAccounts = stats.reduce((sum, stat) => sum + stat.total, 0);
    const totalStableActive = stats.reduce(
      (sum, stat) => sum + stat.derived.stable.active,
      0
    );

    const successRate = totalInitialAccounts > 0
      ? (totalStableActive / totalInitialAccounts) * 100
      : 0;

    return {
      totalInitialAccounts,
      totalStableActive,
      successRate: Math.round(successRate * 100) / 100,
    };
  }, [prefixStats]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setPrefixStats({});
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/accounts/${searchValue.trim()}`);
      const account = await response.json();
      
      if (account && account.prefix) {
        router.push(`/prefix/${account.prefix}/${account.accountId}`);
      } else {
        // Если аккаунт не найден, можно показать сообщение об ошибке
        message.error("Аккаунт не найден");
      }
    } catch (error) {
      console.error("Error searching account:", error);
      message.error("Ошибка при поиске аккаунта");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <List
        loading={loadingStats || isLoading}
        dataSource={currentPrefixes}
        renderItem={(prefix) => (
          <List.Item
            key={prefix._id}
            style={{
              padding: "16px 0",
              margin: 0,
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                paddingLeft: "24px",
                paddingRight: "24px",
              }}
            >
              <Link
                href={`/prefix/${prefix.prefix}`}
                style={{
                  color: "#1890ff",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "500",
                  width: "200px",
                }}
              >
                {prefix.prefix}
              </Link>
              <Text
                type="secondary"
                style={{
                  fontSize: "13px",
                  fontFamily: "monospace",
                  backgroundColor: "#f5f5f5",
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                {formatDate(prefix.dateCreated)}
              </Text>
            </div>
            {prefixStats[prefix.prefix] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '730px'}}>
                <div style={{ padding: "0 24px", border: "1px solid #f0f0f0", borderRadius: "8px", backgroundColor: "#fafafa", marginTop: '-40px' }}>
                  <Row gutter={[64, 16]} style={{ padding: "8px 0" }}>
                    <Col span={8}>
                      <div style={{ marginBottom: "8px" }}>
                        <Space>
                          <WarningOutlined style={{ color: "#1677ff" }} />
                          <span style={{ fontWeight: 500 }}>На релогине ({prefixStats[prefix.prefix].total})</span>
                        </Space>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Progress
                          percent={Math.round((prefixStats[prefix.prefix].processed / (prefixStats[prefix.prefix].total || 1)) * 100)}
                          success={{ percent: Math.round((prefixStats[prefix.prefix].processed / (prefixStats[prefix.prefix].total || 1)) * 100) }}
                          format={() => `${prefixStats[prefix.prefix].processed} готово`}
                          size="small"
                        />
                        <Progress
                          percent={Math.round((prefixStats[prefix.prefix].banned / (prefixStats[prefix.prefix].total || 1)) * 100)}
                          strokeColor="#ff4d4f"
                          format={() => `${prefixStats[prefix.prefix].banned} бан`}
                          size="small"
                        />
                        {prefixStats[prefix.prefix].inProgress > 0 && (
                          <Progress
                            percent={Math.round((prefixStats[prefix.prefix].inProgress / (prefixStats[prefix.prefix].total || 1)) * 100)}
                            strokeColor="#1677ff"
                            format={() => `${prefixStats[prefix.prefix].inProgress} в процессе`}
                            size="small"
                          />
                        )}
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: "8px" }}>
                        <Space>
                          <SyncOutlined spin style={{ color: "#722ed1" }} />
                          <span style={{ fontWeight: 500 }}>На проверке ({prefixStats[prefix.prefix].derived.active})</span>
                        </Space>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Progress
                          percent={Math.round((prefixStats[prefix.prefix].derived.active / (prefixStats[prefix.prefix].derived.total || 1)) * 100)}
                          strokeColor="#722ed1"
                          format={() => `${prefixStats[prefix.prefix].derived.active} активных`}
                          size="small"
                        />
                        <Progress
                          percent={Math.round((prefixStats[prefix.prefix].derived.banned / (prefixStats[prefix.prefix].derived.total || 1)) * 100)}
                          strokeColor="#ff4d4f"
                          format={() => `${prefixStats[prefix.prefix].derived.banned} бан`}
                          size="small"
                        />
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: "8px" }}>
                        <Space>
                          <CheckCircleOutlined style={{ color: "#52c41a" }} />
                          <Space size={4}>
                            <span style={{ fontWeight: 500 }}>Стабильные ({prefixStats[prefix.prefix].derived.stable.total})</span>
                            <Text type="success">
                              {prefixStats[prefix.prefix].total > 0 
                                ? `${Math.round((prefixStats[prefix.prefix].derived.stable.active / prefixStats[prefix.prefix].total) * 100)}%`
                                : '0%'
                              }
                            </Text>
                          </Space>
                        </Space>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Progress
                          percent={Math.round((prefixStats[prefix.prefix].derived.stable.active / (prefixStats[prefix.prefix].derived.stable.total || 1)) * 100)}
                          strokeColor="#52c41a"
                          format={() => `${prefixStats[prefix.prefix].derived.stable.active} активных`}
                          size="small"
                        />
                        <Progress
                          percent={Math.round((prefixStats[prefix.prefix].derived.stable.banned / (prefixStats[prefix.prefix].derived.stable.total || 1)) * 100)}
                          strokeColor="#ff4d4f"
                          format={() => `${prefixStats[prefix.prefix].derived.stable.banned} бан`}
                          size="small"
                        />
                      </div>
                    </Col>
                  </Row>
                </div>
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#595959",
                  }}
                >
                  {prefix.metadata.description}
                </Text>
              </div>
            )}
          </List.Item>
        )}
        locale={{ emptyText: "Префиксы не найдены" }}
        header={
          <Card
            bodyStyle={{ padding: 0 }}
            style={{ marginBottom: 0, borderBottom: "1px solid #f0f0f0" }}
          >
            <div style={{ 
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "1px solid #f0f0f0"
            }}>
              <Space direction="vertical" size="small">
                <Title level={4} style={{ margin: 0 }}>
                  Префиксы
                </Title>
                {globalStats && (
                  <Space size="large">
                    <Statistic
                      title="Всего аккаунтов на релогине"
                      value={globalStats.totalInitialAccounts}
                      style={{ marginRight: 32 }}
                    />
                    <Statistic
                      title="Вышло стабильных активных"
                      value={globalStats.totalStableActive}
                      style={{ marginRight: 32 }}
                    />
                    <Statistic
                      title="Процент успешности"
                      value={globalStats.successRate}
                      suffix="%"
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Space>
                )}
              </Space>
              <Space size="middle" align="center">
                <Input.Search
                  placeholder="ID аккаунта"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onSearch={handleSearch}
                  style={{ width: 200 }}
                  loading={searchLoading}
                  enterButton={<SearchOutlined />}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={onAddClick}>
                  Добавить префикс
                </Button>
              </Space>
            </div>
          </Card>
        }
        footer={
          <div style={{ padding: "16px 24px", textAlign: "right", borderTop: "1px solid #f0f0f0" }}>
            <Pagination
              current={currentPage}
              total={prefixes.length}
              pageSize={PAGE_SIZE}
              onChange={handlePageChange}
              showSizeChanger={false}
              showTotal={(total) => `Всего ${total} префиксов`}
            />
          </div>
        }
        style={{ 
          backgroundColor: '#fff',
          border: '1px solid #f0f0f0',
          borderRadius: '8px'
        }}
      />
    </div>
  );
};
