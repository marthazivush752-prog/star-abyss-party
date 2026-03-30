// ===== 输入系统 =====
document.addEventListener('keydown',e=>{
  INPUT.keys[e.code]=true;
  // ESC 键：唤起/关闭设置面板
  if(e.code==='Escape'){
    if(GAME.state==='playing'){
      if(typeof togglePause==='function')togglePause();
      e.preventDefault();
      return;
    }
  }
  if(GAME.state==='playing'){
    if(PLAYER.alive){
      if(e.code==='KeyE')handlePickup();
      if(e.code==='KeyR')startReload();
      if(e.code==='KeyQ')useItem();
      if(e.code==='Digit1')switchWeapon(0);
      if(e.code==='Digit2')switchWeapon(1);
      if(e.code==='Digit3')switchWeapon(2);
      if(e.code==='Digit4'){PLAYER.currentItem=0;updateInventoryUI();updateItemHint();}
      if(e.code==='Digit5'){
        if(PLAYER.items.length>1)PLAYER.currentItem=1;
        else PLAYER.currentItem=0;
        updateInventoryUI();updateItemHint();
      }
    }
    e.preventDefault();
  }
});
document.addEventListener('keyup',e=>{INPUT.keys[e.code]=false;});
document.addEventListener('mousemove',e=>{if(INPUT.locked){INPUT.mouse.dx+=e.movementX;INPUT.mouse.dy+=e.movementY;}});
document.addEventListener('mousedown',e=>{if(e.button===0)INPUT.mouse.left=true;if(e.button===2)INPUT.mouse.right=true;});
document.addEventListener('mouseup',e=>{if(e.button===0)INPUT.mouse.left=false;if(e.button===2)INPUT.mouse.right=false;});
document.addEventListener('contextmenu',e=>e.preventDefault());

