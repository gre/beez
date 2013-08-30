
beez.AudioParameter = Backbone.Model.extend({
  defaults: {
    from: 0,
    to: 1,
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
    var from = this.get("from");
    var to = this.get("to");
    var value = from+this.curve.fun(percent)*(to-from);
    this.set("value", value);
  },
  getPercent: function () {
    var value = this.get("value");
    var from = this.get("from");
    var to = this.get("to");
    return this.curve.inv((value-from)/(to-from));
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
        from: 20,
        to: 1000,
        tab: "carrier",
        axis: "x"
      },
      {
        id: "carriergain",
        value: 1,
        from: 0,
        to: 1,
        tab: "carrier",
        axis: "y"
      },
      {
        id: "modfreq",
        value: 50,
        from: 20,
        to: 1000,
        tab: "modulator",
        axis: "x"
      },
      {
        id: "modgain",
        value: 100,
        from: 0,
        to: 500,
        tab: "modulator",
        axis: "y"
      },
      {
        id: "lfofreq",
        curve: "quad",
        value: 4,
        from: 0,
        to: 20,
        tab: "filterlfo",
        axis: "x"
      },
      {
        id: "lfogain",
        value: 400,
        from: 0,
        to: 1000,
        tab: "filterlfo",
        axis: "y"
      },
      {
        id: "filterfreq",
        curve: "quad",
        value: 500,
        from: 0,
        to: 5000,
        tab: "filter",
        axis: "x"
      },
      {
        id: "filterQ",
        curve: "quad",
        value: 1,
        from: 20,
        to: 0,
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
