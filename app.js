var C = window.CARDS; var Q = window.QUIZZES;

/* ==================== 间隔重复 ==================== */
var INT=[0,180000,900000,5400000,86400000,172800000,345600000,604800000,1296000000,2592000000];
var LVL_NAME=['新学','速记','巩固','短期','隔日','短周','中周','长周','月检','熟知'];
var LVL_CLR=['#bbb','#e08080','#d89040','#d4a830','#50a868','#4890b8','#6878b8','#7868c0','#c08040','#b068a8'];

/* ==================== 状态 ==================== */
var R={};try{R=JSON.parse(localStorage.getItem('w3_r')||'{}');}catch(e){R={};}
var stats={t:0,c:0};try{stats=JSON.parse(localStorage.getItem('w3_s')||'{"t":0,"c":0}');}catch(e){stats={t:0,c:0};}
var lQueue=[],lPos=0,lRev=false,lFilter='all',lLibTab='all';
var sNewCount=0,sNewList=[];
var revealed=false;

/* ==================== 工具 ==================== */
function save(){localStorage.setItem('w3_r',JSON.stringify(R));localStorage.setItem('w3_s',JSON.stringify(stats));}
function ival(l){return l<INT.length?INT[l]:INT[INT.length-1];}
function lv(i){return R[i]?R[i].l:0;}
function done(i){return lv(i)>0;}
function nextT(i){return R[i]?R[i].n:0;}
function now(){return Date.now();}
function dueCount(){var c=0,n=now();for(var i=0;i<C.length;i++)if(done(i)&&nextT(i)<=n)c++;return c;}
function newCount(){var c=0;for(var i=0;i<C.length;i++)if(!done(i))c++;return c;}
function mastered(){var m={};C.forEach(function(c,i){if(done(i)){if(!m[c.c])m[c.c]=0;m[c.c]++;}});var r=[];for(var k in m){var total=C.filter(function(x){return x.c===k}).length;if(m[k]/total>=0.8)r.push(k);}return r;}
function shuf(a){for(var i=a.length-1;i>0;i--){var j=Math.random()*i+1|0;var t=a[i];a[i]=a[j];a[j]=t;}}

/* ==================== 导航 ==================== */
function nav(s){
  document.querySelectorAll('.sc').forEach(function(e){e.classList.remove('on')});
  document.getElementById('s-'+s).classList.add('on');
  document.querySelectorAll('.ni').forEach(function(e){e.classList.toggle('on',e.dataset.s===s)});
  if(s==='home')updateHome();
  if(s==='lib')renderLib();
  if(s==='prof')renderProf();
}

/* ==================== 首页 ==================== */
function updateHome(){
  var dc=dueCount(),nc=newCount(),tc=dc+nc,learned=C.length-nc;
  document.getElementById('hNum').textContent=learned;
  document.getElementById('hDen').textContent='/ '+C.length+' 张';
  document.getElementById('hBar').style.width=Math.round(learned/C.length*100)+'%';
  var mc=mastered();
  var _coreChars={};C.forEach(function(c){_coreChars[c.c]=1;});var _coreTotal=Object.keys(_coreChars).length;
  document.getElementById('hSub').textContent='已掌握 '+mc.length+'/'+_coreTotal+' 核心字';
  var fil=document.getElementById('hFil');
  fil.innerHTML='<div class="fil-i'+(lFilter==='all'?' on':'')+'" onclick="setFilter(\'all\',this)">全部 '+tc+'</div>'
    +'<div class="fil-i'+(lFilter==='due'?' on':'')+'" onclick="setFilter(\'due\',this)">待复习 '+dc+'</div>'
    +'<div class="fil-i'+(lFilter==='new'?' on':'')+'" onclick="setFilter(\'new\',this)">新词 '+nc+'</div>';
  var actS=document.getElementById('actLearnS');
  if(tc===0)actS.textContent='全部掌握！';
  else if(dc===0)actS.textContent=nc+' 张新词待学';
  else if(nc===0)actS.textContent=dc+' 张待复习';
  else actS.textContent=dc+' 复习 + '+nc+' 新词';
}
function setFilter(f,el){lFilter=f;document.querySelectorAll('#hFil .fil-i').forEach(function(e){e.classList.remove('on')});if(el)el.classList.add('on');}

