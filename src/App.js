import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/Homepage/Homepage';
import StudyPage from './components/study/study';
import ReviewPage from './components/mistakes-page/page';
import QuestionPage from './components/Question/question';
import Answer from './components/Answer/answer';
import LineLogin from "./LineLogin";
import LineCallback from "./Linecallback";
import { AuthProvider } from './AuthContext'; // AuthContext をインポート

function App() {
  return (
    <AuthProvider> {/* AuthProvider で全体をラップ */}
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/level/:level" element={<QuestionPage />} />
          <Route path="/answer" element={<Answer />} />
          <Route path="/login" element={<LineLogin />} />
          <Route path="/callback" element={<LineCallback />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;