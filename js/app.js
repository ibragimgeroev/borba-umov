const P={scales:'<path d="M12 3v18M5 6h14M12 3l-1.5 2h3L12 3M5 6l-3 7a4 4 0 0 0 6 0L5 6zM19 6l-3 7a4 4 0 0 0 6 0l-3-7zM8 21h8M12 17l-3 4M12 17l3 4"/>',column:'<path d="M4 21h16M5 18h14M6 18V8M18 18V8M9 18V8M12 18V8M15 18V8M4 8h16M5 5h14l1 3H4l1-3z"/>',gavel:'<path d="M13 6l5 5M8 11l5 5M9 4l8 8-3 3-8-8 3-3zM4 12l8 8-3 3-8-8 3-3zM3 21h9M14 14l7 7" transform="scale(.85) translate(2 1)"/>',document:'<path d="M6 3h9l4 4v14H6V3zM15 3v4h4M9 11h7M9 15h7M9 7h3"/>',shield:'<path d="M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3zM9 12l2 2 4-4"/>',home:'<path d="M4 11l8-7 8 7M6 9v11h12V9M10 20v-6h4v6"/>',target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".5"/>',rotate:'<path d="M4 12a8 8 0 1 1 2 6M4 12V6M4 12h6M9 9h6v6H9z"/>',chart:'<path d="M4 4v16h16M8 15v-4M12 15V8M16 15v-6M7 7l4-2 4 3 4-3"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 5-6 8-6s7 1 8 6"/>',lightning:'<path d="M13 2L5 13h6l-1 9 8-11h-6l1-9z"/>',search:'<circle cx="10" cy="10" r="6"/><path d="M15 15l5 5"/>',chevron:'<path d="M9 5l7 7-7 7"/>',bell:'<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 19a2 2 0 0 0 4 0"/>',trophy:'<path d="M8 4h8v6a4 4 0 0 1-8 0V4zM8 5H4v3a3 3 0 0 0 4 3M16 5h4v3a3 3 0 0 1-4 3M12 14v4M8 21h8M10 18h4"/>',check:'<path d="M5 12l5 5L20 7"/>',moon:'<path d="M20 13A8 8 0 0 1 11 4 8 8 0 1 0 20 13z"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',bookmark:'<path d="M6 3h12v18l-6-4-6 4V3z"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>'};
function ic(n,s){return '<svg width="'+(s||20)+'" height="'+(s||20)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+(P[n]||'')+'</svg>'}
function mountIcons(root){(root||document).querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=ic(e.dataset.icon,+e.dataset.size||20))}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const TABS=[['home','Главная','home'],['code','Кодекс','document'],['game','Игра','target'],['mistakes','Ошибки','rotate'],['profile','Профиль','user']],SHORT={};let profileView='main';
let tab='home',level='novice',notif=true,dark=true,client=null,session=null,profile=null,profileSyncError='',authMode=null,authLoading=false,guestBusy=false,logoutBusy=false,requestId=0;
let articles=[],articlesLoaded=false,articlesError='',favorites=[],favBusyId='',codeView='root',currentChapter='',currentArticleId='',activeCategory='Все',activePart='Общая часть',searchQuery='',noteId='',currentNote='',noteBusy=false,noteLoading=false,noteStatus='',noteError='',noteRequestId=0,codeRequestId=0,articleDirection=0,articleNavigating=false;
let gameQuestions=[],gameQuestionsLoaded=false,gameQuestionsLoading=false,gameQuestionsError='',gameView='sessions',gameRound=null,gameAnswerBusy=false,gameQuestionRequestId=0;
let gameSessions=[],gameSessionsLoaded=false,gameSessionsLoading=false,gameSessionsError='',detectiveScenarios=[],detectiveScenariosLoaded=false,detectiveScenariosLoading=false,detectiveScenariosError='',detectiveRound=null,menuView='modes',sessionBusy=false,sessionError='',resetTarget=null,detectiveAnswerBusy=false,gameDataRequestId=0,detectiveScenarioRequestId=0;
let sessionSaveQueue=Promise.resolve(),gameSessionsPromise=null;
const configured=SUPABASE_URL.startsWith('https://')&&SUPABASE_ANON_KEY.length>20;
function renderNav(){document.getElementById('sidenav').innerHTML=TABS.map(t=>'<button class="side-link'+(tab===t[0]?' on':'')+'" onclick="go(\''+t[0]+'\')">'+ic(t[2],18)+t[1]+'</button>').join('');document.getElementById('bottomnav').innerHTML=TABS.map(t=>'<button class="'+(tab===t[0]?'on':'')+'" aria-label="'+t[1]+'" onclick="go(\''+t[0]+'\')">'+ic(t[2],20)+'<span>'+(SHORT[t[1]]||t[1])+'</span></button>').join('')}
async function go(t){if(sessionBusy)return;if(runtimeIsActive()){const ok=await suspendActiveGame();if(!ok)return;menuView='modes'}if(t==='game')gameView='sessions';if(t==='profile')profileView='main';if(t==='mistakes')loadMistakes();tab=t;render();scrollTo(0,0);if(t==='game'||t==='home')initializeGameData()}function closeModal(){const m=document.getElementById('modal');if(m)m.style.display='none'}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeModal();closeAnalysis();closeReset();if(!authLoading)closeAuth();if(!logoutBusy)closeLogout()}
  if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&tab==='code'&&codeView==='article'){
    const tag=document.activeElement?.tagName;
    if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;
    if(document.getElementById('modal')?.style.display==='flex'||document.getElementById('logout').style.display==='flex')return;
    e.preventDefault();
    navigateArticle(e.key==='ArrowLeft'?-1:1);
  }
});
function avatar(size,letter){return '<div class="avatar" style="width:'+size+'px;height:'+size+'px"><div><span style="font-size:'+Math.round(size*.38)+'px">'+esc(letter)+'</span></div></div>'}
function header(eyebrow,title,sub){return '<header><div class="eyebrow">'+eyebrow+'</div><h1>'+title+'</h1>'+(sub?'<p class="sub">'+sub+'</p>':'')+(profileSyncError?'<p class="notice" style="margin-top:12px">'+esc(profileSyncError)+'</p>':'')+'</header>'}function iconbox(name,wine,size){return '<div class="iconbox'+(wine?' wine':'')+'">'+ic(name,size||20)+'</div>'}
function profileBits(){const name=profile.display_name||'Пользователь',levelName=profile.level===1?'Новичок':profile.level===2?'Начинающий':'Уровень '+profile.level;return{name,levelName,initial:(name.trim()[0]||'Ю').toUpperCase(),progress:Math.min(100,Math.max(0,profile.xp%100))}}
function homeScreen(){if(menuView==='training')return trainingSetupScreen();if(menuView==='detective')return detectiveSetupScreen();return modesHomeScreen()}
function modesHomeScreen(){
  const h=new Date().getHours(),g=h<5?'Доброй ночи':h<12?'Доброе утро':h<18?'Добрый день':'Добрый вечер',p=profileBits(),training=latestActiveSession('training'),detective=latestActiveSession('detective');
  const modeCard=(record,mode,title,description,icon)=>{
    const progress=record?'<p class="gold" style="font-size:13px;margin-top:12px">'+esc(sessionPositionText(record))+' · '+esc(sessionScoreText(record))+'</p>':'<p style="font-size:13px;color:var(--dim);margin-top:12px">Прогресс сохраняется в Supabase</p>';
    const actions=record?'<div class="game-answer-actions"><button class="btn-gold" data-action="resumeSession" data-arg="'+esc(record.id)+'">Продолжить '+ic('chevron',14)+'</button><button class="btn-outline" data-action="requestReset" data-mode="'+mode+'" data-arg="'+esc(record.id)+'">Начать заново</button></div><button class="btn-text" style="padding-left:0" onclick="menuView=\''+mode+'\';render()">Выбрать '+(mode==='training'?'другую сложность':'другой сценарий')+'</button>':'<div class="game-answer-actions"><button class="btn-gold" onclick="menuView=\''+mode+'\';render()">Начать '+ic('chevron',14)+'</button></div>';
    return'<div class="card game-level-card"><div class="row" style="justify-content:space-between">'+iconbox(icon)+(record?'<span class="chip">В процессе</span>':'')+'</div><h2 style="margin-top:14px">'+title+'</h2><p style="font-size:13px;color:var(--silver);margin-top:5px">'+description+'</p>'+progress+actions+'</div>';
  };
  return header('Выбор режима',g+', <span class="goldtext">юрист</span>','Продолжите текущее прохождение или начните новый режим. Переключаться между играми можно без потери прогресса.')+'<div class="card row">'+avatar(64,p.initial)+'<div style="flex:1;min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap"><h2>'+esc(p.name)+'</h2><span class="chip">'+p.levelName+'</span></div><p style="font-size:13px;color:var(--silver);margin-top:4px">'+profile.points+' баллов · уровень '+profile.level+'</p><div class="progress"><span style="width:'+p.progress+'%"></span></div></div></div>'+(gameSessionsLoading&&!gameSessionsLoaded?'<div class="save-status"><span class="spinner"></span>Загружаем ваши игровые сессии…</div>':'')+(gameSessionsError?'<p class="notice">'+esc(gameSessionsError)+' <button class="btn-text" onclick="loadGameSessions(true)">Повторить</button></p>':'')+'<div class="row" style="justify-content:space-between"><h2>Режимы</h2><span style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim)">Независимые сохранения</span></div><div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">'+modeCard(training,'training','Тренировка УПК','До 10 вопросов с подробным юридическим разбором каждого ответа.','scales')+modeCard(detective,'detective','Детектив','Пошаговые процессуальные расследования с уликами, решениями и баллами.','search')+'<div class="card game-level-card"><div class="row" style="justify-content:space-between">'+iconbox('lightning')+'<span class="chip">Скоро</span></div><h2 style="margin-top:14px">Блиц</h2><p style="font-size:13px;color:var(--silver);margin-top:5px">Скоростные раунды на время.</p><div class="game-answer-actions"><button class="btn-outline" disabled style="opacity:.55;cursor:default">Уведомить о запуске</button></div></div></div>';
}
function articleHeading(a){return 'Статья '+a.number+(a.part&&a.part!=='вся статья'?'. Часть '+a.part:'')}
function formatDate(v){if(!v)return'Дата редакции не указана';try{return new Date(v+'T00:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}catch(e){return v}}
function formatDateTime(v){if(!v)return'дата неизвестна';try{const d=new Date(v);if(isNaN(d))return'дата неизвестна';return d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}catch(e){return'дата неизвестна'}}
function filteredCodeArticles(){return activeCategory==='Все'?articles:articles.filter(a=>a.category===activeCategory)}
function pluralArticles(n){const a=n%10,b=n%100;return a===1&&b!==11?'статья':a>=2&&a<=4&&(b<12||b>14)?'статьи':'статей'}
function setCodePart(part){activePart=part;currentChapter='';render()}
function setCodeCategory(category){codeView='root';activeCategory=category;const visible=filteredCodeArticles();if(!visible.some(a=>a.section===activePart))activePart=visible[0]?.section||activePart;currentChapter='';render()}
function codeRootScreen(){
  const list=filteredCodeArticles(),cats=['Все',...new Set(articles.map(a=>a.category))],parts=['Общая часть','Особенная часть'];
  const partArticles=list.filter(a=>a.section===activePart),chapters=[...new Set(partArticles.map(a=>a.chapter))].sort((a,b)=>a.localeCompare(b,'ru',{numeric:true}));
  if(!chapters.includes(currentChapter))currentChapter=chapters[0]||'';
  const chapterArticles=partArticles.filter(a=>a.chapter===currentChapter).sort((a,b)=>a.number.localeCompare(b.number,'ru',{numeric:true}));
  const search='<div class="search-wrap"><div style="position:relative"><span style="position:absolute;left:14px;top:13px;color:var(--gold)">'+ic('search',18)+'</span><input id="code-search" class="search" type="search" aria-label="Поиск по кодексу: номер, название или слово из текста" value="'+esc(searchQuery)+'" placeholder="Номер, название или слово из текста" oninput="searchQuery=this.value;renderSearchResults()" onfocus="renderSearchResults()"></div><div id="search-results"></div></div>';
  const chips='<div class="category-strip"><button class="category-chip" onclick="openFavoritesInCode()">'+ic('bookmark',13)+' Избранное</button><label class="category-filter-wrap"><span class="note" style="padding:0">Категория</span><select class="field category-filter" aria-label="Фильтр по категории преступлений" onchange="setCodeCategory(this.value)">'+cats.map(c=>'<option value="'+esc(c)+'"'+(activeCategory===c?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select></label></div>';
  const tabs='<div class="part-tabs">'+parts.map(part=>{const count=list.filter(a=>a.section===part).length;return '<button class="part-tab'+(activePart===part?' on':'')+'" onclick="setCodePart(\''+part+'\')"><b>'+part+'</b><span>'+count+' '+pluralArticles(count)+'</span></button>'}).join('')+'</div>';
  const chapterButtons=chapters.map(ch=>'<button class="chapter-btn" style="'+(ch===currentChapter?'color:var(--gold2);background:rgba(201,162,75,.07);border-radius:8px;padding-left:8px;padding-right:8px':'')+'" data-action="openChapter" data-arg="'+esc(ch)+'"><span>'+esc(ch)+'</span><b>'+partArticles.filter(a=>a.chapter===ch).length+' ›</b></button>').join('');
  const chapterSelect='<div class="mobile-chapter-select"><label class="note" style="display:block;margin-bottom:8px">Выберите главу</label><select class="field" aria-label="Выберите главу кодекса" onchange="openChapter(this.value)">'+chapters.map(ch=>'<option value="'+esc(ch)+'" '+(ch===currentChapter?'selected':'')+'>'+esc(ch)+' · '+partArticles.filter(a=>a.chapter===ch).length+'</option>').join('')+'</select></div>';
  const articleList=chapterArticles.length?chapterArticles.map(a=>'<button class="article-row" data-action="openArticle" data-arg="'+esc(a.id)+'"><span class="article-number">'+esc(a.number)+'</span><span class="article-title">'+esc(a.title)+'<span class="article-meta">'+esc(a.category)+'</span></span><span class="article-chevron">'+ic('chevron',16)+'</span></button>').join(''):'<p class="note" style="padding:24px 4px">В этой категории статей нет. Выберите другую категорию или часть.</p>';
  const catalog=articles.length?tabs+'<div class="catalog-layout"><div class="card chapter-panel" style="padding-top:12px;padding-bottom:12px"><p class="eyebrow" style="margin:4px 2px 8px">Главы</p><div class="chapter-list">'+chapterButtons+'</div></div><div>'+chapterSelect+'<div class="card catalog-articles" style="padding-top:14px;padding-bottom:14px"><div class="catalog-articles-head"><h2>'+esc(currentChapter||'Выберите главу')+'</h2><p class="note" style="padding:4px 0 0">'+chapterArticles.length+' '+pluralArticles(chapterArticles.length)+' · выберите нужную</p></div>'+articleList+'</div></div></div>':'<div class="card" style="text-align:center;padding:36px"><h2>Статьи пока не добавлены</h2><p class="sub" style="margin:10px auto">Выполните миграцию таблицы articles и SQL-загрузчик со 100 статьями в Supabase.</p></div>';
  return header('Навигатор по закону','Уголовный кодекс <span class="goldtext">РФ</span>','Выберите часть и главу — статьи появятся рядом. Или найдите нужную через поиск.')+search+chips+catalog;
}
function chapterScreen(){
  const list=articles.filter(a=>a.chapter===currentChapter).sort((a,b)=>a.number.localeCompare(b.number,'ru',{numeric:true}));
  return '<button class="back-btn" onclick="codeView=\'root\';render()">‹ К частям и главам</button>'+header('Глава УК РФ',esc(currentChapter),list.length+' статей в базе')+'<div class="card" style="padding-top:6px;padding-bottom:6px">'+(list.length?list.map(a=>'<button class="article-row" data-action="openArticle" data-arg="'+esc(a.id)+'"><span class="article-number">'+esc(a.number)+'</span><span class="article-title">'+esc(a.title)+'</span><span class="chip">'+esc(a.category)+'</span></button>').join(''):'<p class="note" style="padding:20px 0">Статьи пока не добавлены</p>')+'</div>';
}
function chapterArticles(){
  const a=articles.find(x=>x.id===currentArticleId);
  if(!a)return[];
  return articles.filter(x=>x.section===a.section&&x.chapter===a.chapter).sort((x,y)=>x.number.localeCompare(y.number,'ru',{numeric:true}));
}
function selectArticle(id){
  if(id===currentArticleId)return;
  const list=chapterArticles(),from=list.findIndex(a=>a.id===currentArticleId),to=list.findIndex(a=>a.id===id);
  openArticle(id,to>=0&&from>=0?(to>from?1:-1):0);
}
function navigateArticle(step){
  const list=chapterArticles(),index=list.findIndex(a=>a.id===currentArticleId),next=list[index+step];
  if(next)openArticle(next.id,step);
}
function openArticleChapter(chapter){
  const current=articles.find(a=>a.id===currentArticleId);
  const target=articles.filter(a=>a.section===current?.section&&a.chapter===chapter).sort((a,b)=>a.number.localeCompare(b.number,'ru',{numeric:true}))[0];
  if(target)openArticle(target.id);
}
function articlePagerHTML(list,index){
  const prev=list[index-1],next=list[index+1];
  return '<div class="article-pager" aria-label="Переход между статьями"><button class="pager-btn" onclick="navigateArticle(-1)" '+(!prev?'disabled':'')+'><b>← Предыдущая</b><span>'+(prev?esc(articleHeading(prev))+'<br>'+esc(prev.title):'Вы на первой статье этой главы')+'</span></button><button class="pager-btn next" onclick="navigateArticle(1)" '+(!next?'disabled':'')+'><b>Следующая →</b><span>'+(next?esc(articleHeading(next))+'<br>'+esc(next.title):'Вы на последней статье этой главы')+'</span></button></div>';
}
function legalStructure(a){
  const text=String(a.official_text||'').trim();
  if(!text)return[];
  const paragraphs=text.split(/\n\s*\n/),groups=[];
  let current=null,inNotes=false;
  paragraphs.forEach(paragraph=>{
    const value=paragraph.trim();
    if(!value)return;
    if(/^Примечани[ея]/i.test(value)){
      current={id:'notes',label:'Примечания',type:'notes',paragraphs:[value]};
      groups.push(current);
      inNotes=true;
      return;
    }
    const match=!inNotes&&value.match(/^(\d+)\.\s+/);
    if(match){
      current={id:'part-'+match[1],label:'Часть '+match[1],type:'part',paragraphs:[value]};
      groups.push(current);
      return;
    }
    if(!current){
      current={id:'official-start',label:'Официальный текст',type:'text',paragraphs:[]};
      groups.push(current);
    }
    current.paragraphs.push(value);
  });
  return groups;
}
function legalStructureHTML(groups){
  if(!groups.length)return '<p class="legal-paragraph">Текст статьи пока не добавлен.</p>';
  return groups.map(group=>'<section id="'+group.id+'" data-legal-section class="'+(group.type==='notes'?'legal-notes':'legal-part')+'">'+group.paragraphs.map(p=>'<p class="legal-paragraph'+(/^наказыва(ется|ются)/i.test(p)?' legal-sanction':'')+'">'+esc(p)+'</p>').join('')+'</section>').join('');
}
function articleTocLinks(groups){
  return groups.filter(g=>g.type==='part'||g.type==='notes').map(g=>'<a class="toc-link" data-toc-link="'+g.id+'" href="#'+g.id+'" data-action="scrollToLegalPart" data-arg="'+esc(g.id)+'">'+esc(g.label)+'</a>').join('');
}
function articleNavHTML(a,list){
  const chapters=[...new Set(articles.filter(x=>x.section===a.section).map(x=>x.chapter))].sort((x,y)=>x.localeCompare(y,'ru',{numeric:true}));
  return '<aside class="article-nav" aria-label="Навигация по главам и статьям"><div class="card article-nav-panel"><details class="article-chapter-switch"><summary><span>Глава</span><b>'+esc(a.chapter)+'</b></summary>'+chapters.map(ch=>'<button class="article-chapter-option" data-action="openArticleChapter" data-arg="'+esc(ch)+'">'+esc(ch)+'</button>').join('')+'</details><div class="article-nav-list">'+list.map(x=>'<button class="article-nav-item'+(x.id===a.id?' active':'')+'" '+(x.id===a.id?'aria-current="page"':'')+' onclick="openArticle(\''+x.id+'\')"><b>'+esc(x.number)+'</b><span>'+esc(x.title)+'</span></button>').join('')+'</div></div></aside>';
}
function articleSidebarHTML(a,groups){
  const fav=isFavorite(a.id),busy=favBusyId===a.id,toc=articleTocLinks(groups);
  const related=Array.isArray(a.related_articles)?a.related_articles:[];
  const relatedHTML=related.length?'<div class="article-related"><h3>Связанные статьи</h3>'+related.map(item=>{
    const key=typeof item==='object'&&item?(item.number||item.id||''):String(item),target=articles.find(x=>x.id===String(key)||x.number===String(key));
    return target?'<button class="related-link" onclick="openArticle(\''+target.id+'\')">'+esc(articleHeading(target))+' · '+esc(target.title)+'</button>':'<span class="saved-meta">'+esc(key)+'</span>';
  }).join('')+'</div>':'';
  return '<aside class="article-sidebar" aria-label="Сведения и действия"><div class="card article-sidebar-panel">'+(toc?'<div class="article-toc-desktop"><h3>Содержание статьи</h3><nav>'+toc+'</nav></div>':'')+'<div class="article-actions"><button class="favorite-btn'+(fav?' on':'')+'" data-favorite-toggle="'+esc(a.id)+'" aria-pressed="'+fav+'" data-action="toggleFavorite" data-arg="'+esc(a.id)+'" '+(busy?'disabled':'')+'>'+ic('bookmark',17)+(busy?'Сохраняем…':fav?'В избранном':'В избранное')+'</button><button class="btn-outline" onclick="scrollToNote()">'+ic('document',16)+' Заметка</button></div>'+(toc?'<details class="article-toc-mobile"><summary>Содержание статьи</summary><nav>'+toc+'</nav></details>':'')+'<div class="article-source"><div>Редакция актуальна с:<br><b>'+esc(formatDate(a.actual_from))+'</b></div>'+(a.source_url?'<a class="gold" href="'+esc(a.source_url)+'" target="_blank" rel="noopener noreferrer">Официальный источник ↗</a>':'')+'</div>'+relatedHTML+'<p id="fav-error" class="error" role="alert">'+esc(favError)+'</p></div></aside>';
}
function setActiveToc(id){
  document.querySelectorAll('[data-toc-link]').forEach(link=>{
    const active=link.dataset.tocLink===id;
    link.classList.toggle('active',active);
    if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
  });
}
function updateActiveToc(){
  const sections=[...document.querySelectorAll('[data-legal-section]')];
  if(!sections.length)return;
  const marker=Math.min(220,window.innerHeight*.3);
  let current=sections[0].id;
  for(const section of sections){if(section.getBoundingClientRect().top<=marker)current=section.id;else break}
  setActiveToc(current);
}
let tocFrame=false;
window.addEventListener('scroll',()=>{
  if(tab!=='code'||codeView!=='article'||tocFrame)return;
  tocFrame=true;
  requestAnimationFrame(()=>{tocFrame=false;updateActiveToc()});
},{passive:true});
function initArticleTOC(){updateActiveToc()}
function scrollToLegalPart(event,id){
  if(event)event.preventDefault();
  const element=document.getElementById(id);
  if(!element)return;
  document.querySelectorAll('.article-toc-mobile').forEach(details=>details.open=false);
  setActiveToc(id);
  element.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
function scrollToNote(){
  const element=document.getElementById('article-note-card');
  if(!element)return;
  element.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  setTimeout(()=>{const area=document.getElementById('article-note');if(area&&!area.disabled)area.focus({preventScroll:true})},320);
}
function articleScreen(){
  const a=articles.find(x=>x.id===currentArticleId);
  if(!a)return '<button class="back-btn" onclick="backToCatalog()">‹ К кодексу</button><div class="card"><h2>Статья пока не добавлена</h2><p class="note">Она могла быть удалена из базы. Вернитесь к каталогу и выберите другую статью.</p></div>';
  const list=chapterArticles(),index=Math.max(0,list.findIndex(x=>x.id===a.id)),groups=legalStructure(a);
  const motion=articleDirection>0?' article-slide-next':articleDirection<0?' article-slide-prev':'';
  const toolbar='<div class="article-toolbar"><label class="article-select-label"><span>Быстрый переход по главе</span><select class="field" aria-label="Выберите статью текущей главы" onchange="selectArticle(this.value)">'+list.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===a.id?'selected':'')+'>'+esc(articleHeading(x))+' — '+esc(x.title)+'</option>').join('')+'</select></label><span class="article-position">'+(index+1)+' из '+list.length+'</span></div>';
  const simple=String(a.simple_explanation||'').trim()?'<section class="article-simple"><h2>Простыми словами</h2><p>'+esc(a.simple_explanation)+'</p></section>':'';
  return '<button class="back-btn" onclick="backToCatalog()">‹ Назад к списку статей</button><div class="article-static'+motion+'"><header class="article-header"><div class="eyebrow">'+esc(a.section)+' · '+esc(a.chapter)+'</div><h1>'+esc(articleHeading(a))+'</h1><p class="article-title-line">'+esc(a.title)+'</p><span class="chip">'+esc(a.category)+'</span></header><div class="article-layout">'+articleNavHTML(a,list)+articleSidebarHTML(a,groups)+'<div class="article-main">'+toolbar+'<section class="article-official"><h2>Официальный текст</h2><div class="legal-text">'+legalStructureHTML(groups)+'</div></section>'+simple+'<section id="article-note-card" class="card article-note-card"><div class="row" style="justify-content:space-between"><h2>Личная заметка</h2><span id="note-status" class="note" style="padding:0" aria-live="polite">'+esc(noteStatus)+'</span></div><textarea id="article-note" class="note-input" style="margin-top:14px" placeholder="Ваши комментарии к статье" oninput="currentNote=this.value" '+(noteLoading?'disabled':'')+'>'+esc(currentNote)+'</textarea><p id="note-error" class="error" role="alert">'+esc(noteError)+'</p><button id="note-save" class="btn-gold" style="margin-top:12px" onclick="saveNote()" '+((noteBusy||noteLoading)?'disabled':'')+'>'+(noteBusy?'Сохраняем…':'Сохранить')+'</button></section>'+articlePagerHTML(list,index)+'</div></div></div>';
}
function codeScreen(){if(!articlesLoaded)return header('Навигатор по закону','Уголовный кодекс <span class="goldtext">РФ</span>')+'<div class="card" style="text-align:center"><div class="spinner" style="margin:10px auto"></div><p class="sub">Загружаем статьи из Supabase…</p></div>';if(articlesError)return header('Навигатор по закону','Уголовный кодекс <span class="goldtext">РФ</span>')+'<div class="card"><h2>Не удалось загрузить статьи</h2><p class="error">'+esc(articlesError)+'</p><p class="note" style="margin:12px 0">Проверьте миграцию таблицы articles и выполните SQL-загрузчик.</p><button class="btn-outline" onclick="loadCodeData()">Повторить</button></div>';if(codeView==='article')return articleScreen();if(codeView==='favorites')return favoritesScreen();if(codeView==='chapter')return chapterScreen();return codeRootScreen()}
function openChapter(ch){currentChapter=ch;codeView='root';searchQuery='';articleDirection=0;render()}
function backToCatalog(){codeView='root';articleDirection=0;render();scrollTo(0,0)}
function openCodeCatalog(){tab='code';codeView='root';articleDirection=0;render();scrollTo(0,0)}
function openFavoritesInCode(){tab='code';codeView='favorites';searchQuery='';renderNav();render();scrollTo(0,0)}
function openSavedArticle(id){if(!articles.some(a=>a.id===id))return;tab='code';codeView='root';openArticle(id)}
function openArticle(id,direction){
  direction=direction||0;
  if((id===currentArticleId&&codeView==='article')||(direction&&articleNavigating))return;
  const a=articles.find(x=>x.id===id);
  if(!a)return;
  currentArticleId=id;
  currentChapter=a.chapter;
  activePart=a.section;
  codeView='article';
  articleDirection=direction;
  articleNavigating=!!direction;
  noteId='';
  currentNote='';
  noteLoading=true;
  noteStatus='Загружаем заметку…';
  noteError='';
  favError='';
  render();
  articleDirection=0;
  scrollTo({top:0,behavior:direction?'smooth':'auto'});
  if(direction)setTimeout(()=>{articleNavigating=false},270);
  loadNote(id);
}
function highlight(text,q){const safe=esc(text);if(!q)return safe;const needle=esc(q).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');try{return safe.replace(new RegExp('('+needle+')','ig'),'<mark>$1</mark>')}catch(e){return safe}}
function renderSearchResults(){const box=document.getElementById('search-results');if(!box)return;const q=searchQuery.trim().toLowerCase();if(!q){box.innerHTML='';return}const found=articles.filter(a=>a.number.toLowerCase().includes(q)||a.title.toLowerCase().includes(q)||a.official_text.toLowerCase().includes(q)).slice(0,8);box.innerHTML='<div class="search-results">'+(found.length?found.map(a=>'<button class="search-result" data-action="openArticle" data-arg="'+esc(a.id)+'"><b>'+highlight(a.number,q)+'</b> · '+highlight(a.title,q)+'<br><span style="font-size:11px;color:var(--dim)">'+esc(a.category)+'</span></button>').join(''):'<p class="note" style="padding:16px">Статья пока не добавлена или совпадений нет</p>')+'</div>'}
let favError='';
function isFavorite(articleId){return favorites.some(f=>f.article_id===articleId)}
function syncFavoriteUI(articleId){
  const fav=isFavorite(articleId),busy=favBusyId===articleId;
  document.querySelectorAll('[data-favorite-toggle]').forEach(btn=>{
    if(btn.dataset.favoriteToggle!==articleId)return;
    btn.classList.toggle('on',fav);
    btn.disabled=busy;
    btn.setAttribute('aria-pressed',String(fav));
    btn.innerHTML=ic('bookmark',17)+(busy?'Сохраняем…':fav?'В избранном':'В избранное');
  });
  document.querySelectorAll('[data-favorite-remove]').forEach(btn=>{
    if(btn.dataset.favoriteRemove!==articleId)return;
    btn.disabled=busy;
    btn.innerHTML=busy?'<span class="spinner" style="width:16px;height:16px"></span>':ic('x',17);
  });
  const error=document.getElementById('fav-error');
  if(error)error.textContent=favError;
}
async function toggleFavorite(articleId){
  if(favBusyId||!session)return;
  codeRequestId++;
  favBusyId=articleId;
  favError='';
  syncFavoriteUI(articleId);
  try{
    const existing=favorites.find(f=>f.article_id===articleId);
    if(existing){
      const{error}=await client.from('favorites').delete().eq('id',existing.id).eq('user_id',session.user.id);
      if(error)throw error;
      favorites=favorites.filter(f=>f.id!==existing.id);
    }else{
      const{data,error}=await client.from('favorites').insert({user_id:session.user.id,article_id:articleId}).select('id,article_id,created_at').single();
      if(error)throw error;
      favorites.push(data);
    }
  }catch(e){favError=e.message||String(e)}
  finally{
    favBusyId='';
    if(session)writeCache(codeCacheKey(session.user.id),{articles,favorites});
    if(tab==='favorites')render();else syncFavoriteUI(articleId);
  }
}
function syncNoteUI(){
  const area=document.getElementById('article-note');
  if(area){area.disabled=noteLoading;if(area.value!==currentNote)area.value=currentNote}
  const status=document.getElementById('note-status');
  if(status)status.textContent=noteStatus;
  const error=document.getElementById('note-error');
  if(error)error.textContent=noteError;
  const button=document.getElementById('note-save');
  if(button){button.disabled=noteBusy||noteLoading;button.textContent=noteBusy?'Сохраняем…':'Сохранить'}
}
async function loadNote(articleId){
  const request=++noteRequestId;
  noteLoading=true;
  noteStatus='Загружаем заметку…';
  noteError='';
  syncNoteUI();
  try{
    const{data,error}=await client.from('user_notes').select('id,note_text,updated_at').eq('user_id',session.user.id).eq('article_id',articleId).order('updated_at',{ascending:false}).limit(1).maybeSingle();
    if(error)throw error;
    if(request!==noteRequestId||currentArticleId!==articleId)return;
    noteLoading=false;
    noteId=data?.id||'';
    currentNote=data?.note_text||'';
    noteStatus=data?'Заметка восстановлена':'Заметок пока нет';
  }catch(e){
    if(request!==noteRequestId||currentArticleId!==articleId)return;
    noteLoading=false;
    noteError=e.message||String(e);
    noteStatus='Не удалось загрузить';
  }
  syncNoteUI();
}
async function saveNote(){
  if(noteBusy||noteLoading||!session||!currentArticleId)return;
  const articleId=currentArticleId,request=noteRequestId,text=currentNote,existingId=noteId;
  noteBusy=true;
  noteError='';
  noteStatus='Сохраняем…';
  syncNoteUI();
  try{
    let data,error;
    if(existingId&&!text.trim()){({error}=await client.from('user_notes').delete().eq('id',existingId).eq('user_id',session.user.id));if(error)throw error;if(currentArticleId===articleId&&request===noteRequestId){noteId='';noteStatus='Заметка удалена'}}
    else if(existingId){({data,error}=await client.from('user_notes').update({note_text:text}).eq('id',existingId).eq('user_id',session.user.id).select('id').single());if(error)throw error;if(currentArticleId===articleId&&request===noteRequestId){noteId=data.id;noteStatus='Сохранено в Supabase ✓'}}
    else if(text.trim()){({data,error}=await client.from('user_notes').insert({user_id:session.user.id,article_id:articleId,note_text:text}).select('id').single());if(error)throw error;if(currentArticleId===articleId&&request===noteRequestId){noteId=data.id;noteStatus='Сохранено в Supabase ✓'}}
    else if(currentArticleId===articleId&&request===noteRequestId)noteStatus='Заметок пока нет';
  }catch(e){
    if(currentArticleId===articleId&&request===noteRequestId){noteError=e.message||String(e);noteStatus='Не сохранено'}
  }finally{
    noteBusy=false;
    if(currentArticleId===articleId&&request===noteRequestId)syncNoteUI();
  }
}
function favoritesScreen(){
  const title=header('Личная библиотека','Избранные <span class="goldtext">статьи</span>','Сохранённые нормы всегда под рукой — открывайте их без повторного поиска в каталоге.');
  if(!articlesLoaded)return title+'<div class="card" style="text-align:center"><div class="spinner" style="margin:10px auto"></div><p class="sub">Загружаем избранное…</p></div>';
  if(articlesError)return title+'<div class="card"><h2>Не удалось загрузить статьи</h2><p class="error">'+esc(articlesError)+'</p><button class="btn-outline" onclick="loadCodeData()">Повторить</button></div>';
  if(favError)return title+'<div class="card"><h2>Не удалось обновить избранное</h2><p class="error">'+esc(favError)+'</p><button class="btn-outline" onclick="loadCodeData()">Повторить</button></div>';
  if(!favorites.length)return title+'<div class="card" style="text-align:center;padding:42px 22px"><div style="display:flex;justify-content:center;margin-bottom:18px"><div class="iconbox" style="width:68px;height:68px">'+ic('bookmark',32)+'</div></div><h2 style="font-size:21px">Здесь появятся ваши статьи</h2><p class="sub" style="margin:10px auto 20px;max-width:390px">Нажмите «В избранное» при чтении статьи. Сохранение работает и в гостевом режиме.</p><button class="btn-gold" onclick="openCodeCatalog()">Перейти к кодексу '+ic('chevron',15)+'</button></div>';
  const ordered=[...favorites].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  const rows=ordered.map(f=>{
    const a=articles.find(x=>x.id===f.article_id),busy=favBusyId===f.article_id;
    return '<div class="saved-row"><button class="saved-open" data-action="openSavedArticle" data-arg="'+esc(f.article_id)+'" '+(!a?'disabled':'')+'>'+(a?'<b class="gold">'+esc(articleHeading(a))+'</b> · '+esc(a.title)+'<span class="saved-meta">'+esc(a.chapter)+' · '+esc(a.category)+'</span>':'Статья недоступна в текущей базе<span class="saved-meta">Её можно удалить из избранного</span>')+'</button><button class="saved-delete" data-favorite-remove="'+esc(f.article_id)+'" aria-label="Удалить '+(a?esc(articleHeading(a)):'статью')+' из избранного" data-action="toggleFavorite" data-arg="'+esc(f.article_id)+'" '+(busy?'disabled':'')+'>'+(busy?'<span class="spinner" style="width:16px;height:16px"></span>':ic('x',17))+'</button></div>';
  }).join('');
  return title+'<div class="row" style="justify-content:space-between"><h2>Сохранено</h2><span class="chip">'+favorites.length+' '+pluralArticles(favorites.length)+'</span></div><div class="card" style="padding-top:8px;padding-bottom:8px">'+rows+'</div>';
}
function savedArticlesHTML(){return '<div class="card" style="padding:6px 18px"><button class="listbtn" style="border:0;min-height:56px" onclick="openFavoritesInCode()">'+iconbox('bookmark',false,18)+'<span style="flex:1;text-align:left">Избранное<small style="display:block;margin-top:3px;color:var(--dim);font-weight:400">Сохранённые статьи и быстрый доступ к ним</small></span><span class="chip">'+favorites.length+'</span><span style="color:var(--dim)">'+ic('chevron',15)+'</span></button></div>'}
function initializeGameData(){ensureGameQuestions();ensureDetectiveScenarios();loadGameSessions()}
function detectiveCacheKey(userId){return'borba-detective-v1:'+userId}
async function ensureDetectiveScenarios(force){
  const userId=session?.user.id;if(!userId||detectiveScenariosLoading||(detectiveScenariosLoaded&&!force))return;
  if(!detectiveScenarios.length){const cached=readCache(detectiveCacheKey(userId));if(Array.isArray(cached)){detectiveScenarios=cached;detectiveScenariosLoaded=true}}
  const request=++detectiveScenarioRequestId;detectiveScenariosLoading=true;detectiveScenariosError='';if(tab==='home'&&menuView==='detective')render();
  const{data,error}=await client.from('detective_scenarios').select('id,title,xp_reward,max_score,payload').order('id');
  if(request!==detectiveScenarioRequestId||session?.user.id!==userId)return;
  detectiveScenariosLoading=false;detectiveScenariosLoaded=true;
  if(error)detectiveScenariosError=gameErrorText(error);else{detectiveScenarios=(data||[]).map(row=>({...row.payload,id:row.id,title:row.title,xp_reward:row.xp_reward,max_score:row.max_score}));detectiveScenariosError='';writeCache(detectiveCacheKey(userId),detectiveScenarios)}
  if((tab==='home'&&menuView==='detective')||gameView.startsWith('detective'))render();
}
async function loadGameSessions(force){
  const userId=session?.user.id;if(!userId||(gameSessionsLoaded&&!force&&!gameSessionsLoading))return;
  if(gameSessionsLoading)return gameSessionsPromise;
  gameSessionsLoading=true;gameSessionsError='';if(tab==='home'||tab==='game')render();
  gameSessionsPromise=(async()=>{
    const{data,error}=await client.from('game_sessions').select('*').eq('user_id',userId).order('updated_at',{ascending:false});
    if(session?.user.id!==userId)return;
    gameSessionsLoading=false;gameSessionsLoaded=true;
    if(error)gameSessionsError=gameErrorText(error);else gameSessions=data||[];
    if(tab==='home'||tab==='game')render();
  })();
  return gameSessionsPromise;
}
function latestActiveSession(mode){return gameSessions.filter(s=>s.mode===mode&&s.status==='active').sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at))[0]||null}
async function ensureSessionListForStart(){
  if(gameSessionsLoaded&&!gameSessionsLoading&&!gameSessionsError)return true;
  sessionBusy=true;render();await loadGameSessions(true);sessionBusy=false;
  if(gameSessionsError){sessionError='Не удалось проверить сохранённые игры. Повторите попытку: '+gameSessionsError;render();return false}
  return true;
}
function sessionPositionText(record){if(record.status==='completed')return'Завершено';const state=record.state||{};if(record.mode==='training'){const total=state.entries?.length||state.question_ids?.length||0;return'Вопрос '+Math.min(total,(record.current_position||0)+1)+' из '+total}return state.started?'Этап '+((record.current_position||0)+1)+' из '+(state.total_steps||3):'Брифинг'}
function sessionScoreText(record){return record.mode==='training'?((record.state||{}).xp||0)+' XP':(record.score||0)+' баллов'}
function formatSessionDate(value){try{return new Date(value).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}catch(e){return''}}
function runtimeIsActive(){return Boolean((gameRound&&(gameView==='question'||gameView==='summary'))||(detectiveRound&&(gameView==='detective-briefing'||gameView==='detective-step'||gameView==='detective-result')))}
function trainingSessionRecord(){
  const state={question_ids:gameRound.entries.map(e=>e.question.id),entries:gameRound.entries.map(e=>({question_id:e.question.id,selected:e.selected,answerId:e.answerId,answered:e.answered,saved:e.saved,isCorrect:e.isCorrect,xpEarned:e.xpEarned,newMistake:e.newMistake})),correct:gameRound.correct,xp:gameRound.xp,newMistakes:gameRound.newMistakes};
  return{id:gameRound.sessionId,mode:'training',session_key:'training:'+gameRound.difficulty,title:gameRound.difficulty==='mistakes'?'Работа над ошибками':'Тренировка УПК · '+(gameRound.difficulty==='novice'?'Новичок':'Начинающий'),difficulty:gameRound.difficulty,scenario_id:null,state,status:gameRound.status,current_position:gameRound.index,score:gameRound.xp};
}
async function saveSessionRecord(record){
  const userId=session?.user.id;if(!userId)throw new Error('Сессия пользователя не найдена');
  const values={user_id:userId,mode:record.mode,session_key:record.session_key,title:record.title,difficulty:record.difficulty,scenario_id:record.scenario_id,state:record.state,status:record.status,current_position:record.current_position,score:record.score,best_score:record.best_score||0,xp_earned:record.xp_earned||0};
  let result;
  if(record.id)result=await client.from('game_sessions').update(values).eq('id',record.id).eq('user_id',userId).select().single();
  else{
    const existing=await client.from('game_sessions').select('id').eq('user_id',userId).eq('mode',record.mode).eq('session_key',record.session_key).eq('status','active').maybeSingle();
    if(existing.error)throw existing.error;
    result=existing.data?await client.from('game_sessions').update(values).eq('id',existing.data.id).select().single():await client.from('game_sessions').insert(values).select().single();
  }
  if(result.error)throw result.error;
  const saved=result.data,index=gameSessions.findIndex(s=>s.id===saved.id);
  if(index>=0)gameSessions[index]=saved;else gameSessions.unshift(saved);
  gameSessions.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));
  return saved;
}
async function saveCurrentRuntime(){
  try{
    if(gameRound&&gameView==='question'){
      if(gameAnswerBusy)return false;
      const entry=currentGameEntry();
      if(entry?.answered&&!entry.saved){await persistGameAnswer(entry);if(!entry.saved){sessionError=entry.saveError||'Ответ не сохранён';return false}}
      const saved=await saveSessionRecord(trainingSessionRecord());gameRound.sessionId=saved.id;
    }else if(detectiveRound&&(gameView==='detective-briefing'||gameView==='detective-step')){
      if(detectiveAnswerBusy)return false;
      const answer=currentDetectiveAnswer();
      if(detectiveRound.completionPrepared&&answer?.saved&&detectiveRound.index===detectiveRound.scenario.steps.length-1){await completeDetectiveSession();return detectiveRound.status==='completed'}
      if(answer?.answered&&!answer.saved){await persistDetectiveAnswer();if(!answer.saved){sessionError=answer.saveError||'Решение не сохранено';return false}}
      const saved=await saveSessionRecord(detectiveSessionRecord());detectiveRound.sessionId=saved.id;
    }else if(gameRound&&gameView==='summary'){
      const saved=await saveSessionRecord(trainingSessionRecord());gameRound.sessionId=saved.id;
    }else if(detectiveRound&&gameView==='detective-result'){
      const saved=await saveSessionRecord(detectiveSessionRecord());detectiveRound.sessionId=saved.id;
    }
    sessionError='';return true;
  }catch(error){sessionError=gameErrorText(error);return false}
}
function queueSessionSave(){sessionSaveQueue=sessionSaveQueue.then(()=>saveCurrentRuntime()).catch(()=>false);return sessionSaveQueue}
async function suspendActiveGame(){
  if(sessionBusy)return false;sessionBusy=true;sessionError='';render();
  await sessionSaveQueue;const ok=await saveCurrentRuntime();sessionBusy=false;
  if(ok){gameRound=null;detectiveRound=null;gameView='sessions';gameAnswerBusy=false;detectiveAnswerBusy=false}
  render();return ok;
}
async function exitActiveGame(){if(runtimeIsActive()){const ok=await suspendActiveGame();if(!ok)return}else{gameRound=null;detectiveRound=null;gameView='sessions'}menuView='modes';tab='home';render();scrollTo(0,0);initializeGameData()}
async function resumeSession(id){
  if(sessionBusy)return;const record=gameSessions.find(s=>s.id===id);if(!record){sessionError='Сессия не найдена. Обновите список игр.';render();return}
  sessionBusy=true;sessionError='';render();
  try{
    if(record.mode==='training'){
      await ensureGameQuestions();const state=record.state||{},entries=(state.entries||[]).map(saved=>{const question=gameQuestions.find(q=>q.id===saved.question_id);if(!question)throw new Error('Вопрос из сохранённой сессии не найден');return{question,selected:saved.selected||[],answerId:saved.answerId||makeGameAnswerId(),answered:Boolean(saved.answered),saved:Boolean(saved.saved),isCorrect:Boolean(saved.isCorrect),xpEarned:saved.xpEarned||0,newMistake:Boolean(saved.newMistake),saveError:''}});
      if(!entries.length)throw new Error('Сохранённая тренировка пуста');
      gameRound={sessionId:record.id,difficulty:record.difficulty,entries,index:record.current_position||0,correct:state.correct||0,xp:state.xp||0,newMistakes:state.newMistakes||0,status:record.status};detectiveRound=null;level=record.difficulty;gameView=record.status==='completed'?'summary':'question';
    }else{await ensureDetectiveScenarios();restoreDetectiveSession(record)}
    tab='game';menuView='modes';sessionError='';
  }catch(error){sessionError=gameErrorText(error)}
  sessionBusy=false;render();scrollTo(0,0);
}
function activeToolbar(mode,id){
  const inlineError=mode==='detective'&&currentDetectiveAnswer()?.saveError;
  return'<div class="session-toolbar"><button class="btn-outline" onclick="exitActiveGame()" '+(sessionBusy?'disabled':'')+'>← '+(sessionBusy?'Сохраняем…':'Выйти в меню')+'</button><button class="btn-text" onclick="requestReset(\''+mode+'\',\''+id+'\')" '+(sessionBusy?'disabled':'')+'>Начать заново</button></div>'+(sessionError&&!inlineError?'<div class="save-error"><p class="error">Не удалось сохранить прогресс: '+esc(sessionError)+'</p><button class="btn-outline" onclick="exitActiveGame()">Повторить сохранение</button></div>':'');
}
function sessionCard(record,completed){
  return'<div class="card session-card"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="eyebrow">'+(record.mode==='training'?'Тренировка УПК':'Детектив')+'</div><h2>'+esc(record.title)+'</h2></div><span class="chip">'+(completed?'Завершена':'В процессе')+'</span></div><div class="session-card-meta"><span>'+esc(sessionPositionText(record))+'</span><span>'+esc(sessionScoreText(record))+'</span><span>'+esc(formatSessionDate(record.updated_at))+'</span></div><div class="game-answer-actions"><button class="btn-gold" data-action="resumeSession" data-arg="'+esc(record.id)+'">'+(completed?'Итоги':'Продолжить')+' '+ic('chevron',14)+'</button><button class="btn-outline" onclick="requestReset(\''+record.mode+'\',\''+record.id+'\')">Начать заново</button></div></div>';
}
function gameSessionsScreen(){
  const active=gameSessions.filter(s=>s.status==='active'),completed=gameSessions.filter(s=>s.status==='completed');
  let body='';
  if(gameSessionsLoading&&!gameSessionsLoaded)body='<div class="card save-status" style="justify-content:center"><span class="spinner"></span>Загружаем начатые игры…</div>';
  else if(gameSessionsError&&!gameSessions.length)body='<div class="card"><p class="error">'+esc(gameSessionsError)+'</p><button class="btn-outline" onclick="loadGameSessions(true)">Повторить загрузку</button></div>';
  else if(!active.length)body='<div class="card" style="text-align:center;padding:36px 22px">'+iconbox('target')+'<h2 style="margin-top:14px">У вас пока нет начатых игр</h2><p class="sub" style="margin:8px auto 18px">Выберите режим на главной странице</p><button class="btn-gold" onclick="menuView=\'modes\';go(\'home\')">Выбрать режим</button></div>';
  else body='<div class="session-list">'+active.map(s=>sessionCard(s,false)).join('')+'</div>';
  return header('Ваши прохождения','Начатые <span class="goldtext">игры</span>','Каждая тренировка и каждый сценарий сохраняются отдельно. Продолжите с последнего сохранённого действия.')+(sessionError?'<p class="notice">'+esc(sessionError)+'</p>':'')+body+(completed.length?'<div class="row" style="justify-content:space-between;margin-top:16px"><h2>Завершённые</h2><span class="chip">'+completed.length+'</span></div><div class="session-list">'+completed.map(s=>sessionCard(s,true)).join('')+'</div>':'');
}
function gameScreen(){if(gameView==='question'&&currentGameEntry())return gameQuestionScreen();if(gameView==='summary'&&gameRound)return gameSummaryScreen();if(gameView==='detective-briefing'&&detectiveRound)return detectiveBriefingScreen();if(gameView==='detective-step'&&detectiveRound)return detectiveStepScreen();if(gameView==='detective-result'&&detectiveRound)return detectiveResultScreen();return gameSessionsScreen()}
function resetGameState(){gameDataRequestId++;detectiveScenarioRequestId++;gameQuestionRequestId++;gameQuestions=[];gameQuestionsLoaded=false;gameQuestionsLoading=false;gameQuestionsError='';gameSessions=[];gameSessionsLoaded=false;gameSessionsLoading=false;gameSessionsError='';detectiveScenarios=[];detectiveScenariosLoaded=false;detectiveScenariosLoading=false;detectiveScenariosError='';gameView='sessions';gameRound=null;detectiveRound=null;menuView='modes';gameAnswerBusy=false;detectiveAnswerBusy=false;sessionBusy=false;sessionError='';resetTarget=null;sessionSaveQueue=Promise.resolve();gameSessionsPromise=null;const modal=document.getElementById('reset-game');if(modal)modal.style.display='none';closeAnalysis()}
function gameCacheKey(userId){return'borba-questions-v1:'+userId}
function gameCountText(n){const a=n%10,b=n%100;return n+' '+(a===1&&b!==11?'вопрос':a>=2&&a<=4&&(b<12||b>14)?'вопроса':'вопросов')}
function gameErrorText(error){const m=String(error?.message||error||'').toLowerCase();if(m.includes('submit_game_answer')||m.includes('pgrst202'))return'Функция сохранения ответа не найдена. Выполните SQL-миграцию игрового режима.';if(m.includes('questions')&&(m.includes('does not exist')||m.includes('schema cache')))return'Таблица вопросов не найдена. Выполните миграцию и загрузите вопросы.';if(m.includes('row-level security')||m.includes('permission denied'))return'Supabase отклонил запрос. Проверьте RLS-политики игровой миграции.';if(m.includes('failed to fetch')||m.includes('network'))return'Нет соединения с Supabase. Проверьте интернет и повторите попытку.';return String(error?.message||error||'Неизвестная ошибка')}
function restoreGameCache(userId){const cached=readCache(gameCacheKey(userId));if(!Array.isArray(cached))return false;gameQuestions=cached;gameQuestionsLoaded=true;return true}
async function ensureGameQuestions(force){
  const userId=session?.user.id;
  if(!userId||gameQuestionsLoading||(gameQuestionsLoaded&&!force))return;
  if(!gameQuestions.length)restoreGameCache(userId);
  const request=++gameQuestionRequestId;
  gameQuestionsLoading=true;gameQuestionsError='';
  if(tab==='game')render();
  const{data,error}=await client.from('questions').select('id,type,difficulty,category,article_ref,text,options,correct_answers,explanation_correct,explanation_wrong,elements,extra_example').order('id');
  if(request!==gameQuestionRequestId||session?.user.id!==userId)return;
  gameQuestionsLoading=false;gameQuestionsLoaded=true;
  if(error)gameQuestionsError=gameErrorText(error);
  else{gameQuestions=data||[];gameQuestionsError='';writeCache(gameCacheKey(userId),gameQuestions)}
  if(tab==='game')render();
}
function setGameLevel(value){level=value;menuView='training';render()}
function makeGameAnswerId(){
  if(window.crypto?.randomUUID)return window.crypto.randomUUID();
  const bytes=new Uint8Array(16);
  if(window.crypto?.getRandomValues)window.crypto.getRandomValues(bytes);else for(let i=0;i<16;i++)bytes[i]=Math.floor(Math.random()*256);
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
}
function currentGameEntry(){return gameRound?.entries[gameRound.index]||null}
function buildTrainingRound(difficulty,customPool){
  const pool=(customPool||gameQuestions.filter(q=>q.difficulty===difficulty)).slice();
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
  return{sessionId:null,difficulty,entries:pool.slice(0,Math.min(10,pool.length)).map(question=>({question,selected:[],answerId:makeGameAnswerId(),answered:false,saved:false,isCorrect:false,xpEarned:0,newMistake:false,saveError:''})),index:0,correct:0,xp:0,newMistakes:0,status:'active'};
}
async function startGameRound(difficulty){
  if(sessionBusy||!(await ensureSessionListForStart()))return;const existing=gameSessions.find(s=>s.mode==='training'&&s.status==='active'&&s.session_key==='training:'+difficulty);if(existing)return resumeSession(existing.id);
  if(!gameQuestions.filter(q=>q.difficulty===difficulty).length)return;
  sessionBusy=true;sessionError='';gameRound=buildTrainingRound(difficulty);detectiveRound=null;render();
  try{const saved=await saveSessionRecord(trainingSessionRecord());gameRound.sessionId=saved.id;level=difficulty;gameView='question';tab='game';menuView='modes'}
  catch(error){gameRound=null;sessionError=gameErrorText(error)}
  sessionBusy=false;render();scrollTo(0,0);
}
function repeatGameRound(){if(gameRound)requestReset('training',gameRound.sessionId)}
function trainingSetupScreen(){
  const levels=[['novice','Новичок','Процессуальные ситуации для первой тренировки',10],['beginner','Начинающий','Более подробные задачи на применение норм УПК РФ',20]];
  let content='';
  if(gameQuestionsLoading&&!gameQuestionsLoaded)content='<div class="card save-status" style="justify-content:center"><span class="spinner"></span>Загружаем вопросы…</div>';
  else if(gameQuestionsError&&!gameQuestions.length)content='<div class="card"><p class="error">'+esc(gameQuestionsError)+'</p><button class="btn-outline" onclick="ensureGameQuestions(true)">Повторить загрузку</button></div>';
  else content='<div class="grid2">'+levels.map(item=>{const count=gameQuestions.filter(q=>q.difficulty===item[0]).length,active=gameSessions.find(s=>s.mode==='training'&&s.status==='active'&&s.session_key==='training:'+item[0]);return'<div class="card game-level-card'+(level===item[0]?' sel':'')+'"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><h2>'+item[1]+'</h2><p style="font-size:13px;color:var(--silver);margin-top:5px">'+item[2]+'</p></div>'+(active?'<span class="chip">В процессе</span>':'')+'</div><div style="margin:18px 0"><span class="game-count">'+count+'</span><span style="font-size:12px;color:var(--silver)"> доступно</span><p class="note">До 10 в раунде · +'+item[3]+' XP за верный ответ</p></div>'+(active?'<p class="gold">'+esc(sessionPositionText(active))+'</p><div class="game-answer-actions"><button class="btn-gold" data-action="resumeSession" data-arg="'+esc(active.id)+'">Продолжить</button><button class="btn-outline" data-action="requestReset" data-mode="training" data-arg="'+esc(active.id)+'">Начать заново</button></div>':'<button class="btn-gold" style="width:100%" onclick="startGameRound(\''+item[0]+'\')" '+(!count||sessionBusy||gameSessionsLoading||!gameSessionsLoaded?'disabled':'')+'>Начать · '+gameCountText(Math.min(10,count))+'</button>')+'</div>'}).join('')+'</div>';
  return'<button class="back-btn" onclick="menuView=\'modes\';render()">← Все режимы</button>'+header('Тренировка УПК','Выберите <span class="goldtext">сложность</span>','У каждой сложности независимая текущая попытка. История ответов и заработанный XP сохраняются.')+(sessionError?'<p class="notice">'+esc(sessionError)+'</p>':'')+content;
}
function gameCorrectAnswersHTML(q){return(q.correct_answers||[]).map(i=>'<div class="correct-answer">'+esc(q.options[i]||'')+'</div>').join('')}
function gameElementsHTML(elements){
  const e=elements&&typeof elements==='object'?elements:{},labels={issue:'Ключевой вопрос',rule:'Правовая норма',application:'Применение к ситуации',object:'Объект',objective_side:'Объективная сторона',subject:'Субъект',subjective_side:'Субъективная сторона',required_documents:'Необходимые процессуальные документы'},blocks=[];
  Object.keys(labels).forEach(key=>{const value=e[key];if(Array.isArray(value)&&value.length)blocks.push('<div class="analysis-block wide"><h4>'+labels[key]+'</h4><ul>'+value.filter(Boolean).map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul></div>');else if(typeof value==='string'&&value.trim())blocks.push('<div class="analysis-block"><h4>'+labels[key]+'</h4><p>'+esc(value)+'</p></div>')});
  return blocks.length?'<div class="result-section"><h3>Структура правового разбора</h3><div class="legal-analysis">'+blocks.join('')+'</div></div>':'';
}
function gameWrongExplanationsHTML(entry){
  const q=entry.question,correct=new Set(q.correct_answers||[]),selected=new Set(entry.selected),wrong=q.explanation_wrong||[];
  const selectedWrong=entry.selected.filter(i=>!correct.has(i)),otherWrong=q.options.map((_,i)=>i).filter(i=>!correct.has(i)&&!selected.has(i));
  const block=(indices,title)=>{const items=indices.filter(i=>String(wrong[i]||'').trim()).map(i=>'<div class="wrong-explanation"><b>'+esc(q.options[i])+'</b><p>'+esc(wrong[i])+'</p></div>').join('');return items?'<div class="result-section"><h3>'+title+'</h3>'+items+'</div>':''};
  let partial='';
  if(!selectedWrong.length&&q.type==='multiple')partial='<div class="result-section"><h3>Почему ответ не засчитан</h3><p>Выбраны не все верные варианты. Для зачёта нужно полное совпадение: без пропущенных и лишних ответов.</p></div>';
  return partial+block(selectedWrong,'Почему ваш вариант не подходит')+block(otherWrong,'Разбор остальных неверных вариантов');
}
function gameSaveHTML(entry){
  if(entry.saved)return'<div class="save-status saved">'+ic('check',15)+'Результат сохранён в Supabase</div>';
  if(gameAnswerBusy)return'<div class="save-status"><span class="spinner" style="width:16px;height:16px"></span>Сохраняем ответ, ошибку и начисленный опыт…</div>';
  return'<div class="save-error"><p class="error" style="margin:0">Не удалось сохранить результат: '+esc(entry.saveError||'ошибка соединения')+'</p><button class="btn-outline" onclick="retryGameSave()">Повторить сохранение</button></div>';
}
function gameResultHTML(entry){
  const q=entry.question,correct=entry.isCorrect,last=gameRound.index===gameRound.entries.length-1;
  return'<section class="answer-result '+(correct?'correct':'wrong')+'" id="answer-result"><div class="eyebrow">Результат ответа</div><h2>'+(correct?'Верно! Отличная работа':'Ответ неверный')+'</h2><div class="result-section"><h3>Правильный ответ</h3>'+gameCorrectAnswersHTML(q)+'</div>'+(q.article_ref?'<div class="result-section"><h3>Применимые нормы</h3><p>'+esc(q.article_ref)+'</p></div>':'')+(!correct?gameWrongExplanationsHTML(entry):'')+(q.explanation_correct?'<div class="result-section"><h3>Юридическое обоснование</h3><p>'+esc(q.explanation_correct)+'</p></div>':'')+gameElementsHTML(q.elements)+(!correct&&q.extra_example?'<div class="result-section"><h3>Дополнительный пример</h3><p>'+esc(q.extra_example)+'</p></div>':'')+(correct?'<div class="result-section"><span class="xp-pop">+'+entry.xpEarned+' XP</span><p style="margin-top:4px">'+(entry.saved?'Опыт начислен, уровень обновлён.':'Опыт будет начислен после сохранения.')+'</p></div>':'')+gameSaveHTML(entry)+'<div class="game-answer-actions">'+(!correct?'<button class="btn-outline" onclick="openAnalysis()">'+ic('document',16)+'Разобрать ошибку</button>':'')+'<button class="btn-gold" onclick="nextGameQuestion()" '+(!entry.saved||gameAnswerBusy?'disabled':'')+'>'+(last?'Завершить раунд':'Следующий вопрос')+' '+ic('chevron',15)+'</button></div></section>';
}
function gameQuestionScreen(){
  const entry=currentGameEntry(),q=entry.question,total=gameRound.entries.length,n=gameRound.index+1,correct=new Set(q.correct_answers||[]),multiple=q.type==='multiple';
  const options=q.options.map((text,i)=>{const picked=entry.selected.includes(i),state=entry.answered?(correct.has(i)?'Правильный ответ':picked?'Ваш неверный выбор':''):(picked?'Выбрано':''),classes='game-option'+(entry.answered&&correct.has(i)?' correct':entry.answered&&picked?' wrong':picked?' selected':'');return'<button class="'+classes+'" data-game-option="'+i+'" aria-pressed="'+picked+'" '+(entry.answered?'disabled':'')+' data-action="toggleGameOption" data-arg="'+i+'"><span class="option-letter">'+String.fromCharCode(65+i)+'</span><span class="option-text">'+esc(text)+(state?'<span class="option-state">'+state+'</span>':'')+'</span></button>'}).join('');
  const side='<aside class="game-side"><div class="card"><div class="eyebrow">Ваш раунд</div><dl><dt>Вопрос</dt><dd>'+n+' / '+total+'</dd><dt>Верных ответов</dt><dd>'+gameRound.correct+'</dd><dt>Заработано</dt><dd>'+gameRound.xp+' XP</dd><dt>Уровень</dt><dd>'+profile.level+'</dd><dt>Всего опыта</dt><dd>'+profile.xp+' XP</dd></dl>'+(q.article_ref?'<div class="article-ref"><b style="color:var(--gold2)">Нормы в задании</b><br>'+esc(q.article_ref)+'</div>':'')+'</div></aside>';
  return activeToolbar('training',gameRound.sessionId)+'<div class="game-round-head"><div><div class="eyebrow">Борьба умов · '+(gameRound.difficulty==='novice'?'Новичок':'Начинающий')+'</div><h1>Вопрос '+n+' <span class="goldtext">из '+total+'</span></h1></div><span class="chip">'+esc(q.category)+'</span></div><div class="game-progress" role="progressbar" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+n+'"><span style="width:'+(n/total*100)+'%"></span></div><div class="game-layout"><div class="game-content"><section class="card game-question-card"><div class="eyebrow">Учебная ситуация</div><div class="game-question-text">'+esc(q.text)+'</div><p class="game-type-hint">'+(multiple?'Выберите все верные варианты':q.type==='article_id'?'Выберите номер и название применимой статьи':'Выберите один вариант ответа')+'</p><div class="game-options">'+options+'</div>'+(!entry.answered?'<div class="game-answer-actions"><button id="game-submit" class="btn-gold" onclick="answerGame()" '+(!entry.selected.length?'disabled':'')+'>Ответить '+ic('check',16)+'</button><span class="note">До проверки выбор можно изменить</span></div>':'')+'</section>'+(entry.answered?gameResultHTML(entry):'')+'</div>'+side+'</div>';
}
function toggleGameOption(index){
  const entry=currentGameEntry();if(!entry||entry.answered||gameAnswerBusy)return;
  const q=entry.question;
  if(q.type==='multiple')entry.selected=entry.selected.includes(index)?entry.selected.filter(i=>i!==index):entry.selected.concat(index).sort((a,b)=>a-b);else entry.selected=[index];
  document.querySelectorAll('[data-game-option]').forEach(button=>{const i=Number(button.dataset.gameOption),picked=entry.selected.includes(i);button.classList.toggle('selected',picked);button.setAttribute('aria-pressed',picked);const state=button.querySelector('.option-state');if(state)state.remove();if(picked){const mark=document.createElement('span');mark.className='option-state';mark.textContent='Выбрано';button.querySelector('.option-text').appendChild(mark)}});
  const submit=document.getElementById('game-submit');if(submit)submit.disabled=!entry.selected.length;
  queueSessionSave();
}
function gameSummaryScreen(){
  const total=gameRound.entries.length;
  return activeToolbar('training',gameRound.sessionId)+header('Раунд завершён','Ваша <span class="goldtext">результативность</span>','Все ответы сохранены. Разбирайте ошибки и возвращайтесь к вопросам, чтобы закрепить нормы УПК РФ.')+'<div class="card" style="text-align:center;padding:30px 20px"><div class="iconbox" style="width:66px;height:66px;margin:0 auto 18px">'+ic('trophy',30)+'</div><h2 style="font-size:27px">'+gameRound.correct+' из '+total+' верных ответов</h2><div class="game-summary-stats"><div class="game-summary-stat"><b>'+gameRound.correct+'</b><span>Верных</span></div><div class="game-summary-stat"><b>'+total+'</b><span>Всего вопросов</span></div><div class="game-summary-stat"><b>+'+gameRound.xp+'</b><span>Заработано XP</span></div><div class="game-summary-stat"><b>'+gameRound.newMistakes+'</b><span>Новых ошибок</span></div></div><div class="row" style="justify-content:center;flex-wrap:wrap"><button class="btn-gold" onclick="repeatGameRound()">'+ic('rotate',16)+'Начать заново</button><button class="btn-outline" onclick="exitActiveGame()">'+ic('home',16)+'На главную</button></div></div>';
}
function answerGame(){
  const entry=currentGameEntry();if(!entry||entry.answered||!entry.selected.length||gameAnswerBusy)return;
  const sorted=entry.selected.slice().sort((a,b)=>a-b),correct=(entry.question.correct_answers||[]).slice().sort((a,b)=>a-b);
  entry.selected=sorted;entry.answered=true;entry.isCorrect=sorted.length===correct.length&&sorted.every((value,i)=>value===correct[i]);
  entry.xpEarned=entry.isCorrect?(gameRound.difficulty==='novice'?10:20):0;
  persistGameAnswer(entry);
  requestAnimationFrame(()=>document.getElementById('answer-result')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}));
}
async function persistGameAnswer(entry){
  if(!entry||entry.saved||gameAnswerBusy)return;
  const round=gameRound,userId=session?.user.id;if(!round||!userId)return;
  gameAnswerBusy=true;entry.saveError='';if(tab==='game')render();
  try{
    const{data,error}=await client.rpc('submit_game_answer',{p_answer_id:entry.answerId,p_question_id:entry.question.id,p_given_answers:entry.selected});
    if(error)throw error;
    if(!data||typeof data.is_correct!=='boolean')throw new Error('Supabase вернул неполный результат сохранения');
    entry.isCorrect=data.is_correct;entry.xpEarned=Number(data.xp_earned)||0;entry.newMistake=Boolean(data.mistake_created);entry.saved=true;statsData=null;mistakesLoaded=false;if(entry.isCorrect)markMistakeMastered(entry.question.id,true);
    if(gameRound===round){round.correct+=entry.isCorrect?1:0;round.xp+=entry.xpEarned;round.newMistakes+=entry.newMistake?1:0}
    if(session?.user.id===userId){profile.xp=Number(data.xp??profile.xp);profile.level=Number(data.level??profile.level);profile.points=Number(data.points??profile.points);writeCache(profileCacheKey(userId),profile)}
  }catch(error){entry.saveError=gameErrorText(error)}
  if(gameRound===round)gameAnswerBusy=false;
  if(tab==='game'&&gameRound===round)render();
  if(entry.saved)queueSessionSave();
  return entry.saved;
}
function retryGameSave(){const entry=currentGameEntry();if(entry&&entry.answered&&!entry.saved&&!gameAnswerBusy)persistGameAnswer(entry)}
function nextGameQuestion(){
  const entry=currentGameEntry();if(!entry||!entry.saved||gameAnswerBusy)return;
  if(gameRound.index>=gameRound.entries.length-1){gameView='summary';gameRound.status='completed'}else gameRound.index++;
  render();scrollTo(0,0);queueSessionSave();
}
function closeAnalysis(){const overlay=document.getElementById('analysis');if(overlay)overlay.style.display='none'}
function openAnalysis(){
  const entry=currentGameEntry();if(!entry||entry.isCorrect)return;
  const q=entry.question;
  let overlay=document.getElementById('analysis');
  if(!overlay){overlay=document.createElement('div');overlay.id='analysis';overlay.className='overlay';document.body.appendChild(overlay)}
  overlay.onclick=event=>{if(event.target===overlay)closeAnalysis()};
  overlay.innerHTML='<div class="box card analysis-box"><button class="close" onclick="closeAnalysis()" aria-label="Закрыть разбор">'+ic('x',20)+'</button><div class="eyebrow">Работа над ошибкой</div><h2>Полный юридический разбор</h2><p class="analysis-scroll-note">Вопрос, ваш выбор, все неверные варианты и правовое обоснование — без сокращений.</p><div class="result-section"><h3>Учебная ситуация</h3><p>'+esc(q.text)+'</p></div><div class="result-section"><h3>Ваш ответ</h3>'+entry.selected.map(i=>'<div class="wrong-explanation"><b>'+esc(q.options[i])+'</b></div>').join('')+'</div><div class="result-section"><h3>Правильный ответ</h3>'+gameCorrectAnswersHTML(q)+'</div>'+(q.article_ref?'<div class="result-section"><h3>Применимые нормы</h3><p>'+esc(q.article_ref)+'</p></div>':'')+gameWrongExplanationsHTML(entry)+(q.explanation_correct?'<div class="result-section"><h3>Юридическое обоснование</h3><p>'+esc(q.explanation_correct)+'</p></div>':'')+gameElementsHTML(q.elements)+(q.extra_example?'<div class="result-section"><h3>Дополнительный пример</h3><p>'+esc(q.extra_example)+'</p></div>':'')+'<button class="btn-gold" style="width:100%;margin-top:20px" onclick="closeAnalysis()">Вернуться к вопросу</button></div>';
  overlay.style.display='flex';overlay.scrollTop=0;
}
function buildDetectiveRound(scenario){return{sessionId:null,scenario,started:false,index:0,score:0,answers:scenario.steps.map(()=>({selectedId:null,answered:false,saved:false,score:0,saveError:''})),status:'active',xpAwarded:0,bestScore:0,completionPrepared:false}}
function detectiveSessionRecord(){
  const d=detectiveRound,state={started:d.started,total_steps:d.scenario.steps.length,answers:d.answers.map(a=>({selectedId:a.selectedId,answered:a.answered,saved:a.saved,score:a.score})),score:d.score,xpAwarded:d.xpAwarded,bestScore:d.bestScore};
  return{id:d.sessionId,mode:'detective',session_key:'detective:'+d.scenario.id,title:d.scenario.title,difficulty:d.scenario.difficulty,scenario_id:d.scenario.id,state,status:d.status,current_position:d.index,score:d.score,best_score:d.bestScore,xp_earned:d.xpAwarded};
}
function detectiveSetupScreen(){
  let body='';
  if(detectiveScenariosLoading&&!detectiveScenariosLoaded)body='<div class="card save-status" style="justify-content:center"><span class="spinner"></span>Загружаем сценарии…</div>';
  else if(detectiveScenariosError&&!detectiveScenarios.length)body='<div class="card"><p class="error">'+esc(detectiveScenariosError)+'</p><button class="btn-outline" onclick="ensureDetectiveScenarios(true)">Повторить загрузку</button></div>';
  else body='<div class="grid2">'+detectiveScenarios.map(scenario=>{const active=gameSessions.find(s=>s.mode==='detective'&&s.status==='active'&&s.scenario_id===scenario.id),completed=gameSessions.filter(s=>s.mode==='detective'&&s.status==='completed'&&s.scenario_id===scenario.id),best=completed.reduce((m,s)=>Math.max(m,s.best_score||s.score||0),0);return'<div class="card game-level-card"><div class="row" style="justify-content:space-between;align-items:flex-start"><span class="chip">Сценарий '+scenario.id+'</span>'+(active?'<span class="chip">В процессе</span>':'')+'</div><h2 style="margin-top:12px">'+esc(scenario.title)+'</h2><p style="font-size:13px;color:var(--silver);margin-top:5px">'+esc(scenario.category)+'</p><p class="note" style="margin:12px 0">'+scenario.steps.length+' этапа · до '+scenario.max_score+' баллов · '+scenario.xp_reward+' XP за первое завершение</p>'+(best?'<p class="gold" style="margin-bottom:10px">Лучший результат: '+best+'</p>':'')+(active?'<p class="gold">'+esc(sessionPositionText(active))+' · '+active.score+' баллов</p><div class="game-answer-actions"><button class="btn-gold" data-action="resumeSession" data-arg="'+esc(active.id)+'">Продолжить</button><button class="btn-outline" data-action="requestReset" data-mode="detective" data-arg="'+esc(active.id)+'">Начать заново</button></div>':'<button class="btn-gold" style="width:100%" data-action="startDetectiveScenario" data-arg="'+scenario.id+'" '+(sessionBusy||gameSessionsLoading||!gameSessionsLoaded?'disabled':'')+'>Начать сценарий</button>')+'</div>'}).join('')+'</div>';
  return'<button class="back-btn" onclick="menuView=\'modes\';render()">← Все режимы</button>'+header('Детектив','Выберите <span class="goldtext">расследование</span>','Каждый сценарий сохраняется отдельно. Можно выйти после любого этапа и продолжить с теми же баллами.')+(sessionError?'<p class="notice">'+esc(sessionError)+'</p>':'')+body;
}
async function startDetectiveScenario(id){
  if(sessionBusy||!(await ensureSessionListForStart()))return;const active=gameSessions.find(s=>s.mode==='detective'&&s.status==='active'&&s.scenario_id===id);if(active)return resumeSession(active.id);
  const scenario=detectiveScenarios.find(s=>s.id===id);if(!scenario)return;
  sessionBusy=true;sessionError='';detectiveRound=buildDetectiveRound(scenario);gameRound=null;render();
  try{const saved=await saveSessionRecord(detectiveSessionRecord());detectiveRound.sessionId=saved.id;gameView='detective-briefing';tab='game';menuView='modes'}catch(error){detectiveRound=null;sessionError=gameErrorText(error)}
  sessionBusy=false;render();scrollTo(0,0);
}
function restoreDetectiveSession(record){
  const scenario=detectiveScenarios.find(s=>s.id===record.scenario_id);if(!scenario)throw new Error('Сценарий из сохранённой сессии не найден');
  const state=record.state||{},d=buildDetectiveRound(scenario);d.sessionId=record.id;d.started=Boolean(state.started);d.index=Math.min(scenario.steps.length-1,record.current_position||0);d.score=state.score??record.score??0;d.status=record.status;d.xpAwarded=state.xpAwarded??record.xp_earned??0;d.bestScore=state.bestScore??record.best_score??0;
  d.answers=scenario.steps.map((_,i)=>({selectedId:null,answered:false,saved:false,score:0,saveError:'',...(state.answers?.[i]||{})}));detectiveRound=d;gameRound=null;gameView=record.status==='completed'?'detective-result':d.started?'detective-step':'detective-briefing';
}
function beginDetective(){if(!detectiveRound)return;detectiveRound.started=true;gameView='detective-step';render();scrollTo(0,0);queueSessionSave()}
function detectiveBriefingScreen(){
  const d=detectiveRound,s=d.scenario;
  return activeToolbar('detective',d.sessionId)+header('Детектив · брифинг',esc(s.title),esc(s.category))+'<div class="card"><div class="eyebrow">Ваша роль</div><h2>'+esc(s.role)+'</h2><p class="sub" style="max-width:760px">'+esc(s.briefing)+'</p></div><div class="card"><div class="eyebrow">Исходные улики</div><ul class="detective-list">'+s.initial_clues.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul><div class="row" style="margin-top:18px;flex-wrap:wrap"><span class="chip">'+s.steps.length+' этапа</span><span class="chip">До '+s.max_score+' баллов</span><span class="chip">'+s.xp_reward+' XP за первое завершение</span></div><button class="btn-gold" style="margin-top:20px" onclick="beginDetective()">Начать расследование '+ic('chevron',15)+'</button></div>';
}
function currentDetectiveAnswer(){return detectiveRound?.answers[detectiveRound.index]||null}
function detectiveOptionCorrect(step,option){return Boolean(option)&&option.id===step.correct_option_id}
function selectDetectiveOption(id){
  const a=currentDetectiveAnswer();if(!a||a.answered||detectiveAnswerBusy)return;a.selectedId=id;
  document.querySelectorAll('[data-detective-option]').forEach(button=>{const picked=button.dataset.detectiveOption===id;button.classList.toggle('selected',picked);button.setAttribute('aria-pressed',picked)});
  const submit=document.getElementById('detective-submit');if(submit)submit.disabled=false;queueSessionSave();
}
function detectiveSaveHTML(a){
  if(a.saved)return'<div class="save-status saved">'+ic('check',15)+'Этап и баллы сохранены</div>';
  if(detectiveAnswerBusy)return'<div class="save-status"><span class="spinner" style="width:16px;height:16px"></span>Сохраняем решение и текущий этап…</div>';
  return'<div class="save-error"><p class="error">'+esc(a.saveError||sessionError||'Решение не сохранено')+'</p><button class="btn-outline" onclick="retryDetectiveSave()">Повторить сохранение</button></div>';
}
function detectiveStepScreen(){
  const d=detectiveRound,s=d.scenario,step=s.steps[d.index],a=currentDetectiveAnswer(),n=d.index+1,total=s.steps.length;
  const options=step.options.map(option=>{const picked=a.selectedId===option.id,classes='game-option'+(a.answered&&detectiveOptionCorrect(step,option)?' correct':a.answered&&picked?' wrong':picked?' selected':''),state=a.answered?(detectiveOptionCorrect(step,option)?'Законное решение':picked?'Ваш выбор':''):(picked?'Выбрано':'');return'<button class="'+classes+'" data-detective-option="'+esc(option.id)+'" aria-pressed="'+picked+'" '+(a.answered?'disabled':'')+' data-action="selectDetectiveOption" data-arg="'+esc(option.id)+'"><span class="option-letter">'+String.fromCharCode(65+step.options.indexOf(option))+'</span><span class="option-text">'+esc(option.text)+(state?'<span class="option-state">'+state+'</span>':'')+'</span></button>'}).join('');
  const selected=step.options.find(o=>o.id===a.selectedId),last=n===total;
  const result=a.answered?'<section class="answer-result '+(detectiveOptionCorrect(step,selected)?'correct':'wrong')+'"><div class="eyebrow">Оценка решения</div><h2>'+(detectiveOptionCorrect(step,selected)?'Решение верное':'Решение неверное')+'</h2><div class="result-section"><h3>Комментарий</h3><p>'+esc(selected?.feedback||'')+'</p></div><div class="result-section"><h3>Правовое правило</h3><p>'+esc(step.rule_after_choice)+'</p></div><div class="result-section"><span class="xp-pop">'+(a.score>0?'+':'')+a.score+'</span><p>баллов за этот этап · всего: '+d.score+'</p></div>'+detectiveSaveHTML(a)+'<div class="game-answer-actions"><button class="btn-gold" onclick="nextDetectiveStep()" '+(!a.saved||detectiveAnswerBusy?'disabled':'')+'>'+(last?'Завершить сценарий':'Следующий этап')+' '+ic('chevron',15)+'</button></div></section>':'';
  const side='<aside class="game-side"><div class="card"><div class="eyebrow">Расследование</div><dl><dt>Этап</dt><dd>'+n+' / '+total+'</dd><dt>Баллы</dt><dd>'+d.score+'</dd><dt>Максимум</dt><dd>'+s.max_score+'</dd><dt>Награда</dt><dd>'+s.xp_reward+' XP</dd></dl><div class="article-ref"><b style="color:var(--gold2)">Роль</b><br>'+esc(s.role)+'</div></div></aside>';
  return activeToolbar('detective',d.sessionId)+'<div class="game-round-head"><div><div class="eyebrow">'+esc(s.title)+'</div><h1>Этап '+n+' <span class="goldtext">из '+total+'</span></h1></div><span class="chip">'+esc(step.title)+'</span></div><div class="game-progress"><span style="width:'+(n/total*100)+'%"></span></div><div class="game-layout"><div class="game-content"><section class="card game-question-card"><div class="eyebrow">Процессуальная ситуация</div><div class="game-question-text">'+esc(step.narrative)+'</div><details class="detective-evidence"><summary>Доступные улики · '+step.available_evidence.length+'</summary><ul class="detective-list">'+step.available_evidence.map(e=>'<li>'+esc(e)+'</li>').join('')+'</ul></details><p class="game-type-hint">Выберите одно процессуальное решение</p><div class="game-options">'+options+'</div>'+(!a.answered?'<div class="game-answer-actions"><button id="detective-submit" class="btn-gold" onclick="answerDetectiveStep()" '+(!a.selectedId||detectiveAnswerBusy?'disabled':'')+'>Подтвердить выбор</button></div>':'')+'</section>'+result+'</div>'+side+'</div>';
}
async function answerDetectiveStep(){
  const d=detectiveRound,a=currentDetectiveAnswer();if(!d||!a||a.answered||!a.selectedId||detectiveAnswerBusy)return;
  const step=d.scenario.steps[d.index],option=step.options.find(o=>o.id===a.selectedId);a.answered=true;a.score=option.score;a.saved=false;d.score+=option.score;detectiveAnswerBusy=true;render();await sessionSaveQueue;await persistDetectiveAnswer();
}
async function persistDetectiveAnswer(){
  const d=detectiveRound,a=currentDetectiveAnswer();if(!d||!a)return false;detectiveAnswerBusy=true;a.saveError='';
  try{
    const step=d.scenario.steps[d.index],option=step.options.find(o=>o.id===a.selectedId),userId=session?.user.id;
    const{error}=await client.from('detective_answers').upsert({user_id:userId,session_id:d.sessionId,scenario_id:d.scenario.id,step_number:step.step,option_id:option.id,is_correct:detectiveOptionCorrect(step,option),score:option.score},{onConflict:'session_id,step_number'});if(error)throw error;
    await saveSessionRecord(detectiveSessionRecord());a.saved=true;sessionError='';
  }catch(error){a.saveError=gameErrorText(error);sessionError=a.saveError}
  detectiveAnswerBusy=false;if(tab==='game')render();return a.saved;
}
function retryDetectiveSave(){const a=currentDetectiveAnswer();if(a?.answered&&!a.saved&&!detectiveAnswerBusy)persistDetectiveAnswer();else if(a?.saved&&detectiveRound.index===detectiveRound.scenario.steps.length-1)completeDetectiveSession()}
async function nextDetectiveStep(){
  const d=detectiveRound,a=currentDetectiveAnswer();if(!d||!a?.saved||detectiveAnswerBusy)return;
  if(d.index<d.scenario.steps.length-1){d.index++;render();scrollTo(0,0);queueSessionSave()}else await completeDetectiveSession();
}
async function completeDetectiveSession(){
  const d=detectiveRound;if(!d||detectiveAnswerBusy)return;detectiveAnswerBusy=true;sessionError='';render();
  try{
    if(!d.completionPrepared){await saveSessionRecord(detectiveSessionRecord());d.completionPrepared=true}
    const{data,error}=await client.rpc('complete_detective_session',{p_session_id:d.sessionId});if(error)throw error;
    d.status='completed';d.xpAwarded=Number(data.xp_awarded)||0;d.bestScore=Number(data.best_score)||d.score;
    profile.xp=Number(data.xp??profile.xp);profile.level=Number(data.level??profile.level);profile.points=Number(data.points??profile.points);writeCache(profileCacheKey(session.user.id),profile);
    await saveSessionRecord(detectiveSessionRecord());gameView='detective-result';sessionError='';
  }catch(error){sessionError=gameErrorText(error)}
  detectiveAnswerBusy=false;render();scrollTo(0,0);
}
function detectiveResultScreen(){
  const d=detectiveRound,s=d.scenario,solution=s.solution||{};
  return activeToolbar('detective',d.sessionId)+header('Расследование завершено',esc(s.title),'Все этапы и итоговый результат сохранены.')+'<div class="card" style="text-align:center"><div class="iconbox" style="margin:0 auto 16px">'+ic('trophy',28)+'</div><h2 style="font-size:28px">'+d.score+' из '+s.max_score+' баллов</h2><div class="game-summary-stats"><div class="game-summary-stat"><b>'+d.score+'</b><span>Текущий результат</span></div><div class="game-summary-stat"><b>'+d.bestScore+'</b><span>Лучший результат</span></div><div class="game-summary-stat"><b>+'+d.xpAwarded+'</b><span>XP за первое завершение</span></div><div class="game-summary-stat"><b>'+s.steps.length+'</b><span>Пройдено этапов</span></div></div><div class="game-answer-actions" style="justify-content:center"><button class="btn-gold" onclick="requestReset(\'detective\',\''+d.sessionId+'\')">Начать заново</button><button class="btn-outline" onclick="exitActiveGame()">Выйти в меню</button></div></div>'+(sessionError?'<p class="notice">'+esc(sessionError)+'</p>':'')+'<div class="answer-result correct"><div class="eyebrow">Полное решение</div><h2>Юридический разбор</h2><div class="result-section"><h3>Ключевой вопрос</h3><p>'+esc(solution.key_issue||'')+'</p></div><div class="result-section"><h3>Правовая норма</h3><p>'+esc(solution.legal_rule||'')+'</p></div><div class="result-section"><h3>Итоговое решение</h3><p>'+esc(solution.summary||'')+'</p></div><div class="result-section"><h3>Применение к ситуации</h3><p>'+esc(solution.application||'')+'</p></div><div class="result-section"><h3>Необходимые документы</h3><ul class="detective-list">'+(solution.required_documents||[]).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'+(s.legal_references?.length?'<div class="result-section"><h3>Источники норм</h3>'+s.legal_references.map(r=>'<p><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.code)+' · статья '+esc(r.article)+' — '+esc(r.title)+'</a></p>').join('')+'</div>':'')+'</div>';
}
async function resetDetectiveSession(record){
  const previous=detectiveRound;try{
    const scenario=detectiveScenarios.find(s=>s.id===record.scenario_id);if(!scenario)throw new Error('Сценарий не найден');
    const fresh=buildDetectiveRound(scenario);fresh.sessionId=record.id;detectiveRound=fresh;
    const{data,error}=await client.rpc('restart_detective_session',{p_session_id:record.id,p_state:detectiveSessionRecord().state});if(error)throw error;
    const old=gameSessions.find(s=>s.id===record.id);if(old&&old.status==='active')old.status='abandoned';
    gameSessions.unshift(data);gameSessions.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));fresh.sessionId=data.id;gameRound=null;gameView='detective-briefing';sessionError='';return true;
  }catch(error){detectiveRound=previous;sessionError=gameErrorText(error);return false}
}
function closeReset(){if(sessionBusy)return;const modal=document.getElementById('reset-game');if(modal)modal.style.display='none';resetTarget=null}
function requestReset(mode,id){
  const record=gameSessions.find(s=>s.id===id)||((mode==='training'?gameRound:detectiveRound)?.sessionId===id?{id,status:mode==='training'?gameRound.status:detectiveRound.status,difficulty:mode==='training'?gameRound.difficulty:detectiveRound.scenario.difficulty,scenario_id:mode==='detective'?detectiveRound.scenario.id:null}:null);
  if(!record){sessionError='Не удалось найти сессию для сброса';render();return}
  resetTarget={mode,record};let modal=document.getElementById('reset-game');
  if(!modal){modal=document.createElement('div');modal.id='reset-game';modal.className='overlay';document.body.appendChild(modal)}
  modal.innerHTML='<div class="box card"><div class="iconbox wine" style="margin:0 auto">'+ic('rotate',24)+'</div><h2>Начать этот режим заново?</h2><p>Текущая попытка будет сброшена. История ответов, статистика, заработанный XP, исправленные ошибки и лучшие результаты сохранятся</p><p id="reset-error" class="error"></p><div class="row" style="width:100%"><button class="btn-outline" style="flex:1" onclick="closeReset()">Отмена</button><button class="btn-gold" style="flex:1" onclick="confirmReset()">Начать заново</button></div></div>';
  modal.style.display='flex';
}
async function confirmReset(){if(!resetTarget||sessionBusy)return;sessionBusy=true;const modal=document.getElementById('reset-game');modal.querySelectorAll('button').forEach(b=>b.disabled=true);const ok=resetTarget.mode==='training'?await resetTrainingSession(resetTarget.record):await resetDetectiveSession(resetTarget.record);sessionBusy=false;if(ok){modal.style.display='none';resetTarget=null;tab='game';menuView='modes';render();scrollTo(0,0)}else{modal.querySelectorAll('button').forEach(b=>b.disabled=false);document.getElementById('reset-error').textContent=sessionError||'Не удалось начать заново. Повторите попытку.'}}
async function resetTrainingSession(record){
  const previous=gameRound;try{const fresh=buildTrainingRound(record.difficulty,record.difficulty==='mistakes'&&record.state?.question_ids?gameQuestions.filter(q=>record.state.question_ids.includes(q.id)):undefined);fresh.sessionId=record.status==='active'?record.id:null;gameRound=fresh;const saved=await saveSessionRecord(trainingSessionRecord());fresh.sessionId=saved.id;detectiveRound=null;level=fresh.difficulty;gameView='question';sessionError='';return true}catch(error){gameRound=previous;sessionError=gameErrorText(error);return false}
}
function mistakesScreen(){
  const h=header('Работа над собой','Мои <span class="goldtext">ошибки</span>','Неверные ответы собираются здесь автоматически. Повторите вопрос — или отметьте его освоенным.');
  if(mistakesLoading&&!mistakesLoaded)return h+'<div class="card" style="text-align:center"><div class="spinner" style="margin:10px auto"></div><p class="sub">Загружаем ваши ошибки…</p></div>';
  if(mistakesError)return h+'<div class="card"><h2>Не удалось загрузить ошибки</h2><p class="error">'+esc(mistakesError)+'</p><button class="btn-outline" onclick="loadMistakes(true)">Повторить</button></div>';
  const open=mistakes.filter(m=>!m.mastered),doneCount=mistakes.length-open.length;
  if(!open.length)return h+'<div class="card" style="text-align:center;padding:44px 22px"><div style="display:flex;justify-content:center;margin-bottom:18px"><div class="iconbox" style="width:72px;height:72px;border-radius:16px">'+ic('scales',36)+'</div></div><h2 style="font-size:21px">'+(doneCount?'Все ошибки освоены — отличная работа':'Пока пусто — и это хорошо')+'</h2><p class="sub" style="margin:10px auto 20px;max-width:340px">Решайте задания — если где-то ошибётесь, вопрос появится здесь с разбором.</p><button class="btn-gold" onclick="go(\'game\')">Перейти к заданиям '+ic('chevron',15)+'</button></div>'+(doneCount?'<p class="note">Освоено за всё время: '+doneCount+'</p>':'');
  const cards=open.map(m=>{const q=m.questions||{};return '<div class="card mistake-card"><div class="row" style="justify-content:space-between;align-items:flex-start;gap:10px"><span class="chip">'+esc(q.category||'Без категории')+'</span><span class="mistake-meta">Ошибок: '+(m.repeat_count||1)+' · '+esc(formatDateTime(m.last_seen))+'</span></div><p class="game-question-text" style="font-size:16px">'+esc(q.text||'Вопрос недоступен в текущей базе')+'</p>'+(q.article_ref?'<p class="note" style="padding:0">'+esc(q.article_ref)+'</p>':'')+'<div class="game-answer-actions"><button class="btn-gold" data-action="repeatMistake" data-arg="'+m.question_id+'">Повторить '+ic('chevron',14)+'</button><button class="btn-outline" data-action="markMastered" data-arg="'+m.question_id+'">Освоено</button></div></div>'}).join('');
  const weak=weakCategories();
  return h+'<div class="row" style="justify-content:space-between"><h2>Открытые ошибки</h2><span class="chip">'+open.length+'</span></div>'+(open.length>1?'<button class="btn-gold" data-action="repeatAllMistakes">Повторить все ('+open.length+')</button>':'')+cards+(doneCount?'<p class="note">Освоено за всё время: '+doneCount+'</p>':'')+(weak.length?'<h2 style="margin-top:8px">Слабые места</h2><p class="note" style="padding:0">Темы с наибольшим числом ошибок — их стоит подтянуть.</p><div class="grid2">'+weak.map(w=>'<div class="card"><h2 style="font-size:15px">'+esc(w.category)+'</h2><p style="font-size:12px;color:var(--silver);margin:6px 0 12px">'+w.count+' '+pluralMistakes(w.count)+'</p><button class="btn-outline" data-action="trainCategory" data-arg="'+esc(w.category)+'">Тренировать тему</button></div>').join('')+'</div>':'');
}
function weakCategories(){const by={};mistakes.forEach(m=>{const c=m.questions?.category||'Без категории';by[c]=(by[c]||0)+1});return Object.entries(by).map(([category,count])=>({category,count})).sort((a,b)=>b.count-a.count).slice(0,3)}
function pluralMistakes(n){const a=n%10,b=n%100;return a===1&&b!==11?'ошибка':a>=2&&a<=4&&(b<10||b>=20)?'ошибки':'ошибок'}
function statsScreen(){
  const h=header('Прогресс','Статистика <span class="goldtext">обучения</span>','Живые данные ваших тренировок — обновляются после каждого ответа.');
  if(statsLoading&&!statsData)return h+'<div class="card" style="text-align:center"><div class="spinner" style="margin:10px auto"></div><p class="sub">Считаем ваши результаты…</p></div>';
  if(statsError)return h+'<div class="card"><h2>Не удалось загрузить статистику</h2><p class="error">'+esc(statsError)+'</p><button class="btn-outline" onclick="loadStatsData(true)">Повторить</button></div>';
  if(!statsData)return h+'<div class="card" style="text-align:center;padding:32px"><button class="btn-gold" onclick="loadStatsData(true)">Загрузить статистику</button></div>';
  const s=statsData,m=[['Решено заданий',s.total,'target'],['Верных ответов',s.accuracy+'%','check'],['Серия верных',s.streak,'lightning'],['Достижений',s.earned+' / '+s.achievements.length,'trophy']];
  const max=Math.max(1,...s.activity.map(d=>d.count));
  const bars=s.activity.map(d=>'<div class="bar"><i style="height:'+Math.max(4,Math.round(d.count/max*100))+'%"></i><b>'+d.label+'</b></div>').join('');
  return h+'<div class="grid4">'+m.map(x=>'<div class="card">'+iconbox(x[2],false,17)+'<p class="serif" style="font-size:26px;font-weight:700;margin-top:10px">'+x[1]+'</p><p style="font-size:12px;color:var(--silver)">'+x[0]+'</p></div>').join('')+'</div><div class="card"><div class="row" style="justify-content:space-between"><div><h2>Активность по дням</h2><p style="font-size:12px;color:var(--dim);margin-top:2px">Ответов за последние 7 дней</p></div>'+(s.total?'<span class="chip">'+s.total+'</span>':'<span class="chip">Нет данных</span>')+'</div><div class="row" style="align-items:flex-end;height:150px;margin-top:22px;gap:12px">'+bars+'</div></div><h2 style="margin-top:4px">Достижения</h2><div class="grid2">'+s.achievements.map(a=>'<div class="card achv'+(a.earned?'':' locked')+'">'+iconbox(a.earned?a.icon:'lock',!a.earned,18)+'<div style="flex:1"><h2 style="font-size:15px">'+a.name+'</h2><p style="font-size:12px;color:var(--dim);margin-top:3px">'+a.desc+'</p></div>'+(a.earned?'<span class="chip">Получено</span>':'')+'</div>').join('')+'</div>';
}
function statsLinkHTML(){return '<div class="card" style="padding:6px 18px"><button class="listbtn" style="border:0;min-height:56px" onclick="openStats()">'+iconbox('chart',false,18)+'<span style="flex:1;text-align:left">Статистика<small style="display:block;margin-top:3px;color:var(--dim);font-weight:400">Точность, серия верных и активность</small></span><span style="color:var(--dim)">'+ic('chevron',15)+'</span></button></div>'}
function guestNoticeHTML(){return session?.user?.is_anonymous?'<p class="notice">Вы в гостевом режиме: прогресс хранится только на этом устройстве и может быть потерян при очистке данных браузера. <button class="btn-text" onclick="openAuth(\'upgrade\')">Привязать email</button></p>':''}
function profileScreen(){const p=profileBits();if(profileView==='stats')return '<button class="back-btn" onclick="profileView=\'main\';render()">‹ Назад к профилю</button>'+statsScreen();return header('Личный кабинет','Про<span class="goldtext">филь</span>')+'<div class="card row">'+avatar(68,p.initial)+'<div style="flex:1;min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap"><h2>'+esc(p.name)+'</h2><span class="chip">'+p.levelName+'</span></div><p style="font-size:13px;color:var(--silver);margin-top:4px">'+profile.points+' баллов · уровень '+profile.level+' из 20</p><div class="progress"><span style="width:'+p.progress+'%"></span></div></div></div>'+savedArticlesHTML()+statsLinkHTML()+guestNoticeHTML()+'<p style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--dim);font-weight:600">Настройки</p><div class="card row">'+iconbox('user')+'<div style="flex:1"><h2 style="font-size:16px">Публичный профиль</h2><p style="font-size:12px;color:var(--dim)">Участие в рейтинге «Борьбы умов»</p></div><span class="chip">Скоро</span></div>'+'<p style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--dim);font-weight:600">Ещё</p><div class="card" style="padding:8px 20px">'+[['Редактировать профиль','user'],['О приложении','document'],['Конфиденциальность','shield']].map(r=>'<button class="listbtn" disabled style="opacity:.55;cursor:default">'+iconbox(r[1],false,16)+'<span style="flex:1">'+r[0]+'</span><span class="chip">Скоро</span></button>').join('')+'</div><button class="btn-outline" style="width:100%;border-color:rgba(122,36,38,.6);color:#e5b8a9" onclick="openLogout()">Выйти из аккаунта</button><div class="row" style="justify-content:space-between;padding:0 4px"><p class="note" style="padding:0">Борьба умов · Бета 0.1 · уголовное право РФ</p><span class="chip chip-wine">Бета</span></div>'}
const SCREENS={home:homeScreen,code:codeScreen,game:gameScreen,mistakes:mistakesScreen,profile:profileScreen};
function render(){if(!profile)return;if(!SCREENS[tab])tab='home';const ae=document.activeElement,focusId=ae&&ae.id?ae.id:'',sel=(focusId&&typeof ae.selectionStart==='number')?[ae.selectionStart,ae.selectionEnd]:null,sy=window.scrollY;renderNav();const main=document.getElementById('main');main.classList.toggle('code-main',tab==='code');main.classList.toggle('game-main',tab==='game');main.innerHTML='<div class="screen">'+SCREENS[tab]()+'</div>';if(focusId){const el=document.getElementById(focusId);if(el){el.focus();if(sel&&el.setSelectionRange)try{el.setSelectionRange(sel[0],sel[1])}catch(_){}}}else if(sy)window.scrollTo(0,sy);if(tab==='code'&&codeView==='article')requestAnimationFrame(initArticleTOC)}
function setupHTML(){return '<div class="setup"><h2 style="font-size:18px">Сначала подключите Supabase</h2><ol><li>Создайте проект на supabase.com и откройте <b>Project Settings → API</b>.</li><li>В начале этого HTML-файла найдите <code>SUPABASE_URL</code> и <code>SUPABASE_ANON_KEY</code>. Вставьте Project URL и anon public key между кавычками. service_role key использовать нельзя.</li><li>В <b>SQL Editor</b> выполните миграцию ниже: она создаёт user_profiles, favorites, user_notes и RLS-политики.</li><li>Включите <b>Authentication → Sign In / Providers → Email и Anonymous</b>. Для входа сразу после регистрации отключите Confirm email.</li><li>Сохраните HTML и откройте его снова.</li></ol><details class="sql"><summary>Показать SQL-миграцию</summary><button class="btn-outline" style="margin-top:12px;font-size:12px;min-height:38px;padding:8px 14px" onclick="copySQL(this)">Скопировать SQL</button><pre>'+esc(document.getElementById('sql-migration').textContent)+'</pre></details></div>'}
function openAuth(mode){authMode=mode;authLoading=false;guestBusy=false;renderAuth();document.getElementById('auth').style.display='flex';if(mode==='guest'&&configured)setTimeout(startGuest,0)}
function closeAuth(){if(authLoading)return;document.getElementById('auth').style.display='none';authMode=null}
function renderAuth(){const title=authMode==='register'?'Создать аккаунт':authMode==='login'?'Вход в аккаунт':authMode==='upgrade'?'Привязка email':'Гостевой вход',box=document.getElementById('auth-box');let body='';if(!configured)body=setupHTML();else if(authMode==='guest')body='<div style="text-align:center"><div class="iconbox" style="margin:0 auto">'+ic('user',24)+'</div><p id="guest-status" style="margin-top:16px">Создаём анонимную сессию в Supabase…</p><div id="guest-spin" class="spinner" style="margin:18px auto 0"></div><p id="auth-server" class="error"></p><button class="btn-outline" style="display:none;width:100%;margin-top:12px" id="guest-back" onclick="authLoading=false;openAuth(\'login\')">Вернуться ко входу</button></div>';else body='<form id="auth-form" onsubmit="submitAuth(event)" novalidate><label class="form-label">Email<input id="auth-email" class="field" type="email" autocomplete="email" placeholder="you@example.ru" autofocus></label><p id="err-email" class="error"></p><label class="form-label">Пароль<input id="auth-password" class="field" type="password" autocomplete="'+(authMode==='register'?'new-password':'current-password')+'" placeholder="Не менее 8 символов"></label><p id="err-password" class="error"></p>'+(authMode==='register'?'<label class="form-label">Подтвердите пароль<input id="auth-confirmation" class="field" type="password" autocomplete="new-password" placeholder="Повторите пароль"></label><p id="err-confirmation" class="error"></p>':'')+'<p id="auth-server" class="error"></p><p id="auth-notice" class="notice" style="display:none"></p><button id="auth-submit" class="btn-gold" type="submit" style="width:100%;margin-top:20px">'+(authMode==='register'?'Зарегистрироваться':authMode==='upgrade'?'Привязать email':'Войти')+'</button><button id="auth-switch" class="btn-text" type="button" style="display:block;margin:8px auto 0" onclick="openAuth(\''+(authMode==='register'?'login':'register')+'\')">'+(authMode==='register'?'Уже есть аккаунт? Войти':authMode==='upgrade'?'Вернуться ко входу':'Нет аккаунта? Создать')+'</button></form>';box.innerHTML='<button class="close" id="auth-close" onclick="closeAuth()" aria-label="Закрыть форму">'+ic('x',20)+'</button><div class="eyebrow">Борьба умов</div><h2>'+title+'</h2>'+body}
function fieldError(id,text){const e=document.getElementById('err-'+id);if(e)e.textContent=text||''}function authError(text){const e=document.getElementById('auth-server');if(e)e.textContent=text||''}
function setAuthLoading(on){authLoading=on;document.querySelectorAll('#auth-box input,#auth-box button').forEach(e=>e.disabled=on);const b=document.getElementById('auth-submit');if(b)b.innerHTML=on?'<span class="spinner" style="width:16px;height:16px;border-color:rgba(22,18,7,.3);border-top-color:#161207"></span> Пожалуйста, подождите…':(authMode==='register'?'Зарегистрироваться':'Войти')}
function translateAuthError(message){const m=String(message).toLowerCase();if(m.includes('invalid login credentials'))return'Неверный логин или пароль';if(m.includes('user already registered'))return'Пользователь с таким email уже зарегистрирован';if(m.includes('email not confirmed'))return'Подтвердите email по ссылке из письма';if(m.includes('anonymous sign-ins are disabled'))return'Анонимный вход выключен. Включите Anonymous в Authentication → Sign In / Providers';if(m.includes('rate limit'))return'Слишком много попыток. Попробуйте немного позже';if(m.includes('failed to fetch')||m.includes('network'))return'Нет соединения с Supabase. Проверьте интернет и ключи проекта';return message}
async function submitAuth(e){e.preventDefault();if(authLoading||!client)return;const email=document.getElementById('auth-email').value.trim(),password=document.getElementById('auth-password').value,confirmation=document.getElementById('auth-confirmation')?.value;let valid=true;fieldError('email');fieldError('password');fieldError('confirmation');authError('');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){fieldError('email','Неверный email');valid=false}if(password.length<8){fieldError('password','Пароль должен содержать не менее 8 символов');valid=false}if(authMode==='register'&&password!==confirmation){fieldError('confirmation','Пароли не совпадают');valid=false}if(!valid)return;setAuthLoading(true);try{if(authMode==='upgrade'){const{error}=await client.auth.updateUser({email,password});if(error)throw error;setAuthLoading(false);const n=document.getElementById('auth-notice');n.style.display='block';n.textContent='Письмо со ссылкой отправлено на '+email+'. После подтверждения прогресс гостя сохранится за аккаунтом.'}else if(authMode==='register'){const{data,error}=await client.auth.signUp({email,password});if(error)throw error;if(data.session){setAuthLoading(false);closeAuth()}else{setAuthLoading(false);const n=document.getElementById('auth-notice');n.style.display='block';n.textContent='Аккаунт создан. Подтвердите email по ссылке из письма, затем войдите.'}}else{const{error}=await client.auth.signInWithPassword({email,password});if(error)throw error;setAuthLoading(false);closeAuth()}}catch(err){setAuthLoading(false);authError(translateAuthError(err.message||String(err)))}}
async function startGuest(){if(guestBusy||!client)return;guestBusy=true;authLoading=true;const{error}=await client.auth.signInAnonymously();authLoading=false;guestBusy=false;if(error){document.getElementById('guest-spin').style.display='none';document.getElementById('guest-status').textContent='Не удалось выполнить гостевой вход';authError(translateAuthError(error.message));document.getElementById('guest-back').style.display='block'}else closeAuth()}
function copySQL(btn){const text=document.getElementById('sql-migration').textContent,done=()=>{btn.textContent='SQL скопирован';setTimeout(()=>btn.textContent='Скопировать SQL',1800)};if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopy(text,done));else fallbackCopy(text,done)}function fallbackCopy(text,done){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();done()}
function readCache(key){try{const value=localStorage.getItem(key);return value?JSON.parse(value):null}catch(e){return null}}
function writeCache(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}}
function profileCacheKey(userId){return 'borba-profile-v1:'+userId}
function codeCacheKey(userId){return 'borba-code-v1:'+userId}
function restoreCodeCache(userId){
  const cached=readCache(codeCacheKey(userId));
  if(!cached||!Array.isArray(cached.articles)||!Array.isArray(cached.favorites))return false;
  articles=cached.articles.sort((a,b)=>a.number.localeCompare(b.number,'ru',{numeric:true}));
  favorites=cached.favorites;
  articlesLoaded=true;
  return true;
}
function showApp(){
  document.getElementById('boot').style.display='none';
  document.getElementById('auth').style.display='none';
  document.getElementById('onboard').style.display='none';
  document.getElementById('app').style.display='block';
  render();
  initializeGameData();
}
async function loadOrCreateProfile(user){const cols='id, display_name, avatar_url, level, xp, points, wins, created_at',existing=await client.from('user_profiles').select(cols).eq('id',user.id).maybeSingle();if(existing.error)throw existing.error;if(existing.data)return existing.data;const display_name=user.is_anonymous?'Гость':(user.email?.split('@')[0]||'Пользователь'),inserted=await client.from('user_profiles').insert({id:user.id,display_name}).select(cols).single();if(inserted.error){if(inserted.error.code==='23505'){const retry=await client.from('user_profiles').select(cols).eq('id',user.id).single();if(retry.error)throw retry.error;return retry.data}throw inserted.error}return inserted.data}
async function loadCodeData(){
  const userId=session?.user.id;
  if(!userId)return;
  const request=++codeRequestId;
  articlesError='';
  favError='';
  if(!articlesLoaded&&(tab==='code'||tab==='favorites'))render();
  const[ar,fav]=await Promise.all([client.from('articles').select('id,number,part,title,section,chapter,category,official_text,sanction,simple_explanation,related_articles,actual_from,source_url'),client.from('favorites').select('id,article_id,created_at').eq('user_id',userId).order('created_at',{ascending:false})]);
  if(request!==codeRequestId||session?.user.id!==userId)return;
  if(ar.error)articlesError=ar.error.message;else articles=(ar.data||[]).sort((a,b)=>a.number.localeCompare(b.number,'ru',{numeric:true}));
  if(fav.error)favError=fav.error.message;else favorites=fav.data||[];
  articlesLoaded=true;
  writeCache(codeCacheKey(userId),{articles,favorites});
  if(tab==='code'||tab==='favorites'||tab==='profile')render();
}
async function applySession(next){
  const id=++requestId;
  session=next;
  if(!next){resetGameState();profile=null;profileSyncError='';favorites=[];articles=[];noteId='';currentNote='';noteBusy=false;noteLoading=false;noteStatus='';noteError='';favError='';favBusyId='';currentArticleId='';currentChapter='';codeView='root';articleDirection=0;articleNavigating=false;articlesLoaded=false;codeRequestId++;noteRequestId++;document.getElementById('boot').style.display='none';document.getElementById('app').style.display='none';document.getElementById('auth').style.display='none';document.getElementById('onboard').style.display='flex';authMode=null;authLoading=false;return}
  const cachedProfile=readCache(profileCacheKey(next.user.id));
  resetGameState();
  articles=[];
  favorites=[];
  articlesLoaded=false;
  articlesError='';
  favError='';
  profileSyncError='';
  restoreCodeCache(next.user.id);
  document.getElementById('onboard').style.display='none';
  if(cachedProfile?.id===next.user.id){
    profile=cachedProfile;
    showApp();
  }else{
    profile=null;
    document.getElementById('app').style.display='none';
    document.getElementById('boot').style.display='flex';
    document.getElementById('boot-content').innerHTML='<div class="spinner" style="margin:0 auto 18px"></div><h2>Загружаем ваш профиль…</h2>';
  }
  loadCodeData();
  try{
    const data=await loadOrCreateProfile(next.user);
    if(id!==requestId)return;
    profile=data;
    profileSyncError='';
    writeCache(profileCacheKey(next.user.id),data);
    showApp();
  }catch(err){
    if(id!==requestId)return;
    if(cachedProfile?.id===next.user.id){
      profile=cachedProfile;
      profileSyncError='Не удалось обновить профиль. Показаны данные с прошлого открытия.';
      showApp();
      return;
    }
    document.getElementById('boot-content').innerHTML='<div class="card" style="max-width:440px"><h2>Не удалось загрузить профиль</h2><p class="sub">'+esc(err.message||String(err))+'</p><p class="note" style="margin:12px 0">Проверьте SQL-миграцию и RLS-политики.</p><button class="btn-gold" style="width:100%" onclick="applySession(session)">Повторить</button><button class="btn-text" onclick="doLogout(true)">Выйти из аккаунта</button></div>';
  }
}
function openLogout(){logoutBusy=false;document.getElementById('logout-error').textContent='';document.getElementById('logout-submit').disabled=false;document.getElementById('logout-cancel').disabled=false;document.getElementById('logout-submit').textContent='Выйти';document.getElementById('logout').style.display='flex'}function closeLogout(){if(logoutBusy)return;document.getElementById('logout').style.display='none'}
async function doLogout(force){if(logoutBusy||!client)return;logoutBusy=true;const b=document.getElementById('logout-submit');if(b){b.disabled=true;b.textContent='Выход…'}const{error}=await client.auth.signOut();logoutBusy=false;if(error){if(force){alert(error.message);return}document.getElementById('logout-error').textContent=error.message;document.getElementById('logout-submit').disabled=false;document.getElementById('logout-submit').textContent='Выйти';return}document.getElementById('logout').style.display='none';tab='home';await applySession(null)}
mountIcons();if(configured){document.getElementById('onboard').style.display='none';document.getElementById('boot').style.display='flex';client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});client.auth.getSession().then(({data,error})=>{if(error){document.getElementById('boot').style.display='none';document.getElementById('onboard').style.display='flex';return}applySession(data.session)});client.auth.onAuthStateChange((event,next)=>setTimeout(()=>{if(event==='TOKEN_REFRESHED'){session=next;return}if(event==='SIGNED_IN'&&session?.user.id===next?.user.id)return;if(event==='SIGNED_IN'||event==='SIGNED_OUT')applySession(next)},0))}

