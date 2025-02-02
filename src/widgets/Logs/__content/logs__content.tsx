import { Log } from "@/src/@types/Log";
import { cleanString } from "@/src/helpers/cleanString";
import {
  InfoCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Drawer, Spin, Input, Button, Tooltip, Tag } from "antd";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import React, { useCallback, useState } from "react";
import { Virtuoso } from "react-virtuoso";

const JsonView = dynamic(() => import("@microlink/react-json-view"), {
  ssr: false,
  loading: () => (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Spin spinning={true}>
        <div style={{ height: "20px" }} />
      </Spin>
    </div>
  ),
});

interface LogsContentProps {
  logs: Log[];
  accountId: string;
  prefixId: string;
  logId: string | null;
  log: Log | null;
  isLogLoading: boolean;
  isLogsLoading: boolean;
  isRefreshing: boolean;

  onRefresh: () => void;
  setLogId: (id: string | null) => void;
  loadMoreLogs: () => void;
  setAccountId: (accountId: string) => void;
}

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("default", { month: "short" });
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${day} ${month} ${hours}:${minutes}:${seconds}`;
};

export const LogsContent = ({
  logs,
  log,
  isLogsLoading,
  setLogId,
  logId,
  loadMoreLogs,
  setAccountId,
  accountId,
  isRefreshing,
  onRefresh,
  prefixId,
}: LogsContentProps) => {
  const router = useRouter();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const handleAccountClick = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    router.push(`/prefix/${prefixId}/${accountId}`);
  };

  const handleRowClick = useCallback(
    (logItem: Log) => {
      const isSelected = logItem._id === logId;
      setLogId(isSelected ? null : logItem._id);
      setIsDrawerVisible(!isSelected);
    },
    [logId, setLogId]
  );

  const LogRow = React.memo(({ logItem }: { logItem: Log }) => {
    if (!logItem || !logItem._id) return null;

    const getLogStyle = (level: string) => {
      switch (level) {
        case "info":
          return { color: "#1E88E5", backgroundColor: "rgba(30, 136, 229, 0.1)" };
        case "error":
          return { color: "#E53935", backgroundColor: "rgba(229, 57, 53, 0.1)" };
        case "warn":
          return { color: "#FFC107", backgroundColor: "rgba(255, 193, 7, 0.1)" };
        default:
          return { color: "#1E88E5", backgroundColor: "transparent" };
      }
    };

    const style = getLogStyle(logItem.level);

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: style.backgroundColor,
          padding: "8px 12px",
          cursor: "pointer",
          borderBottom: "1px solid #ddd",
          height: "50px",
        }}
        onClick={() => handleRowClick(logItem)}
      >
        <div style={{ width: "30px", textAlign: "center", flexShrink: 0 }}>
          {logItem.level === "info" ? (
            <InfoCircleOutlined
              style={{ color: style.color, fontSize: "18px" }}
            />
          ) : logItem.level === "error" ? (
            <CloseCircleOutlined
              style={{ color: style.color, fontSize: "18px" }}
            />
          ) : logItem.level === "warn" ? (
            <WarningOutlined style={{ color: style.color, fontSize: "18px" }} />
          ) : null}
        </div>
        <div
          style={{
            flex: 1,
            padding: "0 10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ marginRight: "8px" }}>{logItem.message}</span>
          {!accountId && (
            <Tooltip title="Перейти к логам аккаунта">
              <Tag
                style={{ 
                  cursor: "pointer",
                  backgroundColor: "#f5f5f5",
                  color: "#262626",
                  borderColor: "#8c8c8c",
                  fontWeight: 500
                }}
                onClick={(e) => {
                  if (logItem.metadata.accountId)
                    handleAccountClick(e, logItem.metadata.accountId);
                }}
              >
                {logItem.metadata.accountId}
              </Tag>
            </Tooltip>
          )}
        </div>
        <div
          style={{
            width: "130px",
            textAlign: "right",
            flexShrink: 0,
            marginLeft: "auto",
            fontSize: "12px",
            color: "#555",
          }}
        >
          {formatDate(logItem.timestamp)}
        </div>
      </div>
    );
  });

  const LoadingIndicator = () => (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Spin spinning={true}>
        <div style={{ height: "20px" }} />
      </Spin>
    </div>
  );

  const closeDrawer = () => {
    setIsDrawerVisible(false);
    setLogId(null);
  };

  const getJsonData = useCallback((data: any) => {
    if (!data) return {};

    try {
      return typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
      return {};
    }
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Virtuoso
          style={{ flex: 1 }}
          data={logs}
          endReached={loadMoreLogs}
          overscan={200}
          itemContent={(_, logItem) => <LogRow logItem={logItem} />}
          components={{
            ...(isLogsLoading && { Footer: LoadingIndicator }),
          }}
        />

        {logs.length === 0 && !isLogsLoading && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            Логи не найдены
          </div>
        )}
      </div>

      <Drawer
        title="Log Details"
        placement="right"
        width={600}
        open={isDrawerVisible}
        onClose={closeDrawer}
        destroyOnClose
      >
        {!log?.metadata ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin spinning={true}>
              <div style={{ height: "20px" }} />
            </Spin>
          </div>
        ) : (
          <JsonView
            src={getJsonData(log.metadata)}
            displayDataTypes={false}
            enableClipboard={true}
            collapsed={2}
            name={false}
            style={{
              backgroundColor: "transparent",
              fontFamily: "monospace",
            }}
          />
        )}
      </Drawer>
    </div>
  );
};
