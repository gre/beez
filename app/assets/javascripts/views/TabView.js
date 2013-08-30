beez.TabView = Backbone.View.extend({
  tmpl: _.template('<span class="title"><%= name %></span>'),
  initialize: function () {
    this.$el.html(this.tmpl(this.model.attributes));
    this.listenTo(this.model, "change:active", this.syncOpen);
  },
  events: {
    "click": "onClick"
  },
  syncOpen: function () {
    this.$el.toggleClass("active", this.model.get("active"));
  },
  onClick: function () {
    this.model.trigger("tap", this.model);
  }
});
