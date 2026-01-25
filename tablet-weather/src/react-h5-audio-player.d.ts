// types/react-h5-audio-player.d.ts
declare module 'react-h5-audio-player' {
  import { Component } from 'react';
  
  interface RHAPProps {
    src?: string;
    autoPlayAfterSrcChange?: boolean;
    showJumpControls?: boolean;
    customAdditionalControls?: any[];
    layout?: 'horizontal' | 'horizontal-reverse' | 'vertical' | 'vertical-reverse';
    hasDefaultKeybindings?: boolean;
    onPlay?: () => void;
    onPause?: () => void;
    onError?: (e: any) => void;
  }
  
  export interface RHAP_UI {}
  
  export default class AudioPlayer extends Component<RHAPProps> {
    audio: HTMLAudioElement;
  }
}
