// ===== 武器、战斗与道具系统 =====
let fpsArms=null;
const skinMat=new THREE.MeshStandardMaterial({color:0xd4a574,roughness:0.8,metalness:0.1});
const suitMat=new THREE.MeshStandardMaterial({color:0x2a4a6a,roughness:0.4,metalness:0.6,emissive:0x0a1a2a,emissiveIntensity:0.2});
const suitAccentMat=new THREE.MeshStandardMaterial({color:0x0088cc,roughness:0.3,metalness:0.7,emissive:0x004488,emissiveIntensity:0.3});

function createFPSArms(){
  if(fpsArms){camera.remove(fpsArms);}
  fpsArms=new THREE.Group();
  // 右手臂（持枪手）
  const rightArm=new THREE.Group();
  // 上臂
  const rUpperArm=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.045,0.25,8),suitMat);
  rUpperArm.position.set(0,0.05,0);rUpperArm.rotation.z=-0.3;rightArm.add(rUpperArm);
  // 宇航服护臂装饰
  const rBrace=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.06,8),suitAccentMat);
  rBrace.position.set(0,-0.05,0);rightArm.add(rBrace);
  // 前臂
  const rForeArm=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.04,0.22,8),suitMat);
  rForeArm.position.set(0,-0.15,0);rightArm.add(rForeArm);
  // 手腕
  const rWrist=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,6),skinMat);
  rWrist.position.set(0,-0.27,0);rightArm.add(rWrist);
  // 手掌
  const rHand=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.08,0.04),skinMat);
  rHand.position.set(0,-0.33,0);rightArm.add(rHand);
  rightArm.position.set(0.18,-0.28,-0.35);rightArm.rotation.x=1.2;rightArm.rotation.z=-0.15;
  fpsArms.add(rightArm);

  // 左手臂（辅助手）
  const leftArm=new THREE.Group();
  const lUpperArm=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.045,0.25,8),suitMat);
  lUpperArm.position.set(0,0.05,0);lUpperArm.rotation.z=0.3;leftArm.add(lUpperArm);
  const lBrace=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.06,8),suitAccentMat);
  lBrace.position.set(0,-0.05,0);leftArm.add(lBrace);
  const lForeArm=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.04,0.22,8),suitMat);
  lForeArm.position.set(0,-0.15,0);leftArm.add(lForeArm);
  const lWrist=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,6),skinMat);
  lWrist.position.set(0,-0.27,0);leftArm.add(lWrist);
  const lHand=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.08,0.04),skinMat);
  lHand.position.set(0,-0.33,0);leftArm.add(lHand);
  leftArm.position.set(-0.15,-0.3,-0.45);leftArm.rotation.x=1.3;leftArm.rotation.z=0.15;
  fpsArms.add(leftArm);

  camera.add(fpsArms);
}