/* ==================== 学习 ==================== */
function buildQueue(){
  var q=[],n=now();
  if(lFilter==='new'){for(var i=0;i<C.length;i++)if(!done(i))q.push(i);}
  else if(lFilter==='due'){for(var i=0;i<C.length;i++)if(done(i)&&nextT(i)<=n)q.push(i);}
  else{
    var rev=[],nw=[];
    for(var i=0;i<C.length;i++){if(done(i)&&nextT(i)<=n)rev.push(i);else if(!done(i))nw.push(i);}
    shuf(rev);shuf(nw);var re,ni;re=ni=0;while(re<rev.length||ni<nw.length){if(re<rev.length)q.push(rev[re++]);if(re<rev.length)q.push(rev[re++]);if(re<rev.length)q.push(rev[re++]);if(ni<nw.length)q.push(nw[ni++]);}
  }
  return q;
}
function startLearn(){
  lQueue=buildQueue();lPos=0;sNewCount=0;sNewList=[];
  nav('learn');showCard();
}
function showCard(){
  var wrap=document.getElementById('fcWrap');
  var bar=document.getElementById('lp');
  var ct=document.getElementById('lc');
  revealed=false;
  bar.style.width=Math.round(lPos/Math.max(lQueue.length,1)*100)+'%';
  ct.textContent=(lPos+1)+'/'+lQueue.length;
  if(lPos>=lQueue.length){
    var dc=dueCount(),nc=newCount();
    var msg=dc+nc===0?'<div class="done-t">全部掌握了！</div><div class="done-s">'+C.length+' 张含义卡全部通过</div>'
      :'<div class="done-t">本轮学习完成</div><div class="done-s">'+(dc>0?dc+' 张待复习':'')+(dc>0&&nc>0?'，':'')+(nc>0?nc+' 张新词':'')+'等待下次学习</div>';
    wrap.innerHTML='<div class="done"><div class="done-i">🎉</div>'+msg+'<button class="btn btn-p" style="margin-top:16px" onclick="startQuiz()">去测验</button><button class="btn btn-g" style="margin-top:10px" onclick="nav(\'home\')">回到首页</button></div>';
    return;
  }
  var idx=lQueue[lPos],w=C[idx],level=lv(idx);
  var isRev=level>0&&nextT(idx)<=now();
  if(isRev)lRev=true;else lRev=false;
  var tagLv=level>0?'<span class="lv-badge lv-'+Math.min(level,7)+'">'+LVL_NAME[Math.min(level,9)]+'</span>':'';
  var tagLabel=isRev?'复习':'新学';
  var oh='';
  if(w.o&&w.o.length){
    oh='<div class="fc-others"><div class="fc-others-t" onclick="toggleOthers(this)">'+w.c+' 的其他用法 ('+w.o.length+')</div><div class="fc-others-list" id="ol">';
    w.o.forEach(function(o){oh+='<div class="fc-others-item">'+o+'</div>';});
    oh+='</div></div>';
  }
  wrap.innerHTML=
    '<div class="fc-tag"><span>'+w.t+' · '+tagLabel+'</span>'+tagLv+'</div>'
    +'<div class="fc-char-box" onclick="doReveal()"><div class="fc-char">'+w.c+'</div></div>'
    +'<div class="fc-sent">'+w.s+'</div>'
    +'<div class="fc-src">—— '+w.r+'</div>'
    +'<div class="fc-reveal" onclick="doReveal()">'
      +'<div class="fc-hint" id="hintBox"><div class="fc-hint-icon">👆</div><div class="fc-hint-label">点击翻转看含义</div></div>'
      +'<div class="fc-meaning" id="mBox">'
        +'<div class="fc-m-badge">'+(level===0?'新含义':(isRev?'第 '+level+' 轮复习':'复习'))+'</div>'
        +'<div class="fc-m-title">'+w.m+'</div>'
        +'<div class="fc-m-tip">'+w.p+'</div>'
      +'</div>'
    +'</div>'
    +'<div class="fc-btns" id="fcBtns">'
      +'<button class="fc-btn fc-btn-grey" onclick="skipCard()">还不熟</button>'
      +'<button class="fc-btn fc-btn-ok" onclick="markOK()">记住了</button>'
    +'</div>'+oh;
}
function doReveal(){
  if(revealed)return;revealed=true;
  document.getElementById('mBox').classList.add('open');
  document.getElementById('hintBox').style.display='none';
  document.getElementById('fcBtns').classList.add('show');
}
function markOK(){
  var idx=lQueue[lPos];
  var wasNew=!done(idx);
  if(!R[idx])R[idx]={l:0,n:0,ok:0};
  R[idx].l=Math.min(R[idx].l+1,INT.length-1);
  R[idx].n=now()+ival(R[idx].l);
  R[idx].ok++;
  save();
  if(wasNew){sNewCount++;sNewList.push(idx);}
  lPos++;
  if(sNewCount>0&&sNewCount%15===0&&lPos<lQueue.length){
    showMidQuizModal();return;
  }
  showCard();
}
function skipCard(){
  var idx=lQueue[lPos];
  if(done(idx)){var newL=Math.max(0,R[idx].l-2);R[idx].l=newL;R[idx].n=now()+ival(newL);save();}
  lPos++;showCard();
}
function toggleOthers(el){el.classList.toggle('open');var l=document.getElementById('ol');if(l)l.classList.toggle('open');}

