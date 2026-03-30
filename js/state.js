// ===== 星渊派对：全局状态与定义 =====
const GAME={state:'menu',phase:'drop',timer:300,phaseTimer:0,score:{kills:0,gold:0,fragments:0,lootCount:0,totalDamage:0},evacSuccess:false,mapSize:120};
const PLAYER={health:100,maxHealth:100,speed:12,sprintSpeed:18,jumpForce:10,velocity:{x:0,y:0,z:0},isGrounded:true,isSprinting:false,weapons:[],currentWeapon:0,items:[],currentItem:0,buffs:[],energyFragments:0,isReloading:false,reloadTimer:0,shootCooldown:0,alive:true,respawnTimer:0,
  // 攀爬系统
  isClimbing:false,climbTarget:null,climbProgress:0,canClimb:false,climbCooldown:0,climbWall:null,climbStartY:0,
  // 闪避系统（玩家）
  isDashing:false,dashCooldown:0,dashTimer:0,dashDir:{x:0,z:0},dashSpeed:25,dashDuration:0.2,dashCooldownMax:1.5};
const WEAPONS={
  laser_rifle:{name:'激光步枪',icon:'🔫',type:'primary',damage:15,fireRate:0.15,ammo:30,maxAmmo:30,reloadTime:1.5,range:100,spread:0.02,color:0x00ffff,sound:'laser',dps:'100'},
  em_shotgun:{name:'电磁霰弹枪',icon:'💥',type:'primary',damage:8,fireRate:0.6,ammo:8,maxAmmo:8,reloadTime:2.0,range:30,spread:0.12,pellets:6,color:0xff8800,sound:'shotgun',dps:'80'},
  energy_blade:{name:'能量刃',icon:'⚔️',type:'melee',damage:40,fireRate:0.8,ammo:999,maxAmmo:999,reloadTime:0,range:4,spread:0,color:0xff00ff,sound:'melee',dps:'50'},
  // 稀有武器（空投专属）
  plasma_cannon:{name:'等离子炮',icon:'🌟',type:'primary',damage:35,fireRate:0.8,ammo:12,maxAmmo:12,reloadTime:2.5,range:80,spread:0.04,color:0xff44ff,sound:'plasma',dps:'44',rare:true},
  rail_gun:{name:'磁轨狙击枪',icon:'🎯',type:'primary',damage:60,fireRate:1.5,ammo:5,maxAmmo:5,reloadTime:3.0,range:150,spread:0.005,color:0x44ffff,sound:'railgun',rare:true,dps:'40'}
};
const ITEMS={
  shield:{name:'能量盾',icon:'🛡️',duration:8,effect:'shield'},
  heal:{name:'治疗包',icon:'💊',duration:0,effect:'heal',value:50},
  speed:{name:'加速装置',icon:'⚡',duration:10,effect:'speed'},
  stealth:{name:'隐身装置',icon:'👻',duration:6,effect:'stealth'},
  grenade:{name:'引力手雷',icon:'💣',duration:0,effect:'grenade'},
  damage_up:{name:'伤害增幅',icon:'🔥',duration:10,effect:'damage_up'}
};
// 敌人类型定义（伤害已降低以提升体验）+ 闪避属性
const ENEMY_TYPES={
  sentinel:{name:'机械哨兵',health:60,damage:8,speed:3,range:25,attackRate:2.0,color:0x4444aa,emissive:0x1111aa,headColor:0x6666cc,headEmissive:0x3333ff,height:2.0,headY:2.3,bodyRadius:[0.5,0.6],
    dodgeChance:0.15,dodgeSpeed:8,dodgeDist:3,dodgeCooldown:3.0},
  alien:{name:'外星小怪',health:30,damage:5,speed:5,range:15,attackRate:1.0,color:0x44aa44,emissive:0x11aa11,headColor:0x66cc66,headEmissive:0x33ff33,height:1.5,headY:1.7,bodyRadius:[0.5,0.6],
    dodgeChance:0.35,dodgeSpeed:12,dodgeDist:4,dodgeCooldown:2.0},
  elite:{name:'精英守卫',health:200,damage:15,speed:4,range:30,attackRate:2.0,color:0xaa2222,emissive:0xff4444,headColor:0xff6666,headEmissive:0xff2222,height:2.8,headY:3.2,bodyRadius:[0.7,0.8],isElite:true,
    dodgeChance:0.25,dodgeSpeed:10,dodgeDist:5,dodgeCooldown:2.5}
};
// 可攀爬建筑最大高度（顶面世界Y坐标，高于此不可攀爬）
const CLIMB_MAX_HEIGHT=6.5;
const CLIMB_SPEED=4.0; // 攀爬速度
const CLIMB_REACH=1.5; // 玩家距墙多近可以攀爬
// 波次系统状态
const WAVE={current:0,timer:0,interval:45,maxEnemies:20,reinforcements:[]};
// 安全区缩圈状态
const SAFE_ZONE={center:{x:0,z:0},radius:130,shrinking:false,damagePerSec:3,shrinkRate:0.8,minRadius:25,ringMesh:null};
// 撤离奖励博弈状态
const BONUS={active:false,timer:0,multiplier:1.0,cycleInterval:15,waveCount:0};
// 空投系统
const AIRDROPS={list:[],spawnTimer:0,spawnInterval:60};
// 伤害飘字管理
const DAMAGE_NUMBERS={sprites:[],maxCount:20};
// 威胁预警
const THREAT_WARNING={indicators:[],updateTimer:0};

