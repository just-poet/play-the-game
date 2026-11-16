import * as T from 'three';
import { random, mat, geo, group, shape, box, ball, rod, batch, pet, label, glow } from './art.js';
import { atmosphere, animatedWater, gardenFlowers, palm, tree } from './worlds.js';
import { bistroTerrace, bistroFacade, bistroTiles, bistroChandelier, bistroPanel } from './bistro.js';

const oak = 0x9d6453, wood = 0x644052, paper = 0xffdfb7, brass = 0xf1ae66;
const jade = 0x476a5e, rose = 0xc67883, plaster = 0xf3c99e;
const light = mat(0xffcb80, 2);
const bookColors = [0x657f97,0x98728e,0xd58a76,0x8f9d79,0xa75f69,0x657e67,0xb88a64,0xc59c9b,0xa19ac1];

function floor(parent, x, y, z, width, length, colors) {
  const rng = random(940);
  const planks = [];
  const rows = Math.ceil(width / .38), cols = Math.ceil(length / 3.5);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const w = width/rows, l = length/cols;
      planks.push([x - width/2 + (i+.5)*w, y, z-length/2+(j+.5)*l, w-.013,.16,l-.015,colors[Math.floor(rng()*colors.length)]]);
    }
  }
  batch(parent, geo.box, planks);
}

export function lantern(parent, x, y, z, scale = 1) {
  const l = group(parent,x,y,z);
  l.scale.setScalar(scale);
  box(l,wood,0,.22,0,.29,.065,.29);
  box(l,wood,0,-.23,0,.26,.06,.26);
  box(l,light,0,0,0,.19,.42,.19);
  for (const s of [-1,1]) for (const q of [-1,1]) box(l,wood,s*.114,0,q*.114,.022,.46,.022);
  glow(l,0xffab58,0,0,.075,1.45,1.45,.31);
  return l;
}

function arch(parent, x, y, z, radius, color, thickness = .13) {
  const g = group(parent,x,y,z);
  shape(g, new T.TorusGeometry(radius, thickness, 8, 36, Math.PI), color, 0,0,0);
  return g;
}

function slopedRoof(parent,x,y,z,width,depth,rise,color, tile) {
  const run = width / 2, slant = Math.hypot(run, rise);
  for (const side of [-1,1]) {
    const roof = group(parent,x+side*run/2,y+rise/2,z);
    roof.rotation.z = -side*Math.atan2(rise,run);
    box(roof, color,0,0,0,slant+.25,.23,depth);
    const units = Math.ceil(depth/.29), strips = [];
    for (let i=0;i<units;i++) {
      const u = -depth/2 + (i+.5)*depth/units;
      strips.push([0,.122,u,slant+.27,.066,.10,tile[i%tile.length]]);
    }
    batch(roof,geo.box,strips);
  }
  rod(parent,tile[0],[x,y+rise+.13,z-depth/2],[x,y+rise+.13,z+depth/2],.13,geo.pipe);
}

function paintedWindow(parent, x, y, z, rotate = 0, size = 1) {
  const frame = group(parent,x,y,z);
  frame.rotation.y = rotate;
  frame.scale.setScalar(size);
  const glass = new T.Shape();
  glass.moveTo(-.95,-1.39);
  glass.lineTo(.95,-1.39);
  glass.lineTo(.95,.45);
  glass.absarc(0,.45,.95,0,Math.PI,false);
  glass.lineTo(-.95,-1.39);
  const panes = new T.MeshBasicMaterial({color:0xffc3ba, opacity:.15, transparent:true, side:T.DoubleSide, depthWrite:false});
  shape(frame,new T.ShapeGeometry(glass),panes,0,0,0);
  for (const side of [-1,1]) {
    box(frame,oak,side*.97,-.47,0,.15,1.93,.19);
    box(frame,brass,side*.51,-.26,.011,.028,2.23,.048);
  }
  box(frame,oak,0,-1.4,0,2.19,.17,.33);
  box(frame,brass,0,.44,0,1.84,.027,.043);
  box(frame,brass,0,-.51,0,1.84,.029,.043);
  box(frame,brass,0,-.05,0,.029,2.71,.053);
  arch(frame,0,.45,0,.96,oak,.081);
  const paints = [0xec8e8b,0xf8c18d,0x83b2a0,0xd9a0bf,0x9da8c5].map(color =>
    new T.MeshBasicMaterial({color, transparent:true, opacity:.84, side:T.DoubleSide,depthWrite:false}));
  for (const [cx,cy,n] of [[-.47,-.76,0],[.49,-.17,1],[0,.84,3]]) {
    for (let i=0;i<6;i++) {
      const a=i*Math.PI/3;
      shape(frame,geo.disk,paints[(n+i%2)%paints.length],cx+.17*Math.cos(a),cy+.17*Math.sin(a),.022,.14,.068,1).rotation.z=a;
    }
    shape(frame,geo.disk,paints[1],cx,cy,.026,.077,.077,1);
  }
  const leaf = paints[2];
  for (const [x0,y0,turn] of [[-.27,-1.02,.47],[.18,-.83,-.51],[.26,-.41,.62],[-.32,-.19,-.69]]) {
    shape(frame,geo.disk,leaf,x0,y0,.024,.15,.04,1).rotation.z=turn;
  }
  return frame;
}

