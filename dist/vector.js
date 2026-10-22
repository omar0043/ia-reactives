'use strict';
/** Vecteur 2D mutable. Les méthodes statiques ne modifient pas leurs arguments.
 * Même convention que p5.Vector, sans dépendance réseau pour le rendu hors ligne. */
class Vec {
  constructor(x=0,y=0){this.x=x;this.y=y;}
  copy(){return new Vec(this.x,this.y);}
  add(v){this.x+=v.x;this.y+=v.y;return this;}
  sub(v){this.x-=v.x;this.y-=v.y;return this;}
  mult(n){this.x*=n;this.y*=n;return this;}
  div(n){if(n){this.x/=n;this.y/=n;}return this;}
  magSq(){return this.x*this.x+this.y*this.y;}
  mag(){return Math.hypot(this.x,this.y);}
  normalize(){return this.div(this.mag());}
  setMag(n){return this.normalize().mult(n);}
  limit(n){if(this.magSq()>n*n)this.setMag(n);return this;}
  dot(v){return this.x*v.x+this.y*v.y;}
  heading(){return Math.atan2(this.y,this.x);}
  dist(v){return Math.hypot(this.x-v.x,this.y-v.y);}
  static add(a,b){return a.copy().add(b);}
  static sub(a,b){return a.copy().sub(b);}
  static fromAngle(a){return new Vec(Math.cos(a),Math.sin(a));}
}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rand=(a,b)=>a+Math.random()*(b-a);
/** Projection sur un SEGMENT borné, et non sur sa droite infinie. */
function projectPoint(p,a,b){const ab=Vec.sub(b,a);const t=clamp(Vec.sub(p,a).dot(ab)/(ab.magSq()||1),0,1);return Vec.add(a,ab.mult(t));}
