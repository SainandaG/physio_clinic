import React from 'react';
import { Phone, MessageSquare, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { LOGO_URL, CLINIC_WHATSAPP_NUMBER, CLINIC_DISPLAY_PHONE } from '../data/initialData';
import { openWhatsApp } from '../utils/whatsapp';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0A1C38] text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white p-1 border border-amber-500/30 flex items-center justify-center">
                <img 
                  src={LOGO_URL} 
                  alt="Srini Physio Clinics" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-display font-bold text-xl text-white tracking-tight">
                  SRINI <span className="text-[#C89B3C]">PHYSIO CLINICS</span>
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-widest">
                  Movement Is Medicine
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Advanced musculoskeletal, orthopedic, sports biomechanics, and neurological physical therapy center. Dedicated to pain-free function and conservative recovery.
            </p>

            <div className="pt-2 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C89B3C]" />
                <span className="font-mono">{CLINIC_DISPLAY_PHONE}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C89B3C]" />
                <span>Mon – Sat: 8:00 AM – 8:30 PM | Sun: 9:00 AM – 1:00 PM</span>
              </div>
            </div>
          </div>

          {/* Clinical Specialties */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#DFB253]">
              Specialties
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Spine & Posture Rehabilitation</li>
              <li>Sports Injury & Return-to-Play</li>
              <li>Joint Replacement Physical Therapy</li>
              <li>Neurological & Stroke Recovery</li>
              <li>Dry Needling & Myofascial Release</li>
              <li>Geriatric Mobility & Fall Prevention</li>
            </ul>
          </div>

          {/* Patient Care */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#DFB253]">
              Patient Care
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Direct Walk-in Registrations</li>
              <li>Pre-booked Digital Consultations</li>
              <li>Home Exercise Video Guidance</li>
              <li>Biomechanical Gait Analysis</li>
              <li>Ergonomic Desk Assessment</li>
            </ul>
          </div>

          {/* Quick Connect & WhatsApp */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#DFB253]">
              Connect Instantly
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Have an MRI report or ongoing pain? Connect with our physical therapy team on WhatsApp for prompt triaging.
            </p>
            <button
              type="button"
              onClick={() => openWhatsApp('Hello Srini Physio Clinics, I have a query regarding my consultation.', CLINIC_WHATSAPP_NUMBER)}
              className="py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Direct Desk</span>
            </button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            © {new Date().getFullYear()} Srini Physio Clinics. All rights reserved. Movement is Medicine.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Evidence-Based Practice</span>
            <span>·</span>
            <span>ISO 9001 Compliant Standards</span>
            <span>·</span>
            <span>MIAP Certified Clinicians</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
