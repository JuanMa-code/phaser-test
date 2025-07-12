import * as PIXI from 'pixi.js';
import React, { useEffect, useRef } from 'react';

const Pong: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const app = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0x222222,
    });
    // Asegura que el canvas es un Node antes de añadirlo
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    // Paddles
    const paddleLeft = new PIXI.Graphics();
    paddleLeft.beginFill(0xffffff);
    paddleLeft.drawRect(-10, -50, 20, 100);
    paddleLeft.endFill();
    paddleLeft.x = 30;
    paddleLeft.y = 300;
    app.stage.addChild(paddleLeft);

    const paddleRight = new PIXI.Graphics();
    paddleRight.beginFill(0xffffff);
    paddleRight.drawRect(-10, -50, 20, 100);
    paddleRight.endFill();
    paddleRight.x = 770;
    paddleRight.y = 300;
    app.stage.addChild(paddleRight);

    // Ball
    const ball = new PIXI.Graphics();
    ball.beginFill(0xff0000);
    ball.drawCircle(0, 0, 12);
    ball.endFill();
    ball.x = 400;
    ball.y = 300;
    app.stage.addChild(ball);

    // Ball velocity
    let ballVelocity = { x: 4, y: 3 };

    // Controls
    let leftUp = false, leftDown = false, rightUp = false, rightDown = false;
    const keydown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w') leftUp = true;
      if (e.key.toLowerCase() === 's') leftDown = true;
      if (e.key === 'ArrowUp') rightUp = true;
      if (e.key === 'ArrowDown') rightDown = true;
    };
    const keyup = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w') leftUp = false;
      if (e.key.toLowerCase() === 's') leftDown = false;
      if (e.key === 'ArrowUp') rightUp = false;
      if (e.key === 'ArrowDown') rightDown = false;
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);

    // Game loop
    app.ticker.add(() => {
      if (leftUp) paddleLeft.y -= 6;
      if (leftDown) paddleLeft.y += 6;
      if (rightUp) paddleRight.y -= 6;
      if (rightDown) paddleRight.y += 6;
      paddleLeft.y = Math.max(50, Math.min(550, paddleLeft.y));
      paddleRight.y = Math.max(50, Math.min(550, paddleRight.y));
      ball.x += ballVelocity.x;
      ball.y += ballVelocity.y;
      if (ball.y < 12 || ball.y > 588) ballVelocity.y *= -1;
      if (
        ball.x - 12 < paddleLeft.x + 10 &&
        ball.y > paddleLeft.y - 50 &&
        ball.y < paddleLeft.y + 50
      ) {
        ballVelocity.x *= -1;
        ball.x = paddleLeft.x + 22;
      }
      if (
        ball.x + 12 > paddleRight.x - 10 &&
        ball.y > paddleRight.y - 50 &&
        ball.y < paddleRight.y + 50
      ) {
        ballVelocity.x *= -1;
        ball.x = paddleRight.x - 22;
      }
      if (ball.x < 0 || ball.x > 800) {
        ball.x = 400;
        ball.y = 300;
        ballVelocity = { x: Math.random() > 0.5 ? 4 : -4, y: Math.random() > 0.5 ? 3 : -3 };
      }
    });

    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} style={{ width: 800, height: 600, margin: 'auto' }} />;
};

export default Pong;
