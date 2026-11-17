import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DataTable } from '../components/DataTable';
import { ShieldCheck, AlertCircle, FileCheck, MapPin } from 'lucide-react';

export function Reports() {
  const [records, setRecords] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [tab, setTab] = useState<'audit' | 'disputes'>('audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const { data: recData } = await supabase
        .from('cultivation_records')
        .select(`
          id,
          stage,
          activity_type,
          title,
          location_name,
          recorded_at,
          integrity_hash,
          is_correction,
          harvests(crop_name),
          profiles!cultivation_records_farmer_id_fkey(full_name)
        `)
        .order('recorded_at', { ascending: false })
        .limit(30);

      const { data: dispData } = await supabase
        .from('disputes')
        .select(`
          id,
          dispute_code,
          category,
          description,
          status,
          created_at,
          reporter:profiles!disputes_reporter_id_fkey(full_name),
          respondent:profiles!disputes_respondent_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      setRecords(recData || []);
      setDisputes(dispData || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const auditColumns = [
    {
      key: 'title',
      header: 'Record & Crop',
      render: (r: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#f0f5f1' }}>{r.title}</div>
          <div style={{ fontSize: 11, color: '#8da693' }}>
            {r.harvests?.crop_name || 'Crop'} • Stage: {r.stage}
          </div>
        </div>
      ),
    },
    {
      key: 'farmer',
      header: 'Farmer',
      render: (r: any) => <span style={{ color: '#c3d6c7' }}>{r.profiles?.full_name || 'Verified Farmer'}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      render: (r: any) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#8da693', fontSize: 11 }}>
          <MapPin size={12} color="#4ade80" /> {r.location_name || 'Field Coordinates'}
        </span>
      ),
    },
    {
      key: 'hash',
      header: 'SHA-256 Integrity',
      render: (r: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={14} color="#4ade80" />
          <code style={{ fontSize: 10, color: '#4ade80', background: '#0e1d11', padding: '2px 4px', borderRadius: 4 }}>
            {r.integrity_hash?.substring(0, 16)}...
          </code>
        </div>
      ),
    },
    {
      key: 'recorded_at',
      header: 'Timestamp',
      render: (r: any) => (
        <span style={{ fontSize: 11, color: '#7a9a81' }}>{new Date(r.recorded_at).toLocaleDateString()}</span>
      ),
    },
  ];

  const disputeColumns = [
    {
      key: 'code',
      header: 'Case ID',
      render: (d: any) => <strong style={{ color: '#f0f5f1' }}>{d.dispute_code}</strong>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (d: any) => (
        <span style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>
          {d.category?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'parties',
      header: 'Parties Involved',
      render: (d: any) => (
        <div style={{ fontSize: 11, color: '#8da693' }}>
          {d.reporter?.full_name} ➔ {d.respondent?.full_name}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d: any) => (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            background: d.status === 'resolved' ? '#173620' : '#331e13',
            color: d.status === 'resolved' ? '#4ade80' : '#f97316',
          }}
        >
          {d.status?.toUpperCase()}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f5f1' }}>Audits & Compliance Reports</h1>
          <p style={{ color: '#8da693', fontSize: 13, marginTop: 4 }}>
            Cryptographic ledger integrity proofs and dispute arbitration reports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, background: '#131e15', padding: 4, borderRadius: 8, border: '1px solid #1f3223' }}>
          <button
            onClick={() => setTab('audit')}
            style={{
              background: tab === 'audit' ? '#255d35' : 'transparent',
              color: tab === 'audit' ? '#ffffff' : '#8da693',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ledger Audit Feed
          </button>
          <button
            onClick={() => setTab('disputes')}
            style={{
              background: tab === 'disputes' ? '#255d35' : 'transparent',
              color: tab === 'disputes' ? '#ffffff' : '#8da693',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Disputes ({disputes.length})
          </button>
        </div>
      </div>

      {tab === 'audit' ? (
        <DataTable
          columns={auditColumns}
          data={records}
          isLoading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search cultivation records..."
        />
      ) : (
        <DataTable
          columns={disputeColumns}
          data={disputes}
          isLoading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search dispute complaints..."
        />
      )}
    </div>
  );
}

