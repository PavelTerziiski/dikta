"use client";
import { useState, useEffect, useRef } from "react";

// ── Supabase config ──────────────────────────────────────────
const SUPABASE_URL = "https://gilfpdosfdiolvrwsnkz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbGZwZG9zZmRpb2x2cndzbmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDY2OTksImV4cCI6MjA5MTA4MjY5OX0.-ztgrdn4HJcCNt5kVVQah2O3rDoEsBHLw0AzTazybjM";

const sb = async (path: string, opts: any = {}, tok?: string) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${tok || SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const authFetch = async (path: string, body: any) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Грешка");
  return data;
};

// ── Диктовки ─────────────────────────────────────────────────
const DICTATIONS = [
  {
    id: "d1", grade: 3, theme: "Природа", difficulty: 1,
    sentences: [
      "Слънцето грее ярко на небето.",
      "Птиците пеят весело в гората.",
      "Децата играят на поляната.",
    ],
  },
  {
    id: "d2", grade: 3, theme: "Семейство", difficulty: 1,
    sentences: [
      "Мама приготвя вкусна вечеря.",
      "Татко чете книга на дивана.",
      "Сестра ми рисува красиви картини.",
    ],
  },
  {
    id: "d3", grade: 4, theme: "Училище", difficulty: 2,
    sentences: [
      "Учителката обяснява новия урок.",
      "Учениците слушат внимателно.",
      "Домашното е за утре.",
    ],
  },
];

// ── Diff алгоритъм ────────────────────────────────────────────
function analyzeDiff(expected: string, actual: string) {
  const expWords = expected.replace(/[.,!?]/g, "").toLowerCase().split(" ");
  const actWords = actual.replace(/[.,!?]/g, "").toLowerCase().split(" ");
  const errors: { expected: string; got: string }[] = [];
  const maxLen = Math.max(expWords.length, actWords.length);
  for (let i = 0; i < maxLen; i++) {
    const e = expWords[i] || "";
    const a = actWords[i] || "";
    if (e !== a) errors.push({ expected: e, got: a });
  }
  const score = Math.max(0, Math.round(((expWords.length - errors.length) / expWords.length) * 100));
  return { errors, score };
}

