// LogsContainer.tsx

"use client";
import React, { useState, useEffect } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";

import { Log } from "@/src/@types/types";
import { getLog, getLogs } from "@/src/db/logs";

import { Logs } from "./logs";

const limit = 100;

export const LogsContainer = () => {
  const [logId, setLogId] = useState<string | null>(null);
  const [leftLogFilter, setLeftLogFilter] = useState<string[]>([]);
  const [rightLogFilter, setRightLogFilter] = useState<string[]>([]);
  const [rightAccountId, setRightAccountId] = useState<string>("");

  const queryClient = useQueryClient();

  // State to track if the user is at the top
  const [leftAtTop, setLeftAtTop] = useState<boolean>(true);
  const [rightAtTop, setRightAtTop] = useState<boolean>(true);

  // Fetch logs without accountId
  const {
    data: leftData,
    isLoading: isLeftLoading,
    isFetchingNextPage: isFetchingLeftNextPage,
    fetchNextPage: fetchLeftNextPage,
    hasNextPage: hasLeftNextPage,
    refetch: refetchLeftLogs,
  } = useInfiniteQuery<Log[], Error>(
    ["logsWithoutAccountId"],
    ({ pageParam = 0 }) =>
      getLogs(
        pageParam,
        limit,
        false,
        leftLogFilter.length > 0 ? leftLogFilter : undefined
      ),
    {
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length === limit ? allPages.length * limit : undefined;
      },
      staleTime: Infinity,
      onError: () =>
        toast.error(
          "Произошла ошибка при загрузке логов без accountId. Попробуйте позднее."
        ),
      enabled: true,
      refetchInterval: leftAtTop ? 25000 : false, // Refetch every 5 seconds only if at top
    }
  );

  // Fetch logs with accountId
  const {
    data: rightData,
    isLoading: isRightLoading,
    isFetchingNextPage: isFetchingRightNextPage,
    fetchNextPage: fetchRightNextPage,
    hasNextPage: hasRightNextPage,
    refetch: refetchRightLogs,
  } = useInfiniteQuery<Log[], Error>(
    ["logsWithAccountId"],
    ({ pageParam = 0 }) =>
      getLogs(
        pageParam,
        limit,
        true,
        rightLogFilter.length > 0 ? rightLogFilter : undefined,
        rightAccountId.trim() !== "" ? rightAccountId : undefined
      ),
    {
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length === limit ? allPages.length * limit : undefined;
      },
      staleTime: Infinity,
      onError: () =>
        toast.error(
          "Произошла ошибка при загрузке логов с accountId. Попробуйте позднее"
        ),
      enabled: true,
      refetchInterval: rightAtTop ? 5000 : false, // Refetch every 5 seconds only if at top
    }
  );

  // Fetch details of a single log
  const { data: log = null, isLoading: isLogLoading } = useQuery<Log, Error>(
    ["log", logId],
    () => getLog(logId!),
    {
      enabled: !!logId,
      staleTime: Infinity,
      onError: () => toast.error("Произошла ошибка. Попробуйте позднее."),
    }
  );

  // Functions to load more logs
  const loadMoreLeftLogs = () => {
    if (hasLeftNextPage && !isLeftLoading && !isFetchingLeftNextPage) {
      fetchLeftNextPage();
    }
  };

  const loadMoreRightLogs = () => {
    if (hasRightNextPage && !isRightLoading && !isFetchingRightNextPage) {
      fetchRightNextPage();
    }
  };

  // Refetch when filters change
  useEffect(() => {
    queryClient.invalidateQueries(["logsWithoutAccountId", leftLogFilter]);
    refetchLeftLogs(); // Optionally trigger immediate refetch
  }, [leftLogFilter, queryClient, refetchLeftLogs]);

  useEffect(() => {
    queryClient.invalidateQueries([
      "logsWithAccountId",
      rightLogFilter,
      rightAccountId,
    ]);
    refetchRightLogs(); // Optionally trigger immediate refetch
  }, [rightLogFilter, rightAccountId, queryClient, refetchRightLogs]);

  // Handlers to capture the 'atTop' state
  const handleLeftAtTopChange = (atTop: boolean) => {
    setLeftAtTop(atTop);
  };

  const handleRightAtTopChange = (atTop: boolean) => {
    setRightAtTop(atTop);
  };

  return (
    <Logs
      log={log}
      logsWithoutAccountId={leftData?.pages.flat() || []}
      logsWithAccountId={rightData?.pages.flat() || []}
      logId={logId}
      setLogId={setLogId}
      isLogLoading={isLogLoading}
      isLeftLoading={isLeftLoading || isFetchingLeftNextPage}
      isRightLoading={isRightLoading || isFetchingRightNextPage}
      loadMoreLeftLogs={loadMoreLeftLogs}
      loadMoreRightLogs={loadMoreRightLogs}
      setLeftLogFilter={setLeftLogFilter}
      setRightLogFilter={setRightLogFilter}
      setRightAccountId={setRightAccountId}
      leftLogFilter={leftLogFilter}
      rightLogFilter={rightLogFilter}
      rightAccountId={rightAccountId}
      onLeftAtTopChange={handleLeftAtTopChange}
      onRightAtTopChange={handleRightAtTopChange}
    />
  );
};
