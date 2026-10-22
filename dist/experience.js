'use strict';
/** Lisibilité et ambiances : aucun changement aux règles de taille.
 * Les repères se basent sur les mêmes fonctions que les vraies captures. */
const SCENES=[
  {name:'JARDIN DE CORAIL',kind:'coral',water:['#197d87','#105367','#082f46'],stone:['#698f85','#386266','#163e50'],sky:['#6cd4e4','#dbf5d0'],accent:'#85efbc'},
  {name:'LA CÔTE DES BOUÉES',kind:'buoy',water:['#168bb0','#155c7b','#10334e'],stone:['#537f90','#315b76','#193951'],sky:['#68c8f0','#e5f8e6'],accent:'#f6ad80'},
  {name:'LE CIMETIÈRE MARIN',kind:'wreck',water:['#467d80','#285865','#102e42'],stone:['#8e7d68','#4c6267','#263d4d'],sky:['#94bdc6','#ece4c1'],accent:'#e6b77d'},
  {name:'LES FORÊTS DE LAMINAIRES',kind:'current',water:['#157b77','#0c4d55','#082e42'],stone:['#588c72','#2f6058','#193f4b'],sky:['#6bbebc','#d0ecd5'],accent:'#83e6c7'},
  {name:'LES CHEMINÉES DES ABYSSES',kind:'vent',water:['#33476c','#222e50','#101e36'],stone:['#685a78','#3a3b5a','#202c43'],sky:['#7d8fab','#c2cdde'],accent:'#bcb3ff'},
  {name:'LA CITÉ ENGLOUTIE',kind:'ruins',water:['#3c728b','#214666','#102945'],stone:['#9a8d73','#5b6770','#2f4457'],sky:['#e3b476','#f7e4b0'],accent:'#ffe097'}
];
const huntingAids={enabled:true,target:null,scenery:[]};
try{huntingAids.enabled=localStorage.getItem('abyss-hunt-aids')!=='0';}catch{}
function preySignal(entity,kind='fish'){
  if(kind==='boat')return canEatBoat(entity)?'edible':'grow';
  if(canEatPrey(entity))return 'edible';
  return kind==='enemy'?'danger':'grow';
}
function closestEntity(objects,accept=()=>true){
  let nearest=null,best=Infinity;
  for(const entity of objects){if(!accept(entity))continue;const p=entity.pos||entity,dx=p.x-game.player.pos.x,dy=p.y-game.player.pos.y,d=dx*dx+dy*dy;if(d<best){nearest=entity;best=d;}}
  return nearest;
}
function targetFor(entity,kind,label,detail){return entity?{entity,pos:entity.pos||entity,kind,label,detail}:null;}
function foodTarget(){return targetFor(closestEntity(game.fish,f=>canEatPrey(f)),'food','PROIE COMESTIBLE','Chasse les poissons plus petits que toi');}
function objectiveTarget(){
  if(!['playing','paused'].includes(game.state)||game.sandbox)return null;
  if(game.health<28){const food=foodTarget();if(food){food.detail='Vitalité faible · mange pour récupérer';return food;}}
  if(!campaign.active)return arcade.missionDone.every(Boolean)?null:foodTarget();
  const needed=key=>currentLevel().goals.some(([k,n])=>k===key&&goalValue(k)<n);
  if(needed('yachts')){
    const yacht=closestEntity(arcade.boats,b=>b.type===2);
    if(yacht&&!canEatBoat(yacht)){const food=foodTarget();if(food){food.label='GRANDIS POUR LE YACHT';return food;}}
    return targetFor(yacht,'yacht','YACHT À DÉVORER','Rejoins la surface et approche sa coque');
  }
  if(needed('boats')){
    const edible=closestEntity(arcade.boats,b=>canEatBoat(b));
    if(!edible){const food=foodTarget();if(food){food.label='GRANDIS POUR LES BATEAUX';return food;}}
    const boat=edible||closestEntity(arcade.boats);
    return targetFor(boat,'boat','BATEAU À DÉVORER',boat&&canEatBoat(boat)?'Rejoins la surface et approche sa coque':'Grandis d’abord avec les petits poissons');
  }
  if(needed('treasures'))return targetFor(closestEntity(arcade.treasures),'treasure','COFFRE À RÉCUPÉRER','Approche le coffre pour le ramasser');
  if(needed('jumps'))return {kind:'surface',pos:new Vec(game.player.pos.x,game.waterY),label:game.player.airborne?'RETOUR DANS L’EAU':game.player.pos.y<=game.waterY+170?'SAUTE · J OU ↟':'REMONTE À LA SURFACE',detail:game.player.airborne?'Le saut est compté en traversant la surface':'Appuie sur J ou SAUT près de la surface'};
  if(needed('prey')||needed('score')){
    if(['snake','leader'].includes(game.mode))return {kind:'hint',pos:null,label:'REPRENDS LA CHASSE',detail:'Appuie sur N pour quitter le suivi de leader'};
    return foodTarget();
  }
  const remaining=currentLevel().goals.find(([key,n])=>key==='time'&&game.time<n);
  return remaining?{kind:'time',pos:null,label:'RESTE EN VIE',detail:`Encore ${Math.max(0,Math.ceil(remaining[1]-game.time))} secondes · mange pour survivre`}:null;
}
/** Projection d'une direction sur un rectangle de jeu qui évite les HUD.
 * Entrées en pixels écran : la fonction reste valable à tout zoom. */
