// Address validator checks: valid and mistyped BTC/ETH addresses.
import { isValidBtc, isValidEth } from '../src/addresses';

const cases: [string, boolean, boolean][] = [
  ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', true, false],
  ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb', false, false],
  ['3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', true, false],
  ['bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', true, false],
  ['bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdx', false, false],
  ['bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297', true, false],
  ['0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', false, true],
  ['0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeD', false, false],
  ['0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed', false, true],
];
let ok = true;
for (const [a, btc, eth] of cases) {
  const r = [isValidBtc(a), isValidEth(a)];
  if (r[0] !== btc || r[1] !== eth) { ok = false; console.log('FAIL', a, r); }
}
console.log(ok ? 'address checks passed' : 'ADDRESS CHECKS FAILED');
process.exit(ok ? 0 : 1);
