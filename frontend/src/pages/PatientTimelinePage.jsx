import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Timeline } from '../components/Timeline';
import { AIPatientExplainerModal } from '../components/AIPatientExplainerModal';
import { PrescriptionPrintView } from '../components/PrescriptionPrintView';
import { LabReportPrintView } from '../components/LabReportPrintView';
import { InvoicePrintView } from '../components/InvoicePrintView';
import { 
  Clock, 
  User, 
  ArrowLeft, 
  AlertTriangle, 
  FileText, 
  Loader2, 
  Search
} from 'lucide-react';

export const PatientTimelinePage = ({ patientId, onBack }) => {
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedRxForAI, setSelectedRxForAI] = useState(null);
  const [printPrescription, setPrintPrescription] = useState(null);
  const [printLabReport, setPrintLabReport] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const res = await api.getPatientTimeline(patientId);
        if (res.success) setTimelineData(res);
      } catch (err) {
        console.error('Error fetching patient timeline:', err);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) fetchTimeline();
  }, [patientId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={36} className="animate-spin" color="#0284c7" />
      </div>
    );
  }

  const patient = timelineData?.patient || {};
  const profile = timelineData?.profile || {};

  return (
    <div className="page-body">
      {onBack && (
        <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      )}

      {/* Patient Profile Banner */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              360° Comprehensive Electronic Medical Record
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '6px 0', color: '#ffffff' }}>
              {patient.name}
            </h1>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
              Patient Code: <strong>{profile.patientCode || 'PAT-ID'}</strong> • Blood Group: <strong>{profile.bloodGroup || 'Unknown'}</strong> • Gender: <strong>{profile.gender || 'Unknown'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 700, color: '#fca5a5' }}>Allergies:</div>
              <div style={{ color: '#fee2e2' }}>
                {profile.allergies?.length > 0 ? profile.allergies.join(', ') : 'No known drug allergies'}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 700, color: '#93c5fd' }}>Chronic Conditions:</div>
              <div style={{ color: '#e0f2fe' }}>
                {profile.chronicConditions?.length > 0 ? profile.chronicConditions.join(', ') : 'None documented'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Encounter Counter */}
        {timelineData?.summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>TOTAL CLINICAL VISITS</span>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{timelineData.summary.totalVisits}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PRESCRIPTIONS ISSUED</span>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{timelineData.summary.totalPrescriptions}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>LAB INVESTIGATIONS</span>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{timelineData.summary.totalLabOrders}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>BILLING INVOICES</span>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{timelineData.summary.totalInvoices}</div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Component */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={20} color="#0284c7" /> Unified Medical Event Stream
          </div>
        </div>

        <Timeline
          timelineData={timelineData?.timeline || []}
          onOpenAIModal={(rx) => setSelectedRxForAI(rx)}
          onPrintItem={(item) => {
            if (item.type === 'PRESCRIPTION') setPrintPrescription(item.data);
            else if (item.type === 'LAB_INVESTIGATION') setPrintLabReport(item.data);
            else if (item.type === 'BILLING') setPrintInvoice(item.data);
          }}
        />
      </div>

      {/* Modals */}
      <AIPatientExplainerModal
        isOpen={!!selectedRxForAI}
        onClose={() => setSelectedRxForAI(null)}
        prescription={selectedRxForAI}
      />

      <PrescriptionPrintView
        prescription={printPrescription}
        onClose={() => setPrintPrescription(null)}
      />

      <LabReportPrintView
        labOrder={printLabReport}
        onClose={() => setPrintLabReport(null)}
      />

      <InvoicePrintView
        invoice={printInvoice}
        onClose={() => setPrintInvoice(null)}
      />
    </div>
  );
};
