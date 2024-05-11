const {default: store} = require("../dist/index.js");

(async () => {
  const x = store({name: 'Alex', age: 9}, {
    initNeeded: true,
    resettable: true,
    update() {return {name: 'Ali'}},
    interval: 60000
  });
  x.$interval = 100;
  x.$on(() => console.log(x));
  x.name = 'Bob';
  await x.$reset();
  await x.$init();
  x.name = 'Jack';
  console.log('FINAL:', x);
})();