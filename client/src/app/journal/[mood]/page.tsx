"use client";
import { useEffect, useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRouter, useParams } from "next/navigation"; 
import { MOOD_DATA } from "@/lib/mood-data";
import { 
  ArrowLeft, Save, Music, Play, Pause, Bold, Italic, Underline, 
  Volume2, VolumeX, Plus, Search, X, Disc, ListMusic, SkipBack, SkipForward, Trash2, CheckCircle2, Loader2
} from "lucide-react";
import api from "@/lib/api";
import YouTube from "react-youtube";

const RANDOM_GREETINGS: Record<string, string[]> = {
  happy: [
    "What made you smile today?",
    "Capture this joy, keep it forever.",
    "Tell me about your win.",
    "Happiness looks good on you."
  ],
  calm: [
    "Breathe in. What's on your mind?",
    "Slow down. The world can wait.",
    "Peace is a priority today.",
    "Find your center. Write it down."
  ],
  energetic: [
    "Let's channel that energy! What's next?",
    "You're on fire today. Document it.",
    "Momentum is building. What are you creating?",
    "Full speed ahead."
  ],
  melancholic: [
    "It's okay to feel this way. Write it out.",
    "Rain brings growth. Let it out.",
    "This is a safe space for your thoughts.",
    "Healing starts with feeling."
  ],
  neutral: [
    "Tell me about your day.",
    "Just a regular day? Let's log it.",
    "Clear your mind.",
    "One day at a time."
  ]
};

const isPlaylistId = (id: string) => id.startsWith("PL") || id.startsWith("RD") || id.startsWith("UU");

