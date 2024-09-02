import React, { useState, useEffect, useContext, useRef } from "react";
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js";
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.min.js";
import {
  PlusIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/20/solid";
import wavesurfer from "wavesurfer.js";
import { FileContext } from "../../utils/FileContent";
import { useNavigate } from "react-router-dom/dist";
import DownloadPopup from "../../utils/DownloadPopup";
import { MdReplay, MdZoomIn, MdZoomOut } from "react-icons/md";
import { FaPlay, FaPause } from "react-icons/fa";
import {
  convertBufferToWav,
  convertBufferToAac,
  convertBufferToMp3,
} from "../../utils/Helpers";

const AudioEditor = (url) => {
  const wavesurferRef = useRef(null);
  const timelineRef = useRef(null);
  const navigate = useNavigate();

  const { fileURL, setFileURL } = useContext(FileContext);

  const [wavesurferObj, setWavesurferObj] = useState();

  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [duration, setDuration] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (wavesurferRef.current && !wavesurferObj) {
      setWavesurferObj(
        wavesurfer.create({
          container: "#waveform",
          scrollParent: true,
          autoCenter: true,
          cursorColor: "yellow",
          loopSelection: true,
          waveColor: "#4F46E5",
          progressColor: "#4F46E5",
          responsive: true,
          plugins: [
            TimelinePlugin.create({
              container: "#wave-timeline",
            }),
            RegionsPlugin.create({}),
          ],
        })
      );
    }
  }, [wavesurferRef, wavesurferObj]);

  useEffect(() => {
    if (fileURL && wavesurferObj) {
      wavesurferObj.load(fileURL);
    }
  }, [fileURL, wavesurferObj]);

  useEffect(() => {
    if (wavesurferObj) {
      wavesurferObj.on("ready", () => {
        wavesurferObj.play();
        wavesurferObj.enableDragSelection({});
        setDuration(Math.floor(wavesurferObj.getDuration()));
      });

      wavesurferObj.on("play", () => {
        setPlaying(true);
      });

      wavesurferObj.on("finish", () => {
        setPlaying(false);
      });

      wavesurferObj.on("region-updated", (region) => {
        const regions = region.wavesurfer.regions.list;
        const keys = Object.keys(regions);
        if (keys.length > 1) {
          regions[keys[0]].remove();
        }
      });
    }
  }, [wavesurferObj]);

  useEffect(() => {
    if (wavesurferObj) wavesurferObj.setVolume(volume);
  }, [volume, wavesurferObj]);

  useEffect(() => {
    if (wavesurferObj) wavesurferObj.zoom(zoom);
  }, [zoom, wavesurferObj]);

  useEffect(() => {
    if (duration && wavesurferObj) {
      if (Object.keys(wavesurferObj.regions.list).length === 0) {
        wavesurferObj.addRegion({
          id: "default-region",
          start: Math.floor(wavesurferObj.getDuration() / 2) - Math.floor(wavesurferObj.getDuration()) / 5,
          end: Math.floor(wavesurferObj.getDuration() / 2),
          color: "hsla(241, 100%, 80%, 0.4)",
        });
      }
    }
  }, [duration, wavesurferObj]);

  const handleSplit = () => {
    if (wavesurferObj) {
      const regions = wavesurferObj.regions.list;
      const defaultRegion = regions["default-region"];
      const end = wavesurferObj.getDuration();

      if (defaultRegion) {
        defaultRegion.update({
          start: wavesurferObj.getCurrentTime(),
          end: end,
        });

        console.log(
          `Updated region: Start=${wavesurferObj.getCurrentTime()}, End=${end}`
        );
      } else {
        console.error("Default region not found.");
      }
    }
  };

  const handlePlayPause = (e) => {
    wavesurferObj.playPause();
    setPlaying(!playing);
  };

  const handleReload = (e) => {
    wavesurferObj.stop();
    wavesurferObj.play();
    setPlaying(true);
  };

  const handleVolumeSlider = (e) => {
    setVolume(e.target.value);
  };

  const handleZoomSlider = (e) => {
    setZoom(e.target.value);
  };

  const handleTrim = (e) => {
    if (wavesurferObj) {
      const region =
        wavesurferObj.regions.list[Object.keys(wavesurferObj.regions.list)[0]];

      if (region) {
        const start = region.start;
        const end = region.end;

        const originalBuffer = wavesurferObj.backend.buffer;
        const numChannels = originalBuffer.numberOfChannels;
        const sampleRate = originalBuffer.sampleRate;

        const startSample = Math.floor(start * sampleRate);
        const endSample = Math.floor(end * sampleRate);

        const selectedRegionLength = endSample - startSample;

        const newBuffer = wavesurferObj.backend.ac.createBuffer(
          numChannels,
          selectedRegionLength,
          sampleRate
        );

        for (let ch = 0; ch < numChannels; ch++) {
          const channelData = originalBuffer.getChannelData(ch);

          const selectedRegionData = new Float32Array(selectedRegionLength);
          selectedRegionData.set(channelData.slice(startSample, endSample));

          newBuffer.copyToChannel(selectedRegionData, ch);
        }

        wavesurferObj.loadDecodedBuffer(newBuffer);
      }
    }
  };

  const handleRemoveRegion = (e) => {
	if (wavesurferObj) {
	  const region =
		wavesurferObj.regions.list[Object.keys(wavesurferObj.regions.list)[0]];
  
	  if (region) {
		const start = region.start;
		const end = region.end;
  
		const originalBuffer = wavesurferObj.backend.buffer;
		const numChannels = originalBuffer.numberOfChannels;
		const sampleRate = originalBuffer.sampleRate;
  
		const startSample = Math.floor(start * sampleRate);
		const endSample = Math.floor(end * sampleRate);
  
		const totalLength = originalBuffer.length;
		const beforeRegionLength = startSample;
		const afterRegionLength = totalLength - endSample;
		
		const newBuffer = wavesurferObj.backend.ac.createBuffer(
		  numChannels,
		  beforeRegionLength + afterRegionLength,
		  sampleRate
		);
  
		for (let ch = 0; ch < numChannels; ch++) {
		  const channelData = originalBuffer.getChannelData(ch);
  
		  const beforeRegionData = channelData.slice(0, startSample);
		  const afterRegionData = channelData.slice(endSample);
  
		  const combinedData = new Float32Array(beforeRegionLength + afterRegionLength);
		  combinedData.set(beforeRegionData);
		  combinedData.set(afterRegionData, beforeRegionLength);
  
		  newBuffer.copyToChannel(combinedData, ch);
		}
  
		wavesurferObj.loadDecodedBuffer(newBuffer);
	  }
	}
  };
  
  const handleDownload = (format) => {
    if (!wavesurferObj) {
      console.error("WaveSurfer instance is not available.");
      return;
    }

    const buffer = wavesurferObj.backend.buffer;

    if (buffer) {
      let audioData;
      let mimeType = "";
      let extension = "";

      if (format === "wav") {
        audioData = convertBufferToWav(buffer);
        mimeType = "audio/wav";
        extension = "wav";
      } else if (format === "mp3") {
        audioData = convertBufferToMp3(buffer);
        mimeType = "audio/mpeg";
        extension = "mp3";
      } else if (format === "aac") {
        audioData = convertBufferToAac(buffer);
        mimeType = "audio/aac";
        extension = "aac";
      } else {
        console.error("Unsupported format");
        return;
      }

      if (audioData) {
        const blob = new Blob([audioData], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `audio.${extension}`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const handlePopup = () => {
    setIsVisible(true);
  };

  const handleRecord = () => {
    navigate("/");
  };

  return (
    <>
      <div className="mx-auto">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:pt-28 lg:px-8 lg:py-36 -mt-8">
          <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
            {!fileURL && (
              <div className="bg-white px-6 py-24 sm:py-32 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                  <div className="text-center">
                    <svg
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="mx-auto h-12 w-12 text-gray-400"
                    >
                      <path
                        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">
                      No Recorded Audio Found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Record the audio to edit and analyze.
                    </p>
                    <div className="mt-6">
                      <button
                        type="button"
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        onClick={handleRecord}
                      >
                        <PlusIcon
                          aria-hidden="true"
                          className="-ml-0.5 mr-1.5 h-5 w-5"
                        />
                        Record Audio
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {fileURL && (
              <>
                <div className="px-4 py-5 sm:p-6">
                  {
                    <section className="waveform-container">
                      <div ref={wavesurferRef} id="waveform" />
                      <div ref={timelineRef} id="wave-timeline" />
                    </section>
                  }
                </div>
                <div className="px-4 py-4 sm:px-6">
                  {
                    <>
                      <div className="flex items-center justify-between p-0">
                        <div className="flex space-x-6">
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <button
                              type="button"
                              className="rounded bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              onClick={handleSplit}
                            >
                              Split
                            </button>
                          </div>

                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <button
                              type="button"
                              className="rounded bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              onClick={handleTrim}
                            >
                              Trim
                            </button>
                          </div>
						  <div className="mt-2 flex items-center text-sm text-gray-500">
                            <button
                              type="button"
                              className="rounded bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              onClick={handleRemoveRegion}
                            >
                              Delete
                            </button>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <button
                              type="button"
                              className="rounded bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              onClick={handlePopup}
                            >
                              Download
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <button
                            type="button"
                            className="flex items-center justify-center p-2 rounded bg-transparent border-none text-gray-900 hover:bg-gray-100 focus:outline-none"
                            onClick={handlePlayPause}
                          >
                            {playing ? (
                              <FaPause className="text-xl" />
                            ) : (
                              <FaPlay className="text-xl" />
                            )}
                          </button>

                          <button
                            title="Reload"
                            className="flex items-center justify-center p-2 bg-transparent border-none text-gray-700 hover:bg-gray-100 focus:outline-none"
                            onClick={handleReload}
                          >
                            <MdReplay className="text-xl" />
                          </button>
                          <div className="flex items-center space-x-2">
                            {volume > 0 ? (
                              <SpeakerWaveIcon className="text-gray-700 w-6 h-6" />
                            ) : (
                              <SpeakerXMarkIcon className="text-gray-700 w-6 h-6" />
                            )}
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={volume}
                              onChange={handleVolumeSlider}
                              className="slider volume-slider w-24 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <MdZoomOut className="text-gray-700 text-xl" />{" "}
                            {/* Zoom out icon */}
                            <input
                              type="range"
                              min="1"
                              max="1000"
                              value={zoom}
                              onChange={handleZoomSlider}
                              className="slider zoom-slider w-24 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                            />
                            <MdZoomIn className="text-gray-700 text-xl" />{" "}
                            {/* Zoom in icon */}
                          </div>
                        </div>
                      </div>
                    </>
                  }
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isVisible && (
        <DownloadPopup
          setIsVisible={setIsVisible}
          handleDownload={handleDownload}
        />
      )}
    </>
  );
};

export default AudioEditor;
