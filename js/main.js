// ===== 游戏主循环与流程控制 =====
function resetGame(){
  GAME.state='playing';GAME.phase='drop';GAME.phaseTimer=0;
  GAME.score={kills:0,gold:0,fragments:0,lootCount:0,totalDamage:0};GAME.evacSuccess=false;
  PLAYER.health=100;PLAYER.weapons=[];PLAYER.items=[];PLAYER.buffs=[];
  PLAYER.currentWeapon=0;PLAYER.currentItem=0;PLAYER.energyFragments=0;
  PLAYER.isReloading=false;PLAYER.reloadTimer=0;PLAYER.shootCooldown=0;
  PLAYER.alive=true;PLAYER.velocity={x:0,y:0,z:0};PLAYER.isGrounded=true;
  PLAYER.isClimbing=false;PLAYER.climbTarget=null;PLAYER.climbProgress=0;PLAYER.canClimb=false;PLAYER.climbCooldown=0;PLAYER.climbWall=null;PLAYER.climbStartY=0;
  PLAYER.isDashing=false;PLAYER.dashCooldown=0;PLAYER.dashTimer=0;
  evacActive=false;playerInEvac=false;evacProgressVal=0;yaw=0;pitch=0;
  nearbyLoot=null;deathPosition=null;
  SETTINGS.paused=false;
  // 关卡专属计时器
  const levelDef=currentLevelIndex>=0&&currentLevelIndex<LEVELS.length?LEVELS[currentLevelIndex]:null;
  const customDef=window._customLevelData||null;
  if(levelDef){GAME.timer=levelDef.timer;if(levelDef.mapSize)GAME.mapSize=levelDef.mapSize;}
  else if(customDef){GAME.timer=customDef.timer||300;if(customDef.mapSize)GAME.mapSize=customDef.mapSize;}
  else{GAME.timer=300;}
  // 重置波次系统
  WAVE.current=0;WAVE.timer=0;WAVE.reinforcements=[];
  GAME._eliteSpawned=false;
  // 重置安全区
  SAFE_ZONE.radius=130;SAFE_ZONE.shrinking=false;
  if(SAFE_ZONE.ringMesh){scene.remove(SAFE_ZONE.ringMesh);SAFE_ZONE.ringMesh=null;}
  // 重置奖励博弈
  BONUS.active=false;BONUS.timer=0;BONUS.multiplier=1.0;BONUS.waveCount=0;
  // 重置空投
  AIRDROPS.list.forEach(a=>{if(a.mesh)scene.remove(a.mesh);});AIRDROPS.list=[];AIRDROPS.spawnTimer=0;
  // 重置伤害飘字
  DAMAGE_NUMBERS.sprites.forEach(s=>{if(s.sprite)scene.remove(s.sprite);});DAMAGE_NUMBERS.sprites=[];
  // 重置威胁预警
  THREAT_WARNING.indicators=[];THREAT_WARNING.updateTimer=0;
  const twContainer=document.getElementById('threatWarningContainer');
  if(twContainer)twContainer.innerHTML='';
  // 清理旧的武器和手臂
  if(weaponModel){camera.remove(weaponModel);weaponModel=null;}
  if(fpsArms){camera.remove(fpsArms);fpsArms=null;}
  // 清理粒子和子弹
  bullets.forEach(b=>scene.remove(b.mesh));bullets=[];
  particles.forEach(p=>scene.remove(p.mesh));particles=[];
  evacPts.forEach(e=>scene.remove(e.mesh));evacPts=[];
  // 隐藏UI
  const waveUI=document.getElementById('waveInfo');if(waveUI)waveUI.style.display='none';
  const bonusUI=document.getElementById('bonusInfo');if(bonusUI)bonusUI.style.display='none';
  const zoneWarn=document.getElementById('zoneWarning');if(zoneWarn)zoneWarn.style.display='none';
  // ★ 完整重建场景（确保编辑器/自定义关卡的建筑能正确加载）
  // 清理旧场景元素
  while(scene.children.length>0)scene.remove(scene.children[0]);
  scene.add(playerGroup);
  if(!camera.parent)scene.add(camera);
  walls=[];
  lootItems=[];enemies=[];
  // 重建灯光、地图、星空、物资、敌人
  createLighting();createMap();createStarfield();
  spawnLootItems();spawnEnemies();
  // 关卡模式：如果有精英标记，立即生成
  if(levelDef&&levelDef.hasElite){
    setTimeout(()=>{
      if(!GAME._eliteSpawned){GAME._eliteSpawned=true;spawnEliteEnemy();}
    },60000); // 60秒后出精英
  }
  // 玩家位置
  let sp;
  const edLevel=window._editorLevel;
  if(edLevel&&edLevel.objects){
    const spawnPts=edLevel.objects.filter(o=>o.layer==='spawn');
    sp=spawnPts.length>0?spawnPts.map(s=>[s.x,1.6,s.z]):[[80,1.6,80],[-80,1.6,-80],[80,1.6,-80],[-80,1.6,80]];
  }else{
    sp=[[80,1.6,80],[-80,1.6,-80],[80,1.6,-80],[-80,1.6,80]];
  }
  const s=sp[Math.floor(Math.random()*sp.length)];
  playerGroup.position.set(s[0],s[1],s[2]);
  camera.position.copy(playerGroup.position);
  if(!camera.parent)scene.add(camera);
  createFPSArms();
  // UI
  document.getElementById('hud').style.display='block';
  document.getElementById('evacProgress').style.display='none';
  document.getElementById('pickupPrompt').style.display='none';
  const deathOverlay=document.getElementById('deathOverlay');
  if(deathOverlay)deathOverlay.style.display='none';
  document.getElementById('settingsOverlay').style.display='none';
  updateHealthUI();updateWeaponUI();updateInventoryUI();updateScoreUI();updateBuffUI();
  // 显示关卡名称
  const levelNameEl=document.getElementById('gameLevelName');
  if(levelNameEl){
    if(levelDef){levelNameEl.textContent=levelDef.icon+' '+levelDef.name;}
    else if(customDef){levelNameEl.textContent='🛠 '+customDef.name;}
    else if(edLevel){levelNameEl.textContent='🛠 编辑器关卡';}
    else{levelNameEl.textContent='';}
  }
  showMessage('🚀 已着陆！搜集物资准备战斗！','按 E 拾取物资，Q 使用道具，ESC 设置');
  document.getElementById('gamePhase').textContent='空降搜刮阶段';
}

function endGame(success){
  GAME.state='result';INPUT.locked=false;SETTINGS.paused=false;
  document.body.classList.remove('game-active');
  if(document.exitPointerLock)document.exitPointerLock();
  document.getElementById('hud').style.display='none';
  document.getElementById('settingsOverlay').style.display='none';
  const twContainer=document.getElementById('threatWarningContainer');
  if(twContainer)twContainer.innerHTML='';
  if(SAFE_ZONE.ringMesh){scene.remove(SAFE_ZONE.ringMesh);SAFE_ZONE.ringMesh=null;}
  AIRDROPS.list.forEach(a=>{if(a.mesh)scene.remove(a.mesh);});
  DAMAGE_NUMBERS.sprites.forEach(s=>{if(s.sprite)scene.remove(s.sprite);});
  const lc=document.getElementById('enemyLabelContainer');if(lc)lc.innerHTML='';
  const rs=document.getElementById('result-screen');rs.style.display='flex';
  const rt=document.getElementById('resultTitle');
  const bonusMult=BONUS.multiplier;
  if(success){rt.textContent='撤离成功！';rt.className='result-title success';GAME.score.gold=Math.floor((GAME.score.gold+100)*bonusMult);}
  else{rt.textContent='撤离失败';rt.className='result-title fail';GAME.score.gold+=20;}
  document.getElementById('resultStats').innerHTML=
    '<div class="stat-item"><div class="stat-label">击杀</div><div class="stat-value">'+GAME.score.kills+'</div></div>'+
    '<div class="stat-item"><div class="stat-label">金币</div><div class="stat-value gold">'+GAME.score.gold+'</div></div>'+
    '<div class="stat-item"><div class="stat-label">搜集物资</div><div class="stat-value">'+GAME.score.lootCount+'</div></div>'+
    '<div class="stat-item"><div class="stat-label">能量碎片</div><div class="stat-value">'+GAME.score.fragments+'</div></div>'+
    '<div class="stat-item"><div class="stat-label">总伤害</div><div class="stat-value" style="color:#ff6644">'+Math.floor(GAME.score.totalDamage)+'</div></div>'+
    (bonusMult>1?'<div class="stat-item"><div class="stat-label">奖励倍率</div><div class="stat-value" style="color:#ffaa00">x'+bonusMult.toFixed(1)+'</div></div>':'');
  const ri=document.getElementById('rewardItems');ri.innerHTML='';
  if(success){
    [{i:'🪙',n:'星际金币 x'+GAME.score.gold},{i:'✨',n:'皮肤碎片 x'+(GAME.score.kills*5)},{i:'⭐',n:'经验 +'+(GAME.score.kills*10+50)}].forEach(r=>{
      ri.innerHTML+='<div class="reward-item"><span class="reward-icon">'+r.i+'</span><span class="reward-name">'+r.n+'</span></div>';
    });
    // 关卡模式通关 → 解锁下一关
    if(currentLevelIndex>=0){
      completeLevel(currentLevelIndex);
    }
  }else{
    ri.innerHTML='<div class="reward-item"><span class="reward-icon">🪙</span><span class="reward-name">金币 x'+GAME.score.gold+'</span></div>';
  }
  // 下一关按钮
  const nextBtn=document.getElementById('btnNextLevel');
  if(success&&currentLevelIndex>=0&&currentLevelIndex<LEVELS.length-1){
    nextBtn.style.display='inline-block';
    nextBtn.textContent='▶️ 下一关: '+LEVELS[currentLevelIndex+1].name;
  }else{
    nextBtn.style.display='none';
  }
  // 编辑器模式：显示返回编辑器按钮
  const editorResultBtn=document.getElementById('btnReturnEditorResult');
  if(editorResultBtn){
    editorResultBtn.style.display=isEditorPreviewMode()?'inline-block':'none';
  }
}

