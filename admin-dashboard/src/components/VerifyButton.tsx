import React, { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

interface VerifyButtonProps {
  requestId: string;
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string, reason?: string) => Promise<void>;
}

export function VerifyButton({ requestId, onApprove, onReject }: VerifyButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(requestId);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Enter reason for rejection:');
    if (reason === null) return;
    setLoading(true);
    try {
      await onReject(requestId, reason);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#8da693', fontSize: 12 }}>
        <Loader2 size={14} className="animate-spin" /> Processing...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        onClick={handleApprove}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: '#166534',
          color: '#ffffff',
          border: 'none',
          padding: '5px 10px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <Check size={14} /> Approve
      </button>

      <button
        onClick={handleReject}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: '#991b1b',
          color: '#ffffff',
          border: 'none',
          padding: '5px 10px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <X size={14} /> Reject
      </button>
    </div>
  );
}

