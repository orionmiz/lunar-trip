import { Bodies, Body, Svg, Vector, Engine, Render } from "matter-js"

export const SpaceEngine = Engine.create({
  gravity: {
    scale: 0
  },
});

export const createRenderer = (canvas: HTMLCanvasElement) => {
  if (!canvas)
    return;
  return Render.create({
    canvas,
    engine: SpaceEngine,
    options: renderOptions
  })
}

const asteroidImgPath = [
  'images/space/asteroid-1-r.png',
  'images/space/asteroid-2-r.svg',
  'images/space/asteroid-3-r.svg',
  'images/space/asteroid-4-r.svg',
  'images/space/earth-resized.png',
];

export const renderOptions = {
  width: 4000,
  height: 4000,
  wireframes: false,
  background: '#1d1135',
}

const select = function (root: Document, selector: string) {
  return Array.prototype.slice.call(root.querySelectorAll(selector));
};

const loadSvg = async function (url: string) {
  return fetch(url)
    .then(function (response) { return response.text(); })
    .then(function (raw) { return (new window.DOMParser()).parseFromString(raw, 'image/svg+xml'); });
};

export const loadCorners = () => loadSvg('./images/space/corner4.svg').then(function (root) {
  const color = '#063e7b';

  const vertexSets = select(root, 'path')
    .map(function (path) { return Svg.pathToVertices(path, 30); });

  const coords = [
    [71, 71],
    [renderOptions.width - 71, 71],
    [renderOptions.width - 71, renderOptions.height - 71],
    [71, renderOptions.height - 71],
  ]

  return coords.map(([x, y], idx) => {
    const body = Bodies.fromVertices(x, y, vertexSets, {
      render: {
        fillStyle: color,
        strokeStyle: color,
        lineWidth: 1
      },
      isStatic: true,
      //friction: 0
      //angle: (Math.PI / 2.0 * idx)
    }, true);

    Body.rotate(body, Math.PI / 2 * idx);

    return body;
  });

  /*return [Bodies.fromVertices(400, 80, vertexSets, {
    render: {
      fillStyle: color,
      strokeStyle: color,
      lineWidth: 1
    }
  }, true)];*/
});

const asteroidRadius = 100;

const makeRandomPos = (min: Vector, max: Vector): Vector => {

  const pos = Vector.create(min.x + Math.random() * (max.x - min.x),
    min.y + Math.random() * (max.y - min.y));

  for (const obj of [Doggo, Moon, Earth]) {
    // so close to other objects
    if (Vector.magnitude(Vector.sub(obj.position, pos)) < asteroidRadius * 3) {
      return makeRandomPos(min, max);
    }
  }

  return pos;
}

export const Doggo = Bodies.trapezoid(1200, 3000, 175, 213, 1, {
  render: {
    sprite: {
      texture: 'images/space/resized-color-2.png',
      xScale: 0.5,
      yScale: 0.5,
      // @ts-ignore
      xOffset: 0.17,
      yOffset: 0.15,
    },
  },
  angle: Math.PI / 2,
  //torque: 200,
  friction: 1,
  frictionAir: 0.01,
  collisionFilter: {
    mask: 1
  },
  density: 0.1, // for small rocket
  restitution: 0.1,
  //frictionStatic: 1,
})

export const generateAsteroid = (num: number, options: {
  isStatic?: boolean
  pos?: Vector
} = {
    isStatic: false,
  }) => {

  const { isStatic, pos } = options;

  let x;
  let y;

  if (pos) {
    x = pos.x;
    y = pos.y;
  } else {
    const { x: randX, y: randY } = makeRandomPos(Vector.create(125, 125), Vector.create(renderOptions.width - 125, renderOptions.height - 125));
    x = randX;
    y = randY;
  }

  return Bodies.circle(x, y, asteroidRadius, {
    render: {
      sprite: {
        texture: asteroidImgPath[num - 1],
        xScale: 2,
        yScale: 2,
        // @ts-ignore
      },
    },
    angle: Math.PI / 2,
    //torque: 200,
    friction: 1,
    //frictionStatic: 0,
    frictionAir: 0,
    collisionFilter: {
      mask: 1
    },
    density: 1,
    restitution: 1,
    isStatic
  });
}

export const Moon = generateAsteroid(4, {
  // Position is essential
  pos: {
    //x: renderOptions.width - 800,
    x: 3000,
    y: 1000
    //y: renderOptions.height / 2
  },
  isStatic: true
})

export const Earth = generateAsteroid(5, {
  pos: {
    x: 1000,
    y: 3000
  },
  isStatic: true
})

/*export const Asteroids: Matter.Body[] = [
  generateAsteroid(1),
  generateAsteroid(1),
  generateAsteroid(1),
  generateAsteroid(1),
  //generateAsteroid(2),
];*/

const makeDummies = (size: number) => {

  const dummies = [];

  

}

export const Asteroids: Matter.Body[] = Array(10).fill(0).map(_ => generateAsteroid(1));

export interface ControlPanelOptions {
  boost: boolean,
  zoomIn: boolean,
  guide: boolean
}