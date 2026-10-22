// Vérifications déterministes des algorithmes et de la boucle, sans navigateur.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context=vm.createContext({console,Math,Map,Set,Number,Array,JSON,Error});
for(const name of ['vector','vehicle','actors','neural'])vm.runInContext(fs.readFileSync(`dist/${name}.js`,'utf8'),context);
vm.runInContext(`
function check(test,message){if(!test)throw Error(message);}
const v=new Vehicle(0,0);v.vel=new Vec(20,0);v.maxForce=500;v.maxSpeed=100;
check(v.seek(new Vec(100,0)).x===80,'seek desired-current');
check(v.flee(new Vec(100,0)).x===-120,'flee doit inverser desired, pas la force');
check(v.arrive(new Vec(0,0)).x===-20,'arrive freine à l’arrêt');
const pr=projectPoint(new Vec(200,40),new Vec(0,0),new Vec(100,0));check(pr.x===100&&pr.y===0,'projection bornée');
const obstacle=new Obstacle(80,0,20);check(v.avoid([obstacle]).mag()>0,'obstacle détecté devant');
v.pos=new Vec(80,0);v.resolveObstacles([obstacle]);check(v.pos.dist(obstacle.pos)>=v.radius+obstacle.radius,'résolution de pénétration');
const target=new Vehicle(100,0);target.vel=new Vec(0,10);v.pos=new Vec(0,0);v.pursue(target,.5);check(v.predicted.y===5,'prédiction temporelle');
const manager=new BehaviorManager(v);manager.add('a',()=>new Vec(10,0),2);check(manager.getSteeringForce({}).x===20,'poids');manager.deactivate('a');check(manager.getSteeringForce({}).mag()===0,'désactivation');manager.activate('a');const data=manager.serialize();manager.changeWeight('a',3);manager.restore(data);check(manager.getBehavior('a').weight===2,'restauration');
const brain=new Brain([11,8,2]);const copy=Brain.fromJSON(JSON.parse(JSON.stringify(brain.toJSON())));check(brain.predict(Array(11).fill(.1)).every((n,i)=>n===copy.predict(Array(11).fill(.1))[i]),'cerveau round-trip');
let refused=false;try{Brain.fromJSON({format:'x'});}catch{refused=true;}check(refused,'refus import invalide');
const trainer=new EvolutionTrainer();trainer.running=true;for(let i=0;i<60*25;i++)trainer.step(1/60);check(trainer.generation>=3,'générations successives');check(trainer.bestEver!==null,'sauvegarde meilleur cerveau');check(trainer.agents.every(a=>Number.isFinite(a.pos.x+a.pos.y+a.score)),'fitness et positions finies');
const parent=new Fish(10,10,0,[1,1,1,1],2),child=parent.offspring(100,100);check(child.generation===3&&child.dna!==parent.dna,'hérédité indépendante');
`,context);
// Exécuter la vraie boucle de jeu avec un DOM minimal, sans dessin.
const elements=new Map();
function el(id){if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',checked:false,style:{},classList:{toggle(){},add(){},remove(){}},addEventListener(){},setAttribute(){},getBoundingClientRect(){return {width:1000,height:700,left:0,top:0};},getContext(){return {setTransform(){}};},focus(){},setPointerCapture(){},showModal(){this.open=true;},close(){this.open=false;},open:false});return elements.get(id);}
Object.assign(context,{document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},devicePixelRatio:1,requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},localStorage:{getItem:()=>null,setItem(){}}});
vm.runInContext(fs.readFileSync('dist/game.js','utf8'),context);
vm.runInContext(`
start(true);game.enemies=[];game.jellies=[];game.params.genetic=false;game.target=game.player.pos.copy();const prey=new Fish(game.player.pos.x,game.player.pos.y,0);game.fish=[prey];step(1/60);check(game.eaten===1&&game.score>0,'capture donne score');
for(const mode of ['flock','wander','path','leader','snake','seek','flee','evade']){game.mode=mode;for(let i=0;i<180;i++)step(1/60);check(game.fish.every(f=>Number.isFinite(f.pos.x+f.pos.y+f.vel.x+f.vel.y)),'mode stable '+mode);}
const oldTime=game.time;pause();step(1);check(game.time===oldTime,'pause arrête le temps');pause();check(game.state==='playing','reprise');
start(false);game.enemies=[];game.jellies=[];game.health=.001;step(.05);check(game.state==='ended','défaite par épuisement');
start(false);game.enemies=[];game.jellies=[];game.eaten=25;game.score=1000;game.time=90;step(1/60);check(game.state==='playing'&&game.health>0,'survie continue après trois objectifs');
`,context);
console.log('PASS: vecteurs, flee, arrive, projection, anticipation, évitement, gestionnaire, ADN, réseaux, import, 3 générations, captures, 8 modes, pause, défaite et survie continue.');

