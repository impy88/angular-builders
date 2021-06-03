import { Component, OnInit } from '@angular/core';

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
    console.log('Test subentry for FESM rewrite test')
  }
}