/* ==================== 中途测验 ==================== */
function showMidQuizModal(){
  document.getElementById('mQuizS').textContent='已学完 '+sNewCount+' 个新含义，来检验一下记忆效果！';
  document.getElementById('mQuiz').classList.add('on');
}
function closeMidQuiz(){document.getElementById('mQuiz').classList.remove('on');showCard();}
var mQuizPool=[],mQuizPos=0,mQuizScore=0,mQuizDone=false;
function doMidQuiz(){
  document.getElementById('mQuiz').classList.remove('on');
  var pool=sNewList.slice().sort(function(){return Math.random()-.5;}).slice(0,10);
  mQuizPool=[];mQuizPos=0;mQuizScore=0;
  pool.forEach(function(idx){
    var w=C[idx];
    if(w.o&&w.o.length>0){
      var opts=[w.m].concat(w.o.slice(0,3)).sort(function(){return Math.random()-.5;});
      mQuizPool.push({q:'「'+w.c+'」是什么意思？',s:w.s,r:w.r,op:opts,a:opts.indexOf(w.m)});
    }
  });
  if(mQuizPool.length===0){showCard();return;}
  nav('learn');showMidQuizQ();
}
function showMidQuizQ(){
  var wrap=document.getElementById('fcWrap');
  document.getElementById('lp').style.width=Math.round(mQuizPos/Math.max(mQuizPool.length,1)*100)+'%';
  document.getElementById('lc').textContent='小测 '+(mQuizPos+1)+'/'+mQuizPool.length;
  if(mQuizPos>=mQuizPool.length){
    var pct=Math.round(mQuizScore/mQuizPool.length*100);
    var msg=pct>=80?'掌握得很好！':pct>=60?'不错，继续加油':'多复习几次就好';
    wrap.innerHTML='<div class="done"><div class="done-i">'+(pct>=80?'🎉':'📝')+'</div><div class="done-t">'+mQuizScore+'/'+mQuizPool.length+'</div><div class="done-s">'+msg+' · 正确率 '+pct+'%</div><button class="btn btn-p" style="margin-top:20px" onclick="showCard()">继续学习</button></div>';
    return;
  }
  var q=mQuizPool[mQuizPos];var ol='';
  for(var i=0;i<q.op.length;i++)ol+='<div class="qo" onclick="mAnsQ('+i+')" id="mqo'+i+'"><div class="qo-l">'+'ABCD'[i]+'</div><div>'+q.op[i]+'</div></div>';
  wrap.innerHTML=
    '<div class="fc-tag"><span>小测验</span><span class="lv-badge lv-5">检验记忆</span></div>'
    +'<div class="q-card"><div class="q-q">'+q.q+'</div><div class="q-sent">'+q.s+'</div><div class="q-src">—— '+q.r+'</div></div>'
    +'<div class="q-opts">'+ol+'</div>';
}
function mAnsQ(i){
  if(mQuizDone)return;mQuizDone=true;
  var q=mQuizPool[mQuizPos];stats.t++;
  for(var j=0;j<q.op.length;j++){
    var el=document.getElementById('mqo'+j);
    if(j===q.a)el.classList.add('ok');
    else if(j===i)el.classList.add('no');
    else el.classList.add('off');
  }
  var correct=(i===q.a);
  if(correct)mQuizScore++;
  if(correct)stats.c++;
  trackQuiz(q,correct);
  save();
  setTimeout(function(){mQuizPos++;mQuizDone=false;showMidQuizQ();},correct?700:1400);
}

