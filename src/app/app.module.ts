import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';

// Components
import { AppComponent } from './app.component';
import { CanvasViewComponent } from './components/canvas-view/canvas-view.component';

// Services
import { SchemaLoaderService } from './services/schema-loader.service';
import { CanvasService } from './services/canvas.service';
import { FieldExtractionWorkerPoolService } from './services/field-extraction-worker-pool.service';
import { FieldNormalizerService } from './services/field-normalizer.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TextFieldModule,
    CanvasViewComponent // Standalone component
  ],
  providers: [
    SchemaLoaderService,
    CanvasService,
    FieldExtractionWorkerPoolService,
    FieldNormalizerService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
