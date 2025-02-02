import { Card, List, Typography, Button, Space } from "antd";
import Link from "next/link";
import { PlusOutlined } from "@ant-design/icons";
import type { Prefix } from "@/src/@types/Prefix";

const { Text, Title } = Typography;

interface PrefixListProps {
  prefixes: Prefix[];
  isLoading: boolean;
  onAddClick: () => void;
}

export const PrefixList = ({
  prefixes,
  isLoading,
  onAddClick,
}: PrefixListProps) => {
  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <Card
        title={
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Title level={4} style={{ margin: 0 }}>
              Префиксы
            </Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={onAddClick}>
              Добавить префикс
            </Button>
          </Space>
        }
        loading={isLoading}
      >
        <List
          dataSource={prefixes}
          renderItem={(prefix) => (
            <List.Item
              key={prefix._id}
              style={{
                padding: "12px 24px",
                margin: 0,
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                gap: "24px"
              }}
            >
              <div style={{ width: "200px", flexShrink: 0 }}>
                <Link
                  href={`/prefix/${prefix.prefix}`}
                  style={{
                    color: "#1890ff",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {prefix.prefix}
                </Link>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#595959",
                    display: "block",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {prefix.metadata.description}
                </Text>
              </div>
              <div style={{ width: "120px", flexShrink: 0 }}>
                <Text
                  type="secondary"
                  style={{ fontSize: "12px" }}
                >
                  {new Date(prefix.dateCreated).toLocaleDateString()}
                </Text>
              </div>
            </List.Item>
          )}
          locale={{ emptyText: "Префиксы не найдены" }}
        />
      </Card>
    </div>
  );
};