context.document.querySelectorAll=()=>[];
context.cameraStream=null;
context.document.body={classList:{toggle(){},add(){},remove(){}}};
for(const id of ['reefSelect'])el(id).value='reef';
vm.runInContext(fs.readFileSync('dist/arcade.js','utf8'),context);
vm.runInContext(`
start(false);check(game.w===12000&&game.h===6000,'grand océan');
check(game.player.variant==='reef','requin sélectionné');
const coinsBefore=profile.coins;game.fish=[];game.enemies=[];game.jellies=[];
for(let i=0;i<13;i++)eatFish(new Fish(game.player.pos.x,game.player.pos.y,2));
check(profile.coins>coinsBefore,'pièces gagnées');check(arcade.rushTime>0,'frénésie déclenchée');
const beforeHealth=game.health;hurt(30);check(game.health===beforeHealth,'protection frénésie');
profile.coins=500;chosen=0;const cost=upgradeCost('speed');check(buyUpgrade('speed'),'achat amélioration');check(profile.coins===500-cost&&profile.upgrades.reef.speed===1,'prix et rang');
const rank=profile.upgrades.reef.speed;profile.coins=0;check(!buyUpgrade('speed')&&profile.upgrades.reef.speed===rank,'achat impossible sans pièces');
start(false);game.enemies=[];game.jellies=[];game.eaten=25;game.score=1000;game.time=90;game.fish=[];step(1/60);check(game.state==='playing','pas de fin automatique');check(arcade.missionDone.every(Boolean),'missions récompensées');
const after=profile.coins;step(1/60);check(profile.coins===after,'récompense unique');
start(false);game.enemies=[];game.jellies=[];game.params.genetic=false;const big=new Fish(game.player.pos.x,game.player.pos.y,0);big.requiredBite=3;big.creature='ray';big.radius=27;game.fish=[big];const beforeEaten=game.eaten;step(1/60);check(game.eaten===beforeEaten&&game.fish.includes(big),'proie trop grande non mangée');
profile.unlocked.push('hammer');chosen=1;
for(const mode of ['flock','wander','path','leader','snake','seek','flee','evade']){game.mode=mode;for(let i=0;i<60;i++)step(1/60);check(game.fish.every(f=>Number.isFinite(f.pos.x+f.pos.y)),'mode arcade stable '+mode);}
`,context);
console.log('PASS arcade: grand monde, profil, pièces, frénésie, invulnérabilité, achats, budget, missions uniques, survie sans fin, huit modes.');
// Vérifier le cycle du saut, la visibilité caméra, la taille et les bateaux.
vm.runInContext(`
chosen=0;profile.selected=0;start(true);game.enemies=[];game.jellies=[];game.fish=[];
game.player.pos=new Vec(750,210);game.player.vel=new Vec(170,-180);game.target=game.player.pos.copy();
check(requestJump(),'saut lancé près de la surface');check(game.player.airborne,'phase aérienne');
let minY=game.player.pos.y,sawSky=false,landed=false;
for(let i=0;i<240;i++){step(1/60);minY=Math.min(minY,game.player.pos.y);if(game.player.pos.y<game.waterY)sawSky=true;if(sawSky&&!game.player.airborne){landed=true;break;}}
check(minY< -100,'arc de saut suffisamment haut');check(sawSky&&landed,'sortie et retour dans eau');
check(game.camera.y<0,'caméra montre le ciel');check(game.player.pos.y>=game.waterY,'atterrissage sous la surface');
check(!requestJump(),'pas de double saut pendant le délai de recharge');
for(let i=0;i<70;i++)step(1/60);
game.player.pos=new Vec(800,800);check(!requestJump(),'pas de saut instantané depuis les profondeurs');
start(true);game.player.pos=new Vec(700,200);check(requestJump(),'nouveau saut');
const jumpY=game.player.pos.y,jumpV=game.player.vel.y;pause();step(.5);check(game.player.pos.y===jumpY&&game.player.vel.y===jumpV,'pause fige aussi le saut');pause();
start(true);game.enemies=[];game.jellies=[];game.params.genetic=false;
const preySized=new Fish(700,600,0);preySized.radius=32;preySized.requiredBite=99;
check(!canEatPrey(preySized),'plus gros que requin au début');
game.eaten=16;syncGrowth();check(canEatPrey(preySized),'grandir rend la même proie comestible sans condition de morsure');
const equal=new Fish(700,600,0);equal.radius=game.player.radius;check(!canEatPrey(equal),'taille égale ne compte pas comme plus petite');
arcade.rushTime=1;check(canEatPrey(equal),'frénésie conserve son exception');arcade.rushTime=0;
start(true);check(arcade.boats.length===12&&arcade.boats.every(b=>b instanceof Vehicle),'bateaux autonomes présents');
const smallBoat=arcade.boats.find(b=>b.type===0),middleBoat=arcade.boats.find(b=>b.type===1),largeBoat=arcade.boats.find(b=>b.type===2);
check(!canEatBoat(smallBoat)&&!consumeBoat(smallBoat),'petit requin ne mange pas bateau');
game.eaten=40;syncGrowth();check(canEatBoat(smallBoat)&&!canEatBoat(middleBoat),'premier seuil de bateaux');
const beforeBoatScore=game.score,beforeBoatCoins=profile.coins,count=arcade.boats.length;
check(consumeBoat(smallBoat),'bateau dévoré');check(arcade.boats.length===count-1&&arcade.boatsEaten===1&&arcade.wrecks.length===1,'bateau retiré et épave animée');
check(game.score>beforeBoatScore&&profile.coins>beforeBoatCoins,'score et pièces bateau');
const coinsOnce=profile.coins;check(!consumeBoat(smallBoat)&&profile.coins===coinsOnce,'pas de double récompense bateau');
game.eaten=80;syncGrowth();check(canEatBoat(middleBoat)&&!canEatBoat(largeBoat),'deuxième seuil');
game.eaten=144;syncGrowth();check(canEatBoat(largeBoat),'yacht accessible en grandissant');
const contextBoat={player:game.player,waterY:game.waterY,w:game.w};const b=new Boat(500,game.waterY,0);for(let i=0;i<300;i++)b.tick(1/60,contextBoat);check(b.pos.y===game.waterY&&Number.isFinite(b.pos.x),'navigation bateau sur surface');
`,context);
console.log('PASS saut et bateaux: envol, gravité, caméra ciel, retour, recharge, profondeur, pause aérienne, proies par taille, trois seuils de bateaux, récompense unique et navigation.');
vm.runInContext(`
chosen=0;profile.selected=0;start(true);game.enemies=[];game.jellies=[];game.fish=[];game.params.genetic=false;
let contactBoat=arcade.boats[0];game.player.pos=new Vec(contactBoat.pos.x,game.waterY+10);game.player.vel=new Vec();game.target=game.player.pos.copy();
step(1/60);check(arcade.boats.includes(contactBoat),'collision petit requin conserve bateau');
game.eaten=40;syncGrowth();game.player.pos=new Vec(contactBoat.pos.x,game.waterY+20);game.target=game.player.pos.copy();step(1/60);check(!arcade.boats.includes(contactBoat)&&arcade.boatsEaten===1,'contact réel dévore bateau après croissance');
start(true);game.enemies=[];game.jellies=[];game.fish=[];game.player.pos=new Vec(800,game.waterY+12);game.player.vel=new Vec(0,-250);game.keys.add(' ');game.keys.add('arrowup');step(1/60);check(game.player.airborne,'remontée avec boost déclenche saut automatique');game.keys.clear();
`,context);
console.log('PASS intégration: contact avec bateau selon croissance et saut automatique avec boost.');
// Régression : grand océan, transformations et requin à sa taille maximale.
vm.runInContext(`
chosen=0;profile.selected=0;start(true);game.enemies=[];game.jellies=[];game.fish=[];
check(game.w*game.h>=10*3600*1900,'océan au moins dix fois plus vaste');
check(game.obstacles.length>15,'récifs répartis dans grand océan');
for(let i=0;i<game.obstacles.length;i++)for(let j=i+1;j<game.obstacles.length;j++)check(game.obstacles[i].pos.dist(game.obstacles[j].pos)>game.obstacles[i].radius+game.obstacles[j].radius+699,'passages larges pour grand requin');
game.eaten=1000;syncGrowth();check(game.player.radius===155,'taille maximale stable');
for(const [w,h] of [[1363,936],[390,844],[844,390]]){
 game.width=w;game.height=h;updateZoom(0,true);game.player.pos=new Vec(6000,3000);updateCamera(0,true);
 check(game.zoom<1,'dézoom automatique à taille maximale');
 check(game.player.radius*5.8*game.zoom<=Math.min(w,h)*.45,'requin tient dans écran');
 const p=new Vec(6500,3300),roundtrip=screenToWorld(worldToScreen(p));check(p.dist(roundtrip)<1e-7,'visée et rendu utilisent même zoom');
 const view=viewportWorld();check(Math.abs(view.w*game.zoom-w)<1e-8,'dimensions de vue en monde');
 check(visible(new Vec(game.camera.x+view.w-1,game.camera.y+view.h-1),0),'culling inclut bord dézoomé');
 for(const angle of [0,Math.PI/2,Math.PI*.75]){
  game.player.vel=Vec.fromAngle(angle).mult(80);
  game.player.pos=new Vec(-100,game.h+100);game.player.constrainToWorld(game.w,game.h,game.waterY);updateCamera(0,true);
  const e=game.player.bodyExtents();
  check(game.player.pos.x-e.x>=11,'queue et nez restent dans bord gauche');
  check(game.player.pos.y+e.y<=game.h-89,'silhouette reste au-dessus fond');
  game.player.pos.x=game.w+500;game.player.constrainToWorld(game.w,game.h,game.waterY);updateCamera(0,true);
  check(game.player.pos.x+game.player.bodyExtents().x<=game.w-11,'silhouette reste dans bord droit');
 }
}
game.width=1000;game.height=700;updateZoom(0,true);game.player.pos=new Vec(6000,3000);game.player.vel=new Vec(150,0);
const rock=new Obstacle(6250,3000,120);game.player.resolveObstacles([rock]);
const axis=Vec.fromAngle(game.player.facing??0),back=Vec.sub(game.player.pos,axis.copy().mult(game.player.radius*1.05)),front=Vec.add(game.player.pos,axis.copy().mult(game.player.radius*1.5));
check(projectPoint(rock.pos,back,front).dist(rock.pos)>=rock.radius+game.player.radius*.95-.01,'capsule ne traverse pas le rocher');
check(Number.isFinite(game.player.pos.x+game.player.pos.y),'collision grand requin stable');
const farFish=new Fish(11000,5000,0);game.fish=[farFish];game.params.population=85;game.player.pos=new Vec(1000,400);updateCamera(0,true);arcade.rebalanceTime=.5;replenishNearbyFish(.1);check(farFish.pos.dist(game.player.pos)<2200,'grand monde reste peuplé près joueur');
start(true);game.eaten=1000;syncGrowth();updateZoom(0,true);game.player.pos=new Vec(1000,240);game.target=game.player.pos.copy();game.enemies=[];game.jellies=[];game.fish=[];check(requestJump(),'saut possible à taille maximale');
let airborneSeen=false;for(let i=0;i<150;i++){step(1/60);if(game.player.airborne&&game.player.pos.y<game.waterY)airborneSeen=true;check(Number.isFinite(game.camera.x+game.camera.y+game.zoom),'caméra et zoom stables pendant vol');}
check(airborneSeen&&!game.player.airborne,'saut complet du grand requin');
`,context);
console.log('PASS grand océan: surface ×10, passages espacés, dézoom PC/mobile/paysage, visée inverse, culling, silhouette aux bords/fond, capsule-rocher, population proche, saut maximal.');
// Même calcul Boids, moins de candidats grâce à la grille spatiale.
vm.runInContext(`
const swarm=Array.from({length:300},(_,i)=>{const f=new Fish((i%30)*115,Math.floor(i/30)*105,0);f.vel=new Vec(i%9-4,i%7-3);return f;}),index=new SpatialGrid(128).rebuild(swarm);
let totalCandidates=0;
for(const f of swarm){const neighbors=index.query(f.pos,110);totalCandidates+=neighbors.length;for(const [name,range] of [['separation',34],['alignment',95],['cohesion',110]]){const brute=f[name](swarm,range),indexed=f[name](neighbors,range);check(brute.dist(indexed)<1e-8,'force identique avec grille '+name);}}
check(totalCandidates<swarm.length*swarm.length/5,'index réduit nombre de voisins examinés');
const traced=new Fish(20,20,0);traced.trackHistory=true;for(let i=0;i<60;i++)traced.update(1/60);check(traced.history.length===45,'trajectoire visible reste bornée');traced.trackHistory=false;traced.update(1/60);check(traced.history.length===0,'pas de trajectoire allouée hors affichage');
const debugManager=new BehaviorManager(traced);debugManager.add('test',()=>new Vec(3,4));debugManager.getSteeringForce({params:{vectors:false}});check(debugManager.lastForces.length===0,'pas de copies forces hors debug');debugManager.getSteeringForce({params:{vectors:true}});check(debugManager.lastForces.length===1,'forces conservées en vision IA');
`,context);
let saveWrites=0;context.localStorage.setItem=()=>saveWrites++;
vm.runInContext(`flushProfile();flushBest();`,context);saveWrites=0;
vm.runInContext(`
chosen=0;profile.selected=0;start(true);for(let i=0;i<100;i++)eatFish(new Fish(1000,500,0));
`,context);
assert.equal(saveWrites,0,'les captures ne font aucune écriture synchrone de sauvegarde');
vm.runInContext(`flushProfile();flushBest();`,context);assert.equal(saveWrites,2,'deux sauvegardes groupées pour cent captures');
context.devicePixelRatio=3;
vm.runInContext(`
const retainedFish=game.fish.length,retainedRadius=game.player.radius;graphics.economy=false;resize();check(canvas.width*canvas.height<=graphics.pixelBudget+10000,'budget de pixels sur écran haute densité');
$('performanceBtn').onclick();check(graphics.economy,'bouton active mode fluide');check(game.fish.length===retainedFish&&game.player.radius===retainedRadius,'mode fluide conserve gameplay');check(canvas.width*canvas.height<=850000+10000,'budget plus léger en mode fluide');
$('performanceBtn').onclick();check(!graphics.economy,'retour qualité équilibrée');
`,context);
console.log('PASS fluidité: grille exacte, candidats réduits, traces/debug à la demande, sauvegardes groupées, résolution plafonnée, mode fluide sans changer gameplay.');
// Campagne : vraie boucle, sauts, collisions de trésors, bateaux et transitions.
const campaignSaves=new Map();context.localStorage.setItem=(key,value)=>campaignSaves.set(key,String(value));
vm.runInContext(fs.readFileSync('dist/levels.js','utf8'),context);
vm.runInContext(`
function quietLevel(){game.enemies=[];game.jellies=[];game.fish=[];game.food=[];arcade.mines=[];game.params.population=0;game.params.genetic=false;game.target=game.player.pos.copy();}
chosen=0;profile.selected=0;game.params.currents=false;
check(LEVELS.length===6&&levelProgress.unlocked===0,'six niveaux, seul le premier débloqué');
const priorState=game.state;check(!startLevel(1)&&game.state===priorState,'niveau verrouillé ne démarre pas');
check(!selectLevel(-1)&&!selectLevel(99)&&!startLevel(NaN),'indices invalides refusés');
start(false);check(campaign.active&&!game.sandbox&&campaign.index===0,'Jouer démarre campagne');
check(game.healthDrain===.7&&game.enemies.length===2&&arcade.mines.length===0,'difficulté de départ adaptée');
quietLevel();game.health=90;step(.05);check(Math.abs(game.health-(90-.7*.05))<1e-8,'faim du niveau appliquée');
check(!completeLevel(),'pas de victoire avant objectifs');
for(let i=0;i<12;i++)eatFish(new Fish(1000,500,0));
const beforeLevelBonus=profile.coins;check(completeLevel(),'niveau terminé quand tous objectifs atteints');
check(game.state==='ended'&&campaign.won&&levelProgress.unlocked===1,'fin et déblocage du suivant');
check(profile.coins===beforeLevelBonus+80,'bonus exact de niveau');
const completedCoins=profile.coins;check(!completeLevel()&&profile.coins===completedCoins,'pas de double bonus');
$('againBtn').onclick();check(campaign.index===1&&game.state==='playing'&&game.health===100,'bouton lance niveau suivant');
quietLevel();check(game.growthXP===0&&game.player.radius===25,'chaque nouveau niveau repart petit');
game.player.pos=new Vec(1000,game.waterY+50);game.target=game.player.pos.copy();
check(requestJump(),'saut du niveau 2 lancé');
for(let i=0;i<16;i++)step(1/60);
check(campaign.jumps===1&&game.player.airborne,'un saut compté après traversée réelle de la surface');
const pausedStageTime=game.time,pausedStageJumps=campaign.jumps;pause();step(1);check(game.time===pausedStageTime&&campaign.jumps===pausedStageJumps,'pause fige progression de niveau');pause();
for(let i=0;i<220;i++)step(1/60);check(campaign.jumps===1,'pas de répétition pendant le même vol');
game.player.pos=new Vec(1000,game.waterY+50);game.player.vel=new Vec();game.target=game.player.pos.copy();check(requestJump(),'second saut lancé');
for(let i=0;i<220;i++)step(1/60);check(campaign.jumps===2,'deuxième saut compté');
for(let i=0;i<20;i++)eatFish(new Fish(1000,500,0));check(completeLevel(),'objectifs proies et sauts terminent niveau 2');
$('againBtn').onclick();check(campaign.index===2&&game.player.radius===25&&!canEatBoat(arcade.boats.find(b=>b.type===0)),'niveau bateau redémarre petit');game.eaten=30;syncGrowth();check(canEatBoat(arcade.boats.find(b=>b.type===0)),'grandir dans le niveau débloque la barque');
quietLevel();const stageBoat=arcade.boats.find(b=>b.type===0);check(consumeBoat(stageBoat)&&arcade.boatsEaten===1,'objectif bateau utilise capture réelle');
game.eaten=30;check(completeLevel(),'niveau bateau terminé');
$('againBtn').onclick();check(campaign.index===3&&game.params.currents,'courants activés au niveau 4');
quietLevel();
for(let i=0;i<2;i++){const chest=arcade.treasures[0];game.player.pos=chest.copy();game.player.vel=new Vec();game.target=game.player.pos.copy();step(.001);}
check(campaign.treasures===2,'coffres comptés par collision réelle');game.eaten=40;game.time=75;check(completeLevel(),'niveau exploration terminé');
$('againBtn').onclick();check(campaign.index===4&&arcade.region==='deep'&&game.enemies.length===8,'niveau abysses et difficulté accrue');
game.eaten=25;game.health=0;finish(false);check(!campaign.won&&levelProgress.unlocked===4,'échec ne débloque pas niveau');
$('againBtn').onclick();check(campaign.index===4&&game.eaten===0&&game.health===100,'échec recommence même niveau avec compteurs réinitialisés');
quietLevel();game.eaten=50;arcade.boatsEaten=2;game.time=90;check(completeLevel(),'niveau 5 terminé');
$('againBtn').onclick();check(campaign.index===5&&game.player.radius===25,'défi final recommence petit');game.eaten=60;syncGrowth();check(game.player.radius>=125,'croissance du niveau final atteint seuil du yacht');
quietLevel();const stageYacht=arcade.boats.find(b=>b.type===2);check(consumeBoat(stageYacht)&&campaign.yachts===1,'vrai yacht compté');check(!consumeBoat(stageYacht)&&campaign.yachts===1,'yacht ne compte pas deux fois');
game.eaten=65;campaign.jumps=3;check(completeLevel(),'campagne complète');
check(levelProgress.completed.every(Boolean)&&$('endTitle').textContent==='ROI DE L’OCÉAN !','fin des six niveaux affichée');
$('againBtn').onclick();check(campaign.index===5&&game.state==='playing','pas de septième niveau invalide');
returnHome();check(!campaign.active&&!game.params.currents&&game.healthDrain===1.05,'menu restaure réglages avant campagne');
check(selectLevel(0),'ancien niveau rejouable');startLevel(0);quietLevel();game.eaten=12;game.score=500;
const replayCoins=profile.coins;check(completeLevel()&&profile.coins===replayCoins,'bonus non renouvelé en rejouant');
returnHome();$('survivalMode').onclick();start(false);check(!campaign.active&&!game.campaignRun&&game.growthXP===0&&game.player.radius===25,'survie conserve croissance initiale et règles');
quietLevel();game.eaten=25;game.score=1000;game.time=90;step(.001);check(game.state==='playing'&&arcade.missionDone.every(Boolean),'survie conserve ses défis et ne finit pas automatiquement');
returnHome();$('campaignMode').onclick();start(true);check(game.sandbox&&!campaign.active&&!game.campaignRun,'exploration indépendante de la campagne');
const badProgress=parseCampaignProgress({selected:99,completed:[true,false,true]});check(badProgress.unlocked===1&&badProgress.selected===1,'sauvegarde borne niveau selon progression valide');
`,context);
const storedCampaign=JSON.parse(campaignSaves.get('abyss-campaign-v1'));
assert.ok(storedCampaign.completed.every(Boolean),'les six réussites sont sauvegardées');
vm.runInContext(`const reloadedProgress=parseCampaignProgress(${JSON.stringify(storedCampaign)});check(reloadedProgress.unlocked===5&&reloadedProgress.completed.every(Boolean),'sauvegarde restaurable après rechargement');`,context);
console.log('PASS niveaux: six étapes, verrouillage, objectifs réels, faim progressive, pause, bonus unique, suivant, échec/reprise, départ petit, yacht, finale, sauvegarde, rejeu, survie et exploration.');
vm.runInContext(fs.readFileSync('dist/experience.js','utf8'),context);
// Contrôler aussi le rendu des six ambiances sans GPU : pas de coordonnée NaN.
const drawingFunctions={};let experienceDrawCalls=0;
const gradientStub={addColorStop(){}};
for(const name of new Set(fs.readdirSync('dist').filter(n=>n.endsWith('.js')).flatMap(n=>[...fs.readFileSync('dist/'+n,'utf8').matchAll(/ctx\.(\w+)\(/g)].map(m=>m[1]))))drawingFunctions[name]=(...args)=>{experienceDrawCalls++;for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'coordonnée de dessin finie : '+name);if(name.startsWith('create'))return gradientStub;};
context.drawingFunctions=drawingFunctions;
vm.runInContext(`
Object.assign(ctx,drawingFunctions);chosen=0;profile.selected=0;huntingAids.enabled=true;returnHome();
check(new Set(SCENES.map(s=>s.kind)).size===6,'six ambiances distinctes');
startLevel(0);const sizedFish=new Fish(1000,500,0);sizedFish.radius=25;
check(preySignal(sizedFish)==='grow','égalité de taille donne grandir');sizedFish.radius=24;check(preySignal(sizedFish)==='edible','proie strictement plus petite reconnue comestible');
const dangerousShark=new Shark(1500,600);dangerousShark.radius=30;check(preySignal(dangerousShark,'enemy')==='danger','prédateur plus grand signalé dangereux');
arcade.rushTime=1;check(preySignal(dangerousShark,'enemy')==='edible','repère suit frénésie');arcade.rushTime=0;
const signalBoat=arcade.boats[0];check(preySignal(signalBoat,'boat')==='grow','bateau trop grand signalé');game.eaten=40;syncGrowth();check(preySignal(signalBoat,'boat')==='edible','repère bateau suit croissance');
for(let stage=0;stage<6;stage++){
 check(startLevel(stage),'niveau accessible pour inspection');check(game.sceneStyle===SCENES[stage]&&huntingAids.scenery.length===24,'décor correspondant au niveau');
 for(const [w,h] of [[1363,936],[390,844],[844,390]]){game.width=w;game.height=h;updateZoom(0,true);updateCamera(0,true);updateHUD();render();}
}
startLevel(2);let nav=objectiveTarget();check(nav.kind==='food','guidage nourrit petit requin avant bateau');game.eaten=30;syncGrowth();nav=objectiveTarget();check(nav.kind==='boat'&&canEatBoat(nav.entity),'guidage vers bateau après croissance');
consumeBoat(nav.entity);nav=objectiveTarget();check(nav===null,'guidage terminé après bateau et proies du niveau');
startLevel(5);check(objectiveTarget().kind==='food','défi final commence par grandir');game.eaten=51;syncGrowth();check(objectiveTarget().kind==='yacht','défi final guide vers yacht après croissance');
startLevel(3);nav=objectiveTarget();check(nav.kind==='treasure'&&arcade.treasures.includes(nav.entity),'guidage vers coffre restant');
const nearestChest=closestEntity(arcade.treasures);check(nav.entity===nearestChest,'coffre le plus proche sélectionné');
check(game.player.manager.getBehavior('levelCurrent'),'courant du niveau dans BehaviorManager');
const currentBehavior=game.player.manager.getBehavior('levelCurrent');check(currentBehavior.fn({...game}).mag()>0,'courant applique une force réelle');
game.params.currents=false;check(currentBehavior.fn({...game}).mag()===0,'courants désactivables au laboratoire');game.params.currents=true;
const driftX=game.player.pos.x;step(1/60);check(game.player.pos.x>driftX,'courant déplace réellement le requin dans la boucle');
game.eaten=40;campaign.treasures=2;game.time=20;check(objectiveTarget().kind==='time','survie restante après objectifs de chasse');
game.health=20;check(objectiveTarget().kind==='food','priorité à la nourriture quand vitalité faible');
startLevel(1);check(objectiveTarget().kind==='surface','niveau de saut guide vers surface');campaign.jumps=2;check(objectiveTarget().kind==='food','guidage vers proies après les sauts');
for(const [w,h] of [[1363,936],[390,844],[844,390]])for(const p of [new Vec(-3000,-2000),new Vec(5000,4000),new Vec(-100,300),new Vec(w/2,h/2)]){
 const anchor=compassGeometry(new Vec(w/2,h/2),p,w,h);check(Number.isFinite(anchor.x+anchor.y+anchor.angle),'flèche finie sur tous formats');
 check(anchor.x>=anchor.bounds.left-.01&&anchor.x<=anchor.bounds.right+.01&&anchor.y>=anchor.bounds.top-.01&&anchor.y<=anchor.bounds.bottom+.01,'flèche reste dans zone de jeu');
}
game.width=1363;game.height=936;game.zoom=.3;game.camera=new Vec(500,100);const nearNav=new Vec(1000,600),screenNav=worldToScreen(nearNav),roundNav=screenToWorld(screenNav);check(nearNav.dist(roundNav)<1e-8,'guidage et visée partagent conversion avec zoom');
const aidsRadius=game.player.radius,aidsCoins=profile.coins,aidsFish=game.fish.length;updateHUD();$('assistBtn').onclick();check(!huntingAids.enabled&&huntingAids.target===null,'aides masquables');
check(game.player.radius===aidsRadius&&profile.coins===aidsCoins&&game.fish.length===aidsFish,'aides ne modifient pas le gameplay');$('assistBtn').onclick();check(huntingAids.enabled,'aides réactivables');
returnHome();check(game.sceneStyle===null&&huntingAids.scenery.length===0&&!game.player.manager.getBehavior('levelCurrent'),'menu restaure ambiance et courant');
start(true);check(objectiveTarget()===null,'pas de guidage intrusif en exploration');
`,context);
assert.ok(experienceDrawCalls>1000,'rendu des ambiances exécuté');
console.log('PASS aides et décors: taille stricte, danger, frénésie, bateaux, objectif suivant, urgence faim, coffre proche, sauts, flèches PC/mobile/dézoom, six rendus sans NaN, courant pondéré, bascule et restauration.');
context.localStorage.removeItem=key=>campaignSaves.delete(key);
vm.runInContext(fs.readFileSync('dist/progression.js','utf8'),context);
vm.runInContext(fs.readFileSync('dist/audio.js','utf8'),context);
vm.runInContext(`
chosen=0;profile.selected=0;profile.coins=1000;returnHome();
check(starsFor(0,90,20)===3&&starsFor(0,91,20)===2&&starsFor(0,91,21)===1,'étoiles et seuils inclusifs');
check(parseCampaignProgress({completed:[true],stars:[]}).stars[0]===1,'anciennes réussites migrées en une étoile');
check(parseCampaignProgress({completed:[true],stars:[99]}).stars[0]===3,'étoiles sauvegardées bornées');
startLevel(2);game.eaten=30;syncGrowth();const resumeBoat=arcade.boats.find(b=>b.type===0);consumeBoat(resumeBoat);
arcade.treasures.shift();campaign.treasures=1;game.eaten=19;game.time=42;game.health=74;game.boost=62;run.damage=15;
game.player.pos=new Vec(1800,330);game.player.vel=new Vec(30,-10);game.player.invulnerable=.7;syncGrowth();
check(saveRun(),'sauvegarde de partie valide');
const checkpoint=JSON.parse(JSON.stringify(pendingRun)),checkpointCoins=profile.coins,checkpointRadius=game.player.radius;
check(validRun(checkpoint),'sauvegarde JSON relisible');returnHome();check(pendingRun!==null,'menu conserve partie reprenable');
check(resumeRun()&&game.state==='paused','reprise démarre en pause');
check(game.eaten===19&&game.time===42&&game.health===74&&game.boost===62&&game.player.radius===checkpointRadius,'reprise restaure taille, objectifs et vitalité');
check(game.player.pos.dist(new Vec(1800,330))<1e-8&&game.player.vel.dist(new Vec(30,-10))<1e-8&&game.player.invulnerable===.7,'position, vitesse et protection restaurées');
check(arcade.boats.length===11&&arcade.treasures.length===11&&campaign.treasures===1&&arcade.boatsEaten===1,'objets ramassés absents après reprise');
check(profile.coins===checkpointCoins&&run.damage===15,'profil et dégâts cohérents avec sauvegarde');
check(resumeRun()&&profile.coins===checkpointCoins,'reprendre deux fois ne paie aucune récompense');
returnHome();const savedUpgrade=profile.upgrades.reef.speed;check(buyUpgrade('speed'),'achat au menu avec partie sauvegardée');const purchasedCoins=profile.coins;check(resumeRun()&&profile.coins===purchasedCoins&&profile.upgrades.reef.speed===savedUpgrade+1,'reprise conserve achat et ne rembourse pas son prix');
check($('population').value===String(game.params.population)&&$('currents').checked===game.params.currents,'réglages affichés correspondent à la reprise');
const badCheckpoint=JSON.parse(JSON.stringify(checkpoint));badCheckpoint.stats.health=NaN;check(!validRun(badCheckpoint),'sauvegarde non finie refusée');badCheckpoint.stats.health=70;badCheckpoint.fish=Array(111).fill(checkpoint.fish[0]);check(!validRun(badCheckpoint),'population de sauvegarde bornée');
startLevel(1);game.enemies=[];game.jellies=[];game.fish=[];arcade.mines=[];game.params.population=0;game.params.genetic=false;game.player.pos=new Vec(1000,200);game.player.vel=new Vec();game.target=game.player.pos.copy();
check(requestJump(),'saut avant interruption');for(let i=0;i<16;i++)step(1/60);check(campaign.jumps===1,'saut compté avant sauvegarde');check(saveRun(),'saut en cours sauvegardé');
returnHome();check(resumeRun()&&game.player.airborne&&campaign.flightCounted,'état de vol et compteur restaurés');pause();for(let i=0;i<160;i++)step(1/60);check(campaign.jumps===1,'reprise en vol ne compte pas un deuxième saut');
startLevel(3);check(saveRun(),'niveau courant sauvegardé');returnHome();check(resumeRun()&&game.player.manager.getBehavior('levelCurrent'),'courant restauré comme comportement');
startLevel(0);game.enemies=[];game.jellies=[];game.fish=[];arcade.mines=[];game.player.invulnerable=0;run.damage=0;hurt(10);check(run.damage===10,'dégâts réels comptés');hurt(10);check(run.damage===10,'invulnérabilité sans pénalité supplémentaire');
game.player.invulnerable=0;arcade.rushTime=1;hurt(10);check(run.damage===10,'frénésie sans pénalité de dégâts');arcade.rushTime=0;
game.eaten=12;game.score=500;game.time=20;run.damage=0;check(completeLevel()&&levelProgress.stars[0]===3,'trois étoiles enregistrées à la réussite');
check(pendingRun===null,'partie terminée non reprenable');startLevel(0);game.eaten=12;game.score=500;game.time=120;run.damage=50;check(completeLevel()&&levelProgress.stars[0]===3,'rejeu plus faible conserve meilleur résultat');
startLevel(5);check(run.boss instanceof ApexShark&&game.enemies.filter(e=>e.isBoss).length===1,'unique prédateur final autonome');
const apex=run.boss;apex.pos=new Vec(game.player.pos.x+900,game.player.pos.y+500);arcade.rushTime=0;game.player.radius=133;
apex.manager.getSteeringForce({...game,dt:1/60});check(apex.state==='pursue','prédateur poursuit petit joueur');
game.player.radius=155;apex.manager.getSteeringForce({...game,dt:1/60});check(apex.state==='evade','prédateur fuit joueur plus grand');
check(saveRun(),'boss vivant sauvegardé');returnHome();check(resumeRun()&&run.boss instanceof ApexShark&&game.enemies.filter(e=>e.isBoss).length===1,'boss reconstruit sans duplication');
pause();game.eaten=65;arcade.boatXP=8;syncGrowth();campaign.jumps=3;campaign.yachts=1;game.time=200;run.damage=0;
const finalBoss=run.boss;onEnemyContact(finalBoss);const paidBossCoins=profile.coins;
check(run.bossDefeated&&!game.enemies.includes(finalBoss)&&goalValue('boss')===1,'capture élimine boss et valide objectif');
onEnemyContact(finalBoss);check(profile.coins===paidBossCoins,'récompense boss unique');check(completeLevel()&&levelProgress.stars[5]===3,'finale exige boss et donne étoiles');
startLevel(0);run.seen={};run.nextTip=0;game.time=2;tickTips(.5);check(run.seen.move&&run.tipUntil===8,'conseil de déplacement contextuel');
check(!offerTip('move','Encore'),'conseil non répété');$('dismissTip').onclick();check(run.tipUntil===0,'conseil fermable');
returnHome();campaign.mode='survival';start(false);game.eaten=7;game.time=23;check(saveRun(),'survie sauvegardée');returnHome();check(resumeRun()&&!campaign.active&&game.eaten===7&&game.time===23,'reprise de survie');
finish(false);check(pendingRun===null,'défaite efface reprise');
`,context);
let tones=0,buffers=0,splashesPlayed=0;
const automation={setValueAtTime(){},exponentialRampToValueAtTime(){}};
class FakeAudioContext{
 constructor(){this.currentTime=0;this.state='running';this.sampleRate=8000;this.destination={};}
 createOscillator(){return {frequency:automation,connect(){},start(){tones++;},stop(){}};}
 createGain(){return {gain:{...automation,value:0},connect(){}};}
 createBuffer(_,length){buffers++;const samples=new Float32Array(length);return {getChannelData:()=>samples};}
 createBufferSource(){return {connect(){},start(){splashesPlayed++;}};}
 createBiquadFilter(){return {frequency:{value:0},connect(){}};}
}
context.window.AudioContext=FakeAudioContext;
vm.runInContext(`sound=false;check(!chirp('eat'),'son muet par défaut');sound=true;check(chirp('eat'),'capture sonore');check(!chirp('eat'),'captures sonores limitées en fréquence');audio.currentTime+=1;check(chirp('splash'),'éclaboussure sonore');audio.currentTime+=1;check(chirp('splash'),'deuxième éclaboussure');check(chirp('boat')&&chirp('level'),'sons bateau et réussite distincts');sound=false;`,context);
assert.equal(tones,8,'deux notes capture, deux bateau et quatre réussite');assert.equal(buffers,1,'bruit de splash réutilisé');assert.equal(splashesPlayed,2,'deux sources courtes de splash');
console.log('PASS progression: sauvegarde/reprise campagne et survie, vol sans double saut, objets et profil cohérents, validation, migration/étoiles, dégâts, boss Pursue/Evade unique, conseils persistants, sons courts et limitation audio.');

