import logo from "./logo.svg";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "./App.css";
import AudioRecorder from "./components/audioEditor";
import UploadAudio from "./components/uploadAudio";
import Waveform from "./components/mintu";
import Custom from "./components/Custom";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<UploadAudio />} />
          <Route path="/edit" element={<AudioRecorder />} />
          <Route path="/custom" element={<Custom />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

