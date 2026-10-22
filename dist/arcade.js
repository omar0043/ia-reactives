'use strict';
/** Couche arcade : survie sans fin, économie locale, chaîne alimentaire,
 * requins à débloquer, améliorations et frénésie. Le pilotage reste assuré
 * par Vehicle et BehaviorManager : cette couche n'implémente pas une seconde IA. */
const SHARKS=[
{id:'reef',name:'Requin de récif',size:'S',price:0,radius:25,speed:255,bite:1,color:'#70dce9',description:'Petit, rapide et toujours affamé.'},
{id:'hammer',name:'Requin-marteau',size:'M',price:250,radius:33,speed:265,bite:2,color:'#c4b9f2',description:'Une tête singulière. Un appétit redoutable.'},
{id:'great',name:'Grand requin blanc',size:'L',price:800,radius:44,speed:280,bite:3,color:'#b8d7e4',description:'Tout en haut de la chaîne alimentaire.'}
];
const profile={coins:0,selected:0,unlocked:['reef'],upgrades:{reef:{speed:0,bite:0,boost:0},hammer:{speed:0,bite:0,boost:0},great:{speed:0,bite:0,boost:0}}};
try{const stored=JSON.parse(localStorage.getItem('abyss-profile-v2'));if(stored&&Number.isFinite(stored.coins)){profile.coins=Math.max(0,Math.floor(stored.coins));profile.selected=clamp(Math.floor(stored.selected)||0,0,2);profile.unlocked=['reef',...['hammer','great'].filter(id=>stored.unlocked?.includes(id))];for(const shark of SHARKS)for(const key of ['speed','bite','boost'])profile.upgrades[shark.id][key]=clamp(Math.floor(stored.upgrades?.[shark.id]?.[key])||0,0,5);}}catch{}
let chosen=profile.selected,profileWriteTimer=null,profileDirty=false;
const arcade={rush:0,rushTime:0,coinsRun:0,missionDone:[false,false,false],mines:[],treasures:[],munch:0,bannerTime:0,region:'reef',touchKeys:[],lastCamera:new Vec(),rebalanceTime:0,paidDeath:false,boats:[],wrecks:[],splashes:[],boatsEaten:0,boatXP:0,sizeWarning:0};
function persistProfile(){profileDirty=true;if(profileWriteTimer===null)profileWriteTimer=setTimeout(flushProfile,750);}
function flushProfile(){if(profileWriteTimer!==null){clearTimeout(profileWriteTimer);profileWriteTimer=null;}if(profileDirty){try{localStorage.setItem('abyss-profile-v2',JSON.stringify(profile));profileDirty=false;}catch{}}}
window.addEventListener('pagehide',flushProfile);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushProfile();});
function addCoins(amount){const gain=Math.max(0,Math.floor(amount));profile.coins+=gain;arcade.coinsRun+=gain;persistProfile();}
function currentShark(){return SHARKS[profile.selected];}
function upgradeCost(key){return (profile.upgrades[SHARKS[chosen].id][key]+1)*75;}
/** Une seule règle de taille pour toutes les créatures. La frénésie est le bonus
 * temporaire qui permet de dépasser la chaîne alimentaire. */
