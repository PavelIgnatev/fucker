// LogsContainer.tsx

"use client";
import React, { useState } from "react";
import { useInfiniteQuery, useQuery } from "react-query";

import { getLog, getLogs } from "@/src/db/logs";

import { LogsHeader } from "./__header/logs__header";
import { LogsContent } from "./__content/logs__content";
import { LogsStats } from "./__stats/logs__stats";
import { message } from "antd";
import { Log } from "@/src/@types/Log";

const limit = 100;

interface LogsContainerProps {
  prefixId: string;
  initialAccountId?: string;
}

export const LogsContainer = ({
  prefixId,
  initialAccountId,
}: LogsContainerProps) => {
  const [logId, setLogId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string>(initialAccountId || "");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: logsData,
    isLoading: isLogsLoading,
    isFetchingNextPage: isFetchingNextPage,
    fetchNextPage: fetchNextPage,
    hasNextPage: hasNextPage,
    refetch: refetchLogs,
  } = useInfiniteQuery<Log[], Error>(
    ["logs", accountId, prefixId],
    ({ pageParam = 0 }) =>
      getLogs(pageParam, limit, prefixId, accountId ? accountId : undefined),
    {
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length === limit ? allPages.length * limit : undefined;
      },
      staleTime: Infinity,
      onError: () =>
        message.error(
          "Произошла ошибка при загрузке логов. Попробуйте позднее"
        ),
    }
  );

  const { data: log = null, isLoading: isLogLoading } = useQuery<Log, Error>(
    ["log", logId],
    () => getLog(logId!),
    {
      enabled: !!logId,
      staleTime: Infinity,
      onError: () => message.error("Произошла ошибка. Попробуйте позднее."),
    }
  );

  const loadMoreLogs = () => {
    if (hasNextPage && !isLogsLoading && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetchLogs();
    } catch (error) {
      message.error("Ошибка при обновлении логов");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <LogsHeader 
        prefixId={prefixId} 
        accountId={accountId} 
        onAccountIdChange={setAccountId}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        isLoading={isLogsLoading || isFetchingNextPage}
      />
      <div style={{ flex: 1, display: "flex" }}>
        <LogsStats prefixId={prefixId} accountId={accountId} />
        <div style={{ width: "60%" }}>
          <LogsContent
            log={log}
            logs={logsData?.pages.flat() || []}
            logId={logId}
            setLogId={setLogId}
            isLogLoading={isLogLoading}
            isLogsLoading={isLogsLoading || isFetchingNextPage}
            loadMoreLogs={loadMoreLogs}
            setAccountId={setAccountId}
            accountId={accountId}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            prefixId={prefixId}
          />
        </div>
      </div>
    </div>
  );
};
