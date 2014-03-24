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
beez.Waveform = Backbone.Model.extend({
  initialize: function () {
    this.on("change:sampling", this.syncSampling);
    this.syncSampling();
  },
  setNode: function (audioNode, audioCtx) {
    this.set("sampleRate", audioCtx.sampleRate);
    this.analyser = audioCtx.createAnalyser();
    this.analyserSpectrum = audioCtx.createAnalyser();
    this.analyserSpectrum.smoothingTimeConstant = 0.3;
    this.analyserSpectrum.fftSize = 1024;
    audioNode.connect(this.analyser);
    audioNode.connect(this.analyserSpectrum);
  },
  syncSampling: function () {
    this.array = new Uint8Array(this.get("sampling")||256);
    this.arraySpectrum = new Uint8Array(512);
  },
  update: function () {
    this.analyser.getByteTimeDomainData(this.array);
    this.analyserSpectrum.getByteFrequencyData(this.arraySpectrum);
    this.trigger("update");
  }
});

