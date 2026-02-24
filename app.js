
(async () => {
  try {
    const res = await fetch('flows/index.json', {cache:'no-cache'});
    console.log('index.json status:', res.status);
    const data = await res.json();
    console.log('flows (array?):', Array.isArray(data), data);
    const ids = Array.isArray(data) ? data.map(x => x.id) : [];
    console.log('ids:', ids);
    const first = ids[0];
    if (first) {
      const f = await fetch('flows/' + first + '.json', {cache:'no-cache'});
      console.log(first + '.json status:', f.status);
      const fd = await f.json();
      console.log('first flow object keys:', Object.keys(fd || {}));
    }
  } catch (e) {
    console.error('Diagnostic error:', e);
  }
})();
