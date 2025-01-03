import { BookData } from '@/types/BookData';
import { Client, Account, ID, Teams } from 'react-native-appwrite';
import { create } from 'react-test-renderer';

export const client = new Client()
    .setProject('6771c80a00023bf208f0')
    .setPlatform('com.boosterlong.bookclub');

export const teams = new Teams(client);

export const appWriteController = {
    async registerAnonymousUser(client: Client) {
        console.log('Registering anonymous user');
        const account = new Account(client);
        const result = await account.createAnonymousSession();
        return result;
    },

    async registerUser(client: Client, email: string, password: string) {
        console.log('Registering user');
        const account = new Account(client);
        const result = await account.create(ID.unique(), email, password, email);
        return result;
    },

    async login(client: Client, email: string, password: string) {
        console.log('Logging in');
        const account = new Account(client);
        const result = await account.createEmailPasswordSession(email, password);
        return result;
    },

    async logout(client: Client) {
        console.log('Logging out');
        const account = new Account(client);
        const result = await account.deleteSession('current');
        return result;
    },

    async checkSession(client: Client) {
        try {
            console.log('Checking session');
            const account = new Account(client);
            const result = await account.get();
            return result;
        } catch (error) {
            return false;
        }   
    },

    async getTeamId() {
      const result = await teams.list();
      console.log(result);

      if (result.teams.length === 0) {
         return 'No teams found';
      } else {
        return result.teams[0].$id;
      }
    },

    async getTeamMembers(teamId: string) {
        const result = await teams.listMemberships(teamId);
        return result;
    },

    async setTeamPreferences(teamId: string, book: BookData) {
        const result = await teams.updatePrefs(teamId,{currentBook: book});
        return result;
    },

    async getTeamPreferences(teamId: string) {
        const result = await teams.getPrefs(teamId);
        return result;
    },

    async createTeam(teamName: string) {

        const result = await teams.create(
            ID.unique(),
            teamName,
            ['owner','member']
        );

        console.log(result);
        return result;
    }
}