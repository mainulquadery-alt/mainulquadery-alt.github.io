const Arcade = {
  current:null, scores:{}, soundOn:true, activeGame:null,
  GAMES:[
    {id:'snake',name:'Neon Snake',icon:'🐍',color:'#00ff9d',glow:'rgba(0,255,157,.35)',tag:'Classic',best:true},
    {id:'g2048',name:'2048',icon:'🔢',color:'#ffe600',glow:'rgba(255,230,0,.3)',tag:'Puzzle',best:true},
    {id:'ttt',name:'Tic-Tac-Toe',icon:'⭕',color:'#ff2bd6',glow:'rgba(255,43,214,.35)',tag:'vs AI'},
    {id:'flappy',name:'Flappy Neon',icon:'🐤',color:'#ffe600',glow:'rgba(255,230,0,.3)',tag:'Arcade',best:true},
    {id:'breakout',name:'Breakout',icon:'🧱',color:'#ff7a18',glow:'rgba(255,122,24,.35)',tag:'Arcade',best:true},
    {id:'memory',name:'Memory Match',icon:'🃏',color:'#a855f7',glow:'rgba(168,85,247,.35)',tag:'Puzzle',best:true},
    {id:'pong',name:'Pong',icon:'🏓',color:'#00f0ff',glow:'rgba(0,240,255,.35)',tag:'NEW!',new:true,best:true},
    {id:'reaction',name:'Reaction Rush',icon:'⚡',color:'#00f0ff',glow:'rgba(0,240,255,.35)',tag:'NEW!',new:true,best:true},
  ],

  init(){
    this.renderHome();
  },
  renderHome(){
    const grid=document.getElementById('game-grid');
    grid.innerHTML=this.GAMES.map(g=>{
      const best=this.scores[g.id]!=null?`<div class="card-best" style="display:block;color:${g.color}">★ ${this.scores[g.id]}</div>`:'';
      const badge=g.new?`<div class="card-badge" style="display:block">NEW</div>`:'';
      return `<div class="game-card" style="--card-color:${g.color};--card-glow:${g.glow}" onclick="Arcade.launch('${g.id}')">
        ${badge}${best}
        <span class="card-icon" style="--card-glow:${g.glow}">${g.icon}</span>
        <div class="card-name" style="color:${g.color}">${g.name}</div>
        <div class="card-tag">${g.tag}</div>
      </div>`;
    }).join('');
    this.renderLeaderboard();
  },
  renderLeaderboard(){
    const lb=document.getElementById('leaderboard');
    const entries=Object.keys(this.scores);
    if(!entries.length){lb.innerHTML='<h3>🏆 Leaderboard</h3><div style="color:#778;font-size:.8rem">No scores yet — play a game to get on the board!</div>';return;}
    lb.innerHTML='<h3>🏆 Your Best Scores</h3>'+entries.map(id=>{
      const g=this.GAMES.find(x=>x.id===id);return g?`<div class="lb-row"><span class="lb-game">${g.icon} ${g.name}</span><span class="lb-score">${this.scores[id]}</span></div>`:'';
    }).join('');
  },
  saveScore(id,val){
    if(this.scores[id]==null||val>this.scores[id]){this.scores[id]=val;this.toast('🎉 New high score: '+val);Sfx.play('win');}
    this.renderLeaderboard();
  },
  goHome(){
    if(this.activeGame&&this.activeGame.stop)this.activeGame.stop();
    this.activeGame=null;this.current=null;
    document.getElementById('home-screen').classList.remove('hidden');
    document.getElementById('game-screen').style.display='none';
    document.getElementById('back-btn').style.display='none';
    document.getElementById('total-games').style.display='';
    this.renderHome();
  },
  launch(id){
    const g=this.GAMES.find(x=>x.id===id);if(!g)return;
    this.current=id;
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('game-screen').style.display='';
    document.getElementById('back-btn').style.display='grid';
    document.getElementById('total-games').style.display='none';
    const title=document.getElementById('game-title');
    title.innerHTML=`<span style="color:${g.color}" class="glow-text">${g.icon}</span> ${g.name}`;
    const body=document.getElementById('game-body');
    const controls=document.getElementById('game-controls');
    body.innerHTML='';controls.innerHTML='';
    const stats=document.getElementById('game-stats');
    stats.innerHTML='';
    try{this.activeGame=Games[id].mount(body,controls,stats,g,this);}catch(e){body.innerHTML='<p style="color:#f44">Error loading game</p>';console.error(e);}
  },
  toggleSound(){this.soundOn=!this.soundOn;document.getElementById('sound-btn').textContent=this.soundOn?'🔊':'🔇';},
  toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(this._tt);this._tt=setTimeout(()=>t.classList.remove('show'),2200);}
};

