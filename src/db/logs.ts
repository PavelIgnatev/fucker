// db/logs.ts

"use server";
import { ObjectId } from "mongodb";

import { Log } from "@/src/@types/Log";

import { logsDB } from "./db";
import { getAccountById } from "./accounts";
import { cleanString } from "../helpers/cleanString";

const getLogsCollection = async () => {
  return (await logsDB()).collection("fucker_logs");
};

export const getUniquePrefixes = async () => {
  const logsCollection = await getLogsCollection();

  const prefixes = await logsCollection.distinct("metadata.prefix");
  return prefixes;
};

export const getLogs = async (
  skip = 0,
  limit = 100,
  prefix?: string,
  accountId?: string
) => {
  const logsCollection = await getLogsCollection();

  const query: any = {};

  if (prefix) {
    query["metadata.prefix"] = prefix;
  }

  if (accountId && accountId.trim() !== "") {
    const trimmedAccountId = cleanString(accountId);
    const account = await getAccountById(trimmedAccountId);

    if (trimmedAccountId.length === 32) {
      if (account?.id) {
        query["metadata.accountId"] = {
          $in: [trimmedAccountId, account.id],
        };
      } else {
        query["metadata.accountId"] = trimmedAccountId;
      }
    } else {
      if (account?.parentAccountId) {
        query["metadata.accountId"] = {
          $in: [trimmedAccountId, account.parentAccountId],
        };
      } else {
        query["metadata.accountId"] = trimmedAccountId;
      }
    }
  } else {
    query["metadata.accountId"] = { $exists: true, $ne: null };
  }

  const logs =
    (await logsCollection
      ?.find(query, {
        projection: {
          timestamp: 1,
          level: 1,
          message: 1,
          "metadata.accountId": 1,
          "metadata.prefix": 1,
        },
      })
      ?.sort({ timestamp: -1 })
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
