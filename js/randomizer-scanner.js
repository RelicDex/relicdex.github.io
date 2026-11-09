'use strict';
// Pokémon Relics Ultimate ability scanner: source-derived species IDs, ability-slot
// availability and whitelist; deterministic PRU SFC32 seed from SaveBlock2 trainer ID.
// The .sav file stays in this browser. No server upload, no file mutation.
(() => {
 const $ = (id) => document.getElementById(id);
 const file = $('save-file'), search = $('scan-search'), resultGrid = $('scan-results'),
       info = $('scan-status'), meta = $('scan-meta'), exportBtn = $('export-csv'),
       toggle = $('ability-toggle'), details = $('scan-details');
 let data = null, dex = [], seed = null, rows = [], abilityDescriptions = {};
 const MAX_FILE = 131072;
 const escape = s => String(s||'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 function status(message, type='notice') {info.textContent=message; info.dataset.type=type;}
 function abilityName(original){return String(original||'').trim();}
 const normalizeAbility = name => abilityName(name).toLowerCase().replace(/[^a-z0-9]/g,'');
 const dialog = $('ability-dialog');
 function showAbility(name) {
   const entry = abilityDescriptions[normalizeAbility(name)];
   $('ability-heading').textContent = name;
   $('ability-effect').textContent = entry?.effect || 'No verified effect description is available for this PRU ability.';
   $('ability-source').textContent = entry?.verified
     ? 'Effect description from the PRU game source.'
     : 'Effect not independently verified in the latest PRU game source.';
   dialog.showModal();
 }
 function parseSav(arrayBuffer){
   if (arrayBuffer.byteLength !== 65536 && arrayBuffer.byteLength !== 131072)
     throw Error('This does not look like a standard 64 KB or 128 KB GBA .sav file. Export the battery save (.sav), not an emulator save state.');
   const view=new DataView(arrayBuffer), sectors=Math.min(arrayBuffer.byteLength/4096, 28);
   const candidates=[];
   for(let i=0;i<sectors;i++){
     const start=i*4096, id=view.getUint16(start+0xFF4,true);
     if(id!==0 || view.getUint32(start+0xFF8,true)!==0x08012025)continue;
     // Current PRU saves checksum SaveBlock2 over 0xF80 bytes.
     // Older PRU builds can use 0xF2C. The current slot can be in
     // either 64 KB bank, so validate every physical sector.
     const expected=view.getUint16(start+0xFF6,true);
     const valid=[0xF80,0xF2C].some(length=>{
       let sum=0;
       for(let j=0;j<length;j+=4)sum=(sum+view.getUint32(start+j,true))>>>0;
       return (((sum>>>16)+(sum&0xFFFF))&0xFFFF)===expected;
     });
     if(!valid)continue;
     const trainerId=view.getUint32(start+0x0A,true);
     candidates.push({trainerId,counter:view.getUint32(start+0xFFC,true),sector:i});
   }
   if(!candidates.length)throw Error('No valid PRU save sector was found. Make an in-game save and export the emulator battery .sav file.');
   candidates.sort((a,b)=>b.counter-a.counter);
   return candidates[0];
 }
 function next(s){
   const r=(s.a+s.b+s.ctr)>>>0;
   s.ctr=(s.ctr+17)>>>0;
   s.a=(s.b^(s.b>>>9))>>>0;
   s.b=Math.imul(s.c,9)>>>0;
   s.c=(r+((s.c<<21)|(s.c>>>11)))>>>0;
   return r;
 }
 function roll(s,range){
   if(range<2)return 0;
   let mask=1;while(mask<range)mask<<=1;mask--;
   let v;do{v=next(s)&mask}while(v>=range);return v;
 }
 function randomAbility(trainerSeed,speciesId,slot){
   const s={a:(trainerSeed+data.seedReason)>>>0,b:(trainerSeed^speciesId)>>>0,
     c:((speciesId<<8)|slot)>>>0,ctr:data.stream};
   for(let i=0;i<10;i++)next(s);
   // IMPORTANT: choose from the COMPLETE whitelist, then reject illegal
   // abilities. Removing Wonder Guard before rolling changes PRU's RNG.
   for(let i=0;i<2000;i++){const ability=data.abilityPool[roll(s,data.abilityPool.length)];
     if(!ability.illegal)return ability.name;}
   throw Error('Could not calculate an ability for this species.');
 }
 function createRows(){
   const byName=new Map(data.species.map(x=>[x.speciesConstant,x]));
   rows=dex.map(m=>{
     const rec=byName.get(m.speciesConstant);
     return {name:m.name,number:m.number,types:m.types||[],sprite:m.sprite?.front,
       abilities:rec?.slots?.map(s=>({label:s.label,original:s.original,
         result:toggle.checked?randomAbility(seed,rec.speciesId,s.slot):s.original}))||[],
       matched:!!rec};
   }).sort((a,b)=>a.number-b.number);
 }
 function makeRow(r){
   const card=document.createElement('article');card.className='scan-card';
   const title=document.createElement('div');title.className='scan-mon';
   if(r.sprite && !/^(https?:|data:|javascript:)/i.test(r.sprite)){
     const img=document.createElement('img');img.src=r.sprite;img.alt='';
     img.loading='lazy';img.width=62;img.height=62;title.append(img);
   } else {const icon=document.createElement('span');icon.className='scan-sigil';icon.textContent='✦';title.append(icon)}
   const identity=document.createElement('div');
   const small=document.createElement('small');small.textContent='#'+String(r.number).padStart(3,'0')+' · '+r.types.join(' / ');
   const heading=document.createElement('h3');heading.textContent=r.name;
   identity.append(small,heading);title.append(identity);card.append(title);
   const box=document.createElement('div');box.className='scan-abilities';
   if(!r.abilities.length){const msg=document.createElement('p');msg.className='scan-unverified';msg.textContent='Ability slots awaiting source verification';box.append(msg);}
   for(const a of r.abilities){
     const e=document.createElement('div');e.className='ability-item';
     const label=document.createElement('span');label.textContent=a.label;
     const v=document.createElement('button');v.type='button';v.className='ability-link';
     v.textContent=abilityName(a.result);v.setAttribute('aria-label','What does '+abilityName(a.result)+' do?');
     v.addEventListener('click',()=>showAbility(a.result));
     const original=document.createElement('button');original.type='button';original.className='ability-original';
     original.textContent='Normally: '+abilityName(a.original);
     original.setAttribute('aria-label','What does '+abilityName(a.original)+' do?');
     original.addEventListener('click',()=>showAbility(a.original));
     e.append(label,v,original);box.append(e);
   }
   card.append(box);return card;
 }
 function render(){
   if(seed===null||!data)return;
   const q=search.value.toLowerCase().trim();
   const arr=rows.filter(r=>!q || (r.name+' '+r.number+' '+r.types.join(' ')+' '+r.abilities.map(a=>a.result+' '+a.original).join(' ')).toLowerCase().includes(q));
   resultGrid.replaceChildren();for(const r of arr)resultGrid.append(makeRow(r));
   $('scan-count').textContent=arr.length+' / '+rows.length+' Pokémon displayed';
   $('scan-verified').textContent=rows.filter(x=>x.matched).length+' verified ability records';
   $('scan-pending').textContent=rows.filter(x=>!x.matched).length+' pending review';
   details.hidden=false;exportBtn.disabled=false;
 }
 async function load(){
   try {
     const [a,b,c]=await Promise.all([fetch('data/randomizer-ability-data.json',{cache:'no-cache'}),
       fetch('data/pokemon.json',{cache:'no-cache'}),
       fetch('data/ability-descriptions.json',{cache:'no-cache'})]);
     if(!a.ok||!b.ok)throw Error('Required Pokédex data is unavailable.');
     data=await a.json();dex=await b.json();
     abilityDescriptions=c.ok?(await c.json()).abilities:{};
     $('catalogue-count').textContent=dex.length+' PRU Pokémon in catalogue';
     status('Choose your .sav file. It will be analysed on your device.');
   }catch(err){status('Unable to load PRU data: '+err.message,'error');file.disabled=true;}
 }
 file.addEventListener('change',async()=>{
   if(!file.files?.length || !data)return;
   const current=file.files[0];seed=null;rows=[];details.hidden=true;exportBtn.disabled=true;
   if(current.size>MAX_FILE) {status('This file is too large to be a standard GBA battery save.','error');return}
   try{
     const v=parseSav(await current.arrayBuffer());seed=v.trainerId;
     $('trainer-id').textContent=String(seed).padStart(10,'0');
     $('seed-hex').textContent='0x'+seed.toString(16).toUpperCase().padStart(8,'0');
     $('save-file-label').textContent=current.name;
     createRows();render();
     meta.hidden=false;search.disabled=false;
     status('Save validated. Predictions use PRU’s Trainer ID seed and exact randomizer algorithm.','success');
   }catch(err){meta.hidden=true;search.disabled=true;status(err.message,'error');}
 });
 $('ability-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{
   if(event.target===dialog)dialog.close();
 });
 search.addEventListener('input',render);
 toggle.addEventListener('change',()=>{if(seed!==null){createRows();render()}});
 exportBtn.addEventListener('click',()=>{
   if(seed===null)return;
   const lines=[['Dex No.','Pokémon','Slot','Original ability','Predicted ability','Status']];
   for(const r of rows) {
     if(!r.matched){lines.push([r.number,r.name,'','','','Pending ability-slot verification']);continue;}
     for(const a of r.abilities)lines.push([r.number,r.name,a.label,a.original,a.result,'Source-mapped']);
   }
   const csv=lines.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
   const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
   const a=document.createElement('a');a.href=url;a.download='PRU-randomizer-abilities-'+seed+'.csv';
   document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 load();
})();