/* ── Sound engine ── */
const Sfx={
  ctx:null,
  ensure(){if(!Arcade.soundOn)return null;if(!this.ctx)this.ctx=new (window.AudioContext||window.webkitAudioContext)();return this.ctx;},
  tone(freq,dur,type,vol){const c=this.ensure();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type||'square';o.frequency.value=freq;g.gain.value=vol||.15;o.connect(g);g.connect(c.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);o.stop(c.currentTime+dur);},
  play(t){
    if(!Arcade.soundOn)return;
    switch(t){
      case'eat':this.tone(660,.08,'square',.12);break;
      case'merge':this.tone(440,.1,'sine',.15);setTimeout(()=>this.tone(660,.1,'sine',.15),60);break;
      case'hit':this.tone(220,.06,'square',.1);break;
      case'score':this.tone(880,.1,'sine',.12);break;
      case'win':this.tone(523,.1,'sine',.15);setTimeout(()=>this.tone(659,.1),100);setTimeout(()=>this.tone(784,.15),200);break;
      case'lose':this.tone(300,.2,'sawtooth',.12);setTimeout(()=>this.tone(200,.3,'sawtooth',.12),150);break;
      case'click':this.tone(800,.04,'square',.08);break;
      case'flip':this.tone(500,.05,'triangle',.1);break;
      case'go':this.tone(1200,.15,'sine',.1);break;
    }
  }
};

/* helper for canvas DPI */
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;c.style.maxWidth='100%';c.style.height='auto';return c;}

const Games={};

/* ══════════════ SNAKE ══════════════ */
Games.snake={
  mount(body,controls,stats,g,arc){
    const W=480,H=480,CELL=20,COLS=W/CELL,ROWS=H/CELL;
    const cv=mkCanvas(W,H);body.appendChild(cv);
    const ctx=cv.getContext('2d');
    let snake,dir,food,score,loop,spd,alive,tick;
    stats.innerHTML=`<div class="stat"><div class="stat-label">Score</div><div class="stat-val" id="s-score">0</div></div>
      <div class="stat"><div class="stat-label">Best</div><div class="stat-val" id="s-best">${arc.scores.snake||0}</div></div>`;
    controls.innerHTML=`<button class="btn btn-primary" id="s-start">▶ Start</button><div class="hint">Arrow keys or WASD</div>`;
    function reset(){snake=[{x:5,y:9},{x:4,y:9},{x:3,y:9}];dir={x:1,y:0};score=0;spd=95;alive=true;placeFood();upd();}
    function placeFood(){do{food={x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)};}while(snake.some(s=>s.x===food.x&&s.y===food.y));}
    function upd(){document.getElementById('s-score').textContent=score;}
    function draw(){
      ctx.fillStyle='#0a0a18';ctx.fillRect(0,0,W,H);
      // food glow
      ctx.shadowBlur=12;ctx.shadowColor=g.color;ctx.fillStyle=g.color;
      ctx.beginPath();ctx.arc(food.x*CELL+CELL/2,food.y*CELL+CELL/2,CELL/2-2,0,7);ctx.fill();ctx.shadowBlur=0;
      // snake
      snake.forEach((s,i)=>{
        ctx.fillStyle=i===0?'#fff':g.color;ctx.shadowBlur=i===0?10:6;ctx.shadowColor=g.color;
        ctx.fillRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2);
      });ctx.shadowBlur=0;
    }
    function step(){
      if(!alive)return;
      const h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
      if(h.x<0||h.x>=COLS||h.y<0||h.y>=ROWS||snake.some(s=>s.x===h.x&&s.y===h.y)){alive=false;Sfx.play('lose');arc.saveScore('snake',score);draw();ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle=g.color;ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillText('GAME OVER',W/2,H/2-10);ctx.fillText('Score: '+score,W/2,H/2+18);clearInterval(loop);return;}
      snake.unshift(h);
      if(h.x===food.x&&h.y===food.y){score+=10;spd=Math.max(45,spd-5);Sfx.play('eat');placeFood();upd();clearInterval(loop);loop=setInterval(step,spd);}
      else snake.pop();
      draw();
    }
    function start(){reset();clearInterval(loop);loop=setInterval(step,spd);Sfx.play('go');}
    document.getElementById('s-start').onclick=start;
    const kd=e=>{const k=e.key.toLowerCase();const m={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};if(m[k]){const[dx,dy]=m[k];if(dx!==-dir.x||dy!==-dir.y){dir={x:dx,y:dy};}e.preventDefault();}};
    document.addEventListener('keydown',kd);
    reset();draw();
    return{stop(){clearInterval(loop);document.removeEventListener('keydown',kd);}};
  }
};

