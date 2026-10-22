'use strict';
/** Sons courts synthétisés localement, sans fichier à charger. Le son reste
 * désactivé tant que le joueur n'a pas actionné un bouton de son. */
const soundTimes=new Map();let splashBuffer=null;
function playTone(frequency,end,delay,duration,volume=.025,type='sine'){
  const start=audio.currentTime+delay,osc=audio.createOscillator(),gain=audio.createGain();
  osc.type=type;osc.frequency.setValueAtTime(frequency,start);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),start+duration);
  gain.gain.setValueAtTime(volume,start);gain.gain.exponentialRampToValueAtTime(.001,start+duration);osc.connect(gain);gain.connect(audio.destination);osc.start(start);osc.stop(start+duration+.01);
}
chirp=function(type='eat'){
  if(!sound)return false;
  try{
    if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();
    const gap=type==='eat'?.06:type==='hurt'?.6:type==='danger'?3:.15,last=soundTimes.get(type)??-100;
    if(audio.currentTime-last<gap)return false;soundTimes.set(type,audio.currentTime);
    if(type==='splash'){
      if(!splashBuffer){splashBuffer=audio.createBuffer(1,Math.floor(audio.sampleRate*.24),audio.sampleRate);const samples=splashBuffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(1-i/samples.length);}
      const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=splashBuffer;filter.type='lowpass';filter.frequency.value=1700;gain.gain.value=.065;source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start();
    }else if(type==='boat'){playTone(160,45,0,.27,.035,'triangle');playTone(640,960,.06,.14,.02);}
    else if(type==='boss'||type==='level'){for(const [i,note]of [523,659,784,1047].entries())playTone(note,note*1.03,i*.075,.17,.022,'triangle');}
    else if(type==='hurt'||type==='danger'||type==='fail'){playTone(type==='fail'?170:110,45,0,.24,.028,'triangle');}
    else{playTone(520,850,0,.085,.02);playTone(850,1100,.045,.07,.012);}
    return true;
  }catch{return false;}
};
const audioSplash=splash;
splash=function(x,size=1){audioSplash(x,size);chirp('splash');};
const audioSoundToggle=$('soundBtn').onclick;
function updateSoundButtons(){
  for(const id of ['soundBtn','menuSoundBtn','pauseSoundBtn']){
    const button=$(id);button.textContent=id==='soundBtn'?(sound?'SON ON':'SON OFF'):(sound?'🔊 SON : ACTIVÉ':'🔇 SON : ACTIVER');
    button.setAttribute('aria-label',sound?'Couper le son':'Activer le son');button.setAttribute('aria-pressed',String(sound));button.title=sound?'Couper le son':'Activer le son';
  }
}
function toggleGameSound(){audioSoundToggle();updateSoundButtons();}
for(const id of ['soundBtn','menuSoundBtn','pauseSoundBtn'])$(id).onclick=toggleGameSound;
updateSoundButtons();
const audioStep=step;
step=function(dt){audioStep(dt);if(game.state==='playing'&&!game.sandbox&&game.health<25)chirp('danger');};
