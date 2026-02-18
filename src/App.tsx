import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Learn } from './pages/Learn';
import { Quiz } from './pages/Quiz';
import { Dictation } from './pages/Dictation';
import { TimeChallenge } from './pages/TimeChallenge';
import { Profile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';
import { ChapterSelection } from './pages/ChapterSelection';
import { ModeSelection } from './pages/ModeSelection';
import { FallingWords } from './pages/FallingWords';
import { GameSelection } from './pages/GameSelection';
import { WordScramble } from './pages/WordScramble';
import { PairMatching } from './pages/PairMatching';
import { GradeSelection } from './pages/GradeSelection';
import { WritingCenter } from './pages/WritingCenter';


import { Login } from './pages/Login';
import { useGameStore } from './store/useGameStore';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { userData } = useGameStore();

  // Note: For a real app, we might want to wait for auth initialization.
  // But since we persist state, if userData.uid is null, we assume logout/not logged in.
  if (!userData?.uid) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Home />} />
          <Route path="grades" element={<GradeSelection />} />
          <Route path="chapters" element={<ChapterSelection />} />
          <Route path="modes" element={<ModeSelection />} />
          <Route path="learn" element={<Learn />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="dictation" element={<Dictation />} />
          <Route path="time-challenge" element={<TimeChallenge />} />
          <Route path="games" element={<GameSelection />} />
          <Route path="falling-words" element={<FallingWords />} />
          <Route path="word-scramble" element={<WordScramble />} />
          <Route path="pair-matching" element={<PairMatching />} />
          <Route path="writing-center" element={<WritingCenter />} />
          <Route path="profile" element={<Profile />} />
          <Route path="leaderboard" element={<Leaderboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
