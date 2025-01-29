"use server";
import { MongoClient, Db } from "mongodb";

let db: Db | null = null;
let connectionTimestamp: number | null = null;
const CONNECTION_LIFETIME = 5 * 60 * 1000;

export const DB = async (): Promise<Db> => {
  const currentTimestamp = Date.now();

  if (
    db &&
    connectionTimestamp &&
    currentTimestamp - connectionTimestamp < CONNECTION_LIFETIME
  ) {
    return db;
  }

  try {
    const client = new MongoClient(
      String(
        "mongodb://gen_user:%5C%7Dc%3C%24q%3C3j8O_%26g@193.108.115.154:27017/winston?authSource=admin&directConnection=true"
      )
    );
    const connect = await client.connect();
    db = connect.db("winston");
    connectionTimestamp = Date.now();

    return db;
  } catch (e) {
    throw new Error("DB not initialized. Retry.");
  }
};
