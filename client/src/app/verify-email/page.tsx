"use client";
import { useState, useRef, Suspense } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import api from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, MailCheck, AlertCircle } from "lucide-react";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || ""; 
  
  const containerRef = useRef(null);
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".glass-card", { y: 30, opacity: 0, duration: 1, ease: "power3.out" })
      .from(".form-item", { y: 10, opacity: 0, stagger: 0.1, duration: 0.8 }, "-=0.6");
  }, { scope: containerRef });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const res = await api.post("/auth/verify-email", { email, otp });
      
        setStatus("success");
      setMessage("Account Verified!");
      
      if (res.data.user?.name) {
          localStorage.setItem("userName", res.data.user.name);
      }

        setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.error || "Verification failed");
    }
  };

  return (
    <main ref={containerRef} className="flex min-h-screen items-center justify-center relative bg-black overflow-hidden">
      
      <div className="app-background opacity-40 fixed inset-0" />
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-card z-10 w-full max-w-md p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl relative">
        
        <div className="text-center mb-8 form-item pt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4 border border-white/10">
            <MailCheck className="w-5 h-5 text-white/80" />
          </div>
          <h1 className="text-2xl font-medium tracking-wide text-white mb-2">Check your Email</h1>
          <p className="text-white/40 text-xs uppercase tracking-widest">
            We sent a code to <span className="text-white/70">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 form-item">
            <div className="group">
                <input
                type="text"
                placeholder="Enter 6-digit Code"
                className="glass-input text-center text-lg tracking-[0.5em] font-mono"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                required
                />
            </div>

            {status === "error" && (
                <p className="text-red-300 text-xs text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20 flex items-center justify-center gap-2">
                   <AlertCircle className="w-3 h-3" /> {message}
                </p>
            )}
            
            {status === "success" && (
                <p className="text-green-300 text-xs text-center bg-green-500/10 py-2 rounded-lg border border-green-500/20">
                   {message}
                </p>
            )}

            <button 
                type="submit" 
                disabled={status === "loading" || otp.length < 6}
                className="btn-primary"
            >
                {status === "loading" ? "Verifying..." : "Verify Account"}
            </button>
        </form>

        <div className="mt-6 text-center form-item">
            <button className="text-[10px] text-white/30 hover:text-white transition-colors uppercase tracking-wider">
                Resend Code
            </button>
        </div>

      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <VerifyForm />
    </Suspense>
  );
}