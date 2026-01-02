import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageCircle,
  Headphones,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronDown,
  Cookie,
  Gift,
  Candy,
  CakeSlice,
  Heart,
  Cherry,
  Star,
} from "lucide-react";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "general",
    message: "",
    priority: "medium",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeOffice, setActiveOffice] = useState(0);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [faqSlideIndex, setFaqSlideIndex] = useState(0);

  // Professional contact methods with color palette
  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "We'll respond with a sweet reply",
      contact: "contact@tastyaana.com",
      action: "mailto:contact@tastyaana.com",
      color: "bg-[#8B322C]",
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "Sweet conversations await",
      contact: "+91 9203338229",
      action: "tel:+91 9203338229",
      color: "bg-[#D1563E]",
    },
    // {
    //   icon: MessageCircle,
    //   title: "Live Chat",
    //   description: "Instant support",
    //   contact: "Available 9AM-8PM Daily",
    //   action: "#",
    //   color: "bg-[#E6B65B]",
    // },
    // {
    //   icon: Headphones,
    //   title: "Support Center",
    //   description: "Solutions to your questions",
    //   contact: "www.nexisparkx.com",
    //   action: "",
    //   color: "bg-[#F7E4B0]",
    // },
  ];

  // Professional offices
  const offices = [
    {
      city: "Indore",
      address: "Sukhliya, Indore, India",
      phone: "+91 9203338229",
      email: "contact@tastyaana.com",
      hours: "Mon-Sat: 9AM-9PM IST",
      specialty: "Traditional Indian",
      icon: CakeSlice,
    },
    // {
    //   city: "Sugar Valley",
    //   address: "456 Jalebi Road, Mumbai, India",
    //   phone: "+91 98765 12345",
    //   email: "mumbai@sweetbliss.com",
    //   hours: "Mon-Sun: 8AM-10PM IST",
    //   specialty: "Festival Specialties",
    //   icon: Gift,
    // },
    // {
    //   city: "Dessert Oasis",
    //   address: "789 Rasgulla Street, Kolkata, India",
    //   phone: "+91 98765 67890",
    //   email: "kolkata@sweetbliss.com",
    //   hours: "Mon-Sat: 8AM-8PM IST",
    //   specialty: "Bengali Sweets",
    //   icon: Cookie,
    // },
  ];

  // Professional FAQs
  const faqs = [
    {
      question: "What makes your sweets special?",
      answer:
        "Our sweets are crafted with traditional recipes passed down through generations, using only the finest organic ingredients and pure ghee. Each piece is handcrafted with love and care to ensure authentic taste and texture.",
      icon: Heart,
    },
    {
      question: "Do you offer delivery services?",
      answer:
        "Yes! We deliver our sweet delights across India. Same-day delivery is available in select cities, and nationwide delivery takes 1-3 business days. All sweets are carefully packaged to maintain freshness during transit.",
      icon: Gift,
    },
    {
      question: "Are your sweets suitable for dietary restrictions?",
      answer:
        "We offer a variety of options including sugar-free sweets, vegan alternatives, and gluten-free selections. All ingredients are clearly labeled, and our staff is happy to help with specific dietary requirements.",
      icon: Candy,
    },
    {
      question: "How long do your sweets stay fresh?",
      answer:
        "Most of our sweets stay fresh for 3-5 days at room temperature and up to 2 weeks when refrigerated. Dry sweets like Ladoos and Burfis have a longer shelf life of up to 3 weeks when stored properly in an airtight container.",
      icon: CakeSlice,
    },
    {
      question: "Do you cater for special events and weddings?",
      answer:
        "Absolutely! We specialize in creating stunning sweet arrangements for weddings, corporate events, and special occasions. Our catering team works closely with you to design custom sweet boxes and displays that match your event theme.",
      icon: Cherry,
    },
    {
      question: "What are your most popular sweets?",
      answer:
        "Our Kaju Katli, Gulab Jamun, and Motichoor Ladoo are perennial favorites! Seasonal specials like Mango Barfi in summer and Gajar Ka Halwa in winter are also extremely popular. We recommend trying our Signature Sweet Box for a delightful sampling.",
      icon: Star,
    },
  ];

  const itemsPerPage = 3;
  const totalPages = Math.ceil(faqs.length / itemsPerPage);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "general",
        message: "",
        priority: "medium",
      });
    }, 3000);
  };

  const toggleFaq = (index) => {
    setActiveFaqIndex(activeFaqIndex === index ? null : index);
  };

  const nextFaqSlide = () => {
    setFaqSlideIndex((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  const prevFaqSlide = () => {
    setFaqSlideIndex((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const visibleFaqs = faqs.slice(
    faqSlideIndex * itemsPerPage,
    faqSlideIndex * itemsPerPage + itemsPerPage
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Professional Hero Section */}
      <div className="bg-gradient-to-r from-[#8B322C] to-[#D1563E] text-white py-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Get in Touch with Tastyaana
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            We're here to help with all your needs and questions
          </p>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="py-16 bg-[#FAF5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#8B322C] mb-4">
              How Can We Help You?
            </h2>
            <p className="text-xl text-[#8B322C]/80">
              Choose your preferred way to connect with us
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <a
                  key={index}
                  href={method.action}
                  className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:scale-105"
                >
                  <div
                    className={`w-16 h-16 ${method.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#8B322C] mb-2">
                    {method.title}
                  </h3>
                  <p className="text-[#8B322C]/70 mb-2">{method.description}</p>
                  <p className="text-[#D1563E] font-medium">{method.contact}</p>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Professional Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-[#8B322C] mb-6 flex items-center">
              <Cookie className="w-6 h-6 mr-2 text-[#D1563E]" />
              Send us a Message
            </h2>

            {isSubmitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-600 mb-2">
                  Message Sent Successfully!
                </h3>
                <p className="text-[#8B322C]/70">
                  Thank you for reaching out. We'll get back to you soon!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8B322C] mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D1563E] focus:border-transparent bg-white"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B322C] mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D1563E] focus:border-transparent bg-white"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8B322C] mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D1563E] focus:border-transparent bg-white"
                    placeholder="What would you like to talk about?"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8B322C] mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D1563E] focus:border-transparent bg-white"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="order">Order Status</option>
                      <option value="product">Product Information</option>
                      <option value="catering">Catering Services</option>
                      <option value="feedback">Feedback & Suggestions</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B322C] mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D1563E] focus:border-transparent bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8B322C] mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D1563E] focus:border-transparent bg-white"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#8B322C] to-[#D1563E] text-white py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 hover:scale-105"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Office Locations */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-[#8B322C] mb-6 flex items-center">
                <Candy className="w-6 h-6 mr-2 text-[#E6B65B]" />
                Our Locations
              </h2>

              <div className="space-y-4 mb-6">
                {offices.map((office, index) => {
                  const Icon = office.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => setActiveOffice(index)}
                      className={`w-full text-left p-4 rounded-xl transition-all hover:scale-105 ${
                        activeOffice === index
                          ? "bg-[#F7E4B0] border-2 border-[#E6B65B]"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon
                          className={`w-5 h-5 mr-2 ${
                            activeOffice === index
                              ? "text-[#D1563E]"
                              : "text-[#8B322C]"
                          }`}
                        />
                        <h3
                          className={`font-semibold ${
                            activeOffice === index
                              ? "text-[#8B322C]"
                              : "text-[#8B322C]"
                          }`}
                        >
                          {office.city}
                        </h3>
                      </div>
                      <p className="text-[#8B322C]/70 text-sm mt-1">
                        {office.address}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="bg-[#FAF5E5] p-6 rounded-xl border border-[#F7E4B0]">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#8B322C] to-[#D1563E] rounded-full flex items-center justify-center mr-3 shadow-md">
                    <span className="text-white text-sm font-bold">Office</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#8B322C]">
                      {offices[activeOffice].city}
                    </h3>
                    <p className="text-sm text-[#D1563E]">
                      {offices[activeOffice].specialty}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-[#D1563E]" />
                    <span className="text-[#8B322C]">
                      {offices[activeOffice].address}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-[#D1563E]" />
                    <span className="text-[#8B322C]">
                      {offices[activeOffice].phone}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-[#D1563E]" />
                    <span className="text-[#8B322C]">
                      {offices[activeOffice].email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-[#D1563E]" />
                    <span className="text-[#8B322C]">
                      {offices[activeOffice].hours}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-[#8B322C] mb-6 flex items-center">
                <Heart className="w-6 h-6 mr-2 text-[#D1563E]" />
                Follow Us
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Facebook, name: "Facebook", color: "bg-[#8B322C]" },
                  { icon: Twitter, name: "Twitter", color: "bg-[#D1563E]" },
                  { icon: Instagram, name: "Instagram", color: "bg-[#E6B65B]" },
                  {
                    icon: Linkedin,
                    name: "LinkedIn",
                    color: "bg-[#F7E4B0] text-[#8B322C]",
                  },
                ].map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href="#"
                      className={`${social.color} ${
                        social.color.includes("text-") ? "" : "text-white"
                      } p-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-3 justify-center hover:scale-105 hover:-translate-y-1`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{social.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-[#FAF5E5] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#8B322C] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-[#8B322C]/80">
              Everything you need to know about our services
            </p>
          </div>

          <div className="relative">
            <div className="mb-12">
              <div className="grid gap-6">
                {visibleFaqs.map((faq, index) => {
                  const actualIndex = faqSlideIndex * itemsPerPage + index;
                  const Icon = faq.icon;
                  return (
                    <div
                      key={actualIndex}
                      className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                    >
                      <div
                        onClick={() => toggleFaq(actualIndex)}
                        className="flex justify-between items-center cursor-pointer"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#8B322C] to-[#D1563E] flex items-center justify-center mr-3 shadow">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="font-semibold text-[#8B322C] text-lg pr-8">
                            {faq.question}
                          </h3>
                        </div>
                        <div
                          className={`transition-transform duration-300 ${
                            activeFaqIndex === actualIndex ? "rotate-180" : ""
                          }`}
                        >
                          <ChevronDown className="w-5 h-5 text-[#D1563E]" />
                        </div>
                      </div>

                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          activeFaqIndex === actualIndex
                            ? "max-h-96 opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="mt-4 text-[#8B322C]/70 pl-14 pr-4">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FAQ Slider Controls */}
            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={prevFaqSlide}
                className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-[#E6B65B] text-[#D1563E] hover:bg-[#F7E4B0] transition-colors hover:scale-110"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <div className="flex space-x-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFaqSlideIndex(i)}
                    className={`w-3 h-3 rounded-full transition-all hover:scale-125 ${
                      i === faqSlideIndex
                        ? "bg-gradient-to-r from-[#8B322C] to-[#D1563E] scale-125"
                        : "bg-[#E6B65B]"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextFaqSlide}
                className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-[#E6B65B] text-[#D1563E] hover:bg-[#F7E4B0] transition-colors hover:scale-110"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Order Hotline */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12">
        <div className="bg-gradient-to-r from-[#F7E4B0] to-[#E6B65B] rounded-2xl p-8 border border-[#E6B65B] shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-14 h-14 bg-gradient-to-r from-[#8B322C] to-[#D1563E] rounded-full flex items-center justify-center mr-4 shadow-lg">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-[#8B322C] mb-1">
                  Order Hotline
                </h3>
                <p className="text-[#8B322C]/80">
                  For urgent orders and special requests
                </p>
              </div>
            </div>

            <a
              href="tel:+919203338229"
              className="bg-gradient-to-r from-[#8B322C] to-[#D1563E] text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 shadow-md hover:shadow-lg transition-all hover:scale-105"
            >
              <Phone className="w-5 h-5" />
              <span>+91 9203338229</span>
            </a>
          </div>
        </div>
      </div>

      {/* Professional Satisfaction Guarantee */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block p-3 bg-[#F7E4B0] rounded-2xl mb-4">
              <Heart className="w-8 h-8 text-[#D1563E]" />
            </div>
            <h2 className="text-3xl font-bold text-[#8B322C] mb-4">
              Our Quality Guarantee
            </h2>
            <p className="text-xl text-[#8B322C]/80 max-w-3xl mx-auto">
              Your satisfaction is our priority. We guarantee quality in every
              sweet we deliver.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle,
                title: "Premium Quality",
                description:
                  "We use only the finest ingredients to create authentic traditional sweets",
              },
              {
                icon: Gift,
                title: "Freshly Made",
                description:
                  "Our sweets are freshly prepared daily for the perfect taste and texture",
              },
              {
                icon: Star,
                title: "Customer Satisfaction",
                description:
                  "Your happiness is our priority - we guarantee it with every order",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-[#FAF5E5] p-6 rounded-xl text-center border border-[#F7E4B0] hover:scale-105 transition-transform"
                >
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md border-2 border-[#E6B65B]">
                    <Icon className="w-7 h-7 text-[#D1563E]" />
                  </div>
                  <h3 className="font-semibold text-[#8B322C] text-xl mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[#8B322C]/70">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Professional Footer */}
      <div className="bg-[#FAF5E5] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#8B322C] mb-2">
              Tastyaana
            </h2>
            <p className="text-[#8B322C]/70">One Stop Solution</p>
          </div>

          <div className="flex justify-center space-x-6 mb-8">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
              <a
                key={index}
                href="#"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:shadow-lg border border-[#E6B65B] hover:-translate-y-1 transition-all"
              >
                <Icon className="w-5 h-5 text-[#D1563E]" />
              </a>
            ))}
          </div>

          <div className="border-t border-[#E6B65B] pt-8 text-center text-[#8B322C]/70 text-sm">
            <p>© {new Date().getFullYear()} Tastyaana. All rights reserved.</p>
            <p className="mt-2">Spreading sweetness across India</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
