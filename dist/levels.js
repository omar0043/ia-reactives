'use strict';
/** Campagne : objectifs et difficulté, sans dupliquer le pilotage des Vehicle.
 * game.level représente la croissance ; campaign.index représente le niveau. */
const LEVELS=[
  {name:'Le lagon d’azur',tag:'APPRENDRE À CHASSER',description:'Un lagon calme pour prendre tes marques.',reward:80,growthXP:0,growthEvery:8,enemies:2,jellies:6,mines:0,danger:30,drain:.7,region:'reef',currents:false,goals:[['prey',12],['score',500]]},
  {name:'L’envol du chasseur',tag:'PRENDRE DE LA HAUTEUR',description:'Remonte à la surface et bondis hors de l’eau.',reward:120,growthXP:0,growthEvery:8,enemies:3,jellies:8,mines:3,danger:40,drain:.85,region:'reef',currents:false,goals:[['prey',20],['jumps',2]]},
  {name:'La baie des épaves',tag:'DÉVORER LES BATEAUX',description:'Repars petit, grandis puis dévore une barque.',reward:180,growthXP:0,growthEvery:6,enemies:4,jellies:10,mines:6,danger:58,drain:1,region:'reef',currents:false,goals:[['prey',30],['boats',1]]},
  {name:'Les courants sauvages',tag:'EXPLORER LES RÉCIFS',description:'Suis la carte et retrouve les coffres dans les courants.',reward:240,growthXP:0,growthEvery:5,enemies:6,jellies:14,mines:10,danger:78,drain:1.15,region:'reef',currents:true,goals:[['prey',40],['treasures',2],['time',75]]},
  {name:'Les abysses',tag:'SURVIVRE AUX PRÉDATEURS',description:'Les prédateurs grossissent et la faim accélère.',reward:320,growthXP:0,growthEvery:4,enemies:8,jellies:18,mines:14,danger:96,drain:1.3,region:'deep',currents:true,goals:[['prey',50],['boats',2],['time',90]]},
  {name:'Le roi de l’océan',tag:'LE DÉFI ULTIME',description:'Deviens géant pour ta dernière chasse.',reward:500,growthXP:0,growthEvery:3,enemies:10,jellies:22,mines:18,danger:140,drain:1.45,region:'deep',currents:true,goals:[['prey',65],['yachts',1],['jumps',3]]}
];
function parseCampaignProgress(raw){
  const completed=LEVELS.map((_,i)=>raw?.completed?.[i]===true);
  // Le déblocage suit toujours la chaîne de niveaux terminés.
  let unlocked=0;while(unlocked<LEVELS.length-1&&completed[unlocked])unlocked++;
  const selected=Number.isInteger(raw?.selected)?clamp(raw.selected,0,unlocked):unlocked;
  const stars=completed.map((done,i)=>done?clamp(Math.floor(Number(raw?.stars?.[i]))||1,1,3):0);
  return {completed,unlocked,selected,stars};
}
let levelProgress=parseCampaignProgress(null);
try{levelProgress=parseCampaignProgress(JSON.parse(localStorage.getItem('abyss-campaign-v1')));}catch{}
const campaign={mode:'campaign',active:false,index:levelProgress.selected,won:false,jumps:0,yachts:0,treasures:0,flightCounted:false,previousCurrents:null};
function saveCampaignProgress(){try{localStorage.setItem('abyss-campaign-v1',JSON.stringify(levelProgress));}catch{toast('Progression conservée pour cette session · stockage indisponible');}}
function currentLevel(){return LEVELS[campaign.index];}
function goalValue(key){return {prey:game.eaten,score:game.score,jumps:campaign.jumps,boats:arcade.boatsEaten,yachts:campaign.yachts,treasures:campaign.treasures,time:Math.floor(game.time)}[key]||0;}
function goalLabel(key,n){return {prey:`${n} proies`,score:`${n.toLocaleString('fr-FR')} points`,jumps:`${n} saut${n>1?'s':''} hors de l’eau`,boats:`${n} bateau${n>1?'x':''}`,yachts:`${n} yacht`,treasures:`${n} coffres`,time:`${n} s de survie`}[key];}
function goalProgress(key,n){const label={prey:'PROIES',score:'POINTS',jumps:'SAUTS',boats:'BATEAUX',yachts:'YACHT',treasures:'COFFRES',time:'SURVIE'}[key];return `${label} ${Math.min(n,goalValue(key))}/${n}${key==='time'?' s':''}`;}
function stageGoalsComplete(){return currentLevel().goals.every(([key,n])=>goalValue(key)>=n);}
function updateStartLabel(){if(profile.unlocked.includes(SHARKS[chosen].id))$('startBtn').innerHTML=campaign.mode==='campaign'?`NIVEAU ${levelProgress.selected+1} <span>▶</span>`:'JOUER <span>▶</span>';}
const levelSharkChoice=renderSharkChoice;
renderSharkChoice=function(){levelSharkChoice();updateStartLabel();};
function renderLevelMenu(){
  const i=levelProgress.selected,level=LEVELS[i],isCampaign=campaign.mode==='campaign';
  document.body.classList.toggle('campaign-menu',isCampaign);
  $('campaignMode').setAttribute('aria-pressed',String(isCampaign));$('survivalMode').setAttribute('aria-pressed',String(!isCampaign));
  show('levelsBtn',isCampaign);hudText('levelPreviewNumber',String(i+1).padStart(2,'0')+' / 06');hudText('levelPreviewName',level.name);
  hudText('levelPreviewGoals',level.goals.map(([key,n])=>goalLabel(key,n)).join(' · '));
  $('levelGrid').innerHTML=LEVELS.map((l,j)=>{const locked=j>levelProgress.unlocked,done=levelProgress.completed[j];return `<button class="level-card theme-${j} ${j===i?'selected':''} ${done?'done':''}" data-level="${j}" ${locked?'disabled':''} aria-pressed="${j===i}"><span class="level-number">${String(j+1).padStart(2,'0')}<small>${locked?'VERROUILLÉ':done?'✓ TERMINÉ':'DISPONIBLE'}</small></span><span class="level-tag">${l.tag}</span><b>${l.name}</b><p>${l.description}</p><span class="level-objectives">${l.goals.map(([key,n])=>goalLabel(key,n)).join(' · ')}</span><span class="level-stars" aria-label="${levelProgress.stars[j]} étoiles sur 3">${'★'.repeat(levelProgress.stars[j])+'☆'.repeat(3-levelProgress.stars[j])}</span><span class="level-reward">${done?'RÉCOMPENSE REÇUE':`+ ${l.reward} ◉`}</span></button>`;}).join('');
  document.querySelectorAll('[data-level]').forEach(button=>button.onclick=()=>selectLevel(Number(button.dataset.level)));
  updateStartLabel();
}
function selectLevel(index){
  if(!Number.isInteger(index)||index<0||index>levelProgress.unlocked||index>=LEVELS.length)return false;
  levelProgress.selected=index;campaign.index=index;campaign.mode='campaign';saveCampaignProgress();renderLevelMenu();
  if($('levelsDialog').open)closeDialog('levelsDialog');return true;
}
function restoreLevelSettings(){
  if(campaign.previousCurrents!==null){game.params.currents=campaign.previousCurrents;$('currents').checked=game.params.currents;campaign.previousCurrents=null;}
  game.healthDrain=1.05;game.campaignRun=false;campaign.active=false;document.body.classList.remove('campaign-run');show('stageProgress',false);
}
function levelPosition(dx,dy,margin=150){
  // Objectifs proches du départ, sans les cacher dans les rochers.
  const origin=new Vec(1000,285);
  for(let attempt=0;attempt<32;attempt++){
    const p=Vec.add(origin,new Vec(dx+(attempt?rand(-400,400):0),dy+(attempt?rand(-400,400):0)));
    p.x=clamp(p.x,250,game.w-250);p.y=clamp(p.y,game.waterY+220,game.h-300);
    if(game.obstacles.every(o=>p.dist(o.pos)>o.radius+margin)&&p.dist(game.player.pos)>margin+250)return p;
  }
  return new Vec(1000+dx,game.waterY+240); // Le couloir de surface est sans récifs.
}
const levelSurvivalStart=start;
function startLevel(index=levelProgress.selected){
  if(!Number.isInteger(index)||index<0||index>levelProgress.unlocked||index>=LEVELS.length)return false;
  if(!profile.unlocked.includes(SHARKS[chosen].id)){toast('Débloque d’abord ce requin');return false;}
  restoreLevelSettings();campaign.index=index;levelProgress.selected=index;campaign.mode='campaign';
  const selectedRegion=$('reefSelect').value;$('reefSelect').value='reef';levelSurvivalStart(false);$('reefSelect').value=selectedRegion;
  const l=currentLevel();campaign.active=true;campaign.won=false;campaign.jumps=0;campaign.yachts=0;campaign.treasures=0;campaign.flightCounted=false;
  campaign.previousCurrents=game.params.currents;game.params.currents=l.currents;$('currents').checked=l.currents;
  game.growthXP=0;game.growthEvery=l.growthEvery;game.healthDrain=l.drain;game.campaignRun=true;syncGrowth();arcade.region=l.region;
  document.body.classList.add('campaign-run');document.body.classList.toggle('deep-ocean',l.region==='deep');
  game.enemies=Array.from({length:l.enemies},(_,i)=>{const p=levelPosition(1100+(i%3)*500,650+Math.floor(i/3)*600,220),enemy=new Shark(p.x,p.y);enemy.radius=l.danger+(i%2)*10;return enemy;});
  game.jellies=Array.from({length:l.jellies},(_,i)=>{const p=levelPosition(400+(i%5)*500,650+Math.floor(i/5)*480);return new Jelly(p.x,p.y);});
  arcade.mines=Array.from({length:l.mines},(_,i)=>levelPosition(800+(i%5)*500,900+Math.floor(i/5)*550));
  arcade.treasures=[levelPosition(700,650),levelPosition(1400,1050),...arcade.treasures.slice(2)];
  // Des bateaux proches rendent les objectifs réalisables dans le grand océan.
  if(index===5){const yacht=arcade.boats.find(b=>b.type===2);yacht.pos.x=1650;}
  updateZoom(0,true);updateCamera(0,true);updateHUD();saveCampaignProgress();
  banner(`NIVEAU ${index+1} · ${l.name.toUpperCase()}`);toast(l.goals.map(([key,n])=>goalLabel(key,n)).join(' · '));return true;
}
start=function(sandbox=false){
  if(!sandbox&&campaign.mode==='campaign')return startLevel();
  restoreLevelSettings();levelSurvivalStart(sandbox);updateHUD();
};
const levelReturnHome=returnHome;
returnHome=function(){restoreLevelSettings();levelReturnHome();renderLevelMenu();updateHUD();};
$('endHome').onclick=returnHome;$('pauseHome').onclick=returnHome;
$('campaignMode').onclick=()=>{campaign.mode='campaign';renderLevelMenu();};
$('survivalMode').onclick=()=>{campaign.mode='survival';renderLevelMenu();};
$('levelsBtn').onclick=()=>{renderLevelMenu();openDialog('levelsDialog');};
function restartFromFirstLevel(){
  // Rejouer conserve le profil, les étoiles et les niveaux débloqués.
  if(!profile.unlocked.includes(SHARKS[chosen].id)){chosen=0;renderSharkChoice();}
  return startLevel(0);
}
for(const id of ['restartFirstBtn','pauseRestartFirst','endRestartFirst'])$(id).onclick=restartFromFirstLevel;
const levelConsumeBoat=consumeBoat;
consumeBoat=function(boat){const isYacht=boat.type===2,consumed=levelConsumeBoat(boat);if(consumed&&campaign.active&&isYacht)campaign.yachts++;return consumed;};
const levelFinish=finish;
finish=function(won=false){
  levelFinish(won);hudText('endHome','Choisir mon requin');if(!campaign.active)return;
  const l=currentLevel();
  hudText('endTag',won?`NIVEAU ${campaign.index+1} TERMINÉ`:`NIVEAU ${campaign.index+1} · À RÉESSAYER`);
  hudText('endTitle',won?(campaign.index===LEVELS.length-1?'ROI DE L’OCÉAN !':'BIEN JOUÉ, CHASSEUR !'):'UNE NOUVELLE CHANCE ?');
  hudText('endText',won?(campaign.index===LEVELS.length-1?'Les 6 niveaux sont terminés. Rejoue tes défis favoris ou choisis Survie sans fin au menu.':`${l.name} réussi. Le niveau suivant est débloqué !`):`${l.name} · ${game.eaten} proies capturées. Recommence avec une vitalité pleine.`);
  hudText('againBtn',won&&campaign.index<LEVELS.length-1?`NIVEAU ${campaign.index+2} ▶`:'REJOUER CE NIVEAU ▶');
  hudText('endHome','Choisir un niveau / requin');
};
function completeLevel(){
  if(!campaign.active||campaign.won||game.state!=='playing'||!stageGoalsComplete())return false;
  campaign.won=true;
  const first=!levelProgress.completed[campaign.index],reward=first?currentLevel().reward:0;
  levelProgress.completed[campaign.index]=true;levelProgress.unlocked=Math.min(LEVELS.length-1,Math.max(levelProgress.unlocked,campaign.index+1));
  levelProgress.selected=Math.min(campaign.index+1,LEVELS.length-1);saveCampaignProgress();
  if(reward)addCoins(reward);finish(true);chirp('level');
  hudText('runReward',`${reward?`Bonus de niveau +${reward} ◉ · `:'Bonus de niveau déjà reçu · '}+${arcade.coinsRun} pièces au total · solde ${profile.coins} ◉`);
  return true;
}
$('againBtn').onclick=()=>{
  if(campaign.active)return startLevel(campaign.won?Math.min(campaign.index+1,LEVELS.length-1):campaign.index);
  start(false);
};
const levelStep=step;
step=function(dt){
  const active=campaign.active&&game.state==='playing',treasureCount=arcade.treasures.length;
  levelStep(dt);if(!active||!campaign.active||game.state!=='playing')return;
  campaign.treasures+=Math.max(0,treasureCount-arcade.treasures.length);
  // Compter seulement un saut qui traverse réellement la surface, une fois par vol.
  if(game.player.airborne&&game.player.enteredSky&&!campaign.flightCounted){campaign.jumps++;campaign.flightCounted=true;}
  if(!game.player.airborne)campaign.flightCounted=false;
  if(completeLevel())updateHUD();
};
const levelHUD=updateHUD;
updateHUD=function(){
  levelHUD();if(!campaign.active){show('stageProgress',false);return;}
  const l=currentLevel();hudText('arcadeLevel',`NIVEAU ${campaign.index+1}/6 · ${l.name.toUpperCase()}`);
  hudText('arcadeMission',l.goals.map(([key,n])=>goalProgress(key,n)).join(' · '));
  const progress=l.goals.reduce((sum,[key,n])=>sum+Math.min(1,goalValue(key)/n),0)/l.goals.length;
  show('stageProgress',true);$('stageProgressBar').style.width=progress*100+'%';
};
const levelMissions=$('missionsBtn').onclick;
$('missionsBtn').onclick=()=>{
  hudText('missionNote',campaign.active?'Tous les objectifs doivent être réussis dans la même plongée. La partie s’arrête à la réussite du niveau.':'Les défis rapportent des pièces. La partie continue tant que ton requin est vivant.');
  if(!campaign.active)return levelMissions();
  $('arcadeMissions').innerHTML=currentLevel().goals.map(([key,n])=>{const done=goalValue(key)>=n;return `<div class="arcade-mission ${done?'done':''}"><b>${done?'✓':'◇'} ${goalLabel(key,n)}</b><p>${Math.min(goalValue(key),n)} / ${n}</p><span>${done?'RÉUSSI':'EN COURS'}</span></div>`;}).join('')+`<p class="fine">Niveau ${campaign.index+1} · ${levelProgress.completed[campaign.index]?'Bonus déjà reçu':`Récompense : ${currentLevel().reward} pièces`}. Réussis tous les objectifs pour terminer ce niveau.</p>`;
  openDialog('missionDialog');
};
renderLevelMenu();
