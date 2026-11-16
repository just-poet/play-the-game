import * as T from 'three';
import { M, pet } from './art.js';
import { laneWidth, runningWorld, runningSpeed } from './worlds.js';
import { overlook, cafeInterior } from './rooms.js';
import { homeWorld, homeCanWalk, homeHeight, homeFinish } from './home.js';
import { lakeWorld } from './lake.js';
import { createMusic } from './music.js';

const $ = id => document.getElementById(id);
const game = $('game'), hud = $('hud'), guide = $('guide'), dialog = $('dialog');
const viewport = $('viewport'), pauseButton = $('pause'), touchControls = $('touch-controls');
const soundButton = $('sound'), desktopControls = $('desktop-controls');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const keys = new Set();
const routes = {
  forest: {name:'The enchanted forest'},
  beach: {name:'Sunset shore'}
};

let renderer;
try {
  renderer = new T.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
} catch {
  dialog.hidden = false;
  $('chapter').hidden = true;
  $('line').textContent = 'The 3D world couldn’t open.';
  $('detail').textContent = 'Open this file in a browser with WebGL 2 and hardware acceleration enabled.';
  soundButton.hidden = true;
}
if (renderer) main();

function audio() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  let context, master, enabled = true;
  function note(freq, when, duration, volume, attack=.12) {
    if (!context || !enabled) return;
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when+attack);
    gain.gain.exponentialRampToValueAtTime(.0001, when+duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(when);
    oscillator.stop(when+duration+.015);
  }
  return {
    unlock() {
      if (!enabled || !Audio) return;
      if (!context) {
        context = new Audio();
        master = context.createGain();
        master.gain.value = .25;
        master.connect(context.destination);
      }
      if (context.state === 'suspended') context.resume().catch(()=>{});
    },
    toggle() {
      enabled = !enabled;
      if (master) master.gain.setTargetAtTime(enabled?.25:.0001,context.currentTime,.05);
      this.unlock();
      return enabled;
    },
    play(kind) {
      if (!context || !enabled) return;
      const now=context.currentTime;
      const sequence={jump:[523.25,698.46], bump:[220,174.61], kiss:[523.25,659.25,783.99,1046.50], arrive:[392,523.25,659.25,783.99], lake:[261.63,392,523.25,659.25,783.99,1046.5]}[kind];
      if (sequence) sequence.forEach((f,i)=>note(f,now+i*.105,.42,.078,.025));
    }
  };
}

