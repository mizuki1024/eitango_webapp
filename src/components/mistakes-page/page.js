'use client';
import React, { useState, useEffect, useContext } from 'react';
import './mistakes.css';
import { AuthContext } from "../../AuthContext";
import { useNavigate } from 'react-router-dom';
const baseUrl = process.env.REACT_APP_LOCALSERVER_URL;
export default function WordMaster() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredMistakes, setFilteredMistakes] = useState([]);
  const [initialMistakeCount, setInitialMistakeCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [shuffledChoices, setShuffledChoices] = useState([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    if (!user || !user.token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    fetch(`${baseUrl}/history_v2?userId=${user.line_user_id}`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const groupedHistory = data.history.reduce((acc, item) => {
          const date = item.date.split('T')[0];
          if (!acc[date]) acc[date] = [];
          acc[date].push({ word: item.word, jword: item.jword });
          return acc;
        }, {});
        setHistory(Object.entries(groupedHistory).map(([date, mistakes]) => ({ date, mistakes })));
        setLoading(false);
      })
      .catch((error) => {
        console.error('データ取得エラー:', error);
        setLoading(false);
      });
  }, [user, navigate]);

  const handleDateSelect = (date) => {
    const selectedHistory = history.find((entry) => entry.date === date);
    if (selectedHistory) {
      setSelectedDate(date);
      setFilteredMistakes(selectedHistory.mistakes);
      setInitialMistakeCount(selectedHistory.mistakes.length);
      setCurrentQuestion(selectedHistory.mistakes[0]);
      setShuffledChoices(generateChoices(selectedHistory.mistakes[0]));
      setCorrectCount(0);
      setSelectedAnswer(null);
      setIsTestCompleted(false);
    }
  };

  const generateChoices = (question) => {
    const allWords = history.flatMap((entry) => entry.mistakes.map((mistake) => mistake.jword));
    const otherChoices = allWords.filter((jword) => jword !== question.jword);
    const randomChoices = shuffleArray(otherChoices).slice(0, 2);
    return shuffleArray([question.jword, ...randomChoices]);
  };

  const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

  const handleAnswerSelect = (choice) => {
    setSelectedAnswer(choice);
    if (choice === currentQuestion.jword) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    const remainingQuestions = filteredMistakes.slice(1);
    if (remainingQuestions.length > 0) {
      setFilteredMistakes(remainingQuestions);
      setCurrentQuestion(remainingQuestions[0]);
      setShuffledChoices(generateChoices(remainingQuestions[0]));
      setSelectedAnswer(null);
    } else {
      setIsTestCompleted(true);
    }
  };

  if (loading) {
    return <div className="loading">データを読み込み中...</div>;
  }

  if (!selectedDate) {
    return (
      <div className="question-page-container">
        <div className="question-card">
          <div className="question-header">
            <h1>復習ページ</h1>
            <h2>復習日を選んでください</h2>
          </div>
          <div className="date-grid">
            {history.map((entry, index) => (
              <div key={index} className="date-card">
                <h2>{entry.date}</h2>
                <p>間違えた単語: {entry.mistakes.length}個</p>
                <button className="date-button" onClick={() => handleDateSelect(entry.date)}>
                  復習開始
                </button>
              </div>
            ))}
          </div>
          {/* ホームに戻るボタンを追加 */}
          <div className="home-button-container">
            <button className="home-button" onClick={() => navigate('/')}>
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isTestCompleted) {
    const score = Math.round((correctCount / initialMistakeCount) * 100);
    return (
      <div className="result-container">
        <div className="result-card">
          <h2>テスト結果</h2>
          <p>正解数: {correctCount} / {initialMistakeCount}</p>
          <p>スコア: {score} 点</p>
          <button className="back-to-date-button" onClick={() => setSelectedDate(null)}>
            日付選択に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="question-page-container">
      <div className="question-card">
        <div className="question-header">
          <h1>復習テスト</h1>
        </div>
        <div className="question-content">
          <h2 className="question-text">{currentQuestion.word}</h2>
          <p className="instruction-text">以下の選択肢から正しい日本語訳を選んでください</p>
        </div>
        <div className="options-container">
          {shuffledChoices.map((choice, index) => (
            <React.Fragment key={index}>
              <button
                className={`option-button ${
                  selectedAnswer !== null
                    ? choice === currentQuestion.jword
                      ? 'correct-choice'
                      : choice === selectedAnswer
                      ? 'incorrect-choice'
                      : 'disabled-choice'
                    : ''
                }`}
                onClick={() => handleAnswerSelect(choice)}
                disabled={selectedAnswer !== null}
                aria-label={`選択肢 ${choice}`}
              >
                {choice}
              </button>
              {index === 2 && !selectedAnswer && (
                <button
                  className="back-to-date-button"
                  onClick={() => setSelectedDate(null)}
                >
                  日付選択に戻る
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
        {selectedAnswer && (
          <div className="answer-section">
            <p
              className={`answer-text ${
                selectedAnswer === currentQuestion.jword ? 'correct-answer' : 'incorrect-answer'
              }`}
            >
              {selectedAnswer === currentQuestion.jword ? '正解！' : '不正解...'}
            </p>
            <p>正解は: <span>{currentQuestion.jword}</span></p>
            <button className="next-button" onClick={handleNextQuestion}>
              次の問題へ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
