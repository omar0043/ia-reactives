// Contact prolongé : pilote réellement le grand requin contre les récifs.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const folder=path.resolve(process.argv[2]||'dist'),context=vm.createContext({console,Math,Map,Set,Number,Array});
for(const name of ['vector','vehicle','actors'])vm.runInContext(fs.readFileSync(path.join(folder,name+'.js'),'utf8'),context);
const report=vm.runInContext(`
(()=>{
 const results=[];
 for(const scenario of ['headOn','diagonal','turnAlong','corner','pressContact','mouseContact','leaveContact']){
  const player=new Shark(1200,1800,true);player.radius=155;player.maxSpeed=255;player.maxForce=700;player.facing=0;player.vel=new Vec(255,0);if(['turnAlong','pressContact','mouseContact','leaveContact'].includes(scenario))player.manager.deactivate('avoid');
  const obstacles=scenario==='corner'?[new Obstacle(2000,1700,180),new Obstacle(2000,2050,140)]:[new Obstacle(2000,1800,160)];
  const c={player,obstacles,w:12000,h:6000,waterY:150,keys:new Set(['arrowright']),target:new Vec(3000,1800),params:{prediction:.55},fish:[],dt:1/60,time:0};
  if(scenario==='mouseContact')c.keys.clear();
  let maxStep=0,maxTurn=0,penetration=0,restJitter=0;
  for(let i=0;i<900;i++){
   if(scenario==='diagonal')c.keys.add('arrowdown');
   if(scenario==='leaveContact'&&i===400){c.keys.clear();c.keys.add('arrowleft');}
   if(scenario==='turnAlong'&&i===150){c.keys.clear();c.keys.add('arrowdown');}
   const before=player.pos.copy(),angle=player.facing;
   player.advance(1/60,c);player.resolveObstacles(obstacles);player.constrainToWorld(c.w,c.h,c.waterY);c.time+=1/60;
   if(i>300&&['pressContact','mouseContact'].includes(scenario))restJitter=Math.max(restJitter,player.pos.dist(before));
   if(i>20){maxStep=Math.max(maxStep,player.pos.dist(before));maxTurn=Math.max(maxTurn,Math.abs(Math.atan2(Math.sin(player.facing-angle),Math.cos(player.facing-angle))));}
   const axis=Vec.fromAngle(player.facing),back=Vec.sub(player.pos,axis.copy().mult(player.radius*1.05)),front=Vec.add(player.pos,axis.copy().mult(player.radius*1.5));
   for(const rock of obstacles)penetration=Math.max(penetration,rock.radius+player.radius*.95-projectPoint(rock.pos,back,front).dist(rock.pos));
   if(!Number.isFinite(player.pos.x+player.pos.y+player.vel.x+player.vel.y))throw Error('position invalide');
  }
  if(scenario==='leaveContact'&&player.pos.x>=1000)throw Error('impossible de quitter le rocher');
  results.push({scenario,maxStep:+maxStep.toFixed(3),maxTurnDegrees:+(maxTurn*180/Math.PI).toFixed(2),penetration:+penetration.toFixed(3),restJitter:+restJitter.toFixed(4)});
 }
 return results;
})()`,context);
console.log(JSON.stringify({folder,results:report}));
if(!process.argv[2])for(const result of report){assert.ok(result.maxStep<35,result.scenario+': pas de téléportation au contact');assert.ok(result.maxTurnDegrees<8,result.scenario+': rotation continue');assert.ok(result.penetration<.6,result.scenario+': capsule hors des rochers');if(['pressContact','mouseContact'].includes(result.scenario))assert.ok(result.restJitter<.1,result.scenario+': repos stable contre le rocher');}
// Régression du signalement à la souris : la rotation de la grande capsule
// provoquait des corrections brusques que les approches rectilignes rataient.
const turns=vm.runInContext(`
(()=>{
 const results=[];
 for(const radius of [25,82,155])for(const scenario of ['mouseInside','mouseAround','twoRocks']){
  const player=new Shark(1200,1800,true);player.radius=radius;player.maxSpeed=520;player.maxForce=700;player.facing=0;player.vel=new Vec(300,0);
  const obstacles=scenario==='twoRocks'?[new Obstacle(2000,1600,180),new Obstacle(2000,2100,180)]:[new Obstacle(2000,1800,180)];
  const c={player,obstacles,w:12000,h:6000,waterY:150,keys:new Set(),target:new Vec(2000,1800),params:{prediction:.55},fish:[],dt:1/60,time:0};
  let maxCorrection=0,maxExcess=0,maxPenetration=0,contacts=0;
  for(let i=0;i<1800;i++){
   const dt=[1/60,1/30,1/120,.05][i%4];c.dt=dt;
   if(scenario==='mouseAround'){c.target.x=2000+Math.cos(i*.013)*400;c.target.y=1800+Math.sin(i*.013)*400;}
   if(i===1400)c.keys.add('arrowleft');
   player.advance(dt,c);const x=player.pos.x,y=player.pos.y;
   player.resolveObstacles(obstacles);player.constrainToWorld(c.w,c.h,c.waterY);c.time+=dt;
   const correction=Math.hypot(player.pos.x-x,player.pos.y-y);
   if(i<1400){maxCorrection=Math.max(maxCorrection,correction);maxExcess=Math.max(maxExcess,correction-player.maxSpeed*dt);}
   if(player.contacts.length)contacts++;
   const axis=Vec.fromAngle(player.facing),back=Vec.sub(player.pos,axis.copy().mult(radius*1.05)),front=Vec.add(player.pos,axis.copy().mult(radius*1.5));
   for(const rock of obstacles)maxPenetration=Math.max(maxPenetration,rock.radius+radius*.95-projectPoint(rock.pos,back,front).dist(rock.pos));
   if(!Number.isFinite(player.pos.x+player.pos.y))throw Error('position invalide');
  }
  if(player.pos.x>=1200)throw Error(scenario+': impossible de repartir du contact');
  results.push({radius,scenario,maxCorrection:+maxCorrection.toFixed(3),maxExcess:+maxExcess.toFixed(3),maxPenetration:+maxPenetration.toFixed(3),contacts});
 }
 return results;
})()`,context);
console.log(JSON.stringify({turning:turns}));
if(!process.argv[2])for(const result of turns){if(result.radius===155){assert.ok(result.contacts>0,result.scenario+': contact réellement exercé');assert.ok(result.maxCorrection<.15,result.scenario+': aucune secousse de rotation à grande taille');}assert.ok(result.maxExcess<.15,result.scenario+': la rotation ne repousse pas le corps');assert.ok(result.maxPenetration<.01,result.scenario+': corps hors du récif');}
