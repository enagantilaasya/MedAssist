import React, { useState } from 'react';
import { Sparkles, X, Check, AlertTriangle, ListChecks, FileText, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export const AIClinicalSummaryModal = ({ isOpen, onClose, noteData, onApply }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(noteData?.aiSummary || null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.aiSummarizeEncounter({
        patientName: noteData.patientName,
        vitals: noteData.vitals,
        soapNotes: noteData.soapNotes,
        diagnosis: noteData.diagnosis || noteData.soapNotes?.assessment?.primaryDiagnosis
      });
      if (res.success) {
        setSummary(res.data);
      }
    } catch (err) {
      alert('Error generating summary: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>AI Clinical Assistant Note Summary</h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Structured SOAP notes distillation for clinician review</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Patient Context summary strip */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Patient:</span>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{noteData.patientName || 'Selected Patient'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Primary Diagnosis:</span>
              <div style={{ fontWeight: 600, color: '#0284c7' }}>{noteData.diagnosis || noteData.soapNotes?.assessment?.primaryDiagnosis || 'Under Evaluation'}</div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn btn-ai btn-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {summary ? 'Regenerate Summary' : 'Generate with AI'}
            </button>
          </div>

          {summary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Clinical Synopsis Card */}
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9333ea', fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>
                  <FileText size={18} /> Clinical Synopsis
                </div>
                <p style={{ color: '#334155', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                  {summary.clinicalSynopsis}
                </p>
              </div>

              {/* Action Items & Critical Flags Grid */}
              <div className="grid-2">
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                    <ListChecks size={18} /> Action Items & Next Steps
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {(summary.keyActionItems || []).map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                    <AlertTriangle size={18} /> Critical Alerts & Vitals Flags
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {(summary.criticalFlags || []).map((flag, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>{flag}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
              <Sparkles size={36} color="#a855f7" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>No AI Clinical Summary generated yet</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '450px', margin: '0 auto 16px auto' }}>
                Click "Generate with AI" above to let our clinical engine summarize SOAP observations, vitals stability, and next steps.
              </div>
              <button onClick={handleGenerate} disabled={loading} className="btn btn-ai">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Generate Clinical Summary
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
            {summary && onApply && (
              <button
                onClick={() => {
                  onApply(summary);
                  onClose();
                }}
                className="btn btn-primary"
              >
                <Check size={16} /> Attach to Encounter Record
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
