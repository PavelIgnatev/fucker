"use server";

import { Prefix } from "../@types/Prefix";
import { coreDB } from "./db";
import { createAccounts } from "./accounts";

const getPrefixesCollection = async () => {
  return (await coreDB()).collection("prefixes");
};

export async function getAllPrefixes(): Promise<Prefix[]> {
  const prefixesCollection = await getPrefixesCollection();

  const prefixes = await prefixesCollection
    .find({})
    .sort({ dateCreated: -1 })
    .toArray();

  return prefixes.map((prefix) => ({
    ...prefix,
    _id: prefix._id.toString(),
    dateCreated: prefix.dateCreated.toISOString(),
    dateUpdated: prefix.dateUpdated.toISOString(),
  })) as Prefix[];
}

export async function createPrefix(
  prefix: string,
  description: string,
  accounts: string[]
): Promise<Prefix> {
  const db = await coreDB();
  const now = new Date();

  await createAccounts(accounts, prefix);

  const newPrefix: Omit<Prefix, "_id"> = {
    prefix,
    metadata: {
      description,
      accounts,
    },
    dateCreated: now,
    dateUpdated: now,
  };

  const result = await db
    .collection<Prefix>("prefixes")
    .insertOne(newPrefix as any);

  return {
    ...newPrefix,
    _id: result.insertedId.toString(),
    dateCreated: now,
    dateUpdated: now,
  };
}
