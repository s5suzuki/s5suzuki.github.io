import fs from 'node:fs';
import path from 'node:fs';
import yaml from 'js-yaml';

export interface Publication {
	year: number;
	type: 'article' | 'inproceedings' | 'demos' | 'domestic' | 'Others';
	title: string;
	refId?: string;
	authors: string[];
	lang?: 'ja' | 'en';
	journal?: string;
	booktitle?: string;
	volume?: string;
	number?: string;
	pages?: string;
	eventDate?: string;
	location?: string;
	doi?: string;
	note?: string;
	href?: string;
}

export interface Award {
	year: number;
	month?: number;
	day?: number;
	award: string;
	org?: string;
	title?: string;
	recipients: string[];
	external?: boolean;
}

const publicationsDir = 'data/hapislab.org/src/data/publications';
const publicationTypes = ['article', 'inproceedings', 'demos', 'domestic'] as const;
const awardsPath = 'data/hapislab.org/src/data/awards.yml';

const isTargetAuthor = (author: string) => {
	return author.includes('鈴木 颯') || author.includes('Shun Suzuki');
};

const rawPublications = publicationTypes.flatMap((type) =>
	((yaml.load(fs.readFileSync(`${publicationsDir}/${type}.yml`, 'utf-8')) as any[]) || []).map((row) => ({ ...row, type })),
);
export const publications: Publication[] = rawPublications
	.map((row) => ({
		year: typeof row.year === 'number' ? row.year : Number.parseInt(row.year as any, 10) || 0,
		type: row.type,
		title: row.title?.trim() || '',
		refId: row.refId?.trim(),
		authors: Array.isArray(row.authors) ? row.authors : [],
		lang:
			row.type === 'domestic'
				? 'ja'
				: row.lang === 'ja' || row.lang === 'en'
					? row.lang
					: undefined,
		journal: row.journal?.trim(),
		booktitle: row.booktitle?.trim(),
		volume: row.volume?.toString(),
		number: row.number?.toString(),
		pages: row.pages?.toString().replaceAll('--', '–'),
		eventDate: row.eventDate?.trim(),
		location: row.location?.trim(),
		doi: row.doi?.trim(),
		note: row.note?.toString(),
		href: row.href?.trim() || (row.doi ? `https://doi.org/${row.doi.trim()}` : ''),
	}))
	.filter(pub => pub.authors.some(isTargetAuthor))
	.sort((left, right) => right.year - left.year);

const rawAwards = yaml.load(fs.readFileSync(awardsPath, 'utf-8')) as any[] || [];
export const awards: Award[] = rawAwards
	.map(row => ({
		year: typeof row.year === 'number' ? row.year : Number.parseInt(row.year, 10),
		month: row.month,
		day: row.day,
		award: row.award?.trim() || '',
		org: row.org?.trim(),
		title: row.title?.trim(),
		recipients: Array.isArray(row.recipients) ? row.recipients : [],
		external: row.external
	}))
	.filter(award => award.recipients.some(isTargetAuthor))
	.sort((a, b) => {
		if (a.year !== b.year) return b.year - a.year;
		if (a.month !== b.month) return (b.month || 0) - (a.month || 0);
		return (b.day || 0) - (a.day || 0);
	});
