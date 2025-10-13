import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `
    <div class="app-container">
      <app-canvas-view></app-canvas-view>
    </div>
  `,
  styles: [`
    .app-container {
      width: 100%;
      height: 100vh;
      display: flex;
      background: #f5f7fa;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Metadata Agent - Canvas Edition';
  
  constructor() {
    console.log('✅ Canvas AppComponent constructor called');
  }
  
  ngOnInit() {
    console.log('✅ Canvas AppComponent ngOnInit called');
  }
}
