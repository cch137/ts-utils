import PermissionMap from ".";

function test() {
  const rr = new PermissionMap([
    ["Admin", { admin: true, vip: true, member: true }],
    ["VIP", { vip: true, member: true }],
    ["Member", { member: true }],
  ]);
  const auth = BigInt(0b101);
  const parsed1 = rr.parse(auth);
  const serialized1 = rr.serializeRoles(parsed1.roles);
  const serialized2 = rr.serializeRoles(rr.parse(serialized1).roles);
  const parsed2 = rr.parse(serialized2);
  console.log("input       :", auth);
  console.log("serialized1 :", serialized1);
  console.log("serialized2 :", serialized2);
  console.log("parsed1     :", parsed1);
  console.log("parsed2     :", parsed2);
  console.log(parsed2.roles);
}

test();
