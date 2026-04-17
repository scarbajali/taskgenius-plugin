#!/usr/bin/env node

import conventionalChangelogCore from 'conventional-changelog-core';
import conventionalCommitsParser from 'conventional-commits-parser';
import { execSync } from 'child_process';
import { Transform } from 'stream';
import semver from 'semver';

/**
 * 自定义 changelog 转换器，用于合并 beta 版本的更改
 * 将从上一个正式版到当前版本的所有提交按类别分组，而不是按版本号分组
 */
export function createMergedChangelogTransformer(targetVersion) {
	// 获取上一个正式版本标签
	function getLastStableTag() {
		try {
			const allTags = execSync('git tag -l', { encoding: 'utf8' })
				.trim()
				.split('\n')
				.filter(Boolean);
			
			const stableTags = [];
			for (const tag of allTags) {
				try {
					execSync(`git merge-base --is-ancestor ${tag} HEAD`, { encoding: 'utf8' });
					const versionString = tag.replace(/^v/, '');
					const version = semver.valid(versionString);
					if (version && !semver.prerelease(version)) {
						stableTags.push({ tag, version });
					}
				} catch (e) {
					// 标签不在当前分支历史中，跳过
				}
			}
			
			if (stableTags.length === 0) {
				return null;
			}
			
			// 按照 semver 排序，从高到低
			const sortedTags = stableTags.sort((a, b) => {
				return semver.rcompare(a.version, b.version);
			});
			
			return sortedTags[0].tag;
		} catch (error) {
			console.warn('Warning: Could not determine last stable tag', error.message);
			return null;
		}
	}

	const lastStableTag = getLastStableTag();
	const compareUrl = `https://github.com/Quorafind/Obsidian-Task-Genius/compare/${lastStableTag || 'HEAD~30'}...${targetVersion}`;
	
	return new Transform({
		objectMode: true,
		transform(chunk, encoding, callback) {
			// 如果是版本信息块，修改比较链接
			if (chunk.version === targetVersion) {
				chunk.compareUrl = compareUrl;
				chunk.previousTag = lastStableTag;
			}
			
			// 保持原有的提交分组逻辑
			this.push(chunk);
			callback();
		}
	});
}

/**
 * 生成合并的 changelog 内容
 * 将所有中间 beta 版本的更改合并到一个版本条目下
 */
export async function generateMergedChangelog(options = {}) {
	const { 
		targetVersion, 
		fromTag,
		preset = {
			name: "conventionalcommits",
			types: [
				{type: "feat", section: "Features"},
				{type: "fix", section: "Bug Fixes"},
				{type: "perf", section: "Performance"},
				{type: "refactor", section: "Refactors"},
				{type: "chore", section: "Chores"},
				{type: "docs", section: "Documentation"},
				{type: "style", section: "Styles"},
				{type: "test", section: "Tests"},
				{type: "revert", section: "Reverts"}
			]
		}
	} = options;
	
	return new Promise((resolve, reject) => {
		let changelogContent = '';
		
		const stream = conventionalChangelogCore({
			preset,
			releaseCount: 1,
			pkg: {
				transform: (pkg) => {
					pkg.version = targetVersion;
					return pkg;
				}
			},
			gitRawCommitsOpts: {
				from: fromTag || getLastStableTag() || 'HEAD~30'
			}
		});
		
		stream.on('data', (chunk) => {
			changelogContent += chunk.toString();
		});
		
		stream.on('end', () => {
			resolve(changelogContent);
		});
		
		stream.on('error', reject);
	});
}

/**
 * 配置选项，用于 release-it 集成
 */
export const mergedChangelogConfig = {
	writerOpts: {
		// 自定义写入选项
		transform: (commit, context) => {
			const types = {
				feat: 'Features',
				fix: 'Bug Fixes',
				perf: 'Performance',
				refactor: 'Refactors',
				docs: 'Documentation',
				style: 'Styles',
				test: 'Tests',
				chore: 'Chores',
				revert: 'Reverts'
			};
			
			// 过滤掉 beta 版本的 release commits
			if (commit.type === 'chore' && commit.subject && commit.subject.includes('beta')) {
				return null;
			}
			
			// 设置类型
			if (types[commit.type]) {
				commit.type = types[commit.type];
			}
			
			return commit;
		},
		// 按类别分组，而不是按版本
		groupBy: 'type',
		commitGroupsSort: 'title',
		commitsSort: ['scope', 'subject']
	},
	parserOpts: {
		headerPattern: /^(\w*)(?:\((.*)\))?: (.*)$/,
		headerCorrespondence: ['type', 'scope', 'subject']
	}
};