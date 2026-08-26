import ContactForm from '@/features/feedback/ContactForm';
import ContactIntroduction from '@/features/feedback/ContactIntroduction';

export default function ContactPage() {
  return (
    <div className="hero-grid">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
        <ContactIntroduction />
        <ContactForm />
      </div>
    </div>
  );
}
