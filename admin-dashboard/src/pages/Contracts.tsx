import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DataTable } from '../components/DataTable';
import { FileText, CheckCircle2, Clock } from 'lucide-react';

export function Contracts() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadContracts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('buyback_agreements')
        .select(`
          id,
          agreement_code,
          crop_name,
          target_quantity,
          unit,
          agreed_price,
          total_commitment,
          status,
          deadline,
          created_at,
          supplier:profiles!buyback_agreements_supplier_id_fkey(full_name, farm_name),
          farmer:profiles!buyback_agreements_farmer_id_fkey(full_name, farm_name)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAgreements(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContracts();
  }, []);

  const filtered = agreements.filter((a) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      a.agreement_code?.toLowerCase().includes(q) ||
      a.crop_name?.toLowerCase().includes(q) ||
      a.supplier?.full_name?.toLowerCase().includes(q) ||
      a.farmer?.full_name?.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: 'code',
      header: 'Agreement Code',
      render: (a: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#f0f5f1' }}>
          <FileText size={15} color="#4ade80" /> {a.agreement_code}
        </div>
      ),
    },
    {
      key: 'crop',
      header: 'Crop & Volume',
      render: (a: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#e5ede7' }}>{a.crop_name}</div>
          <div style={{ fontSize: 11, color: '#8da693' }}>
            {a.target_quantity} {a.unit} @ Rs. {a.agreed_price}
          </div>
        </div>
      ),
    },
    {
      key: 'parties',
      header: 'Contracting Parties',
      render: (a: any) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ color: '#8da693' }}>
            Supplier: <strong style={{ color: '#e5ede7' }}>{a.supplier?.farm_name || a.supplier?.full_name || 'N/A'}</strong>
          </div>
          <div style={{ color: '#8da693' }}>
            Farmer: <strong style={{ color: '#e5ede7' }}>{a.farmer?.farm_name || a.farmer?.full_name || 'N/A'}</strong>
          </div>
        </div>
      ),
    },
    {
      key: 'commitment',
      header: 'Total Value',
      render: (a: any) => (
        <span style={{ fontWeight: 700, color: '#4ade80', fontSize: 13 }}>
          Rs. {Number(a.total_commitment || a.target_quantity * a.agreed_price).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a: any) => {
        const isDone = a.status === 'fulfilled' || a.status === 'active';
        return (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 4,
              textTransform: 'uppercase',
              background: isDone ? '#173620' : '#2b2a1a',
              color: isDone ? '#4ade80' : '#fbbf24',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {isDone ? <CheckCircle2 size={11} /> : <Clock size={11} />} {a.status}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f5f1' }}>Contracts & Buyback Oversight</h1>
        <p style={{ color: '#8da693', fontSize: 13, marginTop: 4 }}>
          Monitor contract commitments, target delivery dates, and commercial agriculture pledges.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isLoading={loading}
        searchPlaceholder="Filter contracts by code, crop, or party..."
      />
    </div>
  );
}