// ===== 音频系统 =====
let audioCtx;
function initAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();}
function playSound(type,vol){
  if(!audioCtx)return;
  if(SETTINGS.muted)return;
  vol=(vol||0.3)*SETTINGS.sfxVolume;
  try{
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.connect(g);g.connect(audioCtx.destination);g.gain.value=vol;
    const t=audioCtx.currentTime;
    if(type==='laser'){o.type='sawtooth';o.frequency.setValueAtTime(1800,t);o.frequency.exponentialRampToValueAtTime(400,t+0.1);g.gain.exponentialRampToValueAtTime(0.01,t+0.1);o.start(t);o.stop(t+0.1);}
    else if(type==='shotgun'){o.type='square';o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(50,t+0.15);g.gain.exponentialRampToValueAtTime(0.01,t+0.15);o.start(t);o.stop(t+0.15);}
    else if(type==='melee'){o.type='sine';o.frequency.setValueAtTime(800,t);o.frequency.exponentialRampToValueAtTime(200,t+0.2);g.gain.exponentialRampToValueAtTime(0.01,t+0.2);o.start(t);o.stop(t+0.2);}
    else if(type==='pickup'){o.type='sine';o.frequency.setValueAtTime(600,t);o.frequency.exponentialRampToValueAtTime(1200,t+0.15);g.gain.exponentialRampToValueAtTime(0.01,t+0.2);o.start(t);o.stop(t+0.2);}
    else if(type==='hit'){o.type='triangle';o.frequency.setValueAtTime(400,t);o.frequency.exponentialRampToValueAtTime(100,t+0.08);g.gain.exponentialRampToValueAtTime(0.01,t+0.08);o.start(t);o.stop(t+0.08);}
    else if(type==='kill'){o.type='square';o.frequency.setValueAtTime(800,t);o.frequency.setValueAtTime(1000,t+0.1);o.frequency.setValueAtTime(1200,t+0.2);g.gain.exponentialRampToValueAtTime(0.01,t+0.4);o.start(t);o.stop(t+0.4);}
    else if(type==='evac'){o.type='sine';o.frequency.setValueAtTime(400,t);o.frequency.linearRampToValueAtTime(1200,t+1.0);g.gain.exponentialRampToValueAtTime(0.01,t+1.2);o.start(t);o.stop(t+1.2);}
    else if(type==='heal'){o.type='sine';o.frequency.setValueAtTime(500,t);o.frequency.linearRampToValueAtTime(800,t+0.3);g.gain.exponentialRampToValueAtTime(0.01,t+0.4);o.start(t);o.stop(t+0.4);}
    else if(type==='explosion'){o.type='sawtooth';o.frequency.setValueAtTime(100,t);o.frequency.exponentialRampToValueAtTime(20,t+0.3);g.gain.value=vol*2;g.gain.exponentialRampToValueAtTime(0.01,t+0.3);o.start(t);o.stop(t+0.3);}
    else if(type==='reload'){o.type='triangle';o.frequency.setValueAtTime(300,t);o.frequency.setValueAtTime(500,t+0.1);g.gain.exponentialRampToValueAtTime(0.01,t+0.3);o.start(t);o.stop(t+0.3);}
    // === 新增音效 ===
    else if(type==='player_hit'){
      // 被击中：低沉冲击音 + 肉感
      o.type='sawtooth';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(60,t+0.15);
      g.gain.setValueAtTime(vol*1.5,t);g.gain.exponentialRampToValueAtTime(0.01,t+0.2);
      o.start(t);o.stop(t+0.2);
      // 第二层高频痛觉音
      const o2=audioCtx.createOscillator(),g2=audioCtx.createGain();
      o2.connect(g2);g2.connect(audioCtx.destination);
      o2.type='square';o2.frequency.setValueAtTime(1200,t);o2.frequency.exponentialRampToValueAtTime(300,t+0.1);
      g2.gain.setValueAtTime(vol*0.4,t);g2.gain.exponentialRampToValueAtTime(0.01,t+0.12);
      o2.start(t);o2.stop(t+0.12);
    }
    else if(type==='death'){
      // 死亡：下行哀鸣
      o.type='sawtooth';o.frequency.setValueAtTime(400,t);o.frequency.exponentialRampToValueAtTime(50,t+0.6);
      g.gain.setValueAtTime(vol,t);g.gain.linearRampToValueAtTime(vol*0.5,t+0.3);g.gain.exponentialRampToValueAtTime(0.01,t+0.7);
      o.start(t);o.stop(t+0.7);
      // 低频震动
      const o2=audioCtx.createOscillator(),g2=audioCtx.createGain();
      o2.connect(g2);g2.connect(audioCtx.destination);
      o2.type='sine';o2.frequency.setValueAtTime(80,t);o2.frequency.exponentialRampToValueAtTime(30,t+0.5);
      g2.gain.setValueAtTime(vol*0.8,t);g2.gain.exponentialRampToValueAtTime(0.01,t+0.6);
      o2.start(t);o2.stop(t+0.6);
    }
    else if(type==='respawn'){
      // 复活：上行明亮音
      o.type='sine';o.frequency.setValueAtTime(300,t);
      o.frequency.setValueAtTime(500,t+0.1);o.frequency.setValueAtTime(700,t+0.2);o.frequency.setValueAtTime(1000,t+0.3);
      g.gain.setValueAtTime(vol*0.5,t);g.gain.linearRampToValueAtTime(vol,t+0.2);g.gain.exponentialRampToValueAtTime(0.01,t+0.5);
      o.start(t);o.stop(t+0.5);
      // 和弦层
      const o2=audioCtx.createOscillator(),g2=audioCtx.createGain();
      o2.connect(g2);g2.connect(audioCtx.destination);
      o2.type='sine';o2.frequency.setValueAtTime(600,t+0.1);o2.frequency.setValueAtTime(900,t+0.2);o2.frequency.setValueAtTime(1200,t+0.3);
      g2.gain.setValueAtTime(vol*0.3,t+0.1);g2.gain.exponentialRampToValueAtTime(0.01,t+0.5);
      o2.start(t+0.1);o2.stop(t+0.5);
    }
    else if(type==='enemy_nearby'){
      // 敌人靠近警告：脉冲式低频嗡鸣
      o.type='sine';o.frequency.setValueAtTime(120,t);o.frequency.setValueAtTime(180,t+0.1);o.frequency.setValueAtTime(120,t+0.2);
      g.gain.setValueAtTime(vol*0.6,t);g.gain.linearRampToValueAtTime(vol*0.2,t+0.1);
      g.gain.linearRampToValueAtTime(vol*0.6,t+0.15);g.gain.exponentialRampToValueAtTime(0.01,t+0.3);
      o.start(t);o.stop(t+0.3);
    }
    else if(type==='item_use'){
      // 道具使用：科幻确认音
      o.type='sine';o.frequency.setValueAtTime(800,t);o.frequency.setValueAtTime(1100,t+0.08);o.frequency.setValueAtTime(1400,t+0.16);
      g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.01,t+0.3);
      o.start(t);o.stop(t+0.3);
    }
    // === 新增音效 ===
    else if(type==='charge'){
      // 蓄力：渐升嗡鸣警告
      o.type='sine';o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(800,t+0.5);
      g.gain.setValueAtTime(vol*0.3,t);g.gain.linearRampToValueAtTime(vol*0.8,t+0.4);g.gain.exponentialRampToValueAtTime(0.01,t+0.6);
      o.start(t);o.stop(t+0.6);
    }
    else if(type==='headshot'){
      // 爆头：清脆金属音+高频闪击
      o.type='square';o.frequency.setValueAtTime(1500,t);o.frequency.setValueAtTime(2000,t+0.05);o.frequency.setValueAtTime(2500,t+0.1);
      g.gain.setValueAtTime(vol*0.8,t);g.gain.exponentialRampToValueAtTime(0.01,t+0.25);
      o.start(t);o.stop(t+0.25);
      const o2=audioCtx.createOscillator(),g2=audioCtx.createGain();
      o2.connect(g2);g2.connect(audioCtx.destination);
      o2.type='sine';o2.frequency.setValueAtTime(3000,t);o2.frequency.exponentialRampToValueAtTime(1000,t+0.15);
      g2.gain.setValueAtTime(vol*0.4,t);g2.gain.exponentialRampToValueAtTime(0.01,t+0.2);
      o2.start(t);o2.stop(t+0.2);
    }
    else if(type==='airdrop'){
      // 空投降落：低频轰鸣+上升哨声
      o.type='sawtooth';o.frequency.setValueAtTime(60,t);o.frequency.linearRampToValueAtTime(120,t+0.8);
      g.gain.setValueAtTime(vol*1.2,t);g.gain.linearRampToValueAtTime(vol*0.5,t+0.6);g.gain.exponentialRampToValueAtTime(0.01,t+1.0);
      o.start(t);o.stop(t+1.0);
      const o2=audioCtx.createOscillator(),g2=audioCtx.createGain();
      o2.connect(g2);g2.connect(audioCtx.destination);
      o2.type='sine';o2.frequency.setValueAtTime(400,t+0.2);o2.frequency.linearRampToValueAtTime(1000,t+0.8);
      g2.gain.setValueAtTime(0,t);g2.gain.linearRampToValueAtTime(vol*0.5,t+0.3);g2.gain.exponentialRampToValueAtTime(0.01,t+1.0);
      o2.start(t+0.2);o2.stop(t+1.0);
    }
    else if(type==='wave_alert'){
      // 波次警报：军号式短促连续音
      o.type='square';o.frequency.setValueAtTime(600,t);o.frequency.setValueAtTime(800,t+0.15);o.frequency.setValueAtTime(600,t+0.3);o.frequency.setValueAtTime(800,t+0.45);
      g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.01,t+0.6);
      o.start(t);o.stop(t+0.6);
    }
    else if(type==='elite_spawn'){
      // 精英出现：深沉威压音
      o.type='sawtooth';o.frequency.setValueAtTime(80,t);o.frequency.setValueAtTime(60,t+0.3);o.frequency.setValueAtTime(100,t+0.5);
      g.gain.setValueAtTime(vol*1.5,t);g.gain.linearRampToValueAtTime(vol,t+0.5);g.gain.exponentialRampToValueAtTime(0.01,t+1.0);
      o.start(t);o.stop(t+1.0);
      const o2=audioCtx.createOscillator(),g2=audioCtx.createGain();
      o2.connect(g2);g2.connect(audioCtx.destination);
      o2.type='triangle';o2.frequency.setValueAtTime(200,t+0.2);o2.frequency.linearRampToValueAtTime(400,t+0.6);
      g2.gain.setValueAtTime(vol*0.6,t+0.2);g2.gain.exponentialRampToValueAtTime(0.01,t+0.8);
      o2.start(t+0.2);o2.stop(t+0.8);
    }
    else if(type==='bonus_up'){
      // 奖励提升：上行和弦
      o.type='sine';o.frequency.setValueAtTime(400,t);o.frequency.setValueAtTime(600,t+0.1);o.frequency.setValueAtTime(800,t+0.2);
      g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.01,t+0.4);
      o.start(t);o.stop(t+0.4);
    }
    else if(type==='plasma'){
      // 等离子炮：粗重能量弹
      o.type='sawtooth';o.frequency.setValueAtTime(600,t);o.frequency.exponentialRampToValueAtTime(100,t+0.2);
      g.gain.setValueAtTime(vol*1.5,t);g.gain.exponentialRampToValueAtTime(0.01,t+0.25);
      o.start(t);o.stop(t+0.25);
    }
    else if(type==='railgun'){
      // 磁轨狙击：高频尖锐+回响
      o.type='sawtooth';o.frequency.setValueAtTime(3000,t);o.frequency.exponentialRampToValueAtTime(200,t+0.3);
      g.gain.setValueAtTime(vol*1.2,t);g.gain.exponentialRampToValueAtTime(0.01,t+0.4);
      o.start(t);o.stop(t+0.4);
      const o2=audioCtx.createOscillator(),g2=audioCtx.createGain();
      o2.connect(g2);g2.connect(audioCtx.destination);
      o2.type='sine';o2.frequency.setValueAtTime(800,t+0.1);o2.frequency.exponentialRampToValueAtTime(100,t+0.5);
      g2.gain.setValueAtTime(vol*0.3,t+0.1);g2.gain.exponentialRampToValueAtTime(0.01,t+0.6);
      o2.start(t+0.1);o2.stop(t+0.6);
    }
    // === 攀爬音效 ===
    else if(type==='climb_start'){
      // 攀爬开始：金属摩擦+抓握
      o.type='sawtooth';o.frequency.setValueAtTime(200,t);o.frequency.linearRampToValueAtTime(600,t+0.2);
      g.gain.setValueAtTime(vol*0.6,t);g.gain.exponentialRampToValueAtTime(0.01,t+0.3);
      o.start(t);o.stop(t+0.3);
    }
    else if(type==='climb_end'){
      // 攀爬完成：轻快的着地音
      o.type='sine';o.frequency.setValueAtTime(500,t);o.frequency.setValueAtTime(700,t+0.05);o.frequency.setValueAtTime(900,t+0.1);
      g.gain.setValueAtTime(vol*0.5,t);g.gain.exponentialRampToValueAtTime(0.01,t+0.2);
      o.start(t);o.stop(t+0.2);
    }
    // === 敌人闪避音效 ===
    else if(type==='dodge'){
      // 闪避：快速"嗖"声
      o.type='sine';o.frequency.setValueAtTime(1200,t);o.frequency.exponentialRampToValueAtTime(300,t+0.15);
      g.gain.setValueAtTime(vol*0.7,t);g.gain.exponentialRampToValueAtTime(0.01,t+0.2);
      o.start(t);o.stop(t+0.2);
      // 第二层：风声
      const o2=audioCtx.createOscillator(),g2=audioCtx.createGain();
      o2.connect(g2);g2.connect(audioCtx.destination);
      o2.type='sawtooth';o2.frequency.setValueAtTime(2000,t);o2.frequency.exponentialRampToValueAtTime(500,t+0.12);
      g2.gain.setValueAtTime(vol*0.2,t);g2.gain.exponentialRampToValueAtTime(0.01,t+0.15);
      o2.start(t);o2.stop(t+0.15);
    }
  }catch(e){}
}
