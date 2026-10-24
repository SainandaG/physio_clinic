import { CLINIC_WHATSAPP_NUMBER } from '../data/initialData';

export function createWhatsAppLink(message: string, phone: string = CLINIC_WHATSAPP_NUMBER): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export function openWhatsApp(message: string, phone: string = CLINIC_WHATSAPP_NUMBER): void {
  const url = createWhatsAppLink(message, phone);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function getAppointmentWhatsAppMessage(patientName: string, serviceOrCondition: string, date: string, time: string): string {
  return `Hello Srini Physio Clinics! 

I would like to confirm my consultation:
• Name: ${patientName}
• Condition / Therapy: ${serviceOrCondition}
• Date: ${date}
• Time: ${time}

Please let me know the nearest available slot. Thank you!`;
}

export function getAdminReminderWhatsAppMessage(patientName: string, tokenNumber: string, time: string, doctor: string): string {
  return `Dear ${patientName}, 

Greeting from Srini Physio Clinics ("Movement is Medicine").
Your appointment reminder:
• Token: ${tokenNumber}
• Time: ${time}
• Consulting Specialist: ${doctor}

Location: 100 Feet Rd, Indiranagar.
Please arrive 10 minutes prior for vital check. Reply 'OK' to confirm.`;
}

export function getExercisePrescriptionWhatsAppMessage(patientName: string, exercises: string[], followUpDate?: string): string {
  const exerciseList = exercises.map((ex, i) => `${i + 1}. ${ex}`).join('\n');
  return `Hello ${patientName},

Here is your home exercise and physical therapy plan from Dr. Srinivas Rao & Team (Srini Physio Clinics):

Prescribed Exercises:
${exerciseList}

${followUpDate ? `📅 Next Follow-up Session: ${followUpDate}` : ''}

Remember: Stop any movement that causes sharp shooting pain. Stay hydrated and perform sets in good form!
Movement is Medicine.`;
}
