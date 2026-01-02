import React, { useState } from 'react';
import { MessageCircle, Phone, Mail, Clock, Search, ChevronDown, ChevronRight, HelpCircle, Star, ArrowRight } from 'lucide-react';

const CustomerSupport = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const supportCategories = [
    { id: 'all', name: 'All Topics', color: 'bg-orange-100 text-orange-700' },
    { id: 'orders', name: 'Orders', color: 'bg-green-100 text-green-700' },
    { id: 'delivery', name: 'Delivery', color: 'bg-blue-100 text-blue-700' },
    { id: 'payment', name: 'Payment', color: 'bg-purple-100 text-purple-700' },
    { id: 'account', name: 'Account', color: 'bg-pink-100 text-pink-700' }
  ];

  const faqs = [
    {
      id: 1,
      category: 'orders',
      question: 'How can I track my order?',
      answer: 'You can track your order by logging into your account and visiting the "My Orders" section. You\'ll receive real-time updates on your order status and delivery progress.'
    },
    {
      id: 2,
      category: 'delivery',
      question: 'What are your delivery hours?',
      answer: 'We deliver from 8 AM to 11 PM, 7 days a week. '
    },
    {
      id: 3,
      category: 'payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards, UPI payments, net banking, and digital wallets. Cash on delivery is also available in select areas.'
    },
    {
      id: 4,
      category: 'orders',
      question: 'Can I modify or cancel my order?',
      answer: 'Orders can be modified or cancelled within 5 minutes of placing them. After that, please contact our support team immediately and we\'ll do our best to help.'
    },
    {
      id: 5,
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'Click on "Forgot Password" on the login page, enter your registered email address, and follow the instructions sent to your email to reset your password.'
    },
    {
      id: 6,
      category: 'delivery',
      question: 'What if my food arrives cold or incorrect?',
      answer: 'We\'re sorry for any inconvenience! Please contact us immediately through the app or our support channels. We\'ll provide a full refund or replacement depending on your preference.'
    }
  ];

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      detail: 'Available 24/7',
      action: 'Start Chat',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Call us for immediate help',
      detail: '+91 9203338229',
      action: 'Call Now',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us a detailed message',
      detail: 'contact@tastyaana.com',
      action: 'Send Email',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const searchFilteredFaqs = filteredFaqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            <span>We're here to help</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How can we assist you today?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Find answers quickly or get in touch with our support team for personalized help
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {/* Contact Methods */}
        <div className="flex flex-col md:flex-row gap-6 mb-16">
          {contactMethods.map((method, index) => (
            <div key={index} className="group cursor-pointer flex-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                <div className={`w-12 h-12 bg-gradient-to-r ${method.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <method.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-gray-600 mb-2">{method.description}</p>
                <p className="text-sm text-gray-500 mb-4">{method.detail}</p>
                <button className="inline-flex items-center space-x-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors">
                  <span>{method.action}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-sm border border-gray-100 mb-16">
          <div className="flex gap-2 md:gap-8 text-center">
            <div className="group flex-1 min-h-[120px] md:min-h-[140px] flex flex-col justify-center">
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-5 h-5 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">2 mins</h3>
              <p className="text-xs md:text-base text-gray-600 leading-tight">Average response time</p>
            </div>
            <div className="group flex-1  flex flex-col justify-center">
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                <Star className="w-5 h-5 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">4.9/5</h3>
              <p className="text-xs md:text-base text-gray-600 leading-tight">Customer satisfaction</p>
            </div>
            <div className="group flex-1 flex flex-col justify-center">
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-5 h-5 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">24/7</h3>
              <p className="text-xs md:text-base text-gray-600 leading-tight">Support </p>
              <p className="text-xs md:text-base text-gray-600 leading-tight">availability </p>

            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 pb-0">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h3>
            <p className="text-gray-600 mb-8">Find quick answers to common questions</p>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-3 mb-8">
              {supportCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? category.color + ' scale-105 shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Items */}
          <div className="px-8 pb-8">
            {searchFilteredFaqs.length > 0 ? (
              <div className="space-y-4">
                {searchFilteredFaqs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                      className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <span className="font-semibold text-gray-900">{faq.question}</span>
                      {openFaq === faq.id ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    {openFaq === faq.id && (
                      <div className="px-6 pb-4">
                        <div className="h-px bg-gradient-to-r from-orange-200 to-transparent mb-4"></div>
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No results found for "{searchQuery}"</p>
                <p className="text-gray-400 text-sm mt-2">Try a different search term or browse all categories</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Form */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5"></div>
            <div className="relative p-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Still need help?</h3>
              <p className="text-gray-600 mb-8">Send us a message and we'll get back to you within 2 hours</p>
              
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Order ID (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    placeholder="e.g., TA123456789"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors">
                    <option>Select a category</option>
                    <option>Order Issues</option>
                    <option>Delivery Problems</option>
                    <option>Payment Questions</option>
                    <option>Account Help</option>
                    <option>Restaurant Partnership</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <textarea
                    rows="5"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Describe your issue in detail..."
                  ></textarea>
                </div>
                
                <button
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h4 className="text-xl font-bold text-gray-900 mb-4">Order Status</h4>
            <p className="text-gray-600 mb-6">Track your current orders and view order history</p>
            <button className="inline-flex items-center space-x-2 bg-orange-100 text-orange-700 px-6 py-3 rounded-xl font-semibold hover:bg-orange-200 transition-colors">
              <span>Track Orders</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h4 className="text-xl font-bold text-gray-900 mb-4">Report an Issue</h4>
            <p className="text-gray-600 mb-6">Found a problem with your order or the app?</p>
            <button className="inline-flex items-center space-x-2 bg-red-100 text-red-700 px-6 py-3 rounded-xl font-semibold hover:bg-red-200 transition-colors">
              <span>Report Issue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default CustomerSupport;