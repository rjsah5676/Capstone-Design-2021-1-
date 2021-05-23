onmessage = (e) => {
    /*
    const config = {
        video: { width: 1024, height: 768, fps: 30 }
      };
      
      async function 탄지로() {
      
        const video = document.getElementById('hiddenVideo')
      
        const knownGestures = [
          fp.Gestures.VictoryGesture,
          fp.Gestures.ThumbsUpGesture
        ];
        const GE = new fp.GestureEstimator(knownGestures);
      
        // load handpose model
        const model = await handpose.load();
        console.log("Handpose model loaded");
      
        // main estimation loop
        const estimateHands = async () => {
      
          const predictions = await model.estimateHands(video, true);
      
          for(let i = 0; i < predictions.length; i++) {
      
            const est = GE.estimate(predictions[i].landmarks, 7.5);
      
            if(est.gestures.length > 0) {
      
              let result = est.gestures.reduce((p, c) => { 
                return (p.confidence > c.confidence) ? p : c;
              });
      
              postMessage(result.name)
            }
          }
      
          // ...and so on
          if(gesturechk)
            setTimeout(() => { estimateHands(); }, 1000 / config.video.fps);
        };
      
        estimateHands();
        console.log("Starting predictions");
      }
      */
      //-제스처
   // 탄지로()
}