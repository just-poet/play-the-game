import * as T from 'three';
import { random, mat, geo, group, shape, box, ball, rod, batch, glow, particles, label } from './art.js';
import { atmosphere, animatedWater, gardenFlowers, palm, tree } from './worlds.js';
import { bookcase, flowerPot, lantern } from './rooms.js';

const teak=0x6d3c2d, trim=0xa46b47, ochre=0xd29161, plaster=0xe9c69c;
const stone=0x9c8077, brass=0xc3914e, clay=0xa55844, cream=0xffe1b6;
const terrace=.47;
const wall={front:-14.0,courtFront:-18.3,courtBack:-29.2,library:-32.2,back:-36.26};
const planter={x:-2.7,z:-24.2,rx:1.44,rz:1.74};
const pond={x:-7.12,z:-2.55,rx:4.2,rz:3.0};

export function homeCanWalk(x,z) {
  if (Math.abs(x)>15.9||z>9.45||z<wall.back) return false;
  if (((x-pond.x)/(pond.rx+.32))**2+((z-pond.z)/(pond.rz+.28))**2<1) return false;
  if (z<-10.1 && Math.abs(x)>10.4) return false;
  if (Math.abs(x)>1.7 && Math.abs(z-wall.front)<.50) return false;
  if (Math.abs(x)>3.45 && Math.abs(z-(wall.courtBack-.88))<.44) return false;
  return !(Math.abs(x-planter.x)<planter.rx+.20 && Math.abs(z-planter.z)<planter.rz+.20);
}

export function homeHeight(z) {
  if(z>-9.05) return 0;
  if(z>-9.62) return .17;
  if(z>-10.2) return .33;
  return terrace;
}

export function homeFinish(x,z) {
  return z<wall.library && Math.abs(x)<3.1;
}

const tiles=[0xaf5b46,0xbc654d,0xa45443,0xc56e52,0xa85645,0xb7644c];
const roofMaterial=mat(clay).clone();
roofMaterial.side=T.DoubleSide;
const tileGeometry=new T.CylinderGeometry(1,1,1,7);
const tangent=new T.Vector3(0,1,0);

