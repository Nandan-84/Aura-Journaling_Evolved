"use client";
import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Sparkles, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const containerRef = useRef(null);
  const [isLogin, setIsLogin] = useState(true); 
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState(""); 

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".glass-card", { y: 50, opacity: 0, duration: 1, ease: "power3.out" })
      .from(".form-item", { y: 20, opacity: 0, stagger: 0.1, duration: 0.8 }, "-=0.5");
  }, { scope: containerRef });

  const validatePassword = (pass: string) => {
    if (pass.length < 8) {
        setPasswordError("Password must be at least 8 characters");
        return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!isLogin && !validatePassword(formData.password)) {
        return;
    }

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const res = await api.post(endpoint, formData);
      
      const userName = res.data.user?.name || formData.name || "Traveler";
      localStorage.setItem("userName", userName);

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
                 required
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
              required
            />
          </div>

          <div className="group relative">
            <input
              type="password"
              placeholder="Password"
              className={`glass-input ${passwordError ? "border-red-500/50 focus:border-red-500" : ""}`}
              value={formData.password}
              onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (!isLogin) validatePassword(e.target.value);
              }}
              required
            />
            {isLogin && (
                <div className="text-right mt-2">
                    <a href="#" className="text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-wider">
                        Forgot Password?
                    </a>
                </div>
            )}
          </div>
          
          {passwordError && !isLogin && (
             <p className="text-red-400 text-xs flex items-center gap-1 pl-1">
                 <AlertCircle className="w-3 h-3" /> {passwordError}
             </p>
          )}

          {error && <p className="text-red-300 text-xs text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

          <button type="submit" className="btn-primary mt-2">
            {isLogin ? "Enter" : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center form-item pb-2">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setPasswordError("");
            }}
            className="text-xs text-white/40 hover:text-white transition-colors tracking-widest uppercase"
          >
            {isLogin ? "New Here? Create Account" : "Login Instead"}
          </button>
        </div>
      </div>
    </main>
  );
}