import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

const compiled = await build({
  entryPoints: ['main.js'],
  bundle: true,
  write: false,
  minify: true,
  target: ['chrome110','edge110','firefox115','safari17'],
  legalComments: 'inline'
});
const [shell,style] = await Promise.all(['shell.html','style.css'].map(file=>readFile(file,'utf8')));
const fonts = [
  ['DM Serif Text','400','@fontsource/dm-serif-text','dm-serif-text-latin-400-normal.woff2'],
  ['DM Sans','100 1000','@fontsource-variable/dm-sans','dm-sans-latin-wght-normal.woff2'],
];
const declarations = await Promise.all(fonts.map(async ([family,weight,pkg,name]) => {
  const font = await readFile('node_modules/'+pkg+'/files/'+name);
  return "@font-face{font-family:'"+family+"';font-style:normal;font-weight:"+weight+
    ";src:url(data:font/woff2;base64,"+font.toString('base64')+") format('woff2');font-display:swap}";
}));
const licenses = await Promise.all(['three',...fonts.map(font=>font[2])].map(pkg=>readFile('node_modules/'+pkg+'/LICENSE','utf8')));
const embeddedTracks = await Promise.all(['forest','beach','house','finale'].map(async name => {
  const mp3 = await readFile(new URL('./Soundtrack/'+name+'.mp3', import.meta.url));
  return '<script type="application/octet-stream" id="music-'+name+'">'+mp3.toString('base64')+'</script>';
}));
const script = compiled.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const result = shell.replace('/*GAME_STYLE*/',()=>declarations.join('\n')+'\n'+style)
  .replace('<!--MUSIC_ASSETS-->',()=>embeddedTracks.join('\n'))
  .replace('/*GAME_SCRIPT*/',()=>script);
await writeFile(new URL('../Play the Game.html', import.meta.url), result+'\n<!--\n'+licenses.join('\n\n')+'\n-->\n');