export function flowerPot(parent,x,y,z,scale=1) {
  const p = group(parent,x,y,z);
  p.scale.setScalar(scale);
  const pot = shape(p,geo.post,0xb76567,0,.20,0,.23,.38,.23);
  pot.rotation.z=Math.PI;
  shape(p,geo.pipe,0xde8d85,0,.40,0,.246,.075,.246);
  for (let i=0;i<6;i++) {
    const a=i*2.399, tx=Math.sin(a)*(.17+i*.013), tz=Math.cos(a)*.21;
    const ty=.56+(i%3)*.13;
    rod(p,0x5c855d,[0,.39,0],[tx,ty,tz],.018);
    shape(p,geo.leaf,i%2?0x709f72:0xabc17a,tx*.67,ty-.09,tz*.67,.145,.039,.073).rotation.y=a;
    for (let j=0;j<5;j++) {
      const b=j*1.256;
      ball(p,[0xec8e9c,0xffce8a,0xf4c2d5][i%3],tx+.079*Math.cos(b),ty,tz+.079*Math.sin(b),.066,.047,.065);
    }
    ball(p,brass,tx,ty+.024,tz,.037,.028,.037);
  }
}

function caféTable(parent,x,z) {
  const table = group(parent,x,0,z);
  const shade = shape(table,geo.disk,new T.MeshBasicMaterial({color:0x502536,opacity:.17,transparent:true,depthWrite:false}),0,.087,0,1.41,.90,1);
  shade.rotation.x=-Math.PI/2;
  shape(table,geo.pipe,wood,0,1.058,0,.79,.12,.79);
  shape(table,geo.pipe,0xd4ac8f,0,1.126,0,.774,.046,.774);
  shape(table,geo.pipe,wood,0,.52,0,.10,.96,.10);
  shape(table,geo.pipe,wood,0,.10,0,.40,.11,.40);
  for (const s of [-1,1]) {
    box(table,jade,s*1.05,.42,0,.49,.11,.58);
    for (const dz of [-.22,.22]) for (const dx of [-.17,.17]) box(table,wood,s*1.05+dx,.22,dz,.051,.41,.051);
    const bow=group(table,s*1.25,.76,0);
    bow.rotation.y=Math.PI/2;
    shape(bow,new T.TorusGeometry(.23,.032,7,24),wood,0,.07,0,1,1.35,1);
    for(const dz of [-.19,.19]) box(table,wood,s*1.25,.59,dz,.046,.35,.048);
  }
  flowerPot(table,.12,1.11,0,.45);
  for (const s of [-1,1]) {
    shape(table,geo.pipe,paper,s*.37,1.128,.18,.16,.026,.16);
    shape(table,geo.pipe,s===1?rose:jade,s*.37,1.206,.18,.10,.147,.10);
    shape(table,geo.pipe,0xa67057,s*.37,1.285,.18,.077,.011,.077);
    shape(table,new T.TorusGeometry(.047,.017,7,16),s===1?rose:jade,s*.48,1.221,.18);
  }
}

function rug(parent,x,z,w,l,color,y=.092) {
  const rows = [];
  rows.push([x,y,z,w,.013,l,color]);
  for (const s of [-1,1]) {
    rows.push([x+s*(w/2-.12),y+.009,z,.029,.012,l-.17,brass]);
    rows.push([x,y+.009,z+s*(l/2-.12),w-.17,.012,.029,brass]);
  }
  for (let i=0;i<7;i++) {
    rows.push([x,y+.009,z-l*.35+i*l*.117,.135,.008,.135,0xe4ad9b,0,Math.PI*.25,0]);
  }
  batch(parent,geo.box,rows);
}

