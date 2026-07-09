
//import type { Metadata } from "next";
import { Provider } from "@/globalx/GlobalContext";
import { Geist, Geist_Mono } from "next/font/google";
//import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// import MyNav from '@/components/ui/Nav/Wrap';
//import { Provider } from '../globex/GlobalContext';

// export const metadata = {
//   title: "OLLAMAVERSE",
//   description: "Local AI Interface — powered by Ollama",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 10, padding: 15, background: "#0a0a12" }}>
        <Provider>
       {/*    <MyNav> */}
     <main>{children}</main>
         
          {/* </MyNav>*/}
        </Provider> 
      </body>
    </html>
  );
}