/* ══════════════ 2048 ══════════════ */
Games.g2048={
  mount(body,controls,stats,g,arc){
    stats.innerHTML=`<div class="stat"><div class="stat-label">Score</div><div class="stat-val" id="f-score">0</div></div>
      <div class="stat"><div class="stat-label">Best</div><div class="stat-val" id="f-best">${arc.scores.g2048||0}</div></div>`;
    const grid=document.createElement('div');grid.className='grid-2048';body.appendChild(grid);
    controls.innerHTML=`<button class="btn btn-primary" id="f-new">↻ New Game</button><div class="hint">Arrow keys / WASD to slide</div>`;
    const TC={'2':'#264','4':'#396','8':'#e8833a','16':'#e8612a','32':'#e83a2a','64':'#e81a2a','128':'#ffe600','256':'#ffcf00','512':'#ffa500','1024':'#00f0ff','2048':'#ff2bd6'};
    let b,score;
    function reset(){b=Array(16).fill(0);score=0;add();add();render();}
    function add(){const e=[];b.forEach((v,i)=>{if(!v)e.push(i);});if(!e.length)return;const i=e[Math.floor(Math.random()*e.length)];b[i]=Math.random()<.9?2:4;}
    function render(){
      grid.innerHTML=b.map((v,i)=>{
        const c=TC[v]||'#222';const fs=v>=1024?'1rem':v>=128?'1.2rem':'1.4rem';
        return `<div class="tile-2048" style="background:${v?c:'#1a1a30'};box-shadow:${v?'0 0 12px '+c+'66':'none'};font-size:${fs};color:${v<=4?'#aab':'#fff'}">${v||''}</div>`;
      }).join('');
      document.getElementById('f-score').textContent=score;
    }
    function slide(row){let a=row.filter(x=>x);for(let i=0;i<a.length-1;i++){if(a[i]===a[i+1]){a[i]*=2;score+=a[i];a.splice(i+1,1);Sfx.play('merge');}}while(a.length<4)a.push(0);return a;}
    function move(dir){
      let moved=false;const old=b.slice();
      const get=(r,c)=>dir==='h'?b[r*4+c]:b[c*4+r];
      const set=(r,c,v)=>{if(dir==='h')b[r*4+c]=v;else b[c*4+r]=v;};
      for(let r=0;r<4;r++){let row=[get(r,0),get(r,1),get(r,2),get(r,3)];
        if(dir==='l'||dir==='u')row=slide(row);else row=slide(row.reverse()).reverse();
        for(let c=0;c<4;c++)set(r,c,row[c]);}
      if(b.some((v,i)=>v!==old[i])){add();render();if(!b.includes(0)&&!canMove())end();}
    }
    function canMove(){for(let r=0;r<4;r++)for(let c=0;c<4;c++){if(!b[r*4+c])return true;if(c<3&&b[r*4+c]===b[r*4+c+1])return true;if(r<3&&b[r*4+c]===b[(r+1)*4+c])return true;}return false;}
    function end(){Sfx.play('lose');arc.saveScore('g2048',score);setTimeout(()=>arc.toast('Game Over! Score: '+score),100);}
    const kd=e=>{const k=e.key.toLowerCase();const m={arrowleft:'l',a:'l',arrowright:'r',d:'r',arrowup:'u',w:'u',arrowdown:'d',s:'d'};if(m[k]){move(m[k]);e.preventDefault();}};
    document.addEventListener('keydown',kd);
    document.getElementById('f-new').onclick=()=>{Sfx.play('click');reset();};
    reset();
    return{stop(){document.removeEventListener('keydown',kd);}};
  }
};

