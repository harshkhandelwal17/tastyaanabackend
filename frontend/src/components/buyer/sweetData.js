export const sampleProducts = [
    {
      _id: "1",
      name: "Royal Kesar Malai Gujiya",
      description: "Premium saffron-flavored milk dumplings...",
      shortDescription: "Festive delicacy with saffron and nuts",
      images: [
        {
          url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
          alt: "Royal Kesar Malai Gujiya",
          isPrimary: true,
        },
      ],
      category: "Festival Specials",
      weightOptions: [
        {
          weight: "250g",
          price: 450,
          originalPrice: 550,
          discount: 18,
          stock: 50,
        },
        // Other weight options...
      ],
      isNew: true,
      badge: "Premium Royal",
      rating: { average: 4.8, count: 342 },
      reviewCount: 342,
      // Other product properties...
    },
    // Other products...
  ];
  
  export const heroSlides = [
    {
      title: "Discover Our Heritage Collection",
      subtitle: "Handcrafted with traditional recipes passed down through generations",
      image: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      accent: "from-amber-500 to-orange-500",
      cta: "Shop Collection",
    },
    // Other slides...
  ];
  
  export const testimonials = [
    {
      name: "Priya Sharma",
      location: "Mumbai, Maharashtra",
      review: "The most authentic and delicious sweets I've ever tasted!...",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616c6189ad4?w=60&h=60&fit=crop&crop=face",
      relation: "Happy Mother & Festival Enthusiast",
      orderInfo: "Ordered: Royal Kesar Malai Gujiya (1kg)",
    },
    // Other testimonials...
  ];
  
  export const trustIndicators = [
    { icon: "ChefHat", text: "Master Crafted", color: "text-amber-400" },
    { icon: "Truck", text: "Fresh Daily", color: "text-green-400" },
    { icon: "Shield", text: "Quality Assured", color: "text-blue-400" },
    { icon: "Home", text: "Family Recipe", color: "text-pink-400" },
  ];
  
  export const stats = [
    { value: "35+", label: "Years Experience", icon: "Clock" },
    { value: "150+", label: "Cities Served", icon: "MapPin" },
    { value: "50K+", label: "Happy Customers", icon: "Heart" },
  ];