import { Task } from "@/types/task";

/**
 * Table column definition
 */
export interface TableColumn {
	id: string;
	title: string;
	width: number;
	sortable: boolean;
	resizable: boolean;
	type: "text" | "number" | "date" | "status" | "priority" | "tags";
	visible: boolean;
	align?: "left" | "center" | "right";
}

/**
 * Table cell data
 */
export interface TableCell {
	columnId: string;
	value: any;
	displayValue: string;
	editable: boolean;
	className?: string;
}

/**
 * Table row data
 */
export interface TableRow {
	id: string;
	task: Task;
	level: number; // For tree view hierarchy
	expanded: boolean; // For tree view expansion state
	hasChildren: boolean; // Whether this row has child rows
	cells: TableCell[];
	className?: string;
}

/**
 * Sort configuration
 */
export interface SortConfig {
	field: string;
	order: "asc" | "desc";
}

/**
 * Column resize event data
 */
export interface ColumnResizeEvent {
	columnId: string;
	newWidth: number;
	oldWidth: number;
}

/**
 * Cell edit event data
 */
export interface CellEditEvent {
	rowId: string;
	columnId: string;
	oldValue: any;
	newValue: any;
}

/**
 * Row selection event data
 */
export interface RowSelectionEvent {
	selectedRowIds: string[];
	selectedTasks: Task[];
}

/**
 * Tree node for hierarchical display
 */
export interface TreeNode {
	task: Task;
	children: TreeNode[];
	parent?: TreeNode;
	level: number;
	expanded: boolean;
}

/**
 * Virtual scroll viewport data
 */
export interface ViewportData {
	startIndex: number;
	endIndex: number;
	visibleRows: TableRow[];
	totalHeight: number;
	scrollTop: number;
}

/**
 * Table configuration options
 */
export interface TableConfig {
	enableTreeView: boolean;
	enableLazyLoading: boolean;
	pageSize: number;
	enableInlineEditing: boolean;
	enableRowSelection: boolean;
	enableMultiSelect: boolean;
	showRowNumbers: boolean;
	sortableColumns: boolean;
	resizableColumns: boolean;
	defaultSortField: string;
	defaultSortOrder: "asc" | "desc";
	visibleColumns: string[];
	columnWidths: Record<string, number>;
}

/**
 * Editor callbacks
 */
export interface EditorCallbacks {
	onCellEdit: (rowId: string, columnId: string, newValue: any) => void;
	onEditComplete: () => void;
	onEditCancel: () => void;
}

/**
 * Virtual scroll callbacks
 */
export interface VirtualScrollCallbacks {
	onLoadMore: () => void;
	onScroll: (scrollTop: number) => void;
}
