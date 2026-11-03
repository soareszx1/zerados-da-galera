
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
const VIEWS = ["inicio","estante","tierlist","jogando","dicas","chat","ranking"];
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
const extImg = u => (typeof u==="string"&&u.startsWith("https://media.rawg.io/"))?u:"";
const coverBox = (g,cls="") => {const up=g.pid&&g.coverV?mimg(`players/${g.pid}/covers/${g.gid}`,g.coverV,"cimg","Capa de "+g.title):"";const ext=!up&&extImg(g.coverUrl)?`<img class="cimg" src="${esc(g.coverUrl)}" alt="Capa de ${esc(g.title)}" loading="lazy" referrerpolicy="no-referrer">`:"";return `<div ${coverAttrs(g.title,cls)}>${up||ext}<span class="ini">${esc(initials(g.title))}</span></div>`};
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
  const labels={inicio:"Início",estante:"Estante",tierlist:"Tier List",jogando:"Jogando agora",dicas:"Dicas",chat:"Chat",ranking:"Ranking"};
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
  const fn={inicio:viewHome,estante:viewEstante,tierlist:viewTier,jogando:viewJogando,dicas:viewDicas,chat:viewChat,ranking:viewRanking,perfil:viewPerfil,jogo:viewJogo}[S.view]||viewHome;
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
  // mural
  const fr=m?new Set([...friendIds(mid),mid]):null;const bl=m?blockedBy(mid):new Set();
  const feed=feedItems().filter(f=>!bl.has(f.p?._id)&&(!S.feedFriends||!fr||fr.has(f.p?._id))).slice(0,18);
  left+=`<section class="box card"><span class="eyebrow">Mural da galera</span><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3>O que rolou</h3>${m?`<div class="seg"><button data-act="feedall" aria-pressed="${!S.feedFriends}">Todos</button><button data-act="feedfr" aria-pressed="${!!S.feedFriends}">Amigos</button></div>`:""}</div>
    <div class="feed">${feed.map(f=>`<div class="fitem">${f.p?glyph(f.p,true):""}<div class="tx"><a href="#perfil-${esc(pslug(f.p))}" style="text-decoration:none"><b>${nk(f.p)}</b></a> ${f.html}</div><span class="when">${ago(f.at)}</span></div>`).join("")||'<span class="hint">Nada ainda.</span>'}</div></section>`;
  // direita
  const ids=Object.keys(P).sort((a,b)=>xpOf(b)-xpOf(a));
  right+=`<section class="box card"><span class="eyebrow">A galera</span><h3>${ids.length} jogador${ids.length>1?"es":""}</h3><div class="galera">${ids.map(galeraRow).join("")}</div>${m&&S.canWrite?`<div><button class="btn small" data-act="find">Procurar e adicionar amigos</button></div>`:""}</section>`;
  if(m){const rs=recsFor(mid);right+=`<section class="box card"><span class="eyebrow">Pra você</span><h3>A galera acha que você vai curtir</h3>
    ${rs.length?rs.map(r=>`<div class="rec-item">${coverBox(r.g,"mini")}<div class="t"><b><a href="#jogo-${esc(slug(r.title))}" style="color:inherit">${esc(r.title)}</a></b>${r.by.map(b=>`${esc(b.p.nick)}${typeof b.nota==="number"?" ("+fmtNota(b.nota)+")":""}`).join(", ")} curti${r.by.length>1?"ram":"u"}</div><button class="rx" data-act="quickfila" data-t="${esc(r.title)}">+ Fila</button></div>`).join(""):'<span class="hint">Dê nota nos seus jogos para as sugestões ficarem certeiras.</span>'}</section>`}
  const coops=Object.entries(P).filter(([,p])=>p.coop&&p.coop.title&&daysSince(p.coop.at)<15);
  right+=`<section class="box card"><span class="eyebrow">Procurando coop</span><h3>Bora jogar junto</h3>
    ${coops.length?coops.map(([pid,p])=>`<div class="rec-item">${glyph(p)}<div class="t"><b>${nk(p)} · ${esc(p.coop.title)}</b>${esc(p.coop.note||"")}${p.discord?` · Discord: <code>${esc(p.discord)}</code>`:""}</div>${p.discord?`<button class="rx" data-act="copy" data-text="${esc(p.discord)}">Copiar</button>`:""}</div>`).join(""):'<span class="hint">Ninguém procurando parceiro agora.</span>'}
    ${m&&S.canWrite?`<div><button class="btn small" data-act="coop">${m.coop&&daysSince(m.coop.at)<15?"Editar meu pedido":"Quero parceiro"}</button></div>`:""}</section>`;
  const want={};allGames().filter(g=>g.status==="quero").forEach(g=>{const k=norm(g.title);const w=want[k]||(want[k]={title:g.title,lanc:"",ps:[],g});w.ps.push(g.p);if(g.lanc&&(!w.lanc||g.lanc<w.lanc))w.lanc=g.lanc});
  const wl=Object.values(want).sort((a,b)=>{const da=daysUntil(a.lanc),db=daysUntil(b.lanc);return (da===null?9e9:da<0?8e9:da)-(db===null?9e9:db<0?8e9:db)||b.ps.length-a.ps.length}).slice(0,6);
  right+=`<section class="box card"><span class="eyebrow">Na fila da galera</span><h3>Lançamentos e desejos</h3>
    ${wl.length?wl.map(w=>{const d=daysUntil(w.lanc);return `<div class="rec-item">${coverBox(w.g,"mini")}<div class="t"><b><a href="#jogo-${esc(slug(w.title))}" style="color:inherit">${esc(w.title)}</a></b>${w.ps.map(p=>esc(p.nick)).join(", ")}</div><div class="count">${d===null?"–":d>0?d:d===0?"Hoje":"Saiu"}<small>${d===null?"sem data":d>0?"dias":""}</small></div></div>`}).join(""):'<span class="hint">Marque jogos como “Na fila” e coloque a data de lançamento para aparecer a contagem regressiva.</span>'}</section>`;
  right+=`<section class="box card"><span class="eyebrow">Em breve</span><h3>Vem aí</h3><ul class="soon">
    <li>Bot no Discord avisando quando alguém zera</li><li>Mensagens privadas</li><li>Notificações no celular</li><li>Mande sua ideia no chat #geral</li></ul></section>`;
  return `<div class="home"><div class="col">${left}</div><div class="col">${right}</div></div>`;
}