function createWeaponViewModel(){
  if(weaponModel)camera.remove(weaponModel);
  weaponModel=new THREE.Group();
  const w=PLAYER.weapons[PLAYER.currentWeapon];if(!w){
    // 无武器时也显示手臂
    if(!fpsArms)createFPSArms();
    return;
  }
  if(w.def.type==='melee'){
    // 能量刃 - 更精细的模型
    const blade=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.65,0.02),
      new THREE.MeshBasicMaterial({color:w.def.color,transparent:true,opacity:0.85}));
    blade.position.y=0.2;weaponModel.add(blade);
    // 刃尖发光
    const tip=new THREE.Mesh(new THREE.ConeGeometry(0.03,0.1,6),
      new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.9}));
    tip.position.y=0.55;weaponModel.add(tip);
    // 刃身发光
    const glow=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.65,0.04),
      new THREE.MeshBasicMaterial({color:w.def.color,transparent:true,opacity:0.2}));
    glow.position.y=0.2;weaponModel.add(glow);
    // 手柄
    const handle=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.035,0.18,8),
      new THREE.MeshStandardMaterial({color:0x333333,metalness:0.9,roughness:0.2}));
    handle.position.y=-0.15;weaponModel.add(handle);
    // 护手
    const guard=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.03,0.06),
      new THREE.MeshStandardMaterial({color:0x555555,metalness:0.8}));
    guard.position.y=-0.05;weaponModel.add(guard);
    // 点光源
    const bl=new THREE.PointLight(w.def.color,0.5,2);bl.position.y=0.2;weaponModel.add(bl);
  }else{
    // 枪械 - 更精细的模型
    const isShotgun=w.def.id==='em_shotgun'||w.def.pellets;
    // 枪管
    const barrelLen=isShotgun?0.45:0.55;
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(isShotgun?0.025:0.018,isShotgun?0.022:0.015,barrelLen,8),
      new THREE.MeshStandardMaterial({color:0x2a2a2a,metalness:0.95,roughness:0.15}));
    barrel.rotation.x=Math.PI/2;barrel.position.z=-barrelLen/2-0.1;weaponModel.add(barrel);
    // 枪口发光环
    const muzzle=new THREE.Mesh(new THREE.RingGeometry(0.01,isShotgun?0.028:0.02,12),
      new THREE.MeshBasicMaterial({color:w.def.color,transparent:true,opacity:0.6,side:THREE.DoubleSide}));
    muzzle.position.z=-barrelLen-0.1;weaponModel.add(muzzle);
    // 机匣
    const body=new THREE.Mesh(new THREE.BoxGeometry(isShotgun?0.07:0.055,isShotgun?0.08:0.065,0.22),
      new THREE.MeshStandardMaterial({color:0x1a1a1a,metalness:0.85,roughness:0.25}));
    body.position.z=0;weaponModel.add(body);
    // 科幻装饰条
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(0.002,isShotgun?0.085:0.07,0.2),
      new THREE.MeshBasicMaterial({color:w.def.color,transparent:true,opacity:0.5}));
    stripe.position.set(isShotgun?0.037:0.03,0,0);weaponModel.add(stripe);
    // 握把
    const grip=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.13,0.05),
      new THREE.MeshStandardMaterial({color:0x111111,roughness:0.6}));
    grip.position.set(0,-0.09,0.06);grip.rotation.x=0.25;weaponModel.add(grip);
    // 瞄准器/顶部导轨
    const rail=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.015,0.15),
      new THREE.MeshStandardMaterial({color:0x333333,metalness:0.9}));
    rail.position.set(0,0.04,-0.02);weaponModel.add(rail);
    // 瞄准点
    const sight=new THREE.Mesh(new THREE.SphereGeometry(0.008,8,8),
      new THREE.MeshBasicMaterial({color:0xff0000}));
    sight.position.set(0,0.055,-0.05);weaponModel.add(sight);
    // 弹匣
    const mag=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.08,0.04),
      new THREE.MeshStandardMaterial({color:0x222222,metalness:0.7}));
    mag.position.set(0,-0.07,-0.02);weaponModel.add(mag);
    if(isShotgun){
      // 霰弹枪前护木
      const pump=new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.12,8),
        new THREE.MeshStandardMaterial({color:0x333333,roughness:0.5,metalness:0.6}));
      pump.rotation.x=Math.PI/2;pump.position.z=-0.25;weaponModel.add(pump);
    }
  }
  weaponModel.position.set(0.28,-0.28,-0.5);
  camera.add(weaponModel);
  // 确保手臂存在
  if(!fpsArms)createFPSArms();
}

