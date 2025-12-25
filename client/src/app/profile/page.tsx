"use client";
import { useEffect, useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { 
  ArrowLeft, User, Calendar, ShieldAlert, CheckCircle2, AlertTriangle, Trash2
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const containerRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

 
  const [profile, setProfile] = useState({ name: "", email: "", dob: "", gender: "" });
  
  
  const [security, setSecurity] = useState({ currentPassword: "", newPassword: "" });
  
  
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        let formattedDob = "";
        if (res.data.dob) {
            formattedDob = new Date(res.data.dob).toISOString().split('T')[0];
        }
        setProfile({ ...res.data, dob: formattedDob, gender: res.data.gender || "" });
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  
  useGSAP(() => {
    if (isLoading) return;
    const tl = gsap.timeline();
    
    tl.from(".glass-card", { y: 30, opacity: 0, duration: 1, ease: "power3.out" });
    tl.from(".form-group", { y: 20, opacity: 0, stagger: 0.1, duration: 0.8 }, "-=0.6");
  }, { scope: containerRef, dependencies: [isLoading] });

 
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await api.put("/auth/me", profile);
      setMessage({ type: "success", text: "Profile updated successfully" });
      localStorage.setItem("userName", profile.name);
    } catch (err: any) {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await api.post("/auth/change-password", security);
      setMessage({ type: "success", text: "Password changed successfully" });
      setSecurity({ currentPassword: "", newPassword: "" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to change password" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsSaving(true);
    try {
      await api.post("/auth/delete-account", { password: deletePassword });
      router.push("/");
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Incorrect password" });
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-black" />;

  return (
    
    <main ref={containerRef} className="min-h-screen bg-black text-white p-4 flex flex-col items-center relative overflow-y-auto">
      
      
      <div className="app-background opacity-30 fixed inset-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none fixed" />
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 z-10 mt-4">
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group">
          <div className="p-2 rounded-full border border-white/10 group-hover:bg-white/10 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium uppercase tracking-[0.2em]">Dashboard</span>
        </button>
        <h1 className="text-xl font-light tracking-widest uppercase">Settings</h1>
      </div>
      <div className="glass-card w-full !max-w-4xl p-8 z-10 mb-10">
        <div className="flex gap-6 border-b border-white/10 pb-4 mb-6">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`text-sm uppercase tracking-wider pb-1 transition-all ${activeTab === "profile" ? "text-white border-b-2 border-purple-500" : "text-white/40 hover:text-white"}`}
          >
            Profile
          </button>
          <button 
            onClick={() => setActiveTab("security")}
            className={`text-sm uppercase tracking-wider pb-1 transition-all ${activeTab === "security" ? "text-white border-b-2 border-red-500" : "text-white/40 hover:text-white"}`}
          >
            Security
          </button>
        </div>
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

       
        {activeTab === "profile" && (
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="form-group space-y-2">
                    <label className="text-xs text-white/50 uppercase tracking-wider">Email </label>
              <input type="email" value={profile.email} disabled className="glass-input opacity-50 cursor-not-allowed" />
            </div>

            <div className="form-group space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input 
                  type="text" 
                  value={profile.name} 
                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="glass-input pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="form-group space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input 
                    type="date" 
                    value={profile.dob} 
                                onChange={(e) => setProfile({...profile, dob: e.target.value})}
                    className="glass-input pl-10 scheme-dark"
                  />
                </div>
              </div>
              <div className="form-group space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">Gender</label>
                <select 
                  value={profile.gender} 
                            onChange={(e) => setProfile({...profile, gender: e.target.value})}
                  className="glass-input appearance-none"
                >
                  <option value="" className="bg-black text-white/50">Select...</option>
                  <option value="Male" className="bg-black">Male</option>
                  <option value="Female" className="bg-black">Female</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={isSaving} className="btn-primary w-auto px-8 py-3 text-sm">
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "security" && (
          <div className="space-y-8">
                
            <form onSubmit={handleChangePassword} className="space-y-6">
              <h3 className="text-lg font-light text-white mb-4">Change Password</h3>
              <div className="form-group space-y-2">
                <input 
                  type="password" 
                  placeholder="Current Password"
                  value={security.currentPassword}
                            onChange={(e) => setSecurity({...security, currentPassword: e.target.value})}
                  className="glass-input"
                />
              </div>
              <div className="form-group space-y-2">
                <input 
                  type="password" 
                            placeholder="New Password (min 8 chars)"
                  value={security.newPassword}
                            onChange={(e) => setSecurity({...security, newPassword: e.target.value})}
                  className="glass-input"
                />
              </div>
              <div className="flex justify-end">
                        <button type="submit" disabled={isSaving} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
                  Update Password
                </button>
              </div>
            </form>

            <div className="border-t border-red-500/20 pt-6">
              <h3 className="text-lg font-light text-red-400 mb-2 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5"/> Danger Zone
              </h3>
              <p className="text-white/40 text-xs mb-4">
                Deleting your account is permanent. All your journal entries will be wiped.
              </p>

              {!showDeleteConfirm ? (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
                >
                  Delete Account
                </button>
              ) : (
                <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/30 animate-in zoom-in-95 duration-200">
                  <p className="text-white/90 text-sm mb-4 font-medium">Enter your password to confirm deletion:</p>
                  <input 
                    type="password" 
                    placeholder="Your Password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="glass-input border-red-500/30 mb-4 focus:border-red-500"
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={!deletePassword || isSaving}
                      className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                                    <Trash2 className="w-4 h-4" />
                                    Confirm Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}