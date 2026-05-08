import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessagesEditorComponent } from './components/chat-messages-editor/chat-messages-editor.component';
import { ChatPlaygroundHeroComponent } from './components/chat-playground-hero/chat-playground-hero.component';
import { ChatPlaygroundComponent } from './components/chat-playground/chat-playground.component';
import { ChatRequestSettingsComponent } from './components/chat-request-settings/chat-request-settings.component';
import { ChatResponsePreviewComponent } from './components/chat-response-preview/chat-response-preview.component';
import { ChatPageComponent } from './pages/chat-page/chat-page.component';
import { ChatRoutingModule } from './chat-routing.module';

@NgModule({
  declarations: [
    ChatMessagesEditorComponent,
    ChatPlaygroundHeroComponent,
    ChatPlaygroundComponent,
    ChatRequestSettingsComponent,
    ChatResponsePreviewComponent,
    ChatPageComponent,
  ],
  imports: [CommonModule, FormsModule, ChatRoutingModule],
})
export class ChatModule {}
