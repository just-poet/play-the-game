import * as T from 'three';

export const { MathUtils: M } = T;
export function random(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const materials = new Map();
export function mat(color, glow = 0) {
  const key = color + '/' + glow;
  if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({
    color, roughness: 0.79, emissive: glow ? color : 0, emissiveIntensity: glow
  }));
  return materials.get(key);
}

export const geo = {
  box: new T.BoxGeometry(1, 1, 1),
  ball: new T.SphereGeometry(1, 18, 12),
  gem: new T.IcosahedronGeometry(1, 0),
  leaf: new T.IcosahedronGeometry(1, 1),
  cone: new T.ConeGeometry(1, 1, 8),
  post: new T.CylinderGeometry(0.76, 1, 1, 10),
  pipe: new T.CylinderGeometry(1, 1, 1, 12),
  disk: new T.CircleGeometry(1, 28),
};

export function group(parent, x = 0, y = 0, z = 0) {
  const node = new T.Group();
  node.position.set(x, y, z);
  parent.add(node);
  return node;
}

export function shape(parent, geometry, color, x, y, z, sx = 1, sy = 1, sz = 1) {
  const mesh = new T.Mesh(geometry, color.isMaterial ? color : mat(color));
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  parent.add(mesh);
  return mesh;
}
export const box = (p, c, ...args) => shape(p, geo.box, c, ...args);
export const ball = (p, c, ...args) => shape(p, geo.ball, c, ...args);

