var C = window.CARDS; var Q = window.QUIZZES; var CATS = window.CATEGORIES;

/* ==================== 间隔重复 ==================== */
var INT=[0,180000,900000,5400000,86400000,172800000,345600000,604800000,1296000000,2592000000];
var LVL_NAME=['新学','速记','巩固','短期','隔日','短周','中周','长周','月检','熟知'];
var LVL_CLR=['#bbb','#e08080','#d89040','#d4a830','#50a868','#4890b8','#6878b8','#7868c0','#c08040','#b068a8'];

/* ==================== 用户管理 ==================== */
var _PIN_SALT='wy2024';
function getUsers(){try{return JSON.parse(localStorage.getItem('w3_users')||'[]');}catch(e){return[];}}
function setUsers(u){localStorage.setItem('w3_users',JSON.stringify(u));}
function curUser(){var id=localStorage.getItem('w3_cur');var users=getUsers();for(var i=0;i<users.length;i++){if(users[i].id===id)return users[i];}return users[0]||null;}
function loadUserData(){var u=curUser();if(!u)return;var p='w3_'+u.id+'_';try{R=JSON.parse(localStorage.getItem(p+'r')||'{}');}catch(e){R={};}try{stats=JSON.parse(localStorage.getItem(p+'s')||'{"t":0,"c":0}');}catch(e){stats={t:0,c:0};}try{quizHistory=JSON.parse(localStorage.getItem(p+'qh')||'[]');}catch(e){quizHistory=[];}var sc=localStorage.getItem(p+'cat');lCat=(sc&&CATS[sc])?sc:'all';}
function saveUserData(){var u=curUser();if(!u)return;var p='w3_'+u.id+'_';localStorage.setItem(p+'r',JSON.stringify(R));localStorage.setItem(p+'s',JSON.stringify(stats));localStorage.setItem(p+'qh',JSON.stringify(quizHistory));localStorage.setItem(p+'cat',lCat);}
function hashPin(pin){return btoa(_PIN_SALT+pin+_PIN_SALT.split('').reverse().join(''));}
function verifyPin(user,pin){if(!user.pin)return true;return user.pin===hashPin(pin);}
function createUser(name,pin){var users=getUsers();var u={id:'u'+Date.now()+'_'+Math.random().toString(36).substr(2,4),name:name,pin:pin?hashPin(pin):'',created:Date.now()};users.push(u);setUsers(users);localStorage.setItem('w3_cur',u.id);R={};stats={t:0,c:0};quizHistory=[];lCat='all';saveUserData();return u;}
function switchUser(id,pin){var users=getUsers();var target=null;for(var i=0;i<users.length;i++){if(users[i].id===id){target=users[i];break;}}if(!target)return false;if(target.pin&&!verifyPin(target,pin))return false;saveUserData();localStorage.setItem('w3_cur',id);loadUserData();return true;}
function deleteUser(id,pin){var users=getUsers();var target=null;for(var i=0;i<users.length;i++){if(users[i].id===id){target=users[i];break;}}if(!target)return false;if(target.pin&&!verifyPin(target,pin))return false;users=users.filter(function(u){return u.id!==id;});setUsers(users);['r','s','qh','cat'].forEach(function(k){localStorage.removeItem('w3_'+id+'_'+k);});if(users.length===0){localStorage.removeItem('w3_cur');R={};stats={t:0,c:0};quizHistory=[];}else if(localStorage.getItem('w3_cur')===id){localStorage.setItem('w3_cur',users[0].id);loadUserData();}return true;}
function resetUserData(pin){var u=curUser();if(!u)return false;if(u.pin&&!verifyPin(u,pin))return false;R={};stats={t:0,c:0};quizHistory=[];saveUserData();return true;}

/* ==================== 状态 ==================== */
var R={};var stats={t:0,c:0};var quizHistory=[];
var lQueue=[],lPos=0,lRev=false,lFilter='all',lLibTab='all';
var lCat='all';
var sNewCount=0,sNewList=[];
var revealed=false;