function updatePhase(dt){
  GAME.timer-=dt;GAME.phaseTimer+=dt;
  if(GAME.timer<=0){endGame(false);return;}
  updateTimerUI();
  if(GAME.phase==='drop'&&GAME.phaseTimer>5){GAME.phase='loot';document.getElementById('gamePhase').textContent='搜刮阶段';showMessage('📦 开始搜刮！','找到武器和道具');}
  if(GAME.phase==='loot'&&GAME.phaseTimer>60){
    GAME.phase='combat';document.getElementById('gamePhase').textContent='对抗阶段';
    showMessage('⚔️ 对抗阶段开始！','消灭敌人获取奖励，注意波次增援！');
    WAVE.timer=WAVE.interval;AIRDROPS.spawnTimer=30;
  }
  if(GAME.phase==='combat'&&GAME.phaseTimer>120&&!evacActive){
    GAME.phase='evac';document.getElementById('gamePhase').textContent='撤离阶段';
    spawnEvacPoints();
    SAFE_ZONE.shrinking=true;createSafeZoneRing();
    showMessage('🌀 撤离点开启！危险区域正在扩散！','安全区将逐渐缩小！');
    BONUS.active=true;BONUS.timer=BONUS.cycleInterval;BONUS.multiplier=1.0;BONUS.waveCount=0;
    const bonusUI=document.getElementById('bonusInfo');if(bonusUI)bonusUI.style.display='block';
  }
  if(GAME.phase==='combat'){
    WAVE.timer-=dt;
    if(WAVE.timer<=0){
      WAVE.current++;spawnWaveReinforcements(WAVE.current);refreshLootItems();
      WAVE.timer=WAVE.interval;updateWaveUI();
    }
    AIRDROPS.spawnTimer-=dt;
    if(AIRDROPS.spawnTimer<=0){spawnAirdrop();AIRDROPS.spawnTimer=AIRDROPS.spawnInterval;}
    if(WAVE.current===2&&!GAME._eliteSpawned){GAME._eliteSpawned=true;spawnEliteEnemy();}
  }
  if(GAME.phase==='evac'){
    if(SAFE_ZONE.shrinking&&SAFE_ZONE.radius>SAFE_ZONE.minRadius){
      SAFE_ZONE.radius-=SAFE_ZONE.shrinkRate*dt;
      if(SAFE_ZONE.radius<SAFE_ZONE.minRadius)SAFE_ZONE.radius=SAFE_ZONE.minRadius;
      updateSafeZoneRing();
    }
    const px=playerGroup.position.x-SAFE_ZONE.center.x;
    const pz=playerGroup.position.z-SAFE_ZONE.center.z;
    const playerDistFromCenter=Math.sqrt(px*px+pz*pz);
    const zoneWarn=document.getElementById('zoneWarning');
    if(playerDistFromCenter>SAFE_ZONE.radius&&PLAYER.alive){
      PLAYER.health-=SAFE_ZONE.damagePerSec*dt;updateHealthUI();
      if(zoneWarn)zoneWarn.style.display='block';
      if(PLAYER.health<=0)playerDeath();
    }else{if(zoneWarn)zoneWarn.style.display='none';}
    if(BONUS.active){
      BONUS.timer-=dt;
      if(BONUS.timer<=0){
        BONUS.timer=BONUS.cycleInterval;BONUS.multiplier+=0.5;BONUS.waveCount++;
        spawnWaveReinforcements(BONUS.waveCount+WAVE.current);
        showMessage('💰 奖励倍率提升！','当前 x'+BONUS.multiplier.toFixed(1)+' 但敌人更强了！');
        playSound('bonus_up',0.4);
      }
      updateBonusUI();
    }
    AIRDROPS.spawnTimer-=dt;
    if(AIRDROPS.spawnTimer<=0&&AIRDROPS.list.filter(a=>!a.collected).length<2){
      spawnAirdrop();AIRDROPS.spawnTimer=AIRDROPS.spawnInterval;
    }
  }
  AIRDROPS.list.forEach(a=>{
    if(a.collected)return;
    a.time+=dt;
    if(a.mesh){a.mesh.children.forEach((c,i)=>{if(i===2)c.rotation.y=Date.now()*0.002;});}
    if(PLAYER.alive&&playerGroup.position.distanceTo(a.position)<3){collectAirdrop(a);}
  });
}

