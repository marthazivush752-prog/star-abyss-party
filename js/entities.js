// ===== 物资与敌人系统 =====
function spawnLootItems(){
  lootItems.forEach(l=>scene.remove(l.mesh));lootItems=[];
  let spawns;
  const edLevel=window._editorLevel;
  const customLevel=window._customLevelData;
  // 关卡模式：从LEVELS数组读取物资数据
  if(currentLevelIndex>=0&&currentLevelIndex<LEVELS.length&&!edLevel){
    const levelDef=LEVELS[currentLevelIndex];
    spawns=(levelDef.loot||[]).map(l=>{
      if(l.lootType==='weapon')return{p:[l.x,0.8,l.z],t:'weapon',id:l.lootId};
      if(l.lootType==='item')return{p:[l.x,0.5,l.z],t:'item',id:l.lootId};
      return{p:[l.x,1,l.z],t:'fragment'};
    });
  }else if(edLevel&&edLevel.objects){
    const loot=edLevel.objects.filter(o=>o.layer==='loot');
    spawns=loot.map(l=>{
      if(l.lootType==='weapon')return{p:[l.x,0.8,l.z],t:'weapon',id:l.lootId};
      if(l.lootType==='item')return{p:[l.x,0.5,l.z],t:'item',id:l.lootId};
      return{p:[l.x,1,l.z],t:'fragment'};
    });
  }else if(customLevel&&customLevel.editorData&&customLevel.editorData.objects){
    const loot=customLevel.editorData.objects.filter(o=>o.layer==='loot');
    spawns=loot.map(l=>{
      if(l.lootType==='weapon')return{p:[l.x,0.8,l.z],t:'weapon',id:l.lootId};
      if(l.lootType==='item')return{p:[l.x,0.5,l.z],t:'item',id:l.lootId};
      return{p:[l.x,1,l.z],t:'fragment'};
    });
  }else{
    spawns=[
      {p:[-20,0.8,-5],t:'weapon',id:'laser_rifle'},{p:[20,0.8,5],t:'weapon',id:'laser_rifle'},
      {p:[-50,0.8,-30],t:'weapon',id:'em_shotgun'},{p:[50,0.8,30],t:'weapon',id:'em_shotgun'},
      {p:[0,0.8,-85],t:'weapon',id:'energy_blade'},{p:[-30,0.8,20],t:'weapon',id:'laser_rifle'},
      {p:[30,0.8,-20],t:'weapon',id:'em_shotgun'},{p:[-70,0.8,0],t:'weapon',id:'laser_rifle'},
      {p:[70,0.8,0],t:'weapon',id:'em_shotgun'},{p:[0,0.8,50],t:'weapon',id:'energy_blade'},
      {p:[-10,0.5,10],t:'item',id:'shield'},{p:[10,0.5,-10],t:'item',id:'heal'},
      {p:[-45,0.5,-25],t:'item',id:'speed'},{p:[45,0.5,25],t:'item',id:'heal'},
      {p:[-5,0.5,-80],t:'item',id:'damage_up'},{p:[5,0.5,-90],t:'item',id:'stealth'},
      {p:[-25,0.5,-50],t:'item',id:'grenade'},{p:[25,0.5,50],t:'item',id:'grenade'},
      {p:[60,0.5,-50],t:'item',id:'shield'},{p:[-60,0.5,50],t:'item',id:'speed'},
      {p:[0,0.5,0],t:'item',id:'heal'},{p:[40,0.5,-70],t:'item',id:'damage_up'},
      {p:[0,1,-75],t:'fragment'},{p:[-10,1,-90],t:'fragment'},{p:[10,1,-95],t:'fragment'}
    ];
  }
  spawns.forEach(sp=>{
    const grp=new THREE.Group();
    let data;
    if(sp.t==='weapon'){
      const def=WEAPONS[sp.id],c=def.color;
      grp.add(new THREE.Mesh(new THREE.BoxGeometry(0.8,0.3,0.3),new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.3,metalness:0.8,roughness:0.2})));
      const r=new THREE.Mesh(new THREE.RingGeometry(0.6,0.8,16),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.4,side:THREE.DoubleSide}));
      r.rotation.x=-Math.PI/2;r.position.y=-0.3;grp.add(r);
      data={type:'weapon',id:sp.id,def:def,mesh:grp,collected:false};
    }else if(sp.t==='item'){
      const def=ITEMS[sp.id];
      grp.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.4),new THREE.MeshStandardMaterial({color:0x00ff88,emissive:0x00ff88,emissiveIntensity:0.4,metalness:0.5,roughness:0.3})));
      const r=new THREE.Mesh(new THREE.RingGeometry(0.4,0.55,16),new THREE.MeshBasicMaterial({color:0x00ff88,transparent:true,opacity:0.3,side:THREE.DoubleSide}));
      r.rotation.x=-Math.PI/2;r.position.y=-0.2;grp.add(r);
      data={type:'item',id:sp.id,def:def,mesh:grp,collected:false};
    }else{
      grp.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.5),new THREE.MeshStandardMaterial({color:0xff88ff,emissive:0xff88ff,emissiveIntensity:0.6,metalness:0.9,roughness:0.1})));
      const r=new THREE.Mesh(new THREE.RingGeometry(0.5,0.7,16),new THREE.MeshBasicMaterial({color:0xff88ff,transparent:true,opacity:0.5,side:THREE.DoubleSide}));
      r.rotation.x=-Math.PI/2;r.position.y=-0.3;grp.add(r);
      data={type:'fragment',mesh:grp,collected:false};
    }
    grp.position.set(sp.p[0],sp.p[1],sp.p[2]);scene.add(grp);lootItems.push(data);
  });
}

