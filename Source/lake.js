import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { random, geo, group, mat, shape, box, ball, rod, batch, glow } from './art.js';

const tau = Math.PI * 2;
const gold = 0xd48951;
const litWindow = mat(0xffba70, 1.7);
const chestnut = 0x58313f;

function twilight(scene) {
  const material = new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    vertexShader: 'varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `
      varying vec3 direction;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){
        vec2 g=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(g),hash(g+vec2(1.,0.)),f.x),mix(hash(g+vec2(0.,1.)),hash(g+1.),f.x),f.y);
      }
      void main(){
        vec3 p=normalize(direction);
        float y=max(0.,p.y);
        vec3 color=mix(vec3(.43,.138,.265),vec3(.043,.035,.132),pow(y,.46));
        vec2 uv=p.xz/(.27+y);
        float drift=noise(uv*4.2)+.42*noise(uv*9.6)+.22*noise(uv*24.6);
        float cloud=smoothstep(.57,.98,drift)*exp(-pow((y-.17)*3.8,2.));
        color=mix(color,vec3(.292,.104,.270),cloud*.62);
        float horizon=exp(-abs(p.y+.02)*9.)*pow(max(0.,dot(p,normalize(vec3(.19,.01,-1.)))),4.);
        color+=vec3(.48,.164,.105)*horizon*.63;
        vec2 skyUV=p.xz/(.21+abs(p.y))*207.;
        float point=pow(max(0.,1.-length(fract(skyUV)-.5)*1.9),4.);
        color+=vec3(.76,.61,.69)*step(.990,hash(floor(skyUV)))*point*smoothstep(.10,.29,y);
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const dome = shape(scene, new T.SphereGeometry(140, 38, 24), material, 0, 0, 0);
  dome.renderOrder = -50;
  return dome;
}

