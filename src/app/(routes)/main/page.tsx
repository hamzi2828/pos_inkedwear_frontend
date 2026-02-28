"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FiTool,
  FiSettings,
  FiCheckCircle,
  FiTruck,
  FiShield,
  FiClock,
  FiCheck,
  FiArrowRight,
  FiPhone,
  FiMapPin,
  FiStar,
  FiChevronDown,
  FiChevronUp,
  FiAward,
  FiUsers,
  FiThumbsUp,
} from "react-icons/fi";
import { FaTshirt, FaPalette, FaPrint, FaBoxOpen, FaRuler } from "react-icons/fa";

export default function MainPage() {
  const [activeService, setActiveService] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Animated counter hook
  const useCounter = (end: number, duration: number = 2000) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (!isVisible) return;
      let startTime: number;
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, [isVisible, end, duration]);

    return { count, setIsVisible };
  };

  const stats = [
    { value: 15, suffix: "+", label: "Years Experience", counter: useCounter(15) },
    { value: 10000, suffix: "+", label: "Orders Fulfilled", counter: useCounter(10000) },
    { value: 98, suffix: "%", label: "Customer Satisfaction", counter: useCounter(98) },
    { value: 24, suffix: "/7", label: "Customer Support", counter: useCounter(24) },
  ];

  const services = [
    {
      icon: <FaTshirt className="w-7 h-7" />,
      title: "Custom T-Shirts",
      description:
        "Premium quality custom printed t-shirts for any occasion. We use high-quality fabrics and inks for lasting prints.",
      highlights: ["Screen Printing", "DTG Printing", "Various Colors"],
    },
    {
      icon: <FaPalette className="w-7 h-7" />,
      title: "Design Services",
      description:
        "Professional design services to bring your ideas to life. Our designers create stunning artwork for your apparel.",
      highlights: ["Custom Artwork", "Logo Design", "Brand Identity"],
    },
    {
      icon: <FiSettings className="w-7 h-7" />,
      title: "Embroidery",
      description:
        "High-quality embroidery services for a premium look. Perfect for corporate wear, uniforms, and branded merchandise.",
      highlights: ["Logo Embroidery", "Name Personalization", "Premium Threads"],
    },
    {
      icon: <FaPrint className="w-7 h-7" />,
      title: "Screen Printing",
      description:
        "Traditional screen printing for bulk orders. Vibrant colors and durable prints that last wash after wash.",
      highlights: ["Bulk Orders", "Multi-Color Prints", "Fast Turnaround"],
    },
    {
      icon: <FiTruck className="w-7 h-7" />,
      title: "Bulk Orders",
      description:
        "Competitive pricing for large quantity orders. Perfect for events, teams, and corporate needs.",
      highlights: ["Volume Discounts", "Quick Delivery", "Quality Assurance"],
    },
    {
      icon: <FaBoxOpen className="w-7 h-7" />,
      title: "Merchandise",
      description:
        "Complete merchandise solutions including caps, bags, and promotional items. Everything your brand needs.",
      highlights: ["Caps & Hats", "Bags & Totes", "Promotional Items"],
    },
  ];

  const testimonials = [
    {
      name: "Ahmed Hassan",
      role: "Business Owner",
      content:
        "Inked Wear has been printing our company shirts for 5 years. Always professional, and the quality is exceptional. Highly recommend!",
      rating: 5,
      image: "AH",
    },
    {
      name: "Sarah Williams",
      role: "Event Organizer",
      content:
        "Finally found a printing company I can trust! They delivered 500 shirts on time with perfect quality. Excellent service!",
      rating: 5,
      image: "SW",
    },
    {
      name: "Mohammed Ali",
      role: "Sports Team Manager",
      content:
        "Quick turnaround, quality prints, and they keep me informed throughout. The best apparel printing in town!",
      rating: 5,
      image: "MA",
    },
  ];

  const faqs = [
    {
      question: "What are your working hours?",
      answer:
        "We're open Monday to Saturday from 9:00 AM to 6:00 PM. You can also place orders online 24/7 through our website.",
    },
    {
      question: "What printing methods do you offer?",
      answer:
        "We offer screen printing, DTG (Direct to Garment) printing, embroidery, and heat transfer. Each method has its advantages depending on your design and quantity.",
    },
    {
      question: "How long does a typical order take?",
      answer:
        "Standard orders take 5-7 business days. Rush orders can be completed in 2-3 days for an additional fee. Bulk orders may take longer.",
    },
    {
      question: "What is the minimum order quantity?",
      answer:
        "For screen printing, minimum order is 12 pieces. DTG printing has no minimum. Embroidery minimum is 6 pieces.",
    },
    {
      question: "Do you offer design services?",
      answer:
        "Yes! Our in-house designers can help create custom artwork, logos, and designs. Design consultations are free for orders over Rs 10,000.",
    },
  ];

  // Intersection Observer for stats animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            stats.forEach((stat) => stat.counter.setIsVisible(true));
          }
        });
      },
      { threshold: 0.3 }
    );

    const statsSection = document.getElementById("stats-section");
    if (statsSection) observer.observe(statsSection);

    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#dc2626]/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#dc2626]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#dc2626]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-full mb-8">
              <FiAward className="text-[#dc2626]" />
              <span className="text-[#dc2626] text-sm font-medium">
                Premium Custom Apparel Since 2009
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Your Brand Deserves{" "}
              <span className="text-[#dc2626] relative">
                Premium Quality
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                >
                  <path
                    d="M2 10C50 4 150 4 298 10"
                    stroke="#dc2626"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <br />
              at Inked Wear
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Premium custom printed apparel and merchandise you can trust.
              From t-shirts to hoodies, we bring your designs to life.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/"
                className="group px-8 py-4 bg-[#dc2626] text-white font-semibold rounded-xl hover:bg-[#b91c1c] transition-all duration-300 text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#dc2626]/20"
              >
                Shop Now
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="tel:+1234567890"
                className="group px-8 py-4 bg-gray-100 text-gray-900 font-semibold rounded-xl border border-gray-200 hover:bg-gray-200 transition-all duration-300 text-lg flex items-center justify-center gap-2"
              >
                <FiPhone className="w-5 h-5" />
                Call Now
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-gray-600">
              <div className="flex items-center gap-2">
                <FiShield className="text-[#dc2626]" />
                <span className="text-sm">Premium Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-[#dc2626]" />
                <span className="text-sm">Satisfaction Guaranteed</span>
              </div>
              <div className="flex items-center gap-2">
                <FiClock className="text-[#dc2626]" />
                <span className="text-sm">Quick Turnaround</span>
              </div>
            </div>
          </div>

          {/* Workshop Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative mx-auto max-w-5xl">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xl shadow-gray-200/50">
                {/* Mock Browser Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 bg-gray-100 rounded-md text-gray-500 text-xs">
                      inkedwear.com
                    </div>
                  </div>
                </div>
                {/* Service Preview Content */}
                <div className="p-6 grid grid-cols-4 gap-4 bg-gray-50">
                  {/* Stats Row */}
                  <div className="col-span-4 grid grid-cols-4 gap-4">
                    {[
                      { label: "Orders Today", value: "12", icon: <FaTshirt /> },
                      { label: "In Progress", value: "5", icon: <FiTool /> },
                      { label: "Completed", value: "7", icon: <FiCheckCircle /> },
                      { label: "Waiting", value: "3", icon: <FiClock /> },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                      >
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                          <span className="text-[#dc2626]">{stat.icon}</span>
                          {stat.label}
                        </div>
                        <p className="text-gray-900 text-xl font-bold">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Services Grid */}
                  <div className="col-span-3 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-gray-500 text-xs mb-3">Popular Products</p>
                    <div className="grid grid-cols-3 gap-2">
                      {["T-Shirts", "Hoodies", "Caps", "Polos", "Jackets", "Bags"].map((service, i) => (
                        <div
                          key={i}
                          className="py-2 px-3 bg-gray-50 rounded text-gray-700 text-xs text-center border border-gray-100"
                        >
                          {service}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Quick Booking */}
                  <div className="col-span-1 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-gray-500 text-xs mb-3">Quick Actions</p>
                    {["New Order", "Get Quote", "Track Order"].map((action, i) => (
                      <div
                        key={i}
                        className="py-2 px-3 bg-[#dc2626]/10 rounded mb-2 text-[#dc2626] text-xs border border-[#dc2626]/20 font-medium"
                      >
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats-section" className="py-20 px-4 border-y border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#dc2626] mb-2">
                {stat.value % 1 !== 0
                  ? stat.counter.count.toFixed(1)
                  : stat.counter.count.toLocaleString()}
                {stat.suffix}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Our <span className="text-[#dc2626]">Services</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Premium custom printing and apparel services to bring your
              brand to life.
            </p>
          </div>

          {/* Service Tabs */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Service List */}
            <div className="space-y-4">
              {services.map((service, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                    activeService === index
                      ? "bg-white border-2 border-[#dc2626]/30 shadow-lg"
                      : "bg-white border border-gray-200 hover:border-gray-300 shadow-sm"
                  }`}
                  onClick={() => setActiveService(index)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        activeService === index
                          ? "bg-[#dc2626] text-white"
                          : "bg-gray-100 text-[#dc2626]"
                      }`}
                    >
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {service.title}
                      </h3>
                      {activeService === index && (
                        <div className="animate-fadeIn">
                          <p className="text-gray-600 mb-4">{service.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {service.highlights.map((highlight, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-[#dc2626]/10 text-[#dc2626] text-sm rounded-full"
                              >
                                {highlight}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Service Visual */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-[#dc2626]/5 rounded-3xl blur-3xl" />
                <div className="relative bg-white rounded-2xl border border-gray-200 p-8 shadow-xl">
                  <div
                    className={`p-4 rounded-xl bg-[#dc2626]/10 text-[#dc2626] inline-block mb-6`}
                  >
                    {services[activeService].icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {services[activeService].title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {services[activeService].description}
                  </p>
                  <ul className="space-y-3">
                    {services[activeService].highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-700">
                        <FiCheck className="text-[#dc2626] flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-[#dc2626]">Inked Wear</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Expert Designers",
                description:
                  "Our skilled designers bring years of experience and creativity to every project.",
                icon: <FiUsers className="w-6 h-6" />,
              },
              {
                step: "2",
                title: "Premium Quality",
                description:
                  "We use only premium fabrics and high-quality inks for prints that last.",
                icon: <FiShield className="w-6 h-6" />,
              },
              {
                step: "3",
                title: "Fair Pricing",
                description:
                  "Transparent pricing with no hidden fees. We provide detailed quotes before production begins.",
                icon: <FiThumbsUp className="w-6 h-6" />,
              },
            ].map((item, index) => (
              <div key={index} className="relative text-center group">
                {/* Connector Line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#dc2626]/30 to-transparent" />
                )}
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-[#dc2626] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#dc2626]/20">
                    <span className="text-3xl font-bold">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              What Our <span className="text-[#dc2626]">Customers</span> Say
            </h2>
            <p className="text-gray-600 text-lg">
              Don&apos;t just take our word for it
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-[#dc2626]/30 transition-colors duration-300 shadow-sm hover:shadow-lg"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar
                      key={i}
                      className="w-5 h-5 text-[#dc2626] fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#dc2626] rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.image}
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{testimonial.name}</p>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked <span className="text-[#dc2626]">Questions</span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
              >
                <button
                  className="w-full px-6 py-4 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="text-gray-900 font-medium">{faq.question}</span>
                  {openFaq === index ? (
                    <FiChevronUp className="text-[#dc2626] flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 bg-white">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Contact CTA */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-br from-[#dc2626] to-[#b91c1c] rounded-3xl relative overflow-hidden shadow-2xl">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Ready to Create Your Custom Apparel?
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
                Contact us today or place an order online. Our expert team is ready
                to bring your designs to life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/"
                  className="group px-8 py-4 bg-white text-[#dc2626] font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 text-lg flex items-center justify-center gap-2"
                >
                  Get a Quote
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="tel:+1234567890"
                  className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 text-lg flex items-center justify-center gap-2"
                >
                  <FiPhone className="w-5 h-5" />
                  (123) 456-7890
                </a>
              </div>
              <div className="flex items-center justify-center gap-2 text-white/90">
                <FiMapPin />
                <span>123 Fashion Street, Style City, ST 12345</span>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
