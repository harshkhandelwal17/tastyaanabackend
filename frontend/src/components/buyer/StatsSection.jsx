// import { useRef } from "react";
// import { motion } from "framer-motion";
// import { useEffect } from "react";
// // import { useAnimatedCounter } from "./animationUtils";
// import { Users, Package, Award, MapPin } from "lucide-react";
// import { useAnimatedCounter, useIntersectionObserver } from "./animationUtils";
// const StatsSection = () => {
//   const statsRef = useRef();
//   const areStatsVisible = useIntersectionObserver(statsRef, { threshold: 0.5 });

//   const [happyCustomers, startCustomersCounter] = useAnimatedCounter(
//     50000,
//     2000
//   );
//   const [sweetsDelivered, startSweetsCounter] = useAnimatedCounter(
//     500000,
//     2500
//   );
//   const [yearsExperience, startYearsCounter] = useAnimatedCounter(35, 1500);
//   const [citiesCovered, startCitiesCounter] = useAnimatedCounter(150, 1800);

//   useEffect(() => {
//     if (areStatsVisible) {
//       startCustomersCounter();
//       startSweetsCounter();
//       startYearsCounter();
//       startCitiesCounter();
//     }
//   }, [areStatsVisible]);

//   const stats = [
//     {
//       number: happyCustomers,
//       suffix: "K+",
//       label: "Happy Families",
//       sublabel: "Across India",
//       icon: Users,
//       color: "from-amber-300 to-amber-300",
//       shadowColor: "rgba(217, 119, 6, 0.2)",
//     },
//     // Other stats...
//   ];

//   return (
//     <section
//       ref={statsRef}
//       className="py-20 lg:py-28 relative overflow-hidden"
//       style={{
//         background: `linear-gradient(135deg, rgba(251, 242, 220, 0.95) 0%, rgba(246, 231, 195, 0.95) 30%, rgba(233, 210, 157, 0.9) 70%, rgba(208, 182, 124, 0.95) 100%)`,
//       }}
//     >
//       {/* Background elements */}
//       <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,...')] bg-[length:180px_180px]"></div>

//       <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
//         {/* Section header */}
//         <div className="text-center mb-16 lg:mb-20">
//           <div className="inline-block mb-3">
//             <div className="w-12 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mx-auto"></div>
//             <div className="w-8 h-1 bg-gradient-to-r from-amber-500 to-amber-700 rounded-full mx-auto mt-1"></div>
//             <div className="w-4 h-1 bg-gradient-to-r from-amber-600 to-amber-800 rounded-full mx-auto mt-1"></div>
//           </div>

//           <h2 className="text-3xl lg:text-5xl font-black mb-4 text-amber-800">
//             Our Journey
//           </h2>
//           <p className="text-lg lg:text-xl text-amber-800/80 max-w-2xl mx-auto font-medium">
//             Numbers that reflect our commitment to spreading sweetness across
//             India
//           </p>
//         </div>

//         {/* Stats grid */}
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
//           {stats.map((stat, index) => {
//             const Icon = stat.icon;
//             return (
//               <motion.div
//                 key={index}
//                 className="group"
//                 initial={{ opacity: 0, y: 30 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.1 * index, duration: 0.8 }}
//                 viewport={{ once: true }}
//               >
//                 <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-amber-200 hover:border-amber-300 group-hover:shadow-lg transition-all duration-300">
//                   <div
//                     className={`w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r ${stat.color} rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-5 lg:mb-6 group-hover:scale-110 transition-all duration-300 shadow-md`}
//                   >
//                     <Icon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
//                   </div>

//                   <div className="text-3xl lg:text-5xl font-black mb-2 text-center bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent">
//                     {stat.number}
//                     {stat.suffix}
//                   </div>

//                   <div className="text-center">
//                     <p className="text-sm lg:text-lg font-bold text-amber-800 group-hover:text-amber-900 transition-colors">
//                       {stat.label}
//                     </p>
//                     <p className="text-xs lg:text-sm text-amber-700/70 mt-1 group-hover:text-amber-700 transition-colors">
//                       {stat.sublabel}
//                     </p>
//                   </div>
//                 </div>
//               </motion.div>
//             );
//           })}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default StatsSection;



import { useRef } from "react";
import { motion } from "framer-motion";
import { useEffect } from "react";
// import { useAnimatedCounter } from "./animationUtils";
import { Users, Package, Award, MapPin } from "lucide-react";
import { useAnimatedCounter, useIntersectionObserver } from "./animationUtils";
import React from "react";

const StatsSection = () => {
  const statsRef = useRef();
  const areStatsVisible = useIntersectionObserver(statsRef, { threshold: 0.5 });

  const [happyCustomers, startCustomersCounter] = useAnimatedCounter(
    50000,
    2000
  );
  const [sweetsDelivered, startSweetsCounter] = useAnimatedCounter(
    500000,
    2500
  );
  const [yearsExperience, startYearsCounter] = useAnimatedCounter(35, 1500);
  const [citiesCovered, startCitiesCounter] = useAnimatedCounter(150, 1800);

  useEffect(() => {
    if (areStatsVisible) {
      startCustomersCounter();
      startSweetsCounter();
      startYearsCounter();
      startCitiesCounter();
    }
  }, [areStatsVisible]);

  const stats = [
    {
      number: happyCustomers,
      suffix: "K+",
      label: "Happy Families",
      sublabel: "Across India",
      icon: Users,
      color: "bg-amber-500",
    },
    {
      number: sweetsDelivered,
      suffix: "K+",
      label: "Sweets Delivered",
      sublabel: "Monthly",
      icon: Package,
      color: "bg-amber-500",
    },
    {
      number: yearsExperience,
      suffix: "+",
      label: "Years Experience",
      sublabel: "In Business",
      icon: Award,
      color: "bg-amber-500",
    },
    {
      number: citiesCovered,
      suffix: "+",
      label: "Cities Covered",
      sublabel: "Pan India",
      icon: MapPin,
      color: "bg-amber-500",
    },
  ];

  return (
    <section
      ref={statsRef}
      className="py-16 lg:py-20 bg-gradient-to-br from-white via-white-50 to-white-50"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="w-12 h-1 bg-amber-500 rounded-full mx-auto mb-4"></div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-amber-900">
            Our Journey
          </h2>
          <p className="text-lg text-amber-800/80 max-w-2xl mx-auto">
            Numbers that reflect our commitment to spreading sweetness across
            India
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                className="group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.8 }}
                viewport={{ once: true }}
              >
                <div className="bg-white rounded-lg p-4 lg:p-6 border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all duration-300">
                  <div
                    className={`w-12 h-12 lg:w-14 lg:h-14 ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300`}
                  >
                    <Icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                  </div>

                  <div className="text-2xl lg:text-3xl font-bold mb-2 text-center text-amber-900">
                    {stat.number}
                    {stat.suffix}
                  </div>

                  <div className="text-center">
                    <p className="text-sm lg:text-base font-semibold text-amber-800">
                      {stat.label}
                    </p>
                    <p className="text-xs lg:text-sm text-amber-700/70 mt-1">
                      {stat.sublabel}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default React.memo(StatsSection);