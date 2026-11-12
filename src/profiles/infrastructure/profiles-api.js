import {CollectionApi} from '../../shared/infrastructure/collection-api.js';

/** HTTP operations used by profile and preferences views. */
export class ProfilesApi {
    #api = new CollectionApi();

    async getProfileByUserId(userId) {
        const profiles = await this.#api.list('userProfiles', {userId});

        return profiles.find(
            profile => String(profile.userId) === String(userId),
        ) ?? null;
    }

    async createProfile(resource) {
        return this.#api.create('userProfiles', resource);
    }

    async updateProfile(profileId, resource) {
        return this.#api.patch('userProfiles', profileId, resource);
    }

    async getTwoFactorEnabled(userId) {
        const users = await this.#api.list('users', {id: userId});
        const user = users.find(
            item => String(item.id) === String(userId),
        );

        return Boolean(user?.twoFactorEnabled);
    }

    async updateTwoFactorEnabled(userId, enabled) {
        await this.#api.patch('users', userId, {
            twoFactorEnabled: Boolean(enabled),
        });
    }
}