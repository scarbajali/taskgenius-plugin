// 基础习惯类型（不含completions字段，用于存储基础配置）
export interface BaseHabitProps {
	id: string;
	name: string;
	description?: string;
	icon: string; // Lucide icon id
}

// BaseDailyHabitData
export interface BaseDailyHabitData extends BaseHabitProps {
	type: "daily";
	completionText?: string; // Custom text that represents completion (default is any non-empty value)
	property: string;
}

// BaseCountHabitData
export interface BaseCountHabitData extends BaseHabitProps {
	type: "count";
	min?: number; // Minimum completion value
	max?: number; // Maximum completion value
	notice?: string; // Trigger notice when completion value is reached
	countUnit?: string; // Optional unit for the count (e.g., "cups", "times")
	property: string;
}

// BaseScheduledHabitData
export interface ScheduledEvent {
	name: string;
	details: string;
}

export interface BaseScheduledHabitData extends BaseHabitProps {
	type: "scheduled";
	events: ScheduledEvent[];
	propertiesMap: Record<string, string>;
}

export interface BaseMappingHabitData extends BaseHabitProps {
	type: "mapping";
	mapping: Record<number, string>;
	property: string;
}

// BaseHabitData
export type BaseHabitData =
	| BaseDailyHabitData
	| BaseCountHabitData
	| BaseScheduledHabitData
	| BaseMappingHabitData;

// DailyHabitProps
export interface DailyHabitProps extends BaseDailyHabitData {
	completions: Record<string, boolean | string | number | null>; // Date -> boolean (for simple check), number (for completionText), null (for unchecked)
}

// CountHabitProps
export interface CountHabitProps extends BaseCountHabitData {
	completions: Record<string, number>; // String is date, number is completion value
}

export interface ScheduledHabitProps extends BaseScheduledHabitData {
	completions: Record<string, Record<string, string>>; // String is date, Record<string, string> is event name and completion value
}

export interface MappingHabitProps extends BaseMappingHabitData {
	completions: Record<string, number>; // String is date, number is completion value
}

// HabitProps
export type HabitProps =
	| DailyHabitProps
	| CountHabitProps
	| ScheduledHabitProps
	| MappingHabitProps;

// HabitCardProps
export interface HabitCardProps {
	habit: HabitProps;
	toggleCompletion: (habitId: string, ...args: any[]) => void;
	triggerConfetti?: (pos: {
		x: number;
		y: number;
		width?: number;
		height?: number;
	}) => void;
}

// MappingHabitCardProps
interface MappingHabitCardProps extends HabitCardProps {
	toggleCompletion: (habitId: string, value: number) => void;
}

interface ScheduledHabitCardProps extends HabitCardProps {
	toggleCompletion: (
		habitId: string,
		{
			id,
			details,
		}: {
			id: string;
			details: string;
		}
	) => void;
}
