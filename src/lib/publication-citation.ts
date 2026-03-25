import type { Publication } from './site-data';

export interface PublicationCitationDisplay {
	japaneseStyle: boolean;
	authorsText: string;
	titleText: string;
	venueName: string;
	venueDetails: string;
	eventDateText: string;
	locationText: string;
	doiText: string;
	languageNote: string;
	isProceedings: boolean;
	year: string;
}

export const formatPublicationAuthors = (
	authors: string[],
	japaneseStyle: boolean,
) => {
	if (authors.length === 0) return '';
    const formattedAuthors = authors.map(author => {
        if (author.includes("鈴木 颯") || author.includes("Shun Suzuki")) {
            return `<u>${author}</u>`;
        }
        return author;
    });

	if (authors.length === 1 || japaneseStyle) return formattedAuthors.join(', ');
	return `${formattedAuthors.slice(0, -1).join(', ')} and ${formattedAuthors.at(-1)}`;
};

export const getPublicationCitationDisplay = (
	publication: Publication,
	locale: 'ja' | 'en',
): PublicationCitationDisplay => {
	const japaneseStyle = publication.lang === 'ja';
	const venueDetails = [
		publication.volume ? `vol. ${publication.volume}` : '',
		publication.number ? `no. ${publication.number}` : '',
		publication.pages ? `pp. ${publication.pages}` : '',
	]
		.filter(Boolean)
		.join(', ');

	return {
		japaneseStyle,
		authorsText: (() => {
			const authors = formatPublicationAuthors(
				publication.authors,
				japaneseStyle,
			);
			if (!authors) return '';
			return japaneseStyle ? `${authors}.` : `${authors},`;
		})(),
		titleText: japaneseStyle
			? `${publication.title}.`
			: `"${publication.title},"`,
		venueName: publication.journal || publication.booktitle || '',
		venueDetails,
		eventDateText: publication.eventDate || '',
		locationText: publication.location || '',
		doiText: publication.doi ? `doi: ${publication.doi}` : '',
		languageNote:
			locale === 'en' && publication.lang === 'ja' ? '(in Japanese)' : '',
		isProceedings: publication.type == "inproceedings",
		year: `${publication.year}`
	};
};
