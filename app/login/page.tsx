"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const saved = localStorage.getItem("collectpro_user");

    if (!saved) {
      alert("No account found");
      return;
    }

    const user = JSON.parse(saved);

    if (user.email === email && user.password === password) {
      localStorage.setItem("isLoggedIn", "true");
      router.push("/dashboard");
    } else {
      alert("Wrong credentials");
    }
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
        <h2 style={{ marginBottom: 20 }}>Login</h2>

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

        <button onClick={handleLogin} style={btnStyle}>
          Login
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