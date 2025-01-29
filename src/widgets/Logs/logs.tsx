import {
  InfoCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Drawer, Select, Spin, Input } from "antd";
import dynamic from "next/dynamic";
import React, { useCallback, useState } from "react";
import { Virtuoso } from "react-virtuoso";

import { Log } from "@/src/@types/types";

const { Option } = Select;

const JsonView = dynamic(() => import("@microlink/react-json-view"), {
  ssr: false,
  loading: () => (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Spin tip="Loading..." />
    </div>
  ),
});

interface LogsProps {
  logsWithoutAccountId: Log[];
  logsWithAccountId: Log[];
  log: Log | null;
  isLogLoading: boolean;
  isLeftLoading: boolean;
  isRightLoading: boolean;
  setLogId: (id: string | null) => void;
  logId: string | null;
  loadMoreLeftLogs: () => void;
  loadMoreRightLogs: () => void;
  setLeftLogFilter: (levels: string[]) => void;
  setRightLogFilter: (levels: string[]) => void;
  setRightAccountId: (accountId: string) => void;
  leftLogFilter: string[];
  rightLogFilter: string[];
  rightAccountId: string;
  onLeftAtTopChange: (atTop: boolean) => void;
  onRightAtTopChange: (atTop: boolean) => void;
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

export const Logs = ({
  logsWithoutAccountId,
  logsWithAccountId,
  log,
  isLeftLoading,
  isRightLoading,
  setLogId,
  logId,
  loadMoreLeftLogs,
  loadMoreRightLogs,
  setLeftLogFilter,
  setRightLogFilter,
  setRightAccountId,
  leftLogFilter,
  rightLogFilter,
  rightAccountId,
  onLeftAtTopChange,
  onRightAtTopChange,
}: LogsProps) => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLeftSideClick, setIsLeftSideClick] = useState(false);

  console.log(logsWithAccountId);

  const handleRowClick = useCallback(
    (logItem: Log, isLeft: boolean) => {
      const isSelected = logItem._id === logId;
      setLogId(isSelected ? null : logItem._id);
      setIsLeftSideClick(isLeft);
      setIsDrawerVisible(!isSelected);
    },
    [logId, setLogId]
  );

  const LogRow = React.memo(
    ({ logItem, isLeft }: { logItem: Log; isLeft: boolean }) => {
      if (!logItem || !logItem._id) return null;

      const backgroundColor =
        logItem.level === "info"
          ? "rgba(30, 136, 229, 0.1)"
          : logItem.level === "error"
            ? "rgba(229, 57, 53, 0.1)"
            : logItem.level === "warn"
              ? "rgba(255, 193, 7, 0.1)"
              : "transparent";

      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor,
            padding: "8px 12px",
            cursor: "pointer",
            borderBottom: "1px solid #ddd",
            height: "50px",
          }}
          onClick={() => handleRowClick(logItem, isLeft)}
        >
          <div style={{ width: "30px", textAlign: "center", flexShrink: 0 }}>
            {logItem.level === "info" ? (
              <InfoCircleOutlined
                style={{ color: "#1E88E5", fontSize: "18px" }}
              />
            ) : logItem.level === "error" ? (
              <CloseCircleOutlined
                style={{ color: "#E53935", fontSize: "18px" }}
              />
            ) : logItem.level === "warn" ? (
              <WarningOutlined style={{ color: "#FFC107", fontSize: "18px" }} />
            ) : null}
          </div>
          <div style={{ flex: 1, padding: "0 10px" }}>{logItem.message}</div>
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
    }
  );

  const LoadingIndicator = () => (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Spin tip="Loading..." />
    </div>
  );

  const closeDrawer = () => {
    setIsDrawerVisible(false);
    setLogId(null);
  };

  const handleLeftFilterChange = (values: string[]) => {
    setLeftLogFilter(values);
  };

  const handleRightFilterChange = (values: string[]) => {
    setRightLogFilter(values);
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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        style={{
          padding: "10px",
          paddingLeft: "15px",
          paddingRight: "28px",
          backgroundColor: "#f0f0f0",
          borderBottom: "1px solid #ddd",
          display: "grid",
          gridTemplateColumns: "1.49fr 1px 3.5fr",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={{ marginRight: "10px" }}>
            Фильтр для глобальных событий:
          </label>
          <Select
            mode="multiple"
            value={leftLogFilter}
            onChange={handleLeftFilterChange}
            placeholder="Выберите уровни"
            style={{ width: "200px" }}
            allowClear
          >
            <Option value="info">Info</Option>
            <Option value="error">Error</Option>
            <Option value="warn">Warn</Option>
          </Select>
        </div>
        <div
          style={{ width: "1px", backgroundColor: "#ddd", height: "100%" }}
        ></div>
        <div
          style={{
            paddingLeft: "15px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <label style={{ marginRight: "10px" }}>
              Фильтр для событий по аккаунтам:
            </label>
            <Select
              mode="multiple"
              value={rightLogFilter}
              onChange={handleRightFilterChange}
              placeholder="Выберите уровни"
              style={{ width: "200px" }}
              allowClear
            >
              <Option value="info">Info</Option>
              <Option value="error">Error</Option>
              <Option value="warn">Warn</Option>
            </Select>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <label style={{ marginRight: "10px" }}>Фильтр по accountId:</label>
            <Input
              placeholder="Введите accountId"
              value={rightAccountId}
              onChange={(e) => setRightAccountId(e.target.value)}
              style={{ width: "200px" }}
              allowClear
            />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div
          style={{
            flex: 1.5,
            borderRight: "1px solid #ddd",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Virtuoso
            style={{ flex: 1 }}
            data={logsWithoutAccountId}
            endReached={loadMoreLeftLogs}
            overscan={200}
            itemContent={(index, logItem) => (
              <LogRow logItem={logItem} isLeft={true} />
            )}
            components={{
              ...(isLeftLoading && { Footer: LoadingIndicator }),
            }}
            atTopStateChange={(atTop) => onLeftAtTopChange(atTop)}
          />
          {logsWithoutAccountId.length === 0 && !isLeftLoading && (
            <div style={{ textAlign: "center", padding: "20px" }}>
              Нет логов без accountId.
            </div>
          )}
        </div>

        <div
          style={{
            flex: 3.5,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Virtuoso
            style={{ flex: 1 }}
            data={logsWithAccountId}
            endReached={loadMoreRightLogs}
            overscan={200}
            itemContent={(index, logItem) => (
              <LogRow logItem={logItem} isLeft={false} />
            )}
            components={{
              ...(isRightLoading && { Footer: LoadingIndicator }),
            }}
            atTopStateChange={(atTop) => onRightAtTopChange(atTop)}
          />

          {logsWithAccountId.length === 0 && !isRightLoading && (
            <div style={{ textAlign: "center", padding: "20px" }}>
              Нет логов с accountId.
            </div>
          )}
        </div>
      </div>

      <Drawer
        title="Log Details"
        placement="right"
        width={isLeftSideClick ? 900 : 600}
        onClose={closeDrawer}
        visible={isDrawerVisible}
      >
        {!log?.metadata ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin tip="Loading..." />
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
