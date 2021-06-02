import { Component, OnInit } from '@angular/core';

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
  }
}
