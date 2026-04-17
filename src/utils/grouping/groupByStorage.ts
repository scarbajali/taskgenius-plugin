/**
 * localStorage utilities for Group By configuration
 */

import { GroupByDimension } from "@/types/groupBy";

const STORAGE_KEY_PREFIX = "task-genius-groupby";
const STORAGE_KEY_EXPANDED_PREFIX = "task-genius-group-expanded";

/**
 * Get the Group By dimension for a specific view
 */
export function getGroupByConfig(viewId: string): GroupByDimension {
	const key = `${STORAGE_KEY_PREFIX}-${viewId}`;
	const stored = localStorage.getItem(key);

	if (!stored) {
		return "none";
	}

	// Validate that the stored value is a valid GroupByDimension
	const validDimensions: GroupByDimension[] = [
		"none",
		"filePath",
		"dueDate",
		"priority",
		"project",
		"tags",
		"status",
	];

	if (validDimensions.includes(stored as GroupByDimension)) {
		return stored as GroupByDimension;
	}

	return "none";
}

/**
 * Set the Group By dimension for a specific view
 */
export function setGroupByConfig(
	viewId: string,
	dimension: GroupByDimension
): void {
	const key = `${STORAGE_KEY_PREFIX}-${viewId}`;
	localStorage.setItem(key, dimension);
}

/**
 * Clear the Group By configuration for a specific view
 */
export function clearGroupByConfig(viewId: string): void {
	const key = `${STORAGE_KEY_PREFIX}-${viewId}`;
	localStorage.removeItem(key);
}

/**
 * Get all stored Group By configurations
 */
export function getAllGroupByConfigs(): Record<string, GroupByDimension> {
	const configs: Record<string, GroupByDimension> = {};

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
			const viewId = key.substring(STORAGE_KEY_PREFIX.length + 1);
			const dimension = getGroupByConfig(viewId);
			configs[viewId] = dimension;
		}
	}

	return configs;
}

/**
 * Get the expanded state for a specific group
 * @param viewId - View identifier
 * @param groupKey - Unique key for the group
 * @returns true if expanded, false if collapsed (default: false)
 */
export function getGroupExpandedState(
	viewId: string,
	groupKey: string
): boolean {
	const key = `${STORAGE_KEY_EXPANDED_PREFIX}-${viewId}-${groupKey}`;
	const stored = localStorage.getItem(key);

	if (stored === null) {
		return false; // Default: collapsed
	}

	return stored === "true";
}

/**
 * Set the expanded state for a specific group
 * @param viewId - View identifier
 * @param groupKey - Unique key for the group
 * @param isExpanded - Whether the group is expanded
 */
export function setGroupExpandedState(
	viewId: string,
	groupKey: string,
	isExpanded: boolean
): void {
	const key = `${STORAGE_KEY_EXPANDED_PREFIX}-${viewId}-${groupKey}`;
	localStorage.setItem(key, isExpanded ? "true" : "false");
}

/**
 * Clear all expanded states for a specific view
 * Useful when resetting view state or changing group dimensions
 * @param viewId - View identifier
 */
export function clearGroupExpandedStates(viewId: string): void {
	const prefix = `${STORAGE_KEY_EXPANDED_PREFIX}-${viewId}-`;
	const keysToRemove: string[] = [];

	// Find all keys for this view
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key && key.startsWith(prefix)) {
			keysToRemove.push(key);
		}
	}

	// Remove them
	keysToRemove.forEach((key) => localStorage.removeItem(key));
}
