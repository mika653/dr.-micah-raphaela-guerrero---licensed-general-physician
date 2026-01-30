
import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  MapPin,
  Clock,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  CalendarCheck,
  Wallet,
  Quote,
  Loader2,
  Sparkles
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DOCTOR_INFO, SERVICES, PAYMENT_METHODS, TESTIMONIALS } from './constants';

// Extending window interface for AI Studio helpers to match environmental expectations
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // Fix: Removed readonly to match potentially existing global declarations of aistudio
    aistudio: AIStudio;
  }
}

const useScrollReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); observer.unobserve(el); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
};

const ScrollReveal: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const ref = useScrollReveal();
  return <div ref={ref} className={`scroll-reveal ${className}`}>{children}</div>;
};

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b py-3' : 'bg-transparent py-6'}`}>
      <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-teal-600" size={24} />
          <span className="font-semibold text-lg tracking-tight text-slate-800">
            {isScrolled ? 'Dr. Micah Guerrero' : ''}
          </span>
        </div>
        <a 
          href={DOCTOR_INFO.bookingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm"
        >
          Book Now
        </a>
      </div>
    </nav>
  );
};

const Section: React.FC<{ children: React.ReactNode; id?: string; className?: string; bgColor?: string }> = ({ children, id, className, bgColor = "bg-white" }) => (
  <section id={id} className={`py-20 md:py-32 ${bgColor} ${className}`}>
    <div className="max-w-6xl mx-auto px-6">
      {children}
    </div>
  </section>
);

