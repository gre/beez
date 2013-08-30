beez.Waveform = Backbone.Model.extend({
  initialize: function () {
    this.on("change:sampling", this.syncSampling);
    this.syncSampling();
  },
  setNode: function (audioNode, audioCtx) {
    this.set("sampleRate", audioCtx.sampleRate);
    this.analyser = audioCtx.createAnalyser();
    audioNode.connect(this.analyser);
  },
  syncSampling: function () {
    this.array = new Uint8Array(this.get("sampling")||256);
  },
  update: function () {
    this.analyser.getByteTimeDomainData(this.array);
    this.trigger("update");
  }
});

