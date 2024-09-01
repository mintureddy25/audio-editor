import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

const Waveform = () => {
  const waveformRef = useRef(null);
  const [waveSurfer, setWaveSurfer] = useState(null);
  const [regions, setRegions] = useState(null);
  const [loop, setLoop] = useState(true);
  const [activeRegion, setActiveRegion] = useState(null);

  useEffect(() => {
    // Initialize the WaveSurfer instance and Regions plugin
    const regionsPlugin = RegionsPlugin.create();
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgb(200, 0, 200)',
      progressColor: 'rgb(100, 0, 100)',
      url: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
      plugins: [regionsPlugin],
    });

    setWaveSurfer(ws);
    setRegions(regionsPlugin);

    ws.on('decode', () => {
      // Create regions when the audio is decoded
      regionsPlugin.addRegion({
        start: 0,
        end: 8,
        content: 'Resize me',
        color: randomColor(),
        drag: false,
        resize: true,
      });
      regionsPlugin.addRegion({
        start: 9,
        end: 10,
        content: 'Cramped region',
        color: randomColor(),
        minLength: 1,
        maxLength: 10,
      });
      regionsPlugin.addRegion({
        start: 12,
        end: 17,
        content: 'Drag me',
        color: randomColor(),
        resize: false,
      });
      regionsPlugin.addRegion({
        start: 19,
        content: 'Marker',
        color: randomColor(),
      });
      regionsPlugin.addRegion({
        start: 20,
        content: 'Second marker',
        color: randomColor(),
      });
    });

    regionsPlugin.enableDragSelection({
      color: 'rgba(255, 0, 0, 0.1)',
    });

    regionsPlugin.on('region-updated', (region) => {
      console.log('Updated region', region);
    });

    regionsPlugin.on('region-in', (region) => {
      setActiveRegion(region);
    });

    regionsPlugin.on('region-out', (region) => {
      if (activeRegion === region) {
        if (loop) {
          region.play();
        } else {
          setActiveRegion(null);
        }
      }
    });

    regionsPlugin.on('region-clicked', (region, e) => {
      e.stopPropagation();
      setActiveRegion(region);
      region.play();
      region.setOptions({ color: randomColor() });
    });

    ws.on('interaction', () => {
      setActiveRegion(null);
    });

    return () => ws.destroy();
  }, [loop, activeRegion]);

  const random = (min, max) => Math.random() * (max - min) + min;
  const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`;

  const handleCheckboxChange = (e) => {
    setLoop(e.target.checked);
  };

  const handleRangeChange = (e) => {
    const minPxPerSec = Number(e.target.value);
    if (waveSurfer) {
      waveSurfer.zoom(minPxPerSec);
    }
  };

  return (
    <div>
      <div ref={waveformRef} style={{ width: '100%', height: '128px' }}></div>
      <div>
        <input type="checkbox" onChange={handleCheckboxChange} defaultChecked={loop} /> Loop
      </div>
      <div>
        <input type="range" min="10" max="200" defaultValue="50" onInput={handleRangeChange} />
      </div>
    </div>
  );
};

export default Waveform;