function updatePlayer(dt){
  if(!PLAYER.alive){
    PLAYER.respawnTimer-=dt;
    camera.position.copy(playerGroup.position);
    const deathOverlay=document.getElementById('deathOverlay');
    if(deathOverlay)deathOverlay.style.display='flex';
    const waitTime=PLAYER.respawnTimer;
    if(waitTime>8){
      document.getElementById('respawnCountdown').style.display='block';
      document.getElementById('respawnReady').style.display='none';
      document.getElementById('respawnTimer').textContent=Math.ceil(waitTime-8);
    }else{
      document.getElementById('respawnCountdown').style.display='none';
      document.getElementById('respawnReady').style.display='block';
      document.getElementById('autoRespawnTimer').textContent=Math.ceil(Math.max(0,waitTime));
    }
    if(PLAYER.respawnTimer<=0){respawnPlayer('here');}
    return;
  }
  // 视角 - 应用灵敏度
  const sens=SETTINGS.sensitivity;
  yaw-=INPUT.mouse.dx*0.002*sens;pitch-=INPUT.mouse.dy*0.002*sens;
  pitch=Math.max(-Math.PI/2+0.1,Math.min(Math.PI/2-0.1,pitch));
  INPUT.mouse.dx=0;INPUT.mouse.dy=0;
  camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;
  const spd=(INPUT.keys['ShiftLeft']?PLAYER.sprintSpeed:PLAYER.speed)*(PLAYER.buffs.find(b=>b.effect==='speed')?1.5:1);
  const fwd=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  let moveDir=new THREE.Vector3();
  if(INPUT.keys['KeyW'])moveDir.add(fwd);if(INPUT.keys['KeyS'])moveDir.sub(fwd);
  if(INPUT.keys['KeyD'])moveDir.add(right);if(INPUT.keys['KeyA'])moveDir.sub(right);
  if(moveDir.length()>0)moveDir.normalize();
  const isMoving=moveDir.length()>0;
  PLAYER.climbCooldown=Math.max(0,PLAYER.climbCooldown-dt);
  PLAYER.dashCooldown=Math.max(0,PLAYER.dashCooldown-dt);
  if(PLAYER.isDashing){
    PLAYER.dashTimer-=dt;
    if(PLAYER.dashTimer<=0){PLAYER.isDashing=false;}
    else{
      let dashNewX=playerGroup.position.x+PLAYER.dashDir.x*PLAYER.dashSpeed*dt;
      let dashNewZ=playerGroup.position.z+PLAYER.dashDir.z*PLAYER.dashSpeed*dt;
      const dr=0.45;
      walls.forEach(w=>{
        const feet=playerGroup.position.y-1.6;const head=playerGroup.position.y;
        if(feet>=w.max.y-0.01||head<=w.min.y+0.01)return;
        if(dashNewX+dr>w.min.x&&dashNewX-dr<w.max.x&&dashNewZ+dr>w.min.z&&dashNewZ-dr<w.max.z){
          dashNewX=playerGroup.position.x;dashNewZ=playerGroup.position.z;
        }
      });
      const ms2=GAME.mapSize-1;
      playerGroup.position.x=Math.max(-ms2,Math.min(ms2,dashNewX));
      playerGroup.position.z=Math.max(-ms2,Math.min(ms2,dashNewZ));
      camera.position.copy(playerGroup.position);
    }
  }
  if(PLAYER.isClimbing&&PLAYER.climbWall){
    const targetY=PLAYER.climbWall.max.y+1.6;
    const climbDist=targetY-PLAYER.climbStartY;
    PLAYER.climbProgress+=CLIMB_SPEED*dt;
    const t=Math.min(1,PLAYER.climbProgress/Math.max(0.5,climbDist/CLIMB_SPEED));
    const easedT=1-Math.pow(1-t,2);
    const newClimbY=PLAYER.climbStartY+(targetY-PLAYER.climbStartY)*easedT;
    playerGroup.position.y=newClimbY;PLAYER.velocity.y=0;
    if(fpsArms){
      const animT=Date.now()*0.008;
      const climbPhase=Math.sin(animT);
      fpsArms.position.y=climbPhase*0.05;fpsArms.position.x=Math.cos(animT*0.7)*0.04;
      fpsArms.rotation.z=Math.sin(animT*0.5)*0.02;
    }
    if(t>=1){
      PLAYER.isClimbing=false;PLAYER.isGrounded=true;PLAYER.velocity.y=0;PLAYER.climbCooldown=0.5;
      playerGroup.position.y=targetY;
      if(fpsArms){fpsArms.rotation.z=0;}
      const pushDir=moveDir.length()>0?moveDir.clone().normalize():fwd.clone();
      playerGroup.position.x+=pushDir.x*0.6;playerGroup.position.z+=pushDir.z*0.6;
      playSound('climb_end',0.3);showMessage('✅ 攀上建筑','');
    }
    camera.position.copy(playerGroup.position);
    if(INPUT.keys['ShiftLeft']){
      PLAYER.isClimbing=false;PLAYER.climbCooldown=0.3;PLAYER.velocity.y=0;
      if(fpsArms){fpsArms.rotation.z=0;}
    }
  }else if(!PLAYER.isDashing){
    if(INPUT.keys['Space']&&PLAYER.isGrounded){PLAYER.velocity.y=PLAYER.jumpForce;PLAYER.isGrounded=false;}
    PLAYER.velocity.y-=20*dt;
    let newX=playerGroup.position.x+moveDir.x*spd*dt;
    let newZ=playerGroup.position.z+moveDir.z*spd*dt;
    let newY=playerGroup.position.y+PLAYER.velocity.y*dt;
    const r=0.45;const playerH=1.6;const ROOF_SNAP=0.3;
    const oldX=playerGroup.position.x;const oldY=playerGroup.position.y;const oldZ=playerGroup.position.z;
    let onRoof=false;
    walls.forEach(w=>{
      const inXZ=(newX+r>w.min.x&&newX-r<w.max.x&&newZ+r>w.min.z&&newZ-r<w.max.z);
      const oldInXZ=(oldX+r>w.min.x&&oldX-r<w.max.x&&oldZ+r>w.min.z&&oldZ-r<w.max.z);
      if(!inXZ&&!oldInXZ)return;
      const oldFeet=oldY-playerH;const newFeet=newY-playerH;
      if(oldFeet>=w.max.y-ROOF_SNAP&&newFeet<w.max.y&&PLAYER.velocity.y<=0){
        newY=w.max.y+playerH;PLAYER.velocity.y=0;PLAYER.isGrounded=true;onRoof=true;
      }
      if(oldY<=w.min.y+0.1&&newY>w.min.y&&PLAYER.velocity.y>0){
        if(inXZ){newY=w.min.y;PLAYER.velocity.y=0;}
      }
      if(inXZ&&!onRoof){
        const feet=newY-playerH;const head=newY;
        if(feet>w.min.y&&feet<w.max.y&&head>w.min.y){
          if(w.max.y-feet<head-w.min.y){newY=w.max.y+playerH;PLAYER.velocity.y=0;PLAYER.isGrounded=true;onRoof=true;}
        }
      }
    });
    walls.forEach(w=>{
      const feet=newY-playerH;const head=newY;
      if(feet>=w.max.y-0.01||head<=w.min.y+0.01)return;
      if(newX+r>w.min.x&&newX-r<w.max.x&&oldZ+r>w.min.z&&oldZ-r<w.max.z){
        if(oldX<=w.min.x-r+0.01)newX=w.min.x-r-0.001;
        else if(oldX>=w.max.x+r-0.01)newX=w.max.x+r+0.001;
        else{const toLeft=Math.abs(newX-w.min.x+r);const toRight=Math.abs(w.max.x+r-newX);if(toLeft<toRight)newX=w.min.x-r-0.001;else newX=w.max.x+r+0.001;}
      }
    });
    walls.forEach(w=>{
      const feet=newY-playerH;const head=newY;
      if(feet>=w.max.y-0.01||head<=w.min.y+0.01)return;
      if(newX+r>w.min.x&&newX-r<w.max.x&&newZ+r>w.min.z&&newZ-r<w.max.z){
        if(oldZ<=w.min.z-r+0.01)newZ=w.min.z-r-0.001;
        else if(oldZ>=w.max.z+r-0.01)newZ=w.max.z+r+0.001;
        else{const toFront=Math.abs(newZ-w.min.z+r);const toBack=Math.abs(w.max.z+r-newZ);if(toFront<toBack)newZ=w.min.z-r-0.001;else newZ=w.max.z+r+0.001;}
      }
    });
    if(newY<1.6){newY=1.6;PLAYER.velocity.y=0;PLAYER.isGrounded=true;}
    if(!onRoof&&!PLAYER.isGrounded&&PLAYER.velocity.y<=0){
      walls.forEach(w=>{
        if(newX+r>w.min.x&&newX-r<w.max.x&&newZ+r>w.min.z&&newZ-r<w.max.z){
          const feet=newY-playerH;
          if(feet>=w.max.y-ROOF_SNAP&&feet<=w.max.y+0.15){newY=w.max.y+playerH;PLAYER.velocity.y=0;PLAYER.isGrounded=true;}
        }
      });
    }
    if(PLAYER.isGrounded&&newY>1.7){
      let stillOnRoof=false;
      walls.forEach(w=>{
        if(newX+r>w.min.x&&newX-r<w.max.x&&newZ+r>w.min.z&&newZ-r<w.max.z){
          const feet=newY-playerH;if(Math.abs(feet-w.max.y)<ROOF_SNAP){stillOnRoof=true;}
        }
      });
      if(!stillOnRoof)PLAYER.isGrounded=false;
    }
    const ms=GAME.mapSize-1;newX=Math.max(-ms,Math.min(ms,newX));newZ=Math.max(-ms,Math.min(ms,newZ));
    PLAYER.canClimb=false;PLAYER.climbWall=null;
    if(!PLAYER.isGrounded&&PLAYER.climbCooldown<=0&&!PLAYER.isClimbing&&INPUT.keys['Space']){
      const checkDist=CLIMB_REACH;
      const fwdCheck=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
      const checkX=newX+fwdCheck.x*checkDist;const checkZ=newZ+fwdCheck.z*checkDist;
      walls.forEach(w=>{
        if(PLAYER.canClimb)return;
        if(w.max.y>CLIMB_MAX_HEIGHT)return;
        if(checkX+r>w.min.x&&checkX-r<w.max.x&&checkZ+r>w.min.z&&checkZ-r<w.max.z){
          const feet=newY-playerH;
          if(feet<w.max.y&&newY>w.min.y){PLAYER.canClimb=true;PLAYER.climbWall=w;}
        }
      });
      if(!PLAYER.canClimb){
        walls.forEach(w=>{
          if(PLAYER.canClimb)return;
          if(w.max.y>CLIMB_MAX_HEIGHT)return;
          const touchX=(newX+r+0.3>w.min.x&&newX-r-0.3<w.max.x);
          const touchZ=(newZ+r+0.3>w.min.z&&newZ-r-0.3<w.max.z);
          if(touchX&&touchZ){
            const feet=newY-playerH;
            if(feet<w.max.y&&newY>w.min.y){PLAYER.canClimb=true;PLAYER.climbWall=w;}
          }
        });
      }
      if(PLAYER.canClimb&&PLAYER.climbWall){
        PLAYER.isClimbing=true;PLAYER.climbProgress=0;PLAYER.climbStartY=newY;PLAYER.velocity.y=0;
        playSound('climb_start',0.3);showMessage('🧗 攀爬中...','按Shift取消');
      }
    }
    playerGroup.position.set(newX,newY,newZ);camera.position.copy(playerGroup.position);
  }
  if(weaponModel&&!PLAYER.isClimbing){
    weaponModel.position.z+=(-0.5-weaponModel.position.z)*0.1;weaponModel.rotation.x*=0.9;
    const bobAmount=isMoving?3:1;const bobSpeed=INPUT.keys['ShiftLeft']?1.5:1;
    weaponModel.position.x=0.28+Math.sin(Date.now()*0.003*bobSpeed)*0.008*bobAmount;
    weaponModel.position.y=-0.28+Math.cos(Date.now()*0.004*bobSpeed)*0.005*bobAmount;
  }
  if(fpsArms&&!PLAYER.isClimbing){
    const t=Date.now()*0.002;const bobA=isMoving?1.5:0.5;
    fpsArms.position.y=Math.sin(t*1.5)*0.003*bobA;fpsArms.position.x=Math.cos(t*0.8)*0.002*bobA;
  }
  if(INPUT.mouse.left)shoot();
  PLAYER.shootCooldown=Math.max(0,PLAYER.shootCooldown-dt);
  if(PLAYER.isReloading){PLAYER.reloadTimer-=dt;if(PLAYER.reloadTimer<=0){PLAYER.isReloading=false;const w=PLAYER.weapons[PLAYER.currentWeapon];if(w)w.ammo=w.def.maxAmmo;updateWeaponUI();showMessage('✅ 换弹完成','');}}
  nearbyLoot=null;let minD=5;
  lootItems.forEach(l=>{if(l.collected)return;const d=playerGroup.position.distanceTo(l.mesh.position);if(d<minD){minD=d;nearbyLoot=l;}});
  const pp=document.getElementById('pickupPrompt');
  if(nearbyLoot){pp.style.display='block';
    let nm=nearbyLoot.type==='weapon'?nearbyLoot.def.name:nearbyLoot.type==='item'?nearbyLoot.def.name:'能量碎片';
    if(nearbyLoot.type==='weapon'){const d=nearbyLoot.def;nm+=' (DMG:'+d.damage+(d.pellets?'×'+d.pellets:'')+')';};
    document.getElementById('pickupItemName').textContent=nm;
  }else pp.style.display='none';
  PLAYER.buffs=PLAYER.buffs.filter(b=>{b.duration-=dt;return b.duration>0;});
  updateBuffUI();updateItemHint();
}

