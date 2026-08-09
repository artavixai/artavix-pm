import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
  return (
    <div dir="ltr" className="bg-gradient-to-br from-slate-50 to-slate-100 h-screen overflow-hidden flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto relative scrollbar-flat">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;