function shoot(){
  if(!PLAYER.alive||PLAYER.isReloading||PLAYER.shootCooldown>0)return;
  const w=PLAYER.weapons[PLAYER.currentWeapon];if(!w)return;
  if(w.ammo<=0){startReload();return;}
  w.ammo--;PLAYER.shootCooldown=w.def.fireRate;
  playSound(w.def.sound,0.4);
  if(weaponModel){weaponModel.position.z=-0.43;weaponModel.rotation.x=-0.06;}
  const pellets=w.def.pellets||1;
  for(let p=0;p<pellets;p++){
    const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
    dir.x+=(Math.random()-0.5)*w.def.spread;dir.y+=(Math.random()-0.5)*w.def.spread;dir.normalize();
    const org=camera.position.clone();
    createBulletTrail(org,dir,w.def.range,w.def.color);
    enemies.forEach(en=>{
      if(!en.alive)return;
      const toE=en.mesh.position.clone().sub(org);
      const proj=toE.dot(dir);if(proj<0||proj>w.def.range)return;
      const cl=org.clone().add(dir.clone().multiplyScalar(proj));
      const d=cl.distanceTo(en.mesh.position.clone().add(new THREE.Vector3(0,1,0)));
      if(d<1.2){
        // === 闪避判定 ===
        if(!en.isDodging&&en.dodgeCooldown<=0&&en.state==='chase'&&Math.random()<en.dodgeChance){
          // 触发闪避！
          triggerEnemyDodge(en,dir);
          return; // 本次射击被闪避
        }
        let dmg=w.def.damage/pellets;
        const hy=cl.y-en.mesh.position.y;
        let isHeadshot=false;
        if(hy>1.8){dmg*=1.5;isHeadshot=true;}
        else if(hy<0.5)dmg*=0.8;
        if(PLAYER.buffs.find(b=>b.effect==='damage_up'))dmg*=1.5;
        en.health-=dmg;en.state='chase';
        GAME.score.totalDamage+=dmg;
        // 伤害飘字
        createDamageNumber(cl,dmg,isHeadshot);
        createHitEffect(cl,w.def.color);
        if(isHeadshot){
          showHitmarker(true);
          playSound('headshot',0.5);
        }else{
          showHitmarker(false);
          playSound('hit',0.3);
        }
        if(en.health<=0)killEnemy(en);
      }
    });
  }
  updateWeaponUI();
}

// 伤害飘字（3D Sprite）
function createDamageNumber(pos,damage,isHeadshot,customText){
  if(!SETTINGS.showDmgNumbers&&!customText)return; // 设置关闭伤害飘字时跳过（保留DODGE等特殊文字）
  const canvas=document.createElement('canvas');
  canvas.width=128;canvas.height=64;
  const ctx=canvas.getContext('2d');
  const dmgText=customText||Math.round(damage).toString();
  ctx.font=(isHeadshot?'bold 48px':'bold 36px')+' Arial';
  ctx.textAlign='center';ctx.textBaseline='middle';
  // 描边
  ctx.strokeStyle='rgba(0,0,0,0.8)';ctx.lineWidth=4;
  ctx.strokeText(dmgText,64,32);
  // 填充
  if(isHeadshot){
    ctx.fillStyle='#ffdd00'; // 金色爆头
    ctx.fillText(dmgText,64,32);
    ctx.font='bold 18px Arial';
    ctx.fillStyle='#ff4444';
    ctx.fillText('HEADSHOT',64,58);
  }else if(customText==='DODGE'){
    ctx.fillStyle='#44aaff'; // 蓝色闪避
    ctx.fillText(dmgText,64,32);
  }else if(damage>=30){
    ctx.fillStyle='#ff6644'; // 高伤害橙色
    ctx.fillText(dmgText,64,32);
  }else{
    ctx.fillStyle='#ffffff'; // 普通白色
    ctx.fillText(dmgText,64,32);
  }
  const texture=new THREE.CanvasTexture(canvas);
  const mat=new THREE.SpriteMaterial({map:texture,transparent:true,opacity:1,depthTest:false});
  const sprite=new THREE.Sprite(mat);
  sprite.position.copy(pos);sprite.position.y+=0.5;
  const baseScale=isHeadshot?2.5:1.8;
  sprite.scale.set(baseScale,baseScale*0.5,1);
  scene.add(sprite);
  // 限制数量
  if(DAMAGE_NUMBERS.sprites.length>=DAMAGE_NUMBERS.maxCount){
    const oldest=DAMAGE_NUMBERS.sprites.shift();
    scene.remove(oldest.sprite);
  }
  DAMAGE_NUMBERS.sprites.push({sprite:sprite,life:1.0,maxLife:1.0,baseScale:baseScale});
}

