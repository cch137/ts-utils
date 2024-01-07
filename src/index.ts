async function test() {
  const { Shuttle } = await import('./shuttle');

  const salts = [27414124977, 71264714, 927412940, 45427579829]
  const data0 = { uid: '48374801248067' }
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
