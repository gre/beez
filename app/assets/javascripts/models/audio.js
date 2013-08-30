
beez.AudioParameter = Backbone.Model.extend({
  defaults: {
    min: 0,
    max: 1,
    value: 0,
    name: "noname",
    curve: "linear"
  },
  initialize: function () {
    this.on("change:curve", this.syncCurve);
    this.syncCurve();
  },
  syncCurve: function () {
    this.curve = beez.AudioMath.curves[this.get("curve")];
  },
  setPercent: function (percent) {
    var min = this.get("min");
    var max = this.get("max");
    var round = this.get("round");
    var value = min+this.curve.fun(percent)*(max-min);
    this.set("value", round ? Math.round(value) : value);
  },
  getPercent: function () {
    var value = this.get("value");
    var min = this.get("min");
    var max = this.get("max");
    return this.curve.inv((value-min)/(max-min));
  }
});

beez.AudioParameters = Backbone.Collection.extend({
  model: beez.AudioParameter
});

beez.Audio = Backbone.Model.extend({
  initialize: function () {
    this.params = new beez.AudioParameters();
    this.ctx = new webkitAudioContext();
  },

  start: function () {
    this.output.connect(this.ctx.destination);
  },
  
  stop: function () {
    this.output.disconnect(this.ctx.destination);
  },

  setParams: function (paramsConf) {
    this.params.reset(_.map(paramsConf, function (o) {
      return new beez.AudioParameter(o);
    }));
  },

  bindParam: function (param, audioParam) {
    param.on("change:value", function (m, value) {
      audioParam.value = value;
    });
    audioParam.value = param.get("value");
  },

  basicExample: function () {
    this.setParams([
      {
        id: "carrierfreq",
        value: 150,
        min: 50,
        max: 500,
        tab: "carrier",
        axis: "x"
      },
      {
        id: "carriergain",
        value: 1,
        min: 0,
        max: 1,
        tab: "carrier",
        axis: "y"
      },
      {
        id: "modfreq",
        value: 50,
        min: 50,
        max: 500,
        tab: "modulator",
        axis: "x"
      },
      {
        id: "modgain",
        value: 100,
        min: 0,
        max: 500,
        tab: "modulator",
        axis: "y"
      },
      {
        id: "lfofreq",
        curve: "quad",
        value: 4,
        min: 0,
        max: 20,
        tab: "filterlfo",
        axis: "x"
      },
      {
        id: "lfogain",
        value: 400,
        min: 0,
        max: 1000,
        tab: "filterlfo",
        axis: "y"
      },
      {
        id: "filterfreq",
        curve: "quad",
        value: 500,
        min: 0,
        max: 5000,
        tab: "filter",
        axis: "x"
      },
      {
        id: "filterQ",
        curve: "quad",
        value: 1,
        min: 0,
        max: 20,
        tab: "filter",
        axis: "y"
      }
    ]);

    var ctx = this.ctx;
    var carrier = ctx.createOscillator();
    carrier.type = "square";
    this.bindParam(this.params.get("carrierfreq"), carrier.frequency);
    var carrierGain = ctx.createGainNode();
    this.bindParam(this.params.get("carriergain"), carrierGain.gain);
    
    var mod = ctx.createOscillator();
    mod.type = "sine";
    this.bindParam(this.params.get("modfreq"), mod.frequency);
    var modGain = ctx.createGainNode();
    this.bindParam(this.params.get("modgain"), modGain.gain);
    mod.start(0);
    mod.connect(modGain);
    modGain.connect(carrier.frequency);

    var filter = ctx.createBiquadFilter();
    this.bindParam(this.params.get("filterfreq"), filter.frequency);
    this.bindParam(this.params.get("filterQ"), filter.Q);
    carrier.connect(filter);

    var lfo = ctx.createOscillator();
    lfo.type = "sine";
    this.bindParam(this.params.get("lfofreq"), lfo.frequency);
    var lfoGain = ctx.createGainNode();
    this.bindParam(this.params.get("lfogain"), lfoGain.gain);
    lfo.start(0);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    carrier.start(0);

    var compressor = ctx.createDynamicsCompressor();
    filter.connect(compressor);

    this.output = compressor;
  }
});
