// Treatment page content. Names match the services in Admin → Services; the card summary
// still comes from the admin description. Keep claims conservative and have the clinic
// approve wording — every treatment is chosen after assessment, not promised in advance.
// Default photos in public/treatments/ are free-licence Unsplash photos (see public/treatments/CREDITS.md).
import { LuZap, LuDumbbell, LuHand, LuCircleDot, LuBandage, LuActivity, LuCrosshair } from 'react-icons/lu';

export const TREATMENTS = [
  {
    slug: 'electrotherapy',
    image: '/treatments/electrotherapy.jpg',
    name: 'Electrotherapy',
    Icon: LuZap,
    tagline: 'Gentle electrical stimulation to help manage pain and support muscle activation.',
    about: 'Electrotherapy uses small, controlled electrical currents delivered through pads on the skin. Depending on your assessment, it may be used to help ease pain or to help muscles activate during rehabilitation. It is used alongside exercise and hands-on care, not instead of them.',
    helpsWith: ['Acute and persistent muscle or joint pain', 'Muscle weakness after injury or surgery', 'Pain that limits early rehabilitation exercise'],
    expect: ['Pads are placed around the treatment area', 'Intensity is adjusted until it feels comfortable — a tingling or pulsing sensation', 'Usually 10–20 minutes as part of a longer session'],
    note: 'Not suitable for everyone — for example people with pacemakers or certain implants, during pregnancy over some areas, or over broken skin. Tell us about your medical history at assessment.',
  },
  {
    slug: 'rehab-gym',
    image: '/treatments/rehab-gym.jpg',
    name: 'Rehab Gym & Exercise',
    Icon: LuDumbbell,
    tagline: 'Guided strength, mobility and conditioning to rebuild capacity and confidence.',
    about: 'Exercise is at the heart of most recovery plans. In the rehab gym we build strength, mobility, balance and control step by step — matched to your injury, your sport or daily activity, and how your body responds.',
    helpsWith: ['Returning to sport or training after injury', 'Recovery after surgery', 'Recurring strains, stiffness or reduced strength', 'Balance and movement confidence'],
    expect: ['A programme based on your assessment and goals', 'Supervised sessions with coaching on technique', 'A home exercise plan, shared on WhatsApp', 'Progress reviewed and adjusted over time'],
    note: 'Exercises are progressed gradually. Let us know if anything causes sharp or worsening pain.',
  },
  {
    slug: 'manual-therapy',
    image: '/treatments/manual-therapy.jpg',
    name: 'Manual Therapy',
    Icon: LuHand,
    tagline: 'Hands-on assessment and treatment of joints and soft tissues.',
    about: 'Manual therapy includes techniques such as joint mobilisation and soft-tissue work, performed by the physiotherapist. It can help ease pain and stiffness so you can move and exercise more comfortably, and is usually combined with an exercise plan.',
    helpsWith: ['Neck and back stiffness', 'Joint stiffness, e.g. shoulder, knee or ankle', 'Muscle tightness and tension'],
    expect: ['Assessment of how your joints and muscles move', 'Techniques explained before they are used, with your consent', 'Advice and exercises to continue at home'],
    note: 'Some techniques are not appropriate in certain conditions; your physiotherapist will screen for these first.',
  },
  {
    slug: 'dry-needling',
    image: '/treatments/dry-needling.jpg',
    name: 'Dry Needling',
    Icon: LuCrosshair,
    tagline: 'Fine, sterile needles used on selected muscle trigger points after screening.',
    about: 'Dry needling uses very fine, single-use sterile needles inserted into specific points in a muscle. It is a clinician-led technique that may help with certain muscle-related pain and tightness, and is always part of a wider plan rather than a stand-alone fix.',
    helpsWith: ['Muscle knots and trigger points', 'Neck, shoulder and upper back tension', 'Some sports-related muscle pain'],
    expect: ['Screening and consent before any needling', 'A brief prick and sometimes a muscle twitch or ache', 'Mild soreness for a day or so is common'],
    note: 'Not suitable for everyone — for example with needle phobia, some bleeding disorders or blood-thinning medication, or during pregnancy. We will check before treatment.',
  },
  {
    slug: 'cupping',
    image: '/treatments/cupping.jpg',
    name: 'Cupping Therapy',
    Icon: LuCircleDot,
    tagline: 'An optional technique using suction cups for muscle discomfort and recovery.',
    about: 'Cupping uses cups that create gentle suction on the skin over muscles. Some people find it helpful for muscle discomfort and recovery. We offer it as an optional addition to an assessment-led plan, not as a treatment on its own.',
    helpsWith: ['Muscle tightness and discomfort', 'Recovery after training'],
    expect: ['Cups placed on the treatment area for a few minutes', 'A pulling sensation — it should not be painful', 'Temporary circular marks that fade over several days'],
    note: 'Not used over broken or fragile skin, and not suitable for some medical conditions. Ask us if you are unsure.',
  },
  {
    slug: 'kinesiology-taping',
    image: '/treatments/kinesiology-taping.jpg',
    name: 'Kinesiology Taping',
    Icon: LuBandage,
    tagline: 'Elastic tape applied to support movement confidence during activity.',
    about: 'Kinesiology tape is a flexible, breathable tape applied to the skin. It is commonly used to help people feel more supported and confident while moving, training or competing, alongside their rehab exercises.',
    helpsWith: ['Feeling unsupported during sport or activity', 'Returning to training after a minor injury', 'Reminding you of good movement patterns'],
    expect: ['Quick application in clinic', 'Usually worn for a few days, including in the shower', 'Guidance on removing it gently'],
    note: 'Remove the tape if your skin itches or becomes irritated.',
  },
];

export const slugify = (name) => name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Match a service from the API to its rich content (admin-added services get a generic page).
// A photo set in Admin → Services replaces the default treatment photo.
export const treatmentFor = (service) => {
  const t = TREATMENTS.find(t => t.name === service.name) || {
    slug: slugify(service.name), name: service.name, Icon: LuActivity, image: null,
    tagline: service.description, about: service.description, helpsWith: [], expect: [], note: null,
  };
  return service.image_url ? { ...t, image: service.image_url } : t;
};

export const FALLBACK_SERVICES = TREATMENTS.map((t, i) => ({ id: i + 1, name: t.name, description: t.tagline, whatsapp_message: '' }));
