# MSV Tools — Claude Code project memory  

See `.omp/AGENTS.md` for canonical context — this file is a shorter mirror for Claude Code compatibility.

## Stack  
Angular 17 standalone, signals, Material 17, TypeScript ~5.4, Jasmine/Karma.  

## Architecture  
- Routes: `app.routes.ts` (compact) + `app-routing.module.ts` (11-line NgModule wrapper)  
- MSV Forms: 35 standalone components under `shared/components/msv-forms/` — **no module**  
- CSS: split into `src/styles/tokens.css`, `bootstrap-dark.css`, `material-dark.css`, `print.css`  
- Services: all `providedIn: 'root'` under `shared/service/`  

## Design  
- All styling via `--msv-*` CSS custom properties (light/dark)  
- Font: `"Open Sans", sans-serif`  
- Tool page utility classes: `.tool-card`, `.tool-title`, `.btn-primary`, `.btn-secondary`, etc.  

## Patterns  
- `inject()` always, never constructor DI  
- `signal()` + `computed()` for reactive state  
- `@if/@for/@switch` only — no legacy structural directives  
- Standalone `imports: [...]` explicit per component  
- MSV component consumer example:  
  ```ts  
  import { MsvSelectComponent } from '...msv-forms/msv-select/msv-select.component';  
  ```  
- Tests: `TestBed.configureTestingModule({ imports: [ComponentUnderTest, ...] })`, never `declarations` for standalone  
- Language: **Indonesian (id)** for UI text and comments  
