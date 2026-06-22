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
import { HttpStatusComponent } from '../tools-dev/http-status/http-status.component';
import { UnicodeEscapeComponent } from '../tools-dev/unicode-escape/unicode-escape.component';
import { MarkdownComponent } from '../tools-dev/markdown/markdown.component';
import { CronExplainerComponent } from '../tools-dev/cron-explainer/cron-explainer.component';
import { ImageBase64Component } from '../tools-dev/image-base64/image-base64.component';
import { LoremIpsumComponent } from '../tools-dev/lorem-ipsum/lorem-ipsum.component';
import { TimestampConverterComponent } from '../tools-dev/timestamp-converter/timestamp-converter.component';
import { CsvJsonComponent } from '../tools-dev/csv-json/csv-json.component';
import { SqlFormatterComponent } from '../tools-dev/sql-formatter/sql-formatter.component';
import { TextSortComponent } from '../tools-dev/text-sort/text-sort.component';
import { CharCounterComponent } from '../tools-dev/char-counter/char-counter.component';
import { SlugGeneratorComponent } from '../tools-dev/slug-generator/slug-generator.component';
import { UrlParserComponent } from '../tools-dev/url-parser/url-parser.component';
import { ChmodCalcComponent } from '../tools-dev/chmod-calc/chmod-calc.component';
import { LineToolsComponent } from '../tools-dev/line-tools/line-tools.component';
import { RandomPickerComponent } from '../tools-dev/random-picker/random-picker.component';
import { WordFrequencyComponent } from '../tools-dev/word-frequency/word-frequency.component';

export type ToolSlug =
  | 'json-formatter' | 'decoder' | 'regex-tester' | 'id-generator'
  | 'hash-generator' | 'password-generator' | 'text-diff'
  | 'color-converter' | 'text-transforms' | 'base-converter'
  | 'http-status' | 'unicode-escape' | 'markdown' | 'cron-explainer' | 'image-base64' | 'lorem-ipsum'
  | 'timestamp-converter' | 'csv-json' | 'sql-formatter' | 'text-sort' | 'char-counter' | 'slug-generator'
  | 'url-parser' | 'chmod-calc' | 'line-tools' | 'random-picker' | 'word-frequency';

interface ToolTab { slug: ToolSlug; label: string; icon: string; }

@Component({
  selector: 'app-toolbox',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule,
    JsonFormatterComponent, DecoderComponent, RegexTesterComponent, IdGeneratorComponent,
    HashGeneratorComponent, PasswordGeneratorComponent, TextDiffComponent,
    ColorConverterComponent, TextTransformsComponent, BaseConverterComponent,
    HttpStatusComponent, UnicodeEscapeComponent, MarkdownComponent,
    CronExplainerComponent, ImageBase64Component, LoremIpsumComponent,
    TimestampConverterComponent, CsvJsonComponent, SqlFormatterComponent,
    TextSortComponent, CharCounterComponent, SlugGeneratorComponent,
    UrlParserComponent, ChmodCalcComponent, LineToolsComponent,
    RandomPickerComponent, WordFrequencyComponent,
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
    { slug: 'http-status', label: 'HTTP', icon: 'api' },
    { slug: 'unicode-escape', label: 'Unicode', icon: 'translate' },
    { slug: 'markdown', label: 'Markdown', icon: 'description' },
    { slug: 'cron-explainer', label: 'Cron', icon: 'schedule' },
    { slug: 'image-base64', label: 'Image/B64', icon: 'image' },
    { slug: 'lorem-ipsum', label: 'Lorem', icon: 'notes' },
    { slug: 'timestamp-converter', label: 'Timestamp', icon: 'access_time' },
    { slug: 'csv-json', label: 'CSV/JSON', icon: 'table_chart' },
    { slug: 'sql-formatter', label: 'SQL', icon: 'storage' },
    { slug: 'text-sort', label: 'Sort/Dedupe', icon: 'sort_by_alpha' },
    { slug: 'char-counter', label: 'Counter', icon: 'text_fields' },
    { slug: 'slug-generator', label: 'Slug', icon: 'link' },
    { slug: 'url-parser', label: 'URL', icon: 'link' },
    { slug: 'chmod-calc', label: 'Chmod', icon: 'lock' },
    { slug: 'line-tools', label: 'Line Tools', icon: 'format_list_numbered' },
    { slug: 'random-picker', label: 'Random', icon: 'casino' },
    { slug: 'word-frequency', label: 'Word Freq', icon: 'bar_chart' },
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
