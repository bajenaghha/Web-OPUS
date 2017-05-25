var Opus;

(function(){
	importScripts('libopus.js');

	if (typeof opus_module == "undefined" || !opus_module)
		throw Error("opus_module is undefined!");

	Opus = {};

	Opus.APPLICATIONS = {
		VOIP:               2048,
		AUDIO:              2049,
		RESTRICTED_LOWDELAY:2051
	};
	Opus.ERRORS = {
		OK:                  0,
		BAD_ARG:            -1,
		BUFFER_TOO_SMALL:   -2,
		INTERNAL_ERROR:     -3,
		INVALID_PACKET:     -4,
		UNIMPLEMENTED:      -5,
		INVALID_STATE:      -6,
		ALLOC_FAIL:         -7
	};

	Opus.OpusDecoder        = OpusDecoder;

	var ERROR_CODES = Object.keys(Opus.ERRORS).map(function(e) { return Opus.ERRORS[e]; });

	function OpusDecoder(sample_rate, channels) {

		this.interror = opus_module._malloc(4);//4 bytes for int
		this.data = opus_module._malloc(4000); //advised by opus
		this.buf = opus_module._malloc(5760); //max opus data*2

		this.decoder = opus_module._opus_decoder_create(sample_rate,channels,this.interror);
	
		var err = this.getErrorCode();
		console.log(err);
		if (err!=0) throw OpusError(err);

		this.destroyed = false;
	}
	OpusDecoder.prototype.getErrorCode = function()
	{
		var numberbytes = new ArrayBuffer(4);
		for (var i=this.interror; i<=this.interror+4; i++)
			numberbytes[i-this.interror] = opus_module.HEAP8[i];
		var view = new DataView(numberbytes);
		return view.getInt32();
	}

	OpusDecoder.prototype.decode = function( OPUS ) {
		if ( this.destroyed ) {
		    throw new Error( "Attempting to decode using a destroyed decoder" );
		}
		opus_module.HEAPU8.set(new Uint8Array(OPUS),this.data);

		var decodedsize = opus_module._opus_decode(this.decoder,this.data,OPUS.byteLength,this.buf,5760*2,0);

		if (decodedsize < 0) throw new OpusError(decodedsize);

		var pcm32float = new Float32Array(decodedsize);

		var decoded = new Int16Array(opus_module.HEAP16.subarray((this.buf/2),(this.buf/2)+decodedsize));

		for (var i=0;i<decodedsize;i++)
			pcm32float[i] = decoded[i]>=0?decoded[i]/32767:decoded[i]/32768;

		return pcm32float;
	}


	OpusDecoder.prototype.destroy = function() {
		opus_module._opus_decoder_destroy(this.opus);
		opus_module._free(this.buf);
		opus_module._free(this.data);
		opus_module._free(this.interror);
		this.destroyed = true;
	}

	function OpusError(code) {
		var error = new Error(Object.keys(Opus.ERRORS)[ERROR_CODES.indexOf(code)]);
		error.code = code;
		return error;
	}
})();
