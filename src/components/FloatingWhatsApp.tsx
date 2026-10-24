import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { CLINIC_WHATSAPP_NUMBER } from '../data/initialData';
import { openWhatsApp } from '../utils/whatsapp';

export const FloatingWhatsApp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  const quickPrompts = [
    'I want to consult for severe Back / Neck Pain',
    'Inquiring about Sports Injury & ACL Rehabilitation',
    'Looking for Post-Op / Knee Replacement Physical Therapy',
    'What are the walk-in clinic timings today?'
  ];

  const handleSend = (text: string) => {
    openWhatsApp(text || 'Hello Srini Physio Clinics, I would like to book a consultation.', CLINIC_WHATSAPP_NUMBER);
    setIsOpen(false);
    setCustomMsg('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      
      {/* Expanded Quick Chat Card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Card Header */}
          <div className="bg-[#0A1C38] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm">
                  Srini Physio Clinics Helpdesk
                </h4>
                <div className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online · Typically replies in 5 mins</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="p-4 bg-slate-50 space-y-2 border-b border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select an Inquiry or Type Below:
            </div>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                className="w-full text-left text-xs p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-900 transition-colors text-slate-700 shadow-xs flex items-center justify-between cursor-pointer"
              >
                <span>{prompt}</span>
                <Send className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
              </button>
            ))}
          </div>

          {/* Custom Message Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(customMsg);
            }} 
            className="p-3 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Type your question..."
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* Floating Action Pill / Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
        aria-label="Contact clinic via WhatsApp"
      >
        <MessageSquare className="w-5 h-5 text-white" />
        <span className="text-xs sm:text-sm font-bold tracking-wide">
          {isOpen ? 'Close Chat' : 'Chat on WhatsApp'}
        </span>
      </button>

    </div>
  );
};