// ===== 复活系统 =====
let deathPosition=null;
const BASE_SPAWN_POINTS=[[80,1.6,80],[-80,1.6,-80],[80,1.6,-80],[-80,1.6,80]];

function playerDeath(){
  PLAYER.alive=false;PLAYER.respawnTimer=10;PLAYER.health=0;
  deathPosition=playerGroup.position.clone();
  updateHealthUI();showMessage('💀 已阵亡','选择复活点继续战斗！');playSound('death',0.5);
  if(weaponModel)weaponModel.visible=false;if(fpsArms)fpsArms.visible=false;
  if(document.exitPointerLock)document.exitPointerLock();
  document.body.classList.remove('game-active');
}

function respawnPlayer(mode){
  if(PLAYER.alive)return;
  PLAYER.alive=true;PLAYER.health=PLAYER.maxHealth;
  PLAYER.isClimbing=false;PLAYER.climbProgress=0;PLAYER.canClimb=false;PLAYER.climbWall=null;PLAYER.climbStartY=0;
  PLAYER.isDashing=false;PLAYER.dashCooldown=0;PLAYER.dashTimer=0;
  if(mode==='here'&&deathPosition){
    playerGroup.position.set(deathPosition.x+(Math.random()-0.5)*5,1.6,deathPosition.z+(Math.random()-0.5)*5);
  }else{
    let bestPt=BASE_SPAWN_POINTS[0],maxDist=0;
    const deadPos=deathPosition||playerGroup.position;
    BASE_SPAWN_POINTS.forEach(pt=>{const d=Math.sqrt((pt[0]-deadPos.x)**2+(pt[2]-deadPos.z)**2);if(d>maxDist){maxDist=d;bestPt=pt;}});
    playerGroup.position.set(bestPt[0],bestPt[1],bestPt[2]);
  }
  camera.position.copy(playerGroup.position);updateHealthUI();
  if(weaponModel){weaponModel.visible=true;}if(fpsArms){fpsArms.visible=true;}
  if(PLAYER.weapons.length>0)createWeaponViewModel();
  else{if(!fpsArms)createFPSArms();else fpsArms.visible=true;}
  const deathOverlay=document.getElementById('deathOverlay');if(deathOverlay)deathOverlay.style.display='none';
  PLAYER.buffs.push({effect:'shield',duration:3,name:'复活护盾',icon:'✨'});
  updateBuffUI();playSound('respawn',0.4);
  showMessage('🔄 已复活！',mode==='base'?'已返回基地':'在原地复活，战斗继续！');
  deathPosition=null;
  document.body.classList.add('game-active');
  setTimeout(()=>{if(GAME.state==='playing')renderer.domElement.requestPointerLock();},100);
}

function updateEnemies(dt){
  const pp=playerGroup.position;
  let closestEnemyDist=Infinity;
  const threatEnemies=[];
  enemies.forEach(en=>{
    if(!en.alive){en.respawnTimer-=dt;if(en.respawnTimer<=0){en.alive=true;en.health=en.maxHealth;en.mesh.visible=true;en.mesh.position.copy(en.spawnPos);en.state='patrol';en._attackAnim=0;en.chargeTimer=0;en.isCharging=false;en.isDodging=false;en.dodgeCooldown=0;en.dodgeTimer=0;}return;}
    en.attackCooldown=Math.max(0,en.attackCooldown-dt);
    if(en._attackAnim>0)en._attackAnim-=dt;
    if(updateEnemyDodge(en,dt)){
      en.mesh.position.x=Math.max(-GAME.mapSize+2,Math.min(GAME.mapSize-2,en.mesh.position.x));
      en.mesh.position.z=Math.max(-GAME.mapSize+2,Math.min(GAME.mapSize-2,en.mesh.position.z));
      return;
    }
    const dist=en.mesh.position.distanceTo(pp);
    const hasStealth=PLAYER.buffs.find(b=>b.effect==='stealth');
    if(!hasStealth&&dist<closestEnemyDist)closestEnemyDist=dist;
    if(!hasStealth&&(en.state==='chase'||en.state==='charging')&&dist<en.range+5){
      threatEnemies.push({enemy:en,dist:dist});
    }
    if(dist<en.range&&!hasStealth){if(en.state==='patrol')en.state='chase';}
    else if(dist>en.range*1.5&&en.state!=='charging'){en.state='patrol';en.isCharging=false;en.chargeTimer=0;}
    if(en.state==='patrol'){
      const toTarget=en.patrolTarget.clone().sub(en.mesh.position);
      if(toTarget.length()<2)en.patrolTarget=new THREE.Vector3(en.spawnPos.x+(Math.random()-0.5)*30,0,en.spawnPos.z+(Math.random()-0.5)*30);
      toTarget.normalize();
      let enNewX=en.mesh.position.x+toTarget.x*en.speed*0.3*dt;let enNewZ=en.mesh.position.z+toTarget.z*en.speed*0.3*dt;
      const er=0.6;
      walls.forEach(w=>{
        if(enNewX+er>w.min.x&&enNewX-er<w.max.x&&enNewZ+er>w.min.z&&enNewZ-er<w.max.z&&en.mesh.position.y<w.max.y){
          const ox=Math.min(Math.abs(enNewX+er-w.min.x),Math.abs(enNewX-er-w.max.x));
          const oz=Math.min(Math.abs(enNewZ+er-w.min.z),Math.abs(enNewZ-er-w.max.z));
          if(ox<oz)enNewX=en.mesh.position.x;else enNewZ=en.mesh.position.z;
        }
      });
      en.mesh.position.x=enNewX;en.mesh.position.z=enNewZ;
      en.mesh.lookAt(en.mesh.position.clone().add(toTarget));
      const chargeRing=en.mesh.getObjectByName('chargeRing');if(chargeRing)chargeRing.material.opacity=0;
    }else if(en.state==='chase'||en.state==='charging'){
      const toP=pp.clone().sub(en.mesh.position);toP.y=0;
      en.mesh.lookAt(new THREE.Vector3(pp.x,en.mesh.position.y,pp.z));
      if(PLAYER.alive&&dist<en.range&&en.attackCooldown<=0){
        if(!en.isCharging){en.isCharging=true;en.state='charging';en.chargeTimer=en.isElite?0.8:0.6;playSound('charge',0.3);}
      }
      if(en.isCharging){
        en.chargeTimer-=dt;
        const chargeRing=en.mesh.getObjectByName('chargeRing');
        const chargeProgress=1-(en.chargeTimer/(en.isElite?0.8:0.6));
        if(chargeRing){chargeRing.material.opacity=chargeProgress*0.8;chargeRing.scale.set(1+chargeProgress*0.5,1+chargeProgress*0.5,1);}
        const pulseScale=1+Math.sin(Date.now()*0.02)*0.08*chargeProgress;
        en.mesh.scale.set(pulseScale,pulseScale,pulseScale);
        if(en.chargeTimer<=0){
          en.isCharging=false;en.state='chase';en.attackCooldown=en.attackRate;en._attackAnim=0.4;
          let dmg=en.damage;if(PLAYER.buffs.find(b=>b.effect==='shield'))dmg*=0.3;
          PLAYER.health-=dmg;updateHealthUI();playSound('player_hit',0.5);
          document.getElementById('damageIndicator').style.opacity='0.6';
          setTimeout(()=>document.getElementById('damageIndicator').style.opacity='0',250);
          showDamageDirection(en.mesh.position);createEnemyAttackEffect(en);
          if(chargeRing){chargeRing.material.opacity=0;chargeRing.scale.set(1,1,1);}
          if(PLAYER.health<=0){playerDeath();GAME.score.gold+=5;}
        }
      }else if(dist>3){
        toP.normalize();
        let enNewX=en.mesh.position.x+toP.x*en.speed*dt;let enNewZ=en.mesh.position.z+toP.z*en.speed*dt;
        const er=0.6;
        walls.forEach(w=>{
          if(enNewX+er>w.min.x&&enNewX-er<w.max.x&&enNewZ+er>w.min.z&&enNewZ-er<w.max.z&&en.mesh.position.y<w.max.y){
            const ox=Math.min(Math.abs(enNewX+er-w.min.x),Math.abs(enNewX-er-w.max.x));
            const oz=Math.min(Math.abs(enNewZ+er-w.min.z),Math.abs(enNewZ-er-w.max.z));
            if(ox<oz)enNewX=en.mesh.position.x;else enNewZ=en.mesh.position.z;
          }
        });
        en.mesh.position.x=enNewX;en.mesh.position.z=enNewZ;
      }
      if(en.state==='attack_visual'&&en._attackAnim<=0)en.state='chase';
    }
    en.mesh.position.x=Math.max(-GAME.mapSize+2,Math.min(GAME.mapSize-2,en.mesh.position.x));
    en.mesh.position.z=Math.max(-GAME.mapSize+2,Math.min(GAME.mapSize-2,en.mesh.position.z));
    if(en._attackAnim>0&&!en.isCharging){
      const p=en._attackAnim/0.4;
      en.mesh.scale.set(1+Math.sin(p*Math.PI*4)*0.1,1+Math.sin(p*Math.PI*2)*0.05,1+Math.sin(p*Math.PI*4)*0.1);
    }else if(!en.isCharging){en.mesh.scale.set(1,1,1);}
  });
  if(PLAYER.alive&&closestEnemyDist<15){
    if(!GAME._lastProximityWarn||Date.now()-GAME._lastProximityWarn>2000){
      GAME._lastProximityWarn=Date.now();playSound('enemy_nearby',closestEnemyDist<8?0.5:0.3);
    }
  }
  updateThreatWarnings(threatEnemies);updateEnemyLabels();
}