/* ==================== 正式测验 ==================== */
var qPool=[],qIdx=0,qScore=0,qDone=false;
function startQuiz(){
  qPool=Q.slice().sort(function(){return Math.random()-.5;}).slice(0,10);
  qIdx=0;qScore=0;nav('quiz');renderQ();
}
function renderQ(){
  var body=document.getElementById('qb'),ct=document.getElementById('qc');
  ct.textContent='第 '+(qIdx+1)+'/'+qPool.length+' 题';
  if(qIdx>=qPool.length){
    var pct=Math.round(qScore/qPool.length*100);
    var msg=pct>=80?'掌握得很好！':pct>=60?'不错，继续加油':'多复习几次就好';
    body.innerHTML='<div style="text-align:center;padding:40px 0"><div style="font-size:56px;font-weight:900;color:var(--gold)">'+qScore+'/'+qPool.length+'</div><div style="font-size:14px;color:var(--muted)">正确率 '+pct+'%</div><div style="font-size:17px;font-weight:700;margin:16px 0 24px">'+msg+'</div><button class="btn btn-p" onclick="startQuiz()">再来一轮</button><button class="btn btn-g" style="margin-top:10px" onclick="nav(\'home\')">回到首页</button></div>';
    ct.textContent='完成！';return;
  }
  qDone=false;var q=qPool[qIdx];var ol='';
  for(var i=0;i<q.op.length;i++)ol+='<div class="qo" onclick="ansQ('+i+')" id="qo'+i+'"><div class="qo-l">'+'ABCD'[i]+'</div><div>'+q.op[i]+'</div></div>';
  body.innerHTML='<div class="q-type">语境选义</div><div class="q-card"><div class="q-q">'+q.q+'</div><div class="q-sent">'+q.s+'</div><div class="q-src">—— '+q.r+'</div></div><div class="q-opts">'+ol+'</div>';
}
function ansQ(i){
  if(qDone)return;qDone=true;var q=qPool[qIdx];stats.t++;
  for(var j=0;j<q.op.length;j++){
    var el=document.getElementById('qo'+j);
    if(j===q.a)el.classList.add('ok');
    else if(j===i)el.classList.add('no');
    else el.classList.add('off');
  }
  var correct=(i===q.a);
  if(correct)qScore++;
  if(correct)stats.c++;
  trackQuiz(q,correct);
  save();
  setTimeout(function(){qIdx++;renderQ();},correct?700:1400);
}