function killEnemy(en){
  en.alive=false;en.mesh.visible=false;en.respawnTimer=en.isReinforcement?999:8;
  const killGold=en.isElite?80:20;
  GAME.score.kills++;GAME.score.gold+=killGold;
  playSound('kill',0.5);showKillPopup(en.name+(en.isElite?' 💀':''));addKillFeed('你',en.name);updateScoreUI();
  // 精英敌人大量掉落
  if(en.isElite){
    for(let i=0;i<3;i++){
      const ids=Object.keys(ITEMS),rid=ids[Math.floor(Math.random()*ids.length)];
      const offset=new THREE.Vector3((Math.random()-0.5)*3,0,(Math.random()-0.5)*3);
      createLootDrop(en.mesh.position.clone().add(offset),'item',rid);
    }
    showMessage('💀 精英击杀！','获得大量战利品和 '+killGold+' 金币！');
  }else if(Math.random()>0.5){
    const ids=Object.keys(ITEMS),rid=ids[Math.floor(Math.random()*ids.length)];
    createLootDrop(en.mesh.position.clone(),'item',rid);
  }
}
function createLootDrop(pos,type,id){
  const grp=new THREE.Group(),c=0x00ff88;
  grp.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.3),new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.5})));
  grp.position.copy(pos);grp.position.y=0.5;scene.add(grp);
  const def=ITEMS[id];
  lootItems.push({type,id,def:def,mesh:grp,collected:false});
}

function handlePickup(){
  if(!nearbyLoot||nearbyLoot.collected)return;
  const l=nearbyLoot;l.collected=true;scene.remove(l.mesh);playSound('pickup',0.4);
  if(l.type==='weapon'){
    const wi={...l.def,def:l.def,ammo:l.def.maxAmmo};
    if(PLAYER.weapons.length<3)PLAYER.weapons.push(wi);else PLAYER.weapons[PLAYER.currentWeapon]=wi;
    PLAYER.currentWeapon=Math.min(PLAYER.weapons.length-1,PLAYER.currentWeapon||0);
    if(PLAYER.weapons.length===1)PLAYER.currentWeapon=0;
    createWeaponViewModel();
    const rareText=l.def.rare?'⭐稀有! ':'';
    showMessage(l.def.icon+' '+rareText+l.def.name,'伤害:'+l.def.damage+(l.def.pellets?'×'+l.def.pellets:'')+' | DPS:'+l.def.dps);
  }else if(l.type==='item'){
    if(PLAYER.items.length<3){
      // 确保完整复制道具属性
      const itemData={id:l.id,name:l.def.name,icon:l.def.icon,effect:l.def.effect,duration:l.def.duration||0,value:l.def.value||0};
      PLAYER.items.push(itemData);
      // 自动选中第一个道具
      if(PLAYER.items.length===1)PLAYER.currentItem=0;
      showMessage(l.def.icon+' '+l.def.name,'道具已获取，按 Q 使用');
    }
    else showMessage('⚠️ 道具栏已满','按 Q 使用道具后再拾取');
  }else if(l.type==='fragment'){
    PLAYER.energyFragments++;GAME.score.fragments++;
    showMessage('💎 能量碎片','已收集 '+PLAYER.energyFragments+'/3');
    if(PLAYER.energyFragments>=3)showMessage('🌀 快速撤离通道已解锁！','');
  }
  GAME.score.lootCount++;nearbyLoot=null;
  document.getElementById('pickupPrompt').style.display='none';
  updateInventoryUI();updateScoreUI();updateItemHint();
}

