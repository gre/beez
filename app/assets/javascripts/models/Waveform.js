beez.Waveform = Backbone.Model.extend({
  initialize: function () {
    this.on("change:sampling", this.syncSampling);
    this.syncSampling();
  },
  setNode: function (audioNode, audioCtx) {
    this.set("sampleRate", audioCtx.sampleRate);
    this.analyser = audioCtx.createAnalyser();
    this.analyserSpectrum = audioCtx.createAnalyser();
    this.analyserSpectrum.smoothingTimeConstant = 0.3;
    this.analyserSpectrum.fftSize = 1024;
    audioNode.connect(this.analyser);
    audioNode.connect(this.analyserSpectrum);
  },
  syncSampling: function () {
    this.array = new Uint8Array(this.get("sampling")||256);
    this.arraySpectrum = new Uint8Array(512);
  },
  update: function () {
    this.analyser.getByteTimeDomainData(this.array);
    this.analyserSpectrum.getByteFrequencyData(this.arraySpectrum);
    this.trigger("update");
  }
});

