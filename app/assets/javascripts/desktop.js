(function(){

  var audio = new beez.Audio();
  var waveform = new beez.Waveform({
    sampling: 1024
  });

  function syncWaveformSize () {
    waveform.set({
      width: window.innerWidth,
      height: window.innerHeight - 200
    });
  }
  $(window).on("resize", _.throttle(syncWaveformSize, 200));
  syncWaveformSize();

  waveform.setNode(audio.output, audio.ctx);
  var waveformView = new beez.WaveformView({
    model: waveform,
    el: $("#waveform")
  });

  var params = [];
  for (var i = 0; i < 5; i++) {
    params.push(
      new beez.XYaxisMouseView({
        model: new beez.XYaxis({
          x: 0.5,
          y: 0.5
        }),
        el: $("#param" + i)
      })
    )
  }

  audio.start();
  setInterval(_.bind(waveform.update, waveform), 50);

}());
