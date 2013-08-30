(function(){
  // Network
  var client_id = Math.round(Math.random() * 100000);
  var ws_host = "ws://localhost:9000/join/" + client_id;
  var ws = new WebSocket(ws_host);
  ws.onopen = function() {
      var beePeerBroker = new beez.BeePeerBroker({ws: ws});
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
    var xP = beez.params.find(function (p) {
      return p.get("tab")===tabname && p.get("axis") === "x";
    });
    var yP = beez.params.find(function (p) {
      return p.get("tab")===tabname && p.get("axis") === "y";
    });
    if (!xP) throw "can't find param for x in tab "+tabname;
    if (!yP) throw "can't find param for y in tab "+tabname;
    xyAxis.set({
      name: tabname,
      xlabel: xP.get("name"),
      ylabel: yP.get("name")
    });
    xyAxisView = new beez.XYaxisTouchableView({
      model: xyAxis,
      el: $xyaxis.empty()
    });
  });

  tabs.first().trigger("tap", tabs.first());


}());
