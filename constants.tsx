
import React from 'react';
import { 
  Stethoscope, 
  ClipboardList, 
  Microscope, 
  TestTube2, 
  FileText, 
  Video, 
  Clock, 
  MapPin, 
  Wallet,
  Phone,
  Mail,
  Smartphone
} from 'lucide-react';

export const DOCTOR_INFO = {
  name: "Dr. Micah Raphaela Guerrero, MD",
  title: "Licensed General Physician",
  tagline: "Holistic, evidence-based medical care you can trust.",
  bookingLink: "https://seriousmd.com/doc/micah-raphaela-guerrero",
  phone: "0917 125 7453",
  email: "drmicahrguerrero@gmail.com",
  consultationFee: "₱500",
  location: "Exact Check Diagnostic Center – Libis",
  hours: "Monday to Friday, 8:00 AM – 5:00 PM",
  bio: "A Licensed General Physician providing quality medical care for patients of all ages. Dr. Micah combines a holistic approach with evidence-based medicine to deliver thoughtful, reliable, and compassionate care."
};

export const SERVICES = [
  {
    title: "Medical Consultations",
    description: "Personalized primary care for a wide range of health concerns.",
    icon: <Stethoscope size={24} />
  },
  {
    title: "Annual Physical Exam",
    description: "Comprehensive health assessments for preventive care.",
    icon: <ClipboardList size={24} />
  },
  {
    title: "Pre-employment Exam",
    description: "Official medical certifications for workplace requirements.",
    icon: <FileText size={24} />
  },
  {
    title: "Lab Result Interpretation",
    description: "Detailed explanation and clinical guidance based on your results.",
    icon: <TestTube2 size={24} />
  },
  {
    title: "Pap Smear",
    description: "Essential preventive screening for women's reproductive health.",
    icon: <Microscope size={24} />
  },
  {
    title: "Medical Certificates",
    description: "Issuance of formal medical documentation as needed.",
    icon: <FileText size={24} />
  },
  {
    title: "Teleconsultation",
    description: "Convenient medical advice from the comfort of your home.",
    icon: <Video size={24} />
  }
];

export const TESTIMONIALS = [
  {
    text: "Dr. Micah is very thorough and patient. She took the time to explain my lab results in a way that was easy to understand. I felt truly listened to.",
    author: "Maria C.",
    detail: "Regular Consultation"
  },
  {
    text: "Professional and very reassuring. The clinic's environment is calm, and Dr. Guerrero's holistic approach really helped me manage my preventive health better.",
    author: "Robert L.",
    detail: "Annual Physical Exam"
  },
  {
    text: "Efficient and reliable service. Getting my medical certificate and consultation done via teleconsult was seamless. Highly recommended for busy professionals.",
    author: "Jen S.",
    detail: "Teleconsultation"
  }
];

export const PAYMENT_METHODS = [
  { name: "GCash", icon: <Smartphone size={18} /> },
  { name: "Maya", icon: <Smartphone size={18} /> },
  { name: "Bank Transfer", icon: <Wallet size={18} /> }
];
