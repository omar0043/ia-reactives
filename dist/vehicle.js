'use strict';
/** Gestionnaire indépendant par agent : jamais de liste mutable statique partagée. */
class BehaviorManager {
  constructor(owner){this.owner=owner;this.behaviors=new Map();this.lastForces=[];}
  add(name,fn,weight=1){this.behaviors.set(name,{name,fn,weight,active:true});return this;}
  remove(name){this.behaviors.delete(name);return this;}
  activate(name){const b=this.getBehavior(name);if(b)b.active=true;return this;}
  deactivate(name){const b=this.getBehavior(name);if(b)b.active=false;return this;}
  changeWeight(name,weight){const b=this.getBehavior(name);if(b)b.weight=weight;return this;}
  getBehavior(name){return this.behaviors.get(name);}
  getSteeringForce(context){const total=new Vec();this.lastForces.length=0;const debug=!!context.params?.vectors;for(const b of this.behaviors.values()){if(!b.active||b.weight===0)continue;const force=b.fn(context).mult(b.weight);if(!Number.isFinite(force.x+force.y))continue;total.add(force);if(debug)this.lastForces.push({name:b.name,force:force.copy()});}return total.limit(this.owner.maxForce*3);}
  serialize(){return [...this.behaviors.values()].map(({name,weight,active})=>({name,weight,active}));}
  restore(data){for(const b of data){this.changeWeight(b.name,b.weight);b.active?this.activate(b.name):this.deactivate(b.name);}}
}
/** Base commune à TOUS les objets mobiles : requins, poissons, méduses,
 * particules, agents d'entraînement. Unités : pixels, secondes, px/s, px/s². */
