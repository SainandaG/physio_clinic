import React from 'react';
import { MessageSquare, Calendar, Stethoscope, Activity, Users, ShieldAlert } from 'lucide-react';
import { LOGO_URL, CLINIC_WHATSAPP_NUMBER } from '../data/initialData';
import { openWhatsApp } from '../utils/whatsapp';

interface HeaderProps {
  currentView: 'website' | 'admin';
  setCurrentView: (view: 'website' | 'admin') => void;
  onOpenBooking: () => void;
  waitingCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  onOpenBooking,
  waitingCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-20">
          
          {/* Zone 1: Brand Wordmark & Official Logo */}
          <div 
            onClick={() => setCurrentView('website')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-amber-500/30 flex items-center justify-center p-1 shadow-sm group-hover:border-amber-500 transition-colors">
              <img 
                src={LOGO_URL} 
                alt="Srini Physio Clinics Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-[#0A1C38] whitespace-nowrap leading-tight">
                SRINI <span className="text-[#C89B3C]">PHYSIO</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-500 whitespace-nowrap">
                Movement is Medicine
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (single line, whitespace-nowrap) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {currentView === 'website' ? (
              <>
                <a href="#services" className="hover:text-[#0A1C38] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
                  Services
                </a>
                <a href="#pain-locator" className="hover:text-[#0A1C38] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
                  Body Pain Locator
                </a>
                <a href="#specialists" className="hover:text-[#0A1C38] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
                  Specialists
                </a>
                <a href="#process" className="hover:text-[#0A1C38] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
                  Care Pathway
                </a>
                <a href="#branches" className="hover:text-[#0A1C38] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
                  Locations & Hours
                </a>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                <Activity className="w-4 h-4 text-amber-600" />
                <span>Admin Clinic Desk · Live Reception & Triage Active</span>
              </div>
            )}
          </nav>

          {/* Zone 3: Primary Action & Mode Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            {/* View Switcher Toggle: Website vs Admin Panel */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentView('website')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  currentView === 'website'
                    ? 'bg-[#0A1C38] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Patient Portal</span>
                <span className="sm:hidden">Patient</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('admin')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 relative ${
                  currentView === 'admin'
                    ? 'bg-[#C89B3C] text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Admin Desk</span>
                {waitingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-red-600 text-white font-bold rounded-full">
                    {waitingCount}
                  </span>
                )}
              </button>
            </div>

            {/* Quick WhatsApp or Appointment CTA */}
            {currentView === 'website' ? (
              <button
                type="button"
                onClick={onOpenBooking}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0A1C38] hover:bg-[#132E5A] rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[#C89B3C]" />
                <span>Book Appointment</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openWhatsApp('Hello Dr. Srinivas Rao, I am logging in as reception admin.', CLINIC_WHATSAPP_NUMBER)}
                className="px-3 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                title="Open Clinic WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Clinic WhatsApp</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
