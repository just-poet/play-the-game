import * as T from 'three';
import { random, mat, geo, group, shape, box, ball, rod, batch, glow } from './art.js';

export function mountain(parent, x, y, z, width, height, depth, seed, snowy = true) {
  const rng = random(seed), sides = 15, points = [], colors = [], indices = [];
  const dark = new T.Color(0x3e666f), rock = new T.Color(0x697e95), ice = new T.Color(0xeddfda);
  const ridges = Array.from({length:sides},() => .77 + rng() * .31);
  const peakX = (rng() - .5) * width * .76, peakZ = (rng() - .5) * depth * .62;
  for (const [row,level,radius] of [[0,0,1],[1,.32,.72],[2,.56,.52],[3,.76,.31],[4,.94,.12],[5,1,.018]]) {
    for(let i=0;i<sides;i++) {
      const a=i*2*Math.PI/sides+.15*(row%2);
      const jag=(rng()-.5)*(row>0&&row<5?.14:.027);
      points.push(x+peakX*level+Math.cos(a)*width*radius*ridges[i],y+height*(level+jag),z+peakZ*level+Math.sin(a)*depth*radius*ridges[i]);
      const tint=dark.clone().lerp(rock,level*.92).multiplyScalar(.79+rng()*.29);
      if(snowy) tint.lerp(ice,T.MathUtils.smoothstep(level+jag, .55+.09*ridges[i],.91));
      colors.push(tint.r,tint.g,tint.b);
      if(row===5) continue;
      const j=row*sides+i,k=row*sides+(i+1)%sides;
      indices.push(j,j+sides,k,k,j+sides,k+sides);
    }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(points,3));
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  g.setIndex(indices);
  g.computeVertexNormals();
  parent.add(new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,flatShading:true,side:T.DoubleSide,roughness:.97})));
}

function cascade(parent, x, z, seed) {
  const rng=random(seed), bank=group(parent,x,0,z);
  const stone=[];
  for(let i=0;i<17;i++){
    const side=i%2?-1:1;
    stone.push([side*(2.1+rng()*2.6),.4+rng()*4.3,-.9-rng()*5.4,1.1+rng()*1.26,1+rng()*4,1.7+rng()*2.2,[0x657b7d,0x6e8181,0x738488][i%3],.16,rng()*6,.31]);
  }
  stone.push([0,3.93,-2.9,2.5,5.4,2.55,0x667e83,0,.24,.11]);
  batch(bank,geo.gem,stone);
  const ribbon=new T.ShaderMaterial({
    uniforms:{time:{value:0}},
    vertexShader:'varying vec2 v; void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 v;uniform float time;void main(){float mask=smoothstep(0.,.16,v.x)*(1.-smoothstep(.79,1.,v.x));float streak=sin(v.x*90.+sin(v.y*11.+time*3.)*.85)+.56*sin(v.y*40.+v.x*48.+time*11.);vec3 c=mix(vec3(.25,.61,.68),vec3(.94,.99,.95),smoothstep(-.95,1.52,streak));gl_FragColor=vec4(c,.8*mask);}',
    transparent:true,depthWrite:false,side:T.DoubleSide
  });
  shape(bank,new T.PlaneGeometry(3.1,9.0),ribbon,0,4.8,1.04).rotation.x=-.08;
  const pool=shape(bank,geo.disk,mat(0x6fc3c4,.15),.39,.08,1.70,3.48,2.37,1);
  pool.rotation.x=-Math.PI/2;
  for(let i=0;i<5;i++) glow(bank,0xb7fff0,(i-2)*.73,.52,1.63,2.87,1.89,.28);
  return time=>{ribbon.uniforms.time.value=time;};
}

