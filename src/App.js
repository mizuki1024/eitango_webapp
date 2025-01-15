import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/Homepage/Homepage';
import StudyPage from './components/study/study';
import ReviewPage from './components/mistakes-page/page';
import QuestionPage from './components/Question/question';
import Answer from './components/Answer/answer';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/level/:level" element={<QuestionPage />} />
        <Route path="/answer" element={<Answer />} />
        
      </Routes>
    </Router>
  );
}
export default App;