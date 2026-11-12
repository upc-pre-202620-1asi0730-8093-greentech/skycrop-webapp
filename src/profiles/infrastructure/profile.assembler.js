import {ProfileDetails} from '../domain/model/profile-details.js';

/** Maps API resources and validated profile details without making HTTP calls. */
export class ProfileAssembler {
    static toModelFromResource(resource) {
        if (resource === null) return null;

        const details = new ProfileDetails(resource);

        return Object.freeze({
            id: resource.id,
            userId: resource.userId,
            phone: details.phone,
            occupation: details.occupation,
            language: details.language,
            emailNotifications: details.emailNotifications,
        });
    }

    static toResourceFromDetails(userId, details) {
        return {
            userId,
            phone: details.phone,
            occupation: details.occupation,
            language: details.language,
            emailNotifications: details.emailNotifications,
        };
    }
}