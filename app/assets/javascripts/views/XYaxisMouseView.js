beez.XYaxisMouseView = Backbone.View.extend({
  initialize: function () {
    this.canvas = document.createElement("canvas");
    this.canvas.width = "300";
    this.canvas.width = "200";
    this.$el.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.listenTo(this.model, "change:x change:y", this.syncParam);
    this.listenTo(this.model, "update", this.render);
    this.syncParam();
  },

  events: {
    "mousedown": "onMouseDown",
    "mousemove": "onMouseMove",
    "mouseup": "onMouseUp",

    "mouseenter": "onMouseEnter",
    "mouseleave": "onMouseUp"

  },

  onMouseDown: function (e) {
    this.down = true;
  },

  onMouseMove: function (e) {
    if (!this.down) return;

    var offset = this.$el.offset(),
        x = (e.clientX - offset.left)/this.canvas.width,
        y = (e.clientY - offset.top)/this.canvas.height;

    this.model.set({
      x: x,
      y: 1 - y,
      changing: true
    });

  },

  onMouseUp: function (e) {
    this.down = false;
    this.model.set({
      changing: false
    });
  },

  onMouseEnter: function (e) {
    if (e.which === 1) {
      this.onMouseDown(e);
    }
  },

  onMouseLeave: function (e) {
    this.onMouseUp(e);
  },

  syncParam: function () {
    this.render();
  },

  render: function () {

    var c = this.ctx,
        canvas = this.canvas;

    c.fillStyle = "#cde";
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.lineWidth = 4;
    c.strokeStyle = "#789";
    c.strokeRect(0, 0, canvas.width, canvas.height);

    c.fillStyle = "hsl(0, 50%, 40%)";
    c.beginPath();
    c.arc(canvas.width * this.model.get("x"), canvas.height * (1 - this.model.get("y")), 10, 0, Math.PI * 2, false);
    c.fill();

    c.fillStyle = "#fff";
    c.font = "10pt Helvetica, Arial, sans-serif";
    c.fillText(this.model.get("name"), 10, 18);

  }
});