export function forestLandmarks(world, length) {
  const {scene}=world;
  const rng=random(498), crags=[], blooms=[], moths=[];
  for(let i=0;i<9;i++) {
    const z=-64-i*45;
    for(const side of [-1,1]){
      mountain(scene,side*(23+i%3*4),-3,z,14+rng()*4,25+rng()*21,12+rng()*6,600+i*43+side);
      mountain(scene,side*(31+rng()*5),-4,z+12,13+rng()*10,15+rng()*17,14+rng()*8,540+i*59+side,false);
    }
  }
  for(const [i,z] of [-22,-119,-216,-313,-390].entries()){
    const side=i%2===0?1:-1;
    world.updates.push(cascade(scene,side*10.6,z,193+i*23));
    for(let j=0;j<14;j++){
      const a=j*2.399,x=side*(4.3+rng()*4.5), h=.5+rng()*2.95;
      crags.push([x,.18+h*.19,z+Math.sin(a)*5,.24+rng()*.46,h*.56,.27+rng()*.47,[0x80929d,0x907eb1,0xa0adbd,0x689a94][j%4],.16,a,(rng()-.5)*.41]);
      blooms.push([x,.48+h*.62,z+Math.sin(a)*5,.095,.12,.09,[0xf5bbec,0xafeeff,0xffd386][j%3]]);
    }
  }
  batch(scene,geo.gem,crags);
  batch(scene,geo.leaf,blooms);
  for(let i=0;i<44;i++) {
    const pivot=group(scene,0,0,0), wings=[];
    for(const side of [-1,1]){
      const wing=group(pivot);
      const color=mat([0xffc782,0xbbd8ff,0xf498cf,0xa1f1ca][i%4],.45);
      shape(wing,geo.leaf,color,side*.085,.016,-.055,.109,.022,.098);
      shape(wing,geo.leaf,color,side*.058,.006,.039,.073,.018,.071);
      wings.push(wing);
    }
    const z=-5-i*(length+5)/44;
    moths.push({pivot,wings,x:(i%2?-1:1)*(2+rng()*3.2),y:.6+rng()*2.2,z,phase:rng()*6.28});
  }
  world.updates.push(time=>{
    for(const {pivot,wings,x,y,z,phase} of moths){
      pivot.position.set(x+Math.sin(time*.94+phase)*.72,y+Math.cos(time*1.32+phase)*.39,z+Math.cos(time*.84+phase)*.96);
      pivot.rotation.y=time*.49+phase;
      wings[0].rotation.z=Math.sin(time*16+phase)*.85;
      wings[1].rotation.z=-wings[0].rotation.z;
    }
  });
}

function islandPalace(parent, x, z, size) {
  const palace=group(parent,x,-.7,z);
  palace.scale.setScalar(size);
  for(let j=0;j<7;j++) {
    shape(palace,geo.gem,[0x9286aa,0xab8ea9,0x8985a6][j%3],(j-3)*2.1,-.45,Math.sin(j*2.1)*1.7,3.2,2.65,3.9).rotation.y=j*.79;
  }
  box(palace,0xc1a4b5,0,2.75,-.8,8.2,3.1,3.4);
  for(let i=0;i<6;i++) box(palace,mat(0xffdb9e,.94),(i-2.5)*1.22,3.05,.99,.20,.77,.065);
  for(const [x,y,z,r,h] of [[0,1.4,-1.1,1.43,5.9],[-3.98,1.2,.3,.95,4.9],[3.84,1.1,.10,1.06,5.35],[-2.45,2.6,-2.77,.77,4.65],[2.07,2.9,-2.35,.68,3.68]]) {
    shape(palace,geo.pipe,0xdfbdba,x,y+h/2,z,r,h,r);
    shape(palace,geo.pipe,0xc69fae,x,y+h-.21,z,r*1.13,.27,r*1.13);
    shape(palace,geo.cone,0x6b5c95,x,y+h+1.24,z,r*1.26,2.67,r*1.26).rotation.y=.25;
    ball(palace,mat(0xffd4a0,.45),x,y+h+2.61,z,.081,.137,.081);
    for(let i=-1;i<=1;i++){
      const a=i*.64;
      const frame=box(palace,mat(0xffd18c,.85),x+Math.sin(a)*r,y+h*.66,z+Math.cos(a)*r,.19,.64,.09);
      frame.rotation.y=a;
    }
  }
}

