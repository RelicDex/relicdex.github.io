(function (global) {
  'use strict';
  // Pokémon type effectiveness: attacker -> defender. Missing entries are neutral.
  const TYPES = ['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];
  const CHART = {
    Normal:{Rock:.5,Ghost:0,Steel:.5},
    Fire:{Fire:.5,Water:.5,Grass:2,Ice:2,Bug:2,Rock:.5,Dragon:.5,Steel:2},
    Water:{Fire:2,Water:.5,Grass:.5,Ground:2,Rock:2,Dragon:.5},
    Electric:{Water:2,Electric:.5,Grass:.5,Ground:0,Flying:2,Dragon:.5},
    Grass:{Fire:.5,Water:2,Grass:.5,Poison:.5,Ground:2,Flying:.5,Bug:.5,Rock:2,Dragon:.5,Steel:.5},
    Ice:{Fire:.5,Water:.5,Grass:2,Ice:.5,Ground:2,Flying:2,Dragon:2,Steel:.5},
    Fighting:{Normal:2,Ice:2,Poison:.5,Flying:.5,Psychic:.5,Bug:.5,Rock:2,Ghost:0,Dark:2,Steel:2,Fairy:.5},
    Poison:{Grass:2,Poison:.5,Ground:.5,Rock:.5,Ghost:.5,Steel:0,Fairy:2},
    Ground:{Fire:2,Electric:2,Grass:.5,Poison:2,Flying:0,Bug:.5,Rock:2,Steel:2},
    Flying:{Electric:.5,Grass:2,Fighting:2,Bug:2,Rock:.5,Steel:.5},
    Psychic:{Fighting:2,Poison:2,Psychic:.5,Dark:0,Steel:.5},
    Bug:{Fire:.5,Grass:2,Fighting:.5,Poison:.5,Flying:.5,Psychic:2,Ghost:.5,Dark:2,Steel:.5,Fairy:.5},
    Rock:{Fire:2,Ice:2,Fighting:.5,Ground:.5,Flying:2,Bug:2,Steel:.5},
    Ghost:{Normal:0,Psychic:2,Ghost:2,Dark:.5},
    Dragon:{Dragon:2,Steel:.5,Fairy:0},
    Dark:{Fighting:.5,Psychic:2,Ghost:2,Dark:.5,Fairy:.5},
    Steel:{Fire:.5,Water:.5,Electric:.5,Ice:2,Rock:2,Steel:.5,Fairy:2},
    Fairy:{Fire:.5,Fighting:2,Poison:.5,Dragon:2,Dark:2,Steel:.5}
  };
  const RELIC_EXAMPLE = ['Noxichu','Faeranium','Feralodon','Solaziken','Skarmadon','Obliveon'];
  function multiplier(attack, defenderTypes) {
    return (defenderTypes || []).reduce(function (product, type) {
      return product * ((CHART[attack] && CHART[attack][type]) === undefined ? 1 : CHART[attack][type]);
    }, 1);
  }
  function defensiveRecord(team, attack) {
    const values = team.map(function (m) { return multiplier(attack, m.types); });
    return {type:attack, weak:values.filter(function (v) {return v>1;}).length,
      resist:values.filter(function (v) {return v>0 && v<1;}).length,
      immune:values.filter(function (v) {return v===0;}).length};
  }
  function role(m) {
    const a = Number(m.stats && m.stats.attack);
    const s = Number(m.stats && m.stats.spAttack);
    if (!Number.isFinite(a) || !Number.isFinite(s)) return 'Unknown';
    if (a >= s + 25) return 'Physical';
    if (s >= a + 25) return 'Special';
    return 'Mixed';
  }
  function strongestStab(team, defendingType) {
    let best = 0;
    team.forEach(function (m) {
      (m.types || []).forEach(function (t) {best = Math.max(best, multiplier(t, [defendingType]));});
    });
    return best;
  }
  function ancientRelic(m) {
    return (m.evolvesFrom || []).some(function (e) {
      return /ancient stone|item_ancient_stone/i.test(String(e.method||'')+' '+String(e.requirement||''));
    }) && !m.evolvesFrom.some(function (e) {return e.source==='Eevee';});
  }
  function eeveelution(m) {
    return (m.evolvesFrom || []).some(function (e) {return e.source==='Eevee';});
  }
  function rank(team, candidate, mode) {
    let score = 0;
    const help = [], risks = [];
    TYPES.forEach(function (attack) {
      const record = defensiveRecord(team, attack);
      const def = multiplier(attack, candidate.types);
      if (record.weak && def < 1) {
        const gain = 2.5 + record.weak*1.7 + (def===0?3.1:0.8) + (record.resist+record.immune===0?1.2:0);
        score += gain;
        help.push({type:attack,gain:gain,immune:def===0});
      }
      if (def>1) {
        score -= 0.9 + (record.weak * 1.5);
        if (record.weak>=2) risks.push(attack);
      }
    });
    help.sort(function(a,b){return b.gain-a.gain || a.type.localeCompare(b.type);});
    const newCoverage = TYPES.filter(function(t) {
      return strongestStab(team,t) <= 1 && strongestStab([candidate],t) > 1;
    });
    score += newCoverage.length*2.3;
    const existingTypes = new Set(team.flatMap(function(m){return m.types||[];}));
    const fresh = (candidate.types||[]).filter(function(t){return !existingTypes.has(t);});
    score += fresh.length*1.5 - ((candidate.types||[]).length-fresh.length)*1;
    const physical = team.filter(function(m){return role(m)==='Physical';}).length;
    const special = team.filter(function(m){return role(m)==='Special';}).length;
    const candidateRole=role(candidate);
    if(candidateRole==='Special' && physical>=special+2)score+=3.5;
    if(candidateRole==='Physical' && special>=physical+2)score+=3.5;
    const speed=Number(candidate.stats && candidate.stats.speed);
    if(Number.isFinite(speed) && speed>=105 && team.filter(function(m){return Number(m.stats && m.stats.speed)>=100;}).length===0)score+=2.5;
    const bst=Number(candidate.bst);
    if(Number.isFinite(bst)&&bst>0)score+=Math.min(bst/280,2.5);
    if(mode==='story' && /legendary|mythical/i.test(candidate.category||''))score-=22;
    const reasons=[];
    help.slice(0,2).forEach(function(x){
      reasons.push((x.immune?'Immune to ':'Resists ')+x.type+' attacks threatening '+team.filter(function(m){return multiplier(x.type,m.types)>1;}).map(function(m){return m.name;}).slice(0,2).join(' and '));
    });
    if(newCoverage.length)reasons.push('New super-effective STAB potential against '+newCoverage.slice(0,3).join(', '));
    if(candidateRole==='Special'&&physical>=special+2)reasons.push('Adds much-needed special attacking power');
    if(candidateRole==='Physical'&&special>=physical+2)reasons.push('Balances your special attackers with physical power');
    if(!reasons.length && fresh.length)reasons.push('Introduces '+fresh.join(' / ')+' STAB without repeating a team type');
    if(!reasons.length)reasons.push('Provides '+candidateRole.toLowerCase()+' offensive options and alternative matchups');
    return {m:candidate, score:score, reasons:reasons.slice(0,3), risk:risks.slice(0,2)};
  }
  global.initPRUTeamAdvisor = function (deps) {
    const mons=deps.mons, art=deps.art, escapeHTML=deps.escapeHTML, E=deps.E, $=deps.$, toast=deps.toast, findmon=deps.findmon;
    const box=$('#team-slots'), area=$('#suggestions'), analysis=$('#team-analysis');
    const picker=$('#pokemon-picker'), resultsBox=$('#pick-results'), search=$('#pick-search');
    const mode=$('#team-mode'), pool=$('#team-pool');
    if(!box || !area || !analysis || !picker || !mode || !pool)return;
    const slots=Array(6).fill(null);
    try {
      const saved=JSON.parse(localStorage.getItem('relicdex-party')||'[]');
      if(Array.isArray(saved))saved.slice(0,6).forEach(function(n,i){slots[i]=findmon(n)||null;});
    } catch(e) {}
    let active=0;
    const removeSlot=E('button','btn btn-small','Remove this Pokémon');
    removeSlot.type='button';
    picker.querySelector('.modal-card').append(removeSlot);
    removeSlot.onclick=function(){slots[active]=null;picker.hidden=true;refresh();};
    function save(){
      try{localStorage.setItem('relicdex-party',JSON.stringify(slots.map(function(m){return m?m.number:null;})));}catch(e){}
    }
    function refresh(){
      box.replaceChildren();
      slots.forEach(function(m,i){
        const b=E('button','team-slot');
        b.type='button';
        b.innerHTML=m?art(m)+'<span><strong>'+escapeHTML(m.name)+'</strong><br><small class="muted">'+escapeHTML((m.types||[]).join(' / '))+' · Edit slot '+(i+1)+'</small></span>':
          '<span class="sprite-fallback" style="font-size:28px;width:58px;height:56px;margin:0">＋</span><span><strong>Slot '+(i+1)+'</strong><br><small class="muted">Choose Pokémon</small></span>';
        b.onclick=function(){active=i;picker.hidden=false;search.value='';renderPicker();search.focus();};
        box.append(b);
      });
      const selected=slots.filter(Boolean);
      $('#team-size').textContent=selected.length+' / 6 selected';
      save();renderAnalysis(selected);suggest(selected);
    }
    function renderPicker(){
      removeSlot.disabled=!slots[active];
      const query=search.value.trim().toLowerCase();
      resultsBox.replaceChildren();
      mons.filter(function(m){return !query||m.name.toLowerCase().includes(query)||String(m.number).includes(query);})
        .slice(0,90).forEach(function(m){
          const b=E('button','pick-result');b.type='button';
          b.innerHTML=art(m)+'<span><strong>'+escapeHTML(m.name)+'</strong><br><small class="muted">#'+m.number+' · '+escapeHTML((m.types||[]).join(' / ')||'Typing unverified')+'</small></span>';
          b.onclick=function(){
            if(slots.some(function(x,i){return i!==active && x && x.number===m.number;})){toast('That Pokémon is already in your team');return;}
            slots[active]=m;picker.hidden=true;refresh();
          };
          resultsBox.append(b);
        });
    }
    function renderAnalysis(selected){
      if(!selected.length){analysis.innerHTML='<p class="tb-empty">Add a Pokémon to reveal shared weaknesses, resistances, potential STAB coverage and team balance.</p>';return;}
      const threats=TYPES.map(function(type){return defensiveRecord(selected,type);})
        .filter(function(r){return r.weak>0;})
        .sort(function(a,b){return (b.weak*2-b.resist-b.immune*2)-(a.weak*2-a.resist-a.immune*2)||b.weak-a.weak||a.type.localeCompare(b.type);});
      const weakRows=threats.slice(0,6).map(function(r){
        return '<div class="tb-weak-row"><strong>'+r.type+'</strong><span>'+r.weak+' weak · '+r.resist+' resist · '+r.immune+' immune</span></div>';
      }).join('')||'<p>No weaknesses recorded in the selected Pokémon typings.</p>';
      const covered=TYPES.filter(function(type){return strongestStab(selected,type)>1;});
      const uncovered=TYPES.filter(function(type){return strongestStab(selected,type)<=1;});
      const roles={Physical:0,Special:0,Mixed:0,Unknown:0};
      selected.forEach(function(m){roles[role(m)]++;});
      analysis.innerHTML='<div class="tb-overview">'+
        '<div class="tb-analysis-card"><h3>Weakness watchlist</h3><p class="tb-help">Attack types with exposed team members. Immunities and resistances can provide safe switches.</p>'+weakRows+'</div>'+
        '<div class="tb-analysis-card"><h3>Offensive & role balance</h3>'+
        '<p><strong>'+covered.length+' / 18 types</strong> potentially hit super effectively by at least one member’s own STAB type.</p>'+
        '<p class="tb-help">No super-effective STAB: '+(uncovered.length?uncovered.join(', '):'None')+'. Actual attacks may provide extra coverage.</p>'+
        '<p class="tb-help">Attack roles: '+roles.Physical+' physical · '+roles.Special+' special · '+roles.Mixed+' mixed'+(roles.Unknown?' · '+roles.Unknown+' unknown':'')+'.</p></div></div>';
    }
    function suggest(selected){
      area.replaceChildren();
      const hint=$('#team-coming-soon');
      if(!selected.length){hint.innerHTML='<b>Build your team.</b> Recommendations update after each pick using defensive type interactions, offensive STAB opportunities and battle stats. They are not move-set guarantees.';return;}
      const selectedSet=new Set(selected.map(function(m){return m.number;}));
      const candidates=mons.filter(function(m){
        if(!m.types || !m.types.length || selectedSet.has(m.number))return false;
        if(pool.value==='ancient'&&!ancientRelic(m))return false;
        if(pool.value==='eevee'&&!eeveelution(m))return false;
        if(pool.value==='custom'&&!(/PRU custom|PRU approved|Heir|Joey/i.test(m.category||'')))return false;
        return true;
      });
      const best=candidates.map(function(m){return rank(selected,m,mode.value);})
        .sort(function(a,b){return b.score-a.score||a.m.number-b.m.number;}).slice(0,6);
      const isFull=selected.length>=6;
      hint.innerHTML='<b>'+ (mode.value==='story'?'Story Mode':'Ultimate Team')+' · synergy analysis.</b> '+
        (mode.value==='story'?'Legendaries are down-ranked. ':'')+
        'Recommendations use the current PRU 450-species types and stats. Move availability, abilities, items, badge unlocks and encounter routes are not verified in this ranking.'+
        (isFull?' Your team is full: tap a slot to change it.':'');
      if(!best.length){area.innerHTML='<p class="tb-empty">No unselected Pokémon match this filter.</p>';return;}
      best.forEach(function(item,i){
        const m=item.m, card=E('div','suggest-card tb-suggestion');
        const typeLine=escapeHTML((m.types||[]).join(' / '));
        const details=item.reasons.map(function(reason){return '<li>'+escapeHTML(reason)+'</li>';}).join('');
        const risk=item.risk.length?'<p class="tb-risk">Watch: shares '+escapeHTML(item.risk.join(' and '))+' weaknesses with multiple team members.</p>':'';
        card.innerHTML='<div class="tb-suggest-top"><div class="tb-suggest-mon">'+art(m)+
          '<span><strong><span class="tb-rank">#'+(i+1)+'</span> '+escapeHTML(m.name)+'</strong><br><small class="muted">'+typeLine+' · '+role(m)+' · BST '+(m.bst||'unverified')+'</small></span></div>'+
          '<button type="button" class="btn btn-small" '+(isFull?'disabled title="Replace a team slot to add another Pokémon"':'')+'>'+(isFull?'Team full':'Add +')+'</button></div>'+
          '<ul class="tb-reasons">'+details+'</ul>'+risk;
        card.querySelector('button').onclick=function(){
          const empty=slots.findIndex(function(x){return !x;});
          if(empty<0){toast('Choose a team slot to replace first');return;}
          slots[empty]=m;refresh();
        };
        area.append(card);
      });
    }
    search.addEventListener('input',renderPicker);
    $('#picker-close').addEventListener('click',function(){picker.hidden=true;});
    picker.addEventListener('click',function(e){if(e.target===picker)picker.hidden=true;});
    $('#clear-team').addEventListener('click',function(){slots.fill(null);refresh();});
    $('#load-relic-team').addEventListener('click',function(){
      const preset=RELIC_EXAMPLE.map(function(name){return mons.find(function(m){return m.name===name;});});
      if(preset.some(function(m){return !m;})){toast('The Relic example team is not available in the current Pokédex');return;}
      preset.forEach(function(m,i){slots[i]=m;});
      pool.value='eevee';mode.value='ultimate';refresh();toast('Loaded the Noxichu Relic example team');
    });
    mode.addEventListener('change',refresh);pool.addEventListener('change',refresh);
    global.addEventListener('keydown',function(e){if(e.key==='Escape')picker.hidden=true;});
    refresh();
  };
})(window);
