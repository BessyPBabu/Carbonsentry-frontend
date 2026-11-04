export const text = (value, fallback = '—') => {
    if (value === null || value === undefined) return fallback;
    const s = String(value).trim();
    return s === '' ? fallback : s;
};

export const num = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' && value.trim() === '') return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

export const fmtNum = (value, fallback = '—') => {
    const n = num(value, null);
    return n === null ? fallback : n.toLocaleString('en-US');
};

export const scoreLabel = (score) => {
    const n = num(score, null);
    return n === null ? 'N/A' : `${n.toFixed(1)} / 100`;
};

export const pctLabel = (value) => {
    const n = num(value, null);
    return n === null ? '—' : `${n}%`;
};

export const list = (value) => (Array.isArray(value) ? value : []);

export const resolveRecommendations = (data) => {
    if (!data || typeof data !== 'object') return [];
    const isText = (s) => typeof s === 'string' && s.trim() !== '';

    const recs = list(data.recommendations).filter(isText);
    if (recs.length > 0) return recs;

    return list(data.action_checklist)
        .filter((a) => a && typeof a === 'object' && isText(a.action))
        .map((a) => a.action);
};
