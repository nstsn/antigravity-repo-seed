export const generateDatePrefix = (date = new Date()): string => {
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${yy}${mm}${dd}_`;
};

export const normalizeTag = (tag: string): string => {
    return tag.trim().replace(/^#+/, '#'); // Ensure single # prefix if user types one, or we can enforce # later.
    // Actually PRD says "user chooses tags", we append " #tag". 
    // We'll standardise to "#Name".
};

export const formatTitle = (
    baseTitle: string,
    tags: string[],
    datePrefix: string = generateDatePrefix()
): string => {
    const cleanBase = baseTitle.trim().replace(/\s+/g, ' ');
    const tagString = tags.length > 0 ? ' ' + tags.join(' ') : '';

    // Logic to prevent double prefix if baseTitle already has it is handled by caller usually,
    // but we can ensure it here if we want. 
    // For MVP, we assume baseTitle is stripped of prefix if we are re-renaming.

    return `${datePrefix}${cleanBase}${tagString}`;
};

export const parseTitle = (title: string) => {
    // Regex for `YYMMDD_` at start
    const prefixMatch = title.match(/^(\d{6}_)/);
    const datePrefix = prefixMatch ? prefixMatch[1] : null;

    // Extract content
    let content = title;
    if (datePrefix) {
        content = content.substring(datePrefix.length);
    }

    // Extract tags at end (space + #tag...)
    // Simple regex: look for ( #.+)+$
    const tagsMatch = content.match(/(\s+#[^\s#]+)+$/);
    let tags: string[] = [];

    if (tagsMatch) {
        const fullTagPart = tagsMatch[0];
        tags = fullTagPart.trim().split(/\s+/);
        content = content.substring(0, content.length - fullTagPart.length);
    }

    return {
        datePrefix,
        titleBody: content.trim(),
        tags
    };
};
