// admin/src/components/Layout.tsx
// ────────────────────────────────
// The shared page frame: fixed Sidebar on the left, scrollable content on the
// right. <Outlet/> is where react-router injects the matched child page, so
// every page inside this layout gets the sidebar for free.

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Sidebar />
      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
