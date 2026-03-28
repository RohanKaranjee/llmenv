import chalk from 'chalk';
import type { ProjectEntry, Pin, HistoryEntry, MergedContext } from '../types/index.js';
import { renderTable } from '../ui/components/table.js';
import { renderList } from '../ui/components/list.js';
import { renderTimeline } from '../ui/components/timeline.js';
import { renderBox } from '../ui/components/box.js';
import { renderBadge } from '../ui/components/badge.js';
import { renderEmptyState } from '../ui/components/empty-state.js';
import { renderHeader } from '../ui/components/header.js';
import { getIcon } from '../ui/icons.js';
import { applyColor, getColor } from '../ui/core/theme.js';

/**
 * Format a list of projects as a readable table.
 * Displays project name, path, and last active timestamp.
 * Uses new UI components for enhanced display.
 * 
 * @param projects - Array of project entries to format
 * @returns Formatted string with table layout
 */
export function formatProjectList(projects: ProjectEntry[]): string {
  if (projects.length === 0) {
    return renderEmptyState({
      icon: getIcon('project') as string,
      message: 'No projects registered yet',
      suggestion: 'Run "llmenv init" in a project directory to get started',
    });
  }

  const header = renderHeader({
    text: 'Registered Projects',
    icon: getIcon('project') as string,
    level: 1,
  });

  const tableData = projects.map((project) => ({
    name: project.name,
    path: project.path,
    lastActive: formatRelativeTime(project.lastActive),
  }));

  const table = renderTable({
    columns: [
      { header: 'Name', key: 'name', flex: 1, align: 'left' },
      { header: 'Path', key: 'path', flex: 2, align: 'left' },
      { header: 'Last Active', key: 'lastActive', flex: 1, align: 'right' },
    ],
    data: tableData,
    borderStyle: 'single',
  });

  return `${header}\n\n${table}`;
}

/**
 * Format a list of pins for display.
 * Shows pin ID (first 8 chars), fact text, and creation timestamp.
 * Uses new UI components for enhanced display.
 * 
 * @param pins - Array of pins to format
 * @returns Formatted string with numbered list
 */
export function formatPinList(pins: Pin[]): string {
  if (pins.length === 0) {
    return renderEmptyState({
      icon: getIcon('pin') as string,
      message: 'No pins created yet',
      suggestion: 'Run "llmenv pin <fact>" to add a persistent fact',
    });
  }

  const header = renderHeader({
    text: 'Pinned Facts',
    icon: getIcon('pin') as string,
    level: 1,
  });

  const listItems = pins.map((pin) => ({
    icon: getIcon('pin') as string,
    text: `[${pin.id.substring(0, 8)}] ${pin.fact}`,
    subtext: `Created: ${formatDateTime(pin.createdAt)}`,
    color: getColor('text'),
  }));

  const list = renderList({
    items: listItems,
    numbered: true,
    spacing: 1,
  });

  return `${header}\n\n${list}`;
}

/**
 * Format decision history for display.
 * Shows timestamp, prompt, response summary, and provider.
 * Uses new UI components for enhanced display.
 * 
 * @param history - Array of history entries to format
 * @returns Formatted string with history entries
 */
