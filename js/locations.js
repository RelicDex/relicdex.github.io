'use strict';
// Wild encounters come directly from the PRU source-matched locations catalogue.
// This is a client-side browser: no location or search information is uploaded.
(() => {
  const $ = id => document.getElementById(id);
  const search = $('location-search'), areaSelect = $('location-area');
  const methodSelect = $('location-method'), timeSelect = $('location-time');
  const grid = $('location-results'), status = $('location-status'), empty = $('location-empty');
  let locations = [], species = new Map();
  const compact = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const areaTitle = value => String(value).replace(/^Route\s*(\d+)/i, 'Route $1');
  const isRoute = value => /^Route\s*\d+/i.test(value);
  function node(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function monster(constant) {
    return species.get(constant) || {
      name:constant.replace(/^SPECIES_/,'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g, m=>m.toUpperCase()),
      number:null, sprite:null, types:[]
    };
  }
  function thumbnail(mon) {
    const holder = node('span', 'location-sprite');
    const src = mon.sprite?.front;
    if (src && !/^(https?:|data:|javascript:)/i.test(src)) {
      const pic = node('img'); pic.src = src; pic.alt = '';
      pic.loading = 'lazy';pic.width = 44;pic.height = 44;
      pic.addEventListener('error', () => {holder.replaceChildren(node('span', 'location-sprite-fallback', '✦'));});
      holder.append(pic);
    } else holder.append(node('span', 'location-sprite-fallback', '✦'));
    return holder;
  }
  function encounterRow(encounter) {
    const mon = monster(encounter.speciesConstant);
    const row = node('div', 'location-encounter');
    row.append(thumbnail(mon));
    const body = node('div', 'location-encounter-name');
    body.append(node('strong', '', mon.name));
    const meta = node('small', '', [
      (encounter.minLevel === encounter.maxLevel ? 'Lv ' + encounter.minLevel : 'Lv ' + encounter.minLevel + '–' + encounter.maxLevel),
      encounter.methods.join(', '),
      encounter.times.includes('Any') ? 'Any time' : encounter.times.join(' / ')
    ].join(' · '));
    body.append(meta); row.append(body);
    if (mon.types?.length) row.append(node('span', 'location-type', mon.types.join(' / ')));
    return row;
  }
  function locationCard(item, matches) {
    const card = node('details', 'location-card');
    const summary = node('summary', 'location-card-summary');
    const head = node('div', 'location-card-heading');
    head.append(node('strong', '', areaTitle(item.name)));
    const unique = [...new Set(matches.map(x => x.speciesConstant))];
    head.append(node('small', '', unique.length + ' Pokémon · ' + matches.length + ' encounter entries'));
    summary.append(head);
    const preview = node('div', 'location-preview');
    for (const key of unique.slice(0,4)) {
      const mon = monster(key), chip = node('span', 'location-preview-mon');
      chip.append(thumbnail(mon));
      chip.append(node('span', '', mon.name));
      preview.append(chip);
    }
    if (unique.length > 4) preview.append(node('span', 'location-preview-rest', '+' + (unique.length - 4) + ' more'));
    summary.append(preview);
    card.append(summary);
    const body = node('div', 'location-encounters');
    card.append(body);
    card.addEventListener('toggle', () => {
      if (card.open && !body.childNodes.length) matches.forEach(e => body.append(encounterRow(e)));
    });
    return card;
  }
  function render() {
    if (!locations.length) return;
    const query = compact(search.value), mode = areaSelect.value;
    const method = methodSelect.value, time = timeSelect.value;
    grid.replaceChildren();
    let locationsShown = 0, encountersShown = 0, pokemonShown = new Set();
    for (const loc of locations) {
      if (mode === 'route' && !isRoute(loc.name)) continue;
      if (mode === 'other' && isRoute(loc.name)) continue;
      const areaMatches = query && compact(loc.name).includes(query);
      const matches = loc.encounters.filter(e => {
        if (method !== 'all' && !e.methods.includes(method)) return false;
        if (time !== 'all' && !(e.times.includes(time) || e.times.includes('Any'))) return false;
        return !query || areaMatches || compact(monster(e.speciesConstant).name).includes(query);
      });
      if (!matches.length) continue;
      grid.append(locationCard(loc, matches));
      locationsShown++;
      encountersShown += matches.length;
      matches.forEach(e => pokemonShown.add(e.speciesConstant));
    }
    status.textContent = locationsShown + ' areas · ' + pokemonShown.size + ' Pokémon · ' + encountersShown + ' encounter entries';
    empty.hidden = locationsShown > 0;
  }
  async function load() {
    try {
      const [a,b] = await Promise.all([
        fetch('data/locations.json',{cache:'no-cache'}),
        fetch('data/pokemon.json',{cache:'no-cache'})
      ]);
      if (!a.ok || !b.ok) throw Error('Unable to download PRU wild encounter data.');
      const [areas,dex] = await Promise.all([a.json(),b.json()]);
      if (!Array.isArray(areas) || !Array.isArray(dex)) throw Error('Unexpected location catalogue format.');
      locations = areas;
      species = new Map(dex.map(m => [m.speciesConstant,m]));
      const methods = [...new Set(areas.flatMap(x => x.encounters.flatMap(e => e.methods)))].sort();
      methods.forEach(method => {
        const option = node('option', '', method); option.value = method; methodSelect.append(option);
      });
      const urlQuery = new URLSearchParams(window.location.search).get('q');
      if (urlQuery) search.value = urlQuery;
      render();
    } catch (error) {
      grid.replaceChildren();
      status.textContent = 'Unable to load locations: ' + error.message;
      empty.hidden = false;
    }
  }
  [search,areaSelect,methodSelect,timeSelect].forEach(el => el.addEventListener('input',render));
  $('location-clear').addEventListener('click', () => {
    search.value=''; areaSelect.value='all'; methodSelect.value='all'; timeSelect.value='all';
    history.replaceState(null,'',location.pathname); render(); search.focus();
  });
  load();
})();