export function bookcase(parent, x, z, width, height = 4.45, rotate = 0) {
  const shelf=group(parent,x,0,z);
  shelf.rotation.y=rotate;
  const rng=random(Math.floor((x+16)*387 +(z+63)*173)); 
  const cabinets=[], books=[];
  cabinets.push([0,height/2,-.33,width,height,.15,wood]);
  for (const s of [-1,1]) cabinets.push([s*width/2,height/2,0,.13,height,.64,oak]);
  const levels=height>4?5:3;
  for (let j=0;j<=levels;j++) cabinets.push([0,.19+j*(height-.35)/levels,0,width,.12,.64,j===levels?brass:oak]);
  for (let i=0;i<levels;i++) {
    const y=.26+i*(height-.35)/levels;
    for (let left=-width/2+.17;left<width/2-.18;) {
      const w=.078+rng()*.12,h=.29+rng()*.29;
      books.push([left+w/2,y+h/2,.060,w,h,.39,bookColors[Math.floor(rng()*bookColors.length)],0,0,0]);
      books.push([left+w/2,y+h*.75,.26,w*.78,.021,.009,i%2?brass:paper]);
      left+=w+.02+(rng()>.8?.15:0);
    }
  }
  batch(shelf,geo.box,cabinets);
  batch(shelf,geo.box,books);
  return shelf;
}

function settlePet(world, kind, x, z, angle, size, color, collar, phase) {
  const animal = pet(world.scene,kind,color,collar);
  animal.root.position.set(x,.08,z);
  animal.root.rotation.y=angle;
  animal.root.scale.setScalar(size);
  world.updates.push(time=>animal.pose(time+phase));
  return animal;
}

export function overlook() {
  const world=atmosphere('cafe');
  const {scene}=world;
  const rng=random(215);
  world.updates.push(animatedWater(scene,90,-13,-28,190,330));
  const hills = [], cliffs = [];
  for (let i=0;i<33;i++) {
    const x=-110+rng()*204,z=-72-rng()*115,n=8+rng()*19;
    hills.push([x,-15,z,n,6+rng()*21,n*.92,[0x967e9e,0xc3929e,0x9a879d,0xb49aba][i%4],.19,rng()*6.3,.21]);
  }
  for (let i=0;i<27;i++) cliffs.push([-15+rng()*17,-11.9+rng()*1.4,-13+rng()*26,4+rng()*6,6+rng()*4,4+rng()*7,[0x9a7374,0x805b69,0xb1807a][i%3],.14,rng()*6.28,.33]);
  batch(scene,geo.leaf,hills);
  batch(scene,geo.gem,cliffs);
  const terrace=group(scene,-4,0,0);
  box(terrace,0x8d625c,0,-.43,0,20.7,.81,20);
  bistroTerrace(terrace);
  const house=group(terrace,-1,0,-2.5);
  bistroFacade(house,paintedWindow,lantern,slopedRoof,label);
  for (const x of [-6.6,-3.2,3.4,6.4]) flowerPot(terrace,x,.1,3.2,1.05);
  caféTable(terrace,6.38,-.5);
  tree(scene,-11,-.15,4.8,7.5,true);
  palm(scene,3.6,-1.2,-7.9,7.8,.85);
  gardenFlowers(terrace,rng,164,i=>[(i%2?-1:1)*(7.9+rng()*1.4),.05,8.4-rng()*15.5],true);
  return world;
}

