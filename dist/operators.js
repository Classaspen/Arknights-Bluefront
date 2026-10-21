// Original battle skeletons, addressed by the same character IDs as PRTS.
const OperatorAssets={models:[],ready:false,error:''};
class BattleOperator {
 constructor(data,atlas,image){
  const texture=new spine.canvas.CanvasTexture(image);
  this.atlas=new spine.TextureAtlas(atlas,()=>texture);
  for(const region of this.atlas.regions)region.renderObject=region;
  this.data=new spine.SkeletonBinary(new spine.AtlasAttachmentLoader(this.atlas)).readSkeletonData(data);
  this.skeleton=new spine.Skeleton(this.data);
  this.state=new spine.AnimationState(new spine.AnimationStateData(this.data));
  this.state.data.defaultMix=.12;
  this.skeleton.setToSetupPose();this.skeleton.updateWorldTransform();
  this.offset=new spine.Vector2();this.size=new spine.Vector2();
  this.skeleton.getBounds(this.offset,this.size,[]);
  this.name='';this.clock=0;
 }
 has(name){return !!this.data.findAnimation(name)}
 play(name,loop=true,speed=1){
  if(!this.has(name))name='Idle';
  if(this.name===name)return;
  this.name=name;this.clock=0;
  this.state.setAnimation(0,name,loop).timeScale=speed;
 }
 update(dt){this.clock+=dt;this.state.update(dt);this.state.apply(this.skeleton);this.skeleton.updateWorldTransform()}
 draw(c,x,y,height){
  const scale=height/this.size.y;
  c.save();c.translate(x,y);c.scale(scale,-scale);
  c.translate(-this.offset.x-this.size.x/2,-this.offset.y);
  if(!this.renderer){this.renderer=new spine.canvas.SkeletonRenderer(c);this.renderer.triangleRendering=true}
  this.renderer.draw(this.skeleton);c.restore();
 }
}
async function loadOperators(){
 try{
  OperatorAssets.models=await Promise.all(['103_angel','002_amiya','172_svrash'].map(async id=>{
   const path='assets/char_'+id;
   const [binary,atlas,image]=await Promise.all([
    fetch(path+'.skel').then(r=>{if(!r.ok)throw Error(id);return r.arrayBuffer()}),
    fetch(path+'.atlas').then(r=>r.text()),assetImage(path+'.png')]);
   return new BattleOperator(new Uint8Array(binary),atlas,image);
  }));
  OperatorAssets.ready=true;viewmodelReady=true;refreshAssetStatus();
 }catch(e){OperatorAssets.error=e.message;refreshAssetStatus();console.error('Operator assets:',e)}
}
function operatorAction(name){
 const model=OperatorAssets.models[op];if(!model)return;
 model.name='';model.play(name,false,name==='Attack'?model.data.findAnimation('Attack').duration/Math.max(.3,OPS[op].rate):1);
}
if(typeof Image!=='undefined')loadOperators();

