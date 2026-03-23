/**
 * Ojasvita - Landing Page
 * 
 * This is the public landing page for the Ojasvita app.
 * It contains all the marketing sections for the app.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Inline SVG Icons
const LogoIcon = () => (
  <svg viewBox="0 0 40 40" className="h-10 w-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="#10b981" />
    <path d="M20 10C14.48 10 10 14.48 10 20C10 25.52 14.48 30 20 30C25.52 30 30 25.52 30 20C30 14.48 25.52 10 20 10ZM20 12C19 12 18 12.5 17.3 13.3L14 16.6C13.5 17 13.5 17.8 14 18.2L17.3 21.5C18.2 22.4 19.8 22.4 20.7 21.5L24 18.2C24.5 17.8 24.5 17 24 16.6L20.7 13.3C20 12.5 19 12 18 12H20ZM20 14V18M18 16H22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

/**
 * LandingPage Component
 * 
 * The main landing page with all marketing sections
 */
const LandingPage = () => {
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [legalModal, setLegalModal] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  // Animations on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-active');
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Handle back to top visibility
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // FAQ data
  const faqs = [
    {
      question: "Is Ojasvita free to use?",
      answer: "Yes, Ojasvita offers a free tier with all the essential features. We also have premium plans with advanced features like detailed analytics and custom meal planning."
    },
    {
      question: "How accurate is the calorie tracking?",
      answer: "Our food database contains thousands of foods with verified nutritional information. We use standard nutritional data and provide manual entry options for custom foods to ensure accuracy."
    },
    {
      question: "Can I track water intake?",
      answer: "Absolutely! Ojasvita includes a water tracking feature that helps you stay hydrated throughout the day with customizable goals and reminders."
    },
    {
      question: "Does Ojasvita work offline?",
      answer: "Yes, once you've downloaded the app, you can track your meals and water intake offline. Data will sync when you're back online."
    },
    {
      question: "Can I set weight loss goals?",
      answer: "Yes, you can set personalized goals based on your current weight, target weight, and timeline. The app will calculate your daily calorie target accordingly."
    },
    {
      question: "How do I get started?",
      answer: "Simply create an account, set up your profile with your current stats and goals, and start logging your meals and water intake. The app will guide you through the process!"
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Fitness Enthusiast",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      quote: "Ojasvita has completely transformed how I track my nutrition. The water reminder feature is a game-changer!"
    },
    {
      name: "Mike Chen",
      role: "Marathon Runner",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      quote: "Finally an app that makes calorie tracking simple. I've lost 15 lbs in 2 months using Ojasvita!"
    },
    {
      name: "Emily Davis",
      role: "Busy Professional",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      quote: "The meal planning feature saves me so much time. I can focus on my work while staying on track with my diet."
    }
  ];

  // Features data
  const features = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
      title: "Calorie Tracking",
      description: "Track your daily calorie intake with our extensive food database and easy-to-use logging system."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: "Water Intake Monitoring",
      description: "Stay hydrated with our water tracking feature and customizable hydration goals."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Goal-Based Tracking",
      description: "Set personalized goals for weight loss, maintenance, or muscle gain with adaptive targets."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      title: "Meal Planning",
      description: "Plan your meals in advance with weekly meal plans and nutritional breakdowns."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      ),
      title: "Streak Tracking",
      description: "Stay motivated with daily streak tracking and achievement badges."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Detailed Analytics",
      description: "Visualize your progress with charts and insights to stay on track."
    }
  ];

  // How it works steps
  const howItWorks = [
    {
      step: 1,
      title: "Create Your Profile",
      description: "Sign up and set up your profile with your current stats and health goals."
    },
    {
      step: 2,
      title: "Log Your Meals",
      description: "Track what you eat throughout the day using our food database or manual entry."
    },
    {
      step: 3,
      title: "Monitor Your Progress",
      description: "View your daily summaries and track your progress towards your goals."
    },
    {
      step: 4,
      title: "Achieve Your Goals",
      description: "Stay consistent and watch as you reach your health and fitness goals."
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    setContactForm({ name: '', email: '', message: '' });
  };

  const legalContent = {
    privacy: {
      title: 'Privacy Policy',
      content: [
        'At Ojasvita, we take your privacy seriously. This policy describes how we collect, use, and handle your data.',
        'Data Collection: We collect information such as your name, email, age, gender, height, and weight to provide personalized nutrition and health tracking.',
        'Data Usage: Your data is used solely to calculate health metrics (BMI, calories, etc.) and to improve our services. We do not sell your personal information to third parties.',
        'Data Security: We implement standard security measures to protect your account and data from unauthorized access.',
        'Your Rights: You have the right to access, correct, or delete your personal data at any time through your profile settings.'
      ]
    },
    terms: {
      title: 'Terms of Service',
      content: [
        'By using Ojasvita, you agree to these terms. Please read them carefully.',
        'Account Responsibility: You are responsible for maintaining the confidentiality of your account and password.',
        'Prohibited Use: You agree not to use the service for any illegal purposes or to interfere with the operation of the platform.',
        'Limitation of Liability: Ojasvita is a tool for informational purposes. Consult with a medical professional before starting any new diet or exercise program.',
        'Service Changes: We reserve the right to modify or terminate the service at any time for any reason.'
      ]
    },
    cookies: {
      title: 'Cookie Policy',
      content: [
        'We use cookies to enhance your experience on our platform.',
        'Essential Cookies: These are necessary for the website to function, such as maintaining your login session.',
        'Performance Cookies: These allow us to count visits and traffic sources so we can measure and improve the performance of our site.',
        'Functionality Cookies: These enable the website to provide enhanced functionality and personalization.',
        'Managing Cookies: You can choose to disable cookies through your browser settings, though some features of Ojasvita may not function correctly.'
      ]
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img src="/logo-main.png" alt="Ojasvita Logo" className="h-10 w-auto" />
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 hover:text-primary-600 transition-colors">Features</a>
              <a href="#benefits" className="text-gray-600 hover:text-primary-600 transition-colors">Benefits</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-primary-600 transition-colors">Process</a>
              <a href="#testimonials" className="text-gray-600 hover:text-primary-600 transition-colors">Stories</a>
              <a href="#about" className="text-gray-600 hover:text-primary-600 transition-colors">About</a>
              <a href="#faq" className="text-gray-600 hover:text-primary-600 transition-colors">FAQ</a>
              <a href="#contact" className="text-gray-600 hover:text-primary-600 transition-colors">Contact</a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-primary-600"
              >
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 hover:text-primary-600">Features</a>
              <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 hover:text-primary-600">Benefits</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 hover:text-primary-600">How It Works</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 hover:text-primary-600">Testimonials</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 hover:text-primary-600">About</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 hover:text-primary-600">FAQ</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 hover:text-primary-600">Contact</a>
              <div className="pt-4 space-y-3">
                <Link to="/login" className="block w-full text-center btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="block w-full text-center btn-primary">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-primary-100 py-20 lg:py-32 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-200 opacity-30 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary-200 opacity-30 blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight opacity-0 animate-fade-in-down">
                Your Personal
                <span className="text-primary-600"> Diet & Calorie</span>
                Tracker
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 opacity-0 animate-fade-in-up [animation-delay:200ms]">
                Ojasvita helps you track your calories, monitor water intake, plan meals, and achieve your health goals with ease.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="btn-primary px-8 py-3 text-lg">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn-secondary px-8 py-3 text-lg">
                  Login
                </Link>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                No credit card required • Start in seconds
              </p>
            </div>

            {/* Hero Illustration */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-auto animate-float">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-100 mb-6 animate-pulse-subtle">
                      <span className="text-4xl">🥗</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Today's Progress</h3>
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:scale-105 transition-transform duration-300">
                        <span className="text-gray-600">Calories</span>
                        <span className="font-bold text-primary-600">1,450 / 2,000</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:scale-105 transition-transform duration-300 [animation-delay:100ms]">
                        <span className="text-gray-600">Water</span>
                        <span className="font-bold text-primary-600">6 / 8 glasses</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:scale-105 transition-transform duration-300 [animation-delay:200ms]">
                        <span className="text-gray-600">Streak</span>
                        <span className="font-bold text-secondary-600">🔥 12 days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Everything You Need to Stay Healthy
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features to help you track, plan, and achieve your nutrition goals.
            </p>
          </div>

          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card animate-on-scroll opacity-0 [&.animate-active]:animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary-100 mb-4 group-hover:bg-primary-500 transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-300">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Why Choose Ojasvita?
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              We make nutrition tracking simple, accurate, and goal-oriented.
            </p>
          </div>

          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center animate-on-scroll opacity-0 [&.animate-active]:animate-slide-in-left">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Accuracy</h3>
              <p className="mt-2 text-gray-600">Our extensive food database ensures accurate calorie and nutrient tracking for better results.</p>
            </div>
            <div className="card text-center animate-on-scroll opacity-0 [&.animate-active]:animate-fade-in [animation-delay:200ms]">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Simplicity</h3>
              <p className="mt-2 text-gray-600">Easy-to-use interface that makes tracking your nutrition feel effortless.</p>
            </div>
            <div className="card text-center animate-on-scroll opacity-0 [&.animate-active]:animate-slide-in-right">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Goal-Based</h3>
              <p className="mt-2 text-gray-600">Set personalized goals and track your progress with adaptive targets.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our simple 4-step process.
            </p>
          </div>

          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative animate-on-scroll opacity-0 [&.animate-active]:animate-fade-in-up" style={{ animationDelay: `${index * 200}ms` }}>
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-500 text-white text-2xl font-bold shadow-lg shadow-primary-200">
                    {item.step}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-gray-600">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 -translate-y-1/2 translate-x-8"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              What Our Users Say
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied users who have transformed their health with Ojasvita.
            </p>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card animate-on-scroll opacity-0 [&.animate-active]:animate-scale-in" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-100"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                What is Ojasvita?
              </h2>
              <p className="mt-6 text-lg text-gray-600">
                Ojasvita is your personal diet and calorie monitoring companion. We believe that healthy eating shouldn't be complicated, which is why we've created a simple yet powerful tool to help you track your nutrition and achieve your wellness goals.
              </p>
              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Who is it for?</h3>
                  <p className="mt-2 text-gray-600">
                    Whether you're looking to lose weight, maintain a healthy lifestyle, or build muscle, Ojasvita is designed for anyone who wants to take control of their nutrition.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Why we exist?</h3>
                  <p className="mt-2 text-gray-600">
                    We saw that most nutrition tracking apps were overly complex and intimidating. We wanted to create something simple, intuitive, and effective that anyone can use to improve their health.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative animate-on-scroll opacity-0 [&.animate-active]:animate-slide-in-right">
              <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-3xl p-8 shadow-inner">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:translate-y-[-5px] transition-transform duration-300">
                    <div className="text-3xl font-bold text-primary-600">10K+</div>
                    <div className="text-sm text-gray-600 mt-1">Active Users</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:translate-y-[-5px] transition-transform duration-300 delay-75">
                    <div className="text-3xl font-bold text-secondary-600">500K+</div>
                    <div className="text-sm text-gray-600 mt-1">Meals Logged</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:translate-y-[-5px] transition-transform duration-300 delay-150">
                    <div className="text-3xl font-bold text-accent-500">95%</div>
                    <div className="text-sm text-gray-600 mt-1">Goal Achievement</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:translate-y-[-5px] transition-transform duration-300 delay-225">
                    <div className="text-3xl font-bold text-primary-600">4.8★</div>
                    <div className="text-sm text-gray-600 mt-1">User Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Have questions? We've got answers.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {(showAllFaqs ? faqs : faqs.slice(0, 3)).map((faq, index) => (
              <div key={index} className="card">
                <button
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {openFaqIndex === index ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
                {openFaqIndex === index && (
                  <div className="mt-4 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setShowAllFaqs(!showAllFaqs)}
              className="btn-primary"
            >
              {showAllFaqs ? 'Show Less' : 'View All FAQs'}
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-on-scroll opacity-0 [&.animate-active]:animate-scale-in">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Start Your Health Journey Today
          </h2>
          <p className="mt-4 text-xl text-primary-100">
            Join Ojasvita and take control of your nutrition. It's free to get started!
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-xl">
              Sign Up Free
            </Link>
            <Link to="/login" className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 hover:scale-105 transition-all duration-300">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Get In Touch
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Have questions or feedback? We'd love to hear from you!
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100">
                    <MailIcon />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email</h4>
                    <p className="text-gray-600">support@ojasvita.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100">
                    <TwitterIcon />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Twitter</h4>
                    <p className="text-gray-600">@ojasvita</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100">
                    <InstagramIcon />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Instagram</h4>
                    <p className="text-gray-600">@ojasvita</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="label">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    className="input-field"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    className="input-field"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="label">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactChange}
                    className="input-field"
                    rows="4"
                    placeholder="Your message..."
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn-primary w-full">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src="/logo-main.png" alt="Ojasvita Logo" className="h-10 w-auto" />
              </div>
              <p className="text-gray-400">
                Your personal diet and calorie monitoring companion. Track, plan, and achieve your health goals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-primary-400">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-primary-400">How It Works</a></li>
                <li><a href="#about" className="hover:text-primary-400">About</a></li>
                <li><a href="#faq" className="hover:text-primary-400">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => setLegalModal('privacy')} className="hover:text-primary-400 text-left">Privacy Policy</button></li>
                <li><button onClick={() => setLegalModal('terms')} className="hover:text-primary-400 text-left">Terms of Service</button></li>
                <li><button onClick={() => setLegalModal('cookies')} className="hover:text-primary-400 text-left">Cookie Policy</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-primary-400">
                  <TwitterIcon />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-400">
                  <InstagramIcon />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-400">
                  <MailIcon />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Ojasvita. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-all duration-300 animate-fade-in focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
          aria-label="Back to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Legal Modal */}
      {legalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-2xl font-bold text-gray-900">{legalContent[legalModal].title}</h3>
              <button
                onClick={() => setLegalModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-4">
              {legalContent[legalModal].content.map((paragraph, idx) => (
                <p key={idx} className="text-gray-600 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setLegalModal(null)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
