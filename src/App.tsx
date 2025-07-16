import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GitProfile from './components/gitprofile';
import ChessBotPage from './pages/chessbot';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GitProfile config={CONFIG} />} />
        <Route path="/chessnet" element={<ChessBotPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
