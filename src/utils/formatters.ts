import chalk from 'chalk';
import type { ProjectEntry, Pin, HistoryEntry } from '../types/index.js';

/**
 * Format a list of projects as a readable table.
 * Displays project name, path, and last active timestamp.
 * Uses chalk for colored output.
 * 
 * @param projects - Array of project entries to format
 * @returns Formatted string with table layout
 */
export function formatProjectList(projects: ProjectEntry[]): string {
  if (projects.length === 0) {
    return chalk.yellow('No projects registered yet');
  }

  const lines: string[] = [];
  
  // Header
  lines.push(chalk.cyan('\n📁 Registered Projects\n'));
  
  // Table header
  const nameHeader = 'Name';
  const pathHeader = 'Path';
  const activeHeader = 'Last Active';
  
  // Calculate column widths
  const nameWidth = Math.max(
    nameHeader.length,
    ...projects.map(p => p.name.length)
  );
  const pathWidth = Math.max(
    pathHeader.length,
    ...projects.map(p => p.path.length)
  );
  
  // Format header row
  lines.push(
    chalk.bold(
      nameHeader.padEnd(nameWidth + 2) +
      pathHeader.padEnd(pathWidth + 2) +
      activeHeader
    )
  );
  
  // Separator line
  lines.push(
    chalk.gray(
      '─'.repeat(nameWidth + 2) +
      '─'.repeat(pathWidth + 2) +
      '─'.repeat(activeHeader.length)
    )
  );
  
  // Format each project row
  for (const project of projects) {
    const formattedTime = formatRelativeTime(project.lastActive);
    
    lines.push(
      chalk.white(project.name.padEnd(nameWidth + 2)) +
      chalk.gray(project.path.padEnd(pathWidth + 2)) +
      chalk.green(formattedTime)
    );
  }
  
  return lines.join('\n');
}

/**
 * Format a list of pins for display.
 * Shows pin ID (first 8 chars), fact text, and creation timestamp.
 * Uses chalk for colored output.
 * 
 * @param pins - Array of pins to format
 * @returns Formatted string with numbered list
 */
export function formatPinList(pins: Pin[]): string {
  if (pins.length === 0) {
    return chalk.yellow('No pins created yet');
  }

  const lines: string[] = [];
  
  // Header
  lines.push(chalk.cyan('\n📌 Pinned Facts\n'));
  
  // Format each pin
  pins.forEach((pin, index) => {
    const number = chalk.bold(`${index + 1}.`);
    const shortId = chalk.gray(`[${pin.id.substring(0, 8)}]`);
    const fact = chalk.white(pin.fact);
    const timestamp = chalk.gray(`   Created: ${formatDateTime(pin.createdAt)}`);
    
    lines.push(`${number} ${shortId} ${fact}`);
    lines.push(timestamp);
    
    // Add spacing between pins (except after last one)
    if (index < pins.length - 1) {
      lines.push('');
    }
  });
  
  return lines.join('\n');
}

/**
 * Format decision history for display.
 * Shows timestamp, prompt, response summary, and provider.
 * Uses chalk for colored output.
 * 
 * @param history - Array of history entries to format
 * @returns Formatted string with history entries
 */
export function formatHistory(history: HistoryEntry[]): string {
  if (history.length === 0) {
    return chalk.yellow('No decision history for this project');
  }

  const lines: string[] = [];
  
  // Header
  lines.push(chalk.cyan('\n📜 Decision History\n'));
  
  // Format each history entry
  history.forEach((entry, index) => {
    const timestamp = chalk.gray(formatDateTime(entry.timestamp));
    const provider = chalk.cyan(`[${entry.provider}]`);
    
    lines.push(`${timestamp} ${provider}`);
    lines.push('');
    
    // Prompt
    lines.push(chalk.bold('Prompt:'));
    lines.push(chalk.white(`  ${entry.prompt}`));
    lines.push('');
    
    // Response (truncated if too long)
    lines.push(chalk.bold('Response:'));
    const responseSummary = truncateText(entry.response, 200);
    lines.push(chalk.gray(`  ${responseSummary}`));
    
    // Add separator between entries (except after last one)
    if (index < history.length - 1) {
      lines.push('');
      lines.push(chalk.gray('─'.repeat(60)));
      lines.push('');
    }
  });
  
  return lines.join('\n');
}

/**
 * Format a relative time string (e.g., "2 hours ago", "3 days ago").
 * 
 * @param isoTimestamp - ISO 8601 timestamp string
 * @returns Human-readable relative time string
 */
function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now();
  const then = new Date(isoTimestamp).getTime();
  const diffMs = now - then;
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) {
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
  if (months > 0) {
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  if (weeks > 0) {
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'just now';
}

/**
 * Format a date-time string in a readable format.
 * 
 * @param isoTimestamp - ISO 8601 timestamp string
 * @returns Formatted date-time string (e.g., "2024-03-15 14:30:00")
 */
function formatDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Truncate text to a maximum length, adding ellipsis if truncated.
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
}