/* ==================== 词库 ==================== */
function libTab(t,el){
  lLibTab=t;
  document.querySelectorAll('#s-lib .fil-i').forEach(function(e){e.classList.remove('on')});
  if(el)el.classList.add('on');
  renderLib();
}
function renderLib(){
  var c=document.getElementById('libC');
  var badge=document.getElementById('libBadge');
  var nc=newCount(),learned=C.length-nc;
  badge.textContent=learned+'/'+C.length+' 已学';
  c.innerHTML='';
  var filtered=[];
  C.forEach(function(w,i){
    if(lLibTab!=='all'&&w.t!==lLibTab)return;
    filtered.push({w:w,i:i});
  });
  var seen={};
  filtered.forEach(function(x){
    var ch=x.w.c;
    if(seen[ch])return;seen[ch]=true;
    var total=C.filter(function(y){return y.c===ch}).length;
    var doneCount=C.filter(function(y,j){return y.c===ch&&done(j)}).length;
    var first=-1;
    for(var k=0;k<C.length;k++){if(C[k].c===ch){first=k;break;}}
    var level=lv(first);
    var dots='';
    for(var d=0;d<total;d++){
      var filled=d<doneCount;
      dots+='<div class="char-dot" style="background:'+(filled?'var(--green)':'var(--border)')+'"></div>';
    }
    var row=document.createElement('div');
    row.className='char-row';
    row.innerHTML='<div class="char-big">'+ch+'</div>'
      +'<div class="char-info">'
      +'<div class="char-name">'+ch+' · '+x.w.t+' '
      +(level>0?'<span class="lv-badge lv-'+Math.min(level,7)+'">'+LVL_NAME[Math.min(level,9)]+'</span>':'')
      +'</div>'
      +'<div class="char-dots">'+dots+'</div>'
      +'<div class="char-sub">'+x.w.m+' · '+x.w.r+'</div>'
      +'</div>';
    c.appendChild(row);
  });
}

/* ==================== 我的 ==================== */
function renderProf(){
  var nc=newCount(),learned=C.length-nc;
  var mc=mastered().length;
  var pct=stats.t>0?Math.round(stats.c/stats.t*100):0;
  var ranks=[
    {n:'童 生',min:0},{n:'秀 才',min:8},{n:'举 人',min:20},
    {n:'进 士',min:35},{n:'探 花',min:45},{n:'榜 眼',min:52},{n:'状 元',min:60}
  ];
  var rank=ranks[0];
  for(var i=ranks.length-1;i>=0;i--)if(mc>=ranks[i].min){rank=ranks[i];break;}
  var next=null;
  for(var i=0;i<ranks.length;i++)if(ranks[i].min>mc){next=ranks[i];break;}
  document.getElementById('rRank').textContent=rank.n;
  document.getElementById('rSub').textContent=next?'再掌握 '+(next.min-mc)+' 字可升至 '+next.n:'已达最高等级！';
  document.getElementById('rBar').style.width=next?Math.round((mc-rank.min)/(next.min-rank.min)*100)+'%':'100%';
  document.getElementById('sW').textContent=learned;
  document.getElementById('sA').textContent=pct+'%';
  document.getElementById('sS').textContent=stats.t;
  document.getElementById('sC').textContent=mc;
}

/* ==================== 统计详情弹窗 ==================== */
function trackQuiz(q,correct){
  // Find matching card index by sentence
  var plainS=q.s.replace(/<[^>]*>/g,'');
  for(var i=0;i<C.length;i++){
    if(C[i].s.replace(/<[^>]*>/g,'')===plainS){
      if(!R[i])R[i]={l:0,n:0,ok:0,qa:{t:0,c:0}};
      if(!R[i].qa)R[i].qa={t:0,c:0};
      R[i].qa.t++;
      if(correct)R[i].qa.c++;
      break;
    }
  }
}
function showDetail(type){
  var overlay=document.getElementById('detailOverlay');
  var title=document.getElementById('detailTitle');
  var body=document.getElementById('detailBody');
  var html='';
  if(type==='learned'){
    title.textContent='学过含义详情';
    html=buildLearnedDetail();
  }else if(type==='accuracy'){
    title.textContent='测验正确率详情';
    html=buildAccuracyDetail();
  }else if(type==='quizCount'){
    title.textContent='测验次数详情';
    html=buildQuizCountDetail();
  }else if(type==='mastered'){
    title.textContent='字已掌握详情';
    html=buildMasteredDetail();
  }
  body.innerHTML=html;
  overlay.classList.add('on');
}
function closeDetail(){document.getElementById('detailOverlay').classList.remove('on');}
function closeDetailBg(e){if(e.target===document.getElementById('detailOverlay'))closeDetail();}

