import React from "react";
import { FiCheckCircle, FiShield, FiClock, FiAward, FiPackage } from "react-icons/fi";
import { FaTshirt } from "react-icons/fa";

export const RightSide: React.FC = () => {
  return (
    <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#dc2626] via-[#b91c1c] to-[#991b1b]"></div>

      {/* Geometric pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="%23ffffff" stroke-width="1"/></pattern></defs><rect width="200" height="200" fill="url(%23grid)"/></svg>')`,
          }}
        ></div>
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-lg opacity-10 blur-2xl"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 bg-white rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-white transform rotate-45 opacity-10 blur-2xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-20 h-full flex flex-col justify-center items-center text-white p-12">
        <div className="text-center max-w-lg">
          <div className="mb-8">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-black/20">
              <FaTshirt className="w-12 h-12 text-[#dc2626]" />
            </div>
          </div>

          <h2 className="text-5xl font-black mb-8 text-white font-sans leading-tight">
            Your Trusted
            <span className="block">Custom Apparel Partner</span>
          </h2>

          <p className="text-xl text-white/80 mb-12 font-medium leading-relaxed">
            Premium custom printed apparel you can count on. From t-shirts to merchandise, we&apos;ve got you covered.
          </p>

          <div className="grid grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="text-4xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">15+</div>
              <div className="text-sm font-bold text-white/70 uppercase tracking-wider">Years Experience</div>
            </div>
            <div className="group">
              <div className="text-4xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">10K+</div>
              <div className="text-sm font-bold text-white/70 uppercase tracking-wider">Orders Fulfilled</div>
            </div>
            <div className="group">
              <div className="text-4xl font-black text-white mb-2 group-hover:scale-110 transition-transform duration-300">99%</div>
              <div className="text-sm font-bold text-white/70 uppercase tracking-wider">Satisfaction</div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 space-y-4">
            {[
              { icon: <FaTshirt className="w-5 h-5" />, text: "Premium Quality Apparel" },
              { icon: <FiCheckCircle className="w-5 h-5" />, text: "Custom Design Services" },
              { icon: <FiShield className="w-5 h-5" />, text: "Satisfaction Guaranteed" },
              { icon: <FiClock className="w-5 h-5" />, text: "Fast Turnaround Time" },
              { icon: <FiAward className="w-5 h-5" />, text: "Competitive Pricing" },
            ].map((f) => (
              <div key={f.text} className="flex items-center justify-center space-x-3 text-white/90">
                <span className="text-white">{f.icon}</span>
                <span className="font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent"></div>
    </div>
  );
};

export default RightSide;
