'use strict';
const el=id=>document.getElementById(id),board=el('battle'),g=board.getContext('2d');
const WIDTH=1280,HEIGHT=720,DURATION=120;
const CREW=[
 {name:'能天使',en:'EXUSIAI',role:'远程压制 / 轻装清除',skill:'过载模式',portrait:'exusiai',cool:18,rate:.42,damage:22,range:510,color:'#ffd18a'},
 {name:'阿米娅',en:'AMIYA',role:'术式穿甲 / 连锁破击',skill:'精神爆发',portrait:'amiya',cool:20,rate:1.2,damage:70,range:430,color:'#8cdbff'},
 {name:'银灰',en:'SILVERASH',role:'近身拦截 / 广域斩击',skill:'真银斩',portrait:'silverash',cool:22,rate:1,damage:70,range:225,color:'#e1f5ff'}
];
const SLOTS=[{x:407,y:313},{x:609,y:313},{x:811,y:313},{x:456,y:411},{x:658,y:411},{x:860,y:411}];
let state='menu',selected=0,clock=0,elapsed=0,hull=100,kills=0,combo=0,bestCombo=0,comboLife=0,spawnClock=0,idSeq=0,phase=-1,focusId=null;
let crew=[],foes=[],shots=[],effects=[],labels=[],shake=0,hitstop=0,bannerLife=0,callLife=0,slowHeld=false,slowPower=3,last=0,soundOn=false,audio=null,skillCut=null;
let viewport={scale:1,x:0,y:0};
function fit(){const dpr=Math.min(devicePixelRatio||1,2);board.width=Math.round(innerWidth*dpr);board.height=Math.round(innerHeight*dpr);viewport.scale=Math.min(board.width/WIDTH,board.height/HEIGHT);viewport.x=(board.width-WIDTH*viewport.scale)/2;viewport.y=(board.height-HEIGHT*viewport.scale)/2}
addEventListener('resize',fit);fit();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function say(text,seconds=3){el('callout').textContent=text;callLife=seconds}
function announce(text,seconds=2.6){el('banner').textContent=text;bannerLife=seconds}
function tone(freq=200,duration=.06,type='triangle',volume=.025){if(!soundOn)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.5),audio.currentTime+duration);gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration)}catch{}}
function buildRoster(){el('roster').innerHTML=CREW.map((o,i)=>'<div class="opcard '+(selected===i?'selected':'')+'" data-crew="'+i+'"><img class="portrait" src="assets/'+o.portrait+'-portrait.png" alt="'+o.name+'"><div class="cardbody"><div class="name">'+o.name+'<small>0'+(i+1)+'</small></div><p>'+o.role+'</p><button class="cast" data-skill="'+i+'" aria-label="释放'+o.name+'技能"></button></div></div>').join('');document.querySelectorAll('[data-crew]').forEach(b=>b.onclick=()=>selectCrew(+b.dataset.crew));document.querySelectorAll('[data-skill]').forEach(b=>b.onclick=e=>{e.stopPropagation();selectCrew(+b.dataset.skill);activateSkill(selected)})}
function selectCrew(i){selected=i;document.querySelectorAll('[data-crew]').forEach(b=>b.classList.toggle('selected',+b.dataset.crew===i));board.focus()}
function startRolling(){
 if(!OperatorAssets.ready||!EnemyAssets.ready)return;
 state='playing';elapsed=0;hull=100;kills=0;combo=0;bestCombo=0;comboLife=0;phase=-1;focusId=null;foes=[];shots=[];effects=[];labels=[];spawnClock=.9;slowPower=3;slowHeld=false;shake=0;hitstop=0;skillCut=null;
 crew=CREW.map((o,i)=>({slot:[1,4,2][i],x:SLOTS[[1,4,2][i]].x,y:SLOTS[[1,4,2][i]].y,sp:o.cool,skill:0,fire:.2+i*.2,attack:0,transfer:0,facing:1}));
 for(const model of OperatorAssets.models){model.name='';model.play('Start',false)}
 selected=0;buildRoster();el('intro').hidden=true;el('pauseScreen').hidden=true;el('resultScreen').hidden=true;el('gameUI').hidden=false;board.focus();announce('行动开始\n守住护送列车');say('先观察来敌方向。选择干员，点击车顶空阵位即可转移。',6);hud()
}
function pauseRolling(){if(state!=='playing')return;state='paused';slowHeld=false;el('pauseScreen').hidden=false}
function resumeRolling(){if(state!=='paused')return;state='playing';el('pauseScreen').hidden=true;board.focus()}
function menuRolling(){state='menu';slowHeld=false;el('intro').hidden=false;el('gameUI').hidden=true;el('pauseScreen').hidden=true;el('resultScreen').hidden=true}
function finishRolling(win){
 state=win?'won':'lost';slowHeld=false;el('resultScreen').hidden=false;
 el('resultTitle').textContent=win?'护送完成':'列车失守';
 el('resultDesc').textContent=win?'列车已驶入罗德岛接应区域。所有干员，准备撤离。':'优先处理登车敌人，利用转移阵位让银灰拦截近身目标。';
 el('resultStats').textContent='行进 '+Math.floor(elapsed)+' 秒 / 击退 '+kills+'\n列车耐久 '+Math.max(0,Math.ceil(hull))+' / 最高连击 '+bestCombo;
 tone(win?660:85,.5,'triangle',.08);
}
function stageAt(t){return t<36?0:t<67?1:t<96?2:3}
function spawnEnemy(force={}){
 const heavy=force.heavy??(elapsed>19&&Math.random()<(elapsed>67?.4:.25)),boarder=force.boarder??(elapsed>33&&Math.random()<.4),lane=force.lane??(Math.random()<.5?0:1);
 const hp=heavy?240:boarder?100:75;
 const e={id:++idSeq,x:-60-Math.random()*80,y:lane===0?245:525,lane,heavy,boarder,hp,max:hp,speed:heavy?43:boarder?73:57,attack:.7,hit:0,dead:false,climb:0,seed:Math.random()*5,damage:heavy?3:1.5};
 foes.push(Object.assign(e,force));return e;
}
function targetFor(i){
 const unit=crew[i],range=CREW[i].range*(phase===1&&i!==2?.72:1)*(unit.skill>0&&i===2?2.4:1);
 let candidates=foes.filter(e=>!e.dead&&distance(unit,e)<range);
 if(i===2&&unit.skill<=0)candidates=candidates.filter(e=>e.climb>0||distance(unit,e)<190);
 return candidates.find(e=>e.id===focusId)||candidates.sort((a,b)=>(b.climb>0?300:0)+b.x-((a.climb>0?300:0)+a.x))[0];
}
function damageEnemy(e,amount,color){
 if(e.dead)return;e.hp-=amount;e.hit=.12;
 labels.push({x:e.x+(Math.random()-.5)*18,y:e.y-65,text:Math.round(amount),life:.7,color});
 effects.push({kind:'impact',x:e.x,y:e.y-46,life:.2,max:.2,color,size:13});
 if(e.hp<=0){e.dead=true;e.death=.45;kills++;combo++;bestCombo=Math.max(combo,bestCombo);comboLife=3.8;tone(100+Math.min(combo,20)*12,.04,'triangle',.018);if(combo%5===0){shake=Math.max(shake,3);hitstop=.035}}
}
function fireAt(i,target){
 const unit=crew[i],o=CREW[i],skill=unit.skill>0;
 unit.attack=i===0?.24:i===1?.72:.7;unit.facing=target.x<unit.x?-1:1;
 const model=OperatorAssets.models[i];if(model){model.name='';model.play(skill&&model.has('Skill')?'Skill':'Attack',false,1)}
 if(i===2){
  effects.push({kind:'slash',x:unit.x,y:unit.y-35,toX:target.x,toY:target.y-40,life:.3,max:.3,color:o.color,size:skill?290:135});
  const targets=skill?foes.filter(e=>!e.dead&&distance(unit,e)<540):[target];
  for(const e of targets)damageEnemy(e,skill?125:o.damage,o.color);
  if(skill){shake=5;hitstop=.045;tone(160,.12,'sawtooth',.024)}
 }else{
  shots.push({x:unit.x+unit.facing*28,y:unit.y-50,target:target.id,speed:i===0?1100:650,damage:i===0?(skill?38:o.damage):(skill?110:o.damage),color:o.color,op:i,skill,life:2,trail:[]});
  effects.push({kind:'impact',x:unit.x+unit.facing*35,y:unit.y-51,life:.08,max:.08,color:o.color,size:10});
  tone(i===0?170:360,i===0?.035:.1,i===0?'square':'sine',i===0?.01:.025)
 }
}
function activateSkill(i){
 if(state!=='playing')return false;
 const unit=crew[i],o=CREW[i];if(unit.sp<o.cool){say(o.name+' / 技力恢复中');return false}
 unit.sp=0;unit.skill=i===0?7:6;unit.fire=.05;skillCut={op:i,life:1.35};shake=4;
 say(o.name+' · '+o.skill+' / '+(i===0?'高速连射 7 秒':i===1?'术式连锁破击 6 秒':'广域斩击 6 秒'),3);tone(500,.25,'triangle',.05);hud();return true;
}
function transferTo(index){
 if(state!=='playing')return false;
 if(crew.some(u=>u.slot===index)){const i=crew.findIndex(u=>u.slot===index);selectCrew(i);return false}
 const u=crew[selected];if(u.transfer>0){say('阵位转移冷却中');return false}
 u.slot=index;u.transfer=1.6;u.fire=Math.max(u.fire,.35);effects.push({kind:'transfer',x:u.x,y:u.y,life:.45,max:.45,color:CREW[selected].color,size:40});say(CREW[selected].name+' / 转移至 '+(index<3?'远侧':'近侧')+'阵位');tone(340,.08);return true;
}
function hitHull(amount,x,y){hull=Math.max(0,hull-amount);shake=Math.max(shake,4);effects.push({kind:'impact',x,y:y-15,life:.3,max:.3,color:'#ff715c',size:26});if(hull<=0)finishRolling(false)}
function updateRolling(dt){
 clock+=dt;
 if(state!=='playing')return;
 const realDt=dt;
 if(slowHeld&&slowPower>0){slowPower=Math.max(0,slowPower-dt);dt*=.22}else slowPower=Math.min(3,slowPower+dt*.32);
 if(hitstop>0){hitstop-=realDt;dt*=.15}
 elapsed=Math.min(DURATION,elapsed+dt);
 const current=stageAt(elapsed);
 if(current!==phase){phase=current;announce(['荒原追击\n清除两侧追兵','隧道遭遇\n视距缩短 · 提防登车','封锁突破\n重装单位正在接近','最后冲刺\n守住列车，抵达接应点'][phase]);say(['能天使适合清理追兵，阿米娅优先对付重装。','隧道中远程射程缩短。把银灰调到登车敌人附近。','集中火力点掉重装；保留技能应对成群来敌。','追击加剧！所有技能解禁时尽快寻找清场机会。'][phase],5);if(phase>0)for(let j=0;j<4;j++)spawnEnemy({lane:j%2,heavy:phase===2&&j%2===0,boarder:phase===1||phase===3})}
 spawnClock-=dt;if(spawnClock<=0){spawnEnemy();spawnClock=Math.max(.62,1.9-elapsed*.0105);if(elapsed>82&&Math.random()<.35)spawnEnemy({lane:Math.random()<.5?0:1})}
 if(comboLife>0)comboLife-=dt;else combo=0;
 bannerLife-=realDt;if(bannerLife<=0)el('banner').textContent='';
 callLife-=realDt;if(callLife<=0)el('callout').textContent='';
 shake=Math.max(0,shake-realDt*15);
 for(let i=0;i<crew.length;i++){
  const u=crew[i],o=CREW[i],dest=SLOTS[u.slot];
  u.x+=(dest.x-u.x)*(1-Math.exp(-dt*12));u.y+=(dest.y-u.y)*(1-Math.exp(-dt*12));
  u.transfer=Math.max(0,u.transfer-dt);u.skill=Math.max(0,u.skill-dt);if(!u.skill)u.sp=Math.min(o.cool,u.sp+dt);
  u.fire-=dt;u.attack=Math.max(0,u.attack-dt);
  const model=OperatorAssets.models[i];
  if(model){if(!u.attack&&model.name!=='Idle'&&(model.name!=='Start'||model.state.getCurrent(0).isComplete()))model.play('Idle');model.update(dt)}
  if(u.fire<=0){const target=targetFor(i);if(target){fireAt(i,target);u.fire=u.skill>0?(i===0?.10:i===1?.6:.65):o.rate}else u.fire=.12}
 }
 for(const e of foes){
  if(e.dead){e.death-=dt;continue}
  e.hit=Math.max(0,e.hit-dt);
  if(e.boarder&&e.x>330&&e.climb===0){e.climb=.01;e.roofX=clamp(e.x+170,400,895);say('登车警告 / '+(e.lane===0?'远侧':'近侧')+'敌人正在攀爬！',2)}
  if(e.climb>0){
   e.climb=Math.min(1,e.climb+dt*.48);const goalY=e.lane===0?313:411;
   e.x+=(e.roofX-e.x)*dt*2;e.y+=(goalY-e.y)*dt*2;
   if(e.climb>=1){e.attack-=dt;if(e.attack<=0){hitHull(e.damage,e.x,e.y);e.attack=1.1}}
  }else{e.x+=dt*e.speed;if(e.x>1080){e.dead=true;e.death=.1;hitHull(e.heavy?9:5,970,e.y)}}
 }
 for(const s of shots){
  s.life-=dt;const target=foes.find(e=>e.id===s.target&&!e.dead);
  if(!target){s.life=0;continue}
  s.trail.push({x:s.x,y:s.y});if(s.trail.length>7)s.trail.shift();
  const tx=target.x,ty=target.y-45,d=Math.hypot(tx-s.x,ty-s.y);
  if(d<s.speed*dt+8){
   const armor=s.op===0&&target.heavy?.58:1;damageEnemy(target,s.damage*armor,s.color);
   if(s.op===1&&s.skill){const neighbors=foes.filter(e=>!e.dead&&e!==target&&distance(e,target)<190).slice(0,3);for(const e of neighbors){effects.push({kind:'beam',x:target.x,y:target.y-45,toX:e.x,toY:e.y-45,life:.22,max:.22,color:s.color});damageEnemy(e,s.damage*.65,s.color)}shake=Math.max(shake,2)}
   s.life=0;
  }else{s.x+=(tx-s.x)/d*s.speed*dt;s.y+=(ty-s.y)/d*s.speed*dt}
 }
 foes=foes.filter(e=>!e.dead||e.death>0);shots=shots.filter(s=>s.life>0);
 for(const e of effects)e.life-=dt;effects=effects.filter(e=>e.life>0);
 for(const l of labels){l.life-=dt;l.y-=dt*34}labels=labels.filter(l=>l.life>0);
 if(skillCut){skillCut.life-=realDt;if(skillCut.life<=0)skillCut=null}
 if(elapsed>=DURATION&&state==='playing')finishRolling(true);hud();
}
function hud(){
 el('hullValue').textContent=Math.ceil(hull);el('hullBar').style.width=hull+'%';el('hullBar').style.background=hull<30?'#ef7966':'#79cbd1';
 el('killValue').textContent=kills;el('combo').textContent=combo>=3?combo+' COMBO':'';
 el('distance').textContent=Math.floor(elapsed)+' / 120 秒';el('routeBar').style.width=elapsed/DURATION*100+'%';
 el('region').textContent=['01 / 荒原追击','02 / 隧道遭遇','03 / 封锁突破','04 / 最后冲刺'][Math.max(0,phase)];
 el('slowText').textContent=(slowHeld&&slowPower>0?'战术减速中':'按住 SPACE · 战术减速')+' / '+slowPower.toFixed(1)+'s';
 document.querySelectorAll('[data-skill]').forEach(b=>{const i=+b.dataset.skill,u=crew[i],o=CREW[i];if(!u)return;const ready=u.sp>=o.cool;b.classList.toggle('ready',ready);b.innerHTML=(u.skill>0?'技能持续 '+Math.ceil(u.skill)+'s':ready?(selected===i?'E / ':'')+o.skill+' · 就绪':'SP '+Math.floor(u.sp)+' / '+o.cool)+'<i class="sp" style="width:'+u.sp/o.cool*100+'%"></i>'})
}
function polygon(points,fill,stroke){g.beginPath();points.forEach((v,i)=>i?g.lineTo(...v):g.moveTo(...v));g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke()}}
function line(x,y,xx,yy,color,width=1){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke()}
function background(){
 const tunnel=state!=='menu'&&phase===1;
 g.fillStyle=tunnel?'#101b28':'#273743';g.fillRect(0,0,WIDTH,HEIGHT);
 const grad=g.createLinearGradient(0,0,0,720);grad.addColorStop(0,tunnel?'#07101c':'#334958');grad.addColorStop(1,'#17232b');g.fillStyle=grad;g.fillRect(0,0,WIDTH,HEIGHT);
 for(let layer=0;layer<2;layer++)for(let j=-1;j<16;j++){
  const spacing=135+layer*55,x=j*spacing-(clock*(layer?30:12))%spacing,top=100+(Math.sin(j*43+layer)*.5+.5)*100;
  g.fillStyle=layer?'#263741':'#3a4f5b';g.fillRect(x,top,spacing*.65,260-top);if(layer){g.fillStyle='#bca57845';g.fillRect(x+12,top+20,5,14);g.fillRect(x+34,top+20,5,14)}
 }
 g.fillStyle='#263b45';g.fillRect(0,225,WIDTH,495);
 g.fillStyle='#1e303d';g.fillRect(0,232,WIDTH,40);line(0,271,1280,271,'#60768055',2);
 for(let j=-1;j<15;j++){const x=j*115-(clock*165)%115;g.fillStyle='#b9bd9b55';g.fillRect(x,255,48,2)}
 for(let j=-2;j<24;j++){let x=j*77-(clock*180)%77;line(x,260,x+400,720,'#7e929519',1);g.fillStyle='#121f2b';polygon([[x,480],[x+40,480],[x+190,720],[x+142,720]],'#152530');}
 line(0,485,1280,485,'#96aab0',4);line(0,500,1280,500,'#101e29',8);
 line(0,585,1280,585,'#718a94',4);line(0,600,1280,600,'#101d25',8);
 for(let j=-1;j<19;j++){const x=j*95-(clock*220)%95;line(x,485,x+65,605,'#101c25',13)}
 if(tunnel){g.fillStyle='#07111e70';g.fillRect(0,0,1280,720);for(let j=-1;j<4;j++){const x=j*510-(clock*210)%510;polygon([[x,0],[x+42,0],[x+210,270],[x+163,270]],'#09121c');g.fillStyle='#f5d995';g.shadowColor='#ffcf78';g.shadowBlur=25;g.fillRect(x+116,190,40,5);g.shadowBlur=0}}
 else{g.fillStyle='#c9bd8d';g.globalAlpha=.5;g.beginPath();g.arc(1080,100,29,0,7);g.fill();g.globalAlpha=1}
 // Fast foreground embers and wind streaks reinforce train motion without covering characters.
 for(let j=0;j<25;j++){const x=((j*173-clock*320)%1500+1500)%1500,y=235+(j*71)%390;line(x,y,x+12+(j%4)*8,y,'#b5cbd01a')}
}
function train(){
 g.save();g.translate(0,Math.sin(clock*13)*.75);
 g.fillStyle='#08131c99';g.beginPath();g.ellipse(645,510,430,35,0,0,7);g.fill();
 for(let j=0;j<3;j++){
  const x=325+j*202,y=295;
  polygon([[x,y],[x+186,y],[x+241,y+144],[x+55,y+144]],'#52646c','#91a3a5');
  polygon([[x+55,y+144],[x+241,y+144],[x+241,y+194],[x+55,y+194]],'#213746','#466473');
  polygon([[x+186,y],[x+241,y+144],[x+241,y+194],[x+186,y+50]],'#152736','#527180');
  for(let k=0;k<5;k++){line(x+18+k*31,y+8,x+65+k*31,y+129,'#314751',2)}
  polygon([[x+22,y+20],[x+165,y+20],[x+201,y+116],[x+58,y+116]],null,'#a0afb02e');
  for(let k=0;k<4;k++){g.fillStyle='#0d2534';g.fillRect(x+71+k*36,y+155,25,16);g.fillStyle='#dbb67d55';g.fillRect(x+73+k*36,y+157,21,3)}
  g.fillStyle='#b7c6cc';g.font='bold 9px sans-serif';g.fillText('RHODES ISLAND / 0'+(j+1),x+75,y+186);
  for(let k=0;k<2;k++){g.fillStyle='#08131e';g.beginPath();g.ellipse(x+90+k*98,y+201,21,13,0,0,7);g.fill();g.strokeStyle='#617988';g.lineWidth=3;g.stroke()}
  g.fillStyle='#e7bf6d';g.fillRect(x+57,y+141,180,3);
 }
 // Armored engine nose, light and exhaust.
 polygon([[938,296],[994,311],[1042,421],[987,439]],'#536b75','#8fadb4');
 polygon([[987,439],[1042,421],[1042,472],[987,488]],'#1b3343','#6b8998');
 g.fillStyle='#b8e5ec';g.shadowColor='#a9edff';g.shadowBlur=20;g.fillRect(1025,439,17,8);g.shadowBlur=0;
 for(let j=0;j<6;j++){g.globalAlpha=.08*(1-j/6);g.fillStyle='#d4e4df';g.beginPath();g.ellipse(981-j*26,276-j*8+Math.sin(clock+j)*7,16+j*5,8+j*3,0,0,7);g.fill()}g.globalAlpha=1;
 if(hull<45){g.fillStyle='#f57d4b';g.globalAlpha=.3+Math.sin(clock*10)*.15;g.fillRect(989,458,36,7);g.globalAlpha=1}
 for(let i=0;i<SLOTS.length;i++){const s=SLOTS[i],occupied=crew.some(u=>u.slot===i);g.globalAlpha=occupied?.25:.65;polygon([[s.x-32,s.y-12],[s.x+22,s.y-12],[s.x+32,s.y+9],[s.x-22,s.y+9]],occupied?'#8ba6a555':'#99c5d533',occupied?'#9cc1c0':'#addce6');g.globalAlpha=1;if(!occupied){g.fillStyle='#d0e3e6';g.font='16px sans-serif';g.textAlign='center';g.fillText('+',s.x,s.y+3);g.textAlign='left'}}
 g.restore()
}
function drawFoe(e){
 const model=EnemyAssets[e.heavy?'shield':'soldier'];if(!model)return;
 const attacking=e.climb>=1,frame=model.renderFrame(e.dead?'Die':attacking?'Attack':'Move_Loop',e.dead?.45-e.death:clock+e.seed);
 const h=e.heavy?108:94,w=h*.8;
 g.save();g.translate(e.x,e.y);if(e.dead)g.globalAlpha=clamp(e.death/.45,0,1);
 g.fillStyle='#07111c77';g.beginPath();g.ellipse(0,0,25,6,0,0,7);g.fill();
 g.drawImage(frame,-w/2,-h,w,h);
 if(e.hit>0){g.globalAlpha=.45;g.globalCompositeOperation='screen';g.drawImage(frame,-w/2,-h,w,h);g.globalCompositeOperation='source-over';g.globalAlpha=1}
 if(!e.dead){g.fillStyle='#111e29';g.fillRect(-22,-h+4,44,3);g.fillStyle=e.heavy?'#e8b77e':'#e77765';g.fillRect(-22,-h+4,44*clamp(e.hp/e.max,0,1),3);if(e.id===focusId){g.strokeStyle='#f5d383';g.lineWidth=2;g.strokeRect(-w/2-5,-h-5,w+10,h+10)}if(e.boarder&&e.climb>0){g.fillStyle='#ffb18b';g.font='9px sans-serif';g.textAlign='center';g.fillText('登车',0,-h-7);g.textAlign='left'}}
 g.restore()
}
function drawCrew(i){
 const u=crew[i],model=OperatorAssets.models[i];if(!u||!model)return;
 g.save();g.translate(u.x,u.y+Math.sin(clock*13)*.75);
 if(i===selected){g.strokeStyle='#f6cb7b';g.lineWidth=2;g.beginPath();g.ellipse(0,0,34,11,0,0,7);g.stroke();g.fillStyle='#f7cd84';g.beginPath();g.moveTo(-5,-130);g.lineTo(5,-130);g.lineTo(0,-123);g.fill()}
 if(u.skill>0){g.globalAlpha=.3;g.fillStyle=CREW[i].color;g.shadowColor=CREW[i].color;g.shadowBlur=22;g.beginPath();g.ellipse(0,0,38,11,0,0,7);g.fill();g.globalAlpha=1;g.shadowBlur=0}
 g.scale(u.facing,1);model.draw(g,0,0,126);g.restore();
 g.fillStyle=i===selected?'#ffe0a3':'#d4e1e7';g.textAlign='center';g.font='bold 10px sans-serif';g.fillText(CREW[i].name,u.x,u.y+23);g.textAlign='left'
}
function drawEffects(){
 for(const s of shots){g.save();g.shadowColor=s.color;g.shadowBlur=s.op===1?18:8;g.strokeStyle=s.color;g.lineWidth=s.op===1?4:2;g.beginPath();for(let j=0;j<s.trail.length;j++)j?g.lineTo(s.trail[j].x,s.trail[j].y):g.moveTo(s.trail[j].x,s.trail[j].y);g.lineTo(s.x,s.y);g.stroke();g.fillStyle=s.op===1?'#112c45':'#fff4d0';g.beginPath();g.arc(s.x,s.y,s.op===1?7:3,0,7);g.fill();g.restore()}
 for(const e of effects){const f=1-e.life/e.max;g.save();g.globalAlpha=1-f;g.strokeStyle=e.color;g.fillStyle=e.color;g.shadowColor=e.color;g.shadowBlur=15;
  if(e.kind==='slash'){g.translate(e.x,e.y);g.rotate(Math.atan2(e.toY-e.y,e.toX-e.x));for(let j=0;j<3;j++){g.lineWidth=7-j*2;g.beginPath();g.ellipse(e.size*.28,0,e.size*.65,e.size*(.12+j*.03),-.4+f*.7,-1.5,1.6);g.stroke()}}
  else if(e.kind==='beam'){g.lineWidth=3;g.beginPath();g.moveTo(e.x,e.y);g.lineTo((e.x+e.toX)/2+12,(e.y+e.toY)/2-15);g.lineTo(e.toX,e.toY);g.stroke()}
  else if(e.kind==='transfer'){g.lineWidth=2;g.beginPath();g.ellipse(e.x,e.y,e.size*(1+f),12*(1+f),0,0,7);g.stroke()}
  else{g.lineWidth=2;for(let j=0;j<7;j++){const a=j*Math.PI*2/7;line(e.x+Math.cos(a)*e.size*f,e.y+Math.sin(a)*e.size*f,e.x+Math.cos(a)*e.size*(f+.5),e.y+Math.sin(a)*e.size*(f+.5),e.color,2)}}
  g.restore()
 }
 for(const l of labels){g.globalAlpha=clamp(l.life*2,0,1);g.font='bold 14px sans-serif';g.fillStyle=l.color;g.fillText(l.text,l.x,l.y)}g.globalAlpha=1;
}
function drawCutIn(){
 if(!skillCut)return;const i=skillCut.op,age=1.35-skillCut.life,alpha=Math.min(1,age*8,skillCut.life*5);
 const portrait=document.querySelectorAll('.portrait')[i];if(!portrait?.complete)return;
 g.save();g.globalAlpha=alpha;g.fillStyle='#091525e8';polygon([[0,185],[365,185],[325,350],[0,350]],'#091525ed','#afc0ca44');
 g.save();g.beginPath();g.rect(0,185,230,165);g.clip();g.drawImage(portrait,-20+Math.max(0,.2-age)*120,160,190,380);g.restore();
 g.fillStyle=CREW[i].color;g.font='bold 24px sans-serif';g.fillText(CREW[i].skill,190,270);g.fillStyle='#bdcedb';g.font='10px sans-serif';g.fillText(CREW[i].en+' / SKILL',190,293);g.restore()
}
function renderRolling(){
 g.setTransform(1,0,0,1,0,0);g.fillStyle='#07111b';g.fillRect(0,0,board.width,board.height);g.setTransform(viewport.scale,0,0,viewport.scale,viewport.x,viewport.y);
 g.save();if(shake>0&&state==='playing')g.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 background();
 if(state==='menu'){train();g.restore();return}
 const far=foes.filter(e=>e.y<290);for(const e of far)drawFoe(e);
 train();
 if(slowHeld&&slowPower>0){const u=crew[selected],r=CREW[selected].range*(phase===1&&selected!==2?.72:1)*(u.skill>0&&selected===2?2.4:1);g.save();g.strokeStyle=CREW[selected].color+'55';g.lineWidth=1;g.setLineDash([5,8]);g.beginPath();g.arc(u.x,u.y,r,0,7);g.stroke();g.restore()}
 const actors=[...foes.filter(e=>e.y>=290).map(e=>({y:e.y,draw:()=>drawFoe(e)})),...crew.map((u,i)=>({y:u.y,draw:()=>drawCrew(i)}))].sort((a,b)=>a.y-b.y);
 for(const a of actors)a.draw();drawEffects();g.restore();drawCutIn();
 if(slowHeld&&slowPower>0&&state==='playing'){g.strokeStyle='#80dbe388';g.lineWidth=5;g.strokeRect(2,2,1276,716);g.fillStyle='#bbf1f6';g.font='10px sans-serif';g.fillText('TACTICAL SLOW / '+slowPower.toFixed(1)+'s',555,102)}
}
function pointerWorld(e){const rect=board.getBoundingClientRect();return{x:((e.clientX-rect.left)*board.width/rect.width-viewport.x)/viewport.scale,y:((e.clientY-rect.top)*board.height/rect.height-viewport.y)/viewport.scale}}
board.addEventListener('pointerdown',e=>{
 if(state!=='playing')return;board.focus();const p=pointerWorld(e);
 const enemy=foes.filter(e=>!e.dead&&Math.abs(p.x-e.x)<35&&p.y<e.y+10&&p.y>e.y-110).sort((a,b)=>b.y-a.y)[0];
 if(enemy){focusId=enemy.id;say('集中火力 / '+(enemy.heavy?'重装防御者':enemy.boarder?'登车突击兵':'追击士兵'));return}
 let index=SLOTS.findIndex(s=>distance(s,p)<49);if(index>=0)transferTo(index);
});
addEventListener('keydown',e=>{
 const code=e.code||({' ':'Space',e:'KeyE',escape:'Escape'}[(e.key||'').toLowerCase()]);
 if(state==='playing'&&['Space','KeyE','Digit1','Digit2','Digit3'].includes(code))e.preventDefault();
 if(code==='Space'&&state==='playing')slowHeld=true;
 if(e.repeat)return;
 if(code==='Escape'){if(state==='playing')pauseRolling();else resumeRolling()}
 if(state!=='playing')return;
 if(['Digit1','Digit2','Digit3'].includes(code))selectCrew(+code.at(-1)-1);
 if(code==='KeyE')activateSkill(selected);
});
addEventListener('keyup',e=>{if(e.code==='Space'||e.key===' ')slowHeld=false});
addEventListener('blur',()=>{slowHeld=false;if(state==='playing')pauseRolling()});
el('launchRolling').onclick=startRolling;el('pauseButton').onclick=pauseRolling;el('continueRolling').onclick=resumeRolling;el('retryRolling').onclick=startRolling;el('againRolling').onclick=startRolling;el('menuRolling').onclick=menuRolling;el('resultMenu').onclick=menuRolling;
el('audioButton').onclick=()=>{soundOn=!soundOn;el('audioButton').textContent='音效 '+(soundOn?'ON':'OFF');if(soundOn)tone(440,.12)};
function rollingFrame(now){const dt=last?Math.min(.05,(now-last)/1000):.016;last=now;updateRolling(dt);renderRolling();requestAnimationFrame(rollingFrame)}
requestAnimationFrame(rollingFrame);