function compassGeometry(source,target,w,h){
  const bounds={left:32,right:w-32,top:Math.min(w<=500?290:225,h*.4),bottom:h-Math.min(175,h*.3)};
  const inside=target.x>=bounds.left&&target.x<=bounds.right&&target.y>=bounds.top&&target.y<=bounds.bottom;
  const origin={x:clamp(source.x,bounds.left+1,bounds.right-1),y:clamp(source.y,bounds.top+1,bounds.bottom-1)};
  const dx=target.x-origin.x,dy=target.y-origin.y,angle=Math.atan2(target.y-source.y,target.x-source.x);
  if(inside)return {x:target.x,y:target.y,angle,edge:false,bounds};
  const tx=dx>0?(bounds.right-origin.x)/dx:dx<0?(bounds.left-origin.x)/dx:Infinity;
  const ty=dy>0?(bounds.bottom-origin.y)/dy:dy<0?(bounds.top-origin.y)/dy:Infinity;
  const t=Math.max(0,Math.min(tx,ty));
  return {x:clamp(origin.x+dx*(Number.isFinite(t)?t:0),bounds.left,bounds.right),y:clamp(origin.y+dy*(Number.isFinite(t)?t:0),bounds.top,bounds.bottom),angle,edge:true,bounds};
}
function updateHuntingHUD(){
  const active=['playing','paused'].includes(game.state),enabled=active&&huntingAids.enabled;
  show('assistOn',huntingAids.enabled);show('assistOff',!huntingAids.enabled);
  $('assistBtn').setAttribute('aria-pressed',String(huntingAids.enabled));
  huntingAids.target=enabled?objectiveTarget():null;show('objectiveCompass',!!huntingAids.target);
  if(!huntingAids.target)return;
  const target=huntingAids.target;let angle=0,meters='';
  if(target.pos){const dx=target.pos.x-game.player.pos.x,dy=target.pos.y-game.player.pos.y;angle=Math.atan2(dy,dx);meters=` · ${Math.round(Math.hypot(dx,dy)/20)} M`;}
  hudText('objectiveName',target.label+(target.kind==='surface'?'':meters));hudText('objectiveDetail',target.detail);
  hudText('objectiveArrow',target.kind==='time'?'◷':target.kind==='hint'?'N':'➤');
  $('objectiveArrow').style.transform=`rotate(${angle}rad)`;
}
$('assistBtn').onclick=()=>{huntingAids.enabled=!huntingAids.enabled;try{localStorage.setItem('abyss-hunt-aids',huntingAids.enabled?'1':'0');}catch{}updateHuntingHUD();};
function drawPreySignals(){
  if(!huntingAids.enabled||!['playing','paused'].includes(game.state))return;
  const z=game.zoom||1,candidates=[];
  for(const [kind,objects] of [['fish',game.fish],['enemy',game.enemies],['boat',arcade.boats]])for(const entity of objects){
    const x=(entity.pos.x-game.camera.x)*z,y=(entity.pos.y-game.camera.y)*z;
    if(x<22||x>game.width-22||y<75||y>game.height-75||preySignal(entity,kind)==='edible')continue;
    const dx=entity.pos.x-game.player.pos.x,dy=entity.pos.y-game.player.pos.y;
    candidates.push({kind,entity,x,y,d:dx*dx+dy*dy});
  }
  candidates.sort((a,b)=>a.d-b.d);
  const limit=graphics.economy?6:12;
  ctx.save();ctx.lineWidth=1.7;ctx.lineCap='round';
  for(const item of candidates.slice(0,limit)){
    const status=preySignal(item.entity,item.kind),color=status==='danger'?'#ff9a8f':'#ffdd8c';
    const above=item.kind==='boat'?item.entity.height*(item.entity.type===2?1.95:1.3)*z:Math.max(7,item.entity.radius*z*.85);
    const x=item.x,y=item.y-above-15;if(y<74)continue;
    ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fillStyle='#062d40ed';ctx.fill();ctx.strokeStyle=color;ctx.stroke();
    ctx.beginPath();
    if(status==='grow'){ctx.moveTo(x,y+4);ctx.lineTo(x,y-4);ctx.moveTo(x-3,y-1);ctx.lineTo(x,y-4);ctx.lineTo(x+3,y-1);ctx.stroke();}
    else{ctx.moveTo(x,y-4);ctx.lineTo(x,y+1);ctx.stroke();ctx.fillStyle=color;ctx.fillRect(x-1,y+3,2,2);}
  }
  ctx.restore();
}
function drawObjectiveSignal(){
  const target=huntingAids.target;if(!huntingAids.enabled||!target?.pos||target.kind==='food'||!['playing','paused'].includes(game.state))return;
  // Les références supprimées sont écartées entre deux rafraîchissements du HUD.
  if(['boat','yacht'].includes(target.kind)&&!arcade.boats.includes(target.entity)||target.kind==='treasure'&&!arcade.treasures.includes(target.entity))return;
  const point=compassGeometry(worldToScreen(game.player.pos),worldToScreen(target.pos),game.width,game.height);
  ctx.save();ctx.translate(point.x,point.y);ctx.strokeStyle='#ffe19a';ctx.lineWidth=2;
  if(point.edge){
    ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);ctx.fillStyle='#052a40ed';ctx.fill();ctx.stroke();
    ctx.rotate(point.angle);shape([[9,0],[-5,-7],[-1,0],[-5,7]],ctx.strokeStyle);
  }else{
    ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,-40);ctx.lineTo(0,-33);ctx.stroke();}
  }
  ctx.restore();
}
function buildScenery(index){
  const kind=SCENES[index].kind;
  return Array.from({length:24},(_,i)=>({kind,pos:new Vec(i<6?500+i*290:700+(i%9)*1250,i<6?(kind==='buoy'?game.waterY:620+(i%3)*180):kind==='buoy'?game.waterY:1000+Math.floor(i/9)*1500+(i%3)*300),scale:1+(i%3)*.3,seed:i}));
}
function drawSceneryItem(item,t){
  ctx.save();ctx.translate(item.pos.x,item.pos.y);ctx.scale(item.scale,item.scale);const k=item.kind;
  if(k==='coral'){
    ellipse(0,32,95,25,'#16464b');ctx.strokeStyle='#69b99c88';ctx.lineCap='round';
    for(let i=0;i<6;i++){const x=(i-2.5)*24;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,27);ctx.quadraticCurveTo(x*.4,-30,x+Math.sin(t*.6+item.seed)*5,-95+(i%2)*25);ctx.stroke();ellipse(x,-91+(i%2)*25,9,12,['#e3ac8b77','#a5ddac66','#bd8fbd66'][i%3]);}
  }else if(k==='buoy'){
    ctx.translate(0,Math.sin(t*1.3+item.seed)*4);ellipse(0,6,40,6,'#bae8e755');shape([[-25,3],[-18,-40],[18,-40],[25,3]],'#cc7966');ctx.fillStyle='#eee0b8';ctx.fillRect(-19,-25,38,10);ctx.fillRect(-3,-86,6,46);shape([[3,-86],[36,-74],[3,-63]],'#ffdb8c');
  }else if(k==='wreck'){
    ctx.globalAlpha=.62;ctx.rotate(-.12);shape([[-180,-5],[160,-5],[125,75],[-130,75]],'#594e4c');
    ctx.fillStyle='#877668';ctx.fillRect(-55,-75,95,70);ctx.fillStyle='#142f40';for(let i=0;i<5;i++)ellipse(-100+i*48,24,11,11,'#183b48');
    ctx.fillRect(-41,-62,25,24);ctx.fillRect(0,-62,25,24);ctx.strokeStyle='#a28e72';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(65,0);ctx.lineTo(38,-180);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-130,0);ctx.lineTo(38,-180);ctx.lineTo(130,-3);ctx.stroke();
  }else if(k==='current'){
    ctx.strokeStyle='#479c7b88';ctx.lineCap='round';
    for(let i=0;i<5;i++){const x=(i-2)*34,sway=Math.sin(t+item.seed+i)*28;ctx.lineWidth=9-i;ctx.beginPath();ctx.moveTo(x,80);ctx.bezierCurveTo(x-35,0,x+sway,-50,x+sway,-170-i*13);ctx.stroke();}
    ctx.strokeStyle='#99e6ce44';ctx.lineWidth=2;for(let i=0;i<3;i++){const x=-120+((t*35+i*75+item.seed*25)%240),y=-45-i*36;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+38,y);ctx.lineTo(x+30,y-6);ctx.moveTo(x+38,y);ctx.lineTo(x+30,y+6);ctx.stroke();}
  }else if(k==='vent'){
    ctx.globalAlpha=.8;for(let i=0;i<3;i++){const x=(i-1)*50,top=-100-i%2*80;shape([[x-30,50],[x-19,top],[x+17,top-5],[x+34,50]],'#34384d');ellipse(x,top,20,8,'#a3809777');}
    for(let i=0;i<(graphics.economy?2:5);i++){const y=-(t*22+i*47+item.seed*31)%200;ellipse(Math.sin(i+item.seed)*28,y-150,12+i*3,14+i*5,'#a9a1cb16');}
  }else{
    ctx.globalAlpha=.6;ctx.fillStyle='#827c68';ctx.fillRect(-140,65,280,22);ctx.fillRect(-100,-125,29,190);ctx.fillRect(70,-125,29,190);ctx.fillRect(-114,-140,61,17);ctx.fillRect(54,-140,61,17);shape([[-138,-145],[0,-205],[138,-145]],'#9e9272');
    ctx.strokeStyle='#d5bd7933';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-25,52,Math.PI,0);ctx.stroke();
  }
  ctx.restore();
}
function drawLevelScenery(){
  if(!campaign.active||game.sceneStyle?.kind==='buoy')return;
  ctx.save();applyWorldTransform();let drawn=0;
  for(const item of huntingAids.scenery){if(!visible(item.pos,300))continue;drawSceneryItem(item,game.ambientTime);if(++drawn>=(graphics.economy?4:8))break;}
  ctx.restore();
}
const experienceStartLevel=startLevel;
startLevel=function(index=levelProgress.selected){
  const ok=experienceStartLevel(index);if(!ok)return ok;
  game.sceneStyle=SCENES[index];huntingAids.scenery=buildScenery(index);
  // Un courant est une force pondérée du même gestionnaire que le pilotage.
  if(index===3)game.player.manager.add('levelCurrent',c=>c.params.currents?new Vec(70*Math.sin(c.player.pos.y*.003+c.time*.25),22*Math.cos(c.time*.2)):new Vec(),1);
  updateHUD();return true;
};
const experienceRestore=restoreLevelSettings;
restoreLevelSettings=function(){experienceRestore();game.sceneStyle=null;huntingAids.scenery=[];huntingAids.target=null;game.player?.manager.remove('levelCurrent');show('objectiveCompass',false);};
game.drawScenery=drawLevelScenery;
// Ici le contexte est déjà dans le monde, après le ciel et avant les bateaux.
game.drawSurfaceScenery=function(){
  if(!campaign.active||game.sceneStyle?.kind!=='buoy')return;
  let drawn=0;for(const item of huntingAids.scenery){if(!visible(item.pos,300))continue;drawSceneryItem(item,game.ambientTime);if(++drawn>=(graphics.economy?4:8))break;}
};
const experienceHUD=updateHUD;
updateHUD=function(){experienceHUD();updateHuntingHUD();};
const experienceRender=render;
render=function(){experienceRender();drawPreySignals();drawObjectiveSignal();};
updateHuntingHUD();
