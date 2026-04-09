import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import { marked } from 'marked';
import type { Flashcard } from '../state';

marked.setOptions({
	gfm: true,
	breaks: false
});

const renderer = new marked.Renderer();

renderer.code = ({ text, lang }) => {
	const language = lang?.trim().toLowerCase();

	if (language && hljs.getLanguage(language)) {
		try {
			const highlighted = hljs.highlight(text, { language, ignoreIllegals: true }).value;
			return `<pre><code class="hljs language-${escapeHtml(language)}">${highlighted}</code></pre>`;
		} catch {
			// Fall through to plain code rendering when highlighting fails.
		}
	}

	return `<pre><code>${escapeHtml(text)}</code></pre>`;
};

marked.use({ renderer });

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

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