function lakeSurface(scene) {
  const water = new Reflector(new T.PlaneGeometry(285, 285), {
    color: 0x49396b,
    textureWidth: 768,
    textureHeight: 512,
    multisample: 0,
    clipBias: .0016,
    shader: {
      name: 'LakeWater',
      uniforms: {
        textureMatrix: {value: null},
        tDiffuse: {value: null},
        color: {value: null},
        time: {value: 0}
      },
      vertexShader: /* glsl */ `
        uniform mat4 textureMatrix;
        varying vec4 reflection;
        varying vec3 world;
        void main(){
          reflection=textureMatrix*vec4(position,1.);
          world=(modelMatrix*vec4(position,1.)).xyz;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform vec3 color;
        uniform float time;
        varying vec4 reflection;
        varying vec3 world;
        void main(){
          vec2 p=reflection.xy/reflection.w;
          float a=sin(world.z*4.7+world.x*.74-time*2.2);
          float b=sin(world.z*7.4-world.x*1.2+time*1.68);
          float c=sin(world.x*2.11+world.z*2.7-time*1.65);
          float d=distance(cameraPosition.xz,world.xz);
          float amount=mix(.008,.028,smoothstep(8.,55.,d));
          vec2 curl=vec2(a+b*.42,c*.38)*amount;
          vec3 mirror=texture2D(tDiffuse,clamp(p+curl,vec2(.002),vec2(.998))).rgb;
          vec3 soft=texture2D(tDiffuse,clamp(p+curl*.52,vec2(.002),vec2(.998))).rgb;
          float shimmer=pow(max(0.,a*b*c),3.);
          float fresnel=1.-clamp(dot(normalize(cameraPosition-world),vec3(0.,1.,0.)),0.,1.);
          vec3 deep=color*vec3(.25,.31,.44)+vec3(.022,.019,.041);
          vec3 water=mix(deep,(mirror*.72+soft*.28)*vec3(.85,.69,.81),.53+fresnel*.33);
          water+=shimmer*vec3(.112,.049,.037)*pow(fresnel,2.);
          gl_FragColor=vec4(water,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    }
  });
  water.rotation.x = -Math.PI / 2;
  water.position.z = -52;
  scene.add(water);
  return water;
}

function spire(parent, x, y, z, r, h, tint) {
  const profile = [[0,0],[1.14,0],[1.04,.08],[.79,.20],[.56,.38],[.35,.60],[.16,.84],[.019,1]]
    .map(([u,v]) => new T.Vector2(u*r,v*h));
  shape(parent,new T.LatheGeometry(profile,20),tint,x,y,z);
  shape(parent,geo.pipe,0x76465f,x,y+.08,z,r*1.12,.15,r*1.12);
  ball(parent,gold,x,y+h,z,.093,.112,.093);
  rod(parent,0xb87756,[x,y+h-.07,z],[x,y+h+.63,z],.025,geo.pipe);
  const pennant = new T.Shape();
  pennant.moveTo(0,0);
  pennant.quadraticCurveTo(.4,.18,.78,.04);
  pennant.quadraticCurveTo(.42,-.17,0,-.24);
  pennant.closePath();
  const silk = mat(0xaa5d74).clone();
  silk.side = T.DoubleSide;
  shape(parent,new T.ShapeGeometry(pennant),silk,x,y+h+.59,z);
}

function archGeometry(w,h) {
  const s = new T.Shape();
  s.moveTo(-w/2,0);
  s.lineTo(w/2,0);
  s.lineTo(w/2,h-w*.47);
  s.quadraticCurveTo(w*.41,h-w*.13,0,h);
  s.quadraticCurveTo(-w*.41,h-w*.13,-w/2,h-w*.47);
  s.closePath();
  return new T.ShapeGeometry(s,10);
}

const frameArched = archGeometry(.53,1.18);
const paneArched = archGeometry(.33,.93);

function windowArch(parent,x,y,z,angle=0) {
  const frame = group(parent,x,y,z);
  frame.rotation.y = angle;
  shape(frame,frameArched,0x674453,0,-.10,0);
  shape(frame,paneArched,litWindow,0,0,.012);
  box(frame,0x765052,0,.44,.035,.037,.85,.041);
  box(frame,0xa76f63,0,.42,.035,.34,.046,.042);
  box(frame,0xac725c,0,-.055,.054,.61,.09,.18);
}

function tower(parent,x,y,z,r,h,cap,tint) {
  shape(parent,new T.CylinderGeometry(r*.94,r,h,20),tint,x,y+h/2,z);
  for(const [level,rim,thick] of [[.08,1.06,.25],[.29,1.01,.15],[.78,1.01,.16],[.95,1.14,.33],[.99,1.13,.22]]) {
    shape(parent,geo.pipe,0x956271,x,y+h*level,z,r*rim,thick,r*rim);
  }
  for(const a of [-.84,0,.84]) {
    windowArch(parent,x+Math.sin(a)*r*.95,y+h*.47,z+Math.cos(a)*r*.95,a);
    if(h>6.2) windowArch(parent,x+Math.sin(a)*r*.95,y+h*.22,z+Math.cos(a)*r*.95,a);
  }
  spire(parent,x,y+h,z,r*1.02,cap,0x56385e);
}

function mergeCastleStonework(island) {
  island.updateMatrixWorld(true);
  const groups=new Map(), remove=[];
  const toIsland=island.matrixWorld.clone().invert();
  island.traverse(mesh=>{
    if(!mesh.isMesh||mesh.isInstancedMesh||!mesh.material.isMeshStandardMaterial) return;
    if(!groups.has(mesh.material)) groups.set(mesh.material,[]);
    const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
    geometry.applyMatrix4(toIsland.clone().multiply(mesh.matrixWorld));
    geometry.deleteAttribute('uv');
    groups.get(mesh.material).push(geometry);
    remove.push(mesh);
  });
  for(const mesh of remove) mesh.removeFromParent();
  for(const [material,pieces] of groups){
    const stonework=mergeGeometries(pieces);
    island.add(new T.Mesh(stonework,material));
    for(const geometry of pieces) geometry.dispose();
  }
}

function castle(scene) {
  const island = group(scene,4.4,0,-34);
  const rng = random(228);
  const rock = [];
  for(let i=0;i<49;i++) {
    const a = i*tau/49;
    const size=1.1+rng()*2.9;
    rock.push([Math.cos(a)*(9.5+rng()*2.7),.26+rng()*1.08,Math.sin(a)*(4.3+rng()*2.7),size*1.5,size*.62,size*.83,[0x453951,0x4a3b55,0x5d4664,0x58425b][i%4],.17,a,.28]);
  }
  batch(island,geo.gem,rock);
  ball(island,0x443550,0,.96,-.31,12.5,1.8,6.41);
  ball(island,0x5e4159,0,1.72,-.4,9.53,1.25,4.82);
  const terraces = [
    [-.1,2.76,1.2,14.25,1.33,5.72],
    [0,4.07,.6,11.26,2.39,5.18],
    [0,6.61,-1.66,7.57,3.43,4.32],
    [.54,9.04,-3.31,4.9,3.87,3.94]
  ];
  for(const [x,y,z,w,h,d] of terraces){
    box(island,0x9b6074,x,y,z,w,h,d);
    box(island,0xbe827f,x,y+h/2-.01,z,w+.29,.21,d+.31);
    const facade=z+d/2+.017;
    for(let i=-Math.floor(w/2.3);i<=Math.floor(w/2.3);i++){
      if(i===0&&h<1.5) continue;
      const window=group(island,x+i*1.0,y-.16,facade);
      if(h<2) window.scale.setScalar(.55);
      windowArch(window,0,0,0);
    }
  }
  const towers = [
    [-6.65,2.4,2.5,1.06,4.3,2.54], [6.65,2.42,2.48,1.10,4.72,2.65],
    [-4.77,2.85,-.42,1.28,6.75,3.82], [4.78,2.78,-.60,1.18,7.17,3.37],
    [-3.17,5.12,-3.36,.89,7.30,3.29], [3.33,5.06,-3.74,.97,7.69,3.90],
    [-1.08,8.46,-4.16,.94,6.40,4.07], [1.24,8.19,-5.28,.81,6.35,3.34],
    [-2.47,3.60,2.59,.68,4.61,2.81], [2.5,3.60,2.52,.66,4.81,2.71]
  ];
  towers.forEach((entry,i)=>tower(island,...entry,i%2?0xb98185:0xa06d86));
  const gate = shape(island,archGeometry(1.68,2.55),0x4e354d,0,2.10,4.16);
  gate.rotation.y=.005;
  shape(island,archGeometry(1.16,2.05),mat(0xff9e61,1.38),0,2.24,4.182);
  for(const x of [-.34,0,.34]) box(island,0x78505a,x,3.12,4.22,.061,1.72,.052);
  for(let i=0;i<17;i++) {
    const x=(i-8)*.74;
    box(island,0xa87281,x,3.39,4.04,.27,.41,.43);
  }
  for(let i=0;i<13;i++){
    const x=(i-6)*1.68;
    const h=.68+rng()*2.08;
    shape(island,geo.cone,0x433951,x,1.74+h*.37,3.8-(i%3)*2.7,.44,h,.44).rotation.y=rng()*tau;
  }
  for(const x of [-6.3,-2.38,2.37,5.95]) glow(island,0xff9a64,x,3.01,4.21,2.75,1.86,.34);
  for(const x of [-2.4,2.4]) glow(island,0xeb854e,x,6.04,3.43,3.1,3.01,.22);
  mergeCastleStonework(island);
}

function distantShore(scene) {
  const rng=random(284), hills=[], firs=[];
  for(let i=0;i<68;i++) {
    const side=i%2?1:-1;
    const x=side*(14+rng()*77),z=-48-rng()*66;
    const r=4+rng()*14,height=r*.43+rng()*6;
    hills.push([x,-2.1,z,r,height,8+rng()*12,[0x534565,0x604b70,0x594760,0x433c5e][i%4],.26,rng()*tau,.29]);
    if(i%3!==0) continue;
    for(let j=0;j<10;j++){
      const u=rng()*r*.7;
      const h=1.2+rng()*3.2;
      firs.push([x+(rng()-.5)*r*1.16,-2.6+height*Math.sqrt(1-(u/r)**2)+h*.38,z+u*.36,.28+rng()*.7,h,.48,0x463951,0,rng()*tau,.055]);
    }
  }
  batch(scene,geo.leaf,hills);
  batch(scene,geo.cone,firs);
}

function curvedHull(parent) {
  const end = 3.22, span=14, across=24, points=[], colors=[], index=[];
  const dark = new T.Color(0x342639), red = new T.Color(0x995346);
  for(let i=0;i<=span;i++){
    const x = -end+i*end*2/span;
    const t = x/end, breadth = .084+.86*Math.pow(Math.max(0, 1-t*t),.84);
    const height = .40 + .83*Math.abs(t)**3.3;
    for(let j=0;j<=across;j++){
      const a=j*Math.PI/across;
      const low = -.185 + .94*Math.abs(t)**2.95;
      points.push(x,height-Math.sin(a)*(height-low),Math.cos(a)*breadth);
      const c=dark.clone().lerp(red,(.12+.55*Math.abs(Math.cos(a)))*(.64+.21*Math.sin(i*.71+j*.93)));
      colors.push(c.r,c.g,c.b);
      if(i===span||j===across) continue;
      const k=i*(across+1)+j;
      index.push(k,k+across+1,k+1,k+1,k+across+1,k+across+2);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  parent.add(new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.58})));
  for(const side of [-1,1]){
    const rim=[];
    for(let i=0;i<=24;i++){
      const x=-end+i*end*2/24,t=x/end;
      rim.push(new T.Vector3(x,.425+.83*Math.abs(t)**3.3,side*(.09+.861*Math.pow(Math.max(0,1-t*t),.84))));
    }
    shape(parent,new T.TubeGeometry(new T.CatmullRomCurve3(rim),52,.059,8,false),0x855044,0,0,0);
    const inlay = rim.map(p=>new T.Vector3(p.x,p.y+.015,p.z*1.008));
    shape(parent,new T.TubeGeometry(new T.CatmullRomCurve3(inlay),52,.017,7,false),gold,0,0,0);
    const tip=[];
    for(let i=0;i<=26;i++){
      const a=i*.214;
      tip.push(new T.Vector3(side*(3.10+.22*Math.sin(a)+.32*i/26),1.15+.20*i/26+.14*(1-Math.cos(a)),0));
    }
    shape(parent,new T.TubeGeometry(new T.CatmullRomCurve3(tip),35,.063,9,false),chestnut,0,0,0);
    ball(parent,gold,...tip[tip.length-1],.065,.085,.063);
  }
  const planks=[];
  for(let i=-5;i<=5;i++){
    const x=i*.42;
    const t=(Math.abs(x)+.205)/end;
    const breadth=.084+.86*(1-t*t)**.84;
    const rim=.40+.83*t**3.3, keel=-.185+.94*t**2.95;
    const section=T.MathUtils.clamp((rim-.168)/(rim-keel),0,1);
    const width=2*breadth*Math.sqrt(1-section*section)-.045;
    planks.push([x,.205,0,.408,.077,Math.max(.09,width),[0x83464a,0x8d4d4c,0x92584f][Math.abs(i)%3]]);
  }
  batch(parent,geo.box,planks);
  for(const x of [-1.22,1.26]){
    box(parent,0x724846,x,.348,0,.72,.15,1.52);
    ball(parent,x<0?0x654768:0x814458,x,.445,0,.386,.115,.605);
  }
  rod(parent,0x9f625b,[-2.56,.293,.72],[.16,.43,.78],.054,geo.pipe);
  const blade=ball(parent,0xb98266,-2.50,.291,.71,.340,.038,.107);
  blade.rotation.y=-.024;
}


function lanternGeometry() {
  const levels=[[-.52,.35],[-.43,.46],[-.28,.52],[.23,.48],[.47,.35],[.50,.18]];
  const outline=[[-.78,-1],[.78,-1],[1,-.78],[1,.78],[.78,1],[-.78,1],[-1,.78],[-1,-.78]];
  const p=[],idx=[];
  levels.forEach(([y,rad],i)=>{
    outline.forEach(([x,z],j)=>{
      p.push(x*rad,y,z*rad);
      if(i===levels.length-1) return;
      const a=i*outline.length+j,b=i*outline.length+(j+1)%outline.length,c=a+outline.length,d=b+outline.length;
      idx.push(a,c,b,b,c,d);
    });
  });
  for(let i=1;i<outline.length-1;i++){
    idx.push(0,i+1,i);
    const top=(levels.length-1)*outline.length;
    idx.push(top,top+i,top+i+1);
  }
  const geom=new T.BufferGeometry();
  geom.setAttribute('position',new T.Float32BufferAttribute(p,3));
  geom.setIndex(idx);
  geom.computeVertexNormals();
  return geom;
}

function paperLanterns(scene) {
  const rng=random(983761), anchors=[];
  for(let i=0;i<430;i++) {
    const z=-5-rng()*83, x=(rng()-.48)*(31+(-z)*.61);
    const y=1.04+rng()*(8.8+Math.abs(z)*.21);
    const w=.11+(.56*rng()**1.9);
    anchors.push({x,y,z,w,p:rng()*tau});
  }
  for(let i=0;i<28;i++){
    const x=-19+i*1.52, z=-6.3-rng()*13.1;
    const y=2.8+rng()*9.7;
    anchors.push({x,y,z,w:.35+rng()*.48,p:rng()*tau});
  }
  for(const [x,y,z,w] of [[-5.5,4.3,2.8,.62],[7.0,4.73,.4,.58],[-3.4,6.26,-1.2,.55],[9.4,3.7,-3.8,.62],
    [5.7,2.82,-4.8,.44],[-.57,4.89,-7.6,.47],[-7.2,1.9,-6.1,.47],[10.7,6.6,-9.8,.59]]){
    anchors.push({x,y,z,w,p:rng()*tau});
  }
  const paper = new T.ShaderMaterial({
    side:T.DoubleSide,
    uniforms: {time:{value:0}},
    vertexShader: /* glsl */ `
      varying vec3 paperPosition;
      varying float flickerPhase;
      void main(){
        paperPosition=position;
        flickerPhase=instanceMatrix[3].x*.76+instanceMatrix[3].z*.34;
        gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float time;
      varying vec3 paperPosition;
      varying float flickerPhase;
      void main(){
        float p=paperPosition.y+.5;
        float flame=1.-smoothstep(.13,.71,p);
        float ribs=pow(.5+.5*sin(57.*(paperPosition.x+paperPosition.z*.32)),2.)*.09;
        float flicker=.96+.11*sin(flickerPhase+time*2.14)+.045*sin(time*4.6-flickerPhase);
        float aura=exp(-4.0*length(vec2(paperPosition.x*.61,p-.21)));
        vec3 sunset=mix(vec3(1.51,.25,.13),vec3(3.32,1.99,.67),flame);
        sunset=(sunset*(.84+ribs)+aura*vec3(1.3,.68,.21))*flicker;
        gl_FragColor=vec4(sunset,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const aura = new T.ShaderMaterial({
    vertexShader: /* glsl */ `
      varying vec2 point;
      void main(){
        point=uv*2.-1.;
        vec4 center=modelViewMatrix*instanceMatrix*vec4(0.,0.,0.,1.);
        center.xy+=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));
        gl_Position=projectionMatrix*center;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 point;
      void main(){
        float dist=length(point);
        float halo=pow(max(0.,1.-dist),3.9);
        vec3 tint=mix(vec3(1.,.27,.10),vec3(1.,.67,.25),max(0.,1.-dist));
        gl_FragColor=vec4(tint,halo*.62);
      }
    `,
    transparent:true, depthWrite:false, blending:T.AdditiveBlending
  });
  const shells=new T.InstancedMesh(lanternGeometry(),paper,anchors.length);
  const halos=new T.InstancedMesh(new T.PlaneGeometry(1,1),aura,anchors.length);
  const frames=new T.InstancedMesh(geo.pipe,mat(0x7e4353,.22),anchors.length);
  for(const mesh of [shells,halos,frames]){
    mesh.frustumCulled=false;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    scene.add(mesh);
  }
  const pivot=new T.Object3D();
  return (time)=> {
    paper.uniforms.time.value=time;
    anchors.forEach(({x,y,z,w,p},i)=>{
      const height=y + .61*Math.sin(time*.38+p)+.21*Math.sin(time*.73+p*.4);
      const px=x+.56*Math.sin(time*.37+p), pz=z+.44*Math.cos(time*.29+p);
      pivot.position.set(px,height,pz);
      pivot.rotation.set(Math.sin(time*.77+p)*.09,p+time*.11,Math.cos(time*.55+p)*.12);
      pivot.scale.set(w,w*1.36,w);
      pivot.updateMatrix();
      shells.setMatrixAt(i,pivot.matrix);
      pivot.position.y=height-w*.61;
      pivot.scale.set(w*.36,w*.095,w*.36);
      pivot.updateMatrix();
      frames.setMatrixAt(i,pivot.matrix);
      pivot.rotation.set(0,0,0);
      pivot.position.y=height-w*.24;
      pivot.scale.set(w*4.62,w*5.49,1);
      pivot.updateMatrix();
      halos.setMatrixAt(i,pivot.matrix);
    });
    shells.instanceMatrix.needsUpdate=true;
    frames.instanceMatrix.needsUpdate=true;
    halos.instanceMatrix.needsUpdate=true;
  };
}

function boatScene(scene) {
  const boat=group(scene,2.9,.22,1.1);
  curvedHull(boat);
  const lamp=group(boat,.02,.30,.08);
  shape(lamp,geo.pipe,0xcb864f,0,.055,0,.176,.066,.176);
  shape(lamp,new T.SphereGeometry(1,14,10),mat(0xffb17c,1.03),0,.218,0,.145,.204,.144);
  for(let i=0;i<4;i++){
    const a=i*tau/4+.25;
    rod(lamp,0xbb7848,[.151*Math.cos(a),.082,.151*Math.sin(a)],[.119*Math.cos(a),.408,.119*Math.sin(a)],.013,geo.pipe);
  }
  shape(lamp,geo.post,gold,0,.420,0,.165,.093,.165);
  glow(lamp,0xffa554,0,.22,.147,1.31,1.34,.46);
  const light=new T.PointLight(0xffad72,5.6,7,1.8);
  light.position.set(.03,.64,.6);
  boat.add(light);
  return boat;
}

export function lakeWorld() {
  const scene=new T.Scene();
  scene.fog=new T.FogExp2(0x59415c,.011);
  const sky=twilight(scene);
  const water=lakeSurface(scene);
  scene.add(new T.HemisphereLight(0xfbd2ea,0x7960a5,1.7));
  const rim=new T.DirectionalLight(0xffbc87,2.15);
  rim.position.set(-4,3,5);
  scene.add(rim);
  const back=new T.DirectionalLight(0xf5a5b4,1.06);
  back.position.set(2,5,-5);
  scene.add(back);
  distantShore(scene);
  castle(scene);
  const lanternUpdate=paperLanterns(scene);
  const boat=boatScene(scene);
  return {
    scene,sky,skyScale:1,boat,
    updates:[(time)=>{
      water.material.uniforms.time.value=time;
      lanternUpdate(time);
      boat.position.set(2.9+.16*Math.sin(time*.44),.19+.048*Math.sin(time*1.12),1.1+.11*Math.cos(time*.45));
      boat.rotation.set(.035*Math.sin(time*.63),-.07+.051*Math.sin(time*.48),.023*Math.sin(time*.82));
    }]
  };
}

