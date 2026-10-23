import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ChatBubble from "../components/ChatBubble";

export const metadata: Metadata = {
  title: "Peaklyy – AI-Powered Gig Recommendation & Career Assistant",
  description: "Upload resumes, receive intelligent gig recommendations, and interact with your personalized AI Career Assistant.",
  icons: {
    icon: "/peaklyy_logo.png",
    apple: "/peaklyy_logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0e0e10] text-[#e5e1e4] selection:bg-[#e8342a]/30 selection:text-[#ffb4aa]">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
            <ChatBubble />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
