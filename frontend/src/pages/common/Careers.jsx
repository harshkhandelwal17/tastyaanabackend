import React, { useState } from 'react';
import { ShoppingBag, MapPin, Clock, Users, Heart, Code, Briefcase, Truck, Headphones, BarChart3, Shield, Zap, Coffee, Gift, GraduationCap, Calendar, Search, Filter, ArrowRight, Star } from 'lucide-react';

export default function CareersPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const benefits = [
    // {
    //   icon: <Heart className="w-6 h-6 text-green-500" />,
    //   title: "Health & Wellness",
    //   description: "Comprehensive medical insurance plus wellness benefits because healthy teams build better products"
    // },
    {
      icon: <Coffee className="w-6 h-6 text-green-500" />,
      title: "Flexible Work Hours",
      description: "Work when you're most productive. WFH options available - just don't miss the team lunches!"
    },
    // {
    //   icon: <ShoppingBag className="w-6 h-6 text-green-500" />,
    //   title: "Free Tastyaana Credits",
    //   description: "₹5000 monthly marketplace credits because you should experience what you're building across all categories"
    // },
    // {
    //   icon: <GraduationCap className="w-6 h-6 text-green-500" />,
    //   title: "Learning Budget",
    //   description: "₹50,000 annual learning budget for courses, conferences, or that coding bootcamp you've been eyeing"
    // },
    {
      icon: <Calendar className="w-6 h-6 text-green-500" />,
      title: "Unlimited PTO",
      description: "Take time off when you need it. Just make sure your team knows - we're not mind readers!"
    },
    {
      icon: <Zap className="w-6 h-6 text-green-500" />,
      title: "Startup Freedom",
      description: "No red tape, no politics. Just smart people building cool things together"
    }
  ];

  const departments = [
    { id: 'all', name: 'All Departments', count: 20 },
    { id: 'engineering', name: 'Engineering', count: 6 },
    { id: 'product', name: 'Product', count: 3 },
    { id: 'design', name: 'Design', count: 2 },
    { id: 'marketing', name: 'Marketing', count: 3 },
    { id: 'operations', name: 'Operations', count: 4 },
    { id: 'customer-support', name: 'Customer Support', count: 2 }
  ];

  const jobs = [
    {
      id: 1,
      title: "Marketplace Builder (Full Stack Developer)",
      department: "engineering",
      location: "Indore, India",
      type: "Full-time",
      experience: "3-5 years",
      description: "Build the platform that connects customers with everything they need - from food and electronics to real estate and services. Every line of code impacts millions of daily transactions.",
      skills: ["React", "Node.js", "Python", "AWS", "MongoDB"],
      hook: "Love turning caffeine into code? This one's for you."
    },
    {
      id: 2,
      title: "Experience Architect (Product Manager - Marketplace)",
      department: "product",
      location: "Indore, India",
      type: "Full-time",
      experience: "4-6 years",
      description: "Shape the future of India's marketplace experience. From discovery to delivery across all categories - make every transaction seamless and delightful.",
      skills: ["Product Strategy", "Analytics", "User Research", "Marketplace Tech"],
      hook: "Think you know what makes marketplaces tick? Prove it."
    },
    {
      id: 3,
      title: "Digital Experience Designer (Senior UX Designer)",
      department: "design",
      location: "Indore, India",
      type: "Full-time",
      experience: "3-5 years",
      description: "Design intuitive experiences across food, electronics, real estate, and services. Make complex marketplace interactions feel simple and enjoyable.",
      skills: ["Figma", "User Research", "Marketplace UX", "Mobile Design"],
      hook: "Can you make shopping for anything as easy as ordering coffee?"
    },
    {
      id: 4,
      title: "Platform Infrastructure Wizard (DevOps Engineer)",
      department: "engineering",
      location: "Indore, India",
      type: "Full-time",
      experience: "2-4 years",
      description: "Keep our multi-category marketplace running at scale. Handle everything from food deliveries to electronics orders to property listings - all with 99.9% uptime.",
      skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Monitoring"],
      hook: "Love solving problems before they become problems?"
    },
    {
      id: 5,
      title: "Growth Catalyst (Growth Marketing Manager)",
      department: "marketing",
      location: "Indore, India",
      type: "Full-time",
      experience: "2-4 years",
      description: "Drive user acquisition and engagement across all our marketplace categories. From food lovers to tech enthusiasts to property seekers - understand and reach them all.",
      skills: ["Digital Marketing", "Multi-category Marketing", "A/B Testing", "SEO/SEM"],
      hook: "Can you make people discover products they didn't know they needed?"
    },
    {
      id: 6,
      title: "Operations Maestro (Marketplace Operations Manager)",
      department: "operations",
      location: "Indore, India",
      type: "Full-time",
      experience: "3-5 years",
      description: "Orchestrate operations across food delivery, electronics fulfillment, real estate listings, and service bookings. Master the art of multi-category logistics.",
      skills: ["Operations", "Logistics", "Data Analysis", "Partnership Management"],
      hook: "Love organizing chaos across multiple universes? This one's for you."
    },
    {
      id: 7,
      title: "Customer Happiness Specialist (Customer Success)",
      department: "customer-support",
      location: "Indore, India",
      type: "Full-time",
      experience: "1-3 years",
      description: "Support customers across all categories - whether they're ordering dinner, buying a laptop, or finding their dream home. Turn every interaction into a positive experience.",
      skills: ["Customer Service", "Problem Solving", "Communication", "Multi-category Support"],
      hook: "Think you can turn complaints into compliments across any category?"
    },
    {
      id: 8,
      title: "Intelligence Engine (Data Scientist)",
      department: "engineering",
      location: "Indore, India",
      type: "Full-time",
      experience: "2-4 years",
      description: "Build ML models that understand customer preferences across food, electronics, real estate, and services. Make our marketplace recommendations irresistible.",
      skills: ["Python", "Machine Learning", "SQL", "Marketplace Analytics", "TensorFlow"],
      hook: "Can you predict what someone needs before they know it themselves?"
    }
  ];

  const filteredJobs = jobs.filter(job => {
    const matchesDepartment = selectedDepartment === 'all' || job.department === selectedDepartment;
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDepartment && matchesSearch;
  });

  const values = [
    {
      icon: <Zap className="w-8 h-8 text-green-500" />,
      title: "We Move Fast",
      description: "Every day is a new challenge. While others think, we act. While others wait, we deliver."
    },
    {
      icon: <Star className="w-8 h-8 text-green-500" />,
      title: "We Dream Big",
      description: "Comprehensive marketplace is just the start. We're building the future of commerce, connecting every need with every solution."
    },
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: "We Own It",
      description: "No micromanagement here. You build it, you lead it, you own it. Success and failures - both are yours."
    },
    {
      icon: <Heart className="w-8 h-8 text-green-500" />,
      title: "We Celebrate Small Wins",
      description: "Because every idea matters. From fixing a bug to launching a feature - we celebrate it all."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Tastyaana</h1>
            </div>
            <nav className="hidden md:flex space-x-4 lg:space-x-8">
              <a href="#" className="text-gray-600 hover:text-green-500 transition-colors text-sm lg:text-base whitespace-nowrap">Home</a>
              <a href="#" className="text-gray-600 hover:text-green-500 transition-colors text-sm lg:text-base whitespace-nowrap">About</a>
              <a href="#" className="text-green-500 font-medium text-sm lg:text-base whitespace-nowrap">Careers</a>
              <a href="#" className="text-gray-600 hover:text-green-500 transition-colors text-sm lg:text-base whitespace-nowrap">Contact</a>
            </nav>
            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-md text-gray-600 hover:text-green-500 hover:bg-gray-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Hungry for Innovation? <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">So are we.</span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-6 sm:mb-8 px-2">
              At Tastyaana, we're not just delivering convenience — we're building India's most comprehensive marketplace. From food and electronics to real estate and services, we connect millions with everything they need.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 justify-center items-center mb-8 sm:mb-12">
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500 flex-shrink-0" />
                <span className="whitespace-nowrap">Multiple locations across India</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500 flex-shrink-0" />
                <span className="whitespace-nowrap">200+ passionate team members</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500 flex-shrink-0" />
                <span className="whitespace-nowrap">4.8/5 employee satisfaction</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Our Values
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              The principles that guide our work culture and drive our success
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center px-2">
                <div className="mb-3 sm:mb-4 flex justify-center">{value.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{value.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Life at Tastyaana */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Life at Tastyaana
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              We're a startup, so titles don't matter as much as ideas. If you're smart, passionate, and ready to revolutionize how India shops, you'll fit right in.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg">
                <div className="flex items-center mb-2 sm:mb-3 lg:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    P
                  </div>
                  <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base leading-tight">Priya Sharma</h4>
                    <p className="text-gray-600 text-xs sm:text-sm truncate">Senior Product Manager</p>
                  </div>
                </div>
                <p className="text-gray-700 italic text-xs sm:text-sm lg:text-base leading-relaxed">"Working at Tastyaana feels like being part of a family that happens to be building something amazing. The energy is infectious, and every day brings new challenges that push me to grow."</p>
              </div>
              
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg">
                <div className="flex items-center mb-2 sm:mb-3 lg:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    A
                  </div>
                  <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base leading-tight">Arjun Patel</h4>
                    <p className="text-gray-600 text-xs sm:text-sm truncate">Lead Developer</p>
                  </div>
                </div>
                <p className="text-gray-700 italic text-xs sm:text-sm lg:text-base leading-relaxed">"I've been here for 2 years and still get excited about Monday mornings. When your code powers someone's shopping experience across multiple categories, every line of code matters."</p>
              </div>
              
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg">
                <div className="flex items-center mb-2 sm:mb-3 lg:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    M
                  </div>
                  <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base leading-tight">Maya Singh</h4>
                    <p className="text-gray-600 text-xs sm:text-sm truncate">Operations Lead</p>
                  </div>
                </div>
                <p className="text-gray-700 italic text-xs sm:text-sm lg:text-base leading-relaxed">"From organizing team hackathons to celebrating small wins with impromptu pizza parties - this place knows how to balance hard work with genuine fun."</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
              <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-lg">
                  <Coffee className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-500 mb-1 sm:mb-2 lg:mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm lg:text-base leading-tight">Team Lunches</h4>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">Weekly team meals where we discuss everything except work</p>
                </div>
                <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-lg">
                  <Code className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-500 mb-1 sm:mb-2 lg:mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm lg:text-base leading-tight">Hackathons</h4>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">Monthly innovation days where crazy ideas become features</p>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3 lg:space-y-4 mt-2 sm:mt-4 lg:mt-8">
                <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-lg">
                  <Heart className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-pink-500 mb-1 sm:mb-2 lg:mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm lg:text-base leading-tight">Celebrations</h4>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">Every milestone deserves a celebration, big or small</p>
                </div>
                <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-lg">
                  <Users className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-500 mb-1 sm:mb-2 lg:mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm lg:text-base leading-tight">No Hierarchy</h4>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">Everyone's voice matters, from intern to founder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Why Work With Us
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              We believe in taking care of our people so they can do their best work
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="mb-2 sm:mb-4">{benefit.icon}</div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 lg:mb-3">{benefit.title}</h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Growth Opportunities */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Your Growth Journey
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              We invest in our people because your success is our success
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            <div className="text-center px-1 sm:px-2">
              <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 lg:mb-3 leading-tight">Mentorship Programs</h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">Get paired with senior team members who've been in your shoes and know the path forward.</p>
            </div>
            
            <div className="text-center px-1 sm:px-2">
              <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 lg:mb-3 leading-tight">Training Workshops</h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">Regular workshops on everything from new technologies to leadership skills - all during work hours.</p>
            </div>
            
            <div className="text-center px-1 sm:px-2">
              <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                <Briefcase className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 lg:mb-3 leading-tight">Multi-Project Experience</h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">Work across different teams and projects. Variety keeps things interesting and builds diverse skills.</p>
            </div>
            
            <div className="text-center px-1 sm:px-2">
              <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 lg:mb-3 leading-tight">Fast Career Growth</h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">In a fast-scaling startup, promotions happen based on impact, not tenure. Grow as fast as you can deliver.</p>
            </div>
          </div>
          
          <div className="mt-8 sm:mt-10 lg:mt-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 xl:p-8 text-center">
            <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">The Tastyaana Growth Promise</h3>
            <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              "We'll invest in your growth as much as you invest in ours. Whether you want to lead a team, master new technologies, or explore different domains - we'll create the path together."
            </p>
            <p className="text-green-600 font-medium mt-2 sm:mt-3 lg:mt-4 text-xs sm:text-sm lg:text-base">- Tastyaana Leadership Team</p>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Open Positions
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Join our team and help shape the future of India's marketplace industry
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4 mb-6 sm:mb-8">
            <div className="relative">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search positions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept.id)}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedDepartment === dept.id
                      ? 'bg-green-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="hidden sm:inline">{dept.name} ({dept.count})</span>
                  <span className="sm:hidden">{dept.name.split(' ')[0]} ({dept.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Job Listings */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col">
                  <div className="flex-1">
                    <div className="flex flex-col mb-2 sm:mb-3 lg:mb-4">
                      <div className="mb-1 sm:mb-2 lg:mb-3">
                        <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 leading-tight">{job.title}</h3>
                        {job.hook && (
                          <p className="text-green-600 font-medium text-xs sm:text-sm italic">{job.hook}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <span className="inline-flex items-center px-1.5 sm:px-2 lg:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {job.department}
                        </span>
                        {/* <span className="inline-flex items-center px-1.5 sm:px-2 lg:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {job.type}
                        </span> */}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 lg:gap-4 mb-2 sm:mb-3 lg:mb-4 text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{job.location}</span>
                      </div>
                      {/* <div className="flex items-center">
                        <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{job.experience}</span>
                      </div> */}
                    </div>
                    
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-2 sm:mb-3 lg:mb-4 leading-relaxed">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 lg:gap-2 mb-3 sm:mb-4 lg:mb-6">
                      {job.skills.map((skill, index) => (
                        <span key={index} className="px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm lg:text-base font-semibold hover:from-green-600 hover:to-emerald-600 transition-colors flex items-center justify-center">
                      Apply Now
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No positions found matching your criteria.</p>
              <p className="text-gray-400 mt-2">Try adjusting your search or filter options.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-green-500 to-emerald-500">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 px-2">
            Don't See the Right Role?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-green-100 max-w-3xl mx-auto mb-6 sm:mb-8 px-2 leading-relaxed">
            We're always looking for talented individuals who share our vision. Send us your resume and let us know how you'd like to contribute to Tastyaana's growth.
          </p>
          <button className="bg-white text-green-500 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-50 transition-colors shadow-lg">
            Send Your Resume
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 sm:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <div className="col-span-1 sm:col-span-2 lg:col-span-1 mb-4 sm:mb-0">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Tastyaana</h3>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed pr-0 sm:pr-4">Your one-stop marketplace for everything - food, electronics, real estate, and more.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Company</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li><a href="#" className="hover:text-green-500 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">For Job Seekers</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li><a href="#" className="hover:text-green-500 transition-colors">Open Positions</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Interview Process</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Employee Benefits</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Support</h4>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                <li><a href="#" className="hover:text-green-500 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 sm:pt-6 lg:pt-8 mt-4 sm:mt-6 lg:mt-8 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">&copy; 2024 Tastyaana. All rights reserved. Equal Opportunity Employer.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}