import { savedGameListSchema } from 'common/savedGames';
import { isGameCode } from 'common/gameCode';
import { getApiUrl } from './urls';
import { readResponse } from './request';

async function checked(response: Response, invalidMessage?: string): Promise<Response> {
    if (response.ok) return response;
    if (response.status === 409)
        throw new Error('A game with this code already exists. Your saved game has not been replaced.');
    if (response.status === 400) throw new Error(invalidMessage || 'This file is not a supported TIGHT game export.');
    if (response.status === 413) throw new Error('The game file is too large. Choose an export smaller than 1 MiB.');
    if (response.status === 404) throw new Error('This game is no longer on the host. Refresh the saved-game list.');
    if (response.status === 503)
        throw new Error('The host could not save the change. Check its storage and try again.');
    throw new Error('Could not reach the host. Check the connection and try again.');
}
async function request<Result>(url: string, options: RequestInit, read: (response: Response) => Promise<Result>, invalidMessage?: string): Promise<Result> {
    return readResponse(url, options, async response => read(await checked(response, invalidMessage))).catch(error => {
        if (options.signal?.aborted) throw error;
        if (error instanceof Error && !(error instanceof TypeError) && error.name !== 'AbortError') throw error;
        throw new Error('Could not confirm the result. Check the connection and refresh saved games before trying again.');
    });
}

function url(operation: string) {
    return getApiUrl(window.location.origin, `/game/${operation}`);
}

export async function fetchSavedGames(signal?: AbortSignal) {
    const data: unknown = await request(url('list'), { signal }, response => response.json());
    return savedGameListSchema.parse(data);
}
export async function importSavedGame(file: File) {
    if (file.size > 1024 * 1024) throw new Error('The game file is too large. Choose an export smaller than 1 MiB.');
    const id: unknown = await request(url('import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: await file.text(),
    }, response => response.json());
    if (!isGameCode(id))
        throw new Error('The host returned an invalid game code. Refresh the list before trying again.');
    return id;
}
export async function deleteSavedGame(id: string) {
    await request(url('delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
    }, response => response.json());
}
export async function exportSavedGame(id: string) {
    const blob = await request(`${url('export')}?gameId=${encodeURIComponent(id)}`, {}, response => response.blob());
    const download = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = download;
    anchor.download = `tight-${id}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(download), 1000);
}

export async function organizeSavedGame(id: string, change: { name: string | null } | { archived: boolean }) {
    const operation = 'name' in change ? 'rename' : 'archive';
    await request(url(operation), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: id, ...change }),
    }, response => response.json(), 'The name or archive setting is invalid. Refresh and try again.');
}
