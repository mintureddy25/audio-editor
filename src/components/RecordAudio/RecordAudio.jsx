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
          <div className="mx-auto max-w-xs px-8">
            <p className="mt-6 flex items-baseline justify-center gap-x-2">
              <span className="text-5xl font-bold tracking-tight text-gray-900">
                Audio Recorder
              </span>
            </p>
            {isRecording ? (
              <button
                type="button"
                className="mt-10 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={stopRecording}
              >
                Stop Recording
              </button>
            ) : (
              <button
                type="button"
                className="mt-10 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={startRecording}
              >
                Start Recording
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RecordAudio;
