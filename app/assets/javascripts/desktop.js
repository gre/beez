(function(){

  var audio = new beez.Audio();
  var waveform = new beez.Waveform({
    sampling: 1024
  });

  function syncWaveformSize () {
    waveform.set({
      width: window.innerWidth,
      height: window.innerHeight - 100
    });
  }
  $(window).on("resize", _.throttle(syncWaveformSize, 200));
  syncWaveformSize();

  waveform.setNode(audio.output, audio.ctx);
  var waveformView = new beez.WaveformView({
    model: waveform,
    el: $("#waveform")
  });

  audio.start();
  setInterval(_.bind(waveform.update, waveform), 50);

}());
