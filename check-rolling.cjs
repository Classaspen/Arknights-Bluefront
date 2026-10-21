const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function environment(seed=5){
 const elements={};const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 const element=id=>elements[id]??={textContent:'',innerHTML:'',hidden:false,style:{},dataset:{},classList:{toggle(){}},addEventListener(){},focus(){},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720})};
 const models=Array.from({length:3},()=>({name:'',play(n){this.name=n},update(){},draw(){},has(n){return n==='Skill'},state:{getCurrent:()=>({isComplete:()=>true})}}));
 const math=Object.create(Math);math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const env={console,Math:math,devicePixelRatio:1,innerWidth:1280,innerHeight:720,document:{getElementById:element,querySelectorAll:()=>[]},OperatorAssets:{ready:true,models},EnemyAssets:{ready:true},addEventListener(){},requestAnimationFrame(){}};
 vm.createContext(env);vm.runInContext(fs.readFileSync('dist/rolling.js','utf8'),env);
 return s=>vm.runInContext(s,env);
}
let run=environment();
run('startRolling()');assert.equal(run('state'),'playing');assert.equal(run('crew.length'),3);
assert.equal(run('transferTo(1)'),false);assert.equal(run('transferTo(0)'),true);assert.equal(run('crew[0].slot'),0);
assert.equal(run('transferTo(3)'),false); // transfer cooldown
run('updateRolling(1.7)');assert.equal(run('transferTo(3)'),true);
assert.equal(run('activateSkill(0)'),true);assert.equal(run('activateSkill(0)'),false);
run('pauseRolling();var before=elapsed;updateRolling(2)');assert.equal(run('elapsed'),run('before'));run('resumeRolling()');assert.equal(run('state'),'playing');
run('slowHeld=true;var before=elapsed;updateRolling(1)');assert.ok(run('elapsed-before')<.3);
run('hull=1;hitHull(2,0,0)');assert.equal(run('state'),'lost');assert.equal(run('hull'),0);
run('startRolling();elapsed=119.99;hull=100;updateRolling(.03)');assert.equal(run('state'),'won');
for(let i=0;i<8;i++){
 run=environment(10+i);run('startRolling()');
 for(let step=0;step<3000&&run("state==='playing'");step++){
  run("for(let i=0;i<3;i++)if(crew[i].sp>=CREW[i].cool)activateSkill(i);updateRolling(.05)");
 }
 assert.ok(run("state==='won'||state==='lost'"));
 console.log('Seed',i,run('state'), 'time',Math.round(run('elapsed')),'kills',run('kills'),'hull',Math.ceil(run('hull')));
 assert.ok(run('kills')>30);
}
console.log('PASS: assignment, occupied slots, transfer cooldown, skill recharge, pause, slow time, loss, victory and eight full encounter simulations.');
for(let i=0;i<3;i++){
 run=environment(10+i);run('startRolling()');
 for(let step=0;step<3000&&run("state==='playing'");step++)run('updateRolling(.05)');
 console.log('No-skill baseline',i,run('state'),'time',Math.round(run('elapsed')),'hull',Math.ceil(run('hull')));
}

