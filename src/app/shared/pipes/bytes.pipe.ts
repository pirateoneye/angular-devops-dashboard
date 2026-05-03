import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'bytes', standalone: true })
export class BytesPipe implements PipeTransform {
  transform(value: number): string {
    if (!value) return '0 B';
    const units = ['B','KB','MB','GB','TB'];
    const i = Math.floor(Math.log(value) / Math.log(1024));
    return `${(value / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }
}
