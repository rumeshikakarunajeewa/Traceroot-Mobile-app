import React, { useState } from 'react';
import { LayoutDashboard, Users, Sprout, FileContract, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Farmers } from './pages/Farmers';
import { Users as UsersPage } from './pages/Users';
import { Contracts } from './pages/Contracts';
import { Reports } from './pages/Reports';

type Page = 'dashboard' | 'farmers' | 'users' | 'contracts' | 'reports';

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const navItems: { id: Page; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'farmers', label: 'Farmers', icon: Sprout },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'contracts', label: 'Contracts', icon: FileContract },
    { id: 'reports', label: 'Audits & Reports', icon: ClipboardCheck },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a120c' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 250,
          background: '#0e1710',
          borderRight: '1px solid #1a2a1d',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8, marginBottom: 32 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: '#255d35',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sprout size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#f0f5f1', letterSpacing: -0.3 }}>TraceRoot</div>
              <div style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, letterSpacing: 0.8 }}>ADMIN CONSOLE</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: isActive ? '#1b2c1f' : 'transparent',
                    color: isActive ? '#4ade80' : '#8da693',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={17} color={isActive ? '#4ade80' : '#7a9a81'} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Footer Badge */}
        <div style={{ padding: 12, background: '#131e15', borderRadius: 8, border: '1px solid #1f3223' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={16} color="#4ade80" />
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e5ede7' }}>Root Authority</div>
          </div>
          <div style={{ fontSize: 11, color: '#7a9a81', marginTop: 3 }}>Supabase Ledger Verified</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'farmers' && <Farmers />}
        {currentPage === 'users' && <UsersPage />}
        {currentPage === 'contracts' && <Contracts />}
        {currentPage === 'reports' && <Reports />}
      </main>
    </div>
  );
}

