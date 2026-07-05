import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChildren,
  QueryList,
  AfterContentInit,
} from '@angular/core';
import { MsvTabComponent } from './msv-tab.component';

@Component({
  selector: 'msv-tabs',
  templateUrl: './msv-tabs.component.html',
  styleUrls: ['./msv-tabs.component.css'],
  standalone: false,
})
export class MsvTabsComponent implements AfterContentInit {
  @Input() selectedIndex: number = 0;
  @Output() selectedIndexChange = new EventEmitter<number>();

  @ContentChildren(MsvTabComponent) tabs!: QueryList<MsvTabComponent>;

  ngAfterContentInit(): void {
    // Ensure selectedIndex is within bounds
    if (this.selectedIndex >= this.tabs.length) {
      this.selectedIndex = 0;
    }

    // If initial selected tab is disabled, find first enabled tab
    if (this.tabs.toArray()[this.selectedIndex]?.disabled) {
      this.selectFirstEnabledTab();
    }
  }

  selectTab(index: number): void {
    const tab = this.tabs.toArray()[index];

    // Don't select disabled tabs
    if (tab?.disabled) {
      return;
    }

    this.selectedIndex = index;
    this.selectedIndexChange.emit(index);
  }

  onKeydown(event: KeyboardEvent, currentIndex: number): void {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = this.findPreviousEnabledTab(currentIndex);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = this.findNextEnabledTab(currentIndex);
        break;
      case 'Home':
        event.preventDefault();
        newIndex = this.findFirstEnabledTab();
        break;
      case 'End':
        event.preventDefault();
        newIndex = this.findLastEnabledTab();
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      this.selectTab(newIndex);
      // Focus the newly selected tab button
      setTimeout(() => {
        const buttons = document.querySelectorAll('.tab-button');
        (buttons[newIndex] as HTMLElement)?.focus();
      });
    }
  }

  private findNextEnabledTab(currentIndex: number): number {
    const tabsArray = this.tabs.toArray();
    let index = currentIndex;

    do {
      index = (index + 1) % tabsArray.length;
      if (!tabsArray[index].disabled) {
        return index;
      }
    } while (index !== currentIndex);

    return currentIndex;
  }

  private findPreviousEnabledTab(currentIndex: number): number {
    const tabsArray = this.tabs.toArray();
    let index = currentIndex;

    do {
      index = index - 1;
      if (index < 0) {
        index = tabsArray.length - 1;
      }
      if (!tabsArray[index].disabled) {
        return index;
      }
    } while (index !== currentIndex);

    return currentIndex;
  }

  private findFirstEnabledTab(): number {
    const tabsArray = this.tabs.toArray();
    for (let i = 0; i < tabsArray.length; i++) {
      if (!tabsArray[i].disabled) {
        return i;
      }
    }
    return 0;
  }

  private findLastEnabledTab(): number {
    const tabsArray = this.tabs.toArray();
    for (let i = tabsArray.length - 1; i >= 0; i--) {
      if (!tabsArray[i].disabled) {
        return i;
      }
    }
    return 0;
  }

  private selectFirstEnabledTab(): void {
    const index = this.findFirstEnabledTab();
    this.selectTab(index);
  }

  getTabButtonClasses(index: number): string[] {
    const classes = ['tab-button'];
    const tab = this.tabs.toArray()[index];

    if (index === this.selectedIndex) {
      classes.push('tab-button-active');
    }

    if (tab?.disabled) {
      classes.push('tab-button-disabled');
    }

    return classes;
  }
}
