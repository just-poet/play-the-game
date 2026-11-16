import * as T from 'three';
import { M, random, mat, geo, group, shape, box, ball, rod, batch, label, glow, particles } from './art.js';

import { forestLandmarks, lanternCoast } from './scenery.js';

const palettes = {
  forest: {horizon: 0xfac58e, zenith: 0x477d9b, fog: 0xabc3ad, sun: 0xffe6a3, ground: 0x537144, light: 0xffd6a0, sky: 0xe1fcfa, density: .0125},
  beach: {horizon: 0xffa894, zenith: 0x6d56a6, fog: 0xc999b6, sun: 0xffdc8c, ground: 0x876d8d, light: 0xffbf9c, sky: 0xe1cbff, density: .0085},
  cafe: {horizon: 0xffbb97, zenith: 0x6d70a9, fog: 0xeaaac0, sun: 0xffeacb, ground: 0xb87673, light: 0xffd7a5, sky: 0xffeef4, density: .006},
  home: {horizon: 0xffbe97, zenith: 0x4d678f, fog: 0xe9ac9f, sun: 0xffe6b5, ground: 0x9e7377, light: 0xffd4a1, sky: 0xe0eaff, density: .012},
};

export function atmosphere(kind) {
  const colors = palettes[kind];
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(colors.fog, colors.density);
  scene.add(new T.HemisphereLight(colors.sky, colors.ground, 2.02));
  const sun = new T.DirectionalLight(colors.light, 2.05);
  sun.position.set(-30, 38, -37);
  scene.add(sun);
  const bounce = new T.DirectionalLight(0xc0deff, .48);
  bounce.position.set(32, 13, 22);
  scene.add(bounce);
  const sky = shape(scene, new T.SphereGeometry(245, 32, 20), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: {
      horizon: {value: new T.Color(colors.horizon)}, zenith: {value: new T.Color(colors.zenith)}, sun: {value: new T.Color(colors.sun)}, dusk: {value: kind==='beach'?1:0},
      direction: {value: new T.Vector3(kind === 'beach' || kind === 'cafe' ? .66 : -.26, .14, -.99).normalize()},
    },
    vertexShader: 'varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 v; uniform vec3 horizon,zenith,sun,direction; uniform float dusk; float n(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float noise(vec2 p){vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(n(i),n(i+vec2(1,0)),f.x),mix(n(i+vec2(0,1)),n(i+1.),f.x),f.y);} void main(){vec3 d=normalize(v);float h=max(0.,d.y);float s=max(0.,dot(d,direction));vec3 c=mix(horizon,zenith,pow(h,.47));c=mix(c,sun,.54*pow(s,9.));c=mix(c,vec3(.80,.32,.36),dusk*.44*exp(-pow((h-.14)*6.,2.))); vec2 uv=d.xz/(.30+h); float clouds=noise(uv*3.6)+.43*noise(uv*8.8)+.17*noise(uv*19.); c=mix(c,mix(horizon,vec3(1.,.78,.62),.65),smoothstep(.79,1.20,clouds)*smoothstep(.01,.17,h)*.47);float stars=step(.9974,n(floor(uv*285.)))*pow(max(0.,1.-length(fract(uv*285.)-.5)*2.),2.);c+=stars*dusk*smoothstep(.05,.31,h)*.9;c+=sun*(1.5*smoothstep(.99929,.99953,s)+.35*pow(s,82.));gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
  }), 0, 0, 0);
  sky.renderOrder = -50;
  return {scene, sky, updates: []};
}