export function cafeInterior() {
  const world=atmosphere('cafe');
  const {scene}=world;
  world.updates.push(animatedWater(scene,91,-15,-18,180,330));
  const distant=[];
  const rng=random(728);
  for(let i=0;i<28;i++) distant.push([30+rng()*62,-16,-62-rng()*66,8+rng()*24,8+rng()*21,8+rng()*17,[0xb591a3,0xd9a19e,0x9c88a6][i%3],.30,rng()*6.3,.3]);
  batch(scene,geo.gem,distant);
  bistroTiles(scene);
  floor(scene,0,0,-15,14.6,14,[0xa66c59,0x996451,0xac755c,0xb17a62]);
  const ceiling=group(scene,0,0,0);
  floor(ceiling,0,5.48,-1,14.65,14.1,[0xc3a78b,0xc4a782,0xcfb18d,0xd0ad8b]);
  floor(ceiling,0,5.48,-15,14.65,14.1,[0x926565,0x94676b,0xa37068,0xa7746d]);
  for(const side of [-1,1]) box(ceiling,plaster,side*7.17,4.98,-8,.20,1.09,28.0);
  for (const z of [5.7,2.5,-.7,-3.9,-7.1,-10.3,-13.5,-16.7,-19.9]) box(ceiling,wood,0,5.19,z,14.52,.24,.19);
  for(const z of [3.0,-2.95]) bistroChandelier(ceiling,0,z);
  for (const z of [-12.0,-17.4]) {
    rod(ceiling,wood,[0,5.24,z],[0,4.61,z],.035,geo.pipe);
    shape(ceiling,geo.post,rose,0,4.54,z,.36,.22,.36);
    ball(ceiling,light,0,4.43,z,.17,.115,.17);
    glow(ceiling,0xffb279,0,4.39,z+.04,2.68,2.35,.23);
  }
  box(scene,plaster,0,2.66,-22.1,14.57,5.47,.20);
  for(const z of [-2.15,1.28,-5.25]) {
    const gleam=new T.MeshBasicMaterial({color:z<-3?0xffb6bf:0xffc49c,opacity:.24,transparent:true,depthWrite:false});
    const pane=box(scene,gleam,5.65,.089,z,2.63,.005,1.0);
    pane.rotation.y=.28;
  }
  rug(scene,0,1.5,2.23,6.9,0x975e6d);
  rug(scene,0,-14.4,3.16,10.3,0x6f697f);
  for(const x of [-7.2,7.2]) {
    box(scene,jade,x,.38,-1,.24,.65,14);
    box(scene,brass,x*.981,.64,-1,.067,.053,14);
    for(let i=0;i<16;i++) box(scene,0x648072,x*.983,.33,5.52-i*.85,.062,.33,.74);
    box(scene,oak,x,4.46,-1,.28,.36,14);
    for(const z of [5.62,2.2,-1.25,-4.7,-7.65]) box(scene,wood,x,2.22,z,.33,4.54,.32);
    for(const z of [3.85,.42,-3.0,-6.15]) paintedWindow(scene,x,2.34,z,Math.PI/2,1.32);
  }
  for(const x of [-5.1,5.1]) {
    box(scene,plaster,x,2.35,-7.98,4.2,4.65,.34);
    box(scene,oak,x,4.78,-7.98,4.2,.23,.45);
  }
  for(const x of [-2.8,2.8]) {
    box(scene,oak,x,1.58,-7.98,.27,3.13,.48);
    lantern(scene,x,2.74,-7.67,.95);
  }
  arch(scene,0,2.3,-7.96,2.73,oak,.155);
  label(scene,'THE LIBRARY',0,4.25,-7.67,2.78);
  rug(scene,0,-5.52,2.41,3.8,0x916483);
  for(const x of [-4.4,4.4]) for(const z of [2.95,-.55,-4.2]) caféTable(scene,x,z);
  for(const x of [-5.95,5.95]) for(const z of [4.91,-6.8]) flowerPot(scene,x,.08,z,.94);
  box(scene,jade,-5.2,.65,-6.7,3.0,1.18,.65);
  box(scene,oak,-5.2,1.25,-6.7,3.13,.16,.77);
  for(let i=0;i<4;i++){
    ball(scene,[0xc38b64,0xffd79b,0xe3a482][i%3],-6.04+i*.43,1.4,-6.65,.17,.088,.14);
    shape(scene,geo.pipe,paper,-6.04+i*.43,1.338,-6.65,.19,.029,.18);
  }
  label(scene,'TEA & TREATS',-5.2,2.7,-7.72,2.4,'light');
  for(const y of [1.64,3.18]) bistroPanel(scene,5.4,y,-7.72);
  bistroPanel(scene,-5.21,3.83,-7.72);
  for (const z of [4.1,1.5,-1.15,-3.8,-6.45]) {
    rod(scene,wood,[-7.1,4.22,z],[7.1,4.22,z],.034,geo.pipe);
    for(let i=0;i<13;i++){
      const x=-6.6+i*1.1;
      ball(scene,light,x,4.18-Math.cos(x*.17)*.17,z,.064,.083,.064);
    }
  }
  for (const [x,z,index] of [[-3.13,4.58,0],[4.95,4.92,1],[-5.2,.92,2],[3.2,1.16,3],[-3.14,-3.76,4],[4.76,-5.73,5],[-6.2,-4.83,6],[5.85,-2.38,7],[-2.15,-5.86,8],[2.23,-4.6,9]]) {
    settlePet(world,index%2?'cat':'pup',x,z,Math.PI+index*.35,.52+(index%3)*.09,[0xe4a267,0xf6d9ca,0x8f6d69,0xdab4a0,0xd38c63,0xeeccb0][index%6],[rose,jade,0x9376bd][index%3],index);
  }
  for(const x of [-7.24,7.24]) {
    box(scene,plaster,x,2.28,-15,.24,4.55,14.0);
    for(const z of [-10.38,-14.50,-18.62]) bookcase(scene,x*.933,z,3.7,4.4,x<0?Math.PI/2:-Math.PI/2);
  }
  for(const x of [-5,-.15,4.7]) bookcase(scene,x,-21.7,4.37);
  box(scene,oak,0,4.82,-21.95,14.6,.36,.44);
  for(const x of [-4.2,4.20]) {
    for(const z of [-12.1,-17.5]) {
      rug(scene,x,z,2.15,2.8,0x966d7d);
      caféTable(scene,x,z);
      lantern(scene,x,3.68,z,1.25);
    }
  }
  label(scene,'READ WITH SOMEONE YOU LOVE',0,4.89,-21.24,5.2,'light');
  settlePet(world,'cat',-1.90,-17.0,2.4,.64,0xe7b8a3,rose,3);
  settlePet(world,'pup',2.05,-18.4,3.1,.68,0xb17c56,jade,1);
  return world;
}

