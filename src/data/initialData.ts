import { PatientRecord, ClinicService, DoctorProfile, ClinicBranch } from '../types/clinic';

export const LOGO_URL = '/assets/aistudio/10286556-30ac-4430-a5c3-17aaaaf21590_25cb3fb3.jpg';
export const CLINIC_WHATSAPP_NUMBER = '919845012345';
export const CLINIC_DISPLAY_PHONE = '+91 98450 12345';

export const INITIAL_SERVICES: ClinicService[] = [
  {
    id: 'spine-rehab',
    title: 'Spine & Posture Rehabilitation',
    category: 'Spine & Posture',
    tagline: 'Targeted decompression and neuromuscular re-education for neck and lower back disorders',
    description: 'Comprehensive conservative treatment for herniated discs, cervical spondylosis, sciatica, postural kyphosis, and chronic back pain without surgical reliance.',
    indications: [
      'Sciatica & Radiating Nerve Pain',
      'Lumbar & Cervical Disc Bulge',
      'Scoliosis & Forward Head Posture',
      'Ankylosing Spondylitis & Chronic Stiffness'
    ],
    modalities: [
      'Spinal Decompression Traction',
      'McKenzie Mechanical Diagnosis & Therapy (MDT)',
      'Interferential Current (IFT) Therapy',
      'Targeted Core Stability Training'
    ],
    treatmentPhases: [
      'Acute Pain Relief & Inflammation Reduction',
      'Spinal Mobilization & Nerve Decompression',
      'Dynamic Core Strengthening & Postural Ergonomics'
    ],
    averageSessions: '6 to 12 sessions',
    sessionDuration: '45 mins',
    isAvailable: true,
    whatsappMessage: 'Hello Srini Physio Clinics, I want to consult for Spine & Back/Neck Pain rehabilitation.'
  },
  {
    id: 'sports-injury',
    title: 'Sports Injury & Athletic Performance',
    category: 'Sports & Athletic',
    tagline: 'Rapid return-to-play rehabilitation for competitive athletes and active professionals',
    description: 'Biomechanical movement analysis, sports-specific conditioning, and tendon/ligament rehabilitation designed to rebuild power, proprioception, and resilience.',
    indications: [
      'ACL / Meniscus Tears (Pre & Post Rehab)',
      'Rotator Cuff & Shoulder Impingement',
      'Hamstring & Quad Muscle Strains',
      'Achilles Tendinopathy & Ankle Sprains'
    ],
    modalities: [
      'Kinematic Video Gait & Jump Analysis',
      'Eccentric Tendon Loading Protocols',
      'Proprioceptive Agility Training',
      'Sports Taping & Kinesiology Support'
    ],
    treatmentPhases: [
      'Tissue Repair & Swelling Management',
      'Loaded Mobility & Progressive Resistance',
      'High-Speed Agility & Return-To-Sport Testing'
    ],
    averageSessions: '8 to 16 sessions',
    sessionDuration: '60 mins',
    isAvailable: true,
    whatsappMessage: 'Hello Srini Physio Clinics, I am an athlete / fitness enthusiast looking for Sports Injury Rehabilitation.'
  },
  {
    id: 'joint-replacement',
    title: 'Joint Replacement & Post-Op Physical Therapy',
    category: 'Joint & Ortho',
    tagline: 'Structured recovery protocols for Total Knee, Hip, and Shoulder replacements',
    description: 'Evidence-based post-operative recovery regaining 100% functional range of motion, walking confidence, gait normalization, and pain-free independence.',
    indications: [
      'Total Knee Arthroplasty (TKA)',
      'Total Hip Replacement (THR)',
      'Shoulder Arthroscopic Repair / Labral Tear',
      'Complex Fracture Fixation Rehab'
    ],
    modalities: [
      'Continuous Passive Motion (CPM)',
      'Lymphatic Drainage & Cryo-compression',
      'Closed-Kinetic Chain Joint Mobilization',
      'Stair & Functional Ambulation Training'
    ],
    treatmentPhases: [
      'Hospital Discharge & Early Scar Mobility',
      'Active-Assisted ROM & Quadriceps Activation',
      'Independent Community Walking & Stair Ascent'
    ],
    averageSessions: '12 to 24 sessions',
    sessionDuration: '50 mins',
    isAvailable: true,
    whatsappMessage: 'Hello Srini Physio Clinics, I need Post-Surgery / Joint Replacement physical therapy for a family member.'
  },
  {
    id: 'neuro-rehab',
    title: 'Neurological & Stroke Rehabilitation',
    category: 'Neurological',
    tagline: 'Neuroplasticity-driven motor relearning for brain and spinal cord recovery',
    description: 'Specialized therapy utilizing neuro-developmental treatment (NDT/Bobath) and sensory re-integration to restore balance, gait, and daily living skills.',
    indications: [
      'Post-Stroke Hemiplegia & Motor Weakness',
      'Parkinson\'s Disease Mobility & Gait Freezing',
      'Bell\'s Palsy & Facial Nerve Rehabilitation',
      'Balance Impairments & Ataxia'
    ],
    modalities: [
      'Bobath Neuro-Developmental Approach',
      'Functional Electrical Stimulation (FES)',
      'Dynamic Balance Board Training',
      'Dual-Task Cognitive Motor Exercises'
    ],
    treatmentPhases: [
      'Muscle Tone Normalization & Reflex Inhibition',
      'Weight-Bearing & Trunk Control Activation',
      'Gait Retraining & Fine Motor Coordination'
    ],
    averageSessions: 'Ongoing / Custom Plan',
    sessionDuration: '60 mins',
    isAvailable: true,
    whatsappMessage: 'Hello Srini Physio Clinics, I want to consult for Neurological / Stroke Rehabilitation.'
  },
  {
    id: 'dry-needling-manual',
    title: 'Dry Needling & Advanced Manual Therapy',
    category: 'Specialized Modalities',
    tagline: 'Precision myofascial trigger point deactivation and joint capsule release',
    description: 'Intramuscular dry needling combined with Maitland & Mulligan joint mobilizations to immediately release stubborn knots, muscle spasm, and joint restrictions.',
    indications: [
      'Myofascial Pain Syndrome & Knots',
      'Chronic Tension Headaches & Jaw (TMJ) Pain',
      'Frozen Shoulder Capsular Restriction',
      'Tennis Elbow & Golfer\'s Elbow'
    ],
    modalities: [
      'Intramuscular Trigger Point Dry Needling',
      'Mulligan Mobilization with Movement (MWM)',
      'Instrument-Assisted Soft Tissue Mobilization (IASTM)',
      'Myofascial Cupping & Decompression'
    ],
    treatmentPhases: [
      'Myofascial Knot Deactivation',
      'Joint Glide Restoration',
      'Corrective Motor Patterning'
    ],
    averageSessions: '3 to 6 sessions',
    sessionDuration: '40 mins',
    isAvailable: true,
    whatsappMessage: 'Hello Srini Physio Clinics, I want to inquire about Dry Needling and Manual Therapy sessions.'
  },
  {
    id: 'geriatric-mobility',
    title: 'Geriatric Mobility & Fall Prevention',
    category: 'Joint & Ortho',
    tagline: 'Empowering senior citizens with steady balance, bone health, and pain relief',
    description: 'Gentle, tailored physical therapy focused on osteoporosis management, osteoarthritis pain relief, safe transfer techniques, and preventing debilitating falls.',
    indications: [
      'Osteoarthritis of Knees & Hips',
      'Age-related Frailty & Balance Loss',
      'Post-Fall Fear of Walking',
      'Vertebral Compression Fracture Care'
    ],
    modalities: [
      'Low-Impact Hydro-therapeutic Land Exercises',
      'Proprioception & Sensory Floor Pathways',
      'Therapeutic Ultrasound for Joint Pain',
      'Assistive Device Prescription & Fitting'
    ],
    treatmentPhases: [
      'Joint Pain Relief & Morning Stiffness Reduction',
      'Leg Strength & Balance Equilibrium',
      'Safe Household Ambulation & Confidence'
    ],
    averageSessions: '8 to 15 sessions',
    sessionDuration: '45 mins',
    isAvailable: true,
    whatsappMessage: 'Hello Srini Physio Clinics, I would like to schedule a Geriatric Mobility & Knee Care session for a senior.'
  }
];

