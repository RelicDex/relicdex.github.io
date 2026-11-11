'use strict';
(() => {
 const normalise = value => String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 let cached;
 function getAbilities(){
   if(!cached)cached=fetch('data/ability-descriptions.json').then(r=>{if(!r.ok)throw Error('Unavailable');return r.json();}).then(j=>j.abilities||{});
   return cached;
 }
 const style=document.createElement('style');
 style.textContent='.ability-info{cursor:pointer;display:inline-block;border:1px solid #667e9b;border-radius:18px;background:#202b42;color:#e1eafe;padding:5px 10px;margin:3px;font:inherit;font-size:.92em}.ability-info:hover,.ability-info:focus-visible,.ability-info[aria-expanded="true"]{border-color:#dbba72;color:#ffe0a0}.ability-description{margin:10px 0 0;font-size:.95em;line-height:1.6;padding:10px 12px;border-left:3px solid #be9b53;color:#dce8f8;background:#18233b;border-radius:5px}';
 document.head.append(style);
 document.addEventListener('click',async event=>{
   const button=event.target.closest('button.ability-info');
   if(!button)return;
   const parent=button.closest('.fact,.detail-section')||button.parentElement;
   const name=button.dataset.ability||button.textContent.trim();
   let panel=parent.querySelector('.ability-description');
   if(panel&&!panel.hidden&&panel.dataset.ability===name){panel.hidden=true;button.setAttribute('aria-expanded','false');return;}
   if(!panel){panel=document.createElement('p');panel.className='ability-description';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');parent.append(panel);}
   parent.querySelectorAll('.ability-info').forEach(b=>b.setAttribute('aria-expanded','false'));
   button.setAttribute('aria-expanded','true');panel.dataset.ability=name;panel.hidden=false;panel.textContent=name+': Loading...';
   try{const data=await getAbilities();if(panel.dataset.ability!==name)return;const info=data[normalise(name)];panel.textContent=name+': '+(info?.effect||'No verified effect description is available for this PRU ability.');}
   catch(err){panel.textContent=name+': Ability descriptions could not be loaded.';}
 });
})();
