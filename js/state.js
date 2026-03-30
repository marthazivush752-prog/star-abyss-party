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

// 自定义关卡存储管理（编辑器保存到游戏选择列表）
const CUSTOM_LEVELS_KEY='starPartyCustomLevels';
function getCustomLevels(){
  try{return JSON.parse(localStorage.getItem(CUSTOM_LEVELS_KEY))||[];}
  catch(e){return[];}
}
function saveCustomLevels(levels){
  localStorage.setItem(CUSTOM_LEVELS_KEY,JSON.stringify(levels));
}
function addCustomLevel(levelData){
  const customs=getCustomLevels();
  // 查找是否已存在同名关卡
  const existIdx=customs.findIndex(c=>c.name===levelData.name);
  const entry={
    id:'custom_'+Date.now(),
    name:levelData.name||'自定义关卡',
    desc:'编辑器自定义关卡 ('+((levelData.objects||[]).length)+'个对象)',
    icon:'🛠',
    difficulty:'自定义',
    color:'#ff8800',
    mapSize:levelData.mapSize||120,
    timer:300,
    isCustom:true,
    editorData:levelData, // 完整编辑器数据
    createdAt:Date.now()
  };
  if(existIdx>=0){customs[existIdx]=entry;}
  else{customs.push(entry);}
  saveCustomLevels(customs);
  return entry;
}
function removeCustomLevel(name){
  const customs=getCustomLevels();
  const idx=customs.findIndex(c=>c.name===name);
  if(idx>=0){customs.splice(idx,1);saveCustomLevels(customs);}
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