function showDamageDirection(enemyPos){
  const dx=enemyPos.x-playerGroup.position.x;const dz=enemyPos.z-playerGroup.position.z;
  const worldAngle=Math.atan2(dx,dz);const relAngle=worldAngle-yaw;
  const container=document.getElementById('damageDirectionContainer');
  const arrow=document.createElement('div');arrow.className='damage-arrow';
  const angleDeg=(relAngle*180/Math.PI)+180;
  arrow.style.transform='translate(-50%,-50%) rotate('+angleDeg+'deg)';
  const inner=document.createElement('div');inner.className='damage-arrow-inner';
  arrow.appendChild(inner);container.appendChild(arrow);
  setTimeout(()=>arrow.remove(),1200);
}

function createEnemyAttackEffect(en){
  const isMelee=en.type==='alien';
  const startPos=en.mesh.position.clone();startPos.y+=1.5;
  if(isMelee){
    const dir=playerGroup.position.clone().sub(startPos).normalize();
    const midPt=startPos.clone().add(dir.clone().multiplyScalar(2));
    const slashGeo=new THREE.TorusGeometry(1.5,0.08,4,12,Math.PI*0.6);
    const slashMat=new THREE.MeshBasicMaterial({color:0x44ff44,transparent:true,opacity:0.7});
    const slash=new THREE.Mesh(slashGeo,slashMat);
    slash.position.copy(midPt);slash.lookAt(playerGroup.position);scene.add(slash);
    particles.push({mesh:slash,velocity:new THREE.Vector3(0,0,0),life:0.35,scale:true});
  }else{
    const endPos=playerGroup.position.clone();endPos.y+=0.8;
    const trailGeo=new THREE.BufferGeometry().setFromPoints([startPos,endPos]);
    const trailMat=new THREE.LineBasicMaterial({color:0xff2222,transparent:true,opacity:0.8,linewidth:2});
    const trail=new THREE.Line(trailGeo,trailMat);scene.add(trail);
    bullets.push({mesh:trail,life:0.25});
    const flash=new THREE.Mesh(new THREE.SphereGeometry(0.15),new THREE.MeshBasicMaterial({color:0xff4444}));
    flash.position.copy(startPos);scene.add(flash);
    particles.push({mesh:flash,velocity:new THREE.Vector3(0,0,0),life:0.15});
  }
}

function updateEnemyLabels(){
  let labelContainer=document.getElementById('enemyLabelContainer');
  if(!labelContainer){
    labelContainer=document.createElement('div');labelContainer.id='enemyLabelContainer';
    labelContainer.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:55;';
    document.body.appendChild(labelContainer);
  }
  labelContainer.innerHTML='';
  if(!PLAYER.alive||GAME.state!=='playing')return;
  const w2=window.innerWidth/2,h2=window.innerHeight/2;
  enemies.forEach(en=>{
    if(!en.alive)return;
    const dist=en.mesh.position.distanceTo(playerGroup.position);if(dist>40)return;
    const headPos=en.mesh.position.clone();headPos.y+=(en.type==='sentinel'?3.0:2.3);
    const projected=headPos.clone().project(camera);
    if(projected.z>1)return;
    const sx=(projected.x*w2)+w2;const sy=(-projected.y*h2)+h2;
    if(sx<-50||sx>window.innerWidth+50||sy<-50||sy>window.innerHeight+50)return;
    const label=document.createElement('div');label.className='enemy-label';
    label.style.left=sx+'px';label.style.top=sy+'px';
    const alpha=Math.max(0.3,1-dist/40);label.style.opacity=alpha;
    const scale=Math.max(0.6,1-dist/60);
    label.style.transform='translate(-50%, -100%) scale('+scale+')';
    const hpPct=Math.max(0,en.health/en.maxHealth*100);
    let stateText='巡逻中';let stateClass='patrol';
    if(en.isDodging){stateText='💨 闪避！';stateClass='dodging';}
    else if(en.state==='chase'){stateText='⚠ 追击中';stateClass='chase';}
    if(en.isCharging){stateText='⚡ 蓄力中！';stateClass='charging';}
    if(en.state==='attack_visual'||en._attackAnim>0){stateText='🔥 攻击中';stateClass='attack';}
    const eliteTag=en.isElite?'<div class="enemy-elite-tag">★ BOSS</div>':'';
    label.innerHTML=eliteTag+'<div class="enemy-name-tag">'+en.name+'</div><div class="enemy-hp-bar-bg"><div class="enemy-hp-bar-fill" style="width:'+hpPct+'%"></div></div><div class="enemy-state-tag '+stateClass+'">'+stateText+'</div>';
    labelContainer.appendChild(label);
  });
}

function updateParticles(dt){
  bullets=bullets.filter(b=>{b.life-=dt;if(b.life<=0){scene.remove(b.mesh);return false;}b.mesh.material.opacity=b.life*6;return true;});
  particles=particles.filter(p=>{p.life-=dt;if(p.life<=0){scene.remove(p.mesh);return false;}
    p.mesh.position.x+=p.velocity.x*dt;p.mesh.position.y+=p.velocity.y*dt;p.mesh.position.z+=p.velocity.z*dt;
    p.velocity.y-=10*dt;
    if(p._isGhost){const alpha=p.life/0.4*p._startOpacity;p.mesh.children.forEach(c=>{if(c.material)c.material.opacity=alpha;});}
    else if(p.scale){const s=1+p.life*3;p.mesh.scale.set(s,s,s);p.mesh.material.opacity=p.life*2;}
    return true;});
  DAMAGE_NUMBERS.sprites=DAMAGE_NUMBERS.sprites.filter(dn=>{
    dn.life-=dt;if(dn.life<=0){scene.remove(dn.sprite);return false;}
    dn.sprite.position.y+=1.5*dt;dn.sprite.material.opacity=Math.min(1,dn.life*2);
    const sc=dn.baseScale*(1+0.3*(1-dn.life/dn.maxLife));dn.sprite.scale.set(sc,sc*0.5,1);return true;
  });
  const t=Date.now()*0.002;
  lootItems.forEach(l=>{if(!l.collected)l.mesh.rotation.y=t;});
  evacPts.forEach(ep=>{ep.mesh.children.forEach((c,i)=>{if(i===1)c.rotation.y=t;if(i===2)c.rotation.z=t*0.5;});});
}

function updateThreatWarnings(threatEnemies){
  const container=document.getElementById('threatWarningContainer');if(!container)return;
  container.innerHTML='';
  if(!PLAYER.alive||threatEnemies.length===0)return;
  threatEnemies.sort((a,b)=>a.dist-b.dist);
  const toShow=threatEnemies.slice(0,3);
  toShow.forEach(te=>{
    const en=te.enemy;
    const dx=en.mesh.position.x-playerGroup.position.x;const dz=en.mesh.position.z-playerGroup.position.z;
    const worldAngle=Math.atan2(dx,dz);const relAngle=worldAngle-yaw;
    const indicator=document.createElement('div');
    indicator.className='threat-indicator'+(en.isCharging?' charging':'')+(en.isElite?' elite':'');
    const rad=relAngle;
    const edgeX=50+Math.sin(rad)*48;const edgeY=50-Math.cos(rad)*45;
    indicator.style.left=Math.max(2,Math.min(98,edgeX))+'%';indicator.style.top=Math.max(2,Math.min(98,edgeY))+'%';
    const angleDeg=((relAngle*180/Math.PI)+360)%360;
    indicator.style.transform='translate(-50%,-50%) rotate('+(angleDeg+180)+'deg)';
    indicator.style.opacity=Math.max(0.3,1-te.dist/30);
    container.appendChild(indicator);
  });
}

function createSafeZoneRing(){
  if(SAFE_ZONE.ringMesh)scene.remove(SAFE_ZONE.ringMesh);
  const geo=new THREE.RingGeometry(SAFE_ZONE.radius-1,SAFE_ZONE.radius,64);
  const mat=new THREE.MeshBasicMaterial({color:0xff4400,transparent:true,opacity:0.3,side:THREE.DoubleSide});
  SAFE_ZONE.ringMesh=new THREE.Mesh(geo,mat);SAFE_ZONE.ringMesh.rotation.x=-Math.PI/2;
  SAFE_ZONE.ringMesh.position.set(SAFE_ZONE.center.x,0.2,SAFE_ZONE.center.z);scene.add(SAFE_ZONE.ringMesh);
}
function updateSafeZoneRing(){
  if(!SAFE_ZONE.ringMesh)return;scene.remove(SAFE_ZONE.ringMesh);
  const geo=new THREE.RingGeometry(SAFE_ZONE.radius-1,SAFE_ZONE.radius,64);
  const mat=new THREE.MeshBasicMaterial({color:0xff4400,transparent:true,opacity:0.35,side:THREE.DoubleSide});
  SAFE_ZONE.ringMesh=new THREE.Mesh(geo,mat);SAFE_ZONE.ringMesh.rotation.x=-Math.PI/2;
  SAFE_ZONE.ringMesh.position.set(SAFE_ZONE.center.x,0.2,SAFE_ZONE.center.z);scene.add(SAFE_ZONE.ringMesh);
}