export function animatedWater(parent, x, y, z, width, length, pond = false, sunset = false) {
  const material = new T.ShaderMaterial({
    fog: true,
    uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, {
      time: {value: 0}, sunset: {value: sunset ? 1 : 0}, coast: {value: pond ? -150 : 5.85}, pond: {value: pond ? 1 : 0},
      deep: {value: new T.Color(pond ? 0x22536b : sunset ? 0x536da4 : 0x218f9f)}, shallow: {value: new T.Color(pond ? 0x64a497 : 0x7ad5bb)}
    }]),
    vertexShader: 'varying vec3 p;\n#include <fog_pars_vertex>\nvoid main(){p=(modelMatrix*vec4(position,1.)).xyz;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader: 'uniform float time,coast,pond,sunset; uniform vec3 deep,shallow; varying vec3 p;\n#include <fog_pars_fragment>\nvoid main(){float edge=p.x-coast; if(pond<.5){edge+=sin(p.z*.073)*1.2+cos(p.z*.037)*1.6; if(edge<0.) discard;} float w=sin(p.x*2.5+p.z*.75+time*1.1)+.6*sin(p.z*2.3-p.x*.83-time*1.4)+.26*sin(p.x*9.0+p.z*4.5+time);vec3 c=mix(shallow,deep,smoothstep(0.,30.,edge));c+=vec3(.10,.17,.16)*smoothstep(.48,1.77,w); float band=(sin(edge*2.04+time*1.7+sin(p.z*.28)*.40)+1.)*.5;float surf=exp(-max(0.,edge)*.26)*smoothstep(.82,1.,band);c=mix(c,vec3(.77,.94,.87),max(.77*surf,exp(-edge*4.)*.9));float glitter=pow(max(0.,sin(p.z*4.7+cos(p.x*3.)+time*1.8)*sin(p.x*2.2-p.z*.6-time)),11.);vec2 view=normalize(p.xz-cameraPosition.xz+vec2(.001));float reflection=pow(max(0.,dot(view,normalize(vec2(.66,-.99)))),28.);c+=vec3(.51,.25,.18)*glitter+sunset*vec3(1.0,.48,.19)*reflection*(.12+.52*smoothstep(.5,1.62,w));gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n#include <fog_fragment>\n}'
  });
  const surface = shape(parent, pond ? geo.disk : new T.PlaneGeometry(1, 1), material, x, y, z, width, length, 1);
  surface.rotation.x = -Math.PI / 2;
  return time => { material.uniforms.time.value = time; };
}

function terrain(parent, length, beach) {
  const p = [], rgb = [], indices = [];
  const swatches = (beach ? [0x828667, 0xf1c69b, 0xdbae89, 0xffe0af] : [0x466748, 0xbd9268, 0x9e775c, 0x7d8252]).map(c => new T.Color(c));
  const nx = beach ? 69 : 34, nz = Math.ceil((length + 115) / 2);
  for (let iz = 0; iz <= nz; iz++) {
    const z = 28 - iz * 2;
    for (let ix = 0; ix <= nx; ix++) {
      const x = ix * (beach ? 2 : 2.4) - (beach ? 55 : 40.8);
      const noise = Math.sin(x * .81 + z * .51) * .39 + Math.sin(z * .18 - x * .44) * .31 + Math.cos(x * 1.8 - z * .87) * .30;
      const verge = M.smoothstep(Math.abs(x) - .38 * Math.sin(z * .29), 3.0, 5.5);
      const coast = 5.85 - Math.sin(z * .073) * 1.2 - Math.cos(z * .037) * 1.6;
      const hill = beach ? M.smoothstep(-x, 7, 37) * (7 + 4 * Math.sin(z * .045) ** 2) :
        verge * (noise * .24 + M.smoothstep(Math.abs(x), 7, 37) * (3.2 + 2.9 * Math.sin(z * .081) ** 2));
      const y = beach ? hill - M.smoothstep(x, coast - 1.6, coast + 4.1) * .75 : hill;
      p.push(x, y - .035, z);
      const color = beach ? swatches[1].clone().lerp(swatches[0], M.smoothstep(-x, 5, 22)).lerp(swatches[2], Math.max(0, noise) * .29)
        : swatches[1].clone().lerp(swatches[0], verge * .88).lerp(swatches[2], .24 + noise * .20).lerp(swatches[3], verge * (.20 + noise * .18));
      rgb.push(color.r, color.g, color.b);
      if (ix < nx && iz < nz) {
        const k = iz * (nx + 1) + ix;
        indices.push(k, k+1, k+nx+1, k+1, k+nx+2, k+nx+1);
      }
    }
  }
  const mesh = new T.BufferGeometry();
  mesh.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  mesh.setAttribute('color', new T.Float32BufferAttribute(rgb, 3));
  mesh.setIndex(indices);
  mesh.computeVertexNormals();
  const surface = new T.MeshStandardMaterial({vertexColors:true,roughness:.98});
  surface.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vGround;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=position;');
    shader.fragmentShader = 'varying vec3 vGround;\n'+shader.fragmentShader.replace('#include <color_fragment>', [
      '#include <color_fragment>',
      'vec2 p=vGround.xz;',
      'vec2 grain = floor(p*115.);',
      'float fleck = fract(sin(dot(grain,vec2(12.9898,78.233)))*43758.5453);',
      'float detail = sin(p.x*8.+p.y*1.4)*sin(p.y*7.7-p.x*2.3);',
      'float shade = sin(p.x*1.39-p.y*.47+1.3*sin(p.y*.76))*cos(p.y*.68+p.x*.29);',
      'diffuseColor.rgb *= 1. + .075*(fleck-.5) + .026*detail + DAPPLE*shade;'
    ].join('\n').replace('DAPPLE',beach?'.038':'.123'));
  };
  surface.customProgramCacheKey = () => beach ? 'sand-tone' : 'forest-dapple';
  parent.add(new T.Mesh(mesh,surface));
}