/* ══════════════ TIC-TAC-TOE ══════════════ */
Games.ttt={
  mount(body,controls,stats,g,arc){
    stats.innerHTML=`<div class="stat"><div class="stat-label">You</div><div class="stat-val" id="t-you">0</div></div>
      <div class="stat"><div class="stat-label">AI</div><div class="stat-val" id="t-ai" style="color:var(--neon-magenta)">0</div></div>
      <div class="stat"><div class="stat-label">Draws</div><div class="stat-val" id="t-draw" style="color:#889">0</div></div>`;
    const board=document.createElement('div');board.className='ttt-board';body.appendChild(board);
    controls.innerHTML=`<button class="btn btn-primary" id="t-new">↻ New Round</button><div class="hint">You are X · AI is O</div>`;
    let b,scores={you:0,ai:0,draw:0},over;
    const WINS=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    function reset(){b=Array(9).fill('');over=false;render();}
    function render(){
      board.innerHTML=b.map((v,i)=>`<div class="ttt-cell ${v==='X'?'x':v==='O'?'o':''}" onclick="Arcade._ttt(${i})">${v}</div>`).join('');
    }
    function check(br){for(const w of WINS){if(br[w[0]]&&br[w[0]]===br[w[1]]&&br[w[1]]===br[w[2]])return br[w[0]];}return br.includes('')?null:'draw';}
    function minimax(br,player){
      const w=check(br);
      if(w==='X')return{score:10};if(w==='O')return{score:-10};if(w==='draw')return{score:0};
      let best=player==='X'?{score:-99}:{score:99};
      for(let i=0;i<9;i++){if(!br[i]){br[i]=player;const r=minimax(br,player==='X'?'O':'X');br[i]='';r.move=i;
        if(player==='X'){if(r.score>best.score)best=r;}else{if(r.score<best.score)best=r;}}}
      return best;
    }
    function playerMove(i){if(b[i]||over)return;b[i]='X';Sfx.play('click');render();const r=check(b);if(r){end(r);return;}setTimeout(aiMove,300);}
    function aiMove(){if(over)return;const m=minimax(b.slice(),'O').move;b[m]='O';Sfx.play('hit');render();const r=check(b);if(r)end(r);}
    function end(r){
      over=true;
      if(r==='X'){scores.you++;Sfx.play('win');arc.toast('🎉 You win!');}
      else if(r==='O'){scores.ai++;Sfx.play('lose');arc.toast('🤖 AI wins!');}
      else{scores.draw++;arc.toast('🤝 Draw!');}
      document.getElementById('t-you').textContent=scores.you;
      document.getElementById('t-ai').textContent=scores.ai;
      document.getElementById('t-draw').textContent=scores.draw;
      if(r!=='draw'){const w=WINS.find(w=>b[w[0]]===r&&b[w[1]]===r&&b[w[2]]===r);w.forEach(i=>{const c=board.children[i];c.style.background=r==='X'?'rgba(0,255,157,.15)':'rgba(255,43,214,.15)';});}
    }
    Arcade._ttt=playerMove;
    document.getElementById('t-new').onclick=()=>{Sfx.play('click');reset();};
    reset();
    return{stop(){delete Arcade._ttt;}};
  }
};

