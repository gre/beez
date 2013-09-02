beez.WaveformView = Backbone.View.extend({
  initialize: function (opts) {
    this.marginBottom = opts.marginBottom || 0;
    this.canvas = document.createElement("canvas");
    this.$el.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.listenTo(this.model, "change:width change:height", this.syncSize);
    this.listenTo(this.model, "update", this.render);
    this.syncSize();
  },
  syncSize: function () {
    this.canvas.width = this.model.get("width");
    this.canvas.height = this.model.get("height");
    this.render(this.ctx);
  },
  render: function () {
    var sampleRate = this.model.get("sampleRate");
    var marginBottom = this.marginBottom;
    var ctx = this.ctx;
    var array = this.model.array;
    var arraySpectrum = this.model.arraySpectrum;
    var length = array.length;
    var W = ctx.canvas.width;
    var H = ctx.canvas.height;
    var fy = function (y) {
      y = y/256; // normalize
      return (1*y) * (H-marginBottom);
    }

    ctx.clearRect(0,0,W,H);

    // Spectrum Analyzer
    var gradient = ctx.createLinearGradient(0,0,0,H);
    gradient.addColorStop(0,'rgba(0,255,0,0.3)');
    gradient.addColorStop(1,'rgba(255,0,0,0.3)');

    var lengthSpectrum = arraySpectrum.length; // Only intested in first part here
    for (var i=0; i<lengthSpectrum; ++i) {
      var value = arraySpectrum[i];
      var x = i*5;
      var w = 4;
      ctx.fillStyle = "#def";
      ctx.fillRect(x,0,w,H);
      ctx.fillStyle = gradient;
      ctx.fillRect(x,H-(H*value/256),w,H);
    }

    // Waveform
    ctx.beginPath();
    ctx.moveTo(0, fy(array[0]));
    for (var i=0; i<length; ++i) {
      ctx.lineTo(W*i/length, fy(array[i]));
    }

    ctx.strokeStyle = "#9ac";
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 9;
    ctx.stroke();

  }
});
