import{r as x,j as c}from"./index-vJFL1dzY.js";import{A as ie,G as T,T as E,C as ce}from"./HTMLText-CeZkFdUK.js";import{G as le,a as de}from"./GameOverScreen-DshzEBP7.js";const ue=`
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
    min-height: 100dvh;
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
    min-height: 100dvh;
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
    min-height: 100dvh;
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
`;if(typeof document<"u"){const w=document.createElement("style");w.textContent=ue,document.head.appendChild(w)}const D=900,ee=700,ge=18,me=14,r=50,C=[{x:0,y:7},{x:1,y:7},{x:2,y:7},{x:3,y:7},{x:3,y:6},{x:3,y:5},{x:3,y:4},{x:3,y:3},{x:4,y:3},{x:5,y:3},{x:6,y:3},{x:7,y:3},{x:8,y:3},{x:9,y:3},{x:9,y:4},{x:9,y:5},{x:9,y:6},{x:9,y:7},{x:9,y:8},{x:9,y:9},{x:8,y:9},{x:7,y:9},{x:6,y:9},{x:5,y:9},{x:5,y:8},{x:5,y:7},{x:5,y:6},{x:6,y:6},{x:7,y:6},{x:8,y:6},{x:9,y:6},{x:10,y:6},{x:11,y:6},{x:12,y:6},{x:13,y:6},{x:14,y:6},{x:14,y:5},{x:14,y:4},{x:14,y:3},{x:14,y:2},{x:15,y:2},{x:16,y:2},{x:17,y:2}],_={normal:{hp:1,speed:.02,bounty:2,armor:0,color:16729156},fast:{hp:1,speed:.04,bounty:3,armor:0,color:4521796},tank:{hp:3,speed:.015,bounty:5,armor:1,color:4474111},boss:{hp:10,speed:.01,bounty:15,armor:2,color:16729343}},S={cannon:{cost:20,range:3,damage:2,cooldown:60,color:9127187,description:"Torre básica con buen daño"},laser:{cost:35,range:4,damage:1,cooldown:20,color:16711680,description:"Disparo rápido, penetra armadura"},ice:{cost:30,range:2.5,damage:1,cooldown:40,color:65535,description:"Ralentiza enemigos"},poison:{cost:40,range:3.5,damage:1,cooldown:80,color:9498256,description:"Daño continuo en área"}},be=()=>{const w=x.useRef(null),[y,z]=x.useState("start"),[re,P]=x.useState(50),[te,X]=x.useState(20),[ne,B]=x.useState(1),[U,H]=x.useState(0),[G,ae]=x.useState("cannon"),[N,$]=x.useState(!1),[V,A]=x.useState(null),[O,oe]=x.useState(()=>{const b=localStorage.getItem("towerdefense-highscore");return b?parseInt(b):0}),e=x.useRef({enemies:[],towers:[],shots:[],particles:[],pendingEnemies:[],spawnTimer:0,waveInProgress:!1,enemyIdCounter:0,currentGold:50,currentLives:20,currentWave:1,currentScore:0,damageTexts:[],effects:[],placing:!1,selectedTowerType:"cannon",selectedTower:null,isPaused:!1}),k=x.useRef(null),v=x.useRef(null);x.useEffect(()=>{if(y==="playing"&&!k.current){let b=function(){if(Q)return;const t=new T;t.beginFill(1450302),t.drawRect(0,0,D,ee),t.endFill(),t.name="static",p.stage.addChild(t);for(let s=0;s<me;s++)for(let m=0;m<ge;m++){const o=new T;o.lineStyle(.5,3356262,.3),o.beginFill(1710638,.1),o.drawRect(0,0,r,r),o.endFill(),o.x=m*r,o.y=s*r,o.name="static",p.stage.addChild(o)}C.forEach((s,m)=>{const o=new T;o.beginFill(9139029),o.drawRoundedRect(2,2,r-4,r-4,8),o.endFill(),o.beginFill(14596231),o.drawRoundedRect(6,20,r-12,4,2),o.drawRoundedRect(6,26,r-12,4,2),o.endFill(),o.x=s.x*r,o.y=s.y*r,o.name="static",p.stage.addChild(o)});const l=C[0],g=new T;g.beginFill(65280),g.drawPolygon([l.x*r+5,l.y*r+r/2,l.x*r+15,l.y*r+10,l.x*r+15,l.y*r+r-10]),g.endFill(),g.name="static",p.stage.addChild(g);const u=C[C.length-1],f=new T;f.beginFill(16711680),f.drawPolygon([u.x*r+r-5,u.y*r+r/2,u.x*r+r-15,u.y*r+10,u.x*r+r-15,u.y*r+r-10]),f.endFill(),f.name="static",p.stage.addChild(f),Q=!0},M=function(){for(let t=p.stage.children.length-1;t>=0;t--){const l=p.stage.children[t];l.name!=="static"&&p.stage.removeChild(l)}},W=function(t,l,g=16755200){for(let u=0;u<8;u++){const f=u/8*Math.PI*2;e.current.particles.push({x:t,y:l,vx:Math.cos(f)*(2+Math.random()*3),vy:Math.sin(f)*(2+Math.random()*3),life:30,maxLife:30,color:g,size:3+Math.random()*2})}},j=function(){M(),e.current.particles.forEach(n=>{const a=new T,d=n.life/n.maxLife;a.beginFill(n.color,d),a.drawCircle(0,0,n.size*d),a.endFill(),a.x=n.x,a.y=n.y,a.name="particle",p.stage.addChild(a)}),e.current.towers.forEach(n=>{const a=S[n.type],d=new T;e.current.selectedTower===n&&(d.lineStyle(2,16777215,.3),d.beginFill(16777215,.1),d.drawCircle(r/2,r/2,n.range*r),d.endFill()),d.beginFill(4473924),d.drawCircle(r/2,r/2,r/2-2),d.endFill();const i=(r/2-6)*(1+n.level*.1);if(d.beginFill(a.color),n.type==="cannon")d.drawCircle(r/2,r/2,i);else if(n.type==="laser")d.drawPolygon([r/2,r/2-i,r/2+i,r/2+i,r/2,r/2+i/2,r/2-i,r/2+i]);else if(n.type==="ice")for(let I=0;I<6;I++){const R=I/6*Math.PI*2,Y=r/2+Math.cos(R)*i*.8,q=r/2+Math.sin(R)*i*.8;d.drawPolygon([Y,q,Y+Math.cos(R+.5)*i*.3,q+Math.sin(R+.5)*i*.3,Y+Math.cos(R-.5)*i*.3,q+Math.sin(R-.5)*i*.3])}else n.type==="poison"&&d.drawRoundedRect(r/2-i,r/2-i,i*2,i*2,i*.3);d.endFill(),n.cooldown>0&&(d.lineStyle(3,16776960,.8),d.drawCircle(r/2,r/2,i+3)),d.x=n.x*r,d.y=n.y*r,d.name="tower",p.stage.addChild(d);const h=new E(n.level.toString(),{fontSize:12,fill:16777215,fontWeight:"bold",stroke:0,strokeThickness:2});h.anchor.set(.5),h.x=n.x*r+r/2,h.y=n.y*r+r/2,h.name="tower-level",p.stage.addChild(h)}),e.current.enemies.forEach(n=>{if(!n.alive)return;const a=C[Math.floor(n.pos)];if(!a)return;const d=_[n.type],i=new T;i.beginFill(0,.3),i.drawCircle(r/2+2,r/2+2,r/2-8),i.endFill(),i.beginFill(d.color),n.type==="normal"?i.drawCircle(r/2,r/2,r/2-8):n.type==="fast"?i.drawPolygon([r/2,r/2-15,r/2+10,r/2+10,r/2-10,r/2+10]):n.type==="tank"?i.drawRoundedRect(r/2-12,r/2-12,24,24,4):n.type==="boss"&&i.drawPolygon([r/2,r/2-18,r/2+15,r/2-5,r/2+10,r/2+15,r/2-10,r/2+15,r/2-15,r/2-5]),i.endFill(),n.armor>0&&(i.lineStyle(2,12632256),i.drawCircle(r/2,r/2,r/2-6)),i.x=a.x*r,i.y=a.y*r,i.name="enemy",p.stage.addChild(i);const h=new T;h.beginFill(16711680),h.drawRect(0,0,r-8,6),h.endFill(),h.beginFill(65280);const I=Math.max(0,(r-8)*(n.hp/n.maxHp));h.drawRect(0,0,I,6),h.endFill(),h.x=a.x*r+4,h.y=a.y*r-8,h.name="hp",p.stage.addChild(h)}),e.current.shots.forEach(n=>{const a=new T;n.type==="cannon"?(a.beginFill(16755200),a.drawCircle(0,0,4)):n.type==="laser"?(a.lineStyle(3,16711680,.8),a.moveTo(-5,0),a.lineTo(5,0)):n.type==="ice"?(a.beginFill(65535),a.drawPolygon([-3,-3,3,-3,0,3])):n.type==="poison"&&(a.beginFill(9498256),a.drawCircle(0,0,3)),a.endFill(),a.x=n.x,a.y=n.y,a.name="shot",p.stage.addChild(a)}),e.current.damageTexts.forEach(n=>{const a=new E(n.text,{fontSize:14,fill:n.color,fontWeight:"bold",stroke:0,strokeThickness:2});a.anchor.set(.5),a.x=n.x,a.y=n.y-(30-n.timer)*1.5,a.alpha=Math.min(1,n.timer/10),a.name="damage-text",p.stage.addChild(a)});const t=new ce,l=new T;l.beginFill(0,.7),l.drawRoundedRect(10,10,300,120,10),l.endFill(),t.addChild(l);const g=new E(`💰 Oro: ${e.current.currentGold}`,{fontSize:18,fill:16766720,fontWeight:"bold"});g.x=20,g.y=20,t.addChild(g);const u=new E(`❤️ Vidas: ${e.current.currentLives}`,{fontSize:18,fill:16729156,fontWeight:"bold"});u.x=160,u.y=20,t.addChild(u);const f=new E(`🌊 Oleada: ${e.current.currentWave}`,{fontSize:18,fill:4500223,fontWeight:"bold"});f.x=20,f.y=45,t.addChild(f);const s=new E(`⭐ Puntos: ${e.current.currentScore}`,{fontSize:18,fill:16777215,fontWeight:"bold"});s.x=160,s.y=45,t.addChild(s);const m=e.current.enemies.filter(n=>n.alive).length+e.current.pendingEnemies.length,o=new E(`👾 Enemigos: ${m}`,{fontSize:16,fill:16755370,fontWeight:"bold"});if(o.x=20,o.y=70,t.addChild(o),e.current.selectedTower){const n=new E(`Torre ${e.current.selectedTower.type.toUpperCase()} Nv.${e.current.selectedTower.level}
Daño: ${e.current.selectedTower.damage} | Rango: ${e.current.selectedTower.range.toFixed(1)}
Click para mejorar: ${Math.pow(2,e.current.selectedTower.level)*S[e.current.selectedTower.type].cost}💰`,{fontSize:14,fill:16777215,fontWeight:"bold"});n.x=20,n.y=95,t.addChild(n)}t.name="ui",p.stage.addChild(t)},F=function(){if(!e.current.isPaused){if(e.current.pendingEnemies.length>0&&(e.current.spawnTimer--,e.current.spawnTimer<=0)){const t=e.current.pendingEnemies.shift();t&&e.current.enemies.push(t),e.current.spawnTimer=30}if(e.current.enemies.forEach(t=>{if(!t.alive)return;let l=t.pos+t.speed;if(l>=C.length){t.alive=!1,e.current.currentLives--,X(e.current.currentLives),e.current.damageTexts.push({x:D/2,y:200,text:"-1 ❤️",timer:60,color:16711680}),e.current.currentLives<=0&&z("gameOver");return}t.pos=l}),e.current.towers.forEach(t=>{if(t.cooldown=Math.max(0,t.cooldown-1),t.cooldown===0){const l=e.current.enemies.find(g=>{if(!g.alive)return!1;const u=C[Math.floor(g.pos)],f=t.x-u.x,s=t.y-u.y;return Math.sqrt(f*f+s*s)<=t.range});if(l){const g=C[Math.floor(l.pos)],u=g.x*r+r/2,f=g.y*r+r/2;e.current.shots.push({x:t.x*r+r/2,y:t.y*r+r/2,tx:u,ty:f,damage:t.damage,target:l.id,type:t.type,effects:{}});const s=S[t.type];t.cooldown=s.cooldown/(1+t.level*.2)}}}),e.current.shots=e.current.shots.filter(t=>{const l=t.tx-t.x,g=t.ty-t.y,u=Math.sqrt(l*l+g*g);if(u<8){const s=e.current.enemies.find(m=>m.id===t.target&&m.alive);if(s){let m=Math.max(1,t.damage-s.armor);if(s.hp-=m,t.type==="ice")s.speed*=.5,setTimeout(()=>{s.alive&&(s.speed=_[s.type].speed)},2e3);else if(t.type==="poison"){let o=5;const n=setInterval(()=>{s.alive&&o>0?(s.hp-=1,o--):clearInterval(n)},500)}W(t.tx,t.ty,S[t.type].color),e.current.damageTexts.push({x:t.tx,y:t.ty,text:`-${m}`,timer:30,color:16776960}),s.hp<=0&&(s.alive=!1,e.current.currentGold+=s.bounty,e.current.currentScore+=s.bounty*10,P(e.current.currentGold),H(e.current.currentScore),W(t.tx,t.ty,16711680),e.current.damageTexts.push({x:t.tx,y:t.ty-20,text:`+${s.bounty}💰`,timer:40,color:65280}))}return!1}const f=8;return t.x+=l/u*f,t.y+=g/u*f,!0}),e.current.particles=e.current.particles.filter(t=>(t.x+=t.vx,t.y+=t.vy,t.life--,t.vx*=.98,t.vy*=.98,t.life>0)),e.current.damageTexts=e.current.damageTexts.filter(t=>(t.timer--,t.timer>0)),e.current.waveInProgress&&e.current.pendingEnemies.length===0&&e.current.enemies.every(t=>!t.alive)){e.current.waveInProgress=!1;const t=e.current.currentWave*10;e.current.currentGold+=t,e.current.currentScore+=t*5,P(e.current.currentGold),H(e.current.currentScore),e.current.damageTexts.push({x:D/2,y:150,text:`¡Oleada ${e.current.currentWave} completada! +${t}💰`,timer:120,color:65280})}}j(),v.current=requestAnimationFrame(F)},L=function(t){if(!(p.view instanceof HTMLCanvasElement))return;const l=p.view.getBoundingClientRect(),g=t.clientX-l.left,u=t.clientY-l.top,f=Math.floor(g/r),s=Math.floor(u/r);if(e.current.placing){const m=C.some(d=>d.x===f&&d.y===s),o=e.current.towers.some(d=>d.x===f&&d.y===s),n=S[e.current.selectedTowerType].cost;if(m){e.current.damageTexts.push({x:g,y:u,text:"¡No se puede construir en el camino!",timer:60,color:16711680});return}if(o){e.current.damageTexts.push({x:g,y:u,text:"¡Ya hay una torre aquí!",timer:60,color:16711680});return}if(e.current.currentGold<n){e.current.damageTexts.push({x:g,y:u,text:"¡No tienes suficiente oro!",timer:60,color:16711680});return}const a=S[e.current.selectedTowerType];e.current.towers.push({x:f,y:s,level:1,cooldown:0,type:e.current.selectedTowerType,range:a.range,damage:a.damage,special:{}}),e.current.currentGold-=n,P(e.current.currentGold),$(!1)}else{const m=e.current.towers.find(o=>o.x===f&&o.y===s);if(m)if(e.current.selectedTower===m){const o=Math.pow(2,m.level)*S[m.type].cost;e.current.currentGold>=o?(m.level++,m.damage=Math.floor(m.damage*1.5),m.range+=.2,e.current.currentGold-=o,P(e.current.currentGold),e.current.damageTexts.push({x:m.x*r+r/2,y:m.y*r,text:`¡Mejorada! Nv.${m.level}`,timer:60,color:65280})):e.current.damageTexts.push({x:g,y:u,text:`Necesitas ${o}💰`,timer:60,color:16711680})}else A(m);else A(null)}};const p=new ie({width:D,height:ee,backgroundColor:1710638});w.current&&p.view instanceof Node&&w.current.appendChild(p.view),k.current=p;let Q=!1;return b(),j(),v.current=requestAnimationFrame(F),p.view instanceof HTMLCanvasElement&&p.view.addEventListener("click",L),()=>{y!=="playing"&&y!=="paused"&&(p&&p.view instanceof HTMLCanvasElement&&p.view.removeEventListener("click",L),v.current&&(cancelAnimationFrame(v.current),v.current=null))}}},[y]),x.useEffect(()=>{if(w.current){const b=w.current.querySelector("canvas");b&&(b.style.cursor=N?"crosshair":"default")}},[N]),x.useEffect(()=>{e.current.placing=N,e.current.selectedTowerType=G,e.current.selectedTower=V},[N,G,V]),x.useEffect(()=>{if(e.current.isPaused,e.current.isPaused=y==="paused",y==="playing"&&k.current&&!v.current){let b=function(){e.current.isPaused,v.current=requestAnimationFrame(b)};console.log("Reiniciando gameLoop después de pausa"),k.current,v.current=requestAnimationFrame(b)}y!=="playing"&&y!=="paused"&&k.current&&(v.current&&(cancelAnimationFrame(v.current),v.current=null),k.current.destroy(),k.current=null,w.current&&(w.current.innerHTML=""))},[y]),x.useEffect(()=>()=>{k.current&&(k.current.destroy(),k.current=null),w.current&&(w.current.innerHTML="")},[]);const se=()=>{const b=Math.floor(e.current.currentWave*1.5)+3,M=[];for(let W=0;W<b;W++){let j="normal";e.current.currentWave>=3&&Math.random()<.3&&(j="fast"),e.current.currentWave>=5&&Math.random()<.2&&(j="tank"),e.current.currentWave>=7&&Math.random()<.1&&(j="boss");const F=_[j],L=F.hp+Math.floor(e.current.currentWave/2);M.push({id:e.current.enemyIdCounter++,pos:0,hp:L,maxHp:L,alive:!0,type:j,speed:F.speed,bounty:F.bounty+Math.floor(e.current.currentWave/3),armor:F.armor})}e.current.pendingEnemies=M,e.current.spawnTimer=0,e.current.waveInProgress=!0,e.current.currentWave++,B(e.current.currentWave)},Z=()=>{e.current.currentGold=50,e.current.currentLives=20,e.current.currentWave=1,e.current.currentScore=0,e.current.enemies=[],e.current.towers=[],e.current.shots=[],e.current.particles=[],e.current.pendingEnemies=[],e.current.waveInProgress=!1,P(50),X(20),B(1),H(0),A(null),$(!1),z("playing")},J=()=>{z(y==="paused"?"playing":"paused")},K=()=>{e.current.currentScore>O&&(oe(e.current.currentScore),localStorage.setItem("towerdefense-highscore",e.current.currentScore.toString())),z("start")};return y==="start"?c.jsx(le,{title:"🏰 Tower Defense",description:"Defiende tu reino con torres estratégicas",instructions:[{title:"Controles",items:["🖱️ Click en espacios vacíos para construir torres","🎯 Click en torres para seleccionar y mejorar","💰 Gestiona oro y vidas estratégicamente"],icon:"🎮"},{title:"Características",items:["4 tipos únicos: Cañón, Láser, Hielo y Veneno","Enemigos variados: Normales, rápidos, tanques y jefes","Efectos visuales espectaculares","Estrategia profunda de gestión de recursos"],icon:"⭐"}],highScore:O,onStart:Z,theme:{background:"linear-gradient(135deg, #1e1b4b 0%, #581c87 25%, #7c2d12 50%, #be185d 75%, #881337 100%)",primary:"linear-gradient(135deg, #7c3aed, #ec4899)",secondary:"#ec4899",accent:"linear-gradient(45deg, #a855f7, #ec4899)"}}):y==="gameOver"?c.jsx(de,{score:U,highScore:O,onRestart:Z,onMenu:K,theme:{background:"linear-gradient(135deg, #7f1d1d 0%, #ea580c 25%, #d97706 50%, #ca8a04 75%, #eab308 100%)",primary:"linear-gradient(135deg, #ea580c, #d97706)",secondary:"#eab308",accent:"linear-gradient(45deg, #fbbf24, #ea580c)"},customStats:[{label:"Mensaje",value:"Tu reino ha caído"}]}):c.jsxs("div",{className:"game-bg",children:[c.jsx("div",{className:"game-header",children:c.jsxs("div",{className:"game-header-content",children:[c.jsxs("div",{className:"game-stats",children:[c.jsxs("div",{className:"stat-item",children:[c.jsx("span",{className:"stat-icon",children:"💰"}),c.jsx("span",{className:"stat-value",children:re})]}),c.jsxs("div",{className:"stat-item",children:[c.jsx("span",{className:"stat-icon",children:"❤️"}),c.jsx("span",{className:"stat-value",children:te})]}),c.jsxs("div",{className:"stat-item",children:[c.jsx("span",{className:"stat-icon",children:"🌊"}),c.jsx("span",{className:"stat-value",children:ne})]}),c.jsxs("div",{className:"stat-item",children:[c.jsx("span",{className:"stat-icon",children:"⭐"}),c.jsx("span",{className:"stat-value",children:U.toLocaleString()})]})]}),c.jsxs("div",{className:"game-controls",children:[c.jsx("button",{onClick:se,disabled:e.current.waveInProgress,className:"control-button btn-wave",children:"🌊 Siguiente Oleada"}),c.jsx("button",{onClick:J,className:"control-button btn-pause",children:y==="paused"?"▶️ Continuar":"⏸️ Pausar"}),c.jsx("button",{onClick:K,className:"control-button btn-reset",children:"🔄 Reiniciar"})]})]})}),c.jsx("div",{className:"tower-panel",children:c.jsxs("div",{className:"tower-panel-content",children:[c.jsxs("div",{className:"tower-selection",children:[c.jsx("span",{className:"tower-label",children:"Seleccionar Torre:"}),Object.entries(S).map(([b,M])=>c.jsxs("button",{onClick:()=>{ae(b),$(!0)},className:`tower-button ${G===b&&N?"tower-button-active":"tower-button-inactive"}`,style:{borderColor:`#${M.color.toString(16).padStart(6,"0")}`},children:[b.toUpperCase()," (",M.cost,"💰)"]},b)),N&&c.jsx("button",{onClick:()=>$(!1),className:"control-button btn-reset",children:"❌ Cancelar"})]}),G&&c.jsx("div",{className:"tower-description",children:S[G].description})]})}),c.jsxs("div",{className:"game-area",style:{position:"relative"},children:[c.jsx("div",{ref:w,className:"game-canvas"}),y==="paused"&&c.jsx("div",{className:"pause-overlay",children:c.jsxs("div",{className:"pause-panel",children:[c.jsx("h2",{className:"pause-title",children:"⏸️ Pausado"}),c.jsx("button",{onClick:J,className:"btn-continue",children:"▶️ Continuar"})]})})]})]})};export{be as default};