/* ══════════════ FLAPPY ══════════════ */
Games.flappy={
  mount(body,controls,stats,g,arc){
    const W=460,H=560;const cv=mkCanvas(W,H);body.appendChild(cv);const ctx=cv.getContext('2d');
    stats.innerHTML=`<div class="stat"><div class="stat-label">Score</div><div class="stat-val" id="p-score">0</div></div>
      <div class="stat"><div class="stat-label">Best</div><div class="stat-val" id="p-best">${arc.scores.flappy||0}</div></div>`;
    controls.innerHTML=`<button class="btn btn-primary" id="p-start">▶ Start</button><div class="hint">Click / Tap / Space to flap</div>`;
    let by,vy,pipes,score,loop,running,gap=125,PW=52,SPD=3.0;
    function reset(){by=H/2;vy=0;pipes=[];score=0;running=false;drawIdle();}
    function drawIdle(){ctx.fillStyle='#0a0a18';ctx.fillRect(0,0,W,H);ctx.fillStyle=g.color;ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText('Press Start',W/2,H/2-20);ctx.fillText('Tap to flap',W/2,H/2+10);}
    function spawn(){const top=50+Math.random()*(H-gap-100);pipes.push({x:W,top,bottom:top+gap,passed:false});}
    function draw(){
      ctx.fillStyle='#0a0a18';ctx.fillRect(0,0,W,H);
      // pipes
      ctx.shadowBlur=10;ctx.shadowColor='#00ff9d';ctx.fillStyle='#1a4';
      pipes.forEach(p=>{ctx.fillRect(p.x,0,PW,p.top);ctx.fillRect(p.x,p.bottom,PW,H-p.bottom);});
      ctx.shadowBlur=0;
      // bird
      ctx.shadowBlur=14;ctx.shadowColor=g.color;ctx.fillStyle=g.color;
      ctx.beginPath();ctx.arc(W/2,by,12,0,7);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#000';ctx.beginPath();ctx.arc(W/2+4,by-3,2,0,7);ctx.fill();
      // score
      ctx.fillStyle='#fff';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillText(score,W/2,40);
    }
    function step(){
      vy+=.5;by+=vy;
      if(pipes.length===0||pipes[pipes.length-1].x<W-160)spawn();
      pipes.forEach(p=>p.x-=SPD);
      pipes=pipes.filter(p=>p.x>-PW);
      pipes.forEach(p=>{if(!p.passed&&p.x+PW<W/2){p.passed=true;score++;Sfx.play('score');document.getElementById('p-score').textContent=score;}});
      if(by<0||by>H-12||pipes.some(p=>W/2+12>p.x&&W/2-12<p.x+PW&&(by-12<p.top||by+12>p.bottom))){running=false;Sfx.play('lose');arc.saveScore('flappy',score);clearInterval(loop);draw();ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle=g.color;ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillText('GAME OVER',W/2,H/2-10);ctx.fillText('Score: '+score,W/2,H/2+18);return;}
      draw();
    }
    function flap(){if(!running)return; vy=-8;Sfx.play('hit');}
    function start(){reset();running=true; vy=-8;Sfx.play('go');clearInterval(loop);loop=setInterval(step,18);}
    cv.onclick=flap;
    const kd=e=>{if(e.key===' '){flap();e.preventDefault();}};
    document.addEventListener('keydown',kd);
    document.getElementById('p-start').onclick=start;
    reset();
    return{stop(){clearInterval(loop);document.removeEventListener('keydown',kd);}};
  }
};

