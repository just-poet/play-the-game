import * as T from 'three';
import { geo, mat, random, group, shape, box, ball, rod, batch, glow } from './art.js';
import { gardenFlowers } from './worlds.js';

const ink=0x26383e, sage=0x59766a, trim=0xe7caa5, wine=0x9a506a;
const stone=0xe0b48e, slate=0x454661, warm=mat(0xffd198,1.5);

export function bistroTerrace(parent) {
  const paving=[];
  const rng=random(371);
  for(let zi=0;zi<28;zi++) for(let xi=0;xi<31;xi++) {
    const x=-9.55+xi*.636+(zi%2)*.26,z=-9.4+zi*.695;
    paving.push([x,.055,z,.599,.08,.660,[0xc2a2a0,0xc8a99d,0xd2ad98,0xbca1a3][Math.floor(rng()*4)],0,(rng()-.5)*.036,0]);
  }
  batch(parent,geo.box,paving);
  for(let i=0;i<27;i++){
    const d=-9.5+i*.72;
    for(const [x,z,a] of [[9.75,d,Math.PI/2],[d,-9.73,0]]){
      const f=group(parent,x,0,z);
      f.rotation.y=a;
      rod(f,ink,[0,.12,0],[0,1.24,0],.034,geo.pipe);
      const curl=new T.TorusGeometry(.185,.024,6,17,Math.PI*1.68);
      shape(f,curl,ink,0,.68,0).rotation.z=d*.46;
      if(i%5===0) {
        box(f,ink,0,.67,0,.12,1.11,.12);
        ball(f,trim,0,1.27,0,.082,.077,.082);
      }
    }
  }
  for(const y of [.23,1.17]){
    box(parent,ink,9.75,y,0,.074,.077,19.6);
    box(parent,ink,0,y,-9.73,19.6,.077,.074);
  }
}

function shutter(parent,x,y,z,w,h) {
  box(parent,sage,x,y,z,w,h,.13);
  const slats=[];
  for(let i=0;i<10;i++){
    slats.push([x,y+(i-4.5)*h/11,z+.087,w*.85,.033,.071,0x7e9982,0,0,0]);
  }
  batch(parent,geo.box,slats);
}

export function bistroFacade(parent,paintedWindow,lantern,slopedRoof,label) {
  const front=4.19;
  box(parent,stone,0,2.46,0,11.1,4.88,8.18);
  box(parent,trim,0,.39,front,11.24,.62,.19);
  box(parent,trim,0,4.67,front,11.42,.20,.28);
  for(const x of [-5.43,5.43]){
    for(let i=0;i<8;i++) box(parent,i%2?trim:0xd4a789,x,1.02+i*.47,front,.42+i%2*.18,.39,.19);
  }
  for(const x of [-3.18,3.18]) {
    paintedWindow(parent,x,2.53,front+.06,0,1.13);
    for(const s of [-1,1]) shutter(parent,x+s*1.33,2.43,front+.17,.42,2.17);
    box(parent,sage,x,1.02,front+.28,2.29,.27,.44);
    gardenFlowers(parent,random(x<0?11:81),47, i=>[x+(i/47-.5)*2.12,1.09,front+.19+(i%3)*.095],true);
  }
  for(const z of [-2.64,0,2.64]) paintedWindow(parent,5.61,2.53,z,Math.PI/2,.92);
  const door=0x39584e;
  box(parent,door,0,1.53,front+.08,1.68,2.91,.18);
  for(const x of [-.46,.46]){
    box(parent,0x697d74,x,1.96,front+.19,.63,1.47,.062);
    for(const d of [-.17,.17]) box(parent,door,x+d,2.04,front+.23,.028,1.25,.047);
    box(parent,door,x,2.10,front+.23,.55,.049,.044);
    ball(parent,0xd6a25e,x*.35,1.44,front+.24,.060,.056,.035);
  }
  const awning=group(parent,0,3.47,front+.04);
  const stripes=[];
  const width=3.52;
  for(let i=0;i<11;i++){
    const x=(i-5)*width/11;
    const cloth=i%2?wine:0xffdbbd;
    stripes.push([x,0,.75,width/11+.005,.064,1.56,cloth,.22,0,0]);
    stripes.push([x,-.27,1.50,width/11+.005,.19,.046,cloth]);
    shape(awning,geo.ball,cloth,x,-.347,1.502,width/22,.076,.027);
  }
  batch(awning,geo.box,stripes);
  for(const x of [-1.78,1.78]) rod(awning,ink,[x,.05,.11],[x,-.33,1.51],.026,geo.pipe);
  label(parent,'OUR LITTLE CAFÉ',0,4.21,front+.20,3.08,'light');
  for(const x of [-1.25,1.25]) {
    lantern(parent,x,2.38,front+.39,.88);
    glow(parent,0xffb96b,x,2.38,front+.40,1.2,1.55,.15);
  }
  slopedRoof(parent,0,4.81,0,12.14,9.28,3.23,slate,[0x53576e,0x696980,0x474d68]);
  box(parent,0xb7837a,-3.01,6.56,-1.78,.73,2.69,.77);
  box(parent,0xe0aa96,-3.01,7.92,-1.78,.93,.19,.95);
  const frame=new T.Shape();
  frame.moveTo(-5.44,0);frame.lineTo(0,2.99);frame.lineTo(5.44,0);frame.closePath();
  shape(parent,new T.ShapeGeometry(frame),0xc89182,0,4.81,4.37);
  const dormer=group(parent,0,5.87,4.45);
  ball(dormer,trim,0,0,0,.58,.66,.18);
  shape(dormer,geo.disk,0x4e6e68,0,0,.178,.47,.53,1);
  for(const a of [0,Math.PI/2]) box(dormer,trim,0,0,.19,.038,.98,.037).rotation.z=a;
  for(const s of [-1,1]) rod(dormer,slate,[0,.85,.12],[s*.77,.33,.12],.070,geo.pipe);
}

