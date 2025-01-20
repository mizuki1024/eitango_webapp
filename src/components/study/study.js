import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./study.css";

const Study = () => {
  const navigate = useNavigate(); // navigateを使用してルートパスに戻る

  return (
    <div className="study-container">
      <header className="study-header">
        <h1 className="study-title">単語master</h1>
        <p className="study-subtitle">めざせ習得8,000単語！</p>
        <p className="study-instruction">学習レベルを選んでください。</p>
      </header>
      <main className="study-levels">
        {[
          { level: 1, title: "初級", desc: "基本的な単語" },
          { level: 2, title: "中級", desc: "大学受験の単語" },
          { level: 3, title: "上級", desc: "TOEFLやTOEIC" },
          { level: 4, title: "至難", desc: "辞書なしで新聞を" },
        ].map((item, index) => (
          <div key={index} className={`level-card level-${item.level}`}>
            <h2 className="level-title">
              レベル{item.level} ({item.title})
            </h2>
            <p className="level-description">{item.desc}</p>
            <Link to={`/level/${item.level}`} className="start-button">
              開始
            </Link>
          </div>
        ))}
      </main>
      {/* ホームに戻るボタンを追加 */}
      <div className="home-button-container">
        <button className="home-button" onClick={() => navigate("/")}>
          ホームに戻る
        </button>
      </div>
      <footer className="study-footer">
        <p>© 2025 単語master</p>
      </footer>
    </div>
  );
};

export default Study;
