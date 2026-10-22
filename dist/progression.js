'use strict';
/** Reprise locale, résultats et dernier prédateur. Les acteurs restaurés sont
 * reconstruits via leurs classes : aucune méthode n'est désérialisée. */
const RUN_KEY='abyss-run-v1',STAR_LIMITS=[[90,20],[120,25],[160,35],[200,40],[220,50],[300,60]];
const run={damage:0,boss:null,bossDefeated:false,saveClock:0,restoring:false,tipClock:0,tipUntil:0,nextTip:0,seen:{}};
try{const saved=JSON.parse(localStorage.getItem('abyss-tips-v1'));for(const key of ['move','boost','jump','boat','danger'])run.seen[key]=saved?.[key]===true;}catch{}
let pendingRun=null;
function starsFor(index,time,damage){const [fast,careful]=STAR_LIMITS[index];return 1+Number(time<=fast)+Number(damage<=careful);}
function starText(n){return '★'.repeat(n)+'☆'.repeat(3-n);}

class ApexShark extends Shark{
  constructor(x,y){
    super(x,y);this.isBoss=true;this.radius=152;this.maxSpeed=195;this.maxForce=260;
    this.manager.getBehavior('intention').fn=c=>{
      if(c.player.radius>this.radius||arcade.rushTime>0){this.state='evade';return this.evade(c.player,.8);}
      if(this.pos.dist(c.player.pos)<1800){this.state='pursue';return this.pursue(c.player,.7);}
      this.state='wander';return this.wander(c.dt);
    };
  }
}
LEVELS[5].goals.push(['boss',1]);LEVELS[5].description='Grandis, dévore le yacht puis affronte L’Ancien.';
const progressGoalValue=goalValue,progressGoalLabel=goalLabel,progressGoalText=goalProgress;
goalValue=function(key){return key==='boss'?Number(run.bossDefeated):progressGoalValue(key);};
goalLabel=function(key,n){return key==='boss'?`${n} prédateur final`:progressGoalLabel(key,n);};
goalProgress=function(key,n){return key==='boss'?`L’ANCIEN ${Number(run.bossDefeated)}/${n}`:progressGoalText(key,n);};
const progressContact=onEnemyContact;
onEnemyContact=function(enemy){
  if(!enemy.isBoss)return progressContact(enemy);
  if(run.bossDefeated||!game.enemies.includes(enemy))return;
  if(!canEatPrey(enemy))return progressContact(enemy);
  progressContact(enemy);game.enemies=game.enemies.filter(e=>e!==enemy);run.bossDefeated=true;run.boss=null;
  game.score+=1150;addCoins(150);banner('L’ANCIEN EST VAINCU !');chirp('boss');saveBest();
};
const progressObjective=objectiveTarget;
objectiveTarget=function(){
  if(campaign.active&&campaign.index===5&&!run.bossDefeated&&run.boss&&game.health>=28&&['playing','paused'].includes(game.state)&&canEatPrey(run.boss))return targetFor(run.boss,'boss','L’ANCIEN · À DÉVORER','Tu es assez grand · rattrape le prédateur final');
  return progressObjective();
};
const progressSharkArt=sharkArt;
sharkArt=function(s,t,scale=1){
  progressSharkArt(s,t,scale);if(!s.isBoss)return;
  ctx.save();ctx.translate(s.pos.x,s.pos.y);ctx.rotate(s.facing??s.vel.heading());ctx.scale(s.radius/24,s.radius/24);
  ctx.strokeStyle='#f6d98b';ctx.lineWidth=2.6;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-18+i*8,-18);ctx.lineTo(-24+i*8,-5);ctx.stroke();}ctx.restore();
};

