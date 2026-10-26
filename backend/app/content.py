"""Default website wording. The admin "Website content" page stores edits on top of these, so a
field nobody has edited keeps following the default, and "Reset" simply deletes the stored copy.

Keep claims conservative: every treatment is chosen after assessment, never promised in advance.
"""
import re

DEFAULT_CONTENT = {
    "clinic": {
        "name": "Srini Physio Clinics",
        "phone_display": "+91 80191 41096",
        "whatsapp_number": "918019141096",
        "email": "",
        "address": "Masid Banda, Kondapur, Hyderabad",
        "map_link": "https://maps.app.goo.gl/XBcBKuuvjRYdtgMD7",
        "opening_hours": "",
    },
    "seo": {
        "site_title": "Srini Physio Clinics — Sports Physiotherapy in Kondapur, Hyderabad",
        "title_suffix": "Srini Physio Clinics, Kondapur",
        "default_description": "Sports physiotherapy and recovery in Masid Banda, Kondapur, Hyderabad. Assessment-led care with Dr Tharun, MPT (Sports & Manual Therapy). Book online or on WhatsApp.",
        "share_image": "/brand/logo-full.png",
        "google_site_verification": "",
    },
    "home": {
        "eyebrow": "Sports physiotherapy · Kondapur",
        "title_line_1": "Move better.",
        "title_line_2": "Recover stronger.",
        "intro": "Assessment-led physiotherapy for athletes and active people, with {doctor}. A clear plan, hands-on care and exercise that gets you back to what you love.",
        "badge": "Return-to-sport focus",
        "treatments_title": "Care chosen after a proper assessment",
        "treatments_intro": "We start by understanding your movement, symptoms and goals — then combine the treatments that suit you.",
        "sports_eyebrow": "Made for active lives",
        "sports_title": "Your sport is different. Your recovery should be too.",
        "sports_intro": "Whether you compete, train at the weekend or just want to move without pain, your plan is built around your body, schedule and goals.",
        "steps": [
            {"title": "Assess", "text": "Symptoms, movement, training load and what you want to get back to."},
            {"title": "Treat", "text": "Hands-on care and the right modalities to settle pain and stiffness."},
            {"title": "Rebuild", "text": "Progressive strength and conditioning for a safe return to activity."},
            {"title": "Stay on track", "text": "Your home exercise plan on WhatsApp, reviewed as you improve."},
        ],
        "doctor_points": [
            "Every plan starts with a thorough assessment",
            "Honest advice on what will and won't help",
            "Exercise-led recovery you can continue at home",
        ],
        "cta_title": "Ready to get back to what moves you?",
        "cta_text": "Book an assessment — it takes about a minute.",
        "seo_title": "",
        "seo_description": "",
    },
    "about": {
        "hero_title": "Sports physiotherapy, built around your comeback",
        "hero_intro": "Srini Physio Clinics in Masid Banda, Kondapur helps athletes and active people recover from injury, manage pain and get back to moving with confidence.",
        "steps_title": "Simple steps. Personal care.",
        "steps_intro": "No one-size-fits-all promises — we focus on understanding your needs and agreeing practical next steps with you.",
        "steps": [
            {"title": "Talk & assess", "text": "Share your symptoms, activity, history and what you want to get back to doing."},
            {"title": "Agree a plan", "text": "Discuss suitable treatment, exercise, milestones and when to review progress."},
            {"title": "Track progress", "text": "Adjust the plan as you respond, with a gradual and safe return to activity."},
        ],
        "expect_title": "Care that respects your time and your goals",
        "expect_points": [
            "Assessment before treatment — we only recommend what suits you",
            "Exercise-led recovery, with hands-on care where it helps",
            "Booking, reminders and your home exercise plan on WhatsApp",
            "Live slot availability, so you can pick a time that works",
        ],
        "seo_title": "About the clinic",
        "seo_description": "Meet the team at Srini Physio Clinics, Kondapur: assessment-led sports physiotherapy, exercise-based recovery and hands-on care.",
    },
    "treatments": {
        "hero_title": "Treatments",
        "hero_intro": "Every plan starts with an assessment. Your physiotherapist then combines the treatments that suit your symptoms, goals and sport.",
        "footer_note": "Not sure which treatment you need? That's normal — book an assessment and we'll recommend what fits.",
        "seo_title": "Physiotherapy treatments",
        "seo_description": "Electrotherapy, rehab gym, manual therapy, chiropractic care, dry needling, cupping and kinesiology taping at Srini Physio Clinics, Kondapur — chosen after assessment.",
    },
    "contact": {
        "hero_title": "Book a visit",
        "hero_intro": "Choose a free slot online, or message us on WhatsApp — we'll confirm your appointment there.",
        "booking_title": "Book an assessment",
        "booking_text": "Takes about a minute: pick a time, tell us how you're feeling, and send it on WhatsApp.",
        "faq_title": "Questions before you visit?",
        "faq_intro": "Not sure which treatment you need? That's fine — start with an assessment rather than choosing a technique yourself.",
        "faqs": [
            {"question": "Do I need to be a professional athlete?", "answer": "No. We see athletes and active people at every level — recreational players, gym-goers, runners and people returning to exercise."},
            {"question": "Which treatment is right for my pain?", "answer": "It depends on your symptoms, history and assessment. We recommend the right combination after evaluating you — not every treatment suits everyone."},
            {"question": "Can I come in with a sports injury?", "answer": "Yes. Book an assessment or message us on WhatsApp. Severe pain, a suspected fracture or a serious injury may need urgent medical attention first."},
            {"question": "What should I bring?", "answer": "Wear comfortable clothing. Bring any scan reports, prescriptions or previous treatment notes, and a note of when your symptoms started."},
            {"question": "How do I book or reschedule?", "answer": "Use the booking form to pick a free slot, or message us on WhatsApp. We confirm every appointment on WhatsApp, and you can reply there to reschedule."},
            {"question": "Is there parking nearby?", "answer": "Message us on WhatsApp for the latest parking information near Masid Banda, Kondapur."},
        ],
        "seo_title": "Contact & booking",
        "seo_description": "Book a sports physiotherapy assessment at Srini Physio Clinics, Masid Banda, Kondapur. Pick a free slot online or message us on WhatsApp.",
    },
    "letterhead": {
        "doctor_name": "Dr. G. Tharun Sai",
        "doctor_credentials": "PHYSIOTHERAPIST, (BPT, MPT)",
        "doctor_specialties": ["SPORTS & MANUAL THERAPY", "SPORTS PHYSIOTHERAPIST"],
        "address_lines": ["1st Floor, GVR Sapphire,", "Above Masjid Banda Kondapur - 500084"],
        "phone": "+91 7702225124",
        "email": "Sriniphysioclinics@gmail.com",
        "qr_link": "",
        "document_title": "Treatment Summary",
        "closing_note": "Keep this summary for your records. Message us on WhatsApp if your symptoms get worse or you have any questions.",
        "auto_send": "yes",
        "whatsapp_message": "Hello {patient}, thank you for visiting Srini Physio Clinics. Your treatment summary from {doctor} is ready: {link}",
    },
    "blog": {
        "hero_title": "Recovery notes",
        "hero_intro": "Practical advice on injuries, exercise and getting back to the activities you love — from the Srini Physio Clinics team.",
        "seo_title": "Blog",
        "seo_description": "Physiotherapy tips, injury advice and exercise guidance from Srini Physio Clinics, Kondapur, Hyderabad.",
    },
}

