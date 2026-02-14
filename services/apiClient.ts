import { v4 as uuidv4 } from 'uuid';
import * as db from '../server/db';
export const loginUser = async (email: string) => db.loginUser(email);
export const createCompany = async (token: string, name: string, website: string) => db.createCompany(token, name, website);
export const enrichFromWebsite = async (token: string, website: string, language: string) => ({ name: website, status: 'completed' });
// ... API Source ...