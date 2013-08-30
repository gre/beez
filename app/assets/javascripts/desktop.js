(function(){

  // Init Audio
  var audio = new beez.Audio();

  // Init Params
  audio.params.on("reset", function () {
    var paramsNode = $("#params").empty();
    _.each(this.groupBy("tab"), function (xyParams, tab) {
      var xP = _.find(xyParams, function (p) { return p.get("axis") === "x" });
      var yP = _.find(xyParams, function (p) { return p.get("axis") === "y" });
      if (!xP) throw "can't find param for x in tab "+tab;
      if (!yP) throw "can't find param for y in tab "+tab;
      var xyAxis = new beez.XYaxis({
        x: xP.getPercent(),
        y: yP.getPercent(),
        name: tab
      });
      xP.on("change:value", function (m, value) {
        xyAxis.set("x", xP.getPercent(), { preventXyaxis: true });
      });
      yP.on("change:value", function (m, value) {
        xyAxis.set("y", yP.getPercent(), { preventXyaxis: true });
      });
      xyAxis.on("change:x", function (m, value, opts) {
        if (opts.preventXyaxis) return;
        xP.setPercent(value);
      });
      xyAxis.on("change:y", function (m, value, opts) {
        if (opts.preventXyaxis) return;
        yP.setPercent(value);
      });

      var node = $("<div />");
      var view = new beez.XYaxisMouseView({
        model: xyAxis,
        el: node
      });
      paramsNode.append(node);
    });
  });

  /// init Waveform
  var waveform = new beez.Waveform({
    sampling: 1024
  });
  function syncWaveformSize () {
    waveform.set({
      width: window.innerWidth,
      height: window.innerHeight - 200
    });
  }
  $(window).on("resize", _.throttle(syncWaveformSize, 200));
  syncWaveformSize();

  var waveformView = new beez.WaveformView({
    model: waveform,
    el: $("#waveform")
  });

  // Starting the Audio
  audio.basicExample();
  audio.start();
  waveform.setNode(audio.output, audio.ctx);
  setInterval(_.bind(waveform.update, waveform), 50);

}());
