"use client";
import { useState, useRef, Suspense } from "react"; 
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import api from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Lock, AlertCircle, CheckCircle2 } from "lucide-react";


function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token'); 
  
  const containerRef = useRef(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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


    if (password.length < 8) {
        setStatus("error");
        setMessage("Password must be at least 8 characters.");
        return;
    }

    if (password !== confirmPassword) {
        setStatus("error");
        setMessage("Passwords do not match.");
        return;
    }

    if (!token) {
        setStatus("error");
        setMessage("Invalid or missing reset token.");
        return;
    }


    try {
      await api.post("/auth/reset-password", { token, password });
      setStatus("success");
      setMessage("Password updated successfully!");

      setTimeout(() => router.push("/"), 2500);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.error || "Failed to reset password.");
    }
  };

  return (
    <main ref={containerRef} className="flex min-h-screen items-center justify-center relative bg-black overflow-hidden">
      
      <div className="app-background opacity-40 fixed inset-0" />
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-card z-10 w-full max-w-md p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        
        <div className="text-center mb-8 form-item pt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4 border border-white/10">
            <Lock className="w-5 h-5 text-white/80" />
          </div>
          <h1 className="text-2xl font-medium tracking-wide text-white mb-2">New Password</h1>
          <p className="text-white/40 text-xs uppercase tracking-widest">
            Create a secure password
          </p>
        </div>

        {status === "success" ? (
             <div className="text-center form-item py-8">
                 <div className="inline-flex p-4 rounded-full bg-green-500/10 mb-4 border border-green-500/20">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                 </div>
                 <h3 className="text-xl text-white font-medium mb-2">All Set!</h3>
                 <p className="text-white/40 text-sm">Redirecting to login...</p>
             </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-5 form-item">
            
            <div className="group">
                <input
                type="password"
                placeholder="New Password (min 8 chars)"
                className="glass-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />
            </div>

            <div className="group">
                <input
                type="password"
                placeholder="Confirm New Password"
                className="glass-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                />
            </div>

            {status === "error" && (
                <p className="text-red-300 text-xs text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20 flex items-center justify-center gap-2">
                   <AlertCircle className="w-3 h-3" /> {message}
                </p>
            )}

            <button 
                type="submit" 
                disabled={status === "loading"}
                className="btn-primary"
            >
                {status === "loading" ? "Resetting..." : "Set New Password"}
            </button>
            </form>
        )}
      </div>
    </main>
  );
}
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ResetForm />
    </Suspense>
  );
}