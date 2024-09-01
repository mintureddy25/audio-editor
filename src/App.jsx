import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import RecordAudio from "./components/RecordAudio";
import AudioEditor from "./components/EditAudio";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<RecordAudio />} />
          <Route path="/edit" element={<AudioEditor />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