/* ══════════════ BREAKOUT ══════════════ */
Games.breakout={
  mount(body,controls,stats,g,arc){
    const W=480,H=480;const cv=mkCanvas(W,H);body.appendChild(cv);const ctx=cv.getContext('2d');
    stats.innerHTML=`<div class="stat"><div class="stat-label">Score</div><div class="stat-val" id="b-score">0</div></div>
      <div class="stat"><div class="stat-label">Lives</div><div class="stat-val" id="b-lives">3</div></div>`;
    controls.innerHTML=`<button class="btn btn-primary" id="b-start">▶ Start</button><div class="hint">Move mouse over canvas · ← →</div>`;
    let paddle,bx,by,bdx,bdy,bricks,score,lives,loop,running;
    const BW=50,BH=16,ROWS=5,COLS=9,BW2=46;
    function reset(){paddle={x:W/2-45,w:90};bx=W/2;by=H-50;bdx=4.5;bdy=-4.5;score=0;lives=3;bricks=[];const cols=['#ff2bd6','#a855f7','#00f0ff','#00ff9d','#ffe600'];
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)bricks.push({x:c*(BW2+4)+10,y:r*(BH+4)+20,w:BW2,h:BH,color:cols[r],alive:true});upd();}
    function upd(){document.getElementById('b-score').textContent=score;document.getElementById('b-lives').textContent=lives;}
    function draw(){
      ctx.fillStyle='#0a0a18';ctx.fillRect(0,0,W,H);
      bricks.forEach(b=>{if(!b.alive)return;ctx.shadowBlur=8;ctx.shadowColor=b.color;ctx.fillStyle=b.color;ctx.fillRect(b.x,b.y,b.w,b.h);});ctx.shadowBlur=0;
      ctx.fillStyle='#00f0ff';ctx.shadowBlur=12;ctx.shadowColor='#00f0ff';ctx.fillRect(paddle.x,H-14,paddle.w,8);ctx.shadowBlur=0;
      ctx.fillStyle='#fff';ctx.shadowBlur=10;ctx.shadowColor='#fff';ctx.beginPath();ctx.arc(bx,by,6,0,7);ctx.fill();ctx.shadowBlur=0;
    }
    function step(){
      bx+=bdx;by+=bdy;
      if(bx<6||bx>W-6)bdx*=-1;
      if(by<6)bdy*=-1;
      if(by>H-6){lives--;upd();Sfx.play('lose');if(lives<=0){running=false;clearInterval(loop);arc.saveScore('breakout',score);draw();ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle=g.color;ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillText('GAME OVER',W/2,H/2-10);ctx.fillText('Score: '+score,W/2,H/2+18);return;}bx=W/2;by=H-50;bdx=4.5;bdy=-4.5;return;}
      if(by>H-20&&by<H-6&&bx>paddle.x&&bx<paddle.x+paddle.w){bdy=-Math.abs(bdy)-.1;bdx+=(bx-(paddle.x+paddle.w/2))*.03;Sfx.play('hit');}
      bricks.forEach(b=>{if(b.alive&&bx>b.x&&bx<b.x+b.w&&by>b.y&&by<b.y+b.h){b.alive=false;bdy*=-1;score+=10;Sfx.play('score');upd();}});
      if(bricks.every(b=>!b.alive)){running=false;clearInterval(loop);Sfx.play('win');arc.saveScore('breakout',score);arc.toast('🎉 You cleared all bricks!');reset();}
      draw();
    }
    cv.onmousemove=e=>{const r=cv.getBoundingClientRect();paddle.x=Math.max(0,Math.min(W-paddle.w,(e.clientX-r.left)*(W/r.width)-paddle.w/2));};
    const kd=e=>{if(e.key==='ArrowLeft')paddle.x=Math.max(0,paddle.x-24);if(e.key==='ArrowRight')paddle.x=Math.min(W-paddle.w,paddle.x+24);};
    document.addEventListener('keydown',kd);
    function start(){reset();running=true;Sfx.play('go');clearInterval(loop);loop=setInterval(step,13);}
    document.getElementById('b-start').onclick=start;
    reset();draw();
    return{stop(){clearInterval(loop);document.removeEventListener('keydown',kd);}};
  }
};