const ClinicLocationCard: React.FC = () => {
  const [mapLink, setMapLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorOccurred, setErrorOccurred] = useState(false);

  const fetchLocation = async () => {
    setLoading(true);
    try {
      // Re-initialize GoogleGenAI inside the function to pick up latest API keys
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let locationConfig = {};
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        locationConfig = {
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }
            }
          }
        };
      } catch (e) {
        console.debug("Geolocation not available or denied, proceeding without it.");
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: `Find the official Google Maps link for "${DOCTOR_INFO.location}".`,
        config: {
          tools: [{ googleMaps: {} }],
          ...locationConfig
        },
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        const mapChunk = groundingChunks.find((chunk: any) => chunk.maps?.uri);
        if (mapChunk) {
          setMapLink(mapChunk.maps.uri);
        }
      }
      setErrorOccurred(false);
    } catch (error: any) {
      console.error("Error fetching map location:", error);
      if (error?.message?.includes("Requested entity was not found") || (error?.status === "NOT_FOUND") || (error?.code === 404)) {
        setErrorOccurred(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const handleFixKey = async () => {
    await window.aistudio.openSelectKey();
    fetchLocation();
  };

  const finalMapUri = mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(DOCTOR_INFO.location)}`;

  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
      <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-6">
        <MapPin size={24} />
      </div>
      <h3 className="text-xl font-semibold mb-2">Clinic Location</h3>
      <p className="text-slate-600 mb-6">{DOCTOR_INFO.location}</p>
      
      <div className="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden relative group">
        <img 
          src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=600" 
          alt="Map context" 
          loading="lazy"
          className="w-full h-full object-cover opacity-50 transition-opacity group-hover:opacity-40"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          {loading ? (
            <Loader2 className="animate-spin text-teal-600" size={32} />
          ) : errorOccurred ? (
            <div className="bg-white/95 backdrop-blur shadow-xl border border-red-100 px-6 py-4 rounded-2xl max-w-[90%] flex flex-col items-center">
              <p className="text-xs text-red-600 mb-2 font-medium">Service Access Issue</p>
              <button 
                onClick={handleFixKey}
                className="text-xs bg-teal-600 text-white px-4 py-2 rounded-lg font-bold mb-3 hover:bg-teal-700 transition-colors"
              >
                Setup API Key
              </button>
              <a 
                href={finalMapUri}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-slate-500 underline hover:text-slate-700"
              >
                Or view standard map
              </a>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur shadow-xl border border-teal-100 px-6 py-4 rounded-2xl max-w-[80%] transform transition-transform group-hover:scale-105">
              <p className="text-sm font-semibold text-slate-800 mb-2">Exact Check Diagnostic Center</p>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">Libis, Quezon City, Metro Manila</p>
              <a 
                href={finalMapUri}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-teal-600 font-bold text-sm hover:text-teal-700 underline"
              >
                View on Google Maps
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Doctor portrait source
  const doctorPhotoUrl = "/doc micah.jpg";

  return (
    <div className="min-h-screen selection:bg-teal-100 selection:text-teal-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-28 md:pt-40 pb-20 md:pb-32 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/40">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left: Text */}
            <div className="order-2 md:order-1">
              <div className="flex items-center gap-2 px-4 py-2 mb-8 bg-amber-50 border border-amber-200/60 rounded-full w-fit shadow-sm animate-fade-up">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-amber-700 text-xs font-bold uppercase tracking-widest">Licensed General Physician</span>
              </div>

              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-[1.1] tracking-tight animate-fade-up-delay-1">
                {DOCTOR_INFO.name}
              </h1>
              <p className="text-xl md:text-2xl text-slate-500 mb-10 leading-relaxed font-light max-w-lg animate-fade-up-delay-2">
                {DOCTOR_INFO.tagline}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-up-delay-3">
                <a
                  href={DOCTOR_INFO.bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-10 py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Schedule a Consultation
                  <ArrowRight size={22} />
                </a>
                <a
                  href="#about"
                  className="px-10 py-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-lg transition-all flex items-center justify-center"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Right: Portrait */}
            <div className="relative order-1 md:order-2 flex justify-center animate-fade-up">
              <div className="relative">
                <div className="w-72 h-72 md:w-[360px] md:h-[360px] lg:w-[420px] lg:h-[420px] rounded-full overflow-hidden border-4 border-white shadow-2xl ring-1 ring-slate-200/50">
                  <img src={doctorPhotoUrl} alt={DOCTOR_INFO.name} className="w-full h-full object-cover" loading="eager" />
                </div>
                {/* Decorative gold ring */}
                <div className="absolute -inset-3 rounded-full border-2 border-dashed border-amber-300/40 pointer-events-none"></div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-xl border border-slate-100 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Accepting Patients</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background decorations */}
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-[700px] h-[700px] bg-teal-100/25 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[500px] h-[500px] bg-amber-100/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-teal-50/40 to-transparent rounded-full blur-2xl pointer-events-none"></div>
      </section>

      {/* About Section */}
      <Section id="about">
        <ScrollReveal>
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="order-2 md:order-1">
            <div className="flex items-center gap-2 mb-10">
              <div className="w-12 h-1 bg-teal-600 rounded-full"></div>
              <div className="w-4 h-1 bg-amber-400 rounded-full"></div>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-8 tracking-tight">Patient-First Medical Care</h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-10 font-light">
              {DOCTOR_INFO.bio}
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 shadow-sm border border-amber-100/50">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">Licensed Physician</h4>
                  <p className="text-slate-500">Professional accreditation for general practice and preventive care.</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="p-3 bg-teal-50 rounded-2xl text-teal-600 shadow-sm border border-teal-100/50">
                  <CalendarCheck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">Evidence-Based Medicine</h4>
                  <p className="text-slate-500">Committed to using clinical data and research to guide patient health journeys.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative order-1 md:order-2">
             <div className="aspect-[4/5] rounded-[2rem] bg-slate-100 overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src={doctorPhotoUrl}
                  alt={DOCTOR_INFO.name}
                  loading="lazy"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                />
             </div>
             <div className="absolute -bottom-8 -right-8 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 hidden lg:block max-w-[240px]">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">General Medicine</p>
                </div>
                <p className="font-serif text-xl font-bold text-slate-900 leading-snug">Compassionate & Evidence-Based Care</p>
             </div>
          </div>
        </div>
        </ScrollReveal>
      </Section>

      {/* Services Section */}
      <Section id="services" bgColor="bg-slate-50">
        <ScrollReveal>
        <div className="text-center mb-20">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight">Comprehensive Services</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg font-light">Dedicated to providing reliable primary care and diagnostic support for your everyday health needs.</p>
        </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service, idx) => (
            <ScrollReveal key={idx}>
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                {service.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{service.title}</h3>
              <p className="text-slate-500 leading-relaxed font-light">{service.description}</p>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* Testimonials Section */}
      <Section id="testimonials">
        <ScrollReveal>
        <div className="text-center mb-20">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight">Patient Experiences</h2>
          <p className="text-slate-500 text-lg font-light">Reflecting our commitment to patient-centered, compassionate care.</p>
        </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {TESTIMONIALS.map((testimonial, idx) => (
            <ScrollReveal key={idx}>
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 relative pt-14 flex flex-col h-full shadow-sm">
              <div className="absolute top-0 left-10 -translate-y-1/2 p-4 bg-amber-500 text-white rounded-2xl shadow-xl">
                <Quote size={24} fill="currentColor" />
              </div>
              <p className="text-slate-600 italic leading-relaxed mb-8 flex-grow text-lg font-serif">"{testimonial.text}"</p>
              <div className="mb-8 border-t border-slate-50 pt-6">
                <p className="font-bold text-slate-900 text-lg">{testimonial.author}</p>
                <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mt-1">{testimonial.detail}</p>
              </div>
              <a
                href={DOCTOR_INFO.bookingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-teal-50 text-teal-700 rounded-2xl text-sm font-bold transition-all hover:bg-teal-600 hover:text-white flex items-center justify-center gap-2 border border-teal-100/50"
              >
                <CalendarCheck size={18} />
                Book Appointment
              </a>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* Clinic Info Grid */}
      <Section id="clinic-info" bgColor="bg-slate-50">
        <ScrollReveal>
        <div className="grid md:grid-cols-3 gap-10">
          <ClinicLocationCard />

          <div className="bg-white p-10 rounded-[2rem] border border-slate-200 flex flex-col items-center text-center shadow-sm">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-8">
              <Clock size={28} />
            </div>
            <h3 className="font-serif text-2xl font-bold mb-3">Clinic Hours</h3>
            <p className="text-slate-500 mb-1 font-medium">Monday to Friday</p>
            <p className="text-slate-900 font-bold text-3xl mb-10">8 AM – 5 PM</p>
            
            <div className="w-full p-6 bg-slate-50 rounded-2xl text-left border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                 <ShieldCheck size={16} className="text-teal-600" />
                 <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Appointment Only</p>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-light">To maintain safety standards and reduce wait times, we encourage all patients to book in advance.</p>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2rem] border border-slate-200 flex flex-col items-center text-center shadow-sm">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-8">
              <Wallet size={28} />
            </div>
            <h3 className="font-serif text-2xl font-bold mb-3">Consultation Rate</h3>
            <p className="text-slate-500 mb-2 font-light uppercase tracking-widest">Base Consultation Fee</p>
            <p className="text-slate-900 font-bold text-5xl mb-10">{DOCTOR_INFO.consultationFee}</p>
            
            <div className="w-full space-y-4 text-left">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2 text-center">Accepted Payments</p>
              {PAYMENT_METHODS.map((method, idx) => (
                <div key={idx} className="flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-teal-600">{method.icon}</span>
                  <span className="font-bold text-slate-700">{method.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </ScrollReveal>
      </Section>

      {/* Appointment Booking CTA */}
      <Section bgColor="bg-slate-900" className="text-white relative overflow-hidden">
        <ScrollReveal>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-8 tracking-tight">Secure your consultation today.</h2>
          <p className="text-slate-300 text-xl mb-12 leading-relaxed font-light">
            Dr. Micah utilizes SeriousMD for all medical bookings, ensuring your personal health information remains confidential and your slot is guaranteed.
          </p>
          <a 
            href={DOCTOR_INFO.bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-12 py-6 bg-teal-500 hover:bg-teal-400 text-white rounded-2xl font-bold text-xl transition-all shadow-2xl hover:scale-105 active:scale-95"
          >
            Go to Booking Page
            <ExternalLink size={24} />
          </a>
          <p className="mt-10 text-slate-500 text-sm font-medium tracking-wide">
            Verified Healthcare Professional &middot; SeriousMD Integrated
          </p>
        </div>
        </ScrollReveal>
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-teal-500/10 rounded-full blur-[140px] -translate-y-1/2 pointer-events-none"></div>
      </Section>

      {/* Contact Section */}
      <Section id="contact" className="pb-32">
        <ScrollReveal>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight">Get in Touch</h2>
            <p className="text-slate-500 text-lg font-light">For specific inquiries or medical documentation follow-ups.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <a 
              href={`tel:${DOCTOR_INFO.phone.replace(/\s/g, '')}`}
              className="flex items-center gap-8 p-10 bg-white border border-slate-200 rounded-[2rem] hover:border-teal-300 hover:bg-teal-50/20 transition-all group shadow-sm"
            >
              <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors">
                <Phone size={28} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Phone Number</p>
                <p className="text-xl font-bold text-slate-900">{DOCTOR_INFO.phone}</p>
              </div>
            </a>
            <a 
              href={`mailto:${DOCTOR_INFO.email}`}
              className="flex items-center gap-8 p-10 bg-white border border-slate-200 rounded-[2rem] hover:border-teal-300 hover:bg-teal-50/20 transition-all group shadow-sm"
            >
              <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors">
                <Mail size={28} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Email Address</p>
                <p className="text-xl font-bold text-slate-900">{DOCTOR_INFO.email}</p>
              </div>
            </a>
          </div>
        </div>
        </ScrollReveal>
      </Section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16">
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={doctorPhotoUrl} alt="Dr. Micah Small" loading="lazy" className="w-full h-full object-cover" />
               </div>
               <div>
                 <h3 className="font-serif text-2xl font-bold text-slate-900 leading-tight">{DOCTOR_INFO.name}</h3>
                 <p className="text-slate-500 font-medium">{DOCTOR_INFO.title}</p>
               </div>
            </div>
            <div className="flex flex-wrap gap-8">
              <a href="#about" className="text-slate-600 hover:text-teal-600 transition-colors text-sm font-bold uppercase tracking-widest">About</a>
              <a href="#services" className="text-slate-600 hover:text-teal-600 transition-colors text-sm font-bold uppercase tracking-widest">Services</a>
              <a href="#testimonials" className="text-slate-600 hover:text-teal-600 transition-colors text-sm font-bold uppercase tracking-widest">Patient Reviews</a>
              <a href="#clinic-info" className="text-slate-600 hover:text-teal-600 transition-colors text-sm font-bold uppercase tracking-widest">Clinic</a>
            </div>
          </div>
          <div className="pt-12 border-t border-slate-200">
            <div className="bg-slate-100 p-8 rounded-3xl mb-12 border border-slate-200/50 shadow-inner">
              <p className="text-xs text-slate-500 leading-relaxed text-center uppercase tracking-tighter mb-4 font-black opacity-80">Medical Disclaimer</p>
              <p className="text-xs text-slate-400 leading-relaxed text-center max-w-4xl mx-auto font-light">
                The content provided on this website, including text, graphics, and images, is for informational purposes only. It is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this website. In case of a medical emergency, call your local emergency services or visit the nearest hospital immediately.
              </p>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm font-medium">
               <p>&copy; {new Date().getFullYear()} {DOCTOR_INFO.name}. All rights reserved.</p>
               <p className="flex items-center gap-2">
                  <ShieldCheck size={14} /> 
                  HIPAA Compliant Booking via SeriousMD
               </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