/* === Этап 5: живые данные (ошибки, статистика, достижения) === */
let mistakes=[],mistakesLoaded=false,mistakesLoading=false,mistakesError='',mistakesRequestId=0,statsData=null,statsLoading=false,statsError='';
async function loadMistakes(force){
  const userId=session?.user.id;if(!userId||mistakesLoading||(mistakesLoaded&&!force))return;
  const request=++mistakesRequestId;mistakesLoading=true;mistakesError='';if(tab==='mistakes')render();
  const{data,error}=await client.from('user_mistakes').select('question_id,repeat_count,mastered,last_seen,questions(text,category,article_ref)').eq('user_id',userId).order('last_seen',{ascending:false});
  if(request!==mistakesRequestId||session?.user.id!==userId)return;
  mistakesLoading=false;mistakesLoaded=true;
  if(error){mistakesError=gameErrorText(error)}else mistakes=data||[];
  if(tab==='mistakes')render();
}
async function loadStatsData(force){
  const userId=session?.user.id;if(!userId||statsLoading)return;
  statsLoading=true;statsError='';if(tab==='profile'&&profileView==='stats')render();
  const[ans,mist,sess]=await Promise.all([
    client.from('user_answers').select('question_id,is_correct,xp_earned,answered_at').eq('user_id',userId).order('answered_at',{ascending:true}),
    client.from('user_mistakes').select('question_id,repeat_count,mastered').eq('user_id',userId),
    client.from('game_sessions').select('mode,status,score,best_score,xp_earned').eq('user_id',userId)
  ]);
  if(session?.user.id!==userId)return;
  statsLoading=false;
  if(ans.error||mist.error||sess.error){statsError=gameErrorText(ans.error||mist.error||sess.error)}
  else statsData=computeStats(ans.data||[],mist.data||[],sess.data||[]);
  if(tab==='profile'&&profileView==='stats')render();
}
function openStats(){tab='profile';profileView='stats';statsData=null;loadStatsData(true);render()}
function computeStats(answers,mistakesArr,sessions){
  const total=answers.length,correct=answers.filter(a=>a.is_correct).length;
  let streak=0;for(let i=answers.length-1;i>=0&&answers[i].is_correct;i--)streak++;
  const wd=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],days=[];
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d)}
  const activity=days.map(d=>({label:wd[d.getDay()],count:answers.filter(a=>new Date(a.answered_at).toDateString()===d.toDateString()).length}));
  const mastered=mistakesArr.filter(m=>m.mastered).length;
  const detectiveDone=sessions.filter(s=>s.mode==='detective'&&s.status==='completed').length;
  const s={total,correct,accuracy:total?Math.round(correct/total*100):0,streak,activity,mastered,detectiveDone};
  s.achievements=[
    {id:'first',name:'Первый шаг',desc:'Первый ответ на вопрос тренировки',icon:'check',earned:s.total>=1},
    {id:'ten',name:'Десятка',desc:'10 верных ответов',icon:'target',earned:s.correct>=10},
    {id:'fifty',name:'Знаток закона',desc:'50 верных ответов',icon:'scales',earned:s.correct>=50},
    {id:'streak',name:'Серия · 5',desc:'5 верных ответов подряд',icon:'lightning',earned:s.streak>=5},
    {id:'detective',name:'Сыщик',desc:'Первое завершённое расследование',icon:'search',earned:s.detectiveDone>=1},
    {id:'master',name:'Работа над ошибками',desc:'3 освоенные ошибки',icon:'rotate',earned:s.mastered>=3}
  ];
  s.earned=s.achievements.filter(a=>a.earned).length;
  return s;
}
async function markMistakeMastered(questionId,quiet){
  const userId=session?.user.id;if(!userId)return;
  try{
    const{error}=await client.from('user_mistakes').update({mastered:true}).eq('user_id',userId).eq('question_id',questionId);
    if(error)throw error;
    mistakes=mistakes.map(m=>m.question_id===questionId?{...m,mastered:true}:m);
    statsData=null;
  }catch(e){if(!quiet){mistakesError=gameErrorText(e);if(tab==='mistakes')render()}return}
  if(!quiet&&tab==='mistakes')render();
}
async function startMistakeRound(questionIds){
  if(sessionBusy||!(await ensureSessionListForStart()))return;
  const existing=gameSessions.find(s=>s.mode==='training'&&s.status==='active'&&s.session_key==='training:mistakes');
  if(existing)return resumeSession(existing.id);
  await ensureGameQuestions();
  const pool=gameQuestions.filter(q=>questionIds.includes(q.id));
  if(!pool.length){sessionError='Вопросы ещё загружаются — попробуйте через пару секунд';render();return}
  sessionBusy=true;sessionError='';gameRound=buildTrainingRound('mistakes',pool);detectiveRound=null;render();
  try{const saved=await saveSessionRecord(trainingSessionRecord());gameRound.sessionId=saved.id;gameView='question';tab='game';menuView='modes'}
  catch(error){gameRound=null;sessionError=gameErrorText(error)}
  sessionBusy=false;render();scrollTo(0,0);
}
async function trainWeakCategory(category){await ensureGameQuestions();const ids=gameQuestions.filter(q=>q.category===category).map(q=>q.id);if(ids.length)startMistakeRound(ids)}

