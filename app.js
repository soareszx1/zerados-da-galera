
const YEAR = new Date().getFullYear();
const PLATFORMS = ["PC","PS5","PS4","Xbox Series","Xbox One","Switch","Switch 2","Steam Deck","Mobile","Retrô / Emulador","Outro"];
const STATUS = {jogando:{l:"Jogando"},zerado:{l:"Zerado"},platinado:{l:"Platinado"},pausado:{l:"Pausado"},dropado:{l:"Dropado"},quero:{l:"Na fila"}};
const TIERS = ["S","A","B","C","D"];
const RUNS = {historia:"Só história",extras:"História + extras",completo:"100% / completista"};
const ROLES = {
  fundador:{l:"Fundador",c:"var(--tS)",d:"Criou a comunidade"},
  admin:{l:"Admin",c:"var(--tA)",d:"Cuida da casa"},
  moderador:{l:"Moderador",c:"var(--tB)",d:"Mantém a ordem"},
  suporte:{l:"Suporte",c:"var(--tC)",d:"Ajuda a galera travada"},
  curador:{l:"Curador de Guias",c:"var(--tD)",d:"Escreve as melhores dicas"},
  cacador:{l:"Caçador de Troféus",c:"var(--st-plat)",d:"Vive atrás de platina"},
  speedrunner:{l:"Speedrunner",c:"var(--st-queue)",d:"Zera rápido demais"},
  coop:{l:"Parceiro de Coop",c:"var(--st-play)",d:"Sempre topa jogar junto"},
  veterano:{l:"Veterano",c:"var(--st-drop)",d:"Joga desde o Atari"},
  novato:{l:"Novato",c:"var(--st-pause)",d:"Chegou agora"}
};
const RX = {gg:{l:"GG",t:"Mandou bem"},hype:{l:"Hype",t:"Fiquei com vontade"},fila:{l:"+ Fila",t:"Quero jogar também"}};
const GLYPHS = ["▲","●","■","✖","★","◆","♥","⚡"];
const COLORS = ["#FF4D6D","#FF9F1C","#E9C400","#2EC27E","#16A3C7","#3D5AFE","#9B5DE5","#F15BB5"];
const VIEWS = ["inicio","saves","quadro","estante","tierlist","novidades","dicas","chat","ranking"];
const SKINS = {padrao:{l:"Padrão",lv:1,sw:"#FF3B6B"},neon:{l:"Neon",lv:3,sw:"#00C98D"},gameboy:{l:"Game Boy",lv:5,sw:"#6E8F0B"},ouro:{l:"Ouro",lv:8,sw:"#D99A00"},vapor:{l:"Vaporwave",lv:12,sw:"#FF4FD8"}};
const LEVEL_NAMES = [[20,"Mito"],[12,"Lenda"],[8,"Herói"],[5,"Veterano"],[3,"Aventureiro"],[1,"Novato"]];

const S = {
  mode:"loading", players:{}, comments:[], myComDoc:null, myId:null, canWrite:false, db:null, user:null, sample:null,
  view:"inicio", route:"", f:{player:"",scope:"all",q:"",status:"",platform:"",sort:"recent"},
  stale:false, roles:{}, config:{}, isOwner:false, seed:null, rx:{}, rar:{}
};

/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone = o => JSON.parse(JSON.stringify(o));
function hash(s){let h=2166136261;for(const ch of String(s).toLowerCase())h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0}
function initials(t){const w=String(t).replace(/[^\p{L}\p{N} ]/gu," ").trim().split(/\s+/).filter(x=>!/^(the|of|de|da|do|a|o)$/i.test(x));return ((w[0]||"?")[0]+((w[1]||"")[0]||"")).toUpperCase()}
function coverAttrs(t,cls=""){const h=hash(t);const a=h%360,b=(a+60+((h>>8)%140))%360;return `class="cover pat${(h>>16)%4}${cls?" "+cls:""}" style="--c1:hsl(${a} 85% 60%);--c2:hsl(${b} 75% 42%)"`}
const norm = t => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]/g,"");
const slug = t => String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,48);
const isDone = g => g.status==="zerado"||g.status==="platinado";
const fmtNota = n => typeof n==="number" ? (Number.isInteger(n)?n:n.toFixed(1).replace(".",",")) : "–";
const dkey = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const today = () => dkey(new Date());
function ago(t){if(!t||t<1e9)return "";const m=Math.round((Date.now()-t)/60000);if(m<60)return m<=1?"agora":m+" min";const h=Math.round(m/60);if(h<24)return h+" h";const d=Math.round(h/24);return d<30?d+" d":Math.round(d/30)+" mês"}
const daysSince = t => t>1e9?Math.floor((Date.now()-t)/864e5):0;
function daysUntil(ds){if(!/^\d{4}-\d{2}-\d{2}$/.test(ds||""))return null;const a=new Date(ds+"T00:00:00");const b=new Date();b.setHours(0,0,0,0);return Math.round((a-b)/864e5)}
const fmtDate = ds => {const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(ds||"");return m?`${m[3]}/${m[2]}/${m[1]}`:""};
function toast(msg){const t=$("#toast");t.innerHTML=`<div class="toast" role="status">${esc(msg)}</div>`;clearTimeout(toast.t);toast.t=setTimeout(()=>t.innerHTML="",2600)}
const platsOf = p => Array.isArray(p?.plats)&&p.plats.length?p.plats:(p?.plat?[p.plat]:[]);
const hasTips = g => !!(g.tips||(g.shots&&g.shots.length));
const tipsLabel = g => `Dicas e anotações${g.shots?.length?` · ${g.shots.length} print${g.shots.length>1?"s":""}`:""}`;

/* ---------- imagens guardadas no banco (capas, prints, fotos, banners) ---------- */
const media = {};
const mkey = (path,ver) => path+"@"+ver;
function mediaSrc(path,ver){
  if(!ver)return null;const k=mkey(path,ver);const c=media[k];
  if(c&&c.startsWith("data:"))return c;
  if(c===undefined&&S.mode==="live"&&S.db){media[k]="…";
    S.db.doc(path).get().then(sn=>{const d=sn.exists&&sn.data();const v=(d&&typeof d.img==="string"&&d.img.startsWith("data:image/"))?d.img:"none";media[k]=v;
      if(v!=="none")document.querySelectorAll(`img[data-m="${CSS.escape(k)}"]`).forEach(i=>{i.src=v})}).catch(()=>{media[k]="none"})}
  return null;
}
function mimg(path,ver,cls,alt){if(!ver||S.mode!=="live")return "";const src=mediaSrc(path,ver);return `<img class="${cls}" data-m="${esc(mkey(path,ver))}" ${src?`src="${src}"`:""} alt="${esc(alt||"")}">`}
const extImg = u => (typeof u==="string"&&/^https:\/\/(upload\.wikimedia\.org|thumb\.wikimedia\.org|media\.rawg\.io)\//.test(u))?u:"";
const localCover = t => {const f=S.covers&&typeof ckey==="function"?S.covers[ckey(t)]:"";return typeof f==="string"&&/^covers\/[a-z0-9]+\.(jpg|png)$/.test(f)?f:""};
const coverBox = (g,cls="") => {const up=g.pid&&g.coverV?mimg(`players/${g.pid}/covers/${g.gid}`,g.coverV,"cbg","")+mimg(`players/${g.pid}/covers/${g.gid}`,g.coverV,"cimg","Capa de "+g.title):"";const loc=!up&&localCover(g.title);const src=loc||extImg(g.coverUrl);
  const ext=!up&&src?`<img class="cbg" src="${esc(src)}" alt="" aria-hidden="true" loading="lazy" referrerpolicy="no-referrer"><img class="cimg" src="${esc(src)}" alt="Capa de ${esc(g.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.querySelectorAll('img').forEach(i=>i.remove())">`:"";
  return `<div ${coverAttrs(g.title,cls)}>${up||ext}<span class="ini">${esc(initials(g.title))}</span></div>`};
const glyph = (p,sm) => `<span class="glyph${sm?" sm":""}" style="--pc:${esc(p?.color||"#888")}" aria-hidden="true">${esc(p?.glyph||"●")}${p?._id?mimg(`players/${p._id}/media/avatar`,p.avatarV,"",""):""}</span>`;
function fileToImg(file,max,limit,crop){
  return new Promise((res,rej)=>{
    if(!file||!/^image\//.test(file.type))return rej(new Error("tipo"));
    const url=URL.createObjectURL(file);const im=new Image();
    im.onload=()=>{
      let sx=0,sy=0,sw=im.width,sh=im.height,ow,oh;
      if(crop){const r=crop.w/crop.h;if(sw/sh>r){sw=sh*r;sx=(im.width-sw)/2}else{sh=sw/r;sy=(im.height-sh)/2}ow=crop.w;oh=crop.h}
      else{const sc=Math.min(1,max/Math.max(sw,sh));ow=Math.round(sw*sc);oh=Math.round(sh*sc)}
      const cv=document.createElement("canvas");cv.width=ow;cv.height=oh;const cx=cv.getContext("2d");
      cx.fillStyle="#fff";cx.fillRect(0,0,ow,oh);cx.drawImage(im,sx,sy,sw,sh,0,0,ow,oh);URL.revokeObjectURL(url);
      let q=.82,d=cv.toDataURL("image/jpeg",q);while(d.length>limit&&q>.35){q-=.08;d=cv.toDataURL("image/jpeg",q)}res(d)};
    im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error("img"))};im.src=url;
  });
}

/* ---------- dados de exemplo ---------- */
const T = n => Date.now()-(14-n)*5*3600e3;
const DEMO = {
  d1:{nick:"Rafa (exemplo)",title:"Rei do Souls",color:"#FF4D6D",glyph:"▲",plats:["PS5","PC"],goal:12,fav:"Bloodborne",discord:"rafa_souls",games:{
    a:{title:"Elden Ring",platform:"PS5",status:"platinado",year:2024,run:"completo",tier:"S",nota:10,hours:160,fase:"",progress:100,comment:"Sofri, chorei e platinei. Malenia ainda me assombra.",tips:"1. Pegue a Espada de Noite e Chama cedo no Caelid (Torre de Carian).\n2. Farm de runas: pássaros perto da Ponte de Mohgwyn.\n3. Faça a quest da Ranni antes do Leyndell, senão você perde partes dela.",rec:true,updatedAt:T(5)},
    b:{title:"Astro Bot",platform:"PS5",status:"zerado",year:YEAR,run:"extras",tier:"S",nota:9.5,hours:16,fase:"",progress:100,comment:"Alegria pura do começo ao fim.",rec:true,updatedAt:T(9)},
    c:{title:"Final Fantasy VII Rebirth",platform:"PS5",status:"jogando",tier:"A",nota:9,hours:48,fase:"Capítulo 9 – Costa del Sol",progress:55,comment:"Mais Queen's Blood do que história até agora.",updatedAt:T(12)},
    d:{title:"Starfield",platform:"PC",status:"dropado",tier:"D",nota:5,hours:22,fase:"Missão 'Um passo no grande vazio'",progress:20,comment:"Muita tela de loading pra pouca aventura.",updatedAt:T(3)},
    e:{title:"Hollow Knight: Silksong",platform:"PS5",status:"quero",lanc:"",updatedAt:T(1)}}},
  d2:{nick:"Bia (exemplo)",title:"Mapa Ambulante",color:"#16A3C7",glyph:"●",plats:["Switch","PS5","Mobile"],goal:8,fav:"Hollow Knight",discord:"bia.knight",games:{
    a:{title:"Hollow Knight",platform:"Switch",status:"zerado",year:2022,tier:"S",nota:10,hours:45,progress:100,comment:"Metroidvania perfeito, trilha sonora absurda.",tips:"Compre o mapa da Cornifer assim que ouvir ele cantarolando. O amuleto Quick Focus muda o jogo nos chefes.",spoiler:true,rec:true,updatedAt:T(4)},
    b:{title:"Astro Bot",platform:"PS5",status:"zerado",year:YEAR,run:"historia",tier:"A",nota:9,hours:14,progress:100,comment:"Fofo demais.",rec:true,updatedAt:T(8)},
    c:{title:"The Legend of Zelda: Tears of the Kingdom",platform:"Switch",status:"jogando",tier:"S",nota:9.5,hours:90,fase:"Templo do Vento feito, indo pro Fogo",progress:40,comment:"Construí um carro voador e esqueci da missão.",rec:true,updatedAt:T(11)},
    d:{title:"Balatro",platform:"Mobile",status:"zerado",year:YEAR,tier:"A",nota:9,hours:70,progress:100,comment:"Só mais uma rodada…",rec:true,updatedAt:T(10)}}},
  d3:{nick:"Léo (exemplo)",title:"Speedrunner de Sofá",color:"#9B5DE5",glyph:"■",plats:["PC","Steam Deck"],goal:15,fav:"The Witcher 3",games:{
    a:{title:"Elden Ring",platform:"PC",status:"zerado",year:2023,run:"historia",tier:"A",nota:8.5,hours:110,progress:100,comment:"Ótimo, mas a parte final cansou.",rec:true,updatedAt:T(2)},
    b:{title:"Hades II",platform:"PC",status:"jogando",tier:"S",nota:9.5,hours:30,fase:"Chegando no Tártaro de novo",progress:65,rec:true,updatedAt:T(13)},
    c:{title:"Cyberpunk 2077",platform:"PC",status:"zerado",year:YEAR,tier:"B",nota:8,hours:75,progress:100,comment:"Depois dos patches virou outro jogo.",updatedAt:T(7)},
    d:{title:"Balatro",platform:"Steam Deck",status:"jogando",tier:"A",nota:9,hours:20,fase:"Ante 6 com o baralho de ouro",progress:50,updatedAt:T(6)}},
    coop:{title:"Hades II",note:"Bora trocar build no Discord?",at:T(12)}}
};
const DEMO_ROLES={d1:["fundador","admin"],d2:["curador","suporte"],d3:["speedrunner","novato"]};
const DEMO_CONFIG={challenge:{id:"cdemo",title:"Novembro dos metroidvanias",desc:"Zere qualquer metroidvania até o fim do mês.",until:`${YEAR}-11-30`,at:T(1)},club:{title:"Balatro",until:`${YEAR}-11-30`,at:T(1)}};
const DEMO_COMMENTS=[{cid:"x1",by:"d2",t:"elden-ring",x:"Alguém tem dica pra Malenia sem invocação?",at:T(10)},{cid:"x2",by:"d1",t:"elden-ring",x:"Sangramento + espada dupla. E paciência kkk",at:T(11)},{cid:"x3",by:"d3",t:"balatro",x:"Tô no clube! Baralho de ouro é roubado.",at:T(13)}];
(()=>{const now=new Date();for(const [k,p] of Object.entries(DEMO)){p._id=k;p.days={};for(let i=0;i<170;i++){const h=hash(k+i);if(h%3===0){const d=new Date(now);d.setDate(d.getDate()-i);p.days[dkey(d)]=1+h%4}}}
  DEMO.d2.challenges={cdemo:{at:T(9)}};
  DEMO.d2.reacts={"d1|a":{r:["gg"],at:T(9)},"d3|b":{r:["hype","fila"],at:T(13)}};DEMO.d3.reacts={"d1|a":{r:["gg","hype"],at:T(12)},"d2|a":{r:["gg"],at:T(8)},"d2|c":{r:["hype"],at:T(12)}};DEMO.d1.reacts={"d2|d":{r:["fila"],at:T(10)},"d2|a":{r:["gg"],at:T(6)}};})();

/* ---------- dados derivados ---------- */
const players = () => S.mode==="demo"?DEMO:S.players;
const cfg = () => S.mode==="demo"?DEMO_CONFIG:S.config;
const comms = () => S.mode==="demo"?DEMO_COMMENTS:S.comments;
const meId = () => S.mode==="live"?S.myId:null;
const me = () => {const id=meId();return id?S.players[id]:null};
const pslug = p => slug(p.nick)||("jogador-"+(hash(p._id)%10000));
const pidBySlug = s => Object.keys(players()).find(id=>pslug(players()[id])===s);
const rolesOf = pid => (S.mode==="demo"?DEMO_ROLES[pid]:S.roles[pid])||[];
const roleChips = pid => {const r=rolesOf(pid).filter(x=>ROLES[x]);return r.length?`<div class="roles">${r.map(x=>`<span class="role" style="--rc:${ROLES[x].c}" title="${esc(ROLES[x].d)}">${esc(ROLES[x].l)}</span>`).join("")}</div>`:""};
function allGames(){const out=[];for(const [pid,p] of Object.entries(players()))for(const [gid,g] of Object.entries(p.games||{}))out.push({...g,gid,pid,p});return out}
function filtered(){
  const f=S.f,q=norm(f.q);
  let L=allGames().filter(g=>(!f.player||g.pid===f.player)&&(f.scope!=="year"||(isDone(g)&&Number(g.year)===YEAR))&&(!f.status||g.status===f.status)&&(!f.platform||g.platform===f.platform)&&(!q||norm(g.title).includes(q)));
  if(f.sort==="nota")L.sort((a,b)=>(b.nota??-1)-(a.nota??-1));else if(f.sort==="az")L.sort((a,b)=>a.title.localeCompare(b.title,"pt"));else L.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  return L;
}
function reactsOf(v){if(Array.isArray(v))return {r:v,at:0};if(v&&Array.isArray(v.r))return {r:v.r,at:Number(v.at)||0};return {r:[],at:0}}
const rkey=(pid,gid)=>pid+"|"+gid;
function buildRx(){const out={};for(const [pid,p] of Object.entries(players()))for(const [k,v] of Object.entries(p.reacts||{})){const {r,at}=reactsOf(v);const o=out[k]||(out[k]={});r.forEach(x=>{if(RX[x])(o[x]||(o[x]=[])).push({pid,at})})}return out}
const commentsFor = s => comms().filter(c=>c.t===s).sort((a,b)=>a.at-b.at);
function stats(p){
  const G=Object.values(p.games||{});const done=G.filter(isDone);const notas=G.map(g=>g.nota).filter(n=>typeof n==="number");
  return {total:G.length,done:done.length,year:done.filter(g=>Number(g.year)===YEAR).length,playing:G.filter(g=>g.status==="jogando").length,
    plat:G.filter(g=>g.status==="platinado").length,drop:G.filter(g=>g.status==="dropado").length,hours:G.reduce((s,g)=>s+(Number(g.hours)||0),0),
    avg:notas.length?notas.reduce((a,b)=>a+b,0)/notas.length:null,nNotas:notas.length,plats:new Set(G.map(g=>g.platform).filter(Boolean)).size,
    tips:G.filter(hasTips).length,retro:G.filter(g=>g.platform==="Retrô / Emulador").length};
}
function socialOf(pid){
  let ggIn=0;for(const [k,o] of Object.entries(S.rx))if(k.startsWith(pid+"|"))for(const arr of Object.values(o))ggIn+=arr.filter(x=>x.pid!==pid).length;
  const cm=comms().filter(c=>c.by===pid).length;const p=players()[pid];
  return {ggIn,cm,chal:Object.keys(p?.challenges||{}).length,days:Object.keys(p?.days||{}).length};
}
function xpOf(pid){
  const p=players()[pid];if(!p)return 0;let x=0;
  for(const g of Object.values(p.games||{})){x+=5;if(g.status==="jogando")x+=10;if(isDone(g))x+=50;if(g.status==="platinado")x+=70;if(g.comment)x+=10;if(typeof g.nota==="number")x+=5;if(g.tips)x+=30;x+=Math.min(6,(g.shots||[]).length)*10}
  const so=socialOf(pid);x+=so.ggIn*5+so.cm*5+so.chal*100+so.days*3;return x;
}
function levelOf(x){const L=Math.floor(Math.sqrt(x/40))+1;const base=40*(L-1)**2,next=40*L**2;return {L,base,next,pct:(x-base)/(next-base)*100,name:(LEVEL_NAMES.find(([n])=>L>=n)||[0,"Novato"])[1]}}
const lvlChip = pid => {const l=levelOf(xpOf(pid));return `<span class="lvl" title="${esc(l.name)}">Nv ${l.L} · ${esc(l.name)}</span>`};
const BADGES = [
  {id:"primeiro",ic:"1",col:"var(--tC)",t:"Primeiro zerado",ok:s=>s.done>=1,d:s=>`${s.done} zerado${s.done>1?"s":""}`},
  {id:"maratona",ic:"10",col:"var(--tS)",t:"Maratonista",ok:s=>s.year>=10,d:s=>`${s.year} zerados em ${YEAR}`},
  {id:"platina",ic:"100",col:"var(--st-plat)",t:"Platinador",ok:s=>s.plat>=1,d:s=>`${s.plat} platinado${s.plat>1?"s":""}`},
  {id:"horas",ic:"H",col:"var(--tA)",t:"Sem vida social",ok:s=>s.hours>=200,d:s=>`${s.hours} h registradas`},
  {id:"malabar",ic:"∞",col:"var(--st-play)",t:"Malabarista",ok:s=>s.playing>=8,d:s=>`${s.playing} jogos ao mesmo tempo`},
  {id:"guia",ic:"?!",col:"var(--tD)",t:"Guia da galera",ok:s=>s.tips>=3,d:s=>`${s.tips} jogos com dicas`},
  {id:"colec",ic:"25",col:"var(--st-queue)",t:"Colecionador",ok:s=>s.total>=25,d:s=>`${s.total} jogos cadastrados`},
  {id:"multi",ic:"3+",col:"var(--tC)",t:"Multiplataforma",ok:s=>s.plats>=3,d:s=>`${s.plats} plataformas`},
  {id:"retro",ic:"8b",col:"var(--tB)",t:"Saudosista",ok:s=>s.retro>=1,d:s=>`${s.retro} jogo${s.retro>1?"s":""} retrô`},
  {id:"mole",ic:"♥",col:"var(--st-drop)",t:"Coração mole",ok:s=>s.nNotas>=4&&s.avg>=9,d:s=>`média ${fmtNota(s.avg)}`},
  {id:"critico",ic:"!",col:"var(--tD)",t:"Crítico exigente",ok:s=>s.nNotas>=4&&s.avg<7,d:s=>`média ${fmtNota(s.avg)}`},
  {id:"desapego",ic:"X",col:"var(--st-pause)",t:"Desapegado",ok:s=>s.drop>=3,d:s=>`${s.drop} dropados`},
  {id:"influ",ic:"GG",col:"var(--accent)",t:"Influencer",ok:(s,o)=>o.ggIn>=10,d:(s,o)=>`${o.ggIn} reações recebidas`},
  {id:"papo",ic:"“”",col:"var(--st-queue)",t:"Resenhista",ok:(s,o)=>o.cm>=10,d:(s,o)=>`${o.cm} comentários`},
  {id:"desafio",ic:"★",col:"var(--st-plat)",t:"Desafiante",ok:(s,o)=>o.chal>=1,d:(s,o)=>`${o.chal} desafio${o.chal>1?"s":""} cumprido${o.chal>1?"s":""}`},
  {id:"assiduo",ic:"30",col:"var(--tA)",t:"Assíduo",ok:(s,o)=>o.days>=30,d:(s,o)=>`${o.days} dias ativos`}
];
function badgesOf(pid){const p=players()[pid];if(!p)return [];const s=stats(p),o=socialOf(pid);return BADGES.filter(b=>b.ok(s,o)).map(b=>({...b,desc:b.d(s,o)}))}
function computeRarity(){const ids=Object.keys(players());const cnt={};ids.forEach(id=>badgesOf(id).forEach(b=>cnt[b.id]=(cnt[b.id]||0)+1));const r={};for(const b of BADGES){const pct=ids.length?(cnt[b.id]||0)/ids.length*100:0;r[b.id]={pct,c:pct<=20?"lendaria":pct<=40?"epica":pct<=70?"rara":"comum"}}return r}
const RAR_L={comum:"Comum",rara:"Rara",epica:"Épica",lendaria:"Lendária"};
const badgeHTML=(b,who)=>{const r=S.rar[b.id]||{pct:0,c:"comum"};return `<div class="badge"><span class="bi" style="background:${b.col}">${b.ic}</span><div><b>${esc(b.t)}</b>${who?esc(who)+" · ":""}${esc(b.desc)}<div class="rarline"><span class="rar ${r.c}">${RAR_L[r.c]}</span>${Math.round(r.pct)}% da galera tem</div></div></div>`};
function recsFor(pid){
  const P=players(),mine=P[pid];if(!mine)return [];
  const myT=new Map(Object.values(mine.games||{}).map(g=>[norm(g.title),g]));
  const sim=o=>{const d=[];for(const g of Object.values(o.games||{})){const m=myT.get(norm(g.title));if(m&&typeof m.nota==="number"&&typeof g.nota==="number")d.push(Math.abs(m.nota-g.nota))}return d.length?1/(1+(d.reduce((a,b)=>a+b,0)/d.length)/2):.5};
  const cand={};
  for(const [oid,o] of Object.entries(P)){if(oid===pid)continue;const sm=sim(o);
    for(const [gid,g] of Object.entries(o.games||{})){const k=norm(g.title);if(myT.has(k)||g.status==="dropado"||g.status==="quero")continue;
      if((typeof g.nota==="number"&&g.nota>=8)||g.rec){const c=cand[k]||(cand[k]={title:g.title,score:0,by:[],g:{...g,gid,pid:oid}});c.score+=((g.nota??8)-6)*sm+(g.rec?1:0);c.by.push({p:o,nota:g.nota});if(g.coverV&&!c.g.coverV)c.g={...g,gid,pid:oid}}}}
  return Object.values(cand).sort((a,b)=>b.score-a.score).slice(0,4);
}
function feedItems(){
  const out=[];const verb={jogando:"está jogando",zerado:"zerou",platinado:"platinou",pausado:"pausou",dropado:"dropou",quero:"colocou na fila"};
  for(const g of allGames())if(g.updatedAt>1e9)out.push({at:g.updatedAt,p:g.p,html:`${verb[g.status]||"atualizou"} <a href="#jogo-${esc(slug(g.title))}"><b>${esc(g.title)}</b></a>${g.status==="jogando"&&g.fase?` · ${esc(g.fase)}`:""}${isDone(g)&&typeof g.nota==="number"?` · nota ${fmtNota(g.nota)}`:""}`,g});
  const titleOf={};allGames().forEach(g=>titleOf[slug(g.title)]=g.title);
  for(const c of comms()){const p=players()[c.by];if(p)out.push({at:c.at,p,html:`comentou em <a href="#jogo-${esc(c.t)}"><b>${esc(titleOf[c.t]||c.t)}</b></a>: “${esc(c.x.slice(0,80))}${c.x.length>80?"…":""}”`})}
  const ch=cfg().challenge;
  for(const [pid,p] of Object.entries(players())){
    if(ch&&p.challenges?.[ch.id])out.push({at:p.challenges[ch.id].at,p,html:`cumpriu o desafio <b>${esc(ch.title)}</b>`});
    if(p.coop&&daysSince(p.coop.at)<15)out.push({at:p.coop.at,p,html:`procura parceiro para <a href="#jogo-${esc(slug(p.coop.title))}"><b>${esc(p.coop.title)}</b></a>`});
  }
  return out.sort((a,b)=>b.at-a.at);
}
function notifsFor(pid){
  const P=players(),mine=P[pid];if(!mine)return [];const out=[];
  const mySlugs=new Set(Object.values(mine.games||{}).map(g=>slug(g.title)));
  const talked=new Set(comms().filter(c=>c.by===pid).map(c=>c.t));
  const titleOf={};allGames().forEach(g=>titleOf[slug(g.title)]=g.title);
  for(const c of comms())if(c.by!==pid&&(mySlugs.has(c.t)||talked.has(c.t))&&P[c.by])out.push({at:c.at,p:P[c.by],h:`#jogo-${c.t}`,html:`<b>${esc(P[c.by].nick)}</b> comentou em <b>${esc(titleOf[c.t]||c.t)}</b>: “${esc(c.x.slice(0,70))}”`});
  for(const [oid,o] of Object.entries(P)){if(oid===pid)continue;
    for(const [k,v] of Object.entries(o.reacts||{})){if(!k.startsWith(pid+"|"))continue;const {r,at}=reactsOf(v);const g=mine.games?.[k.split("|")[1]];if(!g||!r.length)continue;
      out.push({at,p:o,h:`#jogo-${slug(g.title)}`,html:`<b>${esc(o.nick)}</b> reagiu com ${r.map(x=>`<b>${RX[x]?.l||x}</b>`).join(" e ")} em <b>${esc(g.title)}</b>`})}}
  const c=cfg();
  if(c.challenge?.at)out.push({at:c.challenge.at,p:null,h:"#inicio",html:`Novo desafio do mês: <b>${esc(c.challenge.title)}</b>`});
  for(const b of (typeof boardList==="function"?boardList():[]))if(b.by!==pid)out.push({at:b.at||0,p:P[b.by]||null,h:"#quadro",html:`${b.type==="evento"?"Convite para jogar":b.type==="enquete"?"Nova enquete":"Novo aviso"}: <b>${esc(b.title)}</b>`});
  for(const [k,t] of Object.entries(typeof tierlists==="function"?tierlists():{}))if(t&&t.status==="aberta")out.push({at:t.at||0,p:null,h:"#tierlist",html:`Votação aberta: <b>${esc(t.title||"Tier list do mês")}</b>`});
  if(c.club?.at)out.push({at:c.club.at,p:null,h:"#inicio",html:`Clube do jogo: <b>${esc(c.club.title)}</b>`});
  return out.sort((a,b)=>b.at-a.at).slice(0,40);
}