export const INITIAL_DOCTORS: DoctorProfile[] = [
  {
    id: 'dr-srini',
    name: 'Dr. Srinivas Rao, MPT (Ortho & Sports)',
    qualification: 'BPT, MPT (Musculoskeletal), CMP, CDNP, MIAP',
    designation: 'Chief Consultant Physiotherapist & Founder',
    specialization: 'Complex Spine Disorders, Sports Biomechanics & Manual Therapy',
    experienceYears: 16,
    availableDays: 'Monday - Saturday',
    timing: '09:00 AM - 01:30 PM & 04:30 PM - 08:30 PM'
  },
  {
    id: 'dr-ananya',
    name: 'Dr. Ananya Sharma, MPT (Neuro)',
    qualification: 'BPT, MPT (Neurology), Certified NDT Practitioner',
    designation: 'Senior Neuro-Rehabilitation Specialist',
    specialization: 'Stroke Motor Relearning, Parkinson\'s & Balance Disorders',
    experienceYears: 11,
    availableDays: 'Monday - Friday',
    timing: '10:00 AM - 05:00 PM'
  },
  {
    id: 'dr-rajesh',
    name: 'Dr. Rajesh Verma, BPT, FSR',
    qualification: 'BPT, Fellowship in Sports Rehabilitation (UK)',
    designation: 'Lead Sports Physical Therapist',
    specialization: 'ACL Rehabilitation, Rotator Cuff & Dry Needling',
    experienceYears: 8,
    availableDays: 'Monday - Saturday',
    timing: '08:00 AM - 03:00 PM'
  }
];