export function gardenFlowers(parent, rng, count, at, lush = false) {
  const leaf = [], petals = [], centers = [], stems = [];
  const colors = lush ? [0xe67ba4, 0xffb68b, 0xffe2a6, 0xf0c0f5, 0xb99af2, 0xf77379, 0xfff6db] :
    [0xefa88f, 0xf291bd, 0xffd199, 0xe7bae8, 0xb898e6, 0xfbf2c7];
  for (let i = 0; i < count; i++) {
    const [x, y, z] = at(i);
    const a = rng() * 6.28, h = .18 + rng() * .56, w = .028 + h * .086;
    stems.push([x, y + h / 2, z, .022, h, .022, 0x486b4d]);
    for (const side of [-1, 1]) {
      leaf.push([x + side * .08, y + h * .46, z, .115, .027, .051, i % 2 ? 0x61965c : 0x92aa68, 0, a, side * .55]);
    }
    for (let j = 0; j < 5; j++) {
      const t = a + j * Math.PI * .4;
      petals.push([x + Math.cos(t) * w, y + h, z + Math.sin(t) * w, w, w * .47, w * .65, colors[i % colors.length], 0, -t, .18]);
    }
    centers.push([x, y + h + .009, z, w * .47, w * .40, w * .47, 0xffc467]);
  }
  batch(parent, geo.post, stems);
  batch(parent, geo.leaf, leaf);
  batch(parent, geo.leaf, petals);
  batch(parent, geo.gem, centers);
}

export function tree(parent, x, y, z, height, bloom = false) {
  const t = group(parent, x, y, z);
  const bark = 0x694739;
  rod(t, bark, [0,0,0], [.28,height*.81,-.21], height*.054);
  const colors = bloom ? [0xf391a9, 0xf5b0ba, 0xbf6c91, 0xe8a6a9] : [0x497256, 0x72965b, 0x9dae70, 0x547e58];
  const rng = random(Math.abs(Math.floor(x * 1231 + z * 4007)) + 3);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.398, r = (.12 + rng() * .24) * height, h = height * (.69 + rng() * .30);
    const tx = Math.cos(a) * r, tz = Math.sin(a) * r;
    rod(t, bark, [.09, height*(.35+i*.034), 0], [tx,h,tz], height*.020);
    shape(t, geo.leaf, colors[i % 4], tx, h + .22, tz, height * .23, height * .145, height * .20).rotation.y = a;
    shape(t, geo.leaf, colors[(i + 1) % 4], tx + .26, h + .5, tz - .7, height * .15, height * .12, height * .17);
  }
  return t;
}

