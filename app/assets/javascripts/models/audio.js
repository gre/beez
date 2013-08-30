
beez.Audio = Backbone.Model.extend({
  initialize: function () {
    this.ctx = new webkitAudioContext();
    this.seq = new beez.Sequence({
      ctx: this.ctx
    });
    this.seq.play();
  },

  start: function () {
    this.output.connect(this.ctx.destination);
  },

  stop: function () {
    this.output.disconnect(this.ctx.destination);
  },

  bindParam: function (param, audioParam) {
    param.on("change:value", function (m, value) {
      audioParam.value = value;
    });
    audioParam.value = param.get("value");
  },

  basicExample: function () {
    var ctx = this.ctx,
      self = this;

    beez.params.get("bpm").on("change:value", function (m, value) {
      self.seq.set("bpm", value);
    });
    this.seq.set("bpm", beez.params.get("bpm").get("value"));

    var carrier = ctx.createOscillator();
    this.seq.audioParam = carrier.frequency;

    carrier.type = "square";
    //this.bindParam(beez.params.get("carrierfreq"), carrier.frequency);
    var carrierGain = ctx.createGainNode();
    this.bindParam(beez.params.get("carriergain"), carrierGain.gain);
    carrier.connect(carrierGain);

    var mod = ctx.createOscillator();
    mod.type = "sine";
    this.bindParam(beez.params.get("modfreq"), mod.frequency);
    var modGain = ctx.createGainNode();
    this.bindParam(beez.params.get("modgain"), modGain.gain);
    mod.start(0);
    mod.connect(modGain);
    modGain.connect(carrier.frequency);

    var filter = ctx.createBiquadFilter();
    this.bindParam(beez.params.get("filterfreq"), filter.frequency);
    this.bindParam(beez.params.get("filterQ"), filter.Q);
    carrierGain.connect(filter);

    var lfo = ctx.createOscillator();
    lfo.type = "sine";
    this.bindParam(beez.params.get("lfofreq"), lfo.frequency);
    var lfoGain = ctx.createGainNode();
    this.bindParam(beez.params.get("lfogain"), lfoGain.gain);
    lfo.start(0);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    carrier.start(0);

    var compressor = ctx.createDynamicsCompressor();
    filter.connect(compressor);

    this.output = compressor;
  }
});
