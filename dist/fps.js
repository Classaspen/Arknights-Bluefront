const FPS={swayX:0,swayY:0,kick:0,kickVelocity:0,attack:0,reloadTime:0,aim:0,step:0,shells:[],tracer:0,skillPulse:0};
let viewmodelReady=false;
function refreshAssetStatus(){const status=document.getElementById('assetStatus');if(status)status.textContent=(EnemyAssets.error||OperatorAssets.error)?'敌人贴图加载失败，请刷新页面重试':EnemyAssets.ready&&viewmodelReady?'作战资源已就绪':'正在准备作战资源…';if(EnemyAssets.ready&&viewmodelReady&&document.getElementById('launch'))document.getElementById('launch').innerHTML='<span class="start-cn">开始行动</span><span class="start-en">OPERATION START</span><span class="start-arrow">▶</span>' }
function stepPresentation(dt){stepOperator(dt);FPS.kickVelocity+=(-110*FPS.kick-17*FPS.kickVelocity)*dt;FPS.kick+=FPS.kickVelocity*dt;FPS.swayX*=Math.exp(-dt*9);FPS.swayY*=Math.exp(-dt*9);FPS.attack=Math.max(0,FPS.attack-dt);FPS.tracer=Math.max(0,FPS.tracer-dt);FPS.skillPulse=Math.max(0,FPS.skillPulse-dt);FPS.aim+=(Number(aimHeld)-FPS.aim)*(1-Math.exp(-dt*14));if(keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD)FPS.step+=dt*(keys.ShiftLeft?13:8);for(const s of FPS.shells){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=600*dt;s.r+=dt*10;s.life-=dt}FPS.shells=FPS.shells.filter(s=>s.life>0)}
function kickShot(){operatorAction('Attack');FPS.kickVelocity+=op===0?9:op===1?4:12;FPS.attack=op===2?.48:op===1?.34:.16;FPS.tracer=.065;pitch=Math.min(H*.27,pitch+(op===0?2:op===1?1.5:0));if(op===0)FPS.shells.push({x:W*.7,y:H*.67,vx:170+Math.random()*60,vy:-160,life:.65,r:0})}
function drawReunion(e,size){const model=EnemyAssets[e.heavy?'shield':'soldier'];if(!model)return;const attack=Math.hypot(e.x-p.x,e.y-p.y)<1.2,frame=model.renderFrame(attack?'Attack':'Move_Loop',time+e.x*.13),next=map.path[e.node],side=next?-(next[0]-e.x)*Math.sin(p.a)+(next[1]-e.y)*Math.cos(p.a):1;ctx.save();ctx.fillStyle='#060e1888';ctx.beginPath();ctx.ellipse(0,0,size*.27,size*.055,0,0,7);ctx.fill();if(side<0)ctx.scale(-1,1);ctx.imageSmoothingEnabled=true;ctx.drawImage(frame,-size*.53,-size*1.29,size*1.06,size*1.29);if(e.hit>0){ctx.globalCompositeOperation='source-atop';ctx.globalCompositeOperation='source-over'}ctx.restore();ctx.fillStyle='#091018';ctx.fillRect(-size*.26,-size*1.2,size*.52,Math.max(2,size*.018));ctx.fillStyle='#ed9c72';ctx.fillRect(-size*.26,-size*1.2,size*.52*Math.max(0,e.hp/e.max),Math.max(2,size*.018))}

function stepOperator(dt){
 const model=OperatorAssets.models[op];if(!model)return;
 const entry=model.state.getCurrent(0);
 if(skillFx>0&&op!==0){model.play(model.has('Skill_2')&&op===1?'Skill_2':'Skill',true,op===1?1.4:1)}
 else if(!entry||entry.isComplete()||model.name==='Skill'||model.name==='Skill_2')model.play('Idle');
 model.update(dt);
}
function drawOperator(preview=false){
 const model=OperatorAssets.models[op];if(!model)return;
 const c=ctx,height=H*(preview?.32:.38),x=W*.79+FPS.swayX*.2,y=H*.85;
 model.draw(c,x,y,height);
 if(!preview&&FPS.skillPulse>0)drawSkillEffect();
 if(!preview&&reload>0){
  c.save();c.textAlign='center';c.font='bold 16px sans-serif';c.fillStyle='#f4f5f5';
  c.fillText(op===1?'术式回充中':'正在装填弹匣',W/2,H*.64);
  c.fillStyle='#17212c';c.fillRect(W/2-90,H*.67,180,5);
  c.fillStyle='#d5eeed';c.fillRect(W/2-90,H*.67,180*Math.max(0,1-reload/1.5),5);c.restore();
 }
}
function drawSkillEffect(){
 // Cut-in uses original portraits; skill pose comes from the original battle skeleton.
 const elapsed=1.4-FPS.skillPulse,alpha=Math.min(1,elapsed*8,FPS.skillPulse*4),c=ctx;
 const portrait=document.querySelectorAll('.operator img')[op];if(!portrait)return;
 c.save();c.globalAlpha=alpha;c.fillStyle='#0b1424df';c.fillRect(0,H*.18,W*.43,H*.44);
 c.save();c.beginPath();c.rect(0,H*.18,W*.43,H*.44);c.clip();
 const height=H*.78,width=height*portrait.naturalWidth/portrait.naturalHeight;
 c.drawImage(portrait,-width*.08+Math.max(0,.18-elapsed)*W*.3,H*.09,width,height);c.restore();
 c.fillStyle='#ffffff';c.font='bold '+Math.round(H*.035)+'px sans-serif';
 c.fillText(['过载模式','精神爆发','真银斩'][op],W*.23,H*.46);
 c.font='12px sans-serif';c.fillStyle='#bed9e3';c.fillText('SKILL ACTIVATED',W*.23,H*.51);c.restore();
}
