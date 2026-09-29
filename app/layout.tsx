import type { Metadata } from 'next';
import './globals.css';
import React from 'react';

export const metadata: Metadata = {
  title: 'BehaviorX | Autonomous Behavioral State Mapper & Bug Replay',
  description: 'Test what your app actually does — not what you think it does.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen font-sans antialiased selection:bg-zinc-800">
        {children}
      </body>
    </html>
  );
}
