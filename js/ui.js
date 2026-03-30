// ===== UI系统 =====
function showMessage(text,sub){
  const m=document.getElementById('gameMessage'),s=document.getElementById('gameMessageSub');
  m.textContent=text;m.classList.add('show');
  s.textContent=sub||'';if(sub)s.classList.add('show');
  if(msgTimeout)clearTimeout(msgTimeout);
  msgTimeout=setTimeout(()=>{m.classList.remove('show');s.classList.remove('show');},2500);
}
function updateHealthUI(){
  const pct=Math.max(0,PLAYER.health/PLAYER.maxHealth*100);
  document.getElementById('healthFill').style.width=pct+'%';
  document.getElementById('healthText').textContent=Math.ceil(PLAYER.health);
  if(PLAYER.health<30)document.getElementById('healthFill').style.background='linear-gradient(90deg,#ff3333,#ff6644)';
  else document.getElementById('healthFill').style.background='linear-gradient(90deg,#0ff,#00ff88)';
}
function updateWeaponUI(){
  const w=PLAYER.weapons[PLAYER.currentWeapon];
  if(w){
    document.getElementById('weaponName').textContent=w.def.name;
    document.getElementById('ammoCount').textContent=w.ammo>=999?'∞':w.ammo;
    // 显示武器伤害和DPS
    const dmgInfo=document.getElementById('weaponDmgInfo');
    if(dmgInfo){
      const dmgText=w.def.damage+(w.def.pellets?'×'+w.def.pellets:'');
      dmgInfo.textContent='DMG:'+dmgText+' | DPS:'+w.def.dps;
      dmgInfo.style.display='block';
    }
  }else{
    document.getElementById('weaponName').textContent='--';
    document.getElementById('ammoCount').textContent='--';
    const dmgInfo=document.getElementById('weaponDmgInfo');
    if(dmgInfo)dmgInfo.style.display='none';
  }
}
function updateScoreUI(){
  document.getElementById('killCount').textContent=GAME.score.kills;
  document.getElementById('goldCount').textContent=GAME.score.gold;
  document.getElementById('fragCount').textContent=GAME.score.fragments;
}
function updateInventoryUI(){
  const bar=document.getElementById('inventoryBar');bar.innerHTML='';
  for(let i=0;i<3;i++){
    const s=document.createElement('div');s.className='inv-slot'+(PLAYER.currentWeapon===i&&i<PLAYER.weapons.length?' active':'');
    const w=PLAYER.weapons[i];
    s.innerHTML='<span class="slot-key">'+(i+1)+'</span><span class="slot-icon">'+(w?w.def.icon:'')+'</span><span class="slot-name">'+(w?w.def.name:'空')+'</span>';
    bar.appendChild(s);
  }
  // 道具栏分隔线
  const sep=document.createElement('div');
  sep.style.cssText='width:2px;height:50px;background:rgba(0,255,255,0.2);margin:5px 4px;border-radius:1px;';
  bar.appendChild(sep);
  for(let i=0;i<2;i++){
    const s=document.createElement('div');
    const isActive=PLAYER.currentItem===i&&i<PLAYER.items.length;
    s.className='inv-slot'+(isActive?' active':'');
    const it=PLAYER.items[i];
    if(it){
      s.style.borderColor=isActive?'#00ff88':'rgba(0,255,136,0.4)';
      if(isActive)s.style.boxShadow='0 0 15px rgba(0,255,136,0.3)';
    }
    const keyLabel=i===0?'Q':'Q';
    s.innerHTML='<span class="slot-key">'+(i+4)+'</span>'
      +'<span class="slot-icon">'+(it?it.icon:'')+'</span>'
      +'<span class="slot-name">'+(it?it.name:'空')+'</span>'
      +(it&&isActive?'<span style="position:absolute;bottom:-2px;right:2px;font-size:9px;color:#00ff88;background:rgba(0,40,20,0.7);padding:1px 4px;border-radius:3px;">Q用</span>':'');
    bar.appendChild(s);
  }
}
function updateItemHint(){
  const hint=document.getElementById('itemHint');if(!hint)return;
  const idx=PLAYER.currentItem<PLAYER.items.length?PLAYER.currentItem:0;
  const it=PLAYER.items[idx];
  if(it&&PLAYER.items.length>0){
    hint.innerHTML='<div class="item-hint-content">'
      +'<span class="item-hint-key">Q</span>'
      +'<span class="item-hint-text">使用 <span class="item-hint-name">'+it.icon+' '+it.name+'</span></span>'
      +(it.effect==='heal'?' <span class="item-hint-text" style="color:#00ff88;">+'+it.value+'HP</span>':'')
      +(it.duration>0?' <span class="item-hint-text" style="color:#ffaa00;">'+it.duration+'秒</span>':'')
      +'</div>';
    hint.style.opacity='1';
  }else{
    hint.style.opacity='0';
  }
}
function updateBuffUI(){
  const bi=document.getElementById('buffIndicator');bi.innerHTML='';
  PLAYER.buffs.forEach(b=>{
    bi.innerHTML+='<div class="buff-item"><span class="buff-icon">'+b.icon+'</span><span class="buff-name">'+b.name+'</span><span class="buff-timer">'+Math.ceil(b.duration)+'s</span></div>';
  });
}
function updateTimerUI(){
  const m=Math.floor(GAME.timer/60),s=Math.floor(GAME.timer%60);
  document.getElementById('gameTimer').textContent=m+':'+(s<10?'0':'')+s;
}
function updateMinimap(){
  if(!minimapCtx)return;
  const c=minimapCtx,w=180,ms=GAME.mapSize;
  c.clearRect(0,0,w,w);c.fillStyle='rgba(0,10,30,0.8)';c.fillRect(0,0,w,w);
  // 安全区圈（如果正在缩圈）
  if(SAFE_ZONE.shrinking){
    const sr=SAFE_ZONE.radius/ms*0.5*w;
    const sx=(SAFE_ZONE.center.x/ms*0.5+0.5)*w;
    const sz=(SAFE_ZONE.center.z/ms*0.5+0.5)*w;
    c.strokeStyle='rgba(255,68,0,0.6)';c.lineWidth=2;
    c.beginPath();c.arc(sx,sz,sr,0,Math.PI*2);c.stroke();
    // 安全区外半透明红色填充
    c.fillStyle='rgba(255,0,0,0.08)';c.fillRect(0,0,w,w);
    c.globalCompositeOperation='destination-out';
    c.beginPath();c.arc(sx,sz,sr,0,Math.PI*2);c.fill();
    c.globalCompositeOperation='source-over';
  }
  // 墙壁
  c.fillStyle='rgba(40,60,90,0.5)';
  walls.forEach(wl=>{
    const x1=(wl.min.x/ms*0.5+0.5)*w,z1=(wl.min.z/ms*0.5+0.5)*w;
    const x2=(wl.max.x/ms*0.5+0.5)*w,z2=(wl.max.z/ms*0.5+0.5)*w;
    c.fillRect(x1,z1,x2-x1,z2-z1);
  });
  // 物资
  lootItems.forEach(l=>{if(l.collected)return;const p=l.mesh.position;
    c.fillStyle=l.type==='weapon'?'#0ff':l.type==='fragment'?'#ff88ff':'#00ff88';
    c.fillRect((p.x/ms*0.5+0.5)*w-1,(p.z/ms*0.5+0.5)*w-1,3,3);
  });
  // 敌人（增大标记+追击闪烁）
  const blink=Math.sin(Date.now()*0.01)>0;
  enemies.forEach(e=>{if(!e.alive)return;const p=e.mesh.position;
    const isChasing=e.state==='chase'||e.state==='charging';
    const isElite=e.isElite;
    if(isChasing&&!blink)return; // 追击状态闪烁
    c.fillStyle=isElite?'#ffaa00':'#ff4444';
    const sz=isElite?8:6;
    c.fillRect((p.x/ms*0.5+0.5)*w-sz/2,(p.z/ms*0.5+0.5)*w-sz/2,sz,sz);
  });
  // 空投标记（金色菱形）
  AIRDROPS.list.forEach(a=>{
    if(a.collected)return;
    const p=a.position;
    const ax=(p.x/ms*0.5+0.5)*w,az=(p.z/ms*0.5+0.5)*w;
    c.fillStyle='#ffcc00';c.save();c.translate(ax,az);c.rotate(Math.PI/4);
    c.fillRect(-4,-4,8,8);c.restore();
  });
  // 撤离点
  evacPts.forEach(ep=>{const p=ep.position;
    c.fillStyle='#ff8800';c.beginPath();c.arc((p.x/ms*0.5+0.5)*w,(p.z/ms*0.5+0.5)*w,4,0,Math.PI*2);c.fill();
  });
  // 玩家
  const pp=playerGroup.position;
  c.fillStyle='#00ff00';c.beginPath();c.arc((pp.x/ms*0.5+0.5)*w,(pp.z/ms*0.5+0.5)*w,3,0,Math.PI*2);c.fill();
  // 玩家方向
  c.strokeStyle='#00ff00';c.lineWidth=1;c.beginPath();
  const px=(pp.x/ms*0.5+0.5)*w,pz=(pp.z/ms*0.5+0.5)*w;
  c.moveTo(px,pz);c.lineTo(px-Math.sin(yaw)*12,pz-Math.cos(yaw)*12);c.stroke();
}

