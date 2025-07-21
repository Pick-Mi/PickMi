import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'telefonoFormat' })
export class TelephoneFormatPipe implements PipeTransform {
  transform(value: string): string {
    if (!value || value.length !== 8) return value;
    return value.slice(0, 4) + ' - ' + value.slice(4);
  }
}
