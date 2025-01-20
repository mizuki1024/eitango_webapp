import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const localbase = process.env.REACT_APP_LOCALBASE_URL;

const LineCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get("code");
    const state = queryParams.get("state");

    const localState = localStorage.getItem("state");
    if (!code || !state || state !== localState) {
      console.error("認証コードまたはstateが不足、または不一致です");
      navigate("/login");
      return;
    }

    const fetchToken = async () => {
      try {
        const response = await fetch(`${localbase}/line/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Login failed:", errorData);
          alert(`ログインに失敗しました: ${errorData.error}`);
          navigate("/login");
          return;
        }

        const userData = await response.json();
        console.log("Login successful:", userData);

        const user = {
          username: userData.username,
          line_user_id: userData.line_user_id,
          token: userData.token,
        };

        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        navigate("/");
      } catch (error) {
        console.error("通信エラー:", error.message);
        alert("通信エラーが発生しました。再度お試しください。");
        navigate("/login");
      }
    };

    fetchToken();
  }, [navigate, setUser]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>ログイン処理中...</h2>
      <p>しばらくお待ちください</p>
    </div>
  );
};

export default LineCallback;
