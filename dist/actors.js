'use strict';
class Obstacle{constructor(x,y,radius){this.pos=new Vec(x,y);this.radius=radius;this.seed=rand(0,100);}}
/** Trois espèces aux paramètres distincts. L'ADN influence vitesse, perception
 * et attraction/répulsion. Les descendants héritent de mutations bornées. */
class Fish extends Vehicle {
  constructor(x,y,type=0,dna=null,generation=1){super(x,y);this.type=type;this.generation=generation;this.dna=dna||[rand(.8,1.2),rand(.8,1.2),rand(.7,1.3),rand(.8,1.2)];this.radius=[8,11,7][type];this.health=rand(55,95);this.age=0;this.trackHistory=false;this.state='wander';this.manager.add('intention',c=>this.intention(c),1).add('avoid',c=>this.avoid(c.obstacles),3.3).add('boundaries',c=>this.boundaries(c.w,c.h),1.5).add('separation',c=>this.separation(c.neighbors||c.fish,34),1.5).add('alignment',c=>c.mode==='flock'?this.alignment(c.neighbors||c.fish,95):new Vec(),.8).add('cohesion',c=>c.mode==='flock'?this.cohesion(c.neighbors||c.fish,110):new Vec(),.65).add('flow',c=>c.params.currents?this.flowField(c.time):new Vec(),.35);}
  intention(c){const threats=[c.player,...c.enemies];let nearest=threats[0],d=Infinity;for(const p of threats){const nd=this.pos.dist(p.pos);if(nd<d){d=nd;nearest=p;}}if(d<c.params.vision*this.dna[1]&&!['snake','leader','seek','flee','evade'].includes(c.mode)){this.state='evade';return this.evade(nearest,c.params.prediction).mult(2.1);}this.state=c.mode;
    if(c.mode==='snake'){const i=c.fish.indexOf(this);return this.arrive(i?c.fish[i-1].pos:c.player.pos,80,24);}
    if(c.mode==='leader')return this.followLeader(c.player,c.neighbors||c.fish);
    if(c.mode==='seek')return this.seek(c.player.pos);
    if(c.mode==='flee')return d<c.params.vision?this.flee(nearest.pos):this.wander(c.dt);
    if(c.mode==='evade')return d<c.params.vision?this.evade(nearest,c.params.prediction):this.wander(c.dt);
    if(c.mode==='path')return this.followPath(c.path).add(this.wander(c.dt).mult(.12));
    // Évolution : chercher du plancton et repousser le poison dans la perception ADN.
    if(c.params.genetic){let food=null,fd=150*this.dna[2];for(const p of c.food){const dist=this.pos.dist(p);if(dist<fd){fd=dist;food=p;}}let poison=null,pd=95*this.dna[3];for(const j of c.jellies){const dist=this.pos.dist(j.pos);if(dist<pd){pd=dist;poison=j;}}if(poison)return this.flee(poison.pos).mult(1.4);if(food)return this.seek(food);}
    return this.wander(c.dt).mult(c.mode==='flock'?.35:1);
  }
  offspring(x,y){const child=new Fish(x,y,this.type,this.dna.map(n=>clamp(n+rand(-.12,.12),.5,1.6)),this.generation+1);child.radius=this.radius;if(this.creature){child.creature=this.creature;child.radius=this.radius;}return child;}
}
class Shark extends Vehicle {
  constructor(x,y,player=false){super(x,y);this.isPlayer=player;this.trackHistory=false;this.radius=player?24:28;this.maxSpeed=player?250:145;this.maxForce=player?650:220;this.state=player?'arrive':'pursue';this.invulnerable=0;this.facing=this.vel.heading();this.airborne=false;this.flightTime=0;this.jumpCooldown=0;this.enteredSky=false;this.manager.add('intention',c=>{if(this.isPlayer){const keys=c.keys;let dx=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')||keys.has('q')?1:0);let dy=(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')||keys.has('z')?1:0);if(dx||dy)return this.steer(new Vec(dx,dy).setMag(this.maxSpeed));return this.arrive(c.target,110,7);}const d=this.pos.dist(c.player.pos);if(d<350){this.state='pursue';return this.pursue(c.player,c.params.prediction);}let closest=null,dist=300;for(const f of c.fish){const nd=this.pos.dist(f.pos);if(nd<dist){dist=nd;closest=f;}}this.state=closest?'pursue':'wander';return closest?this.pursue(closest,c.params.prediction):this.wander(c.dt);},1).add('avoid',c=>this.avoid(c.obstacles),3.6).add('boundaries',c=>this.boundaries(c.w,c.h,50),2);}
  /** Les marges suivent la silhouette tournée, y compris la queue et l'aileron. */
  bodyExtents(){
    const a=this.facing??(this.vel.mag()>4?this.vel.heading():0),c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));
    return new Vec(this.radius*(2.95*c+2.05*s),this.radius*(2.95*s+2.05*c));
  }
  constrainToWorld(w,h,surfaceY=0){
    const e=this.bodyExtents(),left=e.x+12,right=w-e.x-12,bottom=h-e.y-90;
    if(this.pos.x<left){this.pos.x=left;if(this.vel.x<0)this.vel.x=0;}
    if(this.pos.x>right){this.pos.x=right;if(this.vel.x>0)this.vel.x=0;}
    if(this.pos.y>bottom){this.pos.y=bottom;if(this.vel.y>0)this.vel.y=0;}
    if(!this.airborne)this.pos.y=Math.max(surfaceY+this.radius*.25,this.pos.y);
  }
  /** La détection suit la commande du joueur, avec un côté de contournement
   * stable. En contact, le solveur fait glisser au lieu d'ajouter une répulsion. */
  avoid(obstacles){
    if(!this.isPlayer)return super.avoid(obstacles);
    this.avoidTarget=null;
    if(this.contacts?.length||Math.hypot(this.intentX||0,this.intentY||0)<1)return new Vec();
    const mag=Math.hypot(this.intentX,this.intentY),dx=this.intentX/mag,dy=this.intentY/mag;
    const look=this.radius*1.5+45+this.vel.mag()*.45;
    let chosen=null,best=Infinity,ax=0,ay=0,strength=0;
    for(const obstacle of obstacles){
      const ox=obstacle.pos.x-this.pos.x,oy=obstacle.pos.y-this.pos.y,safe=obstacle.radius+this.radius*.95+12;
      if(ox*dx+oy*dy<0||ox*ox+oy*oy>(look+safe)*(look+safe))continue;
      const along=clamp(ox*dx+oy*dy,0,look),nx=dx*along-ox,ny=dy*along-oy,distance=Math.hypot(nx,ny);
      if(distance>=safe||along>=best)continue;
      chosen=obstacle;best=along;ax=nx;ay=ny;strength=clamp((safe-distance)/Math.max(40,this.radius*.7),0,1);
    }
    if(!chosen){this.avoidObstacle=null;return new Vec();}
    if(this.avoidObstacle!==chosen){const cross=dx*(chosen.pos.y-this.pos.y)-dy*(chosen.pos.x-this.pos.x);this.avoidSide=cross>0?-1:1;this.avoidObstacle=chosen;}
    const length=Math.hypot(ax,ay);
    if(length<1||(ax*dx+ay*dy)/length<-.7){ax=-dy*this.avoidSide;ay=dx*this.avoidSide;}else{ax/=length;ay/=length;}
    this.avoidTarget=chosen;
    return this.steer(new Vec(ax*this.maxSpeed,ay*this.maxSpeed)).mult(strength);
  }
  refreshContacts(obstacles){
    if(!this.contacts?.length)return;
    const cx=Math.cos(this.facing),cy=Math.sin(this.facing),back=this.radius*1.05,length=this.radius*2.55;
    this.contacts=this.contacts.filter(contact=>{
      if(!obstacles.includes(contact.obstacle))return false;
      const o=contact.obstacle,px=this.pos.x-cx*back,py=this.pos.y-cy*back;
      const t=clamp((o.pos.x-px)*cx+(o.pos.y-py)*cy,0,length);
      const dx=px+cx*t-o.pos.x,dy=py+cy*t-o.pos.y,d=Math.hypot(dx,dy);
      if(d>o.radius+this.radius*.95+3)return false;
      if(d>.001){contact.nx=dx/d;contact.ny=dy/d;}return true;
    });
  }
  /** Une capsule suit le corps allongé du joueur. Le rayon de croissance reste
   * distinct du volume physique ; sinon un grand nez traverse les rochers. */
  resolveObstacles(obstacles){
    if(!this.isPlayer){super.resolveObstacles(obstacles);return;}
    const cx=Math.cos(this.facing??0),cy=Math.sin(this.facing??0),bodyRadius=this.radius*.95;
    const back=this.radius*1.05,length=this.radius*2.55,contacts=[];
    for(let pass=0;pass<5;pass++){
      let moved=false;
      for(const obstacle of obstacles){
        const dx=obstacle.pos.x-this.pos.x,dy=obstacle.pos.y-this.pos.y,broad=obstacle.radius+this.radius*2.7;
        if(dx*dx+dy*dy>broad*broad)continue;
        const px=this.pos.x-cx*back,py=this.pos.y-cy*back;
        const t=clamp((obstacle.pos.x-px)*cx+(obstacle.pos.y-py)*cy,0,length);
        let nx=px+cx*t-obstacle.pos.x,ny=py+cy*t-obstacle.pos.y;
        const distance=Math.hypot(nx,ny),safe=obstacle.radius+bodyRadius;
        if(distance>safe+3)continue;
        if(distance<.001){const side=(-cy*(this.pos.x-obstacle.pos.x)+cx*(this.pos.y-obstacle.pos.y))<0?-1:1;nx=-cy*side;ny=cx*side;}
        else{nx/=distance;ny/=distance;}
        const contact=contacts.find(c=>c.obstacle===obstacle);if(contact){contact.nx=nx;contact.ny=ny;}else contacts.push({obstacle,nx,ny});
        if(distance>=safe)continue;
        const push=safe-distance+.05;this.pos.x+=nx*push;this.pos.y+=ny*push;
        const inward=this.vel.x*nx+this.vel.y*ny;if(inward<0){this.vel.x-=nx*inward;this.vel.y-=ny*inward;}moved=true;
      }
      if(!moved)break;
    }
    this.contacts=contacts;
  }
  /** Ne pas tourner la capsule dans un récif : une rotation ne doit jamais
   * produire un déplacement de correction. On garde la portion libre de l'arc. */
  turnWithoutPenetration(delta,obstacles){
    if(!obstacles?.length){this.facing+=delta;return;}
    const radius=this.radius,back=radius*1.05,length=radius*2.55,body=radius*.95;
    const near=obstacles.filter(o=>{const dx=o.pos.x-this.pos.x,dy=o.pos.y-this.pos.y,r=o.radius+radius*2.7+4;return dx*dx+dy*dy<r*r;});
    if(!near.length){this.facing+=delta;return;}
    const depth=(o,angle)=>{const cx=Math.cos(angle),cy=Math.sin(angle),px=this.pos.x-cx*back,py=this.pos.y-cy*back,t=clamp((o.pos.x-px)*cx+(o.pos.y-py)*cy,0,length);return o.radius+body-Math.hypot(px+cx*t-o.pos.x,py+cy*t-o.pos.y);};
    const limits=near.map(o=>Math.max(0,depth(o,this.facing))+.0001);
    const free=angle=>near.every((o,i)=>depth(o,angle)<=limits[i]);
    // Vérifier tout l'arc, pas seulement son extrémité (rochers des deux côtés).
    let fraction=0;
    for(let i=1;i<=4;i++){
      const next=i/4;
      if(free(this.facing+delta*next)){fraction=next;continue;}
      let low=fraction,high=next;
      for(let j=0;j<10;j++){const mid=(low+high)/2;if(free(this.facing+delta*mid))low=mid;else high=mid;}
      fraction=low;break;
    }
    this.facing+=delta*fraction;
  }
  update(dt){
    super.update(dt);if(this.vel.mag()<=4)return;
    if(!this.isPlayer){this.facing=this.vel.heading();return;}
    const target=this.vel.heading(),delta=Math.atan2(Math.sin(target-this.facing),Math.cos(target-this.facing));
    const turn=clamp(5-this.radius*.016,2.4,4.6)*dt;
    this.turnWithoutPenetration(clamp(delta,-turn,turn),this.motionObstacles);
  }
  /** Locomotion distincte du pilotage : dans l'eau, steering ; dans l'air,
   * trajectoire balistique avec gravité. Pas de force Arrive qui annule le saut. */
  advance(dt,context){
    this.jumpCooldown=Math.max(0,this.jumpCooldown-dt);
    if(!this.airborne){
      if(this.isPlayer){
        const keys=context.keys,dx=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')||keys.has('q')?1:0),dy=(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')||keys.has('z')?1:0);
        this.intentX=dx||dy?dx:context.target.x-this.pos.x;this.intentY=dx||dy?dy:context.target.y-this.pos.y;
        this.refreshContacts(context.obstacles);
        this.motionObstacles=context.obstacles;
      }
      const force=this.manager.getSteeringForce(context);
      for(let pass=0;pass<2;pass++)for(const c of this.contacts||[]){const inward=force.x*c.nx+force.y*c.ny;if(inward<0){force.x-=c.nx*inward;force.y-=c.ny*inward;}const drift=this.vel.x*c.nx+this.vel.y*c.ny;if(drift<0){this.vel.x-=c.nx*drift;this.vel.y-=c.ny*drift;}}
      this.applyForce(force);this.update(dt);return;
    }
    this.contacts=[];
    this.flightTime+=dt;
    const keys=context.keys;
    const dx=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')||keys.has('q')?1:0);
    this.vel.x=clamp(this.vel.x+dx*125*dt,-460,460);
    this.vel.y+=900*dt;this.facing=this.vel.heading();
    this.pos.add(this.vel.copy().mult(dt));
    this.acc.mult(0);
    if(this.pos.y<context.waterY)this.enteredSky=true;
    if(this.enteredSky&&this.vel.y>0&&this.pos.y>=context.waterY+this.radius*.25){
      this.pos.y=context.waterY+this.radius*.35;
      this.vel.y=Math.min(180,this.vel.y*.22);
      this.airborne=false;this.jumpCooldown=.85;this.state='arrive';
    }
  }
  launchJump(surfaceY,boost=false){
    if(this.airborne||this.jumpCooldown>0||this.pos.y>surfaceY+170)return false;
    this.airborne=true;this.flightTime=0;this.enteredSky=this.pos.y<surfaceY;this.state='jump';
    const heading=this.vel.x< -15?-1:1;
    this.vel.x=heading*Math.max(145,Math.abs(this.vel.x));
    this.vel.y=boost?-940:-850;this.acc.mult(0);
    return true;
  }

}
class Jelly extends Vehicle {
  constructor(x,y){super(x,y);this.radius=17;this.trackHistory=false;this.maxSpeed=12;this.maxForce=22;this.phase=rand(0,Math.PI*2);this.manager.add('wander',c=>this.wander(c.dt)).add('boundaries',c=>this.boundaries(c.w,c.h));}
}
class Particle extends Vehicle {
  constructor(x,y,color,text=''){super(x,y);this.vel=Vec.fromAngle(rand(0,Math.PI*2)).mult(rand(15,85));this.life=1;this.trackHistory=false;this.color=color;this.text=text;this.maxSpeed=100;this.radius=rand(1,3);}
  tick(dt){this.life-=dt;this.vel.mult(Math.pow(.3,dt));this.vel.y-=10*dt;this.update(dt);}
}