// 游戏设置
const SETTINGS={
  sfxVolume:0.6,
  muted:false,
  sensitivity:1.0,
  showFPS:false,
  showDmgNumbers:true,
  paused:false
};

// ===== 角色管理系统 =====
const ROLE_KEY='starPartyUserRole';
const ROLE={
  current:'player', // 'admin' 或 'player'
  adminPassword:'admin123' // 管理员密码（可自定义）
};
function getUserRole(){
  try{
    const saved=localStorage.getItem(ROLE_KEY);
    if(saved==='admin'){ROLE.current='admin';return 'admin';}
  }catch(e){}
  ROLE.current='player';
  return 'player';
}
function setUserRole(role){
  ROLE.current=role;
  localStorage.setItem(ROLE_KEY,role);
}
function isAdmin(){return ROLE.current==='admin';}
function loginAsAdmin(password){
  if(password===ROLE.adminPassword){setUserRole('admin');return true;}
  return false;
}
function logoutAdmin(){setUserRole('player');}

// 关卡定义系统
const LEVELS=[
  {
    id:'level_1',name:'新手训练场',desc:'熟悉基本操作，消灭所有敌人并撤离',icon:'🎯',
    difficulty:'简单',color:'#4ade80',
    enemies:[
      {p:[-30,0,-30],t:'sentinel'},{p:[30,0,30],t:'sentinel'},
      {p:[-20,0,20],t:'alien'},{p:[20,0,-20],t:'alien'},
      {p:[0,0,30],t:'alien'}
    ],
    loot:[
      {x:-20,z:-5,lootType:'weapon',lootId:'laser_rifle'},{x:20,z:5,lootType:'weapon',lootId:'laser_rifle'},
      {x:0,z:0,lootType:'item',lootId:'heal'},{x:-10,z:10,lootType:'item',lootId:'shield'},
      {x:10,z:-10,lootType:'item',lootId:'speed'}
    ],
    timer:180,mapSize:80
  },
  {
    id:'level_2',name:'废弃工厂',desc:'在密集掩体间作战，注意侧翼',icon:'🏭',
    difficulty:'简单',color:'#4ade80',
    enemies:[
      {p:[-30,0,-30],t:'sentinel'},{p:[30,0,30],t:'sentinel'},
      {p:[-50,0,20],t:'alien'},{p:[50,0,-20],t:'alien'},
      {p:[0,0,-60],t:'sentinel'},{p:[-20,0,60],t:'alien'},
      {p:[20,0,-40],t:'sentinel'}
    ],
    loot:[
      {x:-20,z:-5,lootType:'weapon',lootId:'laser_rifle'},{x:20,z:5,lootType:'weapon',lootId:'em_shotgun'},
      {x:-50,z:-30,lootType:'weapon',lootId:'em_shotgun'},{x:0,z:0,lootType:'item',lootId:'heal'},
      {x:-10,z:10,lootType:'item',lootId:'shield'},{x:10,z:-10,lootType:'item',lootId:'speed'},
      {x:-25,z:-50,lootType:'item',lootId:'grenade'}
    ],
    timer:240,mapSize:100
  },
  {
    id:'level_3',name:'暗影走廊',desc:'狭窄通道中的近距离激战',icon:'🌑',
    difficulty:'中等',color:'#fbbf24',
    enemies:[
      {p:[-30,0,-30],t:'sentinel'},{p:[30,0,30],t:'sentinel'},
      {p:[-50,0,20],t:'alien'},{p:[50,0,-20],t:'alien'},
      {p:[0,0,-60],t:'sentinel'},{p:[-20,0,60],t:'alien'},
      {p:[20,0,-80],t:'sentinel'},{p:[-60,0,-50],t:'alien'}
    ],
    loot:[
      {x:-20,z:-5,lootType:'weapon',lootId:'laser_rifle'},{x:20,z:5,lootType:'weapon',lootId:'em_shotgun'},
      {x:0,z:-85,lootType:'weapon',lootId:'energy_blade'},
      {x:0,z:0,lootType:'item',lootId:'heal'},{x:-10,z:10,lootType:'item',lootId:'damage_up'},
      {x:10,z:-10,lootType:'item',lootId:'shield'},{x:0,z:-75,lootType:'fragment'}
    ],
    timer:240,mapSize:120
  },
  {
    id:'level_4',name:'精英禁区',desc:'面对精英守卫，收集能量碎片撤离',icon:'💀',
    difficulty:'困难',color:'#f87171',
    enemies:[
      {p:[-30,0,-30],t:'sentinel'},{p:[30,0,30],t:'sentinel'},
      {p:[-50,0,20],t:'alien'},{p:[50,0,-20],t:'alien'},
      {p:[0,0,-60],t:'sentinel'},{p:[-20,0,60],t:'alien'},
      {p:[20,0,-80],t:'sentinel'},{p:[-60,0,-50],t:'alien'},
      {p:[60,0,50],t:'alien'},{p:[0,0,30],t:'sentinel'}
    ],
    hasElite:true,
    loot:[
      {x:-20,z:-5,lootType:'weapon',lootId:'laser_rifle'},{x:20,z:5,lootType:'weapon',lootId:'em_shotgun'},
      {x:0,z:-85,lootType:'weapon',lootId:'energy_blade'},{x:-70,z:0,lootType:'weapon',lootId:'laser_rifle'},
      {x:0,z:0,lootType:'item',lootId:'heal'},{x:-10,z:10,lootType:'item',lootId:'shield'},
      {x:10,z:-10,lootType:'item',lootId:'damage_up'},{x:-5,z:-80,lootType:'item',lootId:'stealth'},
      {x:0,z:-75,lootType:'fragment'},{x:-10,z:-90,lootType:'fragment'},{x:10,z:-95,lootType:'fragment'}
    ],
    timer:300,mapSize:120
  },
  {
    id:'level_5',name:'末日突围',desc:'终极挑战！在重重包围中突围撤离',icon:'🔥',
    difficulty:'地狱',color:'#dc2626',
    enemies:[
      {p:[-30,0,-30],t:'sentinel'},{p:[30,0,30],t:'sentinel'},
      {p:[-50,0,20],t:'alien'},{p:[50,0,-20],t:'alien'},
      {p:[0,0,-60],t:'sentinel'},{p:[-20,0,60],t:'alien'},
      {p:[20,0,-80],t:'sentinel'},{p:[-60,0,-50],t:'alien'},
      {p:[60,0,50],t:'alien'},{p:[0,0,30],t:'sentinel'},
      {p:[-40,0,40],t:'sentinel'},{p:[40,0,-40],t:'alien'}
    ],
    hasElite:true,
    loot:[
      {x:-20,z:-5,lootType:'weapon',lootId:'laser_rifle'},{x:20,z:5,lootType:'weapon',lootId:'em_shotgun'},
      {x:0,z:-85,lootType:'weapon',lootId:'energy_blade'},{x:-70,z:0,lootType:'weapon',lootId:'laser_rifle'},
      {x:70,z:0,lootType:'weapon',lootId:'em_shotgun'},
      {x:0,z:0,lootType:'item',lootId:'heal'},{x:-10,z:10,lootType:'item',lootId:'shield'},
      {x:10,z:-10,lootType:'item',lootId:'damage_up'},{x:45,z:25,lootType:'item',lootId:'heal'},
      {x:0,z:-75,lootType:'fragment'},{x:-10,z:-90,lootType:'fragment'},{x:10,z:-95,lootType:'fragment'}
    ],
    timer:300,mapSize:120
  }
];

