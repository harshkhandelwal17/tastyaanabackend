import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as three from "three";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
// --- 3D Components ---

// 3D Rakhi Model
const Rakhi3D = () => {
  const groupRef = useRef();
  // Rotate the Rakhi on every frame
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
      groupRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} scale={1.2} position={[0, 0, 0]}>
      {/* Centerpiece */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.1, 64]} />
        <meshStandardMaterial color="#fff" metalness={0.2} roughness={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.05, 64]} />
        <meshStandardMaterial color="#dc2626" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 64]} />
        <meshStandardMaterial color="#ffd700" metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Petals */}
      {[...Array(8)].map((_, i) => (
        <mesh
          key={i}
          rotation={[Math.PI / 2, 0, (Math.PI / 4) * i]}
          position={[0, 0.05, 0]}
        >
          <planeGeometry args={[0.9, 0.3]} />
          <meshStandardMaterial
            color="#fca5a5"
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* Thread */}
      <mesh>
        <torusGeometry args={[2.5, 0.05, 16, 100]} />
        <meshStandardMaterial color="#ef4444" roughness={0.8} />
      </mesh>
      <mesh rotation={[0, 0, 0.05]}>
        <torusGeometry args={[2.5, 0.04, 16, 100]} />
        {/* FIX: Corrected the invalid hex color code */}
        <meshStandardMaterial color="#fbbf24" roughness={0.8} />
      </mesh>
    </group>
  );
};

// Floating Particles
const FloatingParticles = (props) => {
  const ref = useRef();
  const { positions } = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 15;
    }
    return { positions };
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta / 20;
      ref.current.rotation.y += delta / 25;
    }
  });

  return (
    <Points
      ref={ref}
      positions={positions}
      stride={3}
      frustumCulled={false}
      {...props}
    >
      <PointMaterial
        transparent
        color="#ffa500"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
};

// --- Main Page Component ---
export default function SiteClosedPage() {
  const pageStyles = { fontFamily: "'Poppins', sans-serif" };
  const titleStyle = { fontFamily: "'Tangerine', cursive" };
  const navigate = useNavigate();

  return (
    <div
      style={pageStyles}
      className="min-h-screen w-full bg-gradient-to-br from-red-50 via-amber-50 to-pink-50 relative"
    >
      {/* 3D Canvas in the background */}
      <Canvas
        camera={{ position: [0, 0, 5] }}
        style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
      >
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <Rakhi3D />
        <FloatingParticles />
      </Canvas>

      {/* Main Content */}
      <div className="relative z-10 w-full min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg mx-auto bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-6 sm:p-8 md:p-10 text-center animate-fade-in-up transition-all duration-300 hover:shadow-3xl">
          <h1
            style={titleStyle}
            className="text-6xl sm:text-7xl md:text-8xl font-bold bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 bg-clip-text text-transparent mb-2 mt-8"
          >
            Happy Navratri❤️🩷
          </h1>

          <p className="text-base sm:text-lg text-gray-700 font-medium mb-6">
            Celebrating the beautiful Festival.
          </p>

          <div className="bg-amber-100/50 border border-amber-200/80 rounded-lg px-4 py-3 sm:px-6 sm:py-4 mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-amber-800">
              Coming Soon
            </h2>
            <p className="text-sm sm:text-base text-amber-700 mt-1">
              We are taking a short break. We'll be back soon with delicious
              navratri things!
            </p>
          </div>

          <div
            onClick={() => navigate("/")}
            className="bg-amber-100/50 border border-amber-200/80 rounded-lg px-4 py-3 sm:px-6 sm:py-4 mb-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-pink-400">
              Continue with other things 😊😊
            </h2>
            <p className="text-sm sm:text-base text-amber-700 mt-1">Click</p>
          </div>

          <div className="text-sm text-gray-500 flex items-center justify-center">
            <p>Made with</p>
            <Heart className="w-4 h-4 mx-1.5 text-red-500 fill-current" />
            <p>from our team to yours.</p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tangerine:wght@700&family=Poppins:wght@400;500&display=swap');
        
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