export function lanternCoast(world, length) {
  const {scene}=world;
  islandPalace(scene,35,-77,1.31);
  islandPalace(scene,45,-246,1.55);
  islandPalace(scene,30,-437,1.31);
  const rng=random(9812), lanterns=[];
  const glowColor=mat(0xffab55,2.15), parchment=mat(0xffc270,1.24), copper=mat(0x995a68,.11);
  for(let i=0;i<165;i++) {
    const z=4-rng()*(length+52), x=i%9===0?-6-rng()*7:7+rng()*53;
    const h=2.6+rng()*23, size=.11+rng()*.22;
    lanterns.push({x,h,z,size,phase:rng()*Math.PI*2});
  }
  for(let i=0;i<19;i++){
    lanterns.push({x:7.5+rng()*18.5,h:3.4+rng()*8.7,z:-14-i*2.49,size:.205+rng()*.23,phase:rng()*6.28});
  }
  const aura=new T.ShaderMaterial({
    vertexShader:'varying vec2 v;void main(){v=uv*2.-1.;vec4 center=modelViewMatrix*instanceMatrix*vec4(0.,0.,0.,1.);vec2 s=vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));center.xy+=position.xy*s;gl_Position=projectionMatrix*center;}',
    fragmentShader:'varying vec2 v;void main(){float d=length(v);float mask=pow(max(0.,1.-d),2.9);gl_FragColor=vec4(1.,.55,.22,mask*.49);}',
    transparent:true,depthWrite:false,blending:T.AdditiveBlending
  });
  const holder=group(scene);
  const layers=[
    new T.InstancedMesh(geo.post,parchment,lanterns.length),
    new T.InstancedMesh(geo.pipe,copper,lanterns.length),
    new T.InstancedMesh(geo.ball,glowColor,lanterns.length),
    new T.InstancedMesh(new T.PlaneGeometry(1,1),aura,lanterns.length)
  ];
  for(const mesh of layers) {
    mesh.frustumCulled=false;
    holder.add(mesh);
  }
  const dummy=new T.Object3D();
  world.updates.push(time=>{
    lanterns.forEach(({x,h,z,size,phase},i)=>{
      const y=h+Math.sin(time*.48+phase)*.82;
      dummy.rotation.set(.13*Math.sin(time+phase),phase+time*.16,.17*Math.sin(time*.7+phase));
      const dx=x+Math.sin(time*.44+phase)*1.25, dz=z+Math.cos(time*.42+phase)*1.08;
      for(let j=0;j<layers.length;j++){
        dummy.scale.set(size*[1,1.02,.33,7.2][j],size*[2.65,.16,.62,8.6][j],size*[1,1.02,.33,1][j]);
        dummy.position.set(dx,y-size*[0,1.24,.88,.54][j],dz);
        dummy.updateMatrix();
        layers[j].setMatrixAt(i,dummy.matrix);
      }
    });
    for(const mesh of layers) mesh.instanceMatrix.needsUpdate=true;
  });
  for(const [x,z,r] of [[10,-33,0],[21,-120,-.4],[13,-291,.34],[19,-491,-.2]]){
    const boat=group(scene,x,-.075,z);
    boat.rotation.y=r;
    ball(boat,0x875b67,0,.14,0,.48,.22,1.12);
    ball(boat,0xdaab81,0,.248,0,.41,.12,1.02);
    box(boat,0xa07262,0,.29,0,.79,.057,.21);
    rod(boat,0x725066,[.1,.18,.17],[.1,.97,.17],.025,geo.pipe);
    shape(boat,geo.leaf,parchment,.1,1.05,.17,.13,.20,.135);
    glow(boat,0xffb56b,.1,1.06,.23,1.35,1.40,.32);
    world.updates.push(t=>{boat.position.y=-.07+Math.sin(t*1.1+x)*.055;boat.rotation.z=Math.sin(t*.8+z)*.047;});
  }
}