export function bistroTiles(parent) {
  const tiles=[];
  for(let zi=0;zi<21;zi++) for(let xi=0;xi<21;xi++) {
    const x=(xi-10)*.691,z=5.68-zi*.663;
    const black=(xi+zi)%2;
    tiles.push([x,.051,z,.674,.061,.651,black?[0x6e6269,0x6b5d64,0x776972][(xi+2*zi)%3]:[0xdcc1a2,0xe4c8a6,0xe0c1a3][(xi+2*zi)%3]]);
  }
  batch(parent,geo.box,tiles);
}

export function bistroChandelier(parent, x, z) {
  const base=group(parent,x,4.65,z);
  rod(base,ink,[0,.74,0],[0,-.02,0],.033,geo.pipe);
  const ring=shape(base,new T.TorusGeometry(.44,.036,9,30),ink,0,0,0);
  ring.rotation.x=Math.PI/2;
  for(let i=0;i<6;i++) {
    const a=i*Math.PI/3,px=Math.cos(a)*.45,pz=Math.sin(a)*.45;
    rod(base,0xb98b55,[0,.28,0],[px,-.035,pz],.019,geo.pipe);
    shape(base,geo.pipe,0xc8985e,px,-.058,pz,.104,.082,.104);
    ball(base,warm,px,-.174,pz,.087,.123,.087);
  }
  glow(base,0xffae61,0,-.13,.02,2.7,1.8,.22);
}

export function bistroPanel(parent, x, y, z) {
  box(parent,0x614d54,x,y,z,1.36,1.21,.065);
  box(parent,0xe4b886,x,y,z+.049,1.21,1.08,.047);
  box(parent,0x9eb4a6,x,y,z+.077,1.01,.87,.019);
  const sun=shape(parent,geo.disk,mat(0xe8c184,.2),x+.24,y+.19,z+.09,.132,.132,1);
  sun.rotation.z=.15;
  for(let i=0;i<5;i++){
    const hill=shape(parent,geo.gem,[0x9a8392,0x8b927e,0x768f80][i%3],x+(i-2)*.176,y-.18,z+.096,.218,.13+i%3*.042,.026);
    hill.rotation.z=(i-2)*.14;
  }
}

