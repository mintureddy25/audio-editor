import React, { useState, useRef, useContext, useEffect } from "react";
import RecordRTC from "recordrtc";
import Wavesurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { FileContext } from "./fileContext";


const UploadAudio = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [recorder, setRecorder] = useState(null);
  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const { fileURL, setFileURL } = useContext(FileContext);


  const initialRegions = [ 
	{
		start: 0,
		end: 20,
		content: 'Resize me',
		color: 'rgba(255, 0, 0, 0.5)',
		drag: false,
		resize: true,
	},
  ];

  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }
    if (audioURL) {
      const wavesurfer = Wavesurfer.create({
        container: waveformRef.current,
        waveColor: "violet",
        progressColor: "purple",
        plugins: [
          RegionsPlugin.create({
            regions: initialRegions,
            dragSelection: true,
          }),
        ],
      });
     
      wavesurfer.load(audioURL);
      wavesurferRef.current = wavesurfer;
    }
  }, [audioURL]);

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
      });
    }
  };

  const deleteAudio = () => {
    setAudioURL("");
    setRecorder(null);
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }
  };

  const downloadAudio = () => {
    if (audioURL) {
      const link = document.createElement("a");
      link.href = audioURL;
      link.download = "recording.wav";
      link.click();
    }
  };

  const trimAudio = () => {
    if (wavesurferRef.current) {
      console.log(wavesurferRef, "mintu reddy");
      const regions = wavesurferRef.current.regions.list;
      const start = regions[0]?.start || 0;
      const end = regions[0]?.end || wavesurferRef.current.getDuration();
      // Logic to trim the audio based on selected region
      console.log(`Trim from ${start} to ${end}`);
    }
  };

  return (
    <div>
      <h1>Audio Recorder</h1>
      {isRecording ? (
        <button onClick={stopRecording}>Stop Recording</button>
      ) : (
        <button onClick={startRecording}>Start Recording</button>
      )}
      {audioURL && (
        <div>
          <audio ref={audioRef} src={audioURL} controls />
          <div
            ref={waveformRef}
            style={{ width: "100%", height: "150px" }}
          ></div>
          <button onClick={downloadAudio}>Download Audio</button>
          <button onClick={deleteAudio}>Delete Audio</button>
          <button onClick={trimAudio}>Trim Audio</button>
        </div>
      )}
    </div>
  );
};

export default UploadAudio;
