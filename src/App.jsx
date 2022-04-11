import { useEffect } from 'react';

// import { GUI } from 'dat.gui';

import SceneInit from './lib/Jihadinit';
import SnakeGame from './lib/SnakeCode';

function App() {
  useEffect(() => {
    const test = new SceneInit('myThreeJsCanvas');
    test.initScene();
    test.animate();

    const snakeGame = new SnakeGame();
    // test.scene.add(snakeGame.sgg);
    test.rtScene.add(snakeGame.snakegamegroup);

    const animate = (t) => {
      snakeGame.loop(t);
      requestAnimationFrame(animate);
    };
    animate();

    const onKeyDown = (event) => {
      if (event.repeat) {
        return;
      }
      snakeGame.pressKey(event);
    };


    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
  return (
    <div>
      <canvas id="myThreeJsCanvas"></canvas>
    </div>
  );
}

export default App;