function createEnemyMesh(typeDef,isElite){
  const grp=new THREE.Group();
  const s=typeDef.height>=2.0;
  const scale=isElite?1.4:1;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(typeDef.bodyRadius[0]*scale,typeDef.bodyRadius[1]*scale,typeDef.height*scale,6),
    new THREE.MeshStandardMaterial({color:typeDef.color,emissive:typeDef.emissive,emissiveIntensity:0.3,metalness:s?0.8:0.3,roughness:0.4}));
  body.position.y=typeDef.height*scale/2;body.castShadow=true;grp.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.35*scale,8,6),
    new THREE.MeshStandardMaterial({color:typeDef.headColor,emissive:typeDef.headEmissive,emissiveIntensity:0.4}));
  head.position.y=typeDef.headY*scale;grp.add(head);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(0.12*scale,8,8),new THREE.MeshBasicMaterial({color:isElite?0xffff00:0xff0000}));
  eye.position.set(0,typeDef.headY*scale,0.3*scale);grp.add(eye);
  // 精英敌人额外视觉：头顶光环
  if(isElite){
    const crown=new THREE.Mesh(new THREE.TorusGeometry(0.5,0.08,8,16),new THREE.MeshBasicMaterial({color:0xffaa00,transparent:true,opacity:0.8}));
    crown.position.y=typeDef.headY*scale+0.6;crown.rotation.x=Math.PI/2;grp.add(crown);
    const glow=new THREE.PointLight(0xff4400,2,15);glow.position.y=typeDef.height*scale/2;grp.add(glow);
  }
  // 蓄力指示器（初始不可见）
  const chargeRing=new THREE.Mesh(new THREE.RingGeometry(0.8*scale,1.0*scale,24),new THREE.MeshBasicMaterial({color:0xff0000,transparent:true,opacity:0,side:THREE.DoubleSide}));
  chargeRing.rotation.x=-Math.PI/2;chargeRing.position.y=0.1;chargeRing.name='chargeRing';grp.add(chargeRing);
  return grp;
}

function spawnEnemies(){
  enemies.forEach(e=>scene.remove(e.mesh));enemies=[];
  let ed;
  const edLevel=window._editorLevel;
  const customLevel=window._customLevelData;
  if(edLevel&&edLevel.objects){
    const enemyObjs=edLevel.objects.filter(o=>o.layer==='enemies');
    ed=enemyObjs.map(e=>({p:[e.x,0,e.z],t:e.type}));
  }else if(customLevel&&customLevel.editorData&&customLevel.editorData.objects){
    const enemyObjs=customLevel.editorData.objects.filter(o=>o.layer==='enemies');
    ed=enemyObjs.map(e=>({p:[e.x,0,e.z],t:e.type}));
  }else{
    ed=[
      {p:[-30,0,-30],t:'sentinel'},{p:[30,0,30],t:'sentinel'},
      {p:[-50,0,20],t:'alien'},{p:[50,0,-20],t:'alien'},
      {p:[0,0,-60],t:'sentinel'},{p:[-20,0,60],t:'alien'},
      {p:[20,0,-80],t:'sentinel'},{p:[-60,0,-50],t:'alien'},
      {p:[60,0,50],t:'alien'},{p:[0,0,30],t:'sentinel'}
    ];
  }
  ed.forEach(e=>{
    const typeDef=ENEMY_TYPES[e.t];
    const grp=createEnemyMesh(typeDef,false);
    grp.position.set(e.p[0],e.p[1],e.p[2]);scene.add(grp);
    enemies.push({mesh:grp,type:e.t,name:typeDef.name,health:typeDef.health,maxHealth:typeDef.health,
      speed:typeDef.speed,damage:typeDef.damage,range:typeDef.range,attackCooldown:0,attackRate:typeDef.attackRate,
      state:'patrol',_attackAnim:0,chargeTimer:0,isCharging:false,isElite:false,
      // 闪避属性
      dodgeChance:typeDef.dodgeChance||0,dodgeSpeed:typeDef.dodgeSpeed||8,dodgeDist:typeDef.dodgeDist||3,
      dodgeCooldown:0,dodgeCooldownMax:typeDef.dodgeCooldown||3.0,isDodging:false,dodgeTimer:0,dodgeDir:new THREE.Vector3(),
      patrolTarget:new THREE.Vector3(e.p[0]+(Math.random()-0.5)*20,0,e.p[2]+(Math.random()-0.5)*20),
      spawnPos:new THREE.Vector3(e.p[0],e.p[1],e.p[2]),alive:true,respawnTimer:0});
  });
}

