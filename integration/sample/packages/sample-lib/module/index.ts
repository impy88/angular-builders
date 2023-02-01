import {
  NgModule,
} from '@angular/core';

import { LibSampleComponent } from '../components/index';
import { sumAndMul } from '../helpers';

@NgModule({
  imports: [],
  declarations: [LibSampleComponent],
  exports: [LibSampleComponent]
})
export class LibSampleModule {
  test() {
    sumAndMul(2, 3)
  }
}
