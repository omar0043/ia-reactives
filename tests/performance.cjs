// Mesure locale déterministe : CPU et appels de dessin. Ne mesure pas le GPU ni les FPS utilisateur.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{performance}=require('node:perf_hooks');
const root=path.resolve(process.argv[2]||'dist');
let seed=937169,writes=0,drawCalls=0,blurPasses=0,domWrites=0;
const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const gradient={addColorStop(){}};
function makeContext(){return new Proxy({},{get(target,key){if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>{drawCalls++;return gradient;};if(key in target)return target[key];return (...args)=>{drawCalls++;};},set(target,key,value){if(key==='shadowBlur'&&value>0)blurPasses++;target[key]=value;return true;}});}
const ctx=makeContext(),elements=new Map();
function element(id){if(!elements.has(id)){const e={value:'',checked:false,open:false,disabled:false,style:{},classList:{toggle(){},add(){},remove(){}},addEventListener(){},setAttribute(){},focus(){},getBoundingClientRect(){return {width:1363,height:936,left:0,top:0};},getContext(){return ctx;},setPointerCapture(){}};for(const key of ['textContent','innerHTML']){let val='';Object.defineProperty(e,key,{get:()=>val,set:v=>{domWrites++;val=v;}});}elements.set(id,e);}return elements.get(id);}
const document={getElementById:element,createElement:()=>({width:0,height:0,getContext:()=>makeContext()}),querySelectorAll:()=>[],addEventListener(){},hidden:false,body:{classList:{toggle(){},add(){},remove(){}}}};
const context=vm.createContext({console,Math:math,Map,Set,Number,Array,JSON,Error,document,window:{addEventListener(){}},devicePixelRatio:2,requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},localStorage:{getItem:()=>null,setItem(){writes++;}},cameraStream:null,performance});
for(const name of ['vector','vehicle','actors','neural','game','arcade','levels','experience','progression','audio'].filter(name=>fs.existsSync(path.join(root,name+'.js'))))vm.runInContext(fs.readFileSync(path.join(root,name+'.js'),'utf8'),context);
vm.runInContext("if(typeof campaign!=='undefined')campaign.mode='survival';chosen=0;profile.selected=0;start(true);game.params.population=110;game.params.genetic=false;while(game.fish.length<110){const f=new Fish(game.player.pos.x+rand(-400,400),600+rand(-200,200),0);game.fish.push(f);}game.mode='flock';",context);
const runStep=vm.runInContext('(dt)=>step(dt)',context),render=vm.runInContext('()=>render()',context),hud=vm.runInContext('()=>updateHUD()',context);
for(let i=0;i<120;i++)runStep(1/60);
const times=[];for(let i=0;i<600;i++){const t=performance.now();runStep(1/60);times.push(performance.now()-t);}
times.sort((a,b)=>a-b);
drawCalls=blurPasses=0;for(let i=0;i<60;i++)render();const renderCalls=drawCalls,blurs=blurPasses;
domWrites=0;for(let i=0;i<60;i++)hud();const hudAssignments=domWrites;
writes=0;vm.runInContext("for(let i=0;i<100;i++)eatFish(new Fish(game.player.pos.x,game.player.pos.y,0));if(typeof flushProfile==='function')flushProfile();if(typeof flushBest==='function')flushBest();",context);
console.log(JSON.stringify({folder:root,medianStepMs:+times[300].toFixed(3),p95StepMs:+times[570].toFixed(3),renderCallsPerFrame:Math.round(renderCalls/60),blurPassesPerFrame:+(blurs/60).toFixed(1),domAssignments60HUD:hudAssignments,storageWrites100Captures:writes}));