export function formatHistory(history: HistoryEntry[]): string {
  if (history.length === 0) {
    return renderEmptyState({
      icon: getIcon('history') as string,
      message: 'No decision history for this project',
      suggestion: 'Run "llmenv inject <prompt>" to make AI-assisted decisions',
    });
  }

  const header = renderHeader({
    text: 'Decision History',
    icon: getIcon('history') as string,
    level: 1,
  });

  const timelineEntries = history.map((entry) => ({
    timestamp: formatDateTime(entry.timestamp),
    title: `[${entry.provider}]`,
    content: `Prompt: ${entry.prompt}\n\nResponse: ${truncateText(entry.response, 200)}`,
    icon: getIcon('ai') as string,
    color: getColor('primary'),
  }));

  const timeline = renderTimeline({
    entries: timelineEntries,
    showConnectors: true,
  });

  return `${header}\n\n${timeline}`;
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

/**
 * Format status display with context information.
 * Shows global identity, profile, project, and pins in organized boxes.
 * 
 * @param context - MergedContext to display
 * @returns Formatted string with status display
 */
export function formatStatus(context: MergedContext): string {
  const sections: string[] = [];

  // Global Identity section
  const identityLines: string[] = [];
  identityLines.push(applyColor('Name: ', getColor('textBright')) + context.global.name);
  identityLines.push(applyColor('Role: ', getColor('textBright')) + context.global.role);
  identityLines.push(applyColor('Communication: ', getColor('textBright')) + context.global.communication);

  const identityBox = renderBox(identityLines.join('\n'), {
    title: `${getIcon('profile')} Global Identity`,
    borderStyle: 'rounded',
    padding: 1,
    borderColor: getColor('info')
  });
  sections.push(identityBox);

  // Active Profile section
  const profileDetails: string[] = [];
  profileDetails.push(renderBadge({
    text: context.profile.name,
    variant: 'success',
    icon: getIcon('success') as string,
  }));
  profileDetails.push('');
  profileDetails.push(applyColor('Focus: ', getColor('textBright')) + context.profile.focus);
  profileDetails.push(applyColor('Priorities: ', getColor('textBright')) + context.profile.priorities.join(', '));

  const profileBox = renderBox(profileDetails.join('\n'), {
    title: `${getIcon('settings')} Active Profile`,
    borderStyle: 'rounded',
    padding: 1,
    borderColor: getColor('success')
  });
  sections.push(profileBox);

  // Project section
  if (context.project) {
    const projectLines: string[] = [];
    projectLines.push(applyColor('Name: ', getColor('textBright')) + context.project.project);
    if (context.project.stack && context.project.stack.length > 0) {
      projectLines.push(applyColor('Stack: ', getColor('textBright')) + context.project.stack.join(', '));
    }
    if (context.project.context) {
      projectLines.push(applyColor('Context: ', getColor('textBright')) + context.project.context);
    }

    const projectBox = renderBox(projectLines.join('\n'), {
      title: `${getIcon('project')} Current Project`,
      borderStyle: 'rounded',
      padding: 1,
      borderColor: getColor('primary')
    });
    sections.push(projectBox);
  } else {
    const noProjectBox = renderBox(
      applyColor('No project detected in current directory', getColor('warning')) +
        '\n\n' +
        applyColor('Run "llmenv init" to initialize a project', getColor('info')),
      {
        title: `${getIcon('warning')} No Project`,
        borderStyle: 'rounded',
        padding: 1,
        borderColor: getColor('warning')
      }
    );
    sections.push(noProjectBox);
  }

  // Pins section
  if (context.pins && context.pins.length > 0) {
    const pinCount = renderBadge({
      text: `${context.pins.length} ${context.pins.length === 1 ? 'pin' : 'pins'}`,
      variant: 'info',
      icon: getIcon('pin') as string,
    });

    const pinsBox = renderBox(pinCount, {
      title: `${getIcon('pin')} Pinned Facts`,
      borderStyle: 'rounded',
      padding: 1,
      borderColor: getColor('secondary')
    });
    sections.push(pinsBox);
  }

  return sections.join('\n\n');
}

/**
 * Format error message with helpful context and suggestions.
 * 
 * @param error - Error object or message
 * @param suggestion - Optional suggestion for fixing the error
 * @returns Formatted error display
 */
export function formatError(error: Error | string, suggestion?: string): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;

  const lines: string[] = [];
  lines.push(applyColor(errorMessage, getColor('error')));

  if (suggestion) {
    lines.push('');
    lines.push(applyColor('💡 Suggestion:', getColor('info')));
    lines.push(applyColor(suggestion, getColor('text')));
  }

  if (errorStack) {
    lines.push('');
    lines.push(applyColor('Technical Details:', getColor('textMuted')));
    lines.push(applyColor(errorStack, getColor('textMuted')));
  }

  return renderBox(lines.join('\n'), {
    title: `${getIcon('error')} Error`,
    borderStyle: 'bold',
    borderColor: getColor('error'),
    padding: 1,
  });
}

/**
 * Format success message with confirmation.
 * 
 * @param message - Success message
 * @param details - Optional additional details
 * @returns Formatted success display
 */
export function formatSuccess(message: string, details?: string): string {
  const badge = renderBadge({
    text: message,
    variant: 'success',
    icon: getIcon('success') as string,
  });

  if (details) {
    return `${badge}\n${applyColor(details, getColor('textMuted'))}`;
  }

  return badge;
}