function roof(parent,x,y,z,width,depth,rise,axis='x') {
  const frame=group(parent,x,y,z);
  if(axis==='z') frame.rotation.y=Math.PI/2;
  const w=(axis==='x'?width:depth)/2,d=(axis==='x'?depth:width)/2,ridge=w*.60;
  const corners=[[-w,0,-d],[w,0,-d],[w,0,d],[-w,0,d]].map(a=>new T.Vector3(...a));
  const ridgeA=new T.Vector3(-ridge,rise,0), ridgeB=new T.Vector3(ridge,rise,0);
  const points=[], courses=[], seams=[];
  const rows=Math.ceil(Math.hypot(d,rise)/.39);
  const q=new T.Quaternion(), e=new T.Euler();
  const mid=new T.Vector3(), end=new T.Vector3(), start=new T.Vector3(), along=new T.Vector3();
  for(let side=0;side<4;side++){
    const a=corners[side], b=corners[(side+1)%4];
    const c=side<2?ridgeB:ridgeA, d=side===0||side===3?ridgeA:ridgeB;
    points.push(...a,...b,...c,...a,...c,...d);
    rod(frame,teak,[a.x,-.09,a.z],[b.x,-.09,b.z],.116,geo.pipe);
    const cols=Math.ceil(a.distanceTo(b)/.31);
    for(let row=0;row<rows;row++){
      const t=row/rows, next=(row+1.14)/rows;
      const innerA=a.clone().lerp(d,t), innerB=b.clone().lerp(c,t);
      const count=c===d?Math.max(1,Math.round(cols*(1-t))):cols;
      const step=innerA.distanceTo(innerB)/count;
      for(let j=0;j<count;j++){
        const u=(j+.51)/count;
        start.copy(a).lerp(b,u).lerp(mid.copy(d).lerp(c,u),t);
        end.copy(a).lerp(b,u).lerp(mid,next);
        along.copy(end).sub(start);
        const len=along.length();
        mid.copy(start).lerp(end,.5);
        q.setFromUnitVectors(tangent,along.normalize());
        e.setFromQuaternion(q);
        courses.push([mid.x,mid.y+.032,mid.z,Math.min(.070,step*.37),len,Math.min(.070,step*.37),tiles[(row*3+j*7+side)%tiles.length],e.x,e.y,e.z]);
      }
      if(row===0 || (row%3===0&&innerA.distanceTo(innerB)>1)) rod(frame,0xb3624a,innerA.add(new T.Vector3(0,.035,0)).toArray(),innerB.add(new T.Vector3(0,.035,0)).toArray(),.023,geo.pipe);
    }
    const ridgeEnd=side===0||side===3?ridgeA:ridgeB;
    const tileDir=ridgeEnd.clone().sub(a);
    const len=tileDir.length();
    mid.copy(a).lerp(ridgeEnd,.5);
    e.setFromQuaternion(q.setFromUnitVectors(tangent,tileDir.normalize()));
    seams.push([mid.x,mid.y+.081,mid.z,.088,len,.089,0x9a4f3e,e.x,e.y,e.z]);
  }
  const surface=new T.BufferGeometry();
  surface.setAttribute('position',new T.Float32BufferAttribute(points,3));
  surface.computeVertexNormals();
  frame.add(new T.Mesh(surface,roofMaterial));
  batch(frame,tileGeometry,courses);
  batch(frame,geo.pipe,seams);
  rod(frame,0x964738,[-ridge,rise+.092,0],[ridge,rise+.092,0],.126,geo.pipe);
  for(const s of [-1,1]) ball(frame,brass,s*ridge,rise+.17,0,.092,.145,.099);
  return frame;
}

function gable(parent,x,y,z,w,h) {
  const g=group(parent,x,y,z);
  const outline=new T.Shape();
  outline.moveTo(-w/2,0);outline.lineTo(0,h);outline.lineTo(w/2,0);outline.closePath();
  shape(g,new T.ShapeGeometry(outline),0x50322a,0,0,0);
  for(let i=0;i<=14;i++) {
    const x=(i-7)*w/15;
    const height=h*(1-2*Math.abs(x)/w);
    box(g,i%3?trim:ochre,x,height*.49,.054,.075,height*.94,.092);
  }
  for(const s of [-1,1]) rod(g,teak,[s*w*.52,0,.18],[0,h+.07,.18],.111,geo.pipe);
  box(g,teak,0,.03,.16,w+.36,.19,.19);
  rod(g,teak,[0,h-.03,.14],[0,h+.49,.14],.088,geo.pipe);
  ball(g,brass,0,h+.50,.14,.087,.131,.085);
}

function column(parent,x,y,z,height=3.5,width=1) {
  const c=group(parent,x,y,z);
  c.scale.set(width,height/3.5,width);
  box(c,stone,0,.095,0,.53,.19,.53);
  box(c,0x765449,0,.24,0,.43,.10,.43);
  shape(c,geo.pipe,teak,0,1.71,0,.161,2.91,.161);
  for(const [yy,radius,h] of [[.36,.235,.15],[.51,.206,.10],[.61,.190,.047],[2.96,.184,.09],[3.11,.226,.12],[3.26,.253,.09]]) {
    shape(c,geo.pipe,trim,0,yy,0,radius,h,radius);
  }
  box(c,teak,0,3.37,0,.49,.15,.47);
  box(c,trim,0,3.48,0,.55,.11,.52);
}

