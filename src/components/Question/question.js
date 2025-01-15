import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './question.css';

function QuestionPage() {
  const { level } = useParams();
  const location = useLocation();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [usedQuestions, setUsedQuestions] = useState(location.state?.usedQuestions || []);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');

    if (loggedInUser) {
      try {
        const userData = JSON.parse(loggedInUser);
        setUser(userData);
      } catch (error) {
        console.error("localStorageからのデータ読み込みエラー:", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetch(`http://localhost:3002/words/${level}`, {
      headers: {
        Authorization: `Bearer ${user?.token}`
      }
    })
      .then((response) => response.json())
      .then((data) => {
        setQuestions(data);
      })
      .catch((error) => console.error('Error fetching data:', error));
  }, [level, user]);

  const pickRandomQuestion = useCallback(() => {
    const availableQuestions = questions.filter((q) => !usedQuestions.includes(q.id));
    if (availableQuestions.length === 0 || usedQuestions.length >= 20) {
      return null;
    }
    const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    setUsedQuestions((prevUsed) => [...prevUsed, randomQuestion.id]);
    return randomQuestion;
  }, [questions, usedQuestions]);

  useEffect(() => {
    if (questions.length > 0 && !currentQuestion) {
      setCurrentQuestion(pickRandomQuestion());
    }
  }, [questions, currentQuestion, pickRandomQuestion]);

  useEffect(() => {
    setProgressPercentage((usedQuestions.length / 20) * 100);
  }, [usedQuestions]);

  const handleAnswer = (selectedOption) => {
    const isCorrect =
      currentQuestion.options[currentQuestion.correctOption].word === selectedOption.word;

    const nextQuestion = pickRandomQuestion();

    navigate('/answer', {
      state: {
        selectedOption,
        result: isCorrect ? '正解！' : '不正解...',
        word: currentQuestion.word,
        correctOption: currentQuestion.options[currentQuestion.correctOption],
        usedQuestionsLength: usedQuestions.length,
        level,
        nextQuestion,
        options: currentQuestion.options,
        wordId: currentQuestion.id,
        userId: user?.id,
      },
    });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

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
          <button className="back-button" onClick={handleBackToHome}>トップページに戻る</button>
        </div>
      </div>
    </div>
  );
}

export default QuestionPage;