// ===== FPS计数 =====
let fpsFrames=0,fpsTime=0,fpsValue=0;
function updateFPS(dt){
  fpsFrames++;fpsTime+=dt;
  if(fpsTime>=1){fpsValue=Math.round(fpsFrames/fpsTime);fpsFrames=0;fpsTime=0;}
  const fpsEl=document.getElementById('fpsDisplay');
  if(fpsEl){
    if(SETTINGS.showFPS){fpsEl.style.display='block';fpsEl.textContent='FPS: '+fpsValue;}
    else{fpsEl.style.display='none';}
  }
}

// ===== 实时预览更新处理 =====
function handleLiveUpdate(jsonStr){
  try{
    const newData=JSON.parse(jsonStr);
    if(newData&&newData.objects){
      window._editorLevel=newData;
      console.log('[实时预览] 关卡数据已更新:',newData.objects.length,'个对象');
      if(GAME.state==='playing'){
        const px=playerGroup.position.x,py=playerGroup.position.y,pz=playerGroup.position.z;
        lootItems.forEach(l=>scene.remove(l.mesh));lootItems=[];
        enemies.forEach(en=>scene.remove(en.mesh));enemies=[];
        walls=[];
        while(scene.children.length>0)scene.remove(scene.children[0]);
        scene.add(playerGroup);
        if(!camera.parent)scene.add(camera);
        createLighting();createMap();createStarfield();spawnLootItems();spawnEnemies();
        playerGroup.position.set(px,py,pz);
        camera.position.copy(playerGroup.position);
        showMessage('🔄 关卡已更新','编辑器内容已实时同步');
      }
    }
  }catch(err){console.warn('[实时预览] 数据更新失败',err);}
}

function gameLoop(){
  requestAnimationFrame(gameLoop);
  if(GAME.state!=='playing'){renderer.render(scene,camera);return;}
  const dt=Math.min(clock.getDelta(),0.05);
  // 暂停检查
  if(SETTINGS.paused){renderer.render(scene,camera);updateFPS(dt);return;}
  updatePhase(dt);updatePlayer(dt);updateEnemies(dt);checkEvacuation(dt);updateParticles(dt);updateMinimap();updateFPS(dt);
  renderer.render(scene,camera);
}

// ===== 暂停/设置系统 =====
function togglePause(){
  if(GAME.state!=='playing')return;
  SETTINGS.paused=!SETTINGS.paused;
  const overlay=document.getElementById('settingsOverlay');
  if(SETTINGS.paused){
    overlay.style.display='flex';
    // 编辑器模式下显示"返回编辑器"按钮
    const editorRow=document.getElementById('rowReturnEditor');
    if(editorRow){
      editorRow.style.display=isEditorPreviewMode()?'block':'none';
    }
    if(document.exitPointerLock)document.exitPointerLock();
    document.body.classList.remove('game-active');
  }else{
    overlay.style.display='none';
    document.body.classList.add('game-active');
    if(PLAYER.alive)renderer.domElement.requestPointerLock();
  }
}

// 检测当前是否为编辑器预览模式
function isEditorPreviewMode(){
  return window.location.search.includes('editor=1')||window._livePreviewMode||window._editorLevel!=null;
}

// 返回编辑器
function returnToEditor(){
  SETTINGS.paused=false;
  document.getElementById('settingsOverlay').style.display='none';
  GAME.state='menu';
  document.body.classList.remove('game-active');
  if(document.exitPointerLock)document.exitPointerLock();
  document.getElementById('result-screen').style.display='none';
  document.getElementById('hud').style.display='none';
  const lc=document.getElementById('enemyLabelContainer');if(lc)lc.innerHTML='';
  // 如果是通过 window.open 打开的（编辑器测试），关闭窗口返回编辑器
  if(window.opener||window._livePreviewMode){
    window.close();
    // 如果 close 失败（如非弹出窗口），跳转到编辑器
    setTimeout(()=>{window.location.href='editor.html';},200);
  }else{
    // 直接跳转到编辑器
    window.location.href='editor.html';
  }
}

function settingsReturnToMenu(){
  SETTINGS.paused=false;
  document.getElementById('settingsOverlay').style.display='none';
  GAME.state='menu';
  document.body.classList.remove('game-active');
  if(document.exitPointerLock)document.exitPointerLock();
  document.getElementById('result-screen').style.display='none';
  document.getElementById('hud').style.display='none';
  document.getElementById('start-screen').style.display='flex';
  const lc=document.getElementById('enemyLabelContainer');if(lc)lc.innerHTML='';
  updateRoleUI();
}

function settingsRestartGame(){
  SETTINGS.paused=false;
  document.getElementById('settingsOverlay').style.display='none';
  startGame();
}