function timberWindow(parent,x,y,z,rotate=0) {
  const window=group(parent,x,y,z);
  window.rotation.y=rotate;
  box(window,teak,0,0,0,1.48,1.91,.20);
  box(window,0x845738,0,0,.11,1.29,1.69,.10);
  box(window,mat(0xaf7953,.09),0,0,.161,1.14,1.48,.048);
  for(let i=-3;i<=3;i++) box(window,teak,i*.165,0,.196,.043,1.52,.078);
  for(let i=-2;i<=2;i++) box(window,trim,0,i*.311,.212,1.16,.038,.079);
  box(window,trim,0,-.95,.034,1.60,.14,.30);
  for(const side of [-1,1]){
    box(window,trim,side*.68,0,.139,.077,1.82,.080);
    box(window,teak,side*.50,.53,.232,.065,.19,.034);
  }
  box(window,trim,0,.92,.057,1.51,.105,.24);
}

function plankStone(parent,x,z,w,l,top,c) {
  const tiles=[], nx=Math.ceil(w/.78), nz=Math.ceil(l/1.02);
  const rng=random(Math.round((x+43)*137-z*94));
  for(let zi=0;zi<nz;zi++) for(let xi=0;xi<nx;xi++) {
    const dx=w/nx,dz=l/nz;
    tiles.push([x-w/2+(xi+.5)*dx,top-.09,z-l/2+(zi+.5)*dz,dx-.017,.18,dz-.018,c[Math.floor(rng()*c.length)]]);
  }
  batch(parent,geo.box,tiles);
}

function brassLamp(parent,x,y,z,scale=1) {
  const lamp=group(parent,x,y,z);
  lamp.scale.setScalar(scale);
  shape(lamp,geo.pipe,brass,0,.065,0,.23,.109,.23);
  shape(lamp,geo.pipe,trim,0,.36,0,.057,.58,.057);
  for(const [height,radius] of [[.20,.105],[.46,.09],[.68,.20],[.76,.223]]) {
    shape(lamp,geo.post,brass,0,height,0,radius,.072,radius);
  }
  for(let i=0;i<5;i++){
    const a=2*Math.PI*i/5;
    ball(lamp,mat(0xffbd65,1.65),.159*Math.cos(a),.83,.159*Math.sin(a),.033,.075,.038);
  }
  glow(lamp,0xffa853,0,.82,.075,1.2,1.22,.23);
}

function garland(parent,x,y,z,width,count) {
  const orange=[0xf4a34c,0xffca61,0xd78348,0xffad52], blooms=[];
  for(let i=0;i<count;i++){
    const u=i/(count-1);
    const dx=(u-.5)*width,dy=-Math.sin(u*Math.PI)*.42;
    blooms.push([x+dx,y+dy,z,.09,.10,.061,orange[i%orange.length],0,u,0]);
  }
  for(const side of [-1,1]) for(let i=0;i<12;i++){
    blooms.push([x+side*width*.5,y-i*.118,z,.085,.089,.064,orange[(i+2)%4]]);
  }
  batch(parent,geo.leaf,blooms);
}

function rangoli(parent,x,y,z,r) {
  const size=2.33*r, paint=new T.MeshBasicMaterial({color:0xffe0b6});
  for(const radius of [r*.27,r*.48,r*.71,r*.97]){
    const ring=shape(parent,new T.TorusGeometry(radius,.015,5,60),paint,x,y,z);
    ring.rotation.x=-Math.PI/2;
  }
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8,px=x+Math.cos(a)*r*.86,pz=z+Math.sin(a)*r*.86;
    const motif=shape(parent,new T.TorusGeometry(r*.17,.016,5,20),paint,px,y,pz,1.30,.47,1);
    motif.rotation.set(-Math.PI/2,0,-a);
    const dot=shape(parent,geo.disk,paint,x+Math.cos(a)*r*1.095,y,z+Math.sin(a)*r*1.095,.032,.032,1);
    dot.rotation.x=-Math.PI/2;
  }
  shape(parent,geo.leaf,cream,x,y+.012,z,size*.023,.022,size*.023);
}