function useItem(){
  if(!PLAYER.alive||PLAYER.items.length===0){
    if(PLAYER.items.length===0)showMessage('⚠️ 没有道具','搜集道具后按 Q 使用');
    return;
  }
  // 修正索引：确保 currentItem 在有效范围内
  if(PLAYER.currentItem>=PLAYER.items.length)PLAYER.currentItem=0;
  const idx=PLAYER.currentItem;
  const it=PLAYER.items[idx];
  if(!it){showMessage('⚠️ 该槽位无道具','');return;}
  // 移除道具
  PLAYER.items.splice(idx,1);
  if(PLAYER.currentItem>=PLAYER.items.length)PLAYER.currentItem=Math.max(0,PLAYER.items.length-1);
  // 通用使用音效
  playSound('item_use',0.4);
  // 使用特效闪光
  const flashEl=document.getElementById('damageIndicator');
  if(it.effect==='heal'){
    PLAYER.health=Math.min(PLAYER.maxHealth,PLAYER.health+(it.value||50));playSound('heal',0.4);
    showMessage('💊 治疗完成','+'+(it.value||50)+' HP');
    flashEl.style.background='radial-gradient(ellipse at center, transparent 50%, rgba(0,255,100,0.3) 100%)';
    flashEl.style.opacity='0.6';setTimeout(()=>{flashEl.style.opacity='0';flashEl.style.background='radial-gradient(ellipse at center, transparent 50%, rgba(255,0,0,0.4) 100%)';},300);
  }
  else if(it.effect==='shield'){PLAYER.buffs.push({effect:'shield',duration:it.duration||8,name:'能量盾',icon:'🛡️'});showMessage('🛡️ 能量盾激活','减伤70%，持续'+(it.duration||8)+'秒');}
  else if(it.effect==='speed'){PLAYER.buffs.push({effect:'speed',duration:it.duration||10,name:'加速',icon:'⚡'});showMessage('⚡ 加速装置启动','移速+50%，持续'+(it.duration||10)+'秒');}
  else if(it.effect==='stealth'){PLAYER.buffs.push({effect:'stealth',duration:it.duration||6,name:'隐身',icon:'👻'});showMessage('👻 隐身装置启动','敌人无法发现你，持续'+(it.duration||6)+'秒');}
  else if(it.effect==='damage_up'){PLAYER.buffs.push({effect:'damage_up',duration:it.duration||10,name:'伤害增幅',icon:'🔥'});showMessage('🔥 伤害增幅','伤害+50%，持续'+(it.duration||10)+'秒');}
  else if(it.effect==='grenade'){throwGrenade();}
  updateInventoryUI();updateBuffUI();updateHealthUI();updateItemHint();
}

function throwGrenade(){
  const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);dir.y+=0.3;
  const gp=camera.position.clone().add(dir.clone().multiplyScalar(15));gp.y=Math.max(gp.y,0.5);
  playSound('explosion',0.5);showMessage('💣 引力手雷！','');createExplosion(gp);
  enemies.forEach(en=>{if(!en.alive)return;const d=en.mesh.position.distanceTo(gp);if(d<12){const dmg=40*(1-d/12);en.health-=dmg;if(en.health<=0)killEnemy(en);else en.state='chase';}});
}
function startReload(){
  const w=PLAYER.weapons[PLAYER.currentWeapon];if(!w||w.ammo===w.def.maxAmmo||w.def.type==='melee'||PLAYER.isReloading)return;
  PLAYER.isReloading=true;PLAYER.reloadTimer=w.def.reloadTime;playSound('reload',0.3);showMessage('🔄 换弹中...','');
}
function switchWeapon(i){if(i>=PLAYER.weapons.length)return;PLAYER.currentWeapon=i;PLAYER.isReloading=false;createWeaponViewModel();updateWeaponUI();updateInventoryUI();}

