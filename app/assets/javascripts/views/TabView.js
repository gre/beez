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
