import { FFmpeg } from '@ffmpeg/ffmpeg';
import lamejs from 'lamejs';


const ffmpeg = new FFmpeg({ log: true });

export const convertBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const wav = new Uint8Array(44 + length * 2);

    const writeString = (str, offset) => {
      for (let i = 0; i < str.length; i++) {
        wav[offset + i] = str.charCodeAt(i);
      }
    };

    const writeUint32 = (value, offset) => {
      wav[offset] = value & 0xff;
      wav[offset + 1] = (value >> 8) & 0xff;
      wav[offset + 2] = (value >> 16) & 0xff;
      wav[offset + 3] = (value >> 24) & 0xff;
    };

    const writeUint16 = (value, offset) => {
      wav[offset] = value & 0xff;
      wav[offset + 1] = (value >> 8) & 0xff;
    };

    writeString("RIFF", 0);
    writeUint32(36 + length * 2, 4);
    writeString("WAVE", 8);
    writeString("fmt ", 12);
    writeUint32(16, 16);
    writeUint16(1, 20); 
    writeUint16(numChannels, 22);
    writeUint32(sampleRate, 24);
    writeUint32(sampleRate * numChannels * 2, 28); 
    writeUint16(numChannels * 2, 32);
    writeUint16(16, 34); 
    writeString("data", 36);
    writeUint32(length * 2, 40); 
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      const intSample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0;
      wav[44 + i * 2] = intSample & 0xff;
      wav[45 + i * 2] = (intSample >> 8) & 0xff;
    }

    return wav;
};


export const convertBufferToAac = async (audioBuffer) => {
    try {
      
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        
        const wavBuffer = convertBufferToWav(audioBuffer);
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
        const wavArrayBuffer = await wavBlob.arrayBuffer();

        
        ffmpeg.FS('writeFile', 'input.wav', new Uint8Array(wavArrayBuffer));

        
        await ffmpeg.run('-i', 'input.wav', '-c:a', 'aac', 'output.aac');

       
        const data = ffmpeg.FS('readFile', 'output.aac');

        
        const blob = new Blob([data.buffer], { type: 'audio/aac' });
        const url = URL.createObjectURL(blob);

        return url;
    } catch (error) {
        console.error('Error converting WAV to AAC:', error);
        throw error;
    }
};





function wavToMp3(channels, sampleRate, samples) {
    var buffer = [];
    var mp3enc = new lamejs.Mp3Encoder(channels, sampleRate, 128);
    var remaining = samples.length;
    var samplesPerFrame = 1152;
    for (var i = 0; remaining >= samplesPerFrame; i += samplesPerFrame) {
        var mono = samples.subarray(i, i + samplesPerFrame);
        var mp3buf = mp3enc.encodeBuffer(mono);
        if (mp3buf.length > 0) {
            buffer.push(new Int8Array(mp3buf));
        }
        remaining -= samplesPerFrame;
    }
    var d = mp3enc.flush();
    if (d.length > 0) {
        buffer.push(new Int8Array(d));
    }

    var mp3Blob = new Blob(buffer, { type: 'audio/mp3' });
    var bUrl = window.URL.createObjectURL(mp3Blob);

  
    var link = document.createElement('a');
    link.href = bUrl;
    link.download = 'converted.mp3';
    link.textContent = 'Download MP3';
    document.body.appendChild(link);
}

export async function convertBufferToMp3(buffer) {
    const wavUrl = convertBufferToWav(buffer);
    const response = await fetch(wavUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const samples = new Int16Array(length * channels);
    
    for (let channel = 0; channel < channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
            samples[i * channels + channel] = Math.max(-1, Math.min(1, channelData[i])) * 32767;
        }
    }
    
    wavToMp3(channels, sampleRate, samples);
}