class Vehicle {
  constructor(x,y){this.pos=new Vec(x,y);this.vel=Vec.fromAngle(rand(0,Math.PI*2)).mult(45);this.acc=new Vec();this.maxSpeed=115;this.maxForce=160;this.radius=10;this.theta=rand(0,Math.PI*2);this.manager=new BehaviorManager(this);this.history=[];this.trackHistory=true;this.predicted=null;this.pathProjection=null;this.avoidTarget=null;}
  steer(desired){return desired.sub(this.vel).limit(this.maxForce);}
  seek(target){return this.steer(Vec.sub(target,this.pos).setMag(this.maxSpeed));}
  // Inverser la vitesse désirée AVANT de soustraire la vitesse actuelle.
  flee(target){return this.steer(Vec.sub(this.pos,target).setMag(this.maxSpeed));}
  arrive(target,slowRadius=100,stopRadius=5){const d=Vec.sub(target,this.pos),dist=d.mag();const speed=this.maxSpeed*clamp((dist-stopRadius)/(slowRadius-stopRadius),0,1);return this.steer(d.setMag(speed));}
  pursue(target,prediction=.55){const horizon=Math.min(prediction,this.pos.dist(target.pos)/(this.maxSpeed||1));this.predicted=Vec.add(target.pos,target.vel.copy().mult(horizon));return this.seek(this.predicted);}
  evade(target,prediction=.55){const horizon=Math.min(prediction,this.pos.dist(target.pos)/(this.maxSpeed||1));this.predicted=Vec.add(target.pos,target.vel.copy().mult(horizon));return this.flee(this.predicted);}
  wander(dt=1/60){this.theta+=rand(-1,1)*1.9*Math.sqrt(dt);const center=this.vel.copy().normalize().mult(65);const displacement=Vec.fromAngle(this.theta).mult(35);return this.seek(Vec.add(this.pos,center.add(displacement)));}
  boundaries(w,h,margin=65){const desired=this.vel.copy();let needs=false;if(this.pos.x<margin){desired.x=this.maxSpeed;needs=true;}else if(this.pos.x>w-margin){desired.x=-this.maxSpeed;needs=true;}if(this.pos.y<margin){desired.y=this.maxSpeed;needs=true;}else if(this.pos.y>h-margin){desired.y=-this.maxSpeed;needs=true;}return needs?this.steer(desired.setMag(this.maxSpeed)):new Vec();}
  edges(w,h){if(this.pos.x<0)this.pos.x=w;if(this.pos.x>w)this.pos.x=0;if(this.pos.y<0)this.pos.y=h;if(this.pos.y>h)this.pos.y=0;}
  separation(neighbors,range=35){
    let x=0,y=0,n=0;const radiusSq=range*range;
    for(const other of neighbors){if(other===this)continue;const dx=this.pos.x-other.pos.x,dy=this.pos.y-other.pos.y,d2=dx*dx+dy*dy;if(d2>0&&d2<radiusSq){x+=dx/d2;y+=dy/d2;n++;}}
    return n?this.steer(new Vec(x/n,y/n).setMag(this.maxSpeed)):new Vec();
  }
  alignment(neighbors,range=100){
    let x=0,y=0,n=0;const radiusSq=range*range;
    for(const other of neighbors){if(other===this)continue;const dx=this.pos.x-other.pos.x,dy=this.pos.y-other.pos.y;if(dx*dx+dy*dy<radiusSq){x+=other.vel.x;y+=other.vel.y;n++;}}
    return n?this.steer(new Vec(x/n,y/n).setMag(this.maxSpeed)):new Vec();
  }
  cohesion(neighbors,range=110){
    let x=0,y=0,n=0;const radiusSq=range*range;
    for(const other of neighbors){if(other===this)continue;const dx=this.pos.x-other.pos.x,dy=this.pos.y-other.pos.y;if(dx*dx+dy*dy<radiusSq){x+=other.pos.x;y+=other.pos.y;n++;}}
    return n?this.seek(new Vec(x/n,y/n)):new Vec();
  }
  /** Anticipation dynamique + ahead court + projection sur le segment + position.
   * Priorité au risque imminent. La résolution de pénétration reste distincte. */
  avoid(obstacles){const direction=this.vel.mag()>1?this.vel.copy().normalize():Vec.fromAngle(this.theta);const look=45+this.vel.mag()*.55+(this.isPlayer?this.radius*1.6:0);const ahead=Vec.add(this.pos,direction.copy().mult(look));const ahead2=Vec.add(this.pos,direction.copy().mult(look*.5));let chosen=null,best=Infinity,point=null;for(const obstacle of obstacles){const dx=obstacle.pos.x-this.pos.x,dy=obstacle.pos.y-this.pos.y,broad=look+obstacle.radius+this.radius+14;if(dx*dx+dy*dy>broad*broad)continue;const projected=projectPoint(obstacle.pos,this.pos,ahead);const safe=obstacle.radius+this.radius+14;const distance=Math.min(obstacle.pos.dist(projected),obstacle.pos.dist(ahead2),obstacle.pos.dist(this.pos));if(distance<safe){const urgency=this.pos.dist(obstacle.pos)-obstacle.radius;if(urgency<best){best=urgency;chosen=obstacle;point=projected;}}}this.avoidTarget=chosen;if(!chosen)return new Vec();let away=Vec.sub(point,chosen.pos);if(away.mag()<1)away=new Vec(-direction.y,direction.x);return this.steer(away.setMag(this.maxSpeed));}
  followPath(points,width=28){const future=Vec.add(this.pos,this.vel.copy().normalize().mult(65));let best=Infinity,target=null,normal=null;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];const projection=projectPoint(future,a,b);const d=future.dist(projection);if(d<best){best=d;normal=projection;target=Vec.add(projection,Vec.sub(b,a).setMag(38));}}this.pathProjection=normal;this.predicted=future;return target&&best>width?this.seek(target):new Vec();}
  followLeader(leader,neighbors){const dir=leader.vel.copy().normalize();const ahead=Vec.add(leader.pos,dir.copy().mult(75));const behind=Vec.sub(leader.pos,dir.mult(80));return this.pos.dist(ahead)<75?this.flee(ahead).mult(1.8):this.arrive(behind,110,35).add(this.separation(neighbors,40).mult(1.5));}
  flowField(t){const a=Math.sin(this.pos.x*.004+t*.15)+Math.cos(this.pos.y*.005-t*.1);return this.steer(Vec.fromAngle(a*2).mult(this.maxSpeed));}
  applyForce(force){this.acc.add(force);}
  update(dt){this.vel.x+=this.acc.x*dt;this.vel.y+=this.acc.y*dt;this.vel.limit(this.maxSpeed);this.pos.x+=this.vel.x*dt;this.pos.y+=this.vel.y*dt;this.acc.mult(0);if(this.trackHistory){this.history.push(this.pos.copy());if(this.history.length>45)this.history.shift();}else if(this.history.length)this.history.length=0;}
  resolveObstacles(obstacles){for(const obstacle of obstacles){const dx=this.pos.x-obstacle.pos.x,dy=this.pos.y-obstacle.pos.y,safe=obstacle.radius+this.radius;if(dx*dx+dy*dy>=safe*safe)continue;const delta=new Vec(dx,dy),distance=delta.mag();if(distance<safe){if(distance<.001)delta.x=1;const normal=delta.normalize();this.pos=Vec.add(obstacle.pos,normal.copy().mult(safe+.1));const inward=this.vel.dot(normal);if(inward<0)this.vel.sub(normal.mult(inward));}}}
}

/** Index reconstruit avant l'évaluation des forces. Les cellules fournissent
 * seulement des candidats ; chaque comportement conserve son rayon exact. */
class SpatialGrid {
  constructor(cellSize=128){this.cellSize=cellSize;this.cells=new Map();}
  rebuild(items){this.cells.clear();for(const item of items){const x=Math.floor(item.pos.x/this.cellSize),y=Math.floor(item.pos.y/this.cellSize),key=x+','+y;let cell=this.cells.get(key);if(!cell)this.cells.set(key,cell=[]);cell.push(item);}return this;}
  query(position,radius=110){const result=[],s=this.cellSize;for(let x=Math.floor((position.x-radius)/s);x<=Math.floor((position.x+radius)/s);x++)for(let y=Math.floor((position.y-radius)/s);y<=Math.floor((position.y+radius)/s);y++){const cell=this.cells.get(x+','+y);if(cell)result.push(...cell);}return result;}
}