/* ==================== 工具 ==================== */
function save(){saveUserData();}
function ival(l){return l<INT.length?INT[l]:INT[INT.length-1];}
function lv(i){return R[i]?R[i].l:0;}
function done(i){return lv(i)>0;}
function nextT(i){return R[i]?R[i].n:0;}
function now(){return Date.now();}
function inCat(ch){return lCat==='all'||(CATS[lCat]&&CATS[lCat].indexOf(ch)>=0);}
function filterC(){if(lCat==='all')return C;return C.filter(function(c){return inCat(c.c);});}
function dueCount(){var c=0,n=now(),fc=filterC();for(var i=0;i<fc.length;i++){var idx=C.indexOf(fc[i]);if(done(idx)&&nextT(idx)<=n)c++;}return c;}
function newCount(){var c=0,fc=filterC();for(var i=0;i<fc.length;i++){var idx=C.indexOf(fc[i]);if(!done(idx))c++;}return c;}
function mastered(){var m={};C.forEach(function(c,i){if(done(i)){if(!m[c.c])m[c.c]=0;m[c.c]++;}});var r=[];for(var k in m){var total=C.filter(function(x){return x.c===k}).length;if(m[k]/total>=0.8)r.push(k);}return r;}
function shuf(a){for(var i=a.length-1;i>0;i--){var j=Math.random()*i+1|0;var t=a[i];a[i]=a[j];a[j]=t;}}

/* ==================== 导航 ==================== */
function nav(s){
  document.querySelectorAll('.sc').forEach(function(e){e.classList.remove('on')});
  document.getElementById('s-'+s).classList.add('on');
  document.querySelectorAll('.ni').forEach(function(e){e.classList.toggle('on',e.dataset.s===s)});
  if(s==='home')updateHome();
  if(s==='lib')renderLib();
  if(s==='gram')renderGram();
  if(s==='prof')renderProf();
}

/* ==================== 分类选择 ==================== */
var CAT_GROUPS=[
  {label:'\u5168\u90e8',cats:['all']},
  {label:'\u5b66\u6bb5',cats:['\u521d\u4e2d\u5fc5\u5b66','\u9ad8\u4e2d\u5fc5\u5b66']},
  {label:'\u8003\u8bd5',cats:['\u4e2d\u8003\u9ad8\u9891','\u9ad8\u8003\u9ad8\u9891']},
  {label:'\u8bcd\u6027',cats:['\u521d\u4e2d\u5b9e\u8bcd','\u9ad8\u4e2d\u5b9e\u8bcd','\u521d\u4e2d\u865a\u8bcd','\u9ad8\u4e2d\u865a\u8bcd']}
];
function renderCatSel(){
  var el=document.getElementById('catSel');
  var html='';
  CAT_GROUPS.forEach(function(g){
    html+='<div class="cat-group"><div class="cat-group-label">'+g.label+'</div><div class="cat-pills">';
    g.cats.forEach(function(cat){
      var cnt=catCount(cat);
      var cls=cat===lCat?'cat-pill on':'cat-pill';
      var label=cat==='all'?'\u5168\u90e8 '+cnt:cat+' '+cnt;
      html+='<div class="'+cls+'" onclick="setCat(\''+cat+'\',this)">'+label+'</div>';
    });
    html+='</div></div>';
  });
  el.innerHTML=html;
}
function catCount(cat){
  if(cat==='all'){var s={};C.forEach(function(c){s[c.c]=1;});return Object.keys(s).length;}
  var chars=CATS[cat];if(!chars)return 0;
  var seen={},cnt=0;
  C.forEach(function(c){if(!seen[c.c]&&chars.indexOf(c.c)>=0){seen[c.c]=1;cnt++;}});
  return cnt;
}
function setCat(cat){
  lCat=cat;saveUserData();
  renderCatSel();updateHome();
}

