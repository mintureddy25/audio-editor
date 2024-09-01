import React, { useState, useRef, useContext, useEffect } from "react";
import RecordRTC from "recordrtc";
import { FileContext } from "../../utils/fileContext";
import { useNavigate } from "react-router-dom";

const RecordAudio = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [recorder, setRecorder] = useState(null);

  const { fileURL, setFileURL } = useContext(FileContext);
  const navigate = useNavigate();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recordRTC = new RecordRTC(stream, { type: "audio" });
      recordRTC.startRecording();
      setRecorder(recordRTC);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone", error);
    }
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setFileURL(url);
        setIsRecording(false);
        setFileURL(url);
        navigate("/edit");
      });
    }
  };

  return (
    <>
      <div className="bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Audio Recorder
          </h2>
          {isRecording ? (
            <button onClick={stopRecording}>Stop Recording</button>
          ) : (
            <button onClick={startRecording}>Start Recording</button>
          )}
        </div>
      </div>
    </>
  );
};

export default RecordAudio;