/* ---------- render geral ---------- */
function renderAll(){S.rx=buildRx();S.rar=computeRarity();applySkin();renderActions();renderBanner();renderTabs();renderView()}
function renderActions(){
  const A=$("#actions");let h="";const m=me();
  if(S.mode==="live"){
    if(S.canWrite&&m){
      const n=notifsFor(S.myId).filter(x=>x.at>(m.notifSeen||0)).length;
      h+=`<button class="btn bell" data-act="bell" aria-label="Notificações${n?`, ${n} novas`:""}">Avisos${n?`<span class="n">${n>9?"9+":n}</span>`:""}</button>`;
      h+=`<button class="btn primary" data-act="add">+ Jogo</button><a class="btn" href="#perfil-${esc(pslug(m))}">${glyph(m,true)} Meu perfil</a>`;
    }else if(S.canWrite){h+=`<button class="btn primary" data-act="profile">Criar meu perfil</button>`}
    else if(!S.myId){h+=`<button class="btn" data-act="auth" data-m="entrar">Entrar</button><button class="btn primary" data-act="auth" data-m="criar">Criar conta</button>`}
    if(S.myId)h+=`<button class="btn ghost small" data-act="logout">Sair</button>`;
  }
  const dc=S.mode==="live"?S.config.discord:"";
  if(dc)h+=`<a class="btn discord" href="${esc(dc)}" target="_blank" rel="noopener">Discord</a>`;
  if(S.mode==="live"&&S.isOwner)h+=`<button class="btn" data-act="settings">Painel do dono</button>`;
  if(S.mode==="demo")h+=`<button class="btn" data-act="exitdemo">Sair do exemplo</button>`;
  A.innerHTML=h;
}
function renderBanner(){
  const B=$("#banner");
  if(S.mode==="demo")B.innerHTML=`<div class="banner"><span>Modo exemplo: esses perfis são fictícios e nada aqui é salvo.</span><button class="btn small" data-act="exitdemo">Voltar pra galera de verdade</button></div>`;
  else if(S.mode==="offline")B.innerHTML=`<div class="banner"><span>${S.notConfigured?"O site ainda não foi configurado: preencha o arquivo config.js com os dados do Firebase.":"Não deu pra carregar a galera agora. Verifique a internet e recarregue a página."}</span><button class="btn small" data-act="demo">Ver como fica</button></div>`;
  else if(S.mode==="live"&&S.myId&&!S.canWrite)B.innerHTML=`<div class="banner"><span>Confirme seu e-mail para participar: mandamos um link para <b>${esc(S.email||"")}</b> (olhe o spam também).</span><span class="actions"><button class="btn small" data-act="resend">Reenviar</button><button class="btn small primary" data-act="reloaduser">Já confirmei</button></span></div>`;
  else if(S.mode==="live"&&S.seed)B.innerHTML=`<div class="banner"><span>Seu perfil <b>${esc(S.seed.player?.nick||"")}</b> · ${esc(S.seed.player?.title||"")} já está montado com ${Object.keys(S.seed.player?.games||{}).length} jogos.${S.players[S.myId]?` Ao ativar, ele substitui o apelido e o visual do perfil “${esc(S.players[S.myId].nick)}” e mantém os jogos que já estão nele.`:" É só ativar."}</span><button class="btn small primary" data-act="claim">Ativar meu perfil</button></div>`;
  else if(S.stale)B.innerHTML=`<div class="banner"><span>Conexão lenta: os dados podem estar desatualizados.</span></div>`;
  else B.innerHTML="";
}
function renderTabs(){
  const labels={inicio:"Início",saves:"Meus Saves",quadro:"Quadro",novidades:"Novidades",estante:"Galera",tierlist:"Tier List",jogando:"Jogando agora",dicas:"Dicas",chat:"Chat",ranking:"Ranking"};
  const un=S.view==="chat"?0:chatUnread();
  $("#tabs").innerHTML=VIEWS.map(v=>`<a class="tab" role="tab" href="#${v}" aria-selected="${S.view===v}">${labels[v]}${v==="chat"&&un?` <span class="tabn">${un>9?"9+":un}</span>`:""}</a>`).join("");
  $("#filters").hidden=!["estante","tierlist","jogando","dicas"].includes(S.view)||!allGames().length;
  renderPlatforms();
  const pf=$("#pfilter"),fp=S.f.player&&players()[S.f.player];
  pf.innerHTML=fp?`<button class="pfchip" data-act="clearplayer">Só de ${esc(fp.nick)} ×</button>`:"";
}
function renderPlatforms(){
  const sel=$("#platform"),cur=S.f.platform;const used=[...new Set(allGames().map(g=>g.platform).filter(Boolean))].sort();
  sel.innerHTML=`<option value="">Todas as plataformas</option>`+used.map(p=>`<option${p===cur?" selected":""}>${esc(p)}</option>`).join("");
}
function renderView(){
  const V=$("#view");
  if(S.mode==="loading"){V.innerHTML=`<div class="loading">Carregando save da galera<span class="blink">_</span></div>`;return}
  if(!Object.keys(players()).length){
    V.innerHTML=`<section class="box hero-empty"><div class="big">P1<br>START</div><div><h2>Ninguém deu start ainda</h2>
      <p>Crie seu perfil, cadastre os jogos que você já zerou na vida, os que zerou em ${YEAR} e o que está jogando agora. Depois chame a galera.</p>
      <div class="actions">${S.mode==="live"&&S.canWrite?`<button class="btn primary" data-act="profile">Criar meu perfil</button>`:""}<button class="btn" data-act="demo">Ver como fica com exemplo</button></div></div></section>`;return}
  const fn={inicio:viewHome,estante:viewEstante,tierlist:viewTier,jogando:viewJogando,dicas:viewDicas,chat:viewChat,ranking:viewRanking,perfil:viewPerfil,jogo:viewJogo,novidades:viewNovidades,saves:viewSaves,save:viewSave,quadro:viewQuadro}[S.view]||viewHome;
  const log0=$("#chatlog");const nearBottom=!log0||log0.scrollHeight-log0.scrollTop-log0.clientHeight<80;const focused=document.activeElement?.id;
  V.innerHTML=fn();
  for(const id of ["chat-text","cmt-text"]){const el=document.getElementById(id);if(el&&S.drafts?.[id]){el.value=S.drafts[id]}}
  if(focused){const el=document.getElementById(focused);if(el&&V.contains(el)){el.focus();try{const n=el.value?.length||0;el.setSelectionRange(n,n)}catch{}}}
  const log=$("#chatlog");if(log&&(nearBottom||S.chatJump)){log.scrollTop=log.scrollHeight;S.chatJump=false}
}

/* ---------- peças ---------- */
function reactRow(g){
  const k=rkey(g.pid,g.gid),r=S.rx[k]||{};const mid=meId();const own=g.pid===mid;
  return `<div class="reacts">${Object.entries(RX).map(([id,o])=>{const who=(r[id]||[]).map(x=>x.pid);const on=!!mid&&who.includes(mid);
    if(own&&!who.length)return "";
    return `<button class="rx" data-act="react" data-r="${id}" data-pid="${esc(g.pid)}" data-id="${esc(g.gid)}" aria-pressed="${on}" title="${esc(o.t)}${who.length?": "+who.map(x=>players()[x]?.nick||"").join(", "):""}" ${own?"disabled":""}>${o.l}${who.length?` <b>${who.length}</b>`:""}</button>`}).join("")}</div>`;
}
function gameCard(g){
  const mine=S.mode==="live"&&g.pid===S.myId&&S.canWrite;const showBar=["jogando","pausado","dropado"].includes(g.status);const sl=slug(g.title);const nc=commentsFor(sl).length;
  return `<article class="box game">${coverBox(g)}
    ${g.tier?`<span class="tier t-${esc(g.tier)}" title="Tier ${esc(g.tier)}">${esc(g.tier)}</span>`:""}
    <div class="gbody">
      <h3 class="gtitle"><a href="#jogo-${esc(sl)}">${esc(g.title)}</a></h3>
      <div class="meta"><span class="pill s-${esc(g.status)}">${esc(STATUS[g.status]?.l||g.status)}</span>
        ${g.platform?`<span class="tag">${esc(g.platform)}</span>`:""}
        ${isDone(g)?`<span class="tag">${g.year?"zerado em "+esc(g.year):"zerado há tempos"}</span>`:""}
        ${g.hours?`<span class="tag">${isDone(g)?"zerou em ":""}${esc(g.hours)} h</span>`:""}
        ${isDone(g)&&RUNS[g.run]?`<span class="tag">${esc(RUNS[g.run])}</span>`:""}
        ${g.status==="quero"&&g.lanc?`<span class="tag">lança ${esc(fmtDate(g.lanc))}</span>`:""}
        ${g.rec?`<span class="rec">Recomenda</span>`:""}</div>
      ${g.fase?`<div class="fase">Onde parou: <b>${esc(g.fase)}</b></div>`:""}
      ${showBar?`<div class="bar" role="img" aria-label="Progresso ${Number(g.progress)||0}%"><i style="width:${Math.min(100,Number(g.progress)||0)}%"></i></div>`:""}
      ${g.comment?`<p class="quote">${esc(g.comment)}</p>`:""}
      ${hasTips(g)?`<button class="tipsbtn" data-act="tips" data-pid="${esc(g.pid)}" data-id="${esc(g.gid)}"><span class="ic">?!</span>${tipsLabel(g)}</button>`:""}
      ${reactRow(g)}
      <div class="gfoot">
        <a class="who" href="#perfil-${esc(pslug(g.p))}" style="color:inherit;text-decoration:none">${glyph(g.p,true)}<span>${nk(g.p)}</span></a>
        <div style="display:flex;align-items:center;gap:10px">
          <a class="cbtn" href="#jogo-${esc(sl)}">${nc?`${nc} comentário${nc>1?"s":""}`:"Comentar"}</a>
          ${mine?`<button class="btn small ghost" data-act="edit" data-id="${esc(g.gid)}">Editar</button>`:""}
          <span class="nota">${fmtNota(g.nota)}<small>/10</small></span></div>
      </div>
    </div></article>`;
}
const emptyBox=(big,t,p,extra="")=>`<div class="box hero-empty"><div class="big">${big}</div><div><h2>${t}</h2><p>${p}</p>${extra}</div></div>`;
const galeraRow=(pid)=>{const p=players()[pid],s=stats(p);return `<a class="gmini" href="#perfil-${esc(pslug(p))}">${glyph(p)}<div class="t"><b>${nk(p)}${pid===meId()?' <span class="you">VOCÊ</span>':""}</b><span>${s.done} zerados · ${s.playing} jogando</span></div>${lvlChip(pid)}</a>`};

/* ---------- INÍCIO ---------- */
function viewHome(){
  const P=players(),mid=meId(),m=me(),c=cfg();
  let left="",right="";
  if(m){const x=xpOf(mid),l=levelOf(x),s=stats(m);const stale=Object.values(m.games||{}).filter(g=>g.status==="jogando"&&daysSince(g.updatedAt)>=14).length;
    left+=`<section class="box hello">${glyph(m)}<div class="hi"><span class="eyebrow">Bem-vindo de volta</span><h2>${nk(m)}</h2>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${lvlChip(mid)}<span class="xpinfo">${x} XP · faltam ${l.next-x} para o nível ${l.L+1}</span></div>
      <div class="xpbar"><i style="width:${l.pct}%"></i></div>
      <div class="xpinfo">${s.playing} jogando agora${stale?` · <b style="color:var(--accent)">${stale} parado${stale>1?"s":""} há mais de 2 semanas</b>`:""}</div></div>
      <div class="actions"><button class="btn primary small" data-act="add">+ Jogo</button><a class="btn small" href="#jogando">Atualizar o que estou jogando</a></div></section>`}
  else if(S.mode==="live"&&S.canWrite)left+=`<section class="box hello"><div class="hi"><span class="eyebrow">Novo por aqui?</span><h2>Entre na galera</h2><p style="margin:0;color:var(--muted)">Crie seu perfil e comece a registrar o que joga.</p></div><button class="btn primary" data-act="profile">Criar meu perfil</button></section>`;
  if(m){const cont=myGamesSorted().filter(g=>["jogando","pausado"].includes(g.status)).slice(0,4);
    left+=`<section class="box card"><span class="eyebrow">Continuar jogando</span><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3>Onde você parou</h3><a class="btn small" href="#saves">Meus Saves</a></div>
      ${cont.length?`<div class="cont">${cont.map(g=>`<div class="citem">${coverBox(g,"mini")}<div class="t"><a href="#${saveHash(g.pid,g.gid)}"><b>${esc(g.title)}</b></a><span>${esc(paradoEm(g)||"sem anotação")}${g.next?` · próximo: ${esc(g.next)}`:""}</span><span class="hint">${g.updatedAt>1e9?quando(g.updatedAt):""}</span></div>${S.canWrite?`<button class="btn small primary" data-act="session" data-id="${esc(g.gid)}">Joguei agora</button>`:""}</div>`).join("")}</div>`:'<span class="hint">Marque um jogo como "Jogando" para ele aparecer aqui.</span>'}</section>`}
  // desafio
  const ch=c.challenge;
  if(ch&&ch.title){const done=Object.entries(P).filter(([,p])=>p.challenges?.[ch.id]);const mine=m&&m.challenges?.[ch.id];const left_d=daysUntil(ch.until);
    left+=`<section class="box card chal"><span class="eyebrow">Desafio do mês</span><h3>${esc(ch.title)}</h3>${ch.desc?`<p class="desc">${esc(ch.desc)}</p>`:""}
      <div class="row">${left_d!==null?`<span class="tag">${left_d>=0?`termina em ${left_d} dia${left_d===1?"":"s"}`:"encerrado"}</span>`:""}<span class="tag">vale 100 XP</span>
      ${m&&S.canWrite?`<button class="btn small ${mine?"":"primary"}" data-act="challenge">${mine?"Cumprido ✓ (desfazer)":"Cumpri!"}</button>`:""}</div>
      <div class="who-list">${done.length?done.map(([,p])=>glyph(p,true)).join("")+`<span class="hint" style="margin-left:8px">${done.length} cumpri${done.length>1?"ram":"u"}</span>`:'<span class="hint">Ninguém cumpriu ainda. Seja o primeiro.</span>'}</div></section>`}
  else if(S.mode==="live"&&S.isOwner)left+=`<section class="box card"><span class="eyebrow">Desafio do mês</span><p style="margin:0">Nenhum desafio ativo. Crie um no <button class="linkbtn" data-act="settings">Painel do dono</button>.</p></section>`;
  // clube
  const cl=c.club;
  if(cl&&cl.title){const k=norm(cl.title);const parts=allGames().filter(g=>norm(g.title)===k);const inMine=m&&Object.values(m.games||{}).some(g=>norm(g.title)===k);
    left+=`<section class="box card"><span class="eyebrow">Clube do jogo</span><h3><a href="#jogo-${esc(slug(cl.title))}" style="color:inherit">${esc(cl.title)}</a></h3>
      <div class="sub">Todo mundo jogando o mesmo jogo${cl.until?` até ${esc(fmtDate(cl.until))}`:""}. O progresso vem da lista de cada um.</div>
      ${parts.length?parts.map(g=>`<div class="prow"><div class="nm">${glyph(g.p,true)}<span>${nk(g.p)}</span></div><div class="bar"><i style="width:${isDone(g)?100:Math.min(100,Number(g.progress)||0)}%"></i></div><div class="v">${isDone(g)?"zerou":(Number(g.progress)||0)+"%"}</div></div>`).join(""):'<span class="hint">Ninguém entrou ainda.</span>'}
      ${m&&S.canWrite&&!inMine?`<div><button class="btn small primary" data-act="joinclub">Entrar no clube</button></div>`:""}</section>`}
  // tier list do mês
  const tlk=Object.keys(tierlists()).sort().reverse()[0];
  if(tlk){const tl=tierlists()[tlk];left+=`<section class="box card"><span class="eyebrow">Tier list do mês</span><h3>${esc(tl.title||"Os melhores do mês")}</h3><div class="sub">${esc(monthName(tlk))}${tl.note?` · ${esc(tl.note)}`:""}</div><div class="tierlist compact">${monthlyRows(tlk)}</div><div class="actions"><a class="btn small ${tl.status==="aberta"?"primary":""}" href="#tierlist" data-act="tierwho" data-id="mes">${tl.status==="aberta"?"Votar agora":"Ver todas as tier lists"}</a>${tl.status==="aberta"?`<span class="hint">Votação aberta</span>`:""}</div></section>`}
  else if(isStaff())left+=`<section class="box card"><span class="eyebrow">Tier list do mês</span><p style="margin:0">Lance a primeira votação da tier list do mês. <button class="linkbtn" data-act="monthly" data-m="${monthKey()}">Lançar votação</button></p></section>`;
  // quadro da galera
  const bl=boardList();
  if(bl.length||isStaff())left+=`<section class="box card"><span class="eyebrow">Quadro da galera</span><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3>Avisos, convites e enquetes</h3>${isStaff()?`<button class="btn small" data-act="bnew" data-t="aviso">+ Publicar</button>`:""}</div>
    ${bl.length?`<div class="bstack">${bl.slice(0,3).map(b=>boardCard(b,true)).join("")}</div>${bl.length>3?`<div><a class="btn small" href="#quadro">Ver tudo (${bl.length})</a></div>`:""}`:'<span class="hint">Nada publicado ainda. Use os botões para avisar a galera, chamar para jogar ou abrir uma enquete.</span>'}</section>`;
  // direita
  const ids=Object.keys(P).sort((a,b)=>xpOf(b)-xpOf(a));
  right+=`<section class="box card"><span class="eyebrow">A galera</span><h3>${ids.length} jogador${ids.length>1?"es":""}</h3><div class="galera">${ids.map(galeraRow).join("")}</div>${m&&S.canWrite?`<div><button class="btn small" data-act="find">Procurar e adicionar amigos</button></div>`:""}</section>`;
  if(m){const rs=recsFor(mid);right+=`<section class="box card"><span class="eyebrow">Pra você</span><h3>A galera acha que você vai curtir</h3>
    ${rs.length?rs.map(r=>`<div class="rec-item">${coverBox(r.g,"mini")}<div class="t"><b><a href="#jogo-${esc(slug(r.title))}" style="color:inherit">${esc(r.title)}</a></b>${r.by.map(b=>`${esc(b.p.nick)}${typeof b.nota==="number"?" ("+fmtNota(b.nota)+")":""}`).join(", ")} curti${r.by.length>1?"ram":"u"}</div><button class="rx" data-act="quickfila" data-t="${esc(r.title)}">+ Fila</button></div>`).join(""):'<span class="hint">Dê nota nos seus jogos para as sugestões ficarem certeiras.</span>'}</section>`}
  const wid=S.mode==="live"&&/^\d{15,22}$/.test(S.config.discordWidget||"")?S.config.discordWidget:"";
  if(wid||(S.mode==="live"&&S.config.discord)){const dark=matchMedia("(prefers-color-scheme: dark)").matches;
    right+=`<section class="box card"><span class="eyebrow">Discord da galera</span><h3>Bora conversar por lá</h3>${wid?`<iframe class="dwidget" src="https://discord.com/widget?id=${wid}&theme=${dark?"dark":"light"}" title="Quem está online no Discord" loading="lazy" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>`:""}${S.config.discord?`<div><a class="btn discord small" href="${esc(S.config.discord)}" target="_blank" rel="noopener">Entrar no servidor</a></div>`:""}</section>`}
  const nw=[...newsList().slice(0,2),...autoNews()].slice(0,4);
  if(nw.length||isStaff())right+=`<section class="box card"><span class="eyebrow">Novidades</span><h3>Do mundo dos games</h3>${nw.map(n=>newsCard({...n,by:n.by||null,id:n.by?n.id:null},true)).join("")||'<span class="hint">Nenhuma novidade ainda.</span>'}<div class="actions"><a class="btn small" href="#novidades">Ver todas</a>${isStaff()?`<button class="btn small" data-act="newsadd">+ Postar</button>`:""}</div></section>`;
  const coops=Object.entries(P).filter(([,p])=>p.coop&&p.coop.title&&daysSince(p.coop.at)<15);
  right+=`<section class="box card"><span class="eyebrow">Procurando coop</span><h3>Bora jogar junto</h3>
    ${coops.length?coops.map(([pid,p])=>`<div class="rec-item">${glyph(p)}<div class="t"><b>${nk(p)} · ${esc(p.coop.title)}</b>${esc(p.coop.note||"")}${p.discord?` · Discord: <code>${esc(p.discord)}</code>`:""}</div>${p.discord?`<button class="rx" data-act="copy" data-text="${esc(p.discord)}">Copiar</button>`:""}</div>`).join(""):'<span class="hint">Ninguém procurando parceiro agora.</span>'}
    ${m&&S.canWrite?`<div><button class="btn small" data-act="coop">${m.coop&&daysSince(m.coop.at)<15?"Editar meu pedido":"Quero parceiro"}</button></div>`:""}</section>`;
  const want={};allGames().filter(g=>g.status==="quero").forEach(g=>{const k=norm(g.title);const w=want[k]||(want[k]={title:g.title,lanc:"",ps:[],g});w.ps.push(g.p);if(g.lanc&&(!w.lanc||g.lanc<w.lanc))w.lanc=g.lanc});
  const wl=Object.values(want).sort((a,b)=>{const da=daysUntil(a.lanc),db=daysUntil(b.lanc);return (da===null?9e9:da<0?8e9:da)-(db===null?9e9:db<0?8e9:db)||b.ps.length-a.ps.length}).slice(0,6);
  right+=`<section class="box card"><span class="eyebrow">Na fila da galera</span><h3>Lançamentos e desejos</h3>
    ${wl.length?wl.map(w=>{const d=daysUntil(w.lanc);return `<div class="rec-item">${coverBox(w.g,"mini")}<div class="t"><b><a href="#jogo-${esc(slug(w.title))}" style="color:inherit">${esc(w.title)}</a></b>${w.ps.map(p=>esc(p.nick)).join(", ")}</div><div class="count">${d===null?"–":d>0?d:d===0?"Hoje":"Saiu"}<small>${d===null?"sem data":d>0?"dias":""}</small></div></div>`}).join(""):'<span class="hint">Marque jogos como “Na fila” e coloque a data de lançamento para aparecer a contagem regressiva.</span>'}</section>`;
  right+=`<section class="box card"><span class="eyebrow">Em breve</span><h3>Vem aí</h3><ul class="soon">
    <li>Domínio próprio</li><li>Bot no Discord avisando quando alguém zera</li><li>Mensagens privadas</li><li>Notificações no celular</li><li>Mande sua ideia no chat #geral</li></ul></section>`;
  return `<div class="home"><div class="col">${left}</div><div class="col">${right}</div></div>`;
}

/* ---------- ESTANTE / TIER / JOGANDO / DICAS ---------- */
function viewEstante(){const L=filtered();return L.length?`<div class="grid">${L.map(gameCard).join("")}</div>`:emptyBox("?","Nada por aqui",allGames().length?"Nenhum jogo bate com esses filtros.":"Ainda não tem nenhum jogo cadastrado.")}
function viewJogando(){
  const L=filtered().filter(g=>g.status==="jogando"||(S.f.status&&g.status===S.f.status));
  if(!L.length)return emptyBox("II","Ninguém jogando agora","Marque um jogo como “Jogando” para ele aparecer aqui com a fase e o progresso.");
  return `<div class="playing">${L.map(g=>{const co=allGames().filter(x=>x.pid!==g.pid&&x.status==="jogando"&&norm(x.title)===norm(g.title));const ds=daysSince(g.updatedAt);return `<article class="box pl">${coverBox(g)}
    <div class="info"><h3 class="gtitle"><a href="#jogo-${esc(slug(g.title))}">${esc(g.title)}</a></h3>
      <div class="who">${glyph(g.p,true)}<span>${nk(g.p)}</span>${g.platform?`<span class="tag">${esc(g.platform)}</span>`:""}</div>
      <div class="fase">${g.fase?`Parou em: <b>${esc(g.fase)}</b>`:"Fase não informada"}</div>
      <div class="bar"><i style="width:${Math.min(100,Number(g.progress)||0)}%"></i></div>
      <div class="pct">${Number(g.progress)||0}% · ${Number(g.hours)||0} h${g.updatedAt>1e9?` · atualizado há ${ago(g.updatedAt)}`:""}</div>
      ${ds>=14?`<span class="stale">Parado há ${ds} dias</span>`:""}
      ${co.length?`<div class="coop">Também jogando: ${co.map(x=>glyph(x.p,true)+esc(x.p.nick)).join(" ")}</div>`:""}
      ${g.comment?`<p class="quote">${esc(g.comment)}</p>`:""}
      ${S.mode==="live"&&g.pid===S.myId&&S.canWrite?`<div class="actions"><button class="btn small" data-act="edit" data-id="${esc(g.gid)}">Atualizar progresso</button><button class="btn small ghost" data-act="played" data-id="${esc(g.gid)}">Joguei hoje</button></div>`:""}
    </div></article>`}).join("")}</div>`;
}
function viewDicas(){
  const L=filtered().filter(hasTips);
  if(!L.length)return emptyBox("?!","Nenhuma dica ainda","Ao editar um jogo, preencha “Dicas e anotações”: segredos, lugares bons de farmar, ordem de chefes e prints. Fica tudo aqui para quem for jogar depois.");
  return `<div class="tiplist">${L.map(g=>`<article class="box tipcard">${coverBox(g)}<div class="info"><h3 class="gtitle"><a href="#jogo-${esc(slug(g.title))}">${esc(g.title)}</a></h3>
    <div class="who">${glyph(g.p,true)}<span>${nk(g.p)}</span>${g.platform?`<span class="tag">${esc(g.platform)}</span>`:""}${g.spoiler?`<span class="tag">spoiler</span>`:""}</div>
    ${g.tips&&!g.spoiler?`<div class="prev">${esc(g.tips)}</div>`:""}
    <div><button class="btn small" data-act="tips" data-pid="${esc(g.pid)}" data-id="${esc(g.gid)}">Abrir guia${g.shots?.length?` · ${g.shots.length} print${g.shots.length>1?"s":""}`:""}</button></div></div></article>`).join("")}</div>`;
}

/* ---------- RANKING ---------- */
function viewRanking(){
  const P=players(),ids=Object.keys(P);const st=Object.fromEntries(ids.map(i=>[i,stats(P[i])]));const xp=Object.fromEntries(ids.map(i=>[i,xpOf(i)]));
  const bars=(get,label,sub)=>{const sorted=[...ids].sort((a,b)=>get(b)-get(a));const max=Math.max(1,...sorted.map(get));
    return `<div class="box panel"><h3>${label}</h3><div class="sub">${sub}</div>${sorted.map(i=>`<div class="hrow"><div class="nm">${glyph(P[i],true)}<span>${nk(P[i])}</span></div><div class="hbar"><i style="--pc:${esc(P[i].color)};width:${get(i)/max*100}%"></i></div><div class="v">${get(i)}</div></div>`).join("")}</div>`};
  const B=[];ids.forEach(i=>badgesOf(i).forEach(b=>B.push({b,who:P[i].nick})));B.sort((x,y)=>(S.rar[x.b.id]?.pct||0)-(S.rar[y.b.id]?.pct||0));
  const by={};allGames().forEach(g=>{if(typeof g.nota!=="number")return;const k=norm(g.title);(by[k]||(by[k]={title:g.title,n:[],gs:[]})).n.push(g.nota);by[k].gs.push(g)});
  const cons=Object.values(by).map(c=>({...c,avg:c.n.reduce((a,b)=>a+b,0)/c.n.length})).sort((a,b)=>(b.gs.length>1)-(a.gs.length>1)||b.avg-a.avg).slice(0,8);
  const tt={};allGames().filter(g=>isDone(g)&&Number(g.hours)>0).forEach(g=>{const k=norm(g.title);(tt[k]||(tt[k]={title:g.title,h:[],gs:[]})).h.push(Number(g.hours));tt[k].gs.push(g)});
  const ttl=Object.values(tt).map(c=>({...c,avg:c.h.reduce((x,y)=>x+y,0)/c.h.length})).sort((x,y)=>y.gs.length-x.gs.length||y.avg-x.avg).slice(0,8);
  const row=c=>`<div class="crow">${coverBox(c.gs.find(x=>x.coverV)||c.gs[0],"mini")}<span class="ct"><a href="#jogo-${esc(slug(c.title))}" style="color:inherit">${esc(c.title)}</a></span><span class="dots">${c.gs.map(g=>glyph(g.p,true)).join("")}</span>`;
  return `<div class="rank"><div style="display:flex;flex-direction:column;gap:18px;min-width:0">
      ${bars(i=>xp[i],"Nível e XP","XP por zerar, platinar, escrever dicas, comentar, receber GG e cumprir desafios")}
      ${bars(i=>st[i].year,`Zerados em ${YEAR}`,"Quem mais fechou jogo este ano")}
      ${bars(i=>st[i].done,"Zerados de todos os tempos","Zerados + platinados na vida toda")}
      ${bars(i=>st[i].hours,"Horas registradas","Soma das horas informadas em cada jogo")}
    </div><div style="display:flex;flex-direction:column;gap:18px;min-width:0">
      <div class="box panel"><h3>Atividade recente</h3><div class="sub">O que a galera mexeu por último</div><div class="feed">${feedItems().slice(0,10).map(f=>`<div class="fitem">${f.p?glyph(f.p,true):""}<div class="tx"><b>${nk(f.p)}</b> ${f.html}</div><span class="when">${ago(f.at)}</span></div>`).join("")||'<span class="empty-row">Nada ainda.</span>'}</div></div>
      <div class="box panel"><h3>Conquistas</h3><div class="sub">As mais raras primeiro</div><div class="badges">${B.map(x=>badgeHTML(x.b,x.who)).join("")||'<span class="empty-row">Ninguém desbloqueou nada ainda.</span>'}</div></div>
      <div class="box panel"><h3>Tempo pra zerar</h3><div class="sub">Média das horas de quem zerou</div><div class="cons">${ttl.map(c=>row(c)+`<span class="nota" style="font-size:18px">${Math.round(c.avg)}<small> h</small></span></div>`).join("")||'<span class="empty-row">Ninguém informou horas ainda.</span>'}</div></div>
      <div class="box panel"><h3>A galera recomenda</h3><div class="sub">Nota média, priorizando jogos que mais de uma pessoa jogou</div><div class="cons">${cons.map(c=>row(c)+`<span class="nota" style="font-size:18px">${fmtNota(c.avg)}</span></div>`).join("")||'<span class="empty-row">Sem notas ainda.</span>'}</div></div>
    </div></div>`;
}

