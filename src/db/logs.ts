// db/logs.ts

"use server";
import { ObjectId } from "mongodb";

import { Log } from "../@types/types";

import { DB } from "./db";

const getLogsCollection = async () => {
  return (await DB()).collection("fucker");
};

export const getLogs = async (
  skip = 0,
  limit = 100,
  withAccountId: boolean,
  levels?: string[], // Изменено на массив
  accountId?: string // Новый параметр для accountId
) => {
  const logsCollection = await getLogsCollection();

  const query: any = {};

  if (withAccountId) {
    if (accountId && accountId.trim() !== "") {
      query["metadata.accountId"] = accountId.trim();
    } else {
      query["metadata.accountId"] = { $exists: true, $ne: null };
    }
  } else {
    query["metadata.accountId"] = { $exists: false };
  }

  if (levels && levels.length > 0) {
    query.level = { $in: levels };
  }

  const logs =
    (await logsCollection
      ?.find(query, {
        projection: {
          timestamp: 1,
          level: 1,
          message: 1,
          "metadata.accountId": 1,
        },
      })
      ?.sort({ timestamp: -1 }) // Сортировка по дате в убывающем порядке
      ?.skip(skip)
      ?.limit(limit)
      ?.toArray()) || [];

  return JSON.parse(JSON.stringify(logs)) as Log[];
};

export const getLog = async (id: string) => {
  const logsCollection = await getLogsCollection();

  const log =
    (await logsCollection?.findOne({ _id: new ObjectId(id) })) || null;

  return JSON.parse(JSON.stringify(log)) as Log;
};
