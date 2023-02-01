import { mul } from '../mul/index';

export function sumAndMul(a, b) {
  return a + b + mul(a, b);
}