function canEatPrey(prey){return arcade.rushTime>0||game.player.radius>prey.radius;}
function syncGrowth(){
  const xp=(game.growthXP||0)+game.eaten+arcade.boatXP;
  game.level=1+Math.floor(xp/(game.growthEvery||8));
  game.player.radius=Math.min(155,currentShark().radius+(game.level-1)*6);
}
function splash(x,size=1){
  arcade.splashes.push({x,life:1,size});
  for(let i=0;i<14;i++){const p=new Particle(x+rand(-20,20)*size,game.waterY,'#b9f8f7');p.vel=new Vec(rand(-170,170)*size,rand(-300,-100)*size);p.maxSpeed=420;p.life=rand(.5,1.1);game.particles.push(p);}
}
function requestJump(){
  if(game.state!=='playing'||game.player.airborne||game.player.jumpCooldown>0)return false;
  if(!game.player.launchJump(game.waterY,game.boosting)){toast('Remonte près de la surface, puis appuie sur J ou SAUT');return false;}
  splash(game.player.pos.x,1.2);banner('SAUT HORS DE L’EAU !');return true;
}
function onEnemyContact(enemy){
  if(canEatPrey(enemy)){
    game.score+=350;addCoins(15*(arcade.rushTime>0?4:1));
    game.health=clamp(game.health+15,0,100);emit(enemy.pos.x,enemy.pos.y,'#ffd56e','+350');
    game.eaten++;syncGrowth();enemy.pos=safePosition(250);banner('PRÉDATEUR DÉVORÉ !');
  }else{
    hurt(20);const away=Vec.sub(game.player.pos,enemy.pos);if(away.mag()<1)away.x=1;
    game.player.pos.add(away.setMag(30));
    if(arcade.sizeWarning<=0){toast('Ce prédateur est plus grand que toi · continue de grandir');arcade.sizeWarning=2;}
  }
}
function canEatBoat(boat){return arcade.rushTime>0||game.player.radius>=boat.minimumSharkRadius;}
function consumeBoat(boat){
  if(!arcade.boats.includes(boat)||!canEatBoat(boat))return false;
  arcade.boats.splice(arcade.boats.indexOf(boat),1);arcade.boatsEaten++;arcade.boatXP+=8;
  const score=[700,1400,2800][boat.type]*(arcade.rushTime>0?3:1);game.score+=score;
  addCoins(boat.reward*(arcade.rushTime>0?4:1));game.health=clamp(game.health+25,0,100);syncGrowth();
  arcade.wrecks.push({boat,life:1.4});splash(boat.pos.x,1.8+boat.type*.5);
  emit(boat.pos.x,game.waterY-35,'#ffe69a',`+${score}`);banner(['BARQUE DÉVORÉE !','BATEAU DÉVORÉ !','YACHT DÉVORÉ !'][boat.type]);chirp('boat');saveBest();return true;
}
function banner(text){$('arcadeBanner').textContent=text;arcade.bannerTime=2.8;}
function renderSharkChoice(){const shark=SHARKS[chosen],owned=profile.unlocked.includes(shark.id);$('sharkName').textContent=shark.name;$('sharkDescription').textContent=shark.description;$('sharkSize').textContent=shark.size;$('sharkStats').innerHTML=[['Vitesse',shark.speed/60],['Morsure',shark.bite+1],['Boost',2+chosen]].map(([label,value])=>`<div><span>${label}</span><i>${'▰'.repeat(Math.min(5,Math.floor(value)))}<em>${'▱'.repeat(Math.max(0,5-Math.floor(value)))}</em></i></div>`).join('');$('sharkOwnership').textContent=owned?'DÉBLOQUÉ · PRÊT À PLONGER':`À DÉBLOQUER · ${shark.price} PIÈCES`;$('startBtn').innerHTML=owned?'JOUER <span>▶</span>':`DÉBLOQUER · ${shark.price} ◉`;$('coinCount').textContent=profile.coins;$('garageBtn').disabled=!owned;}
function returnHome(){if(game.state==='playing'||game.state==='paused'){saveBest();}flushProfile();flushBest();document.querySelectorAll('dialog').forEach(d=>{if(d.open)d.close();});resumeAfterDialog=false;show('endScreen',false);show('pauseScreen',false);reset(false,false);chosen=profile.selected;renderSharkChoice();document.body.classList.remove('in-game');}
const originalReset=reset;
reset=function(sandbox=false,playing=false){game.growthXP=0;game.growthEvery=8;game.healthDrain=1.05;game.campaignRun=false;originalReset(sandbox,playing);const deep=$('reefSelect').value==='deep';arcade.region=deep?'deep':'reef';game.w=12000;game.h=6000;game.autoZoom=true;game.zoom=1;game.level=1;game.player.pos=new Vec(deep?6000:1000,deep?3400:playing?285:550);game.player.vel=new Vec();game.player.facing=0;game.target=game.player.pos.copy();game.waterY=150;game.canEatPrey=canEatPrey;game.onEnemyContact=onEnemyContact;game.player.radius=currentShark().radius;game.player.variant=currentShark().id;game.camera=Vec.sub(game.player.pos,new Vec(game.width/2,game.height/2));game.params.population=Math.max(85,game.params.population);$('population').value=game.params.population;$('populationOut').textContent=game.params.population;
// Récifs espacés : les passages restent plus larges que le corps maximal.
game.obstacles=[];
for(let x=800;x<game.w-600;x+=1300)for(let y=1000;y<game.h-450;y+=1150){
  const p=new Vec(x+rand(-150,150),y+rand(-140,140)),r=rand(90,180);
  if(p.dist(game.player.pos)<850)continue;
  if(game.obstacles.every(o=>p.dist(o.pos)>o.radius+r+700))game.obstacles.push(new Obstacle(p.x,p.y,r));
}
// Bancs concentrés : une capture demande une chasse, et l'océan reste nourri.
game.fish=Array.from({length:game.params.population},(_,i)=>{const local=i<48,cx=local?game.player.pos.x+(i%6-2)*210:rand(600,game.w-600),cy=local?game.player.pos.y+160+Math.floor(i/6)*80:rand(300,game.h-400);const f=new Fish(clamp(cx+rand(-140,140),100,game.w-100),clamp(cy+rand(-90,90),190,game.h-100),i%3);if(i%11===0){f.creature='turtle';f.radius=20;f.maxSpeed=75;}else if(i%17===0){f.creature='ray';f.radius=27;f.maxSpeed=95;}else if(i%9===0){f.radius=[32,46,62][Math.floor(i/9)%3];}f.resolveObstacles(game.obstacles);return f;});
game.enemies=Array.from({length:deep?10:8},(_,i)=>{const p=i===0?new Vec(game.player.pos.x+900,game.player.pos.y+250):safePosition(350);const enemy=new Shark(p.x,p.y);enemy.radius=i%2===0?30:39;return enemy;});
game.jellies=Array.from({length:deep?26:18},()=>{const p=safePosition(250);return new Jelly(p.x,p.y);});
game.food=Array.from({length:65},()=>safePosition(250));
game.path=[new Vec(500,420),new Vec(game.w-700,420),new Vec(game.w-600,game.h-750),new Vec(game.w*.5,game.h-500),new Vec(500,game.h-600)];
arcade.rush=0;arcade.rushTime=0;arcade.bannerTime=0;$('pauseBtn').textContent='Ⅱ';arcade.coinsRun=0;arcade.missionDone=[false,false,false];arcade.paidDeath=false;arcade.boatsEaten=0;arcade.boatXP=0;arcade.sizeWarning=0;arcade.rebalanceTime=0;arcade.wrecks=[];arcade.splashes=[];arcade.boats=Array.from({length:12},(_,i)=>new Boat(650+i*940,game.waterY,i<4?0:i<9?1:2));
arcade.mines=Array.from({length:deep?24:16},()=>safePosition(700));
arcade.treasures=Array.from({length:12},()=>safePosition(350));
document.body.classList.toggle('in-game',playing);document.body.classList.toggle('deep-ocean',deep);game.pointerBoost=false;game.pointerAim=false;updateZoom(0,true);updateCamera(0,true);updateArcadeHUD();};
const originalStart=start;
start=function(sandbox=false){if(!profile.unlocked.includes(SHARKS[chosen].id)){toast('Débloque d’abord ce requin');return;}profile.selected=chosen;if($('reefSelect').value==='deep'&&chosen===0){toast('Les abysses demandent un requin M ou L');return;}persistProfile();originalStart(sandbox);show('welcome',false);document.body.classList.add('in-game');toast(sandbox?'Exploration libre · découvre les comportements du récif':'Mange pour vivre · explore, grandis et bats ton record !');};
$('startBtn').onclick=()=>{const shark=SHARKS[chosen];if(!profile.unlocked.includes(shark.id)){if(profile.coins<shark.price){toast(`Il te manque ${shark.price-profile.coins} pièces. Gagne-les en chassant !`);return;}profile.coins-=shark.price;profile.unlocked.push(shark.id);profile.selected=chosen;persistProfile();flushProfile();renderSharkChoice();toast(`${shark.name} débloqué !`);return;}start(false);};
$('prevShark').onclick=()=>{chosen=(chosen+2)%3;renderSharkChoice();};$('nextShark').onclick=()=>{chosen=(chosen+1)%3;renderSharkChoice();};$('endHome').onclick=returnHome;$('pauseHome').onclick=returnHome;
function renderGarage(){const shark=SHARKS[chosen];$('garageBalance').textContent=`${shark.name} · Solde : ${profile.coins} pièces`;$('upgradeList').innerHTML=[['speed','VITESSE','Nage plus vite et attrape les proies qui te fuient.'],['bite','MORSURE','Chaque rang ajoute 10 % au score des captures et améliore les soins.'],['boost','ACCÉLÉRATION','Ton boost consomme moins d’énergie et se recharge plus vite.']].map(([key,title,description])=>{const rank=profile.upgrades[shark.id][key];return `<div class="upgrade-card"><div class="upgrade-symbol">${key==='speed'?'≈':key==='bite'?'⋁':'ϟ'}</div><div><h3>${title} <span>${rank}/5</span></h3><p>${description}</p><div class="upgrade-pips">${Array.from({length:5},(_,i)=>`<i class="${i<rank?'filled':''}"></i>`).join('')}</div></div><button class="primary" data-upgrade="${key}" ${rank>=5?'disabled':''}>${rank>=5?'MAX':upgradeCost(key)+' ◉'}</button></div>`;}).join('');document.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>buyUpgrade(b.dataset.upgrade));}
function buyUpgrade(key){if(!['speed','bite','boost'].includes(key)||!profile.unlocked.includes(SHARKS[chosen].id))return false;const u=profile.upgrades[SHARKS[chosen].id];if(u[key]>=5)return false;const cost=upgradeCost(key);if(profile.coins<cost){toast('Pas assez de pièces · replonge pour en gagner');return false;}profile.coins-=cost;u[key]++;persistProfile();flushProfile();renderGarage();renderSharkChoice();return true;}
$('garageBtn').onclick=()=>{renderGarage();openDialog('garage');};
const originalEat=eatFish;
eatFish=function(f){
  const previousLevel=game.level,score=game.score;originalEat(f);arcade.munch=.22;
  const delta=game.score-score,u=profile.upgrades[currentShark().id];
  game.score+=Math.round(delta*u.bite*.1);game.health=clamp(game.health+u.bite,0,100);
  if(arcade.rushTime>0){game.score+=delta*2;game.health=100;}
  addCoins(([1,2,4][f.type]||1)*(arcade.rushTime>0?4:1));
  if(arcade.rushTime<=0){arcade.rush=Math.min(100,arcade.rush+7+(f.type===2?3:0));if(arcade.rush>=100){arcade.rushTime=9;arcade.rush=0;game.health=100;banner('FRÉNÉSIE D’OR !');chirp('level');}}
  syncGrowth();if(game.level>previousLevel)banner('CROISSANCE '+game.level+' · TU GRANDIS !');saveBest();
};
const originalHurt=hurt;
hurt=function(amount){if(arcade.rushTime>0)return;originalHurt(amount);};
const originalFinish=finish;
finish=function(won=false){originalFinish(won);flushProfile();flushBest();$('endTitle').textContent='UNE FAIM DE REJOUER ?';$('endTag').textContent='TA PLONGÉE EST TERMINÉE';$('endText').textContent=`${game.eaten} proies · ${Math.floor(game.time)} secondes · niveau ${game.level}`;$('runReward').textContent=`+ ${arcade.coinsRun} pièces gagnées · solde ${profile.coins} ◉`;$('againBtn').textContent='REJOUER ▶';};
// Le contrôle du requin reste un Arrive ; les bonus changent les limites du Vehicle.
const originalStep=step;
step=function(dt){
  const playing=game.state==='playing',menu=game.state==='menu';
  if(!playing){originalStep(dt);if(menu)for(const boat of arcade.boats)boat.tick(dt,game);return;}
  syncGrowth();updateZoom(dt);
  if(game.pointerAim&&!cameraStream)game.target=screenToWorld(game.mouse);
  const shark=currentShark(),u=profile.upgrades[shark.id];
  arcade.munch=Math.max(0,arcade.munch-dt);arcade.bannerTime=Math.max(0,arcade.bannerTime-dt);
  arcade.rushTime=Math.max(0,arcade.rushTime-dt);arcade.sizeWarning=Math.max(0,arcade.sizeWarning-dt);
  for(const s of arcade.splashes)s.life-=dt;arcade.splashes=arcade.splashes.filter(s=>s.life>0);
  for(const w of arcade.wrecks)w.life-=dt;arcade.wrecks=arcade.wrecks.filter(w=>w.life>0);
  // Sortie automatique : une remontée rapide avec boost perce la surface.
  if(!game.player.airborne&&game.player.jumpCooldown<=0&&game.player.pos.y<game.waterY+game.player.radius*.35+12&&game.player.vel.y< -160&&(game.keys.has(' ')||game.pointerBoost))requestJump();
  const wasAirborne=game.player.airborne;
  const speed=shark.speed+u.speed*15;game.player.maxForce=700+u.speed*35;
  const intention=game.player.manager.getBehavior('intention'),previousFn=intention.fn;
  intention.fn=c=>{game.player.maxSpeed=game.boosting?speed*1.65:speed;return previousFn(c);};
  originalStep(dt);intention.fn=previousFn;
  if(game.state!=='playing')return;
  if(wasAirborne&&!game.player.airborne){splash(game.player.pos.x,1.7);banner('SPLASH !');}
  const discount=u.boost*.10;if(game.boosting)game.boost=clamp(game.boost+35*dt*discount,0,100);else game.boost=clamp(game.boost+u.boost*2*dt,0,100);
  if(arcade.rushTime>0){game.boost=100;game.health=100;}
  // Les grandes proies restent dans la simulation : aucune disparition temporaire
  // pour tricher avec les collisions ou modifier la liste des voisins.
  if(arcade.rushTime<=0&&arcade.sizeWarning<=0){const big=game.fish.find(f=>!canEatPrey(f)&&f.pos.dist(game.player.pos)<game.player.radius+f.radius);if(big){toast('Encore trop grand · mange les petits poissons pour grandir');arcade.sizeWarning=2;}}
  for(const boat of [...arcade.boats]){
    boat.tick(dt,game);
    const contact=Math.abs(boat.pos.x-game.player.pos.x)<boat.width*.5+game.player.radius*.85&&Math.abs(boat.pos.y-game.player.pos.y)<boat.height*.45+game.player.radius*.7;
    if(contact){if(canEatBoat(boat))consumeBoat(boat);else if(arcade.sizeWarning<=0){toast('Bateau trop grand · reviens avec un requin plus imposant');arcade.sizeWarning=2;}}
  }
  for(const mine of arcade.mines){if(mine.dist(game.player.pos)<game.player.radius+22){if(arcade.rushTime>0){emit(mine.x,mine.y,'#ffbd6d','+50');game.score+=50;mine.x=-1000;mine.y=-1000;}else hurt(28);}}
  for(let i=arcade.treasures.length-1;i>=0;i--){const p=arcade.treasures[i];if(p.dist(game.player.pos)<game.player.radius+28){addCoins(50);game.score+=250;emit(p.x,p.y,'#ffe7a4','TRÉSOR +50 ◉');arcade.treasures.splice(i,1);banner('TRÉSOR DÉCOUVERT · +50 PIÈCES');}}
  game.player.constrainToWorld(game.w,game.h,game.waterY);
  for(const f of game.fish)f.pos.y=clamp(f.pos.y,175,game.h-90);
  replenishNearbyFish(dt);updateCamera(0);
  if(game.fish.length<game.params.population&&Math.random()<dt*3){const angle=rand(0,Math.PI*2),p=Vec.add(game.player.pos,Vec.fromAngle(angle).mult(rand(330,620)));p.x=clamp(p.x,100,game.w-100);p.y=clamp(p.y,200,game.h-120);if(game.obstacles.every(o=>p.dist(o.pos)>o.radius+40))game.fish.push(new Fish(p.x,p.y,Math.floor(rand(0,3))));}
  const completed=[game.eaten>=25,game.score>=1000,game.time>=90];completed.forEach((yes,i)=>{if(!game.campaignRun&&yes&&!arcade.missionDone[i]){arcade.missionDone[i]=true;addCoins([40,60,100][i]);banner(`DÉFI RÉUSSI · +${[40,60,100][i]} PIÈCES`);}});saveBest();
};
function hudText(id,value){const node=$(id),text=String(value);if(node.textContent!==text)node.textContent=text;}
function updateArcadeHUD(){const s=currentShark();hudText('coinCount',profile.coins);hudText('arcadeScore',game.score.toLocaleString('fr-FR'));$('arcadeHealth').style.width=clamp(game.health,0,100)+'%';$('arcadeHealth').style.background=game.health<25?'#ff705f':'';$('arcadeBoost').style.height=game.boost+'%';hudText('arcadeCombo',game.combo>1&&game.time-game.lastEat<2.5?'×'+game.combo:'');hudText('arcadeLevel',s.name.toUpperCase()+' · CROISSANCE '+game.level);$('arcadeXP').style.width=(((game.growthXP||0)+game.eaten+arcade.boatXP)%(game.growthEvery||8))/(game.growthEvery||8)*100+'%';const pending=arcade.missionDone.findIndex(v=>!v);hudText('arcadeMission',pending<0?'TOUS LES DÉFIS RÉUSSIS · BATS TON RECORD':[`MANGE ${Math.min(game.eaten,25)}/25 POISSONS`,`SCORE ${Math.min(game.score,1000)}/1000`,`SURVIS ${Math.min(90,Math.floor(game.time))}/90 SECONDES`][pending]);$('rushBar').style.width=(arcade.rushTime>0?arcade.rushTime/9*100:arcade.rush)+'%';$('rushHud').classList.toggle('active',arcade.rushTime>0);hudText('rushLabel',arcade.rushTime>0?'FRÉNÉSIE D’OR · SCORE ×3':'FRÉNÉSIE D’OR');show('starving',game.health<25&&game.state==='playing'&&!game.sandbox);$('arcadeBanner').classList.toggle('show',arcade.bannerTime>0);hudText('depthLabel',game.player.airborne&&game.player.pos.y<game.waterY?'ALTITUDE':'PROFONDEUR');hudText('depth',Math.max(0,Math.round(Math.abs(game.player.pos.y-game.waterY)/20))+' M');hudText('sizeHint',`TAILLE ×${(game.player.radius/25).toFixed(1)} · ${arcade.boatsEaten} BATEAU${arcade.boatsEaten>1?'X':''}`);$('jumpBtn').classList.toggle('ready',!game.player.airborne&&game.player.jumpCooldown<=0&&game.player.pos.y<=game.waterY+170);$('jumpBtn').disabled=game.state!=='playing'||game.player.airborne||game.player.jumpCooldown>0;hudText('jumpReadout',game.player.airborne?'EN VOL · RETOMBÉE AUTOMATIQUE':game.player.pos.y<game.waterY+170?'J · SAUT HORS DE L’EAU':'REMONTE VERS LA SURFACE POUR SAUTER');hudText('zoneSub',arcade.region==='deep'?'ABYSSES · ZONE DANGEREUSE':'LAGONS TROPICAUX');}
const originalHUD=updateHUD;updateHUD=updateArcadeHUD;
$('missionsBtn').onclick=()=>{$('arcadeMissions').innerHTML=[['Le festin du récif',game.eaten,25,'poissons',40],['Le chasseur',game.score,1000,'points',60],['Survie',Math.floor(game.time),90,'secondes',100]].map(([name,n,max,unit,reward],i)=>`<div class="arcade-mission ${arcade.missionDone[i]?'done':''}"><b>${arcade.missionDone[i]?'✓':'◇'} ${name}</b><p>${Math.min(n,max)} / ${max} ${unit}</p><span>${arcade.missionDone[i]?'RÉCOMPENSE REÇUE':`+${reward} ◉`}</span></div>`).join('');openDialog('missionDialog');};
$('mapBtn').onclick=()=>{drawLargeMap();openDialog('mapDialog');};
function drawLargeMap(){const c=$('largeMap').getContext('2d'),w=800,h=420;c.fillStyle='#07364a';c.fillRect(0,0,w,h);c.fillStyle='#97dded33';c.fillRect(0,0,w,30);c.font='13px sans-serif';c.fillStyle='#8dc7cd';c.fillText('GRAND LAGON',60,65);c.fillText('RÉCIFS OUVERTS',330,190);c.fillText('ABYSSES',620,345);for(const o of game.obstacles){c.beginPath();c.arc(o.pos.x/game.w*w,o.pos.y/game.h*h,o.radius/game.w*w,0,Math.PI*2);c.fillStyle='#57818c';c.fill();}for(const[type,objects,color]of [['enemy',game.enemies,'#ff7474'],['mine',arcade.mines,'#ffb66e'],['treasure',arcade.treasures,'#ffda70'],['boat',arcade.boats,'#eef8ff']])for(const obj of objects){const p=obj.pos||obj;c.beginPath();c.arc(p.x/game.w*w,p.y/game.h*h,4,0,Math.PI*2);c.fillStyle=color;c.fill();}c.beginPath();c.arc(game.player.pos.x/game.w*w,game.player.pos.y/game.h*h,6,0,Math.PI*2);c.fillStyle='#7dffbc';c.fill();}
const originalFishArt=fishArt;fishArt=function(f,t){if(!f.creature){originalFishArt(f,t);return;}ctx.save();ctx.translate(f.pos.x,f.pos.y);ctx.rotate(f.vel.heading());if(Math.cos(f.vel.heading())<0)ctx.scale(1,-1);if(f.creature==='turtle'){ellipse(0,0,25,17,'#5c8e68');ellipse(0,-2,21,13,'#8ab179');ctx.strokeStyle='#d1d99b77';ctx.lineWidth=1;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*10,-12);ctx.lineTo(i*10+5,9);ctx.stroke();}ellipse(28,0,9,7,'#9ec88f');shape([[-8,-9],[-28,-28+Math.sin(t*4)*5],[5,-13]],'#8eb88c');shape([[-8,9],[-27,28-Math.sin(t*4)*5],[6,13]],'#7ca17b');ellipse(32,-2,1.5,2,'#153735');}else{shape([[27,0],[-5,-35+Math.sin(t*3)*7],[-20,-3],[-50,0],[-20,3],[-5,35-Math.sin(t*3)*7]],'#719cb0');ellipse(0,0,15,10,'#94bbca');ellipse(13,-3,2,2,'#1e3e4f');}ctx.restore();};
const originalSharkArt=sharkArt;sharkArt=function(s,t,scale=1){const isHero=s.isPlayer;const variant=s.variant||(game.state==='menu'?SHARKS[chosen].id:'reef');ctx.save();s.golden=isHero&&arcade.rushTime>0;originalSharkArt(s,t,scale);ctx.restore();if(isHero&&variant==='hammer'){ctx.save();ctx.translate(s.pos.x,s.pos.y);ctx.rotate(s.facing??(s.vel.mag()>4?s.vel.heading():0));ctx.scale(s.radius/24*scale,s.radius/24*scale);if(Math.cos(s.facing??s.vel.heading())<0)ctx.scale(1,-1);ctx.fillStyle='#94bdcb';ctx.beginPath();ctx.roundRect(36,-26,16,49,7);ctx.fill();ellipse(46,-20,3,3,'#122b40');ellipse(46,18,3,3,'#122b40');ctx.restore();}};
function drawArcadeWorld(){const t=game.ambientTime;ctx.save();applyWorldTransform();
// Ligne de surface, soleil et ciel : le monde défile réellement avec le requin.
if(game.camera.y<game.waterY+50){const sky=ctx.createLinearGradient(0,-500,0,160);sky.addColorStop(0,game.sceneStyle?.sky?.[0]||'#70cde9');sky.addColorStop(1,game.sceneStyle?.sky?.[1]||'#d2f6e4');ctx.fillStyle=sky;const skyTop=Math.min(-1400,game.camera.y-100);ctx.fillRect(-200,skyTop,game.w+400,game.waterY-skyTop);ellipse(500,35,38,38,'#fff1b3');for(let i=0;i<Math.ceil(game.w/490);i++){ellipse(i*490+150,65,85,17,'#e9ffed99');}ctx.beginPath();ctx.moveTo(0,150);for(let x=Math.max(0,Math.floor(game.camera.x/44)*44);x<=Math.min(game.w,game.camera.x+viewportWorld().w+44);x+=44)ctx.lineTo(x,150+Math.sin(x*.018+t*1.7)*5);ctx.strokeStyle='#b4fff3';ctx.lineWidth=4;ctx.stroke();}
if(game.drawSurfaceScenery)game.drawSurfaceScenery();
for(const boat of arcade.boats)if(visible(boat.pos,boat.width+100))boatArt(boat,t);
for(const wreck of arcade.wrecks){ctx.save();ctx.globalAlpha=clamp(wreck.life/1.4,0,1);ctx.translate(0,(1.4-wreck.life)*50);ctx.translate(wreck.boat.pos.x,wreck.boat.pos.y);ctx.rotate((1.4-wreck.life)*.45);ctx.translate(-wreck.boat.pos.x,-wreck.boat.pos.y);boatArt(wreck.boat,t);ctx.restore();}
const floorY=game.h-55;if(game.camera.y+viewportWorld().h>floorY-170){ctx.beginPath();ctx.moveTo(-100,game.h+100);ctx.lineTo(-100,floorY);for(let x=0;x<=game.w+100;x+=40)ctx.lineTo(x,floorY+Math.sin(x*.009)*20+Math.sin(x*.03)*7);ctx.lineTo(game.w+100,game.h+100);ctx.closePath();ctx.fillStyle=arcade.region==='deep'?'#173d4c':'#587d75';ctx.fill();for(let x=100;x<game.w;x+=165){if(visible(new Vec(x,floorY),100))coral(x,floorY,.8+(x%5)*.2,x%3,t);}
}
for(const p of arcade.mines){if(!visible(p,50))continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(t+p.x)*.07);for(let i=0;i<8;i++){const a=i*Math.PI/4;line(Vec.fromAngle(a).mult(17),Vec.fromAngle(a).mult(27),'#637a85',5);}ellipse(0,0,20,20,'#345266');ellipse(-5,-6,9,7,'#749ba455');ellipse(4,2,5,5,Math.sin(t*3)>0?'#ff8270':'#822d38');ctx.restore();}
for(const p of arcade.treasures){if(!visible(p,80))continue;ctx.save();ctx.translate(p.x,p.y+Math.sin(t*2)*3);ctx.shadowColor='#ffd66b';ctx.shadowBlur=graphics.glow?10:0;ctx.fillStyle='#b57d38';ctx.fillRect(-22,-14,44,29);ctx.fillStyle='#edbe61';ctx.fillRect(-24,-17,48,10);ctx.fillRect(-14,-17,4,32);ctx.fillRect(10,-17,4,32);ctx.fillStyle='#ffe593';ctx.fillRect(-3,-6,6,11);ctx.shadowBlur=0;ring(new Vec(0,0),35+Math.sin(t*2)*4,'#ffdf9222');ctx.restore();}
if(game.state==='playing'&&arcade.munch>0){const mouth=Vec.add(game.player.pos,Vec.fromAngle(game.player.vel.heading()).mult(game.player.radius*1.8));ring(mouth,12+arcade.munch*65,'#fff6c1aa');}
// Écume et gouttes visibles aussi au-dessus de la surface.
for(const s of arcade.splashes){ctx.strokeStyle=`rgba(219,255,250,${s.life*.7})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(s.x,game.waterY,(1-s.life)*70*s.size+8,4+s.life*6,0,0,Math.PI*2);ctx.stroke();}
for(const p of game.particles){if(p.pos.y>=game.waterY)continue;ctx.globalAlpha=clamp(p.life,0,1);if(p.text){ctx.font='700 19px Space Grotesk, sans-serif';ctx.fillStyle=p.color;ctx.fillText(p.text,p.pos.x,p.pos.y);}else ellipse(p.pos.x,p.pos.y,p.radius+1,p.radius+2,p.color);ctx.globalAlpha=1;}
ctx.restore();}
const originalRender=render;render=function(){originalRender();drawArcadeWorld();if(game.state!=='menu'&&(game.player.airborne||game.player.pos.y<game.waterY+game.player.radius*2)){ctx.save();applyWorldTransform();sharkArt(game.player,game.ambientTime);ctx.restore();}if(game.state==='menu'){// Un grand requin sélectionné, au centre du menu.
ctx.save();const hero={pos:new Vec(game.width*.58,game.height*.43),vel:new Vec(80,-2),radius:Math.min(SHARKS[chosen].radius*2.2,game.width/11),isPlayer:true,variant:SHARKS[chosen].id,theta:0};sharkArt(hero,game.ambientTime,1.65);ctx.restore();}if(arcade.rushTime>0&&game.state==='playing'){ctx.save();ctx.strokeStyle='#ffd25777';ctx.lineWidth=10;ctx.strokeRect(5,5,game.width-10,game.height-10);ctx.restore();}};
// Joystick tactile sans conflit avec la visée : les touches sont injectées dans
// la même sélection d'action du requin. Relâcher retire uniquement ces touches.
function clearTouchKeys(){for(const key of arcade.touchKeys)game.keys.delete(key);arcade.touchKeys=[];$('joystickKnob').style.transform='translate(-50%,-50%)';}
$('joystick').addEventListener('pointerdown',e=>{e.preventDefault();$('joystick').setPointerCapture(e.pointerId);updateJoystick(e);});
function updateJoystick(e){if(e.type==='pointermove'&&!e.buttons)return;const r=$('joystick').getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;clearTouchKeys();if(dx>12)arcade.touchKeys.push('arrowright');if(dx< -12)arcade.touchKeys.push('arrowleft');if(dy>12)arcade.touchKeys.push('arrowdown');if(dy< -12)arcade.touchKeys.push('arrowup');for(const k of arcade.touchKeys)game.keys.add(k);const d=new Vec(dx,dy).limit(35);$('joystickKnob').style.transform=`translate(calc(-50% + ${d.x}px),calc(-50% + ${d.y}px))`;}
$('joystick').addEventListener('pointermove',updateJoystick);$('joystick').addEventListener('pointerup',clearTouchKeys);$('joystick').addEventListener('pointercancel',clearTouchKeys);$('touchBoost').addEventListener('pointerdown',e=>{e.preventDefault();$('touchBoost').setPointerCapture(e.pointerId);game.pointerBoost=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('touchBoost').addEventListener(event,()=>game.pointerBoost=false);window.addEventListener('blur',()=>{clearTouchKeys();game.pointerBoost=false;});
canvas.addEventListener('pointermove',()=>{game.pointerAim=true;});
canvas.addEventListener('pointerdown',()=>{game.pointerAim=true;});
$('performanceBtn').onclick=()=>{graphics.economy=!graphics.economy;try{localStorage.setItem('abyss-economy',graphics.economy?'1':'0');}catch{}syncPerformanceButton();resize();toast(graphics.economy?'Mode fluide : effets réduits, gameplay conservé':'Qualité équilibrée activée');};
function syncPerformanceButton(){$('performanceBtn').setAttribute('aria-pressed',String(graphics.economy));$('performanceBtn').title=graphics.economy?'Mode fluide activé · cliquer pour la qualité équilibrée':'Activer le mode fluide';document.body.classList.toggle('economy',graphics.economy);}
syncPerformanceButton();
$('jumpBtn').onclick=requestJump;
window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='j'&&!e.repeat&&![...document.querySelectorAll('dialog')].some(d=>d.open)){e.preventDefault();requestJump();}});
reset(false,false);renderSharkChoice();

function boatArt(boat,t){
  ctx.save();ctx.translate(boat.pos.x,boat.pos.y+Math.sin(t*1.5+boat.phase)*3);
  ctx.rotate(Math.sin(t*.9+boat.phase)*.035);const w=boat.width,h=boat.height;
  // Sillage et coque.
  ctx.strokeStyle='#d8fff566';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,5,w*.65,5,0,0,Math.PI*2);ctx.stroke();
  shape([[-w*.52,-7],[w*.52,-7],[w*.35,h*.28],[-w*.35,h*.28]],boat.type===0?'#e4a264':boat.type===1?'#f1e4c6':'#edf4ee','#253f54');
  ctx.fillStyle=boat.type===0?'#693f2e':'#325e78';ctx.fillRect(-w*.42,-5,w*.85,5);
  if(boat.type===0){
    ctx.strokeStyle='#64412c';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-w*.2,-8);ctx.lineTo(-w*.04,-h*.5);ctx.stroke();
    ellipse(-w*.03,-h*.58,6,6,'#dfb58a');ctx.fillStyle='#d8574f';ctx.fillRect(-w*.10,-h*.45,13,h*.25);
    line(new Vec(w*.08,-8),new Vec(w*.48,-h*.65),'#423e40',2);
  }else{
    ctx.fillStyle=boat.type===1?'#e2cba7':'#f5f4df';ctx.fillRect(-w*.17,-h*.62,w*.4,h*.51);
    ctx.fillStyle='#5597b5';ctx.fillRect(-w*.1,-h*.53,w*.12,h*.22);ctx.fillRect(w*.06,-h*.53,w*.12,h*.22);
    if(boat.type===1){line(new Vec(-w*.28,-h*.1),new Vec(-w*.28,-h*1.3),'#d7e6d9',3);line(new Vec(-w*.28,-h*1.2),new Vec(-w*.48,-h*.4),'#b8d2cf',1);}
    else{line(new Vec(w*.06,-h*.5),new Vec(w*.06,-h*1.7),'#eef7ed',3);shape([[w*.05,-h*1.65],[-w*.36,-h*.58],[w*.05,-h*.58]],'#fff3cb');shape([[w*.09,-h*1.55],[w*.35,-h*.68],[w*.09,-h*.68]],'#75bbc5');}
  }
  if(game.state==='playing'){
    const edible=canEatBoat(boat);ctx.font='600 10px DM Sans, sans-serif';ctx.textAlign='center';
    ctx.fillStyle=edible?'#174c36':'#294b61';ctx.fillText(edible?'À DÉVORER !':['GRANDIS · BARQUE','GRANDIS · BATEAU','GRANDIS · YACHT'][boat.type],0,-h*(boat.type===2?1.95:boat.type===1?1.55:1));
  }
  ctx.restore();
}

function replenishNearbyFish(dt){
  if(!['flock','wander','flee','evade'].includes(game.mode))return;
  arcade.rebalanceTime+=dt;if(arcade.rebalanceTime<.4)return;arcade.rebalanceTime=0;
  const view=viewportWorld(),range=Math.max(850,Math.min(2200,Math.max(view.w,view.h)*.65));
  const nearby=game.fish.filter(f=>f.pos.dist(game.player.pos)<range).length;
  if(nearby>=Math.min(45,game.params.population))return;
  const distant=game.fish.filter(f=>!visible(f.pos,150)&&f.pos.dist(game.player.pos)>range*1.1).sort((a,b)=>b.pos.dist(game.player.pos)-a.pos.dist(game.player.pos)).slice(0,4);
  for(const f of distant){
    for(let attempt=0;attempt<12;attempt++){
      const p=Vec.add(game.player.pos,Vec.fromAngle(rand(0,Math.PI*2)).mult(rand(range*.55,range*.9)));
      p.x=clamp(p.x,120,game.w-120);p.y=clamp(p.y,game.waterY+100,game.h-150);
      if(game.obstacles.some(o=>p.dist(o.pos)<o.radius+f.radius+60)||p.dist(game.player.pos)<game.player.radius*3)continue;
      f.pos=p;f.history=[];break;
    }
  }
}
