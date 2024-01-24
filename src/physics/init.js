import { Engine, Runner, Bodies, Composite } from "matter-js"
import { canvas, context } from "./worker.js"

export let engine

export function initMatter() {
  engine = Engine.create()

  // const render = Render.create({
  //   canvas: canvas,
  //   engine: engine,
  // })

    const boxA = Bodies.rectangle(400, 200, 80, 80)
  const boxB = Bodies.rectangle(450, 50, 80, 80)
  const ground = Bodies.rectangle(400, 610, 9999, 60, { isStatic: true })

  Composite.add(engine.world, [boxA, boxB, ground]);

  // Render.run(render)

    (function render() {
      var bodies = Composite.allBodies(engine.world);

      requestAnimationFrame(render);

      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.beginPath();

      for (var i = 0; i < bodies.length; i += 1) {
        var vertices = bodies[i].vertices;

        context.moveTo(vertices[0].x, vertices[0].y);

        for (var j = 1; j < vertices.length; j += 1) {
          context.lineTo(vertices[j].x, vertices[j].y);
        }

        context.lineTo(vertices[0].x, vertices[0].y);
      }

      context.lineWidth = 1;
      context.strokeStyle = '#fff';
      context.stroke();
    })();

  const runner = Runner.create()

  Runner.run(runner, engine)
}