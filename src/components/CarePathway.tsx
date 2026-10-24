import React from 'react';
import { Activity, Stethoscope, Dumbbell, ShieldCheck } from 'lucide-react';

export const CarePathway: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Biomechanics Diagnostic Evaluation',
      description: 'Comprehensive 45-minute clinical assessment of spinal curvature, joint range-of-motion, muscle length discrepancies, and neuromuscular reflexes.',
      icon: Stethoscope
    },
    {
      number: '02',
      title: 'Targeted Decompression & Manual Release',
      description: 'Immediate pain alleviation utilizing spinal traction, dry needling, Maitland joint glides, and electro-modalities to break muscle spasms.',
      icon: Activity
    },
    {
      number: '03',
      title: 'Active Loaded Movement & Stability',
      description: 'Progressive eccentric loading, core neuromuscular re-education, and sports-specific agility drills restoring resilience.',
      icon: Dumbbell
    },
    {
      number: '04',
      title: 'Digital Home Prescription via WhatsApp',
      description: 'Personalized video exercises, ergonomic workspace corrections, and automated follow-up reminders sent directly to your phone.',
      icon: ShieldCheck
    }
  ];

  return (
    <section id="process" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-[#C89B3C] mb-2 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#C89B3C]" />
            <span>Structured Rehabilitation Roadmap</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0A1C38] tracking-tight leading-tight">
            How We Restore Functional Independence
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Our clinical pathway systematically transitions patients from acute pain relief to peak biomechanical performance and injury resilience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div 
                key={step.number}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#C89B3C]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-extrabold text-[#C89B3C]">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0A1C38] shadow-sm">
                      <IconComponent className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#0A1C38] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-200/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Phase {step.number} Protocol
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
