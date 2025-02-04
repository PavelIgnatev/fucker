"use server";

import { coreDB } from "./db";

interface Account {
  accountId: string;
  username?: string;
  dcId?: string;
  prefix: string;
  parentAccountId?: string;
  prevApiId?: string;
  nextApiId?: string;
  phone?: string;
  [key: string]: any;
}

const getAccountsCollection = async () => {
  return (await coreDB()).collection<Account>("accounts");
};

export async function checkExistingAccounts(
  authKeys: string[]
): Promise<string[]> {
  const accountsCollection = await getAccountsCollection();

  const existingAccounts = await accountsCollection
    .find({ accountId: { $in: authKeys } })
    .project({ accountId: 1 })
    .toArray();

  return existingAccounts.map((account) => account.accountId);
}

export async function getAccountsByPrefix(prefix: string): Promise<Account[]> {
  const accountsCollection = await getAccountsCollection();
  return accountsCollection.find({ prefix }, {
    projection: {
      accountId: 1,
      username: 1,
      dcId: 1,
      prefix: 1,
      parentAccountId: 1,
      prevApiId: 1,
      nextApiId: 1,
      phone: 1,
      workedOut: 1,
      error: 1,
      reason: 1,
      banned: 1,
      stable: 1
    }
  }).toArray();
}

export async function createAccounts(accounts: string[], prefix: string) {
  const accountsCollection = await getAccountsCollection();

  const accountsToInsert = accounts.map((account) => {
    const [authKey, dcId] = account.split(":");
    const username = authKey.slice(0, 32);

    const data: any = {
      accountId: username,
      dcId: Number(dcId),
      prefix,
    };
    data[`dc${dcId}`] = authKey;

    return data;
  });

  if (accountsToInsert.length > 0) {
    await accountsCollection.insertMany(accountsToInsert);
  }

  return accountsToInsert;
}

export async function getAccountById(accountId: string) {
  const accountsCollection = await getAccountsCollection();

  const account = await accountsCollection.findOne({ 
    accountId,
  }, {
    projection: {
      accountId: 1,
      username: 1,
      dcId: 1,
      prefix: 1,
      parentAccountId: 1,
      prevApiId: 1,
      nextApiId: 1
    }
  });

  return account;
}

export async function getAllAccountsByPrefixes(prefixes: string[]): Promise<Account[]> {
  const accountsCollection = await getAccountsCollection();
  const accounts = await accountsCollection.find(
    { prefix: { $in: prefixes } },
    {
      projection: {
        _id: 0,
        accountId: 1,
        prefix: 1,
        parentAccountId: 1,
        workedOut: 1,
        error: 1,
        reason: 1,
        banned: 1,
        stable: 1
      }
    }
  ).toArray();
  
  return accounts;
}