function main() {
  let resolution = Math.min(devicePixelRatio,1.45), slowFrames = 0;
  renderer.setPixelRatio(resolution);
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.02;
  renderer.outputColorSpace=T.SRGBColorSpace;
  viewport.append(renderer.domElement);
  const camera = new T.PerspectiveCamera(52,1,.08,171);
  const gaze = new T.Vector3(), targetEye = new T.Vector3(), targetGaze = new T.Vector3();
  const player = {lane:1,x:0,z:0,y:0,jump:0,dist:0};
  const soundtrack = audio(), cache = new Map();
  const music = createMusic($('stage-music'), $('lyrics'));
  let world, worldName, pup, hope, mode, beforePause, snap = true, time = 0, prevTime, currentHit;
  let libraryReached = false, homeRevealed = false, trailHint = '', nextObstacle = 0, kissesAt = -10;
  let walking = false, transition = false;
  const focusKeys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD','Space'];
  const runTools = '<span><kbd>←</kbd> <kbd>→</kbd> Move</span><span><kbd>Space</kbd> Jump</span><span><kbd>Esc</kbd> Pause</span>';
  const walkTools = '<span><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or arrow keys to walk</span><span><kbd>Esc</kbd> Pause</span>';

  function resize() {
    camera.aspect = innerWidth / Math.max(innerHeight,1);
    camera.fov = camera.aspect < .78 ? 64 : 51;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  }
  addEventListener('resize',resize);
  resize();

  function setWorld(name) {
    const create={forest:()=>runningWorld('forest'),beach:()=>runningWorld('beach'),overlook,cafe:cafeInterior,home:homeWorld,lake:lakeWorld};
    if (!cache.has(name)) {
      const next = create[name]();
      const characterParent = next.boat ?? next.scene;
      next.pup = pet(characterParent);
      next.hope = pet(characterParent,'cat');
      cache.set(name,next);
    }
    world = cache.get(name);
    ({pup,hope}=world);
    worldName = name;
    snap = true;
  }

  function setMode(value) {
    mode = value;
    music.setPaused(mode==='paused');
    game.dataset.mode = mode;
    game.dataset.scene = worldName;
    const active = ['run','explore'].includes(value);
    dialog.hidden = true;
    delete dialog.dataset.opening;
    pauseButton.hidden = !active;
    hud.hidden = value !== 'run' && value !== 'hit';
    $('intro-footer').hidden = value !== 'intro';
    $('lake-note-button').hidden = value !== 'lake-view';
    touchControls.hidden = !active;
    desktopControls.hidden = !active;
    guide.hidden = value !== 'explore' || !trailHint;
    $('up-control').setAttribute('aria-label',value==='run'?'Jump':'Forward');
    desktopControls.innerHTML = value==='run' ? runTools : walkTools;
    keys.clear();
  }

  function prompt(chapter, message, detail, options) {
    $('chapter').textContent = chapter;
    $('chapter').hidden = !chapter;
    $('line').textContent = message;
    $('detail').textContent = detail;
    $('detail').hidden = !detail;
    const buttons = options.map(([label,answer])=>{
      const button = document.createElement('button');
      button.textContent = label;
      button.addEventListener('click',()=>{
        if (transition) return;
        soundtrack.unlock();
        music.resume();
        answer();
      });
      return button;
    });
    $('choices').replaceChildren(...buttons);
    dialog.hidden = false;
  }

  function cut(action) {
    const screen=$('fade');
    if (reduced) {
      action();
      return;
    }
    transition=true;
    screen.classList.add('active');
    setTimeout(()=>{
      action();
      screen.classList.remove('active');
      transition=false;
    },265);
  }

  function setHint(message) {
    trailHint=message;
    guide.textContent=message;
    guide.hidden=mode!=='explore'||!message;
  }

  function startRun(name) {
    setWorld(name);
    Object.assign(player,{lane:1,x:0,z:0,y:0,jump:0,dist:0});
    nextObstacle=0;
    currentHit=undefined;
    kissesAt=-10;
    pup.root.visible=true;
    hope.root.visible=name==='beach';
    hope.root.position.set(3.25,0,.55);
    pup.root.rotation.y=0;
    hope.root.rotation.y=0;
    music.start(name);
    setMode('run');
    $('location').textContent=routes[name].name;
    $('progress').max=world.length;
    updateProgress();
  }

  function introduce() {
    music.start();
    setWorld('forest');
    setMode('intro');
    pup.root.visible=true;
    pup.root.position.set(innerWidth/innerHeight<.78?.55:2.13,0,-1.4);
    pup.root.rotation.y=Math.PI+.20;
    pup.root.scale.setScalar(1);
    hope.root.visible=false;
    dialog.dataset.opening='';
    prompt('a little adventure for youuuu','heyyyy sweetheart wanna play a  game ?',
      'followww theee trailll pookie',
      [['Let’s play ✦',()=>startRun('forest')]]);
  }

  function updateProgress() {
    const meters = Math.floor(player.dist);
    $('meters').textContent = meters+' / '+world.length+' m';
    $('progress').value = meters;
  }

  function obstacleHit(obstacle) {
    currentHit=obstacle;
    setMode('hit');
    soundtrack.play('bump');
    const run=worldName;
    prompt('A little tumble','Oops, a hurdle!',
      'Restart this stretch, or send Eugene some kisses and keep going.',
      [['Give 10 billion kisses to Eugene ♡',()=>{
        while(nextObstacle<world.obstacles.length && world.obstacles[nextObstacle].s<=currentHit.s+.01) nextObstacle++;
        kissesAt=time;
        soundtrack.play('kiss');
        setMode('run');
      }],['Restart',()=>startRun(run)]]);
  }

  function arrive() {
    soundtrack.play('arrive');
    if (worldName==='forest') {
      setMode('hope');
      snap=true;
      pup.root.position.set(-.30,0,-399.17);
      pup.root.rotation.y=2.85;
      hope.root.position.set(1.40,0,-400.08);
      hope.root.visible=true;
      hope.root.rotation.y=3.49;
      prompt('Hope','Hiiii sweetheart ! lets continue the journey together ?',
        'i willll runnn beside youuu along the shoreee',
        [['Run with Hope ✦',()=>cut(()=>startRun('beach'))]]);
    } else {
      cut(()=>{
        setWorld('overlook');
        setMode('lookout');
        pup.root.position.set(.40,.10,5.45);
        hope.root.position.set(2.03,.10,5.00);
        pup.root.rotation.y=2.72;
        hope.root.rotation.y=3.2;
        pup.root.visible=hope.root.visible=true;
        prompt('The cliffside café','Wanna see our cafe ?',
          'The café sits above the sea at the end of the trail.',
          [['Go inside ✦',()=>cut(enterCafe)]]);
      });
    }
  }

  function enterCafe() {
    libraryReached=false;
    enterPlace('cafe',5.04);
    setHint('Walk through the café to the library.');
  }

  function enterPlace(name,z) {
    setWorld(name);
    Object.assign(player,{x:0,y:0,z});
    pup.root.position.set(0,name==='cafe'?.09:0,z);
    hope.root.position.set(1.42,name==='cafe'?.09:0,z-.75);
    pup.root.rotation.y=hope.root.rotation.y=0;
    pup.root.scale.setScalar(1);
    pup.root.visible=hope.root.visible=true;
    setMode('explore');
  }

  function enterHome() {
    music.start('house');
    homeRevealed=false;
    enterPlace('home',8.65);
    setHint('Follow Hope through the courtyard to the library.');
  }

  function houseInvitation() {
    libraryReached=true;
    setMode('invitation');
    hope.root.position.set(1.51,.09,player.z-.92);
    hope.root.rotation.y=3.01;
    soundtrack.play('arrive');
    prompt('Hope','Wanna see a house ?','',
      [['Follow Hope ✦',()=>cut(enterHome)],['Stay a little longer',()=>{
        setMode('explore');
        setHint('');
      }]]);
  }

  function ending() {
    homeRevealed=true;
    setMode('finale');
    pup.root.rotation.y=2.93;
    hope.root.position.set(player.x+1.41,homeHeight(player.z-.61),player.z-.61);
    hope.root.rotation.y=2.91;
    soundtrack.play('arrive');
    prompt('A note from Eugene','Ammu, finally you are hereee ... ykkk i missed you alot and i love youuuu so much .',
      '',[['Continue',secretInvitation],['Keep exploring ♡',()=>{setMode('explore');setHint('');}],['Play again',()=>cut(introduce)]]);
  }

  function secretInvitation() {
    setMode('secret');
    prompt('', ' lets go for a secret ? ', '', [['Continue',()=>cut(enterLake)], ['Back',ending]]);
  }

  function enterLake() {
    setWorld('lake');
    pup.root.position.set(1.13,.505,-.10);
    hope.root.position.set(-1.16,.505,-.055);
    pup.root.rotation.y=2.06;
    hope.root.rotation.y=-2.14;
    soundtrack.play('lake');
    showLakeNote();
  }

  function showLakeNote() {
    setMode('lake-note');
    prompt('From Eugene','Ammu, you are my new dream and I love you soooooo muchhh . you are soooo inspiring , cute , adorableeee, greattt writerr and i love you alot . every moment with you is special  . ',
      '',[['Take in the view',()=>{
        setMode('lake-view');
        $('lake-note-button').focus();
      }],['Play again',()=>cut(introduce)]]);
  }

  $('lake-note-button').addEventListener('click',showLakeNote);

  function pause() {
    if (mode==='paused') {
      setMode(beforePause);
      return;
    }
    if (!['run','explore'].includes(mode) || transition) return;
    beforePause=mode;
    setMode('paused');
    const options=[['Continue playing',()=>setMode(beforePause)]];
    if (worldName==='cafe'&&libraryReached) options.push(['Follow Hope to the house',()=>cut(enterHome)]);
    if (worldName==='home'&&homeRevealed) options.push(['Continue to the secret',secretInvitation]);
    options.push(['Return to the beginning',()=>cut(introduce)]);
    prompt('','Taking a little break?','',options);
  }

  function keyDown(code) {
    if (keys.has(code)) return;
    keys.add(code);
    if (mode==='run') {
      if (code==='ArrowLeft'||code==='KeyA') player.lane=Math.max(0,player.lane-1);
      if (code==='ArrowRight'||code==='KeyD') player.lane=Math.min(2,player.lane+1);
      if (['ArrowUp','KeyW','Space'].includes(code) && player.y===0 && player.jump===0) {
        player.jump=6.2;
        soundtrack.play('jump');
      }
    }
  }

  addEventListener('keydown',event=>{
    if (event.code==='Escape') {
      if (!event.repeat) pause();
    } else if (focusKeys.includes(event.code) && ['run','explore'].includes(mode)) {
      event.preventDefault();
      keyDown(event.code);
    }
  });
  addEventListener('keyup',event=>keys.delete(event.code));
  addEventListener('blur',()=>keys.clear());
  for (const button of touchControls.querySelectorAll('button')) {
    const key = button.dataset.key;
    button.addEventListener('pointerdown',event=>{
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      keyDown(key);
    });
    for (const type of ['pointerup','pointercancel','lostpointercapture']) {
      button.addEventListener(type,()=>keys.delete(key));
    }
  }
  pauseButton.addEventListener('click',pause);
  soundButton.addEventListener('click',()=>{
    const on=soundtrack.toggle();
    music.setMuted(!on);
    soundButton.textContent=on?'♫':'♪̸';
    soundButton.setAttribute('aria-pressed',String(on));
    soundButton.setAttribute('aria-label',on?'Mute sound':'Enable sound');
  });

  function playRun(dt) {
    const oldDist=player.dist, oldX=player.x, oldY=player.y;
    player.dist=Math.min(world.length,player.dist+runningSpeed(worldName,oldDist)*dt);
    const goal=(player.lane-1)*laneWidth;
    player.x=M.damp(player.x,goal,11,dt);
    if (player.jump!==0 || player.y>0) {
      player.y+=player.jump*dt;
      player.jump-=17.3*dt;
      if (player.y<=0) player.y=player.jump=0;
    }
    const obstacles=world.obstacles;
    while (nextObstacle<obstacles.length) {
      const o=obstacles[nextObstacle];
      if (o.s+.72<oldDist) {
        nextObstacle++;
        continue;
      }
      break;
    }
    for(let i=nextObstacle;i<obstacles.length;i++) {
      const o=obstacles[i];
      if(o.s-.65>player.dist) break;
      if(o.s+.65<oldDist) continue;
      const t=M.clamp((o.s-oldDist)/Math.max(.0001,player.dist-oldDist),0,1);
      if (Math.abs(M.lerp(oldX,player.x,t)-o.x)<.98 && M.lerp(oldY,player.y,t)<o.height) {
        obstacleHit(o);
        break;
      }
    }
    player.z=-player.dist;
    pup.root.position.set(player.x,player.y,player.z);
    pup.root.rotation.y=M.damp(pup.root.rotation.y,M.clamp((player.x-goal)*.32,-.37,.37),9,dt);
    if (worldName==='beach') {
      hope.root.position.set(3.48+.12*Math.sin(time*3.8),.034*Math.sin(time*4.2),player.z+.54+.20*Math.sin(time*1.9));
    }
    updateProgress();
    if (mode==='run' && player.dist>=world.length) arrive();
  }

  function walk(dt) {
    const held=(...k)=>k.some(code=>keys.has(code));
    const moveX=Number(held('ArrowRight','KeyD'))-Number(held('ArrowLeft','KeyA'));
    const moveZ=Number(held('ArrowDown','KeyS'))-Number(held('ArrowUp','KeyW'));
    walking=Boolean(moveX||moveZ);
    const amount=3.65*dt/(moveX&&moveZ?Math.SQRT2:1);
    let x=player.x+moveX*amount, z=player.z+moveZ*amount;
    if (worldName==='cafe') {
      x=M.clamp(x,-6.37,6.37);
      z=M.clamp(z,-20.6,5.59);
      if (Math.abs(x)>2.53 && z>-8.42 && z<-7.39) z=player.z>-7.90?-7.39:-8.42;
      const tableRows=z>-8?[2.95,-.55,-4.2]:[-12.1,-17.5];
      for(const row of tableRows) {
        if (Math.abs(z-row)<.62 && Math.abs(Math.abs(x)-4.43)<1.24) {
          if (Math.abs(player.z-row)>=.62) z=player.z;
          if (Math.abs(Math.abs(player.x)-4.43)>=1.24) x=player.x;
        }
      }
    } else {
      if(!homeCanWalk(x,player.z)) x=player.x;
      if(!homeCanWalk(x,z)) z=player.z;
    }
    player.x=x;
    player.z=z;
    player.y=worldName==='cafe'?.09:homeHeight(z);
    pup.root.position.set(x,player.y,z);
    if (walking) {
      const heading=Math.atan2(-moveX,-moveZ);
      const difference=Math.atan2(Math.sin(heading-pup.root.rotation.y),Math.cos(heading-pup.root.rotation.y));
      pup.root.rotation.y+=difference*(1-Math.exp(-11*dt));
    }
    if(mode==='explore') {
      const home=worldName==='home';
      const hz=home?Math.max(z-1.45,-35.6):Math.max(z-.92,-20.57);
      const lead=home&&Math.abs(hz+14)<.68?M.clamp(x+1.24,-1.16,1.16):M.clamp(x+1.34,-8.8,8.8);
      const hx=home&&!homeCanWalk(lead,hz)?x:lead;
      const hy=home?homeHeight(hz):.09;
      const offsetX=hx-hope.root.position.x, offsetZ=hz-hope.root.position.z;
      hope.root.position.x=M.damp(hope.root.position.x,hx,2.8,dt);
      hope.root.position.z=M.damp(hope.root.position.z,hz,2.8,dt);
      hope.root.position.y=M.damp(hope.root.position.y,hy,8,dt);
      if (Math.hypot(offsetX,offsetZ)>.13) {
        const heading=Math.atan2(-offsetX,-offsetZ);
        const diff=Math.atan2(Math.sin(heading-hope.root.rotation.y),Math.cos(heading-hope.root.rotation.y));
        hope.root.rotation.y+=diff*(1-Math.exp(-7*dt));
      }
      if(worldName==='cafe' && !libraryReached && z<-16.45) houseInvitation();
      if(worldName==='home' && !homeRevealed && homeFinish(x,z)) ending();
    }
  }

  function aim(dt) {
    switch(worldName) {
    case 'forest':
      if (mode==='intro') {
        const mobile=camera.aspect<.78;
        targetEye.set(mobile?-1.4:-.55,2.38,5.25);
        targetGaze.set(mobile?.14:-.71,2.12,-5.87);
        break;
      }
      if (mode==='hope') {
        targetEye.set(.44,2.35,-394.63);
        targetGaze.set(.13,1.1,-401.1);
        break;
      }
    // The chase camera is shared by the forest and the beach.
    case 'beach': {
      const beach=worldName==='beach';
      const portrait=camera.aspect<.78;
      const pullback=portrait?Math.min(14,Math.max(7.8,5.28/camera.aspect)):5.8;
      targetEye.set(player.x*(portrait?.18:.29)+(beach?.81:0),2.87+player.y*.18+(portrait?.26:0),player.z+pullback);
      targetGaze.set(player.x*(portrait?.18:.32)+(beach?(portrait?.88:1.58):0),portrait?1.42:.99,player.z-9.8);
      break;
    }
    case 'overlook':
      targetEye.set(9.9,8.54,17.46);
      targetGaze.set(-.52,2.79,-6.4);
      break;
    case 'cafe':
      targetEye.set(M.clamp(player.x*.77+.31,-5.7,5.7),3.14,Math.min(9.75,player.z+4.62));
      targetGaze.set(player.x*.82+.14,1.45,player.z-4.85);
      break;
    case 'lake': {
      const portrait=camera.aspect<.85;
      const drift=reduced?0:Math.sin(time*.22)*.21;
      targetEye.set(portrait?2.63:.27+drift,portrait?3.0:3.12,portrait?14.5:10.70);
      targetGaze.set(portrait?2.99:.09+drift*.21,portrait?1.59:1.86,portrait?-4.2:-6.8);
      break;
    }
    case 'home': {
      const z=player.z, indoors=z<-12.4;
      const distance=indoors?(mode==='finale'?4.34:4.12):7.6;
      const eyeZ=z+distance;
      const eyeX=Math.abs(eyeZ+14)<.78?M.clamp(player.x,-1.31,1.31):player.x*.85;
      const height=indoors?(z<-18.3&&z>-29.2?3.43:2.96):4.3;
      const pan=['finale','secret'].includes(mode)&&camera.aspect>=.78?.76:0;
      targetEye.set(eyeX-pan,height,eyeZ);
      targetGaze.set(player.x*.83-pan,indoors?2.0:2.81,z-(indoors?4.3:8.1));
      break;
    }
    }
    if(snap) {
      camera.position.copy(targetEye);
      gaze.copy(targetGaze);
      snap=false;
    } else {
      camera.position.lerp(targetEye,1-Math.exp(-9*dt));
      gaze.lerp(targetGaze,1-Math.exp(-8*dt));
    }
    camera.lookAt(gaze);
    world.sky.position.copy(camera.position);
    world.sky.scale.setScalar(world.skyScale ?? .58);
  }

  function frame(now) {
    const elapsed=prevTime===undefined?1/60:(now-prevTime)/1000;
    const dt=M.clamp(elapsed,0,.090);
    slowFrames=elapsed>.058?slowFrames+1:Math.max(0,slowFrames-1);
    if(slowFrames>=14 && resolution>.73) {
      resolution=Math.max(.73,resolution*.83);
      renderer.setPixelRatio(resolution);
      slowFrames=0;
    }
    prevTime=now;
    time+=dt;
    if (!transition && mode==='run') playRun(dt);
    if (!transition && mode==='explore') walk(dt);
    const runStride=mode==='run' ? (player.y>.12?.26:1) : 0;
    const walkStride=mode==='explore' && walking ? .67 : 0;
    const inBoat=worldName==='lake';
    pup.pose(time,runStride||walkStride,inBoat);
    hope.pose(time+.20,runStride ? 1 : walkStride,inBoat);
    if(time-kissesAt<2.8 && mode==='run') {
      guide.textContent='10,000,000,000 kisses sent to Eugene ♡';
      guide.hidden=false;
    } else if (mode==='run') {
      guide.hidden=true;
    }
    for (const update of world.updates) update(time);
    music.updateLyrics();
    aim(dt);
    renderer.render(world.scene,camera);
    requestAnimationFrame(frame);
  }

  introduce();
  requestAnimationFrame(frame);
}