// ── Foksy SVG ────────────────────────────────────────────────
function FoksySvg({ mood = "happy", size = 120, animate = true }: { mood?: string; size?: number; animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={animate ? { animation: "foksy-bounce 2s ease-in-out infinite" } : {}}>
      {/* Тяло */}
      <ellipse cx="60" cy="85" rx="28" ry="22" fill="#F97316"/>
      {/* Корем */}
      <ellipse cx="60" cy="88" rx="16" ry="13" fill="#FED7AA"/>
      {/* Глава */}
      <ellipse cx="60" cy="55" rx="26" ry="24" fill="#F97316"/>
      {/* Уши */}
      <polygon points="38,38 30,15 50,32" fill="#F97316"/>
      <polygon points="82,38 90,15 70,32" fill="#F97316"/>
      <polygon points="40,36 34,20 50,33" fill="#FF8B94"/>
      <polygon points="80,36 86,20 70,33" fill="#FF8B94"/>
      {/* Лице */}
      <ellipse cx="50" cy="54" rx="8" ry="9" fill="white"/>
      <ellipse cx="70" cy="54" rx="8" ry="9" fill="white"/>
      <circle cx="51" cy="55" r="5" fill="#1C1C1E"/>
      <circle cx="71" cy="55" r="5" fill="#1C1C1E"/>
      <circle cx="53" cy="53" r="2" fill="white"/>
      <circle cx="73" cy="53" r="2" fill="white"/>
      {/* Нос */}
      <ellipse cx="60" cy="63" rx="4" ry="3" fill="#1C1C1E"/>
      {/* Уста */}
      {mood === "happy" && <path d="M54 68 Q60 74 66 68" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" fill="none"/>}
      {mood === "thinking" && <path d="M54 70 Q60 70 66 70" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" fill="none"/>}
      {mood === "sad" && <path d="M54 72 Q60 68 66 72" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" fill="none"/>}
      {mood === "excited" && <>
        <path d="M54 68 Q60 76 66 68" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M56 68 Q60 72 64 68" fill="#FF8B94"/>
      </>}
      {/* Опашка */}
      <path d="M88 90 Q110 75 105 60 Q100 50 92 55" stroke="#F97316" strokeWidth="12" strokeLinecap="round" fill="none"/>
      <path d="M102 58 Q108 52 106 46" stroke="#FED7AA" strokeWidth="6" strokeLinecap="round" fill="none"/>
      {/* Раница */}
      <rect x="45" y="78" width="30" height="22" rx="6" fill="#16A34A"/>
      <rect x="50" y="75" width="20" height="8" rx="3" fill="#15803D"/>
      <circle cx="60" cy="91" r="3" fill="#FED7AA"/>
      {/* Ръце */}
      <ellipse cx="34" cy="82" rx="7" ry="10" fill="#F97316" transform="rotate(-20 34 82)"/>
    </svg>
  );
}

// ── Главен компонент ──────────────────────────────────────────
export default function Home() {
  const [screen, setScreen] = useState<"home" | "login" | "register" | "app" | "dictation" | "result">("home");
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<"3" | "4">("3");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Диктовка
  const [activeDictation, setActiveDictation] = useState<any>(null);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [sessionResults, setSessionResults] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [foksyMood, setFoksyMood] = useState<"happy" | "thinking" | "sad" | "excited">("happy");
  const [showExplanation, setShowExplanation] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const token = session?.access_token;

  useEffect(() => {
    // Handle email confirmation redirect
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const tok = params.get("access_token");
      const uid = params.get("user_id") || "";
      if (tok) {
        const fakeSession = { access_token: tok, user: { id: uid } };
        localStorage.setItem("dikta_session", JSON.stringify(fakeSession));
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
    const saved = localStorage.getItem("dikta_session");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        setSession(s);
        loadProfile(s.user.id, s.access_token);
      } catch (_) {}
    }
  }, []);

  const loadProfile = async (uid: string, tok: string) => {
    try {
      const rows = await sb(`profiles?id=eq.${uid}&select=*`, { method: "GET" }, tok);
      if (rows?.[0]) { 
  setProfile(rows[0]); 
  setStreak(rows[0].streak_count || 0); 
  setScreen("app"); 
} else {
  // Профилът не съществува — създай го
  setScreen("app");
}
    } catch (_) {}
  };

  const handleLogin = async () => {
    if (!email || !password) { setAuthError("Въведете имейл и парола."); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const data = await authFetch("token?grant_type=password", { email: email.toLowerCase(), password });
      localStorage.setItem("dikta_session", JSON.stringify(data));
      setSession(data);
      await loadProfile(data.user.id, data.access_token);
    } catch (e: any) { setAuthError("Грешен имейл или парола."); }
    finally { setAuthLoading(false); }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) { setAuthError("Всички полета са задължителни."); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const data = await authFetch("signup", { email: email.toLowerCase(), password, data: { name } });
      const uid = data.user?.id;
      await sb("profiles", { method: "POST", prefer: "return=minimal", body: JSON.stringify({ id: uid, email: email.toLowerCase(), name, grade: `${grade}`, streak_count: 0, is_admin: false, approved: true }) }, SUPABASE_KEY);
      if (data.access_token) {
        localStorage.setItem("dikta_session", JSON.stringify(data));
        setSession(data);
        await loadProfile(uid, data.access_token);
      } else { setScreen("login"); setAuthError("✅ Провери имейла си и потвърди, после влез!"); }
    } catch (e: any) { setAuthError(e.message || "Грешка при регистрация."); }
    finally { setAuthLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("dikta_session");
    setSession(null); setProfile(null); setScreen("home");
  };

  // TTS
  const speakSentence = (text: string, spd = speed) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlaying(true);
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "bg-BG";
    utter.rate = spd;
    utter.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utter);
  };

  const startDictation = (d: any) => {
    setActiveDictation(d);
    setSentenceIdx(0);
    setUserInput("");
    setSessionResults([]);
    setShowResult(false);
    setCurrentResult(null);
    setFoksyMood("happy");
    setScreen("dictation");
    setTimeout(() => speakSentence(d.sentences[0]), 500);
  };

  const submitSentence = async () => {
    if (!userInput.trim()) return;
    const expected = activeDictation.sentences[sentenceIdx];
    const { errors, score } = analyzeDiff(expected, userInput);
    const result = { expected, got: userInput, errors, score };
    setCurrentResult(result);
    setShowResult(true);
    setFoksyMood(score >= 80 ? "excited" : score >= 50 ? "thinking" : "sad");
    const newResults = [...sessionResults, result];
    setSessionResults(newResults);

    if (sentenceIdx >= activeDictation.sentences.length - 1) {
      const avg = Math.round(newResults.reduce((a, r) => a + r.score, 0) / newResults.length);
      setFinalScore(avg);
      const newStreak = avg >= 60 ? streak + 1 : 0;
      setStreak(newStreak);
      if (token && profile) {
        await sb(`profiles?id=eq.${profile.id}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ streak_count: newStreak }) }, token);
        await sb("dictation_sessions", { method: "POST", prefer: "return=minimal", body: JSON.stringify({ child_id: profile.id, dictation_id: activeDictation.id, score: avg, input_text: userInput, expected_text: expected, errors: JSON.stringify(newResults) }) }, token);
      }
    }
  };

  const nextSentence = () => {
    setShowResult(false);
    setCurrentResult(null);
    setUserInput("");
    setShowExplanation(false);
    if (sentenceIdx >= activeDictation.sentences.length - 1) {
      setScreen("result");
    } else {
      const next = sentenceIdx + 1;
      setSentenceIdx(next);
      setFoksyMood("happy");
      setTimeout(() => speakSentence(activeDictation.sentences[next]), 300);
    }
  };

  const globalCSS = `
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Nunito', sans-serif; background: #FFFBF5; }
    @keyframes foksy-bounce { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(2deg); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pop { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
    @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
    @keyframes confetti { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(200px) rotate(720deg); opacity: 0; } }
    .fade-up { animation: fadeUp 0.5s ease forwards; }
    .pop { animation: pop 0.4s ease forwards; }
    .shake { animation: shake 0.5s ease; }
    button { font-family: 'Nunito', sans-serif; cursor: pointer; transition: all 0.2s ease; }
    button:hover { transform: translateY(-2px); }
    button:active { transform: translateY(0); }
    input, textarea { font-family: 'Nunito', sans-serif; }
    textarea:focus, input:focus { outline: none; }
    .star { animation: confetti 1s ease forwards; }
  `;

  // ── НАЧАЛО ────────────────────────────────────────────────────
  if (screen === "home") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #FFF7ED 0%, #FFEDD5 50%, #FEF3C7 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <style>{globalCSS}</style>
      {/* Фонови кръгове */}
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(249,115,22,0.08)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(22,163,74,0.06)", pointerEvents: "none" }} />

      <div className="fade-up" style={{ textAlign: "center", maxWidth: 480 }}>
        <FoksySvg size={160} mood="excited" />
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 52, fontWeight: 700, color: "#F97316", marginTop: 8, lineHeight: 1.1, letterSpacing: -1 }}>Диkта</h1>
        <p style={{ fontSize: 20, color: "#78716C", fontWeight: 700, marginTop: 8, marginBottom: 8 }}>Здравей! Аз съм Фокси 🦊</p>
        <p style={{ fontSize: 16, color: "#A8A29E", fontWeight: 600, marginBottom: 40 }}>Твоят приятел за диктовки и правопис</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <button onClick={() => setScreen("login")}
            style={{ background: "#F97316", border: "none", borderRadius: 20, padding: "18px 40px", color: "#fff", fontSize: 20, fontWeight: 800, boxShadow: "0 8px 24px rgba(249,115,22,0.4)", fontFamily: "'Fredoka', sans-serif" }}>
            Влез в играта! 🎯
          </button>
          <button onClick={() => setScreen("register")}
            style={{ background: "#fff", border: "3px solid #F97316", borderRadius: 20, padding: "15px 40px", color: "#F97316", fontSize: 18, fontWeight: 800, fontFamily: "'Fredoka', sans-serif" }}>
            Нова сметка 🌟
          </button>
        </div>

        <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 32 }}>
          {[["📝", "Диктовки"], ["⚡", "Бързо учене"], ["🏆", "Награди"]].map(([icon, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>{icon}</div>
              <div style={{ fontSize: 13, color: "#A8A29E", fontWeight: 700, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── ВХОД / РЕГИСТРАЦИЯ ────────────────────────────────────────
  if (screen === "login" || screen === "register") {
    const isReg = screen === "register";
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #FFF7ED 0%, #FFEDD5 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <style>{globalCSS}</style>
        <div className="fade-up" style={{ background: "#fff", borderRadius: 32, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(249,115,22,0.12)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <FoksySvg size={90} mood="happy" />
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 32, color: "#F97316", marginTop: 8 }}>{isReg ? "Регистрация" : "Добре дошъл!"}</h2>
          </div>

          {isReg && (
            <input placeholder="Твоето име" value={name} onChange={e => setName(e.target.value)}
              style={{ width: "100%", padding: "14px 18px", border: "2.5px solid #FED7AA", borderRadius: 16, fontSize: 16, marginBottom: 12, background: "#FFFBF5", color: "#292524", display: "block" }} />
          )}
          <input type="email" placeholder="Имейл" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", padding: "14px 18px", border: "2.5px solid #FED7AA", borderRadius: 16, fontSize: 16, marginBottom: 12, background: "#FFFBF5", color: "#292524", display: "block" }} />
          <input type="password" placeholder="Парола" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (isReg ? handleRegister() : handleLogin())}
            style={{ width: "100%", padding: "14px 18px", border: "2.5px solid #FED7AA", borderRadius: 16, fontSize: 16, marginBottom: isReg ? 12 : 20, background: "#FFFBF5", color: "#292524", display: "block" }} />

          {isReg && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: "#78716C", fontWeight: 700, marginBottom: 8 }}>В кой клас си?</div>
              <div style={{ display: "flex", gap: 10 }}>
                {["3", "4"].map(g => (
                  <button key={g} onClick={() => setGrade(g as "3" | "4")}
                    style={{ flex: 1, padding: "12px", border: `2.5px solid ${grade === g ? "#F97316" : "#FED7AA"}`, borderRadius: 14, background: grade === g ? "#FFF7ED" : "#fff", color: grade === g ? "#F97316" : "#A8A29E", fontWeight: 800, fontSize: 18 }}>
                    {g} клас
                  </button>
                ))}
              </div>
            </div>
          )}

          {authError && <div style={{ background: "#FFF1F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#EF4444", fontWeight: 700 }}>{authError}</div>}

          <button onClick={isReg ? handleRegister : handleLogin} disabled={authLoading}
            style={{ width: "100%", padding: "16px", background: authLoading ? "#FED7AA" : "#F97316", border: "none", borderRadius: 18, color: "#fff", fontSize: 18, fontWeight: 800, boxShadow: authLoading ? "none" : "0 6px 20px rgba(249,115,22,0.4)", fontFamily: "'Fredoka', sans-serif" }}>
            {authLoading ? "⏳ Зареждане..." : isReg ? "Регистрирай се! 🚀" : "Влез! 🎯"}
          </button>

          <button onClick={() => { setScreen(isReg ? "login" : "register"); setAuthError(""); }}
            style={{ width: "100%", marginTop: 12, padding: "12px", background: "none", border: "none", color: "#A8A29E", fontSize: 15, fontWeight: 700 }}>
            {isReg ? "Вече имам акаунт" : "Нямам акаунт — регистрирай ме!"}
          </button>
          <button onClick={() => setScreen("home")} style={{ width: "100%", padding: "10px", background: "none", border: "none", color: "#C4B5A5", fontSize: 14, fontWeight: 600 }}>← Назад</button>
        </div>
      </div>
    );
  }

  // ── ГЛАВЕН ЕКРАН ───────────────────────────────────────────
  if (screen === "app") {
    const availableDicts = DICTATIONS.filter(d => d.grade === parseInt(profile?.grade || "3"));
    return (
      <div style={{ minHeight: "100vh", background: "#FFFBF5" }}>
        <style>{globalCSS}</style>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FoksySvg size={52} mood="happy" animate={false} />
            <div>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, color: "#fff", fontWeight: 600 }}>Диkта</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Здравей, {profile?.name?.split(" ")[0]}! 👋</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{streak}</span>
            </div>
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 14, padding: "8px 16px", color: "#fff", fontWeight: 700, fontSize: 14 }}>Изход</button>
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px" }}>
          {/* Streak banner */}
          {streak > 0 && (
            <div style={{ background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", border: "2px solid #FED7AA", borderRadius: 20, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 36 }}>🔥</span>
              <div>
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, color: "#F97316", fontWeight: 600 }}>{streak} поредни диктовки!</div>
                <div style={{ fontSize: 14, color: "#A8A29E", fontWeight: 600 }}>Фокси е горд от теб! Продължавай! 🦊</div>
              </div>
            </div>
          )}

          {/* Фокси съобщение */}
          <div style={{ background: "#fff", borderRadius: 24, padding: "20px 24px", marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
            <FoksySvg size={70} mood="happy" />
            <div>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, color: "#292524", marginBottom: 4 }}>Готов ли си? 🎯</div>
              <div style={{ fontSize: 15, color: "#78716C", lineHeight: 1.5 }}>Избери диктовка и аз ще ти чета изреченията. Ти ги пиши!</div>
            </div>
          </div>

          {/* Диктовки */}
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, color: "#292524", marginBottom: 16 }}>Диктовки за {profile?.grade} клас 📚</h2>
            {availableDicts.map((d, i) => (
              <div key={d.id} onClick={() => startDictation(d)}
                style={{ background: "#fff", borderRadius: 22, padding: "20px 24px", marginBottom: 14, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", border: "2.5px solid transparent", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 16 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#F97316")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: `hsl(${i * 40 + 20}, 85%, 60%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                  {["🌿", "👨‍👩‍👧", "🏫"][i] || "📝"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, color: "#292524" }}>{d.theme}</div>
                  <div style={{ fontSize: 14, color: "#A8A29E", fontWeight: 600 }}>{d.sentences.length} изречения · {d.grade} клас</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} style={{ width: 16, height: 6, borderRadius: 3, background: j < d.difficulty ? "#F97316" : "#E7E5E4" }} />
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 24, color: "#FED7AA" }}>→</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── ДИКТОВКА ─────────────────────────────────────────────────
  if (screen === "dictation" && activeDictation) {
    const total = activeDictation.sentences.length;
    const progressPct = ((sentenceIdx) / total) * 100;

    return (
      <div style={{ minHeight: "100vh", background: "#FFFBF5" }}>
        <style>{globalCSS}</style>
        {/* Header */}
        <div style={{ background: "#fff", borderBottom: "2px solid #FEF3C7", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => { window.speechSynthesis?.cancel(); setScreen("app"); }}
            style={{ background: "#FFF7ED", border: "none", borderRadius: 12, padding: "8px 16px", color: "#F97316", fontWeight: 800, fontSize: 14 }}>← Назад</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, color: "#292524" }}>{activeDictation.theme}</div>
            <div style={{ fontSize: 12, color: "#A8A29E", fontWeight: 600 }}>Изречение {sentenceIdx + 1} от {total}</div>
          </div>
          <FoksySvg size={44} mood={foksyMood} animate={false} />
        </div>

        {/* Прогрес */}
        <div style={{ height: 8, background: "#FEF3C7" }}>
          <div style={{ height: "100%", width: progressPct + "%", background: "linear-gradient(90deg, #F97316, #EF4444)", borderRadius: "0 4px 4px 0", transition: "width 0.5s ease" }} />
        </div>

        <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px" }}>
          {!showResult ? (
            <div className="fade-up">
              {/* Фокси казва */}
              <div style={{ background: "#fff", borderRadius: 28, padding: "28px 24px", marginBottom: 24, boxShadow: "0 6px 24px rgba(249,115,22,0.1)", textAlign: "center" }}>
                <FoksySvg size={100} mood="thinking" />
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, color: "#292524", marginTop: 12, marginBottom: 8 }}>Слушай внимателно! 👂</div>
                <div style={{ fontSize: 14, color: "#A8A29E", fontWeight: 600, marginBottom: 20 }}>Натисни бутона за да чуеш изречението</div>

                {/* Скорост */}
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                  {[0.7, 1.0, 1.2].map(s => (
                    <button key={s} onClick={() => setSpeed(s)}
                      style={{ padding: "8px 18px", border: `2px solid ${speed === s ? "#F97316" : "#FED7AA"}`, borderRadius: 20, background: speed === s ? "#FFF7ED" : "#fff", color: speed === s ? "#F97316" : "#A8A29E", fontWeight: 800, fontSize: 14 }}>
                      ×{s}
                    </button>
                  ))}
                </div>

                <button onClick={() => speakSentence(activeDictation.sentences[sentenceIdx])}
                  style={{ background: isPlaying ? "#FED7AA" : "#F97316", border: "none", borderRadius: 20, padding: "16px 40px", color: "#fff", fontSize: 20, fontWeight: 800, boxShadow: "0 6px 20px rgba(249,115,22,0.35)", fontFamily: "'Fredoka', sans-serif" }}>
                  {isPlaying ? "🔊 Слушам..." : "🔊 Прочети ми!"}
                </button>
              </div>

              {/* Поле за писане */}
              <div style={{ background: "#fff", borderRadius: 24, padding: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 15, color: "#78716C", fontWeight: 700, marginBottom: 12 }}>✏️ Напиши изречението:</div>
                <textarea ref={inputRef} value={userInput} onChange={e => setUserInput(e.target.value)}
                  placeholder="Пиши тук..."
                  style={{ width: "100%", padding: "16px", border: "2.5px solid #FED7AA", borderRadius: 18, fontSize: 18, lineHeight: 1.6, resize: "none", height: 120, background: "#FFFBF5", color: "#292524", boxSizing: "border-box" }} />
                <button onClick={submitSentence} disabled={!userInput.trim()}
                  style={{ width: "100%", marginTop: 14, padding: "16px", background: userInput.trim() ? "#16A34A" : "#D1FAE5", border: "none", borderRadius: 18, color: "#fff", fontSize: 18, fontWeight: 800, boxShadow: userInput.trim() ? "0 6px 20px rgba(22,163,74,0.35)" : "none", fontFamily: "'Fredoka', sans-serif" }}>
                  Проверете! ✅
                </button>
              </div>
            </div>
          ) : (
            // Резултат от изречение
            <div className="pop">
              <div style={{ background: "#fff", borderRadius: 28, padding: "28px 24px", marginBottom: 20, boxShadow: "0 6px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
                <FoksySvg size={110} mood={foksyMood} />
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 52, color: currentResult?.score >= 80 ? "#16A34A" : currentResult?.score >= 50 ? "#F97316" : "#EF4444", marginTop: 8 }}>
                  {currentResult?.score}%
                </div>
                <div style={{ fontSize: 20, color: "#78716C", fontWeight: 700, marginBottom: 16 }}>
                  {currentResult?.score >= 80 ? "Браво! Фокси е горд! 🎉" : currentResult?.score >= 50 ? "Почти! Опитай пак! 💪" : "Не се отказвай! Аз вярвам в теб! 🦊"}
                </div>

                {/* Сравнение */}
                <div style={{ background: "#FFFBF5", borderRadius: 16, padding: "16px", textAlign: "left", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: "#A8A29E", fontWeight: 700, marginBottom: 6 }}>ПРАВИЛНО:</div>
                  <div style={{ fontSize: 16, color: "#16A34A", fontWeight: 700, marginBottom: 12 }}>{currentResult?.expected}</div>
                  <div style={{ fontSize: 13, color: "#A8A29E", fontWeight: 700, marginBottom: 6 }}>НАПИСАЛ СИ:</div>
                  <div style={{ fontSize: 16, color: currentResult?.score >= 80 ? "#16A34A" : "#EF4444", fontWeight: 700 }}>{currentResult?.got}</div>
                </div>

                {currentResult?.errors?.length > 0 && (
                  <button onClick={() => setShowExplanation(!showExplanation)}
                    style={{ background: "#FFF7ED", border: "2px solid #FED7AA", borderRadius: 14, padding: "10px 20px", color: "#F97316", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
                    {showExplanation ? "Скрий обяснението" : "🦊 Фокси обяснява защо"}
                  </button>
                )}

                {showExplanation && currentResult?.errors?.length > 0 && (
                  <div style={{ background: "#FFF7ED", borderRadius: 16, padding: "16px", textAlign: "left", marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, color: "#F97316", marginBottom: 10 }}>Фокси казва: 🦊</div>
                    {currentResult.errors.map((err: any, i: number) => (
                      <div key={i} style={{ marginBottom: 10, fontSize: 14, color: "#292524", lineHeight: 1.6 }}>
                        <span style={{ color: "#EF4444", fontWeight: 800 }}>"{err.got || "пропуснато"}"</span>
                        {" → "}
                        <span style={{ color: "#16A34A", fontWeight: 800 }}>"{err.expected}"</span>
                        <div style={{ color: "#78716C", marginTop: 2 }}>
                          {err.expected === "" ? "Тази дума е излишна." :
                           err.got === "" ? `Пропусна думата "${err.expected}".` :
                           `Правилното изписване е "${err.expected}".`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={nextSentence}
                  style={{ width: "100%", padding: "16px", background: "#F97316", border: "none", borderRadius: 18, color: "#fff", fontSize: 18, fontWeight: 800, boxShadow: "0 6px 20px rgba(249,115,22,0.4)", fontFamily: "'Fredoka', sans-serif" }}>
                  {sentenceIdx >= activeDictation.sentences.length - 1 ? "Виж резултата! 🏆" : "Следващо изречение →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── ФИНАЛЕН РЕЗУЛТАТ ──────────────────────────────────────────
  if (screen === "result") {
    const stars = finalScore >= 90 ? 3 : finalScore >= 70 ? 2 : finalScore >= 50 ? 1 : 0;
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #FFF7ED, #FFEDD5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <style>{globalCSS}</style>
        <div className="pop" style={{ background: "#fff", borderRadius: 32, padding: "40px 32px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 24px 64px rgba(249,115,22,0.15)" }}>
          <FoksySvg size={130} mood={finalScore >= 70 ? "excited" : "thinking"} />
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 80, color: finalScore >= 70 ? "#16A34A" : "#F97316", lineHeight: 1 }}>{finalScore}%</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "12px 0 20px" }}>
            {[1,2,3].map(s => <span key={s} style={{ fontSize: 36, filter: s <= stars ? "none" : "grayscale(1) opacity(0.3)" }}>⭐</span>)}
          </div>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, color: "#292524", marginBottom: 8 }}>
            {finalScore >= 90 ? "Невероятно! 🎉" : finalScore >= 70 ? "Отлично! 👏" : finalScore >= 50 ? "Добра работа! 💪" : "Не се отказвай! 🦊"}
          </div>
          <div style={{ fontSize: 16, color: "#78716C", marginBottom: 8 }}>
            {finalScore >= 70 ? `Фокси е МНОГО горд от теб!` : `Фокси казва: Практикувай и ще станеш майстор!`}
          </div>
          {streak > 0 && <div style={{ fontSize: 15, color: "#F97316", fontWeight: 800, marginBottom: 24 }}>🔥 {streak} поредни диктовки!</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => startDictation(activeDictation)}
              style={{ padding: "16px", background: "#F97316", border: "none", borderRadius: 18, color: "#fff", fontSize: 18, fontWeight: 800, boxShadow: "0 6px 20px rgba(249,115,22,0.4)", fontFamily: "'Fredoka', sans-serif" }}>
              Опитай пак! 🔄
            </button>
            <button onClick={() => setScreen("app")}
              style={{ padding: "14px", background: "#fff", border: "2.5px solid #F97316", borderRadius: 18, color: "#F97316", fontSize: 16, fontWeight: 800, fontFamily: "'Fredoka', sans-serif" }}>
              Избери друга диктовка
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}