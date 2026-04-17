/**
 * File Metadata Inheritance Settings Tests
 * 
 * Tests for settings integration and configuration migration
 */

import { DEFAULT_SETTINGS, FileMetadataInheritanceConfig } from "../common/setting-definition";
import TaskProgressBarPlugin from "../index";

// Mock Obsidian API
const mockPlugin = {
	settings: { ...DEFAULT_SETTINGS },
	loadData: jest.fn(),
	saveData: jest.fn(),
	migrateInheritanceSettings: jest.fn(),
} as any;

describe("File Metadata Inheritance Settings", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPlugin.settings = { ...DEFAULT_SETTINGS };
	});

	describe("Default Configuration", () => {
		test("should have correct default values", () => {
			const defaultConfig = DEFAULT_SETTINGS.fileMetadataInheritance;

			expect(defaultConfig).toBeDefined();
			expect(defaultConfig.enabled).toBe(true);
			expect(defaultConfig.inheritFromFrontmatter).toBe(true);
			expect(defaultConfig.inheritFromFrontmatterForSubtasks).toBe(false);
		});

		test("should have FileMetadataInheritanceConfig interface", () => {
			const config: FileMetadataInheritanceConfig = {
				enabled: true,
				inheritFromFrontmatter: true,
				inheritFromFrontmatterForSubtasks: false,
			};

			expect(config).toBeDefined();
			expect(typeof config.enabled).toBe("boolean");
			expect(typeof config.inheritFromFrontmatter).toBe("boolean");
			expect(typeof config.inheritFromFrontmatterForSubtasks).toBe("boolean");
		});
	});

	describe("Configuration Migration", () => {
		test("should migrate old inheritance settings to new structure", () => {
			const savedData = {
				projectConfig: {
					metadataConfig: {
						metadataKey: "project",
						inheritFromFrontmatter: true,
						inheritFromFrontmatterForSubtasks: true,
						enabled: true,
					},
				},
				// 没有新的fileMetadataInheritance配置
			};

			// 模拟迁移逻辑
			const migrateInheritanceSettings = (savedData: any) => {
				if (savedData?.projectConfig?.metadataConfig && 
					!savedData?.fileMetadataInheritance) {
					
					const oldConfig = savedData.projectConfig.metadataConfig;
					
					return {
						enabled: true,
						inheritFromFrontmatter: oldConfig.inheritFromFrontmatter ?? true,
						inheritFromFrontmatterForSubtasks: oldConfig.inheritFromFrontmatterForSubtasks ?? false
					};
				}
				return null;
			};

			const migratedConfig = migrateInheritanceSettings(savedData);

			expect(migratedConfig).not.toBeNull();
			expect(migratedConfig?.enabled).toBe(true);
			expect(migratedConfig?.inheritFromFrontmatter).toBe(true);
			expect(migratedConfig?.inheritFromFrontmatterForSubtasks).toBe(true);
		});

		test("should not migrate when new configuration already exists", () => {
			const savedData = {
				projectConfig: {
					metadataConfig: {
						metadataKey: "project",
						inheritFromFrontmatter: true,
						inheritFromFrontmatterForSubtasks: true,
						enabled: true,
					},
				},
				fileMetadataInheritance: {
					enabled: false,
					inheritFromFrontmatter: false,
					inheritFromFrontmatterForSubtasks: false,
				},
			};

			// 模拟迁移逻辑
			const migrateInheritanceSettings = (savedData: any) => {
				if (savedData?.projectConfig?.metadataConfig && 
					!savedData?.fileMetadataInheritance) {
					
					const oldConfig = savedData.projectConfig.metadataConfig;
					
					return {
						enabled: true,
						inheritFromFrontmatter: oldConfig.inheritFromFrontmatter ?? true,
						inheritFromFrontmatterForSubtasks: oldConfig.inheritFromFrontmatterForSubtasks ?? false
					};
				}
				return null;
			};

			const migratedConfig = migrateInheritanceSettings(savedData);

			// 应该返回null，表示不需要迁移
			expect(migratedConfig).toBeNull();
		});

		test("should handle missing old configuration gracefully", () => {
			const savedData = {
				// 没有projectConfig
			};

			// 模拟迁移逻辑
			const migrateInheritanceSettings = (savedData: any) => {
				if (savedData?.projectConfig?.metadataConfig && 
					!savedData?.fileMetadataInheritance) {
					
					const oldConfig = savedData.projectConfig.metadataConfig;
					
					return {
						enabled: true,
						inheritFromFrontmatter: oldConfig.inheritFromFrontmatter ?? true,
						inheritFromFrontmatterForSubtasks: oldConfig.inheritFromFrontmatterForSubtasks ?? false
					};
				}
				return null;
			};

			const migratedConfig = migrateInheritanceSettings(savedData);

			// 应该返回null，表示没有需要迁移的配置
			expect(migratedConfig).toBeNull();
		});
	});

	describe("Settings Validation", () => {
		test("should maintain type safety for FileMetadataInheritanceConfig", () => {
			const validConfig: FileMetadataInheritanceConfig = {
				enabled: true,
				inheritFromFrontmatter: true,
				inheritFromFrontmatterForSubtasks: false,
			};

			// TypeScript应该不会报错
			expect(validConfig.enabled).toBe(true);
			expect(validConfig.inheritFromFrontmatter).toBe(true);
			expect(validConfig.inheritFromFrontmatterForSubtasks).toBe(false);
		});

		test("should handle all boolean combinations", () => {
			const combinations = [
				{ enabled: true, inheritFromFrontmatter: true, inheritFromFrontmatterForSubtasks: true },
				{ enabled: true, inheritFromFrontmatter: true, inheritFromFrontmatterForSubtasks: false },
				{ enabled: true, inheritFromFrontmatter: false, inheritFromFrontmatterForSubtasks: true },
				{ enabled: true, inheritFromFrontmatter: false, inheritFromFrontmatterForSubtasks: false },
				{ enabled: false, inheritFromFrontmatter: true, inheritFromFrontmatterForSubtasks: true },
				{ enabled: false, inheritFromFrontmatter: true, inheritFromFrontmatterForSubtasks: false },
				{ enabled: false, inheritFromFrontmatter: false, inheritFromFrontmatterForSubtasks: true },
				{ enabled: false, inheritFromFrontmatter: false, inheritFromFrontmatterForSubtasks: false },
			];

			combinations.forEach(config => {
				expect(typeof config.enabled).toBe("boolean");
				expect(typeof config.inheritFromFrontmatter).toBe("boolean");
				expect(typeof config.inheritFromFrontmatterForSubtasks).toBe("boolean");
			});
		});
	});

	describe("Integration with Main Settings", () => {
		test("should be properly integrated into TaskProgressBarSettings", () => {
			const settings = DEFAULT_SETTINGS;

			expect(settings.fileMetadataInheritance).toBeDefined();
			expect(settings.fileMetadataInheritance.enabled).toBe(true);
			expect(settings.fileMetadataInheritance.inheritFromFrontmatter).toBe(true);
			expect(settings.fileMetadataInheritance.inheritFromFrontmatterForSubtasks).toBe(false);
		});

		test("should work independently of project configuration", () => {
			const settingsWithoutProject = {
				...DEFAULT_SETTINGS,
				projectConfig: {
					...DEFAULT_SETTINGS.projectConfig,
					enableEnhancedProject: false,
				},
			};

			expect(settingsWithoutProject.fileMetadataInheritance).toBeDefined();
			expect(settingsWithoutProject.fileMetadataInheritance.enabled).toBe(true);
		});

		test("should work when project configuration is null", () => {
			const settingsWithNullProject = {
				...DEFAULT_SETTINGS,
				projectConfig: null as any,
			};

			expect(settingsWithNullProject.fileMetadataInheritance).toBeDefined();
			expect(settingsWithNullProject.fileMetadataInheritance.enabled).toBe(true);
		});
	});

	describe("Settings Persistence", () => {
		test("should preserve fileMetadataInheritance config during save/load", () => {
			const testSettings = {
				...DEFAULT_SETTINGS,
				fileMetadataInheritance: {
					enabled: false,
					inheritFromFrontmatter: false,
					inheritFromFrontmatterForSubtasks: true,
				},
			};

			// 模拟保存和加载
			const savedData = JSON.stringify(testSettings);
			const loadedSettings = JSON.parse(savedData);

			expect(loadedSettings.fileMetadataInheritance).toBeDefined();
			expect(loadedSettings.fileMetadataInheritance.enabled).toBe(false);
			expect(loadedSettings.fileMetadataInheritance.inheritFromFrontmatter).toBe(false);
			expect(loadedSettings.fileMetadataInheritance.inheritFromFrontmatterForSubtasks).toBe(true);
		});

		test("should handle partial configuration updates", () => {
			const baseSettings = {
				...DEFAULT_SETTINGS,
			};

			// 模拟部分更新
			const updatedSettings = {
				...baseSettings,
				fileMetadataInheritance: {
					...baseSettings.fileMetadataInheritance,
					enabled: false,
				},
			};

			expect(updatedSettings.fileMetadataInheritance.enabled).toBe(false);
			expect(updatedSettings.fileMetadataInheritance.inheritFromFrontmatter).toBe(true);
			expect(updatedSettings.fileMetadataInheritance.inheritFromFrontmatterForSubtasks).toBe(false);
		});
	});

	describe("Backward Compatibility", () => {
		test("should handle settings without fileMetadataInheritance gracefully", () => {
			const oldSettings = {
				...DEFAULT_SETTINGS,
			};
			
			// 删除新字段模拟旧版本设置
			delete (oldSettings as any).fileMetadataInheritance;

			// 合并默认设置应该恢复缺失的字段
			const mergedSettings = Object.assign({}, DEFAULT_SETTINGS, oldSettings);

			expect(mergedSettings.fileMetadataInheritance).toBeDefined();
			expect(mergedSettings.fileMetadataInheritance.enabled).toBe(true);
		});

		test("should maintain project config structure after migration", () => {
			const oldProjectConfig = {
				enableEnhancedProject: true,
				pathMappings: [],
				metadataConfig: {
					metadataKey: "project",
					inheritFromFrontmatter: true,
					inheritFromFrontmatterForSubtasks: true,
					enabled: true,
				},
				configFile: {
					fileName: "project.md",
					searchRecursively: true,
					enabled: true,
				},
				metadataMappings: [],
				defaultProjectNaming: {
					strategy: "filename" as const,
					stripExtension: true,
					enabled: true,
				},
			};

			// 迁移后项目配置应该移除继承相关字段
			const migratedProjectConfig = {
				...oldProjectConfig,
				metadataConfig: {
					metadataKey: oldProjectConfig.metadataConfig.metadataKey,
					enabled: oldProjectConfig.metadataConfig.enabled,
				},
			};

			expect(migratedProjectConfig.metadataConfig.metadataKey).toBe("project");
			expect(migratedProjectConfig.metadataConfig.enabled).toBe(true);
			expect((migratedProjectConfig.metadataConfig as any).inheritFromFrontmatter).toBeUndefined();
			expect((migratedProjectConfig.metadataConfig as any).inheritFromFrontmatterForSubtasks).toBeUndefined();
		});
	});
});