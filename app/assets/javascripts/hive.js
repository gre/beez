/*
 * This file is part of Beez.
 *
 * Copyright 2014 Zengularity
 *
 * Beez is free software: you can redistribute it and/or modify
 * it under the terms of the AFFERO GNU General Public License as published by
 * the Free Software Foundation.
 *
 * Beez is distributed "AS-IS" AND WITHOUT ANY WARRANTY OF ANY KIND,
 * INCLUDING ANY IMPLIED WARRANTY OF MERCHANTABILITY,
 * NON-INFRINGEMENT, OR FITNESS FOR A PARTICULAR PURPOSE. See
 * the AFFERO GNU General Public License for the complete license terms.
 *
 * You should have received a copy of the AFFERO GNU General Public License
 * along with Beez.  If not, see <http://www.gnu.org/licenses/agpl-3.0.html>
 */

(function(){

  var XY_AXIS_HEIGHT = 120;
  var $params = $("#params");

  // Network
  // Connect with bees and hive brothers
  var network = new beez.WebSocketPeersManager({
    url: WEBSOCKET_ENDPOINT,
    role: "hive",
    acceptRoles: ["bee", "hive"]
  });

  var hives = new beez.Peers();
  var bees = new beez.Peers();
  network.peers.on("add", function (peer) {
    var role = peer.get("role");
    if (role === "hive")
      hives.add(peer)
    else if (role === "bee")
      bees.add(peer);
  });
  network.peers.on("remove", function (peer) {
    hives.remove(peer);
    bees.remove(peer);
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

  allAxis.on("change:changing", function (axis, moving, opts) {
    if (opts.network) return;
    hives.send({
      e: "tabxychanging",
      tab: axis.get("id"),
      active: moving
    });
  });
  
  allAxis.on("change:x change:y", _.throttle(function (axis, value, opts) {
    if (opts.network) return;
    hives.send({
      e: "tabxy",
      tab: axis.get("id"), 
      x: axis.get("x"), 
      y: axis.get("y")
    });
  }, 50));

  hives.on({
    "@tabs": function (msg, peer) {
      allAxis.each(function (axis) {
        var hiveAxis = _.find(msg.tabs, function (tab) {
          return tab.id == axis.get("id");
        });
        axis.set({
          x: hiveAxis.x,
          y: hiveAxis.y,
          changing: hiveAxis.changing
        }, {
          network: true
        });
      });
    }
  });

  bees.on({
    "@tabopen": function (msg, peer) {
      var axis = allAxis.get(msg.tab);
      peer.send({
        e: "tabxy", 
        tab: msg.tab,
        x: axis.get("x"),
        y: axis.get("y")
      });
    }
  });

  network.peers.on({
    "add": function (peer) {
      if (peer.get("isinitiator") && peer.get("role") == "hive") {
        peer.send({
          e: "tabs",
          tabs: allAxis.map(function (axis) {
            return axis.attributes;
          })
        });
      }
    },
    "@tabxy": function (msg, peer) {
      allAxis.get(msg.tab).set({
        x: msg.x,
        y: msg.y
      }, {
        network: true
      });
    },
    "@tabxychanging": function (msg, peer) {
      allAxis.get(msg.tab).set({
        changing: msg.active
      }, {
        network: true
      });
    }
  });

}());
