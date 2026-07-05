const STORAGE_KEY = 'viora.session';

function hasStorage() {
    return typeof localStorage !== 'undefined';
}

function normalizeSession(auth) {
    if (!auth?.token || auth.id == null) return null;

    return {
        token: auth.token,
        userId: Number(auth.id),
        email: auth.email ?? '',
        fullName: auth.fullName ?? '',
        role: auth.role ?? 'ROLE_GROWER',
    };
}

function readLegacySession() {
    if (!hasStorage()) return null;

    const token = localStorage.getItem('token');
    const userId = Number(localStorage.getItem('userId'));
    if (!token || !userId) return null;

    return {
        token,
        userId,
        email: localStorage.getItem('email') ?? '',
        fullName: localStorage.getItem('fullName') ?? '',
        role: localStorage.getItem('role') ?? 'ROLE_GROWER',
    };
}

export function readActiveSession() {
    if (!hasStorage()) return null;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return readLegacySession();

        const session = JSON.parse(raw);
        if (!session?.token || !session.userId) return readLegacySession();

        return {
            token: session.token,
            userId: Number(session.userId),
            email: session.email ?? '',
            fullName: session.fullName ?? '',
            role: session.role ?? 'ROLE_GROWER',
        };
    } catch {
        return readLegacySession();
    }
}

export function startActiveSession(auth) {
    const session = normalizeSession(auth);
    if (!session || !hasStorage()) return session;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem('token', session.token);
    localStorage.setItem('email', session.email);
    localStorage.setItem('fullName', session.fullName);
    localStorage.setItem('userId', String(session.userId));
    localStorage.setItem('role', session.role);

    return session;
}

export function clearActiveSession() {
    if (!hasStorage()) return;

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('fullName');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
}

export function getActiveToken() {
    return readActiveSession()?.token ?? null;
}

export function getActiveUserId() {
    return readActiveSession()?.userId ?? null;
}

export function requireActiveUserId() {
    const userId = getActiveUserId();
    if (!userId) throw new Error("No active user session.");
    return userId;
}

export function getSessionHomeRoute(session = readActiveSession()) {
    return session?.role === 'ROLE_SPECIALIST' ? '/specialist' : '/dashboard';
}
