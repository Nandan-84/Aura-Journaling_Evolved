"use client";
import { useEffect, useState, useRef } from "react";
import { 
  ArrowLeft, Save, Music, Play, Pause, Bold, Italic, Underline, 
  Volume2, VolumeX, Plus, Search, X, Disc, ListMusic, SkipBack, SkipForward, Trash2, CheckCircle2, Loader2, AlertCircle, AlertTriangle, Sparkles, ChevronRight, ChevronLeft
} from "lucide-react";


import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRouter, useParams } from "next/navigation"; 
import { MOOD_DATA } from "@/lib/mood-data";
import api from "@/lib/api";
import YouTube from "react-youtube";

const RANDOM_GREETINGS: Record<string, string[]> = {
  happy: ["What made you smile today?", "Capture this joy, keep it forever.", "Tell me about your win.", "Happiness looks good on you.", "What made this feeling stick?", "Let this one stay a little longer.", "You’re allowed to enjoy this.", "Hold onto what worked today."],
  calm: ["Breathe in. What's on your mind?", "Slow down. The world can wait.", "Peace is a priority today.", "Find your center. Write it down.", "What helped things feel steady?", "It’s okay to move slowly.", "Nothing needs fixing right now.", "This quiet counts too."],
  energetic: ["Let's channel that energy! What's next?", "You're on fire today. Document it.", "Momentum is building. What are you creating?", "Full speed ahead.", "Where did all this drive come from?", "Use it while it’s here.", "Follow the momentum.", "Let yourself go all in."],
  melancholic: ["It's okay to feel this way. Write it out.", "Rain brings growth. Let it out.", "This is a safe space for your thoughts.", "Healing starts with feeling.", "What’s been sitting with you?", "You don’t have to rush through this.", "It’s okay to feel this way.", "Let the weight speak."],
  neutral: ["Tell me about your day.", "Just a regular day? Let's log it.", "Clear your mind.", "One day at a time.", "What filled the space today?", "You showed up, that’s enough.", "No highs, no lows, still valid."]
};

const isPlaylistId = (id: string) => !id.includes(',') && (id.startsWith("PL") || id.startsWith("RD") || id.startsWith("UU"));
const FALLBACK_VIDEO_ID = "9Ru99TAQAiw"; 

