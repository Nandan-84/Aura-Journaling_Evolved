"use client";
import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const containerRef = useRef(null);
  const [isLogin, setIsLogin] = useState(true); // Toggle Login/Register
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".glass-card", { y: 50, opacity: 0, duration: 1, ease: "power3.out" })
      .from(".form-item", { y: 20, opacity: 0, stagger: 0.1, duration: 0.8 }, "-=0.5");
  }, { scope: containerRef });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const res = await api.post(endpoint, formData);
      
      const userName = res.data.user?.name || formData.name || "Traveler";
      localStorage.setItem("userName", userName);
      // ---------------------------

      router.push("/dashboard"); 
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <main ref={containerRef} className="flex min-h-screen items-center justify-center relative">
      
      
      <div className="app-background" />
      
      
      <div className="absolute inset-0 bg-black/60 z-0" />

      
      <div className="glass-card z-10">
        
        <div className="text-center mb-10 form-item pt-4">
          <div className="inline-flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6 text-white/90" />
            <h1 className="text-4xl font-medium tracking-[0.2em] text-white uppercase">Aura</h1>
          </div>
          
          <p className="text-gray-400 font-medium text-[11px] uppercase tracking-[0.4em] ml-1">
            Journaling Evolved
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 form-item">
          {!isLogin && (
             <div className="group">
               <input 
                 type="text" placeholder="Name" 
                 className="glass-input"
                 value={formData.name} 
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
               />
             </div>
          )}

          <div className="group">
            <input
              type="email"
              placeholder="Email"
              className="glass-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="group">
            <input
              type="password"
              placeholder="Password"
              className="glass-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && <p className="text-red-300 text-xs text-center">{error}</p>}

          <button type="submit" className="btn-primary mt-4">
            {isLogin ? "Enter" : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center form-item pb-2">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-white/40 hover:text-white transition-colors tracking-widest uppercase"
          >
            {isLogin ? "New Here? Create Account" : "Login Instead"}
          </button>
        </div>
      </div>
    </main>
  );
}