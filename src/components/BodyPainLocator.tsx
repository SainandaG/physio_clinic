import React, { useState } from 'react';
import { MessageSquare, ArrowRight, ShieldCheck, Activity, HelpCircle } from 'lucide-react';
import { PAIN_ZONES, CLINIC_WHATSAPP_NUMBER } from '../data/initialData';
import { openWhatsApp } from '../utils/whatsapp';

interface BodyPainLocatorProps {
  onSelectForBooking: (conditionText: string) => void;
}

export const BodyPainLocator: React.FC<BodyPainLocatorProps> = ({ onSelectForBooking }) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>(PAIN_ZONES[2].id); // Default to lower back

  const activeZone = PAIN_ZONES.find(z => z.id === selectedZoneId) || PAIN_ZONES[0];

  return (
    <section id="pain-locator" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-[#C89B3C] mb-2 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#C89B3C]" />
            <span>Interactive Biomechanics Diagnostic Navigator</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0A1C38] tracking-tight leading-tight">
            Where Are You Experiencing Pain or Restriction?
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Select your affected joint or spinal zone below to view clinical indications, conservative physical therapy solutions, and connect directly with a qualified specialist on WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Interactive Zone Selector Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {PAIN_ZONES.map((zone) => {
              const isSelected = zone.id === selectedZoneId;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`p-4 rounded-xl text-left transition-all border cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#0A1C38] text-white border-[#0A1C38] shadow-md ring-2 ring-[#C89B3C]/50'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider opacity-75 mb-0.5">
                      {zone.anatomical}
                    </div>
                    <div className="font-display font-bold text-base">
                      {zone.label}
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#C89B3C] text-slate-950 font-bold' : 'text-slate-400'
                  }`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Detailed Clinical Protocol & WhatsApp Consultation Card */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-8 relative overflow-hidden">
              
              {/* Header Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
                  Target Zone: <strong className="text-[#0A1C38] font-bold">{activeZone.anatomical}</strong>
                </span>
                <span className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-100 rounded-md border border-amber-300">
                  Non-Invasive Protocol Available
                </span>
              </div>

              {/* Title */}
              <h3 className="font-display text-2xl font-bold text-[#0A1C38] mt-4 mb-2">
                {activeZone.label} Care & Restoration
              </h3>

              {/* Common Clinical Conditions */}
              <div className="mt-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    Common Symptoms & Diagnoses
                  </h4>
                  <p className="text-sm text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                    {activeZone.commonComplaints}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" />
                    Evidence-Based Clinical Protocol
                  </h4>
                  <p className="text-sm text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed font-medium">
                    {activeZone.recommendedTherapy}
                  </p>
                </div>
              </div>

              {/* Biomechanical Advice */}
              <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                <div className="font-bold">Clinical Advice from Dr. Srinivas Rao:</div>
                <p>
                  Avoid prolonged bed rest or aggressive cracking. Early guided movement and targeted decompression yield significantly faster tissue repair than complete immobilization.
                </p>
              </div>

              {/* Actions: Direct WhatsApp & Appointment Booking */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => openWhatsApp(activeZone.whatsappText, CLINIC_WHATSAPP_NUMBER)}
                  className="w-full sm:flex-1 py-3 px-5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>Discuss {activeZone.label} on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectForBooking(`${activeZone.label} - ${activeZone.anatomical}`)}
                  className="w-full sm:w-auto py-3 px-5 text-sm font-semibold text-[#0A1C38] bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Book Assessment
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