/* ---------- PÁGINA DO JOGO ---------- */
function viewJogo(){
  const sl=S.route;const E=allGames().filter(g=>slug(g.title)===sl);
  const title=E[0]?.title||(cfg().club&&slug(cfg().club.title)===sl?cfg().club.title:"");
  if(!title)return `<div class="page"><a class="btn small back" href="#inicio">← Voltar</a>${emptyBox("?","Jogo não encontrado","Ninguém da galera cadastrou esse jogo ainda.")}</div>`;
  const notas=E.map(g=>g.nota).filter(n=>typeof n==="number");const hrs=E.filter(g=>isDone(g)&&Number(g.hours)>0).map(g=>Number(g.hours));
  const cov=E.find(g=>g.coverV)||E[0]||{title};const m=me();const inMine=m&&Object.values(m.games||{}).find(g=>slug(g.title)===sl);
  const plats=[...new Set(E.map(g=>g.platform).filter(Boolean))];
  const order={jogando:0,platinado:1,zerado:2,pausado:3,quero:4,dropado:5};
  const ents=[...E].sort((a,b)=>(order[a.status]??9)-(order[b.status]??9));
  const th=commentsFor(sl);const mid=meId();
  return `<div class="page"><a class="btn small back" href="#estante">← Estante</a>
    <section class="box ghero">${coverBox(cov)}<div style="display:flex;flex-direction:column;gap:12px;min-width:0">
      <span class="eyebrow">Página do jogo</span><h2>${esc(title)}</h2>
      <div class="stats">
        <div class="stat"><b>${notas.length?fmtNota(notas.reduce((a,b)=>a+b,0)/notas.length):"–"}</b><span>nota média</span></div>
        <div class="stat"><b>${hrs.length?Math.round(hrs.reduce((a,b)=>a+b,0)/hrs.length)+" h":"–"}</b><span>tempo pra zerar</span></div>
        <div class="stat"><b>${E.filter(isDone).length}</b><span>zeraram</span></div>
        <div class="stat"><b>${E.filter(g=>g.status==="jogando").length}</b><span>jogando</span></div>
        <div class="stat"><b>${E.filter(g=>g.status==="quero").length}</b><span>na fila</span></div>
      </div>
      ${plats.length?`<div class="ptags">${plats.map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>`:""}
      ${m&&S.canWrite?(inMine?`<div><button class="btn small" data-act="edit" data-id="${esc(Object.keys(m.games).find(k=>m.games[k]===inMine))}">Editar o meu</button></div>`:`<div class="actions"><button class="btn small primary" data-act="addtitle" data-t="${esc(title)}">Adicionar à minha lista</button><button class="btn small" data-act="quickfila" data-t="${esc(title)}">+ Fila</button></div>`):""}
    </div></section>
    <section class="box card"><span class="eyebrow">Quem jogou</span><h3>A galera nesse jogo</h3><div class="entries">
      ${ents.map(g=>`<div class="entry" style="border:2px solid var(--line);border-radius:12px;background:var(--surface2)">${glyph(g.p)}<div class="body">
        <a class="nm" href="#perfil-${esc(pslug(g.p))}" style="color:inherit;text-decoration:none">${nk(g.p)}</a>
        <div class="meta"><span class="pill s-${esc(g.status)}">${esc(STATUS[g.status]?.l||g.status)}</span>${g.tier?`<span class="pill t-${esc(g.tier)}">Tier ${esc(g.tier)}</span>`:""}${g.platform?`<span class="tag">${esc(g.platform)}</span>`:""}${g.hours?`<span class="tag">${esc(g.hours)} h</span>`:""}${isDone(g)&&RUNS[g.run]?`<span class="tag">${esc(RUNS[g.run])}</span>`:""}</div>
        ${g.fase&&!isDone(g)?`<div class="fase">Parou em: <b>${esc(g.fase)}</b> · ${Number(g.progress)||0}%</div>`:""}
        ${g.comment?`<p class="quote">${esc(g.comment)}</p>`:""}
        ${hasTips(g)?`<button class="tipsbtn" data-act="tips" data-pid="${esc(g.pid)}" data-id="${esc(g.gid)}"><span class="ic">?!</span>${tipsLabel(g)}</button>`:""}
        ${reactRow(g)}<a class="cbtn" href="#${saveHash(g.pid,g.gid)}">Ver o save de ${esc(g.p.nick)} →</a></div><span class="nota">${fmtNota(g.nota)}<small>/10</small></span></div>`).join("")||'<span class="hint">Ninguém cadastrou ainda.</span>'}
    </div></section>
    <section class="box card" id="conversa"><span class="eyebrow">Conversa</span><h3>${th.length?`${th.length} comentário${th.length>1?"s":""}`:"Comece a conversa"}</h3>
      <div class="thread">${th.map(c=>{const p=players()[c.by];if(!p)return "";const can=S.mode==="live"&&(c.by===mid||S.isOwner);return `<div class="cmt">${glyph(p)}<div class="bubble"><div class="meta2"><b>${nk(p)}</b><span>${ago(c.at)}</span>${can?`<button class="linkbtn" data-act="cdel" data-cid="${esc(c.cid)}" data-by="${esc(c.by)}">apagar</button>`:""}</div><p>${esc(c.x)}</p></div></div>`}).join("")}</div>
      ${m&&S.canWrite?`<div class="composer"><label class="flabel" for="cmt-text">Seu comentário</label><textarea id="cmt-text" maxlength="600" placeholder="Pergunte, dê dica, conte onde travou…"></textarea><div><button class="btn small primary" data-act="csend" data-t="${esc(sl)}">Enviar</button></div></div>`:`<span class="hint">${S.mode==="demo"?"No modo exemplo não dá para comentar.":"Crie seu perfil para comentar."}</span>`}
    </section></div>`;
}

/* ---------- PERFIL ---------- */
function heatmap(days){
  const now=new Date();now.setHours(0,0,0,0);const dow=(now.getDay()+6)%7;const start=new Date(now);start.setDate(start.getDate()-dow-7*25);
  let h="";for(let i=0;i<26*7;i++){const d=new Date(start);d.setDate(start.getDate()+i);const k=dkey(d);const n=days?.[k]||0;
    h+=`<i class="${d>now?"fut":n>=4?"l3":n>=2?"l2":n>=1?"l1":""}" title="${esc(fmtDate(k))}: ${n} atualizaç${n===1?"ão":"ões"}"></i>`}
  return `<div class="heatwrap"><div class="heat" role="img" aria-label="Dias ativos nos últimos 6 meses">${h}</div></div>`;
}
function viewPerfil(){
  const pid=pidBySlug(S.route);const P=players();const p=P[pid];
  if(!p)return `<div class="page"><a class="btn small back" href="#inicio">← Voltar</a>${emptyBox("?","Jogador não encontrado","Esse perfil não existe ou mudou de apelido.")}</div>`;
  const s=stats(p),x=xpOf(pid),l=levelOf(x),so=socialOf(pid);const mine=pid===meId();
  const G=Object.entries(p.games||{}).map(([gid,g])=>({...g,gid,pid,p}));
  const playing=G.filter(g=>g.status==="jogando").sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  const done=G.filter(isDone).sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0)||(b.updatedAt||0)-(a.updatedAt||0)).slice(0,8);
  const mini=g=>`<div class="fitem">${coverBox(g,"mini")}<div class="tx"><a href="#jogo-${esc(slug(g.title))}" style="color:inherit"><b>${esc(g.title)}</b></a>${g.platform?` · ${esc(g.platform)}`:""}${g.fase&&!isDone(g)?` · ${esc(g.fase)}`:""}${isDone(g)&&g.year?` · ${esc(g.year)}`:""}</div>${g.updatedAt>1e9?`<span class="when">${ago(g.updatedAt)}</span>`:""}</div>`;
  const B=badgesOf(pid);const rl=rolesOf(pid);const activeYear=Object.keys(p.days||{}).filter(k=>k.startsWith(String(YEAR))).length;
  const myL=meId()?levelOf(xpOf(meId())).L:1;const fids=friendIds(pid);const showcase=(p.showcase||[]).map(gid=>p.games?.[gid]?{...p.games[gid],gid,pid,p}:null).filter(Boolean).slice(0,3);let skin="padrao";try{skin=localStorage.getItem("zg-skin")||"padrao"}catch{}
  return `<div class="page"><a class="btn small back" href="#inicio">← Início</a>
  <section class="box phero"><div class="pbanner" style="--pc:${esc(p.color)}">${p._id?mimg(`players/${p._id}/media/banner`,p.bannerV,"bimg",""):""}</div>
    <div class="phead">${glyph(p)}<div class="nmw"><h2>${nk(p)}</h2>${p.title?`<div class="ptitle">${esc(p.title)}</div>`:""}
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${lvlChip(pid)}<span class="xpinfo">${x} XP</span></div>${roleChips(pid)}</div>
      <div class="pacts">${mine&&S.canWrite?`<button class="btn small" data-act="profile">Editar perfil</button>`:friendBtn(pid)}<button class="btn small primary" data-act="retro" data-id="${esc(pid)}">Retrospectiva ${YEAR}</button>${Object.keys(P).length>1?`<button class="btn small" data-act="compare" data-id="${esc(pid)}">Comparar</button>`:""}</div></div>
    ${p.mood||p.bio?`<div style="padding:0 18px 12px;display:flex;flex-direction:column;gap:6px">${p.mood?`<div class="mood">${esc(p.mood)}</div>`:""}${p.bio?`<p style="margin:0;max-width:65ch;white-space:pre-wrap">${esc(p.bio)}</p>`:""}</div>`:""}
    <div style="padding:0 18px 18px"><div class="xpbar"><i style="width:${l.pct}%"></i></div><div class="xpinfo" style="margin-top:4px">Nível ${l.L} · faltam ${l.next-x} XP para o ${l.L+1}</div></div></section>
  ${showcase.length?`<section class="box card"><span class="eyebrow">Vitrine</span><h3>Favoritos de ${nk(p)}</h3><div class="showcase">${showcase.map(g=>`<a href="#jogo-${esc(slug(g.title))}" class="sc">${coverBox(g)}<b>${esc(g.title)}</b>${typeof g.nota==="number"?`<span class="tag">nota ${fmtNota(g.nota)}</span>`:""}</a>`).join("")}</div></section>`:""}
  <div class="pgrid"><div class="col">
    <div class="tiles">
      <div class="tile"><b>${s.done}</b><span>zerados na vida</span></div>
      <div class="tile"><b>${s.year}${p.goal?`<small style="font-size:13px">/${esc(p.goal)}</small>`:""}</b><span>em ${YEAR}${p.goal?" (meta)":""}</span></div>
      <div class="tile"><b>${s.playing}</b><span>jogando agora</span></div>
      <div class="tile"><b>${s.hours}</b><span>horas registradas</span></div>
      <div class="tile"><b>${fmtNota(s.avg)}</b><span>nota média</span></div>
      <div class="tile"><b>${so.ggIn}</b><span>reações recebidas</span></div>
    </div>
    <section class="box card"><span class="eyebrow">Atividade</span><h3>${activeYear} dia${activeYear===1?"":"s"} ativo${activeYear===1?"":"s"} em ${YEAR}</h3>${heatmap(p.days)}<span class="hint">Cada quadradinho é um dia em que ${mine?"você":esc(p.nick)} atualizou algo.</span></section>
    ${G.some(g=>g.tier)?`<section class="box card"><span class="eyebrow">Tier list</span><h3>Tier list de ${nk(p)}</h3><div class="tierlist compact">${tierRows(G.filter(g=>g.tier),"")}</div></section>`:""}
    ${playing.length?`<section class="box card"><span class="eyebrow">Jogando agora</span><h3>${playing.length} jogo${playing.length>1?"s":""}</h3><div class="minis">${playing.map(mini).join("")}</div></section>`:""}
    ${done.length?`<section class="box card"><span class="eyebrow">Últimos zerados</span><div class="minis">${done.map(mini).join("")}</div></section>`:""}
    <div><button class="btn small" data-act="filterplayer" data-id="${esc(pid)}">Ver todos os jogos de ${esc(p.nick)} na estante</button></div>
  </div><div class="col">
    <section class="box card"><span class="eyebrow">Amigos</span><h3>${fids.length} amigo${fids.length===1?"":"s"}</h3>${fids.length?`<div class="galera">${fids.map(galeraRow).join("")}</div>`:'<span class="hint">Nenhum amigo ainda.</span>'}${mine&&S.canWrite?`<div><button class="btn small" data-act="find">Procurar e adicionar amigos</button></div>`:""}</section>
    ${B.length?`<section class="box card"><span class="eyebrow">Conquistas</span><h3>${B.length} desbloqueada${B.length>1?"s":""}</h3><div class="badges">${B.map(b=>badgeHTML(b)).join("")}</div></section>`:""}
    ${platsOf(p).length||p.fav||p.discord?`<section class="box card"><span class="eyebrow">Setup</span>${platsOf(p).length?`<div class="ptags">${platsOf(p).map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>`:""}${p.fav?`<div>Favorito da vida: <b>${esc(p.fav)}</b></div>`:""}
      ${p.discord?`<div class="copyline"><span class="hint">Discord</span><code id="dcode">${esc(p.discord)}</code><button class="btn small" data-act="copy" data-text="${esc(p.discord)}">Copiar</button></div>`:""}</section>`:""}
    ${p.coop&&daysSince(p.coop.at)<15?`<section class="box card"><span class="eyebrow">Procurando coop</span><div><b>${esc(p.coop.title)}</b>${p.coop.note?` · ${esc(p.coop.note)}`:""}</div></section>`:""}
    ${S.mode==="live"&&S.isOwner?`<section class="box card"><span class="eyebrow">Cargos</span><div class="sub" style="margin-top:0">Só você, dono, pode mudar.</div><div class="pick">${Object.entries(ROLES).map(([k,o])=>`<button type="button" data-act="role" data-pid="${esc(pid)}" data-k="${k}" aria-pressed="${rl.includes(k)}" style="${rl.includes(k)?`background:${o.c};color:var(--on-pill)`:""}" title="${esc(o.d)}">${esc(o.l)}</button>`).join("")}</div></section>`:""}
    ${mine?`<section class="box card"><span class="eyebrow">Tema do site</span><div class="sub" style="margin-top:0">Desbloqueie cores novas subindo de nível. Vale só para você.</div><div class="skins">${Object.entries(SKINS).map(([k,o])=>`<button type="button" class="skin" data-act="skin" data-k="${k}" style="--sw:${o.sw}" aria-pressed="${skin===k}" ${myL<o.lv?"disabled":""}><i></i>${esc(o.l)}${myL<o.lv?` · Nv ${o.lv}`:""}</button>`).join("")}</div></section>`:""}
    ${!mine&&meId()&&S.canWrite&&S.mode==="live"?`<div class="actions"><button class="btn small ghost" data-act="block" data-id="${esc(pid)}">${blockedBy(meId()).has(pid)?"Desbloquear":"Bloquear"}</button><button class="btn small ghost" data-act="report" data-id="${esc(pid)}">Denunciar</button></div>`:""}
  </div></div></div>`;
}
function applySkin(){let k="padrao";try{k=localStorage.getItem("zg-skin")||"padrao"}catch{}const lv=meId()?levelOf(xpOf(meId())).L:1;if(!SKINS[k]||SKINS[k].lv>lv)k="padrao";if(k==="padrao")document.documentElement.removeAttribute("data-skin");else document.documentElement.setAttribute("data-skin",k)}

/* ---------- nome estilizado (estilo Nitro, de graça) ---------- */
const NAMECOLORS=["#FF4D6D","#FF9F1C","#E9B400","#2EC27E","#16A3C7","#3D5AFE","#9B5DE5","#F15BB5","#00C9A7","#FF6B35","#8AC926","#C0C0C0"];
const NAMEFONTS={padrao:"Padrão",arcade:"Arcade",mono:"Terminal",classica:"Clássica"};
const NAMEMODES={nenhum:"Normal",cor:"Cor sólida",gradiente:"Gradiente",brilho:"Brilho neon"};
function nkStyle(p){const n=p?.nameStyle||{};const c1=NAMECOLORS.includes(n.c1)?n.c1:"",c2=NAMECOLORS.includes(n.c2)?n.c2:c1;const mode=NAMEMODES[n.mode]?n.mode:"nenhum";const font=NAMEFONTS[n.font]?n.font:"padrao";
  return {cls:`nk m-${mode} f-${font}${n.bold?" b":""}`,st:c1?`--n1:${c1};--n2:${c2}`:""}}
const nk = p => {if(!p)return "";const s=nkStyle(p);return `<span class="${s.cls}" style="${s.st}">${esc(p.nick)}</span>`};

/* ---------- amizades ---------- */
const friendsOf = p => (p&&p.friends&&typeof p.friends==="object"&&!Array.isArray(p.friends))?p.friends:{};
function friendState(a,b){const P=players();const A=P[a],B=P[b];if(!A||!B)return "nada";const ab=!!friendsOf(A)[b],ba=!!friendsOf(B)[a];return ab&&ba?"amigos":ab?"enviado":ba?"recebido":"nada"}
const friendIds = pid => Object.keys(players()).filter(o=>o!==pid&&friendState(pid,o)==="amigos");
const blockedBy = (pid) => new Set(Array.isArray(players()[pid]?.blocked)?players()[pid].blocked:[]);
function friendBtn(pid){
  const mid=meId();if(!mid||pid===mid||!S.canWrite)return "";const st=friendState(mid,pid);
  if(st==="amigos")return `<button class="btn small" data-act="friend" data-id="${esc(pid)}" title="Desfazer amizade">Amigos ✓</button>`;
  if(st==="enviado")return `<button class="btn small ghost" data-act="friend" data-id="${esc(pid)}">Pedido enviado (cancelar)</button>`;
  if(st==="recebido")return `<button class="btn small primary" data-act="friend" data-id="${esc(pid)}">Aceitar amizade</button>`;
  return `<button class="btn small primary" data-act="friend" data-id="${esc(pid)}">+ Adicionar amigo</button>`;
}

/* ---------- chat ---------- */
const DEMO_CHAT={rooms:{geral:{name:"geral",members:null}},msgs:[{by:"d1",r:"geral",x:"Alguém on hoje à noite?",at:T(11)},{by:"d2",r:"geral",x:"Eu! Vou tentar o Templo do Fogo",at:T(12)},{by:"d3",r:"geral",x:"Tô no Hades, depois entro",at:T(13)}]};
function chatData(){
  if(S.mode==="demo")return DEMO_CHAT;
  const rooms={geral:{name:"geral",members:null,by:null}};const msgs=[];const left={};
  for(const [uid,d] of Object.entries(S.chat||{})){
    for(const [rid,r] of Object.entries(d.rooms||{}))if(rid.startsWith("g-")&&r&&typeof r.name==="string")rooms[rid]={name:r.name.slice(0,40),members:Array.isArray(r.members)?r.members:[],by:uid,at:r.at||0};
    for(const [mid,m] of Object.entries(d.msgs||{}))if(m&&typeof m.x==="string")msgs.push({mid,by:uid,r:m.r,x:m.x.slice(0,800),at:Number(m.at)||0});
    left[uid]=d.left||{};
  }
  return {rooms,msgs,left};
}
function myRooms(){const d=chatData(),mid=meId();return Object.entries(d.rooms).filter(([rid,r])=>rid==="geral"||(mid&&(r.by===mid||(r.members||[]).includes(mid))&&!(d.left?.[mid]?.[rid])))}
function chatSeen(rid){try{return Number(localStorage.getItem("zg-seen-"+rid))||0}catch{return 0}}
function setChatSeen(rid){try{localStorage.setItem("zg-seen-"+rid,String(Date.now()))}catch{}}
function chatUnread(){const d=chatData(),mid=meId();const mine=new Set(myRooms().map(([r])=>r));return d.msgs.filter(m=>mine.has(m.r)&&m.by!==mid&&m.at>chatSeen(m.r)).length}
function viewChat(){
  const d=chatData();const rooms=myRooms();if(!S.room||!rooms.some(([r])=>r===S.room))S.room="geral";
  const room=d.rooms[S.room];const bl=meId()?blockedBy(meId()):new Set();
  const msgs=d.msgs.filter(m=>m.r===S.room&&!bl.has(m.by)).sort((a,b)=>a.at-b.at).slice(-150);
  setChatSeen(S.room);
  const mid=meId();
  const list=rooms.map(([rid,r])=>{const un=d.msgs.filter(m=>m.r===rid&&m.by!==mid&&m.at>chatSeen(rid)).length;return `<button class="room${rid===S.room?" on":""}" data-act="room" data-id="${esc(rid)}"><span>${rid==="geral"?"# geral":"◆ "+esc(r.name)}</span>${un&&rid!==S.room?`<b>${un}</b>`:""}</button>`}).join("");
  const membersLine=S.room==="geral"?"Canal aberto para toda a galera":`${(room.members||[]).length+1} no grupo: ${[room.by,...(room.members||[])].map(id=>players()[id]?.nick).filter(Boolean).map(esc).join(", ")}`;
  return `<div class="chatwrap box"><aside class="rooms"><div class="eyebrow" style="padding:4px 6px">Conversas</div>${list}
      ${mid&&S.canWrite?`<button class="btn small" data-act="newgroup" style="margin-top:8px">+ Criar grupo</button>`:""}</aside>
    <section class="chatmain"><header class="chathead"><div><b>${S.room==="geral"?"# geral":esc(room.name)}</b><div class="hint">${membersLine}</div></div>
      ${S.room!=="geral"&&mid&&room.by!==mid?`<button class="btn small ghost" data-act="leavegroup" data-id="${esc(S.room)}">Sair do grupo</button>`:""}
      ${S.room!=="geral"&&mid&&room.by===mid?`<button class="btn small ghost" data-act="editgroup" data-id="${esc(S.room)}">Editar grupo</button>`:""}</header>
      <div class="chatlog" id="chatlog">${msgs.map((m,i)=>{const p=players()[m.by];if(!p)return "";const prev=msgs[i-1];const cont=prev&&prev.by===m.by&&m.at-prev.at<300000;
        const can=S.mode==="live"&&(m.by===mid||S.isOwner);
        return `<div class="msg${cont?" cont":""}">${cont?'<span class="gsp"></span>':glyph(p)}<div class="mb">${cont?"":`<div class="meta2">${nk(p)}<span>${ago(m.at)}</span></div>`}<p>${esc(m.x)}${can?` <button class="linkbtn" data-act="mdel" data-id="${esc(m.mid)}" data-by="${esc(m.by)}" aria-label="Apagar mensagem">apagar</button>`:""}</p></div></div>`}).join("")||'<div class="hint" style="padding:20px">Nenhuma mensagem ainda. Mande a primeira.</div>'}</div>
      ${mid&&S.canWrite?`<form class="chatform" id="chatform"><label class="flabel" for="chat-text" hidden>Mensagem</label><textarea id="chat-text" maxlength="800" rows="1" placeholder="Mensagem para ${S.room==="geral"?"#geral":esc(room.name)}"></textarea><button class="btn primary" type="submit">Enviar</button></form>
        <div class="hint" style="padding:0 12px 10px">O chat só aparece para quem está logado. Grupos organizam a conversa, mas qualquer membro logado consegue ler.</div>`:`<div class="hint" style="padding:12px">${S.mode==="demo"?"No modo exemplo não dá para mandar mensagem.":"Crie seu perfil para conversar."}</div>`}
    </section></div>`;
}

/* ---------- modais ---------- */
let M=null;
function closeModal(){M=null;$("#modal").innerHTML=""}
const overlay=(inner,id="",tag="div")=>`<div class="overlay" data-act="bg"><${tag} class="box modal" ${id?`id="${id}"`:""} role="dialog" aria-modal="true">${inner}</${tag}></div>`;
function pickRow(name,opts,val,cls=""){return `<div class="pick" data-pick="${name}">${opts.map(o=>`<button type="button" class="${cls} ${o.cls||""}" style="${o.style||""}" data-v="${esc(o.v)}" aria-pressed="${Array.isArray(val)?val.includes(o.v):String(o.v)===String(val)}" aria-label="${esc(o.a||o.l)}">${o.l}</button>`).join("")}</div>`}
const MULTI=new Set(["plats","show","members"]);

function openTips(pid,gid){
  const p=players()[pid];const g=p?.games?.[gid];if(!g)return;M={type:"tips"};const sh=g.shots||[];
  $("#modal").innerHTML=overlay(`<div style="display:flex;gap:12px;align-items:center">${glyph(p)}<div style="min-width:0"><h2>${esc(g.title)}</h2><div class="hint">Guia de ${nk(p)}${g.platform?" · "+esc(g.platform):""}${g.hours?" · "+esc(g.hours)+" h":""}</div></div></div>
    <div class="${g.spoiler?"spoiler hidden-sp":""}" ${g.spoiler?'data-act="reveal" role="button" tabindex="0" aria-label="Revelar spoiler"':""}><div style="display:flex;flex-direction:column;gap:14px">
      ${g.tips?`<p class="tiptext">${esc(g.tips)}</p>`:""}
      ${sh.length?`<div class="shotgrid">${sh.map(x=>{const path=`players/${pid}/shots/${x.id}`;return `<figure class="shot" style="margin:0"><div class="ph">${mimg(path,1,"","Print")}<button class="zoom" data-act="zoom" data-k="${esc(mkey(path,1))}" data-cap="${esc(x.cap||"")}" aria-label="Ampliar print"></button></div>${x.cap?`<figcaption class="cap">${esc(x.cap)}</figcaption>`:""}</figure>`}).join("")}</div>`:""}
    </div></div><div class="mfoot"><a class="btn small" href="#jogo-${esc(slug(g.title))}">Página do jogo</a><div class="r"><button type="button" class="btn" data-act="close">Fechar</button></div></div>`);
}

function openProfile(){
  const m=me();const n=m?.nameStyle||{};
  M={type:"profile",avatar:undefined,banner:undefined,plats:platsOf(m||{}).slice(),color:m?.color||COLORS[Object.keys(S.players).length%COLORS.length],glyph:m?.glyph||GLYPHS[Object.keys(S.players).length%GLYPHS.length],
    ns:{mode:NAMEMODES[n.mode]?n.mode:"nenhum",c1:n.c1||NAMECOLORS[0],c2:n.c2||NAMECOLORS[6],font:NAMEFONTS[n.font]?n.font:"padrao",bold:!!n.bold},show:(m?.showcase||[]).slice()};
  const myG=Object.entries(m?.games||{});
  $("#modal").innerHTML=overlay(`<h2>${m?"Editar perfil":"Entrar na galera"}</h2>
    <div class="fgrid">
      <div class="field full"><span class="flabel">Foto de perfil</span><div class="avrow"><span id="avprev">${glyph(m||{color:M.color,glyph:M.glyph})}</span>
        <div class="cvbtns"><label class="btn small" for="p-avatar">Escolher foto</label><input id="p-avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
        <button type="button" class="btn small ghost" data-act="rmavatar" id="rmavatar" ${m?.avatarV?"":"hidden"}>Usar símbolo</button></div></div></div>
      <div class="field full"><span class="flabel">Banner (capa do perfil)</span><div class="bnprev" id="bnprev" style="--pc:${esc(M.color)}">${m?._id?mimg(`players/${m._id}/media/banner`,m.bannerV,"bimg",""):""}</div>
        <div class="actions"><label class="btn small" for="p-banner">Escolher banner</label><input id="p-banner" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden><button type="button" class="btn small ghost" data-act="rmbanner" id="rmbanner" ${m?.bannerV?"":"hidden"}>Tirar banner</button><span class="hint">Formato largo (3:1). Print do seu jogo favorito fica ótimo.</span></div></div>
      <div class="field full"><label for="p-nick">Apelido</label><input id="p-nick" maxlength="30" required value="${esc(m?.nick||"")}" placeholder="Ex.: Soarezx"></div>
      <div class="field full"><span class="flabel">Estilo do nome</span>
        <div class="nkprev" id="nkprev"></div>
        ${pickRow("nsmode",Object.entries(NAMEMODES).map(([v,l])=>({v,l})),M.ns.mode)}
        <div class="flabel" style="margin-top:6px">Cor ${"principal"}</div>${pickRow("nsc1",NAMECOLORS.map(c=>({v:c,l:"",a:"cor "+c,style:`background:${c}`})),M.ns.c1,"swatch")}
        <div class="flabel" id="c2lbl">Segunda cor (gradiente)</div><div id="c2row">${pickRow("nsc2",NAMECOLORS.map(c=>({v:c,l:"",a:"cor "+c,style:`background:${c}`})),M.ns.c2,"swatch")}</div>
        <div class="flabel">Fonte</div>${pickRow("nsfont",Object.entries(NAMEFONTS).map(([v,l])=>({v,l})),M.ns.font)}
        <label class="chk"><input type="checkbox" id="p-bold" ${M.ns.bold?"checked":""}> Negrito</label></div>
      <div class="field"><label for="p-title">Título</label><input id="p-title" maxlength="30" value="${esc(m?.title||"")}" placeholder="Ex.: Mago Supremo"></div>
      <div class="field"><label for="p-mood">Status</label><input id="p-mood" maxlength="60" value="${esc(m?.mood||"")}" placeholder="Ex.: tentando passar do chefe final"></div>
      <div class="field full"><label for="p-bio">Sobre mim</label><textarea id="p-bio" maxlength="300" placeholder="Que tipo de jogo você curte, horários que costuma jogar…">${esc(m?.bio||"")}</textarea></div>
      ${myG.length?`<div class="field full"><span class="flabel">Vitrine: até 3 jogos favoritos no perfil</span>${pickRow("show",myG.map(([gid,g])=>({v:gid,l:esc(g.title)})),M.show)}</div>`:""}
      <div class="field"><label for="p-discord">Usuário do Discord</label><input id="p-discord" maxlength="40" value="${esc(m?.discord||"")}" placeholder="Ex.: soarezx"></div>
      <div class="field"><label for="p-goal">Meta de zerados em ${YEAR}</label><input id="p-goal" type="number" min="0" max="365" value="${m?.goal||""}" placeholder="Ex.: 12"></div>
      <div class="field full"><span class="flabel">Plataformas que você joga</span>${pickRow("plats",PLATFORMS.map(x=>({v:x,l:esc(x)})),M.plats)}</div>
      <div class="field"><label for="p-fav">Jogo favorito da vida</label><input id="p-fav" maxlength="60" value="${esc(m?.fav||"")}" placeholder="Ex.: The Witcher 3"></div>
      <div class="field"><span class="flabel">Símbolo</span>${pickRow("glyph",GLYPHS.map(g=>({v:g,l:g})),M.glyph)}</div>
      <div class="field full"><span class="flabel">Sua cor</span>${pickRow("color",COLORS.map(c=>({v:c,l:"",a:"cor "+c,style:`background:${c}`})),M.color,"swatch")}</div>
      <div class="field full"><span class="flabel">Sua conta</span>
        <div class="copyline"><span class="hint">Seu ID</span><code id="dcode">${esc(S.myId||"")}</code><button type="button" class="btn small ghost" data-act="copy" data-text="${esc(S.myId||"")}">Copiar</button></div>
        <div class="actions"><label class="btn small" for="p-import">Importar backup</label><input id="p-import" type="file" accept="application/json,.json" hidden>${m?`<button type="button" class="btn small" data-act="export">Baixar meus dados</button><button type="button" class="btn small danger" data-act="delaccount">Excluir minha conta</button>`:""}</div>
        <span class="hint">O backup traz apelido, jogos, notas, fases e dicas. Fotos, banners e prints precisam ser enviados de novo.</span></div>
    </div><div class="err" id="perr"></div>
    <div class="mfoot"><div class="r"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button class="btn primary" type="submit">Salvar perfil</button></div></div>`,"pform","form");
  syncNamePreview();
}
function syncNamePreview(){
  if(M?.type!=="profile")return;M.ns.bold=$("#p-bold")?.checked||false;
  const fake={nick:$("#p-nick")?.value||"Seu nome",nameStyle:M.ns};$("#nkprev").innerHTML=nk(fake);
  const g=M.ns.mode==="gradiente";$("#c2lbl").hidden=!g;$("#c2row").hidden=!g;
}