function hangingChair(world,parent,x,y,z,angle=0) {
  const mount=group(parent,x,y,z), seat=group(mount);
  mount.rotation.y=angle;
  for(const side of [-1,1]){
    for(const dz of [-.30,.30]) rod(seat,brass,[side*.76,0,dz],[side*.76,-2.47,dz],.016,geo.pipe);
    box(seat,teak,side*.84,-2.11,0,.077,.061,.77);
    box(seat,trim,side*.84,-2.25,.30,.056,.36,.064);
  }
  box(seat,teak,0,-2.47,0,1.85,.14,.81);
  box(seat,teak,0,-2.12,-.38,1.81,.62,.12);
  box(seat,0xe6be91,0,-2.35,.013,1.64,.13,.67);
  for(const [i,color] of [0xae6673,0xe5c198,0xbc835b].entries()){
    const pillow=ball(seat,color,(i-1)*.53,-2.15,-.253,.25,.23,.104);
    pillow.rotation.z=(i-1)*.17;
  }
  world.updates.push(time=>{seat.rotation.x=Math.sin(time*1.36+x-z)*.11;});
}

function lounge(parent,x,z,angle) {
  const room=group(parent,x,terrace,z);
  room.rotation.y=angle;
  box(room,0xa76057,0,.012,0,3.48,.023,2.35);
  for(const s of [-1,1]) box(room,cream,s*1.64,.029,0,.034,.018,2.27);
  box(room,teak,0,.32,-.97,2.75,.19,.65);
  box(room,0xd6a578,0,.48,-.97,2.59,.17,.61);
  box(room,teak,0,.69,-1.23,2.74,.41,.075);
  for(const s of [-1,1]) {
    box(room,teak,s*1.31,.59,-.96,.069,.061,.64);
    ball(room,s<0?0xa96068:0xb18564,s*.83,.66,-1.13,.31,.195,.105);
  }
  box(room,teak,0,.31,.31,1.21,.13,.61);
  for(const s of [-1,1]) box(room,trim,s*.47,.16,.31,.085,.23,.44);
  shape(room,geo.pipe,brass,0,.405,.31,.15,.064,.15);
  flowerPot(room,.56,0,.85,.57);
}

function illustratedPanel(parent,x,y,z,angle) {
  const frame=group(parent,x,y,z);
  frame.rotation.y=angle;
  box(frame,teak,0,0,0,.67,.86,.059);
  box(frame,trim,0,0,.038,.54,.73,.052);
  box(frame,0xc49877,0,0,.074,.45,.62,.026);
  shape(frame,geo.leaf,0x8b9b68,0,-.06,.10,.08,.24,.017).rotation.z=.17;
  for(let k=0;k<5;k++) shape(frame,geo.leaf,0x7a865c,(k%2?1:-1)*.058,.073-k*.079,.111,.078,.039,.017).rotation.z=(k%2?.41:-.42);
}

