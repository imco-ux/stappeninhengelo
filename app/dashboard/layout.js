import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard — Stappen In Hengelo',
};

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a', fontFamily: 'Work Sans, sans-serif' }}>
      <Suspense>{children}</Suspense>
    </div>
  );
}