/* ══════════════ MEMORY MATCH ══════════════ */
Games.memory={
  mount(body,controls,stats,g,arc){
    stats.innerHTML=`<div class="stat"><div class="stat-label">Moves</div><div class="stat-val" id="m-moves">0</div></div>
      <div class="stat"><div class="stat-label">Pairs</div><div class="stat-val" id="m-pairs">0/8</div></div>`;
    const grid=document.createElement('div');grid.className='mem-grid';body.appendChild(grid);
    controls.innerHTML=`<button class="btn btn-primary" id="m-new">↻ New Game</button><div class="hint">Find all 8 matching pairs</div>`;
    const EMOJIS=['🎮','👾','🚀','⚡','🌟','🎲','🔥','💎'];
    let cards,flipped,moves,pairs,lock;
    function reset(){const pool=[...EMOJIS,...EMOJIS].sort(()=>Math.random()-.5);cards=pool.map((e,i)=>({i,e,flipped:false,matched:false}));flipped=[];moves=0;pairs=0;lock=false;render();}
    function render(){
      grid.innerHTML=cards.map(c=>`<div class="mem-card ${c.flipped?'flipped':''}" onclick="Arcade._mem(${c.i})" style="${c.matched?'opacity:.35':''}">
        <div class="mem-inner"><div class="mem-face mem-front"></div><div class="mem-face mem-back">${c.flipped||c.matched?c.e:''}</div></div></div>`).join('');
      document.getElementById('m-moves').textContent=moves;
      document.getElementById('m-pairs').textContent=pairs+'/8';
    }
    function click(i){if(lock)return;const c=cards[i];if(c.flipped||c.matched)return;c.flipped=true;Sfx.play('flip');flipped.push(c);render();
      if(flipped.length===2){lock=true;moves++;setTimeout(()=>{
        if(flipped[0].e===flipped[1].e){flipped.forEach(f=>f.matched=true);pairs++;Sfx.play('score');if(pairs===8){Sfx.play('win');arc.saveScore('memory',Math.max(0,100-moves*3));arc.toast('🎉 You won in '+moves+' moves!');}}
        else{flipped.forEach(f=>f.flipped=false);Sfx.play('lose');}
        flipped=[];lock=false;render();
      },650);}}
    Arcade._mem=click;
    document.getElementById('m-new').onclick=()=>{Sfx.play('click');reset();};
    reset();
    return{stop(){delete Arcade._mem;}};
  }
};

