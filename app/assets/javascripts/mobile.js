(function(){
  // Network
  var ws = new WebSocket(WEBSOCKET_ENDPOINT);
  
  var hive;
  ws.onopen = function() {
    hive = new beez.BeePeerBroker({ws: ws});
  }

  OFFSET_Y = 50;

  var $tabs = $("#tabs");
  var $xyaxis = $("#xyaxis");

  var tabs = new Backbone.Collection();
  
  _.each(beez.params.groupBy("tab"), function (xyParams, tabname) {
    var $tab = $('<div class="tab" />').appendTo($tabs);
    var tab = new beez.Tab({
      name: tabname
    });
    var tabView = new beez.TabView({
      model: tab,
      el: $tab
    });
    tabs.add(tab);
  });

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
      name: tabname,
      xlabel: xP.get("name"),
      ylabel: yP.get("name")
    });
    if (xyAxisView) xyAxisView.remove();
    xyAxisView = new beez.XYaxisTouchableView({
      model: xyAxis,
      el: $('<div/>').appendTo($xyaxis.empty())
    });
  });

  tabs.first().trigger("tap", tabs.first());

  xyAxis.on("change:x", _.throttle(function (m, x) {
    xP && hive.send(["set", xP.get("id"), x]);
  }, 50));
  xyAxis.on("change:y", _.throttle(function (m, y) {
    yP && hive.send(["set", yP.get("id"), y]);
  }, 50));


}());
