"use client";
import { useEffect, useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import { 
  CloudRain, Zap, Coffee, Sun, Smile, LogOut, 
  ChevronLeft, ChevronRight, BookOpen, User
} from "lucide-react";
import api from "@/lib/api";

const MOODS = [
  { id: "happy", label: "Happy", icon: Sun, color: "text-amber-300", gradient: "from-amber-300 to-orange-500" },
  { id: "calm", label: "Calm", icon: Coffee, color: "text-emerald-300", gradient: "from-emerald-300 to-teal-500" },
  { id: "energetic", label: "Energetic", icon: Zap, color: "text-rose-400", gradient: "from-rose-400 to-red-600" },
  { id: "melancholic", label: "Melancholic", icon: CloudRain, color: "text-indigo-300", gradient: "from-indigo-300 to-purple-500" },
  { id: "neutral", label: "Just Okay", icon: Smile, color: "text-gray-300", gradient: "from-gray-200 to-gray-400" },
];

const GREETING_PREFIXES = ["Welcome", "Greetings", "Hey there", "ನಮಸ್ಕಾರ", "Bonjour", "Ciao", "Hola", "नमस्ते"];

export default function Dashboard() {
  const router = useRouter();
  const containerRef = useRef(null);
  
  const [name, setName] = useState(""); 
  const [greetingPrefix, setGreetingPrefix] = useState("");
  const [timeString, setTimeString] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [hasEntryToday, setHasEntryToday] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [viewedEntry, setViewedEntry] = useState<any>(null);

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    setName(savedName || "Traveler");
    setGreetingPrefix(GREETING_PREFIXES[Math.floor(Math.random() * GREETING_PREFIXES.length)]);

    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase().replace(/,/g, '');
      const hours = now.getHours() % 12 || 12;
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      setTimeString(`${datePart}, ${hours} ${minutes} ${seconds} ${ampm}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    const checkEntries = async () => {
      try {
        const res = await api.get("/entries");
        const allEntries = res.data;
        setEntries(allEntries);

        if (allEntries.length > 0) {
          const latestDate = new Date(allEntries[0].createdAt).toDateString();
          const today = new Date().toDateString();
          if (latestDate === today) {
            setHasEntryToday(true);
            setViewedEntry(allEntries[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load entries", error);
      } finally {
        setLoading(false);
      }
    };

    checkEntries();
    return () => clearInterval(timer);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay, year, month };
  };

  const { days, firstDay, year, month } = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEntryForDay = (day: number) => {
    return entries.find(e => {
      const d = new Date(e.createdAt);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const handleDayClick = (entry: any) => {
    if (entry) {
      router.push(`/journal/view/${entry.id}`);
    }
  };

  useGSAP(() => {
    if (loading) return;
    const tl = gsap.timeline();

    tl.to([".hero-text", ".clock-text"], { y: 0, autoAlpha: 1, stagger: 0.1, duration: 1, ease: "power3.out" });

    if (hasEntryToday) {
      tl.from(".history-container", { y: 30, opacity: 0, duration: 0.8, ease: "back.out(1.2)" }, "-=0.5");
    } else {
      tl.to([".subtitle-text", ".mood-grid"], { y: 0, autoAlpha: 1, stagger: 0.2, duration: 1, ease: "power3.out" }, "-=0.6");
    }
  }, { scope: containerRef, dependencies: [loading, hasEntryToday] });

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      localStorage.removeItem("userName");
      router.push("/");
    }
  };

  if (loading) return <div className="min-h-screen bg-black" />;

  return (
    <main ref={containerRef} className="min-h-screen relative overflow-y-auto bg-black text-white flex flex-col items-center justify-center py-6 px-6">
      <div className="app-background opacity-30 fixed inset-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none fixed" />

      <button 
        onClick={() => router.push('/profile')}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all z-50 group"
      >
        <User className="w-5 h-5 text-white/50 group-hover:text-white" />
      </button>

      <div className="center-content text-center z-10 flex flex-col items-center w-full max-w-5xl mb-8 mt-2">
        <h1 className="hero-text invisible opacity-0 translate-y-4 text-4xl md:text-6xl font-medium tracking-tight mb-3">
          <span className="bg-clip-text text-transparent bg-linear-to-r from-purple-400 via-pink-500 to-orange-400 font-bold">
            {hasEntryToday ? "Welcome Back" : greetingPrefix}
          </span>
          <span className="text-white/20">, </span>
          <span className="text-white">{name}!</span>
        </h1>
        <div className="clock-text invisible opacity-0 translate-y-4 text-lg md:text-xl font-mono font-medium tracking-[0.2em] text-gray-400 opacity-90">
          {timeString}
        </div>
      </div>

      {!hasEntryToday ? (
        <div className="w-full max-w-7xl z-10 px-4 flex flex-col items-center pb-20">
          <div className="subtitle-text invisible opacity-0 translate-y-4 h-12 flex items-center justify-center mb-8">
            <p className="text-2xl md:text-3xl text-gray-500 font-light tracking-wide">
              How are you feeling today?
              <span className="animate-pulse ml-1 text-gray-700">|</span>
            </p>
          </div>

          <div className="mood-grid invisible opacity-0 translate-y-8 w-full grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => router.push(`/journal/${mood.id}`)}
                className="group relative h-72 w-full text-left transition-all duration-500 hover:-translate-y-3 cursor-pointer"
              >
                <div className="absolute inset-0 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl transition-all duration-500 group-hover:bg-white/10 group-hover:border-white/40 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.1)]"></div>
                <div className="relative h-full flex flex-col items-center justify-center p-6 z-10 text-center">
                  <div className="p-5 rounded-full bg-white/5 mb-6 backdrop-blur-md border border-white/10 group-hover:border-white/50 transition-all duration-500 group-hover:scale-110 shadow-lg">
                    <mood.icon className={`w-10 h-10 ${mood.color} opacity-90 group-hover:opacity-100 transition-all duration-500`} />
                  </div>
                  <h3 className="text-xl font-medium tracking-wider text-white/70 group-hover:text-white transition-colors">{mood.label}</h3>
                  <div className={`h-1 w-0 group-hover:w-16 bg-linear-to-r ${mood.gradient} mt-6 transition-all duration-500 ease-out rounded-full opacity-100`}></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="history-container w-full max-w-4xl z-10 flex flex-col items-center pb-12">
          <p className="text-white/40 text-sm uppercase tracking-[0.3em] mb-4 animate-pulse">
            You&apos;ve already journaled today
          </p>

          <h2 className="text-2xl font-light text-white mb-5 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-purple-400" />
            Go back in time
          </h2>

          <div className="w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6 px-2">
              <span className="text-xl font-medium text-white tracking-wide uppercase">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors border border-white/5">
                  <ChevronLeft className="w-5 h-5 text-white/70"/>
                </button>
                <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors border border-white/5">
                  <ChevronRight className="w-5 h-5 text-white/70"/>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-3">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-center text-xs text-white/30 font-bold uppercase tracking-widest">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-14 md:h-16" />
              ))}

              {Array.from({ length: days }).map((_, i) => {
                const day = i + 1;
                const entry = getEntryForDay(day);
                const isToday =
                  day === new Date().getDate() &&
                  month === new Date().getMonth() &&
                  year === new Date().getFullYear();

                return (
                  <div key={day} className="relative group h-14 md:h-16">
                    <button
                      onClick={() => handleDayClick(entry)}
                      disabled={!entry}
                      className={`w-full h-full rounded-xl flex flex-col items-center justify-center transition-all duration-300
                        ${entry
                          ? "bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 hover:-translate-y-1 shadow-lg"
                          : "bg-white/[0.02] border border-white/5 text-white/20 cursor-default"
                        }
                        ${isToday && !entry ? "border-dashed border-white/20 bg-white/[0.05]" : ""}
                      `}
                    >
                      <span className={`text-sm font-medium ${entry ? "text-white" : "text-white/20"}`}>{day}</span>
                      {entry && (
                        <div className="mt-1.5 h-1 w-4 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-60 group-hover:w-8 group-hover:opacity-100 transition-all duration-300" />
                      )}
                    </button>

                    {!entry && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg text-xs text-white/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        No entry
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={handleLogout}
        className="fixed bottom-8 left-8 p-4 rounded-full bg-white/5 hover:bg-red-900/20 border border-white/10 hover:border-red-500/30 transition-all duration-300 group backdrop-blur-md z-50 cursor-pointer"
      >
        <LogOut className="w-6 h-6 text-white/30 group-hover:text-red-400" />
      </button>
    </main>
  );
}
