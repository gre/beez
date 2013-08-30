beez.Audio = Backbone.Model.extend({
  initialize: function () {
    this.ctx = new webkitAudioContext();
    this.basicExample();
  },

  start: function () {
    this.output.connect(this.ctx.destination);
  },
  
  stop: function () {
    this.output.disconnect(this.ctx.destination);
  },

  basicExample: function () {
    var ctx = this.ctx;
    var carrier = ctx.createOscillator();
    carrier.type = "square";
    this.on("change:carrierfreq", function (m, value) {
      carrier.frequency.value = value;
    });
    
    var mod = ctx.createOscillator();
    mod.type = "sine";
    this.on("change:modfreq", function (m, value) {
      mod.frequency.value = value;
    });
    var modGain = ctx.createGainNode();
    this.on("change:modgain", function (m, value) {
      modGain.gain.value = value;
    });

    mod.start(0);
    mod.connect(modGain);
    modGain.connect(carrier.frequency);

    var filter = ctx.createBiquadFilter();
    this.on("change:filterfreq", function (m, value) {
      filter.frequency.value = value;
    });
    this.on("change:filterQ", function (m, value) {
      filter.Q.value = value;
    });
    carrier.connect(filter);

    this.set("carrierfreq", 150);
    this.set("modfreq", 50);
    this.set("modgain", 100);
    this.set("filterfreq", 500);
    this.set("filterQ", 1);

    carrier.start(0);

    var compressor = ctx.createDynamicsCompressor();
    filter.connect(compressor);

    this.output = compressor;
  }
});
