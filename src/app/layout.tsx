import type { Metadata } from "next";

import Provider from "./providers";

import "@/public/css/normalize.css";

export const metadata: Metadata = {
  title: "Fucker",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🥷🏻</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

const RootLayout = (
  props: Readonly<{
    children: React.ReactNode;
  }>
) => {
  const { children } = props;

  return (
    <html lang="en" suppressHydrationWarning>
      <Provider>
        <body suppressHydrationWarning>{children}</body>
      </Provider>
    </html>
  );
};

export default RootLayout;
