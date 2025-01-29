import type { Metadata } from "next";
import { ToastContainer } from "react-toastify";

import Provider from "./providers";

import "react-toastify/dist/ReactToastify.css";
import "@/public/css/normalize.css";

export const metadata: Metadata = {
  title: "Logger",
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
        <body>
          {children}
          <ToastContainer />
        </body>
      </Provider>
    </html>
  );
};

export default RootLayout;
