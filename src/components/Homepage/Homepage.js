import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';

const baseUrl = process.env.REACT_APP_LOCALSERVER_URL;

function HomePage() {
  const [reminderMessage, setReminderMessage] = useState('');

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${baseUrl}/history_v2?userId=1`);
      const data = await response.json();
      
      const today = new Date();
      const reminders = data.history.filter(item => {
        const learnDate = new Date(item.date);
        const daysPassed = (today - learnDate) / (1000 * 60 * 60 * 24);
        return item.state === 0 && (Math.floor(daysPassed) === 3 || Math.floor(daysPassed) === 7);
      });

      if (reminders.length > 0) {
        setReminderMessage('復習の時間だよ！');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="home-page">
      {reminderMessage && (
        <div className="notification">
          <Link to="/review">🔔{reminderMessage}</Link>
        </div>
      )}
      <h1 className="title">Word Master</h1>
      <p className="subtitle">⭐ めざせ習得8,000単語！ ⭐</p>
      <div className="actions">
        <div className="action-card">
          <Link to="/study">
            <div className="icon">📖</div>
            <h2>学習をする</h2>
            <p>新しい単語を学習しよう</p>
          </Link>
        </div>
        <div className="action-card">
          <Link to="/review">
            <div className="icon">🔄</div>
            <h2>復習をする</h2>
            <p>間違えた単語を復習しよう</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;