// 波次增援：从地图边缘生成敌人
function spawnWaveReinforcements(waveNum){
  const count=Math.min(2+waveNum,6);
  const totalEnemies=enemies.filter(e=>e.alive).length;
  if(totalEnemies>=WAVE.maxEnemies)return;
  const toSpawn=Math.min(count,WAVE.maxEnemies-totalEnemies);
  for(let i=0;i<toSpawn;i++){
    const angle=Math.random()*Math.PI*2;
    const dist=GAME.mapSize-5;
    const px=Math.cos(angle)*dist,pz=Math.sin(angle)*dist;
    const t=Math.random()>0.5?'sentinel':'alien';
    const typeDef=ENEMY_TYPES[t];
    const grp=createEnemyMesh(typeDef,false);
    grp.position.set(px,0,pz);scene.add(grp);
    enemies.push({mesh:grp,type:t,name:typeDef.name+'·增援',health:typeDef.health,maxHealth:typeDef.health,
      speed:typeDef.speed*1.1,damage:typeDef.damage,range:typeDef.range,attackCooldown:0,attackRate:typeDef.attackRate,
      state:'chase',_attackAnim:0,chargeTimer:0,isCharging:false,isElite:false,
      dodgeChance:typeDef.dodgeChance||0,dodgeSpeed:typeDef.dodgeSpeed||8,dodgeDist:typeDef.dodgeDist||3,
      dodgeCooldown:0,dodgeCooldownMax:typeDef.dodgeCooldown||3.0,isDodging:false,dodgeTimer:0,dodgeDir:new THREE.Vector3(),
      patrolTarget:new THREE.Vector3(px+(Math.random()-0.5)*20,0,pz+(Math.random()-0.5)*20),
      spawnPos:new THREE.Vector3(px,0,pz),alive:true,respawnTimer:0,isReinforcement:true});
  }
  showMessage('⚠️ 第'+waveNum+'波增援来袭！','敌人从地图边缘涌入！');
  playSound('wave_alert',0.5);
}

// 精英敌人/BOSS生成
function spawnEliteEnemy(){
  const typeDef=ENEMY_TYPES.elite;
  const angle=Math.random()*Math.PI*2;
  const dist=40+Math.random()*30;
  const px=Math.cos(angle)*dist,pz=Math.sin(angle)*dist;
  const grp=createEnemyMesh(typeDef,true);
  grp.position.set(px,0,pz);scene.add(grp);
  enemies.push({mesh:grp,type:'elite',name:typeDef.name,health:typeDef.health,maxHealth:typeDef.health,
    speed:typeDef.speed,damage:typeDef.damage,range:typeDef.range,attackCooldown:0,attackRate:typeDef.attackRate,
    state:'patrol',_attackAnim:0,chargeTimer:0,isCharging:false,isElite:true,
    dodgeChance:typeDef.dodgeChance||0,dodgeSpeed:typeDef.dodgeSpeed||10,dodgeDist:typeDef.dodgeDist||5,
    dodgeCooldown:0,dodgeCooldownMax:typeDef.dodgeCooldown||2.5,isDodging:false,dodgeTimer:0,dodgeDir:new THREE.Vector3(),
    patrolTarget:new THREE.Vector3(px+(Math.random()-0.5)*30,0,pz+(Math.random()-0.5)*30),
    spawnPos:new THREE.Vector3(px,0,pz),alive:true,respawnTimer:0});
  showMessage('💀 精英守卫出现！','击败它获取大量奖励！');
  playSound('elite_spawn',0.6);
}