function garden(world) {
  const {scene}=world;
  const rng=random(441);
  box(scene,0x778c5a,0,-.18,-12,82,.34,85);
  const mountains=[];
  for(let i=0;i<42;i++){
    const x=(rng()-.5)*172,z=-52-rng()*91,r=6+rng()*14;
    mountains.push([x,-3,z,r,7+rng()*19,r*.98,[0x8e7b8e,0x9c9295,0x728a83,0xb38c8b,0x799584][i%5],.18,rng()*6.3,.25]);
  }
  batch(scene,geo.leaf,mountains);
  for(const [x,z,h,bloom] of [[-14,1,8,true],[13,3,8,true],[-15,-8,10,false],[15,-9,10,true],[-14,-19,9,true],[13,-19,9,false],[-16,-29,12,false],[16,-30,11,true],[-8,-43,8,true],[6,-41,10,false],[-14,12,8,false],[14,12,8,false]]){
    tree(scene,x,0,z,h,bloom);
  }
  for(const [x,z,h,l] of [[-12,-16,10,-.9],[12,-14,11,.7],[16,-2,8,-1],[-16,-3,9,.7],[-13,7,7.5,.9],[13,-37,10,1],[5,-31,9,.8]]) palm(scene,x,0,z,h,l);
  const gravel=[];
  for(let i=0;i<31;i++){
    const z=9.3-i*.605;
    for(let j=-3;j<=3;j++){
      gravel.push([j*.65+Math.sin(i*.57)*.052,.008+rng()*.009,z,.623,.024,.575,[0xce9d80,0xd2aa8c,0xbe9480,0xc8a088][Math.floor(rng()*4)],0,(rng()-.5)*.069,0]);
    }
  }
  batch(scene,geo.box,gravel);
  for(const x of [-2.87,2.87]) for(const z of [6.25,2.0,-2.2,-6.7]) lantern(scene,x,.47,z,.79);
  const basin=shape(scene,geo.disk,0x647966,pond.x,.021,pond.z,pond.rx,pond.rz,1);
  basin.rotation.x=-Math.PI/2;
  world.updates.push(animatedWater(scene,pond.x,.031,pond.z,pond.rx-.22,pond.rz-.20,true));
  const rim=[], pads=[];
  for(let i=0;i<42;i++){
    const a=i*Math.PI*2/42;
    rim.push([pond.x+pond.rx*Math.cos(a),.075,pond.z+pond.rz*Math.sin(a),.31+rng()*.26,.15+rng()*.14,.32+rng()*.12,[0x9c8e80,0xb9a08b,0x8b9380][i%3],.12,a,.2]);
    if(i>17) continue;
    const rr=.21+rng()*.65;
    pads.push([pond.x+rr*(pond.rx-.3)*Math.cos(i*2.399),.044,pond.z+rr*(pond.rz-.22)*Math.sin(i*2.399),.24,.023,.18,0x839c61,0,i*.7,0]);
  }
  batch(scene,geo.leaf,rim);
  batch(scene,geo.leaf,pads);
  for(let i=0;i<pads.length;i++){
    const [x,y,z]=pads[i];
    if(i%3===0) continue;
    for(let j=0;j<6;j++){
      const a=j*Math.PI/3;
      shape(scene,geo.leaf,j%2?0xf4b2b8:0xf9cbd0,x+.088*Math.cos(a),y+.061,z+.088*Math.sin(a),.119,.046,.068).rotation.y=-a;
    }
  }
  gardenFlowers(scene,rng,1120,i=>{
    const side=i%2?-1:1;
    const x=side*(2.74+rng()*12.2);
    let z=8.9-rng()*17.8;
    if(side<0 && ((x-pond.x)/(pond.rx+.27))**2+((z-pond.z)/(pond.rz+.26))**2<1) z=.88+rng()*4.7;
    return [x,.012,z];
  },true);
}


