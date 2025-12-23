"use client";
import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Sparkles, ArrowLeft, Mail, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const containerRef = useRef(null);
  const [email, setEmail] = useState("");
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
    setMessage("");

    try {
      await api.post('/auth/forgot-password', { email });
      setStatus("success");
      setMessage("Reset link sent! Check your inbox.");
    } catch (err: any) {
      setStatus("error");
      const msg = err.response?.data?.message || "Failed to send reset link. Please try again.";
      setMessage(msg);
    }
  };

  return (
    <main ref={containerRef} className="flex min-h-screen items-center justify-center relative bg-black overflow-hidden p-4">
      <div className="app-background opacity-40 fixed inset-0" />
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none fixed" />
      <div className="glass-card z-10 w-full max-w-md p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl relative">
        <Link href="/login" className="absolute top-6 left-6 text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center mb-8 form-item pt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4 border border-white/10">
            <Mail className="w-5 h-5 text-white/80" />
          </div>
          <h1 className="text-2xl font-medium tracking-wide text-white mb-2">Reset Password</h1>
          <p className="text-white/40 text-xs uppercase tracking-widest">
            Enter your email to receive a link
          </p>
        </div>
        {status === "success" ? (
           <div className="text-center form-item py-4">
               <div className="text-green-400 text-sm mb-4 bg-green-500/10 py-3 rounded-lg border border-green-500/20 flex items-center justify-center gap-2">
                   <CheckCircle2 className="w-4 h-4"/> {message}
               </div>
               <p className="text-white/30 text-xs mb-6">
                   Check your spam folder if you don't see it.
               </p>
               <Link href="/login" className="btn-primary inline-block w-full text-center bg-white text-black py-2 rounded-lg font-medium">
                   Back to Login
               </Link>
           </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6 form-item">
            <div className="group">
                <input
                type="email"
                placeholder="Enter your email"
                className="glass-input w-full bg-transparent border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-white/50 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </div>
            {status === "error" && (
                <p className="text-red-300 text-xs text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20 flex items-center justify-center gap-2">
                <AlertCircle className="w-3 h-3"/> {message}
                </p>
            )}
            <button 
                type="submit" 
                disabled={status === "loading"}
                className="btn-primary w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {status === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                    </>
                ) : "Send Reset Link"}
            </button>
            </form>
        )}
      </div>
    </main>
  );
}