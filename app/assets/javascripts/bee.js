(function(){

  // Network
  // Only connect with hives, not brother bees
  var network = new beez.WebSocketPeersManager({
    url: WEBSOCKET_ENDPOINT,
    role: "bee",
    acceptRoles: ["hive"]
  });

  OFFSET_Y = 40;

  var $tabs = $("#tabs");
  var $xyaxis = $("#xyaxis");

  var tabs = new Backbone.Collection(
    _.map(beez.params.groupBy("tab"), function (xyParams, tabname) {
      var $tab = $('<div class="tab" />').appendTo($tabs);
      var tab = new beez.Tab({
        id: tabname,
        name: tabname
      });
      var tabView = new beez.TabView({
        model: tab,
        el: $tab
      });
      return tab;
    })
  );

  $tabs.find(".tab").css("width", (Math.floor(1000/tabs.size())/10)+"%");

  var xyAxis = new beez.XYaxis({});
  var xyAxisView;
  var xP, yP;

  function syncXyAxis () {
    xyAxis.set({
      width: window.innerWidth,
      height: window.innerHeight - OFFSET_Y
    });
  }
  $(window).on("resize", _.throttle(syncXyAxis, 100));
  syncXyAxis();

  tabs.on("tap", function (tab) {
    network.peers.send({
      e: "tabopen",
      tab: tab.get("id")
    });
    tab.set("active", true);
    _.each(tabs.filter(function (t) { return t !== tab }), function (t) {
      t.set("active", false);
    });
    var tabname = tab.get("name");
    xP = beez.params.find(function (p) {
      return p.get("tab")===tabname && p.get("axis") === "x";
    });
    yP = beez.params.find(function (p) {
      return p.get("tab")===tabname && p.get("axis") === "y";
    });
    if (!xP) throw "can't find param for x in tab "+tabname;
    if (!yP) throw "can't find param for y in tab "+tabname;
    xyAxis.set({
      tab: tabname,
      xlabel: xP.get("name"),
      ylabel: yP.get("name")
    });
    if (xyAxisView) xyAxisView.remove();
    xyAxisView = new beez.XYaxisTouchableView({
      model: xyAxis,
      el: $('<div/>').appendTo($xyaxis.empty())
    });
  });

  xyAxis.on("change:changing", function (m, moving) {
    network.peers.send({
      e: "tabxychanging",
      tab: this.get("tab"),
      active: moving
    });
  });

  xyAxis.on("change:x change:y", _.throttle(function () {
    network.peers.send({
      e: "tabxy",
      tab: this.get("tab"), 
      x: this.get("x"), 
      y: this.get("y")
    });
  }, 50));

  network.on("open", function () {
    $("#connect").hide();
    tabs.first().trigger("tap", tabs.first());
  });

  network.on("close", function () {
    $("#disconnect").show();
  });

  network.peers.on({
    "@tabxy": function (msg, peer) {
      if (xyAxis.get("tab") === msg.tab && xyAxis.get("changing")==false) {
        xyAxis.set({
          x: msg.x,
          y: msg.y
        });
      }
    }
  });

}());
