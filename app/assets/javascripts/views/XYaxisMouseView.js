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

    c.fillStyle = "hsl(20, 40%, 40%)";
    c.beginPath();
    c.arc(this.model.x, this.model.y, 20, 0, Math.PI * 2, false);
    c.fill();

  }
});

