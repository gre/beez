
beez.XYaxisTouchableView = Backbone.View.extend({
  initialize: function () {
    this.canvas = document.createElement("canvas");
    this.$el.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.listenTo(this.model, "change:width change:height", this.syncSize);
    this.listenTo(this.model, "change:x change:y", this.syncParam);
    this.listenTo(this.model, "change", this.render);
    this.syncSize();
    this.syncParam();
    this.el.addEventListener("touchstart", _.bind(this.onTouchstart, this), false);
    this.el.addEventListener("touchmove", _.bind(this.onTouchmove, this), false);
    this.el.addEventListener("touchend", _.bind(this.onTouchend, this), false);
    this.el.addEventListener("touchcancel", _.bind(this.onTouchcancel, this), false);
    this.identifier = null;
  },

  getCurrentTouch: function (e) {
    for (var i=0; i<e.changedTouches.length; ++i)
      if (e.changedTouches[i].identifier === this.identifier)
        return e.changedTouches[i];
  },

  onTouchstart: function (e) {
    e.preventDefault();
    if (this.identifier !== null) return;
    var touch = e.changedTouches[0];
    this.identifier = touch.identifier;
    this.model.set({
      changing: true
    });
  },
  
  onTouchmove: function (e) {
    if (this.identifier === null) return;
    var touch = this.getCurrentTouch(e);
    if (!touch) return;
    var width = this.model.get("width");
    var height = this.model.get("height");
    var x = Math.max(0, Math.min(touch.clientX, width)) / width;
    var y = Math.max(0, Math.min(touch.clientY-OFFSET_Y+10, height)) / height;
    this.model.set({
      x: x,
      y: 1 - y
    });
  },
  
  onTouchcancel: function (e) {
    if (this.identifier === null) return;
    var touch = this.getCurrentTouch(e);
    if (!touch) return;
    this.identifier = null;
    this.model.set({
      changing: false
    });
  },

  onTouchend: function (e) {
    if (this.identifier === null) return;
    var touch = this.getCurrentTouch(e);
    if (!touch) return;
    this.identifier = null;
    this.model.set({
      changing: false
    });
  },

  syncSize: function () {
    this.canvas.width = this.model.get("width");
    this.canvas.height = this.model.get("height");
  },

  syncParam: function () {
    this.render();
  },

  render: function () {
    var c = this.ctx,
        canvas = this.canvas,
        backgroundColor = "#000";

    c.fillStyle = backgroundColor;
    c.fillRect(0, 0, canvas.width, canvas.height);

    c.lineWidth = 1;
    c.strokeStyle = "#789";


    // Axis labels
    c.font = "20pt Helvetica, Arial, sans-serif";
    c.fillStyle = "#789";

    c.save();
    dimensions = c.measureText(this.model.get("xlabel"));
    c.fillText(this.model.get("xlabel"), canvas.width - dimensions.width - 10, canvas.height - 12);

    dimensions = c.measureText(this.model.get("ylabel"));
    c.translate(26, dimensions.width + 12);
    c.rotate(-Math.PI / 2);
    c.fillText(this.model.get("ylabel"), 0, 0);
    c.restore();

    // grid
    c.strokeStyle = "#666";
    c.lineWidth = 1;
    for (var i=0; i<10; ++i) {
      var x = Math.round(canvas.width*i/10);
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, canvas.height);
      c.stroke();
    }
    for (var i=0; i<10; ++i) {
      var y = Math.round(canvas.height*i/10);
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(canvas.width, y);
      c.stroke();
    }

    // pointer
    c.strokeStyle = !this.model.get("changing") ? "#fff" : "#ace";
    c.lineWidth = !this.model.get("changing") ? 3 : 6;
    var x = canvas.width * this.model.get("x");
    var y = canvas.height * (1-this.model.get("y"));
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, canvas.height);
    c.stroke();
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(canvas.width, y);
    c.stroke();


  }
});


