import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "./components/layout/Navigation";
import Home from "./pages/home";
import Game from "./pages/game";
import Info from "./pages/info";
import Generation from "./pages/generation";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-base-300">
        <Navigation />
        <div className="lg:ml-64 lg:pt-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<Game />} />
            <Route path="/info" element={<Info />} />
            <Route path="/generation" element={<Generation />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