/* ---------- ESTANTE / TIER / JOGANDO / DICAS ---------- */
function viewEstante(){const L=filtered();return L.length?`<div class="grid">${L.map(gameCard).join("")}</div>`:emptyBox("?","Nada por aqui",allGames().length?"Nenhum jogo bate com esses filtros.":"Ainda não tem nenhum jogo cadastrado.")}
function viewTier(){
  const L=filtered();
  const rows=[...TIERS,""].map(t=>{const items=L.filter(g=>(g.tier||"")===t);const byT={};items.forEach(g=>{const k=norm(g.title);(byT[k]||(byT[k]={title:g.title,ps:[],gs:[]})).ps.push(g.p);byT[k].gs.push(g)});
    const chips=Object.values(byT).map(c=>`<a class="chip" href="#jogo-${esc(slug(c.title))}" style="color:inherit;text-decoration:none">${coverBox(c.gs.find(x=>x.coverV)||c.gs[0],"mini")}<span class="ct">${esc(c.title)}</span><span class="dots">${c.ps.map(p=>glyph(p,true)).join("")}</span></a>`).join("");
    if(!t&&!chips)return "";return `<div class="trow"><div class="tlabel t-${t||"N"}">${t||"?"}</div><div class="titems">${chips||'<span class="empty-row">vazio</span>'}</div></div>`}).join("");
  return `<section class="box tierlist" aria-label="Tier list">${rows}</section>`;
}
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
        ${reactRow(g)}</div><span class="nota">${fmtNota(g.nota)}<small>/10</small></span></div>`).join("")||'<span class="hint">Ninguém cadastrou ainda.</span>'}
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
        <button type="button" class="btn small ghost" data-act="rmcover" ${curCover?"":"hidden"} id="rmcover">Remover capa</button><span class="hint">Ao escolher o jogo na lista, a capa vem sozinha. Também dá para enviar a sua.</span></div></div></div>
      <div class="field full"><span class="flabel">Status</span>${pickRow("status",Object.entries(STATUS).map(([v,o])=>({v,l:o.l,cls:"s-"+v,style:"color:var(--on-pill)"})),M.status)}</div>
      <div class="field"><label for="g-plat">Plataforma em que jogou</label><select id="g-plat">${plOpts.map(p=>`<option${p===(g?.platform||myPl[0]||"PC")?" selected":""}>${esc(p)}</option>`).join("")}</select></div>
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
  const can=!!rawgKey();drawSugg(q,null,can&&q.length>=3);if(!can||q.length<3)return;
  suggT=setTimeout(async()=>{const ctl=new AbortController();suggCtl=ctl;
    const prompt=`Você é um catálogo de videogames. Alguém está digitando o nome de um jogo num formulário: "${q.slice(0,60)}".