/* ══════════════ PONG (NEW) ══════════════ */
Games.pong={
  mount(body,controls,stats,g,arc){
    const W=560,H=400;const cv=mkCanvas(W,H);body.appendChild(cv);const ctx=cv.getContext('2d');
    stats.innerHTML=`<div class="stat"><div class="stat-label">You</div><div class="stat-val" id="pg-you">0</div></div>
      <div class="stat"><div class="stat-label">CPU</div><div class="stat-val" id="pg-cpu" style="color:var(--neon-magenta)">0</div></div>`;
    controls.innerHTML=`<button class="btn btn-primary" id="pg-start">▶ Start</button><div class="hint">Move mouse up/down · first to 5 wins</div>`;
    const PH=56,PW=8;let py,ay,bx,by,bdx,bdy,score,loop,running,sp;
    function reset(){py=ay=H/2-PH/2;bx=W/2;by=H/2;sp=5.5;bdx=Math.random()<.5?sp:-sp;bdy=(Math.random()-.5)*5;score={you:0,cpu:0};upd();}
    function upd(){document.getElementById('pg-you').textContent=score.you;document.getElementById('pg-cpu').textContent=score.cpu;}
    function draw(){
      ctx.fillStyle='#0a0a18';ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='rgba(255,255,255,.1)';ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);
      ctx.shadowBlur=12;ctx.shadowColor='#00f0ff';ctx.fillStyle='#00f0ff';ctx.fillRect(8,py,PW,PH);
      ctx.shadowColor='#ff2bd6';ctx.fillStyle='#ff2bd6';ctx.fillRect(W-8-PW,ay,PW,PH);
      ctx.shadowColor='#fff';ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,6,0,7);ctx.fill();ctx.shadowBlur=0;
    }
    function step(){
      bx+=bdx;by+=bdy;
      if(by<6||by>H-6)bdy*=-1;
      // player paddle
      if(bx<8+PW+6&&bx>8&&by>py&&by<py+PH){bdx=Math.abs(bdx)+.2;bdy+=(by-(py+PH/2))*.08;Sfx.play('hit');}
      // ai paddle
      const ac=ay+PH/2;if(bx>W-40){ay+=Math.max(-5.5,Math.min(5.5,(by-ac)*.14));}ay=Math.max(0,Math.min(H-PH,ay));
      if(bx>W-8-PW-6&&bx<W-8&&by>ay&&by<ay+PH){bdx=-(Math.abs(bdx)+.2);bdy+=(by-(ay+PH/2))*.08;Sfx.play('hit');}
      if(bx<0){score.cpu++;upd();Sfx.play('lose');check();}
      if(bx>W){score.you++;upd();Sfx.play('score');check();}
      if(Math.abs(bdx)>9)bdx=bdx>0?9:-9;
      if(!running)return;draw();
    }
    function check(){
      if(score.you>=5){running=false;clearInterval(loop);Sfx.play('win');arc.saveScore('pong',score.you*10);arc.toast('🎉 You win Pong!');draw();ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle=g.color;ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillText('YOU WIN!',W/2,H/2);return;}
      if(score.cpu>=5){running=false;clearInterval(loop);Sfx.play('lose');arc.toast('CPU wins Pong!');draw();ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ff2bd6';ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillText('CPU WINS',W/2,H/2);return;}
      bx=W/2;by=H/2;bdx=score.cpu>score.you?sp:-sp;bdy=(Math.random()-.5)*5;
    }
    cv.onmousemove=e=>{const r=cv.getBoundingClientRect();py=Math.max(0,Math.min(H-PH,(e.clientY-r.top)*(H/r.height)-PH/2));};
    function start(){reset();running=true;Sfx.play('go');clearInterval(loop);loop=setInterval(step,13);}
    document.getElementById('pg-start').onclick=start;
    reset();draw();
    return{stop(){clearInterval(loop);}};
  }
};

/* ══════════════ REACTION RUSH (NEW) ══════════════ */
Games.reaction={
  mount(body,controls,stats,g,arc){
    stats.innerHTML=`<div class="stat"><div class="stat-label">Best ms</div><div class="stat-val" id="r-best">${arc.scores.reaction||'—'}</div></div>
      <div class="stat"><div class="stat-label">Last</div><div class="stat-val" id="r-last">—</div></div>`;
    const area=document.createElement('div');area.className='reaction-area';body.appendChild(area);
    controls.innerHTML=`<div class="hint">Click when it turns green · lower ms = faster</div>`;
    let state='idle',startT,timeout;
    const RED='#e83a2a',GREEN='#00ff9d',BLUE='#0f0f24',CYAN='#00f0ff';
    function setBg(c,txt){area.style.background=c;area.style.borderColor=c==='red'?RED:c;area.innerHTML=txt||'';}
    function arm(){state='wait';setBg(RED,'Wait for green…');timeout=setTimeout(()=>{state='go';startT=performance.now();setBg(GREEN,'CLICK NOW!');Sfx.play('go');},1200+Math.random()*2500);}
    function click(){
      if(state==='idle'||state==='done'){state='wait';arm();return;}
      if(state==='wait'){clearTimeout(timeout);state='done';setBg(RED,'Too early! Click to retry');Sfx.play('lose');return;}
      if(state==='go'){const ms=Math.round(performance.now()-startT);state='done';document.getElementById('r-last').textContent=ms;
        const best=document.getElementById('r-best');if(arc.scores.reaction==null||ms<arc.scores.reaction){arc.scores.reaction=ms;best.textContent=ms;arc.saveScore('reaction',ms);Sfx.play('win');}
        else Sfx.play('score');
        setBg(CYAN,ms+' ms<br><span style="font-size:.8rem;opacity:.7">Click to try again</span>');}
    }
    area.onclick=click;
    setBg(BLUE,'Click to start');
    return{stop(){clearTimeout(timeout);}};
  }
};

Arcade.init();
