import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar }  from './TopBar';

export function Layout() {
  return (
    <div className="flex h-screen bg-surface-950 text-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