function openGame(gid,pre){
  const m=me();const g=gid?m.games[gid]:null;
  M={type:"game",gid,status:g?.status||pre?.status||"zerado",tier:g?.tier||"",rec:!!g?.rec,run:g?.run||"historia",cover:undefined,coverUrl:g?.coverUrl||pre?.coverUrl||"",hasUpload:!!g?.coverV,confirmDel:false};
  const myPl=platsOf(m);const plOpts=[...myPl,...PLATFORMS.filter(x=>!myPl.includes(x))];
  const curCover=g?.coverV?mimg(`players/${S.myId}/covers/${gid}`,g.coverV,"",""):(extImg(M.coverUrl)?`<img src="${esc(M.coverUrl)}" alt="" referrerpolicy="no-referrer">`:"");
  $("#modal").innerHTML=overlay(`<h2>${g?"Editar jogo":"Adicionar jogo"}</h2>
    <div class="fgrid">
      <div class="field full"><label for="g-title">Nome do jogo</label><input id="g-title" maxlength="80" required autocomplete="off" value="${esc(g?.title||pre?.title||"")}" placeholder="Comece a digitar, ex.: Hollow"><div class="sugg" id="sugg" role="listbox" aria-label="Sugestões de jogos"></div></div>
      <div class="field full"><span class="flabel">Capa</span><div class="cvrow"><div class="cvprev" id="cvprev">${curCover||`<span class="ini">${esc(initials(g?.title||pre?.title||"?"))}</span>`}</div>
        <div class="cvbtns"><label class="btn small" for="g-cover">${g?.coverV?"Trocar capa":"Enviar capa"}</label><input id="g-cover" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
        <button type="button" class="btn small ghost" data-act="rmcover" ${curCover?"":"hidden"} id="rmcover">Remover capa</button><span class="hint">Ao escolher o jogo na lista, a capa vem da Wikipédia. Também dá para enviar a sua.</span></div></div></div>
      <div class="field full"><span class="flabel">Status</span>${pickRow("status",Object.entries(STATUS).map(([v,o])=>({v,l:o.l,cls:"s-"+v,style:"color:var(--on-pill)"})),M.status)}</div>
      <div class="field"><label for="g-plat">Plataforma em que jogou</label><span class="hint" id="platHint"></span><select id="g-plat">${plOpts.map(p=>`<option${p===(g?.platform||myPl[0]||"PC")?" selected":""}>${esc(p)}</option>`).join("")}</select></div>
      <div class="field" id="yearField"><label for="g-year">Ano em que zerou</label><input id="g-year" type="number" min="1980" max="${YEAR}" placeholder="vazio = não lembro" value="${g?(g.year??""):YEAR}"></div>
      <div class="field" id="lancField"><label for="g-lanc">Data de lançamento (se ainda não saiu)</label><input id="g-lanc" type="date" value="${esc(g?.lanc||"")}"></div>
      <div class="field full" id="runField"><span class="flabel">Como zerou</span>${pickRow("run",Object.entries(RUNS).map(([v,l])=>({v,l})),M.run)}</div>
      <div class="field full"><label for="g-fase">Onde parou / fase atual</label><input id="g-fase" maxlength="80" value="${esc(g?.fase||"")}" placeholder="Ex.: Capítulo 7, chefe do castelo"></div>
      <div class="field"><label for="g-prog">Progresso (%)</label><input id="g-prog" type="number" min="0" max="100" value="${g?.progress??""}"></div>
      <div class="field"><label for="g-hours" id="hoursLbl">Horas até zerar</label><input id="g-hours" type="number" min="0" max="9999" value="${g?.hours||""}"></div>
      <div class="field"><label for="g-nota">Nota (0 a 10)</label><input id="g-nota" type="number" min="0" max="10" step="0.5" value="${g?.nota??""}"></div>
      <div class="field"><span class="flabel">Tier</span>${pickRow("tier",[...TIERS.map(t=>({v:t,l:t,cls:"tb t-"+t})),{v:"",l:"–",cls:"tb t-N",a:"sem tier"}],M.tier)}</div>
      <div class="field full"><label for="g-com">O que achou</label><textarea id="g-com" maxlength="400" placeholder="Review curta, sem spoiler pesado">${esc(g?.comment||"")}</textarea></div>
      <div class="field full">${pickRow("rec",[{v:"1",l:"Recomendo pra galera"},{v:"0",l:"Não recomendo"}],M.rec?"1":"0")}</div>
      <div class="field full"><label for="g-tips">Dicas e anotações (para quem for jogar depois)</label><textarea id="g-tips" maxlength="3000" style="min-height:120px" placeholder="Segredos, lugares bons de farmar, ordem de chefes, build que funcionou…">${esc(g?.tips||"")}</textarea>
        <label class="chk"><input type="checkbox" id="g-spoiler" ${g?.spoiler?"checked":""}> Contém spoiler (esconde até a pessoa tocar)</label></div>
      <div class="field full"><span class="flabel">Prints (até 6)</span><div class="shotgrid" id="shotgrid"></div>
        <div><label class="btn small" for="g-shots" id="addShotLbl">+ Adicionar prints</label><input id="g-shots" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden></div></div>
    </div><div class="err" id="gerr"></div>
    <div class="mfoot">${g?`<button type="button" class="btn danger small" data-act="del">Excluir</button>`:""}<div class="r"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button class="btn primary" type="submit">Salvar</button></div></div>`,"gform","form");
  M.shots=(g?.shots||[]).map(x=>({id:x.id,cap:x.cap||"",old:true}));M.removed=[];renderShotEditor();syncYear();
  if(!g&&!pre)$("#g-title").focus();
}
function renderShotEditor(){
  const G=$("#shotgrid");if(!G)return;
  G.innerHTML=M.shots.map((x,i)=>{const path=`players/${S.myId}/shots/${x.id}`;return `<div class="shot"><div class="ph">${x.img?`<img src="${x.img}" alt="">`:mimg(path,1,"","")}<button type="button" class="x" data-act="rmshot" data-i="${i}" aria-label="Remover print">×</button></div>
    <input id="shotcap-${i}" maxlength="120" placeholder="Legenda" value="${esc(x.cap)}" data-cap="${i}"></div>`}).join("");
  const l=$("#addShotLbl");if(l)l.hidden=M.shots.length>=6;
}
function syncYear(){const d=M.status==="zerado"||M.status==="platinado";const show=(id,v)=>{const e=$(id);if(e)e.hidden=!v};show("#yearField",d);show("#runField",d);show("#lancField",M.status==="quero");const h=$("#hoursLbl");if(h)h.textContent=d?"Horas até zerar":"Horas jogadas até agora"}

/* sugestões de nome */
const suggMemo={};let suggT=null,suggCtl=null;const PL_OK=new Set(PLATFORMS);
function localSugg(q){const n=norm(q);if(n.length<2)return [];const seen=new Set();return allGames().filter(g=>norm(g.title).includes(n)).filter(g=>{const k=norm(g.title);if(seen.has(k))return false;seen.add(k);return true}).slice(0,4).map(g=>({title:g.title,year:null,platforms:g.platform?[g.platform]:[]}))}
function drawSugg(q,ai,loading){
  const box=$("#sugg");if(!box)return;const loc=localSugg(q);const locK=new Set(loc.map(x=>norm(x.title)));const ext=(ai||[]).filter(x=>!locK.has(norm(x.title)));
  const item=(x,i)=>`<button type="button" role="option" data-act="pickgame" data-i="${i}">${coverBox({title:x.title,coverUrl:x.img},"mini")}<span class="st"><b>${esc(x.title)}</b><span>${[x.year,(x.platforms||[]).join(", ")].filter(Boolean).map(esc).join(" · ")}</span></span></button>`;
  M.sugg=[...loc,...ext];let h="";
  if(loc.length)h+=`<div class="sh">Já na galera</div>`+loc.map((x,i)=>item(x,i)).join("");
  if(ext.length)h+=`<div class="sh">Sugestões</div>`+ext.map((x,i)=>item(x,i+loc.length)).join("");
  if(loading)h+=`<div class="wait">Procurando o nome certinho<span class="blink">_</span></div>`;box.innerHTML=h;
}
function onTitleInput(q){
  clearTimeout(suggT);if(suggCtl){suggCtl.abort();suggCtl=null}q=q.trim();if(q.length<2){$("#sugg").innerHTML="";return}
  const key=norm(q);if(suggMemo[key]){drawSugg(q,suggMemo[key]);return}
  const can=true;drawSugg(q,null,can&&q.length>=3);if(!can||q.length<3)return;
  suggT=setTimeout(async()=>{const ctl=new AbortController();suggCtl=ctl;
    const prompt=`Você é um catálogo de videogames. Alguém está digitando o nome de um jogo num formulário: "${q.slice(0,60)}".
Liste até 6 jogos reais (lançados ou já anunciados) que provavelmente correspondem ao que a pessoa quer, do mais provável ao menos provável. Considere erros de digitação, abreviações, nomes em português e números de sequência.
Para cada um, dê o nome oficial exatamente como aparece nas lojas, o ano de lançamento (ou null se não lançado) e as plataformas, usando somente estes nomes: ${PLATFORMS.filter(x=>x!=="Outro").join(", ")}.
Responda somente com JSON neste formato: [{"title":"...","year":2024,"platforms":["PC","PS5"]}]. Se nada fizer sentido, responda [].`;
    try{const arr=await wikiSearch(q,ctl.signal);
      suggMemo[key]=arr;if(M?.type==="game"&&norm($("#g-title")?.value||"")===key)drawSugg(q,arr);
    }catch(e){if(ctl.signal.aborted)return;if(M?.type==="game")drawSugg(q,[])}
  },450);
}
function pickGame(i){const x=M?.sugg?.[i];if(!x)return;
  if(x.wtitle){wikiPlatforms(x.wtitle).then(pl=>{if(!pl.length||M?.type!=="game")return;const mine=platsOf(me()||{});const best=pl.find(p=>mine.includes(p))||pl[0];const sel=$("#g-plat");if(sel&&[...sel.options].some(o=>o.value===best))sel.value=best;const h=$("#platHint");if(h)h.textContent="Saiu em: "+pl.join(", ")}).catch(()=>{})}
  if(x.upcoming){M.status="quero";document.querySelectorAll('[data-pick="status"] button').forEach(b=>b.setAttribute("aria-pressed",b.dataset.v==="quero"));syncYear()}$("#g-title").value=x.title;$("#sugg").innerHTML="";const mine=platsOf(me()||{});const best=(x.platforms||[]).find(p=>mine.includes(p))||(x.platforms||[])[0];const sel=$("#g-plat");if(best&&sel&&[...sel.options].some(o=>o.value===best))sel.value=best;const pv=$("#cvprev");if(pv&&typeof M.cover!=="string"&&!M.hasUpload){if(x.img){M.coverUrl=x.img;pv.innerHTML=`<img src="${esc(x.img)}" alt="" referrerpolicy="no-referrer">`;const rb=$("#rmcover");if(rb)rb.hidden=false}else pv.innerHTML=`<span class="ini">${esc(initials(x.title))}</span>`}}

function openSettings(){
  M={type:"settings"};const c=S.config;const ch=c.challenge||{},cl=c.club||{};
  const reps=[];for(const [uid,d] of Object.entries(S.reports||{}))for(const [rid,r] of Object.entries(d.items||{}))reps.push({uid,rid,...r});
  reps.sort((a,b)=>(b.at||0)-(a.at||0));
  $("#modal").innerHTML=overlay(`<h2>Painel do dono</h2>
    <div class="field"><label for="s-discord">Convite do servidor do Discord</label><input id="s-discord" maxlength="120" value="${esc(c.discord||"")}" placeholder="https://discord.gg/seu-convite"><span class="hint">Use um convite que não expira (Convidar pessoas → Editar link → Nunca).</span></div>
    <div class="field"><label for="s-widget">ID do servidor do Discord (para o widget de quem está online)</label><input id="s-widget" maxlength="22" inputmode="numeric" value="${esc(S.config.discordWidget||"")}" placeholder="Ex.: 123456789012345678"><span class="hint">No Discord: Configurações do servidor → Widget → ative "Habilitar widget do servidor" e copie o ID do servidor.</span></div>
    <div class="sec"><h4>Capas</h4><p class="hint" style="margin:0 0 8px">Procura na Wikipédia a capa de todo jogo cadastrado que ainda está sem foto, de todo mundo.</p><button type="button" class="btn" data-act="fillcovers" id="fillcov">Buscar capas que faltam</button></div>
    <div class="sec"><h4>Desafio do mês</h4><div class="fgrid"><div class="field full"><label for="s-ch-t">Título</label><input id="s-ch-t" maxlength="60" value="${esc(ch.title||"")}" placeholder="Ex.: Zerar um jogo de terror"></div>
      <div class="field full"><label for="s-ch-d">Descrição</label><input id="s-ch-d" maxlength="160" value="${esc(ch.desc||"")}"></div>
      <div class="field"><label for="s-ch-u">Termina em</label><input id="s-ch-u" type="date" value="${esc(ch.until||"")}"></div></div><span class="hint">Deixe o título vazio para encerrar. Mudar o título cria um desafio novo.</span></div>
    <div class="sec"><h4>Clube do jogo</h4><div class="fgrid"><div class="field"><label for="s-cl-t">Jogo do clube</label><input id="s-cl-t" maxlength="80" value="${esc(cl.title||"")}" placeholder="Ex.: Hades II"></div>
      <div class="field"><label for="s-cl-u">Até</label><input id="s-cl-u" type="date" value="${esc(cl.until||"")}"></div></div></div>
    <div class="sec"><h4>Denúncias (${reps.length})</h4>${reps.length?reps.slice(0,20).map(r=>`<div class="hint" style="color:var(--ink)"><b>${esc(players()[r.uid]?.nick||"?")}</b> denunciou <b>${esc(players()[r.target]?.nick||r.target||"?")}</b> · ${esc(r.why||"")}${r.x?`: “${esc(r.x)}”`:""} · ${ago(r.at)}</div>`).join(""):'<span class="hint">Nenhuma denúncia.</span>'}</div>
    <div class="err" id="serr"></div>
    <div class="mfoot"><div class="r"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button class="btn primary" type="submit">Salvar</button></div></div>`,"sform","form");
}
function openNotifs(){
  const m=me();if(!m)return;M={type:"notifs"};const seen=m.notifSeen||0;const L=notifsFor(S.myId);
  const req=Object.keys(players()).filter(o=>o!==S.myId&&friendState(S.myId,o)==="recebido");
  $("#modal").innerHTML=overlay(`<h2>Avisos</h2>
    ${req.length?`<div class="sec"><h4>Pedidos de amizade</h4>${req.map(o=>`<div class="notif new">${glyph(players()[o])}<div class="tx">${nk(players()[o])} quer ser seu amigo</div><button class="btn small primary" data-act="friend" data-id="${esc(o)}">Aceitar</button></div>`).join("")}</div>`:""}
    <div class="sec">${L.length?L.map(n=>`<a class="notif${n.at>seen?" new":""}" href="${esc(n.h)}">${n.p?glyph(n.p):'<span class="glyph" style="--pc:var(--accent)">!</span>'}<div class="tx">${n.html}</div><span class="when">${ago(n.at)}</span></a>`).join(""):'<span class="hint">Nada por enquanto.</span>'}</div>
    <div class="mfoot"><div class="r"><button type="button" class="btn" data-act="close">Fechar</button></div></div>`);
  if(L.some(n=>n.at>seen))saveMe(p=>{p.notifSeen=Date.now()},{noDay:true}).catch(()=>{});
}
function openFind(){
  M={type:"find"};
  $("#modal").innerHTML=overlay(`<h2>Procurar jogador</h2><div class="field"><label for="find-q">Nome ou apelido</label><input id="find-q" autocomplete="off" placeholder="Digite um nome"></div><div class="galera" id="findres"></div>
    <div class="mfoot"><div class="r"><button type="button" class="btn" data-act="close">Fechar</button></div></div>`);
  drawFind("");$("#find-q").focus();
}
function drawFind(q){
  const n=norm(q);const ids=Object.keys(players()).filter(id=>id!==meId()&&(!n||norm(players()[id].nick).includes(n)||norm(players()[id].title||"").includes(n)));
  $("#findres").innerHTML=ids.map(id=>{const p=players()[id];return `<div class="gmini">${glyph(p)}<div class="t"><b>${nk(p)}</b><span>${esc(p.title||"")}</span></div><a class="btn small ghost" href="#perfil-${esc(pslug(p))}">Ver</a>${friendBtn(id)}</div>`}).join("")||'<span class="hint">Ninguém encontrado.</span>';
}
function openCompare(pid){
  const P=players();const others=Object.keys(P).filter(i=>i!==pid);const a=meId()&&meId()!==pid?meId():pid;const b=a===pid?others[0]:pid;
  M={type:"compare",a,b};drawCompare();
}
function drawCompare(){
  const P=players(),{a,b}=M;const A=P[a],B=P[b];if(!A||!B)return;
  const sa=stats(A),sb=stats(B);const ga=Object.values(A.games||{}),gb=Object.values(B.games||{});
  const shared=[];ga.forEach(x=>{const y=gb.find(y=>norm(y.title)===norm(x.title));if(y)shared.push({t:x.title,a:x,b:y})});
  const rated=shared.filter(s=>typeof s.a.nota==="number"&&typeof s.b.nota==="number");
  const compat=rated.length?Math.max(1,Math.round(100-rated.reduce((s,r)=>s+Math.abs(r.a.nota-r.b.nota),0)/rated.length*12)):null;
  const sel=(id,cur)=>`<select id="${id}" aria-label="Jogador">${Object.keys(P).map(i=>`<option value="${esc(i)}"${i===cur?" selected":""}>${nk(P[i])}</option>`).join("")}</select>`;
  const row=(l,x,y)=>`<div class="cmprow"><span class="a ${x>y?"win":""}">${x}</span><span class="t">${l}</span><span class="b ${y>x?"win":""}">${y}</span></div>`;
  $("#modal").innerHTML=overlay(`<h2>Comparar</h2>
    <div class="vs"><div class="side">${glyph(A)}${sel("cmp-a",a)}</div><div class="x">VS</div><div class="side">${glyph(B)}${sel("cmp-b",b)}</div></div>
    <div><div class="compat">${compat===null?"?":compat+"%"}</div><div class="hint" style="text-align:center">${compat===null?"Sem jogos em comum com nota para calcular a compatibilidade":`compatibilidade gamer em ${rated.length} jogo${rated.length>1?"s":""} com nota`}</div></div>
    <div class="sec">${row("Nível",levelOf(xpOf(a)).L,levelOf(xpOf(b)).L)}${row("Zerados",sa.done,sb.done)}${row(`Em ${YEAR}`,sa.year,sb.year)}${row("Jogando",sa.playing,sb.playing)}${row("Horas",sa.hours,sb.hours)}${row("Dicas",sa.tips,sb.tips)}</div>
    <div class="sec"><h4>Jogos em comum (${shared.length})</h4>${shared.map(s=>`<div class="cmprow"><span class="a ${(s.a.nota??-1)>(s.b.nota??-1)?"win":""}">${fmtNota(s.a.nota)}</span><span class="t">${esc(s.t)}<small>${esc(STATUS[s.a.status]?.l||"")} · ${esc(STATUS[s.b.status]?.l||"")}</small></span><span class="b ${(s.b.nota??-1)>(s.a.nota??-1)?"win":""}">${fmtNota(s.b.nota)}</span></div>`).join("")||'<span class="hint">Nenhum jogo em comum ainda.</span>'}</div>
    <div class="mfoot"><div class="r"><button type="button" class="btn" data-act="close">Fechar</button></div></div>`);
}
function retroSlides(pid){
  const p=players()[pid];const G=Object.entries(p.games||{}).map(([gid,g])=>({...g,gid,pid}));const done=G.filter(g=>isDone(g)&&Number(g.year)===YEAR);
  const hours=done.reduce((s,g)=>s+(Number(g.hours)||0),0);const yearG=G.filter(g=>(isDone(g)&&Number(g.year)===YEAR)||(g.updatedAt&&new Date(g.updatedAt).getFullYear()===YEAR));
  const pc={};yearG.forEach(g=>{if(g.platform)pc[g.platform]=(pc[g.platform]||0)+1});const topP=Object.entries(pc).sort((a,b)=>b[1]-a[1])[0];
  const best=[...done].filter(g=>typeof g.nota==="number").sort((a,b)=>b.nota-a.nota)[0];const longest=[...done].sort((a,b)=>(Number(b.hours)||0)-(Number(a.hours)||0))[0];
  const days=Object.keys(p.days||{}).filter(k=>k.startsWith(String(YEAR)));const mc={};days.forEach(k=>{const m=k.slice(5,7);mc[m]=(mc[m]||0)+1});const topM=Object.entries(mc).sort((a,b)=>b[1]-a[1])[0];
  const MES=["","janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const so=socialOf(pid);const l=levelOf(xpOf(pid));
  return [
    {bg:"var(--accent)",h:`<span class="k">Zerados da Galera</span><div class="mid">Retrospectiva ${YEAR}</div><p>de ${esc(p.nick)}</p>`},
    {bg:"var(--tC)",h:`<span class="k">Você zerou</span><div class="big">${done.length}</div><p>jogo${done.length===1?"":"s"} em ${YEAR}${p.goal?` · meta era ${esc(p.goal)}`:""}</p>${done.length?`<div class="covers">${done.slice(0,12).map(g=>coverBox(g,"mini")).join("")}</div>`:""}`},
    {bg:"var(--tD)",h:`<span class="k">Tempo de jogo</span><div class="big">${hours}h</div><p>${hours?`nos jogos que você zerou este ano.${longest&&longest.hours?` O mais longo foi ${esc(longest.title)}, com ${esc(longest.hours)} h.`:""}`:"Registre as horas ao zerar para ver esse número crescer."}</p>`},
    {bg:"var(--tB)",h:`<span class="k">Plataforma do ano</span><div class="mid">${topP?esc(topP[0]):"–"}</div><p>${topP?`${topP[1]} jogo${topP[1]>1?"s":""} jogados nela em ${YEAR}`:"Sem dados ainda"}</p>`},
    {bg:"var(--tS)",h:`<span class="k">Sua maior nota</span><div class="mid">${best?esc(best.title):"–"}</div><p>${best?`nota ${fmtNota(best.nota)}${best.comment?` · “${esc(best.comment.slice(0,90))}”`:""}`:"Dê notas aos jogos que zerar"}</p>`},
    {bg:"var(--st-queue)",h:`<span class="k">Dias ativos</span><div class="big">${days.length}</div><p>${topM?`O mês mais ativo foi ${MES[Number(topM[0])]}.`:"Cada atualização conta um dia ativo."}</p>`},
    {bg:"var(--tA)",h:`<span class="k">Na comunidade</span><div class="mid">Nível ${l.L} · ${esc(l.name)}</div><p>${so.ggIn} reações recebidas · ${so.cm} comentários · ${so.chal} desafio${so.chal===1?"":"s"}</p>`}
  ];
}
function openRetro(pid){M={type:"retro",pid,i:0};drawRetro()}
function drawRetro(){
  const sl=retroSlides(M.pid);const i=Math.max(0,Math.min(sl.length-1,M.i));M.i=i;
  $("#modal").innerHTML=`<div class="overlay" data-act="bg" style="align-items:center"><div class="retro" role="dialog" aria-modal="true" aria-label="Retrospectiva"><div class="slide" style="--sbg:${sl[i].bg}">${sl[i].h}</div>
    <div class="rnav"><button class="btn small" data-act="retronav" data-d="-1" ${i===0?"disabled":""}>Anterior</button><div class="dots2">${sl.map((_,j)=>`<i class="${j===i?"on":""}"></i>`).join("")}</div>${i<sl.length-1?`<button class="btn small primary" data-act="retronav" data-d="1">Próximo</button>`:`<button class="btn small" data-act="close">Fechar</button>`}</div></div></div>`;
}
function openCoop(){
  const m=me();if(!m)return;M={type:"coop"};const G=Object.values(m.games||{}).filter(g=>g.status!=="dropado");
  $("#modal").innerHTML=overlay(`<h2>Procurar parceiro</h2>
    <div class="field"><label for="coop-g">Jogo</label><select id="coop-g">${G.map(g=>`<option${m.coop?.title===g.title?" selected":""}>${esc(g.title)}</option>`).join("")}</select></div>
    <div class="field"><label for="coop-n">Recado</label><input id="coop-n" maxlength="120" value="${esc(m.coop?.note||"")}" placeholder="Ex.: sexta à noite, chama no Discord"></div>
    <span class="hint">O pedido fica no Início por 2 semanas.${m.discord?"":" Coloque seu usuário do Discord no perfil para a galera te achar."}</span>
    <div class="mfoot">${m.coop?`<button class="btn small danger" type="button" data-act="coopclear">Tirar pedido</button>`:""}<div class="r"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button class="btn primary" type="button" data-act="coopsave" ${G.length?"":"disabled"}>Publicar</button></div></div>`);
}
function openReport(pid){
  M={type:"report",pid};const p=players()[pid];
  $("#modal").innerHTML=overlay(`<h2>Denunciar ${nk(p)}</h2>
    <div class="field"><span class="flabel">Motivo</span>${pickRow("why",["Ofensa ou assédio","Spam","Conteúdo impróprio","Outro"].map(v=>({v,l:v})),"Ofensa ou assédio")}</div>
    <div class="field"><label for="rep-x">Detalhes (opcional)</label><textarea id="rep-x" maxlength="300"></textarea></div>
    <span class="hint">Só o dono do site vê denúncias.</span>
    <div class="mfoot"><div class="r"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button class="btn primary" type="button" data-act="repsend">Enviar denúncia</button></div></div>`);
  M.why="Ofensa ou assédio";
}
function openGroup(rid){
  const d=chatData();const r=rid?d.rooms[rid]:null;M={type:"group",rid,members:(r?.members||[]).slice()};
  const others=Object.keys(players()).filter(i=>i!==meId());
  $("#modal").innerHTML=overlay(`<h2>${r?"Editar grupo":"Criar grupo"}</h2>
    <div class="field"><label for="grp-n">Nome do grupo</label><input id="grp-n" maxlength="40" value="${esc(r?.name||"")}" placeholder="Ex.: Squad do Silksong"></div>
    <div class="field"><span class="flabel">Quem participa</span>${others.length?pickRow("members",others.map(i=>({v:i,l:esc(players()[i].nick)})),M.members):'<span class="hint">Ainda não tem outras pessoas na galera.</span>'}</div>
    <span class="hint">Grupos organizam a conversa, mas não são secretos: qualquer membro logado consegue ler.</span>
    <div class="err" id="grperr"></div>
    <div class="mfoot"><div class="r"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button class="btn primary" type="button" data-act="grpsave">${r?"Salvar":"Criar"}</button></div></div>`);
}

/* ================== VERSÃO SITE: Firebase + RAWG ================== */
const CFG = window.ZG_CONFIG || {};
let AUTH = null;

/* ---------- login ---------- */
const AUTH_ERR = {
  "auth/invalid-credential":"E-mail ou senha incorretos.","auth/wrong-password":"E-mail ou senha incorretos.","auth/user-not-found":"Não existe conta com esse e-mail.",
  "auth/email-already-in-use":"Já existe uma conta com esse e-mail. Tente entrar.","auth/weak-password":"A senha precisa ter pelo menos 6 caracteres.",
  "auth/invalid-email":"Esse e-mail não parece válido.","auth/too-many-requests":"Muitas tentativas. Espere alguns minutos e tente de novo.",
  "auth/popup-closed-by-user":"A janela do Google foi fechada antes de terminar.","auth/network-request-failed":"Sem conexão. Verifique a internet.",
  "auth/requires-recent-login":"Por segurança, saia e entre de novo antes de fazer isso.","auth/unauthorized-domain":"Este endereço ainda não está autorizado no Firebase (Authentication → Configurações → Domínios autorizados)."
};
const authMsg = e => AUTH_ERR[e?.code] || "Não deu certo agora. Tente de novo.";
function openAuth(mode="entrar"){
  if(!AUTH){toast("O site ainda não está configurado.");return}
  M={type:"auth",mode};
  const t={entrar:"Entrar",criar:"Criar conta",esqueci:"Esqueci minha senha"}[mode];
  $("#modal").innerHTML=overlay(`<h2>${t}</h2>
    ${mode!=="esqueci"?`<button type="button" class="btn" data-act="google" style="justify-content:center">Entrar com Google</button><div class="hint" style="text-align:center">ou com e-mail</div>`:`<p class="hint" style="margin:0">Digite o e-mail da sua conta. Vamos mandar um link para você criar uma senha nova.</p>`}
    <div class="field"><label for="au-email">E-mail</label><input id="au-email" type="email" autocomplete="email" required></div>
    ${mode!=="esqueci"?`<div class="field"><label for="au-pass">Senha</label><input id="au-pass" type="password" autocomplete="${mode==="criar"?"new-password":"current-password"}" minlength="6" required></div>`:""}
    ${mode==="criar"?`<div class="field"><label for="au-pass2">Repita a senha</label><input id="au-pass2" type="password" autocomplete="new-password" minlength="6" required></div>
      <label class="chk"><input type="checkbox" id="au-terms" required> Li e aceito os <button type="button" class="linkbtn" data-act="terms">termos de uso e a política de privacidade</button></label>`:""}
    <div class="err" id="auerr" role="alert"></div>
    <div class="mfoot"><div class="actions">
      ${mode==="entrar"?`<button type="button" class="linkbtn" data-act="authmode" data-m="esqueci">Esqueci minha senha</button><button type="button" class="linkbtn" data-act="authmode" data-m="criar">Criar conta</button>`:`<button type="button" class="linkbtn" data-act="authmode" data-m="entrar">Já tenho conta</button>`}</div>
      <div class="r"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button class="btn primary" type="submit">${mode==="esqueci"?"Enviar link":t}</button></div></div>`,"authform","form");
  $("#au-email").focus();
}
async function submitAuth(){
  const err=$("#auerr");err.textContent="";const email=$("#au-email").value.trim();
  try{
    if(M.mode==="esqueci"){await AUTH.sendPasswordResetEmail(email);err.style.color="var(--tC)";err.textContent="Pronto! Se existir conta com esse e-mail, o link chega em instantes (olhe o spam também).";return}
    const pass=$("#au-pass").value;
    if(M.mode==="criar"){
      if(pass!==$("#au-pass2").value){err.textContent="As senhas não são iguais.";return}
      if(!$("#au-terms").checked){err.textContent="Aceite os termos para continuar.";return}
      const cr=await AUTH.createUserWithEmailAndPassword(email,pass);
      try{await cr.user.sendEmailVerification()}catch{}
      closeModal();toast("Conta criada! Confirme seu e-mail para começar.");
    }else{await AUTH.signInWithEmailAndPassword(email,pass);closeModal();toast("Bem-vindo de volta!")}
  }catch(e){err.textContent=authMsg(e)}
}
async function googleLogin(){
  try{const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});await AUTH.signInWithPopup(p);closeModal();toast("Bem-vindo!")}
  catch(e){if(e?.code==="auth/popup-blocked"){try{await AUTH.signInWithRedirect(new firebase.auth.GoogleAuthProvider())}catch(e2){toast(authMsg(e2))}}else{const el=$("#auerr");if(el)el.textContent=authMsg(e);else toast(authMsg(e))}}
}
function openTerms(){
  const back=M&&M.type==="auth"?M.mode:null;M={type:"terms",back};
  $("#modal").innerHTML=overlay(`<h2>Termos e privacidade</h2><div style="display:flex;flex-direction:column;gap:10px;font-size:14px;max-width:65ch">
    <p style="margin:0"><b>O que é.</b> O Zerados da Galera é uma comunidade entre amigos para registrar jogos, trocar dicas e conversar. Não tem fins comerciais.</p>
    <p style="margin:0"><b>O que guardamos.</b> Seu e-mail (só para login, nunca aparece no site), seu apelido, foto, banner e tudo que você cadastra: jogos, notas, comentários, dicas, prints e mensagens.</p>
    <p style="margin:0"><b>Quem vê.</b> Perfis, jogos, comentários e dicas são públicos para quem abrir o site. O chat só aparece para quem está logado. Denúncias só o dono do site vê.</p>
    <p style="margin:0"><b>Regras.</b> Nada de ofensa, assédio, spam, conteúdo adulto ou ilegal. Conteúdo que quebre as regras pode ser apagado e a conta bloqueada.</p>
    <p style="margin:0"><b>Seus direitos (LGPD).</b> Você pode baixar todos os seus dados e excluir sua conta a qualquer momento em <i>Editar perfil</i>. Ao excluir, apagamos seu perfil, jogos, imagens, comentários e mensagens.</p>
    <p style="margin:0"><b>Onde fica.</b> Os dados ficam no Firebase (Google). O site é hospedado no GitHub Pages. Nomes, capas e plataformas dos jogos vêm da Wikipédia e da Wikidata.</p>
    <p style="margin:0"><b>Contato.</b> Fale com o dono do site pelo Discord da galera.</p></div>
    <div class="mfoot"><div class="r">${back?`<button type="button" class="btn" data-act="authmode" data-m="${back}">Voltar</button>`:`<button type="button" class="btn" data-act="close">Fechar</button>`}</div></div>`);
}

