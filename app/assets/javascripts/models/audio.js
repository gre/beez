
beez.Audio = Backbone.Model.extend({
  initialize: function () {
    this.ctx = new webkitAudioContext();
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
    var ctx = this.ctx;
    var carrier = ctx.createOscillator();
    carrier.type = "square";
    this.bindParam(beez.params.get("carrierfreq"), carrier.frequency);
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
