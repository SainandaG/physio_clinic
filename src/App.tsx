/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { BodyPainLocator } from './components/BodyPainLocator';
import { DoctorsSection } from './components/DoctorsSection';
import { CarePathway } from './components/CarePathway';
import { BranchesSection } from './components/BranchesSection';
import { BookingModal } from './components/BookingModal';
import { AdminPanel } from './components/AdminPanel';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';
import { PatientRecord, ClinicService } from './types/clinic';
import { INITIAL_PATIENTS, INITIAL_SERVICES } from './data/initialData';

const PATIENTS_STORAGE_KEY = 'srini_physio_patients_v1';
const SERVICES_STORAGE_KEY = 'srini_physio_services_v1';

export default function App() {
  const [currentView, setCurrentView] = useState<'website' | 'admin'>('website');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [prefilledService, setPrefilledService] = useState('');

  // Persistent Patients State
  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    try {
      const stored = localStorage.getItem(PATIENTS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load stored patients', e);
    }
    return INITIAL_PATIENTS;
  });

  // Persistent Services State
  const [services, setServices] = useState<ClinicService[]>(() => {
    try {
      const stored = localStorage.getItem(SERVICES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load stored services', e);
    }
    return INITIAL_SERVICES;
  });

  // Sync patients to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patients));
    } catch (e) {
      console.error('Failed to save patients to localStorage', e);
    }
  }, [patients]);

  // Sync services to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
    } catch (e) {
      console.error('Failed to save services to localStorage', e);
    }
  }, [services]);

  // Add patient (from Website or Admin walk-in)
  const handleAddPatient = (newPatient: PatientRecord) => {
    setPatients(prev => [newPatient, ...prev]);
  };

  // Update existing patient
  const handleUpdatePatient = (updatedPatient: PatientRecord) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  // Open booking modal with specific service
  const handleSelectServiceForBooking = (serviceTitle: string) => {
    setPrefilledService(serviceTitle);
    setIsBookingModalOpen(true);
  };

  const handleOpenGeneralBooking = () => {
    setPrefilledService('');
    setIsBookingModalOpen(true);
  };

  // Calculate active patients waiting in lobby
  const waitingPatientsCount = patients.filter(p => p.status === 'Checked-In').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-200 selection:text-amber-950 font-sans">
      
      {/* Top Bar Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenBooking={handleOpenGeneralBooking}
        waitingCount={waitingPatientsCount}
      />

      {/* Main View: Website Customer Portal vs Admin Reception Desk */}
      <main className="flex-1">
        {currentView === 'website' ? (
          <div>
            {/* Hero Section with Official Logo Motif & Ethos */}
            <Hero
              onOpenBooking={handleOpenGeneralBooking}
              onExploreServices={() => {
                const el = document.getElementById('services');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Specialized Clinical Services (NO PRICING - Direct WhatsApp Consultation) */}
            <ServicesSection
              services={services}
              onSelectServiceForBooking={handleSelectServiceForBooking}
            />

            {/* Interactive Biomechanical Pain Locator */}
            <BodyPainLocator
              onSelectForBooking={(conditionText) => {
                setPrefilledService(conditionText);
                setIsBookingModalOpen(true);
              }}
            />

            {/* Senior Physiotherapist Team */}
            <DoctorsSection
              onOpenBooking={handleOpenGeneralBooking}
            />

            {/* 4-Phase Clinical Recovery Pathway */}
            <CarePathway />

            {/* Center Locations, Hours & Map */}
            <BranchesSection />
          </div>
        ) : (
          /* Admin Reception Desk & Patient Intake Queue */
          <AdminPanel
            patients={patients}
            onUpdatePatient={handleUpdatePatient}
            onAddPatient={handleAddPatient}
            services={services}
            onBackToWebsite={() => setCurrentView('website')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Booking Modal for Website Intake */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onAddPatient={handleAddPatient}
        services={services}
        prefilledService={prefilledService}
      />

      {/* Floating Sticky WhatsApp Interaction Assistant */}
      <FloatingWhatsApp />

    </div>
  );
}