interface QueueItem {
    id: string;
    title: string;
    isCustom: boolean;
}

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
  const [isAddingToQueue, setIsAddingToQueue] = useState(false); 
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  const [volume, setVolume] = useState(40);
  const [isMuted, setIsMuted] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [currentTrackTitle, setCurrentTrackTitle] = useState(""); 
  
  const [formats, setFormats] = useState({ bold: false, italic: false, underline: false });
  
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isQueueMode, setIsQueueMode] = useState(false); 
  
  const [queueView, setQueueView] = useState<'my_queue' | 'suggestions'>('suggestions');

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

  const currentMood = MOOD_DATA[moodKey] || MOOD_DATA["neutral"];
  
  const [activeVideoId, setActiveVideoId] = useState(currentMood.playlistId);

  useEffect(() => {
      setActiveVideoId(currentMood.playlistId);
  }, [moodKey, currentMood.playlistId]);
  
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

  const fadeInMusic = () => {
    if (!playerRef.current) return;
    playerRef.current.setVolume(0);
    const volObj = { val: 0 };
    
    gsap.to(volObj, {
        val: volume, 
        duration: 3, 
        ease: "power2.out",
        onUpdate: () => {
            if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
                playerRef.current.setVolume(volObj.val);
            }
        }
    });
  };

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
    if (isQueueMode) {
        if (queue[queueIndex]) {
            setCurrentTrackTitle(queue[queueIndex].title);
        }
    } else {
        if (target && typeof target.getVideoData === 'function') {
            const data = target.getVideoData();
            if (data && data.title) {
                setCurrentTrackTitle(data.title);
                return;
            }
        }
        setCurrentTrackTitle(`${currentMood.label} Vibe`);
    }
  };

  useEffect(() => {
    setQueue([]);
    setQueueIndex(0);
    setIsQueueMode(false);
    setQueueView('suggestions');

    const playlistId = currentMood.playlistId;

    if (playlistId.includes(',')) {
        const ids = playlistId.split(',');
        
        const fetchDefaultTitles = async () => {
            const newItems: QueueItem[] = [];
            for (const id of ids) {
                let title = `Vibe Track`;
                try {
                    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
                    const data = await res.json();
                    if(data.title) title = data.title;
                } catch(e) {
                    console.warn("Could not fetch title for", id);
                }
                newItems.push({ id: id.trim(), title, isCustom: false });
            }
            
            setQueue(newItems);
            setIsQueueMode(true);
            setActiveVideoId(ids[0]); 
        };
        fetchDefaultTitles();

    } else {
        if (!isPlaylistId(playlistId)) {
             const fetchSingleTitle = async () => {
                let title = `${currentMood.label} Vibe`;
                try {
                    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${playlistId}`);
                    const data = await res.json();
                    if(data.title) title = data.title;
                } catch(e) {}
                
                setQueue([{ id: playlistId, title, isCustom: false }]);
                setIsQueueMode(true);
                setActiveVideoId(playlistId);
            };
            fetchSingleTitle();
        } else {
             setActiveVideoId(playlistId);
        }
    }
  }, [moodKey, currentMood.playlistId]);

  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
    if(playerRef.current.setVolume) playerRef.current.setVolume(0); 

    if (isMuted && playerRef.current.mute) playerRef.current.mute();
    
    if(event.target.playVideo) {
        event.target.playVideo();
        setIsPlaying(true);
    }
    updateTrackTitle(event.target);
    
    fadeInMusic();
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === 1) { 
        setIsPlaying(true); 
        updateTrackTitle(event.target); 
    }
    if (event.data === 2) setIsPlaying(false);
    if (event.data === 0 && isQueueMode) handleNextTrack();
  };

  const onPlayerError = (event: any) => {
      const errorCode = Number(event.data);
      console.warn("YouTube Player Error (Code " + errorCode + "). Recovering...");
      if (errorCode === 150 || errorCode === 101 || errorCode === 100) {
          showToast("Song unavailable. Skipping...", 'error');
          if (isQueueMode) setTimeout(() => handleNextTrack(), 2000);
          else if (activeVideoId !== FALLBACK_VIDEO_ID) setActiveVideoId(FALLBACK_VIDEO_ID);
      }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying && playerRef.current.pauseVideo) playerRef.current.pauseVideo();
    else if(playerRef.current.playVideo) {
        playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) { if(playerRef.current.unMute) playerRef.current.unMute(); setIsMuted(false); } 
    else { if(playerRef.current.mute) playerRef.current.mute(); setIsMuted(true); }
  };

  const handleNextTrack = () => {
    if (isQueueMode) {
      if (queue.length > 0) {
        if (queueIndex < queue.length - 1) setQueueIndex((prev) => prev + 1);
        else { showToast("Queue finished. Returning to start.", 'info'); setQueueIndex(0); }
      }
    } else {
      if (playerRef.current?.nextVideo) playerRef.current.nextVideo();
    }
  };

  const handlePrevTrack = () => {
    if (isQueueMode) {
      if (queue.length > 0 && queueIndex > 0) setQueueIndex((prev) => prev - 1);
    } else {
      if (playerRef.current?.previousVideo) playerRef.current.previousVideo();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    if (playerRef.current?.setVolume) playerRef.current.setVolume(newVol);
    if (newVol > 0 && isMuted) { setIsMuted(false); playerRef.current?.unMute && playerRef.current.unMute(); }
  };

  const addToQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    let videoId = inputUrl;
    if (inputUrl.includes("v=")) videoId = inputUrl.split("v=")[1].split("&")[0];
    else if (inputUrl.includes("youtu.be/")) videoId = inputUrl.split("youtu.be/")[1];

    setIsAddingToQueue(true);
    let videoTitle = `Track ${queue.length + 1}`;
    try {
        const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        const data = await response.json();
        if (data.title) videoTitle = data.title;
    } catch (err) { console.error("Failed to fetch video title", err); }
    
    const newItem: QueueItem = { id: videoId, title: videoTitle, isCustom: true };
    const newQueue = [...queue, newItem];
    setQueue(newQueue);
    setInputUrl("");
    setIsAddingToQueue(false);
    
    setQueueView('my_queue');
    
    if (!isQueueMode || queue.length === 0) {
        setIsQueueMode(true);
        setQueueIndex(newQueue.length - 1); 
    }
    showToast(`Added: ${videoTitle.substring(0, 20)}...`, 'success');
  };

  const removeFromQueue = (indexToRemove: number) => {
    const newQueue = [...queue];
    newQueue.splice(indexToRemove, 1);
    setQueue(newQueue);
    if (newQueue.length === 0) { setIsQueueMode(false); setQueueIndex(0); showToast("Queue cleared", 'info'); return; }
    if (indexToRemove < queueIndex) setQueueIndex(queueIndex - 1);
    else if (indexToRemove === queueIndex) { if (queueIndex >= newQueue.length) setQueueIndex(0); }
  };

  const jumpToTrack = (index: number) => {
      setQueueIndex(index);
      setIsPlaying(true);
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
    if (editorRef.current) editorRef.current.focus();
    checkFormats();
  };

  const handleSave = async () => {
    const htmlContent = editorRef.current?.innerHTML || "";
    if (!editorRef.current?.innerText.trim()) return;
    setIsSaving(true);
    try {
      await api.post("/entries", { content: htmlContent, mood: currentMood.label });
      triggerSuccess();
    } catch (error) { triggerSuccess(); }
  };

  const triggerSuccess = () => {
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => { handleExit(); }, 1500);
  };

  const handleExit = () => {
      const tl = gsap.timeline();
      tl.to([".glass-editor-box", ".top-controls", ".mini-player", ".volume-control", ".greeting-container"], {
          opacity: 0, y: 20, duration: 0.6, ease: "power2.in", stagger: 0.05
      });
      tl.to(".journal-window", { opacity: 0, duration: 0.8, ease: "power2.in" }, "-=0.4");
      fadeOutMusic(() => { router.push("/dashboard"); });
  };

  const youtubeOpts = {
    height: '300', width: '300', 
    playerVars: {
      autoplay: 1, controls: 0, disablekb: 1, fs: 0, loop: 1, modestbranding: 1, playsinline: 1,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  };

  const getMappedItems = (isCustom: boolean) => {
      return queue.map((item, index) => ({ item, index })).filter(x => x.item.isCustom === isCustom);
  };

  return (
    <main ref={containerRef} className="fixed inset-0 bg-black text-white flex items-center justify-center z-50 overflow-hidden">
      
      {toast && (
          <div className={`absolute top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border shadow-2xl backdrop-blur-md ${
              toast.type === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-200' :
              toast.type === 'success' ? 'bg-green-500/20 border-green-500/40 text-green-200' :
              'bg-blue-500/20 border-blue-500/40 text-blue-200'
          }`}>
              {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : 
               toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
               <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-bold uppercase tracking-wider">{toast.message}</span>
          </div>
      )}
      <div className="fixed top-0 left-[-9999px] w-1 h-1 overflow-hidden z-[-1] opacity-100 pointer-events-none">
         <div className="w-[300px] h-[300px]">
            {isQueueMode && queue.length > 0 ? (
               <YouTube
                 key="queue-player"
                 videoId={queue[queueIndex].id}
                 opts={{ ...youtubeOpts, playerVars: { ...youtubeOpts.playerVars, playlist: undefined } }}
                 onReady={onPlayerReady}
                 onStateChange={onPlayerStateChange}
                 onError={onPlayerError}
               />
            ) : (
               isPlaylistId(activeVideoId) ? (
                 <YouTube
                   key="playlist-player" 
                   opts={{ ...youtubeOpts, playerVars: { ...youtubeOpts.playerVars, listType: 'playlist', list: activeVideoId } }}
                   onReady={onPlayerReady}
                   onStateChange={onPlayerStateChange}
                   onError={onPlayerError}
                 />
               ) : (
                 <YouTube
                   key="single-player" 
                   videoId={activeVideoId}
                   opts={{ ...youtubeOpts, playerVars: { ...youtubeOpts.playerVars, playlist: activeVideoId } }}
                   onReady={onPlayerReady}
                   onStateChange={onPlayerStateChange}
                   onError={onPlayerError}
                 />
               )
            )}
         </div>
      </div>

      <div className="journal-window relative bg-[#050505] w-full h-full flex flex-col items-center justify-center overflow-hidden z-10">
        <div className="absolute inset-0 bg-black pointer-events-none -z-10" />
        <div className="absolute inset-0 pointer-events-none z-10"
             style={{ maskImage: 'radial-gradient(circle at center, transparent 40%, black 100%)', WebkitMaskImage: 'radial-gradient(circle at center, transparent 40%, black 100%)' }}>
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
            {!isPlaying && !isQueueMode && (
                <button onClick={togglePlay} className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider animate-pulse hover:bg-amber-500/30">
                    <AlertCircle className="w-3 h-3" />
                    Click to Start Music
                </button>
            )}
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
            <button onClick={() => setShowQueue(!showQueue)} className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all active:scale-95 ${showQueue ? "bg-white/20 text-white" : "text-white/70 hover:text-white"}`}>
                {showQueue ? <X className="w-4 h-4" /> : <ListMusic className="w-4 h-4" />}
            </button>
        </div>

        <div className="top-controls opacity-0 translate-y-4 absolute top-8 left-8 z-30">
            <button onClick={handleExit} className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group">
                <div className="p-2 rounded-full border border-white/10 group-hover:bg-white/10 transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium uppercase tracking-[0.2em]">Dashboard</span>
            </button>
        </div>

        <div className="volume-control opacity-0 absolute right-8 top-1/2 -translate-y-1/2 z-30 h-48 w-10 flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 rounded-full shadow-lg">
             <div className="relative w-full h-full flex items-center justify-center">
                <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} className="absolute w-32 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer hover:bg-white/40 accent-white transition-all -rotate-90 origin-center outline-none" />
             </div>
        </div>

        {showQueue && (
            <div className="absolute top-24 right-8 z-40 w-[28rem] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 mb-2 text-white/50 text-xs uppercase tracking-wider border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                        <ListMusic className="w-3 h-3" /> <span>{queueView === 'my_queue' ? "My Queue" : "Suggestions"}</span>
                    </div>
                </div>

                {queueView === 'my_queue' && (
                    <>
                        <form onSubmit={addToQueue} className="flex gap-2 mb-2">
                            <input type="text" placeholder="Paste YouTube URL..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/30" value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} autoFocus />
                            <button type="submit" disabled={isAddingToQueue} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors">
                                {isAddingToQueue ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />}
                            </button>
                        </form>
                        
                        <button onClick={() => setQueueView('suggestions')} className="w-full flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all mb-2 group">
                             <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-300" />
                                <span className="text-xs font-bold text-purple-200">Suggestions</span>
                             </div>
                             <ChevronRight className="w-4 h-4 text-purple-300/50 group-hover:translate-x-1 transition-transform" />
                        </button>
                        
                        <div className="max-h-[50vh] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10 pr-1">
                            {getMappedItems(true).length === 0 && (
                                <p className="text-[10px] text-white/30 text-center py-4 italic">Add your own songs here.</p>
                            )}
                            {getMappedItems(true).map(({item, index}) => (
                                <div key={index} onClick={() => jumpToTrack(index)} className={`flex items-center justify-between gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${index === queueIndex ? "bg-white/10 border-white/20" : "bg-transparent border-transparent hover:bg-white/5"}`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className={`text-[10px] font-mono ${index === queueIndex ? "text-green-400" : "text-white/30"}`}>{(index + 1).toString().padStart(2, '0')}</span>
                                        <span className={`text-xs truncate flex-1 ${index === queueIndex ? "text-white font-bold" : "text-white/70"}`} title={item.title}>{item.title}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); removeFromQueue(index); }} className="text-white/30 hover:text-red-400 transition-colors p-1">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {queueView === 'suggestions' && (
                     <>
                        <button onClick={() => setQueueView('my_queue')} className="w-full flex items-center gap-2 p-2 mb-2 text-white/60 hover:text-white transition-colors text-xs uppercase tracking-wider">
                             <ChevronLeft className="w-4 h-4" /> Back to Queue
                        </button>
                        <div className="max-h-[60vh] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10 pr-1">
                            {getMappedItems(false).map(({item, index}) => (
                                <div key={index} onClick={() => jumpToTrack(index)} className={`flex items-center justify-between gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${index === queueIndex ? "bg-white/10 border-white/20" : "bg-transparent border-transparent hover:bg-white/5"}`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className={`text-[10px] font-mono ${index === queueIndex ? "text-amber-300" : "text-white/30"}`}>{(index + 1).toString().padStart(2, '0')}</span>
                                        <div className="flex flex-col">
                                            <span className={`text-xs truncate ${index === queueIndex ? "text-white font-bold" : "text-white/70"}`} title={item.title}>{item.title}</span>
                                            <span className="text-[9px] text-white/30">Curated Vibe</span>
                                        </div>
                                    </div>
                                    {index === queueIndex && (
                                        <div className="flex items-end gap-[2px] h-3 mr-2">
                                            <span className="w-0.5 bg-amber-400 rounded-t-sm animate-[bounce_0.8s_infinite] h-1.5"></span>
                                            <span className="w-0.5 bg-amber-400 rounded-t-sm animate-[bounce_1.2s_infinite] h-3"></span>
                                            <span className="w-0.5 bg-amber-400 rounded-t-sm animate-[bounce_1.0s_infinite] h-2"></span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                     </>
                )}
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
                    <video ref={videoRef} key={videoUrl} autoPlay loop muted preload="auto" playsInline className="w-full h-full object-cover transition-opacity duration-1000" style={{ opacity: 0.6 }} onTimeUpdate={handleVideoTimeUpdate} onEnded={handleVideoEnded} onPlay={handleVideoPlay}>
                        <source src={videoUrl} type="video/mp4" />
                    </video>
                </div>
                <div className="absolute inset-0 z-10 bg-black/5" /> 
                <div className="relative z-20 w-full h-full flex flex-col p-8 md:p-12">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
                        <button onMouseDown={(e) => { e.preventDefault(); handleFormat('bold'); }} className={`p-2 rounded-lg transition-colors ${formats.bold ? 'bg-white text-black' : 'hover:bg-white/10 text-white/70 hover:text-white'}`} title="Bold"><Bold className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => { e.preventDefault(); handleFormat('italic'); }} className={`p-2 rounded-lg transition-colors ${formats.italic ? 'bg-white text-black' : 'hover:bg-white/10 text-white/70 hover:text-white'}`} title="Italic"><Italic className="w-4 h-4" /></button>
                        <button onMouseDown={(e) => { e.preventDefault(); handleFormat('underline'); }} className={`p-2 rounded-lg transition-colors ${formats.underline ? 'bg-white text-black' : 'hover:bg-white/10 text-white/70 hover:text-white'}`} title="Underline"><Underline className="w-4 h-4" /></button>
                        <div className="flex-1" />
                        <span className="text-xs uppercase tracking-widest text-white/30">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div ref={editorRef} contentEditable className={`flex-1 w-full bg-transparent outline-none text-xl md:text-2xl leading-relaxed text-white/90 placeholder-white/30 font-light ${caretColorClass} overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline`} style={{ minHeight: '200px' }} onInput={(e) => { setContent(e.currentTarget.innerHTML); checkFormats(); }} onKeyUp={checkFormats} onMouseUp={checkFormats} onTouchEnd={checkFormats} />
                </div>
            </div>

            <div className="glass-editor-box opacity-0 translate-y-8 mt-8">
                <button onClick={handleSave} disabled={isSaving} className="group relative px-12 py-4 bg-white text-black rounded-xl font-bold uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <span className="relative flex items-center gap-3">{isSaving ? "Saving..." : "Save Entry"}{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}</span>
                </button>
            </div>
        </div>

        <div className="mini-player opacity-0 absolute bottom-8 right-8 z-40">
            <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10 pr-6 pl-2 py-2 rounded-full shadow-2xl">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${currentMood.color} ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                    <Disc className="w-5 h-5 text-white/80" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">{isQueueMode ? "From Queue" : "Mood Vibe"}</span>
                    <span className="text-xs text-white/90 font-medium truncate max-w-[150px]">{isQueueMode ? (currentTrackTitle || "Loading...") : `${currentMood.label} Vibe`}</span>
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