/* Делегированная обработка data-action (замена inline onclick с подстановкой данных) */
const ACTIONS={
  openArticle:el=>openArticle(el.dataset.arg),
  openSavedArticle:el=>openSavedArticle(el.dataset.arg),
  toggleFavorite:el=>toggleFavorite(el.dataset.arg),
  openChapter:el=>openChapter(el.dataset.arg),
  openArticleChapter:el=>openArticleChapter(el.dataset.arg),
  setCodeCategory:el=>setCodeCategory(el.dataset.arg),
  resumeSession:el=>resumeSession(el.dataset.arg),
  requestReset:el=>requestReset(el.dataset.mode,el.dataset.arg),
  selectDetectiveOption:el=>selectDetectiveOption(el.dataset.arg),
  toggleGameOption:el=>toggleGameOption(+el.dataset.arg),
  scrollToLegalPart:(el,e)=>scrollToLegalPart(e,el.dataset.arg),
  startDetectiveScenario:el=>startDetectiveScenario(+el.dataset.arg),
  repeatMistake:el=>startMistakeRound([+el.dataset.arg]),
  repeatAllMistakes:()=>startMistakeRound(mistakes.filter(m=>!m.mastered).map(m=>m.question_id)),
  markMastered:el=>markMistakeMastered(+el.dataset.arg),
  trainCategory:el=>trainWeakCategory(el.dataset.arg)
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el||el.disabled)return;const fn=ACTIONS[el.dataset.action];if(fn){e.preventDefault();fn(el,e)}});
