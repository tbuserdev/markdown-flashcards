import DOMPurify from 'dompurify';
import { marked } from 'marked';
import type { Flashcard } from '../state';

marked.setOptions({
	gfm: true,
	breaks: false
});

export function parseQuestions(markdownContent: string): Flashcard[] {
	if (!markdownContent) return [];

	const entries = markdownContent.trim().split(/\n\s*\n\s*\n/);
	const questions: Flashcard[] = [];

	for (const entry of entries) {
		const parts = entry.trim().split('\n---\n');
		if (parts.length === 2) {
			questions.push({
				q: parts[0].trim(),
				a: parts[1].trim(),
				status: 'unseen'
			});
		}
	}

	return questions;
}

export function renderMarkdown(markdownContent: string): string {
	if (!markdownContent) return '';

	const rendered = marked.parse(markdownContent);
	return DOMPurify.sanitize(rendered, { USE_PROFILES: { html: true } });
}
