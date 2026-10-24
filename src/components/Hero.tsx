import React from 'react';
import { MessageSquare, Calendar, ShieldCheck, Activity, Award, ArrowUpRight } from 'lucide-react';
import { LOGO_URL, CLINIC_WHATSAPP_NUMBER } from '../data/initialData';
import { openWhatsApp } from '../utils/whatsapp';

interface HeroProps {
  onOpenBooking: () => void;
  onExploreServices: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking, onExploreServices }) => {
  return (
    <section className="relative overflow-hidden bg-[#0A1C38] text-white">
      {/* Background aesthetic grid and biomechanics subtle glow */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C89B3C_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#C89B3C]/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Brand Statement & Clinical Promise */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            
            {/* Tagline Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-[#C89B3C]/40 text-[#DFB253] text-xs font-semibold tracking-wide uppercase">
              <Activity className="w-3.5 h-3.5 text-[#C89B3C]" />
              <span>Srini Physio Clinics · Movement Is Medicine</span>
            </div>

            {/* Display Headline */}
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight" style={{ textWrap: 'balance' }}>
              Restore Functional Mobility Without Surgical Dependence.
            </h1>

            {/* Value Proposition */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Specialized orthopedic, spine, and sports physical therapy in Indiranagar & HSR. 
              From acute sciatica and disc herniations to ACL return-to-play and stroke rehabilitation, 
              we combine evidence-based manual therapy with advanced biomechanical conditioning.
            </p>

            {/* Dual CTAs: Booking & Instant WhatsApp Triage */}
            <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onOpenBooking}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-slate-950 bg-[#C89B3C] hover:bg-[#DFB253] rounded-lg transition-colors shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-slate-950" />
                <span>Book Clinic Assessment</span>
              </button>

              <button
                type="button"
                onClick={() => openWhatsApp('Hello Srini Physio Clinics, I would like to consult a senior physiotherapist regarding my condition.', CLINIC_WHATSAPP_NUMBER)}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-white" />
                <span>Instant WhatsApp Consult</span>
              </button>

              <button
                type="button"
                onClick={onExploreServices}
                className="text-xs font-semibold text-slate-300 hover:text-white transition-colors underline-offset-4 hover:underline py-2 sm:px-2 flex items-center gap-1"
              >
                <span>View Clinical Specialties</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#C89B3C]" />
              </button>
            </div>

            {/* Clinical Evidence Points */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-300 border-t border-white/10 w-full">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C89B3C]" />
                <span>Certified Manual & NDT Therapists</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C89B3C]" />
                <span>Direct Walk-in & Digital Appointments</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C89B3C]" />
                <span>Personalized Home Exercise Prescriptions</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Container with Authentic Running Logo Motif */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 p-6 backdrop-blur-md shadow-2xl">
              
              {/* Highlight Ribbon */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
                <span className="text-[#DFB253] font-semibold uppercase tracking-wider">Clinical Biomechanics Hub</span>
                <span className="text-slate-400 font-mono">EST. 2010</span>
              </div>

              {/* Logo Showpiece Container */}
              <div className="relative my-6 aspect-square w-full rounded-xl bg-white flex flex-col items-center justify-center p-6 shadow-inner overflow-hidden group">
                <img 
                  src={LOGO_URL} 
                  alt="Srini Physio Clinics Runner Anatomy Logo" 
                  className="w-full h-full object-contain filter contrast-105 group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Quick Clinic Status Card */}
              <div className="rounded-xl bg-[#071326] border border-amber-500/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Today's Clinic Status:</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Open & Accepting Patients
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  Walk-in consultations & scheduled treatments handled by Senior Physical Therapists.
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-white/10 text-[11px] text-[#C89B3C]">
                  <span>Walk-ins Welcome</span>
                  <span>WhatsApp Direct Response &lt; 5m</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 4-Column Metric Strip Below Hero */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-10 border-t border-white/10">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl sm:text-3xl font-extrabold font-display text-[#DFB253] tabular-nums">
              12,000+
            </div>
            <div className="text-xs sm:text-sm text-slate-300 mt-1">
              Patient Recoveries
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Spine, Joint & Sports Cases
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl sm:text-3xl font-extrabold font-display text-white tabular-nums">
              94%
            </div>
            <div className="text-xs sm:text-sm text-slate-300 mt-1">
              Conservative Resolution
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Without surgical interventions
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl sm:text-3xl font-extrabold font-display text-[#DFB253] tabular-nums">
              16+ Yrs
            </div>
            <div className="text-xs sm:text-sm text-slate-300 mt-1">
              Clinical Experience
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Led by Dr. Srinivas Rao, MPT
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl sm:text-3xl font-extrabold font-display text-white tabular-nums">
              2 Centers
            </div>
            <div className="text-xs sm:text-sm text-slate-300 mt-1">
              Indiranagar & HSR Hub
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Walk-in & Digital Appointments
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
