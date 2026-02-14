import * as db from '../server/db';
export const loginUser = (email: string) => db.loginUser(email);
export const getCompaniesForUser = (token: string) => db.getCompaniesForUser(token);
export const getCompany = (token: string, id: string) => db.getCompany(id);
export const createCompany = (t: string, n: string, w: string) => db.createCompany(t, n, w);
export const updateCompanyDetails = (t: string, id: string, d: any) => db.updateCompany(id, d);
export const updateEvent = (t: string, cid: string, eid: string, u: any, pid: string) => db.updateEvent(t, cid, eid, u, pid);
export const enrichFromWebsite = async (t: string, w: string, l: string) => ({ name: w.split('.')[0], website: w, status: 'completed' as const });