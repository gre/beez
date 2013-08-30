beez.Audio = Backbone.Model.extend({
  initialize: function () {
    this.ctx = new webkitAudioContext();
    this.basicExample();
  },

  basicExample: function () {
    var ctx = this.ctx;
    var carrier = ctx.createOscillator();
    carrier.type = "sine";
    this.on("change:carrierfreq", function (m, value) {
      carrier.frequency.value = value;
    });
    
    var mod = ctx.createOscillator();
    this.on("change:modfreq", function (m, value) {
      mod.frequency.value = value;
    });
    var modGain = ctx.createGainNode();
    this.on("change:modgain", function (m, value) {
      modGain.gain.value = value;
    });
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
    filter.connect(ctx.destination);

    carrier.start(0);

    this.set("carrierfreq", 300);
    this.set("modfreq", 150);
    this.set("modgain", 100);
    this.set("filterfreq", 500);
    this.set("filterQ", 2);
  }
});
