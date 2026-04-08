import { transformUrl } from './urlTransform';

export async function fetchDeckMarkdown(sourceUrl: string): Promise<{
	sourceUrl: string;
	transformedUrl: string;
	markdown: string;
}> {
	const transformedUrl = await transformUrl(sourceUrl);
	const response = await fetch(transformedUrl);

	if (!response.ok) {
		throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
	}

	return {
		sourceUrl,
		transformedUrl,
		markdown: await response.text()
	};
}