function houseExterior(world) {
  const house=group(world.scene);
  const foundation=[0xada096,0xb7a497,0xaf978a,0xa58e85];
  box(house,0x8d6d62,0,.159,-23.9,22.35,.304,27.35);
  plankStone(house,0,-23.9,22.32,27.3,terrace,foundation);
  for(const [stepZ,y,w] of [[-9.30,.17,6.03],[-9.85,.33,5.76],[-10.32,.47,5.55]]) {
    plankStone(house,0,stepZ,w,.64,y,[0xb7a598,0xbaab9d,0xa88e81]);
  }
  for(const s of [-1,1]){
    box(house,plaster,s*6.41,2.35,wall.front,9.08,3.8,.39);
    box(house,trim,s*6.39,.66,wall.front+.234,9.02,.33,.119);
    for(const x of [4.20,6.57,9.12]) timberWindow(house,s*x,2.18,wall.front+.24);
    for(const x of [3.75,7.82,10.63]) column(house,s*x,terrace,-11.69,3.46,.97);
    box(house,teak,s*7.08,3.99,-11.69,7.5,.25,.31);
    for(let j=0;j<10;j++) {
      const x=s*(3.8+j*.69);
      box(house,trim,x,4.13,-11.4,.112,.225,.83);
    }
    roof(house,s*6.37,4.19,-13.0,10.37,8.65,2.06);
    gable(house,s*6.42,4.25,-9.93,3.40,1.33);
    for(const x of [4.1,7.83,10.0]) lantern(house,s*x,2.72,-11.85,.95);
    for(const x of [4.17,7.58]) flowerPot(house,s*x,terrace,-11.02,1.34);
    hangingChair(world,house,s*6.15,4.08,-12.43,s*.09);
  }
  for(const x of [-2.72,-1.97,1.97,2.72]){
    column(house,x,terrace,-10.54,3.78,x<0?1.16:1.12);
    column(house,x,terrace,-13.69,3.83,1.04);
  }
  box(house,teak,0,4.22,-10.62,6.63,.30,.37);
  box(house,trim,0,4.43,-10.52,6.70,.17,.28);
  roof(house,0,4.58,-12.06,7.42,5.78,1.62);
  box(house,plaster,0,4.70,-16.11,17.25,1.51,4.32);
  roof(house,0,5.39,-16.47,19.89,3.8,2.30);
  gable(house,0,5.50,-14.39,6.35,2.18);
  garland(house,0,3.61,-13.72,3.09,31);
  for(const x of [-1.91,1.91]) {
    lantern(house,x,2.72,-13.51,1.12);
    brassLamp(house,x*1.39,terrace,-11.18,1.02);
  }
  return house;
}

function courtyard(world, house, randomPlanter) {
  const {scene}=world;
  const courtZ=(wall.courtFront+wall.courtBack)/2;
  plankStone(house,0,courtZ,11.18,11.13,terrace+.011,[0x987b71,0xb09683,0xa48a78,0xa38a7a,0xb99b86]);
  for(const s of [-1,1]) {
    const x=s*7.91;
    roof(house,x,4.69,courtZ,6.94,12.78,1.88,'z');
    box(house,plaster,s*10.80,2.56,courtZ,.39,4.25,12.47);
    box(house,trim,s*10.56,.79,courtZ,.13,.56,12.31);
    for(const z of [-19.20,-21.94,-24.67,-27.45,-29.84]){
      column(house,s*4.99,terrace,z,4.00,1.05);
      column(house,s*9.95,terrace,z,4.00,.79);
      box(house,teak,s*7.81,4.42,z,5.65,.23,.22);
    }
    box(house,teak,s*4.99,4.53,courtZ,.27,.28,12.19);
    box(house,trim,s*4.91,4.24,courtZ,.15,.10,12.21);
    for(let j=0;j<23;j++) box(house,teak,s*5.17,4.57,-18.12-j*.54,.93,.17,.115);
    for(const z of [-20.76,-24.02,-27.71]){
      timberWindow(house,s*10.49,2.31,z,-s*Math.PI/2);
      lantern(house,s*4.86,3.22,z,.88);
      flowerPot(house,s*4.65,terrace,z-.38,1.15);
    }
    lounge(house,s*7.53,-22.26,-s*Math.PI/2);
    illustratedPanel(house,s*10.51,2.29,-25.82,-s*Math.PI/2);
    hangingChair(world,house,s*7.44,4.34,-27.16,-s*Math.PI/2);
    box(house,trim,s*5.35,terrace+.035,courtZ,.19,.076,11.26);
  }
  for(const z of [wall.courtFront,wall.courtBack]) {
    for(const x of [-4.93,-2.64,2.64,4.93]) column(house,x,terrace,z,3.75,.92);
    box(house,teak,0,4.31,z,10.22,.22,.30);
    for(let j=0;j<19;j++) box(house,trim,(j-9)*.52,4.49,z+.13,.11,.14,.65);
  }
  courtyardLight(house,courtZ);
  const {x,z,rx,rz}=planter;
  box(house,0xa08977,x,terrace+.13,z,rx*2,.26,rz*2);
  box(house,0x757953,x,terrace+.275,z,rx*2-.23,.041,rz*2-.24);
  for(const s of [-1,1]) {
    box(house,0xb29a84,x+s*(rx-.09),terrace+.29,z,.17,.13,rz*2);
    box(house,0xb29a84,x,terrace+.29,z+s*(rz-.09),rx*2,.13,.18);
  }
  tree(house,x,terrace+.22,z,3.60,false);
  gardenFlowers(house,random(1503),145,()=>[x+(randomPlanter()-.5)*2.45,terrace+.29,z+(randomPlanter()-.5)*2.98],true);
  rangoli(house,.91,terrace+.025,-24.34,.94);
  brassLamp(house,2.81,terrace,-24.5,1.14);
  brassLamp(house,-4.30,terrace,-24.49,.94);
  const bowl=group(house,2.36,terrace,-20.47);
  shape(bowl,geo.post,brass,0,.17,0,.35,.29,.35).rotation.z=Math.PI;
  shape(bowl,geo.pipe,0x695b4a,0,.323,0,.33,.027,.33);
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    shape(bowl,geo.leaf,i%3===0?0xf9d697:0xeb9c54,Math.cos(a)*.22,.344,Math.sin(a)*.22,.067,.033,.067);
  }
  const dust=particles(scene,819,210,[14,5.8,20,-15],[0xffdd92,0xffdca9,0xfff0cb]);
  world.updates.push(t=>{dust.material.uniforms.time.value=t;});
}

