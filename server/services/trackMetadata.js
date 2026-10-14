/**
 * Utility for resolving high-resolution track artwork, preview audio, and metadata
 * with zero authentication overhead (iTunes Search API).
 */

function cleanTitleForSearch(str) {
    if (!str) return '';
    return str
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\(Official.*?\)/gi, '')
        .replace(/\[Official.*?\]/gi, '')
        .replace(/\(Lyric.*?\)/gi, '')
        .replace(/\[Lyric.*?\]/gi, '')
        .replace(/\(Audio.*?\)/gi, '')
        .replace(/\[Audio.*?\]/gi, '')
        .replace(/\(Video.*?\)/gi, '')
        .replace(/\[Video.*?\]/gi, '')
        .replace(/feat\..*$/gi, '')
        .replace(/ft\..*$/gi, '')
        .trim();
}

export async function fetchTrackMetadata(rawTitle, rawArtist) {
    const cleanTitle = cleanTitleForSearch(rawTitle);
    const cleanArtist = cleanTitleForSearch(rawArtist);

    const trySearch = async (term) => {
        try {
            const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=1`;
            const res = await fetch(url, {
                headers: { 'User-Agent': 'VibeMixer/2.0' }
            });
            if (!res.ok) return null;
            const data = await res.json();
            if (data.resultCount > 0) {
                const item = data.results[0];
                const coverImage = (item.artworkUrl100 || '').replace('100x100bb', '600x600bb');
                return {
                    coverImage: coverImage || null,
                    previewUrl: item.previewUrl || null,
                    durationMs: item.trackTimeMillis || 210000,
                    trackName: item.trackName || rawTitle,
                    artistName: item.artistName || rawArtist
                };
            }
        } catch (e) {
            // Silently handle network/proxy issues
        }
        return null;
    };

    let meta = await trySearch(`${cleanTitle} ${cleanArtist}`);
    if (!meta && cleanTitle.length > 2) {
        meta = await trySearch(cleanTitle);
    }
    return meta;
}