export default function JournalPage() {
  const router = useRouter();
  const params = useParams(); 
  const containerRef = useRef(null);
  const playerRef = useRef<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null); 
  
  const moodKey = (typeof params?.mood === 'string' ? params.mood : "neutral");
  
  const [content, setContent] = useState("");
  const [isPlaying, setIsPlaying] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false); 
  const [displayedGreeting, setDisplayedGreeting] = useState("");
  const [finalGreeting, setFinalGreeting] = useState(""); 
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const [volume, setVolume] = useState(40);
  const [isMuted, setIsMuted] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [currentTrackTitle, setCurrentTrackTitle] = useState(""); 
  
  const [formats, setFormats] = useState({ bold: false, italic: false, underline: false });
  
  const [queue, setQueue] = useState<string[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isQueueMode, setIsQueueMode] = useState(false); 

  const MOOD_VIDEOS: Record<string, string> = {
    happy: "/videos/happy.mp4",
    calm: "/videos/calm.mp4",
    energetic: "/videos/energetic.mp4",
    melancholic: "/videos/melancholic.mp4",
    neutral: "/videos/neutral.mp4",
  };

  const MOOD_CARETS: Record<string, string> = {
    happy: "caret-amber-400",
    calm: "caret-emerald-400",
    energetic: "caret-rose-500",
    melancholic: "caret-indigo-400",
    neutral: "caret-gray-400",
  };

  const currentMood = MOOD_DATA?.[moodKey] || MOOD_DATA?.["neutral"] || { 
    label: "Neutral", 
    color: "from-gray-500 to-gray-600", 
    greeting: "Welcome back.",
    playlistId: "jfKfPfyJRdk" 
  };
  
  const videoUrl = MOOD_VIDEOS[moodKey] || MOOD_VIDEOS["neutral"];
  const caretColorClass = MOOD_CARETS[moodKey] || "caret-white";

  const LOOP_START_POINT = 2.0; 

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0 && duration - currentTime < 0.3) {
        videoRef.current.currentTime = LOOP_START_POINT;
        videoRef.current.play();
    }
  };

  const handleVideoEnded = () => {
    if (videoRef.current) {
        videoRef.current.currentTime = LOOP_START_POINT;
        videoRef.current.play();
    }
  };

  const handleVideoPlay = () => {
    setVideoLoaded(true);
  };

  useEffect(() => {
    setDisplayedGreeting("");
    setIsTypingComplete(false);

    const options = RANDOM_GREETINGS[moodKey] || RANDOM_GREETINGS["neutral"];
    const textToType = options[Math.floor(Math.random() * options.length)];
    setFinalGreeting(textToType);

    let i = 0;
    const startDelay = setTimeout(() => {
      const typeWriter = setInterval(() => {
        setDisplayedGreeting(textToType.slice(0, i + 1));
        i++;
        if (i > textToType.length) {
          clearInterval(typeWriter);
          setTimeout(() => setIsTypingComplete(true), 500);
        }
      }, 50);
      return () => clearInterval(typeWriter);
    }, 1500);

    return () => clearTimeout(startDelay);
  }, [moodKey]);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(".journal-window", 
      { width: "20rem", height: "24rem", borderRadius: "2rem", opacity: 0 },
      { width: "100vw", height: "100vh", borderRadius: "0rem", opacity: 1, duration: 1.4, ease: "expo.inOut" }
    );
    gsap.to(".wave-top", { y: "15%", scaleY: 1.2, duration: 3, yoyo: true, repeat: -1, ease: "sine.inOut" });
    gsap.to(".wave-bottom", { y: "-15%", scaleY: 1.2, duration: 4, yoyo: true, repeat: -1, delay: 0.5, ease: "sine.inOut" });
    gsap.to(".wave-left", { x: "15%", scaleX: 1.2, duration: 3.5, yoyo: true, repeat: -1, delay: 0.2, ease: "sine.inOut" });
    gsap.to(".wave-right", { x: "-15%", scaleX: 1.2, duration: 3.2, yoyo: true, repeat: -1, delay: 0.8, ease: "sine.inOut" });
    tl.fromTo([".mini-player", ".volume-control"], { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.2 }, "+=0.5");
  }, { scope: containerRef });

  useGSAP(() => {
    if (isTypingComplete) {
      const tl = gsap.timeline();
      tl.to(".greeting-container", { top: "14%", scale: 0.7, duration: 1, ease: "power3.inOut" });
      tl.to([".glass-editor-box", ".top-controls"], { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power2.out" }, "-=0.5");
    }
  }, { scope: containerRef, dependencies: [isTypingComplete] });

  useGSAP(() => {
    if (isSaved) {
      const tl = gsap.timeline();
      tl.to([".top-controls", ".mini-player", ".volume-control", ".greeting-container"], {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out"
      });
      tl.to(".glass-editor-box", {
        scale: 0.8,
        opacity: 0,
        y: -50,
        duration: 0.6,
        ease: "back.in(1.7)"
      }, "-=0.3");
      tl.fromTo(".saved-success", 
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }
      );
    }
  }, { scope: containerRef, dependencies: [isSaved] });

  const fadeOutMusic = (callback: () => void) => {
    if (!playerRef.current) {
        callback();
        return;
    }
    const volObj = { val: volume };
    gsap.to(volObj, {
        val: 0,
        duration: 1.5, 
        ease: "linear",
        onUpdate: () => {
            if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
                playerRef.current.setVolume(volObj.val);
            }
        },
        onComplete: () => {
            callback();
        }
    });
  };

  const updateTrackTitle = (target: any) => {
    if (target && typeof target.getVideoData === 'function') {
      const data = target.getVideoData();
      if (data && data.title) {
        setCurrentTrackTitle(data.title);
        return;
      }
    }
    setCurrentTrackTitle(isQueueMode ? `Track ${queueIndex + 1}` : `${currentMood.label} Vibe`);
  };

  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(volume);
    if (isMuted) playerRef.current.mute();
    event.target.playVideo(); 
    setIsPlaying(true);
    updateTrackTitle(event.target);
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === 1) {
        setIsPlaying(true);
        updateTrackTitle(event.target);
    }
    if (event.data === 2) setIsPlaying(false);
    if (event.data === 0 && isQueueMode) {
        if (queueIndex < queue.length - 1) {
            setQueueIndex(prev => prev + 1);
        } else {
            setQueue([]);
            setIsQueueMode(false);
            setQueueIndex(0);
        }
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleNextTrack = () => {
    if (isQueueMode) {
      if (queue.length > 0) {
        if (queueIndex < queue.length - 1) {
          setQueueIndex((prev) => prev + 1);
        } else {
          setQueue([]);
          setIsQueueMode(false);
          setQueueIndex(0);
        }
      }
    } else {
      if (playerRef.current) playerRef.current.nextVideo();
    }
  };

  const handlePrevTrack = () => {
    if (isQueueMode) {
      if (queue.length > 0) {
        if (queueIndex > 0) {
          setQueueIndex((prev) => prev - 1);
        }
      }
    } else {
      if (playerRef.current) playerRef.current.previousVideo();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
    }
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      playerRef.current?.unMute();
    }
  };

  const addToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;

    let videoId = inputUrl;
    if (inputUrl.includes("v=")) {
      videoId = inputUrl.split("v=")[1].split("&")[0];
    } else if (inputUrl.includes("youtu.be/")) {
      videoId = inputUrl.split("youtu.be/")[1];
    }

    const newQueue = [...queue, videoId];
    setQueue(newQueue);
    setInputUrl("");
    
    if (!isQueueMode || queue.length === 0) {
        setIsQueueMode(true);
        setQueueIndex(newQueue.length - 1); 
        if(queue.length === 0) setQueueIndex(0);
    }
  };

  const removeFromQueue = (indexToRemove: number) => {
    const newQueue = [...queue];
    newQueue.splice(indexToRemove, 1);
    setQueue(newQueue);

    if (newQueue.length === 0) {
      setIsQueueMode(false);
      setQueueIndex(0);
      return;
    }

    if (indexToRemove < queueIndex) {
      setQueueIndex(queueIndex - 1);
    } else if (indexToRemove === queueIndex) {
        if (queueIndex >= newQueue.length) {
            setQueueIndex(0);
        }
    }
  };

  const checkFormats = () => {
    setFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  };

  const handleFormat = (command: string) => {
    document.execCommand(command, false, undefined);
    if (editorRef.current) {
       editorRef.current.focus();
    }
    checkFormats();
  };

  const handleSave = async () => {
    const htmlContent = editorRef.current?.innerHTML || "";
    if (!editorRef.current?.innerText.trim()) return;
    
    setIsSaving(true);
    
    try {
      await api.post("/entries", { content: htmlContent, mood: currentMood.label });
      triggerSuccess();
    } catch (error) {
      triggerSuccess();
    }
  };

  const triggerSuccess = () => {
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => {
        fadeOutMusic(() => {
            router.push("/dashboard");
        });
    }, 1500);
  };

  const handleExit = () => {
      fadeOutMusic(() => {
          router.push("/dashboard");
      });
  };

  return (
    <main ref={containerRef} className="fixed inset-0 bg-black text-white flex items-center justify-center z-50 overflow-hidden">
      <div className="fixed bottom-0 right-0 z-[-10] opacity-[0.01] pointer-events-none">
        {isQueueMode && queue.length > 0 ? (
           <YouTube
             key={`queue-${queue[queueIndex]}`} 
             videoId={queue[queueIndex]}
             opts={{ height: '200', width: '200', playerVars: { autoplay: 1, controls: 0 } }}
             onReady={onPlayerReady}
             onStateChange={onPlayerStateChange}
           />
        ) : (
           isPlaylistId(currentMood.playlistId) ? (
             <YouTube
               key={`default-${currentMood.playlistId}`} 
               opts={{
                 height: '200', 
                 width: '200',
                 playerVars: { 
                   listType: 'playlist', 
                   list: currentMood.playlistId, 
                   autoplay: 1, 
                   controls: 0, 
                   loop: 1 
                 },
               }}
               onReady={onPlayerReady}
               onStateChange={onPlayerStateChange}
             />
           ) : (
             <YouTube
               key={`default-single-${currentMood.playlistId}`} 
               videoId={currentMood.playlistId}
               opts={{
                 height: '200', 
                 width: '200',
                 playerVars: { 
                   autoplay: 1, 
                   controls: 0, 
                   loop: 1,
                   playlist: currentMood.playlistId 
                 },
               }}
               onReady={onPlayerReady}
               onStateChange={onPlayerStateChange}
             />
           )
        )}
      </div>

      <div className="journal-window relative bg-[#050505] w-full h-full flex flex-col items-center justify-center overflow-hidden">
        
        <div className="absolute inset-0 pointer-events-none z-10"
             style={{ 
                 maskImage: 'radial-gradient(circle at center, transparent 40%, black 100%)',
                 WebkitMaskImage: 'radial-gradient(circle at center, transparent 40%, black 100%)'
             }}>
             <div className={`wave-top absolute top-0 left-0 right-0 h-[40vh] bg-gradient-to-b ${currentMood.color} to-transparent opacity-40 blur-[80px]`} />
             <div className={`wave-bottom absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t ${currentMood.color} to-transparent opacity-40 blur-[80px]`} />
             <div className={`wave-left absolute top-0 bottom-0 left-0 w-[30vw] bg-gradient-to-r ${currentMood.color} to-transparent opacity-40 blur-[80px]`} />
             <div className={`wave-right absolute top-0 bottom-0 right-0 w-[30vw] bg-gradient-to-l ${currentMood.color} to-transparent opacity-40 blur-[80px]`} />
        </div>

        {isSaved && (
          <div className="saved-success absolute inset-0 z-50 flex flex-col items-center justify-center">
            <div className="p-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-2xl shadow-green-500/20">
              <CheckCircle2 className="w-16 h-16 text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
            </div>
            <h2 className="text-4xl font-light tracking-[0.2em] text-white/90">SAVED</h2>
            <p className="text-white/40 text-sm mt-4 tracking-widest uppercase">Returning to Dashboard...</p>
          </div>
        )}

        <div className="top-controls opacity-0 translate-y-4 absolute top-8 right-8 z-30 flex items-center gap-3">
            <button onClick={toggleMute} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all active:scale-95 text-white/70 hover:text-white">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all active:scale-95 text-white/70 hover:text-white">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {isQueueMode && (
                <>
                    <button onClick={handlePrevTrack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all active:scale-95 text-white/70 hover:text-white animate-in zoom-in duration-300">
                        <SkipBack className="w-4 h-4" />
                    </button>
                    <button onClick={handleNextTrack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all active:scale-95 text-white/70 hover:text-white animate-in zoom-in duration-300">
                        <SkipForward className="w-4 h-4" />
                    </button>
                </>
            )}

            <button 
              onClick={() => setShowQueue(!showQueue)} 
              className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all active:scale-95 ${showQueue ? "bg-white/20 text-white" : "text-white/70 hover:text-white"}`}
            >
                {showQueue ? <X className="w-4 h-4" /> : <ListMusic className="w-4 h-4" />}
            </button>
        </div>

        <div className="top-controls opacity-0 translate-y-4 absolute top-8 left-8 z-30">
            <button 
                onClick={handleExit} 
                className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group"
            >
                <div className="p-2 rounded-full border border-white/10 group-hover:bg-white/10 transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium uppercase tracking-[0.2em]">Dashboard</span>
            </button>
        </div>

        <div className="volume-control opacity-0 absolute right-8 top-1/2 -translate-y-1/2 z-30 h-48 w-10 flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 rounded-full shadow-lg">
             <div className="relative w-full h-full flex items-center justify-center">
                <input 
                  type="range" min="0" max="100" value={volume} onChange={handleVolumeChange}
                  className="absolute w-32 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer hover:bg-white/40 accent-white transition-all -rotate-90 origin-center outline-none"
                />
             </div>
        </div>

        {showQueue && (
            <div className="absolute top-24 right-8 z-40 w-72 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-2 mb-4 text-white/50 text-xs uppercase tracking-wider border-b border-white/10 pb-2">
                    <ListMusic className="w-3 h-3" />
                    <span>Queue</span>
                </div>
                <form onSubmit={addToQueue} className="flex gap-2 mb-4">
                    <input 
                      type="text" placeholder="Paste YouTube URL..." 
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/30"
                      value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} autoFocus
                    />
                    <button type="submit" className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </form>
                <div className="max-h-40 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                    {!isQueueMode && (
                        <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentMood.color} animate-pulse`} />
                            <span className="text-xs text-white/80 truncate">{currentMood.label} Vibe</span>
                        </div>
                    )}
                    {queue.map((trackId, index) => (
                        <div key={index} className={`flex items-center justify-between gap-3 p-2 rounded-lg border ${index === queueIndex && isQueueMode ? "bg-white/10 border-white/20" : "bg-transparent border-transparent hover:bg-white/5"}`}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-[10px] text-white/30 font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                                <span className="text-xs text-white/70 truncate flex-1">Track ID: {trackId.substring(0, 8)}...</span>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); removeFromQueue(index); }}
                                className="text-white/30 hover:text-red-400 transition-colors p-1"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {queue.length === 0 && !isQueueMode && (
                        <p className="text-[10px] text-white/30 text-center py-2">Queue is empty</p>
                    )}
                </div>
            </div>
        )}

        <div className="editor-container relative z-20 w-full max-w-7xl px-4 h-full flex flex-col items-center justify-center">
            
            <div className="greeting-container absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 text-center w-full px-8 pointer-events-none">
                <h1 className="text-4xl md:text-6xl font-light text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight drop-shadow-2xl leading-tight pb-2">
                    {displayedGreeting}
                    <span className="inline-block w-1 h-8 md:h-12 ml-1 align-middle bg-white/50 animate-pulse" />
                </h1>
            </div>

            <div className="glass-editor-box opacity-0 translate-y-8 relative w-full max-w-5xl h-[60vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl mt-32">
                <div className="absolute inset-0 z-0 bg-black">
                    <video 
                        ref={videoRef}
                        key={videoUrl} 
                        autoPlay 
                        loop 
                        muted 
                        preload="auto" 
                        playsInline
                        className="w-full h-full object-cover transition-opacity duration-1000" 
                        style={{ opacity: 0.6 }} 
                        onTimeUpdate={handleVideoTimeUpdate} 
                        onEnded={handleVideoEnded}
                        onPlay={handleVideoPlay}
                    >
                        <source src={videoUrl} type="video/mp4" />
                    </video>
                </div>
                
                <div className="absolute inset-0 z-10 bg-black/5" /> 

                <div className="relative z-20 w-full h-full flex flex-col p-8 md:p-12">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
                        <button 
                            onMouseDown={(e) => { e.preventDefault(); handleFormat('bold'); }}
                            className={`p-2 rounded-lg transition-colors ${formats.bold ? 'bg-white text-black' : 'hover:bg-white/10 text-white/70 hover:text-white'}`} 
                            title="Bold"
                        >
                            <Bold className="w-4 h-4" />
                        </button>
                        <button 
                            onMouseDown={(e) => { e.preventDefault(); handleFormat('italic'); }}
                            className={`p-2 rounded-lg transition-colors ${formats.italic ? 'bg-white text-black' : 'hover:bg-white/10 text-white/70 hover:text-white'}`} 
                            title="Italic"
                        >
                            <Italic className="w-4 h-4" />
                        </button>
                        <button 
                            onMouseDown={(e) => { e.preventDefault(); handleFormat('underline'); }}
                            className={`p-2 rounded-lg transition-colors ${formats.underline ? 'bg-white text-black' : 'hover:bg-white/10 text-white/70 hover:text-white'}`} 
                            title="Underline"
                        >
                            <Underline className="w-4 h-4" />
                        </button>
                        <div className="flex-1" />
                        <span className="text-xs uppercase tracking-widest text-white/30">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>

                    <div 
                        ref={editorRef}
                        contentEditable
                        className={`flex-1 w-full bg-transparent outline-none text-xl md:text-2xl leading-relaxed text-white/90 placeholder-white/30 font-light ${caretColorClass} overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline`}
                        style={{ minHeight: '200px' }}
                        onInput={(e) => {
                            setContent(e.currentTarget.innerHTML);
                            checkFormats();
                        }}
                        onKeyUp={checkFormats}
                        onMouseUp={checkFormats}
                        onTouchEnd={checkFormats}
                    />
                </div>
            </div>

            <div className="glass-editor-box opacity-0 translate-y-8 mt-8">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="group relative px-12 py-4 bg-white text-black rounded-xl font-bold uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <span className="relative flex items-center gap-3">
                        {isSaving ? "Saving..." : "Save Entry"}
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                    </span>
                </button>
            </div>

        </div>

        <div className="mini-player opacity-0 absolute bottom-8 right-8 z-40">
            <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10 pr-6 pl-2 py-2 rounded-full shadow-2xl">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${currentMood.color} ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                    <Disc className="w-5 h-5 text-white/80" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
                        {isQueueMode ? "From Queue" : "Mood Vibe"}
                    </span>
                    <span className="text-xs text-white/90 font-medium truncate max-w-[150px]">
                        {isQueueMode ? (currentTrackTitle || "Loading...") : `${currentMood.label} Vibe`}
                    </span>
                </div>
                {isPlaying && (
                    <div className="flex items-end gap-[2px] h-4 ml-2">
                        <span className="w-1 bg-white/50 rounded-t-sm animate-[bounce_0.8s_infinite] h-2"></span>
                        <span className="w-1 bg-white/50 rounded-t-sm animate-[bounce_1.2s_infinite] h-4"></span>
                        <span className="w-1 bg-white/50 rounded-t-sm animate-[bounce_1.0s_infinite] h-3"></span>
                    </div>
                )}
            </div>
        </div>

      </div>
    </main>
  );
}