/* ---------- conta: baixar dados, importar backup, excluir ---------- */
function myExport(){
  const p=clone(S.players[S.myId]||{});delete p._id;
  return {formato:"zerados-da-galera/1",exportadoEm:new Date().toISOString(),player:p,comments:clone(S.comDocs?.[S.myId]||{}),chat:clone(S.chat?.[S.myId]||{})};
}
function downloadMyData(){
  const blob=new Blob([JSON.stringify(myExport(),null,2)],{type:"application/json"});const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=`zerados-${slug(me()?.nick||"meus-dados")}-${today()}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}
async function importBackup(file){
  const txt=await file.text();let o;try{o=JSON.parse(txt)}catch{throw new Error("Arquivo inválido")}
  const src=o.player||o.data||o;if(!src||typeof src!=="object"||!src.games)throw new Error("Esse arquivo não tem jogos para importar");
  const keep=["nick","title","color","glyph","plats","plat","goal","fav","discord","nameStyle","mood","bio","games","challenges","days"];
  await saveMe(p=>{for(const k of keep)if(src[k]!==undefined){if(k==="games")p.games={...(p.games||{}),...clone(src.games)};else if(k==="days")p.days={...(src.days||{}),...(p.days||{})};else if(!p[k]||k==="games")p[k]=clone(src[k])}
    for(const g of Object.values(p.games||{})){delete g.coverV;g.shots=(g.shots||[]).filter(()=>false)}});
}
async function deleteAccount(){
  const uid=S.myId,m=S.players[uid];if(!uid)return;
  const del=p=>S.db.doc(p).delete().catch(()=>{});
  const jobs=[];
  for(const [gid,g] of Object.entries(m?.games||{})){if(g.coverV)jobs.push(del(`players/${uid}/covers/${gid}`));for(const s of g.shots||[])jobs.push(del(`players/${uid}/shots/${s.id}`))}
  jobs.push(del(`players/${uid}/media/avatar`),del(`players/${uid}/media/banner`),del(`comments/${uid}`),del(`chat/${uid}`),del(`reports/${uid}`));
  await Promise.all(jobs);await S.db.doc(`players/${uid}`).delete();
  try{await AUTH.currentUser.delete()}catch(e){if(e?.code==="auth/requires-recent-login"){await AUTH.signOut();throw new Error("Seus dados foram apagados. Para apagar o login também, entre de novo e clique em excluir mais uma vez.")}throw e}
}

/* ---------- RAWG: nomes, plataformas e capas automáticas ---------- */
const RAWG_PLAT = p => {const n=String(p||"");
  if(n==="PC")return "PC";if(n==="PlayStation 5")return "PS5";if(n==="PlayStation 4")return "PS4";if(/^Xbox Series/.test(n))return "Xbox Series";if(n==="Xbox One")return "Xbox One";
  if(n==="Nintendo Switch 2")return "Switch 2";if(n==="Nintendo Switch")return "Switch";if(n==="iOS"||n==="Android")return "Mobile";if(n==="Linux"||n==="macOS")return "PC";
  if(/PlayStation|Xbox|NES|SNES|Nintendo 64|GameCube|Wii|Game Boy|Nintendo DS|Nintendo 3DS|Genesis|Sega|Dreamcast|Atari|Neo Geo|PSP|PS Vita/.test(n))return "Retrô / Emulador";return null};
const rawgImg = u => (typeof u==="string"&&u.startsWith("https://media.rawg.io/"))?u.replace("/media/games/","/media/crop/600/400/games/").replace("/media/screenshots/","/media/crop/600/400/screenshots/"):"";
const rawgKey = () => CFG.rawgKey || (typeof S.config?.rawgKey==="string"?S.config.rawgKey:"");
async function rawgSearch(q,signal){
  const r=await fetch(`https://api.rawg.io/api/games?key=${encodeURIComponent(rawgKey())}&search=${encodeURIComponent(q)}&page_size=7`,{signal});
  if(!r.ok)throw new Error("rawg "+r.status);const j=await r.json();
  return (j.results||[]).slice(0,7).map(x=>({title:String(x.name||"").slice(0,80),year:x.released?Number(String(x.released).slice(0,4)):null,
    platforms:[...new Set((x.platforms||[]).map(p=>RAWG_PLAT(p?.platform?.name)).filter(Boolean))].slice(0,6),img:rawgImg(x.background_image)})).filter(x=>x.title);
}

/* ================== v2: Wikipédia, tier lists por pessoa e do mês, Novidades ================== */

/* ---------- Wikipédia + Wikidata: nomes, ano, capa e plataformas ---------- */
const WIKI_PLAT = n => {n=String(n||"");
  if(/^(Microsoft Windows|Windows|macOS|Linux|SteamOS)$/.test(n))return "PC";if(n==="PlayStation 5")return "PS5";if(n==="PlayStation 4")return "PS4";
  if(/^Xbox Series/.test(n))return "Xbox Series";if(n==="Xbox One")return "Xbox One";if(n==="Nintendo Switch 2")return "Switch 2";if(n==="Nintendo Switch")return "Switch";
  if(n==="Steam Deck")return "Steam Deck";if(n==="iOS"||n==="Android"||n==="iPadOS")return "Mobile";
  if(/PlayStation|Xbox|Nintendo|Game Boy|Wii|GameCube|Sega|Mega Drive|Genesis|Dreamcast|Atari|Neo Geo|PSP|Vita|Super NES|NES|Nintendo 64|3DS|DS/.test(n))return "Retrô / Emulador";return null};
const cleanTitle = t => String(t||"").replace(/\s*\((\d{4} )?(video )?game\)$/i,"").replace(/\s*\(\d{4}\)$/,"").trim();
async function wikiSearch(q,signal){
  const u="https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(q+' hastemplate:"Infobox video game"')+"&gsrlimit=7&prop=pageimages|description&piprop=thumbnail&pithumbsize=400&pilicense=any&format=json&origin=*";
  const j=await fetch(u,{signal}).then(r=>{if(!r.ok)throw new Error("wiki "+r.status);return r.json()});
  return Object.values(j.query?.pages||{}).sort((a,b)=>a.index-b.index).map(p=>{const y=/(19[7-9]\d|20\d\d)/.exec(p.description||"");
    return {title:cleanTitle(p.title).slice(0,80),wtitle:p.title,year:y?Number(y[1]):null,upcoming:/upcoming/i.test(p.description||""),platforms:[],img:extImg(p.thumbnail?.source||"")}}).filter(x=>x.title);
}
const platMemo={};
async function wikiPlatforms(wtitle){
  if(platMemo[wtitle])return platMemo[wtitle];
  try{
    const a=await fetch("https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&titles="+encodeURIComponent(wtitle)+"&format=json&origin=*").then(r=>r.json());
    const qid=Object.values(a.query?.pages||{})[0]?.pageprops?.wikibase_item;if(!qid)return [];
    const e=await fetch("https://www.wikidata.org/w/api.php?action=wbgetentities&ids="+qid+"&props=claims&format=json&origin=*").then(r=>r.json());
    const ids=[...new Set((e.entities?.[qid]?.claims?.P400||[]).map(c=>c.mainsnak?.datavalue?.value?.id).filter(Boolean))].slice(0,40);if(!ids.length)return [];
    const l=await fetch("https://www.wikidata.org/w/api.php?action=wbgetentities&ids="+ids.join("|")+"&props=labels&languages=en&languagefallback=1&format=json&origin=*").then(r=>r.json());
    return platMemo[wtitle]=[...new Set(ids.map(id=>WIKI_PLAT(l.entities?.[id]?.labels?.en?.value)).filter(Boolean))];
  }catch{return []}
}

/* ---------- quem pode publicar (dono, admin, moderador) ---------- */
const isStaff = () => S.mode==="live"&&(S.isOwner||(S.myId&&(S.roles[S.myId]||[]).some(r=>r==="admin"||r==="moderador")));
const monthKey = (d=new Date()) => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
const MESES=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const monthName = k => {const m=/^(\d{4})-(\d{2})$/.exec(k||"");return m?`${MESES[Number(m[2])-1]} de ${m[1]}`:k};
const tierlists = () => S.mode==="demo"?DEMO_TL:(S.tierlists||{});
const newsList = () => (S.mode==="demo"?DEMO_NEWS:(S.news||[])).slice().sort((a,b)=>(b.at||0)-(a.at||0));
const DEMO_TL={[monthKey()]:{title:"Os melhores do mês",note:"Vale até o fim do mês.",status:"aberta",games:[{title:"Hades II"},{title:"Astro Bot"},{title:"Balatro"},{title:"Cyberpunk 2077"},{title:"Starfield"}],at:T(13)}};
const DEMO_NEWS=[{id:"n1",title:"Lançamentos de novembro: o que chega nos consoles",url:"https://example.com/lancamentos",source:"Exemplo",summary:"Lista dos jogos que saem este mês.",at:T(12)},{id:"n2",title:"Patch grande chega com modo coop",url:"https://example.com/patch",source:"Exemplo",summary:"",at:T(9)}];

/* ---------- tier list: por pessoa, da galera ou do mês ---------- */
function tierRows(games,cover){
  if(!games.some(g=>g.tier))return `<div class="trow"><div class="titems"><span class="empty-row">Nenhum jogo ranqueado ainda. Ao editar um jogo, escolha o tier (S, A, B, C ou D).</span></div></div>`;
  return TIERS.map(t=>{const items=games.filter(g=>(g.tier||"")===t);const byT={};items.forEach(g=>{const k=norm(g.title);(byT[k]||(byT[k]={title:g.title,ps:[],gs:[]})).ps.push(g.p);byT[k].gs.push(g)});
    const chips=Object.values(byT).map(c=>`<a class="chip" href="#jogo-${esc(slug(c.title))}" style="color:inherit;text-decoration:none">${coverBox(c.gs.find(x=>x.coverV||x.coverUrl)||c.gs[0],"mini")}<span class="ct">${esc(c.title)}</span>${cover==="dots"?`<span class="dots">${c.ps.filter(Boolean).map(p=>glyph(p,true)).join("")}</span>`:""}</a>`).join("");
    if(!t&&!chips)return "";return `<div class="trow"><div class="tlabel t-${t||"N"}">${t||"?"}</div><div class="titems">${chips||'<span class="empty-row">vazio</span>'}</div></div>`}).join("");
}
function viewTier(){
  const P=players();const mid=meId();
  if(!S.tierWho)S.tierWho=mid&&P[mid]?mid:"galera";
  if(S.tierWho!=="galera"&&S.tierWho!=="mes"&&!P[S.tierWho])S.tierWho="galera";
  const ids=Object.keys(P).sort((a,b)=>a===mid?-1:b===mid?1:P[a].nick.localeCompare(P[b].nick,"pt"));
  const tabs=`<div class="tierpick" role="group" aria-label="De quem é a tier list">
    <button data-act="tierwho" data-id="mes" aria-pressed="${S.tierWho==="mes"}">Do mês</button>
    ${ids.map(id=>`<button data-act="tierwho" data-id="${esc(id)}" aria-pressed="${S.tierWho===id}">${glyph(P[id],true)} ${id===mid?"Minha":esc(P[id].nick)}</button>`).join("")}
    <button data-act="tierwho" data-id="galera" aria-pressed="${S.tierWho==="galera"}">Galera toda</button></div>`;
  if(S.tierWho==="mes")return tabs+viewTierMes();
  const L=filtered().filter(g=>S.tierWho==="galera"||g.pid===S.tierWho);
  const who=S.tierWho==="galera"?null:P[S.tierWho];
  const head=who?`<div class="tierhead">${glyph(who)}<div><h3>Tier list de ${nk(who)}</h3><span class="hint">${L.filter(g=>g.tier).length} jogos ranqueados · jogos sem tier não aparecem${S.tierWho===mid&&S.canWrite?" · para mudar o tier de um jogo, edite o jogo":""}</span></div></div>`
    :`<div class="tierhead"><div><h3>Tier list da galera</h3><span class="hint">Todos os tiers juntos; as bolinhas mostram quem colocou o jogo em cada tier.</span></div></div>`;
  return tabs+head+`<section class="box tierlist" aria-label="Tier list">${tierRows(L,who?"":"dots")}</section>`;
}
/* ---------- tier list do mês por votação ---------- */
const TSCORE={S:5,A:4,B:3,C:2,D:1};
const scoreTier = s => s>=4.5?"S":s>=3.5?"A":s>=2.5?"B":s>=1.5?"C":"D";
const DEMO_VOTES={[monthKey()]:{d1:{v:{hadesii:"S",astrobot:"S",balatro:"A",starfield:"D"}},d2:{v:{hadesii:"A",astrobot:"S",balatro:"S",cyberpunk2077:"B"}},d3:{v:{hadesii:"S",balatro:"A",cyberpunk2077:"B",starfield:"C"}}}};
const votesOf = month => S.mode==="demo"?(DEMO_VOTES[month]||{}):(S.votes?.[month]||{});
function ensureVotes(month){
  if(S.mode!=="live"||!month||!S.db)return;S.voteSubs=S.voteSubs||{};if(S.voteSubs[month])return;
  S.voteSubs[month]=S.db.collection(`tierlists/${month}/votes`).onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=d.data()||{}});S.votes={...(S.votes||{}),[month]:o};softRender()},()=>{});
}
function tlResult(month){
  const tl=tierlists()[month];if(!tl)return null;
  if(tl.status==="encerrada"&&tl.final)return {tiers:tl.final.tiers||{},pending:tl.final.pending||[],voters:tl.final.voters||0,closed:true};
  if(!Array.isArray(tl.games))return {tiers:tl.tiers||{},pending:[],voters:0,legacy:true};
  ensureVotes(month);
  const V=votesOf(month);const res={};TIERS.forEach(t=>res[t]=[]);const pending=[];
  tl.games.forEach(g=>{const k=norm(g.title);const vs=Object.values(V).map(v=>v?.v?.[k]).filter(x=>TSCORE[x]);
    if(!vs.length){pending.push({title:g.title,coverUrl:g.coverUrl||"",n:0});return}
    const avg=vs.reduce((s,x)=>s+TSCORE[x],0)/vs.length;res[scoreTier(avg)].push({title:g.title,coverUrl:g.coverUrl||"",n:vs.length,avg:Math.round(avg*100)/100})});
  TIERS.forEach(t=>res[t].sort((a,b)=>b.avg-a.avg||b.n-a.n));
  return {tiers:res,pending,voters:Object.values(V).filter(v=>Object.keys(v?.v||{}).length).length};
}
function tlChip(x){const g=allGames().find(y=>norm(y.title)===norm(x.title));const cg=g&&(g.coverV||g.coverUrl)?g:{title:x.title,coverUrl:x.coverUrl};
  return `<a class="chip" href="#jogo-${esc(slug(x.title))}" style="color:inherit;text-decoration:none">${coverBox(cg,"mini")}<span class="ct">${esc(x.title)}</span>${x.n?`<span class="vn" title="média ${String(x.avg).replace(".",",")}">${x.n} voto${x.n>1?"s":""}</span>`:""}</a>`}
function monthlyRows(month){
  const r=tlResult(month);if(!r)return "";
  return TIERS.map(t=>{const arr=r.tiers[t]||[];return `<div class="trow"><div class="tlabel t-${t}">${t}</div><div class="titems">${arr.length?arr.map(tlChip).join(""):'<span class="empty-row">vazio</span>'}</div></div>`}).join("")
    +(r.pending.length?`<div class="trow"><div class="tlabel t-N">?</div><div class="titems">${r.pending.map(tlChip).join("")}<span class="empty-row">sem votos ainda</span></div></div>`:"");
}
function voteBox(month){
  const tl=tierlists()[month];if(!tl||tl.status!=="aberta"||!Array.isArray(tl.games))return "";
  if(S.mode==="demo")return `<section class="box card"><span class="eyebrow">Seu voto</span><p class="hint" style="margin:0">No modo exemplo não dá para votar.</p></section>`;
  if(!me()||!S.canWrite)return `<section class="box card"><span class="eyebrow">Votação aberta</span><p style="margin:0">Entre e crie seu perfil para votar.</p></section>`;
  const mine=votesOf(month)[S.myId]?.v||{};const done=tl.games.filter(g=>mine[norm(g.title)]).length;
  return `<section class="box card"><span class="eyebrow">Seu voto · ${done} de ${tl.games.length}</span><h3>Escolha o tier de cada jogo</h3><div class="sub">Pode mudar até a votação ser encerrada. Toque de novo para tirar o voto.</div>
    <div class="vlist">${tl.games.map(g=>{const k=norm(g.title);return `<div class="mrow">${coverBox({title:g.title,coverUrl:g.coverUrl},"mini")}<span class="ct">${esc(g.title)}</span><div class="pick">${TIERS.map(t=>`<button type="button" class="tb t-${t}" data-act="vote" data-m="${esc(month)}" data-k="${esc(k)}" data-t="${t}" aria-pressed="${mine[k]===t}" aria-label="Votar ${t} em ${esc(g.title)}">${t}</button>`).join("")}</div></div>`}).join("")}</div></section>`;
}
function viewTierMes(){
  const all=tierlists();const keys=Object.keys(all).sort().reverse();
  if(!S.tlMonth||!all[S.tlMonth])S.tlMonth=keys[0]||"";
  const tl=all[S.tlMonth];const staff=isStaff();const r=tl?tlResult(S.tlMonth):null;
  const st=tl?(tl.status==="aberta"?`<span class="pill s-jogando">Votação aberta</span>`:tl.status==="encerrada"?`<span class="pill s-zerado">Resultado final</span>`:""):"";
  const top=`<div class="tierhead"><div style="flex:1;min-width:0"><span class="eyebrow">Tier list do mês</span><h3>${tl?esc(tl.title||"Os melhores do mês"):"Nenhuma tier list mensal ainda"}</h3>
      ${tl?`<span class="hint">${st} ${esc(monthName(S.tlMonth))}${r&&!r.legacy?` · ${r.voters} pessoa${r.voters===1?"":"s"} votaram`:""}${tl.note?` · ${esc(tl.note)}`:""}</span>`:`<span class="hint">${staff?"Lance a primeira votação com os jogos que a galera jogou este mês.":"O dono do site lança uma votação por mês com os melhores jogos."}</span>`}</div>
    <div class="actions">${keys.length>1?`<select id="tl-month" aria-label="Mês">${keys.map(k=>`<option value="${k}"${k===S.tlMonth?" selected":""}>${esc(monthName(k))}</option>`).join("")}</select>`:""}
      ${staff&&!all[monthKey()]?`<button class="btn small primary" data-act="monthly" data-m="${monthKey()}">Lançar votação do mês</button>`:""}
      ${staff&&tl?`<button class="btn small" data-act="monthly" data-m="${S.tlMonth}">Gerenciar</button>`:""}</div></div>`;
  return top+(tl?`<div class="tlgrid"><section class="box tierlist" aria-label="Resultado da tier list do mês">${monthlyRows(S.tlMonth)}</section>${voteBox(S.tlMonth)}</div>`:"");
}
function openMonthly(month){
  const cur=clone(tierlists()[month]||{title:"Os melhores do mês",note:"",games:[],status:""});
  const pick={};
  (Array.isArray(cur.games)?cur.games:[]).forEach(x=>pick[norm(x.title)]={title:x.title,coverUrl:x.coverUrl||"",on:true});
  if(!Array.isArray(cur.games))TIERS.forEach(t=>(cur.tiers?.[t]||[]).forEach(x=>pick[norm(x.title)]={title:x.title,coverUrl:x.coverUrl||"",on:true}));
  const [y,mm]=month.split("-").map(Number);const start=new Date(y,mm-1,1).getTime(),end=new Date(y,mm,1).getTime();
  allGames().filter(g=>(g.updatedAt>=start&&g.updatedAt<end)||(isDone(g)&&Number(g.year)===y)).forEach(g=>{const k=norm(g.title);if(!pick[k])pick[k]={title:g.title,coverUrl:extImg(g.coverUrl)||"",on:false}});
  const exists=!!tierlists()[month];
  M={type:"monthly",month,pick,status:cur.status||""};
  $("#modal").innerHTML=overlay(`<h2>Tier list de ${esc(monthName(month))}</h2>
    ${exists?`<p style="margin:0">Situação: <b>${cur.status==="aberta"?"votação aberta":cur.status==="encerrada"?"encerrada (resultado final)":"rascunho"}</b></p>`:""}
    <div class="fgrid"><div class="field"><label for="tl-title">Título</label><input id="tl-title" maxlength="60" value="${esc(cur.title||"")}"></div>
      <div class="field"><label for="tl-note">Recado (opcional)</label><input id="tl-note" maxlength="140" value="${esc(cur.note||"")}" placeholder="Ex.: vale até dia 30"></div></div>
    <p class="hint" style="margin:0">Marque os jogos que entram na votação. Aparecem os que a galera mexeu neste mês; dá para adicionar outros.</p>
    <div class="mlist" id="mlist"></div>
    <div class="field"><label for="tl-add">Adicionar outro jogo</label><div class="actions"><input id="tl-add" maxlength="80" placeholder="Nome do jogo" style="flex:1;min-width:160px"><button type="button" class="btn small" data-act="tladd">Adicionar</button></div></div>
    <div class="err" id="tlerr"></div>
    <div class="mfoot"><div class="actions">${exists?`<button type="button" class="btn small danger" data-act="tldel">Apagar</button>`:""}
      ${exists&&cur.status==="aberta"?`<button type="button" class="btn small" data-act="tlclose">Encerrar votação</button>`:""}
      ${exists&&cur.status==="encerrada"?`<button type="button" class="btn small" data-act="tlreopen">Reabrir votação</button>`:""}</div>
      <div class="r"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button type="button" class="btn primary" data-act="tlsave">${exists?"Salvar":"Lançar votação"}</button></div></div>`);
  drawMonthly();
}
function drawMonthly(){
  const L=Object.entries(M.pick).sort((a,b)=>(b[1].on-a[1].on)||a[1].title.localeCompare(b[1].title,"pt"));
  $("#mlist").innerHTML=L.map(([k,x])=>`<label class="mrow mcheck">${coverBox({title:x.title,coverUrl:x.coverUrl},"mini")}<span class="ct">${esc(x.title)}</span><input type="checkbox" data-tlk="${esc(k)}" ${x.on?"checked":""} aria-label="Incluir ${esc(x.title)}"></label>`).join("")||'<span class="hint">Ninguém mexeu em jogos este mês ainda. Adicione abaixo.</span>';
}

/* ---------- Novidades ---------- */
const safeUrl = u => {try{const x=new URL(u);return x.protocol==="https:"?x.href:""}catch{return ""}};
const hostOf = u => {try{return new URL(u).hostname.replace(/^www\./,"")}catch{return ""}};
function newsCard(n,small){
  const url=safeUrl(n.url);if(!url)return "";const img=safeUrl(n.img||"");const by=players()[n.by];
  return `<article class="box ncard${small?" small":""}">${img&&!small?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="nimg"><img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer"></a>`:""}
    <div class="nbody"><span class="eyebrow">${esc(n.source||hostOf(url))}</span><h3><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(n.title)}</a></h3>
      ${n.summary&&!small?`<p>${esc(n.summary)}</p>`:""}
      <div class="nmeta"><span class="hint">${by?`postado por ${nk(by)} · `:""}${ago(n.at)}</span>${isStaff()&&n.id?`<button class="linkbtn" data-act="newsdel" data-id="${esc(n.id)}">apagar</button>`:""}</div></div></article>`;
}
function autoNews(){return S.mode==="demo"?[]:(S.autoNews?.itens||[]).filter(n=>safeUrl(n.url)&&n.title)}
function autoCard(n){const url=safeUrl(n.url),img=safeUrl(n.img||"");
  return `<article class="box ncard">${img?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="nimg"><img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer"></a>`:""}
    <div class="nbody"><span class="eyebrow">${esc(n.source||hostOf(url))}</span><h3><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(n.title)}</a></h3>
      ${n.summary?`<p>${esc(n.summary)}</p>`:""}
      <div class="nmeta"><span class="hint">${ago(n.at)} · fonte: ${esc(n.source||hostOf(url))}</span><a class="linkbtn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Ler no site ↗</a></div></div></article>`}
function viewNovidades(){
  const L=newsList();const staff=isStaff();const A=autoNews();
  const srcs=[...new Set(A.map(n=>n.source).filter(Boolean))];
  if(S.newsSrc&&!srcs.includes(S.newsSrc))S.newsSrc="";
  const AF=A.filter(n=>!S.newsSrc||n.source===S.newsSrc);
  const upd=S.autoNews?.atualizadoEm;
  return `<div class="page"><div class="tierhead"><div style="flex:1"><span class="eyebrow">Novidades</span><h3>O que está rolando no mundo dos games</h3><span class="hint">Destaques escolhidos pela staff e notícias puxadas automaticamente dos sites, sempre com link para a matéria original.</span></div>
    ${staff?`<button class="btn primary small" data-act="newsadd">+ Postar destaque</button>`:""}</div>
    ${L.length?`<section class="sec"><h4>Destaques da galera</h4><div class="ngrid">${L.map(n=>newsCard(n)).join("")}</div></section>`:""}
    <section class="sec"><h4>Notícias dos sites${upd?` · atualizado há ${ago(upd)}`:""}</h4>
      ${srcs.length>1?`<div class="tierpick" role="group" aria-label="Filtrar por site"><button data-act="newsrc" data-id="" aria-pressed="${!S.newsSrc}">Todos</button>${srcs.map(s=>`<button data-act="newsrc" data-id="${esc(s)}" aria-pressed="${S.newsSrc===s}">${esc(s)}</button>`).join("")}</div>`:""}
      ${AF.length?`<div class="ngrid">${AF.map(autoCard).join("")}</div>`:`<span class="hint">${S.mode==="demo"?"No modo exemplo as notícias automáticas não aparecem.":"As notícias automáticas aparecem aqui depois que o robô rodar pela primeira vez."}</span>`}</section>
    ${!L.length&&!A.length&&staff?`<p class="hint">Dica: poste um destaque colando o link de uma notícia.</p>`:""}</div>`;
}
function openNews(){
  M={type:"news"};
  $("#modal").innerHTML=overlay(`<h2>Postar novidade</h2>
    <div class="field"><label for="nw-url">Link da notícia</label><input id="nw-url" type="url" maxlength="500" placeholder="https://..." required></div>
    <div class="field"><label for="nw-title">Título</label><input id="nw-title" maxlength="140" required placeholder="Ex.: Hades II ganha data na Switch 2"></div>
    <div class="fgrid"><div class="field"><label for="nw-source">Site (opcional)</label><input id="nw-source" maxlength="40" placeholder="Preenchido pelo link"></div>
      <div class="field"><label for="nw-img">Link da imagem (opcional)</label><input id="nw-img" type="url" maxlength="500" placeholder="https://...jpg"></div></div>
    <div class="field"><label for="nw-sum">Resumo (opcional)</label><textarea id="nw-sum" maxlength="300" placeholder="Uma ou duas frases sobre a notícia"></textarea></div>
    <span class="hint">Dica: para pegar a imagem, clique com o botão direito na foto da notícia e escolha "Copiar endereço da imagem".</span>
    <div class="err" id="nwerr"></div>
    <div class="mfoot"><div class="r"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button type="button" class="btn primary" data-act="newssave">Publicar</button></div></div>`);
  $("#nw-url").focus();
}