function forestScenery(world, length) {
  const {scene} = world;
  const rng = random(3371), trunks = [], crowns = [], brush = [], gravel = [], moss = [];
  for (let z = 15; z > -length - 29; z -= 2.4) {
    for (const side of [-1, 1]) {
      for (let row = 0; row < 3; row++) {
        const x = side * (5.7 + row * 9.2 + rng() * (row ? 11 : 5.9));
        const dz = z + rng() * 5;
        const clearing=Math.abs(((dz-7)%97+97)%97-69)<17;
        if(clearing && row===0 && rng()>.21) continue;
        const h = clearing ? 4.1+rng()*5.8 : 6.5+rng()*11.7;
        const y = M.smoothstep(Math.abs(x), 7, 37) * (3.2 + 2.9 * Math.sin(dz * .081) ** 2) - .28;
        trunks.push([x, y + h * .43, dz, h * .039, h * .87, h * .043, rng() > .36 ? 0x6b5146 : 0x564655, .035, rng()*6.3, (rng()-.5)*.15]);
        for (let j = 0; j < 5; j++) {
          const a = j * 2.4, r = 1 + rng() * 2.8, size = h * (.20 + rng() * .24);
          crowns.push([x + Math.cos(a) * r, y + h * (.72 + rng() * .27), dz + Math.sin(a) * r, size, size * .47, size * .79, [0x2f6557,0x4a7d55,0x558452,0x75985a,0x9ca960,0x466f54][Math.floor(rng()*6)],0,a,.19]);
        }
      }
      for (let row = 0; row < 3; row++) {
        const x = side * (3.57 + rng() * 7.4), sx = .28 + rng() * 1.29;
        brush.push([x, sx * .25, z + rng() * 5, sx, .37 * sx, sx * .84, [0x617a51,0x476e50,0x667c4d,0x939668][Math.floor(rng()*4)],0,rng()*6.3,.1]);
      }
      gravel.push([side*(3.3+rng()*3), .075, z, .25+rng()*.49, .17+rng()*.23, .31+rng()*.69, [0xa4867c,0x867673,0xb89b87][Math.floor(rng()*3)], .11, rng()*6.28, .22]);
      moss.push([side*(3.6+rng()*2.8), .12, z+rng()*2.4, .38+rng()*.88, .20, .4+rng()*.78, 0x76934f, 0,rng()*6.3,0]);
    }
  }
  batch(scene, geo.post, trunks);
  batch(scene, geo.leaf, crowns);
  batch(scene, geo.leaf, brush);
  batch(scene, geo.gem, gravel);
  batch(scene, geo.leaf, moss);
  const groundBits = [];
  for (let i=0;i<3000;i++) {
    const z=17-rng()*(length+33),x=(rng()-.5)*(i%6?6.6:10.2);
    const w=.014+rng()*.039;
    groundBits.push([x,-.019,z,w,.013,w*.81,[0xc2a174,0xd5af7f,0xb19470,0xdab791,0x998462][i%5],0,rng()*6.3,0]);
  }
  batch(scene, geo.gem, groundBits);
  const caps = [], spots = [], stalks = [];
  for (let i=0;i< length/4;i++) {
    const x=(i%2?-1:1)*(3.46+rng()*.87), z=7-i*4.1+rng()*3;
    for (let j=0;j<4;j++) {
      const mx=x+(rng()-.5)*.45,mz=z+(rng()-.5)*.51, h=.087+rng()*.18, r=h*.69;
      stalks.push([mx,h*.51,mz,h*.134,h,h*.134,0xffd5a0]);
      caps.push([mx,h,mz,r,h*.38,r,[0xd08382,0xd89275,0xe9ab83,0xb786a0][i%4],0,0,.11]);
      for(let k=0;k<4;k++){
        const a=k*2.398;
        spots.push([mx+r*.55*Math.cos(a),h*1.29,mz+r*.55*Math.sin(a),r*.127,h*.08,r*.13,0xffddaf]);
      }
    }
  }
  batch(scene,geo.post,stalks);
  batch(scene,geo.leaf,caps);
  batch(scene,geo.leaf,spots);
  const grass = [];
  for (let i = 0; i < 1650; i++) {
    const z = 13 - rng() * (length + 22), x = (i % 2 ? -1 : 1) * (3.65 + rng() * 4.3), h = .14 + rng() * .45;
    for (let j = -1; j <= 1; j++) grass.push([x+j*.08,h*.48,z,.05,h,.035,[0x789a56,0x527c49,0xa5a970,0x62804c][i%4],.25,rng()*6.3,j*-.44]);
  }
  batch(scene, geo.cone, grass);
  gardenFlowers(scene, rng, 1060, i => [(i % 2 ? -1 : 1) * (3.44 + rng() * 2.15), 0, 11 - rng() * (length + 15)]);
  for (let i = 0; i < 11; i++) {
    const x = i % 2 ? -6.3 : 6.8;
    const z = -8 - i * 38;
    tree(scene, x, 0, z, 7 + rng() * 3, true);
    const beam = glow(scene, 0xffd593, 0, 5.3, z - 9, 2.2, 14, .16);
    beam.rotation.z = -.34;
  }
  tree(scene, -3.8, 0, -length - 4, 8, true);
  tree(scene, 4.5, 0, -length - 5.6, 10, true);
  for (const side of [-1,1]) {
    const x = side * 2.95;
    rod(scene, 0x654b42, [x,0,-length-3], [x,3.5,-length-3], .12);
    ball(scene, mat(0xffc475, .9), x, 3.4, -length-3, .17, .24, .15);
  }
  label(scene, 'HOPE’S GLADE', 0, 3.9, -length - 3, 3.85);
  tree(scene, -5.1, 0, -length-12, 7.4, true);
  tree(scene, 5.2, 0, -length-15.5, 8.7, true);
  gardenFlowers(scene,rng,243,i=>[(i%2?-1:1)*(2.83+rng()*4.2),0,-length+5-rng()*18],true);
  glow(scene,0xffa578,0,3.8,-length-21,13,9.4,.19);
  forestLandmarks(world,length);
  const flecks = particles(scene, 82, 1970, [25, 9.5, length + 48, 23], [0xffdb7e,0xff9ed1,0xbfffbc,0xfff0b4]);
  world.updates.push(time => { flecks.material.uniforms.time.value = time; });
}