// 空投生成
function spawnAirdrop(){
  const angle=Math.random()*Math.PI*2;
  const dist=20+Math.random()*60;
  const px=Math.cos(angle)*dist,pz=Math.sin(angle)*dist;
  const grp=new THREE.Group();
  // 空投箱体
  const box=new THREE.Mesh(new THREE.BoxGeometry(1.5,1,1.5),new THREE.MeshStandardMaterial({color:0xffaa00,emissive:0xff8800,emissiveIntensity:0.4,metalness:0.7,roughness:0.3}));
  box.position.y=0.5;box.castShadow=true;grp.add(box);
  // 光柱
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,30,8),new THREE.MeshBasicMaterial({color:0xffcc00,transparent:true,opacity:0.25}));
  pillar.position.y=15;grp.add(pillar);
  // 旋转光环
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.5,0.1,8,24),new THREE.MeshBasicMaterial({color:0xffdd00,transparent:true,opacity:0.6}));
  ring.position.y=2;ring.rotation.x=Math.PI/2;grp.add(ring);
  // 顶部光球
  const glow=new THREE.Mesh(new THREE.SphereGeometry(0.8,12,12),new THREE.MeshBasicMaterial({color:0xffcc00,transparent:true,opacity:0.2}));
  glow.position.y=2;grp.add(glow);
  const light=new THREE.PointLight(0xffaa00,3,25);light.position.y=3;grp.add(light);
  grp.position.set(px,0,pz);scene.add(grp);
  // 随机高价值内容
  const rareWeapons=['plasma_cannon','rail_gun'];
  const contents=[];
  contents.push({type:'weapon',id:rareWeapons[Math.floor(Math.random()*rareWeapons.length)]});
  contents.push({type:'item',id:'heal'});
  contents.push({type:'item',id:Math.random()>0.5?'damage_up':'shield'});
  const airdrop={mesh:grp,position:new THREE.Vector3(px,0,pz),contents:contents,collected:false,time:0};
  AIRDROPS.list.push(airdrop);
  showMessage('📦 高价值空投降落！','地图上已标记位置');
  playSound('airdrop',0.5);
}

// 拾取空投
function collectAirdrop(airdrop){
  if(airdrop.collected)return;
  airdrop.collected=true;
  scene.remove(airdrop.mesh);
  airdrop.contents.forEach(c=>{
    if(c.type==='weapon'){
      const def=WEAPONS[c.id];
      const wi={...def,def:def,ammo:def.maxAmmo};
      if(PLAYER.weapons.length<3)PLAYER.weapons.push(wi);
      else PLAYER.weapons[PLAYER.currentWeapon]=wi;
      if(PLAYER.weapons.length===1)PLAYER.currentWeapon=0;
      createWeaponViewModel();showMessage(def.icon+' '+def.name,'稀有武器已装备！');
    }else{
      const def=ITEMS[c.id];
      if(PLAYER.items.length<3){
        PLAYER.items.push({id:c.id,name:def.name,icon:def.icon,effect:def.effect,duration:def.duration||0,value:def.value||0});
        if(PLAYER.items.length===1)PLAYER.currentItem=0;
      }
    }
  });
  GAME.score.gold+=50;
  playSound('pickup',0.5);
  updateInventoryUI();updateWeaponUI();updateScoreUI();
}

// 物资刷新（波次触发时补充部分消耗物资）
function refreshLootItems(){
  const refreshSpots=[
    {p:[Math.random()*80-40,0.5,Math.random()*80-40],t:'item',id:'heal'},
    {p:[Math.random()*80-40,0.5,Math.random()*80-40],t:'item',id:['shield','speed','grenade','damage_up'][Math.floor(Math.random()*4)]}
  ];
  refreshSpots.forEach(sp=>{
    const grp=new THREE.Group();
    const def=ITEMS[sp.id];
    grp.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.4),new THREE.MeshStandardMaterial({color:0x00ff88,emissive:0x00ff88,emissiveIntensity:0.4,metalness:0.5,roughness:0.3})));
    const r=new THREE.Mesh(new THREE.RingGeometry(0.4,0.55,16),new THREE.MeshBasicMaterial({color:0x00ff88,transparent:true,opacity:0.3,side:THREE.DoubleSide}));
    r.rotation.x=-Math.PI/2;r.position.y=-0.2;grp.add(r);
    grp.position.set(sp.p[0],sp.p[1],sp.p[2]);scene.add(grp);
    lootItems.push({type:'item',id:sp.id,def:def,mesh:grp,collected:false});
  });
}