/* ---------- cliques das novidades e tier lists ---------- */
document.addEventListener("click",async e=>{
  const el=e.target.closest("[data-act]");if(!el)return;const a=el.dataset.act;
  if(a==="tierwho"){S.tierWho=el.dataset.id;renderView();return}
  if(a==="newsrc"){S.newsSrc=el.dataset.id;renderView();return}
  if(a==="tladd"&&M?.type==="monthly"){const v=$("#tl-add").value.trim();if(!v)return;const k=norm(v);const g=allGames().find(y=>norm(y.title)===k);
    M.pick[k]=M.pick[k]||{title:g?.title||v,coverUrl:extImg(g?.coverUrl)||""};M.pick[k].on=true;$("#tl-add").value="";drawMonthly();
    if(!M.pick[k].coverUrl){wikiSearch(v).then(r=>{const hit=r.find(x=>norm(x.title)===k)||r[0];if(hit&&M?.type==="monthly"&&M.pick[k]){if(hit.img)M.pick[k].coverUrl=hit.img;drawMonthly()}}).catch(()=>{})}return}
  if(a==="monthly"){if(isStaff())openMonthly(el.dataset.m);return}
  if(a==="vote"){
    if(S.mode!=="live"||!me()||!S.canWrite){toast("Entre para votar");return}
    const month=el.dataset.m,k=el.dataset.k,t=el.dataset.t;const cur=clone(votesOf(month)[S.myId]||{v:{}});cur.v=cur.v||{};
    if(cur.v[k]===t)delete cur.v[k];else cur.v[k]=t;cur.at=Date.now();
    S.votes={...(S.votes||{}),[month]:{...votesOf(month),[S.myId]:cur}};renderView();
    queue(()=>S.db.doc(`tierlists/${month}/votes/${S.myId}`).set(cur)).catch(err=>toast(err?.code==="permission-denied"?"A votação está encerrada.":errMsg(err)));return}
  if(a==="newsadd"){if(isStaff())openNews();return}
  if(S.mode!=="live"||!isStaff())return;
  if(["tlsave","tlclose","tlreopen"].includes(a)&&M?.type==="monthly"){
    const games=Object.values(M.pick).filter(x=>x.on).map(x=>({title:x.title,coverUrl:x.coverUrl||""}));
    if(!games.length){$("#tlerr").textContent="Marque pelo menos um jogo.";return}
    const prev=tierlists()[M.month]||{};
    const doc={title:$("#tl-title").value.trim()||"Os melhores do mês",note:$("#tl-note").value.trim(),games,status:prev.status||"aberta",by:prev.by||S.myId,at:prev.at||Date.now(),updatedAt:Date.now()};
    if(a==="tlclose"){const r=tlResult(M.month);doc.status="encerrada";doc.final={tiers:r.tiers,pending:r.pending,voters:r.voters,at:Date.now()}}
    if(a==="tlreopen"){doc.status="aberta";doc.final=null}
    if(a==="tlsave"&&prev.final&&doc.status==="encerrada")doc.final=prev.final;
    try{await S.db.doc(`tierlists/${M.month}`).set(doc);S.tierlists={...(S.tierlists||{}),[M.month]:doc};S.tlMonth=M.month;S.tierWho="mes";closeModal();renderAll();
      toast({tlsave:prev.status?"Tier list salva":"Votação lançada!",tlclose:"Votação encerrada, resultado final publicado",tlreopen:"Votação reaberta"}[a])}catch(err){$("#tlerr").textContent=errMsg(err)}return}
  if(a==="tldel"&&M?.type==="monthly"){if(!M.confirmDel){M.confirmDel=true;el.textContent="Confirmar: apagar";return}
    try{await S.db.doc(`tierlists/${M.month}`).delete();const o={...(S.tierlists||{})};delete o[M.month];S.tierlists=o;S.tlMonth="";closeModal();renderAll();toast("Tier list apagada")}catch(err){$("#tlerr").textContent=errMsg(err)}return}
  if(a==="newssave"&&M?.type==="news"){const url=safeUrl($("#nw-url").value.trim()),title=$("#nw-title").value.trim();
    if(!url){$("#nwerr").textContent="Cole um link que comece com https://";return}if(!title){$("#nwerr").textContent="Escreva um título.";return}
    const img=$("#nw-img").value.trim();if(img&&!safeUrl(img)){$("#nwerr").textContent="O link da imagem precisa começar com https://";return}
    const id=newId("n");const doc={title:title.slice(0,140),url,source:($("#nw-source").value.trim()||hostOf(url)).slice(0,40),img:safeUrl(img),summary:$("#nw-sum").value.trim().slice(0,300),by:S.myId,at:Date.now()};
    try{await S.db.doc(`news/${id}`).set(doc);closeModal();toast("Novidade publicada")}catch(err){$("#nwerr").textContent=errMsg(err)}return}
  if(a==="newsdel"){if(el.dataset.confirm!=="1"){el.dataset.confirm="1";el.textContent="confirmar?";return}
    try{await S.db.doc(`news/${el.dataset.id}`).delete();toast("Novidade apagada")}catch(err){toast(errMsg(err))}return}
});
document.addEventListener("change",e=>{if(e.target.id==="tl-month"){S.tlMonth=e.target.value;renderView()}
  const k=e.target.dataset?.tlk;if(k!==undefined&&M?.type==="monthly"&&M.pick[k])M.pick[k].on=e.target.checked});

/* ================== v3: Meus Saves (ficha de retomada) ================== */
const BTN = {
  PlayStation:["✕","○","△","□","L1","R1","L2","R2","L3","R3","Touchpad","Options","↑","↓","←","→"],
  Xbox:["A","B","X","Y","LB","RB","LT","RT","LS","RS","View","Menu","↑","↓","←","→"],
  Switch:["A","B","X","Y","L","R","ZL","ZR","L-stick","R-stick","+","−","↑","↓","←","→"],
  PC:["Esc","Tab","Shift","Ctrl","Alt","Espaço","E","F","Q","R","Clique esq.","Clique dir.","Roda","1","2","3"]
};
const famOf = plat => /^PS/.test(plat||"")?"PlayStation":/^Xbox/.test(plat||"")?"Xbox":/Switch/.test(plat||"")?"Switch":"PC";
const quando = t => {const a=ago(t);return a==="agora"?"agora mesmo":"há "+a};
const fichaPath = (pid,gid) => `players/${pid}/saves/${gid}`;
const saveHash = (pid,gid) => `save-${pid}-${gid}`;
const myGamesSorted = () => {const m=me();if(!m)return [];const ord={jogando:0,pausado:1,quero:2,zerado:3,platinado:4,dropado:5};
  return Object.entries(m.games||{}).map(([gid,g])=>({...g,gid,pid:S.myId,p:m})).sort((a,b)=>(ord[a.status]??9)-(ord[b.status]??9)||(b.updatedAt||0)-(a.updatedAt||0))};
function paradoEm(g){return g.lastNote||g.fase||""}

/* ---------- carregar a ficha aberta e as fichas da galera para o mesmo jogo ---------- */
function watchFicha(pid,gid){
  const key=pid+"/"+gid;if(S.ficha?.key===key)return;
  if(S.ficha?.unsub)S.ficha.unsub();
  S.ficha={key,pid,gid,data:null,loading:true};
  if(S.mode!=="live"||!S.db){S.ficha.loading=false;return}
  S.ficha.unsub=S.db.doc(fichaPath(pid,gid)).onSnapshot(sn=>{if(S.ficha?.key!==key)return;S.ficha.data=(sn.exists&&sn.data())||{};S.ficha.loading=false;if(S.view==="save")renderViewKeep()},()=>{if(S.ficha?.key===key){S.ficha.loading=false;S.ficha.data={}}});
}
function renderViewKeep(){const y=window.scrollY;renderView();try{window.scrollTo(0,y)}catch{}}
const comm={};
function loadComm(title){
  const k=norm(title);if(comm[k]||S.mode!=="live"||!S.db)return comm[k]||[];
  comm[k]=[];
  const others=allGames().filter(g=>norm(g.title)===k);
  Promise.all(others.map(g=>S.db.doc(fichaPath(g.pid,g.gid)).get().then(sn=>sn.exists?{pid:g.pid,gid:g.gid,p:g.p,d:sn.data()||{}}:null).catch(()=>null)))
    .then(r=>{comm[k]=r.filter(Boolean);if(["save","jogo"].includes(S.view))renderViewKeep()});
  return [];
}
function saveFicha(mut){
  const f=S.ficha;if(!f||f.pid!==S.myId)return Promise.reject(new Error("não é seu"));
  return queue(async()=>{const cur=clone(f.data||{});mut(cur);cur.updatedAt=Date.now();f.data=cur;renderViewKeep();await S.db.doc(fichaPath(f.pid,f.gid)).set(cur)});
}

/* ---------- aba Meus Saves ---------- */
function saveCard(g){
  const ds=daysSince(g.updatedAt);const prog=Math.min(100,Number(g.progress)||0);
  return `<article class="box scard">${coverBox(g)}
    <div class="sbody"><div class="meta"><span class="pill s-${esc(g.status)}">${esc(STATUS[g.status]?.l||g.status)}</span>${g.platform?`<span class="tag">${esc(g.platform)}</span>`:""}${g.updatedAt>1e9?`<span class="tag">${ds>=14?`parado há ${ds} dias`:quando(g.updatedAt)}</span>`:""}</div>
      <h3 class="gtitle"><a href="#${saveHash(g.pid,g.gid)}">${esc(g.title)}</a></h3>
      ${paradoEm(g)?`<div class="fase"><span class="flabel">Parei em</span><br>${esc(paradoEm(g))}</div>`:`<div class="hint">Ainda sem anotação de onde parou.</div>`}
      ${g.next?`<div class="fase"><span class="flabel">Próximo objetivo</span><br><b>${esc(g.next)}</b></div>`:""}
      ${["jogando","pausado"].includes(g.status)?`<div class="bar"><i style="width:${prog}%"></i></div>`:""}
      <div class="actions" style="margin-top:auto">${g.pid===meId()&&S.canWrite?`<button class="btn small primary" data-act="session" data-id="${esc(g.gid)}">Joguei agora</button>`:""}<a class="btn small" href="#${saveHash(g.pid,g.gid)}">Abrir ficha</a></div></div></article>`;
}
function viewSaves(){
  const m=me();
  if(!m)return emptyBox("▶","Seus saves ficam aqui",S.mode==="live"&&!S.myId?"Entre para guardar onde parou em cada jogo, anotar a história, montar a cola de controles e marcar o que falta.":"Crie seu perfil e adicione um jogo para começar.",S.mode==="live"&&!S.myId?`<div class="actions"><button class="btn primary" data-act="auth" data-m="criar">Criar conta</button><button class="btn" data-act="auth" data-m="entrar">Entrar</button></div>`:"");
  const L=myGamesSorted();const ativos=L.filter(g=>["jogando","pausado"].includes(g.status));const resto=L.filter(g=>!["jogando","pausado"].includes(g.status));
  return `<div class="page"><div class="tierhead"><div style="flex:1"><span class="eyebrow">Meus Saves</span><h3>Onde você parou em cada jogo</h3><span class="hint">Abra a ficha quando for voltar a jogar: onde parou, história, controles, pendências e guias.</span></div>${S.canWrite?`<button class="btn primary small" data-act="add">+ Jogo</button>`:""}</div>
    ${ativos.length?`<section class="sec"><h4>Jogando agora (${ativos.length})</h4><div class="sgrid">${ativos.map(saveCard).join("")}</div></section>`:""}
    ${resto.length?`<section class="sec"><h4>Outros jogos (${resto.length})</h4><div class="sgrid">${resto.map(saveCard).join("")}</div></section>`:""}
    ${!L.length?emptyBox("+","Nenhum jogo ainda","Adicione o jogo que está jogando para criar o primeiro save."):""}</div>`;
}

/* ---------- ficha do jogo ---------- */
const FTABS={onde:"Onde parei",diario:"Diário",historia:"História",controles:"Controles",pend:"Pendências",dicas:"Prints e dicas",guias:"Guias e links"};
function viewSave(){
  const [pid,gid]=(S.route||"").split("-");const p=players()[pid];const g=p?.games?.[gid];
  if(!g)return `<div class="page"><a class="btn small back" href="#saves">← Meus Saves</a>${emptyBox("?","Save não encontrado","Esse jogo não existe mais ou foi removido.")}</div>`;
  watchFicha(pid,gid);const f=S.ficha;const d=f.data||{};const mine=pid===meId()&&S.canWrite;const G={...g,gid,pid,p};
  if(!FTABS[S.saveTab])S.saveTab="onde";
  const tabs=`<div class="tierpick ftabs" role="tablist">${Object.entries(FTABS).map(([k,l])=>`<button role="tab" data-act="ftab" data-id="${k}" aria-pressed="${S.saveTab===k}">${l}${k==="pend"&&d.todo?.length?` ${d.todo.filter(x=>!x.d).length}`:""}${k==="diario"&&d.diary?.length?` ${d.diary.length}`:""}</button>`).join("")}</div>`;
  const head=`<section class="box fhero">${coverBox(G)}<div class="fh"><span class="eyebrow">${mine?"Seu save":"Save de "+esc(p.nick)}</span><h2>${esc(g.title)}</h2>
    <div class="meta"><span class="pill s-${esc(g.status)}">${esc(STATUS[g.status]?.l||g.status)}</span>${g.platform?`<span class="tag">${esc(g.platform)}</span>`:""}${g.hours?`<span class="tag">${esc(g.hours)} h</span>`:""}${g.updatedAt>1e9?`<span class="tag">última vez ${quando(g.updatedAt)}</span>`:""}</div>
    <div class="actions">${mine?`<button class="btn primary small" data-act="session" data-id="${esc(gid)}">Joguei agora</button><button class="btn small" data-act="edit" data-id="${esc(gid)}">Editar jogo</button>`:""}<a class="btn small ghost" href="#jogo-${esc(slug(g.title))}">Página do jogo</a></div></div></section>`;
  let body="";
  if(f.loading)body=`<div class="loading">Carregando o save<span class="blink">_</span></div>`;
  else body={onde:fOnde,diario:fDiario,historia:fHistoria,controles:fControles,pend:fPend,dicas:fDicas,guias:fGuias}[S.saveTab](G,d,mine);
  return `<div class="page"><a class="btn small back" href="${mine?"#saves":"#perfil-"+esc(pslug(p))}">← ${mine?"Meus Saves":esc(p.nick)}</a>${head}${tabs}${body}</div>`;
}
function fOnde(g,d,mine){
  const prog=Number(g.progress)||0,h=Number(g.hours)||0;
  const est=prog>=5&&prog<100&&h>0?Math.max(0,Math.round(h/prog*100-h)):null;
  const hz=allGames().filter(x=>isDone(x)&&norm(x.title)===norm(g.title)&&Number(x.hours)>0).map(x=>Number(x.hours));const media=hz.length?Math.round(hz.reduce((a,b)=>a+b,0)/hz.length):null;
  const last=(d.diary||[]).slice(-1)[0];
  return `<div class="fgrid2"><section class="box card onde">
      <span class="eyebrow">Parei em</span><p class="big-note">${esc(d.note||g.lastNote||g.fase||"Nenhuma anotação ainda.")}</p>
      ${g.next||d.next?`<div><span class="flabel">Próximo objetivo</span><p class="next">${esc(d.next||g.next)}</p></div>`:""}
      ${g.fase?`<div class="hint">Fase/área: <b>${esc(g.fase)}</b></div>`:""}
      ${["jogando","pausado"].includes(g.status)?`<div class="bar"><i style="width:${Math.min(100,prog)}%"></i></div><div class="pct">${prog}% · ${h} h jogadas${est!==null?` · faltam uns ${est} h no seu ritmo`:""}${media?` · a galera zerou em ~${media} h`:""}</div>`:""}
      ${mine?`<div class="actions"><button class="btn primary" data-act="session" data-id="${esc(g.gid)}">Joguei agora</button></div>`:""}</section>
    <section class="box card"><span class="eyebrow">Última sessão</span>${last?`<div class="hint">${esc(new Date(last.at).toLocaleDateString("pt-BR"))}${last.h?` · ${esc(last.h)} h`:""}</div><p style="margin:0;white-space:pre-wrap">${esc(last.txt||"")}</p>${last.shot?`<div class="shot"><div class="ph">${mimg(`players/${g.pid}/shots/${last.shot}`,1,"","Print da sessão")}<button class="zoom" data-act="zoom" data-k="${esc(mkey(`players/${g.pid}/shots/${last.shot}`,1))}" data-cap="" aria-label="Ampliar print"></button></div></div>`:""}`:`<p class="hint" style="margin:0">Use "Joguei agora" ao parar de jogar: em 10 segundos você anota o que fez, o próximo passo e um print.</p>`}
      ${(d.todo||[]).filter(x=>!x.d).length?`<div><span class="flabel">Pendências</span><ul class="mini-todo">${d.todo.filter(x=>!x.d).slice(0,4).map(x=>`<li>${esc(x.t)}</li>`).join("")}</ul></div>`:""}</section></div>`;
}
function fDiario(g,d,mine){
  const L=(d.diary||[]).slice().reverse();
  return `<section class="box card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3>Diário de sessões</h3>${mine?`<button class="btn small primary" data-act="session" data-id="${esc(g.gid)}">+ Joguei agora</button>`:""}</div>
    ${L.length?`<ol class="diary">${L.map(e=>`<li><div class="dd">${esc(new Date(e.at).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"}))}</div><div class="dt">${e.fase?`<span class="tag">${esc(e.fase)}</span> `:""}${e.h?`<span class="tag">${esc(e.h)} h</span>`:""}<p>${esc(e.txt||"")}</p>${e.next?`<p class="hint">Próximo: ${esc(e.next)}</p>`:""}
      ${e.shot?`<div class="shot" style="max-width:260px"><div class="ph">${mimg(`players/${g.pid}/shots/${e.shot}`,1,"","Print")}<button class="zoom" data-act="zoom" data-k="${esc(mkey(`players/${g.pid}/shots/${e.shot}`,1))}" data-cap="" aria-label="Ampliar print"></button></div></div>`:""}
      ${mine?`<button class="linkbtn" data-act="diarydel" data-id="${esc(e.id)}">apagar</button>`:""}</div></li>`).join("")}</ol>`:'<span class="hint">Nenhuma sessão registrada ainda.</span>'}</section>`;
}
const plotMemo={};
async function wikiPlot(title,wtitle){
  const W=(host,params)=>fetch(`https://${host}/w/api.php?${new URLSearchParams({...params,format:"json"})}&origin=*`).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
  let en=wtitle;
  if(!en){const r=await wikiSearch(title);en=r[0]?.wtitle;if(!en)return null}
  const ll=await W("en.wikipedia.org",{action:"query",prop:"langlinks",lllang:"pt",titles:en,redirects:1});
  const pt=Object.values(ll.query?.pages||{})[0]?.langlinks?.[0]?.["*"];
  const EN=/^(Plot|Synopsis|Story|Premise|Setting and plot|Plot and setting|Setting and story)$/i,PT=/^(Enredo|Sinopse|História|Premissa|Narrativa|Trama|Enredo e personagens)$/i;
  const tries=pt?[["pt.wikipedia.org",pt,PT],["en.wikipedia.org",en,EN]]:[["en.wikipedia.org",en,EN]];
  for(const [host,t,re] of tries){
    const ex=await W(host,{action:"query",prop:"extracts",explaintext:1,exsectionformat:"wiki",titles:t,redirects:1});
    const txt=Object.values(ex.query?.pages||{})[0]?.extract||"";
    for(const part of txt.split(/\n(?===\s)/)){const m=/^==\s*([^=]+?)\s*==\s*\n/.exec(part);if(m&&re.test(m[1].trim())){
      const out=part.replace(/^==.*\n/,"").replace(/^===+\s*([^=]+?)\s*===+$/gm,"\n$1\n").trim();
      if(out)return {lang:host.slice(0,2),title:t,url:`https://${host}/wiki/${encodeURIComponent(t.replace(/ /g,"_"))}`,text:out.slice(0,8000)}}}
  }
  return {none:true,url:`https://en.wikipedia.org/wiki/${encodeURIComponent(en.replace(/ /g,"_"))}`};
}
function fHistoria(g,d,mine){
  const k=norm(g.title);const pl=plotMemo[k];
  return `<div class="fgrid2"><section class="box card"><span class="eyebrow">Relembrar a história</span><h3>Resumo do enredo</h3>
      ${!pl?`<p class="hint" style="margin:0">Puxa o resumo da Wikipédia, em português quando existir. Ele fica escondido para não dar spoiler sem querer.</p><div><button class="btn small primary" data-act="plot" data-t="${esc(g.title)}" data-w="${esc(d.wtitle||g.wtitle||"")}">Buscar resumo</button></div>`
        :pl==="…"?`<div class="loading">Buscando na Wikipédia<span class="blink">_</span></div>`
        :pl==="erro"?`<p class="hint" style="margin:0">Não consegui falar com a Wikipédia agora. Verifique a internet ou se algum bloqueador está impedindo, e tente de novo.</p><div><button class="btn small" data-act="plot" data-t="${esc(g.title)}" data-w="${esc(d.wtitle||g.wtitle||"")}">Tentar de novo</button></div>`
        :pl.none?`<p class="hint" style="margin:0">A Wikipédia não tem uma seção de enredo para esse jogo.</p><a class="btn small" href="${esc(pl.url)}" target="_blank" rel="noopener">Abrir artigo</a>`
        :`<div class="spoiler hidden-sp" data-act="reveal" role="button" tabindex="0" aria-label="Revelar resumo com spoiler"><p class="tiptext">${esc(pl.text)}</p></div><span class="hint">Fonte: <a href="${esc(pl.url)}" target="_blank" rel="noopener">Wikipédia${pl.lang==="pt"?"":" (em inglês)"}</a>, licença CC BY-SA.</span>`}
    </section>
    <section class="box card"><span class="eyebrow">Anotações de lore</span><h3>${mine?"O que você precisa lembrar":"Anotações de "+esc(g.p.nick)}</h3>
      ${mine?`<textarea id="lore-text" class="fta" maxlength="5000" placeholder="Personagens, facções, quem é quem, mistérios que ainda não entendeu…">${esc(d.lore||"")}</textarea><div><button class="btn small primary" data-act="lore">Salvar anotações</button></div>`
        :d.lore?`<p class="tiptext">${esc(d.lore)}</p>`:`<span class="hint">Sem anotações.</span>`}</section></div>`;
}
function fControles(g,d,mine){
  const fam=d.ctlFam||famOf(g.platform);const rows=d.controls||[];const others=loadComm(g.title).filter(c=>c.pid!==g.pid&&(c.d.controls||[]).length);
  return `<div class="fgrid2"><section class="box card"><span class="eyebrow">Cola de controles · ${esc(fam)}</span><h3>${mine?"Sua cola":"Cola de "+esc(g.p.nick)}</h3>
      ${rows.length?`<table class="ctl"><tbody>${rows.map((r,i)=>`<tr><td>${esc(r.a)}</td><td><span class="key">${esc(r.b)}</span></td>${mine?`<td><button class="linkbtn" data-act="ctldel" data-i="${i}" aria-label="Remover">×</button></td>`:""}</tr>`).join("")}</tbody></table>`:`<span class="hint">${mine?"Nenhum comando ainda. Adicione abaixo os que você sempre esquece.":"Sem cola de controles."}</span>`}
      ${mine?`<div class="ctlform"><div class="field"><label for="ctl-fam">Controle</label><select id="ctl-fam">${Object.keys(BTN).map(k=>`<option${k===fam?" selected":""}>${k}</option>`).join("")}</select></div>
        <div class="field"><label for="ctl-a">Ação</label><input id="ctl-a" maxlength="40" placeholder="Ex.: Esquivar, Abrir mapa, Parry"></div>
        <div class="field"><label for="ctl-b">Botão</label><input id="ctl-b" maxlength="30" placeholder="Toque nos botões abaixo ou digite"></div>
        <div class="keys">${BTN[fam].map(b=>`<button type="button" class="key" data-act="ctlkey" data-k="${esc(b)}">${esc(b)}</button>`).join("")}<button type="button" class="key" data-act="ctlkey" data-k=" + ">+</button></div>
        <div><button class="btn small primary" data-act="ctladd">Adicionar à cola</button></div></div>`:""}</section>
    <section class="box card"><span class="eyebrow">Colas da galera</span><h3>Quem já montou</h3>
      ${others.length?others.map(c=>`<div class="gmini">${glyph(c.p)}<div class="t"><b>${nk(c.p)}</b><span>${(c.d.controls||[]).length} comandos · ${esc(c.d.ctlFam||"")}</span></div>${mine?`<button class="btn small" data-act="ctlcopy" data-pid="${esc(c.pid)}">Copiar</button>`:`<a class="btn small ghost" href="#${saveHash(c.pid,c.gid)}">Ver</a>`}</div>`).join(""):`<span class="hint">Ninguém da galera montou cola para este jogo ainda.</span>`}</section></div>`;
}
function fPend(g,d,mine){
  const T=d.todo||[];const n=T.filter(x=>x.d).length;
  return `<section class="box card"><span class="eyebrow">Pendências · ${n} de ${T.length} feitas</span><h3>O que falta fazer</h3>
    ${T.length?`<div class="bar"><i style="width:${T.length?n/T.length*100:0}%"></i></div><ul class="todo">${T.map((x,i)=>`<li class="${x.d?"done":""}"><label><input type="checkbox" data-todo="${i}" ${x.d?"checked":""} ${mine?"":"disabled"}> <span>${esc(x.t)}</span></label>${mine?`<button class="linkbtn" data-act="tododel" data-i="${i}" aria-label="Remover">×</button>`:""}</li>`).join("")}</ul>`:`<span class="hint">${mine?"Coletáveis, missões paralelas, troféus, builds para testar…":"Nada anotado."}</span>`}
    ${mine?`<div class="actions"><input id="todo-new" maxlength="120" placeholder="Ex.: 3 corações de vida no Templo do Fogo" style="flex:1;min-width:180px"><button class="btn small primary" data-act="todoadd">Adicionar</button></div>`:""}</section>`;
}
function fDicas(g,d,mine){
  const sh=g.shots||[];
  return `<section class="box card"><span class="eyebrow">Prints e dicas</span>${g.tips?`<div class="${g.spoiler?"spoiler hidden-sp":""}" ${g.spoiler?'data-act="reveal" role="button" tabindex="0" aria-label="Revelar spoiler"':""}><p class="tiptext">${esc(g.tips)}</p></div>`:""}
    ${sh.length?`<div class="shotgrid">${sh.map(x=>{const path=`players/${g.pid}/shots/${x.id}`;return `<figure class="shot" style="margin:0"><div class="ph">${mimg(path,1,"","Print")}<button class="zoom" data-act="zoom" data-k="${esc(mkey(path,1))}" data-cap="${esc(x.cap||"")}" aria-label="Ampliar print"></button></div>${x.cap?`<figcaption class="cap">${esc(x.cap)}</figcaption>`:""}</figure>`}).join("")}</div>`:""}
    ${!g.tips&&!sh.length?`<span class="hint">Nenhuma dica ou print ainda.</span>`:""}${mine?`<div><button class="btn small" data-act="edit" data-id="${esc(g.gid)}">Editar dicas e prints</button></div>`:""}</section>`;
}
function guideLinks(title){
  const q=encodeURIComponent(title),qq=s=>"https://www.google.com/search?q="+encodeURIComponent(s);
  return [
    ["Wiki do jogo (Fandom)",`https://community.fandom.com/wiki/Special:Search?query=${q}&scope=cross-wiki`,"Personagens, itens, chefes, lore"],
    ["Mapa interativo",qq(`${title} mapa interativo OR "interactive map" site:mapgenie.io OR site:game8.co`),"MapGenie, Game8 e outros"],
    ["Onde achar colecionáveis",qq(`${title} todos os colecionáveis localização`),"Guias de colecionáveis"],
    ["Troféus e conquistas",qq(`${title} trophy guide site:powerpyx.com OR site:psnprofiles.com OR site:trueachievements.com`),"PowerPyx, PSNProfiles, TrueAchievements"],
    ["Detonado em vídeo",`https://www.youtube.com/results?search_query=${encodeURIComponent(title+" detonado")}`,"YouTube"],
    ["Tempo para zerar",`https://howlongtobeat.com/?q=${q}`,"HowLongToBeat"],
    ["Wikipédia",`https://pt.wikipedia.org/w/index.php?search=${q}`,"História e informações do jogo"]
  ];
}
function fGuias(g,d,mine){
  const others=loadComm(g.title).filter(c=>c.pid!==g.pid).flatMap(c=>(c.d.links||[]).map(l=>({...l,p:c.p})));
  const mineL=d.links||[];
  return `<div class="fgrid2"><section class="box card"><span class="eyebrow">Atalhos</span><h3>Guias, mapas e wikis</h3><div class="glinks">${guideLinks(g.title).map(([t,u,s])=>`<a class="glink" href="${esc(u)}" target="_blank" rel="noopener noreferrer"><b>${esc(t)} ↗</b><span>${esc(s)}</span></a>`).join("")}</div></section>
    <section class="box card"><span class="eyebrow">Links salvos</span><h3>${mine?"Seus links":"Links de "+esc(g.p.nick)}</h3>
      ${mineL.length?mineL.map((l,i)=>`<div class="lrow"><a href="${esc(safeUrl(l.u))}" target="_blank" rel="noopener noreferrer">${esc(l.t)} ↗</a><span class="hint">${esc(hostOf(l.u))}</span>${mine?`<button class="linkbtn" data-act="linkdel" data-i="${i}" aria-label="Remover">×</button>`:""}</div>`).join(""):`<span class="hint">${mine?"Achou um mapa ou guia bom? Salve aqui para a galera também ver.":"Nenhum link salvo."}</span>`}
      ${mine?`<div class="fgrid"><div class="field"><label for="lk-t">Nome</label><input id="lk-t" maxlength="60" placeholder="Ex.: Mapa dos colecionáveis"></div><div class="field"><label for="lk-u">Link</label><input id="lk-u" type="url" maxlength="400" placeholder="https://..."></div></div><div><button class="btn small primary" data-act="linkadd">Salvar link</button></div>`:""}
      ${others.length?`<div class="sec" style="margin-top:8px"><h4>Links da galera</h4>${others.map(l=>`<div class="lrow">${glyph(l.p,true)}<a href="${esc(safeUrl(l.u))}" target="_blank" rel="noopener noreferrer">${esc(l.t)} ↗</a><span class="hint">${esc(hostOf(l.u))}</span></div>`).join("")}</div>`:""}</section></div>`;
}

