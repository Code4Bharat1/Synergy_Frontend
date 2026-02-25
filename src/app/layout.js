import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
export const metadata = {
  title: "Synergy",
  description: "Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-inter`}>
        <Toaster position="top-right" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
