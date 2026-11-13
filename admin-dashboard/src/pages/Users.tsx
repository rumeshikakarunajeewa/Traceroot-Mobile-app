import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserRow, UserRowData } from '../components/UserRow';
import { Search } from 'lucide-react';

export function Users() {
  const [users, setUsers] = useState<UserRowData[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | 'farmer' | 'buyer' | 'supplier'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, role, full_name, phone, district, is_verified, trust_score, created_at')
        .order('created_at', { ascending: false });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data, error } = await query;
      if (!error && data) {
        setUsers(data as UserRowData[]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleToggleVerify = async (id: string, current: boolean) => {
    const next = !current;
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: next, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_verified: next } : u)));
    }
  };

  const handleScoreAdjust = async (id: string, delta: number) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newScore = Math.min(100, Math.max(0, (user.trust_score || 80) + delta));

    const { error } = await supabase
      .from('profiles')
      .update({ trust_score: newScore, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, trust_score: newScore } : u)));
    }
  };

  const filtered = users.filter((u) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.district?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f5f1' }}>User Directory & Permissions</h1>
        <p style={{ color: '#8da693', fontSize: 13, marginTop: 4 }}>
          Cross-role user administration, trust score calibration, and identity status.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            flex: 1,
            background: '#131e15',
            border: '1px solid #1f3223',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Search size={18} color="#7a9a81" />
          <input
            type="text"
            placeholder="Search by full name, district, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e5ede7',
              fontSize: 13,
              width: '100%',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'farmer', 'buyer', 'supplier'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                background: roleFilter === r ? '#255d35' : '#131e15',
                color: roleFilter === r ? '#ffffff' : '#8da693',
                border: '1px solid #1f3223',
                borderRadius: 8,
                padding: '0 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* User Rows List */}
      <div style={{ background: '#131e15', border: '1px solid #1f3223', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8da693' }}>Loading directory...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8da693' }}>No users match your criteria.</div>
        ) : (
          filtered.map((u, i) => (
            <div
              key={u.id}
              style={{ borderBottom: i === filtered.length - 1 ? 'none' : '1px solid #192a1e' }}
            >
              <UserRow
                user={u}
                onToggleVerify={handleToggleVerify}
                onScoreAdjust={handleScoreAdjust}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