# Rich treatment-page wording for the six seeded services (matched by name on first start).
TREATMENT_DEFAULTS = {'Electrotherapy': {'slug': 'electrotherapy',
                    'image': '/treatments/electrotherapy.jpg',
                    'tagline': 'Gentle electrical stimulation to help manage pain and support muscle '
                               'activation.',
                    'about': 'Electrotherapy uses small, controlled electrical currents delivered through '
                             'pads on the skin. Depending on your assessment, it may be used to help ease '
                             'pain or to help muscles activate during rehabilitation. It is used alongside '
                             'exercise and hands-on care, not instead of them.',
                    'helps_with': ['Acute and persistent muscle or joint pain',
                                   'Muscle weakness after injury or surgery',
                                   'Pain that limits early rehabilitation exercise'],
                    'expect': ['Pads are placed around the treatment area',
                               'Intensity is adjusted until it feels comfortable — a tingling or pulsing '
                               'sensation',
                               'Usually 10–20 minutes as part of a longer session'],
                    'note': 'Not suitable for everyone — for example people with pacemakers or certain '
                            'implants, during pregnancy over some areas, or over broken skin. Tell us about '
                            'your medical history at assessment.'},
 'Rehab Gym & Exercise': {'slug': 'rehab-gym',
                          'image': '/treatments/rehab-gym.jpg',
                          'tagline': 'Guided strength, mobility and conditioning to rebuild capacity and '
                                     'confidence.',
                          'about': 'Exercise is at the heart of most recovery plans. In the rehab gym we '
                                   'build strength, mobility, balance and control step by step — matched to '
                                   'your injury, your sport or daily activity, and how your body responds.',
                          'helps_with': ['Returning to sport or training after injury',
                                         'Recovery after surgery',
                                         'Recurring strains, stiffness or reduced strength',
                                         'Balance and movement confidence'],
                          'expect': ['A programme based on your assessment and goals',
                                     'Supervised sessions with coaching on technique',
                                     'A home exercise plan, shared on WhatsApp',
                                     'Progress reviewed and adjusted over time'],
                          'note': 'Exercises are progressed gradually. Let us know if anything causes sharp '
                                  'or worsening pain.'},
 'Manual Therapy': {'slug': 'manual-therapy',
                    'image': '/treatments/manual-therapy.jpg',
                    'tagline': 'Hands-on assessment and treatment of joints and soft tissues.',
                    'about': 'Manual therapy includes techniques such as joint mobilisation and soft-tissue '
                             'work, performed by the physiotherapist. It can help ease pain and stiffness so '
                             'you can move and exercise more comfortably, and is usually combined with an '
                             'exercise plan.',
                    'helps_with': ['Neck and back stiffness',
                                   'Joint stiffness, e.g. shoulder, knee or ankle',
                                   'Muscle tightness and tension'],
                    'expect': ['Assessment of how your joints and muscles move',
                               'Techniques explained before they are used, with your consent',
                               'Advice and exercises to continue at home'],
                    'note': 'Some techniques are not appropriate in certain conditions; your physiotherapist '
                            'will screen for these first.'},
 'Dry Needling': {'slug': 'dry-needling',
                  'image': '/treatments/dry-needling.jpg',
                  'tagline': 'Fine, sterile needles used on selected muscle trigger points after screening.',
                  'about': 'Dry needling uses very fine, single-use sterile needles inserted into specific '
                           'points in a muscle. It is a clinician-led technique that may help with certain '
                           'muscle-related pain and tightness, and is always part of a wider plan rather '
                           'than a stand-alone fix.',
                  'helps_with': ['Muscle knots and trigger points',
                                 'Neck, shoulder and upper back tension',
                                 'Some sports-related muscle pain'],
                  'expect': ['Screening and consent before any needling',
                             'A brief prick and sometimes a muscle twitch or ache',
                             'Mild soreness for a day or so is common'],
                  'note': 'Not suitable for everyone — for example with needle phobia, some bleeding '
                          'disorders or blood-thinning medication, or during pregnancy. We will check before '
                          'treatment.'},
 'Cupping Therapy': {'slug': 'cupping',
                     'image': '/treatments/cupping.jpg',
                     'tagline': 'An optional technique using suction cups for muscle discomfort and '
                                'recovery.',
                     'about': 'Cupping uses cups that create gentle suction on the skin over muscles. Some '
                              'people find it helpful for muscle discomfort and recovery. We offer it as an '
                              'optional addition to an assessment-led plan, not as a treatment on its own.',
                     'helps_with': ['Muscle tightness and discomfort', 'Recovery after training'],
                     'expect': ['Cups placed on the treatment area for a few minutes',
                                'A pulling sensation — it should not be painful',
                                'Temporary circular marks that fade over several days'],
                     'note': 'Not used over broken or fragile skin, and not suitable for some medical '
                             'conditions. Ask us if you are unsure.'},
 'Kinesiology Taping': {'slug': 'kinesiology-taping',
                        'image': '/treatments/kinesiology-taping.jpg',
                        'tagline': 'Elastic tape applied to support movement confidence during activity.',
                        'about': 'Kinesiology tape is a flexible, breathable tape applied to the skin. It is '
                                 'commonly used to help people feel more supported and confident while '
                                 'moving, training or competing, alongside their rehab exercises.',
                        'helps_with': ['Feeling unsupported during sport or activity',
                                       'Returning to training after a minor injury',
                                       'Reminding you of good movement patterns'],
                        'expect': ['Quick application in clinic',
                                   'Usually worn for a few days, including in the shower',
                                   'Guidance on removing it gently'],
                        'note': 'Remove the tape if your skin itches or becomes irritated.'},
    'Chiropractic Care': {'slug': 'chiropractic',
                          'image': '/treatments/chiropractic.jpg',
                          'tagline': 'Hands-on adjustment of the spine and joints to ease stiffness and help you move freely.',
                          'about': 'Chiropractic-style care uses precise, hands-on techniques — joint mobilisation and, '
                                   'where suitable, quick controlled adjustments — to help restore movement in stiff areas of '
                                   'the spine and other joints. It is offered only after a full assessment and is combined '
                                   'with exercise and advice, so the improvement lasts.',
                          'helps_with': ['Neck and lower-back stiffness',
                                         'Mid-back stiffness from desk work, driving or sport',
                                         'Restricted joint movement, e.g. shoulder, hip or pelvis',
                                         'Neck-related tension and stiffness'],
                          'expect': ['A full assessment and screening before any adjustment',
                                     'Each technique explained first, and used only with your consent',
                                     "Sometimes a 'click' as a joint moves — this is normal, not a bone going back into "
                                     'place',
                                     'Exercises and advice to keep the improvement going'],
                          'note': 'Not suitable for everyone — for example with osteoporosis, a recent fracture or surgery, '
                                  'some spinal or circulation conditions, or blood-thinning medication. We screen for these '
                                  'first and use gentler techniques where needed.'}}


def slugify(text: str) -> str:
    text = text.lower().replace("&", "and")
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-") or "item"


def merged_content(stored: dict) -> dict:
    """Defaults overlaid with stored edits. Only known fields of the right type are taken,
    so a stale or malformed stored value can never break a page."""
    out = {}
    for key, defaults in DEFAULT_CONTENT.items():
        section = dict(defaults)
        for field, value in (stored.get(key) or {}).items():
            if field in defaults and isinstance(value, type(defaults[field])):
                section[field] = value
        out[key] = section
    return out
