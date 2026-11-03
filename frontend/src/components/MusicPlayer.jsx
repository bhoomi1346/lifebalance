import { useEffect, useRef, useState } from "react";

const BUILTIN_TRACKS = [
  // ── New Tracks Added from Project Music ──
  {
    id: "moonu-bgm",
    title: "Moonu (3) Theme BGM",
    artist: "Anirudh Ravichander",
    album: "3 (Tamil OST)",
    tag: "Cinematic BGM",
    category: "movie",
    duration: "08:20",
    durSec: 500,
    coverColor: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
    accent: "#6b60c7",
    image: "/covers/moonu-bgm.jpg",
    src: "/audio/moonu-bgm.mp3",
    addedAt: 106,
  },
  {
    id: "kanave-kanave",
    title: "Kanave Kanave",
    artist: "Anirudh Ravichander",
    album: "David (Tamil)",
    tag: "Tamil Melody",
    category: "movie",
    duration: "04:04",
    durSec: 244,
    coverColor: "linear-gradient(135deg, #4338ca 0%, #3730a3 100%)",
    accent: "#6b60c7",
    image: "/covers/kanave-kanave.jpg",
    src: "/audio/kanave-kanave.mp3",
    addedAt: 105,
  },
  {
    id: "pookkal-pookkum",
    title: "Pookkal Pookkum (Violin Cover)",
    artist: "G.V. Prakash • Arun Linus",
    album: "Madrasapattinam",
    tag: "Violin Melody",
    category: "melody",
    duration: "04:04",
    durSec: 244,
    coverColor: "linear-gradient(135deg, #be185d 0%, #831843 100%)",
    accent: "#6b60c7",
    image: "/covers/pookkal-pookkum.jpg",
    src: "/audio/pookkal-pookkum.mp3",
    addedAt: 104,
  },
  {
    id: "kadhal-ennum",
    title: "Kadhal Ennum Therveluthi (Flute)",
    artist: "A.R. Rahman • Flute Siva ft. Thibisan B",
    album: "Kadhalar Dhinam",
    tag: "Flute Melody",
    category: "melody",
    duration: "03:55",
    durSec: 235,
    coverColor: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
    accent: "#6b60c7",
    image: "/covers/kadhal-ennum.jpg",
    src: "/audio/kadhal-ennum.mp3",
    addedAt: 103,
  },
  {
    id: "ayyayyo-nenju",
    title: "Ayyayyo Nenju (Piano Cover)",
    artist: "G.V. Prakash Kumar • Piano Solo",
    album: "Aadukalam (Acoustic)",
    tag: "Piano Melody",
    category: "melody",
    duration: "02:15",
    durSec: 135,
    coverColor: "linear-gradient(135deg, #b45309 0%, #78350f 100%)",
    accent: "#6b60c7",
    image: "/covers/ayyayyo-nenju.jpg",
    src: "/audio/ayyayyo-nenju.mp3",
    addedAt: 102,
  },
  {
    id: "yeh-haseen-vadiyan",
    title: "Yeh Haseen Vadiyan (Instrumental)",
    artist: "A.R. Rahman ft. Binesh Babu",
    album: "Roja (Acoustic Cover)",
    tag: "Golden Melody",
    category: "movie",
    duration: "05:35",
    durSec: 335,
    coverColor: "linear-gradient(135deg, #0369a1 0%, #075985 100%)",
    accent: "#6b60c7",
    image: "/covers/yeh-haseen-vadiyan.jpg",
    src: "/audio/yeh-haseen-vadiyan.mp3",
    addedAt: 101,
  },
  // ── Indian & Regional Movie Melodies (Hindi, Tamil, Malayalam, Kannada) ──
  {
    id: "kesariya",
    title: "Kesariya",
    artist: "Arijit Singh • Pritam (Brahmāstra)",
    album: "Brahmāstra (Hindi)",
    tag: "Hindi Melody",
    category: "movie",
    duration: "04:28",
    durSec: 268,
    coverColor: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    accent: "#6b60c7",
    image: "/covers/kesariya.jpg",
    src: "/audio/kesariya.mp3",
    addedAt: 100,
  },
  {
    id: "kadhale-kadhale",
    title: "Kadhale Kadhale",
    artist: "Govind Vasantha • Chinmayi (96)",
    album: "96 (Tamil)",
    tag: "Tamil Melody",
    category: "movie",
    duration: "03:12",
    durSec: 192,
    coverColor: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    accent: "#6b60c7",
    image: "/covers/kadhale-kadhale.jpg",
    src: "/audio/kadhale-kadhale.mp3",
    addedAt: 99,
  },
  {
    id: "malare",
    title: "Malare Ninne",
    artist: "Vijay Yesudas • Rajesh Murugesan (Premam)",
    album: "Premam (Malayalam)",
    tag: "Malayalam Melody",
    category: "movie",
    duration: "03:40",
    durSec: 220,
    coverColor: "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
    accent: "#6b60c7",
    image: "/covers/malare.jpg",
    src: "/audio/malare.mp3",
    addedAt: 98,
  },
  {
    id: "belageddu",
    title: "Belageddu",
    artist: "Vijay Prakash • B. Ajaneesh Loknath (Kirik Party)",
    album: "Kirik Party (Kannada)",
    tag: "Kannada Melody",
    category: "movie",
    duration: "03:32",
    durSec: 212,
    coverColor: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
    accent: "#6b60c7",
    image: "/covers/belageddu.jpg",
    src: "/audio/belageddu.mp3",
    addedAt: 97,
  },
  {
    id: "lag-ja-gale",
    title: "Lag Ja Gale",
    artist: "Lata Mangeshkar • Hawaiian Guitar",
    album: "Woh Kaun Thi (Classics)",
    tag: "Evergreen",
    category: "movie",
    duration: "04:18",
    durSec: 258,
    coverColor: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
    accent: "#6b60c7",
    image: "/covers/lag-ja-gale.jpg",
    src: "/audio/lag-ja-gale.mp3",
    addedAt: 96,
  },
  {
    id: "tere-bina",
    title: "Tere Bina Zindagi Se",
    artist: "R.D. Burman • Acoustic Guitar",
    album: "Aandhi (Acoustic)",
    tag: "Cinema Classic",
    category: "movie",
    duration: "05:36",
    durSec: 336,
    coverColor: "linear-gradient(135deg, #db2777 0%, #9d174d 100%)",
    accent: "#6b60c7",
    image: "/covers/tere-bina.jpg",
    src: "/audio/tere-bina.mp3",
    addedAt: 95,
  },
  {
    id: "yeh-shaam-mastani",
    title: "Yeh Shaam Mastani",
    artist: "Kishore Kumar • Classic Guitar",
    album: "Kati Patang (Unplugged)",
    tag: "Golden Melody",
    category: "movie",
    duration: "03:45",
    durSec: 225,
    coverColor: "linear-gradient(135deg, #ea580c 0%, #9a3412 100%)",
    accent: "#6b60c7",
    image: "/covers/yeh-shaam-mastani.jpg",
    src: "/audio/yeh-shaam-mastani.mp3",
    addedAt: 94,
  },

  // ── Best Melodies & Chill Instrumental ──────────────────────────────────────
  {
    id: "snowfall",
    title: "Snowfall",
    artist: "Øneheart x Reidenshi",
    album: "Snowfall Single",
    tag: "Ambient Melody",
    category: "melody",
    duration: "02:04",
    durSec: 124,
    coverColor: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
    accent: "#6b60c7",
    image: "/covers/snowfall.jpg",
    src: "/audio/snowfall.mp3",
    addedAt: 93,
  },
  {
    id: "dreamlight",
    title: "Dreamlight",
    artist: "Luna Sonance • Dreamscape",
    album: "Nocturne Series",
    tag: "Chill Melody",
    category: "melody",
    duration: "02:14",
    durSec: 134,
    coverColor: "linear-gradient(135deg, #9333ea 0%, #6b21a8 100%)",
    accent: "#6b60c7",
    image: "/covers/dreamlight.jpg",
    src: "/audio/dreamlight.mp3",
    addedAt: 92,
  },
  {
    id: "returning-home",
    title: "Returning Home",
    artist: "Peaceful Acoustic Piano Solo",
    album: "Quiet Solitude",
    tag: "Piano Melody",
    category: "melody",
    duration: "02:53",
    durSec: 173,
    coverColor: "linear-gradient(135deg, #059669 0%, #064e3b 100%)",
    accent: "#6b60c7",
    image: "/covers/returning-home.jpg",
    src: "/audio/returning-home.mp3",
    addedAt: 91,
  },
  {
    id: "sleepy-eyes",
    title: "Sleepy Eyes",
    artist: "Ethereal Sleep Series",
    album: "Restful Night",
    tag: "Deep Sleep",
    category: "melody",
    duration: "02:15",
    durSec: 135,
    coverColor: "linear-gradient(135deg, #d97706 0%, #92400e 100%)",
    accent: "#6b60c7",
    image: "/covers/sleepy-eyes.jpg",
    src: "/audio/sleepy-eyes.mp3",
    addedAt: 90,
  },
  {
    id: "violet-flowers",
    title: "Violet Flowers",
    artist: "Orchestral Emotional OST",
    album: "Cinema Scores",
    tag: "Acoustic OST",
    category: "melody",
    duration: "01:38",
    durSec: 98,
    coverColor: "linear-gradient(135deg, #c026d3 0%, #86198f 100%)",
    accent: "#6b60c7",
    image: "/covers/violet-flowers.jpg",
    src: "/audio/violet-flowers.mp3",
    addedAt: 89,
  },
  {
    id: "waiting-for-you",
    title: "Waiting For You",
    artist: "Chillout Soundscapes",
    album: "Mindful Beats",
    tag: "Mindfulness",
    category: "melody",
    duration: "02:05",
    durSec: 125,
    coverColor: "linear-gradient(135deg, #0891b2 0%, #155e75 100%)",
    accent: "#6b60c7",
    image: "/covers/waiting-for-you.jpg",
    src: "/audio/waiting-for-you.mp3",
    addedAt: 88,
  },
  {
    id: "nostalgia",
    title: "Sweet Nostalgia",
    artist: "Daniel Relax Melodies",
    album: "Acoustic Warmth",
    tag: "Warm Memory",
    category: "melody",
    duration: "02:24",
    durSec: 144,
    coverColor: "linear-gradient(135deg, #0d9488 0%, #115e59 100%)",
    accent: "#6b60c7",
    image: "/covers/nostalgia.jpg",
    src: "/audio/nostalgia.mp3",
    addedAt: 87,
  },
  {
    id: "sunset-vibes",
    title: "Sunset Glow",
    artist: "Golden Hour Serenade",
    album: "After Dusk",
    tag: "Golden Hour",
    category: "melody",
    duration: "01:40",
    durSec: 100,
    coverColor: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
    accent: "#6b60c7",
    image: "/covers/sunset-vibes.jpg",
    src: "/audio/sunset-vibes.mp3",
    addedAt: 86,
  },

  // ── Nature Sounds ───────────────────────────────────────────────────────────
  {
    id: "rain",
    title: "Gentle Rain",
    artist: "Soft rain shower on glass window",
    album: "Nature Sanctuary",
    tag: "Rain Ambience",
    category: "nature",
    duration: "04:30",
    durSec: 270,
    coverColor: "linear-gradient(135deg, #0284c7 0%, #075985 100%)",
    accent: "#6b60c7",
    image: "/covers/rain.jpg",
    src: "/audio/rain.mp3",
    addedAt: 85,
  },
  {
    id: "sea",
    title: "Ocean Waves",
    artist: "Rhythmic calming sea coastal tide",
    album: "Pacific Shores",
    tag: "Ocean Sound",
    category: "nature",
    duration: "04:15",
    durSec: 255,
    coverColor: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
    accent: "#6b60c7",
    image: "/covers/sea.jpg",
    src: "/audio/sea.mp3",
    addedAt: 84,
  },
  {
    id: "birds",
    title: "Forest Birds",
    artist: "Morning woodland canopy & breeze",
    album: "Deep Woods",
    tag: "Nature Sound",
    category: "nature",
    duration: "02:08",
    durSec: 128,
    coverColor: "linear-gradient(135deg, #166534 0%, #14532d 100%)",
    accent: "#6b60c7",
    image: "/covers/birds.jpg",
    src: "/audio/birds.mp3",
    addedAt: 83,
  },
];