/* ==================== 首页 ==================== */
function updateHome(){
  var fc=filterC();
  var dc=0,nc=0,n=now();
  fc.forEach(function(c){var idx=C.indexOf(c);if(done(idx)&&nextT(idx)<=n)dc++;else if(!done(idx))nc++;});
  var tc=dc+nc,learned=fc.length-nc;
  document.getElementById('hNum').textContent=learned;
  document.getElementById('hDen').textContent='/ '+fc.length+' \u5f20';
  document.getElementById('hBar').style.width=fc.length?Math.round(learned/fc.length*100)+'%':'0%';
  var mc=mastered();
  var _coreChars={};fc.forEach(function(c){_coreChars[c.c]=1;});var _coreTotal=Object.keys(_coreChars).length;
  document.getElementById('hSub').textContent='\u5df2\u638c\u63e1 '+mc.filter(function(ch){return _coreChars[ch]}).length+'/'+_coreTotal+' \u6838\u5fc3\u5b57';
  var fil=document.getElementById('hFil');
  fil.innerHTML='<div class="fil-i'+(lFilter==='all'?' on':'')+'" onclick="setFilter(\'all\',this)">\u5168\u90e8 '+tc+'</div>'
    +'<div class="fil-i'+(lFilter==='due'?' on':'')+'" onclick="setFilter(\'due\',this)">\u5f85\u590d\u4e60 '+dc+'</div>'
    +'<div class="fil-i'+(lFilter==='new'?' on':'')+'" onclick="setFilter(\'new\',this)">\u65b0\u8bcd '+nc+'</div>';
  var actS=document.getElementById('actLearnS');
  if(tc===0)actS.textContent='\u5168\u90e8\u638c\u63e1\uff01';
  else if(dc===0)actS.textContent=nc+' \u5f20\u65b0\u8bcd\u5f85\u5b66';
  else if(nc===0)actS.textContent=dc+' \u5f20\u5f85\u590d\u4e60';
  else actS.textContent=dc+' \u590d\u4e60 + '+nc+' \u65b0\u8bcd';
  renderCatSel();
  var hu=document.getElementById('hUser');if(hu){var _u=curUser();hu.textContent=_u?_u.name:'';}
}
function setFilter(f,el){lFilter=f;document.querySelectorAll('#hFil .fil-i').forEach(function(e){e.classList.remove('on')});if(el)el.classList.add('on');}

