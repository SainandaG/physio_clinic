// Icons and default photos for treatment pages. The wording (summary, "what it is", "commonly used
// for", "what to expect", caution note, SEO) is edited in Admin → Services and comes from the API.
// Default photos in public/treatments/ are free-licence Unsplash photos (see public/treatments/CREDITS.md).
import { LuZap, LuDumbbell, LuHand, LuCircleDot, LuBandage, LuActivity, LuCrosshair, LuBone } from 'react-icons/lu';

export const TREATMENTS = [
  { slug: 'electrotherapy', name: 'Electrotherapy', Icon: LuZap, image: '/treatments/electrotherapy.jpg' },
  { slug: 'rehab-gym', name: 'Rehab Gym & Exercise', Icon: LuDumbbell, image: '/treatments/rehab-gym.jpg' },
  { slug: 'manual-therapy', name: 'Manual Therapy', Icon: LuHand, image: '/treatments/manual-therapy.jpg' },
  { slug: 'dry-needling', name: 'Dry Needling', Icon: LuCrosshair, image: '/treatments/dry-needling.jpg' },
  { slug: 'cupping', name: 'Cupping Therapy', Icon: LuCircleDot, image: '/treatments/cupping.jpg' },
  { slug: 'kinesiology-taping', name: 'Kinesiology Taping', Icon: LuBandage, image: '/treatments/kinesiology-taping.jpg' },
  { slug: 'chiropractic', name: 'Chiropractic Care', Icon: LuBone, image: '/treatments/chiropractic.jpg' },
];

export const slugify = (name) => name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// A service from the API, shaped for the treatment card and page.
// A photo set in Admin → Services replaces the default treatment photo.
export const treatmentFor = (service) => {
  const base = TREATMENTS.find(t => t.name === service.name) || {};
  return {
    slug: service.slug || base.slug || slugify(service.name),
    name: service.name,
    Icon: base.Icon || LuActivity,
    image: service.image_url || base.image || null,
    tagline: service.description || '',
    about: service.about || service.description || '',
    helpsWith: service.helps_with || [],
    expect: service.expect || [],
    note: service.note || null,
    seoTitle: service.seo_title,
    seoDescription: service.seo_description,
  };
};

export const FALLBACK_SERVICES = TREATMENTS.map((t, i) => ({ id: i + 1, name: t.name, slug: t.slug, description: '', whatsapp_message: '' }));
