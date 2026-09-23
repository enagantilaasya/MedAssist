import React, { useState } from 'react';
import { Sparkles, X, Heart, ShieldAlert, CheckCircle2, Pill, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export const AIPatientExplainerModal = ({ isOpen, onClose, prescription }) => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(prescription?.aiPlainLanguageExplanation || null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prescription?._id) return;
    setLoading(true);
    try {
      const res = await api.explainPrescriptionAI(prescription._id);
      if (res.success) {
        setExplanation(res.data);
      }
    } catch (err) {
      alert('Error explaining prescription: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669, #0d9488)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Heart size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Your Plain-Language Medicine Guide</h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>AI explanation of doses, timings, food rules, and warnings</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Friendly Banner */}
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ maxWidth: '80%' }}>
              <div style={{ fontWeight: 700, color: '#065f46', fontSize: '0.95rem' }}>
                Prescription #{prescription?.prescriptionNumber || 'RX-Current'}
              </div>
              <p style={{ margin: '4px 0 0 0', color: '#047857', fontSize: '0.85rem' }}>
                {explanation?.summary || 'Clear explanations to make taking your medicine safe and easy.'}
              </p>
            </div>
            {!explanation && (
              <button onClick={handleGenerate} disabled={loading} className="btn btn-teal btn-sm">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Generate Guide
              </button>
            )}
          </div>

          {explanation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Medicine Cards */}
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Pill size={18} color="#0284c7" /> How to take your medicines
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(explanation.medicationGuide || []).map((item, idx) => (
                  <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{item.medicine}</span>
                      <span style={{ background: '#f0fdf4', color: '#15803d', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px' }}>
                        Active Medicine
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginTop: '10px' }}>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                        <strong style={{ color: '#475569', display: 'block', marginBottom: '2px' }}>🎯 Why you are taking it:</strong>
                        <span style={{ color: '#334155' }}>{item.purpose}</span>
                      </div>
                      <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '8px' }}>
                        <strong style={{ color: '#0369a1', display: 'block', marginBottom: '2px' }}>⏰ How and when:</strong>
                        <span style={{ color: '#0c4a6e' }}>{item.howToTake}</span>
                      </div>
                    </div>

                    {item.importantWarnings && (
                      <div style={{ marginTop: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px', fontSize: '0.8rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0 }} />
                        <span><strong>Important Caution:</strong> {item.importantWarnings}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* General Tips & When to call doctor */}
              <div className="grid-2" style={{ marginTop: '8px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} color="#16a34a" /> Daily Wellness Tips
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                    {(explanation.generalTips || []).map((tip, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>{tip}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={16} color="#dc2626" /> When to Contact Doctor
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#991b1b', lineHeight: 1.5 }}>
                    {(explanation.whenToCallDoctor || []).map((sign, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>{sign}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 20px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
              <Heart size={36} color="#059669" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Generate Plain-Language Medication Guide</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '450px', margin: '0 auto 16px auto' }}>
                Translate clinical abbreviations and complex instructions into easy everyday advice.
              </div>
              <button onClick={handleGenerate} disabled={loading} className="btn btn-teal">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Generate My Guide
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              ℹ️ MedAssist AI explains doctor instructions for clarity; it does not change your treatment.
            </span>
            <button onClick={onClose} className="btn btn-secondary">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
