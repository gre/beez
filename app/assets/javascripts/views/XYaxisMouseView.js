beez.XYaxisMouseView = Backbone.View.extend({
  initialize: function () {
    this.canvas = document.createElement("canvas");
    this.$el.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.listenTo(this.model, "change:width change:height", this.syncSize);
    this.listenTo(this.model, "change:x change:y", this.syncParam);
    this.listenTo(this.model, "change", this.render);
    this.syncSize();
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
    this.onMouseMove(e);
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
    this.onMouseMove(e);
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
        backgroundColor = "rgba(250,250,250,0.7)";

    c.clearRect(0, 0, canvas.width, canvas.height);

    c.fillStyle = backgroundColor;
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.lineWidth = 6;
    c.strokeStyle = "#789";
    c.strokeRect(0, 0, canvas.width, canvas.height);

    c.lineWidth = 1;
    c.strokeRect(0, 0, canvas.width, canvas.height / 2 | 0);
    c.strokeRect(0, 0, canvas.width / 2 |0, canvas.height);

    c.font = "11pt Helvetica, Arial, sans-serif";

    // Main label
    var dimensions = c.measureText(this.model.get("name"));
    c.fillStyle = backgroundColor;
    c.fillRect((canvas.width - dimensions.width) / 2 - 5, (canvas.height  / 2) - 10, dimensions.width + 10, 20);

    c.fillStyle = "#789";
    c.fillText(this.model.get("name"), (canvas.width - dimensions.width) / 2, (canvas.height  / 2) + 4);

    // Axis labels
    c.font = "8pt Helvetica, Arial, sans-serif";

    dimensions = c.measureText(this.model.get("xlabel"));
    c.fillText(this.model.get("xlabel"), canvas.width - dimensions.width - 5, canvas.height - 7);

    dimensions = c.measureText(this.model.get("ylabel"));
    c.translate(12, dimensions.width + 6);
    c.rotate(-Math.PI / 2);
    c.fillText(this.model.get("ylabel"), 0, 0);
    c.rotate(Math.PI / 2);
    c.translate(-12, -(dimensions.width + 6));

    // Circle
    var radius = this.model.get("changing") ? 8 : 6;
    c.lineWidth = this.model.get("changing") ? 8 : 4;
    c.strokeStyle = "hsl(0, 50%, 50%)";
    c.beginPath();
    c.arc(canvas.width * this.model.get("x"), canvas.height * (1 - this.model.get("y")), radius, 0, Math.PI * 2, false);
    c.stroke();


  }
});