// === 敌人闪避系统 ===
function triggerEnemyDodge(en,bulletDir){
  en.isDodging=true;
  en.dodgeCooldown=en.dodgeCooldownMax;
  en.dodgeTimer=0.3; // 闪避持续0.3秒
  // 闪避方向：垂直于子弹方向（随机左或右）
  const side=Math.random()>0.5?1:-1;
  en.dodgeDir=new THREE.Vector3(-bulletDir.z*side,0,bulletDir.x*side).normalize();
  // 创建残影特效
  createDodgeAfterimage(en);
  // 播放闪避音效
  playSound('dodge',0.4);
  // 显示闪避提示
  createDamageNumber(en.mesh.position.clone().add(new THREE.Vector3(0,2.5,0)),0,false,'DODGE');
}

function createDodgeAfterimage(en){
  // 在敌人当前位置创建残影（半透明克隆）
  const ghostMat=new THREE.MeshBasicMaterial({
    color:en.isElite?0xff4444:0x4488ff,
    transparent:true,opacity:0.5,wireframe:true
  });
  const ghost=new THREE.Group();
  // 简化残影：一个圆柱体+球体
  const typeDef=ENEMY_TYPES[en.type];
  const scale=en.isElite?1.4:1;
  const bodyGhost=new THREE.Mesh(
    new THREE.CylinderGeometry(typeDef.bodyRadius[0]*scale,typeDef.bodyRadius[1]*scale,typeDef.height*scale,6),
    ghostMat);
  bodyGhost.position.y=typeDef.height*scale/2;
  ghost.add(bodyGhost);
  const headGhost=new THREE.Mesh(new THREE.SphereGeometry(0.35*scale,8,6),ghostMat);
  headGhost.position.y=typeDef.headY*scale;
  ghost.add(headGhost);
  ghost.position.copy(en.mesh.position);
  ghost.rotation.copy(en.mesh.rotation);
  scene.add(ghost);
  // 残影渐隐消失
  particles.push({mesh:ghost,velocity:new THREE.Vector3(0,0,0),life:0.4,_isGhost:true,_startOpacity:0.5});
}

// 更新敌人闪避状态（每帧调用）
function updateEnemyDodge(en,dt){
  if(en.isDodging){
    en.dodgeTimer-=dt;
    // 快速侧移
    const dodgeSpd=en.dodgeSpeed;
    let enNewX=en.mesh.position.x+en.dodgeDir.x*dodgeSpd*dt;
    let enNewZ=en.mesh.position.z+en.dodgeDir.z*dodgeSpd*dt;
    // 墙壁碰撞
    const er=0.6;
    walls.forEach(w=>{
      if(enNewX+er>w.min.x&&enNewX-er<w.max.x&&enNewZ+er>w.min.z&&enNewZ-er<w.max.z&&en.mesh.position.y<w.max.y){
        enNewX=en.mesh.position.x;enNewZ=en.mesh.position.z;
      }
    });
    en.mesh.position.x=enNewX;
    en.mesh.position.z=enNewZ;
    // 闪避视觉效果：身体倾斜+缩放
    const dodgeProgress=en.dodgeTimer/0.3;
    const tilt=Math.sin(dodgeProgress*Math.PI)*0.3;
    en.mesh.rotation.z=en.dodgeDir.x>0?tilt:-tilt;
    en.mesh.scale.set(1-Math.abs(tilt)*0.3,1+Math.abs(tilt)*0.2,1);
    if(en.dodgeTimer<=0){
      en.isDodging=false;
      en.mesh.rotation.z=0;
      en.mesh.scale.set(1,1,1);
    }
    return true; // 闪避中，跳过正常AI
  }
  en.dodgeCooldown=Math.max(0,en.dodgeCooldown-dt);
  return false; // 未在闪避
}
