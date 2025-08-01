import{r as h,j as t}from"./index-m1GFXamH.js";import{A as se,G as j,T as N,C as le}from"./HTMLText-BtEAuASx.js";const ce=`
  /* Ocultar barras de scroll pero mantener funcionalidad */
  ::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }
  
  ::-webkit-scrollbar-thumb {
    background: transparent;
  }
  
  * {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* Internet Explorer 10+ */
  }
  
  /* Clase para contenedores scrolleables sin barra visible */
  .scrollable-hidden {
    overflow: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* Internet Explorer 10+ */
  }
  
  .scrollable-hidden::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes bounce-slow {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-5px); }
    60% { transform: translateY(-3px); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.1; transform: scale(1); }
    50% { opacity: 0.2; transform: scale(1.05); }
  }
  
  @keyframes ping-float {
    0% { opacity: 0; transform: scale(0.5); }
    50% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.2); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.8s ease-out;
  }
  
  .animate-bounce-slow {
    animation: bounce-slow 3s ease-in-out infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 3s ease-in-out infinite;
  }
  
  .animate-ping-float {
    animation: ping-float 2s ease-in-out infinite;
  }
  
  .tower-defense-bg {
    background: linear-gradient(135deg, 
      #1e1b4b 0%,    /* indigo-900 */
      #581c87 25%,   /* purple-900 */
      #7c2d12 50%,   /* orange-900 */
      #be185d 75%,   /* pink-800 */
      #881337 100%   /* rose-900 */
    );
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }
  
  .glow-orb-1 {
    position: absolute;
    top: 10%;
    left: 10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(60px);
  }
  
  .glow-orb-2 {
    position: absolute;
    bottom: 10%;
    right: 10%;
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(60px);
  }
  
  .glow-orb-3 {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 280px;
    height: 280px;
    background: radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(60px);
  }
  
  .floating-particle {
    position: absolute;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
  }
  
  .glass-panel {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }
  
  .glass-card:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.3);
  }
  
  .glow-button {
    position: relative;
    background: linear-gradient(135deg, #7c3aed, #ec4899);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .glow-button::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #8b5cf6, #f472b6);
    border-radius: inherit;
    filter: blur(10px);
    opacity: 0.3;
    z-index: -1;
    transition: opacity 0.3s ease;
  }
  
  .glow-button:hover::before {
    opacity: 0.5;
  }
  
  .glow-button:hover {
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(147, 51, 234, 0.4);
  }
  
  .game-over-bg {
    background: linear-gradient(135deg, 
      #7f1d1d 0%,    /* red-900 */
      #ea580c 25%,   /* orange-600 */
      #d97706 50%,   /* amber-600 */
      #ca8a04 75%,   /* yellow-600 */
      #eab308 100%   /* yellow-500 */
    );
    min-height: 100vh;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  
  .game-bg {
    background: linear-gradient(135deg, 
      #111827 0%,    /* gray-900 */
      #1e293b 50%,   /* slate-800 */
      #1e40af 100%   /* blue-800 */
    );
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  
  .game-header {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding: 1rem;
  }
  
  .game-header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 96rem;
    margin: 0 auto;
  }
  
  .game-stats {
    display: flex;
    gap: 1.5rem;
    color: white;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .stat-icon {
    font-size: 1.5rem;
  }
  
  .stat-value {
    font-weight: bold;
    font-size: 1.25rem;
  }
  
  .game-controls {
    display: flex;
    gap: 0.75rem;
  }
  
  .control-button {
    padding: 0.5rem 1.5rem;
    color: white;
    font-weight: bold;
    border-radius: 0.75rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
  }
  
  .control-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-wave {
    background: linear-gradient(135deg, #059669, #10b981);
  }
  
  .btn-wave:hover:not(:disabled) {
    background: linear-gradient(135deg, #047857, #059669);
  }
  
  .btn-pause {
    background: linear-gradient(135deg, #d97706, #f59e0b);
  }
  
  .btn-pause:hover {
    background: linear-gradient(135deg, #b45309, #d97706);
  }
  
  .btn-reset {
    background: linear-gradient(135deg, #dc2626, #ec4899);
  }
  
  .btn-reset:hover {
    background: linear-gradient(135deg, #b91c1c, #dc2626);
  }
  
  .tower-panel {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding: 1rem;
  }
  
  .tower-panel-content {
    max-width: 96rem;
    margin: 0 auto;
  }
  
  .tower-selection {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .tower-label {
    color: white;
    font-weight: bold;
  }
  
  .tower-button {
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-weight: bold;
    transition: all 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
  }
  
  .tower-button-active {
    background: white;
    color: black;
  }
  
  .tower-button-inactive {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
  
  .tower-button-inactive:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .tower-description {
    margin-top: 0.5rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
  }
  
  .game-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  
  .game-canvas {
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  
  .pause-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .pause-panel {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1.5rem;
    padding: 3rem;
    text-align: center;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  
  .pause-title {
    font-size: 3rem;
    color: white;
    font-weight: bold;
    margin-bottom: 1rem;
  }
  
  .btn-continue {
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #059669, #3b82f6);
    color: white;
    font-weight: bold;
    font-size: 1.25rem;
    border-radius: 1rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-continue:hover {
    background: linear-gradient(135deg, #047857, #2563eb);
    transform: scale(1.05);
  }
`;if(typeof document<"u"){const w=document.createElement("style");w.textContent=ce,document.head.appendChild(w)}const $=900,Q=700,de=18,ue=14,r=50,T=[{x:0,y:7},{x:1,y:7},{x:2,y:7},{x:3,y:7},{x:3,y:6},{x:3,y:5},{x:3,y:4},{x:3,y:3},{x:4,y:3},{x:5,y:3},{x:6,y:3},{x:7,y:3},{x:8,y:3},{x:9,y:3},{x:9,y:4},{x:9,y:5},{x:9,y:6},{x:9,y:7},{x:9,y:8},{x:9,y:9},{x:8,y:9},{x:7,y:9},{x:6,y:9},{x:5,y:9},{x:5,y:8},{x:5,y:7},{x:5,y:6},{x:6,y:6},{x:7,y:6},{x:8,y:6},{x:9,y:6},{x:10,y:6},{x:11,y:6},{x:12,y:6},{x:13,y:6},{x:14,y:6},{x:14,y:5},{x:14,y:4},{x:14,y:3},{x:14,y:2},{x:15,y:2},{x:16,y:2},{x:17,y:2}],_={normal:{hp:1,speed:.02,bounty:2,armor:0,color:16729156},fast:{hp:1,speed:.04,bounty:3,armor:0,color:4521796},tank:{hp:3,speed:.015,bounty:5,armor:1,color:4474111},boss:{hp:10,speed:.01,bounty:15,armor:2,color:16729343}},k={cannon:{cost:20,range:3,damage:2,cooldown:60,color:9127187,description:"Torre básica con buen daño"},laser:{cost:35,range:4,damage:1,cooldown:20,color:16711680,description:"Disparo rápido, penetra armadura"},ice:{cost:30,range:2.5,damage:1,cooldown:40,color:65535,description:"Ralentiza enemigos"},poison:{cost:40,range:3.5,damage:1,cooldown:80,color:9498256,description:"Daño continuo en área"}},pe=()=>{const w=h.useRef(null),[y,D]=h.useState("start"),[ee,F]=h.useState(50),[re,V]=h.useState(20),[te,X]=h.useState(1),[A,H]=h.useState(0),[W,ne]=h.useState("cannon"),[R,G]=h.useState(!1),[U,Y]=h.useState(null),[B,ae]=h.useState(()=>{const x=localStorage.getItem("towerdefense-highscore");return x?parseInt(x):0}),e=h.useRef({enemies:[],towers:[],shots:[],particles:[],pendingEnemies:[],spawnTimer:0,waveInProgress:!1,enemyIdCounter:0,currentGold:50,currentLives:20,currentWave:1,currentScore:0,damageTexts:[],effects:[],placing:!1,selectedTowerType:"cannon",selectedTower:null,isPaused:!1}),S=h.useRef(null),v=h.useRef(null);h.useEffect(()=>{if(y==="playing"&&!S.current){let x=function(){if(K)return;const n=new j;n.beginFill(1450302),n.drawRect(0,0,$,Q),n.endFill(),n.name="static",p.stage.addChild(n);for(let s=0;s<ue;s++)for(let g=0;g<de;g++){const i=new j;i.lineStyle(.5,3356262,.3),i.beginFill(1710638,.1),i.drawRect(0,0,r,r),i.endFill(),i.x=g*r,i.y=s*r,i.name="static",p.stage.addChild(i)}T.forEach((s,g)=>{const i=new j;i.beginFill(9139029),i.drawRoundedRect(2,2,r-4,r-4,8),i.endFill(),i.beginFill(14596231),i.drawRoundedRect(6,20,r-12,4,2),i.drawRoundedRect(6,26,r-12,4,2),i.endFill(),i.x=s.x*r,i.y=s.y*r,i.name="static",p.stage.addChild(i)});const c=T[0],m=new j;m.beginFill(65280),m.drawPolygon([c.x*r+5,c.y*r+r/2,c.x*r+15,c.y*r+10,c.x*r+15,c.y*r+r-10]),m.endFill(),m.name="static",p.stage.addChild(m);const u=T[T.length-1],f=new j;f.beginFill(16711680),f.drawPolygon([u.x*r+r-5,u.y*r+r/2,u.x*r+r-15,u.y*r+10,u.x*r+r-15,u.y*r+r-10]),f.endFill(),f.name="static",p.stage.addChild(f),K=!0},z=function(){for(let n=p.stage.children.length-1;n>=0;n--){const c=p.stage.children[n];c.name!=="static"&&p.stage.removeChild(c)}},I=function(n,c,m=16755200){for(let u=0;u<8;u++){const f=u/8*Math.PI*2;e.current.particles.push({x:n,y:c,vx:Math.cos(f)*(2+Math.random()*3),vy:Math.sin(f)*(2+Math.random()*3),life:30,maxLife:30,color:m,size:3+Math.random()*2})}},C=function(){z(),e.current.particles.forEach(a=>{const o=new j,d=a.life/a.maxLife;o.beginFill(a.color,d),o.drawCircle(0,0,a.size*d),o.endFill(),o.x=a.x,o.y=a.y,o.name="particle",p.stage.addChild(o)}),e.current.towers.forEach(a=>{const o=k[a.type],d=new j;e.current.selectedTower===a&&(d.lineStyle(2,16777215,.3),d.beginFill(16777215,.1),d.drawCircle(r/2,r/2,a.range*r),d.endFill()),d.beginFill(4473924),d.drawCircle(r/2,r/2,r/2-2),d.endFill();const l=(r/2-6)*(1+a.level*.1);if(d.beginFill(o.color),a.type==="cannon")d.drawCircle(r/2,r/2,l);else if(a.type==="laser")d.drawPolygon([r/2,r/2-l,r/2+l,r/2+l,r/2,r/2+l/2,r/2-l,r/2+l]);else if(a.type==="ice")for(let L=0;L<6;L++){const M=L/6*Math.PI*2,O=r/2+Math.cos(M)*l*.8,q=r/2+Math.sin(M)*l*.8;d.drawPolygon([O,q,O+Math.cos(M+.5)*l*.3,q+Math.sin(M+.5)*l*.3,O+Math.cos(M-.5)*l*.3,q+Math.sin(M-.5)*l*.3])}else a.type==="poison"&&d.drawRoundedRect(r/2-l,r/2-l,l*2,l*2,l*.3);d.endFill(),a.cooldown>0&&(d.lineStyle(3,16776960,.8),d.drawCircle(r/2,r/2,l+3)),d.x=a.x*r,d.y=a.y*r,d.name="tower",p.stage.addChild(d);const b=new N(a.level.toString(),{fontSize:12,fill:16777215,fontWeight:"bold",stroke:0,strokeThickness:2});b.anchor.set(.5),b.x=a.x*r+r/2,b.y=a.y*r+r/2,b.name="tower-level",p.stage.addChild(b)}),e.current.enemies.forEach(a=>{if(!a.alive)return;const o=T[Math.floor(a.pos)];if(!o)return;const d=_[a.type],l=new j;l.beginFill(0,.3),l.drawCircle(r/2+2,r/2+2,r/2-8),l.endFill(),l.beginFill(d.color),a.type==="normal"?l.drawCircle(r/2,r/2,r/2-8):a.type==="fast"?l.drawPolygon([r/2,r/2-15,r/2+10,r/2+10,r/2-10,r/2+10]):a.type==="tank"?l.drawRoundedRect(r/2-12,r/2-12,24,24,4):a.type==="boss"&&l.drawPolygon([r/2,r/2-18,r/2+15,r/2-5,r/2+10,r/2+15,r/2-10,r/2+15,r/2-15,r/2-5]),l.endFill(),a.armor>0&&(l.lineStyle(2,12632256),l.drawCircle(r/2,r/2,r/2-6)),l.x=o.x*r,l.y=o.y*r,l.name="enemy",p.stage.addChild(l);const b=new j;b.beginFill(16711680),b.drawRect(0,0,r-8,6),b.endFill(),b.beginFill(65280);const L=Math.max(0,(r-8)*(a.hp/a.maxHp));b.drawRect(0,0,L,6),b.endFill(),b.x=o.x*r+4,b.y=o.y*r-8,b.name="hp",p.stage.addChild(b)}),e.current.shots.forEach(a=>{const o=new j;a.type==="cannon"?(o.beginFill(16755200),o.drawCircle(0,0,4)):a.type==="laser"?(o.lineStyle(3,16711680,.8),o.moveTo(-5,0),o.lineTo(5,0)):a.type==="ice"?(o.beginFill(65535),o.drawPolygon([-3,-3,3,-3,0,3])):a.type==="poison"&&(o.beginFill(9498256),o.drawCircle(0,0,3)),o.endFill(),o.x=a.x,o.y=a.y,o.name="shot",p.stage.addChild(o)}),e.current.damageTexts.forEach(a=>{const o=new N(a.text,{fontSize:14,fill:a.color,fontWeight:"bold",stroke:0,strokeThickness:2});o.anchor.set(.5),o.x=a.x,o.y=a.y-(30-a.timer)*1.5,o.alpha=Math.min(1,a.timer/10),o.name="damage-text",p.stage.addChild(o)});const n=new le,c=new j;c.beginFill(0,.7),c.drawRoundedRect(10,10,300,120,10),c.endFill(),n.addChild(c);const m=new N(`💰 Oro: ${e.current.currentGold}`,{fontSize:18,fill:16766720,fontWeight:"bold"});m.x=20,m.y=20,n.addChild(m);const u=new N(`❤️ Vidas: ${e.current.currentLives}`,{fontSize:18,fill:16729156,fontWeight:"bold"});u.x=160,u.y=20,n.addChild(u);const f=new N(`🌊 Oleada: ${e.current.currentWave}`,{fontSize:18,fill:4500223,fontWeight:"bold"});f.x=20,f.y=45,n.addChild(f);const s=new N(`⭐ Puntos: ${e.current.currentScore}`,{fontSize:18,fill:16777215,fontWeight:"bold"});s.x=160,s.y=45,n.addChild(s);const g=e.current.enemies.filter(a=>a.alive).length+e.current.pendingEnemies.length,i=new N(`👾 Enemigos: ${g}`,{fontSize:16,fill:16755370,fontWeight:"bold"});if(i.x=20,i.y=70,n.addChild(i),e.current.selectedTower){const a=new N(`Torre ${e.current.selectedTower.type.toUpperCase()} Nv.${e.current.selectedTower.level}
Daño: ${e.current.selectedTower.damage} | Rango: ${e.current.selectedTower.range.toFixed(1)}
Click para mejorar: ${Math.pow(2,e.current.selectedTower.level)*k[e.current.selectedTower.type].cost}💰`,{fontSize:14,fill:16777215,fontWeight:"bold"});a.x=20,a.y=95,n.addChild(a)}n.name="ui",p.stage.addChild(n)},E=function(){if(!e.current.isPaused){if(e.current.pendingEnemies.length>0&&(e.current.spawnTimer--,e.current.spawnTimer<=0)){const n=e.current.pendingEnemies.shift();n&&e.current.enemies.push(n),e.current.spawnTimer=30}if(e.current.enemies.forEach(n=>{if(!n.alive)return;let c=n.pos+n.speed;if(c>=T.length){n.alive=!1,e.current.currentLives--,V(e.current.currentLives),e.current.damageTexts.push({x:$/2,y:200,text:"-1 ❤️",timer:60,color:16711680}),e.current.currentLives<=0&&D("gameOver");return}n.pos=c}),e.current.towers.forEach(n=>{if(n.cooldown=Math.max(0,n.cooldown-1),n.cooldown===0){const c=e.current.enemies.find(m=>{if(!m.alive)return!1;const u=T[Math.floor(m.pos)],f=n.x-u.x,s=n.y-u.y;return Math.sqrt(f*f+s*s)<=n.range});if(c){const m=T[Math.floor(c.pos)],u=m.x*r+r/2,f=m.y*r+r/2;e.current.shots.push({x:n.x*r+r/2,y:n.y*r+r/2,tx:u,ty:f,damage:n.damage,target:c.id,type:n.type,effects:{}});const s=k[n.type];n.cooldown=s.cooldown/(1+n.level*.2)}}}),e.current.shots=e.current.shots.filter(n=>{const c=n.tx-n.x,m=n.ty-n.y,u=Math.sqrt(c*c+m*m);if(u<8){const s=e.current.enemies.find(g=>g.id===n.target&&g.alive);if(s){let g=Math.max(1,n.damage-s.armor);if(s.hp-=g,n.type==="ice")s.speed*=.5,setTimeout(()=>{s.alive&&(s.speed=_[s.type].speed)},2e3);else if(n.type==="poison"){let i=5;const a=setInterval(()=>{s.alive&&i>0?(s.hp-=1,i--):clearInterval(a)},500)}I(n.tx,n.ty,k[n.type].color),e.current.damageTexts.push({x:n.tx,y:n.ty,text:`-${g}`,timer:30,color:16776960}),s.hp<=0&&(s.alive=!1,e.current.currentGold+=s.bounty,e.current.currentScore+=s.bounty*10,F(e.current.currentGold),H(e.current.currentScore),I(n.tx,n.ty,16711680),e.current.damageTexts.push({x:n.tx,y:n.ty-20,text:`+${s.bounty}💰`,timer:40,color:65280}))}return!1}const f=8;return n.x+=c/u*f,n.y+=m/u*f,!0}),e.current.particles=e.current.particles.filter(n=>(n.x+=n.vx,n.y+=n.vy,n.life--,n.vx*=.98,n.vy*=.98,n.life>0)),e.current.damageTexts=e.current.damageTexts.filter(n=>(n.timer--,n.timer>0)),e.current.waveInProgress&&e.current.pendingEnemies.length===0&&e.current.enemies.every(n=>!n.alive)){e.current.waveInProgress=!1;const n=e.current.currentWave*10;e.current.currentGold+=n,e.current.currentScore+=n*5,F(e.current.currentGold),H(e.current.currentScore),e.current.damageTexts.push({x:$/2,y:150,text:`¡Oleada ${e.current.currentWave} completada! +${n}💰`,timer:120,color:65280})}}C(),v.current=requestAnimationFrame(E)},P=function(n){if(!(p.view instanceof HTMLCanvasElement))return;const c=p.view.getBoundingClientRect(),m=n.clientX-c.left,u=n.clientY-c.top,f=Math.floor(m/r),s=Math.floor(u/r);if(e.current.placing){const g=T.some(d=>d.x===f&&d.y===s),i=e.current.towers.some(d=>d.x===f&&d.y===s),a=k[e.current.selectedTowerType].cost;if(g){e.current.damageTexts.push({x:m,y:u,text:"¡No se puede construir en el camino!",timer:60,color:16711680});return}if(i){e.current.damageTexts.push({x:m,y:u,text:"¡Ya hay una torre aquí!",timer:60,color:16711680});return}if(e.current.currentGold<a){e.current.damageTexts.push({x:m,y:u,text:"¡No tienes suficiente oro!",timer:60,color:16711680});return}const o=k[e.current.selectedTowerType];e.current.towers.push({x:f,y:s,level:1,cooldown:0,type:e.current.selectedTowerType,range:o.range,damage:o.damage,special:{}}),e.current.currentGold-=a,F(e.current.currentGold),G(!1)}else{const g=e.current.towers.find(i=>i.x===f&&i.y===s);if(g)if(e.current.selectedTower===g){const i=Math.pow(2,g.level)*k[g.type].cost;e.current.currentGold>=i?(g.level++,g.damage=Math.floor(g.damage*1.5),g.range+=.2,e.current.currentGold-=i,F(e.current.currentGold),e.current.damageTexts.push({x:g.x*r+r/2,y:g.y*r,text:`¡Mejorada! Nv.${g.level}`,timer:60,color:65280})):e.current.damageTexts.push({x:m,y:u,text:`Necesitas ${i}💰`,timer:60,color:16711680})}else Y(g);else Y(null)}};const p=new se({width:$,height:Q,backgroundColor:1710638});w.current&&p.view instanceof Node&&w.current.appendChild(p.view),S.current=p;let K=!1;return x(),C(),v.current=requestAnimationFrame(E),p.view instanceof HTMLCanvasElement&&p.view.addEventListener("click",P),()=>{y!=="playing"&&y!=="paused"&&(p&&p.view instanceof HTMLCanvasElement&&p.view.removeEventListener("click",P),v.current&&(cancelAnimationFrame(v.current),v.current=null))}}},[y]),h.useEffect(()=>{if(w.current){const x=w.current.querySelector("canvas");x&&(x.style.cursor=R?"crosshair":"default")}},[R]),h.useEffect(()=>{e.current.placing=R,e.current.selectedTowerType=W,e.current.selectedTower=U},[R,W,U]),h.useEffect(()=>{if(e.current.isPaused,e.current.isPaused=y==="paused",y==="playing"&&S.current&&!v.current){let x=function(){e.current.isPaused,v.current=requestAnimationFrame(x)};console.log("Reiniciando gameLoop después de pausa"),S.current,v.current=requestAnimationFrame(x)}y!=="playing"&&y!=="paused"&&S.current&&(v.current&&(cancelAnimationFrame(v.current),v.current=null),S.current.destroy(),S.current=null,w.current&&(w.current.innerHTML=""))},[y]),h.useEffect(()=>()=>{S.current&&(S.current.destroy(),S.current=null),w.current&&(w.current.innerHTML="")},[]);const oe=()=>{const x=Math.floor(e.current.currentWave*1.5)+3,z=[];for(let I=0;I<x;I++){let C="normal";e.current.currentWave>=3&&Math.random()<.3&&(C="fast"),e.current.currentWave>=5&&Math.random()<.2&&(C="tank"),e.current.currentWave>=7&&Math.random()<.1&&(C="boss");const E=_[C],P=E.hp+Math.floor(e.current.currentWave/2);z.push({id:e.current.enemyIdCounter++,pos:0,hp:P,maxHp:P,alive:!0,type:C,speed:E.speed,bounty:E.bounty+Math.floor(e.current.currentWave/3),armor:E.armor})}e.current.pendingEnemies=z,e.current.spawnTimer=0,e.current.waveInProgress=!0,e.current.currentWave++,X(e.current.currentWave)},ie=()=>{e.current.currentGold=50,e.current.currentLives=20,e.current.currentWave=1,e.current.currentScore=0,e.current.enemies=[],e.current.towers=[],e.current.shots=[],e.current.particles=[],e.current.pendingEnemies=[],e.current.waveInProgress=!1,F(50),V(20),X(1),H(0),Y(null),G(!1),D("playing")},Z=()=>{D(y==="paused"?"playing":"paused")},J=()=>{e.current.currentScore>B&&(ae(e.current.currentScore),localStorage.setItem("towerdefense-highscore",e.current.currentScore.toString())),D("start")};return y==="start"?t.jsxs("div",{className:"tower-defense-bg scrollable-hidden",style:{display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"2rem",minHeight:"100vh",overflow:"auto"},children:[t.jsx("div",{className:"glow-orb-1 animate-pulse-glow"}),t.jsx("div",{className:"glow-orb-2 animate-pulse-glow",style:{animationDelay:"1s"}}),t.jsx("div",{className:"glow-orb-3 animate-pulse-glow",style:{animationDelay:"2s"}}),t.jsxs("div",{style:{position:"absolute",inset:0,overflow:"hidden"},children:[t.jsx("div",{className:"floating-particle animate-ping-float",style:{top:"25%",left:"25%",width:"8px",height:"8px",animationDelay:"0s"}}),t.jsx("div",{className:"floating-particle animate-ping-float",style:{top:"75%",left:"33%",width:"4px",height:"4px",animationDelay:"1s"}}),t.jsx("div",{className:"floating-particle animate-ping-float",style:{top:"50%",right:"25%",width:"12px",height:"12px",animationDelay:"2s"}}),t.jsx("div",{className:"floating-particle animate-ping-float",style:{top:"33%",right:"33%",width:"4px",height:"4px",animationDelay:"3s"}}),t.jsx("div",{className:"floating-particle animate-ping-float",style:{bottom:"25%",left:"50%",width:"8px",height:"8px",animationDelay:"4s"}})]}),t.jsxs("div",{className:"glass-panel animate-fade-in scrollable-hidden",style:{borderRadius:"1.5rem",padding:"2rem",maxWidth:"32rem",width:"100%",position:"relative",zIndex:10,margin:"2rem 0",maxHeight:"calc(100vh - 4rem)",overflow:"auto"},children:[t.jsxs("div",{style:{textAlign:"center",marginBottom:"1.5rem"},children:[t.jsx("h1",{className:"animate-bounce-slow",style:{fontSize:"3rem",fontWeight:"bold",color:"white",marginBottom:"0.75rem",textShadow:"0 10px 20px rgba(0,0,0,0.5)"},children:"🏰 Tower Defense"}),t.jsx("p",{style:{fontSize:"1.125rem",color:"rgba(255, 255, 255, 0.8)",fontWeight:"500"},children:"Defiende tu reino con torres estratégicas"}),t.jsx("div",{style:{marginTop:"1rem",display:"flex",justifyContent:"center"},children:t.jsx("div",{style:{width:"6rem",height:"4px",background:"linear-gradient(to right, #a855f7, #ec4899)",borderRadius:"9999px"}})})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:"1rem",marginBottom:"1.5rem"},children:[t.jsxs("div",{className:"glass-card",style:{borderRadius:"1rem",padding:"1.25rem"},children:[t.jsx("div",{style:{fontSize:"1.75rem",marginBottom:"0.5rem"},children:"🎯"}),t.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"bold",color:"white",marginBottom:"0.5rem"},children:"Torres Especiales"}),t.jsx("p",{style:{color:"rgba(255, 255, 255, 0.7)",fontSize:"0.875rem"},children:"4 tipos únicos: Cañón, Láser, Hielo y Veneno con habilidades especiales"})]}),t.jsxs("div",{className:"glass-card",style:{borderRadius:"1rem",padding:"1.25rem"},children:[t.jsx("div",{style:{fontSize:"1.75rem",marginBottom:"0.5rem"},children:"👾"}),t.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"bold",color:"white",marginBottom:"0.5rem"},children:"Enemigos Variados"}),t.jsx("p",{style:{color:"rgba(255, 255, 255, 0.7)",fontSize:"0.875rem"},children:"Normales, rápidos, tanques y jefes con diferentes características"})]}),t.jsxs("div",{className:"glass-card",style:{borderRadius:"1rem",padding:"1.25rem"},children:[t.jsx("div",{style:{fontSize:"1.75rem",marginBottom:"0.5rem"},children:"⚡"}),t.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"bold",color:"white",marginBottom:"0.5rem"},children:"Efectos Visuales"}),t.jsx("p",{style:{color:"rgba(255, 255, 255, 0.7)",fontSize:"0.875rem"},children:"Explosiones, partículas y efectos especiales espectaculares"})]}),t.jsxs("div",{className:"glass-card",style:{borderRadius:"1rem",padding:"1.25rem"},children:[t.jsx("div",{style:{fontSize:"1.75rem",marginBottom:"0.5rem"},children:"🏆"}),t.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"bold",color:"white",marginBottom:"0.5rem"},children:"Estrategia Profunda"}),t.jsx("p",{style:{color:"rgba(255, 255, 255, 0.7)",fontSize:"0.875rem"},children:"Mejora torres, gestiona recursos y planifica tu defensa"})]})]}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx("div",{style:{marginBottom:"1rem"},children:t.jsxs("button",{onClick:ie,className:"glow-button",style:{padding:"1rem 2rem",color:"white",fontWeight:"bold",fontSize:"1.25rem",borderRadius:"1rem",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",margin:"0 auto"},children:[t.jsx("span",{children:"🚀"}),t.jsx("span",{children:"Comenzar Defensa"})]})}),t.jsxs("div",{style:{color:"rgba(255, 255, 255, 0.6)",fontSize:"1rem",background:"rgba(255, 255, 255, 0.05)",backdropFilter:"blur(10px)",borderRadius:"0.75rem",padding:"0.75rem",border:"1px solid rgba(255, 255, 255, 0.1)",marginBottom:"1rem"},children:["Record: ",t.jsx("span",{style:{color:"#fbbf24",fontWeight:"bold",fontSize:"1.25rem"},children:B.toLocaleString()})," puntos",B>0&&t.jsx("span",{style:{marginLeft:"0.5rem"},children:"🏆"})]}),t.jsxs("div",{className:"glass-panel",style:{borderRadius:"0.75rem",padding:"1.25rem"},children:[t.jsxs("h4",{style:{color:"white",fontWeight:"bold",marginBottom:"0.75rem",fontSize:"1.125rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx("span",{children:"🎮"}),t.jsx("span",{children:"Controles"})]}),t.jsxs("div",{style:{color:"rgba(255, 255, 255, 0.7)",fontSize:"0.875rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.5rem",borderRadius:"0.5rem",background:"rgba(255, 255, 255, 0.05)",marginBottom:"0.5rem"},children:[t.jsx("span",{style:{fontSize:"1.125rem"},children:"🖱️"}),t.jsx("span",{children:"Click en espacios vacíos para construir torres"})]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.5rem",borderRadius:"0.5rem",background:"rgba(255, 255, 255, 0.05)",marginBottom:"0.5rem"},children:[t.jsx("span",{style:{fontSize:"1.125rem"},children:"🎯"}),t.jsx("span",{children:"Click en torres para seleccionar y mejorar"})]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.5rem",borderRadius:"0.5rem",background:"rgba(255, 255, 255, 0.05)"},children:[t.jsx("span",{style:{fontSize:"1.125rem"},children:"💰"}),t.jsx("span",{children:"Gestiona oro y vidas estratégicamente"})]})]})]})]})]})]}):y==="gameOver"?t.jsx("div",{className:"game-over-bg",children:t.jsxs("div",{className:"glass-panel",style:{borderRadius:"1.5rem",padding:"3rem",maxWidth:"28rem",width:"100%",textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"5rem",marginBottom:"1.5rem"},children:"💥"}),t.jsx("h2",{style:{fontSize:"3rem",fontWeight:"bold",color:"white",marginBottom:"1rem"},children:"¡Derrota!"}),t.jsx("p",{style:{fontSize:"1.5rem",color:"rgba(255, 255, 255, 0.8)",marginBottom:"0.5rem"},children:"Tu reino ha caído"}),t.jsxs("p",{style:{fontSize:"2.5rem",fontWeight:"bold",color:"#fbbf24",marginBottom:"1.5rem"},children:[A.toLocaleString()," puntos"]}),A>B&&t.jsx("div",{style:{color:"#4ade80",fontSize:"1.25rem",marginBottom:"1rem",fontWeight:"bold"},children:"🎉 ¡Nuevo Record!"}),t.jsxs("button",{onClick:J,className:"glow-button",style:{padding:"1rem 2rem",color:"white",fontWeight:"bold",fontSize:"1.25rem",borderRadius:"1rem",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",margin:"0 auto"},children:[t.jsx("span",{children:"🔄"}),t.jsx("span",{children:"Intentar de Nuevo"})]})]})}):t.jsxs("div",{className:"game-bg",children:[t.jsx("div",{className:"game-header",children:t.jsxs("div",{className:"game-header-content",children:[t.jsxs("div",{className:"game-stats",children:[t.jsxs("div",{className:"stat-item",children:[t.jsx("span",{className:"stat-icon",children:"💰"}),t.jsx("span",{className:"stat-value",children:ee})]}),t.jsxs("div",{className:"stat-item",children:[t.jsx("span",{className:"stat-icon",children:"❤️"}),t.jsx("span",{className:"stat-value",children:re})]}),t.jsxs("div",{className:"stat-item",children:[t.jsx("span",{className:"stat-icon",children:"🌊"}),t.jsx("span",{className:"stat-value",children:te})]}),t.jsxs("div",{className:"stat-item",children:[t.jsx("span",{className:"stat-icon",children:"⭐"}),t.jsx("span",{className:"stat-value",children:A.toLocaleString()})]})]}),t.jsxs("div",{className:"game-controls",children:[t.jsx("button",{onClick:oe,disabled:e.current.waveInProgress,className:"control-button btn-wave",children:"🌊 Siguiente Oleada"}),t.jsx("button",{onClick:Z,className:"control-button btn-pause",children:y==="paused"?"▶️ Continuar":"⏸️ Pausar"}),t.jsx("button",{onClick:J,className:"control-button btn-reset",children:"🔄 Reiniciar"})]})]})}),t.jsx("div",{className:"tower-panel",children:t.jsxs("div",{className:"tower-panel-content",children:[t.jsxs("div",{className:"tower-selection",children:[t.jsx("span",{className:"tower-label",children:"Seleccionar Torre:"}),Object.entries(k).map(([x,z])=>t.jsxs("button",{onClick:()=>{ne(x),G(!0)},className:`tower-button ${W===x&&R?"tower-button-active":"tower-button-inactive"}`,style:{borderColor:`#${z.color.toString(16).padStart(6,"0")}`},children:[x.toUpperCase()," (",z.cost,"💰)"]},x)),R&&t.jsx("button",{onClick:()=>G(!1),className:"control-button btn-reset",children:"❌ Cancelar"})]}),W&&t.jsx("div",{className:"tower-description",children:k[W].description})]})}),t.jsxs("div",{className:"game-area",style:{position:"relative"},children:[t.jsx("div",{ref:w,className:"game-canvas"}),y==="paused"&&t.jsx("div",{className:"pause-overlay",children:t.jsxs("div",{className:"pause-panel",children:[t.jsx("h2",{className:"pause-title",children:"⏸️ Pausado"}),t.jsx("button",{onClick:Z,className:"btn-continue",children:"▶️ Continuar"})]})})]})]})};export{pe as default};
