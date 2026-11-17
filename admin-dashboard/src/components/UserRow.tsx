import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export interface UserRowData {
  id: string;
  role: 'farmer' | 'buyer' | 'supplier' | 'admin';
  full_name: string;
  district?: string;
  is_verified?: boolean;
  trust_score?: number;
  phone?: string;
  created_at: string;
}

interface UserRowProps {
  user: UserRowData;
  onToggleVerify?: (id: string, currentVerified: boolean) => void;
  onScoreAdjust?: (id: string, delta: number) => void;
}

export function UserRow({ user, onToggleVerify, onScoreAdjust }: UserRowProps) {
  const roleColors: Record<string, { bg: string; text: string }> = {
    farmer: { bg: '#173620', text: '#4ade80' },
    buyer: { bg: '#102e48', text: '#60a5fa' },
    supplier: { bg: '#392812', text: '#fbbf24' },
    admin: { bg: '#331b3e', text: '#c084fc' },
  };

  const currentRoleStyle = roleColors[user.role] || { bg: '#1a261c', text: '#8da693' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: '#1b2c1f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4ade80',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {user.full_name?.charAt(0) || 'U'}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#f0f5f1', fontSize: 14 }}>{user.full_name}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: 4,
                background: currentRoleStyle.bg,
                color: currentRoleStyle.text,
              }}
            >
              {user.role}
            </span>
            {user.is_verified && (
              <span title="Identity Verified" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <CheckCircle2 size={14} color="#4ade80" />
              </span>
            )}
          </div>
          <div style={{ color: '#8da693', fontSize: 12, marginTop: 2 }}>
            {user.district || 'Sri Lanka'} • {user.phone || 'No phone'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: '#16281a',
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            color: '#4ade80',
          }}
        >
          <ShieldCheck size={13} color="#4ade80" />
          <span>{user.trust_score || 80}%</span>
        </div>

        {onScoreAdjust && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => onScoreAdjust(user.id, -5)}
              style={{
                background: '#1f3223',
                border: 'none',
                color: '#e5ede7',
                padding: '3px 6px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              -5
            </button>
            <button
              onClick={() => onScoreAdjust(user.id, 5)}
              style={{
                background: '#1f3223',
                border: 'none',
                color: '#e5ede7',
                padding: '3px 6px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              +5
            </button>
          </div>
        )}

        {onToggleVerify && (
          <button
            onClick={() => onToggleVerify(user.id, !!user.is_verified)}
            style={{
              background: user.is_verified ? '#3b1c1c' : '#1c3d25',
              border: 'none',
              color: user.is_verified ? '#f87171' : '#4ade80',
              padding: '5px 10px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {user.is_verified ? 'Revoke' : 'Verify'}
          </button>
        )}
      </div>
    </div>
  );
}

