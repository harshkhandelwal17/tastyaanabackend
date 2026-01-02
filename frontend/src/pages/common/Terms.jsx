import React from 'react';
import { Shield, FileText, Users, Clock, AlertTriangle, CheckCircle, Globe, Lock, Truck, Package, CreditCard, UserCheck, Ban, Scale } from 'lucide-react';

export default function TermsOfServicePage() {
  const lastUpdated = "January 1, 2025";

  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: <CheckCircle className="w-5 h-5 text-orange-500" />,
      content: `By accessing or using Tastyaana, you agree to comply with and be bound by these Terms, our Privacy Policy, and any other policies we may publish. If you do not agree, please stop using our Platform.`
    },
    {
      id: 'eligibility',
      title: 'Eligibility',
      icon: <UserCheck className="w-5 h-5 text-orange-500" />,
      content: [
        'You must be the age of majority in your jurisdiction to use Tastyaana.',
        'By creating an account, you confirm that the information you provide is accurate and up to date.'
      ]
    },
    {
      id: 'services',
      title: 'Services',
      icon: <Truck className="w-5 h-5 text-orange-500" />,
      content: {
        intro: 'Tastyaana provides:',
        services: [
          'Delivery of food, groceries, daily essentials, medicines, household goods, gifts, and other permissible products.',
          'Pick-up and drop-off of items between users or locations.',
          'Subscription plans, slot-based delivery, and scheduled deliveries.'
        ],
        warning: '⚠️ Certain products (alcohol, tobacco, illegal substances, hazardous materials, etc.) are strictly prohibited under law and cannot be delivered via Tastyaana. Tastyaana reserves the right to refuse or cancel such orders.'
      }
    },
    {
      id: 'accounts',
      title: 'User Accounts',
      icon: <Users className="w-5 h-5 text-orange-500" />,
      content: [
        'You are responsible for maintaining your account login details.',
        'You agree to immediately inform us of any unauthorized use of your account.',
        'Tastyaana reserves the right to suspend or terminate accounts that violate these Terms.'
      ]
    },
    {
      id: 'orders',
      title: 'Orders and Deliveries',
      icon: <Package className="w-5 h-5 text-orange-500" />,
      content: [
        'All orders are subject to availability and confirmation by the merchant/service provider.',
        'Delivery times are estimates and may vary due to traffic, weather, or other factors.',
        'You must be available to receive deliveries at the specified address and time.',
        'Tastyaana is not responsible for delays caused by factors beyond our control.'
      ]
    },
    {
      id: 'payments',
      title: 'Payments and Pricing',
      icon: <CreditCard className="w-5 h-5 text-orange-500" />,
      content: [
        'All prices displayed are inclusive of applicable taxes unless stated otherwise.',
        'Payment must be completed at the time of placing the order.',
        'We accept various payment methods including cards, digital wallets, and cash on delivery (where available).',
        'Refunds will be processed according to our Refund Policy.'
      ]
    },
    {
      id: 'prohibited',
      title: 'Prohibited Items and Activities',
      icon: <Ban className="w-5 h-5 text-red-500" />,
      content: {
        intro: 'The following items cannot be ordered or delivered through Tastyaana:',
        items: [
          'Illegal drugs, narcotics, or controlled substances.',
          'Weapons, firearms, ammunition, or explosive materials.',
          'Counterfeit, stolen, or restricted goods.',
          'Items prohibited under applicable laws.'
        ],
        consequence: 'If such an order is placed, Tastyaana reserves the right to cancel the order immediately and may suspend or terminate your account.'
      }
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      icon: <Scale className="w-5 h-5 text-yellow-500" />,
      content: [
        'Tastyaana acts as an intermediary between users and service providers.',
        'We are not liable for the quality, safety, or legality of products delivered.',
        'Our liability is limited to the amount paid for the specific transaction.',
        'We are not responsible for indirect, incidental, or consequential damages.'
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy and Data Protection',
      icon: <Lock className="w-5 h-5 text-orange-500" />,
      content: [
        'We collect and process your personal data in accordance with our Privacy Policy.',
        'Your data is used to provide and improve our services.',
        'We implement appropriate security measures to protect your information.',
        'You have rights regarding your personal data as outlined in our Privacy Policy.'
      ]
    },
    {
      id: 'modifications',
      title: 'Modifications to Terms',
      icon: <Clock className="w-5 h-5 text-orange-500" />,
      content: [
        'Tastyaana reserves the right to modify these Terms at any time.',
        'We will notify users of significant changes via email or in-app notifications.',
        'Continued use of our services after modifications constitutes acceptance of the updated Terms.',
        'If you do not agree to the modified Terms, you should stop using our services.'
      ]
    },
    {
      id: 'contact',
      title: 'Contact Information',
      icon: <FileText className="w-5 h-5 text-orange-500" />,
      content: [
        'For questions about these Terms, contact us at: legal@tastyaana.com',
        'For general support: support@tastyaana.com',
        'Phone: +91 9203338229',
        'Business hours: 24/7 for emergency support, 9 AM - 9 PM for general inquiries'
      ]
    }
  ];

  const keyPoints = [
    // "Must be 18+ years old to create an account",
    "Provide accurate and up-to-date information",
    "Prohibited items cannot be ordered or delivered",
    "Payment required at time of order placement",
    "Delivery times are estimates, not guarantees",
    "Account security is your responsibility",
    "We reserve the right to refuse or cancel orders",
    "Terms may be updated with prior notification"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                Terms of Service
              </h1>
            </div>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Welcome to Tastyaana - Your trusted delivery partner for food, groceries, essentials, and more
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 sticky top-4 md:top-8">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Table of Contents</h3>
              <nav className="space-y-2">
                {sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center text-xs md:text-sm text-gray-600 hover:text-orange-600 transition-colors duration-200 p-2 rounded-lg hover:bg-orange-50"
                  >
                    {section.icon}
                    <span className="ml-2">{index + 1}. {section.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Introduction */}
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                  Welcome to Tastyaana
                </h2>
                <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto">
                  These Terms of Service govern your use of Tastyaana's platform and services. 
                  Please read them carefully as they contain important information about your rights and obligations.
                </p>
              </div>

              {/* Key Points */}
              <div className="bg-orange-50 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Key Points to Remember</h3>
                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                  {keyPoints.map((point, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-xs md:text-sm text-gray-700">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Terms Sections */}
            {sections.map((section, index) => (
              <div
                key={section.id}
                id={section.id}
                className="bg-white rounded-xl shadow-sm p-4 md:p-8 scroll-mt-20 md:scroll-mt-24"
              >
                <div className="flex items-center mb-4 md:mb-6">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3 md:mr-4">
                    {section.icon}
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">
                      {index + 1}. {section.title}
                    </h2>
                  </div>
                </div>
                <div className="prose prose-gray max-w-none">
                  {typeof section.content === 'string' ? (
                    <p className="text-gray-700 leading-relaxed text-base">
                      {section.content}
                    </p>
                  ) : Array.isArray(section.content) ? (
                    <div className="space-y-3">
                      {section.content.map((item, idx) => (
                        <div key={idx} className="flex items-start">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-gray-700 leading-relaxed text-base">{item}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {section.content.intro && (
                        <p className="text-gray-700 leading-relaxed text-base font-medium">
                          {section.content.intro}
                        </p>
                      )}
                      {section.content.services && (
                        <div className="space-y-3">
                          {section.content.services.map((service, idx) => (
                            <div key={idx} className="flex items-start">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <p className="text-gray-700 leading-relaxed text-base">{service}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {section.content.items && (
                        <div className="space-y-3">
                          {section.content.items.map((item, idx) => (
                            <div key={idx} className="flex items-start">
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <p className="text-gray-700 leading-relaxed text-base">{item}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {section.content.warning && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                          <p className="text-yellow-800 leading-relaxed text-base font-medium">
                            {section.content.warning}
                          </p>
                        </div>
                      )}
                      {section.content.consequence && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                          <p className="text-red-800 leading-relaxed text-base font-medium">
                            {section.content.consequence}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-sm p-4 md:p-8 text-white">
              <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold mb-4">Questions About These Terms?</h2>
                <p className="text-sm md:text-base text-orange-100 mb-4 md:mb-6 max-w-2xl mx-auto">
                  If you have any questions about these Terms of Service or need clarification 
                  on any point, please don't hesitate to contact our legal team.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
                  <a
                    href="mailto:contact@tastyaana.com"
                    className="bg-white text-orange-600 px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-orange-50 transition-colors duration-200"
                  >
                    contact@tastyaana.com
                  </a>
                  <a
                    href="tel:+919203338229"
                    className="border border-white text-white px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-white hover:text-orange-600 transition-colors duration-200">
                  
                    +91 9203338229
                  </a>
                </div>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="bg-gray-50 rounded-xl p-4 md:p-6">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1 mr-3 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="text-sm md:text-base font-semibold mb-2">Important Legal Notice</p>
                  <p className="text-xs md:text-sm">
                    These terms constitute a legally binding agreement between you and Tastyaana. 
                    By using our platform, you acknowledge that you have read and understood these terms. 
                    If you do not agree with any part of these terms, you must discontinue use of our services immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 md:py-8 mt-8 md:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs md:text-sm text-gray-400">
              � 2025 Tastyaana. All rights reserved. | 
              <a href="#privacy" className="text-orange-400 hover:text-orange-300 ml-1">Privacy Policy</a> | 
              <a href="#terms" className="text-orange-400 hover:text-orange-300 ml-1">Terms of Service</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}