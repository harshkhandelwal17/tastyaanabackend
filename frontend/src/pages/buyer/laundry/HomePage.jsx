import React from 'react';
import { ArrowRight, Package, Gift, Sparkles, Zap, Shield, Clock, Sparkles as SparklesIcon, CreditCard } from 'lucide-react';

export const HomePage = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white pt-12 pb-16 px-4 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-md lg:max-w-5xl mx-auto text-center">
          <div className="inline-block mb-6">
            <div className="text-7xl lg:text-8xl animate-bounce-slow">🧺</div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-3 tracking-tight">Professional Laundry Services</h1>
          <p className="text-blue-100 text-lg lg:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Premium quality washing, ironing & dry cleaning delivered right to your doorstep
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
            <button 
              onClick={() => onNavigate('vendors')}
              className="group w-full sm:w-auto bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-blue-500/50 hover:scale-105 active:scale-100 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <SparklesIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Book Service Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
              onClick={() => onNavigate('orders')}
              className="w-full sm:w-auto bg-white/10 backdrop-blur-md text-white border-2 border-white/40 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 hover:border-white/60 active:scale-100 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              <span>Track Orders</span>
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-md lg:max-w-5xl mx-auto px-4 -mt-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          {[
            { icon: Zap, title: 'Lightning Fast', desc: 'Same-day delivery available', color: 'from-yellow-400 via-orange-400 to-orange-500', bg: 'bg-yellow-50' },
            { icon: Shield, title: 'Premium Quality', desc: 'Professional care guaranteed', color: 'from-blue-400 via-blue-500 to-blue-600', bg: 'bg-blue-50' },
            { icon: Clock, title: 'Always On-Time', desc: 'Reliable & punctual service', color: 'from-green-400 via-green-500 to-green-600', bg: 'bg-green-50' }
          ].map((feature, idx) => (
            <div key={idx} className={`${feature.bg} rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 backdrop-blur-sm`}>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="max-w-md lg:max-w-5xl mx-auto px-4 mb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">Our Services</h2>
          <p className="text-gray-600 text-base lg:text-lg">Choose from our range of premium laundry services</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          {[
            { icon: '💧', title: 'Wash & Fold', desc: 'Professional washing and neat folding for everyday wear', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', border: 'border-blue-200' },
            { icon: '🔥', title: 'Wash & Iron', desc: 'Crisp, wrinkle-free clothes ready to wear', color: 'from-orange-500 to-red-500', bg: 'bg-orange-50', border: 'border-orange-200' },
            { icon: '✨', title: 'Dry Clean', desc: 'Premium cleaning for delicate and formal wear', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', border: 'border-purple-200' }
          ].map((service, idx) => (
            <div key={idx} className={`${service.bg} rounded-3xl p-6 border-2 ${service.border} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
              <div className="flex flex-col items-center text-center">
                <div className="text-6xl mb-4 transform hover:scale-110 transition-transform duration-300">{service.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-md lg:max-w-5xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          <button 
            onClick={() => onNavigate('orders')}
            className="group w-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white p-6 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 active:scale-98 transition-all duration-300 text-left border border-blue-500/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1.5">Track Orders</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">View status of all your orders</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
          
          <button 
            onClick={() => onNavigate('plans')}
            className="group w-full bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white p-6 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-purple-500/50 active:scale-98 transition-all duration-300 text-left border border-purple-500/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <Gift className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1.5">Subscription Plans</h3>
                  <p className="text-purple-100 text-sm leading-relaxed">Save up to 20% with monthly plans</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
          
          <button 
            onClick={() => onNavigate('subscriptions')}
            className="group w-full bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white p-6 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-emerald-500/50 active:scale-98 transition-all duration-300 text-left border border-emerald-500/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1.5">My Subscriptions</h3>
                  <p className="text-emerald-100 text-sm leading-relaxed">Manage your active subscriptions</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
