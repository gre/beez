beez.WaveformView = Backbone.View.extend({
  initialize: function () {
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
    var ctx = this.ctx;
    var array = this.model.array;
    var length = array.length;
    var W = ctx.canvas.width;
    var H = ctx.canvas.height;
    var fy = function (y) {
      y = y/256; // normalize
      return (0.1+0.8*y) * H;
    }
    ctx.clearRect(0,0,W,H);
    ctx.beginPath();
    ctx.strokeStyle = "#cde";
    ctx.lineWidth = 10;
    ctx.moveTo(0, fy(array[0]));
    for (var i=0; i<length; ++i) {
      ctx.lineTo(W*i/length, fy(array[i]));
    }
    ctx.stroke();
  }
});
