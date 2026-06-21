import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { JsonFormatterComponent } from '../tools-dev/json-formatter/json-formatter.component';
import { DecoderComponent } from '../tools-dev/decoder/decoder.component';
import { RegexTesterComponent } from '../tools-dev/regex-tester/regex-tester.component';
import { IdGeneratorComponent } from '../tools-dev/id-generator/id-generator.component';
import { HashGeneratorComponent } from '../tools-dev/hash-generator/hash-generator.component';
import { PasswordGeneratorComponent } from '../tools-dev/password-generator/password-generator.component';
import { TextDiffComponent } from '../tools-dev/text-diff/text-diff.component';
import { ColorConverterComponent } from '../tools-dev/color-converter/color-converter.component';
import { TextTransformsComponent } from '../tools-dev/text-transforms/text-transforms.component';
import { BaseConverterComponent } from '../tools-dev/base-converter/base-converter.component';

export type ToolSlug =
  | 'json-formatter' | 'decoder' | 'regex-tester' | 'id-generator'
  | 'hash-generator' | 'password-generator' | 'text-diff'
  | 'color-converter' | 'text-transforms' | 'base-converter';

interface ToolTab { slug: ToolSlug; label: string; icon: string; }

@Component({
  selector: 'app-toolbox',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule,
    JsonFormatterComponent, DecoderComponent, RegexTesterComponent, IdGeneratorComponent,
    HashGeneratorComponent, PasswordGeneratorComponent, TextDiffComponent,
    ColorConverterComponent, TextTransformsComponent, BaseConverterComponent,
  ],
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.css'],
})
export class ToolboxComponent implements OnInit {
  /** Default tab when used as an embedded component (no query param). */
  @Input() initialTab: ToolSlug = 'json-formatter';

  active: ToolSlug = 'json-formatter';
  tools: ToolTab[] = [
    { slug: 'json-formatter', label: 'JSON', icon: 'data_object' },
    { slug: 'decoder', label: 'Decoder', icon: 'lock_open' },
    { slug: 'regex-tester', label: 'Regex', icon: 'rule' },
    { slug: 'id-generator', label: 'ID/UUID', icon: 'fingerprint' },
    { slug: 'hash-generator', label: 'Hash', icon: 'tag' },
    { slug: 'password-generator', label: 'Password', icon: 'vpn_key' },
    { slug: 'text-diff', label: 'Diff', icon: 'compare_arrows' },
    { slug: 'color-converter', label: 'Color', icon: 'palette' },
    { slug: 'text-transforms', label: 'Transforms', icon: 'transform' },
    { slug: 'base-converter', label: 'Base', icon: 'calculate' },
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.active = this.initialTab;
    this.syncFromQuery();
    this.route.queryParamMap.subscribe(() => this.syncFromQuery());
  }

  private syncFromQuery(): void {
    const t = this.route.snapshot.queryParamMap.get('t') as ToolSlug | null;
    if (t && this.tools.some((x) => x.slug === t)) this.active = t;
  }

  select(slug: ToolSlug): void {
    this.active = slug;
    // Only sync the URL when hosted on the /utilities route; embedded usage stays in-memory.
    if (this.router.url.startsWith('/utilities')) {
      this.router.navigate(['/utilities'], { queryParams: { t: slug }, queryParamsHandling: 'merge' });
    }
  }
}