// ===== 关卡选择UI =====
function buildLevelGrid(){
  const grid=document.getElementById('levelGrid');grid.innerHTML='';
  const progress=getLevelProgress();
  const admin=isAdmin();
  // 迁移旧数据
  migrateCustomLevels();
  // 导入内置关卡到管理器
  importBuiltinLevelsToManager();

  // === 辅助函数：创建分区标题 ===
  function createSectionTitle(icon, text, color){
    const header=document.createElement('div');
    header.className='level-section-header';
    header.innerHTML=`<span class="separator-line" style="${color?'background:linear-gradient(90deg,transparent,'+color+',transparent);':''}"></span><span class="separator-text" style="${color?'color:'+color+';':''}"> ${icon} ${text}</span><span class="separator-line" style="${color?'background:linear-gradient(90deg,transparent,'+color+',transparent);':''}"></span>`;
    return header;
  }

  // === 管理员标识 ===
  if(admin){
    const adminTag=document.createElement('div');
    adminTag.style.cssText='text-align:center;margin-bottom:6px;';
    adminTag.innerHTML='<span class="admin-badge">👑 管理员模式 · 所有关卡已开放</span>';
    grid.appendChild(adminTag);
  }

  // === 内置关卡分区 ===
  const builtinSection=document.createElement('div');
  builtinSection.className='level-section';
  builtinSection.appendChild(createSectionTitle('🎮','内置关卡','rgba(0,255,255,0.4)'));
  const builtinCards=document.createElement('div');
  builtinCards.className='level-section-cards';
  LEVELS.forEach((lvl,i)=>{
    const unlocked=admin||i<=progress.unlockedLevel;
    const completed=progress.completedLevels.includes(i);
    const card=document.createElement('div');
    card.className='level-card'+(unlocked?' unlocked':'')+(completed?' completed':'')+(admin&&!unlocked?' admin-unlocked':'');
    card.innerHTML=`
      <div class="level-card-icon">${unlocked?lvl.icon:'🔒'}</div>
      <div class="level-card-name">${unlocked?lvl.name:'???'}</div>
      <div class="level-card-diff" style="color:${lvl.color}">${unlocked?lvl.difficulty:''}</div>
      <div class="level-card-desc">${unlocked?lvl.desc:(admin?lvl.desc:'通过前一关解锁')}</div>
      ${completed?'<div class="level-card-star">⭐ 已通关</div>':''}
      ${unlocked&&!completed?'<div class="level-card-play">点击开始</div>':''}
    `;
    if(unlocked) card.addEventListener('click',()=>startLevelGame(i));
    builtinCards.appendChild(card);
  });
  builtinSection.appendChild(builtinCards);
  grid.appendChild(builtinSection);

  // === 已上线的自定义关卡分区（所有人可见） ===
  const published=getPublishedLevels();
  published.sort((a,b)=>(a.sortOrder||999)-(b.sortOrder||999));
  if(published.length>0){
    const pubSection=document.createElement('div');
    pubSection.className='level-section';
    pubSection.appendChild(createSectionTitle('🟢','已上线自定义关卡','rgba(255,136,0,0.4)'));
    const pubCards=document.createElement('div');
    pubCards.className='level-section-cards';
    published.forEach((clvl)=>{
      const card=document.createElement('div');
      card.className='level-card unlocked custom-level-card';
      const objCount=clvl.editorData&&clvl.editorData.objects?clvl.editorData.objects.length:0;
      const timeStr=clvl.updatedAt?new Date(clvl.updatedAt).toLocaleDateString():(clvl.createdAt?new Date(clvl.createdAt).toLocaleDateString():'');
      const diffColor=clvl.color||'#ff8800';
      card.innerHTML=`
        <div class="level-card-icon">${clvl.icon||'🛠'}</div>
        <div class="level-card-name">${clvl.name}</div>
        <div class="level-card-diff" style="color:${diffColor}">${clvl.difficulty||'自定义'}</div>
        <div class="level-card-desc">${clvl.desc||'编辑器自定义关卡'}</div>
        <div class="custom-level-meta">${objCount}个对象${timeStr?' · '+timeStr:''} · v${clvl.version||1}</div>
        <div class="level-card-play">点击开始</div>
        ${admin?'<button class="custom-level-delete" data-id="'+clvl.id+'" title="下线此关卡">⏬</button>':''}
      `;
      card.addEventListener('click',(e)=>{
        if(e.target.classList.contains('custom-level-delete'))return;
        startCustomLevelGame(clvl);
      });
      const delBtn=card.querySelector('.custom-level-delete');
      if(delBtn){
        delBtn.addEventListener('click',(e)=>{
          e.stopPropagation();
          if(confirm('确定下线关卡 "'+clvl.name+'" ？\n下线后不会被删除，可在编辑器管理台重新发布。')){
            unpublishCustomLevel(clvl.id);
            buildLevelGrid();
            showToastInGame('⏬ 已下线: '+clvl.name);
          }
        });
      }
      pubCards.appendChild(card);
    });
    pubSection.appendChild(pubCards);
    grid.appendChild(pubSection);
  }

  // === 管理员专属分区 ===
  if(admin){
    // === 测试中关卡分区 ===
    const testing=getTestingLevels();
    if(testing.length>0){
      const testSection=document.createElement('div');
      testSection.className='level-section';
      testSection.appendChild(createSectionTitle('🧪','测试中关卡 (仅管理员可见)','rgba(167,139,250,0.4)'));
      const testCards=document.createElement('div');
      testCards.className='level-section-cards';
      testing.forEach((tlvl)=>{
        const card=document.createElement('div');
        card.className='level-card unlocked custom-level-card';
        card.style.borderColor='rgba(167,139,250,0.4)';
        card.style.background='linear-gradient(135deg, rgba(30,20,50,0.9), rgba(25,15,45,0.95))';
        const objCount=tlvl.editorData&&tlvl.editorData.objects?tlvl.editorData.objects.length:0;
        card.innerHTML=`
          <div class="level-card-icon">🧪</div>
          <div class="level-card-name">${tlvl.name} <span style="font-size:10px;color:#a78bfa;font-weight:normal;">测试中</span></div>
          <div class="level-card-diff" style="color:#a78bfa">测试发布</div>
          <div class="level-card-desc">${tlvl.desc||'测试发布 · 仅管理员可见'}</div>
          <div class="custom-level-meta">${objCount}个对象 · v${tlvl.version||1}</div>
          <div class="level-card-play" style="color:#a78bfa;">点击测试</div>
          <button class="custom-level-delete" data-id="${tlvl.id}" data-action="unpublish" title="下线回草稿" style="background:rgba(167,139,250,0.2);border-color:rgba(167,139,250,0.4);color:#a78bfa;">⏬</button>
        `;
        card.addEventListener('click',(e)=>{
          if(e.target.classList.contains('custom-level-delete'))return;
          startCustomLevelGame(tlvl);
        });
        const unpubBtn=card.querySelector('.custom-level-delete');
        if(unpubBtn){
          unpubBtn.addEventListener('click',(e)=>{
            e.stopPropagation();
            if(confirm('确定下线测试关卡「'+tlvl.name+'」？\n将回到草稿状态。')){
              unpublishCustomLevel(tlvl.id);
              buildLevelGrid();
              showToastInGame('⏬ 已下线: '+tlvl.name);
            }
          });
        }
        testCards.appendChild(card);
      });
      testSection.appendChild(testCards);
      grid.appendChild(testSection);
    }

    // === 草稿关卡分区 ===
    const drafts=getDraftLevels();
    if(drafts.length>0){
      const draftSection=document.createElement('div');
      draftSection.className='level-section';
      draftSection.appendChild(createSectionTitle('📝','草稿关卡','rgba(100,116,139,0.3)'));
      const draftCards=document.createElement('div');
      draftCards.className='level-section-cards';
      drafts.forEach((dlvl)=>{
        const card=document.createElement('div');
        card.className='level-card unlocked custom-level-card';
        card.style.borderColor='rgba(100,116,139,0.3)';
        card.style.background='linear-gradient(135deg, rgba(20,25,35,0.9), rgba(15,20,30,0.95))';
        card.style.opacity='0.75';
        const objCount=dlvl.editorData&&dlvl.editorData.objects?dlvl.editorData.objects.length:0;
        card.innerHTML=`
          <div class="level-card-icon">📝</div>
          <div class="level-card-name">${dlvl.name} <span style="font-size:10px;color:#94a3b8;font-weight:normal;">草稿</span></div>
          <div class="level-card-diff" style="color:#94a3b8">草稿</div>
          <div class="level-card-desc">${dlvl.desc||'草稿关卡'}</div>
          <div class="custom-level-meta">${objCount}个对象 · v${dlvl.version||1}</div>
          <div class="level-card-play" style="color:#94a3b8;">点击预览</div>
        `;
        card.addEventListener('click',()=>{startCustomLevelGame(dlvl);});
        draftCards.appendChild(card);
      });
      draftSection.appendChild(draftCards);
      grid.appendChild(draftSection);
    }

    // === 上传关卡入口分区 ===
    const uploadSection=document.createElement('div');
    uploadSection.className='level-section';
    uploadSection.style.cssText='text-align:center;padding:10px 0;';
    uploadSection.innerHTML=`
      <button class="menu-btn" id="btnUploadLevel" style="padding:10px 36px;font-size:14px;background:linear-gradient(135deg,rgba(150,100,0,0.5),rgba(120,80,0,0.7));border-color:rgba(255,200,0,0.5);">📤 上传新关卡 (JSON)</button>
      <input type="file" id="levelFileInput" accept=".json" style="display:none;">
    `;
    grid.appendChild(uploadSection);
    setTimeout(()=>{
      const uploadBtn=document.getElementById('btnUploadLevel');
      const fileInput=document.getElementById('levelFileInput');
      if(uploadBtn&&fileInput){
        uploadBtn.addEventListener('click',()=>fileInput.click());
        fileInput.addEventListener('change',(e)=>{
          const file=e.target.files[0];
          if(!file)return;
          const reader=new FileReader();
          reader.onload=(ev)=>{
            try{
              const data=JSON.parse(ev.target.result);
              if(data.objects&&Array.isArray(data.objects)){
                addCustomLevel(data,'draft');
                buildLevelGrid();
                showToastInGame('✅ 已上传为草稿: '+(data.name||'自定义关卡')+'，请在待发布区确认发布');
              }else{
                alert('无效的关卡数据，请确保JSON包含objects数组');
              }
            }catch(err){alert('JSON解析失败: '+err.message);}
          };
          reader.readAsText(file);
          e.target.value='';
        });
      }
    },100);
  }
}

function startLevelGame(levelIndex){
  currentLevelIndex=levelIndex;
  window._editorLevel=null;
  window._customLevelData=null;
  document.getElementById('level-screen').style.display='none';
  startGame();
}

function startCustomLevelGame(customLevel){
  currentLevelIndex=-1;
  window._editorLevel=customLevel.editorData||null;
  window._customLevelData=customLevel;
  document.getElementById('level-screen').style.display='none';
  startGame();
}

function showToastInGame(msg){
  const existing=document.getElementById('gameToast');
  if(existing)existing.remove();
  const toast=document.createElement('div');
  toast.id='gameToast';
  toast.style.cssText='position:fixed;top:60px;right:20px;z-index:600;padding:10px 20px;border-radius:8px;font-size:14px;background:rgba(0,255,255,0.15);border:1px solid rgba(0,255,255,0.4);color:#0ff;animation:fadeIn 0.3s;';
  toast.textContent=msg;
  document.body.appendChild(toast);
  setTimeout(()=>toast.remove(),2500);
}

// ===== 菜单逻辑 =====
function startGame(){
  initAudio();
  document.getElementById('start-screen').style.display='none';
  document.getElementById('tutorial-screen').style.display='none';
  document.getElementById('result-screen').style.display='none';
  document.getElementById('level-screen').style.display='none';
  const ls=document.getElementById('loading-screen');ls.style.display='flex';
  const tips=['提示：撤离成功可获得双倍奖励！','提示：收集3个能量碎片可解锁快速撤离！','提示：高危区域有更好的道具！','提示：死亡无惩罚，尽管战斗吧！','提示：按ESC可暂停游戏和调整设置！'];
  document.getElementById('loadingTip').textContent=tips[Math.floor(Math.random()*tips.length)];
  let prog=0;
  const li=setInterval(()=>{prog+=Math.random()*20+10;document.getElementById('loadingFill').style.width=Math.min(prog,100)+'%';
    if(prog>=100){clearInterval(li);setTimeout(()=>{ls.style.display='none';
      document.body.classList.add('game-active');
      renderer.domElement.requestPointerLock();
      resetGame();},300);}
  },200);
}

function returnToMenu(){
  GAME.state='menu';currentLevelIndex=-1;
  document.body.classList.remove('game-active');
  if(document.exitPointerLock)document.exitPointerLock();
  document.getElementById('result-screen').style.display='none';
  document.getElementById('hud').style.display='none';
  document.getElementById('start-screen').style.display='flex';
  const lc=document.getElementById('enemyLabelContainer');if(lc)lc.innerHTML='';
  updateRoleUI();
}

function initTutorial(){tutorialStep=0;updateTutorialUI();}
function updateTutorialUI(){
  document.querySelectorAll('.tutorial-step').forEach((s,i)=>{s.classList.toggle('active',i===tutorialStep);});
  document.getElementById('tutPrev').style.display=tutorialStep>0?'inline-block':'none';
  document.getElementById('tutNext').style.display=tutorialStep<3?'inline-block':'none';
  document.getElementById('tutStart').style.display=tutorialStep===3?'inline-block':'none';
}
function tutorialNav(dir){tutorialStep=Math.max(0,Math.min(3,tutorialStep+dir));updateTutorialUI();}