/* ---------- "Joguei agora": registrar sessão ---------- */
function openSession(gid){
  const m=me();const g=m?.games?.[gid];if(!g)return;
  M={type:"session",gid,status:g.status==="quero"?"jogando":g.status,shot:null};
  $("#modal").innerHTML=overlay(`<h2>Joguei agora · ${esc(g.title)}</h2>
    <div class="field"><label for="ss-txt">O que você fez / onde parou</label><textarea id="ss-txt" maxlength="1000" placeholder="Ex.: derrotei o chefe da ponte, parei no acampamento antes da caverna">${""}</textarea></div>
    <div class="field"><label for="ss-next">Próximo objetivo</label><input id="ss-next" maxlength="120" value="${esc(g.next||"")}" placeholder="Ex.: pegar a chave azul no norte do mapa"></div>
    <div class="fgrid"><div class="field"><label for="ss-fase">Fase / área / capítulo</label><input id="ss-fase" maxlength="80" value="${esc(g.fase||"")}"></div>
      <div class="field"><label for="ss-prog">Progresso: <b id="ss-progv">${Number(g.progress)||0}%</b></label><input id="ss-prog" type="range" min="0" max="100" step="5" value="${Number(g.progress)||0}"></div>
      <div class="field"><label for="ss-h">Horas desta sessão</label><input id="ss-h" type="number" min="0" max="24" step="0.5" placeholder="Ex.: 2"></div></div>
    <div class="field"><span class="flabel">Status</span>${pickRow("status",[["jogando","Continuo jogando"],["pausado","Pausei"],["zerado","Zerei!"],["platinado","Platinei!"],["dropado","Larguei"]].map(([v,l])=>({v,l,cls:"s-"+v,style:"color:var(--on-pill)"})),M.status)}</div>
    <div class="field"><span class="flabel">Print (opcional)</span><div class="actions"><label class="btn small" for="ss-shot">Escolher print</label><input id="ss-shot" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden><span class="hint" id="ss-shotname"></span></div></div>
    <div class="err" id="sserr"></div>
    <div class="mfoot"><div class="r"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button type="button" class="btn primary" data-act="sessave">Salvar sessão</button></div></div>`);
  $("#ss-txt").focus();
}
async function saveSession(){
  const gid=M.gid;const m=me();const g=m?.games?.[gid];if(!g)return;
  const txt=$("#ss-txt").value.trim(),next=$("#ss-next").value.trim(),fase=$("#ss-fase").value.trim();
  let prog=Number($("#ss-prog").value)||0;const h=Math.max(0,Math.min(24,Number($("#ss-h").value)||0));const st=M.status;
  if(!txt&&!next&&!M.shot&&!h){$("#sserr").textContent="Escreva ao menos o que fez ou o próximo objetivo.";return}
  if(st==="zerado"||st==="platinado")prog=100;
  const entry={id:newId("e"),at:Date.now(),txt:txt.slice(0,1000),next:next.slice(0,120),fase:fase.slice(0,80),h};
  try{
    if(M.shot){const sid=newId("s");const sp=`players/${S.myId}/shots/${sid}`;await S.db.doc(sp).set({img:M.shot,gid});media[mkey(sp,1)]=M.shot;entry.shot=sid}
    const fp=fichaPath(S.myId,gid);const sn=await S.db.doc(fp).get();const cur=(sn.exists&&sn.data())||{};
    cur.diary=[...(cur.diary||[]),entry].slice(-300);if(txt)cur.note=txt.slice(0,1000);cur.next=next;cur.updatedAt=Date.now();
    await S.db.doc(fp).set(cur);if(S.ficha?.key===S.myId+"/"+gid)S.ficha.data=cur;
    await saveMe(p=>{const x=p.games[gid];if(!x)return;x.fase=fase;x.next=next.slice(0,120);if(txt)x.lastNote=txt.slice(0,160);x.progress=prog;x.hours=Math.round(((Number(x.hours)||0)+h)*10)/10;
      if(x.status!==st){x.status=st;if(st==="zerado"||st==="platinado")x.year=x.year||YEAR}x.updatedAt=Date.now()});
    closeModal();toast(st==="zerado"?"Zerou! Que tal dar nota e escrever o que achou?":st==="platinado"?"Platinou! Parabéns!":"Sessão salva");
    if(st==="zerado"||st==="platinado")setTimeout(()=>openGame(gid),400);
  }catch(err){$("#sserr").textContent=errMsg(err)}
}

/* ---------- cliques da ficha ---------- */
document.addEventListener("click",async e=>{
  const el=e.target.closest("[data-act]");if(!el)return;const a=el.dataset.act;
  if(a==="ftab"){S.saveTab=el.dataset.id;renderViewKeep();return}
  if(a==="session"){if(S.mode==="live"&&me()&&S.canWrite)openSession(el.dataset.id);return}
  if(a==="sessave"&&M?.type==="session"){el.disabled=true;await saveSession();el.disabled=false;return}
  if(a==="plot"){const t=el.dataset.t,k=norm(t);plotMemo[k]="…";renderViewKeep();
    try{plotMemo[k]=(await wikiPlot(t,el.dataset.w))||{none:true,url:`https://pt.wikipedia.org/w/index.php?search=${encodeURIComponent(t)}`}}catch{plotMemo[k]="erro"}renderViewKeep();return}
  if(a==="ctlkey"){const i=$("#ctl-b");if(i){i.value=(i.value+el.dataset.k).slice(0,30);i.focus()}return}
  const f=S.ficha;if(!f||f.pid!==S.myId||S.mode!=="live")return;
  const done=p=>p.catch(err=>toast(errMsg(err)));
  if(a==="lore"){done(saveFicha(d=>{d.lore=$("#lore-text").value.slice(0,5000)}).then(()=>toast("Anotações salvas")));return}
  if(a==="ctladd"){const ac=$("#ctl-a").value.trim(),b=$("#ctl-b").value.trim();if(!ac||!b){toast("Preencha a ação e o botão");return}
    done(saveFicha(d=>{d.ctlFam=$("#ctl-fam").value;d.controls=[...(d.controls||[]),{a:ac.slice(0,40),b:b.slice(0,30)}].slice(0,60)}));return}
  if(a==="ctldel"){const i=Number(el.dataset.i);done(saveFicha(d=>{d.controls=(d.controls||[]).filter((_,j)=>j!==i)}));return}
  if(a==="ctlcopy"){const src=(comm[norm(players()[f.pid]?.games?.[f.gid]?.title||"")]||[]).find(c=>c.pid===el.dataset.pid);if(!src)return;
    done(saveFicha(d=>{d.ctlFam=src.d.ctlFam||d.ctlFam;const have=new Set((d.controls||[]).map(x=>norm(x.a)));d.controls=[...(d.controls||[]),...(src.d.controls||[]).filter(x=>!have.has(norm(x.a)))].slice(0,60)}).then(()=>toast("Cola copiada")));return}
  if(a==="todoadd"){const t=$("#todo-new").value.trim();if(!t)return;done(saveFicha(d=>{d.todo=[...(d.todo||[]),{t:t.slice(0,120),d:false}].slice(0,200)}));return}
  if(a==="tododel"){const i=Number(el.dataset.i);done(saveFicha(d=>{d.todo=(d.todo||[]).filter((_,j)=>j!==i)}));return}
  if(a==="linkadd"){const t=$("#lk-t").value.trim(),u=safeUrl($("#lk-u").value.trim());if(!t||!u){toast("Coloque um nome e um link que comece com https://");return}
    done(saveFicha(d=>{d.links=[...(d.links||[]),{t:t.slice(0,60),u}].slice(0,40)}).then(()=>toast("Link salvo")));return}
  if(a==="linkdel"){const i=Number(el.dataset.i);done(saveFicha(d=>{d.links=(d.links||[]).filter((_,j)=>j!==i)}));return}
  if(a==="diarydel"){if(el.dataset.confirm!=="1"){el.dataset.confirm="1";el.textContent="confirmar?";return}const id=el.dataset.id;
    const ent=(f.data?.diary||[]).find(x=>x.id===id);done(saveFicha(d=>{d.diary=(d.diary||[]).filter(x=>x.id!==id)}).then(()=>{if(ent?.shot)S.db.doc(`players/${S.myId}/shots/${ent.shot}`).delete().catch(()=>{})}));return}
});
document.addEventListener("change",async e=>{
  const t=e.target;
  if(t.dataset?.todo!==undefined&&S.ficha?.pid===S.myId){const i=Number(t.dataset.todo);saveFicha(d=>{if(d.todo?.[i])d.todo[i].d=t.checked}).catch(err=>toast(errMsg(err)));return}
  if(t.id==="ctl-fam"&&S.ficha?.pid===S.myId){saveFicha(d=>{d.ctlFam=t.value}).catch(()=>{});return}
  if(t.id==="ss-shot"&&M?.type==="session"){const f=t.files[0];t.value="";if(!f)return;try{M.shot=await fileToImg(f,1280,190000);$("#ss-shotname").textContent="Print pronto ✓"}catch{$("#sserr").textContent="Não consegui ler essa imagem."}}
});
document.addEventListener("input",e=>{if(e.target.id==="ss-prog"){const v=$("#ss-progv");if(v)v.textContent=e.target.value+"%"}});

/* ================== v3: Quadro da galera (avisos, convites, enquetes) ================== */
const BTYPES={aviso:"Aviso",evento:"Convite para jogar",enquete:"Enquete"};
const DEMO_BOARD=[
  {id:"b1",type:"aviso",title:"Bem-vindos ao Zerados da Galera!",text:"Criem o perfil, cadastrem o que estão jogando e usem o \"Joguei agora\" sempre que pararem de jogar.",pinned:true,by:"d1",at:T(2)},
  {id:"b2",type:"evento",title:"Noite de Hades II",text:"Bora trocar build e ver quem chega mais longe.",ev:{game:"Hades II",when:new Date(Date.now()+2*864e5).toISOString().slice(0,16),where:"Discord · Jogatina 1",slots:6},by:"d1",at:T(10)},
  {id:"b3",type:"enquete",title:"Qual o jogo do clube de dezembro?",poll:{opts:["Silksong","Balatro","Astro Bot"],multi:false},by:"d1",at:T(12)}];
const DEMO_RESP={b2:{d2:{rsvp:"vou"},d3:{rsvp:"talvez"}},b3:{d2:{vote:[0]},d3:{vote:[1]},d1:{vote:[0]}}};
const boardList = () => (S.mode==="demo"?DEMO_BOARD:(S.board||[])).slice().sort((a,b)=>(!!b.pinned-!!a.pinned)||(b.at||0)-(a.at||0));
const respOf = id => S.mode==="demo"?(DEMO_RESP[id]||{}):(S.resp?.[id]||{});
function ensureResp(id){
  if(S.mode!=="live"||!S.db)return;S.respSubs=S.respSubs||{};if(S.respSubs[id])return;
  S.respSubs[id]=S.db.collection(`board/${id}/resp`).onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=d.data()||{}});S.resp={...(S.resp||{}),[id]:o};softRender()},()=>{});
}
function fmtWhen(iso){const d=new Date(iso);if(isNaN(d))return "";const dias=Math.round((new Date(d.toDateString())-new Date(new Date().toDateString()))/864e5);
  const hh=d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});const dt=d.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"2-digit"});
  return `${dt} às ${hh}${dias===0?" · hoje":dias===1?" · amanhã":dias>1?` · em ${dias} dias`:" · já passou"}`}
