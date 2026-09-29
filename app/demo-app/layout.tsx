import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'NovaStore | High-Performance Gear',
  description: 'Industrial tech and developer gear marketplace',
};

export default function DemoAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-zinc-800">
      {children}
    </div>
  );
}
