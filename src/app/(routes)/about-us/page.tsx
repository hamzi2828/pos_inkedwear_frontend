"use client";

import React from "react";
import Link from "next/link";
import '@fortawesome/fontawesome-free/css/all.css';

const AboutUsPage = () => {
  return (
    <main className="pt-24">
      <section className="bg-white sm:px-6 lg:px-20 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            {/* Navigation Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <nav className="bg-white rounded-lg shadow-sm overflow-hidden lg:sticky lg:top-8">
                <Link href="/about-us" className="privacy-faq-nav-tab w-full px-6 py-4 text-left font-medium text-sm border-b border-gray-100 privacy-faq-nav-active block">
                  <i className="fas fa-info-circle mr-2"></i>
                  ABOUT US
                </Link>
                <Link href="/" className="privacy-faq-nav-tab w-full px-6 py-4 text-left font-medium text-sm border-b border-gray-100 privacy-faq-nav-inactive block">
                  <i className="fas fa-question-circle mr-2"></i>
                  FAQS
                </Link>
                <Link href="/" className="privacy-faq-nav-tab w-full px-6 py-4 text-left font-medium text-sm privacy-faq-nav-inactive block">
                  <i className="fas fa-envelope mr-2"></i>
                  CONTACT US
                </Link>
              </nav>
            </aside>

            {/* Main Content */}
            <section className="flex-1">
              <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8 lg:pt-0">
                <header className="mb-8">
                  <h1 className="privacy-faq-title text-2xl lg:text-3xl mb-4">
                    ABOUT INKED WEAR
                  </h1>
                  <p className="privacy-faq-subtitle">
                    Your trusted partner for premium custom printed apparel.
                  </p>
                </header>

                <div className="space-y-8">
                  {/* Our Story */}
                  <article>
                    <h2 className="privacy-faq-title text-xl lg:text-2xl mb-4">
                      OUR STORY
                    </h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      Inked Wear was founded with a simple mission: to provide exceptional
                      custom printed apparel with integrity and dedication. What started as a
                      passion for fashion has grown into a trusted name in the apparel industry.
                    </p>
                    <p className="text-gray-600 leading-relaxed">
                      We believe in building lasting relationships with our customers by
                      delivering quality products and excellent service every time.
                    </p>
                  </article>

                  {/* Our Values */}
                  <article>
                    <h2 className="privacy-faq-title text-xl lg:text-2xl mb-4">
                      OUR VALUES
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#dc2626] rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-handshake text-white text-xl"></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Integrity</h3>
                          <p className="text-gray-600 text-sm">
                            We operate with honesty and transparency in everything we do.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#dc2626] rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-star text-white text-xl"></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Quality</h3>
                          <p className="text-gray-600 text-sm">
                            We never compromise on the quality of our services.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#dc2626] rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-users text-white text-xl"></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Family</h3>
                          <p className="text-gray-600 text-sm">
                            We treat every customer like family.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#dc2626] rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-tools text-white text-xl"></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Expertise</h3>
                          <p className="text-gray-600 text-sm">
                            Our team brings years of automotive experience.
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Contact CTA */}
                  <article className="bg-gray-50 rounded-lg p-6 text-center">
                    <h2 className="privacy-faq-title text-xl mb-4">
                      GET IN TOUCH
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Have questions or want to learn more about our services?
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <i className="fas fa-envelope"></i>
                      Contact Us
                    </Link>
                  </article>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutUsPage;
