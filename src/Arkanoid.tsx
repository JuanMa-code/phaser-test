import * as PIXI from 'pixi.js';
import React, { useEffect, useRef } from 'react';

const Arkanoid: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const app = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0x222222,
    });
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    // Paddle
    const paddle = new PIXI.Graphics();
    paddle.beginFill(0xffffff);
    paddle.drawRect(-50, -10, 100, 20);
    paddle.endFill();
    paddle.x = 400;
    paddle.y = 570;
    app.stage.addChild(paddle);

    // Ball
    const ball = new PIXI.Graphics();
    ball.beginFill(0xff0000);
    ball.drawCircle(0, 0, 10);
    ball.endFill();
    ball.x = 400;
    ball.y = 400;
    app.stage.addChild(ball);

    // Bricks
    const bricks: PIXI.Graphics[] = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 10; col++) {
        const brick = new PIXI.Graphics();
        brick.beginFill(0x00ffcc);
        brick.drawRect(0, 0, 70, 20);
        brick.endFill();
        brick.x = 20 + col * 76;
        brick.y = 40 + row * 28;
        app.stage.addChild(brick);
        bricks.push(brick);
      }
    }

    let ballVelocity = { x: 4, y: -4 };
    let left = false, right = false;
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') left = true;
      if (e.key === 'ArrowRight') right = true;
    };
    const keyup = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') left = false;
      if (e.key === 'ArrowRight') right = false;
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);

    app.ticker.add(() => {
      if (left) paddle.x -= 7;
      if (right) paddle.x += 7;
      paddle.x = Math.max(50, Math.min(750, paddle.x));
      ball.x += ballVelocity.x;
      ball.y += ballVelocity.y;
      // Wall collision
      if (ball.x < 10 || ball.x > 790) ballVelocity.x *= -1;
      if (ball.y < 10) ballVelocity.y *= -1;
      // Paddle collision
      if (
        ball.y + 10 > paddle.y - 10 &&
        ball.x > paddle.x - 50 &&
        ball.x < paddle.x + 50 &&
        ballVelocity.y > 0
      ) {
        ballVelocity.y *= -1;
        ball.y = paddle.y - 20;
      }
      // Brick collision
      for (let i = bricks.length - 1; i >= 0; i--) {
        const brick = bricks[i];
        if (
          ball.x > brick.x &&
          ball.x < brick.x + 70 &&
          ball.y > brick.y &&
          ball.y < brick.y + 20
        ) {
          app.stage.removeChild(brick);
          bricks.splice(i, 1);
          ballVelocity.y *= -1;
          break;
        }
      }
      // Lose condition
      if (ball.y > 600) {
        ball.x = 400;
        ball.y = 400;
        ballVelocity = { x: 4, y: -4 };
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

export default Arkanoid;