// 当前选择的关卡 (-1 表示快速开始/默认)
let currentLevelIndex=-1;

// ===== 自定义关卡存储管理（带状态） =====
// 状态: published(正式上线), testing(测试发布,仅管理员可见), draft(草稿)
const CUSTOM_LEVELS_KEY='starPartyCustomLevels';
function getCustomLevels(){
  try{return JSON.parse(localStorage.getItem(CUSTOM_LEVELS_KEY))||[];}
  catch(e){return[];}
}
function saveCustomLevels(levels){
  localStorage.setItem(CUSTOM_LEVELS_KEY,JSON.stringify(levels));
}
// 获取正式上线关卡（玩家+管理员均可见）
function getPublishedLevels(){return getCustomLevels().filter(c=>c.status==='published');}
// 获取测试发布关卡（仅管理员可见）
function getTestingLevels(){return getCustomLevels().filter(c=>c.status==='testing');}
// 获取草稿关卡
function getDraftLevels(){return getCustomLevels().filter(c=>c.status==='draft');}
// 兼容旧接口
function getPendingLevels(){return getCustomLevels().filter(c=>c.status==='pending'||c.status==='testing');}

function addCustomLevel(levelData,status){
  const customs=getCustomLevels();
  const s=status||'published';
  // 如果是 published 且有同名已上线关卡，替换
  const existIdx=(s==='published')?customs.findIndex(c=>c.name===levelData.name&&c.status==='published'):-1;
  const colorMap={published:'#ff8800',testing:'#a78bfa',pending:'#fbbf24',draft:'#64748b'};
  const entry={
    id:'custom_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
    name:levelData.name||'自定义关卡',
    desc:'编辑器自定义关卡 ('+((levelData.objects||[]).length)+'个对象)',
    icon:'🛠',
    difficulty:'自定义',
    color: colorMap[s]||'#64748b',
    mapSize:levelData.mapSize||120,
    timer:300,
    isCustom:true,
    status:s,
    version:1,
    editorData:levelData,
    createdAt:Date.now(),
    updatedAt:Date.now()
  };
  if(existIdx>=0){entry.id=customs[existIdx].id;entry.version=(customs[existIdx].version||1);customs[existIdx]=entry;}
  else{customs.push(entry);}
  saveCustomLevels(customs);
  return entry;
}
// 通过ID更新关卡
function updateCustomLevelById(id,updates){
  const customs=getCustomLevels();
  const idx=customs.findIndex(c=>c.id===id);
  if(idx>=0){
    Object.assign(customs[idx],updates);
    customs[idx].updatedAt=Date.now();
    saveCustomLevels(customs);
    return customs[idx];
  }
  return null;
}
// 通过ID删除关卡
function removeCustomLevelById(id){
  const customs=getCustomLevels();
  const idx=customs.findIndex(c=>c.id===id);
  if(idx>=0){customs.splice(idx,1);saveCustomLevels(customs);}
}
// 兼容旧接口
function removeCustomLevel(name){
  const customs=getCustomLevels();
  const idx=customs.findIndex(c=>c.name===name);
  if(idx>=0){customs.splice(idx,1);saveCustomLevels(customs);}
}
// 测试发布关卡（draft/pending → testing，仅管理员可见）
function testPublishLevel(id){
  const customs=getCustomLevels();
  const idx=customs.findIndex(c=>c.id===id);
  if(idx<0)return null;
  const lvl=customs[idx];
  lvl.status='testing';
  lvl.color='#a78bfa';
  lvl.updatedAt=Date.now();
  saveCustomLevels(customs);
  return lvl;
}
// 正式发布关卡（draft/testing/pending → published，所有人可见）
function publishCustomLevel(id,options){
  const customs=getCustomLevels();
  const idx=customs.findIndex(c=>c.id===id);
  if(idx<0)return null;
  const lvl=customs[idx];
  const opts=options||{};
  // 如果有同名已上线关卡，下线旧版本
  const oldPublished=customs.findIndex(c=>c.name===lvl.name&&c.status==='published'&&c.id!==id);
  if(oldPublished>=0){customs[oldPublished].status='draft';customs[oldPublished].desc='[旧版本] '+customs[oldPublished].desc;}
  lvl.status='published';
  lvl.color=opts.color||'#ff8800';
  lvl.difficulty=opts.difficulty||lvl.difficulty||'自定义';
  lvl.icon=opts.icon||lvl.icon||'🛠';
  lvl.sortOrder=typeof opts.sortOrder==='number'?opts.sortOrder:(lvl.sortOrder||999);
  lvl.version=(lvl.version||0)+1;
  lvl.updatedAt=Date.now();
  saveCustomLevels(customs);
  return lvl;
}
// 下线关卡（published/testing → draft）
function unpublishCustomLevel(id){
  return updateCustomLevelById(id,{status:'draft',color:'#64748b'});
}
// 克隆已上线关卡为草稿（用于编辑已上线关卡）
function cloneLevelAsDraft(id){
  const customs=getCustomLevels();
  const src=customs.find(c=>c.id===id);
  if(!src)return null;
  const clone={
    id:'custom_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
    name:src.name+' (副本)',
    desc:'基于「'+src.name+'」的编辑副本',
    icon:'📝',
    difficulty:'自定义',
    color:'#64748b',
    mapSize:src.mapSize||120,
    timer:src.timer||300,
    isCustom:true,
    status:'draft',
    version:1,
    editorData:JSON.parse(JSON.stringify(src.editorData)),
    sourceId:src.id,
    sourceName:src.name,
    createdAt:Date.now(),
    updatedAt:Date.now()
  };
  customs.push(clone);
  saveCustomLevels(customs);
  return clone;
}
// 迁移旧数据：为没有 status 字段的关卡补上 published 状态，pending→testing
function migrateCustomLevels(){
  const customs=getCustomLevels();
  let changed=false;
  customs.forEach(c=>{
    if(!c.status){c.status='published';c.color='#ff8800';c.version=c.version||1;c.updatedAt=c.updatedAt||c.createdAt||Date.now();changed=true;}
    if(c.status==='pending'){c.status='testing';c.color='#a78bfa';changed=true;}
  });
  if(changed)saveCustomLevels(customs);
}

