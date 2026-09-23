import React, { useState } from 'react';
import { 
  Calendar, 
  FileText, 
  Pill, 
  FlaskConical, 
  CreditCard, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Printer, 
  Heart,
  Clock,
  User,
  Activity
} from 'lucide-react';

export const Timeline = ({ timelineData, onOpenAIModal, onPrintItem }) => {
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getEventBadge = (type) => {
    switch (type) {
      case 'CLINICAL_NOTE':
        return { icon: FileText, color: '#0284c7', bg: '#f0f9ff', label: 'Clinical Note' };
      case 'PRESCRIPTION':
        return { icon: Pill, color: '#059669', bg: '#ecfdf5', label: 'Prescription' };
      case 'LAB_INVESTIGATION':
        return { icon: FlaskConical, color: '#0d9488', bg: '#f0fdfa', label: 'Lab Test' };
      case 'BILLING':
        return { icon: CreditCard, color: '#9333ea', bg: '#faf5ff', label: 'Billing' };
      case 'APPOINTMENT':
      default:
        return { icon: Calendar, color: '#d97706', bg: '#fffbeb', label: 'Appointment' };
    }
  };

  const filteredItems = (timelineData || []).filter(item => {
    if (filter === 'ALL') return true;
    return item.type === filter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: 'All Records' },
          { id: 'CLINICAL_NOTE', label: 'Clinical Notes' },
          { id: 'PRESCRIPTION', label: 'Prescriptions' },
          { id: 'LAB_INVESTIGATION', label: 'Lab Reports' },
          { id: 'BILLING', label: 'Billing' },
          { id: 'APPOINTMENT', label: 'Appointments' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: filter === tab.id ? '1px solid #0284c7' : '1px solid #e2e8f0',
              background: filter === tab.id ? '#f0f9ff' : '#ffffff',
              color: filter === tab.id ? '#0284c7' : '#64748b',
              fontWeight: filter === tab.id ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      {filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
          No records found for this category.
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '32px' }}>
          {/* Vertical line connector */}
          <div style={{
            position: 'absolute',
            left: '15px',
            top: '16px',
            bottom: '16px',
            width: '2px',
            background: '#e2e8f0',
            zIndex: 1
          }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {filteredItems.map((item) => {
              const meta = getEventBadge(item.type);
              const Icon = meta.icon;
              const isExpanded = expandedId === item.id;
              const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={item.id} style={{ position: 'relative', zIndex: 2 }}>
                  {/* Timeline icon node */}
                  <div style={{
                    position: 'absolute',
                    left: '-32px',
                    top: '16px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: meta.bg,
                    border: `2px solid ${meta.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: meta.color,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <Icon size={16} />
                  </div>

                  {/* Card item */}
                  <div
                    className="card"
                    style={{
                      padding: '16px 20px',
                      cursor: 'pointer',
                      borderLeft: `4px solid ${meta.color}`
                    }}
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            background: meta.bg,
                            color: meta.color,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            textTransform: 'uppercase'
                          }}>
                            {meta.label}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formattedDate}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{item.title}</div>
                        {item.doctor && (
                          <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <User size={13} /> {item.doctor}
                          </div>
                        )}
                        <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem', color: '#475569' }}>
                          {item.details}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.status && (
                          <span className={`badge badge-${item.status}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        )}
                        {isExpanded ? <ChevronDown size={18} color="#94a3b8" /> : <ChevronRight size={18} color="#94a3b8" />}
                      </div>
                    </div>

                    {/* Expandable detailed drawer */}
                    {isExpanded && (
                      <div style={{
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid #f1f5f9',
                        fontSize: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        {/* Vitals summary if present */}
                        {item.vitals && (
                          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {item.vitals.bloodPressure && <span><strong>BP:</strong> {item.vitals.bloodPressure}</span>}
                            {item.vitals.heartRate && <span><strong>HR:</strong> {item.vitals.heartRate}</span>}
                            {item.vitals.spO2 && <span><strong>SpO2:</strong> {item.vitals.spO2}</span>}
                            {item.vitals.temperature && <span><strong>Temp:</strong> {item.vitals.temperature}</span>}
                            {item.vitals.bmi && <span><strong>BMI:</strong> {item.vitals.bmi}</span>}
                          </div>
                        )}

                        {/* Medications if prescription */}
                        {item.type === 'PRESCRIPTION' && item.data?.medications && (
                          <div>
                            <strong style={{ color: '#0f172a' }}>Prescribed Drugs:</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                              {item.data.medications.map((m, i) => (
                                <div key={i} style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                  <strong>{m.medicineName}</strong> — {m.dosage}, {m.frequency} ({m.timing}) for {m.duration}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Lab Tests breakdown */}
                        {item.type === 'LAB_INVESTIGATION' && item.data?.tests && (
                          <div>
                            <strong style={{ color: '#0f172a' }}>Investigative Tests:</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                              {item.data.tests.map((t, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 12px', borderRadius: '6px' }}>
                                  <span>{t.testName}</span>
                                  <span>
                                    <strong>{t.resultValue || 'Pending'}</strong> {t.unit}
                                    {t.flag && t.flag !== 'Pending' && (
                                      <span className={`badge badge-flag-${t.flag.toLowerCase()}`} style={{ marginLeft: '8px' }}>
                                        {t.flag}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action buttons inside timeline item */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                          {item.type === 'PRESCRIPTION' && onOpenAIModal && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenAIModal(item.data);
                              }}
                              className="btn btn-ai btn-sm"
                            >
                              <Sparkles size={14} /> Plain English AI Guide
                            </button>
                          )}
                          {onPrintItem && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPrintItem(item);
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              <Printer size={14} /> Print / Export
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