const actorNumbers=['radius','theta','health','age','generation','facing','flightTime','jumpCooldown','invulnerable','phase','direction'];
function packActor(actor){
  const result={p:[actor.pos.x,actor.pos.y],v:[actor.vel.x,actor.vel.y]};
  for(const key of actorNumbers)if(Number.isFinite(actor[key]))result[key]=actor[key];
  for(const key of ['airborne','enteredSky','isBoss'])if(typeof actor[key]==='boolean')result[key]=actor[key];
  if(Number.isInteger(actor.type))result.type=actor.type;
  if(actor.dna)result.dna=[...actor.dna];if(actor.creature)result.creature=actor.creature;
  return result;
}
function unpackActor(record,kind){
  let actor;
  if(kind==='fish')actor=new Fish(...record.p,record.type,record.dna,record.generation);
  else if(kind==='boat')actor=new Boat(record.p[0],game.waterY,record.type);
  else if(kind==='jelly')actor=new Jelly(...record.p);
  else actor=record.isBoss?new ApexShark(...record.p):new Shark(...record.p,kind==='player');
  actor.vel=new Vec(...record.v);for(const key of actorNumbers)if(Number.isFinite(record[key]))actor[key]=record[key];
  for(const key of ['airborne','enteredSky'])if(typeof record[key]==='boolean')actor[key]=record[key];
  if(['turtle','ray'].includes(record.creature))actor.creature=record.creature;
  actor.trackHistory=false;actor.history=[];return actor;
}
function finiteRange(value,min,max){return Number.isFinite(value)&&value>=min&&value<=max;}
function validPoint(p,velocity=false){return Array.isArray(p)&&p.length===2&&p.every(n=>finiteRange(n,velocity?-5000:-2000,velocity?5000:14000));}
const gameSaveKeys=['health','boost','score','eaten','time','lastEat','combo','generation','spawnTimer','ambientTime','growthXP'];
const arcadeSaveKeys=['rush','rushTime','coinsRun','boatsEaten','boatXP'];
const runParamKeys=['maxSpeed','maxForce','vision','prediction','separation','alignment','cohesion','population','currents','genetic','trails','vectors'];
function validRun(snapshot){
  if(!snapshot||snapshot.format!==1||!['campaign','survival'].includes(snapshot.mode)||!Number.isInteger(snapshot.index)||snapshot.index<0||snapshot.index>5)return false;
  if(snapshot.mode==='campaign'&&snapshot.index>levelProgress.unlocked)return false;
  if(!snapshot.profile||!finiteRange(snapshot.profile.coins,0,1e12)||!Number.isInteger(snapshot.shark)||snapshot.shark<0||snapshot.shark>2||(!Array.isArray(snapshot.profile.unlocked)||!snapshot.profile.unlocked.includes(SHARKS[snapshot.shark].id)))return false;
  if(!gameSaveKeys.every(k=>finiteRange(snapshot.stats?.[k],-100,1e12))||!finiteRange(snapshot.stats.health,.001,100)||!finiteRange(snapshot.stats.boost,0,100)||!finiteRange(snapshot.stats.time,0,604800))return false;
  if(!arcadeSaveKeys.every(k=>finiteRange(snapshot.arcade?.[k],0,1e12))||!finiteRange(snapshot.damage,0,1e9))return false;
  if(!snapshot.counters||!['jumps','yachts','treasures'].every(k=>Number.isInteger(snapshot.counters[k])&&finiteRange(snapshot.counters[k],0,1e9))||typeof snapshot.bossDefeated!=='boolean')return false;
  const validActor=(r,kind)=>r&&validPoint(r.p)&&validPoint(r.v,true)&&finiteRange(r.radius,1,300)&&actorNumbers.every(k=>r[k]===undefined||finiteRange(r[k],-100,1e9))&&['airborne','enteredSky','isBoss'].every(k=>r[k]===undefined||typeof r[k]==='boolean')&&(!['fish','boat'].includes(kind)||Number.isInteger(r.type)&&r.type>=0&&r.type<=2)&&(kind!=='fish'||Array.isArray(r.dna)&&r.dna.length===4&&r.dna.every(n=>finiteRange(n,.1,3)));
  if(!validActor(snapshot.player,'player'))return false;
  for(const [key,max,kind]of [['fish',110,'fish'],['enemies',11,'shark'],['jellies',26,'jelly'],['boats',12,'boat']])if(!Array.isArray(snapshot[key])||snapshot[key].length>max||!snapshot[key].every(r=>validActor(r,kind)))return false;
  const bosses=snapshot.enemies.filter(e=>e.isBoss).length;if(bosses>1||bosses&&(snapshot.mode!=='campaign'||snapshot.index!==5||snapshot.bossDefeated))return false;
  if(snapshot.mode==='campaign'&&snapshot.index===5&&!snapshot.bossDefeated&&bosses!==1)return false;
  if(!Array.isArray(snapshot.obstacles)||snapshot.obstacles.length>300||!snapshot.obstacles.every(o=>validPoint(o.p)&&finiteRange(o.r,1,1000)&&Number.isFinite(o.seed)))return false;
  for(const [key,max]of [['food',65],['mines',24],['treasures',12]])if(!Array.isArray(snapshot[key])||snapshot[key].length>max||!snapshot[key].every(p=>validPoint(p)))return false;
  if(!snapshot.params||!runParamKeys.every(key=>typeof game.params[key]==='boolean'?typeof snapshot.params[key]==='boolean':finiteRange(snapshot.params[key],0,400)))return false;
  if(!finiteRange(snapshot.params.population,0,110)||!['reef','deep'].includes(snapshot.region)||!['flock','wander','path','leader','snake','seek','flee','evade'].includes(snapshot.behavior))return false;
  return Array.isArray(snapshot.missions)&&snapshot.missions.length===3&&snapshot.missions.every(v=>typeof v==='boolean');
}
function captureRun(){
  const values=(object,keys)=>Object.fromEntries(keys.map(k=>[k,object[k]??0]));
  return {format:1,mode:campaign.active?'campaign':'survival',index:campaign.index,shark:profile.selected,region:arcade.region,profile:JSON.parse(JSON.stringify(profile)),stats:values(game,gameSaveKeys),arcade:values(arcade,arcadeSaveKeys),params:values(game.params,runParamKeys),behavior:game.mode,player:packActor(game.player),fish:game.fish.map(packActor),enemies:game.enemies.map(packActor),jellies:game.jellies.map(packActor),boats:arcade.boats.map(packActor),obstacles:game.obstacles.map(o=>({p:[o.pos.x,o.pos.y],r:o.radius,seed:o.seed})),food:game.food.map(p=>[p.x,p.y]),mines:arcade.mines.map(p=>[p.x,p.y]),treasures:arcade.treasures.map(p=>[p.x,p.y]),missions:[...arcade.missionDone],counters:{jumps:campaign.jumps,yachts:campaign.yachts,treasures:campaign.treasures},damage:run.damage,bossDefeated:run.bossDefeated,flightCounted:campaign.flightCounted};
}
function resumeButton(){show('continueBtn',!!pendingRun);if(pendingRun)hudText('continueBtn',`REPRENDRE · ${pendingRun.mode==='campaign'?'NIVEAU '+(pendingRun.index+1):'SURVIE'} · ${Math.floor(pendingRun.stats.time/60)} MIN ▶`);}
function saveRun(){
  if(run.restoring||game.sandbox||!['playing','paused'].includes(game.state))return false;
  const snapshot=captureRun();if(!validRun(snapshot))return false;
  pendingRun=snapshot;run.saveClock=0;try{localStorage.setItem(RUN_KEY,JSON.stringify(snapshot));}catch{resumeButton();return false;}resumeButton();return true;
}
function clearRun(){pendingRun=null;try{localStorage.removeItem(RUN_KEY);}catch{try{localStorage.setItem(RUN_KEY,'null');}catch{}}resumeButton();}
try{const text=localStorage.getItem(RUN_KEY);if(text&&text.length<200000){const saved=JSON.parse(text);if(validRun(saved))pendingRun=saved;}}catch{}
function restoreProfile(saved){
  profile.coins=Math.max(0,Math.floor(saved.coins));profile.unlocked=['reef',...['hammer','great'].filter(id=>saved.unlocked?.includes(id))];
  for(const s of SHARKS)for(const k of ['speed','bite','boost'])profile.upgrades[s.id][k]=clamp(Math.floor(saved.upgrades?.[s.id]?.[k])||0,0,5);
}
function resumeRun(){
  if(!validRun(pendingRun))return false;
  const saved=JSON.parse(JSON.stringify(pendingRun));run.restoring=true;
  try{
    restoreProfile(saved.profile);profile.selected=saved.shark;chosen=saved.shark;
    if(saved.mode==='campaign')startLevel(saved.index);
    else{campaign.mode='survival';$('reefSelect').value=saved.region;start(false);}
    for(const key of gameSaveKeys)game[key]=saved.stats[key];for(const key of runParamKeys)game.params[key]=saved.params[key];game.mode=saved.behavior;$('behavior').value=game.mode;
    for(const [key,out]of Object.entries({maxSpeed:'speedOut',maxForce:'forceOut',vision:'visionOut',prediction:'predictionOut',population:'populationOut',separation:'separationOut',alignment:'alignmentOut',cohesion:'cohesionOut'})){$(key).value=String(game.params[key]);hudText(out,game.params[key]);}
    for(const key of ['currents','genetic','trails','vectors'])$(key).checked=game.params[key];
    game.player=unpackActor(saved.player,'player');game.player.variant=SHARKS[saved.shark].id;
    game.fish=saved.fish.map(r=>unpackActor(r,'fish'));game.enemies=saved.enemies.map(r=>unpackActor(r,'shark'));game.jellies=saved.jellies.map(r=>unpackActor(r,'jelly'));arcade.boats=saved.boats.map(r=>unpackActor(r,'boat'));
    game.obstacles=saved.obstacles.map(o=>{const rock=new Obstacle(...o.p,o.r);rock.seed=o.seed;return rock;});
    for(const key of ['food'])game[key]=saved[key].map(p=>new Vec(...p));for(const key of ['mines','treasures'])arcade[key]=saved[key].map(p=>new Vec(...p));
    for(const key of arcadeSaveKeys)arcade[key]=saved.arcade[key];arcade.missionDone=[...saved.missions];for(const key of ['jumps','yachts','treasures'])campaign[key]=saved.counters[key];campaign.flightCounted=!!saved.flightCounted;
    run.damage=saved.damage;run.bossDefeated=saved.bossDefeated;run.boss=game.enemies.find(e=>e.isBoss)||null;
    if(campaign.active&&campaign.index===3)attachLevelCurrent();
    game.canEatPrey=canEatPrey;game.onEnemyContact=onEnemyContact;syncGrowth();game.target=game.player.pos.copy();game.pointerAim=false;game.pointerBoost=false;game.keys.clear();game.particles=[];
    game.state='paused';show('pauseScreen',true);$('pauseBtn').textContent='▶';show('welcome',false);show('endScreen',false);
    updateZoom(0,true);updateCamera(0,true);persistProfile();flushProfile();updateHUD();toast('Partie restaurée · appuie sur Reprendre pour continuer');return true;
  }finally{run.restoring=false;}
}
function attachLevelCurrent(){game.player.manager.add('levelCurrent',c=>c.params.currents?new Vec(70*Math.sin(c.player.pos.y*.003+c.time*.25),22*Math.cos(c.time*.2)):new Vec(),1);}
$('continueBtn').onclick=resumeRun;
const progressFlush=flushProfile;
flushProfile=function(){
  const dirty=profileDirty;progressFlush();
  // Un achat au menu actualise le profil associé à la sauvegarde existante.
  if(dirty&&!run.restoring&&pendingRun&&game.state==='menu'){
    pendingRun.profile=JSON.parse(JSON.stringify(profile));try{localStorage.setItem(RUN_KEY,JSON.stringify(pendingRun));}catch{}
  }
};
function beginRun(){
  run.damage=0;run.bossDefeated=false;run.boss=null;run.saveClock=0;run.tipClock=0;run.tipUntil=0;run.nextTip=0;show('tutorialTip',false);show('endStars',false);show('ratingDetail',false);
  if(campaign.active&&campaign.index===5){const p=levelPosition(1350,700,300);run.boss=new ApexShark(p.x,p.y);game.enemies.push(run.boss);}
  if(!game.sandbox&&!run.restoring)saveRun();updateHUD();
}
const progressStartLevel=startLevel;
startLevel=function(index=levelProgress.selected){const ok=progressStartLevel(index);if(ok)beginRun();return ok;};
const progressStart=start;
start=function(sandbox=false){const viaLevel=!sandbox&&campaign.mode==='campaign';const result=progressStart(sandbox);if(!viaLevel&&game.state==='playing')beginRun();return result;};
const progressHome=returnHome;
returnHome=function(){saveRun();progressHome();run.boss=null;show('tutorialTip',false);resumeButton();};
$('pauseHome').onclick=returnHome;$('endHome').onclick=returnHome;
const progressHurt=hurt;
hurt=function(amount){const health=game.health;progressHurt(amount);if(game.state==='playing'&&!game.sandbox)run.damage+=Math.max(0,health-game.health);};
const progressFinish=finish;
finish=function(won=false){
  if(won&&campaign.active){const earned=starsFor(campaign.index,game.time,run.damage);levelProgress.stars[campaign.index]=Math.max(levelProgress.stars[campaign.index],earned);saveCampaignProgress();}
  progressFinish(won);clearRun();show('tutorialTip',false);
  if(won&&campaign.active){const stars=starsFor(campaign.index,game.time,run.damage),[limit,damage]=STAR_LIMITS[campaign.index];show('endStars',true);show('ratingDetail',true);hudText('endStars',starText(stars));hudText('ratingDetail',`Réussite ★ · ${game.time<=limit?'★':'☆'} Temps ${Math.floor(game.time)}/${limit} s · ${run.damage<=damage?'★':'☆'} Dégâts ${Math.ceil(run.damage)}/${damage} · Meilleur : ${starText(levelProgress.stars[campaign.index])}`);}
  else{show('endStars',false);show('ratingDetail',false);chirp('fail');}
};
function offerTip(key,text){
  if(run.seen[key]||game.time<run.nextTip)return false;
  run.seen[key]=true;run.tipUntil=game.time+6;run.nextTip=game.time+18;hudText('tipText',text);show('tutorialTip',true);
  try{localStorage.setItem('abyss-tips-v1',JSON.stringify(run.seen));}catch{}return true;
}
$('dismissTip').onclick=()=>{run.tipUntil=0;show('tutorialTip',false);};
function tickTips(dt){
  if(game.state!=='playing'){show('tutorialTip',false);return;}
  show('tutorialTip',game.time<run.tipUntil);run.tipClock+=dt;if(run.tipClock<.5||game.time<run.nextTip)return;run.tipClock=0;
  if(game.time>=1&&!run.seen.move)return offerTip('move','Vise avec la souris ou utilise les flèches / ZQSD. Sur mobile : joystick à gauche.');
  if(game.time>6&&game.enemies.some(e=>!canEatPrey(e)&&e.pos.dist(game.player.pos)<500))return offerTip('danger','! Danger : ce prédateur est trop grand. Éloigne-toi, puis mange pour grandir.');
  if(game.time>6&&!game.player.airborne&&game.player.pos.y<=game.waterY+170)return offerTip('jump','Près de la surface : J ou SAUT pour bondir. Tu retombes automatiquement dans l’eau.');
  if(game.time>8&&arcade.boats.some(b=>b.pos.dist(game.player.pos)<650))return offerTip('boat','Une barque se mange dès TAILLE ×2.0. Grandis, puis approche sa coque ; les bateaux plus grands demandent encore plus de taille.');
  if(game.time>8&&game.eaten>0&&game.boost>80)return offerTip('boost','Maintiens ESPACE ou BOOST pour accélérer. La jauge se recharge quand tu relâches.');
}
const progressStep=step;
step=function(dt){const active=game.state==='playing';progressStep(dt);tickTips(active?dt:0);if(active&&game.state==='playing'&&!game.sandbox){run.saveClock+=dt;if(run.saveClock>=5)saveRun();}};
const progressHUD=updateHUD;
updateHUD=function(){progressHUD();const active=campaign.active&&campaign.index===5&&['playing','paused'].includes(game.state);show('bossReadout',active);if(active)hudText('bossReadout',run.bossDefeated?'L’ANCIEN · VAINCU':`L’ANCIEN · ${run.boss?.state==='evade'?'ÉVASION':run.boss?.state==='pursue'?'POURSUITE':'EN CHASSE'}`);};
window.addEventListener('pagehide',saveRun);document.addEventListener('visibilitychange',()=>{if(document.hidden)saveRun();});
resumeButton();renderLevelMenu();