function buildLearnedDetail(){
  var nc=newCount(),learned=C.length-nc;
  if(learned===0)return '<div class="dg-empty">\uD83D\uDCDA<br>还没有学过任何含义<br>快去开始学习吧！</div>';
  // Group learned cards by character
  var groups={};var order=[];
  for(var i=0;i<C.length;i++){
    if(done(i)){
      var c=C[i];
      if(!groups[c.c]){groups[c.c]=[];order.push(c.c);}
      groups[c.c].push({idx:i,card:c});
    }
  }
  var html='<div class="dg-stat-row"><div class="dg-stat"><div class="dg-stat-n">'+learned+'</div><div class="dg-stat-l">已学含义</div></div><div class="dg-stat"><div class="dg-stat-n">'+order.length+'</div><div class="dg-stat-l">涉及字词</div></div></div>';
  order.forEach(function(ch){
    var cards=groups[ch];
    var t=C.filter(function(x){return x.c===ch}).length;
    var lvColor='#50a868';
    html+='<div class="dg-char">'+ch+' <span class="dg-badge" style="background:'+lvColor+'">'+cards.length+'/'+t+'</span></div>';
    cards.forEach(function(item){
      html+='<div class="dg-item"><div class="dg-meaning">'+item.card.m+'</div><div class="dg-sent">'+item.card.s+'</div><div class="dg-src">'+item.card.r+'</div></div>';
    });
  });
  return html;
}

function buildAccuracyDetail(){
  var pct=stats.t>0?Math.round(stats.c/stats.t*100):0;
  var total=stats.t,correct=stats.c,wrong=total-correct;
  var html='<div class="dg-stat-row"><div class="dg-stat"><div class="dg-stat-n" style="color:var(--green)">'+pct+'%</div><div class="dg-stat-l">总正确率</div></div><div class="dg-stat"><div class="dg-stat-n" style="color:var(--green)">'+correct+'</div><div class="dg-stat-l">答对</div></div><div class="dg-stat"><div class="dg-stat-n" style="color:#d05050">'+wrong+'</div><div class="dg-stat-l">答错</div></div></div>';
  if(total===0)return html+'<div class="dg-empty">\uD83C\uDFAF<br>还没有进行过测验</div>';
  // Per-character accuracy from quiz history in R
  var charStats={};var charOrder=[];
  for(var key in R){
    var rec=R[key];
    if(rec.qa){
      var c=C[key];
      if(c){
        if(!charStats[c.c])charStats[c.c]={t:0,c:0};
        charStats[c.c].t+=rec.qa.t;
        charStats[c.c].c+=rec.qa.c;
        if(charOrder.indexOf(c.c)<0)charOrder.push(c.c);
      }
    }
  }
  if(charOrder.length>0){
    html+='<div style="font-size:13px;color:var(--muted);margin:14px 0 8px;font-weight:700">各字词正确率</div>';
    charOrder.sort(function(a,b){
      var pa=charStats[a].t>0?charStats[a].c/charStats[a].t:0;
      var pb=charStats[b].t>0?charStats[b].c/charStats[b].t:0;
      return pa-pb;
    });
    charOrder.forEach(function(ch){
      var s=charStats[ch];
      var p=s.t>0?Math.round(s.c/s.t*100):0;
      var color=p>=80?'var(--green)':p>=50?'var(--gold)':'#d05050';
      html+='<div class="dg-bar-wrap"><div class="dg-bar-label"><span class="dg-bar-name">'+ch+'</span><span class="dg-bar-pct">'+p+'% ('+s.c+'/'+s.t+')</span></div><div class="dg-bar"><div class="dg-bar-fill" style="width:'+p+'%;background:'+color+'"></div></div></div>';
    });
  }
  return html;
}

