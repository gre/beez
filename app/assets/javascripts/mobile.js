(function(){
  // Network
  var client_id = Math.round(Math.random() * 100000);
  var ws_host = "ws://localhost:9000/join/" + client_id;
  var ws = new WebSocket(ws_host);
  ws.onopen = function() {
      var beePeerBroker = new beez.BeePeerBroker({ws: ws});
  }
}());