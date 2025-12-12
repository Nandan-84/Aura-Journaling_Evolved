"use client";
import { useEffect, useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Clock, Trash2, AlertTriangle, X } from "lucide-react";
import api from "@/lib/api";
import { MOOD_DATA } from "@/lib/mood-data";

const MOOD_VIDEOS: Record<string, string> = {
  happy: "/videos/happy.mp4",
  calm: "/videos/calm.mp4",
  energetic: "/videos/energetic.mp4",
  melancholic: "/videos/melancholic.mp4",
  neutral: "/videos/neutral.mp4",
};

export default function ViewJournalPage() {
  const router = useRouter();
  const params = useParams();
  const containerRef = useRef(null);
  
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const res = await api.get("/entries");
        const found = res.data.find((e: any) => e.id === params?.id);
        if (found) {
            setEntry(found);
        } else {
            router.push('/dashboard');
        }
      } catch (error) {
        console.error("Failed to load entry", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEntry();
  }, [params, router]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        await api.delete(`/entries/${entry.id}`);
        gsap.to(".journal-window", { scale: 0.9, opacity: 0, duration: 0.5, onComplete: () => router.push('/dashboard') });
    } catch (error) {
        console.error("Delete failed", error);
        setIsDeleting(false);
        setShowConfirm(false);
    }
  };

  const moodKey = entry?.mood?.toLowerCase() || "neutral";
  const currentMood = MOOD_DATA[moodKey] || MOOD_DATA["neutral"];
  const videoUrl = MOOD_VIDEOS[moodKey] || MOOD_VIDEOS["neutral"];

  useGSAP(() => {
    if (loading || !entry) return;
    const tl = gsap.timeline();

    tl.fromTo(".journal-window", 
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.2, ease: "power3.out" }
    );

    gsap.to(".wave-left", { scaleX: 1.2, opacity: 0.8, duration: 4, yoyo: true, repeat: -1, ease: "sine.inOut" });
    gsap.to(".wave-right", { scaleX: 1.2, opacity: 0.8, duration: 4, yoyo: true, repeat: -1, delay: 1, ease: "sine.inOut" });

    tl.fromTo(".content-area", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, "-=0.5");

  }, { scope: containerRef, dependencies: [loading, entry] });

  if (loading) return <div className="min-h-screen bg-black" />;
  if (!entry) return null;

  return (
    <main ref={containerRef} className="fixed inset-0 bg-black text-white flex items-center justify-center z-50 overflow-hidden">
      
      <div className="journal-window relative bg-[#050505] w-full h-full flex flex-col items-center justify-center overflow-hidden">
        
        <div className="absolute inset-0 pointer-events-none z-10"
             style={{ maskImage: 'radial-gradient(circle at center, transparent 40%, black 100%)', WebkitMaskImage: 'radial-gradient(circle at center, transparent 40%, black 100%)' }}>
             <div className={`wave-top absolute top-0 left-0 right-0 h-[40vh] bg-gradient-to-b ${currentMood.color} to-transparent opacity-40 blur-[80px]`} />
             <div className={`wave-bottom absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t ${currentMood.color} to-transparent opacity-40 blur-[80px]`} />
             <div className={`wave-left absolute top-0 bottom-0 left-0 w-[30vw] bg-gradient-to-r ${currentMood.color} to-transparent opacity-40 blur-[80px]`} />
             <div className={`wave-right absolute top-0 bottom-0 right-0 w-[30vw] bg-gradient-to-l ${currentMood.color} to-transparent opacity-40 blur-[80px]`} />
        </div>

        <div className="absolute top-8 left-8 z-30">
            <button 
                onClick={() => router.push('/dashboard')} 
                className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group"
            >
                <div className="p-2 rounded-full border border-white/10 group-hover:bg-white/10 transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium uppercase tracking-[0.2em]">Dashboard</span>
            </button>
        </div>

        <div className="content-area relative z-20 w-full max-w-5xl h-[70vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl mt-12">
            
            <div className="absolute inset-0 z-0 bg-black">
                 <video 
                    autoPlay loop muted playsInline
                    className="w-full h-full object-cover opacity-60" 
                    src={videoUrl}
                />
            </div>
            <div className="absolute inset-0 z-10 bg-black/20" /> 

            <div className="relative z-20 w-full h-full flex flex-col p-12 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
                
                <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-light text-white mb-2">{entry.mood} Reflection</h1>
                        <p className="text-xs text-white/40 uppercase tracking-[0.2em]">
                           {new Date(entry.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-white/40 text-xs font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(entry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>

                <div 
                    className="text-xl leading-relaxed font-light text-white/90"
                    dangerouslySetInnerHTML={{ __html: entry.content }}
                />

            </div>
        </div>

        <div className="absolute bottom-8 right-8 z-30">
            <button 
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all text-xs font-bold uppercase tracking-wider backdrop-blur-md"
            >
                <Trash2 className="w-4 h-4" />
                Delete Entry
            </button>
        </div>

        {showConfirm && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#111] border border-white/10 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">Delete Journal?</h3>
                    <p className="text-white/50 text-sm mb-8 leading-relaxed">
                        This action cannot be undone. This memory will be lost in time forever.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setShowConfirm(false)}
                            className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors"
                        >
                            {isDeleting ? "Deleting..." : "Yes, Delete"}
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </main>
  );
}