function buildQuizCountDetail(){
  var total=stats.t;
  var html='<div class="dg-stat-row"><div class="dg-stat"><div class="dg-stat-n">'+total+'</div><div class="dg-stat-l">总测验次数</div></div></div>';
  if(total===0)return html+'<div class="dg-empty">\uD83C\uDFAF<br>还没有进行过测验<br>完成学习后快来检验效果！</div>';
  // Per-character quiz count
  var charCounts={};var charOrder=[];
  for(var key in R){
    var rec=R[key];
    if(rec.qa){
      var c=C[key];
      if(c){
        if(!charCounts[c.c])charCounts[c.c]=0;
        charCounts[c.c]+=rec.qa.t;
        if(charOrder.indexOf(c.c)<0)charOrder.push(c.c);
      }
    }
  }
  if(charOrder.length>0){
    charOrder.sort(function(a,b){return charCounts[b]-charCounts[a];});
    html+='<div style="font-size:13px;color:var(--muted);margin:14px 0 8px;font-weight:700">各字词测验次数</div>';
    charOrder.forEach(function(ch){
      var cnt=charCounts[ch];
      html+='<div class="dg-bar-wrap"><div class="dg-bar-label"><span class="dg-bar-name">'+ch+'</span><span class="dg-bar-pct">'+cnt+' 次</span></div><div class="dg-bar"><div class="dg-bar-fill" style="width:'+Math.min(cnt*10,100)+'%;background:var(--accent)"></div></div></div>';
    });
  }
  return html;
}

function buildMasteredDetail(){
  var mc=mastered();
  var totalChars={};C.forEach(function(c){totalChars[c.c]=1;});
  var total=Object.keys(totalChars).length;
  if(mc.length===0)return '<div class="dg-stat-row"><div class="dg-stat"><div class="dg-stat-n">0/'+total+'</div><div class="dg-stat-l">已掌握</div></div></div><div class="dg-empty">\u2728<br>还没有掌握任何字词<br>坚持学习就能掌握！</div>';
  var html='<div class="dg-stat-row"><div class="dg-stat"><div class="dg-stat-n" style="color:var(--green)">'+mc.length+'</div><div class="dg-stat-l">已掌握</div></div><div class="dg-stat"><div class="dg-stat-n">'+total+'</div><div class="dg-stat-l">总字词</div></div><div class="dg-stat"><div class="dg-stat-n">'+Math.round(mc.length/total*100)+'%</div><div class="dg-stat-l">完成率</div></div></div>';
  html+='<div style="font-size:13px;color:var(--muted);margin:14px 0 8px;font-weight:700">已掌握字词列表</div>';
  // Show each mastered char with progress
  mc.forEach(function(ch){
    var cards=C.filter(function(x){return x.c===ch});
    var masteredCount=0;
    cards.forEach(function(c,idx){
      var origIdx=C.indexOf(c);
      if(done(origIdx))masteredCount++;
    });
    var pct=Math.round(masteredCount/cards.length*100);
    var color=pct>=80?'var(--green)':pct>=50?'var(--gold)':'var(--accent)';
    html+='<div class="dg-mastery-item"><div class="dg-m-char">'+ch+'</div><div class="dg-m-info"><div class="dg-m-label"><span>'+masteredCount+'/'+cards.length+' 含义已学</span><span>'+pct+'%</span></div><div class="dg-m-bar"><div class="dg-m-bar-fill" style="width:'+pct+'%;background:'+color+'"></div></div></div></div>';
  });
  return html;
}

/* ==================== 快捷键 ==================== */
document.addEventListener('keydown',function(e){
  if(qDone)return;
  var k=e.key.toUpperCase();
  if('ABCD'.indexOf(k)>=0){var idx='ABCD'.indexOf(k);e.preventDefault();ansQ(idx);}
  if('1234'.indexOf(k)>=0){var idx=parseInt(k)-1;e.preventDefault();ansQ(idx);}
});

/* ==================== 初始化 ==================== */
updateHome();
