"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = () => {
    if (!email || !password) {
      alert("Fill all fields");
      return;
    }

    const user = { email, password };

    localStorage.setItem("collectpro_user", JSON.stringify(user));

    alert("Account created");
    router.push("/login");
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "white",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        padding: 30,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,.1)",
        width: 320
      }}>
        <h2 style={{ marginBottom: 20 }}>Create Account</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button onClick={handleSignup} style={btnStyle}>
          Signup
        </button>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: 12,
  marginBottom: 12,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.1)",
  background: "transparent",
  color: "white"
};

const btnStyle = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "none",
  background: "#c8f55a",
  fontWeight: 600,
  cursor: "pointer"
};