// === 波次UI ===
function updateWaveUI(){
  const waveUI=document.getElementById('waveInfo');
  if(!waveUI)return;
  waveUI.style.display='block';
  waveUI.innerHTML='<div class="wave-text">🌊 第 '+WAVE.current+' 波</div><div class="wave-sub">下一波: '+Math.ceil(WAVE.timer)+'s</div>';
}

// === 奖励倍率UI ===
function updateBonusUI(){
  const bonusUI=document.getElementById('bonusInfo');
  if(!bonusUI)return;
  bonusUI.style.display='block';
  bonusUI.innerHTML='<div class="bonus-mult">💰 奖励倍率: x'+BONUS.multiplier.toFixed(1)+'</div>'
    +'<div class="bonus-timer">下次提升: '+Math.ceil(BONUS.timer)+'s</div>'
    +'<div class="bonus-hint">坚持更久=更多奖励！</div>';
}

// === 武器拾取属性预览 ===
function showWeaponPreview(newDef){
  const preview=document.getElementById('weaponPreview');
  if(!preview)return;
  const current=PLAYER.weapons[PLAYER.currentWeapon];
  let html='<div class="preview-title">'+newDef.icon+' '+newDef.name+(newDef.rare?' ⭐稀有':'')+'</div>';
  html+='<div class="preview-stat">伤害: '+newDef.damage+(newDef.pellets?'×'+newDef.pellets:'')+'</div>';
  html+='<div class="preview-stat">DPS: '+newDef.dps+'</div>';
  html+='<div class="preview-stat">弹药: '+newDef.maxAmmo+'</div>';
  if(current){
    html+='<div class="preview-compare">当前: '+current.def.name+' (DMG:'+current.def.damage+')</div>';
  }
  preview.innerHTML=html;
  preview.style.display='block';
  setTimeout(()=>{preview.style.display='none';},3000);
}
