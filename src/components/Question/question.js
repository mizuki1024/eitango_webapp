import React, { useState, useEffect, useCallback, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../AuthContext";
import "./question.css";

function QuestionPage() {
  const baseUrl = process.env.REACT_APP_BASE_URL;
  const { level } = useParams(); // URLからレベルを取得
  const navigate = useNavigate(); // ページ遷移用
  const { user } = useContext(AuthContext); // ログイン情報を取得
  const [questions, setQuestions] = useState([]); // クイズデータ
  const [currentQuestion, setCurrentQuestion] = useState(null); // 現在のクイズ
  const [usedQuestions, setUsedQuestions] = useState([]); // 使用済みのクイズ
  const [progressPercentage, setProgressPercentage] = useState(0); // 進捗率

  useEffect(() => {
    if (!user || !user.line_user_id || !user.token) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.line_user_id && user?.token) {
      const baseUrl = process.env.REACT_APP_LOCALSERVER_URL;
      fetch(`http://localhost:3002/words/${level}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => setQuestions(data))
        .catch((error) => console.error("Error fetching data:", error));
    }
  }, [level, user]);

  // ランダムなクイズを選択
  const pickRandomQuestion = useCallback(() => {
    if (questions.length === 0) return null;
    const availableQuestions = questions.filter((q) => !usedQuestions.includes(q.id));
    if (availableQuestions.length === 0) return null;
    const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    setUsedQuestions((prevUsed) => [...prevUsed, randomQuestion.id]);
    return randomQuestion;
  }, [questions, usedQuestions]);

  // 初回のクイズ設定
  useEffect(() => {
    if (questions.length > 0 && !currentQuestion) {
      const question = pickRandomQuestion();
      setCurrentQuestion(question);
    }
  }, [questions, currentQuestion, pickRandomQuestion]);

  // 進捗率の更新
  useEffect(() => {
    setProgressPercentage((usedQuestions.length / 20) * 100);
  }, [usedQuestions]);

  // 回答処理
  const handleAnswer = async (selectedOption) => {
    const isCorrect =
      currentQuestion.options[currentQuestion.correctOption].word === selectedOption.word;

    const nextQuestion = pickRandomQuestion();

    // 履歴をサーバーに保存
    if (user?.line_user_id) {
      try {
        await fetch("http://localhost:3002/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            user_id: user.line_user_id,
            word_id: currentQuestion.id,
            date: new Date().toISOString(),
            state: isCorrect ? 1 : 2,
          }),
        });
      } catch (error) {
        console.error("Failed to save answer:", error);
      }
    }

    // 回答結果ページに移動
    navigate("/answer", {
      state: {
        selectedOption,
        result: isCorrect ? "正解！" : "不正解...",
        word: currentQuestion.word,
        correctOption: currentQuestion.options[currentQuestion.correctOption],
        usedQuestionsLength: usedQuestions.length,
        level,
        nextQuestion,
        options: currentQuestion.options,
        wordId: currentQuestion.id,
        line_user_id: user?.line_user_id,
      },
    });
  };

  // トップページに戻る
  const handleBackToStudy = () => {
    navigate("/study");
  };

  // クイズがない場合の表示
  if (!currentQuestion) {
    return <div className="loading">問題をロード中...</div>;
  }

  return (
    <div className="question-page-container">
      <div className="question-card">
        <div className="question-header">
          <h1>レベル{level} クイズ</h1>
        </div>

        <div className="question-content">
          <h2 className="question-text">{currentQuestion.word}</h2>
          <p className="instruction-text">以下の選択肢から正しい日本語訳を選んでください</p>
        </div>

        <div className="options-container">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className="option-button"
              onClick={() => handleAnswer(option)}
            >
              {option.meaning}
            </button>
          ))}
        </div>

        <div className="navigation-container">
          <button className="back-button" onClick={handleBackToStudy}>
            トップページに戻る
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuestionPage;
