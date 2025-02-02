"use client";

import { LogsContainer } from "@/src/widgets/Logs/logs.container";

interface PrefixAccountPageProps {
  params: {
    prefixId: string;
    accountId: string;
  };
}

export default function PrefixAccountPage({ params }: PrefixAccountPageProps) {
  const { prefixId, accountId } = params;

  return (
    <main>
      <LogsContainer prefixId={prefixId} initialAccountId={accountId} />
    </main>
  );
} 