"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode,     setMode]     = useState<"login" | "signup">("login");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/dashboard");
    });
  }, []);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState("");

  const supabase = createClient();

  const handleEmailAuth = async () => {
    setError("");
    setSuccess("");
    if (!email.trim())       return setError("Email is required");
    if (!password.trim())    return setError("Password is required");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) setError(error.message);
      else setSuccess("Check your email for a confirmation link.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <main style={{
        background: "#0a0a0a",
        color: "#ececec",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          input::placeholder { color: rgba(236,236,236,.22); }
          input:focus { outline: none; border-color: rgba(200,245,90,.45) !important; }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div style={{
          width: "100%",
          maxWidth: 420,
          border: "1px solid rgba(236,236,236,.1)",
          borderRadius: 8,
          background: "#111",
          overflow: "hidden",
          animation: "fadeUp .35s ease",
        }}>

          {/* ── logo ── */}
          <div style={{ padding: "32px 36px 0", textAlign: "center" }}>
            <a href="/" style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "#ececec" }}>
                Collect<span style={{ color: "#c8f55a" }}>Pro</span>
              </span>
            </a>
            <p style={{ fontSize: 13, color: "rgba(236,236,236,.3)", marginTop: 8 }}>
              {mode === "login" ? "Sign in to your account" : "Create your account"}
            </p>
          </div>

          {/* ── tabs ── */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(236,236,236,.08)", margin: "28px 36px 0" }}>
            {(["login", "signup"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }} style={{
                flex: 1, padding: "10px",
                background: "transparent", border: "none",
                borderBottom: mode === m ? "2px solid #c8f55a" : "2px solid transparent",
                color: mode === m ? "#c8f55a" : "rgba(236,236,236,.35)",
                fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
                cursor: "pointer", transition: "color .18s",
              }}>
                {m === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* ── form ── */}
          <div style={{ padding: "28px 36px 36px", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* google button */}
            <button onClick={handleGoogle} style={{
              width: "100%", padding: "12px",
              background: "transparent",
              color: "rgba(236,236,236,.7)",
              border: "1px solid rgba(236,236,236,.12)",
              borderRadius: 4,
              fontFamily: "'Inter', sans-serif", fontSize: 14,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "border-color .18s, color .18s, background .18s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(236,236,236,.28)"; e.currentTarget.style.color = "#ececec"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(236,236,236,.12)"; e.currentTarget.style.color = "rgba(236,236,236,.7)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </button>

            {/* divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(236,236,236,.08)" }}/>
              <span style={{ fontSize: 11, color: "rgba(236,236,236,.25)", letterSpacing: ".06em" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "rgba(236,236,236,.08)" }}/>
            </div>

            {/* email field */}
            <div>
              <label style={{ display: "block", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(236,236,236,.35)", marginBottom: 7 }}>
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(236,236,236,.1)",
                  borderRadius: 4, color: "#ececec",
                  fontFamily: "'Inter', sans-serif", fontSize: 14,
                }}
              />
            </div>

            {/* password field */}
            <div>
              <label style={{ display: "block", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(236,236,236,.35)", marginBottom: 7 }}>
                Password
              </label>
              <input
                type="password"
                placeholder="minimum 6 characters"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleEmailAuth()}
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(236,236,236,.1)",
                  borderRadius: 4, color: "#ececec",
                  fontFamily: "'Inter', sans-serif", fontSize: 14,
                }}
              />
            </div>

            {/* error message */}
            {error && (
              <p style={{
                fontSize: 12, color: "#f87171",
                padding: "10px 14px",
                background: "rgba(248,113,113,.08)",
                borderRadius: 4,
                border: "1px solid rgba(248,113,113,.15)",
              }}>
                {error}
              </p>
            )}

            {/* success message */}
            {success && (
              <p style={{
                fontSize: 12, color: "#c8f55a",
                padding: "10px 14px",
                background: "rgba(200,245,90,.06)",
                borderRadius: 4,
                border: "1px solid rgba(200,245,90,.15)",
              }}>
                {success}
              </p>
            )}

            {/* submit button */}
            <button
              onClick={handleEmailAuth}
              disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading ? "rgba(200,245,90,.5)" : "#c8f55a",
                color: "#0a0a0a",
                border: "none", borderRadius: 4,
                fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background .18s, transform .1s",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#b8e84a"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#c8f55a"; }}
            >
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>

            {/* switch mode */}
            <p style={{ fontSize: 12, color: "rgba(236,236,236,.3)", textAlign: "center" }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
                style={{
                  background: "none", border: "none",
                  color: "#c8f55a", cursor: "pointer",
                  fontSize: 12, fontFamily: "'Inter', sans-serif",
                }}
              >
                {mode === "login" ? "Sign up" : "Login"}
              </button>
            </p>

          </div>
        </div>
      </main>
    </>
  );
}