import { Request } from 'express';

export type GetRequest<Params> = Request<{}, {}, {}, Params>;
export type PostRequest<Params> = Request<{}, {}, Params>;
