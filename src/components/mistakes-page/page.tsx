'use client';
import React, { useState, useEffect } from 'react';
import './mistakes.css'; // CSSファイルをインポート
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

interface Mistake {
  word: string;
  jword: string;
}

interface HistoryEntry {
  history_id: number;
  date: string;
  mistakes: Mistake[];
}

export default function WordMaster() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filteredMistakes, setFilteredMistakes] = useState<Mistake[]>([]);
  const [initialMistakeCount, setInitialMistakeCount] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<Mistake | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([]);

  useEffect(() => {
    fetch('http://localhost:3002/history_v2')
      .then((response) => response.json())
      .then((data) => {
        const groupedHistory = data.history.reduce((acc: any, item: any) => {
          const { date, word, jword } = item;
          const existing = acc.find((entry: any) => entry.date === date);
          if (existing) {
            if (!existing.mistakes.some((mistake: Mistake) => mistake.word === word)) {
              existing.mistakes.push({ word, jword });
            }
          } else {
            acc.push({ date, mistakes: [{ word, jword }] });
          }
          return acc;
        }, []);
        setHistory(groupedHistory);
        setLoading(false);
      })
      .catch((error) => {
        console.error('データ取得エラー:', error);
        setLoading(false);
      });
  }, []);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    const selectedHistory = history.find((entry) => entry.date === date);
    if (selectedHistory) {
      setFilteredMistakes(selectedHistory.mistakes);
      setInitialMistakeCount(selectedHistory.mistakes.length);
      setCurrentQuestion(selectedHistory.mistakes[0]);
      const choices = generateChoices(selectedHistory.mistakes[0]);
      setShuffledChoices(choices);
    }
    setSelectedAnswer(null);
    setCorrectCount(0);
    setIsTestCompleted(false);
  };

  const handleBackToDateSelection = () => {
    setSelectedDate(null);
    setFilteredMistakes([]);
    setCurrentQuestion(null);
    setInitialMistakeCount(0);
    setShuffledChoices([]);
  };

  const handleAnswerSelect = (choice: string) => {
    setSelectedAnswer(choice);
    if (currentQuestion && choice === currentQuestion.jword) {
      setCorrectCount(correctCount + 1);
    }
  };

  const handleNextQuestion = () => {
    const remainingQuestions = filteredMistakes.slice(1);
    if (remainingQuestions.length > 0) {
      setFilteredMistakes(remainingQuestions);
      setCurrentQuestion(remainingQuestions[0]);
      const choices = generateChoices(remainingQuestions[0]);
      setShuffledChoices(choices);
      setSelectedAnswer(null);
    } else {
      setIsTestCompleted(true);
    }
  };

  const generateChoices = (question: Mistake): string[] => {
    const allWords = history
      .flatMap((entry) => entry.mistakes.map((mistake) => mistake.jword))
      .filter((word) => word !== question.jword);
    const randomChoices = shuffleArray(allWords).slice(0, 2);
    return shuffleArray([question.jword, ...randomChoices]);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    return array.sort(() => Math.random() - 0.5);
  };

  if (loading) {
    return <div className="loading">データを読み込み中...</div>;
  }

  if (!selectedDate) {
    return (
      <div className="container">
        <main className="main-content">
          <div className="header">
            <h1>復習ページ</h1>
            <h2>復習日を選んでください</h2>
          </div>
          <div className="date-grid">
            {history.map((entry, index) => (
              <Card key={index} className="card">
                <CardContent className="card-content">
                  <h2>{entry.date}</h2>
                  <p>間違えた単語: {entry.mistakes.length}個</p>
                  <Button
                    className="select-date-button"
                    onClick={() => handleDateSelect(entry.date)}
                  >
                    この日を選択
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (isTestCompleted) {
    return (
      <div className="result-container">
        <h2>テスト結果</h2>
        <p>
          正解数: {correctCount} / {initialMistakeCount}
        </p>
        <Button className="back-button" onClick={handleBackToDateSelection}>
          日付選択に戻る
        </Button>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div>問題がありません。</div>;
  }

  return (
    <div className="quiz-container">
      <Card className="quiz-card">
        <CardContent className="quiz-content">
          <h1 className="quiz-title">復習テスト</h1>
          <h2>残り問題数: {filteredMistakes.length}</h2>
          <p>"{currentQuestion.word}" の日本語は？</p>
          <div className="choice-grid">
            {shuffledChoices.map((choice, index) => (
              <Button
                key={index}
                className={`choice-button ${
                  selectedAnswer === choice
                    ? choice === currentQuestion.jword
                      ? 'correct-choice'
                      : 'incorrect-choice'
                    : ''
                }`}
                onClick={() => handleAnswerSelect(choice)}
                disabled={selectedAnswer !== null}
              >
                {choice}
              </Button>
            ))}
          </div>
          {selectedAnswer && (
            <div className="answer-section">
              <p>正解は: <span className="correct-answer">{currentQuestion.jword}</span></p>
              <Button className="next-button" onClick={handleNextQuestion}>
                次の問題へ
              </Button>
            </div>
          )}
          <Button className="back-button" onClick={handleBackToDateSelection}>
            日付選択に戻る
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
