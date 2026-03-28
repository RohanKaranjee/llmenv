import { applyGradient } from '../gradient.js';
import { getColor, applyColor } from '../core/theme.js';

const ASCII_ART = `
  _ _                                   
 | | |                                  
 | | |____   ___   ____  ____ _   _ 
 | | |    \\ / _ \\ /  _ \\|  _ \\ | | |
 | | | | | |  __/| | | || | | \\ V / 
 |_|_|_|_|_|\\___||_| |_||_| |_|\\_/  
`;

export function renderBanner(version: string = '2.0.0'): string {
  // Brand colors: Cyan to Purple
  const primaryHex = '#00D9FF';
  const secondaryHex = '#7C3AED';

  const coloredLogo = applyGradient(ASCII_ART, primaryHex, secondaryHex);
  
  const tagline = applyColor('.env is for secrets. ', getColor('textMuted')) +
                  applyColor('.llmenv is for you.', getColor('primary'));
                  
  const versionBadge = applyColor(` v${version} `, getColor('highlight'));

  return `${coloredLogo}\n  ${tagline}  ${versionBadge}\n`;
}
