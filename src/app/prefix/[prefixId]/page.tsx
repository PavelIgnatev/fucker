"use client";

import { LogsContainer } from "@/src/widgets/Logs/logs.container";

interface PrefixPageProps {
  params: {
    prefixId: string;
  };
}

const PrefixPage = ({ params }: PrefixPageProps) => {
  return <LogsContainer prefixId={params.prefixId} />;
};

export default PrefixPage;
