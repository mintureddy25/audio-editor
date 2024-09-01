import React, { useState, useEffect, useContext, useRef } from "react";
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js";
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.min.js";
import { PlusIcon } from "@heroicons/react/20/solid";
import wavesurfer from "wavesurfer.js";

import ToggleButton from "../ToggleButton";
import { FileContext } from "../../utils/fileContext";
import { useNavigate } from "react-router-dom/dist";

const AudioEditor = (url) => {
  const wavesurferRef = useRef(null);
  const timelineRef = useRef(null);
  const navigate = useNavigate();

  // fetch file url from the context
  const { fileURL, setFileURL } = useContext(FileContext);
  console.log("mintu", fileURL);

  // crate an instance of the wavesurfer
  const [wavesurferObj, setWavesurferObj] = useState();

  const [playing, setPlaying] = useState(true); // to keep track whether audio is currently playing or not
  const [volume, setVolume] = useState(1); // to control volume level of the audio. 0-mute, 1-max
  const [zoom, setZoom] = useState(1); // to control the zoom level of the waveform
  const [duration, setDuration] = useState(0); // duration is used to set the default region of selection for trimming the audio

  // create the waveform inside the correct component
  useEffect(() => {
    if (wavesurferRef.current && !wavesurferObj) {
      setWavesurferObj(
        wavesurfer.create({
          container: "#waveform",
          scrollParent: true,
          autoCenter: true,
          cursorColor: "violet",
          loopSelection: true,
          waveColor: "#211027",
          progressColor: "#69207F",
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

  // once the file URL is ready, load the file to produce the waveform
  useEffect(() => {
    if (fileURL && wavesurferObj) {
      wavesurferObj.load(fileURL);
    }
  }, [fileURL, wavesurferObj]);

  useEffect(() => {
    if (wavesurferObj) {
      // once the waveform is ready, play the audio
      wavesurferObj.on("ready", () => {
        wavesurferObj.play();
        wavesurferObj.enableDragSelection({}); // to select the region to be trimmed
        setDuration(Math.floor(wavesurferObj.getDuration())); // set the duration in local state
      });

      // once audio starts playing, set the state variable to true
      wavesurferObj.on("play", () => {
        setPlaying(true);
      });

      // once audio starts playing, set the state variable to false
      wavesurferObj.on("finish", () => {
        setPlaying(false);
      });

      // if multiple regions are created, then remove all the previous regions so that only 1 is present at any given time
      wavesurferObj.on("region-updated", (region) => {
        const regions = region.wavesurfer.regions.list;
        const keys = Object.keys(regions);
        if (keys.length > 1) {
          regions[keys[0]].remove();
        }
      });
    }
  }, [wavesurferObj]);

  // set volume of the wavesurfer object, whenever volume variable in state is changed
  useEffect(() => {
    if (wavesurferObj) wavesurferObj.setVolume(volume);
  }, [volume, wavesurferObj]);

  // set zoom level of the wavesurfer object, whenever the zoom variable in state is changed
  useEffect(() => {
    if (wavesurferObj) wavesurferObj.zoom(zoom);
  }, [zoom, wavesurferObj]);

  // when the duration of the audio is available, set the length of the region depending on it, so as to not exceed the total lenght of the audio
  useEffect(() => {
    if (duration && wavesurferObj) {
      // add a region with default length
      wavesurferObj.addRegion({
        start: Math.floor(duration / 2) - Math.floor(duration) / 5, // time in seconds
        end: Math.floor(duration / 2), // time in seconds
        color: "hsla(265, 100%, 86%, 0.4)", // color of the selected region, light hue of purple
      });
    }
  }, [duration, wavesurferObj]);

  const handlePlayPause = (e) => {
    wavesurferObj.playPause();
    setPlaying(!playing);
  };

  const handleReload = (e) => {
    // stop will return the audio to 0s, then play it again
    wavesurferObj.stop();
    wavesurferObj.play();
    setPlaying(true); // to toggle the play/pause button icon
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
        const originalLength = originalBuffer.length;

        // Calculate sample indices
        const startSample = Math.floor(start * sampleRate);
        const endSample = Math.floor(end * sampleRate);

        const beforeRegionLength = startSample;
        const afterRegionLength = originalLength - endSample;

        // Create a new buffer with the combined length (excluding the selected region)
        const newBuffer = wavesurferObj.backend.ac.createBuffer(
          numChannels,
          beforeRegionLength + afterRegionLength,
          sampleRate
        );

        // Process each channel separately
        for (let ch = 0; ch < numChannels; ch++) {
          const channelData = originalBuffer.getChannelData(ch);

          // Create arrays for audio data before and after the selected region
          const beforeRegionData = new Float32Array(beforeRegionLength);
          const afterRegionData = new Float32Array(afterRegionLength);

          // Handle cases where the selected region might be at the start or end
          if (startSample > 0) {
            beforeRegionData.set(channelData.slice(0, startSample));
          }

          if (endSample < originalLength) {
            afterRegionData.set(channelData.slice(endSample));
          }

          // Combine the data and copy to the new buffer
          const combinedData = new Float32Array(
            beforeRegionLength + afterRegionLength
          );
          combinedData.set(beforeRegionData);
          combinedData.set(afterRegionData, beforeRegionLength);

          newBuffer.copyToChannel(combinedData, ch);
        }

        // Load the new buffer
        wavesurferObj.loadDecodedBuffer(newBuffer);
      }
    }
  };

  const handleRecord =()=>{
	navigate('/');

  };

  return (
    <>
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

      {fileURL &&(<section className="waveform-container">
        <div ref={wavesurferRef} id="waveform" />
        <div ref={timelineRef} id="wave-timeline" />
        <div className="all-controls">
          <div className="left-container">
            
            <button
              title="play/pause"
              className="controls"
              onClick={handlePlayPause}
            >
              {playing ? (
                <i className="material-icons">pause</i>
              ) : (
                <i className="material-icons">play_arrow</i>
              )}
            </button>
            <button title="reload" className="controls" onClick={handleReload}>
              <i className="material-icons">replay</i>
            </button>
            <button className="trim" onClick={handleTrim}>
              <i
                style={{
                  fontSize: "1.2em",
                  color: "white",
                }}
                className="material-icons"
              >
                content_cut
              </i>
              Trim
            </button>
          </div>
          <div className="right-container">
            <div className="volume-slide-container">
              <i className="material-icons zoom-icon">remove_circle</i>
              <input
                type="range"
                min="1"
                max="1000"
                value={zoom}
                onChange={handleZoomSlider}
                class="slider zoom-slider"
              />
              <i className="material-icons zoom-icon">add_circle</i>
            </div>
            <div className="volume-slide-container">
              {volume > 0 ? (
                <i className="material-icons">volume_up</i>
              ) : (
                <i className="material-icons">volume_off</i>
              )}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeSlider}
                className="slider volume-slider"
              />
            </div>
          </div>
        </div>
      </section>)}
    </>
  );
};

export default AudioEditor;
