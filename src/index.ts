async function test() {
  const { Shuttle } = await import('./shuttle');

  const salts = [27414124977, 71264714, 927412940, 45427579829]
  const data0 = { uid: 'a483e74c8d0124f8bb067' }
  console.time('pack')
  const data1 = Shuttle.pack(data0, [...salts, ...salts, ...salts, ...salts])
  console.timeEnd('pack')
  console.time('unpack')
  const data2 = data1.unpack([...salts, ...salts, ...salts, ...salts])
  console.timeEnd('unpack')
  console.log(data1.toBase64())
  console.log(data2)
}

// test()

async function test1() {
  const { GeminiProvider } = await import('./ai/index.js');
  
  const gemini = new GeminiProvider('AIzaSyA_D3B_6BAio2MGZc-asmjh3D_HGXPkLsU');

  async function ask(question: string) {
    const stream = gemini.ask(question);
    await stream.untilDone;
    return stream.read();
  }

  console.log(await ask('Hi'));
}
test1()