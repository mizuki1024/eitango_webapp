import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LineLogin = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogin = () => {
    const clientId = "2006672186"; // 環境変数で管理推奨
    const redirectUri = "http://localhost:3003/callback"; // フロントエンドのコールバックURL
    const state = encodeURIComponent(location.pathname + location.search); // 現在のページをstateに保存
    const scope = "profile openid email";

    // LINEログインのURLを作成
    const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;

    // LINEログインページへリダイレクト
    window.location.href = loginUrl;
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>LINEでログイン</h1>
      <button
        onClick={handleLogin}
        style={{
          backgroundColor: "#00C300",
          color: "#fff",
          border: "none",
          padding: "10px 20px",
          fontSize: "16px",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        LINEでログイン
      </button>
      <br />
      <button
        onClick={handleGoHome}
        style={{
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          padding: "10px 20px",
          fontSize: "16px",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        ホームに戻る
      </button>
    </div>
  );
};

export default LineLogin;
