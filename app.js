
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
  streamer:{l:"Streamer",c:"#9B5DE5",d:"Faz live dos jogos"},
  completista:{l:"Completista",c:"#2EC27E",d:"Só larga com 100%"},
  veterano:{l:"Veterano",c:"var(--st-drop)",d:"Joga desde o Atari"},
  novato:{l:"Novato",c:"var(--st-pause)",d:"Chegou agora"}
};
const RX = {gg:{l:"GG",t:"Mandou bem"},hype:{l:"Hype",t:"Fiquei com vontade"},fila:{l:"+ Fila",t:"Quero jogar também"}};
const GLYPHS = ["▲","●","■","✖","★","◆","♥","⚡"];
const COLORS = ["#FF4D6D","#FF9F1C","#E9C400","#2EC27E","#16A3C7","#3D5AFE","#9B5DE5","#F15BB5"];
const VIEWS = ["inicio","saves","quadro","pessoas","estante","tierlist","novidades","promocoes","dicas","chat","ranking"];
const SKINS = {padrao:{l:"Padrão",lv:1,sw:"#FF3B6B"},neon:{l:"Neon",lv:3,sw:"#00C98D"},gameboy:{l:"Game Boy",lv:5,sw:"#6E8F0B"},ouro:{l:"Ouro",lv:8,sw:"#D99A00"},vapor:{l:"Vaporwave",lv:12,sw:"#FF4FD8"}};
const LEVEL_NAMES = [[30,"Imortal"],[25,"Titã"],[20,"Mito"],[16,"Mestre"],[12,"Lenda"],[8,"Herói"],[5,"Veterano"],[3,"Aventureiro"],[1,"Novato"]];

const S = {
  mode:"loading", players:{}, comments:[], myComDoc:null, myId:null, canWrite:false, db:null, user:null, sample:null,
  view:"inicio", route:"", f:{player:"",scope:"all",q:"",status:"",platform:"",sort:"recent"},
  stale:false, roles:{}, config:{}, isOwner:false, rx:{}, rar:{}
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
const coverBox = (g,cls="") => {const up=g.pid&&g.coverV?mimg(`players/${g.pid}/covers/${g.gid}`,g.coverV,"cbg","")+mimg(`players/${g.pid}/covers/${g.gid}`,g.coverV,"cimg","Capa de "+g.title):"";const loc=!up&&localCover(g.title);const sapp=g.steamApp||(typeof infoAppid==="function"?infoAppid(g.title):null);const src=loc||(typeof steamCover==="function"&&sapp?steamCover(sapp):"")||extImg(g.coverUrl);
  const ext=!up&&src?`<img class="cbg" src="${esc(src)}" alt="" aria-hidden="true" loading="lazy" referrerpolicy="no-referrer"><img class="cimg" src="${esc(src)}" alt="Capa de ${esc(g.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.querySelectorAll('img').forEach(i=>i.remove())">`:"";
  return `<div ${coverAttrs(g.title,cls)}>${up||ext}<span class="ini">${esc(initials(g.title))}</span></div>`};
const glyph = (p,sm) => frameWrap(p,sm,`<span class="glyph${sm?" sm":""}" style="--pc:${esc(p?.color||"#888")}" aria-hidden="true">${esc(p?.glyph||"●")}${p?._id?mimg(`players/${p._id}/media/avatar`,p.avatarV,"",""):""}</span>`);
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
  // Equilíbrio (v22): o que você zera ESTE ANO e o que faz no site vale mais que despejar o histórico inteiro de uma vez.
  const p=players()[pid];if(!p)return 0;let x=0;const G=Object.values(p.games||{});
  const proprios=G.filter(g=>!g.imp),imp=G.filter(g=>g.imp);
  x+=Math.min(200,proprios.length)*5+Math.min(300,imp.length)*2;          // estante (importados da Steam valem menos)
  x+=Math.min(5,G.filter(g=>g.status==="jogando").length)*10;              // jogando agora (até 5)
  const D=G.filter(isDone),ano=D.filter(g=>Number(g.year)===YEAR).length,antigos=D.length-ano;
  x+=ano*50+Math.min(40,antigos)*25+Math.max(0,antigos-40)*10;               // zerados: do ano cheio, histórico com retorno menor
  for(const g of G){if(g.status==="platinado")x+=70;if(g.comment)x+=10;if(typeof g.nota==="number")x+=5;if(g.tips)x+=30;x+=Math.min(6,(g.shots||[]).length)*10}
  x+=Math.max(0,Math.min(1e6,Number(p.missXp)||0));const so=socialOf(pid);x+=Math.min(400,so.ggIn)*5+Math.min(400,so.cm)*5+so.chal*100+so.days*5;return x;
}
// Curva: 30·(L−1)^2.2 — nível 5 ≈ 1 semana ativa, 10 ≈ 1 mês, 20 ≈ 4–5 meses, 30 ≈ quase 1 ano jogando e participando todo dia.
const LV_XP = L => Math.round(30*Math.pow(Math.max(0,L-1),2.2));
function levelOf(x){x=Math.max(0,Number(x)||0);let L=Math.floor(Math.pow(x/30,1/2.2))+1;while(LV_XP(L+1)<=x)L++;while(L>1&&LV_XP(L)>x)L--;
  const base=LV_XP(L),next=LV_XP(L+1);return {L,base,next,pct:(x-base)/(next-base)*100,name:(LEVEL_NAMES.find(([n])=>L>=n)||[0,"Novato"])[1]}}
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
function badgesOf(pid){const p=players()[pid];if(!p)return [];const s=stats(p),o=socialOf(pid);return BADGES.filter(b=>b.ok(s,o,pid)).map(b=>({...b,desc:b.d(s,o,pid)}))}
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
  for(const c of comms()){if(c.t.includes("~"))continue;const p=players()[c.by];if(p)out.push({at:c.at,p,html:`comentou em <a href="#jogo-${esc(c.t)}"><b>${esc(titleOf[c.t]||c.t)}</b></a>: “${esc(c.x.slice(0,80))}${c.x.length>80?"…":""}”`})}
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
  for(const c of comms())if(!c.t.includes("~")&&c.by!==pid&&(mySlugs.has(c.t)||talked.has(c.t))&&P[c.by])out.push({at:c.at,p:P[c.by],h:`#jogo-${c.t}`,html:`<b>${esc(P[c.by].nick)}</b> comentou em <b>${esc(titleOf[c.t]||c.t)}</b>: “${esc(c.x.slice(0,70))}”`});
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
  else if(S.stale)B.innerHTML=`<div class="banner"><span>Conexão lenta: os dados podem estar desatualizados.</span></div>`;
  else B.innerHTML="";
}
// navegação: 5 seções principais (barra embaixo no celular), sub-abas dentro de cada uma e chat flutuante
const NAV=[
  {k:"inicio",ic:"🏠",n:"Início",v:["inicio"]},
  {k:"jogos",ic:"🎮",n:"Meus Jogos",v:["saves"],extra:["save"]},
  {k:"galera",ic:"👥",n:"Galera",v:["feed","pessoas","estante","ranking","quadro"],extra:["perfil","jogando"]},
  {k:"tier",ic:"🏆",n:"Tier List",v:["tierlist"]},
  {k:"dicas",ic:"💡",n:"Dicas",v:["dicas"],hl:true},
  {k:"descobrir",ic:"🔥",n:"Descobrir",v:["novidades","promocoes","listas","reviews"],extra:["jogo","lista"]}
];
const SUBN={feed:"Feed",listas:"Listas",reviews:"Reviews",pessoas:"Pessoas",estante:"Jogos da galera",ranking:"Ranking",quadro:"Quadro",novidades:"Novidades",promocoes:"Promoções",dicas:"Dicas"};
const navOf = v => NAV.find(g=>g.v.includes(v)||(g.extra||[]).includes(v));
function renderTabs(){
  const un=S.view==="chat"?0:chatUnread();
  const cur=navOf(S.view);S.navLast=S.navLast||{};if(cur&&cur.v.includes(S.view))S.navLast[cur.k]=S.view;
  $("#tabs").innerHTML=NAV.map(g=>{const on=cur&&cur.k===g.k;const dest=(S.navLast[g.k]&&g.v.includes(S.navLast[g.k]))?S.navLast[g.k]:g.v[0];
    return `<a class="tab${g.hl?" tab-hl":""}" href="#${dest}" ${on?'aria-current="page"':""}><span class="tic" aria-hidden="true">${g.ic}</span><span class="tlb">${g.n}</span></a>`}).join("");
  const sub=$("#subtabs");
  if(sub){const subs=cur&&cur.v.length>1?cur.v:[];
    sub.hidden=!subs.length;
    sub.innerHTML=subs.map(v=>`<a class="subtab" href="#${v}" ${S.view===v?'aria-current="page"':""}>${SUBN[v]||v}</a>`).join("");}
  const fab=$("#chatfab");
  if(fab){fab.hidden=S.view==="chat";fab.innerHTML=`<span aria-hidden="true">💬</span><span class="tlb">Chat</span>${un?`<span class="tabn" aria-label="${un} mensagens novas">${un>9?"9+":un}</span>`:""}`;}
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
  const fn={inicio:viewHome,estante:viewEstante,tierlist:viewTier,jogando:viewJogando,dicas:viewDicas,chat:viewChat,ranking:viewRanking,perfil:viewPerfil,pessoas:viewPessoas,feed:viewFeed,listas:viewListas,lista:viewLista,reviews:viewReviews,moderacao:viewModeracao,jogo:viewJogo,novidades:viewNovidades,promocoes:viewPromocoes,saves:viewSaves,save:viewSave,quadro:viewQuadro}[S.view]||viewHome;
  const log0=$("#chatlog");const nearBottom=!log0||log0.scrollHeight-log0.scrollTop-log0.clientHeight<80;const focused=document.activeElement?.id;
  // guarda o que a pessoa está digitando: a tela é redesenhada quando chegam dados novos e o texto não pode sumir
  const keep={};let caret=null;
  V.querySelectorAll("input[id],textarea[id]").forEach(el=>{if(el.type==="file"||el.type==="checkbox"||el.type==="radio")return;if(el.value)keep[el.id]=el.value;if(el.id===focused){try{caret=[el.selectionStart,el.selectionEnd]}catch{}}});
  V.innerHTML=fn();
  for(const [id,v] of Object.entries(keep)){const el=document.getElementById(id);if(el&&V.contains(el)&&!el.value)el.value=v}
  for(const id of ["chat-text","cmt-text"]){const el=document.getElementById(id);if(el&&S.drafts?.[id]&&!el.value){el.value=S.drafts[id]}}
  if(focused){const el=document.getElementById(focused);if(el&&V.contains(el)){el.focus({preventScroll:true});try{const n=el.value?.length||0;el.setSelectionRange(caret?caret[0]:n,caret?caret[1]:n)}catch{}}}
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
      ${cont.length?`<div class="cont">${cont.map(g=>`<div class="citem">${coverBox(g,"mini")}<div class="t"><a href="#${saveHash(g.pid,g.gid)}"><b>${esc(g.title)}</b></a><span>${esc(paradoEm(g)||"sem anotação")}${g.next?` · próximo: ${esc(g.next)}`:""}</span><span class="hint">${g.updatedAt>1e9?quando(g.updatedAt):""}</span></div>${S.canWrite?`<button class="btn small primary" data-act="session" data-id="${esc(g.gid)}">Joguei agora</button>`:""}</div>`).join("")}</div>`:'<span class="hint">Nada sendo jogado agora.</span>'}</section>`}
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
  const tlk=Object.keys(tierlists()).filter(k=>!k.includes("~")).sort().reverse()[0];
  if(tlk){const tl=tierlists()[tlk];left+=`<section class="box card"><span class="eyebrow">Tier list do mês</span><h3>${esc(tl.title||"Os melhores do mês")}</h3><div class="sub">${esc(monthName(tlk))}${tl.note?` · ${esc(tl.note)}`:""}</div><div class="tierlist compact">${monthlyRows(tlk)}</div><div class="actions"><a class="btn small ${tl.status==="aberta"?"primary":""}" href="#tierlist" data-act="tierwho" data-id="mes">${tl.status==="aberta"?"Votar agora":"Ver todas as tier lists"}</a>${tl.status==="aberta"?`<span class="hint">Votação aberta</span>`:""}</div></section>`}
  else if(isStaff())left+=`<section class="box card"><span class="eyebrow">Tier list do mês</span><p style="margin:0">Lance a primeira votação da tier list do mês. <button class="linkbtn" data-act="monthly" data-m="${monthKey()}">Lançar votação</button></p></section>`;
  // quadro da galera
  const bl=boardList();
  if(bl.length||isStaff())left+=`<section class="box card"><span class="eyebrow">Quadro da galera</span><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3>Avisos, convites e enquetes</h3>${isStaff()?`<button class="btn small" data-act="bnew" data-t="aviso">+ Publicar</button>`:""}</div>
    ${bl.length?`<div class="bstack">${bl.slice(0,3).map(b=>boardCard(b,true)).join("")}</div>${bl.length>3?`<div><a class="btn small" href="#quadro">Ver tudo (${bl.length})</a></div>`:""}`:'<span class="hint">Nada publicado ainda.</span>'}</section>`;
  // direita
  const ids=Object.keys(P).sort((a,b)=>xpOf(b)-xpOf(a));
  right+=`<section class="box card"><span class="eyebrow">A galera</span><h3><a href="#pessoas" style="color:inherit">${ids.length} jogador${ids.length>1?"es":""}</a></h3><div class="galera">${ids.map(galeraRow).join("")}</div>${m&&S.canWrite?`<div><button class="btn small" data-act="find">Procurar e adicionar amigos</button></div>`:""}</section>`;
  if(m){const rs=recsFor(mid);right+=`<section class="box card"><span class="eyebrow">Pra você</span><h3>A galera acha que você vai curtir</h3>
    ${rs.length?rs.map(r=>`<div class="rec-item">${coverBox(r.g,"mini")}<div class="t"><b><a href="#jogo-${esc(slug(r.title))}" style="color:inherit">${esc(r.title)}</a></b>${r.by.map(b=>`${esc(b.p.nick)}${typeof b.nota==="number"?" ("+fmtNota(b.nota)+")":""}`).join(", ")} curti${r.by.length>1?"ram":"u"}</div><button class="rx" data-act="quickfila" data-t="${esc(r.title)}">+ Fila</button></div>`).join(""):'<span class="hint">Sem sugestões por enquanto.</span>'}</section>`}
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
    ${wl.length?wl.map(w=>{const d=daysUntil(w.lanc);return `<div class="rec-item">${coverBox(w.g,"mini")}<div class="t"><b><a href="#jogo-${esc(slug(w.title))}" style="color:inherit">${esc(w.title)}</a></b>${w.ps.map(p=>esc(p.nick)).join(", ")}</div><div class="count">${d===null?"–":d>0?d:d===0?"Hoje":"Saiu"}<small>${d===null?"sem data":d>0?"dias":""}</small></div></div>`}).join(""):'<span class="hint">Nenhum lançamento na fila.</span>'}</section>`;
  right+=`<section class="box card"><span class="eyebrow">Em breve</span><h3>Vem aí</h3><ul class="soon">
    <li>🎁 <b>Sorteios da galera</b>: jogos e gift cards para quem participa</li><li>Mensagens privadas</li><li>Notificações no celular</li><li>Mande sua ideia no chat #geral</li></ul></section>`;
  const _mc=missionsCard();if(_mc){const i=left.indexOf("</section>");left=i>=0?left.slice(0,i+10)+_mc+left.slice(i+10):_mc+left}
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
  const autores=new Set(L.map(g=>g.pid)).size;
  return `<div class="tierhead"><div style="flex:1"><span class="eyebrow">💡 Dicas e guias</span><h3>${L.length} jogo${L.length===1?"":"s"} com dicas da galera</h3><span class="hint">escritas por ${autores} pessoa${autores===1?"":"s"}</span></div></div>
  <div class="tiplist">${L.map(g=>`<article class="box tipcard">${coverBox(g)}<div class="info"><h3 class="gtitle"><a href="#jogo-${esc(slug(g.title))}">${esc(g.title)}</a></h3>
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
  return seasonBox()+`<div class="rank"><div style="display:flex;flex-direction:column;gap:18px;min-width:0">
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
  const title=E[0]?.title||(cfg().club&&slug(cfg().club.title)===sl?cfg().club.title:"")||(typeof titleFromSlug==="function"?titleFromSlug(sl):"");
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
      ${(()=>{const inf=typeof loadInfo==="function"?(loadInfo(ckey(title)),infoMemo[ckey(title)]):null;const av=inf&&inf.avaliacaoSteam;
        const hl="https://howlongtobeat.com/?q="+encodeURIComponent(inf&&inf.nome||title);
        return `<div class="sgroups">
        <div class="sgroup"><span class="flabel">Nossa galera</span><div class="stats">
          <div class="stat"><b>${notas.length?fmtNota(notas.reduce((a,b)=>a+b,0)/notas.length):"–"}</b><span>nota da galera${notas.length?` (${notas.length})`:""}</span></div>
          <div class="stat"><b>${hrs.length?Math.round(hrs.reduce((a,b)=>a+b,0)/hrs.length)+" h":"–"}</b><span>pra zerar (galera)</span></div>
          <div class="stat"><b>${E.filter(isDone).length}</b><span>zeraram</span></div>
          <div class="stat"><b>${E.filter(g=>g.status==="jogando").length}</b><span>jogando</span></div>
          <div class="stat"><b>${E.filter(g=>g.status==="quero").length}</b><span>na fila</span></div>
        </div></div>
        <div class="sgroup net"><span class="flabel">Na internet</span><div class="stats">
          <div class="stat"><b>${inf&&inf.nota?mcBadge(inf.nota):"–"}</b><span>Metacritic</span></div>
          <div class="stat"><b>${av&&av.pct?esc(av.pct)+"%":av&&av.recomendacoes?Number(av.recomendacoes).toLocaleString("pt-BR"):"–"}</b><span>${av&&av.texto?esc(av.texto)+" na Steam":av&&av.recomendacoes?"recomendações na Steam":"avaliações Steam"}</span></div>
          <a class="stat linkstat" href="${esc(hl)}" target="_blank" rel="noopener noreferrer"><b>Ver ↗</b><span>tempo pra zerar (HowLongToBeat)</span></a>
        </div></div></div>`})()}
      ${plats.length?`<div class="ptags">${plats.map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>`:""}
      ${m&&S.canWrite?(inMine?`<div><button class="btn small" data-act="edit" data-id="${esc(Object.keys(m.games).find(k=>m.games[k]===inMine))}">Editar o meu</button></div>`:`<div class="actions"><button class="btn small primary" data-act="addtitle" data-t="${esc(title)}">Adicionar à minha lista</button><button class="btn small" data-act="quickfila" data-t="${esc(title)}">+ Fila</button></div>`):""}
    </div></section>
    ${typeof infoBox==="function"?infoBox(title):""}
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
      <div class="thread">${th.map(c=>{const p=players()[c.by];if(!p)return "";const can=S.mode==="live"&&(c.by===mid||S.isOwner||isStaff());return `<div class="cmt">${glyph(p)}<div class="bubble"><div class="meta2"><b>${nk(p)}</b><span>${ago(c.at)}</span>${can?`<button class="linkbtn" data-act="cdel" data-cid="${esc(c.cid)}" data-by="${esc(c.by)}">apagar</button>`:""}${repBtn("c",c.cid,c.by)}</div><p>${esc(c.x)}</p></div></div>`}).join("")}</div>
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
  <section class="box phero"${themeStyle(p)}>${fxLayer(p)}<div class="pbanner" style="--pc:${esc(p.color)}">${p._id?mimg(`players/${p._id}/media/banner`,p.bannerV,"bimg",""):""}</div>
    <div class="phead">${glyph(p)}<div class="nmw"><h2>${nk(p)}${vitrineBadges(pid)}</h2>${p.title?`<div class="ptitle">${esc(p.title)}</div>`:""}
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${lvlChip(pid)}${streakChip(p)}<span class="xpinfo">${x} XP</span></div>${roleChips(pid)}</div>
      <div class="pacts">${mine&&S.canWrite?`<button class="btn small" data-act="profile">Editar perfil</button>`:friendBtn(pid)}<button class="btn small primary" data-act="retro" data-id="${esc(pid)}">Retrospectiva ${YEAR}</button>${Object.keys(P).length>1?`<button class="btn small" data-act="compare" data-id="${esc(pid)}">Comparar</button>`:""}</div></div>
    ${p.mood||p.bio?`<div style="padding:0 18px 12px;display:flex;flex-direction:column;gap:6px">${p.mood?`<div class="mood">${esc(p.mood)}</div>`:""}${p.bio?`<p style="margin:0;max-width:65ch;white-space:pre-wrap">${esc(p.bio)}</p>`:""}</div>`:""}
    <div style="padding:0 18px 18px"><div class="xpbar"><i style="width:${l.pct}%"></i></div><div class="xpinfo" style="margin-top:4px">Nível ${l.L} · faltam ${l.next-x} XP para o ${l.L+1}</div></div></section>
  ${libHTML(pid,p,mine)}
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
    <section class="box card"><span class="eyebrow">Atividade</span><h3>${activeYear} dia${activeYear===1?"":"s"} ativo${activeYear===1?"":"s"} em ${YEAR}</h3>${heatmap(p.days)}</section>
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
    ${S.mode==="live"&&S.isOwner?`<section class="box card"><span class="eyebrow">Cargos</span><div class="pick">${Object.entries(ROLES).map(([k,o])=>`<button type="button" data-act="role" data-pid="${esc(pid)}" data-k="${k}" aria-pressed="${rl.includes(k)}" style="${rl.includes(k)?`background:${o.c};color:var(--on-pill)`:""}" title="${esc(o.d)}">${esc(o.l)}</button>`).join("")}</div></section>`:""}
    ${mine?`<section class="box card"><span class="eyebrow">Tema do site</span><div class="skins">${Object.entries(SKINS).map(([k,o])=>`<button type="button" class="skin${skinOk(pid,o)?"":" locked"}" data-act="skin" data-k="${k}" style="--sw:${o.sw};--sw2:${o.sw2||o.sw}" aria-pressed="${skin===k}" ${skinOk(pid,o)?"":"disabled"} title="${skinOk(pid,o)?esc(o.l):"Libera com: "+esc(REQ_TXT(skinReq(o)))}"><i></i>${esc(o.l)}${skinOk(pid,o)?"":` <small>🔒 ${esc(REQ_TXT(skinReq(o)))}</small>`}</button>`).join("")}</div></section>`:""}
    ${!mine&&meId()&&S.canWrite&&S.mode==="live"?`<div class="actions"><button class="btn small ghost" data-act="block" data-id="${esc(pid)}">${blockedBy(meId()).has(pid)?"Desbloquear":"Bloquear"}</button><button class="btn small ghost" data-act="report" data-id="${esc(pid)}">Denunciar</button></div>`:""}
  </div></div></div>`;
}
function applySkin(){let k="padrao";try{k=localStorage.getItem("zg-skin")||"padrao"}catch{}if(!SKINS[k]||!skinOk(meId(),SKINS[k]))k="padrao";if(k==="padrao")document.documentElement.removeAttribute("data-skin");else document.documentElement.setAttribute("data-skin",k)}

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
    for(const [mid,m] of Object.entries(d.msgs||{}))if(m&&typeof m.x==="string")msgs.push({mid,by:uid,r:m.r,x:m.x.slice(0,800),at:Number(m.at)||0,ed:Number(m.ed)||0});
    left[uid]=d.left||{};
  }
  return {rooms,msgs,left};
}
function myRooms(){const d=chatData(),mid=meId();return Object.entries(d.rooms).filter(([rid,r])=>rid==="geral"||(mid&&(r.by===mid||(r.members||[]).includes(mid))&&!(d.left?.[mid]?.[rid])))}
function chatSeen(rid){try{return Number(localStorage.getItem("zg-seen-"+rid))||0}catch{return 0}}
function setChatSeen(rid){try{localStorage.setItem("zg-seen-"+rid,String(Date.now()))}catch{}}
function chatUnread(){const d=chatData(),mid=meId();const mine=new Set(myRooms().map(([r])=>r));return d.msgs.filter(m=>mine.has(m.r)&&m.by!==mid&&m.at>chatSeen(m.r)).length}
const horaMsg = t => new Date(t).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
function diaMsg(t){const k=dkey(new Date(t));if(k===today())return "Hoje";if(k===dkey(new Date(Date.now()-864e5)))return "Ontem";return new Date(t).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}
function quandoMsg(t){const k=dkey(new Date(t));const h=horaMsg(t);if(k===today())return "hoje às "+h;if(k===dkey(new Date(Date.now()-864e5)))return "ontem às "+h;return new Date(t).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})+" às "+h}
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
      <div class="chatlog" id="chatlog">${msgs.map((m,i)=>{const p=players()[m.by];if(!p)return "";const prev=msgs[i-1];
        const dia=dkey(new Date(m.at)),novoDia=!prev||dkey(new Date(prev.at))!==dia;const cont=!novoDia&&prev&&prev.by===m.by&&m.at-prev.at<300000;
        const can=S.mode==="live"&&(m.by===mid||S.isOwner||isStaff()),mine=S.mode==="live"&&m.by===mid;const hh=horaMsg(m.at);const editing=!!m.mid&&S.chatEdit===m.mid;
        return `${novoDia?`<div class="daysep"><span>${esc(diaMsg(m.at))}</span></div>`:""}<div class="msg${cont?" grp":""}${mine?" mine":""}">
          <div class="mav">${cont?`<span class="mtime" title="${esc(new Date(m.at).toLocaleString("pt-BR"))}">${hh}</span>`:`<a href="#perfil-${esc(pslug(p))}" aria-label="Perfil de ${esc(p.nick)}">${glyph(p)}</a>`}</div>
          <div class="mb">${cont?"":`<div class="mhead2"><a class="mnick" href="#perfil-${esc(pslug(p))}">${nk(p)}</a><time title="${esc(new Date(m.at).toLocaleString("pt-BR"))}">${esc(quandoMsg(m.at))}</time></div>`}
            ${editing?`<div class="ced"><textarea id="med-${esc(m.mid)}" maxlength="800" aria-label="Editar mensagem">${esc(S.chatEditText??m.x)}</textarea><div class="facts"><button class="btn small primary" data-act="medsave" data-id="${esc(m.mid)}">Salvar</button><button class="btn small ghost" data-act="medcancel">Cancelar</button></div></div>`
            :`<p>${esc(m.x)}${m.ed?` <span class="edtag hint">(editado)</span>`:""}</p>`}
          </div>${!can&&!editing&&m.mid?`<div class="mtools">${repBtn("m",m.mid,m.by)}</div>`:""}${can&&!editing?`<div class="mtools">${!mine?repBtn("m",m.mid,m.by):""}${mine?`<button class="linkbtn" data-act="medit" data-id="${esc(m.mid)}" aria-label="Editar mensagem">editar</button>`:""}<button class="linkbtn" data-act="mdel" data-id="${esc(m.mid)}" data-by="${esc(m.by)}" aria-label="Apagar mensagem">apagar</button></div>`:""}</div>`}).join("")||'<div class="hint" style="padding:20px">Nenhuma mensagem ainda. Mande a primeira.</div>'}</div>
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
      <div class="field"><label for="p-discord">Usuário do Discord</label><input id="p-discord" maxlength="40" value="${esc(m?.discord||"")}" placeholder="Ex.: soarezx"><span class="hint">Seu <b>nome de usuário</b> do Discord (não o apelido). Com ele, você recebe no servidor os mesmos cargos do site.</span></div>
      <div class="field"><label for="p-steam">Perfil da Steam (opcional)</label><input id="p-steam" maxlength="120" value="${esc(steamLink(m?.steam)||"")}" placeholder="https://steamcommunity.com/id/seu-nome"><span class="hint">Para importar seus jogos e atualizar as horas sozinho.</span></div>
      <div class="field"><label for="p-goal">Meta de zerados em ${YEAR}</label><input id="p-goal" type="number" min="0" max="365" value="${m?.goal||""}" placeholder="Ex.: 12"></div>
      <div class="field full"><span class="flabel">Plataformas que você joga</span>${pickRow("plats",PLATFORMS.map(x=>({v:x,l:esc(x)})),M.plats)}</div>
      <details class="field full libedit"${Object.keys(m?.lib||{}).length?" open":""}><summary class="flabel">Sua biblioteca: quantos jogos você tem em cada plataforma (opcional)</summary>
        <span class="hint">A Steam é contada sozinha quando você conecta o perfil. Aqui você coloca o resto.</span>
        <div class="libgrid">${LIBPLATS.map(x=>`<label class="libin"><span>${esc(x==="PC"?"PC (fora da Steam)":x)}</span><input type="number" min="0" max="9999" inputmode="numeric" data-lib="${esc(x)}" value="${esc(m?.lib?.[x]||"")}" placeholder="0"></label>`).join("")}</div></details>
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
// estilos de jogo (vêm do índice de fichas: info.json → estilos)
const ESTILOS=["Ação","Aventura","RPG","Tiro","Corrida","Luta","Terror","Sobrevivência","Mundo aberto","Metroidvania","Soulslike","Roguelike","Plataforma","2D","Furtivo","Hack and slash","Estratégia","Simulação","Puzzle","Esporte","Cooperativo","Narrativo","Indie"];
const estilosDe = t => {const e=infoIdx()[ckey(t)];return e&&Array.isArray(e.estilos)?e.estilos:[]};
const passaEstilo = t => !S.tierGenre||estilosDe(t).includes(S.tierGenre);
function genreSel(titles){
  const tem=new Set();titles.forEach(t=>estilosDe(t).forEach(x=>tem.add(x)));
  const ops=ESTILOS.filter(x=>tem.has(x)||x===S.tierGenre);
  if(!ops.length)return "";
  return `<label class="whosel${S.tierGenre?" on":""}"><span class="sr-only">Filtrar por estilo de jogo</span><select id="tiergenre-sel"><option value="">Todos os estilos</option>${ops.map(x=>`<option value="${esc(x)}"${S.tierGenre===x?" selected":""}>${esc(x)}</option>`).join("")}</select></label>`;
}
function viewTier(){
  const P=players();const mid=meId();
  if(!S.tierWho||S.tierWho==="galera")S.tierWho=mid&&P[mid]?mid:"mes";
  if(S.tierWho!=="mes"&&!P[S.tierWho])S.tierWho="mes";
  const ids=Object.keys(P).sort((a,b)=>a===mid?-1:b===mid?1:P[a].nick.localeCompare(P[b].nick,"pt"));
  const fr=new Set(mid&&P[mid]&&typeof friendsOf==="function"?Object.keys(friendsOf(P[mid])):[]);
  const others=ids.filter(id=>id!==mid);const amigos=others.filter(id=>fr.has(id)),resto=others.filter(id=>!fr.has(id));
  const other=S.tierWho!=="mes"&&S.tierWho!==mid?P[S.tierWho]:null;
  const opt=id=>`<option value="${esc(id)}" ${S.tierWho===id?"selected":""}>${esc(P[id].nick)}</option>`;
  let titles;
  if(S.tierWho==="mes"){const tl=tierlists()[S.tlMonth]||tierlists()[Object.keys(tierlists()).filter(k=>!k.includes("~")).sort().reverse()[0]];titles=(tl&&Array.isArray(tl.games)?tl.games:[]).map(g=>g.title)}
  const L=S.tierWho==="mes"?[]:filtered().filter(g=>g.pid===S.tierWho);
  if(S.tierWho!=="mes")titles=L.filter(g=>g.tier).map(g=>g.title);
  const tabs=`<div class="tierpick" role="group" aria-label="De quem é a tier list">
    <button data-act="tierwho" data-id="mes" aria-pressed="${S.tierWho==="mes"}">Do mês</button>
    ${mid&&P[mid]?`<button data-act="tierwho" data-id="${esc(mid)}" aria-pressed="${S.tierWho===mid}">${glyph(P[mid],true)} Minha</button>`:""}
    ${others.length?`<label class="whosel${other?" on":""}">${other?glyph(other,true):""}<span class="sr-only">Ver a tier list de outra pessoa</span><select id="tierwho-sel"><option value="">${other?"Trocar pessoa…":`De outra pessoa (${others.length})…`}</option>${amigos.length?`<optgroup label="Amigos">${amigos.map(opt).join("")}</optgroup><optgroup label="Galera">${resto.map(opt).join("")}</optgroup>`:resto.map(opt).join("")}</select></label>`:""}
    ${genreSel(titles||[])}</div>`;
  if(S.tierWho==="mes")return tabs+viewTierMes();
  const who=P[S.tierWho];const LF=L.filter(g=>passaEstilo(g.title));
  const head=`<div class="tierhead">${glyph(who)}<div><h3>Tier list de ${nk(who)}</h3><span class="hint">${LF.filter(g=>g.tier).length} jogos${S.tierGenre?" de "+esc(S.tierGenre):""}</span></div></div>`;
  return tabs+head+`<section class="box tierlist" aria-label="Tier list">${S.tierGenre&&!LF.some(g=>g.tier)?`<div class="trow"><div class="titems"><span class="empty-row">Nenhum jogo de ${esc(S.tierGenre)} na tier list de ${nk(who)}. <button class="btn small" data-act="tiergenreclr">Ver todos os estilos</button></span></div></div>`:tierRows(LF,"")}</section>`;
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
  return TIERS.map(t=>{const arr=(r.tiers[t]||[]).filter(x=>passaEstilo(x.title));return `<div class="trow"><div class="tlabel t-${t}">${t}</div><div class="titems">${arr.length?arr.map(tlChip).join(""):'<span class="empty-row">vazio</span>'}</div></div>`}).join("")
    +(r.pending.filter(x=>passaEstilo(x.title)).length?`<div class="trow"><div class="tlabel t-N">?</div><div class="titems">${r.pending.filter(x=>passaEstilo(x.title)).map(tlChip).join("")}<span class="empty-row">sem votos ainda</span></div></div>`:"");
}
function voteBox(month){
  const tl=tierlists()[month];if(!tl||tl.status!=="aberta"||!Array.isArray(tl.games))return "";
  if(S.mode==="demo")return `<section class="box card"><span class="eyebrow">Seu voto</span><p class="hint" style="margin:0">No modo exemplo não dá para votar.</p></section>`;
  if(!me()||!S.canWrite)return `<section class="box card"><span class="eyebrow">Votação aberta</span><p style="margin:0">Entre e crie seu perfil para votar.</p></section>`;
  const mine=votesOf(month)[S.myId]?.v||{};const done=tl.games.filter(g=>mine[norm(g.title)]).length;
  return `<section class="box card"><span class="eyebrow">Seu voto · ${done} de ${tl.games.length}</span><h3>Escolha o tier de cada jogo</h3>
    <div class="vlist">${tl.games.map(g=>{const k=norm(g.title);return `<div class="mrow">${coverBox({title:g.title,coverUrl:g.coverUrl},"mini")}<span class="ct">${esc(g.title)}</span><div class="pick">${TIERS.map(t=>`<button type="button" class="tb t-${t}" data-act="vote" data-m="${esc(month)}" data-k="${esc(k)}" data-t="${t}" aria-pressed="${mine[k]===t}" aria-label="Votar ${t} em ${esc(g.title)}">${t}</button>`).join("")}</div></div>`}).join("")}</div></section>`;
}
function viewTierMes(){
  const all=tierlists();const keys=Object.keys(all).filter(k=>!k.includes("~")).sort().reverse();
  if(!S.tlMonth||!all[S.tlMonth])S.tlMonth=keys[0]||"";
  const tl=all[S.tlMonth];const staff=isStaff();const r=tl?tlResult(S.tlMonth):null;
  const st=tl?(tl.status==="aberta"?`<span class="pill s-jogando">Votação aberta</span>`:tl.status==="encerrada"?`<span class="pill s-zerado">Resultado final</span>`:""):"";
  const top=`<div class="tierhead"><div style="flex:1;min-width:0"><span class="eyebrow">Tier list do mês</span><h3>${tl?esc(tl.title||"Os melhores do mês"):"Nenhuma tier list mensal ainda"}</h3>
      ${tl?`<span class="hint">${st} ${esc(monthName(S.tlMonth))}${r&&!r.legacy?` · ${r.voters} pessoa${r.voters===1?"":"s"} votaram`:""}${tl.note?` · ${esc(tl.note)}`:""}</span>`:`<span class="hint">${staff?"Lance a primeira votação com os jogos que a galera jogou este mês.":"O dono do site lança uma votação por mês com os melhores jogos."}</span>`}</div>
    <div class="actions">${keys.length?`<select id="tl-month" aria-label="Mês">${keys.map(k=>`<option value="${k}"${k===S.tlMonth?" selected":""}>${esc(monthName(k))}</option>`).join("")}</select>`:""}
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
  return `<div class="page"><div class="tierhead"><div style="flex:1"><span class="eyebrow">Novidades</span><h3>O que está rolando no mundo dos games</h3></div>
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
function tierGenreFix(){if(!S.tierGenre||S.tierWho==="mes")return;const L=filtered().filter(g=>g.pid===S.tierWho&&g.tier);if(!L.some(g=>estilosDe(g.title).includes(S.tierGenre)))S.tierGenre=""}
document.addEventListener("change",e=>{if(e.target.id==="tierwho-sel"&&e.target.value){S.tierWho=e.target.value;tierGenreFix();renderView()}});
document.addEventListener("click",e=>{if(e.target.closest('[data-act="tiergenreclr"]')){e.stopImmediatePropagation();S.tierGenre="";renderView()}},true);
document.addEventListener("change",e=>{if(e.target.id==="tiergenre-sel"){S.tierGenre=e.target.value;renderView()}});
document.addEventListener("click",async e=>{
  const el=e.target.closest("[data-act]");if(!el)return;const a=el.dataset.act;
  if(a==="tierwho"){S.tierWho=el.dataset.id;tierGenreFix();renderView();return}
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
  return `<div class="page"><div class="tierhead"><div style="flex:1"><span class="eyebrow">Meus Saves</span><h3>Onde você parou em cada jogo</h3></div>${S.canWrite?`<div class="actions" style="margin:0"><button class="btn small" data-act="steam">Importar da Steam</button><button class="btn primary small" data-act="add">+ Jogo</button></div>`:""}</div>
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
    <section class="box card"><span class="eyebrow">Última sessão</span>${last?`<div class="hint">${esc(new Date(last.at).toLocaleDateString("pt-BR"))}${last.h?` · ${esc(last.h)} h`:""}</div><p style="margin:0;white-space:pre-wrap">${esc(last.txt||"")}</p>${last.shot?`<div class="shot"><div class="ph">${mimg(`players/${g.pid}/shots/${last.shot}`,1,"","Print da sessão")}<button class="zoom" data-act="zoom" data-k="${esc(mkey(`players/${g.pid}/shots/${last.shot}`,1))}" data-cap="" aria-label="Ampliar print"></button></div></div>`:""}`:`<p class="hint" style="margin:0">Nenhuma anotação ainda.</p>`}
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
      ${!pl?`<div><button class="btn small primary" data-act="plot" data-t="${esc(g.title)}" data-w="${esc(d.wtitle||g.wtitle||"")}">Buscar resumo</button></div>`
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
    ${open?`<div class="thread">${thread.map(c=>{const p=players()[c.by];if(!p)return "";const can=S.mode==="live"&&(c.by===meId()||S.isOwner||isStaff());return `<div class="cmt">${glyph(p)}<div class="bubble"><div class="meta2"><b>${nk(p)}</b><span>${ago(c.at)}</span>${can?`<button class="linkbtn" data-act="cdel" data-cid="${esc(c.cid)}" data-by="${esc(c.by)}">apagar</button>`:""}${repBtn("c",c.cid,c.by)}</div><p>${esc(c.x)}</p></div></div>`}).join("")}
      ${me()&&S.canWrite?`<div class="composer"><label class="flabel" for="cmt-text">Sua resposta</label><textarea id="cmt-text" maxlength="600"></textarea><div><button class="btn small primary" data-act="csend" data-t="${esc("quadro-"+b.id)}">Enviar</button></div></div>`:`<span class="hint">Entre para responder.</span>`}</div>`:""}
  </article>`;
}
function viewQuadro(){
  const L=boardList().filter(b=>!S.boardType||b.type===S.boardType);
  return `<div class="page"><div class="tierhead"><div style="flex:1"><span class="eyebrow">Quadro da galera</span><h3>Avisos, convites e enquetes</h3></div>
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
      <div class="fgrid"><label class="chk"><input type="checkbox" id="bd-multi" ${b?.poll?.multi?"checked":""}> Pode votar em mais de uma</label><label class="chk"><input type="checkbox" id="bd-palpite" ${b?.poll?.palpite?"checked":""}> 🎰 É um palpite (a galera aposta fichas de mentira)</label><div class="field"><label for="bd-until">Encerra em (opcional)</label><input id="bd-until" type="date" value="${esc(b?.poll?.until||"")}"></div></div>`:""}
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
      doc.poll={opts:opts.map(o=>o.slice(0,80)),multi:$("#bd-multi").checked,until:$("#bd-until").value||"",palpite:!!$("#bd-palpite")?.checked,...(Number.isInteger(prev?.poll?.result)?{result:prev.poll.result}:{})}}
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

/* ---------- Steam: importar biblioteca e atualizar horas ---------- */
// O robô do GitHub (scripts/steam.py) lê a biblioteca de quem colocou o perfil da Steam
// e salva em steam/<id do jogador>.json. O site só lê esse arquivo.
function parseSteam(v){
  v=String(v||"").trim();if(!v)return "";
  let m=/steamcommunity\.com\/profiles\/(\d{17})/i.exec(v);if(m)return m[1];
  m=/steamcommunity\.com\/id\/([A-Za-z0-9_-]{2,32})/i.exec(v);if(m)return "vanity:"+m[1];
  if(/^\d{17}$/.test(v))return v;
  if(/^[A-Za-z0-9_-]{2,32}$/.test(v))return "vanity:"+v;
  return null;
}
const steamLink = s => !s?"":/^\d{17}$/.test(s)?`https://steamcommunity.com/profiles/${s}`:s.startsWith("vanity:")?`https://steamcommunity.com/id/${encodeURIComponent(s.slice(7))}`:"";
const steamCover = id => /^\d{1,9}$/.test(String(id||""))?`https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${id}/library_600x900.jpg`:"";
const steamMemo={};
async function loadSteam(pid,force){
  if(!pid||!/^[A-Za-z0-9]{10,40}$/.test(pid))return null;
  if(!force&&steamMemo[pid]!==undefined)return steamMemo[pid];
  try{const r=await fetch(`steam/${pid}.json?t=${Math.floor(Date.now()/300000)}`,{cache:"no-store"});steamMemo[pid]=r.ok?await r.json():null}catch{steamMemo[pid]=null}
  return steamMemo[pid];
}
const hrs = min => Math.round((Number(min)||0)/6)/10;
function steamOwnedKeys(){const m=me()||{};const keys=new Set(),apps=new Set();for(const g of Object.values(m.games||{})){keys.add(norm(g.title));if(g.steamApp)apps.add(Number(g.steamApp))}return {keys,apps}}

async function openSteam(){
  const m=me();if(!m||!S.canWrite){toast("Crie seu perfil primeiro");return}
  M={type:"steam",data:null,sel:{},q:"",st:"auto",loading:true};drawSteam();
  if(m.steam){M.data=await loadSteam(S.myId,true)}
  if(M?.type!=="steam")return;M.loading=false;drawSteam();
}
function drawSteam(){
  const m=me()||{};const d=M.data;
  let body="";
  const linkForm=`<div class="field"><label for="st-link">Link do seu perfil da Steam</label><input id="st-link" maxlength="120" value="${esc(steamLink(m.steam)||"")}" placeholder="https://steamcommunity.com/id/seu-nome"><span class="hint">Na Steam: clique no seu nome → Perfil → copie o endereço da página.</span></div>
    <div class="actions" style="justify-content:flex-start"><button class="btn primary small" data-act="stlink">Salvar link</button>${m.steam?`<button class="btn small" data-act="stunlink">Desconectar Steam</button>`:""}</div>`;
  const privHelp=`<ol class="hint" style="margin:6px 0 0;padding-left:18px"><li>Na Steam, abra seu perfil → <b>Editar perfil</b> → <b>Privacidade</b>.</li><li>Deixe <b>Meu perfil</b> e <b>Detalhes dos jogos</b> como <b>Público</b>.</li><li>Desmarque "Sempre manter meu tempo de jogo total privado".</li></ol>`;
  if(M.loading)body=`<p class="hint">Carregando sua biblioteca…</p>`;
  else if(!m.steam)body=`<p style="margin:0 0 10px">Conecte sua Steam para trazer seus jogos com as <b>horas já preenchidas</b>. Depois, as horas se atualizam sozinhas.</p>${linkForm}<p class="hint" style="margin-top:12px">Sua biblioteca precisa estar pública:</p>${privHelp}`;
  else if(!d)body=`<p style="margin:0 0 10px"><b>Steam conectada.</b> O robô do site lê as bibliotecas de hora em hora. Volte aqui em até 1 hora para escolher os jogos.</p>${linkForm}<p class="hint" style="margin-top:12px">Enquanto isso, confira se sua biblioteca está pública:</p>${privHelp}`;
  else if(d.erro==="perfil")body=`<p style="margin:0 0 10px">Não achei esse perfil na Steam. Confira o link.</p>${linkForm}`;
  else if(d.privado||!(d.jogos||[]).length)body=`<p style="margin:0 0 10px">Achei seu perfil${d.nome?` (<b>${esc(d.nome)}</b>)`:""}, mas a <b>biblioteca está privada</b>. Deixe pública e espere o robô passar de novo (até 1 hora).</p>${privHelp}<div style="margin-top:12px">${linkForm}</div>`;
  else{
    const {keys,apps}=steamOwnedKeys();const q=norm(M.q);
    const L=d.jogos.filter(j=>!q||norm(j.nome).includes(q));
    const has=j=>apps.has(Number(j.appid))||keys.has(norm(j.nome));
    const nSel=Object.values(M.sel).filter(Boolean).length;
    body=`<p class="hint" style="margin:0 0 8px">Perfil <b>${esc(d.nome||"")}</b> · ${d.jogos.length} jogos · lido ${esc(quando(d.atualizadoEm*1000))}</p>
      <div class="fgrid"><div class="field"><label for="st-q">Procurar</label><input id="st-q" value="${esc(M.q)}" placeholder="Nome do jogo"></div>
      <div class="field"><label for="st-st">Entram como</label><select id="st-st">${[["auto","Automático (jogados na semana = Jogando)"],["jogando","Jogando"],["zerado","Zerado"],["pausado","Pausado"],["quero","Na fila"]].map(([v,l])=>`<option value="${v}" ${M.st===v?"selected":""}>${l}</option>`).join("")}</select></div></div>
      <div class="actions" style="justify-content:flex-start;margin:4px 0 8px"><button class="btn small" data-act="stselrecent">Marcar os jogados recentemente</button><button class="btn small" data-act="stselnone">Limpar seleção</button></div>
      <div class="stlist">${L.slice(0,300).map(j=>{const ja=has(j);return `<label class="strow${ja?" ja":""}"><img src="${esc(steamCover(j.appid))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'"><span class="stn"><b>${esc(j.nome)}</b><span>${hrs(j.min)} h${j.min2w?` · <em>${hrs(j.min2w)} h nas últimas 2 semanas</em>`:""}</span></span>${ja?`<span class="chip">Já está na lista</span>`:`<input type="checkbox" data-stapp="${esc(j.appid)}" ${M.sel[j.appid]?"checked":""} aria-label="Importar ${esc(j.nome)}">`}</label>`}).join("")||`<p class="hint">Nenhum jogo com esse nome.</p>`}</div>
      ${L.length>300?`<p class="hint">Mostrando 300 de ${L.length}. Use a busca.</p>`:""}
      <div class="actions"><button class="btn" data-act="close">Fechar</button><button class="btn primary" data-act="stimport" ${nSel?"":"disabled"}>Importar ${nSel||""} jogo${nSel===1?"":"s"}</button></div>
      <details style="margin-top:10px"><summary class="hint">Trocar ou desconectar a Steam</summary>${linkForm}</details>`;
  }
  const keepQ=document.activeElement?.id==="st-q";
  $("#modal").innerHTML=overlay(`<h2>Importar da Steam</h2>${body}${(!d||d.privado||d.erro)&&!M.loading?`<div class="actions"><button class="btn" data-act="close">Fechar</button></div>`:""}<p class="err" id="sterr" role="alert"></p>`,"steambox");
  if(keepQ){const i=$("#st-q");if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}}
}
function stStatus(j){if(M.st!=="auto")return M.st;if(j.min2w)return "jogando";if(!j.min)return "quero";return "pausado"}
async function importSteam(){
  const d=M.data;const {keys,apps}=steamOwnedKeys();
  const pick=d.jogos.filter(j=>M.sel[j.appid]&&!apps.has(Number(j.appid))&&!keys.has(norm(j.nome)));
  if(!pick.length)return;
  const agora=Date.now();
  // jogos importados entram "quietos": não viram atividade no feed, não contam como atualizados hoje nem pontuam temporada/liga
  await saveMe(p=>{p.games=p.games||{};pick.forEach((j,i)=>{const st=stStatus(j);
    p.games[newId("g")]={title:String(j.nome).slice(0,80),status:st,platform:"PC",year:isDone({status:st})?YEAR:null,fase:"",progress:st==="zerado"?100:0,hours:Math.round((j.min||0)/60),nota:null,tier:"",comment:"",rec:false,steamApp:Number(j.appid),updatedAt:0,imp:agora}});
    p.steamImp={n:pick.length+(p.steamImp&&p.steamImp.at>agora-36e5?p.steamImp.n:0),at:agora}});
  closeModal();toast(`${pick.length} jogo${pick.length>1?"s":""} importado${pick.length>1?"s":""} da Steam`);
}
let steamSynced=false;
async function syncSteam(){
  const m=me();if(steamSynced||!m||!m.steam||!S.canWrite)return;steamSynced=true;
  const d=await loadSteam(S.myId);if(!d||!Array.isArray(d.jogos))return;
  const byApp=new Map(d.jogos.map(j=>[Number(j.appid),j]));const byName=new Map(d.jogos.map(j=>[norm(j.nome),j]));
  const up={};
  for(const [gid,g] of Object.entries(m.games||{})){
    if(g.platform&&!["PC","Steam Deck"].includes(g.platform))continue;
    const j=(g.steamApp&&byApp.get(Number(g.steamApp)))||byName.get(norm(g.title));if(!j)continue;
    const h=Math.round((j.min||0)/60);const ch={};
    if(h>(Number(g.hours)||0))ch.hours=h;if(!g.steamApp)ch.steamApp=Number(j.appid);
    if(Object.keys(ch).length)up[gid]=ch;
  }
  if(!Object.keys(up).length)return;
  saveMe(p=>{for(const [gid,ch] of Object.entries(up))if(p.games?.[gid])Object.assign(p.games[gid],ch)},{noDay:true}).then(()=>{const n=Object.values(up).filter(c=>c.hours).length;if(n)toast(`Horas da Steam atualizadas em ${n} jogo${n>1?"s":""}`)}).catch(()=>{});
}

document.addEventListener("input",e=>{
  if(M?.type!=="steam")return;
  if(e.target.id==="st-q"){M.q=e.target.value;drawSteam()}
});
document.addEventListener("change",e=>{
  if(M?.type!=="steam")return;
  if(e.target.id==="st-st"){M.st=e.target.value;return}
  const a=e.target.dataset?.stapp;if(a!==undefined){M.sel[a]=e.target.checked;const n=Object.values(M.sel).filter(Boolean).length;const b=document.querySelector('[data-act="stimport"]');if(b){b.disabled=!n;b.textContent=`Importar ${n||""} jogo${n===1?"":"s"}`}}
});
document.addEventListener("click",async e=>{
  const el=e.target.closest("[data-act]");if(!el)return;const a=el.dataset.act;
  if(a==="steam"){openSteam();return}
  if(M?.type!=="steam")return;
  if(a==="stselrecent"){(M.data?.jogos||[]).forEach(j=>{if(j.min2w)M.sel[j.appid]=true});drawSteam();return}
  if(a==="stselnone"){M.sel={};drawSteam();return}
  if(a==="stimport"){el.disabled=true;try{await importSteam()}catch(err){const x=$("#sterr");if(x)x.textContent=errMsg(err);el.disabled=false}return}
  if(a==="stlink"||a==="stunlink"){
    const v=a==="stunlink"?"":parseSteam($("#st-link")?.value);
    if(v===null){$("#sterr").textContent="Link não reconhecido. Use o endereço do seu perfil na Steam.";return}
    el.disabled=true;
    try{await saveMe(p=>{p.steam=v},{noDay:true});M.data=v?await loadSteam(S.myId,true):null;toast(v?"Steam conectada":"Steam desconectada");drawSteam()}
    catch(err){$("#sterr").textContent=errMsg(err);el.disabled=false}
  }
});

/* ---------- Biblioteca (contador de jogos, estilo Steam) ---------- */
const LIBPLATS = ["PS5","PS4","Xbox Series","Xbox One","Switch 2","Switch","PC","Mobile","Retrô / Emulador","Outro"];
function libOf(pid,p){
  const st=p?.steam?steamMemo[pid]:null;
  if(p?.steam&&steamMemo[pid]===undefined)loadSteam(pid).then(()=>softRender());
  const steamN=st&&!st.privado&&Array.isArray(st.jogos)?st.jogos.length:0;
  const steamH=steamN?Math.round(st.jogos.reduce((a,j)=>a+(j.min||0),0)/60):0;
  const man=Object.entries(p?.lib||{}).filter(([k,n])=>LIBPLATS.includes(k)&&Number(n)>0).map(([k,n])=>[k,Math.round(Number(n))]);
  const total=steamN+man.reduce((a,[,n])=>a+n,0);
  return {total,steamN,steamH,man,st};
}
function libHTML(pid,p,mine){
  const L=libOf(pid,p);
  if(!L.total)return mine&&S.canWrite?`<section class="box card libbox empty"><span class="eyebrow">Biblioteca</span><p style="margin:0">Mostre quantos jogos você tem: <button class="linkbtn" data-act="steam">conecte a Steam</button> ou <button class="linkbtn" data-act="profile">coloque os números de cada plataforma</button>.</p></section>`:"";
  const chips=[];
  if(L.steamN)chips.push(`<a class="libchip steam" href="${esc(steamLink(p.steam))}" target="_blank" rel="noopener"><b>${L.steamN}</b><span>Steam</span><em>${L.steamH.toLocaleString("pt-BR")} h · automático</em></a>`);
  L.man.sort((a,b)=>b[1]-a[1]).forEach(([k,n])=>chips.push(`<div class="libchip"><b>${n}</b><span>${esc(k)}</span></div>`));
  return `<section class="box card libbox"><div class="libtop"><div><span class="eyebrow">Biblioteca</span><div class="libtotal"><b>${L.total.toLocaleString("pt-BR")}</b><span>jogos</span></div></div>${mine&&S.canWrite?`<div class="actions" style="margin:0"><button class="btn small" data-act="profile">Editar números</button>${L.steamN?"":`<button class="btn small" data-act="steam">Conectar Steam</button>`}</div>`:""}</div><div class="libchips">${chips.join("")}</div></section>`;
}

/* importações antigas da Steam marcaram dezenas de jogos como "atualizados agora" de uma vez:
   aqui esses lotes viram "importados" (sem data), para não lotar o feed nem mexer em temporada, liga e missões */
function fixSteamBurst(p){
  const G=Object.values(p.games||{}).filter(g=>g&&g.steamApp&&!g.imp&&Number(g.updatedAt)>1e9).sort((a,b)=>a.updatedAt-b.updatedAt);
  let i=0;while(i<G.length){let j=i;while(j+1<G.length&&G[j+1].updatedAt-G[i].updatedAt<=5000)j++;
    if(j-i+1>=5){const at=G[j].updatedAt;for(let k=i;k<=j;k++){G[k].imp=at;G[k].updatedAt=0}
      if(!p.steamImp||p.steamImp.at<at)p.steamImp={n:j-i+1,at}}
    i=j+1}
}

/* ---------- Ficha do jogo (estilo loja da Steam) ---------- */
// O robô do GitHub (scripts/gameinfo.py) monta info/<chave>.json com dados da Steam e da Wikipédia.
const infoMemo={};
function infoIdx(){return (S.infoIdx&&S.infoIdx.jogos)||{}}
function loadInfo(k){
  if(!k||!/^[a-z0-9]{3,60}$/.test(k))return;
  if(infoMemo[k]!==undefined)return;infoMemo[k]=null;
  fetch(`info/${k}.json?t=${Math.floor(Date.now()/600000)}`,{cache:"no-store"}).then(r=>r.ok?r.json():false).then(j=>{infoMemo[k]=j||false;softRender()}).catch(()=>{infoMemo[k]=false;softRender()});
}
// título de um jogo que ninguém cadastrou, mas que aparece na tier list do mês, no quadro ou no índice de fichas
function titleFromSlug(sl){
  for(const t of Object.values(tierlists()))for(const g of (t?.games||[]))if(g&&slug(g.title)===sl)return g.title;
  for(const b of (typeof boardList==="function"?boardList():[]))if(b?.ev?.game&&slug(b.ev.game)===sl)return b.ev.game;
  for(const e of Object.values(infoIdx()))if(e&&e.slug===sl&&e.titulo)return e.titulo;
  return "";
}
const infoAppid = t => {const e=infoIdx()[ckey(t)];return e&&e.appid?e.appid:null};
const safeImg = u => typeof u==="string"&&/^https:\/\/(shared\.|cdn\.)?(cloudflare\.|akamai\.)?steamstatic\.com\/|^https:\/\/(cdn\.akamai\.steamstatic\.com|steamcdn-a\.akamaihd\.net)\//.test(u)?u:"";
function newsAbout(name){
  const words=String(name||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[:™®]/g," ").split(/\s+/).filter(w=>w.length>=3&&!["the","of","and","edition"].includes(w));
  if(!words.length)return [];const key=words.slice(0,3).join(" ");
  const nrm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[:™®]/g," ").replace(/\s+/g," ");
  return [...(typeof autoNews==="function"?autoNews():[]),...(S.news||[])].filter(n=>nrm(n.title).includes(key)).slice(0,4);
}
function infoBox(title){
  const k=ckey(title);loadInfo(k);const d=infoMemo[k];
  if(d===null||d===undefined)return `<section class="box card ginfo"><span class="eyebrow">Sobre o jogo</span><p class="hint">Buscando as informações do jogo…</p></section>`;
  if(!d)return `<section class="box card ginfo"><span class="eyebrow">Sobre o jogo</span><p class="hint" style="margin:0">Ficha ainda não disponível.</p></section>`;
  const banner=safeImg(d.banner);const loc=localCover(title);
  const plats=(d.plataformas&&d.plataformas.length?d.plataformas:d.plataformasSteam)||[];
  const fact=(l,v)=>v?`<div class="gfact"><span>${esc(l)}</span><b>${v}</b></div>`:"";
  const list=a=>(a||[]).filter(Boolean).map(esc).join(", ");
  let quando="";
  if(d.dataISO){const dd=daysUntil(d.dataISO);if(dd!==null&&dd>0)quando=`<span class="pill gsoon">Faltam ${dd} dia${dd>1?"s":""}</span>`}
  else if(d.emBreve)quando=`<span class="pill gsoon">Em breve</span>`;
  const shots=(d.imagens||[]).filter(i=>safeImg(i.p)&&safeImg(i.g)).slice(0,8);
  const news=newsAbout(d.nome||title);
  const fontes=(d.fontes||[]).filter(f=>/^https:\/\//.test(f.link||""));
  return `<section class="box card ginfo">
    ${banner?`<div class="gbanner"><img src="${esc(banner)}" alt="${esc(d.nome||title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></div>`:""}
    <div class="ghead"><div><span class="eyebrow">Sobre o jogo</span><h3>${esc(d.nome||title)}</h3></div>${quando}</div>
    ${d.resumo?`<p class="gdesc">${esc(d.resumo)}</p>`:""}
    <div class="gfacts">
      ${fact("Lançamento",esc(d.lancamento||d.lancamentoWiki||(d.emBreve?"A anunciar":"")))}
      ${fact("Estúdio",list(d.estudio))}
      ${fact("Editora",list(d.editora))}
      ${fact("Nota (Metacritic)",d.nota?mcBadge(d.nota):"")}
      ${fact("Preço na Steam",esc(d.preco||""))}
    </div>
    ${(d.generos||[]).length?`<div class="ptags">${d.generos.map(g=>`<span class="tag">${esc(g)}</span>`).join("")}</div>`:""}
    ${plats.length?`<div class="gplats"><span class="flabel">Plataformas</span><div class="ptags">${plats.map(p=>`<span class="tag">${esc(p)}</span>`).join("")}</div></div>`:""}
    ${shots.length?`<div class="gshots" role="list">${shots.map((s,i)=>`<a role="listitem" href="${esc(s.g)}" target="_blank" rel="noopener noreferrer"><img src="${esc(s.p)}" alt="Imagem ${i+1} de ${esc(d.nome||title)}" loading="lazy" referrerpolicy="no-referrer"></a>`).join("")}</div>`:""}
    ${news.length?`<div class="gnews"><span class="flabel">Novidades sobre o jogo</span>${news.map(n=>`<a href="${esc(n.url)}" target="_blank" rel="noopener noreferrer"><b>${esc(n.title)}</b><span>${esc(n.source||"")}</span></a>`).join("")}</div>`:""}
    <div class="gfoot">${fontes.map(f=>`<a class="btn small" href="${esc(f.link)}" target="_blank" rel="noopener noreferrer">${f.nome==="Steam"?"Ver na Steam":"Ler na "+esc(f.nome)}</a>`).join("")}<span class="hint">Informações: ${fontes.map(f=>esc(f.nome)).join(" e ")||"Steam / Wikipédia"}</span></div>
  </section>`;
}

// selo no estilo do Metacritic: verde (75+), amarelo (50–74), vermelho (abaixo de 50)
function mcBadge(n){n=Math.round(Number(n));if(!(n>=0&&n<=100))return "–";const c=n>=75?"good":n>=50?"mixed":"bad";
  return `<span class="mc mc-${c}" title="Metascore ${n} de 100">${n}</span>`}

/* ---------- Promoções (robô scripts/promos.py → promos.json) ---------- */
const PROMO_CLS=[["pc","Jogos de PC"],["console","Consoles"],["gratis","Grátis"],["hardware","Hardware e acessórios"]];
const PROMO_SITES={
  pc:[["Steam · ofertas","https://store.steampowered.com/specials"],["Epic Games","https://store.epicgames.com/pt-BR/"],["GOG · promoções","https://www.gog.com/pt/games?discounted=true"],["Nuuvem","https://www.nuuvem.com/br-pt/"],["GG.deals","https://gg.deals/br/deals/"],["IsThereAnyDeal","https://isthereanydeal.com/"]],
  console:[["PlayStation Store","https://store.playstation.com/pt-br/pages/deals"],["Xbox · ofertas","https://www.xbox.com/pt-BR/promotions/sales/sales-and-specials"],["Nintendo eShop","https://www.nintendo.com/pt-br/store/sales-and-deals/"],["PSPrices","https://psprices.com/region-br/"],["Deku Deals","https://www.dekudeals.com/?country=br"]],
  gratis:[["Epic · grátis da semana","https://store.epicgames.com/pt-BR/free-games"],["GamerPower","https://www.gamerpower.com/"],["Prime Gaming","https://gaming.amazon.com/"],["Steam · grátis","https://store.steampowered.com/genre/Free%20to%20Play/"]],
  hardware:[["Amazon · ofertas","https://www.amazon.com.br/deals"],["Mercado Livre · ofertas","https://www.mercadolivre.com.br/ofertas"],["Pichau","https://www.pichau.com.br/"],["Terabyte","https://www.terabyteshop.com.br/promocoes"],["KaBuM! · ofertas","https://www.kabum.com.br/ofertas"],["Pelando","https://www.pelando.com.br/"],["Promobit","https://www.promobit.com.br/"],["Hardmob · promoções","https://www.hardmob.com.br/forums/407-Promocoes"],["Zoom · histórico de preço","https://www.zoom.com.br/"]]
};
function promoList(){return S.mode==="demo"?[]:(S.promos?.itens||[]).filter(p=>safeUrl(p.u)&&p.t&&PROMO_CLS.some(c=>c[0]===p.cls))}
function promoCard(p){const url=safeUrl(p.u),img=safeUrl(p.img||"");
  const fim=p.ate?Math.ceil((p.ate-Date.now())/86400000):null;
  return `<article class="box pcard">${img?`<a class="pimg" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('noimg');this.remove()"></a>`:""}
    <div class="pbody"><span class="eyebrow">${esc(p.src||hostOf(url))}${p.plat?` · ${esc(p.plat)}`:""}${p.via?` · via ${esc(p.via)}`:""}</span><h3><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(p.t)}</a></h3>
      <div class="pprice">${p.pct&&p.pct<100?`<span class="poff">-${esc(p.pct)}%</span>`:""}${p.preco?`<b>${esc(p.preco)}</b>`:""}${p.de&&p.de!==p.preco?`<s>${esc(p.de)}</s>`:""}</div>
      <div class="nmeta"><span class="hint">${fim!==null&&fim>=0?(fim<=1?"acaba hoje":`até ${fim} dias`):ago(p.at)}</span><a class="linkbtn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Ver oferta ↗</a></div></div></article>`}
function viewPromocoes(){
  const A=promoList();const cls=S.promoCls||"";
  const AC=A.filter(p=>!cls||p.cls===cls);
  const lojas=[...new Set(AC.map(p=>p.src).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt"));
  if(S.promoLoja&&!lojas.includes(S.promoLoja))S.promoLoja="";
  const AF=AC.filter(p=>!S.promoLoja||p.src===S.promoLoja);
  const cnt=k=>A.filter(p=>p.cls===k).length;
  const upd=S.promos?.atualizadoEm;
  const sites=(cls?[PROMO_CLS.find(c=>c[0]===cls)]:PROMO_CLS).map(([k,n])=>`<div class="psites"><h4>${esc(n)}</h4><div class="ptags">${PROMO_SITES[k].map(([nm,u])=>`<a class="tag" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(nm)} ↗</a>`).join("")}</div></div>`).join("");
  return `<div class="page"><div class="tierhead"><div style="flex:1"><span class="eyebrow">Promoções</span><h3>Ofertas da semana</h3>${upd?`<span class="hint">atualizado há ${ago(upd)}</span>`:""}</div></div>
    <div class="tierpick" role="group" aria-label="Tipo de promoção"><button data-act="promocls" data-id="" aria-pressed="${!cls}">Todas</button>${PROMO_CLS.map(([k,n])=>`<button data-act="promocls" data-id="${k}" aria-pressed="${cls===k}">${esc(n)}${cnt(k)?` <span class="tabn">${cnt(k)}</span>`:""}</button>`).join("")}</div>
    ${lojas.length>1?`<div class="pfilt"><label class="whosel${S.promoLoja?" on":""}"><span class="sr-only">Filtrar por loja</span><select id="promoloja-sel"><option value="">Todas as lojas (${lojas.length})</option>${lojas.map(l=>`<option value="${esc(l)}"${S.promoLoja===l?" selected":""}>${esc(l)}</option>`).join("")}</select></label><span class="hint">${AF.length} oferta${AF.length===1?"":"s"}</span></div>`:""}
    ${AF.length?`<div class="prgrid">${AF.map(promoCard).join("")}</div>`:`<p class="hint">${S.mode==="demo"?"No modo exemplo as promoções não aparecem.":"Nenhuma promoção nessa categoria agora."}</p>`}
    <section class="sec"><h4>Onde procurar</h4><div class="psitegrid">${sites}</div></section></div>`;
}
document.addEventListener("click",e=>{const el=e.target.closest('[data-act="promocls"]');if(!el)return;S.promoCls=el.dataset.id;renderView()});
document.addEventListener("change",e=>{if(e.target.id==="promoloja-sel"){S.promoLoja=e.target.value;renderView()}});

/* ---------- Galera → Pessoas ---------- */
const PSORT=[["amigos","Amigos primeiro"],["zerados","Mais zerados"],["nivel","Maior nível"],["recentes","Ativos agora"]];
function lastActive(p){return Math.max(0,...Object.values(p.games||{}).map(g=>Number(g.updatedAt)||0))}
function pessoaCard(pid){
  const P=players(),p=P[pid],s=stats(p),mid=meId();
  const amigo=mid&&P[mid]&&friendsOf(P[mid])[pid];
  const jog=Object.values(p.games||{}).filter(g=>g.status==="jogando").sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,2);
  const ult=lastActive(p);
  return `<a class="box pcard2" href="#perfil-${esc(pslug(p))}" style="--pc:${esc(p.color||"#888")}"${cz(p).theme&&cz(p).theme!=="nenhum"?` data-th="${cz(p).theme}"`:""}>${fxLayer(p,true)}
    <div class="pc2top">${glyph(p)}<div class="pc2nm"><b>${nk(p)}${vitrineBadges(pid)}</b>${pid===mid?' <span class="you">VOCÊ</span>':amigo?' <span class="you amigo">AMIGO</span>':""}${p.title?`<span class="ptitle">${esc(p.title)}</span>`:""}</div></div>
    <div class="pc2meta">${lvlChip(pid)}${streakChip(p)}${ult>1e9?`<span class="hint">ativo há ${ago(ult)}</span>`:""}</div>
    ${roleChips(pid)}
    <div class="pc2stats"><span><b>${s.done}</b>zerados</span><span><b>${s.playing}</b>jogando</span><span><b>${s.plat}</b>platinas</span><span><b>${Math.round(s.hours)}</b>horas</span></div>
    ${jog.length?`<div class="pc2now"><span class="flabel">Jogando agora</span>${jog.map(g=>`<span class="tag">${esc(g.title)}</span>`).join("")}</div>`:""}
    ${p.mood?`<div class="mood">${esc(p.mood)}</div>`:""}</a>`;
}
function viewPessoas(){
  const P=players(),mid=meId();const fr=mid&&P[mid]?friendsOf(P[mid]):{};
  const q=norm(S.pessoasQ||"");const ord=S.pessoasOrd||"amigos";
  let ids=Object.keys(P).filter(id=>!q||norm(P[id].nick).includes(q)||norm(P[id].title||"").includes(q));
  const by={amigos:(a,b)=>(a===mid?-1:b===mid?1:0)||(!!fr[b]-!!fr[a])||P[a].nick.localeCompare(P[b].nick,"pt"),
    zerados:(a,b)=>stats(P[b]).done-stats(P[a]).done,nivel:(a,b)=>xpOf(b)-xpOf(a),recentes:(a,b)=>lastActive(P[b])-lastActive(P[a])};
  ids.sort(by[ord]||by.amigos);
  return `<div class="page"><div class="tierhead"><div style="flex:1"><span class="eyebrow">Galera</span><h3>${Object.keys(P).length} jogador${Object.keys(P).length===1?"":"es"}</h3></div>
    ${me()&&S.canWrite?`<button class="btn small primary" data-act="find">+ Adicionar amigos</button>`:""}</div>
    <div class="pfilt"><input type="search" id="pessoas-q" placeholder="Buscar pessoa…" aria-label="Buscar pessoa" value="${esc(S.pessoasQ||"")}">
      <div class="tierpick" role="group" aria-label="Ordenar">${PSORT.map(([k,n])=>`<button data-act="pessoasord" data-id="${k}" aria-pressed="${ord===k}">${n}</button>`).join("")}</div></div>
    ${ids.length?`<div class="pgrid2">${ids.map(pessoaCard).join("")}</div>`:`<p class="hint">Ninguém encontrado.</p>`}</div>`;
}
document.addEventListener("click",e=>{const el=e.target.closest('[data-act="pessoasord"]');if(!el)return;S.pessoasOrd=el.dataset.id;renderView()});
document.addEventListener("input",e=>{if(e.target.id!=="pessoas-q")return;S.pessoasQ=e.target.value;const pos=e.target.selectionStart;renderView();const i=document.getElementById("pessoas-q");if(i){i.focus();try{i.setSelectionRange(pos,pos)}catch{}}});

/* =====================================================================
   GAMIFICAÇÃO: missões, sequência (streak), temporadas, conquistas,
   personalização estilo Nitro (de graça) e ligação com o Discord
   ===================================================================== */
const DAY=864e5;
const startOf = k => new Date(k+"T00:00:00").getTime();
function weekStartKey(d=new Date()){const x=new Date(d);const wd=(x.getDay()+6)%7;x.setDate(x.getDate()-wd);return dkey(x)}
function daysUntilWeekEnd(){const wd=(new Date().getDay()+6)%7;return 7-wd}
function daysLeftMonth(){const n=new Date();return new Date(n.getFullYear(),n.getMonth()+1,0).getDate()-n.getDate()+1}
const cap1 = t => String(t||"").charAt(0).toUpperCase()+String(t||"").slice(1);
const prevMonthKey = (k=monthKey()) => {const [y,m]=k.split("-").map(Number);return monthKey(new Date(y,m-2,1))};

/* ---------- sequência de dias ---------- */
function streakOf(p){
  const d=p?.days||{},fz=p?.frozen||{};let n=0;const x=new Date();
  if(!d[dkey(x)])x.setDate(x.getDate()-1);
  while(d[dkey(x)]||fz[dkey(x)]){n++;x.setDate(x.getDate()-1)}
  return n;
}
function bestStreakOf(p){
  const ks=[...new Set([...Object.keys(p?.days||{}),...Object.keys(p?.frozen||{})])].sort();let best=0,cur=0,prev=null;
  for(const k of ks){const t=startOf(k);cur=prev!==null&&Math.round((t-prev)/DAY)===1?cur+1:1;best=Math.max(best,cur);prev=t}
  return best;
}
const streakMult = n => n>=30?2:n>=14?1.75:n>=7?1.5:n>=3?1.2:1;
const streakChip = p => {const n=streakOf(p);return n>=2?`<span class="streak${n>=7?" hot":""}" title="${n} dias seguidos ativo">🔥 ${n}</span>`:""};

/* ---------- missões ---------- */
const MISS_D={
  checkin:{t:"Marcar presença no site",xp:10,ok:(p,c)=>!!p.days?.[c.dia],act:"checkin"},
  upd:{t:"Atualize um jogo seu (onde parou, progresso ou nota)",xp:25,ok:(p,c)=>Object.values(p.games||{}).some(g=>(g.updatedAt||0)>=c.t0),href:"#saves"},
  react:{t:"Reaja ao jogo de alguém da galera",xp:20,ok:(p,c)=>Object.values(p.reacts||{}).some(r=>(r?.at||0)>=c.t0),href:"#estante"},
  com:{t:"Comente no jogo de alguém",xp:25,ok:(p,c)=>comms().some(x=>x.by===p._id&&x.at>=c.t0),href:"#estante"},
  quadro:{t:"Responda um convite ou enquete do Quadro",xp:20,ok:(p,c)=>Object.values(S.resp||{}).some(r=>(r?.[p._id]?.at||0)>=c.t0),href:"#quadro"}
};
const MISS_W={
  dias4:{t:"Fique ativo em 4 dias da semana",xp:80,meta:4,prog:(p,c)=>Object.keys(p.days||{}).filter(k=>k>=c.wk).length},
  zerar:{t:"Zere ou platine um jogo",xp:120,meta:1,prog:(p,c)=>Object.values(p.games||{}).filter(g=>isDone(g)&&(g.updatedAt||0)>=c.w0).length,href:"#saves"},
  dica:{t:"Escreva uma dica ou guia num jogo",xp:100,meta:1,prog:(p,c)=>Object.values(p.games||{}).filter(g=>g.tips&&(g.updatedAt||0)>=c.w0).length,href:"#dicas"},
  react5:{t:"Reaja a 5 jogos da galera",xp:80,meta:5,prog:(p,c)=>Object.values(p.reacts||{}).filter(r=>(r?.at||0)>=c.w0).length,href:"#estante"},
  com3:{t:"Comente 3 vezes",xp:80,meta:3,prog:(p,c)=>comms().filter(x=>x.by===p._id&&x.at>=c.w0).length,href:"#estante"},
  vote:{t:"Vote na tier list do mês",xp:60,meta:1,prog:(p,c)=>((typeof votesOf==="function"?votesOf(monthKey()):{})[p._id]?.at||0)>=c.w0?1:0,href:"#tierlist",need:()=>tierlists()[monthKey()]?.status==="aberta"},
  coop:{t:"Peça parceiro de coop ou chame alguém pra jogar",xp:60,meta:1,prog:(p,c)=>(p.coop?.at||0)>=c.w0?1:0,act:"coop"}
};
function pickBy(seed,arr,n){const a=arr.slice();const out=[];let h=hash(seed);while(out.length<n&&a.length){const i=h%a.length;out.push(a.splice(i,1)[0]);h=hash(String(h)+seed)}return out}
function missionsFor(p){
  const dia=today(),wk=weekStartKey();const c={dia,t0:startOf(dia),wk,w0:startOf(wk)};
  if(typeof ensureVotes==="function"&&tierlists()[monthKey()])ensureVotes(monthKey());
  if(typeof ensureResp==="function")(typeof boardList==="function"?boardList():[]).slice(0,6).forEach(b=>ensureResp(b.id));
  const dIds=["checkin",...pickBy("d"+dia,["upd","react","com","quadro"],2)];
  const wPool=Object.keys(MISS_W).filter(k=>k!=="dias4"&&(!MISS_W[k].need||MISS_W[k].need()));
  const wIds=["dias4",...pickBy("w"+wk,wPool,3)];
  const claimed=p.miss||{};
  const daily=dIds.map(id=>{const m=MISS_D[id];const key=`d:${dia}:${id}`;return {id,key,...m,done:!!m.ok(p,c),claimed:!!claimed[key],prog:m.ok(p,c)?1:0,meta:1}});
  const weekly=wIds.map(id=>{const m=MISS_W[id];const key=`w:${wk}:${id}`;const pr=Math.min(m.meta,m.prog(p,c));return {id,key,...m,done:pr>=m.meta,claimed:!!claimed[key],prog:pr}});
  const bauKey=`d:${dia}:bau`;
  return {daily,weekly,bau:{key:bauKey,xp:40,done:daily.every(x=>x.claimed),claimed:!!claimed[bauKey]}};
}
async function claimMission(key,base){
  const m=me();if(!m||!S.canWrite)return;if(m.miss?.[key]){toast("Já resgatado");return}
  const mult=streakMult(streakOf(m));const xp=Math.round(base*mult);const mes=monthKey();
  try{await saveMe(p=>{p.miss=p.miss||{};p.miss[key]=xp;p.missXp=(Number(p.missXp)||0)+xp;p.missN=(Number(p.missN)||0)+1;p.sxp=p.sxp||{};p.sxp[mes]=(Number(p.sxp[mes])||0)+xp;
      const lim=dkey(new Date(Date.now()-45*DAY));for(const k of Object.keys(p.miss)){const d=k.split(":")[1]||"";if(d<lim)delete p.miss[k]}
      const ml=monthKey(new Date(Date.now()-400*DAY));for(const k of Object.keys(p.sxp))if(k<ml)delete p.sxp[k]});
    toast(`+${xp} XP${mult>1?` (bônus de sequência ×${mult})`:""}`);
  }catch(err){toast(errMsg(err))}
}
function missionsCard(){
  const m=me();if(!m||!S.canWrite||S.mode!=="live")return "";
  const R=missionsFor({...m,_id:S.myId});const st=streakOf(m),mult=streakMult(st);
  const row=x=>`<div class="mis${x.claimed?" ok":x.done?" ready":""}"><span class="mck" aria-hidden="true">${x.claimed?"✓":x.done?"!":""}</span>
    <div class="mtx"><b>${esc(x.t)}</b>${x.meta>1?`<div class="mbar"><i style="width:${x.prog/x.meta*100}%"></i></div><span class="hint">${x.prog}/${x.meta}</span>`:""}</div>
    ${x.claimed?`<span class="mxp done">+${m.miss?.[x.key]||x.xp}</span>`:x.done?`<button class="btn small primary" data-act="mclaim" data-k="${esc(x.key)}" data-xp="${x.xp}">Resgatar +${Math.round(x.xp*mult)}</button>`
      :x.act==="checkin"?`<button class="btn small" data-act="mcheckin">Marcar</button>`:x.act==="coop"?`<button class="btn small" data-act="coop">Ir</button>`:x.href?`<a class="btn small" href="${x.href}">Ir</a>`:`<span class="mxp">+${x.xp}</span>`}</div>`;
  const fd=R.daily.filter(x=>x.claimed).length,fw=R.weekly.filter(x=>x.claimed).length;
  return `<section class="box card missions"><div class="mhead"><div><span class="eyebrow">Missões</span><h3>Hoje e nesta semana</h3></div>
      <div class="mstreak${st>=7?" hot":""}" title="Dias seguidos ativo"><span class="fl" aria-hidden="true">🔥</span><b>${st}</b><span>${st===1?"dia seguido":"dias seguidos"}${mult>1?` · XP ×${mult}`:""}</span></div></div>
    <div class="mgroup"><div class="mgt"><span class="flabel">Diárias · ${fd}/${R.daily.length}</span><span class="hint">renovam à meia-noite</span></div>${R.daily.map(row).join("")}
      <div class="mis bau${R.bau.claimed?" ok":R.bau.done?" ready":""}"><span class="mck" aria-hidden="true">🎁</span><div class="mtx"><b>Baú diário</b><span class="hint">complete as 3 diárias</span></div>
        ${R.bau.claimed?`<span class="mxp done">+${m.miss?.[R.bau.key]||R.bau.xp}</span>`:R.bau.done?`<button class="btn small primary" data-act="mclaim" data-k="${R.bau.key}" data-xp="${R.bau.xp}">Abrir +${Math.round(R.bau.xp*mult)}</button>`:`<span class="mxp">+${R.bau.xp}</span>`}</div></div>
    <div class="mgroup"><div class="mgt"><span class="flabel">Semanais · ${fw}/${R.weekly.length}</span><span class="hint">faltam ${daysUntilWeekEnd()} dia${daysUntilWeekEnd()>1?"s":""}</span></div>${R.weekly.map(row).join("")}</div>
    <div class="mfoot2"><a class="linkbtn" href="#ranking">Temporada ↗</a></div></section>`;
}

/* ---------- temporadas mensais ---------- */
function seasonPts(p,mes){
  if(!p)return 0;const dias=Object.keys(p.days||{}).filter(k=>k.startsWith(mes)).length;
  const t0=startOf(mes+"-01"),[y,m]=mes.split("-").map(Number),t1=new Date(y,m,1).getTime();
  const zer=Object.values(p.games||{}).filter(g=>isDone(g)&&(g.updatedAt||0)>=t0&&(g.updatedAt||0)<t1).length;
  return (Number(p.sxp?.[mes])||0)+dias*5+zer*50;
}
let _seasonMemo={t:0,v:null};
function seasonData(){
  if(_seasonMemo.v&&Date.now()-_seasonMemo.t<3000)return _seasonMemo.v;
  const P=players();const ids=Object.keys(P);const cur=monthKey();const champs={};const top1={},top3={};
  let mk=prevMonthKey(cur);
  for(let i=0;i<12;i++){const sc=ids.map(id=>[id,seasonPts(P[id],mk)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,3);
    if(sc.length){champs[mk]=sc;sc.forEach(([id],j)=>{(top3[id]=top3[id]||[]).push(mk);if(j===0)(top1[id]=top1[id]||[]).push(mk)})}
    mk=prevMonthKey(mk)}
  const atual=ids.map(id=>[id,seasonPts(P[id],cur)]).sort((a,b)=>b[1]-a[1]);
  _seasonMemo={t:Date.now(),v:{cur,atual,champs,top1,top3}};return _seasonMemo.v;
}
function seasonBox(){
  const P=players();const D=seasonData();const mid=meId();const medal=["🥇","🥈","🥉"];
  const lista=D.atual.slice(0,10);const minha=D.atual.findIndex(x=>x[0]===mid);
  const hof=Object.entries(D.champs).slice(0,6);
  return `<section class="box season"><div class="shead"><div><span class="eyebrow">Temporada</span><h3>${esc(cap1(monthName(D.cur)))}</h3><span class="hint">termina em ${daysLeftMonth()} dia${daysLeftMonth()>1?"s":""} · o ranking zera todo mês</span></div>
      <div class="sprize"><b>Prêmios</b><span>🥇 Moldura e título de Campeão</span><span>🥈🥉 Moldura do Pódio</span><span>Todos: cargo no Discord</span></div></div>
    <div class="slist">${lista.map(([id,v],i)=>`<a class="srow${id===mid?" me":""}" href="#perfil-${esc(pslug(P[id]))}"><span class="spos">${medal[i]||i+1}</span>${glyph(P[id],true)}<span class="snm">${nk(P[id])}</span>${streakChip(P[id])}<span class="spts">${v} pts</span></a>`).join("")||'<span class="hint">Ninguém pontuou ainda neste mês.</span>'}</div>
    ${minha>9?`<div class="hint">Você está em ${minha+1}º com ${D.atual[minha][1]} pts.</div>`:""}
    
    ${hof.length?`<details class="hof"><summary class="flabel">Campeões das temporadas</summary>${hof.map(([mk,sc])=>`<div class="hofrow"><b>${esc(cap1(monthName(mk)))}</b>${sc.map(([id],j)=>`<span>${medal[j]} ${nk(P[id]||{nick:"?"})}</span>`).join("")}</div>`).join("")}</details>`:""}</section>`;
}

/* ---------- conquistas novas ---------- */
const shotsOf = p => Object.values(p?.games||{}).reduce((s,g)=>s+((g.shots||[]).length),0);
const notas10 = p => Object.values(p?.games||{}).filter(g=>g.nota===10).length;
BADGES.push(
  {id:"criador",ic:"ZG",col:"linear-gradient(135deg,#f5c518,#ff3b6b)",t:"Criador do site",ok:(s,o,pid)=>isCreator(pid),d:()=>"fundou o Zerados da Galera"},
  {id:"zero50",ic:"50",col:"var(--tS)",t:"Zerador nato",ok:s=>s.done>=50,d:s=>`${s.done} zerados`},
  {id:"zero100",ic:"💯",col:"var(--st-plat)",t:"Lenda viva",ok:s=>s.done>=100,d:s=>`${s.done} zerados`},
  {id:"plat5",ic:"🏆",col:"var(--st-plat)",t:"Caçador de platinas",ok:s=>s.plat>=5,d:s=>`${s.plat} platinas`},
  {id:"horas1k",ic:"⏳",col:"var(--tA)",t:"Mil horas",ok:s=>s.hours>=1000,d:s=>`${Math.round(s.hours)} h`},
  {id:"streak7",ic:"🔥",col:"#ff7a18",t:"Em chamas",ok:(s,o,pid)=>bestStreakOf(players()[pid])>=7,d:(s,o,pid)=>`${bestStreakOf(players()[pid])} dias seguidos`},
  {id:"streak30",ic:"☄️",col:"#ff3d00",t:"Imparável",ok:(s,o,pid)=>bestStreakOf(players()[pid])>=30,d:(s,o,pid)=>`${bestStreakOf(players()[pid])} dias seguidos`},
  {id:"miss10",ic:"🎯",col:"var(--tC)",t:"Missionário",ok:(s,o,pid)=>(players()[pid]?.missN||0)>=10,d:(s,o,pid)=>`${players()[pid]?.missN||0} missões`},
  {id:"miss100",ic:"🎖️",col:"var(--tB)",t:"Viciado em missões",ok:(s,o,pid)=>(players()[pid]?.missN||0)>=100,d:(s,o,pid)=>`${players()[pid]?.missN||0} missões`},
  {id:"podio",ic:"🥉",col:"#cd7f32",t:"Pódio da temporada",ok:(s,o,pid)=>!!seasonData().top3[pid],d:(s,o,pid)=>`top 3 em ${(seasonData().top3[pid]||[]).map(monthName).join(", ")}`},
  {id:"campeao",ic:"👑",col:"#f5c518",t:"Campeão da temporada",ok:(s,o,pid)=>!!seasonData().top1[pid],d:(s,o,pid)=>`campeão em ${(seasonData().top1[pid]||[]).map(monthName).join(", ")}`},
  {id:"foto",ic:"📸",col:"var(--st-queue)",t:"Fotógrafo",ok:(s,o,pid)=>shotsOf(players()[pid])>=20,d:(s,o,pid)=>`${shotsOf(players()[pid])} prints`},
  {id:"nota10",ic:"10",col:"var(--accent)",t:"Obra-prima",ok:(s,o,pid)=>notas10(players()[pid])>=5,d:(s,o,pid)=>`${notas10(players()[pid])} notas 10`},
  {id:"popular",ic:"🤝",col:"var(--tC)",t:"Popular",ok:(s,o,pid)=>Object.keys(friendsOf(players()[pid])).length>=5,d:(s,o,pid)=>`${Object.keys(friendsOf(players()[pid])).length} amigos`},
  {id:"nv10",ic:"X",col:"var(--tS)",t:"Dois dígitos",ok:(s,o,pid)=>levelOf(xpOf(pid)).L>=10,d:()=>"chegou ao nível 10"},
  {id:"nv20",ic:"XX",col:"#f5c518",t:"Mito",ok:(s,o,pid)=>levelOf(xpOf(pid)).L>=20,d:()=>"chegou ao nível 20"}
);
const badgeMini = b => `<span class="bmini" style="--bc:${b.col}" title="${esc(b.t)} · ${esc(b.desc||"")}">${b.ic}</span>`;
function vitrineBadges(pid){const p=players()[pid];const have=badgesOf(pid);const ids=(p?.cosm?.badges||[]).filter(id=>have.some(b=>b.id===id)).slice(0,3);
  return ids.length?`<span class="bvit">${ids.map(id=>badgeMini(have.find(b=>b.id===id))).join("")}</span>`:""}

/* ---------- personalização (desbloqueáveis) ---------- */
const REQ_TXT = r => r.owner?"Exclusivo do criador do site":r.lv?`Nível ${r.lv}`:r.streak?`Sequência de ${r.streak} dias`:r.badge?`Conquista “${(BADGES.find(b=>b.id===r.badge)||{}).t||r.badge}”`:r.top1?"Campeão de temporada":r.top3?"Top 3 de temporada":r.miss?`${r.miss} missões`:"";
const OWNER_UID = (typeof CFG!=="undefined"&&CFG.ownerUid)||"";
const isCreator = pid => !!pid&&!!OWNER_UID&&pid===OWNER_UID;
function unlocked(pid,r){
  if(!r)return true;const p=players()[pid];if(!p)return false;
  if(isCreator(pid))return true;          // o criador do site tem tudo liberado
  if(r.owner)return false;
  if(r.lv&&levelOf(xpOf(pid)).L<r.lv)return false;
  if(r.streak&&bestStreakOf(p)<r.streak)return false;
  if(r.miss&&(p.missN||0)<r.miss)return false;
  if(r.badge&&!badgesOf(pid).some(b=>b.id===r.badge))return false;
  if(r.top1&&!seasonData().top1[pid])return false;
  if(r.top3&&!seasonData().top3[pid])return false;
  return true;
}
const FRAMES={nenhuma:{l:"Nenhuma"},fundador:{l:"✦ Criador",r:{owner:true}},neon:{l:"Pulso neon",r:{lv:2}},arcoiris:{l:"Arco-íris",r:{lv:3}},pixel:{l:"Pixel",r:{lv:4}},ouro:{l:"Ouro",r:{lv:5}},
  gelo:{l:"Gelo",r:{lv:6}},coracao:{l:"Coração",r:{lv:7}},glitch:{l:"Glitch",r:{lv:8}},galaxia:{l:"Galáxia",r:{lv:10}},lendario:{l:"Lendário",r:{lv:20}},
  fogo:{l:"Fogo",r:{streak:7}},cometa:{l:"Cometa",r:{streak:30}},raio:{l:"Raio",r:{miss:30}},platina:{l:"Platina",r:{badge:"platina"}},
  podio:{l:"Pódio",r:{top3:true}},coroa:{l:"Coroa do campeão",r:{top1:true}}};
const PFX={nenhum:{l:"Nenhum"},fundador:{l:"✦ Poeira de ouro",r:{owner:true}},estrelas:{l:"Estrelas",r:{lv:2}},confete:{l:"Confete",r:{lv:3}},neve:{l:"Neve",r:{lv:4}},bolhas:{l:"Bolhas",r:{lv:5}},
  coracoes:{l:"Corações",r:{lv:6}},chuva:{l:"Chuva neon",r:{lv:8}},pixels:{l:"Pixels",r:{lv:10}},aurora:{l:"Aurora",r:{lv:12}},raios:{l:"Tempestade",r:{lv:15}},
  brasas:{l:"Brasas",r:{streak:14}},fogos:{l:"Fogos de artifício",r:{top3:true}}};
const PTHEME={nenhum:{l:"Padrão"},fundador:{l:"✦ Trono do criador",r:{owner:true}},duo:{l:"Duas cores",r:{lv:3}},animado:{l:"Gradiente animado",r:{lv:7}}};
const THEMECOLORS=["#FF3B6B","#FF9F1C","#F5C518","#2EC27E","#16A3C7","#3D5AFE","#9B5DE5","#F15BB5","#00C9A7","#0F0F1A","#7A1F3D","#1F4E79"];
Object.assign(NAMEMODES,{fundador:"✦ Ouro do criador",contorno:"Contorno",sombra:"Sombra 3D",arcoiris:"Arco-íris",onda:"Onda",gradanim:"Gradiente pulsante",glitch:"Glitch",fogo:"Fogo",holo:"Holográfico"});
Object.assign(NAMEFONTS,{pixel:"Pixel",futuro:"Futurista",marcador:"Marcador",cursiva:"Cursiva",terror:"Terror",letreiro:"Letreiro"});
const NAMEMODE_REQ={fundador:{owner:true},brilho:{lv:2},contorno:{lv:2},sombra:{lv:3},arcoiris:{lv:4},onda:{lv:5},gradanim:{lv:6},glitch:{lv:9},holo:{lv:12},fogo:{streak:7}};
const NAMEFONT_REQ={pixel:{lv:3},futuro:{lv:4},marcador:{lv:5},cursiva:{lv:6},terror:{lv:7},letreiro:{lv:8}};
const GIF_REQ={avatar:{lv:2},banner:{lv:4}};
const cz = p => (p&&typeof p.cosm==="object"&&p.cosm)||{};
function frameWrap(p,sm,html){const f=cz(p).frame;return f&&FRAMES[f]&&f!=="nenhuma"?`<span class="gfr fr-${f}${sm?" sm":""}">${html}</span>`:html}
function fxLayer(p,small){const f=cz(p).fx;if(!f||!PFX[f]||f==="nenhum")return "";const n=small?8:16;
  return `<span class="pfx fx-${f}" aria-hidden="true">${Array.from({length:n},(_,i)=>`<i style="--i:${i};--x:${(hash(f+i)%100)}%;--d:${3+hash(i+f)%5}s;--dl:-${hash(f+"d"+i)%6}s"></i>`).join("")}</span>`}
function themeStyle(p){const t=cz(p).theme;if(!t||!PTHEME[t]||t==="nenhum")return "";if(t==="fundador")return ` data-th="fundador"`;const [a,b]=(cz(p).tc||[]).filter(c=>THEMECOLORS.includes(c));
  return a?` data-th="${t}" style="--th1:${a};--th2:${b||a}"`:""}

/* ---------- avatar e banner animados (GIF/WebP sem perder a animação) ---------- */
function readRaw(file,max){return new Promise((res,rej)=>{if(file.size>max)return rej(new Error("grande"));const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>rej(new Error("ler"));fr.readAsDataURL(file)})}
async function animatedOrNull(file,kind){
  if(!/^image\/(gif|webp)$/.test(file.type))return null;
  if(!unlocked(S.myId,GIF_REQ[kind])){toast(`${kind==="avatar"?"Foto":"Banner"} animado libera no ${REQ_TXT(GIF_REQ[kind])}. Usei a imagem parada.`);return null}
  try{return await readRaw(file,205000)}catch{toast("GIF maior que 200 KB: usei a imagem parada. Comprima em ezgif.com para manter a animação.");return null}
}

/* ---------- editor de aparência no perfil ---------- */
function optGrid(name,dict,cur,pid,prev){
  return `<div class="pick czgrid" data-pick="${name}">${Object.entries(dict).map(([k,o])=>{const ok=unlocked(pid,o.r);
    return `<button type="button" class="czopt${ok?"":" locked"}" data-v="${k}" aria-pressed="${k===cur}" ${ok?"":"disabled"} title="${ok?esc(o.l):"Libera com: "+esc(REQ_TXT(o.r))}">${prev(k)}<span>${esc(o.l)}</span>${ok?"":`<small>🔒 ${esc(REQ_TXT(o.r))}</small>`}</button>`}).join("")}</div>`;
}
function aparenciaHTML(){
  const pid=S.myId;const m=me()||{};const c=M.cosm;const fake=k=>({...m,_id:"",avatarV:null,cosm:{frame:k}});
  const have=badgesOf(pid);const lv=levelOf(xpOf(pid)).L;
  return `<div class="field full aparencia"><span class="flabel">✨ Aparência </span>
    <details open><summary>Moldura do avatar</summary>${optGrid("czframe",FRAMES,c.frame,pid,k=>`<span class="czprev">${frameWrap({cosm:{frame:k}},false,glyph({...m,cosm:{}}))}</span>`)}</details>
    <details><summary>Efeito no perfil</summary>${optGrid("czfx",PFX,c.fx,pid,k=>`<span class="czprev fxbox">${fxLayer({cosm:{fx:k}},true)}</span>`)}</details>
    <details><summary>Tema do perfil</summary>${optGrid("czth",PTHEME,c.theme,pid,k=>`<span class="czprev thbox" data-th="${k}" style="--th1:${c.tc[0]};--th2:${c.tc[1]}"></span>`)}
      <div class="flabel">Cores do tema</div>${pickRow("cztc1",THEMECOLORS.map(x=>({v:x,l:"",a:"cor "+x,style:`background:${x}`})),c.tc[0],"swatch")}${pickRow("cztc2",THEMECOLORS.map(x=>({v:x,l:"",a:"cor "+x,style:`background:${x}`})),c.tc[1],"swatch")}</details>
    <details><summary>Conquistas em destaque (até 3, aparecem do lado do seu nome)</summary>${have.length?`<div class="pick czgrid" data-pick="czb">${have.map(b=>`<button type="button" class="czopt" data-v="${b.id}" aria-pressed="${c.badges.includes(b.id)}">${badgeMini(b)}<span>${esc(b.t)}</span></button>`).join("")}</div>`:'<span class="hint">Nenhuma conquista ainda.</span>'}</details>
    <span class="hint">Foto animada (GIF/WebP até 200 KB): ${unlocked(pid,GIF_REQ.avatar)?"liberada ✓":"🔒 "+REQ_TXT(GIF_REQ.avatar)} · Banner animado: ${unlocked(pid,GIF_REQ.banner)?"liberado ✓":"🔒 "+REQ_TXT(GIF_REQ.banner)}</span></div>`;
}
function lockNamePickers(){
  const pid=S.myId;
  const lock=(name,req)=>document.querySelectorAll(`[data-pick="${name}"] button`).forEach(b=>{const r=req[b.dataset.v];if(r&&!unlocked(pid,r)){b.disabled=true;b.classList.add("locked");b.title="Libera com: "+REQ_TXT(r);b.innerHTML+=` <small>🔒</small>`}});
  lock("nsmode",NAMEMODE_REQ);lock("nsfont",NAMEFONT_REQ);
}
const _openProfile0=openProfile;
openProfile=function(){
  _openProfile0();if(M?.type!=="profile")return;const c=cz(me());
  M.cosm={frame:FRAMES[c.frame]?c.frame:"nenhuma",fx:PFX[c.fx]?c.fx:"nenhum",theme:PTHEME[c.theme]?c.theme:"nenhum",tc:[(c.tc||[])[0]||THEMECOLORS[6],(c.tc||[])[1]||THEMECOLORS[0]],badges:(c.badges||[]).slice(0,3)};
  const nf=$("#nkprev")?.closest(".field");if(nf)nf.insertAdjacentHTML("afterend",aparenciaHTML());
  lockNamePickers();
};
document.addEventListener("click",e=>{
  const b=e.target.closest(".pick[data-pick] button");if(!b||M?.type!=="profile"||!M.cosm)return;
  const name=b.parentElement.dataset.pick;if(!name.startsWith("cz"))return;
  e.stopImmediatePropagation();if(b.disabled)return;const v=b.dataset.v;
  if(name==="czb"){const a=M.cosm.badges;const i=a.indexOf(v);if(i<0){if(a.length>=3){toast("Escolha no máximo 3");return}a.push(v)}else a.splice(i,1);b.setAttribute("aria-pressed",i<0);return}
  if(name==="czframe")M.cosm.frame=v;else if(name==="czfx")M.cosm.fx=v;else if(name==="czth")M.cosm.theme=v;
  else if(name==="cztc1"||name==="cztc2"){M.cosm.tc[name==="cztc1"?0:1]=v;document.querySelectorAll(".thbox").forEach(x=>{x.style.setProperty("--th1",M.cosm.tc[0]);x.style.setProperty("--th2",M.cosm.tc[1])})}
  b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));
},true);

/* ---------- ações das missões ---------- */
document.addEventListener("click",e=>{
  const el=e.target.closest('[data-act="mclaim"],[data-act="mcheckin"]');if(!el)return;
  if(el.dataset.act==="mcheckin"){saveMe(()=>{}).then(()=>toast("Presença marcada! 🔥")).catch(err=>toast(errMsg(err)));return}
  claimMission(el.dataset.k,Number(el.dataset.xp)||0);
});

/* ---------- resumo para o robô do Discord (nível, conquistas, sequência, temporada) ---------- */
function lvlSnap(pid){const p=players()[pid];if(!p)return null;const x=xpOf(pid);const cur=monthKey(),pv=prevMonthKey(cur);
  return {L:levelOf(x).L,xp:x,b:badgesOf(pid).map(b=>b.id).sort(),st:streakOf(p),s:{[cur]:seasonPts(p,cur),[pv]:seasonPts(p,pv)}}}
const snapKey = s => s?JSON.stringify([s.L,s.b,s.st>=7?Math.floor(s.st/7):0,Object.entries(s.s||{}).map(([k,v])=>k+":"+Math.floor(v/50))]):"";
let _snapBusy=false;
if(typeof setInterval==="function")setInterval(()=>{
  if(_snapBusy||S.mode!=="live"||!S.canWrite||!S.myId||!S.players?.[S.myId]||M)return;
  const s=lvlSnap(S.myId);if(snapKey(s)===snapKey(S.players[S.myId].lvl))return;
  _snapBusy=true;saveMe(()=>{},{noDay:true}).catch(()=>{}).finally(()=>{_snapBusy=false});
},45000);

/* ---------- temas do site (mais opções; o criador tem todos) ---------- */
Object.assign(SKINS,{
  meianoite:{l:"Meia-noite",lv:2,sw:"#4CC9F0",sw2:"#151d33"},
  sakura:{l:"Sakura",lv:2,sw:"#FF8FB1",sw2:"#2a1822"},
  floresta:{l:"Floresta",lv:3,sw:"#3DDC97",sw2:"#17231b"},
  oceano:{l:"Oceano",lv:4,sw:"#00B4D8",sw2:"#0f2430"},
  souls:{l:"Souls",lv:4,sw:"#E5383B",sw2:"#22121a"},
  dracula:{l:"Drácula",lv:5,sw:"#BD93F9",sw2:"#282a36"},
  playstation:{l:"PlayStation",lv:5,sw:"#2E8BFF",sw2:"#071a33"},
  xbox:{l:"Xbox",lv:5,sw:"#3FD13F",sw2:"#111a11"},
  nintendo:{l:"Nintendo",lv:5,sw:"#FF3B3B",sw2:"#26111a"},
  nord:{l:"Nórdico",lv:6,sw:"#88C0D0",sw2:"#2e3440"},
  cyberpunk:{l:"Cyberpunk",lv:6,sw:"#FCEE0A",sw2:"#1a1626"},
  synthwave:{l:"Synthwave",lv:7,sw:"#FF2A6D",sw2:"#2b1146"},
  matrix:{l:"Matrix",lv:9,sw:"#00FF41",sw2:"#0a140a"},
  lava:{l:"Lava",lv:10,sw:"#FF6B35",sw2:"#24100a"},
  galaxia:{l:"Galáxia",lv:11,sw:"#B388FF",sw2:"#16133a"},
  brasa:{l:"Brasa eterna",lv:1,r:{streak:14},sw:"#FF7A18",sw2:"#241008"},
  campeao:{l:"Campeão",lv:1,r:{top1:true},sw:"#F5C518",sw2:"#1f1a08"},
  criador:{l:"✦ Criador",lv:1,r:{owner:true},sw:"#F5C518",sw2:"#3a1430"}
});
const skinReq = o => o.r||{lv:o.lv||1};
function skinOk(pid,o){if(!o)return false;if(isCreator(pid))return true;if(!pid)return (o.lv||1)<=1&&!o.r;return unlocked(pid,skinReq(o))}

/* =====================================================================
   COMUNIDADE (inspirado em Steam, Duolingo, Letterboxd, Reddit, Strava, Spotify, Twitch)
   feed com curtir/comentar · online agora · ligas semanais · congelar sequência · missão em dupla
   meta do mês · desafio do mês · listas e reviews · fórum por jogo · eventos · palpites
   destaques do perfil · imagens para compartilhar · app instalável
   ===================================================================== */
const MINE = () => S.mode==="live"&&S.canWrite&&me();
const fkey = k => "f~"+hash(k).toString(36);
const cap = (s,n) => {s=String(s||"");return s.length>n?s.slice(0,n)+"…":s};

/* ---------- curtidas (guardadas no perfil de quem curte) ---------- */
function likesOf(key){const out=[];for(const [pid,p] of Object.entries(players()))if(p.likes&&p.likes[key])out.push(pid);return out}
function toggleLike(key){
  if(!MINE()){toast("Entre para curtir");return}
  saveMe(p=>{p.likes=p.likes||{};if(p.likes[key])delete p.likes[key];else p.likes[key]=Date.now();
    const ks=Object.entries(p.likes).sort((a,b)=>b[1]-a[1]);if(ks.length>400)p.likes=Object.fromEntries(ks.slice(0,400))},{noDay:false}).catch(e=>toast(errMsg(e)));
}
const likeBtn = key => {const L=likesOf(key);const on=L.includes(S.myId);return `<button class="lk${on?" on":""}" data-act="like" data-k="${esc(key)}" aria-pressed="${on}" aria-label="Curtir">♥ ${L.length||""}</button>`};

/* ---------- comentários genéricos (feed, listas, fórum) ---------- */
function miniThread(t,ph){
  const th=commentsFor(t);const id="ct-"+hash(t).toString(36);
  return `<div class="mthread">${th.map(c=>{const p=players()[c.by];if(!p)return "";const can=S.mode==="live"&&(c.by===S.myId||S.isOwner||isStaff());
      return `<div class="cmt sm">${glyph(p,true)}<div class="bubble"><div class="meta2"><b>${nk(p)}</b><span>${ago(c.at)}</span>${can?`<button class="linkbtn" data-act="cdel" data-cid="${esc(c.cid)}" data-by="${esc(c.by)}">apagar</button>`:""}${repBtn("c",c.cid,c.by)}</div><p>${esc(c.x)}</p></div></div>`}).join("")}
    ${MINE()?`<div class="mcomp"><input id="${id}" maxlength="400" placeholder="${esc(ph||"Escreva um comentário…")}" aria-label="Comentário"><button class="btn small primary" data-act="tsend" data-t="${esc(t)}" data-in="${id}">Enviar</button></div>`:""}</div>`;
}
function sendComment(t,x,extra){
  return saveDocOf("comments",S.myId,d=>{d.items=d.items||{};d.items[newId("c")]={t,x:x.slice(0,600),at:Date.now(),...(extra||{})}},"items");
}

/* ---------- FEED ---------- */
function feedList(){
  const P=players();const out=[];const verb={jogando:"está jogando",zerado:"zerou",platinado:"platinou",pausado:"pausou",dropado:"dropou",quero:"colocou na fila"};
  for(const g of allGames()){if(!(g.updatedAt>1e9))continue;
    const key=`g:${g.pid}:${g.gid}:${g.status}`;const stars=typeof g.nota==="number"?starsHTML(g.nota):"";
    out.push({key,at:g.updatedAt,pid:g.pid,g,html:`${verb[g.status]||"atualizou"} <a href="#jogo-${esc(slug(g.title))}"><b>${esc(g.title)}</b></a>${g.status==="jogando"&&g.fase?` · ${esc(g.fase)}`:""}`,
      extra:`${isDone(g)&&stars?`<div class="fstars">${stars}</div>`:""}${isDone(g)&&g.comment?`<p class="frev">“${esc(cap(g.comment,280))}”</p>`:""}`});}
  for(const [pid,p] of Object.entries(P)){
    for(const [lid,l] of Object.entries(p.lists||{}))if(l?.t)out.push({key:`l:${pid}:${lid}`,at:l.at||0,pid,html:`criou a lista <a href="#lista-${esc(pid)}-${esc(lid)}"><b>${esc(l.t)}</b></a> · ${(l.items||[]).length} jogos`});
    if(p.steamImp?.n&&p.steamImp.at>1e9)out.push({key:`si:${pid}:${p.steamImp.at}`,at:p.steamImp.at,pid,html:`importou <b>${p.steamImp.n} jogo${p.steamImp.n>1?"s":""}</b> da Steam 🎮`});
    if(p.coop&&daysSince(p.coop.at)<15)out.push({key:`o:${pid}:${p.coop.at}`,at:p.coop.at,pid,html:`procura parceiro para <a href="#jogo-${esc(slug(p.coop.title))}"><b>${esc(p.coop.title)}</b></a>`});
    if(p.liga?.last?.mv&&p.liga.w)out.push({key:`lg:${pid}:${p.liga.w}`,at:startOf(p.liga.w)+3600e3,pid,html:p.liga.last.mv>0?`subiu para a <b>${LIGAS[p.liga.t].n}</b> ${LIGAS[p.liga.t].ic}`:`caiu para a <b>${LIGAS[p.liga.t].n}</b>`});
  }
  for(const c of comms()){
    if(c.t.startsWith("q~")){const sl=c.t.slice(2);out.push({key:`q:${c.by}:${c.cid}`,at:c.at,pid:c.by,html:`perguntou no fórum de <a href="#jogo-${esc(sl)}"><b>${esc(titleFromAny(sl))}</b></a>: “${esc(cap(c.x,120))}”`});continue}
    if(c.t.includes("~"))continue;
    if(c.t.startsWith("quadro-"))continue;
    out.push({key:`c:${c.by}:${c.cid}`,at:c.at,pid:c.by,html:`comentou em <a href="#jogo-${esc(c.t)}"><b>${esc(titleFromAny(c.t))}</b></a>: “${esc(cap(c.x,120))}”`});
  }
  return out.filter(x=>P[x.pid]).sort((a,b)=>b.at-a.at);
}
function titleFromAny(sl){const g=allGames().find(x=>slug(x.title)===sl);return g?g.title:(typeof titleFromSlug==="function"&&titleFromSlug(sl))||sl}
function starsHTML(nota){const st=Math.round(Number(nota))/2;let h="";for(let i=1;i<=5;i++)h+=st>=i?"★":st>=i-.5?"⯪":"☆";return `<span class="stars" title="nota ${fmtNota(nota)}">${h}</span>`}
function viewFeed(){
  const P=players(),mid=meId();const fr=mid&&P[mid]?friendsOf(P[mid]):{};const f=S.feedF||"todos";
  let L=feedList();if(f==="amigos")L=L.filter(x=>fr[x.pid]||x.pid===mid);else if(f==="eu")L=L.filter(x=>x.pid===mid);
  const n=S.feedN||30;const open=S.feedOpen||"";
  return `<div class="page"><div class="tierhead"><div style="flex:1"><span class="eyebrow">Feed</span><h3>O que a galera anda fazendo</h3></div></div>
    <div class="tierpick" role="group" aria-label="Filtrar feed">${[["todos","Todo mundo"],["amigos","Amigos"],["eu","Eu"]].map(([k,l])=>`<button data-act="feedf" data-id="${k}" aria-pressed="${f===k}">${l}</button>`).join("")}</div>
    <div class="feed">${L.slice(0,n).map(x=>{const p=P[x.pid];const t=fkey(x.key);const nc=commentsFor(t).length;
      return `<article class="box fitem2">${x.g?`<div class="fcov">${coverBox(x.g,"mini")}</div>`:""}<div class="fbody"><div class="fhead">${glyph(p,true)}<a href="#perfil-${esc(pslug(p))}" class="fnk">${nk(p)}</a>${vitrineBadges(x.pid)}<span class="hint">${ago(x.at)}</span></div>
        <div class="ftxt">${x.html}</div>${x.extra||""}
        <div class="facts">${likeBtn(x.key)}<button class="lk" data-act="feedc" data-id="${esc(x.key)}" aria-expanded="${open===x.key}">💬 ${nc||""}</button>${x.g&&isDone(x.g)&&x.pid===mid?`<button class="lk" data-act="sharegame" data-pid="${esc(x.pid)}" data-id="${esc(x.g.gid)}">📤 Compartilhar</button>`:""}</div>
        ${open===x.key?miniThread(t):""}</div></article>`}).join("")||'<p class="hint">Nada por aqui ainda.</p>'}</div>
    ${L.length>n?`<div style="text-align:center"><button class="btn" data-act="feedmore">Ver mais</button></div>`:""}</div>`;
}

/* ---------- ONLINE AGORA ---------- */
const ONLINE_MS=5*60e3;
const isOnline = p => (Number(p?.seen)||0)>Date.now()-ONLINE_MS;
function onlineIds(){return Object.entries(players()).filter(([,p])=>isOnline(p)).map(([id])=>id)}
function heartbeat(){
  if(S.mode!=="live"||!S.canWrite||!S.myId||!S.players?.[S.myId]||document.hidden)return;
  const t=Date.now();S.players[S.myId].seen=t;S.db.doc("players/"+S.myId).update({seen:t}).catch(()=>{});
}
if(typeof setInterval==="function"){setTimeout(heartbeat,8000);setInterval(heartbeat,120e3)}
function onlineBox(){
  const P=players();const ids=onlineIds();if(!ids.length||S.mode!=="live")return "";
  return `<section class="box card online"><span class="eyebrow">🟢 Online agora</span><div class="onl">${ids.map(id=>{const p=P[id];const j=Object.values(p.games||{}).filter(g=>g.status==="jogando"&&(g.updatedAt||0)>Date.now()-3*864e5).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0];
    return `<a class="onp" href="#perfil-${esc(pslug(p))}">${glyph(p)}<span><b>${nk(p)}</b>${j?`<small>🎮 na estante: ${esc(j.title)}</small>`:""}</span></a>`}).join("")}</div></section>`;
}

/* ---------- LIGAS SEMANAIS (estilo Duolingo) ---------- */
const LIGAS=[{n:"Liga Bronze",ic:"🥉",c:"#cd7f32"},{n:"Liga Prata",ic:"🥈",c:"#b8c6d1"},{n:"Liga Ouro",ic:"🥇",c:"#f5c518"},{n:"Liga Platina",ic:"💠",c:"#7ad7ff"},{n:"Liga Diamante",ic:"💎",c:"#b388ff"}];
function weekPts(p,wk){
  if(!p)return 0;const w0=startOf(wk),w1=w0+7*DAY;let x=0;
  for(const [k,v] of Object.entries(p.miss||{})){const [tp,d]=k.split(":");if(tp==="d"&&d>=wk&&startOf(d)<w1)x+=Number(v)||0;else if(tp==="w"&&d===wk)x+=Number(v)||0}
  x+=Object.keys(p.days||{}).filter(k=>k>=wk&&startOf(k)<w1).length*5;
  x+=Object.values(p.games||{}).filter(g=>isDone(g)&&(g.updatedAt||0)>=w0&&(g.updatedAt||0)<w1).length*50;
  return x;
}
const ligaOf = p => Math.max(0,Math.min(LIGAS.length-1,Number(p?.liga?.t)||0));
function ligaGroup(t,wk){const P=players();return Object.keys(P).filter(id=>ligaOf(P[id])===t).map(id=>[id,weekPts(P[id],wk)]).sort((a,b)=>b[1]-a[1])}
function ligaZones(n){return {up:n>=4?Math.max(1,Math.round(n*.3)):n>=2?1:0,down:n>=5?Math.max(1,Math.round(n*.2)):0}}
let _ligaBusy=false;
function ligaRollover(){
  if(_ligaBusy||S.mode!=="live"||!S.canWrite||!S.myId)return;const m=S.players?.[S.myId];if(!m)return;
  const cur=weekStartKey();if(m.liga?.w===cur)return;
  const prevWk=dkey(new Date(startOf(cur)-7*DAY));const t=ligaOf(m);let nt=t,last=null;
  if(m.liga?.w===prevWk){const G=ligaGroup(t,prevWk);const pos=G.findIndex(x=>x[0]===S.myId);const z=ligaZones(G.length);const pts=G[pos]?.[1]||0;
    let mv=0;if(pos>=0&&pos<z.up&&pts>0&&t<LIGAS.length-1)mv=1;else if((pos>=G.length-z.down||pts===0)&&t>0)mv=-1;
    nt=t+mv;last={pos:pos+1,of:G.length,pts,mv}}
  _ligaBusy=true;saveMe(p=>{p.liga={t:nt,w:cur,...(last?{last}:{})}},{noDay:true}).catch(()=>{}).finally(()=>{_ligaBusy=false});
}
function ligaBox(){
  const P=players();const mid=meId();const m=P[mid];const wk=weekStartKey();const t=m?ligaOf(m):0;const L=LIGAS[t];
  const G=ligaGroup(t,wk);const z=ligaZones(G.length);const dias=daysUntilWeekEnd();
  return `<section class="box liga" style="--lc:${L.c}"><div class="shead"><div><span class="eyebrow">Liga semanal</span><h3>${L.ic} ${L.n}</h3><span class="hint">termina em ${dias} dia${dias>1?"s":""} · ${z.up?`top ${z.up} sobe`:""}${z.down?` · últimos ${z.down} caem`:""}</span></div>
      <div class="ltiers">${LIGAS.map((x,i)=>`<span class="lt${i===t?" on":""}" title="${x.n}" style="--lc:${x.c}">${x.ic}</span>`).join("")}</div></div>
    ${m?.liga?.last?`<div class="hint">Semana passada: ${m.liga.last.pos}º de ${m.liga.last.of} com ${m.liga.last.pts} pts${m.liga.last.mv>0?" · subiu! 🎉":m.liga.last.mv<0?" · caiu":""}</div>`:""}
    <div class="slist">${G.map(([id,v],i)=>`<a class="srow${id===mid?" me":""}${i<z.up?" up":""}${i>=G.length-z.down?" down":""}" href="#perfil-${esc(pslug(P[id]))}"><span class="spos">${i+1}</span>${glyph(P[id],true)}<span class="snm">${nk(P[id])}</span>${streakChip(P[id])}<span class="spts">${v} pts</span></a>`).join("")}</div>
    </section>`;
}

/* ---------- congelar sequência ---------- */
let _fzBusy=false;
function freezeCheck(){
  if(_fzBusy||S.mode!=="live"||!S.canWrite||!S.myId)return;const m=S.players?.[S.myId];if(!m||!(m.freeze>0))return;
  const d=m.days||{},fz=m.frozen||{};const y=dkey(new Date(Date.now()-DAY)),y2=dkey(new Date(Date.now()-2*DAY));
  if(!d[y]&&!fz[y]&&(d[y2]||fz[y2])){_fzBusy=true;saveMe(p=>{p.frozen=p.frozen||{};p.frozen[y]=1;p.freeze=Math.max(0,(p.freeze||0)-1);
      const lim=dkey(new Date(Date.now()-400*DAY));for(const k of Object.keys(p.frozen))if(k<lim)delete p.frozen[k]},{noDay:true}).then(()=>toast("❄️ Um congelamento salvou sua sequência de ontem!")).catch(()=>{}).finally(()=>{_fzBusy=false})}
}

/* ---------- desafio do mês (Strava) ---------- */
const DESAFIOS={"01":["RPG","Janeiro dos RPGs"],"02":["Plataforma","Fevereiro Plataforma"],"03":["Luta","Março da Pancadaria"],"04":["Aventura","Abril Aventureiro"],"05":["Estratégia","Maio Estratégico"],"06":["Esporte","Junho Esportivo"],
  "07":["Tiro","Julho na Mira"],"08":["Puzzle","Agosto de Quebra-cabeça"],"09":["Simulação","Setembro Simulador"],"10":["Terror","Mês do Terror"],"11":["Corrida","Novembro Veloz"],"12":["Ação","Dezembro de Ação"]};
function desafioMes(){const mk=monthKey();const [est,nome]=DESAFIOS[mk.slice(5)]||["Ação","Desafio do mês"];return {mk,est,nome}}
function desafioProg(p){const {mk,est}=desafioMes();const t0=startOf(mk+"-01");return Object.values(p.games||{}).filter(g=>isDone(g)&&(g.updatedAt||0)>=t0&&estilosDe(g.title).includes(est)).length}

/* ---------- missões extras: dupla, meta do mês, desafio, congelamento ---------- */
const _missionsCard0=missionsCard;
missionsCard=function(){
  let h=_missionsCard0();if(!h)return h;
  const m=me();const P=players();const wk=weekStartKey();const mk=monthKey();const mult=streakMult(streakOf(m));const cl=m.miss||{};
  // dupla
  const fr=Object.keys(friendsOf(m)).filter(id=>P[id]&&friendsOf(P[id])[S.myId]);
  const duo=m.duo?.w===wk&&P[m.duo.pid]?m.duo.pid:"";
  const dd=duo?Object.keys(m.days||{}).filter(k=>k>=wk).length+Object.keys(P[duo].days||{}).filter(k=>k>=wk).length:0;
  const dk=`w:${wk}:duo`;
  const duoH=`<div class="mis${cl[dk]?" ok":dd>=8?" ready":""}"><span class="mck" aria-hidden="true">${cl[dk]?"✓":"🤝"}</span><div class="mtx"><b>Missão em dupla: somem 8 dias ativos na semana</b>
      ${duo?`<div class="mbar"><i style="width:${Math.min(100,dd/8*100)}%"></i></div><span class="hint">com ${esc(P[duo].nick)} · ${Math.min(8,dd)}/8</span>`:fr.length?`<select id="duo-sel" aria-label="Escolha a dupla"><option value="">Escolher amigo…</option>${fr.map(id=>`<option value="${esc(id)}">${esc(P[id].nick)}</option>`).join("")}</select>`:`<span class="hint">Adicione um amigo (e ele te adicionar) para fazer em dupla.</span>`}</div>
      ${cl[dk]?`<span class="mxp done">+${cl[dk]}</span>`:dd>=8?`<button class="btn small primary" data-act="mclaim" data-k="${dk}" data-xp="100">Resgatar +${Math.round(100*mult)}</button>`:`<span class="mxp">+100</span>`}</div>`;
  // meta do mês
  const meta=m.meta?.m===mk?Number(m.meta.n)||0:0;const zm=Object.values(m.games||{}).filter(g=>isDone(g)&&(g.updatedAt||0)>=startOf(mk+"-01")).length;const mkk=`m:${mk}:meta`;const mxp=Math.min(300,meta*60);
  const metaH=`<div class="mis${cl[mkk]?" ok":meta&&zm>=meta?" ready":""}"><span class="mck" aria-hidden="true">${cl[mkk]?"✓":"🎯"}</span><div class="mtx"><b>Meta do mês: zerar ${meta||"…"} jogo${meta===1?"":"s"} da fila</b>
      ${meta?`<div class="mbar"><i style="width:${Math.min(100,zm/meta*100)}%"></i></div><span class="hint">${Math.min(zm,meta)}/${meta} zerados em ${esc(monthName(mk))}</span>`:`<span class="pick metapick">${[1,2,3,5].map(n=>`<button type="button" class="rx" data-act="metaset" data-n="${n}">${n}</button>`).join("")}</span>`}</div>
      ${cl[mkk]?`<span class="mxp done">+${cl[mkk]}</span>`:meta&&zm>=meta?`<button class="btn small primary" data-act="mclaim" data-k="${mkk}" data-xp="${mxp}">Resgatar +${Math.round(mxp*mult)}</button>`:meta?`<span class="mxp">+${mxp}</span>`:""}</div>`;
  // desafio do mês
  const D=desafioMes();const dp=desafioProg(m);const dsk=`m:${mk}:desafio`;
  const desH=`<div class="mis desafio${cl[dsk]?" ok":dp>=1?" ready":""}"><span class="mck" aria-hidden="true">${cl[dsk]?"✓":"🏁"}</span><div class="mtx"><b>${esc(D.nome)}: zere 1 jogo de ${esc(D.est)}</b><span class="hint">desafio da comunidade</span></div>
      ${cl[dsk]?`<span class="mxp done">+${cl[dsk]}</span>`:dp>=1?`<button class="btn small primary" data-act="mclaim" data-k="${dsk}" data-xp="150" data-des="1">Resgatar +${Math.round(150*mult)}</button>`:`<span class="mxp">+150</span>`}</div>`;
  const extra=`<div class="mgroup"><div class="mgt"><span class="flabel">Especiais</span><span class="hint">❄️ ${m.freeze||0}/2 congelamentos · ganhe 1 completando as 4 semanais</span></div>${duoH}${metaH}${desH}</div>`;
  const i=h.lastIndexOf('<div class="mfoot2">');h=i>=0?h.slice(0,i)+extra+h.slice(i):h;
  const L=LIGAS[ligaOf(m)];
  const si=h.indexOf('<div class="mstreak'),gi=h.indexOf('<div class="mgroup">',si);
  if(si>=0&&gi>si){let seg=h.slice(si,gi);const k=seg.lastIndexOf("</div>");seg=seg.slice(0,k)+"</div></div>"+seg.slice(k+6);
    h=h.slice(0,si)+`<div class="mside"><a class="ligachip" href="#ranking" style="--lc:${L.c}" title="Ver a liga no Ranking">${L.ic} ${L.n}</a>`+seg+h.slice(gi)}
  return h;
};
// depois de resgatar: dá congelamento (4 semanais completas) e guarda o selo do desafio
const _claim0=claimMission;
claimMission=async function(key,base){
  await _claim0(key,base);const m=me();if(!m||!m.miss?.[key])return;
  const wk=weekStartKey();const R=missionsFor({...m,_id:S.myId});const fzk=`w:${wk}:freeze`;
  const ups=[];
  if(R.weekly.every(x=>m.miss[x.key])&&!m.miss[fzk])ups.push(p=>{p.miss[fzk]=0;p.freeze=Math.min(2,(p.freeze||0)+1)});
  if(key.endsWith(":desafio"))ups.push(p=>{p.desafios=p.desafios||{};p.desafios[monthKey()]=desafioMes().est});
  if(ups.length)saveMe(p=>{p.miss=p.miss||{};ups.forEach(f=>f(p))},{noDay:true}).then(()=>{if(ups.length&&!key.endsWith(":desafio"))toast("❄️ Ganhou 1 congelamento de sequência!")}).catch(()=>{});
};
document.addEventListener("change",e=>{if(e.target.id!=="duo-sel"||!e.target.value)return;const pid=e.target.value;
  saveMe(p=>{p.duo={w:weekStartKey(),pid}},{noDay:true}).then(()=>toast("Dupla formada! 🤝")).catch(err=>toast(errMsg(err)))});

/* ---------- conquistas novas ---------- */
BADGES.push(
  {id:"desafios3",ic:"🏁",col:"#2EC27E",t:"Desafiante do mês",ok:(s,o,pid)=>Object.keys(players()[pid]?.desafios||{}).length>=3,d:(s,o,pid)=>`${Object.keys(players()[pid]?.desafios||{}).length} desafios mensais`},
  {id:"diamante",ic:"💎",col:"#b388ff",t:"Liga Diamante",ok:(s,o,pid)=>ligaOf(players()[pid])>=4,d:()=>"chegou na liga Diamante"},
  {id:"ajudante",ic:"✅",col:"#16A3C7",t:"Resposta certeira",ok:(s,o,pid)=>bestAnswersOf(pid)>=3,d:(s,o,pid)=>`${bestAnswersOf(pid)} melhores respostas`},
  {id:"curador",ic:"📚",col:"#9B5DE5",t:"Curador de listas",ok:(s,o,pid)=>Object.keys(players()[pid]?.lists||{}).length>=3,d:(s,o,pid)=>`${Object.keys(players()[pid]?.lists||{}).length} listas`},
  {id:"querido",ic:"♥",col:"#ff4d8d",t:"Queridinho da galera",ok:(s,o,pid)=>likesReceived(pid)>=25,d:(s,o,pid)=>`${likesReceived(pid)} curtidas recebidas`}
);
let _lrMemo={t:0,v:{}};
function likesReceived(pid){
  if(Date.now()-_lrMemo.t>3000){const v={};for(const p of Object.values(players()))for(const k of Object.keys(p.likes||{})){const o=k.split(":")[1];if(o)v[o]=(v[o]||0)+1}_lrMemo={t:Date.now(),v}}
  return _lrMemo.v[pid]||0;
}
function bestAnswersOf(pid){let n=0;for(const c of comms())if(c.t.startsWith("q~")&&c.best&&c.best.startsWith(pid+"."))n++;return n}
const _xpOf0=xpOf;
xpOf=function(pid){const p=players()[pid];if(!p)return 0;return _xpOf0(pid)+bestAnswersOf(pid)*40+Math.min(500,likesReceived(pid)*3)+Math.min(10,Object.keys(p.lists||{}).length)*20};

/* ---------- LISTAS (Letterboxd) ---------- */
function listCard(pid,lid,l){const P=players();const p=P[pid];const its=(l.items||[]).slice(0,4);
  return `<a class="box lcard" href="#lista-${esc(pid)}-${esc(lid)}"><div class="lmos">${its.map(t=>coverBox(allGames().find(g=>norm(g.title)===norm(t))||{title:t},"mini")).join("")}</div>
    <div class="lbody"><b>${esc(l.t)}</b><span class="hint">${glyph(p,true)} ${nk(p)} · ${(l.items||[]).length} jogos · ♥ ${likesOf(`l:${pid}:${lid}`).length}</span>${l.d?`<p>${esc(cap(l.d,120))}</p>`:""}</div></a>`}
function viewListas(){
  const P=players();const all=[];for(const [pid,p] of Object.entries(P))for(const [lid,l] of Object.entries(p.lists||{}))if(l?.t)all.push([pid,lid,l]);
  const ord=S.listOrd||"recentes";all.sort(ord==="curtidas"?(a,b)=>likesOf(`l:${b[0]}:${b[1]}`).length-likesOf(`l:${a[0]}:${a[1]}`).length:(a,b)=>(b[2].at||0)-(a[2].at||0));
  return `<div class="page"><div class="tierhead"><div style="flex:1"><span class="eyebrow">Listas</span><h3>Listas da galera</h3></div>${MINE()?`<button class="btn small primary" data-act="listnew">+ Nova lista</button>`:""}</div>
    <div class="tierpick" role="group" aria-label="Ordenar">${[["recentes","Recentes"],["curtidas","Mais curtidas"]].map(([k,l])=>`<button data-act="listord" data-id="${k}" aria-pressed="${ord===k}">${l}</button>`).join("")}</div>
    ${all.length?`<div class="lgrid">${all.map(x=>listCard(...x)).join("")}</div>`:`<p class="hint">Nenhuma lista ainda.</p>`}</div>`;
}
function viewLista(){
  const [pid,lid]=(S.route||"").split("-");const P=players();const p=P[pid];const l=p?.lists?.[lid];
  if(!l)return `<div class="page"><a class="btn small back" href="#listas">← Listas</a>${emptyBox("?","Lista não encontrada","Ela pode ter sido apagada.")}</div>`;
  const key=`l:${pid}:${lid}`;const mine=pid===S.myId;
  return `<div class="page"><a class="btn small back" href="#listas">← Listas</a>
    <section class="box card"><span class="eyebrow">Lista</span><h3>${esc(l.t)}</h3><div class="hint">${glyph(p,true)} ${nk(p)} · ${(l.items||[]).length} jogos · ${ago(l.at)}</div>${l.d?`<p style="white-space:pre-wrap;max-width:65ch">${esc(l.d)}</p>`:""}
      <div class="facts">${likeBtn(key)}${mine?`<button class="btn small" data-act="listedit" data-id="${esc(lid)}">Editar</button><button class="btn small danger" data-act="listdel" data-id="${esc(lid)}">Apagar</button>`:""}</div></section>
    <ol class="llist">${(l.items||[]).map((t,i)=>{const g=allGames().find(x=>norm(x.title)===norm(t))||{title:t};const quem=allGames().filter(x=>norm(x.title)===norm(t)&&isDone(x)).length;
      return `<li class="box"><span class="lnum">${i+1}</span>${coverBox(g,"mini")}<div><a href="#jogo-${esc(slug(t))}"><b>${esc(t)}</b></a>${quem?`<div class="hint">${quem} da galera zerou</div>`:""}</div></li>`}).join("")}</ol>
    <section class="box card"><span class="eyebrow">Comentários</span>${miniThread("l~"+pid+"~"+lid)}</section></div>`;
}
function openListEditor(lid){
  const m=me();const l=lid?m?.lists?.[lid]:null;M={type:"lista",lid:lid||newId("l")};
  const titles=[...new Set(allGames().map(g=>g.title))].sort((a,b)=>a.localeCompare(b,"pt"));
  $("#modal").innerHTML=overlay(`<h2>${l?"Editar lista":"Nova lista"}</h2>
    <div class="field"><label for="ls-t">Nome da lista</label><input id="ls-t" maxlength="80" value="${esc(l?.t||"")}" placeholder="Ex.: Top 10 da vida"></div>
    <div class="field"><label for="ls-d">Descrição (opcional)</label><textarea id="ls-d" maxlength="400">${esc(l?.d||"")}</textarea></div>
    <div class="field"><label for="ls-i">Jogos, um por linha, na ordem</label><textarea id="ls-i" rows="8" maxlength="3000" placeholder="The Witcher 3&#10;Hades II&#10;Elden Ring">${esc((l?.items||[]).join("\n"))}</textarea>
      <div class="lsadd"><input id="ls-add" list="ls-dl" maxlength="80" placeholder="Buscar jogo da galera para adicionar…" aria-label="Adicionar jogo"><button type="button" class="btn small" data-act="lsadd">Adicionar</button></div>
      <datalist id="ls-dl">${titles.map(t=>`<option value="${esc(t)}">`).join("")}</datalist></div>
    <div class="err" id="lserr"></div>
    <div class="mfoot"><div class="r"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button type="button" class="btn primary" data-act="lssave">Salvar lista</button></div></div>`);
  $("#ls-t").focus();
}

/* ---------- REVIEWS ---------- */
function viewReviews(){
  const P=players();const mid=meId();const f=S.revF||"";
  const L=allGames().filter(g=>g.comment&&typeof g.nota==="number"&&(!f||g.pid===f)).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  const autores=[...new Set(allGames().filter(g=>g.comment&&typeof g.nota==="number").map(g=>g.pid))];
  return `<div class="page"><div class="tierhead"><div style="flex:1"><span class="eyebrow">Reviews</span><h3>O que a galera achou</h3></div>
      ${autores.length>1?`<label class="whosel"><span class="sr-only">Filtrar por pessoa</span><select id="revf-sel"><option value="">Todo mundo</option>${autores.map(id=>`<option value="${esc(id)}"${f===id?" selected":""}>${esc(P[id]?.nick||"")}</option>`).join("")}</select></label>`:""}</div>
    ${L.length?`<div class="rgrid">${L.map(g=>{const key=`g:${g.pid}:${g.gid}:${g.status}`;return `<article class="box rcard">${coverBox(g,"mini")}<div class="rbody"><a href="#jogo-${esc(slug(g.title))}"><b>${esc(g.title)}</b></a>
      <div class="rmeta">${starsHTML(g.nota)}<span class="hint">${glyph(g.p,true)} ${nk(g.p)} · ${ago(g.updatedAt)}</span></div><p>${esc(g.comment)}</p><div class="facts">${likeBtn(key)}</div></div></article>`}).join("")}</div>`
      :`<p class="hint">Nenhuma review ainda.</p>`}</div>`;
}

/* ---------- FÓRUM POR JOGO (Reddit) ---------- */
const qKey = c => c.by+"."+c.cid;
function votesOf2(key){return likesOf("v:"+key).length}
function forumQuestions(sl){return comms().filter(c=>c.t==="q~"+(sl||"")||(!sl&&c.t.startsWith("q~"))).sort((a,b)=>b.at-a.at)}
function answersOf(q){return comms().filter(c=>c.t==="a~"+qKey(q)).sort((a,b)=>(b.cid===q.best?1:0)-(a.cid===q.best?1:0)||votesOf2(b.by+"."+b.cid)-votesOf2(a.by+"."+a.cid)||a.at-b.at)}
function qHTML(q,full){
  const P=players();const p=P[q.by];if(!p)return "";const A=answersOf(q);const k=qKey(q);const open=full||S.qOpen===k;const solved=!!q.best;
  return `<article class="box qcard${solved?" solved":""}"><div class="qhead">${glyph(p,true)}<b>${nk(p)}</b><span class="hint">${ago(q.at)}${full?"":` · <a href="#jogo-${esc(q.t.slice(2))}">${esc(titleFromAny(q.t.slice(2)))}</a>`}</span>${solved?`<span class="tag ok">✅ resolvida</span>`:""}</div>
    <p class="qx">${q.h?`<span class="tag">${esc(q.h)}</span> `:""}${esc(q.x)}</p>
    <div class="facts">${likeBtn("v:"+k).replace("♥","▲")}<button class="lk" data-act="qopen" data-id="${esc(k)}" aria-expanded="${open}">💬 ${A.length} resposta${A.length===1?"":"s"}</button>${(q.by===S.myId||S.isOwner||isStaff())?`<button class="linkbtn" data-act="cdel" data-cid="${esc(q.cid)}" data-by="${esc(q.by)}">apagar</button>`:""}${repBtn("c",q.cid,q.by)}</div>
    ${open?`<div class="answers">${A.map(a=>{const ap=P[a.by];if(!ap)return "";const best=q.best===a.by+"."+a.cid;
      return `<div class="ans${best?" best":""}">${glyph(ap,true)}<div class="bubble"><div class="meta2"><b>${nk(ap)}</b><span>${ago(a.at)}</span>${best?`<span class="tag ok">melhor resposta</span>`:""}</div><p>${esc(a.x)}</p>
        <div class="facts">${likeBtn("v:"+a.by+"."+a.cid).replace("♥","▲")}${q.by===S.myId&&a.by!==S.myId&&!best?`<button class="linkbtn" data-act="qbest" data-q="${esc(q.cid)}" data-a="${esc(a.by+"."+a.cid)}">✅ marcar como melhor</button>`:""}${(a.by===S.myId||S.isOwner||isStaff())?`<button class="linkbtn" data-act="cdel" data-cid="${esc(a.cid)}" data-by="${esc(a.by)}">apagar</button>`:""}${repBtn("c",a.cid,a.by)}</div></div></div>`}).join("")}
      ${MINE()?`<div class="mcomp"><input id="an-${esc(k.replace(/\W/g,""))}" maxlength="600" placeholder="Sua resposta…" aria-label="Resposta"><button class="btn small primary" data-act="tsend" data-t="${esc("a~"+k)}" data-in="an-${esc(k.replace(/\W/g,""))}">Responder</button></div>`:""}</div>`:""}</article>`;
}
function forumBox(sl){
  const Q=forumQuestions(sl);
  return `<section class="box card forum" id="forum"><span class="eyebrow">Fórum do jogo</span><h3>${Q.length?`${Q.length} pergunta${Q.length>1?"s":""}`:"Tem alguma dúvida?"}</h3>
    ${MINE()?`<div class="qnew"><select id="qh-${esc(sl)}" aria-label="Tipo"><option value="Dúvida">Dúvida</option><option value="Dica">Dica</option><option value="Spoiler">Spoiler</option><option value="Bug">Bug</option></select><input id="qx-${esc(sl)}" maxlength="400" placeholder="Pergunte para a galera (ex.: como passo do chefe X?)" aria-label="Pergunta"><button class="btn small primary" data-act="qsend" data-sl="${esc(sl)}">Perguntar</button></div>`:""}
    <div class="qlist">${Q.map(q=>qHTML(q)).join("")}</div></section>`;
}

/* ---------- PÁGINA DO JOGO MAIS RICA ---------- */
const _viewJogo0=viewJogo;
viewJogo=function(){
  let h=_viewJogo0();const sl=S.route;if(!sl)return h;
  const title=titleFromAny(sl);const P=players();
  const revs=allGames().filter(g=>slug(g.title)===sl&&g.comment&&typeof g.nota==="number");
  const tips=allGames().filter(g=>slug(g.title)===sl&&hasTips(g));
  const lists=[];for(const [pid,p] of Object.entries(P))for(const [lid,l] of Object.entries(p.lists||{}))if((l?.items||[]).some(t=>slug(t)===sl))lists.push([pid,lid,l]);
  const mineDone=allGames().find(g=>slug(g.title)===sl&&g.pid===S.myId&&isDone(g));
  let extra="";
  if(revs.length)extra+=`<section class="box card"><span class="eyebrow">Reviews da galera</span><div class="rgrid">${revs.map(g=>`<div class="rmini">${glyph(g.p,true)}<div><b>${nk(g.p)}</b> ${starsHTML(g.nota)}<p>${esc(g.comment)}</p></div></div>`).join("")}</div></section>`;
  if(tips.length)extra+=`<section class="box card"><span class="eyebrow">💡 Dicas da galera</span>${tips.map(g=>`<div class="rmini">${glyph(g.p,true)}<div><b>${nk(g.p)}</b>${g.tips&&!g.spoiler?`<p>${esc(cap(g.tips,240))}</p>`:""}<button class="btn small" data-act="tips" data-pid="${esc(g.pid)}" data-id="${esc(g.gid)}">Abrir guia</button></div></div>`).join("")}</section>`;
  if(lists.length)extra+=`<section class="box card"><span class="eyebrow">Aparece nas listas</span><div class="lgrid">${lists.map(x=>listCard(...x)).join("")}</div></section>`;
  extra+=forumBox(sl);
  if(mineDone)extra=`<div style="display:flex;justify-content:flex-end"><button class="btn small" data-act="sharegame" data-pid="${esc(S.myId)}" data-id="${esc(mineDone.gid)}">📤 Compartilhar meu zerado</button></div>`+extra;
  const i=h.indexOf('<section class="box card" id="conversa">');
  return i>=0?h.slice(0,i)+extra+h.slice(i):h+extra;
};
const _viewDicas0=viewDicas;
viewDicas=function(){
  const Q=forumQuestions("").slice(0,8);const open=Q.filter(q=>!q.best).length;
  const box=`<section class="box card forum"><span class="eyebrow">Fórum</span><h3>Perguntas da galera${open?` · ${open} sem resposta certeira`:""}</h3>
    ${Q.length?`<div class="qlist">${Q.map(q=>qHTML(q)).join("")}</div>`:`<span class="hint">Nenhuma pergunta ainda.</span>`}</section>`;
  return box+_viewDicas0();
};

/* ---------- EVENTOS COM CONTAGEM ---------- */
function nextEvent(){const now=Date.now();return (typeof boardList==="function"?boardList():[]).filter(b=>b.type==="evento"&&b.ev?.when&&new Date(b.ev.when).getTime()>now-2*3600e3).sort((a,b)=>new Date(a.ev.when)-new Date(b.ev.when))[0]}
function countdown(ts){const d=ts-Date.now();if(d<=0)return "acontecendo agora";const h=Math.floor(d/3600e3),dd=Math.floor(h/24);return dd>=1?`em ${dd}d ${h%24}h`:h>=1?`em ${h}h ${Math.floor(d%3600e3/60e3)}min`:`em ${Math.max(1,Math.floor(d/60e3))} min`}
function eventBox(){const b=nextEvent();if(!b)return "";ensureResp(b.id);const R=respOf(b.id);const vai=Object.entries(R).filter(([,r])=>r.rsvp==="vou").map(([u])=>u);const mine=R[S.myId]?.rsvp;
  return `<section class="box card evbox"><span class="eyebrow">📅 Próximo evento</span><h3>${esc(b.title)}</h3><div class="evcount" data-when="${esc(b.ev.when)}">${countdown(new Date(b.ev.when).getTime())}</div>
    <div class="hint">${esc(b.ev.game||"")}${b.ev.where?` · ${esc(b.ev.where)}`:""} · ${vai.length} confirmad${vai.length===1?"o":"os"}</div>
    <div class="rsvp">${[["vou","Vou"],["talvez","Talvez"],["nao","Não vou"]].map(([v,l])=>`<button class="rx" data-act="rsvp" data-id="${esc(b.id)}" data-v="${v}" aria-pressed="${mine===v}">${l}</button>`).join("")}<a class="linkbtn" href="#quadro">ver no Quadro</a></div></section>`}
if(typeof setInterval==="function")setInterval(()=>{document.querySelectorAll(".evcount[data-when]").forEach(e=>{e.textContent=countdown(new Date(e.dataset.when).getTime())})},30e3);

/* ---------- PALPITES (fichas de mentira, estilo Twitch) ---------- */
const FICHAS=1000;
const isPalpite = b => b?.type==="enquete"&&b.poll?.palpite;
function palpiteResult(b){const R=respOf(b.id);const bets=Object.entries(R).filter(([,r])=>r.bet&&Number.isInteger(r.bet.o)&&r.bet.v>0);
  const pool=bets.reduce((s,[,r])=>s+r.bet.v,0);const by=(b.poll.opts||[]).map((_,i)=>bets.filter(([,r])=>r.bet.o===i).reduce((s,[,r])=>s+r.bet.v,0));return {bets,pool,by}}
function fichasOf(pid,mes=monthKey()){
  let saldo=FICHAS;for(const b of boardList()){if(!isPalpite(b)||monthKey(new Date(b.at||0))!==mes)continue;ensureResp(b.id);const r=respOf(b.id)[pid];if(!r?.bet)continue;
    const v=r.bet.v;if(!Number.isInteger(b.poll.result)){saldo-=v;continue}
    const {pool,by}=palpiteResult(b);const win=by[b.poll.result]||0;saldo+=r.bet.o===b.poll.result&&win?Math.floor(v*pool/win)-v:-v}
  return saldo;
}
function palpiteBody(b){
  const {pool,by}=palpiteResult(b);const mine=respOf(b.id)[S.myId]?.bet;const res=b.poll.result;const fechado=Number.isInteger(res)||(b.poll.until&&new Date(b.poll.until)<new Date());
  const saldo=S.myId?fichasOf(S.myId):0;const amts=[50,100,250,500].filter(v=>v<=saldo+(mine?.v||0));
  return `<div class="poll">${b.poll.opts.map((o,i)=>{const pct=pool?Math.round(by[i]/pool*100):0;const odd=by[i]?(pool/by[i]).toFixed(1):"–";
      return `<div class="popt pal${res===i?" win":""}${mine?.o===i?" on":""}"><i style="width:${pct}%"></i><span>${esc(o)}${res===i?" ✅":""}</span><b>${by[i]} fichas · ×${odd}</b>
        ${!fechado&&MINE()&&!mine?`<span class="bets">${amts.map(v=>`<button class="rx" data-act="pbet" data-id="${esc(b.id)}" data-o="${i}" data-v="${v}">${v}</button>`).join("")}</span>`:""}
        ${isStaff()&&!Number.isInteger(res)?`<button class="linkbtn" data-act="presult" data-id="${esc(b.id)}" data-o="${i}">definir como resultado</button>`:""}</div>`}).join("")}</div>
    <div class="hint">🎰 Palpite com fichas de mentira (cada um ganha ${FICHAS} por mês). ${mine?`Você apostou ${mine.v} em “${esc(b.poll.opts[mine.o])}”.`:MINE()?`Seu saldo: ${saldo} fichas.`:""} ${fechado?"Apostas encerradas.":""}</div>`;
}
const _boardCard0=boardCard;
boardCard=function(b,compact){
  let h=_boardCard0(b,compact);if(!isPalpite(b))return h;
  h=h.replace(/<div class="poll">[\s\S]*?<\/div>\s*<div class="hint">[\s\S]*?<\/div>/,palpiteBody(b));
  return h.replace('<span class="btype">Enquete</span>','<span class="btype">🎰 Palpite</span>');
};
function palpiteiros(){const P=players();return Object.keys(P).map(id=>[id,fichasOf(id)]).filter(([id])=>boardList().some(b=>isPalpite(b)&&respOf(b.id)[id]?.bet)).sort((a,b)=>b[1]-a[1])}
function palpiteBox(){const L=palpiteiros();if(!L.length)return "";const P=players();
  return `<section class="box card"><span class="eyebrow">🎰 Palpiteiros de ${esc(monthName(monthKey()))}</span>${L.slice(0,8).map(([id,v],i)=>`<div class="srow"><span class="spos">${i+1}</span>${glyph(P[id],true)}<span class="snm">${nk(P[id])}</span><span class="spts">${v} fichas</span></div>`).join("")}</section>`}

/* ---------- DESTAQUES DO PERFIL (vitrine estilo Steam) ---------- */
function destaquesCard(pid){
  const p=players()[pid];if(!p)return "";const B=badgesOf(pid);const rara=B.slice().sort((a,b)=>(S.rar[a.id]?.pct??100)-(S.rar[b.id]?.pct??100))[0];
  const D=seasonData();const pos=D.atual.findIndex(x=>x[0]===pid);const L=LIGAS[ligaOf(p)];const des=Object.entries(p.desafios||{});
  const tiles=[
    rara?`<div class="dtile"><span class="dic">${badgeMini(rara)}</span><b>${esc(rara.t)}</b><span>conquista mais rara · só ${Math.max(1,Math.round(S.rar[rara.id]?.pct||0))}% da galera tem</span></div>`:"",
    `<div class="dtile"><span class="dic">🔥</span><b>${bestStreakOf(p)} ${bestStreakOf(p)===1?"dia":"dias"}</b><span>maior sequência${streakOf(p)>1?` · agora ${streakOf(p)}`:""}</span></div>`,
    `<div class="dtile"><span class="dic">${L.ic}</span><b>${L.n}</b><span>liga desta semana</span></div>`,
    pos>=0&&D.atual[pos][1]>0?`<div class="dtile"><span class="dic">🏆</span><b>${pos+1}º lugar</b><span>temporada de ${esc(monthName(D.cur))}</span></div>`:"",
    des.length?`<div class="dtile"><span class="dic">🏁</span><b>${des.length} desafio${des.length>1?"s":""}</b><span>${des.slice(-3).map(([,e])=>esc(e)).join(" · ")}</span></div>`:"",
    bestAnswersOf(pid)?`<div class="dtile"><span class="dic">✅</span><b>${bestAnswersOf(pid)}</b><span>melhores respostas no fórum</span></div>`:"",
    likesReceived(pid)?`<div class="dtile"><span class="dic">♥</span><b>${likesReceived(pid)}</b><span>curtidas recebidas</span></div>`:""
  ].filter(Boolean).join("");
  const lists=Object.entries(p.lists||{}).filter(([,l])=>l?.t);
  return `<section class="box card"><span class="eyebrow">Destaques</span><div class="dgrid">${tiles}</div>
    ${lists.length?`<div class="flabel" style="margin-top:12px">Listas</div><div class="lgrid">${lists.map(([lid,l])=>listCard(pid,lid,l)).join("")}</div>`:""}</section>`;
}
const _viewPerfil0=viewPerfil;
viewPerfil=function(){
  let h=_viewPerfil0();const pid=typeof pidBySlug==="function"?pidBySlug(S.route):null;if(!pid)return h;
  const mine=pid===S.myId;
  h=h.replace(`data-act="retro" data-id="${esc(pid)}">Retrospectiva ${YEAR}</button>`,`data-act="retro" data-id="${esc(pid)}">Retrospectiva ${YEAR}</button><button class="btn small" data-act="shareprof" data-id="${esc(pid)}">📤 ${mine?"Compartilhar":"Imagem"}</button>`);
  const i=h.indexOf("</section>",h.indexOf('class="box phero'));
  return i>=0?h.slice(0,i+10)+destaquesCard(pid)+h.slice(i+10):h;
};

/* ---------- IMAGENS PARA COMPARTILHAR (stories 1080×1920) ---------- */
function loadImg(src){return new Promise(r=>{if(!src)return r(null);const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src=src})}
async function shareCard(o){
  try{await document.fonts?.ready}catch{}
  const W=1080,H=1920,cv=document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d");
  const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,o.c1||"#1b1430");g.addColorStop(1,o.c2||"#FF3B6B");x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle="rgba(0,0,0,.28)";x.fillRect(60,60,W-120,H-120);
  const logo=await loadImg("img/logo-160.png");if(logo)x.drawImage(logo,90,90,140,140);
  x.fillStyle="#fff";x.font="900 54px Bungee, Impact, sans-serif";x.fillText("ZERADOS DA GALERA",250,185);
  let y=330;
  const av=await loadImg(o.img);if(av){x.save();x.beginPath();x.arc(W/2,y+150,150,0,Math.PI*2);x.clip();x.drawImage(av,W/2-150,y,300,300);x.restore();y+=360}
  else if(o.glyph){x.fillStyle=o.c2||"#FF3B6B";x.beginPath();x.arc(W/2,y+150,150,0,Math.PI*2);x.fill();x.fillStyle="#fff";x.font="160px sans-serif";x.textAlign="center";x.fillText(o.glyph,W/2,y+205);x.textAlign="left";y+=360}
  x.textAlign="center";x.fillStyle="#fff";x.font="800 84px Rubik, sans-serif";wrap(x,o.title,W/2,y+60,W-200,92);y+=o.title.length>22?250:150;
  x.font="600 46px Rubik, sans-serif";x.fillStyle="rgba(255,255,255,.85)";if(o.sub){wrap(x,o.sub,W/2,y,W-220,56);y+=130}
  x.textAlign="left";
  for(const [k,v] of (o.stats||[])){x.fillStyle="rgba(255,255,255,.12)";x.fillRect(140,y-70,W-280,120);x.fillStyle="#fff";x.font="800 64px Rubik, sans-serif";x.fillText(String(v),180,y+12);x.font="500 38px Rubik, sans-serif";x.fillStyle="rgba(255,255,255,.85)";x.textAlign="right";x.fillText(k,W-180,y+5);x.textAlign="left";y+=150}
  x.textAlign="center";x.fillStyle="#fff";x.font="700 44px Rubik, sans-serif";x.fillText("zeradosdagalera.com.br",W/2,H-140);x.textAlign="left";
  const blob=await new Promise(r=>cv.toBlob(r,"image/png"));if(!blob){toast("Não consegui gerar a imagem");return}
  const file=new File([blob],(o.file||"zerados")+".png",{type:"image/png"});
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:o.title,text:"Zerados da Galera · zeradosdagalera.com.br"});return}}catch(e){if(e?.name==="AbortError")return}
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=file.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);toast("Imagem baixada 📸");
}
function wrap(x,t,cx,y,maxW,lh){const words=String(t).split(" ");let line="";for(const w of words){const test=line?line+" "+w:w;if(x.measureText(test).width>maxW&&line){x.fillText(line,cx,y);line=w;y+=lh}else line=test}x.fillText(line,cx,y)}
const avatarSrc = p => p?._id&&p.avatarV&&typeof mediaSrc==="function"?mediaSrc(`players/${p._id}/media/avatar`,p.avatarV):"";
function shareProfile(pid){const p=players()[pid];if(!p)return;const s=stats(p);const l=levelOf(xpOf(pid));
  shareCard({file:"perfil-"+slug(p.nick),title:p.nick,sub:`Nível ${l.L} · ${l.name}${streakOf(p)>1?` · 🔥 ${streakOf(p)} dias`:""}`,c1:"#140f24",c2:p.color,img:avatarSrc(p),glyph:p.glyph,
    stats:[["zerados na vida",s.done],[`zerados em ${YEAR}`,s.year],["horas jogadas",Math.round(s.hours)],["platinas",s.plat],["conquistas",badgesOf(pid).length]]})}
function shareGame(pid,gid){const p=players()[pid];const g=p?.games?.[gid];if(!g)return;
  shareCard({file:"zerei-"+slug(g.title),title:g.title,sub:`${p.nick} ${g.status==="platinado"?"platinou":"zerou"}${typeof g.nota==="number"?` · nota ${fmtNota(g.nota)}`:""}`,c1:"#140f24",c2:p.color,img:typeof localCover==="function"?localCover(g.title):"",glyph:"🏆",
    stats:[g.hours?["horas",g.hours]:null,g.platform?["plataforma",g.platform]:null,g.year?["ano",g.year]:null].filter(Boolean)})}

/* ---------- APP INSTALÁVEL (PWA) ---------- */
let _installEv=null;
if(typeof window!=="undefined"&&window.addEventListener){
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();_installEv=e;try{renderActions()}catch{}});
  if("serviceWorker" in navigator&&location.protocol==="https:")window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})});
}
const _renderActions0=renderActions;
renderActions=function(){_renderActions0();const A=$("#actions");if(A&&_installEv&&!A.querySelector('[data-act="install"]'))A.insertAdjacentHTML("afterbegin",`<button class="btn small" data-act="install">📲 Instalar app</button>`)};

/* ---------- NOTIFICAÇÕES NOVAS ---------- */
const _notifsFor0=notifsFor;
notifsFor=function(pid){
  const base=_notifsFor0(pid);const P=players();const mine=P[pid];if(!mine)return base;const out=[];
  for(const [oid,o] of Object.entries(P)){if(oid===pid)continue;
    for(const [k,at] of Object.entries(o.likes||{})){const parts=k.split(":");
      if(parts[0]==="v"){const [by]=String(parts[1]||"").split(".");if(by===pid)out.push({at,p:o,h:"#dicas",html:`<b>${esc(o.nick)}</b> deu ▲ na sua mensagem do fórum`});continue}
      if(parts[1]!==pid)continue;
      const what=parts[0]==="l"?`sua lista <b>${esc(mine.lists?.[parts[2]]?.t||"")}</b>`:parts[0]==="g"?`<b>${esc(mine.games?.[parts[2]]?.title||"seu jogo")}</b>`:"sua atividade";
      out.push({at,p:o,h:parts[0]==="l"?`#lista-${pid}-${parts[2]}`:"#feed",html:`<b>${esc(o.nick)}</b> curtiu ${what}`})}}
  const myKeys={};for(const x of feedList())if(x.pid===pid)myKeys[fkey(x.key)]=x;
  for(const c of comms()){if(c.by===pid)continue;const cp=P[c.by];if(!cp)continue;
    if(myKeys[c.t])out.push({at:c.at,p:cp,h:"#feed",html:`<b>${esc(cp.nick)}</b> comentou na sua atividade: “${esc(cap(c.x,60))}”`});
    else if(c.t.startsWith("l~"+pid+"~"))out.push({at:c.at,p:cp,h:`#lista-${pid}-${c.t.split("~")[2]}`,html:`<b>${esc(cp.nick)}</b> comentou na sua lista: “${esc(cap(c.x,60))}”`});
    else if(c.t.startsWith("a~"+pid+".")){const q=comms().find(x=>x.by===pid&&("a~"+pid+"."+x.cid)===c.t);out.push({at:c.at,p:cp,h:q?`#jogo-${q.t.slice(2)}`:"#dicas",html:`<b>${esc(cp.nick)}</b> respondeu sua pergunta: “${esc(cap(c.x,60))}”`})}
    else if(c.t.startsWith("q~")&&c.best&&c.best.startsWith(pid+"."))out.push({at:c.at,p:cp,h:`#jogo-${c.t.slice(2)}`,html:`✅ <b>${esc(cp.nick)}</b> escolheu sua resposta como a melhor (+40 XP)`});
  }
  if(mine.liga?.last&&mine.liga.w)out.push({at:startOf(mine.liga.w)+60e3,p:null,h:"#ranking",html:`Liga: você ficou em ${mine.liga.last.pos}º de ${mine.liga.last.of}${mine.liga.last.mv>0?` e subiu para a <b>${LIGAS[ligaOf(mine)].n}</b> ${LIGAS[ligaOf(mine)].ic}`:mine.liga.last.mv<0?` e caiu para a <b>${LIGAS[ligaOf(mine)].n}</b>`:""}`});
  const ev=nextEvent();if(ev&&new Date(ev.ev.when).getTime()-Date.now()<24*3600e3)out.push({at:Date.now()-1,p:null,h:"#quadro",html:`📅 <b>${esc(ev.title)}</b> começa ${countdown(new Date(ev.ev.when).getTime())}`});
  return [...base,...out].sort((a,b)=>b.at-a.at).slice(0,60);
};

/* ---------- INÍCIO e RANKING: novos blocos ---------- */
const _viewHome0=viewHome;
viewHome=function(){let h=_viewHome0();const extra=eventBox()+onlineBox();if(!extra)return h;
  const i=h.indexOf('<div class="col">',h.indexOf('<div class="col">')+5);return i>=0?h.slice(0,i+17)+extra+h.slice(i+17):h};
const _seasonBox0=seasonBox;
seasonBox=function(){return ligaBox()+_seasonBox0()+palpiteBox()};

/* ---------- rotas novas (feed, listas, lista-…, reviews) ---------- */
["feed","listas","reviews"].forEach(v=>{if(!VIEWS.includes(v))VIEWS.push(v)});
const _route0=route;
route=function(h){
  h=(h??location.hash.slice(1))||"";try{h=decodeURIComponent(h)}catch{}
  if(h.startsWith("lista-")){S.view="lista";S.route=h.slice(6);if(M)closeModal();renderAll();try{window.scrollTo({top:0})}catch{};return}
  return _route0(h);
};

/* ---------- ações ---------- */
document.addEventListener("click",async e=>{
  const el=e.target.closest("[data-act]");if(!el)return;const a=el.dataset.act;
  if(a==="like"){toggleLike(el.dataset.k);return}
  if(a==="feedf"){S.feedF=el.dataset.id;renderView();return}
  if(a==="feedmore"){S.feedN=(S.feedN||30)+30;renderView();return}
  if(a==="feedc"){S.feedOpen=S.feedOpen===el.dataset.id?"":el.dataset.id;renderView();return}
  if(a==="qopen"){S.qOpen=S.qOpen===el.dataset.id?"":el.dataset.id;renderView();return}
  if(a==="tsend"){const i=document.getElementById(el.dataset.in);const x=(i?.value||"").trim();if(!x||!MINE())return;i.value="";sendComment(el.dataset.t,x).catch(err=>toast(errMsg(err)));return}
  if(a==="qsend"){const sl=el.dataset.sl;const i=document.getElementById("qx-"+sl);const x=(i?.value||"").trim();if(!x||!MINE())return;const hh=document.getElementById("qh-"+sl)?.value||"Dúvida";i.value="";sendComment("q~"+sl,x,{h:hh}).then(()=>toast("Pergunta publicada")).catch(err=>toast(errMsg(err)));return}
  if(a==="qbest"){const cid=el.dataset.q,ans=el.dataset.a;saveDocOf("comments",S.myId,d=>{if(d.items?.[cid])d.items[cid].best=ans},"items").then(()=>toast("Melhor resposta marcada ✅")).catch(err=>toast(errMsg(err)));return}
  if(a==="listnew"){openListEditor();return}
  if(a==="listedit"){openListEditor(el.dataset.id);return}
  if(a==="listdel"){if(el.dataset.c!=="1"){el.dataset.c="1";el.textContent="Confirmar apagar";return}const lid=el.dataset.id;saveMe(p=>{if(p.lists)delete p.lists[lid]},{noDay:true}).then(()=>{toast("Lista apagada");go("listas")}).catch(err=>toast(errMsg(err)));return}
  if(a==="listord"){S.listOrd=el.dataset.id;renderView();return}
  if(a==="lsadd"){const i=$("#ls-add"),ta=$("#ls-i");const v=(i?.value||"").trim();if(!v)return;ta.value=(ta.value.trim()?ta.value.trim()+"\n":"")+v;i.value="";i.focus();return}
  if(a==="lssave"&&M?.type==="lista"){const t=$("#ls-t").value.trim();if(!t){$("#lserr").textContent="Dê um nome para a lista.";return}
    const items=[...new Set($("#ls-i").value.split("\n").map(x=>x.trim()).filter(Boolean))].slice(0,100).map(x=>x.slice(0,80));if(!items.length){$("#lserr").textContent="Coloque pelo menos um jogo.";return}
    const lid=M.lid;const prev=me()?.lists?.[lid];
    saveMe(p=>{p.lists=p.lists||{};if(Object.keys(p.lists).length>=20&&!p.lists[lid])throw new Error("Máximo de 20 listas");p.lists[lid]={t:t.slice(0,80),d:$("#ls-d").value.trim().slice(0,400),items,at:prev?.at||Date.now()}})
      .then(()=>{closeModal();toast("Lista salva");go("lista-"+S.myId+"-"+lid)}).catch(err=>{$("#lserr").textContent=err.message||errMsg(err)});return}
  if(a==="metaset"){const n=Number(el.dataset.n);saveMe(p=>{p.meta={m:monthKey(),n}},{noDay:true}).then(()=>toast(`Meta: zerar ${n} este mês 🎯`)).catch(err=>toast(errMsg(err)));return}
  if(a==="pbet"){const b=boardList().find(x=>x.id===el.dataset.id);if(!b||!MINE())return;const o=Number(el.dataset.o),v=Number(el.dataset.v);
    if(respOf(b.id)[S.myId]?.bet){toast("Você já apostou nesse");return}if(fichasOf(S.myId)<v){toast("Fichas insuficientes");return}
    const cur={...(respOf(b.id)[S.myId]||{}),bet:{o,v},at:Date.now()};S.resp={...(S.resp||{}),[b.id]:{...respOf(b.id),[S.myId]:cur}};renderView();
    queue(()=>S.db.doc(`board/${b.id}/resp/${S.myId}`).set(cur)).then(()=>toast(`Palpite feito: ${v} fichas 🎰`)).catch(err=>toast(errMsg(err)));return}
  if(a==="presult"){if(!isStaff())return;if(el.dataset.c!=="1"){el.dataset.c="1";el.textContent="confirmar resultado?";return}
    S.db.doc(`board/${el.dataset.id}`).update({"poll.result":Number(el.dataset.o)}).then(()=>toast("Resultado definido")).catch(err=>toast(errMsg(err)));return}
  if(a==="shareprof"){shareProfile(el.dataset.id);return}
  if(a==="sharegame"){shareGame(el.dataset.pid,el.dataset.id);return}
  if(a==="install"){if(_installEv){_installEv.prompt();try{await _installEv.userChoice}catch{}_installEv=null;renderActions()}return}
});
document.addEventListener("change",e=>{if(e.target.id==="revf-sel"){S.revF=e.target.value;renderView()}});
document.addEventListener("keydown",e=>{if(e.key!=="Enter")return;const t=e.target;if(!(t instanceof HTMLInputElement))return;
  const btn=t.parentElement?.querySelector('[data-act="tsend"],[data-act="qsend"]');if(btn&&(t.id.startsWith("ct-")||t.id.startsWith("an-")||t.id.startsWith("qx-"))){e.preventDefault();btn.click()}});

/* ---------- tarefas periódicas: virada da liga e congelamento ---------- */
if(typeof setInterval==="function"){setTimeout(()=>{ligaRollover();freezeCheck()},6000);setInterval(()=>{ligaRollover();freezeCheck()},300e3)}

/* ---------- editar os próprios comentários (feed, jogos, quadro, listas e fórum) ---------- */
function commentEl(btn){const box=btn.closest(".bubble,.qcard");if(!box)return null;return box.classList.contains("qcard")?box.querySelector(".qx"):box.querySelector(":scope > p")}
function openEditor(btn,text){
  const el=commentEl(btn);if(!el)return;const cid=btn.dataset.cid;
  el.outerHTML=`<div class="ced" data-cid="${esc(cid)}"><textarea id="ed-${esc(cid)}" maxlength="600" aria-label="Editar comentário">${esc(text)}</textarea>
    <div class="facts"><button class="btn small primary" data-act="cedsave" data-cid="${esc(cid)}">Salvar</button><button class="btn small ghost" data-act="cedcancel">Cancelar</button></div></div>`;
  const ta=document.getElementById("ed-"+cid);if(ta){ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length)}
}
function addEditButtons(){
  if(S.mode!=="live"||!S.myId)return;
  document.querySelectorAll(`#view [data-act="cdel"][data-by="${CSS.escape(S.myId)}"]`).forEach(b=>{
    if(b.previousElementSibling?.dataset?.act==="cedit")return;const c=comms().find(x=>x.cid===b.dataset.cid&&x.by===S.myId);if(!c)return;
    b.insertAdjacentHTML("beforebegin",`<button class="linkbtn" data-act="cedit" data-cid="${esc(c.cid)}">editar</button>`);
    if(S.editing?.cid===c.cid)openEditor(b,S.editing.text);
  });
  document.querySelectorAll('#view [data-act="cdel"]').forEach(b=>{const c=comms().find(x=>x.cid===b.dataset.cid&&x.by===b.dataset.by);
    if(c?.ed&&!b.parentElement.querySelector(".edtag"))b.parentElement.insertAdjacentHTML("beforeend",`<span class="edtag hint">(editado)</span>`)});
}
const _renderView1=renderView;
renderView=function(){_renderView1();try{addEditButtons()}catch{}};
document.addEventListener("input",e=>{if(e.target.id?.startsWith("ed-")&&S.editing)S.editing.text=e.target.value});
document.addEventListener("click",e=>{
  const el=e.target.closest('[data-act="cedit"],[data-act="cedsave"],[data-act="cedcancel"]');if(!el)return;const a=el.dataset.act;
  if(a==="cedit"){const c=comms().find(x=>x.cid===el.dataset.cid&&x.by===S.myId);if(!c)return;S.editing={cid:c.cid,text:c.x};openEditor(el.nextElementSibling||el,c.x);return}
  if(a==="cedcancel"){S.editing=null;renderView();return}
  if(a==="cedsave"){const cid=el.dataset.cid;const x=(document.getElementById("ed-"+cid)?.value||"").trim();if(!x){toast("O comentário não pode ficar vazio");return}
    S.editing=null;saveDocOf("comments",S.myId,d=>{if(d.items?.[cid]){d.items[cid].x=x.slice(0,600);d.items[cid].ed=Date.now()}},"items").then(()=>toast("Comentário editado")).catch(err=>toast(errMsg(err)));return}
});

/* ---------- editar mensagens do chat ---------- */
document.addEventListener("input",e=>{if(e.target.id?.startsWith("med-"))S.chatEditText=e.target.value});
document.addEventListener("click",e=>{
  const el=e.target.closest('[data-act="medit"],[data-act="medsave"],[data-act="medcancel"]');if(!el)return;const a=el.dataset.act;
  if(a==="medit"){S.chatEdit=el.dataset.id;S.chatEditText=null;renderView();const t=document.getElementById("med-"+el.dataset.id);if(t){t.focus();t.setSelectionRange(t.value.length,t.value.length)}return}
  if(a==="medcancel"){S.chatEdit=null;S.chatEditText=null;renderView();return}
  if(a==="medsave"){const id=el.dataset.id;const x=(document.getElementById("med-"+id)?.value||"").trim();if(!x){toast("A mensagem não pode ficar vazia");return}
    S.chatEdit=null;S.chatEditText=null;saveDocOf("chat",S.myId,d=>{if(d.msgs?.[id]){d.msgs[id].x=x.slice(0,800);d.msgs[id].ed=Date.now()}}).then(()=>toast("Mensagem editada")).catch(err=>toast(errMsg(err)));return}
});

/* =====================================================================
   MODERAÇÃO: Guardião (bot automático), denúncias de mensagens,
   moderadores apagando conteúdo, castigo (silenciar por um tempo) e registro
   ===================================================================== */
S.mod={castigos:{},log:{},resolvidas:{}};

/* ---------- 🛡️ Guardião: filtro automático ---------- */
// ofensas pesadas, preconceito e ameaças: a mensagem é barrada
const GUARD_BLOCK=["viado","viadinho","bichinha","traveco","sapatao","retardado","retardada","mongoloide","aleijado","crioulo","macaco imundo",
  "filho da puta","filha da puta","fdp","arrombado","arrombada","vagabunda","piranha","vai tomar no cu","vtnc","tnc","vai se foder","vsf",
  "se mate","vai se matar","estupr","nazista","heil hitler","lixo humano","cancer humano"];
// palavrões comuns: passam, mas aparecem disfarçados (p*rra)
const GUARD_MASK=["porra","caralho","merda","foda","foder","fodase","puta","pqp","krl","caralhas","bosta","cacete","desgraca","cuzao","cuzão","otario","otário","otaria","otária","desgraça","babaca","idiota","imbecil"];
function guardNorm(t){
  return " "+String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/[0@4]/g,m=>({"0":"o","@":"a","4":"a"}[m])).replace(/[1!]/g,"i").replace(/3/g,"e").replace(/[5$]/g,"s").replace(/7/g,"t")
    .replace(/\b(\w)[.\-_*](?=\w\b)/g,"$1").replace(/[^a-z\s]/g," ").replace(/(\w)\1{2,}/g,"$1$1").replace(/\s+/g," ")+" ";
}
const guardHas = (n,w) => {const x=w.replace(/(\w)\1+/g,"$1");const nn=n.replace(/(\w)\1+/g,"$1");return nn.includes(" "+x+" ")||(x.length>=5&&nn.includes(" "+x))};
function guardCheck(text){
  const n=guardNorm(text);const hit=GUARD_BLOCK.find(w=>guardHas(n,w));
  if(hit)return {block:true,why:"linguagem ofensiva ou preconceituosa"};
  let clean=String(text);
  for(const w of GUARD_MASK){const re=new RegExp(`\\b(${w.split("").join("[\\W_]*")})\\b`,"gi");clean=clean.replace(re,m=>m[0]+"*".repeat(Math.max(1,m.length-2))+m[m.length-1])}
  return {block:false,clean};
}
// anti-spam: muitas mensagens seguidas ou a mesma mensagem repetida
const _sent=[];let _spamUntil=0;let _guardStrikes=[];
function spamCheck(text){
  const now=Date.now();if(now<_spamUntil)return `Calma! Espere ${Math.ceil((_spamUntil-now)/1000)}s para mandar de novo.`;
  while(_sent.length&&now-_sent[0].at>15000)_sent.shift();
  if(_sent.length>=5){_spamUntil=now+30000;return "Muitas mensagens seguidas. Espere 30 segundos."}
  const t=norm(text);if(t.length>3&&_sent.filter(s=>s.t===t).length>=2){_spamUntil=now+20000;return "Mensagem repetida. Espere um pouquinho."}
  _sent.push({t,at:now});return "";
}
function castigoDe(uid){const c=S.mod.castigos?.[uid];return c&&Number(c.until)>Date.now()?c:null}
function guardLocked(){try{return Number(localStorage.getItem("zg-guard-lock")||0)}catch{return 0}}
// roda antes de qualquer envio (chat, comentários, fórum, edições)
function guardSend(field){
  if(!field)return true;const text=field.value||"";if(!text.trim())return true;
  const c=castigoDe(S.myId);if(c){toast(`🔇 Você está de castigo até ${new Date(c.until).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}${c.why?` · ${c.why}`:""}`);return false}
  const lk=guardLocked();if(lk>Date.now()){toast(`🛡️ Guardião: envio pausado por ${Math.ceil((lk-Date.now())/60000)} min por mensagens ofensivas.`);return false}
  const sp=spamCheck(text);if(sp){toast("🛡️ "+sp);return false}
  const r=guardCheck(text);
  if(r.block){
    const now=Date.now();_guardStrikes=_guardStrikes.filter(t=>now-t<600000);_guardStrikes.push(now);
    if(_guardStrikes.length>=3){try{localStorage.setItem("zg-guard-lock",String(now+600000))}catch{}}
    toast(`🛡️ Guardião: mensagem barrada por ${r.why}. Reescreva, por favor.${_guardStrikes.length>=3?" Envio pausado por 10 min.":""}`);
    if(S.mode==="live"&&S.myId)autoReport(text,r.why);
    return false;
  }
  if(r.clean!==text)field.value=r.clean;
  return true;
}
function autoReport(text,why){
  const cur=clone(S.myReports||{items:{}});cur.items=cur.items||{};
  cur.items[newId("r")]={target:S.myId,why:"🛡️ Guardião: "+why,x:String(text).slice(0,200),at:Date.now(),auto:true};
  const ks=Object.entries(cur.items).sort((a,b)=>(b[1].at||0)-(a[1].at||0));if(ks.length>60)cur.items=Object.fromEntries(ks.slice(0,60));
  S.myReports=cur;S.db.doc(`reports/${S.myId}`).set(cur).catch(()=>{});
}
// intercepta os botões de envio antes dos outros (fase de captura)
const GUARD_ACTS={csend:()=>$("#cmt-text"),tsend:el=>document.getElementById(el.dataset.in),qsend:el=>document.getElementById("qx-"+el.dataset.sl),cedsave:el=>document.getElementById("ed-"+el.dataset.cid),medsave:el=>document.getElementById("med-"+el.dataset.id)};
document.addEventListener("click",e=>{const el=e.target.closest("[data-act]");if(!el)return;const f=GUARD_ACTS[el.dataset.act];if(!f||S.mode!=="live")return;
  if(!guardSend(f(el))){e.stopImmediatePropagation();e.preventDefault()}},true);
document.addEventListener("submit",e=>{if(e.target.id!=="chatform"||S.mode!=="live")return;if(!guardSend($("#chat-text"))){e.stopImmediatePropagation();e.preventDefault()}},true);
document.addEventListener("keydown",e=>{if(e.key!=="Enter"||e.shiftKey||e.target.id!=="chat-text"||S.mode!=="live")return;if(!guardSend(e.target)){e.stopImmediatePropagation();e.preventDefault()}},true);

/* ---------- denunciar mensagem ou comentário ---------- */
function repBtn(kind,id,by){if(S.mode!=="live"||!S.canWrite||!me()||!id||by===S.myId)return "";return `<button class="linkbtn rep" data-act="mrep" data-k="${kind}" data-id="${esc(id)}" data-by="${esc(by)}" aria-label="Denunciar">denunciar</button>`}
function refText(k,id,by){if(k==="m"){const m=chatData().msgs.find(x=>x.mid===id&&x.by===by);return m?{x:m.x,t:"chat:"+m.r}:null}const c=comms().find(x=>x.cid===id&&x.by===by);return c?{x:c.x,t:c.t}:null}
function openMsgReport(k,id,by){
  const p=players()[by];const ref=refText(k,id,by);M={type:"mrep",k,id,by,why:"Ofensa ou assédio"};
  $("#modal").innerHTML=overlay(`<h2>Denunciar ${k==="m"?"mensagem":"comentário"}</h2>
    <div class="repq">${p?glyph(p,true)+" "+nk(p):""}<p>“${esc(ref?.x||"")}”</p></div>
    <div class="field"><span class="flabel">Motivo</span>${pickRow("why",["Ofensa ou assédio","Preconceito","Spam","Spoiler sem aviso","Conteúdo impróprio","Outro"].map(v=>({v,l:v})),"Ofensa ou assédio")}</div>
    <div class="field"><label for="mrep-x">Detalhes (opcional)</label><textarea id="mrep-x" maxlength="300"></textarea></div>
    <span class="hint">A denúncia vai para o dono e os moderadores. Quem você denunciou não fica sabendo.</span>
    <div class="mfoot"><div class="r"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button class="btn primary" type="button" data-act="mrepsend">Enviar denúncia</button></div></div>`);
}

/* ---------- castigo, registro e denúncias resolvidas ---------- */
function modLog(acao,alvo,x){
  if(!isStaff()||!S.db)return;const id=newId("l");
  S.db.doc("mod/log").set({items:{[id]:{by:S.myId,acao:String(acao).slice(0,80),alvo:alvo||"",x:String(x||"").slice(0,160),at:Date.now()}}},{merge:true}).catch(()=>{});
}
async function castigar(uid,min,why){
  if(!isStaff()||!uid)return;if(uid===S.myId){toast("Você não pode se castigar 😅");return}
  if(rolesOf(uid).some(r=>r==="admin"||r==="moderador")&&!S.isOwner){toast("Só o dono castiga moderadores");return}
  const until=Date.now()+min*60000;
  await S.db.doc("mod/castigos").set({map:{[uid]:{until,why:String(why||"").slice(0,120),by:S.myId,at:Date.now()}}},{merge:true});
  modLog(`castigou por ${durTxt(min)}`,uid,why);toast(`🔇 ${players()[uid]?.nick||"Pessoa"} de castigo por ${durTxt(min)}`);
}
async function tirarCastigo(uid){
  if(!isStaff())return;await S.db.doc("mod/castigos").update({["map."+uid]:firebase.firestore.FieldValue.delete()});
  modLog("tirou o castigo",uid,"");toast("Castigo retirado");
}
const durTxt = m => m>=10080?`${Math.round(m/10080)} semana${m>=20160?"s":""}`:m>=1440?`${Math.round(m/1440)} dia${m>=2880?"s":""}`:m>=60?`${Math.round(m/60)} h`:`${m} min`;
const DURS=[[10,"10 min"],[60,"1 hora"],[1440,"1 dia"],[4320,"3 dias"],[10080,"1 semana"]];

/* ---------- assinaturas (castigos para todos; denúncias e registro só para a staff) ---------- */
let _modSub=null,_modStaffSub=null;
function modSubscribe(){
  if(S.mode!=="live"||!S.db||!S.myId)return;
  if(!_modSub)_modSub=S.db.doc("mod/castigos").onSnapshot(sn=>{S.mod.castigos=(sn.exists&&sn.data()?.map)||{};softRender()},()=>{});
  if(isStaff()&&!_modStaffSub){
    const a=S.db.doc("mod/log").onSnapshot(sn=>{S.mod.log=(sn.exists&&sn.data()?.items)||{};if(S.view==="moderacao")softRender()},()=>{});
    const b=S.db.doc("mod/resolvidas").onSnapshot(sn=>{S.mod.resolvidas=(sn.exists&&sn.data()?.map)||{};softRender()},()=>{});
    const c=S.isOwner?null:S.db.collection("reports").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=d.data()||{}});S.reports=o;softRender()},()=>{});
    _modStaffSub=[a,b,c];
  }
}
if(typeof setInterval==="function"){setTimeout(modSubscribe,4000);setInterval(modSubscribe,20000)}

function allReports(){const out=[];for(const [uid,d] of Object.entries(S.reports||{}))for(const [rid,r] of Object.entries(d.items||{}))if(r)out.push({...r,rid,uid,key:uid+"."+rid});return out.sort((a,b)=>(b.at||0)-(a.at||0))}
const openReports = () => allReports().filter(r=>!S.mod.resolvidas[r.key]);

/* ---------- painel de moderação ---------- */
function viewModeracao(){
  if(!isStaff())return `<div class="page">${emptyBox("🛡️","Só para a staff","Esta página é do dono e dos moderadores.")}</div>`;
  const P=players();const R=openReports();const res=allReports().filter(r=>S.mod.resolvidas[r.key]).slice(0,15);
  const cast=Object.entries(S.mod.castigos||{}).filter(([,c])=>Number(c.until)>Date.now());
  const log=Object.values(S.mod.log||{}).sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,40);
  const nick=id=>esc(P[id]?.nick||"?");
  const repCard=r=>{const alvo=r.ref?.by||r.target;const pa=P[alvo];const ref=r.ref?refText(r.ref.k,r.ref.id,r.ref.by):null;const gone=r.ref&&!ref;
    return `<article class="box modcard${r.auto?" auto":""}"><div class="mhead3"><span class="tag">${esc(r.why||"Denúncia")}</span><span class="hint">${r.auto?"detectado pelo Guardião":`por ${nick(r.uid)}`} · ${ago(r.at)}</span></div>
      <div class="mtarget">${pa?glyph(pa,true)+" "+nk(pa):"?"}${castigoDe(alvo)?` <span class="tag">🔇 de castigo</span>`:""}</div>
      ${ref?`<p class="mq">“${esc(ref.x)}”</p>`:r.x?`<p class="mq">“${esc(r.x)}”</p>`:""}${gone?`<span class="hint">(conteúdo já apagado)</span>`:""}${r.det?`<div class="hint">Detalhes: ${esc(r.det)}</div>`:""}
      <div class="facts">${ref&&!gone?`<button class="btn small danger" data-act="modapaga" data-key="${esc(r.key)}">Apagar conteúdo</button>`:""}
        ${alvo&&alvo!==S.myId?`<select class="moddur" id="dur-${esc(r.key.replace(/\W/g,""))}" aria-label="Tempo de castigo">${DURS.map(([m,l])=>`<option value="${m}">${l}</option>`).join("")}</select><button class="btn small" data-act="modcast" data-uid="${esc(alvo)}" data-key="${esc(r.key)}" data-why="${esc(r.why||"")}">🔇 Castigar</button>`:""}
        <button class="btn small ghost" data-act="modok" data-key="${esc(r.key)}">Dispensar</button></div></article>`};
  return `<div class="page"><div class="tierhead"><div style="flex:1"><span class="eyebrow">🛡️ Moderação</span><h3>${R.length} denúncia${R.length===1?"":"s"} aberta${R.length===1?"":"s"}</h3><span class="hint">Visível só para o dono e os moderadores.</span></div></div>
    <div class="modgrid"><div class="col">
      ${R.length?R.map(repCard).join(""):'<section class="box card"><span class="hint">Nenhuma denúncia aberta. Tudo em paz por aqui ✌️</span></section>'}
      ${res.length?`<details class="box card"><summary class="flabel">Resolvidas recentemente (${res.length})</summary>${res.map(r=>`<div class="hint">${esc(r.why||"")} · ${nick(r.ref?.by||r.target)} · ${esc(S.mod.resolvidas[r.key]?.acao||"")} por ${nick(S.mod.resolvidas[r.key]?.by)}</div>`).join("")}</details>`:""}
    </div><div class="col">
      <section class="box card"><span class="eyebrow">🔇 Castigos ativos</span>${cast.length?cast.map(([uid,c])=>`<div class="srow">${P[uid]?glyph(P[uid],true):""}<span class="snm">${nick(uid)}<small class="hint"> até ${new Date(c.until).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}${c.why?" · "+esc(c.why):""}</small></span><button class="btn small" data-act="moduncast" data-uid="${esc(uid)}">Tirar</button></div>`).join(""):'<span class="hint">Ninguém de castigo.</span>'}
        <div class="flabel" style="margin-top:12px">Castigar alguém</div>
        <div class="modform"><select id="mc-uid" aria-label="Pessoa"><option value="">Escolha a pessoa…</option>${Object.keys(P).filter(id=>id!==S.myId).sort((a,b)=>P[a].nick.localeCompare(P[b].nick,"pt")).map(id=>`<option value="${esc(id)}">${esc(P[id].nick)}</option>`).join("")}</select>
          <select id="mc-dur" aria-label="Tempo">${DURS.map(([m,l])=>`<option value="${m}">${l}</option>`).join("")}</select><input id="mc-why" maxlength="120" placeholder="Motivo (a pessoa vê)"><button class="btn small primary" data-act="modcastf">Castigar</button></div>
        <span class="hint">De castigo, a pessoa continua vendo o site, mas não comenta nem manda mensagem no chat.</span></section>
      <section class="box card"><span class="eyebrow">🛡️ Guardião</span><p class="hint" style="margin:0">O bot barra automaticamente ofensas, preconceito e ameaças, disfarça palavrões (p*rra) e segura spam (5 mensagens em 15 s ou mensagem repetida). Quem insiste 3 vezes fica 10 min sem enviar, e cada bloqueio aparece aqui como denúncia.</p></section>
      <section class="box card"><span class="eyebrow">Registro</span>${log.length?log.map(l=>`<div class="hint" style="color:var(--ink)"><b>${nick(l.by)}</b> ${esc(l.acao)}${l.alvo?` · ${nick(l.alvo)}`:""}${l.x?` · “${esc(cap(l.x,60))}”`:""} <span class="hint">${ago(l.at)}</span></div>`).join(""):'<span class="hint">Nenhuma ação ainda.</span>'}</section>
    </div></div></div>`;
}
if(!VIEWS.includes("moderacao"))VIEWS.push("moderacao");

/* ---------- banner de castigo e botão do painel ---------- */
const _renderBanner0=renderBanner;
renderBanner=function(){_renderBanner0();const c=S.mode==="live"&&S.myId?castigoDe(S.myId):null;if(!c)return;
  const B=$("#banner");if(!B||typeof B.insertAdjacentHTML!=="function")return;B.insertAdjacentHTML("beforeend",`<div class="banner mute"><span>🔇 Você está de castigo até <b>${new Date(c.until).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</b>${c.why?` · motivo: ${esc(c.why)}`:""}. Até lá não dá para comentar nem mandar mensagem.</span></div>`)};
const _renderActions1=renderActions;
renderActions=function(){_renderActions1();if(S.mode!=="live"||!isStaff())return;const A=$("#actions");if(!A||typeof A.insertAdjacentHTML!=="function"||A.querySelector('[data-act="modpanel"]'))return;
  const n=openReports().length;A.insertAdjacentHTML("beforeend",`<a class="btn" data-act="modpanel" href="#moderacao">🛡️ Moderação${n?`<span class="n">${n>9?"9+":n}</span>`:""}</a>`)};

/* ---------- ações ---------- */
document.addEventListener("click",async e=>{
  const el=e.target.closest("[data-act]");if(!el)return;const a=el.dataset.act;
  if(a==="mrep"){openMsgReport(el.dataset.k,el.dataset.id,el.dataset.by);return}
  if(a==="mrepsend"&&M?.type==="mrep"){const ref=refText(M.k,M.id,M.by);const det=($("#mrep-x")?.value||"").trim();
    try{const cur=clone(S.myReports||{items:{}});cur.items=cur.items||{};cur.items[newId("r")]={target:M.by,why:M.why,x:String(ref?.x||"").slice(0,300),det:det.slice(0,300),ref:{k:M.k,id:M.id,by:M.by},at:Date.now()};
      await S.db.doc(`reports/${S.myId}`).set(cur);S.myReports=cur;closeModal();toast("Denúncia enviada. Obrigado por ajudar a manter a galera em paz 🛡️")}catch(err){toast(errMsg(err))}return}
  if(!isStaff())return;
  if(a==="modapaga"){const r=allReports().find(x=>x.key===el.dataset.key);if(!r?.ref)return;if(el.dataset.c!=="1"){el.dataset.c="1";el.textContent="Confirmar apagar";return}
    const {k,id,by}=r.ref;const ref=refText(k,id,by);
    try{if(k==="m")await saveDocOf("chat",by,d=>{if(d.msgs)delete d.msgs[id]});else await saveDocOf("comments",by,d=>{if(d.items)delete d.items[id]});
      modLog(k==="m"?"apagou mensagem do chat":"apagou comentário",by,ref?.x);
      await S.db.doc("mod/resolvidas").set({map:{[r.key]:{by:S.myId,at:Date.now(),acao:"conteúdo apagado"}}},{merge:true});toast("Conteúdo apagado")}catch(err){toast(errMsg(err))}return}
  if(a==="modcast"){const sel=document.getElementById("dur-"+el.dataset.key.replace(/\W/g,""));const min=Number(sel?.value||60);
    try{await castigar(el.dataset.uid,min,el.dataset.why);await S.db.doc("mod/resolvidas").set({map:{[el.dataset.key]:{by:S.myId,at:Date.now(),acao:`castigo de ${durTxt(min)}`}}},{merge:true})}catch(err){toast(errMsg(err))}return}
  if(a==="modcastf"){const uid=$("#mc-uid")?.value;if(!uid){toast("Escolha a pessoa");return}try{await castigar(uid,Number($("#mc-dur").value),$("#mc-why").value.trim())}catch(err){toast(errMsg(err))}return}
  if(a==="moduncast"){try{await tirarCastigo(el.dataset.uid)}catch(err){toast(errMsg(err))}return}
  if(a==="modok"){try{await S.db.doc("mod/resolvidas").set({map:{[el.dataset.key]:{by:S.myId,at:Date.now(),acao:"dispensada"}}},{merge:true});modLog("dispensou uma denúncia","","")}catch(err){toast(errMsg(err))}return}
});

/* ---------- v21: cenários de jogos no perfil (arte original, nada de marca registrada) ---------- */
const SCENES={"sc-sinal": {"l": "Sinal desconhecido", "tag": "horror espacial", "r": {"lv": 4}}, "sc-fogueira": {"l": "Fogueira sombria", "tag": "fantasia sombria", "r": {"lv": 3}}, "sc-neon": {"l": "Cidade neon", "tag": "cyberpunk", "r": {"lv": 5}}, "sc-8bit": {"l": "Fliperama 8-bit", "tag": "retrô", "r": {"lv": 2}}, "sc-pista": {"l": "Pista noturna", "tag": "corrida", "r": {"lv": 6}}, "sc-ruinas": {"l": "Terra devastada", "tag": "pós-apocalipse", "r": {"lv": 7}}, "sc-oeste": {"l": "Pôr do sol no oeste", "tag": "faroeste", "r": {"lv": 8}}, "sc-reino": {"l": "Reino medieval", "tag": "medieval", "r": {"lv": 9}}, "sc-sakura": {"l": "Japão feudal", "tag": "samurai", "r": {"lv": 10}}, "sc-piratas": {"l": "Mar dos piratas", "tag": "piratas", "r": {"lv": 11}}, "sc-cosmos": {"l": "Odisseia espacial", "tag": "ficção científica", "r": {"lv": 12}}, "sc-mansao": {"l": "Mansão assombrada", "tag": "terror", "r": {"lv": 14}}, "sc-masmorra": {"l": "Masmorra", "tag": "dungeon", "r": {"lv": 13}}, "sc-fundomar": {"l": "Fundo do mar", "tag": "aquático", "r": {"lv": 15}}, "sc-arena": {"l": "Arena de luta", "tag": "luta", "r": {"lv": 16}}, "sc-vulcao": {"l": "Forja vulcânica", "tag": "vulcão", "r": {"lv": 17}}, "sc-gelo": {"l": "Picos gelados", "tag": "neve", "r": {"lv": 18}}, "sc-estadio": {"l": "Estádio à noite", "tag": "esporte", "r": {"lv": 19}}, "sc-selva": {"l": "Selva perdida", "tag": "exploração", "r": {"lv": 20}}, "sc-hangar": {"l": "Hangar de robôs", "tag": "mecha", "r": {"lv": 22}}, "sc-encantada": {"l": "Floresta encantada", "tag": "fantasia", "r": {"lv": 24}}, "sc-dunas": {"l": "Dunas e ruínas", "tag": "deserto", "r": {"lv": 26}}, "sc-buraconegro": {"l": "Horizonte de eventos", "tag": "cosmos", "r": {"lv": 30}}, "sc-inferno": {"l": "Coração em chamas", "tag": "sequência 30", "r": {"streak": 30}}, "sc-campeao": {"l": "Salão do campeão", "tag": "campeão", "r": {"top1": true}}};
Object.entries(SCENES).forEach(([k,o])=>{PTHEME[k]={l:"🎮 "+o.l,r:o.r}});
const _themeStyle0=themeStyle;
themeStyle=function(p){const t=cz(p).theme;if(t&&SCENES[t])return ` data-th="${t}"`;return _themeStyle0(p)};
const _viewPerfilSc=viewPerfil;
const _renderViewSc=renderView;
renderView=function(){_renderViewSc.apply(this,arguments);try{const ph=document.querySelector('.phero[data-th^="sc-"]');const r=document.documentElement;if(ph&&SCENES[ph.dataset.th])r.dataset.psc=ph.dataset.th;else delete r.dataset.psc}catch{}};
function cenarioBox(){const p=me()||{};const cur=cz(p).theme||"nenhum";const pid=S.myId;
  const opts=[["nenhum",{l:"Sem cenário",tag:"cores normais"}],...Object.entries(SCENES)];
  return `<section class="box card scbox"><span class="eyebrow">🎮 Cenário do perfil</span><div class="scgrid">${opts.map(([k,o])=>{const ok=k==="nenhum"||unlocked(pid,o.r);
    return `<button type="button" class="scopt${ok?"":" locked"}" data-act="scpick" data-k="${k}" aria-pressed="${k===cur}" ${ok?"":"disabled"}><span class="thbox" data-th="${k}"></span><b>${esc(o.l)}</b><small>${ok?esc(o.tag):"🔒 "+esc(REQ_TXT(o.r))}</small></button>`}).join("")}</div></section>`}
document.addEventListener("click",e=>{const b=e.target.closest('[data-act="scpick"]');if(!b)return;e.stopImmediatePropagation();e.preventDefault();if(b.disabled||!S.canWrite)return;
  const k=b.dataset.k;saveMe(p=>{p.cosm={...(p.cosm&&typeof p.cosm==="object"?p.cosm:{}),theme:k}},{noDay:true}).then(()=>{renderAll();toast(k==="nenhum"?"Cenário removido":"Cenário aplicado 🎮")}).catch(err=>toast(errMsg(err)))},true);
viewPerfil=function(){let h=_viewPerfilSc.apply(this,arguments);
  if(S.myId&&h.includes('<span class="eyebrow">Tema do site</span>')&&pidBySlug(S.route)===S.myId){
    h=h.replace('<section class="box card"><span class="eyebrow">Tema do site</span>',cenarioBox()+'<section class="box card"><span class="eyebrow">Tema do site</span>');
    }
  return h};

/* ================= v24: ANIMES, SÉRIES, FILMES E MANGÁS ================= */
// Organização:
//  • Tier List (aba principal) ganhou categorias: Jogos · Animes · Séries · Filmes · Mangás. Cada categoria tem
//    Do mês (votação lançada pela staff), Galera (média de todo mundo), Minha e De outra pessoa.
//  • Cada um adiciona os seus títulos (capa automática) e eles aparecem no próprio perfil.
//  • Descobrir → 🎌 Animes: lançamentos da temporada (AniList, com link do Crunchyroll) e notícias de anime.
// Dados: players/{uid}.media = {id:{t,k,st,nota,tier,c,img,ref,y,at}} · votação: tierlists/{AAAA-MM~tipo} (+ votes/{uid})
const GK_KINDS={anime:{l:"Anime",ic:"🎌",pl:"Animes",art:"o anime"},serie:{l:"Série",ic:"📺",pl:"Séries",art:"a série"},filme:{l:"Filme",ic:"🎬",pl:"Filmes",art:"o filme"},manga:{l:"Mangá",ic:"📖",pl:"Mangás",art:"o mangá"}};
const GK_ST={assistindo:{l:"Assistindo",lm:"Lendo"},visto:{l:"Terminei"},quero:{l:"Na fila"},pausado:{l:"Pausado"},dropado:{l:"Dropado"}};
const GK_TIERS=["S","A","B","C","D"];
const GK_IMG_OK=/^https:\/\/(s4\.anilist\.co|img\.anili\.st|static\.tvmaze\.com|upload\.wikimedia\.org)\//;
const gkImg = u => typeof u==="string"&&GK_IMG_OK.test(u)?u:"";
const gkStL = (st,k) => (k==="manga"&&st==="assistindo")?GK_ST.assistindo.lm:(GK_ST[st]?.l||st);
const gkKey = t => slug(String(t||""));
const gkAvg = a => a.length?a.reduce((s,b)=>s+b,0)/a.length:0;
["animes"].forEach(v=>{if(!VIEWS.includes(v))VIEWS.push(v)});
S.tierCat=S.tierCat||"jogos";S.gkWho=S.gkWho||{};S.profKind=S.profKind||{};

function mediaOf(pid){const p=players()[pid];const m=p&&typeof p.media==="object"&&p.media?p.media:{};
  return Object.entries(m).filter(([,x])=>x&&x.t&&GK_KINDS[x.k]).map(([mid,x])=>({...x,mid,pid}))}
function allMedia(){return Object.keys(players()).flatMap(mediaOf)}

/* ---------- capa ---------- */
function gkPoster(x,cls=""){const u=gkImg(x.img||x.coverUrl);const ic=GK_KINDS[x.k]?.ic||"🎞️";
  return `<span class="gkpost ${cls}">${u?`<img src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:""}<span class="gkph" aria-hidden="true">${ic}</span></span>`}

/* ---------- busca de capas ---------- */
async function gkSearch(q,k){
  q=String(q||"").trim();if(q.length<2)return [];
  try{
    if(k==="anime"||k==="manga"){
      const r=await fetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify({query:"query($s:String,$t:MediaType){Page(perPage:8){media(search:$s,type:$t,isAdult:false){id title{romaji english} coverImage{large} seasonYear startDate{year} format}}}",variables:{s:q,t:k==="anime"?"ANIME":"MANGA"}})}).then(r=>r.json());
      return (r?.data?.Page?.media||[]).map(m=>({t:m.title.english||m.title.romaji,t2:m.title.english&&m.title.romaji!==m.title.english?m.title.romaji:"",img:m.coverImage?.large||"",y:m.seasonYear||m.startDate?.year||null,ref:"al:"+m.id,extra:m.format||""}));
    }
    if(k==="serie"){
      const r=await fetch("https://api.tvmaze.com/search/shows?q="+encodeURIComponent(q)).then(r=>r.json());
      const out=(r||[]).slice(0,8).map(({show:s})=>({t:s.name,img:(s.image?.medium||s.image?.original||"").replace(/^http:/,"https:"),y:s.premiered?Number(s.premiered.slice(0,4)):null,ref:"tvm:"+s.id,extra:(s.network?.name||s.webChannel?.name||"")}));
      if(out.length)return out;
    }
    const termo=q+(k==="filme"?" filme":k==="serie"?" série":"");
    const u="https://pt.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(termo)+"&gsrlimit=8&prop=pageimages|description&piprop=thumbnail&pithumbsize=500&pilicense=any&format=json&origin=*";
    const j=await fetch(u).then(r=>r.json());
    let L=Object.values(j?.query?.pages||{}).sort((a,b)=>a.index-b.index).map(p=>({t:p.title.replace(/\s*\((filme|série|série de televisão)[^)]*\)\s*$/i,"").trim(),img:p.thumbnail?.source||"",y:Number((p.description||"").match(/\b(19|20)\d{2}\b/)?.[0])||null,ref:"wp:"+p.pageid,extra:p.description||""}));
    if(k==="filme")L=L.filter(x=>/filme|longa|anima/i.test(x.extra)).concat(L.filter(x=>!/filme|longa|anima/i.test(x.extra)));
    return L.slice(0,8);
  }catch(e){return []}
}

/* ================= TIER LIST com categorias ================= */
const TL_CATS=[["jogos","🎮","Jogos"],...Object.entries(GK_KINDS).map(([k,o])=>[k,o.ic,o.pl])];
const gkMonthId = (mk,k) => `${mk}~${k}`;
const gkMonths = k => Object.keys(S.tierlists||{}).filter(id=>id.endsWith("~"+k)).sort().reverse();
function catBar(){return `<div class="tlcats" role="tablist" aria-label="Categoria da tier list">${TL_CATS.map(([k,ic,l])=>`<button role="tab" data-act="gkcat" data-k="${k}" aria-selected="${S.tierCat===k}">${ic} ${l}</button>`).join("")}</div>`}
const _viewTierGk=viewTier;
viewTier=function(){
  try{const f=document.getElementById("filters");if(f)f.hidden=!!GK_KINDS[S.tierCat]||!allGames().length}catch{}
  if(!GK_KINDS[S.tierCat])return catBar()+_viewTierGk.apply(this,arguments);
  return catBar()+gkTierView(S.tierCat);
};
function gkTierRows(items,opt={}){
  const rows=GK_TIERS.map(t=>{const I=items.filter(x=>x.tier===t);
    return `<div class="trow"><div class="tlabel t-${t}">${t}</div><div class="titems gkrow">${I.length?I.map(x=>gkChip(x,opt)).join(""):'<span class="empty-row">vazio</span>'}</div></div>`}).join("");
  const pend=opt.pending||[];
  return rows+(pend.length?`<div class="trow"><div class="tlabel t-N">?</div><div class="titems gkrow">${pend.map(x=>gkChip(x,opt)).join("")}<span class="empty-row">sem votos ainda</span></div></div>`:"");
}
function gkChip(x,opt={}){const t=x.t||x.title;
  return `<a class="gkchip" href="#midia-${esc(gkKey(t))}" title="${esc(t)}${x.n?` · ${x.n} ${x.n===1?"voto":"votos"}`:""}">${gkPoster({...x,k:x.k||opt.k})}<span class="ct">${esc(t)}</span>${x.n&&opt.votes?`<span class="vn">${x.n}</span>`:""}</a>`}
function gkTierView(k){
  const P=players();const mid=meId();const K=GK_KINDS[k];
  const cur=gkMonthId(monthKey(),k);const meses=gkMonths(k);
  const temGente=Object.keys(P).filter(id=>mediaOf(id).some(x=>x.k===k&&x.tier));
  let who=S.gkWho[k];
  if(!who)who=S.tierlists?.[cur]?.status==="aberta"?"mes":(mid&&P[mid]?"eu":(meses.length?"mes":"galera"));
  if(who!=="mes"&&who!=="galera"&&who!=="eu"&&!P[who])who="galera";
  S.gkWho[k]=who;
  const others=temGente.filter(id=>id!==mid);const other=who!=="mes"&&who!=="galera"&&who!=="eu"?P[who]:null;
  const pick=`<div class="tierpick" role="group" aria-label="De quem é a tier list">
    <button data-act="gkwho" data-k="${k}" data-id="mes" aria-pressed="${who==="mes"}">🗳️ Do mês</button>
    <button data-act="gkwho" data-k="${k}" data-id="galera" aria-pressed="${who==="galera"}">👥 Galera</button>
    ${mid&&P[mid]?`<button data-act="gkwho" data-k="${k}" data-id="eu" aria-pressed="${who==="eu"}">${glyph(P[mid],true)} Minha</button>`:""}
    ${others.length?`<label class="whosel${other?" on":""}">${other?glyph(other,true):""}<span class="sr-only">Tier list de outra pessoa</span><select id="gkwho-sel" data-k="${k}"><option value="">${other?"Trocar pessoa…":`De outra pessoa (${others.length})…`}</option>${others.map(id=>`<option value="${esc(id)}" ${who===id?"selected":""}>${esc(P[id].nick)}</option>`).join("")}</select></label>`:""}</div>`;
  if(who==="mes")return pick+gkMes(k);
  if(who==="galera"){
    const by={};for(const x of allMedia().filter(x=>x.k===k&&x.tier)){const key=gkKey(x.t);(by[key]=by[key]||{...x,sc:[],n:0}).sc.push(5-GK_TIERS.indexOf(x.tier));by[key].n++;if(!gkImg(by[key].img)&&gkImg(x.img))by[key].img=x.img}
    const items=Object.values(by).map(o=>{const m=gkAvg(o.sc);return {...o,tier:scoreTier(m),m}}).sort((a,b)=>b.m-a.m||b.n-a.n);
    return pick+`<div class="tierhead"><div><h3>${K.pl} na visão da galera</h3><span class="hint">${items.length} ${items.length===1?"título":"títulos"}</span></div>${MINE()?`<button class="btn small primary" data-act="gkadd" data-k="${k}">+ Adicionar ${K.l.toLowerCase()}</button>`:""}</div>
      <section class="box tierlist">${items.length?gkTierRows(items,{k}):gkVazio(k,"Ninguém deu tier ainda. Comece pela sua!")}</section>`;
  }
  const pid=who==="eu"?mid:who;const p=P[pid];const mine=pid===mid;
  const L=mediaOf(pid).filter(x=>x.k===k).sort((a,b)=>(b.nota??-1)-(a.nota??-1)||(b.at||0)-(a.at||0));
  const T=L.filter(x=>x.tier),semTier=L.filter(x=>!x.tier);
  return pick+`<div class="tierhead">${glyph(p)}<div><h3>${K.pl} de ${nk(p)}</h3><span class="hint">${L.length} ${L.length===1?"título":"títulos"} · ${T.length} com tier</span></div>${mine&&MINE()?`<button class="btn small primary" data-act="gkadd" data-k="${k}">+ Adicionar ${K.l.toLowerCase()}</button>`:""}</div>
    <section class="box tierlist">${T.length?gkTierRows(T,{k}):gkVazio(k,mine?`Adicione ${K.art} que você está vendo e escolha o tier.`:"Nenhum título com tier ainda.",mine)}</section>
    ${L.length?`<section class="box card"><span class="eyebrow">Lista completa${semTier.length?` · ${semTier.length} sem tier`:""}</span><div class="gkgrid">${L.map(x=>gkCard(x,mine)).join("")}</div></section>`:""}`;
}
function gkVazio(k,txt,botao){return `<div class="trow"><div class="titems"><span class="empty-row">${txt}${botao&&MINE()?` <button class="btn small primary" data-act="gkadd" data-k="${k}">+ Adicionar</button>`:""}</span></div></div>`}
function gkCard(x,mine){
  const st=GK_ST[x.st]?`<span class="pill gkst-${esc(x.st)}">${esc(gkStL(x.st,x.k))}</span>`:"";
  return `<article class="gkcard">${gkPoster(x,"big")}<div class="gkinfo"><a href="#midia-${esc(gkKey(x.t))}"><b>${esc(x.t)}</b></a>
    <div class="gkmeta">${x.y?`<span class="tag">${esc(x.y)}</span>`:""}${st}${x.tier?`<span class="tlabel mini t-${esc(x.tier)}">${esc(x.tier)}</span>`:""}</div>
    ${typeof x.nota==="number"?`<div class="fstars">${starsHTML(x.nota)}</div>`:""}${x.c?`<p class="frev">“${esc(cap(x.c,160))}”</p>`:""}
    ${mine&&MINE()?`<button class="btn small" data-act="gkedit" data-id="${esc(x.mid)}">Editar</button>`:""}</div></article>`;
}

/* ---------- votação do mês (anime/série/filme/mangá) ---------- */
function gkMes(k){
  const K=GK_KINDS[k];const meses=gkMonths(k);const staff=isStaff();const cur=gkMonthId(monthKey(),k);
  if(!S.gkMesSel?.[k]||!S.tierlists?.[S.gkMesSel[k]])S.gkMesSel={...(S.gkMesSel||{}),[k]:meses[0]||""};
  const id=S.gkMesSel[k];const tl=id?S.tierlists[id]:null;const r=tl?tlResult(id):null;
  const st=tl?(tl.status==="aberta"?`<span class="pill s-jogando">Votação aberta</span>`:tl.status==="encerrada"?`<span class="pill s-zerado">Resultado final</span>`:""):"";
  const top=`<div class="tierhead"><div style="flex:1;min-width:0"><span class="eyebrow">${K.ic} ${K.pl} do mês</span><h3>${tl?esc(tl.title||`Os melhores ${K.pl.toLowerCase()} do mês`):"Nenhuma votação ainda"}</h3>
      ${tl?`<span class="hint">${st} ${esc(monthName(id.split("~")[0]))}${r?` · ${r.voters} ${r.voters===1?"pessoa votou":"pessoas votaram"}`:""}${tl.note?` · ${esc(tl.note)}`:""}</span>`:`<span class="hint">${staff?`Lance a votação escolhendo ${K.pl.toLowerCase()} da temporada; a galera dá o tier e sai o ranking do mês.`:"A staff lança uma votação por mês. Enquanto isso, monte a sua em “Minha”."}</span>`}</div>
    <div class="actions">${meses.length>1?`<select id="gkmes-sel" data-k="${k}" aria-label="Mês">${meses.map(m=>`<option value="${m}"${m===id?" selected":""}>${esc(monthName(m.split("~")[0]))}</option>`).join("")}</select>`:""}
      ${staff&&!S.tierlists?.[cur]?`<button class="btn small primary" data-act="gkmonthly" data-id="${cur}" data-k="${k}">Lançar votação do mês</button>`:""}
      ${staff&&tl?`<button class="btn small" data-act="gkmonthly" data-id="${id}" data-k="${k}">Gerenciar</button>`:""}</div></div>`;
  if(!tl)return top;
  const res=r||{tiers:{},pending:[]};const items=[];GK_TIERS.forEach(t=>(res.tiers[t]||[]).forEach(x=>items.push({...x,t:x.title,img:x.coverUrl,k,tier:t})));
  return top+`<div class="tlgrid"><section class="box tierlist">${gkTierRows(items,{k,votes:true,pending:(res.pending||[]).map(x=>({...x,t:x.title,img:x.coverUrl,k}))})}</section>${gkVoteBox(id,k)}</div>`;
}
function gkVoteBox(id,k){
  const tl=S.tierlists?.[id];if(!tl||tl.status!=="aberta"||!Array.isArray(tl.games))return "";
  if(!me()||!S.canWrite)return `<section class="box card"><span class="eyebrow">Votação aberta</span><p style="margin:0">Entre e crie seu perfil para votar.</p></section>`;
  const mine=votesOf(id)[S.myId]?.v||{};const done=tl.games.filter(g=>mine[norm(g.title)]).length;
  return `<section class="box card"><span class="eyebrow">Seu voto · ${done} de ${tl.games.length}</span><h3>Dê o tier de cada um</h3>
    <div class="vlist">${tl.games.map(g=>{const key=norm(g.title);return `<div class="mrow">${gkPoster({img:g.coverUrl,k},"mini")}<span class="ct">${esc(g.title)}</span><div class="pick">${GK_TIERS.map(t=>`<button type="button" class="tb t-${t}" data-act="vote" data-m="${esc(id)}" data-k="${esc(key)}" data-t="${t}" aria-pressed="${mine[key]===t}" aria-label="Votar ${t} em ${esc(g.title)}">${t}</button>`).join("")}</div></div>`}).join("")}</div></section>`;
}
function gkOpenMonthly(id,k){
  const tl=S.tierlists?.[id];
  M={type:"gkmonthly",id,k,title:tl?.title||`${GK_KINDS[k].pl} do mês`,note:tl?.note||"",games:clone(tl?.games||[]),status:tl?.status||"",res:[],q:""};gkDrawMonthly();
}
function gkDrawMonthly(){
  if(M?.type!=="gkmonthly")return;const K=GK_KINDS[M.k];
  $("#modal").innerHTML=overlay(`<h2>${K.ic} Votação do mês · ${esc(K.pl)}</h2><span class="hint">${esc(monthName(M.id.split("~")[0]))}${M.status?` · ${M.status==="aberta"?"aberta":"encerrada"}`:""}</span>
    <label class="field full"><span class="flabel">Título da votação</span><input id="gkm-title" maxlength="80" value="${esc(M.title)}"></label>
    <label class="field full"><span class="flabel">Recado (opcional)</span><input id="gkm-note" maxlength="120" value="${esc(M.note)}" placeholder="Ex.: os animes da temporada de outono"></label>
    <div class="flabel">Títulos na votação (${M.games.length}/20)</div>
    <div class="gkmsel">${M.games.map((g,i)=>`<span class="gkmi">${gkPoster({img:g.coverUrl,k:M.k},"mini")}<span>${esc(g.title)}</span><button type="button" class="linkbtn" data-act="gkmrm" data-i="${i}" aria-label="Tirar ${esc(g.title)}">✕</button></span>`).join("")||'<span class="hint">Nenhum ainda. Busque abaixo.</span>'}</div>
    ${M.k==="anime"?`<button type="button" class="btn small" data-act="gkmseason">+ Sugerir os 12 mais populares da temporada</button>`:""}
    <label class="field full"><span class="flabel">Buscar ${esc(K.l.toLowerCase())}</span><input id="gkm-q" autocomplete="off" maxlength="80" value="${esc(M.q)}"></label>
    <div class="gkres">${(M.res||[]).map((r,i)=>`<button type="button" class="gkopt" data-act="gkmadd" data-i="${i}">${gkPoster({...r,k:M.k})}<span><b>${esc(r.t)}</b><small>${[r.y,r.extra].filter(Boolean).map(esc).join(" · ")}</small></span></button>`).join("")}</div>
    <p class="err" id="gkm-err" role="alert"></p>
    <div class="actions">${M.status?`<button class="btn danger" data-act="gkmdel">Apagar</button>`:""}${M.status==="aberta"?`<button class="btn" data-act="gkmclose">Encerrar votação</button>`:M.status==="encerrada"?`<button class="btn" data-act="gkmreopen">Reabrir</button>`:""}
      <button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="gkmsave">${M.status?"Salvar":"Abrir votação"}</button></div>`,"gkbox");
}
const gkmRead = () => {const t=$("#gkm-title"),n=$("#gkm-note");if(t)M.title=t.value;if(n)M.note=n.value};
async function gkmWrite(status){
  gkmRead();if(!M.games.length){$("#gkm-err").textContent="Escolha pelo menos um título.";return}
  const prev=S.tierlists?.[M.id]||{};const doc={title:M.title.trim().slice(0,80)||`${GK_KINDS[M.k].pl} do mês`,note:M.note.trim().slice(0,120),games:M.games.slice(0,20),status,kind:M.k,at:prev.at||Date.now()};
  if(status==="encerrada"){const r=tlResult(M.id);if(r)doc.final={tiers:r.tiers,pending:r.pending,voters:r.voters}}
  try{await S.db.doc(`tierlists/${M.id}`).set(doc);S.tierlists={...(S.tierlists||{}),[M.id]:doc};S.gkMesSel={...(S.gkMesSel||{}),[M.k]:M.id};S.gkWho[M.k]="mes";closeModal();renderAll();toast(status==="aberta"?"Votação aberta! 🗳️":"Votação encerrada")}
  catch(err){$("#gkm-err").textContent=errMsg(err)}
}
async function gkSeasonList(){
  if(S.gkSeason)return S.gkSeason;
  const d=new Date();const m=d.getMonth();const season=m<3?"WINTER":m<6?"SPRING":m<9?"SUMMER":"FALL";const year=d.getFullYear();
  const q=`query($s:MediaSeason,$y:Int){Page(perPage:30){media(season:$s,seasonYear:$y,type:ANIME,isAdult:false,sort:POPULARITY_DESC,format_in:[TV,ONA,TV_SHORT]){id title{romaji english} coverImage{large} episodes nextAiringEpisode{episode airingAt} externalLinks{site url} genres averageScore}}}`;
  try{const r=await fetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({query:q,variables:{s:season,y:year}})}).then(r=>r.json());
    S.gkSeason={season,year,list:(r?.data?.Page?.media||[]).map(m=>({id:m.id,t:m.title.english||m.title.romaji,t2:m.title.english&&m.title.romaji!==m.title.english?m.title.romaji:"",img:m.coverImage?.large||"",ep:m.episodes,next:m.nextAiringEpisode,
      cr:(m.externalLinks||[]).find(l=>/crunchyroll/i.test(l.site))?.url||"",links:(m.externalLinks||[]).filter(l=>/netflix|prime|disney|hidive|max/i.test(l.site)).map(l=>({s:l.site,u:l.url})).slice(0,2),gen:(m.genres||[]).slice(0,3),score:m.averageScore}))};
  }catch(e){S.gkSeason={season,year,list:[],err:true}}
  return S.gkSeason;
}

/* ================= DESCOBRIR → 🎌 Animes (lançamentos + notícias) ================= */
const SEASON_PT={WINTER:"Inverno",SPRING:"Primavera",SUMMER:"Verão",FALL:"Outono"};
function quandoEp(ts){const d=new Date(ts*1000);const dias=Math.round((gkDay(d)-gkDay(new Date()))/864e5);const h=d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  return dias<=0?`hoje ${h}`:dias===1?`amanhã ${h}`:dias<7?`${d.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","")} ${h}`:d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}
function gkDay(d){d=new Date(d);d.setHours(0,0,0,0);return d.getTime()}
function viewAnimes(){
  if(!S.gkSeason&&!S.gkSeasonBusy){S.gkSeasonBusy=true;gkSeasonList().then(()=>{S.gkSeasonBusy=false;if(S.view==="animes")renderView()})}
  const se=S.gkSeason;const f=S.anFilter||"cr";
  let L=se?.list||[];if(f==="cr")L=L.filter(x=>x.cr);if(f==="semana")L=L.filter(x=>x.next).sort((a,b)=>a.next.airingAt-b.next.airingAt);
  const N=(S.autoNews?.itens||[]).filter(n=>n.cat==="geek"&&safeUrl(n.url)&&n.title);
  const srcs=[...new Set(N.map(n=>n.source).filter(Boolean))];if(S.gkSrc&&!srcs.includes(S.gkSrc))S.gkSrc="";
  const NF=N.filter(n=>!S.gkSrc||n.source===S.gkSrc).slice(0,24);
  return `<div class="page animes">
  <div class="tierhead"><div style="flex:1"><span class="eyebrow">🎌 Animes</span><h3>Lançamentos ${se?`de ${esc(SEASON_PT[se.season])} ${se.year}`:"da temporada"}</h3></div></div>
  <div class="gkkinds">${[["cr","No Crunchyroll"],["semana","Próximos episódios"],["todos","Todos da temporada"]].map(([k,l])=>`<button class="chip2" data-act="anf" data-k="${k}" aria-pressed="${f===k}">${l}</button>`).join("")}</div>
  ${!se?`<section class="box card"><p class="hint" style="margin:0">Carregando a temporada…</p></section>`:se.err?`<section class="box card"><p style="margin:0">Não deu para carregar a temporada agora. Tente de novo mais tarde.</p></section>`:
   `<div class="angrid">${L.slice(0,24).map(x=>`<article class="box ancard">${gkPoster({...x,k:"anime"},"big")}<div class="aninfo"><b>${esc(x.t)}</b>${x.t2?`<span class="hint">${esc(x.t2)}</span>`:""}
      <div class="gkmeta">${x.next?`<span class="tag anext">Ep ${x.next.episode} · ${esc(quandoEp(x.next.airingAt))}</span>`:x.ep?`<span class="tag">${x.ep} eps</span>`:""}${x.score?`<span class="tag">★ ${(x.score/10).toFixed(1).replace(".",",")}</span>`:""}</div>
      ${x.gen.length?`<span class="hint">${x.gen.map(esc).join(" · ")}</span>`:""}
      <div class="anlinks">${x.cr?`<a class="btn small cr" href="${esc(x.cr)}" target="_blank" rel="noopener noreferrer">▶ Crunchyroll</a>`:""}${x.links.map(l=>`<a class="btn small" href="${esc(l.u)}" target="_blank" rel="noopener noreferrer">${esc(l.s)}</a>`).join("")}
      ${MINE()?`<button class="btn small" data-act="gkaddthis" data-t="${esc(x.t)}" data-k="anime" data-img="${esc(gkImg(x.img))}" data-ref="al:${x.id}">+ Minha lista</button>`:""}</div></div></article>`).join("")||'<p class="hint">Nada nesse filtro.</p>'}</div>`}
  <div class="tierhead" style="margin-top:18px"><div><span class="eyebrow">📰 Notícias de anime</span><h3>O que está rolando</h3></div></div>
  ${N.length?`<div class="gkkinds">${["",...srcs].map(s=>`<button class="chip2" data-act="gksrc" data-k="${esc(s)}" aria-pressed="${(S.gkSrc||"")===s}">${esc(s||"Todas")}</button>`).join("")}</div>
  <div class="gknews">${NF.map(n=>`<a class="box gknw" href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">${n.img&&/^https:\/\//.test(n.img)?`<img src="${esc(n.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:""}<div><span class="hint">${esc(n.source||"")} · ${ago(n.at)}</span><b>${esc(n.title)}</b>${n.summary?`<p>${esc(cap(n.summary,160))}</p>`:""}</div></a>`).join("")}</div>`:`<section class="box card"><p class="hint" style="margin:0">As notícias chegam com o próximo giro do robô (a cada 3 horas).</p></section>`}
  </div>`;
}

/* ---------- página de um título ---------- */
function viewMidia(){
  const key=S.route;const L=allMedia().filter(x=>gkKey(x.t)===key);const P=players();
  if(!L.length)return `<div class="page"><a class="btn small back" href="#tierlist">← Tier List</a><section class="box card"><p>Ninguém da galera adicionou esse título ainda.</p></section></div>`;
  const base=L.find(x=>gkImg(x.img))||L[0];const notas=L.filter(x=>typeof x.nota==="number").map(x=>x.nota);const mineHas=L.find(x=>x.pid===S.myId);
  return `<div class="page"><a class="btn small back" href="#tierlist" data-act="gkcat" data-k="${esc(base.k)}">← ${esc(GK_KINDS[base.k].pl)}</a>
  <section class="box gkhero">${gkPoster(base,"huge")}<div><span class="eyebrow">${GK_KINDS[base.k].ic} ${GK_KINDS[base.k].l}${base.y?" · "+esc(base.y):""}</span><h2>${esc(base.t)}</h2>
    <div class="gkmeta">${notas.length?`<span class="tag">★ ${fmtNota(gkAvg(notas))} média da galera</span>`:""}<span class="tag">${L.length} ${L.length===1?"pessoa":"pessoas"}</span></div>
    ${MINE()?(mineHas?`<button class="btn small" data-act="gkedit" data-id="${esc(mineHas.mid)}">Editar o meu</button>`:`<button class="btn small primary" data-act="gkaddthis" data-t="${esc(base.t)}" data-k="${esc(base.k)}" data-img="${esc(gkImg(base.img))}" data-y="${esc(base.y||"")}" data-ref="${esc(base.ref||"")}">+ Adicionar na minha lista</button>`):""}</div></section>
  <section class="box card"><span class="eyebrow">Quem viu</span><div class="gkwho">${L.map(x=>{const p=P[x.pid];if(!p)return "";
    return `<div class="gkfi">${glyph(p,true)}<div><a href="#perfil-${esc(pslug(p))}"><b>${nk(p)}</b></a> <span class="pill gkst-${esc(x.st)}">${esc(gkStL(x.st,x.k))}</span>${x.tier?` <span class="tlabel mini t-${esc(x.tier)}">${esc(x.tier)}</span>`:""}${typeof x.nota==="number"?` ${starsHTML(x.nota)}`:""}${x.c?`<p class="frev">“${esc(x.c)}”</p>`:""}</div></div>`}).join("")}</div></section>
  <section class="box card"><span class="eyebrow">Conversa</span>${miniThread("m~"+key,"O que você achou? (sem spoiler, hein)")}</section></div>`;
}

/* ---------- perfil: animes, séries, filmes e mangás da pessoa ---------- */
const _viewPerfilGk=viewPerfil;
viewPerfil=function(){let h=_viewPerfilGk.apply(this,arguments);const pid=pidBySlug(S.route);if(!pid)return h;
  const L=mediaOf(pid);const mine=pid===S.myId;if(!L.length&&!mine)return gkArrumaPerfil(h,"");
  const cnt=k=>L.filter(x=>x.k===k).length;
  let k=S.profKind[pid];if(!k||!GK_KINDS[k])k=Object.keys(GK_KINDS).find(x=>cnt(x))||"anime";
  const I=L.filter(x=>x.k===k).sort((a,b)=>(GK_TIERS.indexOf(a.tier)+1||9)-(GK_TIERS.indexOf(b.tier)+1||9)||(b.at||0)-(a.at||0));
  const box=`<section class="box card gkprof"><div class="gkph2"><span class="eyebrow">🍿 Animes, séries, filmes e mangás</span>${mine&&MINE()?`<button class="btn small primary" data-act="gkadd" data-k="${k}">+ Adicionar</button>`:""}</div>
    <div class="gkkinds">${Object.entries(GK_KINDS).map(([kk,o])=>`<button class="chip2" data-act="gkprofk" data-pid="${esc(pid)}" data-k="${kk}" aria-pressed="${kk===k}">${o.ic} ${o.pl} <b>${cnt(kk)}</b></button>`).join("")}</div>
    ${I.length?`<div class="gktop">${I.slice(0,12).map(x=>`<a class="gktopi" href="#midia-${esc(gkKey(x.t))}">${gkPoster(x)}${x.tier?`<span class="tlabel mini t-${esc(x.tier)} gkbadge">${esc(x.tier)}</span>`:""}<b>${esc(x.t)}</b><span class="hint">${esc(gkStL(x.st,x.k))}</span></a>`).join("")}</div>
      <a class="linkbtn" href="#tierlist" data-act="gkseeall" data-pid="${esc(pid)}" data-k="${k}">Ver tier list de ${esc(GK_KINDS[k].pl.toLowerCase())}${I.length>12?` (${I.length})`:""} →</a>`
      :`<p class="hint" style="margin:0">${mine?`Nenhum ${esc(GK_KINDS[k].l.toLowerCase())} ainda. Toque em “+ Adicionar”: a capa vem sozinha e ele entra na sua tier list.`:"Nada nessa categoria."}</p>`}</section>`;
  return gkArrumaPerfil(h,box)};
// Organiza o perfil: animes na coluna da esquerda (equilibra as colunas) e personalização num quadro só, largo, com abas
S.persoTab=S.persoTab||"cen";
function gkArrumaPerfil(h,box){
  try{
    if(typeof document==="undefined"||!document.createElement)throw 0;
    const t=document.createElement("template");if(!("content" in t))throw 0;t.innerHTML=h;
    const page=t.content.querySelector(".page");const cols=page?page.querySelectorAll(".pgrid > .col"):[];const grid=page?.querySelector(".pgrid");
    if(!page||cols.length<2||!grid)throw 0;
    if(box){const tmp=document.createElement("template");tmp.innerHTML=box;cols[1].appendChild(tmp.content)}   // coluna da direita: equilibra com Atividade/Jogando à esquerda
    const sc=page.querySelector(".scbox");const tema=[...page.querySelectorAll("section.box.card")].find(x=>x.querySelector(".eyebrow")?.textContent.trim()==="Tema do site");
    if(sc||tema){
      const tab=S.persoTab==="tema"&&tema?"tema":(sc?"cen":"tema");
      const wrap=document.createElement("section");wrap.className="box card perso";
      wrap.innerHTML=`<div class="gkph2"><span class="eyebrow">🎨 Personalizar</span></div>
        <div class="gktabs" role="tablist">${sc?`<button role="tab" data-act="gkperso" data-k="cen" aria-selected="${tab==="cen"}">🎮 Cenário do perfil</button>`:""}${tema?`<button role="tab" data-act="gkperso" data-k="tema" aria-selected="${tab==="tema"}">🎨 Tema do site</button>`:""}</div>`;
      for(const [k,el] of [["cen",sc],["tema",tema]]){if(!el)continue;el.remove();const pane=document.createElement("div");pane.className="persopane";pane.dataset.pane=k;if(k!==tab)pane.hidden=true;
        el.querySelector(".eyebrow")?.remove();while(el.firstChild)pane.appendChild(el.firstChild);wrap.appendChild(pane)}
      grid.after(wrap);
    }
    const div=document.createElement("div");div.appendChild(t.content.cloneNode(true));return div.innerHTML;
  }catch(e){if(!box)return h;const i=h.lastIndexOf("</div>");return i>0?h.slice(0,i)+box+h.slice(i):h+box}
}

/* ---------- adicionar / editar (modal) ---------- */
function gkOpen(mid,pre){
  const x=mid?mediaOf(S.myId).find(m=>m.mid===mid):null;
  M={type:"geek",mid:mid||null,k:x?.k||pre?.k||"anime",t:x?.t||pre?.t||"",img:x?.img||pre?.img||"",y:x?.y||pre?.y||null,ref:x?.ref||pre?.ref||"",
    st:x?.st||"assistindo",nota:typeof x?.nota==="number"?x.nota:null,tier:x?.tier||"",c:x?.c||"",res:[],q:""};
  gkDraw();setTimeout(()=>{const i=$("#gk-q");if(i&&!M.t)i.focus()},50);
}
function gkDraw(){
  if(M?.type!=="geek")return;
  const sel=M.t?`<div class="gksel">${gkPoster(M,"big")}<div><b>${esc(M.t)}</b>${M.y?`<span class="hint"> · ${esc(M.y)}</span>`:""}<br>${M.mid?"":'<button class="linkbtn" data-act="gkclear">trocar título</button>'}</div></div>`:
    `<label class="field full"><span class="flabel">Buscar título</span><input id="gk-q" placeholder="${M.k==="anime"?"Ex.: Frieren, One Piece":M.k==="manga"?"Ex.: Berserk, Chainsaw Man":M.k==="serie"?"Ex.: The Last of Us, Arcane":"Ex.: Duna, Interestelar"}" autocomplete="off" maxlength="80"></label>
     <div class="gkres" id="gk-res">${(M.res||[]).map((r,i)=>`<button type="button" class="gkopt" data-act="gkpick" data-i="${i}">${gkPoster({...r,k:M.k})}<span><b>${esc(r.t)}</b>${r.t2?`<small>${esc(r.t2)}</small>`:""}<small>${[r.y,r.extra].filter(Boolean).map(esc).join(" · ")}</small></span></button>`).join("")}
     ${M.busy?'<span class="hint">Buscando…</span>':""}${M.q&&!M.busy&&!M.res.length?`<button type="button" class="btn small" data-act="gkmanual">Usar “${esc(M.q)}” sem capa</button>`:""}</div>`;
  $("#modal").innerHTML=overlay(`<h2>${M.mid?"Editar":"Adicionar"}</h2>
    ${M.mid?"":`<div class="gkkinds">${Object.entries(GK_KINDS).map(([k,o])=>`<button type="button" class="chip2" data-act="gkk" data-k="${k}" aria-pressed="${M.k===k}">${o.ic} ${o.l}</button>`).join("")}</div>`}
    ${sel}
    <div class="gkform">
      <label class="field"><span class="flabel">Status</span><select id="gk-st">${Object.keys(GK_ST).map(k=>`<option value="${k}"${M.st===k?" selected":""}>${esc(gkStL(k,M.k))}</option>`).join("")}</select></label>
      <div class="field gktierf"><span class="flabel">Tier</span><input type="hidden" id="gk-tier" value="${esc(M.tier)}"><div class="pick gktp">${GK_TIERS.map(t=>`<button type="button" class="tb t-${t}" data-act="gktp" data-t="${t}" aria-pressed="${M.tier===t}" aria-label="Tier ${t}">${t}</button>`).join("")}</div></div>
      <label class="field"><span class="flabel">Nota (0 a 10)</span><input id="gk-nota" type="number" min="0" max="10" step="0.5" inputmode="decimal" value="${M.nota??""}"></label>
      <label class="field full"><span class="flabel">Comentário <span class="hint">(opcional, sem spoiler)</span></span><textarea id="gk-c" maxlength="400" rows="3">${esc(M.c)}</textarea></label>
    </div>
    <p class="err" id="gk-err" role="alert"></p>
    <div class="actions">${M.mid?`<button class="btn danger" data-act="gkdel">Remover</button>`:""}<button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="gksave"${M.t?"":" disabled"}>Salvar</button></div>`,"gkbox");
  const q=$("#gk-q");if(q&&M.q){q.value=M.q}
}
function gkReadForm(){const st=$("#gk-st"),ti=$("#gk-tier"),no=$("#gk-nota"),c=$("#gk-c");
  if(st)M.st=st.value;if(ti)M.tier=ti.value;if(no){const v=no.value.trim();M.nota=v===""?null:Math.max(0,Math.min(10,Math.round(Number(v)*2)/2))}if(c)M.c=c.value}
let _gkT=null;
document.addEventListener("input",e=>{
  const id=e.target.id;if(!((id==="gk-q"&&M?.type==="geek")||(id==="gkm-q"&&M?.type==="gkmonthly")))return;
  const q=e.target.value;M.q=q;clearTimeout(_gkT);
  _gkT=setTimeout(async()=>{if(!M||M.q!==q)return;if(M.type==="geek")gkReadForm();else gkmRead();
    const res=await gkSearch(q,M.k);if(!M||M.q!==q)return;M.res=res;
    if(M.type==="geek")gkDraw();else gkDrawMonthly();const i=$("#"+id);if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},450)});
document.addEventListener("click",async e=>{
  const el=e.target.closest("[data-act]");if(!el)return;const a=el.dataset.act;
  if(!(a.startsWith("gk")||a==="anf"))return;
  e.stopImmediatePropagation();
  if(a==="gkcat"){S.tierCat=el.dataset.k;if(el.tagName!=="A")renderView();return}
  if(a==="gkwho"){S.gkWho[el.dataset.k]=el.dataset.id;renderView();return}
  if(a==="gksrc"){S.gkSrc=el.dataset.k;renderView();return}
  if(a==="anf"){S.anFilter=el.dataset.k;renderView();return}
  if(a==="gkperso"){S.persoTab=el.dataset.k;const w=el.closest(".perso");if(w){w.querySelectorAll("[data-act=gkperso]").forEach(b=>b.setAttribute("aria-selected",b===el));w.querySelectorAll(".persopane").forEach(p=>p.hidden=p.dataset.pane!==el.dataset.k)}return}
  if(a==="gkprofk"){S.profKind[el.dataset.pid]=el.dataset.k;renderView();return}
  if(a==="gkseeall"){S.tierCat=el.dataset.k;S.gkWho[el.dataset.k]=el.dataset.pid===S.myId?"eu":el.dataset.pid;return}
  if(a==="gkadd"){if(!MINE()){toast("Entre na sua conta para adicionar");return}gkOpen(null,{k:el.dataset.k||"anime"});return}
  if(a==="gkaddthis"){if(!MINE()){toast("Entre na sua conta para adicionar");return}
    const ja=mediaOf(S.myId).find(x=>x.k===el.dataset.k&&gkKey(x.t)===gkKey(el.dataset.t));if(ja){gkOpen(ja.mid);return}
    gkOpen(null,{t:el.dataset.t,k:el.dataset.k,img:el.dataset.img,y:Number(el.dataset.y)||null,ref:el.dataset.ref});return}
  if(a==="gkedit"){gkOpen(el.dataset.id);return}
  if(a==="gkmonthly"){if(isStaff())gkOpenMonthly(el.dataset.id,el.dataset.k);return}
  if(M?.type==="gkmonthly"){
    if(a==="gkmadd"){gkmRead();const r=M.res[Number(el.dataset.i)];if(!r)return;if(M.games.length>=20){toast("Máximo de 20");return}
      if(!M.games.some(g=>norm(g.title)===norm(r.t)))M.games.push({title:r.t.slice(0,90),coverUrl:gkImg(r.img)});gkDrawMonthly();return}
    if(a==="gkmrm"){gkmRead();M.games.splice(Number(el.dataset.i),1);gkDrawMonthly();return}
    if(a==="gkmseason"){gkmRead();const se=await gkSeasonList();for(const x of se.list.slice(0,12)){if(M.games.length>=20)break;if(!M.games.some(g=>norm(g.title)===norm(x.t)))M.games.push({title:x.t.slice(0,90),coverUrl:gkImg(x.img)})}gkDrawMonthly();return}
    if(a==="gkmsave"){await gkmWrite(M.status==="encerrada"?"encerrada":"aberta");return}
    if(a==="gkmclose"){await gkmWrite("encerrada");return}
    if(a==="gkmreopen"){await gkmWrite("aberta");return}
    if(a==="gkmdel"){if(el.dataset.ok!=="1"){el.dataset.ok="1";el.textContent="Confirmar: apagar votação";return}
      try{await S.db.doc(`tierlists/${M.id}`).delete();const o={...(S.tierlists||{})};delete o[M.id];S.tierlists=o;closeModal();renderAll();toast("Votação apagada")}catch(err){$("#gkm-err").textContent=errMsg(err)}return}
    return}
  if(M?.type!=="geek")return;
  if(a==="gkk"){gkReadForm();M.k=el.dataset.k;M.t="";M.img="";M.res=[];M.y=null;M.ref="";gkDraw();const q=$("#gk-q");if(q&&M.q)q.dispatchEvent(new Event("input",{bubbles:true}));return}
  if(a==="gktp"){const t=el.dataset.t===M.tier?"":el.dataset.t;M.tier=t;const i=$("#gk-tier");if(i)i.value=t;el.parentElement.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.t===t));return}
  if(a==="gkpick"){gkReadForm();const r=M.res[Number(el.dataset.i)];if(!r)return;Object.assign(M,{t:r.t,img:gkImg(r.img),y:r.y||null,ref:r.ref||""});gkDraw();return}
  if(a==="gkmanual"){gkReadForm();M.t=String(M.q||"").trim().slice(0,90);M.img="";gkDraw();return}
  if(a==="gkclear"){gkReadForm();M.t="";M.img="";M.res=[];gkDraw();return}
  if(a==="gkdel"){const mid=M.mid;try{await saveMe(p=>{if(p.media)delete p.media[mid]},{noDay:true});closeModal();renderAll();toast("Removido")}catch(err){$("#gk-err").textContent=errMsg(err)}return}
  if(a==="gksave"){gkReadForm();if(!M.t){$("#gk-err").textContent="Escolha um título.";return}
    const L=mediaOf(S.myId);const dup=L.find(x=>x.mid!==M.mid&&x.k===M.k&&gkKey(x.t)===gkKey(M.t));if(dup){$("#gk-err").textContent="Esse título já está na sua lista. Edite o que já existe.";return}
    if(!M.mid&&L.length>=400){$("#gk-err").textContent="Limite de 400 títulos.";return}
    const mid=M.mid||newId("m");const it={t:M.t.slice(0,90),k:M.k,st:M.st,at:Date.now()};
    if(gkImg(M.img))it.img=M.img;if(M.y)it.y=Number(M.y)||null;if(M.ref)it.ref=String(M.ref).slice(0,30);if(typeof M.nota==="number"&&!isNaN(M.nota))it.nota=M.nota;if(M.tier)it.tier=M.tier;if(M.c.trim())it.c=M.c.trim().slice(0,400);
    const editando=!!M.mid,kind=M.k;el.disabled=true;
    try{await saveMe(p=>{p.media=(p.media&&typeof p.media==="object")?p.media:{};p.media[mid]=it});closeModal();S.profKind[S.myId]=kind;renderAll();toast(editando?"Atualizado":`Adicionado! Já está no seu perfil e na sua tier list de ${GK_KINDS[kind].pl.toLowerCase()} 🍿`)}
    catch(err){el.disabled=false;const E=$("#gk-err");if(E)E.textContent=errMsg(err)}
    return}
},true);
document.addEventListener("change",e=>{
  if(e.target.id==="gkwho-sel"&&e.target.value){S.gkWho[e.target.dataset.k]=e.target.value;renderView()}
  if(e.target.id==="gkmes-sel"){S.gkMesSel={...(S.gkMesSel||{}),[e.target.dataset.k]:e.target.value};renderView()}
});

/* ---------- navegação e rotas ---------- */
{const g=NAV.find(n=>n.k==="descobrir");if(g){g.v=g.v.filter(v=>v!=="geek");if(!g.v.includes("animes"))g.v.splice(1,0,"animes")}
 const t=NAV.find(n=>n.k==="tier");if(t)t.extra=[...(t.extra||[]),"midia"]}
SUBN.animes="🎌 Animes";
const _routeGk=route;
route=function(h){
  h=(h??location.hash.slice(1))||"";try{h=decodeURIComponent(h)}catch{}
  if(h.startsWith("midia-")){S.view="midia";S.route=h.slice(6);if(M)closeModal();renderAll();try{window.scrollTo({top:0})}catch{};return}
  if(h==="geek"){S.tierCat="anime";location.replace("#tierlist");return}
  return _routeGk(h);
};
const _renderViewGk=renderView;
renderView=function(){
  if(S.view==="animes"||S.view==="midia"){const V=$("#view");if(S.mode==="loading"||!Object.keys(players()).length)return _renderViewGk.apply(this,arguments);
    const focused=document.activeElement?.id;const keep={};V.querySelectorAll("input[id],textarea[id]").forEach(el=>{if(el.value)keep[el.id]=el.value});
    V.innerHTML=S.view==="animes"?viewAnimes():viewMidia();
    for(const [id,v] of Object.entries(keep)){const el=document.getElementById(id);if(el&&!el.value)el.value=v}
    if(focused){const el=document.getElementById(focused);if(el)el.focus({preventScroll:true})}
    try{document.documentElement.removeAttribute("data-psc")}catch{}
    try{addEditButtons()}catch{}
    return}
  return _renderViewGk.apply(this,arguments);
};
// notícias de anime não entram na página de novidades de games
const _autoNewsGk=autoNews;
autoNews=function(){return _autoNewsGk().filter(n=>n.cat!=="geek")};
// votação de anime/série/filme vota com os mesmos votos; precisa assinar os votos do mês aberto
{const _ens=typeof ensureVotes==="function"?ensureVotes:null;if(_ens&&typeof setInterval==="function")setInterval(()=>{if(S.mode==="live")Object.keys(S.tierlists||{}).filter(id=>id.includes("~")&&S.tierlists[id]?.status==="aberta").forEach(id=>_ens(id))},5000)}

/* ---------- XP: um pouco, sem desequilibrar (no máximo 400) ---------- */
const _xpOfGk=xpOf;
xpOf=function(pid){let g=0;for(const x of mediaOf(pid)){g+=3;if(x.st==="visto")g+=5;if(x.c)g+=5;if(x.tier)g+=2}return _xpOfGk(pid)+Math.min(400,g)};

/* ================= v26: primeiros passos, perfil vazio e MODO ARRASTAR na tier list ================= */

/* ---------- primeiros passos (Início) ---------- */
const ONB_XP=150;
function onbSteps(p){
  const pid=p._id||S.myId;const G=Object.values(p.games||{});
  const comentou=comms().some(c=>c.by===pid),curtiu=Object.keys(p.likes||{}).length>0;
  return [
    {k:"perfil",t:"Coloque uma foto, banner ou bio",ok:!!(p.avatarV||p.bannerV||(p.bio&&p.bio.trim().length>3)),btn:`<button class="btn small" data-act="profile">Editar perfil</button>`},
    {k:"jogos",t:"Adicione 3 jogos na sua estante",ok:G.length>=3,prog:`${Math.min(3,G.length)}/3`,btn:`<button class="btn small primary" data-act="add">+ Jogo</button><button class="btn small" data-act="steam">Importar da Steam</button>`},
    {k:"tier",t:"Dê tier (S a D) para um jogo",ok:G.some(g=>g.tier),btn:`<a class="btn small" href="#tierlist" data-act="onbtier">Abrir Tier List</a>`},
    {k:"geek",t:"Adicione um anime, série, filme ou mangá",ok:(typeof mediaOf==="function"?mediaOf(pid):[]).length>0,btn:`<button class="btn small" data-act="gkadd" data-k="anime">+ Anime/filme</button>`},
    {k:"social",t:"Curta ou comente algo da galera",ok:comentou||curtiu,btn:`<a class="btn small" href="#feed">Ver o feed</a>`},
  ];
}
function onbHidden(){try{return localStorage.getItem("zg-onb-hide")==="1"}catch{return false}}
function onbBox(){
  const m=me();if(!m||!S.canWrite||S.mode!=="live"||m.onb||onbHidden())return "";
  const st=onbSteps({...m,_id:S.myId});const feitos=st.filter(s=>s.ok).length;const tudo=feitos===st.length;
  return `<section class="box card onb"><div class="gkph2"><span class="eyebrow">🚀 Primeiros passos · ${feitos}/${st.length}</span><button class="linkbtn" data-act="onbhide">esconder</button></div>
    <h3>${tudo?"Tudo pronto! Resgate seu prêmio":"Monte seu perfil e ganhe +"+ONB_XP+" XP e a conquista “Primeiros passos”"}</h3>
    <div class="xpbar"><i style="width:${feitos/st.length*100}%"></i></div>
    <ol class="onbl">${st.map(s=>`<li class="${s.ok?"ok":""}"><span class="onbck" aria-hidden="true">${s.ok?"✓":""}</span><span class="onbt">${esc(s.t)}${s.prog&&!s.ok?` <span class="hint">${s.prog}</span>`:""}</span>${s.ok?"":`<span class="onbb">${s.btn}</span>`}</li>`).join("")}</ol>
    ${tudo?`<button class="btn primary" data-act="onbclaim">Resgatar +${ONB_XP} XP</button>`:""}</section>`;
}
const _viewHomeOnb=viewHome;
viewHome=function(){const h=_viewHomeOnb.apply(this,arguments);const b=onbBox();if(!b)return h;
  const i=h.indexOf('<section class="box hello">');return i>=0?h.slice(0,i)+b+h.slice(i):b+h};
BADGES.push({id:"primeirospassos",ic:"🚀",col:"#16A3C7",t:"Primeiros passos",ok:(s,o,pid)=>!!players()[pid]?.onb,d:()=>"completou o perfil"});

/* ---------- perfil vazio: convida em vez de ficar em branco ---------- */
const _viewPerfilOnb=viewPerfil;
viewPerfil=function(){let h=_viewPerfilOnb.apply(this,arguments);const pid=pidBySlug(S.route);const p=players()[pid];if(!p)return h;
  const nG=Object.keys(p.games||{}).length,nM=(typeof mediaOf==="function"?mediaOf(pid):[]).length;if(nG)return h;
  const mine=pid===S.myId;
  const box=mine?`<section class="box card vazio"><span class="big" aria-hidden="true">🎮</span><div><h3>Sua estante está vazia</h3><p>Adicione os jogos que você zerou, o que está jogando e o que quer jogar. Pela Steam, vem tudo de uma vez.</p>
      <div class="actions"><button class="btn primary" data-act="add">+ Jogo</button><button class="btn" data-act="steam">Importar da Steam</button>${nM?"":`<button class="btn" data-act="gkadd" data-k="anime">+ Anime/filme</button>`}</div></div></section>`
    :`<section class="box card vazio"><span class="big" aria-hidden="true">👀</span><div><h3>${nk(p)} ainda não adicionou jogos</h3><p>Chama no chat do site ou no Discord e pergunta o que ele está jogando!</p>
      <div class="actions"><button class="btn small" data-act="chatopen">Abrir o chat</button><a class="btn small" href="https://discord.gg/62sU9dEnSj" target="_blank" rel="noopener">Discord da galera</a></div></div></section>`;
  const i=h.indexOf("</section>",h.indexOf('class="box phero"'));return i>0?h.slice(0,i+10)+box+h.slice(i+10):h};

/* ================= MODO ARRASTAR (tier list estilo sites de montar tier list) ================= */
S.dragMode=(()=>{try{return localStorage.getItem("zg-drag")==="1"}catch{return false}})();
function dragOwn(){const mid=meId();if(!mid||!MINE())return null;
  if(S.tierCat==="jogos"||!S.tierCat)return S.tierWho===mid?{k:"jogos"}:null;
  return (typeof GK_KINDS!=="undefined"&&GK_KINDS[S.tierCat]&&S.gkWho?.[S.tierCat]==="eu")?{k:S.tierCat}:null}
function dragItems(k){const mid=meId();
  if(k==="jogos")return allGames().filter(g=>g.pid===mid).map(g=>({src:"g",key:g.gid,title:g.title,tier:g.tier||"",img:coverBox(g,"mini"),at:g.updatedAt||0}));
  return mediaOf(mid).filter(x=>x.k===k).map(x=>({src:"m",key:x.mid,title:x.t,tier:x.tier||"",img:gkPoster(x),at:x.at||0}));
}
function dragTile(x){return `<div class="dtile2" data-src="${x.src}" data-key="${esc(x.key)}" data-tier="${esc(x.tier)}" tabindex="0" role="button" aria-label="${esc(x.title)}${x.tier?`, tier ${x.tier}`:", sem tier"}" title="${esc(x.title)}">${x.img}<span>${esc(x.title)}</span></div>`}
function dragBoard(k){
  const L=dragItems(k).sort((a,b)=>(b.at||0)-(a.at||0));const q=(S.dragQ||"").trim().toLowerCase();
  const pool=L.filter(x=>!x.tier&&(!q||x.title.toLowerCase().includes(q)));
  return `<div class="dragwrap">
    <section class="box tierlist dboard">${["S","A","B","C","D"].map(t=>`<div class="trow dzone" data-t="${t}"><button type="button" class="tlabel t-${t}" data-act="dragto" data-t="${t}" aria-label="Mover para o tier ${t}">${t}</button><div class="titems dzi">${L.filter(x=>x.tier===t).map(dragTile).join("")}</div></div>`).join("")}</section>
    <section class="box card dpoolbox"><div class="gkph2"><span class="eyebrow">Sem tier · ${L.filter(x=>!x.tier).length}</span><button type="button" class="btn small" data-act="dragto" data-t="">Tirar do tier</button></div>
      ${L.filter(x=>!x.tier).length>12?`<input id="drag-q" placeholder="Filtrar…" value="${esc(S.dragQ||"")}" aria-label="Filtrar títulos sem tier" autocomplete="off">`:""}
      <div class="titems dzi dpool dzone" data-t="">${pool.map(dragTile).join("")||`<span class="empty-row">${L.length?"Tudo ranqueado! 🎉":k==="jogos"?"Adicione jogos na estante para montar sua tier list.":"Adicione títulos para montar sua tier list."}</span>`}</div></section></div>`;
}
function dragBar(){const o=dragOwn();if(!o)return "";
  return `<div class="dragbar"><button type="button" class="chip2 dragtgl" data-act="dragmode" aria-pressed="${!!S.dragMode}">✋ Modo arrastar ${S.dragMode?"ligado":"desligado"}</button>${S.dragMode?`<span class="hint" id="drag-st"></span>`:""}</div>`}
const _viewTierDrag=viewTier;
viewTier=function(){const h=_viewTierDrag.apply(this,arguments);const o=dragOwn();if(!o)return h;
  const cut=h.indexOf('</div>',h.indexOf('class="tlcats"'))+6;const top=h.slice(0,cut);
  if(!S.dragMode){const pk=h.indexOf('<div class="tierpick"');if(pk<0)return top+dragBar()+h.slice(cut);
    const end=h.indexOf("</div>",pk)+6;return h.slice(0,end)+dragBar()+h.slice(end)}
  const pk=h.indexOf('<div class="tierpick"');const pick=pk>=0?h.slice(pk,h.indexOf("</div>",pk)+6):"";
  try{const f=document.getElementById("filters");if(f)f.hidden=true}catch{}
  return top+pick+dragBar()+dragBoard(o.k)};

// salvar em lote (várias arrastadas viram uma gravação só)
const DRAG={pend:{},t:null,busy:false};
function dragQueue(src,key,tier){DRAG.pend[src+"|"+key]=tier;const st=$("#drag-st");if(st)st.textContent="salvando…";clearTimeout(DRAG.t);DRAG.t=setTimeout(dragFlush,700)}
async function dragFlush(){if(DRAG.busy){DRAG.t=setTimeout(dragFlush,500);return}const P=DRAG.pend;DRAG.pend={};if(!Object.keys(P).length)return;DRAG.busy=true;
  try{await saveMe(p=>{for(const [k,t] of Object.entries(P)){const [src,key]=k.split("|");const box=src==="g"?p.games:p.media;const it=box?.[key];if(!it)continue;if(t)it.tier=t;else delete it.tier}});
    const st=$("#drag-st");if(st){st.textContent="salvo ✓";setTimeout(()=>{const s2=$("#drag-st");if(s2&&s2.textContent==="salvo ✓")s2.textContent=""},1800)}}
  catch(err){toast(errMsg(err));const st=$("#drag-st");if(st)st.textContent="não salvou"}
  finally{DRAG.busy=false}}
function dragMove(tile,t,anim=true){
  const zone=document.querySelector(`.dboard .dzone[data-t="${t}"] .dzi`)||(t===""?document.querySelector(".dpool"):null);if(!zone||!tile)return;
  if(tile.dataset.tier===t)return;
  zone.querySelector(".empty-row")?.remove();
  const first=tile.getBoundingClientRect();zone.appendChild(tile);tile.dataset.tier=t;
  if(anim&&tile.animate){const last=tile.getBoundingClientRect();try{tile.animate([{transform:`translate(${first.left-last.left}px,${first.top-last.top}px) scale(1.08)`},{transform:"translate(0,0) scale(1)"}],{duration:260,easing:"cubic-bezier(.2,.8,.2,1.2)"})}catch{}}
  tile.classList.add("dropped");setTimeout(()=>tile.classList.remove("dropped"),400);
  const lab=tile.getAttribute("aria-label").split(",")[0];tile.setAttribute("aria-label",lab+(t?`, tier ${t}`:", sem tier"));
  const cnt=document.querySelector(".dpoolbox .eyebrow");if(cnt)cnt.textContent="Sem tier · "+document.querySelectorAll(".dpool .dtile2").length;
  dragQueue(tile.dataset.src,tile.dataset.key,t);
}
// arrastar com o dedo ou o mouse (pointer events: funciona igual no celular e no PC)
let DG=null;
document.addEventListener("pointerdown",e=>{const tile=e.target.closest(".dboard .dtile2,.dpool .dtile2");if(!tile||e.button>0)return;
  DG={tile,x:e.clientX,y:e.clientY,id:e.pointerId,on:false,ghost:null,zone:null,timer:null,touch:e.pointerType==="touch"};
  if(DG.touch)DG.timer=setTimeout(()=>{if(DG&&!DG.on)dragStart(e.clientX,e.clientY)},220);   // no celular: segura um instante para pegar (deixa rolar a página)
});
function dragStart(x,y){if(!DG)return;DG.on=true;S.dragging=true;const r=DG.tile.getBoundingClientRect();
  const g=DG.tile.cloneNode(true);g.classList.add("dghost");g.style.width=r.width+"px";g.style.left=r.left+"px";g.style.top=r.top+"px";document.body.appendChild(g);
  DG.ghost=g;DG.dx=x-r.left;DG.dy=y-r.top;DG.tile.classList.add("lifting");document.body.classList.add("dragging");try{navigator.vibrate?.(15)}catch{}}
document.addEventListener("pointermove",e=>{if(!DG||e.pointerId!==DG.id)return;
  if(!DG.on){const d=Math.hypot(e.clientX-DG.x,e.clientY-DG.y);if(DG.touch){if(d>10){clearTimeout(DG.timer);DG=null}return}if(d<6)return;dragStart(e.clientX,e.clientY)}
  e.preventDefault();DG.ghost.style.left=(e.clientX-DG.dx)+"px";DG.ghost.style.top=(e.clientY-DG.dy)+"px";
  DG.ghost.style.transform=`rotate(${Math.max(-8,Math.min(8,(e.clientX-DG.x)/25))}deg) scale(1.1)`;
  const el=document.elementFromPoint(e.clientX,e.clientY);const z=el?.closest?.(".dzone");
  if(z!==DG.zone){DG.zone?.classList.remove("over");DG.zone=z;z?.classList.add("over")}
  if(e.clientY<70)window.scrollBy(0,-12);else if(e.clientY>innerHeight-70)window.scrollBy(0,12);
},{passive:false});
function dragEnd(e){if(!DG)return;clearTimeout(DG.timer);const d=DG;DG=null;
  if(!d.on){ // toque/clique simples: seleciona a capa
    const was=d.tile.classList.contains("sel");document.querySelectorAll(".dtile2.sel").forEach(x=>x.classList.remove("sel"));if(!was)d.tile.classList.add("sel");return}
  d.ghost?.remove();d.tile.classList.remove("lifting");document.body.classList.remove("dragging");d.zone?.classList.remove("over");
  S.dragging=false;if(d.zone)dragMove(d.tile,d.zone.dataset.t);
  if(S.dragRerender){S.dragRerender=false;setTimeout(()=>{if(!S.dragging)renderView()},50)}
}
document.addEventListener("pointerup",dragEnd);document.addEventListener("pointercancel",e=>{if(DG&&!DG.on){clearTimeout(DG.timer);DG=null}else dragEnd(e)});
document.addEventListener("touchmove",e=>{if(S.dragging)e.preventDefault()},{passive:false});
document.addEventListener("contextmenu",e=>{if(e.target.closest(".dboard,.dpool"))e.preventDefault()});
// teclado: Enter seleciona; teclas S A B C D ou 0 movem
document.addEventListener("keydown",e=>{const tile=e.target.closest?.(".dtile2");if(!tile)return;const k=e.key.toUpperCase();
  if(["S","A","B","C","D"].includes(k)){e.preventDefault();dragMove(tile,k);tile.focus()}else if(k==="0"||k==="DELETE"||k==="BACKSPACE"){e.preventDefault();dragMove(tile,"");tile.focus()}
  else if(k==="ENTER"||k===" "){e.preventDefault();tile.classList.toggle("sel")}});
document.addEventListener("input",e=>{if(e.target.id!=="drag-q")return;S.dragQ=e.target.value;const q=S.dragQ.trim().toLowerCase();
  document.querySelectorAll(".dpool .dtile2").forEach(t=>{t.hidden=!!q&&!t.title.toLowerCase().includes(q)})});
document.addEventListener("click",e=>{const el=e.target.closest("[data-act]");if(!el)return;const a=el.dataset.act;
  if(!["dragmode","dragto","onbclaim","onbhide","onbtier","chatopen"].includes(a))return;e.stopImmediatePropagation();
  if(a==="dragmode"){S.dragMode=!S.dragMode;try{localStorage.setItem("zg-drag",S.dragMode?"1":"0")}catch{}renderView();return}
  if(a==="dragto"){const sel=document.querySelector(".dtile2.sel");if(!sel){toast("Toque numa capa primeiro (ou arraste)");return}sel.classList.remove("sel");dragMove(sel,el.dataset.t);return}
  if(a==="onbhide"){try{localStorage.setItem("zg-onb-hide","1")}catch{}renderView();return}
  if(a==="onbtier"){S.tierCat="jogos";S.tierWho=meId();return}
  if(a==="chatopen"){const f=document.getElementById("chatfab");if(f)f.click();else location.hash="#chat";return}
  if(a==="onbclaim"){const m=me();if(!m||m.onb)return;if(!onbSteps({...m,_id:S.myId}).every(s=>s.ok)){toast("Falta algum passo");return}
    el.disabled=true;saveMe(p=>{if(p.onb)return;p.onb=Date.now();p.missXp=(Number(p.missXp)||0)+ONB_XP;const mes=monthKey();p.sxp=p.sxp||{};p.sxp[mes]=(Number(p.sxp[mes])||0)+ONB_XP})
      .then(()=>{toast(`+${ONB_XP} XP e conquista “Primeiros passos”! 🚀`);renderAll()}).catch(err=>{el.disabled=false;toast(errMsg(err))});return}
},true);
// não redesenha a tela no meio de uma arrastada (chegou dado novo? redesenha quando soltar)
const _renderViewDrag=renderView;
renderView=function(){if(S.dragging){S.dragRerender=true;return}return _renderViewDrag.apply(this,arguments)};

/* ================= v27: MEU PC — monte seu setup no perfil (estilo montador de PC das lojas) ================= */
// Dados: players/{uid}.pc = {cpu,mb,gpu,ram,mouse,kb,mon} (texto livre; o catálogo pc.json só ajuda a achar o nome certo)
const PC_SLOTS=[["cpu","Processador"],["mb","Placa-mãe"],["gpu","Placa de vídeo"],["ram","Memória RAM"],["mon","Monitor"],["kb","Teclado"],["mouse","Mouse"]];
const PC_BRANDS=[[/\b(rtx|gtx|geforce|nvidia)\b/i,"#76b900","NVIDIA"],[/\b(radeon|rx ?\d)/i,"#ed1c24","AMD Radeon"],[/\bryzen|\bamd\b|athlon|\bfx-/i,"#ed1c24","AMD"],
  [/\barc\b/i,"#0071c5","Intel Arc"],[/\bintel|core i\d|core ultra|pentium|celeron/i,"#0071c5","Intel"],[/\basus|\brog\b|\btuf\b/i,"#e8e8e8","ASUS"],[/\bmsi\b/i,"#ff0000","MSI"],
  [/gigabyte|aorus/i,"#ff6a00","Gigabyte"],[/asrock/i,"#00a8e8","ASRock"],[/logitech/i,"#00b8fc","Logitech"],[/razer/i,"#44d62c","Razer"],[/hyperx/i,"#e31837","HyperX"],
  [/corsair/i,"#ffd200","Corsair"],[/redragon/i,"#d71920","Redragon"],[/steelseries/i,"#ff5200","SteelSeries"],[/kingston/i,"#e4002b","Kingston"],[/samsung|odyssey/i,"#1428a0","Samsung"],
  [/\blg\b|ultragear/i,"#ff2d7a","LG"],[/\baoc\b/i,"#e30613","AOC"],[/\bdell\b|alienware/i,"#007db8","Dell"],[/benq|zowie/i,"#7a2bd8","BenQ"],[/keychron/i,"#f5a623","Keychron"],
  [/wooting/i,"#ff4b4b","Wooting"],[/\bxpg\b/i,"#e60012","XPG"],[/g\.skill|trident/i,"#d4d4d4","G.Skill"],[/acer|nitro/i,"#83b81a","Acer"],[/gloriou/i,"#f0f0f0","Glorious"]];
const pcBrand = v => {for(const [re,c,n] of PC_BRANDS)if(re.test(v||""))return {c,n};return null};
// ilustrações originais (SVG), pintadas com a cor da marca
function pcIcon(k,c){c=c||"var(--accent)";const s=`stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round" stroke-linecap="round"`;
  const body={
    cpu:`<rect x="14" y="14" width="36" height="36" rx="4" ${s}/><rect x="22" y="22" width="20" height="20" rx="2" fill="${c}"/>${[20,28,36,44].map(v=>`<path d="M${v} 6v8M${v} 50v8M6 ${v}h8M50 ${v}h8" ${s}/>`).join("")}`,
    mb:`<rect x="6" y="6" width="52" height="52" rx="4" ${s}/><rect x="14" y="14" width="16" height="16" rx="2" fill="${c}"/><path d="M38 14v28M44 14v28M50 14v28" ${s}/><rect x="12" y="40" width="22" height="5" rx="1" fill="${c}" opacity=".7"/><rect x="12" y="49" width="22" height="4" rx="1" ${s}/>`,
    gpu:`<rect x="4" y="16" width="56" height="30" rx="4" ${s}/><circle cx="20" cy="31" r="9" ${s}/><circle cx="44" cy="31" r="9" ${s}/><path d="M20 22v18M11 31h18M44 22v18M35 31h18" stroke="${c}" stroke-width="2.4"/><path d="M10 46v6h20v-6" ${s}/><rect x="4" y="12" width="56" height="4" rx="2" fill="${c}"/>`,
    ram:`<rect x="4" y="20" width="56" height="20" rx="2" ${s}/>${[10,20,30,40].map(v=>`<rect x="${v}" y="24" width="7" height="10" rx="1" fill="${c}"/>`).join("")}<path d="M8 40v6M14 40v6M20 40v6M26 40v6M38 40v6M44 40v6M50 40v6M56 40v6" ${s}/><rect x="4" y="16" width="56" height="4" rx="2" fill="${c}" opacity=".6"/>`,
    mon:`<rect x="4" y="8" width="56" height="36" rx="4" ${s}/><rect x="9" y="13" width="46" height="26" rx="2" fill="${c}" opacity=".85"/><path d="M26 44l-3 10h18l-3-10M18 56h28" ${s}/>`,
    kb:`<rect x="4" y="18" width="56" height="30" rx="5" ${s}/>${[10,18,26,34,42,50].map(v=>`<rect x="${v}" y="24" width="5" height="5" rx="1" fill="${c}"/>`).join("")}${[14,22,30,38,46].map(v=>`<rect x="${v}" y="32" width="5" height="5" rx="1" fill="${c}" opacity=".7"/>`).join("")}<rect x="18" y="40" width="28" height="4" rx="1" fill="${c}"/>`,
    mouse:`<rect x="18" y="6" width="28" height="52" rx="14" ${s}/><path d="M32 6v18M18 24h28" ${s}/><rect x="29.5" y="11" width="5" height="9" rx="2.5" fill="${c}"/><path d="M22 44c3 6 17 6 20 0" stroke="${c}" stroke-width="2.4" fill="none"/>`}[k]||"";
  return `<svg viewBox="0 0 64 64" class="pcico" aria-hidden="true" style="--pcc:${c}">${body}</svg>`}

function pcOf(p){const o=p&&typeof p.pc==="object"&&p.pc?p.pc:{};const r={};for(const [k] of PC_SLOTS)if(typeof o[k]==="string"&&o[k].trim())r[k]=o[k].trim().slice(0,80);return r}
function pcBox(pid){const p=players()[pid];const pc=pcOf(p);const mine=pid===S.myId&&MINE();const n=Object.keys(pc).length;
  if(!n&&!mine)return "";
  return `<section class="box card pcbox"><div class="gkph2"><span class="eyebrow">🖥️ ${mine?"Meu PC":"PC de "+esc(p.nick)}</span>${mine?`<button class="btn small${n?"":" primary"}" data-act="pcedit">${n?"Editar":"Montar meu PC"}</button>`:""}</div>
    ${n?`<div class="pcgrid">${PC_SLOTS.filter(([k])=>pc[k]||mine).map(([k,l])=>{const b=pcBrand(pc[k]);return `<div class="pcslot${pc[k]?"":" vazio"}" style="--pcc:${b?.c||"var(--accent)"}">${pcIcon(k,b?.c)}<div><span class="pcl">${l}${b?` · <b>${esc(b.n)}</b>`:""}</span><span class="pcv">${pc[k]?esc(pc[k]):"—"}</span></div></div>`}).join("")}</div>`
      :""}</section>`}
const _viewPerfilPc=viewPerfil;
viewPerfil=function(){let h=_viewPerfilPc.apply(this,arguments);const pid=pidBySlug(S.route);if(!pid)return h;const box=pcBox(pid);if(!box)return h;
  const i=h.indexOf('<span class="eyebrow">Setup</span>');
  if(i>=0){const e=h.indexOf("</section>",i)+10;return h.slice(0,e)+box+h.slice(e)}
  const c1=h.indexOf('<div class="col">');const c2=c1>=0?h.indexOf('<div class="col">',c1+5):-1;
  return c2>=0?h.slice(0,c2+17)+box+h.slice(c2+17):h};

/* ---------- editor com busca (digita e aparecem as opções) ---------- */
async function pcCat(){if(S.pcCat)return S.pcCat;try{S.pcCat=await fetch("pc.json?v=1").then(r=>r.json())}catch{S.pcCat={}}return S.pcCat}
const pcNorm = s => String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9.]+/g," ").trim();
function pcFind(k,q){const L=(S.pcCat||{})[k]||[];const t=pcNorm(q).split(" ").filter(Boolean);if(!t.length)return L.slice(0,8);
  const sc=[];for(const x of L){const n=pcNorm(x);if(!t.every(w=>n.includes(w)||n.replace(/ /g,"").includes(w)))continue;sc.push([(n.startsWith(t[0])?0:1)+n.length/200,x])}
  return sc.sort((a,b)=>a[0]-b[0]).slice(0,8).map(x=>x[1])}
async function pcOpen(){const pc=pcOf(me());M={type:"pc",v:{...pc},open:"",hi:0};pcDraw();await pcCat()}
function pcDraw(){if(M?.type!=="pc")return;
  $("#modal").innerHTML=overlay(`<h2>🖥️ Meu PC</h2>
    <div class="pcform">${PC_SLOTS.map(([k,l])=>{const b=pcBrand(M.v[k]);return `<div class="pcf" data-k="${k}">${pcIcon(k,b?.c)}<label class="field"><span class="flabel">${l}</span>
      <input id="pc-${k}" data-k="${k}" autocomplete="off" maxlength="80" value="${esc(M.v[k]||"")}" placeholder="${{cpu:"Ex.: Ryzen 5 5600",mb:"Ex.: B550M",gpu:"Ex.: RTX 4060",ram:"Ex.: 16GB DDR4 3200",mon:"Ex.: 27 QHD 165Hz",kb:"Ex.: Redragon Kumara",mouse:"Ex.: G305"}[k]}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="pcl-${k}"></label>
      <div class="pclist" id="pcl-${k}" role="listbox" hidden></div></div>`}).join("")}</div>
    <p class="err" id="pc-err" role="alert"></p>
    <div class="actions"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="pcsave">Salvar</button></div>`,"pcmodal");
}
function pcShow(k){const inp=$("#pc-"+k),box=$("#pcl-"+k);if(!inp||!box)return;const L=pcFind(k,inp.value);M.open=k;M.list=L;M.hi=Math.min(M.hi||0,Math.max(0,L.length-1));
  box.innerHTML=L.map((x,i)=>{const b=pcBrand(x);return `<button type="button" role="option" class="pco${i===M.hi?" hi":""}" data-act="pcpick" data-k="${k}" data-i="${i}" aria-selected="${i===M.hi}">${b?`<span class="pcb" style="--pcc:${b.c}">${esc(b.n)}</span>`:""}<span>${esc(x)}</span></button>`}).join("")
    +(inp.value.trim()&&!L.some(x=>pcNorm(x)===pcNorm(inp.value))?`<div class="pcown">Vai ficar como você escreveu: <b>${esc(inp.value.trim())}</b></div>`:"");
  box.hidden=!box.innerHTML;inp.setAttribute("aria-expanded",String(!box.hidden))}
function pcHideAll(except){document.querySelectorAll(".pclist").forEach(b=>{if(b.id!=="pcl-"+except){b.hidden=true;$("#pc-"+b.id.slice(4))?.setAttribute("aria-expanded","false")}})}
function pcSet(k,v){M.v[k]=v;const inp=$("#pc-"+k);if(inp)inp.value=v;const b=pcBrand(v);const f=inp?.closest(".pcf");if(f){const old=f.querySelector(".pcico");if(old)old.outerHTML=pcIcon(k,b?.c)}$("#pcl-"+k).hidden=true;inp?.setAttribute("aria-expanded","false")}
document.addEventListener("focusin",e=>{const k=e.target.dataset?.k;if(M?.type!=="pc"||!e.target.id?.startsWith("pc-")||!k)return;pcHideAll(k);M.hi=0;pcCat().then(()=>pcShow(k))});
document.addEventListener("input",e=>{if(M?.type!=="pc"||!e.target.id?.startsWith("pc-"))return;const k=e.target.dataset.k;M.v[k]=e.target.value;M.hi=0;pcShow(k)});
document.addEventListener("keydown",e=>{if(M?.type!=="pc"||!e.target.id?.startsWith("pc-"))return;const k=e.target.dataset.k;const box=$("#pcl-"+k);if(!box||box.hidden)return;
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();const n=(M.list||[]).length;if(!n)return;M.hi=(M.hi+(e.key==="ArrowDown"?1:n-1))%n;pcShow(k)}
  else if(e.key==="Enter"){e.preventDefault();const v=(M.list||[])[M.hi];if(v)pcSet(k,v);const nx=PC_SLOTS[PC_SLOTS.findIndex(s=>s[0]===k)+1];if(nx)$("#pc-"+nx[0])?.focus()}
  else if(e.key==="Escape"){e.stopPropagation();box.hidden=true}});
document.addEventListener("mousedown",e=>{if(M?.type==="pc"&&!e.target.closest(".pcf"))pcHideAll("")});
document.addEventListener("click",async e=>{const el=e.target.closest("[data-act]");if(!el)return;const a=el.dataset.act;if(!["pcedit","pcpick","pcsave"].includes(a))return;e.stopImmediatePropagation();
  if(a==="pcedit"){if(!MINE())return;pcOpen();return}
  if(M?.type!=="pc")return;
  if(a==="pcpick"){const v=(M.list||[])[Number(el.dataset.i)];if(v)pcSet(el.dataset.k,v);return}
  if(a==="pcsave"){const out={};for(const [k] of PC_SLOTS){const v=($("#pc-"+k)?.value||"").trim().slice(0,80);if(v)out[k]=v}
    el.disabled=true;try{await saveMe(p=>{if(Object.keys(out).length)p.pc=out;else delete p.pc});closeModal();renderAll();toast("PC salvo! 🖥️")}catch(err){el.disabled=false;$("#pc-err").textContent=errMsg(err)}}
},true);

/* ---------- arte dos cenários (≈200 KB) só é baixada quando algum cenário aparece na tela ---------- */
(function(){
  if(typeof document==="undefined"||typeof MutationObserver==="undefined")return;
  const SEL='[data-th^="sc-"],.scbox,[data-psc]';let feito=false;
  const carrega=()=>{if(feito)return;feito=true;const l=document.createElement("link");l.rel="stylesheet";l.href="scenes.css?v="+((document.querySelector('script[src*="app.js"]')?.src||"").split("v=")[1]||"1");document.head.appendChild(l);obs.disconnect()};
  const olha=()=>{if(!feito&&(document.querySelector(SEL)||document.documentElement.dataset.psc))carrega()};
  const obs=new MutationObserver(olha);
  const go=()=>{olha();if(!feito)obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["data-th","data-psc"]})};
  if(document.body)go();else document.addEventListener("DOMContentLoaded",go);
})();

/* ================= v29: COMPARTILHAR (imagens prontas), CONVITE COM RECOMPENSA e REDES NO PERFIL ================= */
const SITE_URL="https://zeradosdagalera.com.br/";
const TCOL={S:"#FF4D6D",A:"#FF9F1C",B:"#FFD23F",C:"#3DDC97",D:"#4CC9F0"};
const shareUrlPerfil = p => `${SITE_URL}p/${pslug(p)}.html`;      // página leve com prévia (foto/nível) que abre o perfil e já conta como convite

/* ---------- janela de compartilhar (prévia + redes + baixar) ---------- */
async function shareSheet(o){
  M={type:"share",o,fmt:"story",blob:null,url:""};drawShare(true);
  if(o.render)await shareRender();else drawShare();
}
async function shareRender(){if(M?.type!=="share")return;const o=M.o;const [W,H]=M.fmt==="post"?[1080,1350]:[1080,1920];
  try{const cv=await o.render(W,H);const blob=await new Promise(r=>cv.toBlob(r,"image/png"));if(M?.type!=="share")return;
    if(M.url)URL.revokeObjectURL(M.url);M.blob=blob;M.url=blob?URL.createObjectURL(blob):""}catch(e){console.warn(e);M.blob=null;M.url=""}
  drawShare()}
function drawShare(loading){if(M?.type!=="share")return;const o=M.o;const url=o.url||SITE_URL;const txt=o.text||"";const full=(txt+" "+url).trim();
  const enc=encodeURIComponent;
  $("#modal").innerHTML=overlay(`<h2>📤 ${esc(o.title||"Compartilhar")}</h2>
    ${o.render?`<div class="shfmt"><button type="button" class="chip2" data-act="shfmt" data-k="story" aria-pressed="${M.fmt==="story"}">Story 9:16</button><button type="button" class="chip2" data-act="shfmt" data-k="post" aria-pressed="${M.fmt==="post"}">Post 4:5</button></div>
      <div class="shprev">${M.url?`<img src="${M.url}" alt="Prévia da imagem">`:`<span class="hint">${loading||!M.blob&&M.url===""?"Gerando imagem…":"Não deu para gerar a imagem."}</span>`}</div>`:""}
    <div class="shtxt">${esc(full)}</div>
    <div class="shbtns">
      ${navigator.share?`<button type="button" class="btn primary" data-act="shnative">📲 Compartilhar</button>`:""}
      ${M.blob?`<button type="button" class="btn${navigator.share?"":" primary"}" data-act="shdl">⬇️ Baixar imagem</button>`:""}
      <a class="btn shw" href="https://wa.me/?text=${enc(full)}" target="_blank" rel="noopener">WhatsApp</a>
      <a class="btn shx" href="https://twitter.com/intent/tweet?text=${enc(txt)}&url=${enc(url)}" target="_blank" rel="noopener">X</a>
      <a class="btn sht" href="https://t.me/share/url?url=${enc(url)}&text=${enc(txt)}" target="_blank" rel="noopener">Telegram</a>
      <a class="btn shf" href="https://www.facebook.com/sharer/sharer.php?u=${enc(url)}" target="_blank" rel="noopener">Facebook</a>
      <button type="button" class="btn" data-act="shcopy">🔗 Copiar link</button>
    </div>
    <div class="actions"><button class="btn" data-act="close">Fechar</button></div>`,"shbox");
}
document.addEventListener("click",async e=>{const el=e.target.closest("[data-act]");if(!el)return;const a=el.dataset.act;
  if(!/^sh(fmt|native|dl|copy|tier|vote|pc|inv|game|prof2)$|^redes(edit|save)$/.test(a))return;e.stopImmediatePropagation();
  if(a==="shtier"){shareTier(el.dataset.k,el.dataset.pid);return}
  if(a==="shvote"){shareVote(el.dataset.id);return}
  if(a==="shpc"){sharePc(el.dataset.pid);return}
  if(a==="shinv"){shareInvite();return}
  if(a==="redesedit"){redesOpen();return}
  if(a==="redessave"){redesSave(el);return}
  if(M?.type!=="share")return;const o=M.o;const url=o.url||SITE_URL;
  if(a==="shfmt"){if(M.fmt===el.dataset.k)return;M.fmt=el.dataset.k;M.blob=null;M.url="";drawShare(true);shareRender();return}
  if(a==="shcopy"){const t=((o.text||"")+" "+url).trim();try{await navigator.clipboard.writeText(t);toast("Link copiado ✓")}catch{prompt("Copie:",t)}return}
  if(a==="shdl"){if(!M.blob)return;const f=document.createElement("a");f.href=M.url;f.download=(o.file||"zerados")+"-"+M.fmt+".png";document.body.appendChild(f);f.click();f.remove();toast("Imagem baixada 📸");return}
  if(a==="shnative"){try{const file=M.blob?new File([M.blob],(o.file||"zerados")+".png",{type:"image/png"}):null;
      if(file&&navigator.canShare?.({files:[file]}))await navigator.share({files:[file],text:((o.text||"")+" "+url).trim()});
      else await navigator.share({title:o.title||"Zerados da Galera",text:o.text||"",url})}catch(err){if(err?.name!=="AbortError")toast("Não deu para abrir o compartilhar do aparelho")}return}
},true);

/* ---------- desenho das imagens ---------- */
function cvSrc(u){return String(u||"").replace(/^https:\/\/shared\.cloudflare\.steamstatic\.com/,"https://shared.fastly.steamstatic.com")}
const cvImg = src => new Promise(r=>{if(!src)return r(null);const i=new Image();const same=/^(data:|img\/|covers\/|blob:)/.test(src);if(!same)i.crossOrigin="anonymous";
  const t=setTimeout(()=>r(null),8000);i.onload=()=>{clearTimeout(t);r(i)};i.onerror=()=>{clearTimeout(t);r(null)};i.src=same?src:cvSrc(src)});
async function coverDataFor(g){
  if(g.pid&&g.gid&&g.coverV&&S.db){try{const sn=await S.db.doc(`players/${g.pid}/covers/${g.gid}`).get();const d=sn.exists&&sn.data();if(d&&typeof d.img==="string"&&d.img.startsWith("data:image/"))return d.img}catch{}}
  const loc=typeof localCover==="function"?localCover(g.title):"";if(loc)return loc;
  const ap=g.steamApp||(typeof infoAppid==="function"?infoAppid(g.title):null);if(ap&&typeof steamCover==="function")return steamCover(ap);
  return typeof extImg==="function"?extImg(g.coverUrl):""}
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function drawCover(x,img,X,Y,w,h,title){
  x.save();rr(x,X,Y,w,h,Math.round(w*.08));x.clip();
  if(img){const s=Math.max(w/img.width,h/img.height);const iw=img.width*s,ih=img.height*s;x.drawImage(img,X+(w-iw)/2,Y+(h-ih)/2,iw,ih)}
  else{const g=x.createLinearGradient(X,Y,X+w,Y+h);g.addColorStop(0,"#2a2440");g.addColorStop(1,"#4a2a5e");x.fillStyle=g;x.fillRect(X,Y,w,h);
    x.fillStyle="#fff";x.font=`700 ${Math.max(12,Math.round(w/7))}px Rubik, sans-serif`;x.textAlign="center";const words=String(title||"").split(" ");let line="",ly=Y+h*0.35;const lh=Math.round(w/6);
    for(const wd of words){const t=line?line+" "+wd:wd;if(x.measureText(t).width>w-10&&line){x.fillText(line,X+w/2,ly);line=wd;ly+=lh;if(ly>Y+h-10)break}else line=t}if(ly<=Y+h-10)x.fillText(line,X+w/2,ly);x.textAlign="left"}
  x.restore()}
async function frame(W,H,o){
  try{await document.fonts?.ready}catch{}
  const cv=document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d");
  const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,o.c1||"#140f24");g.addColorStop(1,o.c2||"#FF3B6B");x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle="rgba(10,6,20,.55)";rr(x,40,40,W-80,H-80,36);x.fill();
  const logo=await cvImg("img/logo-160.png");if(logo)x.drawImage(logo,80,74,96,96);
  x.fillStyle="#fff";x.font="400 40px Bungee, Impact, sans-serif";x.fillText("ZERADOS DA GALERA",192,138);
  let y=230;
  if(o.title){x.font=`800 ${o.titleSize||64}px Rubik, sans-serif`;x.fillStyle="#fff";y=wrapL(x,o.title,80,y,W-160,(o.titleSize||64)+8)+10}
  if(o.sub){x.font="600 36px Rubik, sans-serif";x.fillStyle="rgba(255,255,255,.8)";y=wrapL(x,o.sub,80,y+8,W-160,44)+10}
  // rodapé com chamada
  x.fillStyle="rgba(255,255,255,.1)";rr(x,80,H-190,W-160,110,24);x.fill();
  x.fillStyle="#fff";x.font="700 34px Rubik, sans-serif";x.textAlign="center";x.fillText(o.cta||"Monte a sua também 👉",W/2,H-142);
  x.font="400 34px Bungee, Impact, sans-serif";x.fillStyle=o.c3||"#FFD23F";x.fillText("zeradosdagalera.com.br",W/2,H-98);x.textAlign="left";
  return {cv,x,y:y+20,bottom:H-220}}
function wrapL(x,t,X,y,maxW,lh){const words=String(t).split(" ");let line="";for(const w of words){const test=line?line+" "+w:w;if(x.measureText(test).width>maxW&&line){x.fillText(line,X,y);line=w;y+=lh}else line=test}x.fillText(line,X,y);return y+lh}
async function drawTierRows(f,W,rows,{k}){const {x}=f;const top=f.y,bot=f.bottom;const n=5;const gap=14;const rh=Math.min(300,Math.floor((bot-top-gap*(n-1))/n));
  const lw=Math.round(rh*.55);const ratio=k==="jogos"?.75:2/3;const avail=W-160-lw-24;
  // cada fileira usa a maior capa em que todos os itens dela cabem (quebra em linhas se precisar)
  const fit=N=>{let cw=Math.round((rh-16)*ratio),ch,perLine,lines;N=Math.max(1,N);
    for(;cw>=60;cw-=4){ch=Math.round(cw/ratio);if(ch>rh-16)continue;perLine=Math.max(1,Math.floor((avail+8)/(cw+8)));lines=Math.max(1,Math.floor((rh-12+8)/(ch+8)));if(perLine*lines>=N)break}
    ch=Math.min(rh-16,Math.round(cw/ratio));perLine=Math.max(1,Math.floor((avail+8)/(cw+8)));lines=Math.max(1,Math.floor((rh-12+8)/(ch+8)));return {cw,ch,perLine,cap:perLine*lines}};
  const F=rows.map(r=>fit(r.items.length));
  const imgs=await Promise.all(rows.map((r,i)=>Promise.all(r.items.slice(0,F[i].cap).map(it=>it.src&&it.src.then?it.src.then(cvImg):cvImg(it.src)))));
  rows.forEach((r,ri)=>{const {cw,ch,perLine,cap}=F[ri];const Y=top+ri*(rh+gap);x.fillStyle="rgba(255,255,255,.06)";rr(x,80,Y,W-160,rh,18);x.fill();
    x.fillStyle=TCOL[r.t];rr(x,80,Y,lw,rh,18);x.fill();x.fillStyle="#1a1530";x.font=`400 ${Math.round(lw*.55)}px Bungee, Impact, sans-serif`;x.textAlign="center";x.fillText(r.t,80+lw/2,Y+rh/2+lw*.2);x.textAlign="left";
    const usedLines=Math.max(1,Math.ceil(Math.min(r.items.length,cap)/perLine));const y0=Y+(rh-(usedLines*ch+(usedLines-1)*8))/2;
    r.items.slice(0,cap).forEach((it,i)=>{const cx=80+lw+14+(i%perLine)*(cw+8),cy=y0+Math.floor(i/perLine)*(ch+8);drawCover(x,imgs[ri][i],cx,cy,cw,ch,it.title)});
    if(r.items.length>cap){const i=cap-1;const X=80+lw+14+(i%perLine)*(cw+8),Yc=y0+Math.floor(i/perLine)*(ch+8);x.fillStyle="rgba(0,0,0,.7)";rr(x,X,Yc,cw,ch,10);x.fill();x.fillStyle="#fff";x.font=`800 ${Math.round(cw*.32)}px Rubik, sans-serif`;x.textAlign="center";x.fillText("+"+(r.items.length-cap+1),X+cw/2,Yc+ch/2+cw*.11);x.textAlign="left"}
    if(!r.items.length){x.fillStyle="rgba(255,255,255,.35)";x.font="500 28px Rubik, sans-serif";x.fillText("—",80+lw+30,Y+rh/2+10)}})}

/* ---------- tier list (jogos, animes, séries, filmes, mangás ou votação do mês) ---------- */
const KIND_PL={jogos:"jogos",anime:"animes",serie:"séries",filme:"filmes",manga:"mangás"};
function tierItems(k,pid){
  if(k==="jogos"){const L=allGames().filter(g=>g.pid===pid&&g.tier);return L.map(g=>({t:g.tier,title:g.title,src:coverDataFor(g)}))}
  if(pid==="galera"){const by={};for(const x of allMedia().filter(x=>x.k===k&&x.tier)){const key=gkKey(x.t);(by[key]=by[key]||{...x,sc:[]}).sc.push(5-GK_TIERS.indexOf(x.tier));if(!gkImg(by[key].img)&&gkImg(x.img))by[key].img=x.img}
    return Object.values(by).map(o=>{const m=gkAvg(o.sc);return {t:scoreTier(m),m,title:o.t,src:gkImg(o.img)}}).sort((a,b)=>b.m-a.m)}
  return mediaOf(pid).filter(x=>x.k===k&&x.tier).sort((a,b)=>(b.nota??-1)-(a.nota??-1)).map(x=>({t:x.tier,title:x.t,src:gkImg(x.img)}))}
function shareTier(k,pid){const P=players();const p=P[pid];const nome=pid==="galera"?"da galera":`de ${p?.nick||""}`;
  const items=tierItems(k,pid);if(!items.length){toast("Essa tier list ainda está vazia");return}
  const rows=["S","A","B","C","D"].map(t=>({t,items:items.filter(i=>i.t===t)}));
  const mine=pid===S.myId;const top=rows.find(r=>r.items.length)?.items[0]?.title;
  shareSheet({title:"Tier list",file:`tierlist-${k}-${pid==="galera"?"galera":slug(p?.nick)}`,
    text:mine?`Minha tier list de ${KIND_PL[k]} 🏆${top?` (${top} no topo!)`:""} Concorda? Monta a sua no Zerados da Galera`:`Tier list de ${KIND_PL[k]} ${nome} no Zerados da Galera 🏆`,
    url:pid!=="galera"&&p?shareUrlPerfil(p):SITE_URL,
    render:async(W,H)=>{const f=await frame(W,H,{title:`Tier list ${nome}`,sub:KIND_PL[k][0].toUpperCase()+KIND_PL[k].slice(1),c2:p?.color||"#FF3B6B",cta:"Concorda? Monte a sua 👉",titleSize:W>H?56:60});
      await drawTierRows(f,W,rows,{k});return f.cv}})}
function shareVote(id){const tl=S.tierlists?.[id];if(!tl)return;const r=tlResult(id);if(!r)return;const k=id.includes("~")?id.split("~")[1]:"jogos";
  const rows=["S","A","B","C","D"].map(t=>({t,items:(r.tiers[t]||[]).map(x=>({title:x.title,src:k==="jogos"?coverDataFor({title:x.title,coverUrl:x.coverUrl}):gkImg(x.coverUrl)}))}));
  shareSheet({title:"Votação do mês",file:"votacao-"+id.replace("~","-"),text:`${tl.title||"Tier list do mês"}: ${tl.status==="encerrada"?"saiu o resultado":"a votação está aberta"} no Zerados da Galera 🗳️`,url:SITE_URL,
    render:async(W,H)=>{const f=await frame(W,H,{title:tl.title||"Tier list do mês",sub:`${monthName(id.split("~")[0])} · ${r.voters} ${r.voters===1?"voto":"votos"}`,c2:"#3D5AFE",cta:tl.status==="aberta"?"Vote também 👉":"Veja o ranking 👉"});await drawTierRows(f,W,rows,{k});return f.cv}})}

/* ---------- zerado, perfil e PC ---------- */
shareGame=function(pid,gid){const p=players()[pid];const g=p?.games?.[gid];if(!g)return;const verbo=g.status==="platinado"?"platinou":isDone(g)?"zerou":"está jogando";
  shareSheet({title:"Compartilhar",file:"zerei-"+slug(g.title),text:`${pid===S.myId?(g.status==="platinado"?"Platinei":isDone(g)?"Zerei":"Tô jogando"):p.nick+" "+verbo} ${g.title}${typeof g.nota==="number"?` e dei nota ${fmtNota(g.nota)}`:""} 🎮 Bora registrar os seus no Zerados da Galera`,url:shareUrlPerfil(p),
    render:async(W,H)=>{const f=await frame(W,H,{title:g.title,sub:`${p.nick} ${verbo}${g.tier?` · tier ${g.tier}`:""}`,c2:p.color||"#FF3B6B",cta:"E você, já zerou? 👉"});const {x}=f;
      const img=await cvImg(await coverDataFor({...g,pid,gid}));const ch=Math.min(f.bottom-f.y-(H>1500?330:200),H>1500?900:600);const cw=Math.round(ch*.72);
      drawCover(x,img,(W-cw)/2,f.y,cw,ch,g.title);let y=f.y+ch+70;x.textAlign="center";
      if(typeof g.nota==="number"){const st=Math.round(g.nota)/2;let s="";for(let i=1;i<=5;i++)s+=st>=i?"★":st>=i-.5?"⯪":"☆";x.fillStyle="#FFD23F";x.font="700 64px sans-serif";x.fillText(s+"  "+fmtNota(g.nota),W/2,y);y+=70}
      x.fillStyle="rgba(255,255,255,.85)";x.font="600 36px Rubik, sans-serif";x.fillText([g.hours?g.hours+" h":"",g.platform||"",g.year||""].filter(Boolean).join("  ·  "),W/2,y);y+=60;
      if(g.comment&&H>1500){x.font="italic 500 34px Rubik, sans-serif";x.fillStyle="#fff";const t="“"+cap(g.comment,140)+"”";x.textAlign="left";wrapC(x,t,W/2,y,W-200,44)}
      x.textAlign="left";return f.cv}})};
function wrapC(x,t,cx,y,maxW,lh){x.textAlign="center";const words=String(t).split(" ");let line="";for(const w of words){const test=line?line+" "+w:w;if(x.measureText(test).width>maxW&&line){x.fillText(line,cx,y);line=w;y+=lh}else line=test}x.fillText(line,cx,y);x.textAlign="left";return y+lh}
shareProfile=function(pid){const p=players()[pid];if(!p)return;const s=stats(p);const l=levelOf(xpOf(pid));const mine=pid===S.myId;
  shareSheet({title:"Compartilhar perfil",file:"perfil-"+slug(p.nick),text:mine?`Meu perfil gamer: ${s.done} zerados, nível ${l.L} 🎮 Vem montar o seu no Zerados da Galera`:`Perfil de ${p.nick} no Zerados da Galera 🎮`,url:shareUrlPerfil(p),
    render:async(W,H)=>{const f=await frame(W,H,{title:"",c2:p.color||"#FF3B6B",cta:"Monte o seu perfil 👉"});const {x}=f;let y=f.y+10;const R=H>1500?170:130;
      const av=await cvImg(avatarSrc(p));x.save();x.beginPath();x.arc(W/2,y+R,R,0,Math.PI*2);x.closePath();if(av){x.clip();x.drawImage(av,W/2-R,y,R*2,R*2)}else{x.fillStyle=p.color||"#FF3B6B";x.fill();x.fillStyle="#fff";x.font=`${R}px sans-serif`;x.textAlign="center";x.fillText(p.glyph||"★",W/2,y+R*1.35)}x.restore();
      x.strokeStyle="#FFD23F";x.lineWidth=10;x.beginPath();x.arc(W/2,y+R,R+6,0,Math.PI*2);x.stroke();y+=R*2+90;x.textAlign="center";
      x.fillStyle="#fff";x.font="800 76px Rubik, sans-serif";x.fillText(p.nick,W/2,y);y+=60;x.font="600 38px Rubik, sans-serif";x.fillStyle="rgba(255,255,255,.85)";x.fillText(`Nível ${l.L} · ${l.name}`,W/2,y);y+=60;x.textAlign="left";
      const st=[["zerados",s.done],[`em ${YEAR}`,s.year],["horas",Math.round(s.hours)],["platinas",s.plat]];const bw=(W-160-30)/2,bh=H>1500?170:130;
      st.forEach(([k,v],i)=>{const X=80+(i%2)*(bw+30),Y=y+Math.floor(i/2)*(bh+24);x.fillStyle="rgba(255,255,255,.1)";rr(x,X,Y,bw,bh,22);x.fill();x.fillStyle="#fff";x.font=`800 ${H>1500?72:58}px Rubik, sans-serif`;x.fillText(String(v),X+30,Y+bh*.55);x.font="500 32px Rubik, sans-serif";x.fillStyle="rgba(255,255,255,.75)";x.fillText(k,X+30,Y+bh*.85)});
      y+=2*(bh+24)+20;
      if(H>1500){const tops=allGames().filter(g=>g.pid===pid&&g.tier==="S").slice(0,4);if(tops.length){x.fillStyle="rgba(255,255,255,.8)";x.font="700 34px Rubik, sans-serif";x.fillText("Tier S",80,y+10);y+=30;const cw=Math.min(200,(W-160-30)/4),ch=Math.round(cw*1.33);
        const imgs=await Promise.all(tops.map(g=>coverDataFor(g).then(cvImg)));tops.forEach((g,i)=>drawCover(x,imgs[i],80+i*(cw+10),y,cw,ch,g.title))}}
      return f.cv}})};
function sharePc(pid){const p=players()[pid];const pc=pcOf(p);if(!Object.keys(pc).length)return;
  shareSheet({title:"Compartilhar setup",file:"setup-"+slug(p.nick),text:`${pid===S.myId?"Meu setup":"Setup de "+p.nick}: ${[pc.cpu,pc.gpu].filter(Boolean).join(" + ")} 🖥️ Mostra o seu no Zerados da Galera`,url:shareUrlPerfil(p),
    render:async(W,H)=>{const f=await frame(W,H,{title:pid===S.myId?"Meu setup":`Setup de ${p.nick}`,c2:p.color||"#16A3C7",cta:"Mostre o seu setup 👉"});const {x}=f;
      const L=PC_SLOTS.filter(([k])=>pc[k]);const rh=Math.min(170,Math.floor((f.bottom-f.y)/L.length)-14);let y=f.y;
      for(const [k,l] of L){const b=pcBrand(pc[k]);const svg=pcIcon(k,b?.c||"#FF3B6B").replace('class="pcico"','xmlns="http://www.w3.org/2000/svg" width="128" height="128"').replace(/currentColor/g,"#ffffff").replace(/var\(--accent\)/g,"#FF3B6B");
        const ic=await cvImg("data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg));
        x.fillStyle="rgba(255,255,255,.07)";rr(x,80,y,W-160,rh,22);x.fill();x.fillStyle=b?.c||"#FF3B6B";rr(x,80,y,10,rh,5);x.fill();
        if(ic)x.drawImage(ic,110,y+(rh-rh*.7)/2,rh*.7,rh*.7);const tx=110+rh*.7+28;
        x.fillStyle="rgba(255,255,255,.65)";x.font="700 26px JetBrains Mono, monospace";x.fillText((l+(b?" · "+b.n:"")).toUpperCase(),tx,y+rh*.4);
        x.fillStyle="#fff";x.font=`800 ${Math.round(rh*.24)}px Rubik, sans-serif`;x.fillText(cap(pc[k],34),tx,y+rh*.75);y+=rh+14}
      return f.cv}})}

/* ---------- botões nas telas ---------- */
const _viewTierSh=viewTier;
viewTier=function(){let h=_viewTierSh.apply(this,arguments);const mid=meId();let btn="";
  if(S.tierCat==="jogos"||!S.tierCat){if(S.tierWho==="mes"){const k=Object.keys(tierlists()).filter(x=>!x.includes("~")).sort().reverse();const id=S.tlMonth&&tierlists()[S.tlMonth]?S.tlMonth:k[0];if(id)btn=`<button class="btn small" data-act="shvote" data-id="${esc(id)}">📤 Compartilhar resultado</button>`}
    else if(players()[S.tierWho])btn=`<button class="btn small" data-act="shtier" data-k="jogos" data-pid="${esc(S.tierWho)}">📤 Compartilhar tier list</button>`}
  else{const k=S.tierCat,w=S.gkWho?.[k];if(w==="mes"){const id=S.gkMesSel?.[k];if(id&&S.tierlists?.[id])btn=`<button class="btn small" data-act="shvote" data-id="${esc(id)}">📤 Compartilhar resultado</button>`}
    else if(w){const pid=w==="eu"?mid:w;btn=`<button class="btn small" data-act="shtier" data-k="${esc(k)}" data-pid="${esc(pid)}">📤 Compartilhar tier list</button>`}}
  if(!btn)return h;const pk=h.indexOf('<div class="tierpick"');if(pk<0)return h;const end=h.indexOf("</div>",pk)+6;return h.slice(0,end)+`<div class="sharerow">${btn}</div>`+h.slice(end)};
const _pcBoxSh=pcBox;
pcBox=function(pid){const h=_pcBoxSh(pid);if(!h||!Object.keys(pcOf(players()[pid])).length)return h;
  return h.replace(/<\/div>(\s*<div class="pcgrid">)/,`<button class="btn small" data-act="shpc" data-pid="${esc(pid)}" aria-label="Compartilhar setup">📤</button></div>$1`)};

/* ================= CONVITE COM RECOMPENSA ================= */
const CONV_XP=200;
(function(){try{const c=new URLSearchParams(location.search).get("convite");if(c&&/^[a-z0-9-]{1,48}$/.test(c)){localStorage.setItem("zg-conv",c);history.replaceState(null,"",location.pathname+location.hash)}}catch{}})();
function convidadosDe(pid){return Object.entries(players()).filter(([id,p])=>id!==pid&&p.invitedBy===pid)}
function shareInvite(){const m=me();if(!m)return;const url=`${SITE_URL}?convite=${pslug(m)}`;
  shareSheet({title:"Convidar a galera",file:"convite",text:`Bora registrar nossos jogos zerados, tier lists, animes e setup juntos? Entra pelo meu convite que nós dois ganhamos +${CONV_XP} XP 🎮`,url,
    render:async(W,H)=>{const f=await frame(W,H,{title:`${m.nick} te chamou pro Zerados da Galera`,sub:"Jogos zerados, tier lists, animes, setup, missões e ranking da galera",c2:m.color||"#FF3B6B",cta:`Entra pelo convite: +${CONV_XP} XP 👉`,titleSize:70});const {x}=f;
      let y=f.y+20;const big=H>1500;
      if(big){const R=130;const av=await cvImg(avatarSrc(m));x.save();x.beginPath();x.arc(W/2,y+R,R,0,Math.PI*2);x.closePath();if(av){x.clip();x.drawImage(av,W/2-R,y,R*2,R*2)}else{x.fillStyle=m.color||"#FF3B6B";x.fill()}x.restore();
        x.strokeStyle="#FFD23F";x.lineWidth=8;x.beginPath();x.arc(W/2,y+R,R+5,0,Math.PI*2);x.stroke();y+=R*2+70}
      const items=["🎮 Sua estante de jogos","🏆 Tier lists de jogos e animes","🔥 Missões, níveis e temporadas","🖥️ Seu setup no perfil","💬 Chat e fórum da galera"];
      const bh=big?96:70;for(const t of items){if(y+bh>f.bottom)break;x.fillStyle="rgba(255,255,255,.08)";rr(x,80,y,W-160,bh-16,18);x.fill();x.fillStyle="#fff";x.font=`700 ${big?46:38}px Rubik, sans-serif`;x.fillText(t,110,y+(bh-16)/2+15);y+=bh}return f.cv}})}
// quem entrou pelo link: marca "convidado por" uma vez, só em conta nova
let _convTry=false;
function convCheck(){if(_convTry||!MINE())return;let c=null;try{c=localStorage.getItem("zg-conv")}catch{}if(!c)return;const m=me();if(!m)return;
  _convTry=true;const inv=pidBySlug(c);try{localStorage.removeItem("zg-conv")}catch{}
  if(!inv||inv===S.myId||m.invitedBy||Object.keys(m.games||{}).length>5||m.onb)return;
  saveMe(p=>{if(!p.invitedBy)p.invitedBy=inv},{noDay:true}).then(()=>toast(`Você entrou pelo convite de ${players()[inv]?.nick||"um amigo"}! Complete os primeiros passos e vocês dois ganham +${CONV_XP} XP 🎉`)).catch(()=>{})}
if(typeof setInterval==="function")setInterval(convCheck,4000);
const _xpOfConv=xpOf;
xpOf=function(pid){const p=players()[pid];if(!p)return 0;let b=0;if(p.invitedBy&&p.onb&&players()[p.invitedBy])b+=CONV_XP;
  b+=Math.min(10,convidadosDe(pid).filter(([,q])=>q.onb).length)*CONV_XP;return _xpOfConv(pid)+b};
BADGES.push({id:"recrutador",ic:"🤝",col:"#2EC27E",t:"Recrutador",ok:(s,o,pid)=>convidadosDe(pid).filter(([,q])=>q.onb).length>=3,d:(s,o,pid)=>`${convidadosDe(pid).filter(([,q])=>q.onb).length} amigos convidados`});

/* ================= REDES NO PERFIL ================= */
const REDES=[["ig","Instagram",/^[A-Za-z0-9._]{1,30}$/,h=>`https://instagram.com/${h}`,"#E1306C"],["tt","TikTok",/^[A-Za-z0-9._]{2,24}$/,h=>`https://www.tiktok.com/@${h}`,"#25F4EE"],
  ["yt","YouTube",/^[A-Za-z0-9._-]{3,30}$/,h=>`https://www.youtube.com/@${h}`,"#FF0000"],["tw","Twitch",/^[A-Za-z0-9_]{3,25}$/,h=>`https://www.twitch.tv/${h}`,"#9146FF"],
  ["x","X",/^[A-Za-z0-9_]{1,15}$/,h=>`https://x.com/${h}`,"#E7E9EA"],["psn","PSN",/^[A-Za-z0-9_-]{3,16}$/,null,"#2E8BFF"],["xbox","Xbox",/^[A-Za-z0-9 ]{1,16}$/,null,"#3FD13F"],
  ["nsw","Nintendo",/^SW-\d{4}-\d{4}-\d{4}$/,null,"#FF3B3B"]];
const redesOf = p => {const r=p&&typeof p.redes==="object"&&p.redes?p.redes:{};const o={};for(const [k,,re] of REDES)if(typeof r[k]==="string"&&re.test(r[k]))o[k]=r[k];return o};
function redesRow(p,mine){const r=redesOf(p);const ks=REDES.filter(([k])=>r[k]);if(!ks.length&&!mine)return "";
  return `<div class="redes">${ks.map(([k,n,,u,c])=>u?`<a class="rede" style="--rc:${c}" href="${esc(u(r[k]))}" target="_blank" rel="noopener noreferrer"><b>${n}</b> ${k==="yt"||k==="tt"?"@":""}${esc(r[k])}</a>`:`<button type="button" class="rede" style="--rc:${c}" data-act="redecopy" data-v="${esc(r[k])}" title="Copiar"><b>${n}</b> ${esc(r[k])}</button>`).join("")}
    ${mine&&MINE()?`<button type="button" class="rede add" data-act="redesedit">${ks.length?"✎ Redes":"+ Redes e IDs de jogo"}</button>`:""}</div>`}
document.addEventListener("click",async e=>{const el=e.target.closest('[data-act="redecopy"]');if(!el)return;e.stopImmediatePropagation();try{await navigator.clipboard.writeText(el.dataset.v);toast("Copiado ✓")}catch{}},true);
function redesOpen(){const r=redesOf(me());M={type:"redes"};
  $("#modal").innerHTML=overlay(`<h2>🔗 Redes e IDs de jogo</h2><div class="redform">${REDES.map(([k,n])=>`<label class="field"><span class="flabel">${n}</span><input id="rd-${k}" value="${esc(r[k]||"")}" maxlength="40" autocomplete="off" placeholder="${{ig:"seu_usuario",tt:"seu_usuario",yt:"seucanal",tw:"seucanal",x:"seu_usuario",psn:"ID da PSN",xbox:"Gamertag",nsw:"SW-1234-5678-9012"}[k]}"></label>`).join("")}</div>
    <p class="err" id="rd-err" role="alert"></p><div class="actions"><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="redessave">Salvar</button></div>`,"redbox")}
async function redesSave(el){const out={};for(const [k,n,re] of REDES){let v=($("#rd-"+k)?.value||"").trim().replace(/^@/,"").replace(/^https?:\/\/(www\.)?(instagram\.com|tiktok\.com\/@?|youtube\.com\/@?|twitch\.tv|x\.com|twitter\.com)\//i,"").replace(/\/.*$/,"");
    if(k==="nsw")v=v.toUpperCase().replace(/^(SW)?[- ]?(\d{4})[- ]?(\d{4})[- ]?(\d{4})$/,"SW-$2-$3-$4");
    if(!v)continue;if(!re.test(v)){$("#rd-err").textContent=`${n}: formato não reconhecido.`;return}out[k]=v}
  el.disabled=true;try{await saveMe(p=>{if(Object.keys(out).length)p.redes=out;else delete p.redes},{noDay:true});closeModal();renderAll();toast("Redes salvas ✓")}catch(err){el.disabled=false;$("#rd-err").textContent=errMsg(err)}}

/* ---------- perfil: redes no topo, botão Convidar, "convidado por" ---------- */
const _viewPerfilSh=viewPerfil;
viewPerfil=function(){let h=_viewPerfilSh.apply(this,arguments);const pid=pidBySlug(S.route);const p=players()[pid];if(!p)return h;const mine=pid===S.myId;
  const row=redesRow(p,mine);const inv=p.invitedBy&&players()[p.invitedBy]?`<a class="convby" href="#perfil-${esc(pslug(players()[p.invitedBy]))}">🤝 convidado por ${esc(players()[p.invitedBy].nick)}</a>`:"";
  const i=h.indexOf('<div style="padding:0 18px 18px"><div class="xpbar">');
  if(i>=0&&(row||inv))h=h.slice(0,i)+`<div class="redeswrap">${row}${inv}</div>`+h.slice(i);
  if(mine&&MINE())h=h.replace(/(<button class="btn small" data-act="shareprof"[^>]*>[^<]*<\/button>)/,`$1<button class="btn small primary" data-act="shinv">🤝 Convidar</button>`);
  return h};

/* ===== v30: barra da tier list em uma linha, "ler mais" nos avisos ===== */
function tlToolbar(h){
  const pk=h.indexOf('<div class="tierpick"');if(pk<0)return h;
  const pe=h.indexOf("</div>",pk)+6;let pick=h.slice(pk,pe),rest=h.slice(pe),acts="";
  for(;;){const m=rest.match(/^\s*<div class="(sharerow|dragbar)">([\s\S]*?)<\/div>/);if(!m)break;acts+=m[2];rest=rest.slice(m[0].length)}
  acts=acts.replace(/✋ Modo arrastar (ligado|desligado)/,"✋ Arrastar").replace(/class="btn small" data-act="sh/g,'class="chip2" data-act="sh');
  return h.slice(0,pk)+`<div class="tltool">${pick}${acts?`<div class="tlacts">${acts}</div>`:""}</div>`+rest;
}
const _viewTierV30=viewTier;
viewTier=function(){return tlToolbar(_viewTierV30.apply(this,arguments)).replace(/>1 jogos</g,">1 jogo<")};
const _boardCardV30=boardCard;
boardCard=function(b,compact){
  if(!compact||!b||!b.text||b.text.length<=220)return _boardCardV30(b,compact);
  return _boardCardV30(b,false).replace(/<p class="btext">([\s\S]*?)<\/p>/,(_,t)=>`<p class="btext clamp">${t}</p><button type="button" class="linkbtn bmore" data-act="bmore" aria-expanded="false">Ler mais</button>`);
};
document.addEventListener("click",e=>{const el=e.target.closest('[data-act="bmore"]');if(!el)return;e.stopImmediatePropagation();
  const p=el.previousElementSibling;if(!p)return;const open=p.classList.toggle("open");el.textContent=open?"Ler menos":"Ler mais";el.setAttribute("aria-expanded",String(open))},true);
/* v30: interface sem emoji (mantém reações, avatares e conteúdo da galera) */
const EMO_RE=/^(?:[\p{Extended_Pictographic}\p{Emoji_Modifier}‍️⃣]|[\u{1F1E6}-\u{1F1FF}])+\s*|\s*(?:[\p{Extended_Pictographic}\p{Emoji_Modifier}‍️⃣])+$/gu;
const EMO_SEL='button,a.btn,[role="tab"],option,optgroup,.eyebrow,.tierhead h3,.sec h2,.box>h2,.box>h3,.card>h3,.tag,.pill,.chip2,label,summary,#tabs a,nav a,.btype,.whosel';
const EMO_SKIP='.glyph,.rx,.react,.reac,.emo,.emoji,.bcard h3,.btext,.msg,.bubble,.cmt,.frev,textarea,input,.gfr,[data-keepemo]';
const TAB_IC={inicio:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
 saves:'<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/>',
 feed:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.8 2.7 2.5 3 5.2"/>',
 tierlist:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>',
 dicas:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
 descobrir:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
 quadro:'<path d="M4 4h16v12H8l-4 4z"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>'};
function emoStrip(root){try{(root||document.body).querySelectorAll(EMO_SEL).forEach(el=>{if(el.closest(EMO_SKIP))return;
  const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;const L=[];while(n=w.nextNode())L.push(n);
  for(const t of L){if(t.parentElement&&t.parentElement.closest(EMO_SKIP))continue;const v=t.nodeValue;if(!v||!/\p{Extended_Pictographic}/u.test(v))continue;
    const nv=v.replace(EMO_RE,m=>/^\s/.test(m)?"":"");if(nv.trim()&&nv!==v)t.nodeValue=nv.replace(/^\s+/,v.match(/^\s*/)[0]);
    else if(!nv.trim()&&/\p{L}/u.test(el.textContent.replace(v,""))&&!t.parentElement.closest(".tic"))t.nodeValue=""}});
  document.querySelectorAll("#tabs .tab .tic:not([data-ic])").forEach(ic=>{const k=(ic.closest("a")?.getAttribute("href")||"").slice(1);const d=TAB_IC[k];if(!d)return;ic.dataset.ic=k;ic.innerHTML=`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`})}catch{}}
if(typeof MutationObserver!=="undefined"){let pend=false;const run=()=>{pend=false;emoStrip()};
  const mo=new MutationObserver(()=>{if(!pend){pend=true;requestAnimationFrame(run)}});
  const go=()=>{mo.observe(document.body,{childList:true,subtree:true});run()};
  if(document.body)go();else document.addEventListener("DOMContentLoaded",go)}
const _gkCardV30=gkCard;
gkCard=function(x,mine){const h=_gkCardV30(x,mine);if(!x||!x.c)return h;
  const full=`<p class="frev clamp">“${esc(x.c)}”</p>${x.c.length>150?`<button type="button" class="linkbtn bmore" data-act="bmore" aria-expanded="false">Ler mais</button>`:""}`;
  return h.replace(/<p class="frev">[\s\S]*?<\/p>/,()=>full)};

/* ---------- escrita ---------- */
let chain=Promise.resolve();
function queue(fn){const p=chain.then(fn,fn);chain=p.catch(()=>{});return p}
function saveMe(mut,opt={}){return queue(async()=>{
  const cur=clone(S.players[S.myId]||{games:{}});delete cur._id;mut(cur);cur.updatedAt=Date.now();
  if(!opt.noDay){cur.days=cur.days||{};const t=today();cur.days[t]=(cur.days[t]||0)+1;const lim=dkey(new Date(Date.now()-400*864e5));for(const k of Object.keys(cur.days))if(k<lim)delete cur.days[k]}
  delete cur._id;S.players[S.myId]={...cur,_id:S.myId};try{const sn=lvlSnap(S.myId);if(sn){cur.lvl=sn;S.players[S.myId].lvl=sn}}catch{}renderAll();await S.db.doc("players/"+S.myId).set(cur);
})}
function flattenComments(){const out=[];for(const [uid,d] of Object.entries(S.comDocs||{}))for(const [cid,c] of Object.entries(d.items||{}))if(c&&typeof c.x==="string"&&typeof c.t==="string")out.push({cid,by:uid,t:c.t,x:c.x.slice(0,600),at:Number(c.at)||0,...(typeof c.best==="string"?{best:c.best}:{}),...(typeof c.h==="string"?{h:c.h.slice(0,120)}:{}),...(c.ed?{ed:Number(c.ed)||0}:{})});S.comments=out}
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
        p.discord=$("#p-discord").value.trim().replace(/^@/,"");{const sv=parseSteam($("#p-steam")?.value);if(sv!==null)p.steam=sv;}{const lib={};document.querySelectorAll("[data-lib]").forEach(i=>{const n=Math.round(Number(i.value));if(n>0&&LIBPLATS.includes(i.dataset.lib))lib[i.dataset.lib]=Math.min(9999,n)});p.lib=lib;}p.color=M.color;p.glyph=M.glyph;if(M.cosm)p.cosm=clone(M.cosm);p.games=p.games||{};p.friends=friendsOf(p)});
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
  if(["tierwho","tlpick","tladd","monthly","newsadd","tlsave","tldel","tlclose","tlreopen","vote","newssave","newsdel","newsrc","promocls","pessoasord","like","feedf","feedmore","feedc","qopen","tsend","qsend","qbest","listnew","listedit","listdel","listord","lsadd","lssave","metaset","pbet","presult","shareprof","sharegame","install","mclaim","mcheckin","cedit","cedsave","cedcancel","medit","medsave","medcancel","mrep","mrepsend","modapaga","modcast","modcastf","moduncast","modok","modpanel","ftab","session","sessave","plot","ctlkey","lore","ctladd","ctldel","ctlcopy","todoadd","tododel","linkadd","linkdel","diarydel","btype","bthread","boptadd","rsvp","pvote","bnew","bedit","bpin","bdel","bsave","steam","stlink","stunlink","stselrecent","stselnone","stimport"].includes(a))return;
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
  if(!live){if(["react","quickfila","challenge","joinclub","friend","csend"].includes(a))toast("No modo exemplo nada é salvo");return}
  if(a==="role"){if(!S.isOwner)return;const pid=el.dataset.pid,k=el.dataset.k;const cur=(S.roles[pid]||[]).slice();const i=cur.indexOf(k);if(i<0)cur.push(k);else cur.splice(i,1);const next={...S.roles,[pid]:cur};
    try{await S.db.doc("roles/all").set({map:next});S.roles=next;renderAll();toast("Cargos atualizados")}catch(err){toast(errMsg(err))}return}
  if(a==="cdel"){const by=el.dataset.by,cid=el.dataset.cid;if(by!==S.myId&&!S.isOwner&&!isStaff())return;if(by!==S.myId)modLog("apagou comentário",by,(comms().find(x=>x.cid===cid&&x.by===by)||{}).x);saveDocOf("comments",by,d=>{if(d.items)delete d.items[cid]}).then(()=>toast("Comentário apagado")).catch(e=>toast(errMsg(e)));return}
  if(a==="mdel"){const by=el.dataset.by,mid=el.dataset.id;if(by!==S.myId&&!S.isOwner&&!isStaff())return;if(by!==S.myId)modLog("apagou mensagem do chat",by,(chatData().msgs.find(x=>x.mid===mid)||{}).x);saveDocOf("chat",by,d=>{if(d.msgs)delete d.msgs[mid]}).catch(e=>toast(errMsg(e)));return}
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
  if(t.id==="p-avatar"&&M?.type==="profile"){const f=t.files[0];t.value="";if(!f)return;try{const d=(await animatedOrNull(f,"avatar"))||await fileToImg(f,0,60000,{w:256,h:256});M.avatar=d;$("#avprev").innerHTML=`<span class="glyph" style="--pc:${esc(M.color)}"><img src="${d}" alt=""></span>`;$("#rmavatar").hidden=false}catch{$("#perr").textContent="Não consegui ler essa imagem."}return}
  if(t.id==="p-banner"&&M?.type==="profile"){const f=t.files[0];t.value="";if(!f)return;try{const d=(await animatedOrNull(f,"banner"))||await fileToImg(f,0,170000,{w:1200,h:400});M.banner=d;$("#bnprev").innerHTML=`<img class="bimg" src="${d}" alt="">`;$("#rmbanner").hidden=false}catch{$("#perr").textContent="Não consegui ler essa imagem."}return}
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
let autoCovDone=false;function autoCovers(){if(autoCovDone||!S.canWrite||!S.loaded||!S.myId||!S.players[S.myId])return;autoCovDone=true;setTimeout(()=>syncSteam(),1500);setTimeout(()=>fillCovers(false).then(r=>{if(r.done)toast(`${r.done} capa(s) encontrada(s) para seus jogos`)}).catch(()=>{}),2500)}
let vbusy=false;function refreshVerify(){const u=AUTH&&AUTH.currentUser;if(!u||vbusy)return;vbusy=true;
  u.reload().then(()=>AUTH.currentUser.emailVerified?AUTH.currentUser.getIdToken(true).then(()=>{onUser(AUTH.currentUser);toast("E-mail confirmado! Pode criar seu perfil.")}):null).catch(()=>{}).finally(()=>{vbusy=false})}
let rt=null,lastType=0;
document.addEventListener("input",e=>{if(e.target.matches?.("#view input,#view textarea"))lastType=Date.now()});
// enquanto a pessoa digita, espera ela dar uma pausa antes de redesenhar a tela
function softRender(){clearTimeout(rt);rt=setTimeout(()=>{if(S.mode!=="live")return;const a=document.activeElement;
  if(a&&a.matches?.("#view input,#view textarea")&&Date.now()-lastType<2500){softRender();return}renderAll()},80)}
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
    const P={};snap.docs.forEach(d=>{const v=d.data();if(v&&v.nick)P[d.id]={...v,_id:d.id,games:v.games||{}}});for(const p of Object.values(P))fixSteamBurst(p);S.players=P;
    if(!snap.metadata.fromCache){clearTimeout(timer);S.stale=false}
    const first=!S.loaded;S.loaded=true;
    if(S.mode==="loading")S.mode="live";else if(S.mode==="demo")S.prevMode="live";
    renderAll();
    const u=AUTH.currentUser;if(first&&u&&S.canWrite&&!P[u.uid]&&!M)openProfile();
    if(first)autoCovers();
  },()=>{clearTimeout(timer);if(S.mode!=="demo")S.mode=Object.keys(S.players).length?"live":"offline";S.stale=true;renderAll()});
  fetch("news.json?t="+Math.floor(Date.now()/600000),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{if(j&&Array.isArray(j.itens)){S.autoNews=j;softRender()}}).catch(()=>{});
  fetch("promos.json?t="+Math.floor(Date.now()/600000),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{if(j&&Array.isArray(j.itens)){S.promos=j;softRender()}}).catch(()=>{});
  fetch("info.json?t="+Math.floor(Date.now()/600000),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{if(j&&j.jogos&&typeof j.jogos==="object"){S.infoIdx=j;softRender()}}).catch(()=>{});
  fetch("covers.json?t="+Math.floor(Date.now()/600000),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{if(j&&j.capas&&typeof j.capas==="object"){S.covers=j.capas;softRender()}}).catch(()=>{});
  AUTH.getRedirectResult().catch(()=>{});
  AUTH.onAuthStateChanged(u=>{onUser(u);if(u&&!S.canWrite)refreshVerify()});
  // Quem confirmou o e-mail em outra aba: ao voltar para o site, atualiza sozinho.
  window.addEventListener("focus",()=>{const u=AUTH.currentUser;if(u&&!S.canWrite)refreshVerify()});
})();