export function palm(parent, x, y, z, h, lean = 1) {
  const topX = x + lean * h * .22;
  let start = [x, y, z];
  for (let j = 1; j <= 7; j++) {
    const t = j / 7;
    const end = [x + (topX-x) * t * t, y + h*t, z + t * .32];
    rod(parent, j % 2 ? 0x917058 : 0xa78665, start, end, .16 - t * .058);
    start = end;
  }
  const verts = [], idx = [], colors = [];
  for (let j = 0; j < 10; j++) {
    const a = j * 2.399, len = h * (.39 + (j%3)*.055);
    const tint = new T.Color([0x60844e,0x7c9c56,0xa2a75c,0x47774e][j%4]);
    for (let k = 0; k <= 12; k++) {
      const t = k / 12, r = len*t, height = Math.sin(t * Math.PI) * len * .31 - len * .34 * t*t;
      const half = Math.sin(t * Math.PI) ** .68 * len * (k%2 ? .142 : .19);
      for (const f of [-1,0,1]) {
        verts.push(topX + Math.cos(a)*r + Math.sin(a)*half*f, y+h+height-Math.abs(f)*half*.28, z+.32 + Math.sin(a)*r - Math.cos(a)*half*f);
        colors.push(tint.r, tint.g, tint.b);
      }
      if (k < 12) {
        const i = j*39+k*3;
        idx.push(i,i+3,i+1,i+1,i+3,i+4,i+1,i+4,i+2,i+2,i+4,i+5);
      }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  parent.add(new T.Mesh(g, new T.MeshStandardMaterial({vertexColors: true, side: T.DoubleSide, roughness: .8})));
  for (let i = 0; i < 3; i++) ball(parent, 0x80654d, topX + (i-1)*.15, y+h-.13, z+.37, .16,.20,.16);
}

function beachScenery(world, length) {
  const {scene} = world;
  const rng = random(8373), hills = [], rocks = [], shells = [];
  world.updates.push(animatedWater(scene, 85, -.19, -length / 2, 164, length + 270, false, true));
  for (let z = 5; z > -length - 40; z -= 9.9) {
    const x = -5.45 - rng() * 8.4;
    palm(scene, x, M.smoothstep(-x, 7, 37)*(7+4*Math.sin(z*.045)**2), z, 4.0 + rng() * 4.7, .53 + rng());
    if (rng() > .14) rocks.push([-9-rng()*14, rng()*2, z-3, 2+rng()*4.4, 2+rng()*6, 2+rng()*6, [0x8e777b,0xb18983,0x897482][Math.floor(rng()*3)], .2,rng()*6.28,.34]);
    if (rng() > .66) hills.push([52+rng()*34,-1,z-28,6+rng()*13,3+rng()*6,7+rng()*14,[0xb28ea1,0x8f7e9a,0xca9b9e][Math.floor(rng()*3)],.25,rng()*6.28,.12]);
  }
  batch(scene, geo.gem, rocks);
  batch(scene, geo.leaf, hills);
  for (let i = 0; i < 770; i++) {
    const x = (i%3 ? 1 : -1) * (3.2 + rng() * 1.3);
    const z = 11 - rng() * (length + 15);
    shells.push([x,.025,z,.035+rng()*.16,.04,.15,[0xfff3c3,0xec957e,0xffe5c3,0xda9ca7][i%4],.2,rng()*6.28,.12]);
  }
  batch(scene, geo.leaf, shells);
  gardenFlowers(scene, rng, 480, () => [-3.7-rng()*3.0, 0, 9-rng()*(length+25)]);
  for (let i = 0; i < 7; i++) {
    const z = -45 - i * 72, x = 12 + i % 3 * 7;
    const arch = group(scene, x, -.25, z);
    arch.rotation.y = i * .4;
    for (let j = 0; j <= 14; j++) {
      const a = Math.PI * j / 14;
      shape(arch, geo.gem, [0xc09197,0xb18795,0xa58b9b][j%3], Math.cos(a)*5.2, Math.sin(a)*5.4,0,1.6,1.63,2.28).rotation.z=a;
    }
  }
  for (const x of [-2.9,2.9]) {
    rod(scene, 0x976c5c, [x,0,-length-3], [x,3.8,-length-3], .13);
    ball(scene, mat(0xffc680, .75), x, 3.77, -length-3, .17,.23,.15);
  }
  label(scene, 'THE CLIFFSIDE CAFÉ', 0, 3.95, -length - 3, 4.05, 'light');
  const flock=[];
  for(let i=0;i<21;i++) {
    const flyer=group(scene,11+(i%3)*3.6,6+i%4*.69,-31-i*24);
    const wings=[];
    for(const side of [-1,1]) {
      const pivot=group(flyer);
      shape(pivot,geo.leaf,0xfbe0ce,side*.22,0,.024,.29,.038,.083).rotation.y=side*.33;
      wings.push(pivot);
    }
    flock.push({flyer,wings,start:flyer.position.clone(),offset:i*.79});
  }
  world.updates.push(time=>{
    for(const {flyer,wings,start,offset} of flock) {
      flyer.position.copy(start);
      flyer.position.x+=Math.sin(time*.25+offset)*3.4;
      flyer.position.z+=Math.cos(time*.17+offset)*2.6;
      wings[0].rotation.z=Math.sin(time*6+offset)*.56;
      wings[1].rotation.z=-wings[0].rotation.z;
    }
  });
  lanternCoast(world,length);
  const flecks = particles(scene, 178, 870, [26, 5, length + 45, 19], [0xffe0a3,0xfcbcd5,0xffedd1]);
  world.updates.push(time => { flecks.material.uniforms.time.value = time; });
}

function hurdle(parent, x, z, type, rng) {
  const h = group(parent, x, 0, z);
  if (type === 'log') {
    rod(h, 0x765043, [-.72,.27,0], [.72,.27,.04], .27, geo.pipe);
    for (const side of [-1,1]) {
      rod(h, 0xd6956b, [side*.728,.27,.04], [side*.741,.27,.04], .228, geo.pipe);
      rod(h, 0x985f4b, [side*.742,.27,.04], [side*.750,.27,.04], .115, geo.pipe);
    }
    for (let i = 0; i < 5; i++) shape(h, geo.leaf, 0x7da258, (rng()-.5)*1.2,.48+rng()*.05,(rng()-.5)*.3,.20,.063,.11);
    return .48;
  }
  if (type === 'stile') {
    for(const side of [-1,1]) box(h,0x885749,side*.67,.28,0,.14,.56,.20);
    rod(h,0xb98761,[-.69,.38,-.03],[.69,.38,.08],.10,geo.pipe);
    for(const side of [-1,1]) shape(h,geo.leaf,0x77965a,side*.49,.45,.08,.23,.085,.12);
    return .48;
  }
  if (type === 'drift') {
    rod(h, 0xa97d68, [-.80,.25,.26], [.73,.43,-.18], .24, geo.pipe);
    rod(h, 0xc4987d, [-.20,.35,.07], [-.62,.68,-.25], .088);
    rod(h, 0xc4987d, [.27,.42,-.12], [.57,.59,.10], .075);
    return .58;
  }
  const sand = type === 'castle';
  for (let i = -1; i <= 1; i++) {
    shape(h, sand ? geo.post : geo.gem, sand ? 0xcb925f : 0x907783, i * .42, .27 + (i === 0 ? .09 : 0), i*.12, sand ? .24 : .40, .43 + (i===0 ? .19 : 0), sand ? .24 : .32).rotation.y = rng()*2.5;
  }
  if (sand) {
    rod(h, 0xbc696d, [0,.59,0], [0,.88,0], .023);
    shape(h, geo.gem, 0xed788e, .10,.83,0,.13,.075,.025);
  } else {
    shape(h, geo.gem, mat(0xeea7c3,.24), .09,.64,-.02,.16,.24,.12).rotation.z=-.21;
  }
  return sand ? .62 : .68;
}

export const laneWidth = 2.26;
export function runningSpeed(kind, distance) {
  return kind==='forest' ? M.lerp(8.8,14.2,M.smoothstep(distance,65,350)) : 13.5;
}
export function runningWorld(kind) {
  const length = kind === 'forest' ? 400 : 500, beach = kind === 'beach';
  const world = atmosphere(kind);
  terrain(world.scene, length, beach);
  if (beach) beachScenery(world, length);
  else forestScenery(world, length);
  const rng = random(beach ? 712 : 864), obstacles = [];
  const patterns = [[1],[0],[2],[0,1],[1,2],[0,2],[1],[0,2],[0],[1,2],[2],[0,1]];
  for (let i = 0, s = 16; s < length - 15; i++, s += beach ? 11.6 + rng()*7.2 : 11.0 + rng()*4.2) {
    const lanes = patterns[(i + (beach ? 3 : 0)) % patterns.length];
    const types = beach ? ['drift','castle'] : ['log','stone','stile'];
    for (const lane of lanes) {
      const x = (lane - 1) * laneWidth;
      const height = hurdle(world.scene, x, -s, types[(i + lane) % types.length], rng);
      obstacles.push({s,x,height});
    }
  }
  return {...world, obstacles, length};
}

