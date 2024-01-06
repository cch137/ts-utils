async function test() {
  const { BSON } = await import('./bson');

  const seeds = [27414124, 71264714, 927412940, 4542757]
  const data0 = { uid: '48374801248067' }
  const data1 = BSON.pack(data0, [...seeds, 888])
  const data2 = data1.unpack([...seeds, 888])

  console.log(data1.base64)
  console.log(data2)
}

test()
