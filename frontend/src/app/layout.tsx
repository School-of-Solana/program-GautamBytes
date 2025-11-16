import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletConnectProvider } from "./components/WalletConnectProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solana Link Profile",
  description: "My School of Solana dApp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletConnectProvider>{children}</WalletConnectProvider>
      </body>
    </html>
  );
}