/* ==================== 学习 ==================== */
function buildQueue(){
  var q=[],n=now(),fc=filterC();
  if(lFilter==='new'){fc.forEach(function(c){var idx=C.indexOf(c);if(!done(idx))q.push(idx);});}
  else if(lFilter==='due'){fc.forEach(function(c){var idx=C.indexOf(c);if(done(idx)&&nextT(idx)<=n)q.push(idx);});}
  else{
    var rev=[],nw=[];
    fc.forEach(function(c){var idx=C.indexOf(c);if(done(idx)&&nextT(idx)<=n)rev.push(idx);else if(!done(idx))nw.push(idx);});
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

/* ==================== 语法 ==================== */
var G=window.GRAMMAR||[];
var gramFilter='all';
function renderGram(){
  var badge=document.getElementById('gramBadge');
  badge.textContent=G.length+' 个知识点';
  // 筛选按钮
  var types=['all'];
  G.forEach(function(g){if(types.indexOf(g.k)<0)types.push(g.k);});
  var fil=document.getElementById('gramFil');
  var fh='';
  types.forEach(function(t){
    var label=t==='all'?'全部':t;
    var cnt=t==='all'?G.length:G.filter(function(g){return g.k===t;}).length;
    fh+='<div class="fil-i'+(gramFilter===t?' on':'')+'" onclick="setGramFilter(\''+t+'\',this)">'+label+' '+cnt+'</div>';
  });
  fil.innerHTML=fh;
  // 卡片列表
  var c=document.getElementById('gramC');
  var filtered=gramFilter==='all'?G:G.filter(function(g){return g.k===gramFilter;});
  var html='';
  filtered.forEach(function(g){
    html+='<div class="gram-card">';
    html+='<div class="gram-head"><div class="gram-char">'+g.t+'</div>';
    html+='<div class="gram-meta"><div class="gram-title">'+g.title+'</div>';
    html+='<span class="gram-tag">'+g.k+'</span></div></div>';
    html+='<div class="gram-content">'+g.content+'</div>';
    html+='<div class="gram-explain">💡 '+g.explain+'</div>';
    html+='<div class="gram-sent">'+g.s+'</div>';
    html+='<div class="gram-src">—— '+g.r+'</div>';
    html+='</div>';
  });
  c.innerHTML=html;
}
function setGramFilter(t,el){
  gramFilter=t;
  document.querySelectorAll('#gramFil .fil-i').forEach(function(e){e.classList.remove('on');});
  if(el)el.classList.add('on');
  renderGram();
}

/* ==================== 我的 ==================== */
function renderProf(){
  var fc=filterC();
  var nc=newCount(),learned=fc.length-nc;
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
  // 档案管理
  var profMgmt=document.getElementById('profMgmt');
  if(!profMgmt)return;
  var cu=curUser();var users=getUsers();
  var h='<div class="profile-section"><div class="profile-section-title">学习档案</div>';
  h+='<div class="current-user"><div class="current-user-info"><span class="current-user-name">'+cu.name+'</span>'+(cu.pin?'<span class="pin-badge">🔒 已设PIN</span>':'<span class="pin-badge pin-badge-warn">⚠ 未设PIN</span>')+'</div>';
  h+='<div class="current-user-actions"><button class="btn-pin" onclick="openPinSetup()">设置/修改PIN</button></div></div>';
  h+='<div class="user-list">';
  for(var i=0;i<users.length;i++){var u=users[i];var isActive=u.id===cu.id;
    h+='<div class="user-card'+(isActive?' active':'')+'" onclick="onUserClick(\''+u.id+'\')">';
    h+='<div class="user-card-info"><div class="user-card-name">'+u.name+'</div>';
    h+='<div class="user-card-status">'+(isActive?'<span style="color:var(--green)">当前</span>':'')+(u.pin?' 🔒':'')+'</div></div>';
    if(!isActive)h+='<div class="user-card-del" onclick="event.stopPropagation();confirmDeleteUser(\''+u.id+'\')">✕</div>';
    h+='</div>';}
  h+='</div>';
  h+='<button class="btn-create-user" onclick="showCreateDialog()">＋ 新建档案</button></div>';
  h+='<div class="profile-section danger-zone"><div class="profile-section-title" style="color:#d05050">⚠ 危险操作</div>';
  h+='<button class="btn-danger" onclick="openPinModal(\'reset\')">重置学习数据</button>';
  h+='<div class="danger-hint">清除当前档案的所有学习进度、测验记录</div></div>';
  profMgmt.innerHTML=h;
}

/* ==================== 统计详情弹窗 ==================== */
function trackQuiz(q,correct){
  // Find matching card index by sentence
  var plainS=q.s.replace(/<[^>]*>/g,'');
  var cardIdx=-1;
  for(var i=0;i<C.length;i++){
    if(C[i].s.replace(/<[^>]*>/g,'')===plainS){
      if(!R[i])R[i]={l:0,n:0,ok:0,qa:{t:0,c:0}};
      if(!R[i].qa)R[i].qa={t:0,c:0};
      R[i].qa.t++;
      if(correct)R[i].qa.c++;
      cardIdx=i;
      break;
    }
  }
  // Record quiz history with detail
  quizHistory.push({
    ts:now(),
    q:q.q,
    s:q.s,
    r:q.r,
    op:q.op,
    a:q.a,
    ok:correct?1:0,
    ci:cardIdx
  });
  // Keep last 200 records
  if(quizHistory.length>200)quizHistory=quizHistory.slice(-200);
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
  if(quizHistory.length===0){
    return html+'<div class="dg-empty">\uD83D\uDCDD<br>详细记录从这里开始<br>之后的每次测验都会记录每道题的对错情况</div>';
  }
  // Recent quiz items (last 50)
  var recent=quizHistory.slice(-50).reverse();
  html+='<div style="font-size:13px;color:var(--muted);margin:14px 0 8px;font-weight:700">测验记录（'+(recent.length<quizHistory.length?'最近'+recent.length+'条':'全部'+recent.length+'条')+'）</div>';
  // Group by session (consecutive items within 2 min = same session)
  var sessions=[];var curSession=[];
  recent.forEach(function(rec,idx){
    if(curSession.length===0){curSession.push(rec);return;}
    var prev=curSession[curSession.length-1];
    if(Math.abs(rec.ts-prev.ts)<120000){curSession.push(rec);}
    else{sessions.push(curSession);curSession=[rec];}
  });
  if(curSession.length>0)sessions.push(curSession);
  sessions.forEach(function(sess,si){
    var sCorrect=0,sTotal=sess.length;
    sess.forEach(function(r){sCorrect+=r.ok;});
    var sPct=Math.round(sCorrect/sTotal*100);
    var d=new Date(sess[0].ts);
    var timeStr=(d.getMonth()+1)+'/'+d.getDate()+' '+d.getHours()+':'+('0'+d.getMinutes()).slice(-2);
    var sessColor=sPct>=80?'var(--green)':sPct>=50?'var(--gold)':'#d05050';
    html+='<div class="dg-session"><div class="dg-sess-head open" onclick="this.classList.toggle(\'open\')">';
    html+='<div class="dg-sess-info"><span class="dg-sess-time">'+timeStr+'</span><span class="dg-sess-score" style="color:'+sessColor+'">'+sCorrect+'/'+sTotal+' ('+sPct+'%)</span></div>';
    html+='<span class="dg-sess-arrow">▾</span></div>';
    html+='<div class="dg-sess-items">';
    sess.forEach(function(rec){
      var icon=rec.ok?'<span class="dg-item-ok">✓</span>':'<span class="dg-item-no">✗</span>';
      var correctAns=rec.op[rec.a];
      var charName='';
      if(rec.ci>=0&&C[rec.ci])charName=C[rec.ci].c;
      html+='<div class="dg-qi'+(rec.ok?' dg-qi-ok':' dg-qi-no')+'">';
      html+='<div class="dg-qi-left">'+icon+(charName?'<span class="dg-qi-char">'+charName+'</span>':'')+'<span class="dg-qi-q">'+rec.q+'</span></div>';
      if(!rec.ok){
        html+='<div class="dg-qi-ans">正确答案：'+correctAns+'</div>';
      }
      html+='</div>';
    });
    html+='</div></div>';
  });
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
(function(){
  var users=getUsers();
  if(users.length===0){
    var oldR=null;try{oldR=JSON.parse(localStorage.getItem('w3_r'));}catch(e){}
    if(oldR&&Object.keys(oldR).length>0){
      var oldStats={t:0,c:0};try{oldStats=JSON.parse(localStorage.getItem('w3_s')||'{}');}catch(e){}
      var oldQH=[];try{oldQH=JSON.parse(localStorage.getItem('w3_qh')||'[]');}catch(e){}
      var u=createUser('默认档案','');
      R=oldR;stats=oldStats;quizHistory=oldQH;saveUserData();
      localStorage.removeItem('w3_r');localStorage.removeItem('w3_s');localStorage.removeItem('w3_qh');localStorage.removeItem('w3_cat');
    }else{createUser('默认档案','');}
  }else{loadUserData();}
  updateHome();
})();

/* ==================== PIN 弹窗 ==================== */
var _pinAction='',_pinTargetId='',_pinStep='',_newPinVal='';
function openPinModal(action,targetId){
  _pinAction=action;_pinTargetId=targetId||'';_pinStep='';_newPinVal='';
  var m=document.getElementById('pinModal');var t=document.getElementById('pinTitle');var inp=document.getElementById('pinInput');
  inp.value='';
  if(action==='verify-switch'){t.textContent='输入PIN码以切换档案';}
  else if(action==='verify-delete'){t.textContent='输入PIN码以删除档案';}
  else if(action==='reset'){t.textContent='输入PIN码以重置数据';}
  else if(action==='setup'){t.textContent='设置PIN码（4-6位数字）';}
  else if(action==='confirm-setup'){t.textContent='请再次输入PIN码确认';}
  m.classList.add('on');
}
function closePinModal(){document.getElementById('pinModal').classList.remove('on');_pinAction='';}
function pinInput(v){var inp=document.getElementById('pinInput');if(inp.value.length<6)inp.value+=v;}
function pinBackspace(){var inp=document.getElementById('pinInput');inp.value=inp.value.slice(0,-1);}
function pinClear(){document.getElementById('pinInput').value='';}
function pinConfirm(){
  var pin=document.getElementById('pinInput').value;
  var users=getUsers();var cu=curUser();
  if(_pinAction==='setup'){
    if(pin.length<4||pin.length>6||!/\d+/.test(pin)){alert('PIN码需为4-6位数字');return;}
    _newPinVal=pin;_pinAction='confirm-setup';
    document.getElementById('pinTitle').textContent='请再次输入PIN码确认';
    document.getElementById('pinInput').value='';return;
  }
  if(_pinAction==='confirm-setup'){
    if(pin!==_newPinVal){alert('两次输入不一致，请重新设置');_pinAction='setup';document.getElementById('pinTitle').textContent='设置PIN码（4-6位数字）';document.getElementById('pinInput').value='';return;}
    var freshUsers=getUsers();var freshCur=curUser();
    if(!freshCur){closePinModal();return;}
    for(var i=0;i<freshUsers.length;i++){if(freshUsers[i].id===freshCur.id){freshUsers[i].pin=hashPin(pin);break;}}
    setUsers(freshUsers);_pinAction='';
    document.getElementById('pinModal').classList.remove('on');
    setTimeout(function(){renderProf();updateHome();},350);
    return;
  }
  if(_pinAction==='verify-switch'){
    if(switchUser(_pinTargetId,pin)){closePinModal();renderProf();updateHome();}
    else{alert('PIN码错误');document.getElementById('pinInput').value='';}
    return;
  }
  if(_pinAction==='verify-delete'){
    if(deleteUser(_pinTargetId,pin)){closePinModal();renderProf();updateHome();}
    else{alert('PIN码错误');document.getElementById('pinInput').value='';}
    return;
  }
  if(_pinAction==='reset'){
    if(!resetUserData(pin)){alert('PIN码错误');document.getElementById('pinInput').value='';return;}
    closePinModal();
    if(confirm('确定要重置所有学习数据吗？\n此操作不可撤销！')){loadUserData();renderProf();updateHome();}
    return;
  }
}
function openPinSetup(){openPinModal('setup');}
function showCreateDialog(){
  var overlay=document.getElementById('detailOverlay');
  var title=document.getElementById('detailTitle');
  var body=document.getElementById('detailBody');
  title.textContent='新建档案';
  body.innerHTML='<div style="padding:20px 0"><div style="margin-bottom:16px"><label style="font-size:13px;color:var(--muted);display:block;margin-bottom:6px">档案名称</label><input type="text" id="newUserName" placeholder="输入名称" maxlength="10" style="width:100%;padding:12px 14px;border:2px solid var(--border);border-radius:10px;font-size:15px;outline:none;font-family:var(--sans)"></div><button class="btn btn-p" onclick="doCreateUser()">创建</button></div>';
  overlay.classList.add('on');
  setTimeout(function(){document.getElementById('newUserName').focus();},300);
}
function doCreateUser(){
  var name=document.getElementById('newUserName').value.trim();
  if(!name){alert('请输入档案名称');return;}
  createUser(name,'');
  closeDetail();renderProf();updateHome();
  setTimeout(function(){openPinModal('setup');},400);
}
function onUserClick(id){
  var cu=curUser();if(id===cu.id){showUserDialog(id);return;}
  var users=getUsers();var target=null;
  for(var i=0;i<users.length;i++){if(users[i].id===id){target=users[i];break;}}
  if(!target)return;
  if(target.pin){openPinModal('verify-switch',id);}
  else{switchUser(id,'');renderProf();updateHome();}
}
function showUserDialog(id){
  var overlay=document.getElementById('detailOverlay');
  var title=document.getElementById('detailTitle');
  var body=document.getElementById('detailBody');
  var users=getUsers();var user=null;
  for(var i=0;i<users.length;i++){if(users[i].id===id){user=users[i];break;}}
  if(!user)return;
  title.textContent='档案操作';
  var h='<div style="padding:20px 0"><div style="text-align:center;margin-bottom:20px"><div style="font-size:36px;font-weight:900">'+user.name+'</div>';
  h+='<div style="font-size:12px;color:var(--muted);margin-top:4px">'+(user.pin?'已设置PIN码':'未设置PIN码')+'</div></div>';
  if(users.length>1)h+='<button class="btn btn-g" style="margin-bottom:10px;color:#d05050;border-color:#d05050" onclick="closeDetail();confirmDeleteUser(\''+id+'\')">删除此档案</button>';
  h+='<button class="btn btn-g" onclick="closeDetail()">取消</button></div>';
  body.innerHTML=h;overlay.classList.add('on');
}
function confirmDeleteUser(id){
  var users=getUsers();var target=null;
  for(var i=0;i<users.length;i++){if(users[i].id===id){target=users[i];break;}}
  if(!target)return;
  if(users.length<=1){alert('至少保留一个档案');return;}
  if(!confirm('确定删除档案「'+target.name+'」？\n该档案的所有学习数据将被清除！'))return;
  if(target.pin){openPinModal('verify-delete',id);}
  else{deleteUser(id,'');renderProf();updateHome();}
}
function renderUserCard(u,cu){
  var isActive=u.id===cu.id;
  var h='<div class="user-card'+(isActive?' active':'')+'">';
  h+='<div class="user-card-info"><div class="user-card-name">'+u.name+'</div>';
  h+='<div class="user-card-status">'+(isActive?'当前':'')+(u.pin?' 🔒':'')+'</div></div></div>';
  return h;
}
