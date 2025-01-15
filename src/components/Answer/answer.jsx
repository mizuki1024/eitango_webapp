import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./answer.css";

export default function QuizAnswer() {
  const location = useLocation();
  const navigate = useNavigate();

  // location.state からデータ取得
  const {
    word = "appropriate",
    correctOption = { word: "適切な", meaning: "appropriate" },
    selectedOption = { word: "適切な" },
    options = [
      { word: "適切な", meaning: "appropriate" },
      { word: "次の", meaning: "next" },
      { word: "起こる", meaning: "happen" },
    ],
    level = 1,
  } = location.state || {};

  // 正誤判定
  const isCorrect = selectedOption.word === correctOption.word;

  // 次の問題への遷移
  const handleNextQuestion = () => {
    navigate(`/level/${level}`);
  };

  return (
    <div className="quiz-answer-page">
      <div className="quiz-answer-card">
        {/* ヘッダー */}
        <div className="quiz-answer-header">レベル{level} クイズ</div>

        {/* 質問 */}
        <div className="quiz-answer-question">
          <h2>{word}</h2>
          <p>以下の選択肢から正しい日本語訳を選んでください</p>
        </div>

        {/* 選択肢 */}
        <div className="quiz-answer-options">
          {options.map((option, index) => {
            const isCorrectOption = option.word === correctOption.word;
            const isUserSelected = option.word === selectedOption.word;

            return (
              <button
                key={index}
                className={`quiz-answer-button ${
                  isCorrectOption
                    ? "correct"
                    : isUserSelected && !isCorrectOption
                    ? "incorrect"
                    : "neutral"
                }`}
              >
                <div className="quiz-option-text">
                  <span>{option.word}</span>
                  <span className="quiz-option-meaning">({option.meaning})</span>
                </div>
                {isCorrectOption && <span className="status">正解</span>}
                {isUserSelected && !isCorrectOption && (
                  <span className="status">間違い</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 次の問題へ */}
        <div className="quiz-answer-next">
          <button onClick={handleNextQuestion}>次の問題へ</button>
        </div>
      </div>
    </div>
  );
}
