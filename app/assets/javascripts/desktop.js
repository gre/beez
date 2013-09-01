(function(){

  var XY_AXIS_HEIGHT = 120;
  var $params = $("#params");

  // Network
  var hive = new beez.HiveBroker({
    wsUrl: WEBSOCKET_ENDPOINT,
    id: PEER_HIVE_ID
  });

  // Init Audio
  var audio = new beez.Audio();

  // Init Params
  var allAxis = (function (params) {
    var paramsNode = $params.empty();
    return new Backbone.Collection(_.map(params.groupBy("tab"), function (xyParams, tab) {
      var xP = _.find(xyParams, function (p) { return p.get("axis") === "x" });
      var yP = _.find(xyParams, function (p) { return p.get("axis") === "y" });
      if (!xP) throw "can't find param for x in tab "+tab;
      if (!yP) throw "can't find param for y in tab "+tab;
      var xyAxis = new beez.XYaxis({
        id: tab,
        x: xP.getPercent(),
        y: yP.getPercent(),
        width: 160,
        height: XY_AXIS_HEIGHT,
        name: tab,
        xlabel: xP.get("name"),
        ylabel: yP.get("name")
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

      var node = $('<div class="xyaxis" />');
      var view = new beez.XYaxisMouseView({
        model: xyAxis,
        el: node

      });
      paramsNode.append(node);

      return xyAxis;
    }));
  }(beez.params));

  /// init Waveform
  var waveform = new beez.Waveform({
    sampling: 1024
  });
  function syncWaveformSize () {
    waveform.set({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }
  $(window).on("resize", _.throttle(syncWaveformSize, 200));
  syncWaveformSize();

  var waveformView = new beez.WaveformView({
    model: waveform,
    el: $("#waveform"),
    marginBottom: XY_AXIS_HEIGHT-50
  });

  // Starting the Audio
  $("#waveform").click(function () {
    audio.toggle(function () {
      waveform.setNode(audio.output, audio.ctx);
    });
    $(document.body).toggleClass("stopped", !audio.get("started"));
  });
  $(window).on("blur", function () {
    audio.stop();
  });
  audio.init();
  waveform.setNode(audio.output, audio.ctx);
  audio.start();
  setInterval(_.bind(waveform.update, waveform), 60);

  hive.on("data", function (msg) {
    switch (msg[0]) {
    case "tabopen":
      var tab = msg[1];
      var axis = allAxis.get(tab);
      hive.send([ "tabxy", tab, axis.get("x"), axis.get("y") ]);
      break;
    case "tabxy":
      allAxis.get(msg[1]).set({
        x: msg[2],
        y: msg[3]
      });
      break;
    case "tabxychanging":
      allAxis.get(msg[1]).set({
        changing: msg[2]
      });
      break;
    }
  });

}());