export function rod(parent, color, start, end, width, geometry = geo.post) {
  const a = new T.Vector3(...start), b = new T.Vector3(...end);
  const center = a.clone().lerp(b, 0.5);
  const direction = b.sub(a);
  const mesh = shape(parent, geometry, color, center.x, center.y, center.z, width, direction.length(), width);
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

export function batch(parent, geometry, items) {
  const buckets = new Map();
  for (const item of items) {
    const index = Math.floor(item[2] / 32);
    if (!buckets.has(index)) buckets.set(index, []);
    buckets.get(index).push(item);
  }
  if (buckets.size <= 3) return makeBatch(parent, geometry, items);
  for (const bucket of buckets.values()) makeBatch(parent, geometry, bucket);
}

function makeBatch(parent, geometry, items) {
  const material = new T.MeshStandardMaterial({color: 0xffffff, roughness: 0.9});
  const meshes = new T.InstancedMesh(geometry, material, items.length);
  const tmp = new T.Object3D();
  const tint = new T.Color();
  items.forEach(([x, y, z, sx, sy, sz, color, rx = 0, ry = 0, rz = 0], i) => {
    tmp.position.set(x, y, z);
    tmp.scale.set(sx, sy, sz);
    tmp.rotation.set(rx, ry, rz);
    tmp.updateMatrix();
    meshes.setMatrixAt(i, tmp.matrix);
    meshes.setColorAt(i, tint.set(color));
  });
  parent.add(meshes);
  return meshes;
}

function triangle(w, h, d) {
  const s = new T.Shape();
  s.moveTo(-w / 2, 0);
  s.quadraticCurveTo(-w / 2, h * .43, -w * .09, h * .92);
  s.quadraticCurveTo(0, h * 1.08, w * .09, h * .92);
  s.quadraticCurveTo(w / 2, h * .43, w / 2, 0);
  s.lineTo(-w / 2, 0);
  const g = new T.ExtrudeGeometry(s, {depth: d, bevelSize: .026, bevelThickness: .024, bevelSegments: 2, steps: 1, curveSegments: 7});
  g.translate(0, 0, -d / 2);
  return g;
}

const ear = triangle(.35, .48, .105);
const inner = triangle(.21, .30, .022);
const scarf = triangle(.54, .46, .035);
const shadow = new T.MeshBasicMaterial({color: 0x23172b, transparent: true, opacity: .23, depthWrite: false});

export function pet(parent, kind = 'pup', tint, scarfColor) {
  const cat = kind === 'cat';
  const coat = tint ?? (cat ? 0xf8dfca : 0xd99351);
  const cream = cat ? 0xfff5e6 : 0xffe4b7;
  const dark = cat ? 0x4b3442 : 0x38232d;
  const root = group(parent), rig = group(root);
  const blob = shape(root, geo.disk, shadow, 0, .027, .01, .53, .7, 1);
  blob.rotation.x = -Math.PI / 2;
  const body = group(rig);
  ball(body, coat, 0, .64, .11, .39, .38, .56);
  ball(body, cream, 0, .63, -.25, .30, .34, .30);
  const legs = [];
  for (const x of [-.245, .245]) {
    for (const z of [-.27, .39]) {
      const pivot = group(rig, x, .56, z);
      ball(pivot, coat, 0, -.17, 0, .115, .23, .12);
      ball(pivot, cream, 0, -.37, -.063, .14, .11, .17);
      legs.push(pivot);
    }
  }

  const tail = group(body, 0, .76, .55);
  const tailPoints = cat ? [[0,0,0],[.02,.28,.23],[.04,.61,.34],[.05,.83,.20]] :
    [[0,0,0],[.03,.15,.26],[.10,.34,.36],[.14,.48,.29]];
  const curve = new T.CatmullRomCurve3(tailPoints.map(v => new T.Vector3(...v)));
  shape(tail, new T.TubeGeometry(curve, 12, cat ? .068 : .103, 8, false), coat, 0, 0, 0);
  ball(tail, cream, ...tailPoints[3], .085, .095, .085);

  const head = group(body, 0, .99, -.37);
  ball(head, coat, 0, .12, -.035, cat ? .40 : .434, .333, .342);
  ball(head, cream, 0, -.028, -.246, cat ? .234 : .28, .166, .18);
  for (const side of [-1, 1]) {
    if (cat) {
      const tip = group(head, side * .26, .26, -.035);
      tip.rotation.z = -side * .23;
      shape(tip, ear, coat, 0, 0, 0);
      shape(tip, inner, 0xe798a7, 0, .055, -.061);
      for (let i = 0; i < 3; i++) rod(head, 0x876679,
        [side * .22, -.005 + i * .037, -.367], [side * .47, -.05 + i * .081, -.344], .007, geo.pipe);
    } else {
      const flap = group(head, side * .345, .24, .01);
      flap.rotation.z = side * .37;
      ball(flap, 0x9f553c, side * .019, -.13, 0, .157, .269, .124);
      ball(flap, 0xe9a17d, side * .012, -.15, -.102, .081, .167, .03);
    }
    const eye = group(head, side * .164, .148, -.315);
    ball(eye, dark, 0, 0, 0, .061, .077, .036);
    ball(eye, 0xfff8ed, -.019, .029, -.032, .019, .023, .009);
    ball(head, 0xe89c99, side * .249, .03, -.319, .067, .033, .018);
  }
  ball(head, cat ? 0xbd6175 : dark, 0, .024, -.413, .074, .047, .039);
  ball(head, dark, 0, -.061, -.404, .057, .021, .018);
  ball(head, 0xef909f, 0, -.087, -.407, .038, .036, .019);

  const collar = scarfColor ?? (cat ? 0x8c77de : 0xed5870);
  const band = shape(body, new T.TorusGeometry(.28, .045, 7, 26), collar, 0, .824, -.29);
  band.rotation.x = Math.PI / 2;
  const cloth = shape(body, scarf, collar, 0, .68, -.57, .61, .58, 1);
  cloth.rotation.z = Math.PI;
  ball(body, mat(0xffcb7b, .25), 0, .66, -.603, .055, .074, .024);

  return {
    root,
    pose(time, stride = 0, seated = false) {
      const phase = time * (stride > .1 ? 14 : 3);
      rig.position.y = seated ? -.105 + Math.sin(time*1.7) * .012 : stride ? Math.abs(Math.sin(phase)) * .107 * stride : Math.sin(phase) * .018;
      body.rotation.x = seated ? -.13 : Math.sin(phase) * .085 * stride;
      head.rotation.z = Math.sin(phase * .48) * (.043 + .033 * stride);
      head.rotation.y = seated ? Math.sin(time*.83)*.08 : 0;
      tail.rotation.y = Math.sin(time * (stride ? 12 : 5)) * (cat ? .28 : .54);
      legs.forEach((leg, i) => { leg.rotation.x = seated ? (i%2 ? -.96 : -.28) : Math.sin(phase + (i === 0 || i === 3 ? 0 : Math.PI)) * .77 * stride; });
    }
  };
}

export function label(parent, words, x, y, z, width, theme = 'dark') {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 220;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = theme === 'dark' ? '#302439' : '#fff0d2';
  ctx.fillRect(0, 0, 768, 220);
  ctx.strokeStyle = theme === 'dark' ? '#fbbd8a' : '#a35354';
  ctx.lineWidth = 5;
  ctx.strokeRect(18, 18, 732, 184);
  ctx.font = 'bold 62px Georgia';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = theme === 'dark' ? '#ffe4b5' : '#653244';
  ctx.fillText(words, 384, 113, 685);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const material = new T.MeshBasicMaterial({map: texture});
  return shape(parent, new T.PlaneGeometry(width, width * 220 / 768), material, x, y, z);
}

export function glow(parent, color, x, y, z, width, height, opacity = .5) {
  const material = new T.ShaderMaterial({
    uniforms: { tint: {value: new T.Color(color)}, alpha: {value: opacity} },
    vertexShader: 'varying vec2 p; void main(){p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec2 p; uniform vec3 tint; uniform float alpha; void main(){float a=max(0.,1.-length(p));gl_FragColor=vec4(tint,pow(a,2.)*alpha);}',
    transparent: true, depthWrite: false, blending: T.AdditiveBlending
  });
  return shape(parent, new T.PlaneGeometry(1, 1), material, x, y, z, width, height, 1);
}

export function particles(parent, seed, count, area, colors) {
  const rng = random(seed), pos = [], tint = [];
  for (let i = 0; i < count; i++) {
    pos.push((rng() - .5) * area[0], .15 + rng() * area[1], -rng() * area[2] + (area[3] ?? 0));
    new T.Color(colors[i % colors.length]).toArray(tint, i * 3);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('tint', new T.Float32BufferAttribute(tint, 3));
  const mesh = new T.Points(geometry, new T.ShaderMaterial({
    uniforms: {time: {value: 0}},
    vertexShader: 'uniform float time; attribute vec3 tint; varying vec3 c; varying float a; void main(){vec3 p=position; float f=p.x*.8+p.z*1.5; p.x+=sin(time*.73+f)*.55;p.y+=sin(time*.9+f)*.27;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(113./max(1.,-mv.z),2.,14.);gl_Position=projectionMatrix*mv;c=tint;a=(.57+.43*sin(time*2.+f))*clamp((105.+mv.z)/60.,0.,1.);}',
    fragmentShader: 'varying vec3 c;varying float a;void main(){float d=2.*length(gl_PointCoord-.5);gl_FragColor=vec4(c,pow(max(0.,1.-d),1.9)*a);}',
    blending: T.AdditiveBlending, transparent: true, depthWrite: false
  }));
  parent.add(mesh);
  return mesh;
}


