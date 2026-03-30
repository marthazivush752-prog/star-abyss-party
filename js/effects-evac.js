// ===== 特效系统 =====
function createBulletTrail(org,dir,range,color){
  const end=org.clone().add(dir.clone().multiplyScalar(range));
  const geo=new THREE.BufferGeometry().setFromPoints([org,end]);
  const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity:0.6}));
  scene.add(line);bullets.push({mesh:line,life:0.1});
}
function createHitEffect(pos,color){
  for(let i=0;i<8;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.05),new THREE.MeshBasicMaterial({color}));
    m.position.copy(pos);scene.add(m);
    particles.push({mesh:m,velocity:new THREE.Vector3((Math.random()-0.5)*5,Math.random()*3,(Math.random()-0.5)*5),life:0.5});
  }
}
function createExplosion(pos){
  const fb=new THREE.Mesh(new THREE.SphereGeometry(2,16,16),new THREE.MeshBasicMaterial({color:0xff6600,transparent:true,opacity:0.8}));
  fb.position.copy(pos);fb.position.y+=1;scene.add(fb);
  particles.push({mesh:fb,velocity:new THREE.Vector3(0,0,0),life:0.5,scale:true});
  for(let i=0;i<20;i++){
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.15,0.15),new THREE.MeshBasicMaterial({color:Math.random()>0.5?0xff6600:0xffcc00}));
    m.position.copy(pos);m.position.y+=1;scene.add(m);
    particles.push({mesh:m,velocity:new THREE.Vector3((Math.random()-0.5)*15,Math.random()*10,(Math.random()-0.5)*15),life:1.0});
  }
}
function showHitmarker(isHeadshot){
  const h=document.getElementById('hitmarker');
  h.classList.remove('show','headshot');void h.offsetWidth;
  h.classList.add('show');
  if(isHeadshot)h.classList.add('headshot');
  setTimeout(()=>{h.classList.remove('show','headshot');},isHeadshot?400:200);
}
function showKillPopup(name){
  const p=document.createElement('div');p.className='kill-popup';p.textContent='击杀 '+name;
  document.body.appendChild(p);setTimeout(()=>p.remove(),1000);
}
function addKillFeed(killer,victim){
  const f=document.getElementById('killFeed');
  const d=document.createElement('div');d.className='kill-feed-item';
  d.innerHTML='<span class="killer">'+killer+'</span> 击杀了 <span class="victim">'+victim+'</span>';
  f.appendChild(d);setTimeout(()=>d.remove(),3000);
  while(f.children.length>5)f.removeChild(f.firstChild);
}

// ===== 撤离系统 =====
function spawnEvacPoints(){
  evacPts.forEach(ep=>scene.remove(ep.mesh));evacPts=[];
  const pts=[[80,0,80],[-80,0,-30]];
  if(PLAYER.energyFragments>=3)pts.push([0,0,0]);
  pts.forEach(pos=>{
    const grp=new THREE.Group();
    grp.add(new THREE.Mesh(new THREE.CylinderGeometry(3,3.5,0.3,16),new THREE.MeshStandardMaterial({color:0xff8800,emissive:0xff6600,emissiveIntensity:0.5,metalness:0.7})));
    const pil=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,6,8),new THREE.MeshBasicMaterial({color:0xff8800,transparent:true,opacity:0.6}));pil.position.y=3;grp.add(pil);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.5,0.15,8,32),new THREE.MeshBasicMaterial({color:0xffaa00,transparent:true,opacity:0.7}));ring.position.y=3;ring.rotation.x=Math.PI/2;grp.add(ring);
    const glow=new THREE.Mesh(new THREE.SphereGeometry(1.5,16,16),new THREE.MeshBasicMaterial({color:0xff8800,transparent:true,opacity:0.15}));glow.position.y=3;grp.add(glow);
    const light=new THREE.PointLight(0xff8800,3,20);light.position.y=3;grp.add(light);
    grp.position.set(pos[0],pos[1],pos[2]);scene.add(grp);
    evacPts.push({mesh:grp,position:new THREE.Vector3(pos[0],pos[1],pos[2]),fast:pos[0]===0&&pos[2]===0&&PLAYER.energyFragments>=3});
  });
  evacActive=true;showMessage('🌀 撤离传送门已开启！','前往标记点位撤离');playSound('evac',0.5);
}
function checkEvacuation(dt){
  if(!evacActive)return;
  let inZone=false,fast=false;
  evacPts.forEach(ep=>{if(playerGroup.position.distanceTo(ep.position)<4){inZone=true;fast=ep.fast;}});
  if(inZone){
    if(!playerInEvac){playerInEvac=true;evacProgressVal=0;document.getElementById('evacProgress').style.display='block';}
    evacProgressVal+=dt*(fast?3.0:1.0);
    document.getElementById('evacFill').style.width=Math.min(evacProgressVal/3.0*100,100)+'%';
    if(evacProgressVal>=3.0){GAME.evacSuccess=true;endGame(true);}
  }else if(playerInEvac){playerInEvac=false;document.getElementById('evacProgress').style.display='none';}
}
