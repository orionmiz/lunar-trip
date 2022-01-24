import { useEffect, useRef, useState } from 'react'
import { Asteroids, ControlPanelOptions, Doggo, Earth, loadCorners, Moon, renderOptions } from '../lib/space'
import Switch from './controller/switch';
import { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Common, Events, Body, Vector } from 'matter-js';
import { getKeyString } from '../lib/utils';
import styles from '../styles/space.module.scss'
import Gear from './controller/gear';
import Controller from './controller/controller';

export default function World() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [matter, setMatter] = useState<{
    engine?: Engine,
    render?: Render
  }>({});

  const [options, setOptions] = useState<ControlPanelOptions>({
    boost: false,
    zoomIn: false,
    guide: true
  });

  // -1: counter-clockwise, 0: idle, 1: clockwise
  const [rotating, setRotating] = useState(0);

  const [power, setPower] = useState(1);

  // Initialize Space World
  useEffect(() => {
    Common.setDecomp(require('poly-decomp'))
    // create an engine
    const engine = Engine.create({
      gravity: {
        scale: 0
      },
    });

    // create a renderer
    const render = Render.create({
      canvas: canvasRef.current as HTMLCanvasElement,
      engine: engine,
      options: renderOptions
    });

    // Add doggo rocket
    Composite.add(engine.world, Doggo);

    // Add planet, asteroids
    Composite.add(engine.world, [Moon, Earth]);
    Composite.add(engine.world, Asteroids);

    // svg corners
    loadCorners().then(corners => {
      Composite.add(engine.world, corners);
    })

    const { width, height } = renderOptions;

    // walls
    Composite.add(engine.world, [
      Bodies.rectangle(width / 2, 0, width, 50, { isStatic: true, render: { fillStyle: '#063e7b' } }), // top
      Bodies.rectangle(width / 2, height, width, 50, { isStatic: true, render: { fillStyle: '#063e7b' } }), // bottom
      Bodies.rectangle(width, height / 2, 50, height, { isStatic: true, render: { fillStyle: '#063e7b' } }), // right
      Bodies.rectangle(0, height / 2, 50, height, { isStatic: true, render: { fillStyle: '#063e7b' } }), // left
    ]);

    // add mouse control
    const mouse = Mouse.create(render.canvas),
      mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        // @ts-ignore
        constraint: {
          stiffness: 0.2,
          render: {
            visible: true
          }
        },
        collisionFilter: {
          mask: 1
        }
      });

    Composite.add(engine.world, mouseConstraint);

    // run the renderer
    Render.run(render);

    // create runner
    const runner = Runner.create();

    // run the engine
    Runner.run(runner, engine);

    setMatter({ engine, render });

    return () => {
      Render.stop(render);
      Runner.stop(runner);

      console.log('render stop')
    }
  }, []);

  // Gravity Effect
  useEffect(() => {
    const { engine, render } = matter;
    if (!(engine && render))
      return;

    const gravityHandler = () => {
      const resultant = Vector.create(0, 0);

      // make resultant gravity
      [Moon, Earth].forEach(asteroid => {
        const gravity = Vector.sub(asteroid.position, Doggo.position);
        Vector.add(resultant, Vector.mult(Vector.div(gravity, (Vector.magnitude(gravity) ** 2)), 30), resultant);
      });

      Body.applyForce(Doggo, Doggo.position, resultant);
    }
    Events.on(engine, 'afterUpdate', gravityHandler);
    return () => {
      Events.off(engine, 'afterUpdate', gravityHandler)
      console.log('gravity stopped')
    };
  }, [matter]);

  // Boost Effect
  useEffect(() => {
    const { engine, render } = matter;

    if (!(engine && render))
      return;
    if (!options.boost)
      return;

    const smokes: Matter.Body[] = [];
    let frameCounter = 0;

    const boostHandler = () => {
      frameCounter++;

      // smokes are getting bigger in each frame
      smokes.forEach((smoke) => {
        if (smoke.render.opacity)
          smoke.render.opacity *= 0.90
        Body.scale(smoke, 1.02, 1.02);
      });

      const origin = Vector.clone(Doggo.position);
      const unitForce = Vector.create(Math.sin(Doggo.angle), -Math.cos(Doggo.angle));

      Body.applyForce(Doggo, origin, Vector.mult(unitForce, 0.2 * (power + 1)));

      // 4 smokes in 1sec (per 15frame)
      if (frameCounter === 15) {
        frameCounter = 0;
        const smoke = Bodies.circle(origin.x - 90 * unitForce.x, origin.y - 90 * unitForce.y, 25, {
          render: {
            fillStyle: 'skyblue',
          },
          collisionFilter: {
            category: 2
          },
          isSensor: true
        });

        smokes.unshift(smoke);
        Composite.add(engine.world, smoke);

        if (smokes.length === 5)
          Composite.remove(engine.world, smokes.pop() as Matter.Body);

        smokes.forEach(smoke => Body.applyForce(smoke, smoke.position, Vector.div(unitForce, -100)))
      }
    }
    Events.on(matter.engine, 'afterUpdate', boostHandler);
    return () => {
      console.log('boost stopped')
      smokes.forEach(smoke => Composite.remove(engine.world, smoke));
      Events.off(matter.engine, 'afterUpdate', boostHandler);
    };
  }, [matter, options.boost, power]);

  // Camera Effect
  useEffect(() => {
    const { engine, render } = matter;
    if (!(engine && render))
      return;

    if (!options.zoomIn) {
      Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: renderOptions.width, y: renderOptions.height },
      });
    } else {
      // move camera to doggo
      const cameraHandler = () => {
        const { x, y } = Doggo.position;
        Render.lookAt(matter.render as Render, {
          min: { x: x - 400, y: y - 400 },
          max: { x: x + 400, y: y + 400 },
        });
      }
      Events.on(matter.engine, 'afterUpdate', cameraHandler);
      return () => {
        console.log('camera stopped')
        Events.off(matter.engine, 'afterUpdate', cameraHandler);
      }
    }
  }, [matter, options.zoomIn]);

  // Guide Effect
  useEffect(() => {
    const { engine, render } = matter;
    const { guide, zoomIn } = options;
    if (!(engine && render && guide))
      return;

    // show distance from the moon
    const guideHandler = () => {
      const doggoToMoon = Vector.sub(Moon.position, Doggo.position);
      const distance = Vector.magnitude(doggoToMoon) | 0;

      if (distance < 300)
        return;

      const { x, y } = Doggo.position;

      const ctx = render.context;

      ctx.strokeStyle = 'white';
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.setLineDash([50, 100]);

      const from = zoomIn ? {
        x: renderOptions.width / 2,
        y: renderOptions.height / 2,
      } : {
        x, y
      }

      ctx.moveTo(from.x, from.y);

      const multiple = zoomIn ? renderOptions.width / 800 : 1; // divisor is the size of camera viewport

      const to = zoomIn ? {
        x: renderOptions.width / 2 + doggoToMoon.x * multiple,
        y: renderOptions.height / 2 + doggoToMoon.y * multiple
      } : {
        ...Moon.position
      }

      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      ctx.font = '200px sans';
      ctx.fillStyle = 'white';
      ctx.fillText(`Moon: ${distance}km`, from.x - 700, from.y + (zoomIn ? 600 : 300));
    }
    Events.on(matter.engine, 'afterUpdate', guideHandler);
    return () => {
      console.log('guide stopped')
      Events.off(matter.engine, 'afterUpdate', guideHandler);
    }
  }, [matter, options.zoomIn, options.guide]);

  useEffect(() => {
    console.log(rotating);
    if (rotating) {
      const rotationHandler = () => {
        Doggo.torque = rotating * 30;
      }

      Events.on(matter.engine, 'afterUpdate', rotationHandler);
      return () => {
        console.log('rotation stopped');
        Events.off(matter.engine, 'afterUpdate', rotationHandler);
      }
    }
  }, [matter, rotating]);

  return (
    <div className={styles.spaceContainer}>
      <div className={styles.title}>🚀 Trip to the Moon</div>
      <canvas ref={canvasRef} style={{ width: '100%', borderRadius: '20px' }}>
      </canvas>
      <div className={styles.controlPanel}>
        {/*<div>⚙️ Control Panel</div>*/}
        <hr />
        <div className={styles.flexbox}>
          <Controller
            rotateLeft={() => setRotating(-1)}
            rotateRight={() => setRotating(1)}
            cancel={() => setRotating(0)} />
          <div className={styles.optionContainer}>
            {
              Object.keys(options).map((option, idx) => {
                const key = option as keyof ControlPanelOptions;
                const val = options[key];
                return (
                  <Switch checked={val} toggle={() => setOptions({ ...options, [option]: !val })} key={idx}>
                    {getKeyString(key)}
                  </Switch>);
              })
            }
          </div>
        </div>
        <Gear power={power} change={(power) => setPower(power)} />

      </div>
    </div>)
}