// Chaque espèce repart à sa taille de base, même après une plongée géante.
vm.runInContext(`
profile.unlocked=['reef','hammer','great'];
for(let species=0;species<3;species++)for(let stage=0;stage<6;stage++){
 chosen=species;profile.selected=species;game.eaten=1000;arcade.boatXP=80;syncGrowth();
 check(startLevel(stage),'nouveau niveau démarré');
 check(game.player.radius===SHARKS[species].radius&&game.level===1&&game.growthXP===0&&game.eaten===0&&arcade.boatXP===0,'taille et XP remis au départ pour chaque niveau et espèce');
 game.eaten=LEVELS[stage].growthEvery;syncGrowth();check(game.player.radius===SHARKS[species].radius+6,'croissance locale fonctionne dans chaque niveau');
}
chosen=0;profile.selected=0;startLevel(5);game.eaten=51;syncGrowth();check(canEatBoat(arcade.boats.find(b=>b.type===2)),'yacht accessible après croissance depuis petit');
game.eaten=65;arcade.boatXP=8;syncGrowth();check(game.player.radius===155&&canEatPrey(run.boss),'finale accessible avec proies et XP du yacht');
check(saveRun(),'sauvegarde conserve croissance du niveau en cours');const localSize=game.player.radius;returnHome();check(resumeRun()&&game.player.radius===localSize,'reprise ne rétrécit pas une partie en cours');
startLevel(0);check(game.player.radius===25,'passer à un nouveau niveau rétrécit bien le requin');
`,context);
console.log('PASS départ petit: 6 niveaux × 3 espèces, XP réinitialisée, croissance locale, seuil yacht/boss et reprise de taille en cours.');