// 将内置关卡导入到关卡管理器（仅执行一次）
function importBuiltinLevelsToManager(){
  const IMPORT_KEY='starPartyBuiltinImported';
  if(localStorage.getItem(IMPORT_KEY)==='v2')return; // 已导入
  const customs=getCustomLevels();
  // 默认地图建筑布局（scene.js 中的硬编码数据）
  const defaultBuildings=[
    [0,4,-120,240,8,2,'wall'],[0,4,120,240,8,2,'wall'],[-120,4,0,2,8,240,'wall'],[120,4,0,2,8,240,'wall'],
    [0,3,0,20,6,20,'accent'],[0,6,-10,22,0.5,2,'accent'],[0,6,10,22,0.5,2,'accent'],
    [-45,3,-30,2,6,25,'wall'],[-55,3,-17,18,6,2,'wall'],[-55,3,-43,18,6,2,'wall'],[-50,2,-30,8,4,8,'accent'],
    [45,3,30,2,6,25,'wall'],[55,3,17,18,6,2,'wall'],[55,3,43,18,6,2,'wall'],[50,2,30,6,4,6,'accent'],
    [0,4,-70,30,8,2,'danger'],[-15,4,-85,2,8,28,'danger'],[15,4,-85,2,8,28,'danger'],[0,4,-100,32,8,2,'danger'],[0,3,-85,10,6,5,'danger'],
    [-25,1.5,15,4,3,8,'wall'],[25,1.5,-15,8,3,4,'wall'],[-15,1.5,50,6,3,4,'wall'],[15,1.5,-50,4,3,6,'wall'],
    [40,1.5,-40,5,3,5,'wall'],[-40,1.5,40,5,3,5,'wall'],[70,1.5,0,4,3,10,'wall'],[-70,1.5,0,10,3,4,'wall'],
    [30,1.5,60,6,3,3,'wall'],[-30,1.5,-60,3,3,6,'wall'],[60,1.5,60,8,3,2,'wall'],[-60,1.5,-60,2,3,8,'wall'],
    [0,1.5,40,12,3,2,'wall'],[0,1.5,-40,2,3,12,'wall'],[80,1.5,-70,6,3,6,'accent'],[-80,1.5,70,6,3,6,'accent']
  ];
  const defaultLights=[[-50,5,-30,'#00ffff'],[50,5,30,'#00ffff'],[0,5,-85,'#ff3333'],[0,7,0,'#4488ff'],[70,4,0,'#ff8800'],[-70,4,0,'#ff8800']];
  // lootId → 编辑器 type 映射
  const lootTypeMap={
    'laser_rifle':'weapon_laser','em_shotgun':'weapon_shotgun','energy_blade':'weapon_blade',
    'heal':'item_heal','shield':'item_shield','speed':'item_speed',
    'grenade':'item_grenade','damage_up':'item_damage','stealth':'item_stealth'
  };
  // 缩放建筑到指定 mapSize
  function scaleBuildings(ms){
    const ratio=ms/120;
    return defaultBuildings.map(b=>{
      // 围墙需要按比例缩放
      const isWallBoundary=Math.abs(Math.abs(b[0])-120)<1||Math.abs(Math.abs(b[2])-120)<1;
      if(isWallBoundary){
        // 边界围墙：完全重生成
        return null; // 后面单独生成
      }
      // 内部建筑：位置按比例缩放，但尺寸不变（避免变形）
      const x=Math.round(b[0]*ratio);
      const z=Math.round(b[2]*ratio);
      // 如果缩放后超出地图范围则跳过
      if(Math.abs(x)>=ms-2||Math.abs(z)>=ms-2)return null;
      return {type:b[3]>6||b[5]>6?'wall':'cover',layer:'buildings',x:x,z:z,y:b[1],w:b[3],h:b[4],d:b[5],material:b[6]};
    }).filter(Boolean);
  }
  function generateBoundaryWalls(ms){
    return [
      {type:'wall',layer:'buildings',x:0,z:-ms,y:4,w:ms*2,h:8,d:2,material:'wall'},
      {type:'wall',layer:'buildings',x:0,z:ms,y:4,w:ms*2,h:8,d:2,material:'wall'},
      {type:'wall',layer:'buildings',x:-ms,z:0,y:4,w:2,h:8,d:ms*2,material:'wall'},
      {type:'wall',layer:'buildings',x:ms,z:0,y:4,w:2,h:8,d:ms*2,material:'wall'}
    ];
  }
  function scaleLights(ms){
    const ratio=ms/120;
    return defaultLights.map(l=>{
      const x=Math.round(l[0]*ratio);
      const z=Math.round(l[2]*ratio);
      if(Math.abs(x)>=ms-2||Math.abs(z)>=ms-2)return null;
      return {type:'light',layer:'lights',x:x,z:z,lightColor:l[3]};
    }).filter(Boolean);
  }

  LEVELS.forEach((lvl,idx)=>{
    // 检查是否已存在同名内置关卡
    const exists=customs.find(c=>c.name===lvl.name&&c._builtinId===lvl.id);
    if(exists)return;
    const ms=lvl.mapSize||120;
    const objects=[];
    // 建筑
    objects.push(...generateBoundaryWalls(ms));
    objects.push(...scaleBuildings(ms));
    // 灯光
    objects.push(...scaleLights(ms));
    // 敌人
    if(lvl.enemies){
      lvl.enemies.forEach(e=>{
        objects.push({type:e.t,layer:'enemies',x:e.p[0],z:e.p[2]});
      });
    }
    // 物资
    if(lvl.loot){
      lvl.loot.forEach(l=>{
        if(l.lootType==='fragment'){
          objects.push({type:'fragment',layer:'loot',x:l.x,z:l.z,lootType:'fragment'});
        }else{
          const edType=lootTypeMap[l.lootId];
          if(edType){
            objects.push({type:edType,layer:'loot',x:l.x,z:l.z,lootType:l.lootType,lootId:l.lootId});
          }
        }
      });
    }
    // 出生点
    [[ms-10,ms-10],[-(ms-10),-(ms-10)],[ms-10,-(ms-10)],[-(ms-10),ms-10]].forEach(s=>{
      objects.push({type:'spawn_point',layer:'spawn',x:s[0],z:s[1]});
    });
    // 撤离点
    objects.push({type:'evac_point',layer:'evac',x:0,z:0});

    const editorData={version:'1.1',name:lvl.name,mapSize:ms,objects:objects};
    const entry={
      id:'builtin_'+lvl.id+'_'+Date.now(),
      name:lvl.name,
      desc:lvl.desc,
      icon:lvl.icon,
      difficulty:lvl.difficulty,
      color:lvl.color,
      mapSize:ms,
      timer:lvl.timer||300,
      isCustom:true,
      _builtinId:lvl.id,
      status:'published',
      sortOrder:(idx+1)*10,
      version:1,
      editorData:editorData,
      createdAt:Date.now(),
      updatedAt:Date.now()
    };
    customs.push(entry);
  });
  saveCustomLevels(customs);
  localStorage.setItem(IMPORT_KEY,'v2');
}

// 关卡进度管理
function getLevelProgress(){
  try{
    const data=JSON.parse(localStorage.getItem('starPartyLevelProgress'));
    return data||{unlockedLevel:0,completedLevels:[]};
  }catch(e){return{unlockedLevel:0,completedLevels:[]};}
}
function saveLevelProgress(progress){
  localStorage.setItem('starPartyLevelProgress',JSON.stringify(progress));
}
function completeLevel(levelIndex){
  const progress=getLevelProgress();
  if(!progress.completedLevels.includes(levelIndex)){
    progress.completedLevels.push(levelIndex);
  }
  if(levelIndex>=progress.unlockedLevel&&levelIndex<LEVELS.length-1){
    progress.unlockedLevel=levelIndex+1;
  }
  saveLevelProgress(progress);
}

const INPUT={keys:{},mouse:{dx:0,dy:0,left:false,right:false},locked:false};
let scene,camera,renderer,clock,playerGroup,weaponModel;
let lootItems=[],enemies=[],bullets=[],particles=[],evacPts=[],walls=[];
let nearbyLoot=null,minimapCtx,evacActive=false,playerInEvac=false,evacProgressVal=0;
let yaw=0,pitch=0,msgTimeout=null,tutorialStep=0;