// ===== 初始化 =====
window.addEventListener('load',()=>{
  // ★ 初始化角色系统
  getUserRole();
  updateRoleUI();

  // ★ 编辑器模式：在 initScene 之前先加载编辑器数据，确保 createMap 使用编辑器关卡
  if(window.location.search.includes('editor=1')){
    try{
      const edData=JSON.parse(localStorage.getItem('editorLevelData'));
      if(edData&&edData.objects){
        window._editorLevel=edData;
        currentLevelIndex=-1;
        console.log('[编辑器] 已加载关卡数据:',edData.objects.length,'个对象');
      }
    }catch(e){console.warn('[编辑器] 关卡数据解析失败',e);}
  }
  initScene();
  document.addEventListener('pointerlockchange',()=>{
    INPUT.locked=!!document.pointerLockElement;
  });
  document.getElementById('gameCanvas').addEventListener('click',()=>{
    if(GAME.state==='playing'&&!INPUT.locked&&PLAYER.alive&&!SETTINGS.paused){
      renderer.domElement.requestPointerLock();
    }
  });
  document.getElementById('btnStart').addEventListener('click',()=>{currentLevelIndex=-1;window._editorLevel=null;window._customLevelData=null;startGame();});
  document.getElementById('btnTutorial').addEventListener('click',()=>{
    document.getElementById('start-screen').style.display='none';
    document.getElementById('tutorial-screen').style.display='flex';initTutorial();
  });
  document.getElementById('tutPrev').addEventListener('click',()=>tutorialNav(-1));
  document.getElementById('tutNext').addEventListener('click',()=>tutorialNav(1));
  document.getElementById('tutStart').addEventListener('click',()=>{currentLevelIndex=-1;startGame();});
  document.getElementById('btnReturn').addEventListener('click',returnToMenu);
  document.getElementById('btnReplay').addEventListener('click',startGame);
  // 下一关
  document.getElementById('btnNextLevel').addEventListener('click',()=>{
    if(currentLevelIndex>=0&&currentLevelIndex<LEVELS.length-1){
      currentLevelIndex++;startGame();
    }
  });
  // 关卡选择
  document.getElementById('btnLevels').addEventListener('click',()=>{
    document.getElementById('start-screen').style.display='none';
    document.getElementById('level-screen').style.display='flex';
    buildLevelGrid();
  });
  document.getElementById('btnLevelsBack').addEventListener('click',()=>{
    document.getElementById('level-screen').style.display='none';
    document.getElementById('start-screen').style.display='flex';
  });
  // 关卡编辑器入口（权限控制）
  const editorBtn=document.getElementById('btnEditor');
  if(editorBtn)editorBtn.addEventListener('click',()=>{
    if(!isAdmin()){
      showToastInGame('🔒 关卡编辑器仅管理员可用，请先登录管理员');
      showRoleModal();
      return;
    }
    window.open('editor.html','_blank');
  });
  // 编辑器模式 → 直接开始游戏（数据已在上面预加载）
  if(window.location.search.includes('editor=1')){
    setTimeout(()=>startGame(),500);
  }
  // 实时预览模式：监听编辑器数据变化
  if(window.location.search.includes('live=1')){
    window._livePreviewMode=true;
    // 监听 localStorage 变化（来自编辑器的 storage event）
    window.addEventListener('storage',function(e){
      if(e.key==='editorLevelData'&&e.newValue){
        handleLiveUpdate(e.newValue);
      }
    });
    // 监听 postMessage（同源 iframe 同步）
    window.addEventListener('message',function(e){
      if(e.data&&e.data.type==='editorSync'&&e.data.data){
        handleLiveUpdate(JSON.stringify(e.data.data));
      }
    });
  }
  // === 设置面板交互 ===
  document.getElementById('settingsBtn').addEventListener('click',togglePause);
  document.getElementById('btnResume').addEventListener('click',togglePause);
  document.getElementById('btnReturnMenu').addEventListener('click',()=>{
    if(confirm('确定返回主界面？当前游戏进度将丢失。')){settingsReturnToMenu();}
  });
  document.getElementById('btnRestartGame').addEventListener('click',()=>{
    if(confirm('确定重新开始？当前游戏进度将丢失。')){settingsRestartGame();}
  });
  // 退出游戏按钮
  const btnQuit=document.getElementById('btnQuitGame');
  if(btnQuit)btnQuit.addEventListener('click',()=>{
    if(confirm('确定退出游戏？将关闭当前页面。')){
      // 编辑器预览模式下关闭 iframe / 窗口
      if(window._livePreviewMode||window.location.search.includes('editor=1')){
        window.close();
        // 如果 window.close() 无法关闭（非 opener 打开的窗口），回到主页
        setTimeout(()=>{settingsReturnToMenu();},200);
      }else{
        settingsReturnToMenu();
      }
    }
  });
  // 返回编辑器按钮（设置面板）
  const btnReturnEditor=document.getElementById('btnReturnEditor');
  if(btnReturnEditor)btnReturnEditor.addEventListener('click',()=>{returnToEditor();});
  // 返回编辑器按钮（结算界面）
  const btnReturnEditorResult=document.getElementById('btnReturnEditorResult');
  if(btnReturnEditorResult)btnReturnEditorResult.addEventListener('click',()=>{returnToEditor();});
  document.getElementById('sliderSfx').addEventListener('input',function(){
    SETTINGS.sfxVolume=parseInt(this.value)/100;
    document.getElementById('valSfx').textContent=this.value+'%';
  });
  document.getElementById('chkMute').addEventListener('change',function(){SETTINGS.muted=this.checked;});
  document.getElementById('sliderSens').addEventListener('input',function(){
    SETTINGS.sensitivity=parseInt(this.value)/100;
    document.getElementById('valSens').textContent=this.value+'%';
  });
  document.getElementById('chkShowFPS').addEventListener('change',function(){SETTINGS.showFPS=this.checked;});
  document.getElementById('chkShowDmgNum').addEventListener('change',function(){SETTINGS.showDmgNumbers=this.checked;});

  // === 角色系统交互 ===
  document.getElementById('btnRoleSwitch').addEventListener('click',showRoleModal);
  document.getElementById('btnRoleCancel').addEventListener('click',hideRoleModal);
  document.getElementById('roleOptAdmin').addEventListener('click',()=>{
    document.getElementById('roleOptAdmin').classList.add('active');
    document.getElementById('roleOptPlayer').classList.remove('active');
    if(!isAdmin()){
      document.getElementById('rolePasswordRow').style.display='flex';
      document.getElementById('roleError').style.display='none';
      setTimeout(()=>{document.getElementById('rolePassword').focus();},100);
    }else{
      document.getElementById('rolePasswordRow').style.display='none';
      showToastInGame('👑 你已经是管理员了');
    }
  });
  document.getElementById('roleOptPlayer').addEventListener('click',()=>{
    document.getElementById('roleOptPlayer').classList.add('active');
    document.getElementById('roleOptAdmin').classList.remove('active');
    document.getElementById('rolePasswordRow').style.display='none';
    document.getElementById('roleError').style.display='none';
    if(isAdmin()){
      logoutAdmin();
      updateRoleUI();
      hideRoleModal();
      showToastInGame('🎮 已切换为玩家模式');
    }else{
      hideRoleModal();
    }
  });
  document.getElementById('btnRoleLogin').addEventListener('click',doAdminLogin);
  document.getElementById('rolePassword').addEventListener('keydown',(e)=>{
    if(e.key==='Enter')doAdminLogin();
  });
  document.getElementById('roleModal').addEventListener('click',(e)=>{
    if(e.target.id==='roleModal')hideRoleModal();
  });

  // 开始渲染循环
  gameLoop();
});

// ===== 角色UI管理 =====
function updateRoleUI(){
  const admin=isAdmin();
  const indicator=document.getElementById('roleIndicator');
  const icon=document.getElementById('roleIcon');
  const text=document.getElementById('roleText');
  const editorBtn=document.getElementById('btnEditor');

  if(admin){
    indicator.classList.add('admin-mode');
    icon.textContent='👑';
    text.textContent='管理员模式';
    if(editorBtn){editorBtn.classList.remove('locked');}
  }else{
    indicator.classList.remove('admin-mode');
    icon.textContent='🎮';
    text.textContent='玩家模式';
    if(editorBtn){editorBtn.classList.add('locked');}
  }
}

function showRoleModal(){
  const modal=document.getElementById('roleModal');
  modal.style.display='flex';
  document.getElementById('rolePassword').value='';
  document.getElementById('roleError').style.display='none';
  document.getElementById('rolePasswordRow').style.display='none';
  // 标记当前角色
  document.getElementById('roleOptAdmin').classList.toggle('admin-active',isAdmin());
  document.getElementById('roleOptPlayer').classList.toggle('active',!isAdmin());
  document.getElementById('roleOptAdmin').classList.remove('active');
}

function hideRoleModal(){
  document.getElementById('roleModal').style.display='none';
}

function doAdminLogin(){
  const pwd=document.getElementById('rolePassword').value;
  if(loginAsAdmin(pwd)){
    updateRoleUI();
    hideRoleModal();
    showToastInGame('👑 管理员登录成功！所有权限已开放');
  }else{
    document.getElementById('roleError').style.display='block';
    document.getElementById('rolePassword').value='';
    document.getElementById('rolePassword').focus();
  }
}
