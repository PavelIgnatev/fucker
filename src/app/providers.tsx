"use client";

import { config as dotenvConfig } from "dotenv";
import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";

dotenvConfig();

const Provider = (props: { children: ReactNode }) => {
  const { children } = props;

  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default Provider;
