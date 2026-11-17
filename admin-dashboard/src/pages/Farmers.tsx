import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DataTable } from '../components/DataTable';
import { Shield, Check, X } from 'lucide-react';

export function Farmers() {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadFarmers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          farm_name,
          phone,
          district,
          province,
          is_verified,
          trust_score,
          rating,
          created_at,
          farmer_profiles (
            total_acreage,
            primary_crops,
            certifications
          )
        `)
        .eq('role', 'farmer')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setFarmers(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFarmers();
  }, []);

  const handleToggleVerification = async (id: string, current: boolean) => {
    const nextState = !current;
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: nextState, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setFarmers((prev) => prev.map((f) => (f.id === id ? { ...f, is_verified: nextState } : f)));
    }
  };

  const filtered = farmers.filter((f) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      f.full_name?.toLowerCase().includes(q) ||
      f.farm_name?.toLowerCase().includes(q) ||
      f.district?.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: 'full_name',
      header: 'Farmer Name & Farm',
      render: (f: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#f0f5f1' }}>{f.full_name}</div>
          <div style={{ fontSize: 11, color: '#8da693' }}>{f.farm_name || 'Individual Farm'}</div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Region',
      render: (f: any) => (
        <span style={{ color: '#c3d6c7', fontSize: 12 }}>
          {f.district || 'N/A'}, {f.province || ''}
        </span>
      ),
    },
    {
      key: 'acreage',
      header: 'Acreage',
      render: (f: any) => {
        const fp = f.farmer_profiles;
        return <span style={{ color: '#8da693' }}>{fp?.total_acreage ? `${fp.total_acreage} Acres` : '1.0 Acre'}</span>;
      },
    },
    {
      key: 'trust_score',
      header: 'Trust Score',
      render: (f: any) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#4ade80', fontWeight: 600 }}>
          <Shield size={13} /> {f.trust_score || 85}%
        </div>
      ),
    },
    {
      key: 'is_verified',
      header: 'Status',
      render: (f: any) => (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 4,
            background: f.is_verified ? '#173620' : '#2b2a1a',
            color: f.is_verified ? '#4ade80' : '#fbbf24',
          }}
        >
          {f.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (f: any) => (
        <button
          onClick={() => handleToggleVerification(f.id, !!f.is_verified)}
          style={{
            background: f.is_verified ? '#3b1c1c' : '#1c3d25',
            color: f.is_verified ? '#f87171' : '#4ade80',
            border: 'none',
            padding: '5px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {f.is_verified ? 'Revoke' : 'Verify'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f5f1' }}>Farmer Management</h1>
        <p style={{ color: '#8da693', fontSize: 13, marginTop: 4 }}>
          Audit verified landholdings, crop acreage, and farmer reliability scores.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isLoading={loading}
        searchPlaceholder="Filter farmers by name, district, or farm title..."
      />
    </div>
  );
}