function formatTime(secs) {
  if (isNaN(secs) || secs < 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function MusicPlayer() {
  const [modalOpen, setModalOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoop, setIsLoop] = useState(false); // default: auto-advance to next song
  const [userTracks, setUserTracks] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("lb_music_favorites");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [connectedApps, setConnectedApps] = useState(() => {
    try {
      const saved = localStorage.getItem("lb_music_connected_apps");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [error, setError] = useState("");

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  const allTracks = [...userTracks, ...BUILTIN_TRACKS];
  const currentTrack = allTracks[currentIdx] || allTracks[0];

  const currentIdxRef = useRef(0);
  const isShuffleRef = useRef(false);
  const isLoopRef = useRef(false);
  const allTracksRef = useRef(allTracks);

  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  useEffect(() => {
    isLoopRef.current = isLoop;
    if (audioRef.current) {
      audioRef.current.loop = isLoop;
    }
  }, [isLoop]);

  useEffect(() => {
    allTracksRef.current = allTracks;
  }, [allTracks]);

  // Audio lifecycle setup
  useEffect(() => {
    const audio = new Audio();
    audio.loop = false;
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      const list = allTracksRef.current;
      const cur = list[currentIdxRef.current] || list[0];
      setDuration(audio.duration || (cur ? cur.durSec : 180));
    };

    // Automatic transition to next song upon completion!
    const onEnded = () => {
      if (isLoopRef.current) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        const list = allTracksRef.current;
        if (!list || list.length === 0) return;
        let nextIdx = 0;
        if (isShuffleRef.current) {
          nextIdx = Math.floor(Math.random() * list.length);
        } else {
          nextIdx = (currentIdxRef.current + 1) % list.length;
        }
        playTrackByIndex(nextIdx);
      }
    };

    const onError = () => {
      setError("Unable to play track. Please try another.");
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const playTrackByIndex = (index) => {
    setError("");
    const list = allTracksRef.current;
    const target = list[index];
    if (!target) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Toggle same track
    if (currentIdxRef.current === index && audio.src && audio.src.includes(encodeURI(target.src))) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            setError("Click anywhere on page first to enable audio.");
          });
      }
      return;
    }

    // Play new track
    audio.pause();
    audio.src = target.src;
    audio.currentTime = 0;
    audio.volume = volume;

    audio
      .play()
      .then(() => {
        setCurrentIdx(index);
        setIsPlaying(true);
      })
      .catch(() => {
        setCurrentIdx(index);
        setError("Click anywhere on page to enable playback.");
      });
  };

  const handleNext = () => {
    const list = allTracksRef.current;
    if (!list || list.length === 0) return;
    if (isShuffleRef.current) {
      const rand = Math.floor(Math.random() * list.length);
      playTrackByIndex(rand);
    } else {
      const next = (currentIdxRef.current + 1) % list.length;
      playTrackByIndex(next);
    }
  };

  const handlePrev = () => {
    const list = allTracksRef.current;
    if (!list || list.length === 0) return;
    const prev = (currentIdxRef.current - 1 + list.length) % list.length;
    playTrackByIndex(prev);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const likedCount = Object.keys(favorites).filter((id) => favorites[id]).length;

  const toggleFavorite = (id, e) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("lb_music_favorites", JSON.stringify(next));
      } catch {}
      const rem = Object.keys(next).filter((k) => next[k]).length;
      if (rem === 0 && activeTab === "liked") {
        setActiveTab("all");
      }
      return next;
    });
  };

  const toggleConnectApp = (appKey) => {
    setConnectedApps((prev) => {
      const next = { ...prev, [appKey]: !prev[appKey] };
      try {
        localStorage.setItem("lb_music_connected_apps", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Add songs from user downloads/files
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newTracks = files.map((file, i) => {
      const objectUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      return {
        id: `upload-${Date.now()}-${i}`,
        title: cleanName,
        artist: "Local Download • Audio",
        album: "My Downloads",
        tag: "My Audio",
        category: "downloads",
        duration: "03:30",
        durSec: 210,
        coverColor: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
        accent: "#6b60c7",
        image: "/covers/nostalgia.jpg",
        src: objectUrl,
        isLocal: true,
        addedAt: Date.now() + i,
      };
    });

    setUserTracks((prev) => [...newTracks, ...prev]);
    setActiveTab("all");
    e.target.value = "";
  };

  // Filter tracks
  const filteredTracks = allTracks.filter((t) => {
    let matchCat = false;
    if (activeTab === "all") {
      matchCat = true;
    } else if (activeTab === "liked") {
      matchCat = Boolean(favorites[t.id]);
    } else if (activeTab === "downloads") {
      matchCat = t.category === "downloads" || Boolean(t.isLocal);
    } else {
      matchCat = t.category === activeTab;
    }

    const matchSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.album && t.album.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Sort tracks
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortBy === "title-asc") return a.title.localeCompare(b.title);
    if (sortBy === "title-desc") return b.title.localeCompare(a.title);
    if (sortBy === "dur-asc") return (a.durSec || 0) - (b.durSec || 0);
    if (sortBy === "dur-desc") return (b.durSec || 0) - (a.durSec || 0);
    if (sortBy === "artist-asc") return a.artist.localeCompare(b.artist);
    if (sortBy === "recent") return (b.addedAt || 0) - (a.addedAt || 0);
    return 0; // default
  });

  const totalProgressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Hidden file input for adding songs from downloads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* ── Sleek Floating Mini Player (Always visible in bottom-left) ── */}
      <div className="s-mini-player">
        <div
          className="s-mini-track-info"
          onClick={() => setModalOpen(true)}
          role="button"
          tabIndex={0}
        >
          {/* Album Cover */}
          <div className="s-mini-art">
            <img
              src={currentTrack.image}
              alt={currentTrack.title}
              className="s-mini-img"
            />
          </div>

          <div className="s-mini-meta">
            <span className="s-mini-title">{currentTrack.title}</span>
            <span className="s-mini-artist">
              {isPlaying ? (
                <span className="s-mini-playing-txt">
                  <span className="s-mini-dot" /> Now Playing
                </span>
              ) : (
                currentTrack.artist
              )}
            </span>
          </div>
        </div>

        <div className="s-mini-actions">
          <button
            type="button"
            className="s-mini-play-btn"
            onClick={() => playTrackByIndex(currentIdx)}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="s-mini-expand-btn"
            onClick={() => setModalOpen(true)}
            title="Expand Music Library"
            aria-label="Expand Music Library"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Realistic Music App Modal ── */}
      {modalOpen && (
        <div className="s-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="s-player-window" onClick={(e) => e.stopPropagation()}>
            {/* Top Navigation Bar */}
            <div className="s-topbar">
              <div className="s-topbar-left">
                <div className="s-app-logo">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="s-logo-icon">
                    <circle cx="12" cy="12" r="10" fill="#6b60c7" />
                    <path d="M10 8v8l6-4z" fill="#ffffff" />
                  </svg>
                  <span className="s-app-name">Life Balance • Music</span>
                </div>

                <div className="s-search-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="s-search-icon">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search Hindi, Tamil, Malayalam, Kannada, melodies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="s-search-input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="s-search-clear"
                      onClick={() => setSearchQuery("")}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="s-topbar-right">
                {/* Upload from Downloads */}
                <button
                  type="button"
                  className="s-btn-pill s-btn-upload"
                  onClick={() => fileInputRef.current?.click()}
                  title="Add audio files from your Downloads folder or computer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="s-btn-icon">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Songs
                </button>

                {/* Connect Streaming Music Apps */}
                <button
                  type="button"
                  className="s-btn-pill s-btn-connect-app"
                  onClick={() => setConnectModalOpen(true)}
                  title="Connect Spotify, Apple Music, YouTube Music or JioSaavn"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="s-btn-icon">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  Music Apps
                </button>

                <button
                  type="button"
                  className="s-btn-pill s-btn-play-all"
                  onClick={() => playTrackByIndex(0)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="s-btn-icon">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play All
                </button>

                <button
                  type="button"
                  className={`s-btn-pill s-btn-shuffle ${isShuffle ? "active" : ""}`}
                  onClick={() => setIsShuffle((p) => !p)}
                  title="Shuffle playlist"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="s-btn-icon">
                    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                  </svg>
                  Shuffle
                </button>

                <button
                  type="button"
                  className="s-close-btn"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Category Filter Chips & Sort Controls */}
            <div className="s-filter-bar">
              <div className="s-filter-chips-group">
                <button
                  type="button"
                  className={`s-filter-chip ${activeTab === "all" ? "active" : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  All Tracks ({allTracks.length})
                </button>
                {likedCount > 0 && (
                  <button
                    type="button"
                    className={`s-filter-chip s-filter-chip-liked ${activeTab === "liked" ? "active" : ""}`}
                    onClick={() => setActiveTab("liked")}
                  >
                    ♥ Liked Songs ({likedCount})
                  </button>
                )}
                <button
                  type="button"
                  className={`s-filter-chip ${activeTab === "movie" ? "active" : ""}`}
                  onClick={() => setActiveTab("movie")}
                >
                  Movie & Cinema Melodies
                </button>
                <button
                  type="button"
                  className={`s-filter-chip ${activeTab === "melody" ? "active" : ""}`}
                  onClick={() => setActiveTab("melody")}
                >
                  Chillout & Acoustic
                </button>
                <button
                  type="button"
                  className={`s-filter-chip ${activeTab === "nature" ? "active" : ""}`}
                  onClick={() => setActiveTab("nature")}
                >
                  Nature Soundscapes
                </button>
                {userTracks.length > 0 && (
                  <button
                    type="button"
                    className={`s-filter-chip s-filter-chip-user ${activeTab === "downloads" ? "active" : ""}`}
                    onClick={() => setActiveTab("downloads")}
                  >
                    📁 My Downloads ({userTracks.length})
                  </button>
                )}
              </div>

              {/* Sorting Dropdown */}
              <div className="s-sort-container">
                <span className="s-sort-icon">⇅</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="s-sort-select"
                  aria-label="Sort tracks"
                >
                  <option value="default">Default Order</option>
                  <option value="title-asc">Title: A to Z</option>
                  <option value="title-desc">Title: Z to A</option>
                  <option value="dur-asc">Duration: Shortest</option>
                  <option value="dur-desc">Duration: Longest</option>
                  <option value="artist-asc">Artist: A to Z</option>
                  <option value="recent">Recently Added</option>
                </select>
              </div>
            </div>

            {error && <div className="s-error-banner">{error}</div>}

            {/* Song Table Header: Dedicated columns for DURATION, LIKE, and PLAY */}
            <div className="s-table-header">
              <span className="s-col-title">TITLE</span>
              <span className="s-col-album">ALBUM</span>
              <span className="s-col-tag">GENRE</span>
              <span className="s-col-time">DURATION</span>
              <span className="s-col-like">LIKE</span>
              <span className="s-col-action">PLAY</span>
            </div>

            {/* Song List (Scrollable Area) */}
            <div className="s-track-list-scroll">
              {sortedTracks.length === 0 ? (
                <div className="s-empty-tracks">
                  <span className="s-empty-icon">♥</span>
                  <div className="s-empty-title">
                    {activeTab === "liked"
                      ? "No liked songs yet"
                      : activeTab === "downloads"
                      ? "No downloaded songs added yet"
                      : "No matching tracks"}
                  </div>
                  <div className="s-empty-subtitle">
                    {activeTab === "liked"
                      ? "Click the heart icon on any song to add it to your Liked Songs."
                      : activeTab === "downloads"
                      ? "Click '+ Add Songs' above to import music files from your device."
                      : "Try clearing your search query to see all songs."}
                  </div>
                </div>
              ) : (
                sortedTracks.map((track) => {
                  const realIndex = allTracks.findIndex((t) => t.id === track.id);
                  const isThisTrack = currentTrack && currentTrack.id === track.id;
                  const isThisPlaying = isThisTrack && isPlaying;

                  return (
                    <div
                      key={track.id}
                      className={`s-track-row ${isThisTrack ? "active" : ""}`}
                      onClick={() => playTrackByIndex(realIndex)}
                    >
                      {/* Title + Cover Art + Artist */}
                      <div className="s-col-title s-title-wrapper">
                        <div className="s-album-cover">
                          <img
                            src={track.image}
                            alt={track.title}
                            className="s-cover-img"
                            loading="lazy"
                          />
                          {isThisPlaying && (
                            <div className="s-cover-eq-overlay">
                              <div className="s-eq-bars">
                                <span /><span /><span />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="s-track-text-group">
                          <div className="s-track-title-line">
                            <span className="s-song-title">{track.title}</span>
                            {isThisPlaying && (
                              <span className="s-now-badge">PLAYING</span>
                            )}
                          </div>
                          <span className="s-song-artist">{track.artist}</span>
                        </div>
                      </div>

                      {/* Album Name */}
                      <div className="s-col-album">
                        <span className="s-album-name">{track.album}</span>
                      </div>

                      {/* Genre Tag */}
                      <div className="s-col-tag">
                        <span className="s-genre-pill">{track.tag}</span>
                      </div>

                      {/* Duration (Dedicated spacious column) */}
                      <div className="s-col-time">
                        <span className="s-duration">{track.duration}</span>
                      </div>

                      {/* Like Heart Button (Dedicated spacious column) */}
                      <div className="s-col-like">
                        <button
                          type="button"
                          className={`s-fav-heart-btn ${favorites[track.id] ? "fav" : ""}`}
                          onClick={(e) => toggleFavorite(track.id, e)}
                          title={favorites[track.id] ? "Remove Favorite" : "Add to Favorites"}
                          aria-label={favorites[track.id] ? "Unlike song" : "Like song"}
                        >
                          {favorites[track.id] ? "♥" : "♡"}
                        </button>
                      </div>

                      {/* Dedicated Play / Pause Button */}
                      <div className="s-col-action">
                        <button
                          type="button"
                          className={`s-row-play-btn ${isThisPlaying ? "playing" : ""}`}
                          style={{ "--accent-color": track.accent }}
                          onClick={(e) => {
                            e.stopPropagation();
                            playTrackByIndex(realIndex);
                          }}
                          aria-label={isThisPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                        >
                          {isThisPlaying ? (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Persistent Bottom Player Bar ── */}
            <div className="s-bottom-bar">
              {/* Scrub Seek Bar */}
              <div className="s-scrub-container">
                <span className="s-scrub-time">{formatTime(currentTime)}</span>
                <div className="s-scrub-slider-box">
                  <input
                    type="range"
                    min="0"
                    max={duration || currentTrack.durSec}
                    step="0.5"
                    value={currentTime}
                    onChange={handleSeek}
                    className="s-scrub-slider"
                    style={{ "--progress-pct": `${totalProgressPct}%` }}
                    aria-label="Seek track"
                  />
                </div>
                <span className="s-scrub-time">{formatTime(duration || currentTrack.durSec)}</span>
              </div>

              {/* Controls Row */}
              <div className="s-controls-row">
                {/* Left Track Info */}
                <div className="s-ctrl-left">
                  <div className="s-now-cover">
                    <img
                      src={currentTrack.image}
                      alt={currentTrack.title}
                      className="s-cover-img"
                    />
                  </div>
                  <div className="s-now-meta">
                    <span className="s-now-title">{currentTrack.title}</span>
                    <span className="s-now-artist">{currentTrack.artist}</span>
                  </div>
                  <button
                    type="button"
                    className={`s-now-fav ${favorites[currentTrack.id] ? "fav" : ""}`}
                    onClick={() => toggleFavorite(currentTrack.id)}
                    aria-label="Favorite now playing"
                  >
                    {favorites[currentTrack.id] ? "♥" : "♡"}
                  </button>
                </div>

                {/* Center Controls */}
                <div className="s-ctrl-center">
                  <button
                    type="button"
                    className={`s-sub-btn ${isShuffle ? "active" : ""}`}
                    onClick={() => setIsShuffle((p) => !p)}
                    title="Shuffle"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="s-sub-btn"
                    onClick={handlePrev}
                    title="Previous track"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="s-main-play-btn"
                    onClick={() => playTrackByIndex(currentIdx)}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <button
                    type="button"
                    className="s-sub-btn"
                    onClick={handleNext}
                    title="Next track"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className={`s-sub-btn ${isLoop ? "active" : ""}`}
                    onClick={() => setIsLoop((p) => !p)}
                    title={isLoop ? "Repeat Current Track (Enabled)" : "Auto-play Next Track (Repeat Disabled)"}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                  </button>
                </div>

                {/* Right Volume & Quality */}
                <div className="s-ctrl-right">
                  <span className="s-quality-badge">STUDIO • 320 KBPS</span>
                  <div className="s-vol-box">
                    <button
                      type="button"
                      className="s-vol-btn"
                      onClick={() => handleVolume({ target: { value: volume > 0 ? 0 : 0.8 } })}
                      aria-label="Mute toggle"
                    >
                      {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolume}
                      className="s-vol-slider"
                      style={{ "--vol-pct": `${volume * 100}%` }}
                      aria-label="Volume Slider"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Connect Streaming Music Apps Modal ── */}
      {connectModalOpen && (
        <div className="s-submodal-backdrop" onClick={() => setConnectModalOpen(false)}>
          <div className="s-connect-card" onClick={(e) => e.stopPropagation()}>
            <div className="s-connect-head">
              <div className="s-connect-title-group">
                <span className="s-connect-title">Connect Music Apps</span>
                <span className="s-connect-desc">Link your favorite music accounts or launch web players</span>
              </div>
              <button
                type="button"
                className="s-close-btn"
                onClick={() => setConnectModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="s-apps-grid">
              {/* Spotify */}
              <div className="s-app-card">
                <div className="s-app-card-left">
                  <div className="s-app-badge spotify">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.624.624 0 0 1-.277-1.217c3.808-.871 7.076-.498 9.712 1.117a.625.625 0 0 1 .207.857zm1.224-2.719a.78.78 0 0 1-1.073.257c-2.688-1.652-6.786-2.13-9.965-1.165a.78.78 0 0 1-.462-1.49c3.633-1.103 8.147-.567 11.243 1.325a.78.78 0 0 1 .257 1.073zm.105-2.835C14.693 8.956 9.4 8.781 6.326 9.714a.936.936 0 1 1-.546-1.791c3.526-1.07 9.388-.865 13.197 1.398a.936.936 0 0 1-.977 1.621z" />
                    </svg>
                  </div>
                  <div>
                    <div className="s-app-title">Spotify</div>
                    <div className="s-app-meta">{connectedApps.spotify ? "Connected ✓" : "Playlists, Daily Mix & Podcasts"}</div>
                  </div>
                </div>
                <div className="s-app-card-actions">
                  <a
                    href="https://open.spotify.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="s-app-link-btn"
                  >
                    Open Web ↗
                  </a>
                  <button
                    type="button"
                    className={`s-app-toggle-btn ${connectedApps.spotify ? "active" : ""}`}
                    onClick={() => toggleConnectApp("spotify")}
                  >
                    {connectedApps.spotify ? "Linked" : "Connect"}
                  </button>
                </div>
              </div>

              {/* YouTube Music */}
              <div className="s-app-card">
                <div className="s-app-card-left">
                  <div className="s-app-badge ytmusic">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                      <path d="M10 9.5v5l4-2.5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="s-app-title">YouTube Music</div>
                    <div className="s-app-meta">{connectedApps.ytmusic ? "Connected ✓" : "Official Tracks & Acoustic Videos"}</div>
                  </div>
                </div>
                <div className="s-app-card-actions">
                  <a
                    href="https://music.youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="s-app-link-btn"
                  >
                    Open Web ↗
                  </a>
                  <button
                    type="button"
                    className={`s-app-toggle-btn ${connectedApps.ytmusic ? "active" : ""}`}
                    onClick={() => toggleConnectApp("ytmusic")}
                  >
                    {connectedApps.ytmusic ? "Linked" : "Connect"}
                  </button>
                </div>
              </div>

              {/* Apple Music */}
              <div className="s-app-card">
                <div className="s-app-card-left">
                  <div className="s-app-badge apple">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.74 1.02-1.77.91-2.8-.88.04-1.95.59-2.58 1.33-.55.64-.99 1.68-.86 2.69.98.08 1.98-.51 2.53-1.22z" />
                    </svg>
                  </div>
                  <div>
                    <div className="s-app-title">Apple Music</div>
                    <div className="s-app-meta">{connectedApps.apple ? "Connected ✓" : "Lossless & Spatial Melodies"}</div>
                  </div>
                </div>
                <div className="s-app-card-actions">
                  <a
                    href="https://music.apple.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="s-app-link-btn"
                  >
                    Open Web ↗
                  </a>
                  <button
                    type="button"
                    className={`s-app-toggle-btn ${connectedApps.apple ? "active" : ""}`}
                    onClick={() => toggleConnectApp("apple")}
                  >
                    {connectedApps.apple ? "Linked" : "Connect"}
                  </button>
                </div>
              </div>

              {/* JioSaavn */}
              <div className="s-app-card">
                <div className="s-app-card-left">
                  <div className="s-app-badge jiosaavn">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M10 8l6 4-6 4z" fill="#ffffff" />
                    </svg>
                  </div>
                  <div>
                    <div className="s-app-title">JioSaavn</div>
                    <div className="s-app-meta">{connectedApps.jiosaavn ? "Connected ✓" : "Hindi, Tamil, Malayalam & Kannada"}</div>
                  </div>
                </div>
                <div className="s-app-card-actions">
                  <a
                    href="https://www.jiosaavn.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="s-app-link-btn"
                  >
                    Open JioSaavn ↗
                  </a>
                  <button
                    type="button"
                    className={`s-app-toggle-btn ${connectedApps.jiosaavn ? "active" : ""}`}
                    onClick={() => toggleConnectApp("jiosaavn")}
                  >
                    {connectedApps.jiosaavn ? "Linked" : "Connect"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

