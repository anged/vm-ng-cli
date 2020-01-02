import { Component, AfterViewInit, OnDestroy, Input, Renderer2, ViewEncapsulation } from '@angular/core';

import * as baguetteBox from 'baguettebox.js';

@Component({
  selector: 'maps-v-gallery-view',
  template: `
    <!--Fake Gallery DOM -->
    <div id="gallery-ng-projects" class="gallery" *ngIf="gallery">
      <div class="gallery-item" *ngFor="let item of gallery">
        <a href="{{item.image}}">
            <img src="{{item.thumbnail}}" alt="Investiciniai projektai">
        </a>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./gallery-view.component.scss']
})
export class GalleryViewComponent implements AfterViewInit, OnDestroy {
  @Input() gallery: any;

  constructor(private rend: Renderer2) { }

  ngAfterViewInit() {
    baguetteBox.run('.gallery');

    // append Gallery to popup
    setTimeout(() => {
      const gallery = document.getElementById('gallery-ng-projects');
      const loader = document.getElementById('gallery-loader');
      if ((gallery !== null) && (loader !== null)) {
        this.rend.setStyle(loader, 'display', 'none');
        this.rend.appendChild(document.getElementById('gallery-container'), gallery);
      }
    }, 1000);
  }

  ngOnDestroy() {
    baguetteBox.destroy();
  }
}