function calLink(b){const d=new Date(b.ev?.when);if(isNaN(d))return "";const e=new Date(d.getTime()+2*3600e3);const f=x=>x.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(b.title)}&dates=${f(d)}/${f(e)}&details=${encodeURIComponent((b.text||"")+"\n\nZerados da Galera")}&location=${encodeURIComponent(b.ev?.where||"")}`}
function boardCard(b,compact){
  ensureResp(b.id);const R=respOf(b.id);const mid=meId();const mine=mid?R[mid]:null;const by=players()[b.by];
  const thread=commentsFor("quadro-"+b.id);const open=S.boardOpen===b.id;
  let body="";
  if(b.type==="evento"){const vai=Object.entries(R).filter(([,r])=>r.rsvp==="vou").map(([u])=>u),tal=Object.entries(R).filter(([,r])=>r.rsvp==="talvez").map(([u])=>u);
    const slots=Number(b.ev?.slots)||0;const cheio=slots&&vai.length>=slots;
    body=`<div class="evrow">${b.ev?.game?coverBox({title:b.ev.game,coverUrl:b.ev.coverUrl},"mini"):""}<div><b>${esc(b.ev?.game||"")}</b><div class="hint">${esc(fmtWhen(b.ev?.when))}${b.ev?.where?` · ${esc(b.ev.where)}`:""}${slots?` · ${vai.length}/${slots} vagas`:""}</div></div></div>
      <div class="rsvp">${[["vou","Vou"],["talvez","Talvez"],["nao","Não vou"]].map(([v,l])=>`<button class="rx" data-act="rsvp" data-id="${esc(b.id)}" data-v="${v}" aria-pressed="${mine?.rsvp===v}" ${cheio&&v==="vou"&&mine?.rsvp!=="vou"?"disabled":""}>${l}${v==="vou"&&vai.length?` <b>${vai.length}</b>`:v==="talvez"&&tal.length?` <b>${tal.length}</b>`:""}</button>`).join("")}
        ${calLink(b)?`<a class="linkbtn" href="${esc(calLink(b))}" target="_blank" rel="noopener">Adicionar à agenda</a>`:""}</div>
      ${vai.length?`<div class="who-list">${vai.map(u=>players()[u]?glyph(players()[u],true):"").join("")}<span class="hint" style="margin-left:8px">${vai.map(u=>esc(players()[u]?.nick||"")).filter(Boolean).join(", ")} ${vai.length>1?"vão":"vai"}</span></div>`:""}`}
  else if(b.type==="enquete"){const opts=b.poll?.opts||[];const tot=Object.values(R).filter(r=>Array.isArray(r.vote)&&r.vote.length).length;const cnt=opts.map((_,i)=>Object.values(R).filter(r=>Array.isArray(r.vote)&&r.vote.includes(i)).length);
    const fechada=b.poll?.until&&new Date(b.poll.until)<new Date();
    body=`<div class="poll">${opts.map((o,i)=>{const pct=tot?Math.round(cnt[i]/tot*100):0;const on=mine?.vote?.includes(i);return `<button class="popt${on?" on":""}" data-act="pvote" data-id="${esc(b.id)}" data-i="${i}" ${fechada?"disabled":""} aria-pressed="${!!on}"><i style="width:${pct}%"></i><span>${esc(o)}</span><b>${pct}%</b></button>`}).join("")}</div>
      <div class="hint">${tot} voto${tot===1?"":"s"}${b.poll?.multi?" · pode escolher mais de uma":""}${b.poll?.until?` · ${fechada?"encerrada":"até "+esc(new Date(b.poll.until).toLocaleDateString("pt-BR"))}`:""}</div>`}
  return `<article class="box bcard t-${esc(b.type)}"><div class="bhead"><span class="btype">${esc(BTYPES[b.type]||"Aviso")}</span>${b.pinned?`<span class="tag">fixado</span>`:""}<span class="hint">${by?nk(by)+" · ":""}${ago(b.at)}</span>
      ${isStaff()?`<span class="bacts"><button class="linkbtn" data-act="bpin" data-id="${esc(b.id)}">${b.pinned?"desafixar":"fixar"}</button><button class="linkbtn" data-act="bedit" data-id="${esc(b.id)}">editar</button><button class="linkbtn" data-act="bdel" data-id="${esc(b.id)}">apagar</button></span>`:""}</div>
    <h3>${esc(b.title)}</h3>${b.text?`<p class="btext">${esc(compact&&b.text.length>220?b.text.slice(0,220)+"…":b.text)}</p>`:""}${body}
    <div><button class="cbtn" data-act="bthread" data-id="${esc(b.id)}">${thread.length?`${thread.length} resposta${thread.length>1?"s":""}`:"Responder"}</button></div>
    ${open?`<div class="thread">${thread.map(c=>{const p=players()[c.by];if(!p)return "";const can=S.mode==="live"&&(c.by===meId()||S.isOwner);return `<div class="cmt">${glyph(p)}<div class="bubble"><div class="meta2"><b>${nk(p)}</b><span>${ago(c.at)}</span>${can?`<button class="linkbtn" data-act="cdel" data-cid="${esc(c.cid)}" data-by="${esc(c.by)}">apagar</button>`:""}</div><p>${esc(c.x)}</p></div></div>`}).join("")}
      ${me()&&S.canWrite?`<div class="composer"><label class="flabel" for="cmt-text">Sua resposta</label><textarea id="cmt-text" maxlength="600"></textarea><div><button class="btn small primary" data-act="csend" data-t="${esc("quadro-"+b.id)}">Enviar</button></div></div>`:`<span class="hint">Entre para responder.</span>`}</div>`:""}
  </article>`;
}
function viewQuadro(){
  const L=boardList().filter(b=>!S.boardType||b.type===S.boardType);
  return `<div class="page"><div class="tierhead"><div style="flex:1"><span class="eyebrow">Quadro da galera</span><h3>Avisos, convites e enquetes</h3><span class="hint">Publicados pelo dono e pelos moderadores. Responda, confirme presença e vote.</span></div>
    ${isStaff()?`<div class="actions"><button class="btn small primary" data-act="bnew" data-t="aviso">+ Aviso</button><button class="btn small" data-act="bnew" data-t="evento">+ Convite</button><button class="btn small" data-act="bnew" data-t="enquete">+ Enquete</button></div>`:""}</div>
    <div class="tierpick" role="group" aria-label="Filtrar"><button data-act="btype" data-id="" aria-pressed="${!S.boardType}">Tudo</button>${Object.entries({aviso:"Avisos",evento:"Convites",enquete:"Enquetes"}).map(([k,l])=>`<button data-act="btype" data-id="${k}" aria-pressed="${S.boardType===k}">${l}</button>`).join("")}</div>
    ${L.length?`<div class="bgrid">${L.map(b=>boardCard(b)).join("")}</div>`:emptyBox("!","Nada no quadro ainda",isStaff()?"Publique um aviso, chame a galera para jogar ou abra uma enquete.":"Quando a staff publicar avisos, convites ou enquetes, eles aparecem aqui.")}</div>`;
}
function openBoard(type,id){
  const b=id?boardList().find(x=>x.id===id):null;type=b?.type||type;M={type:"board",btype:type,id:b?.id||null,multi:!!b?.poll?.multi};
  const opts=b?.poll?.opts||["",""];
  $("#modal").innerHTML=overlay(`<h2>${b?"Editar":"Novo"}: ${esc(BTYPES[type])}</h2>
    <div class="field"><label for="bd-title">Título</label><input id="bd-title" maxlength="100" value="${esc(b?.title||"")}" placeholder="${type==="evento"?"Ex.: Noite de coop no sábado":type==="enquete"?"Ex.: Qual o jogo do clube do mês?":"Ex.: Novidades no site"}"></div>
    <div class="field"><label for="bd-text">${type==="enquete"?"Explicação (opcional)":"Texto"}</label><textarea id="bd-text" maxlength="1500">${esc(b?.text||"")}</textarea></div>
    ${type==="evento"?`<div class="fgrid"><div class="field"><label for="bd-game">Jogo</label><input id="bd-game" maxlength="80" value="${esc(b?.ev?.game||"")}" placeholder="Ex.: Hades II"></div>
      <div class="field"><label for="bd-when">Dia e hora</label><input id="bd-when" type="datetime-local" value="${esc(b?.ev?.when||"")}"></div>
      <div class="field"><label for="bd-where">Onde</label><input id="bd-where" maxlength="80" value="${esc(b?.ev?.where||"")}" placeholder="Ex.: Discord · Jogatina 1, party da PSN"></div>
      <div class="field"><label for="bd-slots">Vagas (opcional)</label><input id="bd-slots" type="number" min="0" max="100" value="${esc(b?.ev?.slots||"")}"></div></div>`:""}
    ${type==="enquete"?`<div class="field"><span class="flabel">Opções (2 a 8)</span><div id="bd-opts">${opts.map((o,i)=>`<input class="bd-opt" maxlength="80" value="${esc(o)}" placeholder="Opção ${i+1}">`).join("")}</div><div><button type="button" class="btn small ghost" data-act="boptadd">+ Opção</button></div></div>
      <div class="fgrid"><label class="chk"><input type="checkbox" id="bd-multi" ${b?.poll?.multi?"checked":""}> Pode votar em mais de uma</label><div class="field"><label for="bd-until">Encerra em (opcional)</label><input id="bd-until" type="date" value="${esc(b?.poll?.until||"")}"></div></div>`:""}
    <label class="chk"><input type="checkbox" id="bd-pin" ${b?.pinned?"checked":""}> Fixar no topo</label>
    <div class="err" id="bderr"></div>
    <div class="mfoot"><div class="r"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button type="button" class="btn primary" data-act="bsave">Publicar</button></div></div>`);
  $("#bd-title").focus();
}
document.addEventListener("click",async e=>{
  const el=e.target.closest("[data-act]");if(!el)return;const a=el.dataset.act;
  if(a==="btype"){S.boardType=el.dataset.id;renderViewKeep();return}
  if(a==="bthread"){S.boardOpen=S.boardOpen===el.dataset.id?"":el.dataset.id;renderViewKeep();return}
  if(a==="boptadd"){const box=$("#bd-opts");if(box&&box.children.length<8){box.insertAdjacentHTML("beforeend",`<input class="bd-opt" maxlength="80" placeholder="Opção ${box.children.length+1}">`)}return}
  if(a==="rsvp"||a==="pvote"){
    if(S.mode!=="live"){toast("No modo exemplo nada é salvo");return}if(!me()||!S.canWrite){toast("Entre para participar");return}
    const id=el.dataset.id;const b=boardList().find(x=>x.id===id);if(!b)return;const cur=clone(respOf(id)[S.myId]||{});
    if(a==="rsvp"){cur.rsvp=cur.rsvp===el.dataset.v?"":el.dataset.v}
    else{const i=Number(el.dataset.i);let v=Array.isArray(cur.vote)?cur.vote.slice():[];if(b.poll?.multi){v=v.includes(i)?v.filter(x=>x!==i):[...v,i]}else{v=v[0]===i?[]:[i]}cur.vote=v}
    cur.at=Date.now();S.resp={...(S.resp||{}),[id]:{...respOf(id),[S.myId]:cur}};renderViewKeep();
    queue(()=>S.db.doc(`board/${id}/resp/${S.myId}`).set(cur)).catch(err=>toast(errMsg(err)));return}
  if(!isStaff())return;
  if(a==="bnew"){openBoard(el.dataset.t);return}
  if(a==="bedit"){openBoard(null,el.dataset.id);return}
  if(a==="bpin"){const b=boardList().find(x=>x.id===el.dataset.id);if(!b)return;try{await S.db.doc(`board/${b.id}`).update({pinned:!b.pinned});toast(b.pinned?"Desafixado":"Fixado no topo")}catch(err){toast(errMsg(err))}return}
  if(a==="bdel"){if(el.dataset.confirm!=="1"){el.dataset.confirm="1";el.textContent="confirmar?";return}try{await S.db.doc(`board/${el.dataset.id}`).delete();toast("Apagado")}catch(err){toast(errMsg(err))}return}
  if(a==="bsave"&&M?.type==="board"){
    const title=$("#bd-title").value.trim();if(!title){$("#bderr").textContent="Dê um título.";return}
    const prev=M.id?boardList().find(x=>x.id===M.id):null;
    const doc={type:M.btype,title:title.slice(0,100),text:$("#bd-text").value.trim().slice(0,1500),pinned:$("#bd-pin").checked,by:prev?.by||S.myId,at:prev?.at||Date.now(),updatedAt:Date.now()};
    if(M.btype==="evento"){const when=$("#bd-when").value;if(!when){$("#bderr").textContent="Escolha o dia e a hora.";return}
      const game=$("#bd-game").value.trim();doc.ev={game:game.slice(0,80),when,where:$("#bd-where").value.trim().slice(0,80),slots:Math.max(0,Math.min(100,Number($("#bd-slots").value)||0)),coverUrl:prev?.ev?.coverUrl||""};
      const g=allGames().find(x=>norm(x.title)===norm(game));if(g&&extImg(g.coverUrl))doc.ev.coverUrl=g.coverUrl;
      else if(game&&!doc.ev.coverUrl){try{const r=await wikiSearch(game);if(r[0]?.img)doc.ev.coverUrl=r[0].img}catch{}}}
    if(M.btype==="enquete"){const opts=[...document.querySelectorAll(".bd-opt")].map(i=>i.value.trim()).filter(Boolean).slice(0,8);if(opts.length<2){$("#bderr").textContent="Coloque pelo menos 2 opções.";return}
      doc.poll={opts:opts.map(o=>o.slice(0,80)),multi:$("#bd-multi").checked,until:$("#bd-until").value||""}}
    try{await S.db.doc(`board/${M.id||newId("b")}`).set(doc);closeModal();toast(M.id?"Atualizado":"Publicado no quadro")}catch(err){$("#bderr").textContent=errMsg(err)}return}
});

/* ---------- capas automáticas ---------- */
const ROM={"2":"ii","3":"iii","4":"iv","5":"v","6":"vi","7":"vii","8":"viii","9":"ix","10":"x"};
const ckey=t=>norm(String(t||"").replace(/\b(10|[2-9])\b/g,m=>ROM[m]).replace(/^the\s+/i,""));
function coverMatch(title,res){const k=ckey(title);if(k.length<3)return null;
  for(const r of res){const w=ckey(r.title);if(!r.img)continue;if(w===k)return r}
  for(const r of res){const w=ckey(r.title);if(!r.img||w.length<3)continue;
    const a=w.includes(k)?k:k.includes(w)?w:null;if(a&&a.length>=Math.max(5,0.5*Math.max(w.length,k.length)))return r}
  // palavras parecidas (aceita um erro de digitação por palavra), só nos 3 primeiros resultados
  const qw=cwords(title);if(qw.length<2)return null;
  for(const r of res.slice(0,3)){if(!r.img)continue;const rw=cwords(r.title);if(rw.length>qw.length+2)continue;
    if(qw.every(q=>rw.some(x=>x===q||(q.length>=5&&lev1(q,x)))))return r}
  return null}
const cwords=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/'/g,"").replace(/\b(10|[2-9])\b/g,m=>ROM[m]).split(/[^a-z0-9]+/).filter(w=>w&&!["the","of","and","a","bros"].includes(w));
function lev1(a,b){if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,d=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}if(++d>1)return false;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++}}return d+(a.length-i)+(b.length-j)<=1}
const coverMemo={};
async function findCover(title){const k=ckey(title);if(k in coverMemo)return coverMemo[k];
  let r=null;try{r=coverMatch(title,await wikiSearch(String(title).replace(/\b(10|[2-9])\b/g,m=>ROM[m].toUpperCase())))||coverMatch(title,await wikiSearch(title))}catch(e){throw e}
  coverMemo[k]=r?{img:r.img,wtitle:r.wtitle}:null;return coverMemo[k]}
let fillBusy=false;
async function fillCovers(all){if(fillBusy||!S.canWrite||!S.myId)return{done:0,miss:0,fail:true};fillBusy=true;let done=0,miss=0,fail=false;
  try{const pids=all&&S.isOwner?Object.keys(S.players):[S.myId];
    for(const pid of pids){const p=S.players[pid];if(!p)continue;const found={};
      for(const [gid,g] of Object.entries(p.games||{})){if(g.coverV||extImg(g.coverUrl))continue;
        try{const c=await findCover(g.title);if(c){found[gid]=c;done++}else miss++}catch{fail=true;break}}
      if(fail)break;
      if(Object.keys(found).length){
        await queue(async()=>{const cur=clone(S.players[pid]);delete cur._id;
          for(const [gid,c] of Object.entries(found))if(cur.games?.[gid]&&!cur.games[gid].coverV&&!extImg(cur.games[gid].coverUrl)){cur.games[gid].coverUrl=c.img;cur.games[gid].wtitle=c.wtitle}
          S.players[pid]={...cur,_id:pid};softRender();await S.db.doc("players/"+pid).set(cur)})}
    }}finally{fillBusy=false}
  return{done,miss,fail}}

/* ---------- escrita ---------- */
let chain=Promise.resolve();
function queue(fn){const p=chain.then(fn,fn);chain=p.catch(()=>{});return p}
function saveMe(mut,opt={}){return queue(async()=>{
  const cur=clone(S.players[S.myId]||{games:{}});delete cur._id;mut(cur);cur.updatedAt=Date.now();
  if(!opt.noDay){cur.days=cur.days||{};const t=today();cur.days[t]=(cur.days[t]||0)+1;const lim=dkey(new Date(Date.now()-400*864e5));for(const k of Object.keys(cur.days))if(k<lim)delete cur.days[k]}
  delete cur._id;S.players[S.myId]={...cur,_id:S.myId};renderAll();await S.db.doc("players/"+S.myId).set(cur);
})}
function flattenComments(){const out=[];for(const [uid,d] of Object.entries(S.comDocs||{}))for(const [cid,c] of Object.entries(d.items||{}))if(c&&typeof c.x==="string"&&typeof c.t==="string")out.push({cid,by:uid,t:c.t,x:c.x.slice(0,600),at:Number(c.at)||0});S.comments=out}
function saveDocOf(col,uid,mut,prune){return queue(async()=>{
  const store=col==="comments"?S.comDocs:S.chat;const cur=clone(store[uid]||{});mut(cur);
  if(prune&&cur[prune]){const ks=Object.entries(cur[prune]).sort((a,b)=>(b[1].at||0)-(a[1].at||0));if(ks.length>400)cur[prune]=Object.fromEntries(ks.slice(0,400))}
  store[uid]=cur;if(col==="comments")flattenComments();renderAll();await S.db.doc(`${col}/${uid}`).set(cur);
})}
function errMsg(e){return e?.code==="permission-denied"||e?.code==="permission_denied"?"Sem permissão. Se você acabou de confirmar o e-mail, saia e entre de novo na sua conta.":"Não foi possível salvar agora. Tente de novo em instantes."}
const newId = p => p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function addToList(title,status){if(!me()||!S.canWrite){toast("Crie seu perfil primeiro");return}
  if(Object.values(me().games||{}).some(g=>norm(g.title)===norm(title))){toast("Esse jogo já está na sua lista");return}
  saveMe(p=>{p.games=p.games||{};p.games[newId("g")]={title,status,platform:platsOf(p)[0]||"",year:null,fase:"",progress:0,hours:0,nota:null,tier:"",comment:"",rec:false,updatedAt:Date.now()}}).then(()=>toast(status==="quero"?"Adicionado na sua fila":"Adicionado à sua lista")).catch(e=>toast(errMsg(e)))}

/* ---------- formulários ---------- */
document.addEventListener("submit",async e=>{
  e.preventDefault();const id=e.target.id;
  if(id==="authform"){submitAuth();return}
  if(id==="pform"){
    const nick=$("#p-nick").value.trim();if(!nick){$("#perr").textContent="Escolha um apelido.";return}
    if(Object.entries(S.players).some(([pid,p])=>pid!==S.myId&&pslug(p)===slug(nick))){$("#perr").textContent="Já tem alguém com esse apelido. Escolha outro.";return}
    try{
      let avV,bnV;
      if(typeof M.avatar==="string"){await S.db.doc(`players/${S.myId}/media/avatar`).set({img:M.avatar});avV=Date.now();media[mkey(`players/${S.myId}/media/avatar`,avV)]=M.avatar}
      else if(M.avatar===null){S.db.doc(`players/${S.myId}/media/avatar`).delete().catch(()=>{});avV=null}
      if(typeof M.banner==="string"){await S.db.doc(`players/${S.myId}/media/banner`).set({img:M.banner});bnV=Date.now();media[mkey(`players/${S.myId}/media/banner`,bnV)]=M.banner}
      else if(M.banner===null){S.db.doc(`players/${S.myId}/media/banner`).delete().catch(()=>{});bnV=null}
      const gl=Number($("#p-goal").value);const ns={...M.ns,bold:$("#p-bold").checked};const isNew=!S.players[S.myId];
      await saveMe(p=>{if(avV!==undefined)p.avatarV=avV;if(bnV!==undefined)p.bannerV=bnV;p.nick=nick;p.nameStyle=ns;p.plats=M.plats.slice();p.plat=M.plats[0]||"";p.goal=gl>0?Math.min(365,Math.round(gl)):null;
        p.fav=$("#p-fav").value.trim();p.title=$("#p-title").value.trim();p.mood=$("#p-mood").value.trim();p.bio=$("#p-bio").value.trim();p.showcase=(M.show||[]).slice(0,3);
        p.discord=$("#p-discord").value.trim().replace(/^@/,"");p.color=M.color;p.glyph=M.glyph;p.games=p.games||{};p.friends=friendsOf(p)});
      closeModal();toast("Perfil salvo");if(isNew||S.view==="perfil")go("perfil-"+slug(nick));
    }catch(err){$("#perr").textContent=errMsg(err)}
  }
  if(id==="sform"){
    const v=$("#s-discord").value.trim();
    if(v&&!/^https:\/\/(discord\.gg|discord\.com\/invite)\/[\w-]+\/?$/.test(v)){$("#serr").textContent="Cole um convite no formato https://discord.gg/xxxx";return}
    const wid=$("#s-widget").value.trim();
    if(wid&&!/^\d{15,22}$/.test(wid)){$("#serr").textContent="O ID do servidor tem só números (15 a 22 dígitos).";return}
    const c=clone(S.config||{});c.discord=v;c.discordWidget=wid;
    const cht=$("#s-ch-t").value.trim();
    if(!cht)delete c.challenge;else{const prev=c.challenge;c.challenge={id:prev&&prev.title===cht?prev.id:newId("c"),title:cht,desc:$("#s-ch-d").value.trim(),until:$("#s-ch-u").value||"",at:prev&&prev.title===cht?prev.at:Date.now()}}
    const clt=$("#s-cl-t").value.trim();
    if(!clt)delete c.club;else{const prev=c.club;c.club={title:clt,until:$("#s-cl-u").value||"",at:prev&&prev.title===clt?prev.at:Date.now()}}
    try{await S.db.doc("config/site").set(c);S.config=c;closeModal();renderAll();toast("Configurações salvas")}catch(err){$("#serr").textContent=errMsg(err)}
  }
  if(id==="chatform"){sendChat()}
  if(id==="gform"){
    const title=$("#g-title").value.trim();if(!title){$("#gerr").textContent="Coloque o nome do jogo.";return}
    const num=(id,min,max)=>{const v=$(id).value;if(v==="")return null;const n=Number(v);return isFinite(n)?Math.max(min,Math.min(max,n)):null};
    const done=M.status==="zerado"||M.status==="platinado";
    const g={title,status:M.status,platform:$("#g-plat").value,year:done?num("#g-year",1970,YEAR):null,lanc:M.status==="quero"?($("#g-lanc").value||""):"",
      fase:$("#g-fase").value.trim(),progress:done?100:(num("#g-prog",0,100)??0),hours:num("#g-hours",0,9999)??0,nota:num("#g-nota",0,10),run:done?M.run:null,tier:M.tier,
      comment:$("#g-com").value.trim(),tips:$("#g-tips").value.trim(),spoiler:$("#g-spoiler").checked,rec:M.rec,updatedAt:Date.now()};
    const gid=M.gid||newId("g");const old=M.gid?S.players[S.myId].games[M.gid]:null;g.coverV=old?.coverV||null;g.coverUrl=extImg(M.coverUrl)||"";const isEdit=!!M.gid;
    try{
      const cpath=`players/${S.myId}/covers/${gid}`;
      if(typeof M.cover==="string"){g.coverV=Date.now();await S.db.doc(cpath).set({img:M.cover});media[mkey(cpath,g.coverV)]=M.cover}
      else if(M.cover===null&&g.coverV){await S.db.doc(cpath).delete();g.coverV=null}
      for(const x of M.shots)if(x.img){const sp=`players/${S.myId}/shots/${x.id}`;await S.db.doc(sp).set({img:x.img,gid});media[mkey(sp,1)]=x.img}
      g.shots=M.shots.map(x=>({id:x.id,cap:x.cap.trim()}));const rm=M.removed.slice();
      await saveMe(p=>{p.games=p.games||{};p.games[gid]=g});
      rm.forEach(sid=>S.db.doc(`players/${S.myId}/shots/${sid}`).delete().catch(()=>{}));
      closeModal();toast(isEdit?"Jogo atualizado":"Jogo adicionado");
    }catch(err){$("#gerr").textContent=errMsg(err)}
  }
});
function sendChat(){
  const t=$("#chat-text");const x=(t?.value||"").trim();if(!x)return;t.value="";S.drafts["chat-text"]="";
  saveDocOf("chat",S.myId,d=>{d.msgs=d.msgs||{};d.msgs[newId("m")]={r:S.room,x:x.slice(0,800),at:Date.now()}},"msgs").catch(e=>{toast(errMsg(e));if(t)t.value=x});
}

/* ---------- cliques ---------- */
document.addEventListener("click",async e=>{
  const pk=e.target.closest(".pick[data-pick] button");
  if(pk&&M){const name=pk.parentElement.dataset.pick,v=pk.dataset.v;
    if(MULTI.has(name)){const arr=M[name]||(M[name]=[]);const i=arr.indexOf(v);if(i<0){if(name==="show"&&arr.length>=3){toast("Escolha no máximo 3");return}arr.push(v)}else arr.splice(i,1);pk.setAttribute("aria-pressed",i<0);return}
    if(name.startsWith("ns")){const f={nsmode:"mode",nsc1:"c1",nsc2:"c2",nsfont:"font"}[name];M.ns[f]=v;if(name==="nsc1"&&M.ns.mode==="nenhum"){M.ns.mode="cor";document.querySelectorAll('[data-pick="nsmode"] button').forEach(b=>b.setAttribute("aria-pressed",b.dataset.v==="cor"))}}
    else M[name]=name==="rec"?v==="1":v;
    pk.parentElement.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b===pk));
    if(name==="status")syncYear();if(M.type==="profile")syncNamePreview();
    if(name==="color"&&M.type==="profile"){const b=$("#bnprev");if(b)b.style.setProperty("--pc",v)}
    return}
  const el=e.target.closest("[data-act]");if(!el)return;const a=el.dataset.act;
  if(["tierwho","tlpick","tladd","monthly","newsadd","tlsave","tldel","tlclose","tlreopen","vote","newssave","newsdel","newsrc","ftab","session","sessave","plot","ctlkey","lore","ctladd","ctldel","ctlcopy","todoadd","tododel","linkadd","linkdel","diarydel","btype","bthread","boptadd","rsvp","pvote","bnew","bedit","bpin","bdel","bsave"].includes(a))return;
  if(a==="bg"){if(e.target===el)closeModal();return}
  if(a==="close"){closeModal();return}
  if(a==="tips"){openTips(el.dataset.pid,el.dataset.id);return}
  if(a==="auth"){openAuth(el.dataset.m||"entrar");return}
  if(a==="authmode"){openAuth(el.dataset.m);return}
  if(a==="google"){googleLogin();return}
  if(a==="terms"){openTerms();return}
  if(a==="logout"){AUTH&&AUTH.signOut().then(()=>{toast("Até a próxima!");go("inicio")});return}
  if(a==="resend"){AUTH?.currentUser?.sendEmailVerification().then(()=>toast("E-mail reenviado")).catch(e=>toast(authMsg(e)));return}
  if(a==="fillcovers"){const b=$("#fillcov");if(b){b.disabled=true;b.textContent="Buscando…"}
    fillCovers(true).then(r=>{toast(r.fail?"A Wikipédia não respondeu nesta rede. Tente de novo mais tarde (ou pelo celular).":r.done?`${r.done} capa(s) adicionada(s)`+(r.miss?` · ${r.miss} sem capa encontrada`:""):r.miss?`Nenhuma capa nova encontrada (${r.miss} sem correspondência)`:"Todos os jogos já têm capa")}).catch(e=>toast(errMsg(e))).finally(()=>{const b=$("#fillcov");if(b){b.disabled=false;b.textContent="Buscar capas que faltam"}});return}
  if(a==="reloaduser"){const u=AUTH?.currentUser;if(!u)return;u.reload().then(()=>u.getIdToken(true)).then(()=>{onUser(AUTH.currentUser);toast(AUTH.currentUser.emailVerified?"E-mail confirmado!":"Ainda não confirmado. Abra o link do e-mail.")}).catch(e=>toast(authMsg(e)));return}
  if(a==="export"){downloadMyData();return}
  if(a==="delaccount"&&M?.type==="profile"){if(!M.confirmDelAcc){M.confirmDelAcc=true;el.textContent="Tem certeza? Clique de novo para apagar tudo";return}
    el.disabled=true;el.textContent="Apagando…";try{await deleteAccount();closeModal();toast("Conta excluída. Sentiremos sua falta!");go("inicio")}catch(err){$("#perr").textContent=err.message&&!err.code?err.message:authMsg(err);el.disabled=false;el.textContent="Excluir minha conta"}return}
  if(a==="reveal"){el.classList.remove("hidden-sp");el.removeAttribute("data-act");el.removeAttribute("role");return}
  if(a==="zoom"){const v=media[el.dataset.k];if(v&&v.startsWith("data:"))$("#lightbox").innerHTML=`<div class="lightbox" data-act="lbclose"><img src="${v}" alt="${esc(el.dataset.cap||"Print")}">${el.dataset.cap?`<p>${esc(el.dataset.cap)}</p>`:""}</div>`;return}
  if(a==="lbclose"){$("#lightbox").innerHTML="";return}
  if(a==="rmshot"&&M){const x=M.shots.splice(Number(el.dataset.i),1)[0];if(x?.old)M.removed.push(x.id);renderShotEditor();return}
  if(a==="rmcover"&&M){M.cover=null;M.coverUrl="";M.hasUpload=false;$("#cvprev").innerHTML=`<span class="ini">${esc(initials($("#g-title").value||"?"))}</span>`;el.hidden=true;return}
  if(a==="rmavatar"&&M){M.avatar=null;$("#avprev").innerHTML=`<span class="glyph" style="--pc:${esc(M.color)}">${esc(M.glyph)}</span>`;el.hidden=true;return}
  if(a==="rmbanner"&&M){M.banner=null;$("#bnprev").innerHTML="";el.hidden=true;return}
  if(a==="pickgame"){pickGame(Number(el.dataset.i));return}
  if(a==="add"){openGame(null);return}
  if(a==="addtitle"){openGame(null,{title:el.dataset.t});return}
  if(a==="edit"){openGame(el.dataset.id);return}
  if(a==="profile"){openProfile();return}
  if(a==="settings"){openSettings();return}
  if(a==="bell"){openNotifs();return}
  if(a==="find"){openFind();return}
  if(a==="compare"){openCompare(el.dataset.id);return}
  if(a==="retro"){openRetro(el.dataset.id);return}
  if(a==="retronav"&&M?.type==="retro"){M.i+=Number(el.dataset.d);drawRetro();return}
  if(a==="coop"){openCoop();return}
  if(a==="newgroup"){openGroup(null);return}
  if(a==="editgroup"){openGroup(el.dataset.id);return}
  if(a==="report"){openReport(el.dataset.id);return}
  if(a==="clearplayer"){S.f.player="";renderAll();return}
  if(a==="filterplayer"){S.f.player=el.dataset.id;go("estante");return}
  if(a==="feedall"||a==="feedfr"){S.feedFriends=a==="feedfr";renderView();return}
  if(a==="room"){S.chatJump=true;S.room=el.dataset.id;renderView();return}
  if(a==="demo"){S.prevMode=S.mode;S.mode="demo";S.f.player="";renderAll();return}
  if(a==="exitdemo"){S.mode=S.prevMode||"live";S.f.player="";if(["perfil","jogo"].includes(S.view))go("inicio");else renderAll();return}
  if(a==="copy"){const t=el.dataset.text;try{await navigator.clipboard.writeText(t);toast("Copiado")}catch{toast(`Copie: ${t}`)}return}
  if(a==="skin"){try{localStorage.setItem("zg-skin",el.dataset.k)}catch{}renderAll();toast("Tema aplicado");return}
  // daqui pra baixo precisa estar logado e com perfil
  const live=S.mode==="live",m=me();
  if(a==="claim"&&S.seed){const sd=S.seed;
    try{await saveMe(p=>{const keep=p.games||{},keepR=p.reacts;Object.assign(p,clone(sd.player));p.games={...keep,...(p.games||{})};if(keepR)p.reacts=keepR});
      if(Array.isArray(sd.roles)&&sd.roles.length){const cur=new Set([...(S.roles[S.myId]||[]),...sd.roles]);const next={...S.roles,[S.myId]:[...cur]};await S.db.doc("roles/all").set({map:next});S.roles=next}
      S.db.doc("seed/owner").delete().catch(()=>{});S.seed=null;renderAll();toast("Perfil ativado")}catch(err){toast(errMsg(err))}return}
  if(!live){if(["react","quickfila","challenge","joinclub","friend","csend"].includes(a))toast("No modo exemplo nada é salvo");return}
  if(a==="role"){if(!S.isOwner)return;const pid=el.dataset.pid,k=el.dataset.k;const cur=(S.roles[pid]||[]).slice();const i=cur.indexOf(k);if(i<0)cur.push(k);else cur.splice(i,1);const next={...S.roles,[pid]:cur};
    try{await S.db.doc("roles/all").set({map:next});S.roles=next;renderAll();toast("Cargos atualizados")}catch(err){toast(errMsg(err))}return}
  if(a==="cdel"){const by=el.dataset.by,cid=el.dataset.cid;if(by!==S.myId&&!S.isOwner)return;saveDocOf("comments",by,d=>{if(d.items)delete d.items[cid]}).then(()=>toast("Comentário apagado")).catch(e=>toast(errMsg(e)));return}
  if(a==="mdel"){const by=el.dataset.by,mid=el.dataset.id;if(by!==S.myId&&!S.isOwner)return;saveDocOf("chat",by,d=>{if(d.msgs)delete d.msgs[mid]}).catch(e=>toast(errMsg(e)));return}
  if(!m||!S.canWrite){toast("Crie seu perfil primeiro");return}
  if(a==="react"){const k=rkey(el.dataset.pid,el.dataset.id),r=el.dataset.r;const src=players()[el.dataset.pid]?.games?.[el.dataset.id];let added=false;
    try{await saveMe(p=>{p.reacts=p.reacts||{};const cur=reactsOf(p.reacts[k]);const arr=cur.r.slice();const i=arr.indexOf(r);if(i<0){arr.push(r);added=true}else arr.splice(i,1);if(arr.length)p.reacts[k]={r:arr,at:Date.now()};else delete p.reacts[k];
      if(r==="fila"&&added&&src&&!Object.values(p.games||{}).some(g=>norm(g.title)===norm(src.title))){p.games=p.games||{};p.games[newId("g")]={title:src.title,status:"quero",platform:"",year:null,fase:"",progress:0,hours:0,nota:null,tier:"",comment:"",rec:false,updatedAt:Date.now()}}});
      toast(r==="fila"&&added?"Adicionado na sua fila":"Reação salva")}catch(err){toast(errMsg(err))}return}
  if(a==="quickfila"){addToList(el.dataset.t,"quero");return}
  if(a==="joinclub"){const t=cfg().club?.title;if(t)openGame(null,{title:t,status:"jogando"});return}
  if(a==="played"){const gid=el.dataset.id;saveMe(p=>{if(p.games?.[gid])p.games[gid].updatedAt=Date.now()}).then(()=>toast("Anotado! Bora atualizar a fase?")).catch(e=>toast(errMsg(e)));return}
  if(a==="challenge"){const ch=cfg().challenge;if(!ch)return;saveMe(p=>{p.challenges=p.challenges||{};if(p.challenges[ch.id])delete p.challenges[ch.id];else p.challenges[ch.id]={at:Date.now()}}).then(()=>toast(m.challenges?.[ch.id]?"Desfeito":"Desafio cumprido! +100 XP")).catch(e=>toast(errMsg(e)));return}
  if(a==="friend"){const o=el.dataset.id;const st=friendState(S.myId,o);
    saveMe(p=>{const f=friendsOf(p);if(st==="amigos"||st==="enviado")delete f[o];else f[o]=Date.now();p.friends=f},{noDay:true})
      .then(()=>{toast({amigos:"Amizade desfeita",enviado:"Pedido cancelado",recebido:"Agora vocês são amigos",nada:"Pedido de amizade enviado"}[st]);if(M?.type==="find")drawFind($("#find-q")?.value||"");if(M?.type==="notifs")openNotifs()}).catch(e=>toast(errMsg(e)));return}
  if(a==="block"){const o=el.dataset.id;saveMe(p=>{const b=new Set(Array.isArray(p.blocked)?p.blocked:[]);if(b.has(o))b.delete(o);else b.add(o);p.blocked=[...b]},{noDay:true}).then(()=>toast(blockedBy(S.myId).has(o)?"Bloqueado: você não verá mais comentários e mensagens dessa pessoa":"Desbloqueado")).catch(e=>toast(errMsg(e)));return}
  if(a==="csend"){const t=$("#cmt-text");const x=(t?.value||"").trim();if(!x)return;S.drafts["cmt-text"]="";
    saveDocOf("comments",S.myId,d=>{d.items=d.items||{};d.items[newId("c")]={t:el.dataset.t,x:x.slice(0,600),at:Date.now()}},"items").then(()=>toast("Comentário publicado")).catch(err=>{toast(errMsg(err));const t2=$("#cmt-text");if(t2)t2.value=x});return}
  if(a==="coopsave"){const t=$("#coop-g").value;const n=$("#coop-n").value.trim();saveMe(p=>{p.coop={title:t,note:n,at:Date.now()}}).then(()=>{closeModal();toast("Pedido publicado no Início")}).catch(e=>toast(errMsg(e)));return}
  if(a==="coopclear"){saveMe(p=>{delete p.coop},{noDay:true}).then(()=>{closeModal();toast("Pedido removido")}).catch(e=>toast(errMsg(e)));return}
  if(a==="repsend"&&M?.type==="report"){const x=$("#rep-x").value.trim();const target=M.pid,why=M.why;
    try{const cur=clone(S.myReports||{items:{}});cur.items=cur.items||{};cur.items[newId("r")]={target,why,x:x.slice(0,300),at:Date.now()};await S.db.doc(`reports/${S.myId}`).set(cur);S.myReports=cur;closeModal();toast("Denúncia enviada ao dono do site")}catch(err){toast(errMsg(err))}return}
  if(a==="grpsave"&&M?.type==="group"){const name=$("#grp-n").value.trim();if(!name){$("#grperr").textContent="Dê um nome ao grupo.";return}const rid=M.rid||newId("g-");const mem=M.members.filter(x=>players()[x]);
    saveDocOf("chat",S.myId,d=>{d.rooms=d.rooms||{};d.rooms[rid]={name,members:mem,at:d.rooms[rid]?.at||Date.now()}}).then(()=>{closeModal();S.room=rid;if(S.view!=="chat")go("chat");else renderView()}).catch(err=>{$("#grperr").textContent=errMsg(err)});return}
  if(a==="leavegroup"){const rid=el.dataset.id;saveDocOf("chat",S.myId,d=>{d.left=d.left||{};d.left[rid]=true}).then(()=>{S.room="geral";renderView();toast("Você saiu do grupo")}).catch(e=>toast(errMsg(e)));return}
  if(a==="del"&&M?.type==="game"){
    if(!M.confirmDel){M.confirmDel=true;el.textContent="Confirmar exclusão";return}
    const gid=M.gid;const old=S.players[S.myId].games[gid];const shots=(old?.shots||[]).map(x=>x.id);
    try{await saveMe(p=>{delete p.games[gid];if(p.showcase)p.showcase=p.showcase.filter(x=>x!==gid)});shots.forEach(sid=>S.db.doc(`players/${S.myId}/shots/${sid}`).delete().catch(()=>{}));S.db.doc(`players/${S.myId}/covers/${gid}`).delete().catch(()=>{});closeModal();toast("Jogo removido")}catch(err){$("#gerr").textContent=errMsg(err)}
  }
});

/* ---------- digitação e arquivos ---------- */
document.addEventListener("input",e=>{
  const t=e.target;
  if(t.id==="g-title"&&M?.type==="game")onTitleInput(t.value);
  if(t.id==="find-q")drawFind(t.value);
  if(t.id==="p-nick")syncNamePreview();
  if(t.id==="chat-text"||t.id==="cmt-text")S.drafts[t.id]=t.value;
  const i=t.dataset?.cap;if(i!==undefined&&M?.shots?.[i])M.shots[i].cap=t.value;
});
document.addEventListener("keydown",e=>{
  if(e.target.id==="chat-text"&&e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();return}
  if((e.key==="Enter"||e.key===" ")&&e.target.dataset?.act==="reveal"){e.preventDefault();e.target.click();return}
  if(e.key==="Escape"){if($("#lightbox").innerHTML){$("#lightbox").innerHTML="";return}if(M)closeModal()}
});
document.addEventListener("change",async e=>{
  const t=e.target;
  if(t.id==="p-bold"){syncNamePreview();return}
  if(t.id==="p-import"&&M?.type==="profile"){const f=t.files[0];t.value="";if(!f)return;
    try{await importBackup(f);closeModal();toast("Backup importado!")}catch(err){$("#perr").textContent=err.message||"Não consegui importar esse arquivo."}return}
  if(t.id==="cmp-a"||t.id==="cmp-b"){M[t.id==="cmp-a"?"a":"b"]=t.value;drawCompare();return}
  if(t.id==="p-avatar"&&M?.type==="profile"){const f=t.files[0];t.value="";if(!f)return;try{const d=await fileToImg(f,0,60000,{w:256,h:256});M.avatar=d;$("#avprev").innerHTML=`<span class="glyph" style="--pc:${esc(M.color)}"><img src="${d}" alt=""></span>`;$("#rmavatar").hidden=false}catch{$("#perr").textContent="Não consegui ler essa imagem."}return}
  if(t.id==="p-banner"&&M?.type==="profile"){const f=t.files[0];t.value="";if(!f)return;try{const d=await fileToImg(f,0,170000,{w:1200,h:400});M.banner=d;$("#bnprev").innerHTML=`<img class="bimg" src="${d}" alt="">`;$("#rmbanner").hidden=false}catch{$("#perr").textContent="Não consegui ler essa imagem."}return}
  if(t.id==="g-shots"&&M){const files=[...t.files].slice(0,6-M.shots.length);t.value="";$("#gerr").textContent="";
    for(const f of files){try{const d=await fileToImg(f,1280,190000);M.shots.push({id:newId("s"),cap:"",img:d})}catch{$("#gerr").textContent="Alguma imagem não pôde ser lida."}}renderShotEditor();return}
  if(t.id==="g-cover"&&M){const f=t.files[0];t.value="";if(!f)return;try{const d=await fileToImg(f,420,180000);M.cover=d;$("#cvprev").innerHTML=`<img src="${d}" alt="">`;$("#rmcover").hidden=false}catch{$("#gerr").textContent="Não consegui ler essa imagem."}return}
});
$("#q").addEventListener("input",e=>{S.f.q=e.target.value;renderView()});
["status","platform","sort"].forEach(k=>$("#"+k).addEventListener("change",e=>{S.f[k]=e.target.value;renderView()}));
$("#yearBtn").textContent=`Zerados em ${YEAR}`;
document.querySelectorAll("#scope button").forEach(b=>b.addEventListener("click",()=>{S.f.scope=b.dataset.scope;document.querySelectorAll("#scope button").forEach(x=>x.setAttribute("aria-pressed",x===b));renderView()}));

/* ---------- rotas ---------- */
function route(h){
  h=(h??location.hash.slice(1))||"";try{h=decodeURIComponent(h)}catch{}
  if(VIEWS.includes(h)||h==="jogando"){S.view=h;S.route=""}else if(h.startsWith("save-")){S.view="save";S.route=h.slice(5)}else if(h.startsWith("perfil-")){S.view="perfil";S.route=h.slice(7)}else if(h.startsWith("jogo-")){S.view="jogo";S.route=h.slice(5)}else{S.view="inicio";S.route=""}
  if(M)closeModal();renderAll();try{window.scrollTo({top:0})}catch{}
}
function go(h){if(location.hash.slice(1)===h){route(h);return}try{location.hash=h}catch{route(h)}}
window.addEventListener("hashchange",()=>route());


/* ---------- boot (Firebase) ---------- */
S.drafts={};S.comDocs={};S.chat={};
route();
let chatUnsub=null,repUnsub=null;
function onUser(u){
  S.myId=u?u.uid:null;S.email=u?.email||"";
  const google=!!u&&(u.providerData||[]).some(p=>p.providerId==="google.com");
  S.canWrite=!!u&&(u.emailVerified||google);
  S.isOwner=!!u&&!!CFG.ownerUid&&u.uid===CFG.ownerUid;
  if(chatUnsub){chatUnsub();chatUnsub=null;S.chat={}}
  if(repUnsub){repUnsub();repUnsub=null;S.reports={}}
  if(u&&S.canWrite){
    chatUnsub=S.db.collection("chat").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=d.data()||{}});S.chat=o;softRender()},()=>{});
    if(S.isOwner)repUnsub=S.db.collection("reports").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=d.data()||{}});S.reports=o},()=>{});
    else S.db.doc(`reports/${u.uid}`).get().then(sn=>{S.myReports=(sn.exists&&sn.data())||{items:{}}}).catch(()=>{});
  }
  if(S.mode!=="demo"&&S.mode!=="loading")S.mode="live";
  renderAll();
  if(u&&S.canWrite&&S.loaded&&!S.players[u.uid]&&!M)openProfile();
  autoCovers();
}
let autoCovDone=false;function autoCovers(){if(autoCovDone||!S.canWrite||!S.loaded||!S.myId||!S.players[S.myId])return;autoCovDone=true;setTimeout(()=>fillCovers(false).then(r=>{if(r.done)toast(`${r.done} capa(s) encontrada(s) para seus jogos`)}).catch(()=>{}),2500)}
let vbusy=false;function refreshVerify(){const u=AUTH&&AUTH.currentUser;if(!u||vbusy)return;vbusy=true;
  u.reload().then(()=>AUTH.currentUser.emailVerified?AUTH.currentUser.getIdToken(true).then(()=>{onUser(AUTH.currentUser);toast("E-mail confirmado! Pode criar seu perfil.")}):null).catch(()=>{}).finally(()=>{vbusy=false})}
let rt=null;function softRender(){clearTimeout(rt);rt=setTimeout(()=>{if(S.mode==="live")renderAll()},80)}
(function boot(){
  if(!window.firebase||!CFG.firebase||!CFG.firebase.apiKey){S.notConfigured=true;S.mode="offline";renderAll();return}
  try{firebase.initializeApp(CFG.firebase)}catch(e){}
  const fs=firebase.firestore();try{fs.settings({ignoreUndefinedProperties:true,merge:true})}catch{}
  AUTH=firebase.auth();AUTH.languageCode="pt";
  const isPerm=e=>e?.code==="permission-denied"||e?.code==="permission_denied";
  // Se o e-mail foi confirmado depois do login, o "crachá" (token) antigo ainda diz "não confirmado".
  // Em caso de permissão negada, renova o crachá e tenta de novo uma vez.
  const retry=fn=>fn().catch(async e=>{const u=AUTH&&AUTH.currentUser;if(!isPerm(e)||!u)throw e;
    try{await u.reload();await u.getIdToken(true)}catch{throw e}
    if(!S.canWrite&&AUTH.currentUser.emailVerified)onUser(AUTH.currentUser);return fn()});
  const wrap=r=>({set:(d,o)=>retry(()=>o?r.set(d,o):r.set(d)),update:d=>retry(()=>r.update(d)),delete:()=>retry(()=>r.delete()),get:(...a)=>r.get(...a),onSnapshot:(...a)=>r.onSnapshot(...a)});
  S.db={doc:p=>wrap(fs.doc(p)),collection:p=>fs.collection(p)};
  fs.doc("roles/all").onSnapshot(sn=>{const d=sn.exists&&sn.data();S.roles=(d&&d.map&&typeof d.map==="object")?d.map:{};softRender()},()=>{});
  fs.doc("config/site").onSnapshot(sn=>{S.config=(sn.exists&&sn.data())||{};softRender()},()=>{});
  fs.collection("board").onSnapshot(sn=>{S.board=sn.docs.map(d=>({id:d.id,...(d.data()||{})}));softRender()},()=>{});
  fs.collection("tierlists").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=d.data()||{}});S.tierlists=o;softRender()},()=>{});
  fs.collection("news").onSnapshot(sn=>{S.news=sn.docs.map(d=>({id:d.id,...(d.data()||{})}));softRender()},()=>{});
  fs.collection("comments").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=d.data()||{}});S.comDocs=o;flattenComments();softRender()},()=>{});
  let timer=setTimeout(()=>{S.stale=true;if(S.mode==="loading")S.mode="live";renderAll()},10000);
  fs.collection("players").onSnapshot(snap=>{
    const P={};snap.docs.forEach(d=>{const v=d.data();if(v&&v.nick)P[d.id]={...v,_id:d.id,games:v.games||{}}});S.players=P;
    if(!snap.metadata.fromCache){clearTimeout(timer);S.stale=false}
    const first=!S.loaded;S.loaded=true;
    if(S.mode==="loading")S.mode="live";else if(S.mode==="demo")S.prevMode="live";
    renderAll();
    const u=AUTH.currentUser;if(first&&u&&S.canWrite&&!P[u.uid]&&!M)openProfile();
    if(first)autoCovers();
  },()=>{clearTimeout(timer);if(S.mode!=="demo")S.mode=Object.keys(S.players).length?"live":"offline";S.stale=true;renderAll()});
  fetch("news.json?t="+Math.floor(Date.now()/600000),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{if(j&&Array.isArray(j.itens)){S.autoNews=j;softRender()}}).catch(()=>{});
  fetch("covers.json?t="+Math.floor(Date.now()/600000),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{if(j&&j.capas&&typeof j.capas==="object"){S.covers=j.capas;softRender()}}).catch(()=>{});
  AUTH.getRedirectResult().catch(()=>{});
  AUTH.onAuthStateChanged(u=>{onUser(u);if(u&&!S.canWrite)refreshVerify()});
  // Quem confirmou o e-mail em outra aba: ao voltar para o site, atualiza sozinho.
  window.addEventListener("focus",()=>{const u=AUTH.currentUser;if(u&&!S.canWrite)refreshVerify()});
})();