export const INITIAL_PATIENTS: PatientRecord[] = [
  {
    id: 'pt-101',
    tokenNumber: 'TK-101',
    name: 'Karthik Ramanathan',
    phone: '+91 98765 43210',
    email: 'karthik.r@example.com',
    age: 34,
    gender: 'Male',
    source: 'Website',
    condition: 'L4-L5 Lumbar Disc Bulge with Left Sciatica',
    painScale: 7,
    priority: 'Moderate',
    assignedDoctor: 'Dr. Srinivas Rao, MPT (Ortho & Sports)',
    status: 'In Therapy',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '09:30',
    checkInTime: '09:22',
    treatmentRoom: 'Spine Suite 1',
    notes: 'Completed session 4 of 8. Spinal traction with 18kg tension applied. Core activation improved.',
    prescribedExercises: [
      'McKenzie Prone Press-ups (10 reps x 3 sets)',
      'Bird-Dog core stabilization (Hold 5s)',
      'Nerve Flossing for Sciatic Nerve'
    ],
    followUpDate: '2026-10-26',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'pt-102',
    tokenNumber: 'TK-102',
    name: 'Mrs. Jayalakshmi Sundaram',
    phone: '+91 94441 22890',
    age: 62,
    gender: 'Female',
    source: 'Walk-in / Direct',
    condition: 'Bilateral Knee Osteoarthritis (Grade 3) - Difficulty Walking',
    painScale: 8,
    priority: 'Moderate',
    assignedDoctor: 'Dr. Srinivas Rao, MPT (Ortho & Sports)',
    status: 'In Consultation',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:00',
    checkInTime: '09:50',
    treatmentRoom: 'Consultation Room A',
    notes: 'Direct walk-in patient accompanied by son. Severe morning stiffness and crepitus.',
    prescribedExercises: [
      'Isometric Quad Sets (Towel roll under knee)',
      'Straight Leg Raises (10 reps)',
      'Gentle Stationary Cycling (10 mins)'
    ],
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'pt-103',
    tokenNumber: 'TK-103',
    name: 'Vikramaditya Hegde',
    phone: '+91 99002 54118',
    email: 'vikram.hegde@techlead.io',
    age: 28,
    gender: 'Male',
    source: 'Website',
    condition: 'Right Shoulder Rotator Cuff Tendonitis & Impingement',
    painScale: 6,
    priority: 'Routine',
    assignedDoctor: 'Dr. Rajesh Verma, BPT, FSR',
    status: 'Checked-In',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:30',
    checkInTime: '10:15',
    treatmentRoom: 'Sports Rehab Bay',
    notes: 'Booked online via website form. Badminton player experiencing sharp pain during overhead smashes.',
    prescribedExercises: [
      'Sleeper stretch for posterior capsule',
      'Yellow Theraband external rotation',
      'Scapular wall slides'
    ],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'pt-104',
    tokenNumber: 'TK-104',
    name: 'Suresh Babu Naidu',
    phone: '+91 97011 88204',
    age: 57,
    gender: 'Male',
    source: 'Walk-in / Direct',
    condition: 'Post-Stroke Left Hemiparesis (3 months post onset)',
    painScale: 4,
    priority: 'Moderate',
    assignedDoctor: 'Dr. Ananya Sharma, MPT (Neuro)',
    status: 'Booked',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '11:15',
    treatmentRoom: 'Neuro Gym',
    notes: 'Walk-in registration for continuation of neuro rehabilitation. Needs gait training and arm coordination.',
    createdAt: new Date(Date.now() - 3600000 * 0.5).toISOString()
  },
  {
    id: 'pt-105',
    tokenNumber: 'TK-105',
    name: 'Pooja Venkatesh',
    phone: '+91 98860 33491',
    email: 'pooja.v@designworks.com',
    age: 31,
    gender: 'Female',
    source: 'Website',
    condition: 'Tech Neck, Cervicogenic Headaches & Upper Trap Spasm',
    painScale: 5,
    priority: 'Routine',
    assignedDoctor: 'Dr. Srinivas Rao, MPT (Ortho & Sports)',
    status: 'Booked',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '11:45',
    treatmentRoom: 'Manual Therapy Suite',
    notes: 'Submitted via website appointment booking. Works 10+ hours on laptop.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'pt-106',
    tokenNumber: 'TK-100',
    name: 'Arjun Mehta',
    phone: '+91 97110 44552',
    age: 24,
    gender: 'Male',
    source: 'Walk-in / Direct',
    condition: 'Grade II Inversion Ankle Sprain',
    painScale: 3,
    priority: 'Routine',
    assignedDoctor: 'Dr. Rajesh Verma, BPT, FSR',
    status: 'Completed',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '08:30',
    checkInTime: '08:25',
    completionTime: '09:15',
    treatmentRoom: 'Sports Rehab Bay',
    notes: 'Cryo-compression and ultrasound applied. Taped with rigid athletic tape for stabilization. Discharge instructions provided.',
    prescribedExercises: [
      'Alphabet ankle circles',
      'Single-leg balance on wobble cushion',
      'Calf stretch on incline wedge'
    ],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export const PAIN_ZONES = [
  {
    id: 'cervical-neck',
    label: 'Neck & Upper Spine',
    anatomical: 'Cervical Spine (C1-C7)',
    commonComplaints: 'Tech Neck, Cervical Spondylosis, Stiff Trapezius, Radiating Arm Numbness',
    recommendedTherapy: 'Spine & Posture Rehabilitation, Dry Needling & Cervical Decompression',
    serviceId: 'spine-rehab',
    whatsappText: 'Hello Srini Physio Clinics, I am experiencing severe neck stiffness and radiating pain.'
  },
  {
    id: 'shoulder-rotator',
    label: 'Shoulder & Arm',
    anatomical: 'Glenohumeral Joint & Rotator Cuff',
    commonComplaints: 'Frozen Shoulder, Rotator Cuff Tendonitis, Overhead Impingement, AC Joint Pain',
    recommendedTherapy: 'Manual Capsular Release, Shoulder Biomechanics & Dry Needling',
    serviceId: 'dry-needling-manual',
    whatsappText: 'Hello Srini Physio Clinics, I have shoulder pain / frozen shoulder and cannot lift my arm comfortably.'
  },
  {
    id: 'lumbar-back',
    label: 'Lower Back & Sciatica',
    anatomical: 'Lumbar Spine & Sacroiliac Joint (L1-S1)',
    commonComplaints: 'Herniated Disc, Sciatica, Sharp Shooting Leg Pain, SI Joint Dysfunction',
    recommendedTherapy: 'Targeted Spinal Decompression Traction, Core Stability & McKenzie Protocol',
    serviceId: 'spine-rehab',
    whatsappText: 'Hello Srini Physio Clinics, I need immediate consultation for lower back pain and sciatica.'
  },
  {
    id: 'knee-joint',
    label: 'Knee & Patella',
    anatomical: 'Tibiofemoral & Patellofemoral Complex',
    commonComplaints: 'Knee Osteoarthritis, ACL / Meniscus Injury, Runner\'s Knee, Post-TKR Stiffness',
    recommendedTherapy: 'Joint Replacement Physical Therapy & Sports Knee Rehabilitation',
    serviceId: 'joint-replacement',
    whatsappText: 'Hello Srini Physio Clinics, I am looking for Knee Osteoarthritis / Post-Op rehabilitation.'
  },
  {
    id: 'ankle-foot',
    label: 'Ankle & Heel',
    anatomical: 'Talocrural Joint & Plantar Fascia',
    commonComplaints: 'Plantar Fasciitis, Achilles Tendinopathy, Recurrent Ankle Sprains, Flat Foot Pain',
    recommendedTherapy: 'Shockwave Therapy, Deep Tissue Mobilization & Gait Retraining',
    serviceId: 'sports-injury',
    whatsappText: 'Hello Srini Physio Clinics, I have heel pain / plantar fasciitis / ankle injury.'
  },
  {
    id: 'stroke-neuro',
    label: 'Full Body / Neurological',
    anatomical: 'Central & Peripheral Nervous System',
    commonComplaints: 'Post-Stroke Paralysis, Parkinson\'s Mobility Freezing, Balance Loss, Bell\'s Palsy',
    recommendedTherapy: 'Neuro-Developmental Treatment (Bobath), Dynamic Gait & Motor Relearning',
    serviceId: 'neuro-rehab',
    whatsappText: 'Hello Srini Physio Clinics, I need specialist consultation for Neurological / Stroke Recovery.'
  }
];

export const CLINIC_BRANCHES: ClinicBranch[] = [
  {
    id: 'central-branch',
    name: 'Srini Physio Clinics - Main Center',
    address: '4th Floor, Movement & Wellness Tower, 100 Feet Road, Indiranagar',
    landmark: 'Opposite Metro Pillar 128',
    phone: '+91 98450 12345',
    whatsapp: '919845012345',
    email: 'care@sriniphysioclincs.com',
    hours: 'Monday – Saturday: 8:00 AM – 8:30 PM | Sunday: 9:00 AM – 1:00 PM',
    googleMapsUrl: 'https://maps.google.com'
  },
  {
    id: 'sports-branch',
    name: 'Srini Sports & Performance Hub',
    address: '2nd Floor, Athletic Arena, Outer Ring Road, HSR Layout Sector 1',
    landmark: 'Near Silk Board Flyover Junction',
    phone: '+91 98450 67890',
    whatsapp: '919845012345',
    email: 'sports@sriniphysioclincs.com',
    hours: 'Monday – Saturday: 7:00 AM – 8:00 PM',
    googleMapsUrl: 'https://maps.google.com'
  }
];