function courtyardLight(house,z) {
  const sunlight=glow(house,0xffcb83,.87,terrace+.027,z+.49,9.55,11.12,.21);
  sunlight.rotation.x=-Math.PI/2;
  const shadow=new T.MeshBasicMaterial({color:0x684537,transparent:true,opacity:.14,depthWrite:false});
  for (const x of [-4.99,4.99]) for(const columnZ of [-19.20,-21.94,-24.67,-27.45,-29.84]){
    const silhouette=shape(house,geo.disk,shadow,x+.63,terrace+.019,columnZ-1.12,.18,1.34,1);
    silhouette.rotation.set(-Math.PI/2,0,-.48);
  }
}

function library(house) {
  roof(house,0,4.65,-33.41,23.01,8.06,2.16);
  box(house,plaster,0,2.55,-37.48,22.0,4.2,.26);
  for(const s of [-1,1]){
    box(house,plaster,s*10.80,2.52,-33.26,.26,4.13,7.8);
    box(house,plaster,s*7.33,2.57,-30.08,7.34,4.22,.27);
    timberWindow(house,s*7.38,2.26,-29.88);
    illustratedPanel(house,s*5.51,2.35,-29.89,0);
    lounge(house,s*7.94,-33.45,s*Math.PI/2);
    lantern(house,s*4.07,2.53,-30.31,1.08);
  }
  box(house,teak,0,4.10,-30.10,8.62,.31,.36);
  for(const x of [-3.41,3.41]) column(house,x,terrace,-30.10,3.63,.90);
  garland(house,0,3.93,-29.90,6.06,47);
  const shelves=group(house,0,terrace,-36.82);
  for(const x of [-4.41,0,4.41]) bookcase(shelves,x,0,4.07,3.06);
  label(house,'OUR LITTLE LIBRARY',0,3.87,-36.39,3.25,'light');
  rangoli(house,0,terrace+.019,-34.85,1.13);
}

export function homeWorld() {
  const world=atmosphere('home');
  garden(world);
  const house=houseExterior(world);
  courtyard(world,house,random(832));
  library(house);
  return world;
}

