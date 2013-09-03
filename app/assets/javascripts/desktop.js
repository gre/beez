(function(){

  var XY_AXIS_HEIGHT = 120;
  var $params = $("#params");

  // Network
  var peers = new Backbone.Collection();
  var peersReady = new Backbone.Collection();
  peers.on("add", function (peer) {
    peer.on("open", function () {
      peersReady.add(peer);
    });
  });
  peers.on("remove", function (peer) {
    peersReady.remove(peer);
  });

  var controlNetwork = new beez.WebSocketControl({
    url: WEBSOCKET_ENDPOINT
  });

  controlNetwork.on({
    "open": function () {
    },
    "close": function () {
    },
    "receive-data": function (json) {
      var peer = peers.get(json.from);
      if (!peer) {
        peer = new beez.Peer({
          id: json.from,
          wssend: _.bind(this.wssend, this),
          isinitiator: false
        });
        peers.add(peer);
      }
      peer.trigger("message", json.data);
    },
    "receive-connect": function (json) {
      peers.add(
          new beez.Peer({
            id: json.id,
            wssend: _.bind(this.wssend, this),
            isinitiator: true
          })
      );
    },
    "receive-disconnect": function (json) {
      peers.remove(json.id);
    }
  });

  peersReady.on("rtcmessage", function (message, peer) {
    console.log("receive: "+message+" from "+peer.id);
    if (message[0] == "ping") {
      peer.send(["pong", Date.now()]);
    }
  });

  setInterval(function () {
    peersReady.each(function (peer) {
      peer.send(["ping", Date.now()]);
    });
  }, 1000);

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
    sampling: 512
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

  peers.on("data", function (msg) {
    switch (msg[0]) {
    case "tabopen":
      var tab = msg[1];
      var axis = allAxis.get(tab);
      peers.each(function (peer) {
        peer.send([ "tabxy", tab, axis.get("x"), axis.get("y") ]);
      });
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