Liste até 6 jogos reais (lançados ou já anunciados) que provavelmente correspondem ao que a pessoa quer, do mais provável ao menos provável. Considere erros de digitação, abreviações, nomes em português e números de sequência.
Para cada um, dê o nome oficial exatamente como aparece nas lojas, o ano de lançamento (ou null se não lançado) e as plataformas, usando somente estes nomes: ${PLATFORMS.filter(x=>x!=="Outro").join(", ")}.
Responda somente com JSON neste formato: [{"title":"...","year":2024,"platforms":["PC","PS5"]}]. Se nada fizer sentido, responda [].`;
    try{const arr=await rawgSearch(q,ctl.signal);
      suggMemo[key]=arr;if(M?.type==="game"&&norm($("#g-title")?.value||"")===key)drawSugg(q,arr);
    }catch(e){if(ctl.signal.aborted)return;if(M?.type==="game")drawSugg(q,[])}
  },450);
}
function pickGame(i){const x=M?.sugg?.[i];if(!x)return;$("#g-title").value=x.title;$("#sugg").innerHTML="";const mine=platsOf(me()||{});const best=(x.platforms||[]).find(p=>mine.includes(p))||(x.platforms||[])[0];const sel=$("#g-plat");if(best&&sel&&[...sel.options].some(o=>o.value===best))sel.value=best;const pv=$("#cvprev");if(pv&&typeof M.cover!=="string"&&!M.hasUpload){if(x.img){M.coverUrl=x.img;pv.innerHTML=`<img src="${esc(x.img)}" alt="" referrerpolicy="no-referrer">`;const rb=$("#rmcover");if(rb)rb.hidden=false}else pv.innerHTML=`<span class="ini">${esc(initials(x.title))}</span>`}}

function openSettings(){
  M={type:"settings"};const c=S.config;const ch=c.challenge||{},cl=c.club||{};
  const reps=[];for(const [uid,d] of Object.entries(S.reports||{}))for(const [rid,r] of Object.entries(d.items||{}))reps.push({uid,rid,...r});
  reps.sort((a,b)=>(b.at||0)-(a.at||0));
  $("#modal").innerHTML=overlay(`<h2>Painel do dono</h2>
    <div class="field"><label for="s-discord">Convite do servidor do Discord</label><input id="s-discord" maxlength="120" value="${esc(c.discord||"")}" placeholder="https://discord.gg/seu-convite"><span class="hint">Use um convite que não expira (Convidar pessoas → Editar link → Nunca).</span></div>
    <div class="field"><label for="s-rawg">Chave do RAWG (capas e nomes automáticos)</label><input id="s-rawg" maxlength="64" autocomplete="off" value="${esc(S.config.rawgKey||"")}" placeholder="Cole aqui a chave de rawg.io/apidocs"><span class="hint">É gratuita. Depois de salvar, as sugestões com capa aparecem ao adicionar um jogo.</span></div>
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
    <p style="margin:0"><b>Onde fica.</b> Os dados ficam no Firebase (Google). O site é hospedado no GitHub Pages. Capas e nomes de jogos vêm do RAWG.</p>
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
function errMsg(e){return e?.code==="permission-denied"||e?.code==="permission_denied"?"Você não tem permissão para isso. Confirme seu e-mail ou entre de novo.":"Não foi possível salvar agora. Tente de novo em instantes."}
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
    const rk=$("#s-rawg").value.trim();
    if(rk&&!/^[A-Za-z0-9]{20,64}$/.test(rk)){$("#serr").textContent="A chave do RAWG parece incompleta. Copie de novo em rawg.io/apidocs.";return}
    const c=clone(S.config||{});c.discord=v;c.rawgKey=rk;
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
  if(a==="bg"){if(e.target===el)closeModal();return}
  if(a==="close"){closeModal();return}
  if(a==="tips"){openTips(el.dataset.pid,el.dataset.id);return}
  if(a==="auth"){openAuth(el.dataset.m||"entrar");return}
  if(a==="authmode"){openAuth(el.dataset.m);return}
  if(a==="google"){googleLogin();return}
  if(a==="terms"){openTerms();return}
  if(a==="logout"){AUTH&&AUTH.signOut().then(()=>{toast("Até a próxima!");go("inicio")});return}
  if(a==="resend"){AUTH?.currentUser?.sendEmailVerification().then(()=>toast("E-mail reenviado")).catch(e=>toast(authMsg(e)));return}
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
  if(VIEWS.includes(h)){S.view=h;S.route=""}else if(h.startsWith("perfil-")){S.view="perfil";S.route=h.slice(7)}else if(h.startsWith("jogo-")){S.view="jogo";S.route=h.slice(5)}else{S.view="inicio";S.route=""}
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
}
let rt=null;function softRender(){clearTimeout(rt);rt=setTimeout(()=>{if(S.mode==="live")renderAll()},80)}
(function boot(){
  if(!window.firebase||!CFG.firebase||!CFG.firebase.apiKey){S.notConfigured=true;S.mode="offline";renderAll();return}
  try{firebase.initializeApp(CFG.firebase)}catch(e){}
  const fs=firebase.firestore();try{fs.settings({ignoreUndefinedProperties:true,merge:true})}catch{}
  AUTH=firebase.auth();AUTH.languageCode="pt";
  S.db={doc:p=>fs.doc(p),collection:p=>fs.collection(p)};
  fs.doc("roles/all").onSnapshot(sn=>{const d=sn.exists&&sn.data();S.roles=(d&&d.map&&typeof d.map==="object")?d.map:{};softRender()},()=>{});
  fs.doc("config/site").onSnapshot(sn=>{S.config=(sn.exists&&sn.data())||{};softRender()},()=>{});
  fs.collection("comments").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=d.data()||{}});S.comDocs=o;flattenComments();softRender()},()=>{});
  let timer=setTimeout(()=>{S.stale=true;if(S.mode==="loading")S.mode="live";renderAll()},10000);
  fs.collection("players").onSnapshot(snap=>{
    const P={};snap.docs.forEach(d=>{const v=d.data();if(v&&v.nick)P[d.id]={...v,_id:d.id,games:v.games||{}}});S.players=P;
    if(!snap.metadata.fromCache){clearTimeout(timer);S.stale=false}
    const first=!S.loaded;S.loaded=true;
    if(S.mode==="loading")S.mode="live";else if(S.mode==="demo")S.prevMode="live";
    renderAll();
    const u=AUTH.currentUser;if(first&&u&&S.canWrite&&!P[u.uid]&&!M)openProfile();
  },()=>{clearTimeout(timer);if(S.mode!=="demo")S.mode=Object.keys(S.players).length?"live":"offline";S.stale=true;renderAll()});
  AUTH.getRedirectResult().catch(()=>{});
  AUTH.onAuthStateChanged(onUser);
})();
