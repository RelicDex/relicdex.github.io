'use strict';
// Single source of truth for the Moves directory and permanent move detail links.
const MOVE_DATA_URL='data/moves.json';
const $m=id=>document.getElementById(id);
const compact=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const text=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el;};
const displayBP=m=>m.basePower||((m.bp===null||m.bp===0)?'—':String(m.bp));
const displayPP=m=>m.pp===null?'—':String(m.pp);
const displayAccuracy=m=>m.accuracy===null||m.accuracy===0?'—':m.accuracy+'%';
const pathForMove=m=>'move.html?move='+encodeURIComponent(m.slug);
function moveType(type){const v=text('span','moves-type moves-type--'+String(type||'unknown').toLowerCase().replace(/[^a-z]/g,''),type||'Unknown');return v;}
function listPage(data){
 const all=data.moves;
 const search=$m('move-search'),type=$m('move-type-filter'),category=$m('move-category-filter'),tbody=$m('move-rows'),info=$m('move-count'),more=$m('move-more'),empty=$m('move-empty');
 for(const t of [...new Set(all.map(m=>m.type))].sort((a,b)=>a.localeCompare(b)))type.add(new Option(t,t));
 const pageSize=80;let visible=pageSize;let matches=[];
 function updateFilters(){
   const q=compact(search.value);
   matches=all.filter(m=>(!q||compact(m.name).includes(q)||compact(m.type).includes(q))&&(!type.value||m.type===type.value)&&(!category.value||m.category===category.value));
   visible=pageSize;render();
 }
 function render(){
  tbody.replaceChildren();const chunk=document.createDocumentFragment();
  for(const m of matches.slice(0,visible)){
   const tr=document.createElement('tr');
   const n=document.createElement('td');const a=text('a','',m.name);a.href=pathForMove(m);n.append(a);tr.append(n);
   const t=document.createElement('td');t.append(moveType(m.type));tr.append(t);
   tr.append(text('td','moves-muted',m.category));
   tr.append(text('td','moves-number',displayBP(m)));
   tr.append(text('td','moves-number',displayPP(m)));
   tr.append(text('td','moves-number moves-muted',displayAccuracy(m)));
   chunk.append(tr);
  }
  tbody.append(chunk);
  info.textContent='Showing '+Math.min(visible,matches.length)+' of '+matches.length+' matching moves · '+all.length+' total';
  more.hidden=visible>=matches.length;
  empty.hidden=matches.length!==0;
 }
 search.addEventListener('input',updateFilters);type.addEventListener('change',updateFilters);category.addEventListener('change',updateFilters);
 more.addEventListener('click',()=>{visible+=pageSize;render()});
 updateFilters();
 $m('moves-source-note').textContent=data.sourceNote;
}
async function detailPage(data){
 const raw=new URLSearchParams(location.search).get('move')||'';
 const key=compact(raw);
 const m=data.moves.find(x=>x.slug===raw)||data.moves.find(x=>compact(x.name)===key);
 const detail=$m('move-detail'),missing=$m('move-notfound');
 if(!m){missing.hidden=false;detail.hidden=true;return;}
 document.title=m.name+' · Moves · RelicDex';
 $m('move-title').textContent=m.name;
 $m('move-type').replaceChildren(moveType(m.type));
 $m('move-category').textContent=m.category;
 $m('move-bp').textContent=displayBP(m);
 $m('move-pp').textContent=displayPP(m);
 $m('move-accuracy').textContent=displayAccuracy(m);
 $m('move-description').textContent=m.description||'No verified description is available.';
 $m('move-source').textContent=m.sourceStatus;
 detail.hidden=false;
 // Cross-link Pokémon that learn the move via their current level-up tables.
 const list=$m('move-learners'),count=$m('move-learners-count');
 try{
   const resp=await fetch('data/pokemon.json');if(!resp.ok)throw Error('Pokédex unavailable');
   const mons=await resp.json();
   const learners=[];
   for(const mon of mons){
    const levels=(mon.levelUpMoves||[]).filter(x=>compact(x.move)===compact(m.name)).map(x=>x.level===0?'Evolution':x.level);
    if(mon.signatureMove&&compact(mon.signatureMove.name)===compact(m.name)&&!levels.length)levels.push(mon.signatureMove.learnLevel??'?');
    if(levels.length)learners.push({mon,level:levels.join(', ')});
   }
   count.textContent=learners.length+' Pokémon listed in current level-up data';
   const fragment=document.createDocumentFragment();
   for(const entry of learners){
    const row=text('div','moves-learner');const a=text('a','',entry.mon.name);
    a.href='pokedex.html?no='+entry.mon.number;
    row.append(a,text('span','','Lv '+entry.level));fragment.append(row);
   }
   list.append(fragment);
   if(!learners.length)list.append(text('p','moves-muted','No level-up learner verified in the current Pokédex records.'));
 }catch(err){
   count.textContent='Pokédex learnset unavailable';
   list.append(text('p','moves-muted','Learner data could not be loaded.'));
 }
}
async function initMovePages(){
 // Support older bookmarked links to moves.html?move=...
 const oldMove=new URLSearchParams(location.search).get('move');
 if($m('move-rows') && oldMove){location.replace('move.html?move='+encodeURIComponent(oldMove));return;}
 try{
  const r=await fetch(MOVE_DATA_URL);
  if(!r.ok)throw Error('Move source unavailable');
  const data=await r.json();
  if(!Array.isArray(data.moves)||data.moves.length<900)throw Error('Move list incomplete');
  if($m('move-rows'))listPage(data);
  if($m('move-detail'))await detailPage(data);
 }catch(err){
   const error=$m('moves-error');
   if(error){error.textContent='Move data could not be loaded. Please refresh RelicDex.';error.hidden=false;}
 }
}
initMovePages();
if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
