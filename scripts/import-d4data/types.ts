export type ProbeTarget = 'fireball' | 'harlequin' | 'aspect';

export interface ProbeMatch {
  target: ProbeTarget;
  file: string;
  path: string;
  preview: string;
  sourceId?: string | number;
  sno?: string | number;
  gbid?: string | number;
}

export interface ProbeOutput {
  source: 'DiabloTools/d4data';
  gameBuild: string | null;
  scannedJsonFiles: number;
  generatedAt: string;
  matches: ProbeMatch[];
}
