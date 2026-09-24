import { createBalancedRenderer } from './balanced.ts';
import { createWorkbenchRenderer } from './workbench.ts';
import type { BannerRenderer, Variation } from '../scene.ts';

export const renderers: Record<Variation, () => BannerRenderer> = {
  workbench: createWorkbenchRenderer,
  balanced: createBalancedRenderer,
};