/** Bateau autonome : vitesse horizontale, croisière et fuite devant le requin.
 * Les comportements simples restent ceux de Vehicle ; seule la contrainte
 * de locomotion sur la surface et le choix d'intention appartiennent à Boat. */
class Boat extends Vehicle {
  constructor(x,surfaceY,type=0){
    super(x,surfaceY);this.trackHistory=false;this.type=type;
    this.width=[155,250,390][type];this.height=[65,100,145][type];
    this.radius=this.width/2;this.minimumSharkRadius=[50,82,125][type];
    this.reward=[40,85,170][type];this.maxSpeed=[32,25,19][type];this.maxForce=75;
    this.direction=Math.random()<.5?-1:1;this.vel=new Vec(this.direction*this.maxSpeed,0);
    this.state='cruise';this.phase=rand(0,Math.PI*2);
    this.manager.add('navigation',c=>{
      if(c.player.pos.y<c.waterY+230&&Math.abs(c.player.pos.x-this.pos.x)<300){
        this.state='flee';const force=this.flee(c.player.pos);force.y=0;return force;
      }
      this.state='cruise';return this.seek(new Vec(this.pos.x+this.direction*300,c.waterY));
    });
  }
  tick(dt,context){
    this.applyForce(this.manager.getSteeringForce(context));this.acc.y=0;
    this.update(dt);this.pos.y=context.waterY;this.vel.y=0;
    if(this.pos.x<this.width){this.direction=1;this.vel.x=Math.abs(this.vel.x);}
    if(this.pos.x>context.w-this.width){this.direction=-1;this.vel.x=-Math.abs(this.vel.x);}
    this.pos.x=clamp(this.pos.x,this.width,context.w-this.width);
  }
}
