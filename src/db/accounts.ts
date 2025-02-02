"use server";

import { coreDB } from "./db";

const getAccountsCollection = async () => {
  return (await coreDB()).collection("accounts");
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
  
  const account = await accountsCollection.findOne({ accountId });
  
  return account;
}
