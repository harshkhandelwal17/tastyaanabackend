import React, { useState, useEffect } from 'react';

const GaneshChaturthi = () => {
  const [currentWish, setCurrentWish] = useState(0);
  const [showEssentials, setShowEssentials] = useState(true);
  const [imageVisible, setImageVisible] = useState({});
  
  const wishes = [
    "Ganpati Bappa Morya!",
    "May Ganesha bring prosperity",
    "Mangal Murti Morya!",
    "Blessings of Lord Ganesha",
    "Vighna Harta Ganpati!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWish((prev) => (prev + 1) % wishes.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Initialize all images as visible
    const initialState = {};
    categories.slice(1).forEach((_, index) => {
      initialState[index] = true;
    });
    setImageVisible(initialState);

    // Repeat slide animation every 5 seconds
    const animationInterval = setInterval(() => {
      // Hide all images first
      const hideState = {};
      categories.slice(1).forEach((_, index) => {
        hideState[index] = false;
      });
      setImageVisible(hideState);

      // Show images one by one with delays
      categories.slice(1).forEach((_, index) => {
        setTimeout(() => {
          setImageVisible(prev => ({
            ...prev,
            [index]: true
          }));
        }, 300 + (index * 200)); // 300ms initial delay, then 200ms between each
      });
    }, 5000);

    return () => clearInterval(animationInterval);
  }, []);

  useEffect(() => {
    const essentialsInterval = setInterval(() => {
      setShowEssentials(false);
      setTimeout(() => {
        setShowEssentials(true);
      }, 1000);
    }, 6000);
    return () => clearInterval(essentialsInterval);
  }, []);

  const categories = [
    {
      title: "Idols & Pooja Needs",
      subtitle: "Premium Ganesh Murtis",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
      image: "/assets/pooja.png",
      animationDelay: "0s"
    },
    {
      title: "Pooja Samagri",
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
      image: "/assets/pooja.png",
      animationDelay: "0.2s"
    },
    {
      title: "Ghee",
      bgColor: "bg-gradient-to-br from-yellow-50 to-yellow-100",
      image: "/assets/ghee.png",
      animationDelay: "0.4s"
    },
    {
      title: "Festive Essentials",
      bgColor: "bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100",
      image: "/assets/boxsweets.png",
      animationDelay: "0.6s"
    },
    {
      title: "Sweets",
      bgColor: "bg-gradient-to-br from-pink-50 to-pink-100",
      image: "/assets/boxsweets.png",
      animationDelay: "0.8s"
    }
  ];

  const AnimatedEssential = () => (
    <div className="flex justify-center items-center h-20 relative overflow-hidden">
      <div 
        className={`flex gap-3 transition-all duration-1000 ease-in-out transform ${
          showEssentials 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 -translate-x-full'
        }`}
      >
        <div className="relative">
          <img 
            src="/assets/nariyal.png" 
            alt="nariyal"
            className="w-20 h-20 object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="relative">
          <img 
            src="/assets/agarbatti.png" 
            alt="agarbatti"
            className="w-20 h-20 object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
      
      <div className={`absolute -top-2 -left-2 w-3 h-3 bg-yellow-400 rounded-full transition-all duration-1000 ${showEssentials ? 'animate-ping opacity-60' : 'opacity-0'}`}></div>
      <div className={`absolute -bottom-2 -right-2 w-2 h-2 bg-orange-400 rounded-full transition-all duration-1000 ${showEssentials ? 'animate-ping opacity-60' : 'opacity-0'}`} style={{animationDelay: '0.5s'}}></div>
    </div>
  );

  const FlowerHanging = ({ index }) => (
    <div className="flex flex-col items-center animate-bounce" style={{ animationDelay: `${index * 0.3}s` }}>
      {/* String */}
      <div className="w-0.5 h-6 bg-green-600 opacity-70"></div>
      {/* Flower */}
      <div className={`
        relative w-4 h-4 rounded-full animate-pulse
        ${index % 4 === 0 ? 'bg-gradient-to-br from-pink-400 to-pink-600' : ''}
        ${index % 4 === 1 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : ''}
        ${index % 4 === 2 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : ''}
        ${index % 4 === 3 ? 'bg-gradient-to-br from-red-400 to-red-600' : ''}
      `}>
        {/* Flower petals */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full opacity-30"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-30"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full opacity-30"></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white rounded-full opacity-30"></div>
        {/* Center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-yellow-300 rounded-full"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-fit bg-white p-4">
      {/* Animated Flower Hangings */}
      <div className="flex justify-center mb-4 overflow-hidden">
        <div className="flex gap-3">
          {[...Array(12)].map((_, index) => (
            <FlowerHanging key={index} index={index} />
          ))}
        </div>
      </div>
      
      {/* Main Header */}
      <div className="text-center mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-amber-900 mb-2">
          GANESH CHATURTHI
        </h1>
        <h2 className="text-xl md:text-2xl font-bold text-amber-800">
          SPECIALS
        </h2>
        
        {/* Animated Wishes Subtitle */}
        <div className="mt-3 flex items-center justify-center">
          <div className="text-base md:text-lg text-amber-700 font-medium animate-pulse transition-all duration-500">
            {wishes[currentWish]} ✨
          </div>
          <div className="ml-2">
            <div className="w-8 h-8 bg-gradient-to-b from-orange-400 to-red-400 rounded-b-full">
              <div className="w-2 h-3 bg-yellow-400 rounded-full mx-auto animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-6xl mx-auto">
        {/* Mobile Layout */}
        <div className="block md:hidden">
          <div className="grid grid-cols-4 gap-2 h-60">
            {/* Main Card - Takes 2x2 space */}
            <div className="col-span-2 row-span-2">
              <div className="bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-200 rounded-2xl p-3 h-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col items-center justify-between">
                {/* Background decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  {/* Lotus petals pattern */}
                  <div className="absolute top-4 left-4 w-8 h-8 bg-orange-400 rounded-full transform rotate-45"></div>
                  <div className="absolute top-6 left-6 w-6 h-6 bg-yellow-400 rounded-full transform -rotate-12"></div>
                  <div className="absolute top-12 right-8 w-10 h-10 bg-pink-400 rounded-full transform rotate-12"></div>
                  <div className="absolute bottom-16 left-8 w-7 h-7 bg-orange-500 rounded-full transform rotate-45"></div>
                  <div className="absolute bottom-8 right-6 w-9 h-9 bg-yellow-500 rounded-full transform -rotate-30"></div>
                  {/* Om symbols */}
                  <div className="absolute top-1/4 right-1/4 text-orange-300 text-2xl transform rotate-12 opacity-20">🕉️</div>
                  <div className="absolute bottom-1/3 left-1/4 text-yellow-400 text-lg transform -rotate-12 opacity-15">🕉️</div>
                  {/* Decorative swirls */}
                  <div className="absolute top-1/3 left-1/2 w-12 h-12 border-2 border-orange-300 rounded-full opacity-20"></div>
                  <div className="absolute bottom-1/4 right-1/3 w-8 h-8 border border-yellow-400 rounded-full opacity-25"></div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-300 rounded-full opacity-30 animate-pulse"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 bg-orange-300 rounded-full opacity-40 animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-50 animate-bounce" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute bottom-12 right-4 w-2.5 h-2.5 bg-yellow-400 rounded-full opacity-40 animate-ping" style={{animationDelay: '2s'}}></div>
                
                {/* Animated Heading */}
                <div className="text-center mt-2 z-20">
                  <h2 className="text-sm font-bold bg-gradient-to-r from-orange-600 via-red-500 to-yellow-600 bg-clip-text text-transparent animate-pulse hover:scale-105 transition-all duration-500">
                    🌟 Happy Ganesh Chaturthi 🌟
                  </h2>
                  <div className="flex justify-center mt-1 space-x-1">
                    {['🙏', '🕉️', '🌺'].map((emoji, index) => (
                      <span 
                        key={index} 
                        className="animate-pulse text-xs"
                        style={{animationDelay: `${index * 0.5}s`}}
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                </div>
                
                <img src="/assets/ganeshji.png" alt="Ganesh Ji" className="w-full h-2/3 object-contain relative z-10" />
              </div>
            </div>
            
            {/* Other 4 cards - Each takes 1 grid space */}
            {categories.slice(1).map((category, index) => (
              <div key={index} className={`${category.bgColor} rounded-lg p-1 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden`}>
                {/* Decorative background elements */}
                <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-yellow-300 rounded-full opacity-20 animate-pulse" style={{animationDelay: `${index * 0.3}s`}}></div>
                <div className="absolute bottom-0.5 left-0.5 w-0.5 h-0.5 bg-orange-300 rounded-full opacity-30 animate-pulse" style={{animationDelay: `${index * 0.3 + 1}s`}}></div>
                
                <div className="text-center h-full flex flex-col justify-center items-center relative z-10 py-1">
                  <h3 className="text-xs font-bold text-amber-900 mb-1 leading-tight truncate w-full">
                    {category.title}
                  </h3>
                  <div className="flex justify-center items-center">
                    {category.title.includes('Essentials') ? (
                      <div className="flex gap-0.5">
                        <img 
                          src="/assets/nariyal.png" 
                          alt="nariyal"
                          className="w-8 h-8 object-contain"
                        />
                        <img 
                          src="/assets/agarbatti.png" 
                          alt="agarbatti"
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                    ) : (
                      <div 
                        className={`transition-all duration-500 ease-out transform ${
                          imageVisible[index] 
                            ? 'opacity-100 translate-x-0' 
                            : 'opacity-0 -translate-x-12'
                        }`}
                      >
                        <img 
                          src={category.image} 
                          alt={category.title}
                          className="w-12 h-12 object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop/Tablet Layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          {/* Main Card */}
          <div className="md:col-span-2 md:row-span-2">
            <div className="bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-200 rounded-2xl p-6 h-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col items-center justify-between">
              {/* Background decorative pattern */}
              <div className="absolute inset-0 opacity-10">
                {/* Lotus petals pattern */}
                <div className="absolute top-8 left-8 w-12 h-12 bg-orange-400 rounded-full transform rotate-45"></div>
                <div className="absolute top-12 left-12 w-8 h-8 bg-yellow-400 rounded-full transform -rotate-12"></div>
                <div className="absolute top-16 right-12 w-14 h-14 bg-pink-400 rounded-full transform rotate-12"></div>
                <div className="absolute bottom-20 left-12 w-10 h-10 bg-orange-500 rounded-full transform rotate-45"></div>
                <div className="absolute bottom-12 right-10 w-12 h-12 bg-yellow-500 rounded-full transform -rotate-30"></div>
                {/* Om symbols */}
                <div className="absolute top-1/4 right-1/4 text-orange-300 text-4xl transform rotate-12 opacity-20">🕉️</div>
                <div className="absolute bottom-1/3 left-1/4 text-yellow-400 text-3xl transform -rotate-12 opacity-15">🕉️</div>
                <div className="absolute top-1/2 right-1/2 text-pink-300 text-2xl transform rotate-45 opacity-10">🕉️</div>
                {/* Decorative swirls */}
                <div className="absolute top-1/3 left-1/2 w-16 h-16 border-2 border-orange-300 rounded-full opacity-20"></div>
                <div className="absolute bottom-1/4 right-1/3 w-12 h-12 border border-yellow-400 rounded-full opacity-25"></div>
                <div className="absolute top-1/2 left-1/3 w-10 h-10 border-2 border-pink-300 rounded-full opacity-15"></div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-yellow-300 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 bg-orange-300 rounded-full opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="absolute top-1/3 left-8 w-4 h-4 bg-pink-300 rounded-full opacity-25 animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute top-12 right-16 w-3 h-3 bg-pink-400 rounded-full opacity-50 animate-bounce" style={{animationDelay: '0.8s'}}></div>
              <div className="absolute bottom-16 right-8 w-5 h-5 bg-yellow-400 rounded-full opacity-40 animate-ping" style={{animationDelay: '2.5s'}}></div>
              
              {/* Animated Heading */}
              <div className="text-center mt-4 z-20">
                <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-yellow-600 bg-clip-text text-transparent animate-pulse hover:scale-105 transition-all duration-500">
                  🌟 Happy Ganesh Chaturthi 🌟
                </h2>
                <div className="flex justify-center mt-2 space-x-2">
                  {['🙏', '🕉️', '🌺'].map((emoji, index) => (
                    <span 
                      key={index} 
                      className="animate-pulse text-lg"
                      style={{animationDelay: `${index * 0.5}s`}}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
              
              <img src="/assets/ganeshji.png" alt="Ganesh Ji" className="w-full h-2/3 object-contain relative z-10" />
            </div>
          </div>
          
          {/* Other Cards */}
          {categories.slice(1).map((category, index) => (
  <div key={index} className={`${category.bgColor} h-24 sm:h-28 md:h-32 rounded-xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden`}>
    {/* Decorative background elements */}
    <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-4 h-4 sm:w-6 sm:h-6 bg-yellow-300 rounded-full opacity-20 animate-pulse" style={{animationDelay: `${index * 0.3}s`}}></div>
    <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 w-3 h-3 sm:w-5 sm:h-5 bg-orange-300 rounded-full opacity-30 animate-pulse" style={{animationDelay: `${index * 0.3 + 1}s`}}></div>
    <div className="absolute top-1/2 right-1/3 w-2 h-2 sm:w-3 sm:h-3 bg-pink-300 rounded-full opacity-25 animate-pulse" style={{animationDelay: `${index * 0.3 + 0.5}s`}}></div>
    
    <div className="text-center relative z-10 h-full flex flex-col justify-between">
      <h3 className="text-sm sm:text-lg font-bold text-amber-900 mb-2 sm:mb-4">
        {category.title}
      </h3>
      <div className="flex justify-center items-center flex-1">
        {category.title.includes('Essentials') ? (
          <AnimatedEssential />
        ) : (
          <div
            className={`transition-all duration-500 ease-out transform ${
              imageVisible[index]
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-16'
            }`}
          >
            <img
              src={category.image}
              alt={category.title}
              className="w-16 h-16 sm:w-24 sm:h-24 md:w-30 md:h-30 object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </div>
    </div>
  </div>
))}
        </div>
      </div>
    </div>
  );
};

export default GaneshChaturthi;