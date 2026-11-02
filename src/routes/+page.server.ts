import { listEvents } from '#lib/server/repository.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { events: await listEvents() };
};
