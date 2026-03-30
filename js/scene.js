// ===== 场景初始化 =====
function initScene(){
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x050510);
  scene.fog=new THREE.FogExp2(0x050510,0.006);
  clock=new THREE.Clock();
  camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,500);
  renderer=new THREE.WebGLRenderer({canvas:document.getElementById('gameCanvas'),antialias:true});
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.shadowMap.enabled=true;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.2;
  playerGroup=new THREE.Group();scene.add(playerGroup);
  createLighting();createMap();createStarfield();spawnLootItems();spawnEnemies();
  minimapCtx=document.getElementById('minimapCanvas').getContext('2d');
  window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
}
function createLighting(){
  scene.add(new THREE.AmbientLight(0x334466,0.6));
  const d=new THREE.DirectionalLight(0xaaccff,1.0);d.position.set(50,80,30);d.castShadow=true;
  d.shadow.mapSize.set(1024,1024);d.shadow.camera.left=-80;d.shadow.camera.right=80;d.shadow.camera.top=80;d.shadow.camera.bottom=-80;
  scene.add(d);
  const f=new THREE.DirectionalLight(0xff6633,0.3);f.position.set(-40,30,-50);scene.add(f);
  scene.add(new THREE.HemisphereLight(0x4488ff,0x223344,0.4));
}
function createStarfield(){
  const g=new THREE.BufferGeometry(),n=3000,p=new Float32Array(n*3),c=new Float32Array(n*3);
  for(let i=0;i<n;i++){p[i*3]=(Math.random()-0.5)*800;p[i*3+1]=Math.random()*300+50;p[i*3+2]=(Math.random()-0.5)*800;const v=Math.random();c[i*3]=0.7+v*0.3;c[i*3+1]=0.8+v*0.2;c[i*3+2]=1.0;}
  g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
  scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.5,vertexColors:true,transparent:true,opacity:0.8})));
}
function createMap(){
  const ms=GAME.mapSize;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(ms*2,ms*2),new THREE.MeshStandardMaterial({color:0x1a2a3a,roughness:0.7,metalness:0.3}));
  floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(ms*2,40,0x0a2a4a,0x0a1a2a);grid.position.y=0.01;scene.add(grid);
  const wM=new THREE.MeshStandardMaterial({color:0x2a3a5a,roughness:0.5,metalness:0.5});
  const aM=new THREE.MeshStandardMaterial({color:0x0a4a8a,roughness:0.3,metalness:0.7,emissive:0x001133,emissiveIntensity:0.2});
  const dM=new THREE.MeshStandardMaterial({color:0x4a2a2a,roughness:0.5,metalness:0.5,emissive:0x330000,emissiveIntensity:0.15});
  const matMap={wall:wM,accent:aM,danger:dM};
  // 检查是否有编辑器关卡数据
  let edLevel=window._editorLevel;
  // 自定义关卡也使用 editorData
  if(!edLevel&&window._customLevelData&&window._customLevelData.editorData){
    edLevel=window._customLevelData.editorData;
    window._editorLevel=edLevel; // 统一数据源
  }
  let S,decorLights;
  if(edLevel&&edLevel.objects){
    // 从编辑器数据构建建筑数组
    if(edLevel.mapSize)GAME.mapSize=edLevel.mapSize;
    const buildings=edLevel.objects.filter(o=>o.layer==='buildings');
    S=buildings.map(b=>[b.x,b.y||Math.round((b.h||6)/2),b.z,b.w||10,b.h||6,b.d||2,matMap[b.material]||wM]);
    const lights=edLevel.objects.filter(o=>o.layer==='lights');
    decorLights=lights.map(l=>{const c=parseInt((l.lightColor||'#00ffff').replace('#',''),16);return[l.x,5,l.z,c];});
  }else{
    S=[
      [0,4,-ms,ms*2,8,2,wM],[0,4,ms,ms*2,8,2,wM],[-ms,4,0,2,8,ms*2,wM],[ms,4,0,2,8,ms*2,wM],
      [0,3,0,20,6,20,aM],[0,6,-10,22,0.5,2,aM],[0,6,10,22,0.5,2,aM],
      [-45,3,-30,2,6,25,wM],[-55,3,-17,18,6,2,wM],[-55,3,-43,18,6,2,wM],[-50,2,-30,8,4,8,aM],
      [45,3,30,2,6,25,wM],[55,3,17,18,6,2,wM],[55,3,43,18,6,2,wM],[50,2,30,6,4,6,aM],
      [0,4,-70,30,8,2,dM],[-15,4,-85,2,8,28,dM],[15,4,-85,2,8,28,dM],[0,4,-100,32,8,2,dM],[0,3,-85,10,6,5,dM],
      [-25,1.5,15,4,3,8,wM],[25,1.5,-15,8,3,4,wM],[-15,1.5,50,6,3,4,wM],[15,1.5,-50,4,3,6,wM],
      [40,1.5,-40,5,3,5,wM],[-40,1.5,40,5,3,5,wM],[70,1.5,0,4,3,10,wM],[-70,1.5,0,10,3,4,wM],
      [30,1.5,60,6,3,3,wM],[-30,1.5,-60,3,3,6,wM],[60,1.5,60,8,3,2,wM],[-60,1.5,-60,2,3,8,wM],
      [0,1.5,40,12,3,2,wM],[0,1.5,-40,2,3,12,wM],[80,1.5,-70,6,3,6,aM],[-80,1.5,70,6,3,6,aM]
    ];
    decorLights=[[-50,5,-30,0x00ffff],[50,5,30,0x00ffff],[0,5,-85,0xff3333],[0,7,0,0x4488ff],[70,4,0,0xff8800],[-70,4,0,0xff8800]];
  }
  S.forEach(s=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(s[3],s[4],s[5]),s[6]);
    m.position.set(s[0],s[1],s[2]);m.castShadow=true;m.receiveShadow=true;scene.add(m);
    walls.push({min:new THREE.Vector3(s[0]-s[3]/2,s[1]-s[4]/2,s[2]-s[5]/2),max:new THREE.Vector3(s[0]+s[3]/2,s[1]+s[4]/2,s[2]+s[5]/2)});
  });
  // 装饰灯
  decorLights.forEach(([x,y,z,c])=>{
    const l=new THREE.PointLight(c,1.5,25);l.position.set(x,y,z);scene.add(l);
    const g=new THREE.Mesh(new THREE.SphereGeometry(0.3),new THREE.MeshBasicMaterial({color:c}));g.position.set(x,y,z);scene.add(g);
  });
}
