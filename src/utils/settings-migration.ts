/**
 * Settings Migration Utilities
 *
 * Handles migration of legacy settings to new formats, particularly
 * for the multi-status-cycle feature.
 */

import type { TaskProgressBarSettings, StatusCycle } from "@/common/setting-definition";
import { t } from "@/translations/helper";

/**
 * Migrates legacy single-cycle configuration to multi-cycle format
 *
 * This function converts the old taskStatusCycle, taskStatusMarks, and excludeMarksFromCycle
 * settings into the new statusCycles array format.
 *
 * @param settings - The plugin settings object
 */
export function migrateToMultiCycle(settings: TaskProgressBarSettings): void {
	// If statusCycles already exists and has entries, skip migration
	if (settings.statusCycles && settings.statusCycles.length > 0) {
		return;
	}

	// Check if we have legacy configuration to migrate
	if (!settings.taskStatusCycle || settings.taskStatusCycle.length === 0) {
		// No legacy config, nothing to migrate
		return;
	}

	// Create a default cycle from legacy settings
	const legacyCycle: StatusCycle = {
		id: "legacy-default",
		name: t("Default Cycle"),
		description: t("Migrated from legacy settings"),
		priority: 0,
		cycle: [...settings.taskStatusCycle],
		marks: { ...settings.taskStatusMarks },
		enabled: true,
	};

	// Initialize statusCycles array with the migrated cycle
	settings.statusCycles = [legacyCycle];

	console.log("[Task Genius] Migrated legacy status cycle configuration to multi-cycle format");
}

/**
 * Main migration function that runs all necessary migrations
 *
 * @param settings - The plugin settings object
 */
export function migrateSettings(settings: TaskProgressBarSettings): void {
	// Run multi-cycle migration
	migrateToMultiCycle(settings);

	// Future migrations can be added here
	// e.g., migrateToNewFeature(settings);
}

/**
 * Validates a status cycle configuration
 *
 * @param cycle - The status cycle to validate
 * @returns true if valid, false otherwise
 */
export function validateStatusCycle(cycle: StatusCycle): boolean {
	// Check required fields
	if (!cycle.id || !cycle.name || cycle.priority === undefined) {
		return false;
	}

	// Check that cycle array exists and has at least one status
	if (!cycle.cycle || cycle.cycle.length === 0) {
		return false;
	}

	// Check that all statuses in the cycle have corresponding marks
	for (const status of cycle.cycle) {
		if (!(status in cycle.marks)) {
			return false;
		}
	}

	return true;
}

/**
 * Ensures status cycles are properly sorted by priority
 *
 * @param cycles - Array of status cycles
 * @returns Sorted array of status cycles
 */
export function sortCyclesByPriority(cycles: StatusCycle[]): StatusCycle[] {
	return [...cycles].sort((a, b) => a.priority - b.priority);
}

/**
 * Finds duplicate cycle IDs and returns them
 *
 * @param cycles - Array of status cycles
 * @returns Array of duplicate IDs
 */
export function findDuplicateCycleIds(cycles: StatusCycle[]): string[] {
	const idCounts = new Map<string, number>();
	const duplicates: string[] = [];

	for (const cycle of cycles) {
		const count = (idCounts.get(cycle.id) || 0) + 1;
		idCounts.set(cycle.id, count);

		if (count === 2) {
			duplicates.push(cycle.id);
		}
	}

	return duplicates;
}

/**
 * Repairs status cycles by fixing common issues
 *
 * @param cycles - Array of status cycles
 * @returns Repaired array of status cycles
 */
export function repairStatusCycles(cycles: StatusCycle[]): StatusCycle[] {
	if (!cycles || cycles.length === 0) {
		return cycles;
	}

	const repairedCycles: StatusCycle[] = [];
	const usedIds = new Set<string>();

	for (let i = 0; i < cycles.length; i++) {
		const cycle = { ...cycles[i] };

		// Fix duplicate IDs
		if (usedIds.has(cycle.id)) {
			cycle.id = `${cycle.id}-${Date.now()}-${i}`;
			console.warn(`[Task Genius] Fixed duplicate cycle ID: ${cycles[i].id} -> ${cycle.id}`);
		}
		usedIds.add(cycle.id);

		// Ensure priority is a number
		if (typeof cycle.priority !== "number") {
			cycle.priority = i;
		}

		// Ensure enabled is a boolean
		if (typeof cycle.enabled !== "boolean") {
			cycle.enabled = true;
		}

		// Only include valid cycles
		if (validateStatusCycle(cycle)) {
			repairedCycles.push(cycle);
		} else {
			console.warn(`[Task Genius] Removed invalid status cycle: ${cycle.name}`);
		}
	}

	return sortCyclesByPriority(repairedCycles);
}
