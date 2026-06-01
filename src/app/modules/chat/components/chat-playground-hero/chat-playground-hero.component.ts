import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-chat-playground-hero',
  standalone: false,
  templateUrl: './chat-playground-hero.component.html',
  styleUrls: ['./chat-playground-hero.component.scss']
})
export class ChatPlaygroundHeroComponent {
  @Output() reset = new EventEmitter<void>();
}
