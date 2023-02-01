import { Component, OnInit } from '@angular/core';
import { sumAndMul } from 'sample-lib';
@Component({
  selector: 'lib-sample-foo',
  template: `
    <pre>
      Hello World!
    </pre>
  `,
  styles: []
})
export class LibFooComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    sumAndMul(2,3);
    console.log('Test subentry for FESM rewrite test')
  }
}
