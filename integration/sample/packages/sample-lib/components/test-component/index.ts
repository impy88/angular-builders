import { Component, OnInit } from '@angular/core';
import { sumAndMul } from '../../helpers';

@Component({
  selector: 'lib-sample-lib',
  template: `
    <pre>
      If it looks like a duck
      and quacks like a duck
      but it needs batteries,
      you probably have the wrong abstraction.
    </pre>
  `,
  styles: []
})
export class LibSampleComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    sumAndMul(1, 2);
  }
}
