//All 1024*4 are frame size (float)

self.importScripts('opus.js');
self.importScripts('resampler.js');

setTimeout(start,1000); //Start should not be called just after opus.js being loaded! (I don't know exactly why?!)
function start(){
    var eachFrameSizeAC44100 = 1024*4;
    var eachFrameSizeAC48000 = Math.round((eachFrameSizeAC44100 * 48000)/44100);
    console.log(eachFrameSizeAC48000);
    var decoder = new Opus.OpusDecoder(48000,1);
    var resampler = new Resampler(48000 , 44100 , 1, eachFrameSizeAC44100);

    var totalpcm48000 = new Float32Array(0);


    var websocket = new WebSocket("ws://192.168.43.192:8082/");
    websocket.binaryType = 'arraybuffer';
    websocket.onopen = function(evt) { 
	    console.log("Open");
	    
    };
    websocket.onclose = function(evt) {  console.log("Close");  };
    websocket.onmessage = function(evt) {
	    var opus = evt.data;
        var pcm48000 = decoder.decode(opus);
        totalpcm48000 = concatTypedArrays(totalpcm48000,pcm48000); //buffer decoded audio
        process();
    };
    websocket.onerror = function(evt) {  console.log("Error");  };

    function process()
    {
//  For 44.1kHz freq
//        while (totalpcm48000.length > eachFrameSizeAC48000+1)
//        {
//            var frame48000 = totalpcm48000.slice(0,eachFrameSizeAC48000+1);
//           
//            var frame44100 = resampler.resampler(frame48000);
//             console.log(frame44100.length);
//            postMessage(frame44100);
//            totalpcm48000 = totalpcm48000.slice(eachFrameSizeAC48000+1);
//        }
//    }
//  For 48kHz freq
        while (totalpcm48000.length > 1024*4)
        {
            //remove specified size of buffer
            var frame48000 = totalpcm48000.slice(0, 1024*4);
            //send generated frame
            postMessage(frame48000);
            totalpcm48000 = totalpcm48000.slice(1024*4);
        }
    }
    //concat two TypedArray (such as Int8Array and etc...)
    function concatTypedArrays(a, b) { // a, b TypedArray of same type
        var c = new (a.constructor)(a.length + b.length);
        c.set(a, 0);
        c.set(b, a.length);
        return c;
    }

}
